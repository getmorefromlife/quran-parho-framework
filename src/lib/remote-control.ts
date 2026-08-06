import type { Realtime, RealtimeChannel, Rest, Channel } from "ably";
import type { TimerDurations } from "@/lib/timer-durations";

export type RemoteRole = "host" | "remote";

export type RemoteCommand =
  | { type: "cmd"; action: "toggleSession" }
  | { type: "cmd"; action: "resetSession" }
  | { type: "cmd"; action: "toggleQa" }
  | { type: "cmd"; action: "resetQa" }
  | { type: "cmd"; action: "toggleTurn" }
  | { type: "cmd"; action: "resetTurn" }
  | { type: "cmd"; action: "toggleSound" }
  | { type: "cmd"; action: "setDuration"; key: keyof TimerDurations; minutes: number }
  | { type: "cmd"; action: "requestState" };

export type TimerSlice = { secs: number; active: boolean; total: number };

export type RemoteState = {
  type: "state";
  session: TimerSlice;
  qa: TimerSlice;
  turn: TimerSlice;
  soundEnabled: boolean;
  supportsTurn?: boolean;
};

export type RemoteMessage = RemoteCommand | RemoteState;

export type RoomMember = { role: RemoteRole; clientId: string };

export type RemoteErrorKind = "auth" | "permission" | "presence" | "attach" | "network" | "unknown";

export type RemoteError = {
  kind: RemoteErrorKind;
  fatal: boolean;
  message: string;
};

export type RemoteRoomEvents = {
  onState?: (state: RemoteState) => void;
  onCommand?: (command: RemoteCommand) => void;
  onMembers?: (members: RoomMember[]) => void;
  onConnectionState?: (state: string) => void;
  onError?: (error: RemoteError | null) => void;
};

export type RemoteRoom = {
  room: string;
  publish: (msg: RemoteMessage) => void;
  /** Recover a dead link. Tears down and rebuilds the realtime socket for clean recovery. */
  reconnect: () => void;
  close: () => void;
};

const ROOM_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function isRemoteConfigured(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(getAblyKey());
}

function getAblyKey(): string | undefined {
  const key = import.meta.env.VITE_ABLY_KEY as string | undefined;
  return key?.trim() || undefined;
}

export function generateRoomCode(length = 6): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += ROOM_ALPHABET[bytes[i] % ROOM_ALPHABET.length];
  }
  return out;
}

export function normalizeRoom(code: string): string {
  return code
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 8);
}

function describeError(e: unknown): RemoteError {
  const err = e as { code?: number; statusCode?: number; message?: string } | undefined;
  const code = err?.code ?? 0;
  const status = err?.statusCode ?? 0;
  const message = err?.message ?? String(e ?? "unknown error");
  if ((status >= 401 && status < 403) || (code >= 40100 && code < 40300)) {
    return { kind: "auth", fatal: true, message };
  }
  if (status === 403 || (code >= 40300 && code < 40400)) {
    return { kind: "permission", fatal: true, message };
  }
  if (code === 40012) {
    return { kind: "presence", fatal: false, message };
  }
  if (code >= 80000 || status === 0) {
    return { kind: "network", fatal: false, message };
  }
  return { kind: "unknown", fatal: false, message };
}

export function remoteUrlForRoom(room: string): string {
  return `${window.location.origin}/remote?room=${encodeURIComponent(room)}`;
}

export async function openRemoteRoom(
  room: string,
  role: RemoteRole,
  events: RemoteRoomEvents = {},
): Promise<RemoteRoom | null> {
  if (typeof window === "undefined") return null;
  const key = getAblyKey();
  if (!key) return null;

  return role === "host"
    ? openHostRoom(room, key, role, events)
    : openRemoteRealtimeRoom(room, key, events);
}

const HOST_PING_MS = 5000;
const HOST_PING_FAILS = 2;

// ───────────────────────── Host: realtime socket ─────────────────────────

