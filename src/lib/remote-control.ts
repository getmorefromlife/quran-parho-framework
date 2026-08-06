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
  | { type: "cmd"; action: "setDuration"; key: keyof TimerDurations; minutes: number };

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
  onError?: (error: RemoteError) => void;
};

export type RemoteRoom = {
  room: string;
  publish: (msg: RemoteMessage) => void;
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

  const { Realtime } = await import("ably");
  const clientId = `${role === "host" ? "host" : "remote"}-${crypto.randomUUID()}`;
  const realtime = new Realtime({ key, clientId });
  const channel = realtime.channels.get(`qp:${room}`);

  channel.subscribe("msg", (msg) => {
    const data = msg.data as RemoteMessage;
    if (data.type === "state") events.onState?.(data);
    else if (data.type === "cmd") events.onCommand?.(data);
  });

  channel.presence.subscribe(() => {
    void refreshMembers();
  });

  const refreshMembers = async () => {
    try {
      const present = await channel.presence.get();
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

  realtime.connection.on((change) => {
    events.onConnectionState?.(change.current);
    if (change.current === "failed" || (change.current === "disconnected" && change.reason)) {
      events.onError?.(describeError(change.reason));
    }
  });

  await channel.attach().catch((e) => {
    events.onError?.(describeError(e));
  });
  await channel.presence.enter({ role }).catch((e) => {
    events.onError?.(describeError(e));
  });
  void refreshMembers();

  const publish = (msg: RemoteMessage) => {
    void channel.publish("msg", msg).catch(() => undefined);
  };

  return {
    room,
    publish,
    close: () => {
      void channel.presence.leave().catch(() => undefined);
      channel.detach();
      realtime.close();
    },
  };
}