async function openHostRoom(
  room: string,
  key: string,
  role: RemoteRole,
  events: RemoteRoomEvents,
): Promise<RemoteRoom> {
  const { Realtime: AblyRealtime } = await import("ably");
  const makeClientId = () => `host-${crypto.randomUUID()}`;

  const onMsg = (msg: { data?: unknown }) => {
    const data = msg.data as RemoteMessage;
    if (data.type === "state") events.onState?.(data);
    else if (data.type === "cmd") events.onCommand?.(data);
  };

  let realtime: Realtime | null = null;
  let channel: RealtimeChannel | null = null;

  const refreshMembers = async () => {
    if (!channel) return;
    try {
      const present = await channel.presence.get({ waitForSync: true });
      const members: RoomMember[] = present
        .map((p) => ({
          role: ((p.data as { role?: RemoteRole } | undefined)?.role ?? "remote") as RemoteRole,
          clientId: p.clientId,
        }))
        .filter((m) => Boolean(m.clientId));
      events.onMembers?.(members);
    } catch {
      // presence unavailable — ignore
    }
  };

  const wireConnection = (client: Realtime) => {
    client.connection.on((change) => {
      events.onConnectionState?.(change.current);
      if (change.current === "connected") {
        events.onError?.(null);
      } else if (
        change.current === "failed" ||
        (change.current === "disconnected" && change.reason)
      ) {
        events.onError?.(describeError(change.reason));
      }
    });
  };

  const connect = () => {
    if (realtime) realtime.close();
    realtime = new AblyRealtime({
      key,
      clientId: makeClientId(),
      disconnectedRetryTimeout: 1500,
      suspendedRetryTimeout: 3000,
    });
    channel = realtime.channels.get(`qp:${room}`);
    channel.subscribe("msg", onMsg);
    channel.presence.subscribe(() => {
      void refreshMembers();
    });
    wireConnection(realtime);
    void channel.attach().catch((e) => events.onError?.(describeError(e)));
    void channel.presence.enter({ role }).catch((e) => events.onError?.(describeError(e)));
    void refreshMembers();
  };

  let heartbeat: number | null = null;
  let pingFails = 0;
  const startHeartbeat = () => {
    if (heartbeat !== null) window.clearInterval(heartbeat);
    heartbeat = window.setInterval(() => {
      const client = realtime;
      if (!client || client.connection.state !== "connected") {
        pingFails = 0;
        return;
      }
      void client.connection
        .ping()
        .then(() => {
          pingFails = 0;
        })
        .catch(() => {
          pingFails += 1;
          if (pingFails >= HOST_PING_FAILS) {
            pingFails = 0;
            connect();
          }
        });
    }, HOST_PING_MS);
  };

  connect();
  startHeartbeat();

  return {
    room,
    publish: (msg: RemoteMessage) => {
      if (channel)
        void channel.publish("msg", msg).catch((e) => events.onError?.(describeError(e)));
    },
    reconnect: () => {
      connect();
      startHeartbeat();
    },
    close: () => {
      if (heartbeat !== null) window.clearInterval(heartbeat);
      heartbeat = null;
      if (channel) void channel.presence.leave().catch(() => undefined);
      if (channel) channel.detach();
      if (realtime) realtime.close();
      channel = null;
      realtime = null;
    },
  };
}

// ──────────────────────── Phone: Realtime socket with immediate sync ───────────────────────

async function openRemoteRealtimeRoom(
  room: string,
  key: string,
  events: RemoteRoomEvents,
): Promise<RemoteRoom> {
  const { Realtime: AblyRealtime } = await import("ably");
  const makeClientId = () => `remote-${crypto.randomUUID()}`;

  let realtime: Realtime | null = null;
  let channel: RealtimeChannel | null = null;

  const onMsg = (msg: { data?: unknown }) => {
    const data = msg.data as RemoteMessage;
    if (data.type === "state") events.onState?.(data);
    else if (data.type === "cmd") events.onCommand?.(data);
  };

  const refreshMembers = async () => {
    if (!channel) return;
    try {
      const present = await channel.presence.get({ waitForSync: true });
      const members: RoomMember[] = present
        .map((p) => ({
          role: ((p.data as { role?: RemoteRole } | undefined)?.role ?? "remote") as RemoteRole,
          clientId: p.clientId,
        }))
        .filter((m) => Boolean(m.clientId));
      events.onMembers?.(members);
    } catch {
      // presence unavailable — ignore
    }
  };

  const wireConnection = (client: Realtime) => {
    client.connection.on((change) => {
      events.onConnectionState?.(change.current);
      if (change.current === "connected") {
        events.onError?.(null);
      } else if (
        change.current === "failed" ||
        (change.current === "disconnected" && change.reason)
      ) {
        events.onError?.(describeError(change.reason));
      }
    });
  };

  const connect = () => {
    if (realtime) realtime.close();
    realtime = new AblyRealtime({
      key,
      clientId: makeClientId(),
      disconnectedRetryTimeout: 1500,
      suspendedRetryTimeout: 3000,
    });
    channel = realtime.channels.get(`qp:${room}`);
    channel.subscribe("msg", onMsg);
    channel.presence.subscribe(() => {
      void refreshMembers();
    });
    wireConnection(realtime);

    void channel
      .attach()
      .then(() => {
        // Request state snapshot immediately on attach so host responds right away
        void channel?.publish("msg", { type: "cmd", action: "requestState" });
      })
      .catch((e) => events.onError?.(describeError(e)));

    void channel.presence
      .enter({ role: "remote" })
      .catch((e) => events.onError?.(describeError(e)));
    void refreshMembers();
  };

  connect();

  return {
    room,
    publish: (msg: RemoteMessage) => {
      if (channel)
        void channel.publish("msg", msg).catch((e) => events.onError?.(describeError(e)));
    },
    reconnect: () => {
      connect();
    },
    close: () => {
      if (channel) void channel.presence.leave().catch(() => undefined);
      if (channel) channel.detach();
      if (realtime) realtime.close();
      channel = null;
      realtime = null;
    },
  };
}
