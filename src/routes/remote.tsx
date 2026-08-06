import { useCallback, useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowLeft,
  Check,
  Clock,
  Hourglass,
  Languages,
  MessageSquare,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  Smartphone,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  type LucideIcon,
} from "lucide-react";
import { LangProvider, useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  isRemoteConfigured,
  normalizeRoom,
  openRemoteRoom,
  type RemoteCommand,
  type RemoteError,
  type RemoteRoom,
  type RemoteState,
  type RoomMember,
} from "@/lib/remote-control";
import {
  SESSION_PRESETS,
  QA_PRESETS,
  TURN_PRESETS,
  toSeconds,
  type TimerDurations,
} from "@/lib/timer-durations";

export const Route = createFileRoute("/remote")({
  validateSearch: (search: Record<string, unknown>): { room?: string } => ({
    room: typeof search.room === "string" && search.room ? normalizeRoom(search.room) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Remote Timer Control · Qurʼān Parho" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0, viewport-fit=cover" },
      { name: "theme-color", content: "#09090b" },
    ],
  }),
  component: () => (
    <LangProvider>
      <RemotePage />
    </LangProvider>
  ),
});

const RECENT_KEY = "qp_remote_rooms";

function loadRecentRooms(): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
    if (Array.isArray(raw))
      return raw.filter((r): r is string => typeof r === "string").slice(0, 5);
  } catch {
    // ignore
  }
  return [];
}

function saveRecentRoom(room: string): void {
  try {
    const next = [room, ...loadRecentRooms().filter((r) => r !== room)].slice(0, 5);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

const fmt = (s: number) => {
  const m = Math.floor(s / 60);
  const x = s % 60;
  return `${m}:${x < 10 ? "0" : ""}${x}`;
};

type Accent = "amber" | "blue" | "emerald";

const ACCENTS: Record<Accent, { chip: string; fill: string; text: string; activeChip: string }> = {
  amber: {
    chip: "bg-amber-500/15 border-amber-500/40 text-amber-400",
    fill: "bg-amber-500",
    text: "text-amber-300",
    activeChip: "bg-amber-500 text-zinc-950 border-amber-400",
  },
  blue: {
    chip: "bg-blue-500/15 border-blue-500/40 text-blue-400",
    fill: "bg-blue-500",
    text: "text-blue-300",
    activeChip: "bg-blue-500 text-white border-blue-400",
  },
  emerald: {
    chip: "bg-emerald-500/15 border-emerald-500/40 text-emerald-400",
    fill: "bg-emerald-500",
    text: "text-emerald-300",
    activeChip: "bg-emerald-500 text-zinc-950 border-emerald-400",
  },
};

function TimerControl({
  label,
  icon: Icon,
  slice,
  presets,
  durationKey,
  accent,
  lang,
  disabled,
  onCommand,
}: {
  label: string;
  icon: LucideIcon;
  slice?: RemoteState["session"];
  presets: number[];
  durationKey: keyof TimerDurations;
  accent: Accent;
  lang: string;
  disabled?: boolean;
  onCommand: (cmd: RemoteCommand) => void;
}) {
  const a = ACCENTS[accent];
  const isEn = lang === "en";
  const secs = slice?.secs ?? 0;
  const active = slice?.active ?? false;
  const total = slice?.total ?? 0;
  const pct = total > 0 ? Math.max(0, Math.min(1, secs / total)) : 0;
  const expired = secs === 0 && Boolean(slice);
  const digits = expired
    ? "text-red-500"
    : active && secs > 0 && secs <= 60
      ? "text-red-400 animate-pulse"
      : a.text;

  const toggleAction =
    durationKey === "session" ? "toggleSession" : durationKey === "qa" ? "toggleQa" : "toggleTurn";
  const resetAction =
    durationKey === "session" ? "resetSession" : durationKey === "qa" ? "resetQa" : "resetTurn";

  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-5 shadow-2xl">
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider",
            a.chip,
          )}
        >
          <Icon className="h-3.5 w-3.5" />
          {label}
        </span>
        <span className="text-xs font-semibold text-zinc-500">
          {total > 0 ? `${Math.round(total / 60)} ${isEn ? "min" : "منٹ"}` : "—"}
        </span>
      </div>

      <div
        className={cn(
          "mt-5 text-center font-mono text-6xl font-bold tabular-nums tracking-tight",
          digits,
        )}
      >
        {slice ? fmt(secs) : "--:--"}
      </div>

      <div className="mt-5 h-2 w-full overflow-hidden rounded-full bg-zinc-800/70">
        <div
          className={cn("h-full rounded-full transition-all duration-1000", a.fill)}
          style={{ width: `${pct * 100}%` }}
        />
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3">
        <button
          onClick={() => onCommand({ type: "cmd", action: toggleAction })}
          disabled={disabled}
          className={cn(
            "col-span-2 inline-flex h-14 items-center justify-center gap-2 rounded-2xl text-sm font-bold transition-all cursor-pointer active:scale-95 disabled:cursor-not-allowed disabled:opacity-40",
            active ? "border border-zinc-700 bg-zinc-800 text-zinc-100" : cn("border-0", a.chip),
          )}
        >
          {active ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          {active ? (isEn ? "Pause" : "روکیں") : isEn ? "Start" : "شروع"}
        </button>
        <button
          onClick={() => onCommand({ type: "cmd", action: resetAction })}
          disabled={disabled}
          className="grid h-14 place-items-center rounded-2xl border border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          title={isEn ? "Reset Timer" : "ٹائمر دوبارہ ترتیب دیں"}
        >
          <RotateCcw className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {presets.map((m) => (
          <button
            key={m}
            onClick={() =>
              onCommand({ type: "cmd", action: "setDuration", key: durationKey, minutes: m })
            }
            disabled={disabled}
            className={cn(
              "rounded-full border px-3.5 py-2 text-xs font-bold transition-all cursor-pointer active:scale-95 disabled:cursor-not-allowed disabled:opacity-40",
              slice && total === toSeconds(m)
                ? cn("border-0", a.activeChip)
                : "border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500",
            )}
          >
            {m} {isEn ? "min" : "منٹ"}
          </button>
        ))}
      </div>
    </section>
  );
}

function RemotePage() {
  const { lang, setLang } = useLang();
  const { room } = Route.useSearch();
  const navigate = Route.useNavigate();
  const isEn = lang === "en";

  const [inputRoom, setInputRoom] = useState("");
  const [recentRooms, setRecentRooms] = useState<string[]>([]);
  const [configured, setConfigured] = useState(false);
  const [roomHandle, setRoomHandle] = useState<RemoteRoom | null>(null);
  const [state, setState] = useState<RemoteState | null>(null);
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [status, setStatus] = useState("connecting");
  const [error, setError] = useState<RemoteError | null>(null);
  const [stale, setStale] = useState(false);
  const [freshTick, setFreshTick] = useState(0);
  const [optimistic, setOptimistic] = useState<{
    session?: boolean;
    qa?: boolean;
    turn?: boolean;
  }>({});

  // Refs hold the latest values so timers/listeners never read a stale closure.
  const lastStateAt = useRef<number | null>(null);
  const roomHandleRef = useRef<RemoteRoom | null>(null);
  const statusRef = useRef("connecting");
  const staleRef = useRef(false);
  const lastReconnectAt = useRef(0);
  const lastToggleAt = useRef<Record<string, number>>({});
  const pendingRef = useRef<RemoteCommand[]>([]);

  // Compute client-only state after mount so SSR and client HTML match
  // (avoids React hydration errors that can break event wiring on some phones).
  useEffect(() => {
    setConfigured(isRemoteConfigured());
    setRecentRooms(loadRecentRooms());
  }, []);

  useEffect(() => {
    if (!room) return;
    let cancelled = false;
    let handle: RemoteRoom | null = null;
    setState(null);
    setStatus("connecting");
    setError(null);
    setStale(false);
    lastStateAt.current = null;
    openRemoteRoom(room, "remote", {
      onState: (s) => {
        if (cancelled) return;
        lastStateAt.current = Date.now();
        staleRef.current = false;
        setStale(false);
        setState(s);
        setOptimistic({});
        setFreshTick((n) => n + 1);
      },
      onMembers: (m) => {
        if (!cancelled) setMembers(m);
      },
      onConnectionState: (s) => {
        if (cancelled) return;
        statusRef.current = s;
        setStatus(s);
      },
      onError: (e) => {
        if (!cancelled) setError(e);
      },
    }).then((opened) => {
      if (cancelled) {
        opened?.close();
        return;
      }
      handle = opened;
      roomHandleRef.current = opened;
      setRoomHandle(opened);
      if (!opened) setStatus("not-configured");
      if (opened) saveRecentRoom(room);
    });
    return () => {
      cancelled = true;
      handle?.close();
      roomHandleRef.current = null;
      setRoomHandle(null);
      setMembers([]);
    };
  }, [room]);

  const hasHost = members.some((m) => m.role === "host");
  const connected = status === "connected";
  const failed = (error !== null && error.fatal) || status === "failed";
  const connecting = !connected && !failed;
  // A state message only ever comes from the host, so treat it as proof the
  // host is paired even if presence membership is momentarily stale. The
  // handle must also exist so queued commands have a real channel to send on.
  const hostOnline = connected && roomHandle !== null && (hasHost || state !== null);

  // Force a fresh Ably socket when the link has gone stale (e.g. the phone tab
  // was suspended). Throttled so a flapping connection can't thrash reconnect;
  // the manual "Reconnect now" button bypasses the throttle.
  const tryReconnect = useCallback((force = false) => {
    const now = Date.now();
    if (!force && now - lastReconnectAt.current < 8000) return;
    lastReconnectAt.current = now;
    if (force) {
      staleRef.current = false;
      setStale(false);
    }
    roomHandleRef.current?.reconnect();
  }, []);
  const tryReconnectRef = useRef(tryReconnect);
  tryReconnectRef.current = tryReconnect;

  // Stale-state watchdog: the host broadcasts every 2s, so silence for >6s
  // means the link is dead. Surface it and kick a reconnect.
  useEffect(() => {
    if (!room) return;
    const id = window.setInterval(() => {
      const last = lastStateAt.current;
      if (last === null || document.hidden) return;
      const isStale = Date.now() - last > 6000;
      staleRef.current = isStale;
      setStale(isStale);
      if (isStale && statusRef.current === "connected") tryReconnectRef.current();
    }, 2000);
    return () => window.clearInterval(id);
  }, [room]);

  // iOS/mobile browsers suspend suspended tabs' sockets; reconnect when the
  // user returns so the remote isn't left silently dead.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      const last = lastStateAt.current;
      if (last === null || Date.now() - last > 6000) tryReconnectRef.current();
    };
    const onFocus = () => {
      const last = lastStateAt.current;
      if (last !== null && Date.now() - last > 6000) tryReconnectRef.current();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onFocus);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  const TOGGLE_ACTIONS = new Set(["toggleSession", "toggleQa", "toggleTurn"]);
  const TOGGLE_KEY = { toggleSession: "session", toggleQa: "qa", toggleTurn: "turn" } as const;

  const effectiveActive = (key: "session" | "qa" | "turn"): boolean => {
    const o = optimistic[key];
    if (o !== undefined) return o;
    const s = state?.[key];
    return s ? s.active : false;
  };

  // Commands sent while the host is offline or the link is stale are buffered
  // and flushed once the link is healthy again. Toggles are idempotent, so a
  // duplicate pending toggle cancels the previous one (two toggles = no-op).
  const send = (cmd: RemoteCommand) => {
    if (cmd.type === "cmd") {
      const key = TOGGLE_KEY[cmd.action as keyof typeof TOGGLE_KEY];
      if (key) {
        // Optimistic feedback: flip the card immediately so the user doesn't
        // tap twice while the host's state echo is up to 2s away.
        setOptimistic((o) => ({ ...o, [key]: !effectiveActive(key) }));
        const now = Date.now();
        if (now - (lastToggleAt.current[cmd.action] ?? 0) < 800) return;
        lastToggleAt.current[cmd.action] = now;
      }
    }
    if (hostOnline && roomHandle && !staleRef.current) {
      roomHandle.publish(cmd);
    } else {
      const pending = pendingRef.current;
      if (cmd.type === "cmd" && TOGGLE_ACTIONS.has(cmd.action)) {
        const idx = pending.findIndex((c) => c.type === "cmd" && c.action === cmd.action);
        if (idx >= 0) pending.splice(idx, 1);
      }
      pending.push(cmd);
    }
  };

  useEffect(() => {
    if (!hostOnline || !roomHandle || pendingRef.current.length === 0) return;
    const pending = pendingRef.current;
    pendingRef.current = [];
    for (const cmd of pending) roomHandle.publish(cmd);
  }, [hostOnline, roomHandle, freshTick]);

  // Host state, with any optimistic toggle applied so the card flips instantly
  // instead of waiting up to 2s for the host's echo.
  const effSlice = (key: "session" | "qa" | "turn"): RemoteState["session"] | undefined => {
    const base = state?.[key];
    if (!base) return undefined;
    const o = optimistic[key];
    return o === undefined ? base : { ...base, active: o };
  };

  const connect = (code: string) => {
    const normalized = normalizeRoom(code);
    if (!normalized) return;
    navigate({ to: "/remote", search: { room: normalized } });
  };

  // ── Landing (no room yet) ──
  if (!room) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center px-6 py-10">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center space-y-3">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-400">
              <Smartphone className="h-8 w-8" />
            </span>
            <h1 className="text-2xl font-bold">{isEn ? "Circle Remote" : "سرکل ریموٹ"}</h1>
            <p className="text-sm text-zinc-400 leading-relaxed">
              {isEn
                ? "Enter the room code shown on the projector screen."
                : "اسکرین پر دکھایا گیا روم کوڈ درج کریں۔"}
            </p>
          </div>

          {!configured && (
            <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-center text-sm text-red-300">
              {isEn
                ? "Remote control is not configured on this site yet."
                : "اس سائٹ پر ریموٹ کنٹرول ابھی ترتیب نہیں دیا گیا۔"}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              connect(inputRoom);
            }}
            className="space-y-3"
          >
            <input
              value={inputRoom}
              onChange={(e) => setInputRoom(e.target.value.toUpperCase())}
              placeholder={isEn ? "ROOM CODE" : "روم کوڈ"}
              maxLength={8}
              className="w-full rounded-2xl border border-zinc-700 bg-zinc-900 px-5 py-4 text-center font-mono text-2xl font-bold tracking-[0.35em] text-amber-300 placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none"
              autoFocus
            />
            <button
              type="submit"
              disabled={!inputRoom.trim()}
              className="w-full rounded-2xl bg-emerald-gradient py-4 text-sm font-bold text-white cursor-pointer disabled:opacity-40 active:scale-95 transition-all"
            >
              {isEn ? "Connect" : "منسلک ہوں"}
            </button>
          </form>

          {recentRooms.length > 0 && (
            <div className="space-y-2">
              <div className="text-center text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                {isEn ? "Recent rooms" : "حالیہ روم"}
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {recentRooms.map((r) => (
                  <button
                    key={r}
                    onClick={() => connect(r)}
                    className="rounded-full border border-zinc-700 bg-zinc-900 px-4 py-2 font-mono text-sm font-bold text-zinc-300 hover:text-white transition-all cursor-pointer"
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Connected control page ──

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/90 px-5 py-4 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => navigate({ to: "/remote", search: {} })}
            className="grid h-11 w-11 place-items-center rounded-xl border border-zinc-700 text-zinc-300 hover:text-white transition-all cursor-pointer"
            title={isEn ? "Leave room" : "روم چھوڑیں"}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="text-center min-w-0">
            <div className="font-mono text-sm font-bold tracking-[0.3em] text-amber-300">
              {room}
            </div>
            <div
              className={cn(
                "flex items-center justify-center gap-1.5 text-[11px] font-semibold",
                failed
                  ? "text-red-400"
                  : stale
                    ? "text-amber-400"
                    : hostOnline
                      ? "text-emerald-400"
                      : "text-amber-400",
              )}
            >
              {!stale && (hostOnline || connecting) ? (
                <Wifi className="h-3 w-3" />
              ) : (
                <WifiOff className="h-3 w-3" />
              )}
              {failed
                ? isEn
                  ? "Connection failed"
                  : "رابطہ ناکام"
                : stale
                  ? isEn
                    ? "Reconnecting to host…"
                    : "میزبان سے دوبارہ منسلک ہو رہا ہے…"
                  : connecting
                    ? isEn
                      ? "Connecting…"
                      : "منسلک ہو رہا ہے…"
                    : hostOnline
                      ? isEn
                        ? "Host connected"
                        : "میزبان منسلک"
                      : isEn
                        ? "Waiting for host…"
                        : "میزبان کا انتظار…"}
            </div>
          </div>
          <button
            onClick={() => setLang(lang === "en" ? "ur" : "en")}
            className="grid h-11 w-11 place-items-center rounded-xl border border-zinc-700 text-zinc-300 hover:text-white transition-all cursor-pointer"
            title={isEn ? "Change language" : "زبان تبدیل کریں"}
          >
            <Languages className="h-5 w-5" />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-md space-y-5 px-4 py-6 pb-12">
        {!configured && (
          <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-center text-sm text-red-300">
            {isEn
              ? "Remote control is not configured on this site yet."
              : "اس سائٹ پر ریموٹ کنٹرول ابھی ترتیب نہیں دیا گیا۔"}
          </div>
        )}

        {stale && (
          <div className="flex flex-col items-stretch gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
            <div className="flex items-center gap-3">
              <WifiOff className="h-5 w-5 shrink-0" />
              <span>
                {isEn
                  ? "The link to the host is momentarily lost. Reconnecting — your commands will be sent as soon as it's back."
                  : "میزبان سے لنک عارضی طور پر ختم ہو گیا ہے۔ دوبارہ منسلک ہو رہا ہے — دوبارہ آنے پر آپ کے احکامات بھیجے جائیں گے۔"}
              </span>
            </div>
            <button
              onClick={() => tryReconnectRef.current(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-zinc-950 hover:bg-amber-400 transition-all cursor-pointer active:scale-95"
            >
              <RefreshCw className="h-4 w-4" />
              {isEn ? "Reconnect now" : "ابھی دوبارہ منسلک ہوں"}
            </button>
          </div>
        )}

        {!stale && configured && !hostOnline && (
          <div
            className={cn(
              "flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm",
              failed
                ? "border-red-500/40 bg-red-500/10 text-red-300"
                : "border-amber-500/40 bg-amber-500/10 text-amber-300",
            )}
          >
            <WifiOff className="h-5 w-5 shrink-0" />
            {failed
              ? isEn
                ? `Can't reach the pairing service (${error?.kind ?? "connection"}). Check your internet and try again.`
                : "پیرنگ سروس تک رسائی نہیں ہو سکی۔ انٹرنیٹ چیک کریں اور دوبارہ کوشش کریں۔"
              : isEn
                ? "The host is not connected yet. Your commands will be sent as soon as it comes online."
                : "میزبان ابھی منسلک نہیں۔ آن ہونے پر آپ کے احکامات بھیج دیے جائیں گے۔"}
          </div>
        )}

        <TimerControl
          label={isEn ? "Session Reading" : "سیشن"}
          icon={Clock}
          slice={effSlice("session")}
          presets={SESSION_PRESETS}
          durationKey="session"
          accent="amber"
          lang={lang}
          disabled={connecting || stale}
          onCommand={send}
        />
        <TimerControl
          label={isEn ? "Q&A" : "سوال و جواب"}
          icon={MessageSquare}
          slice={effSlice("qa")}
          presets={QA_PRESETS}
          durationKey="qa"
          accent="blue"
          lang={lang}
          disabled={connecting || stale}
          onCommand={send}
        />
        {state?.supportsTurn !== false && (
          <TimerControl
            label={isEn ? "Turn" : "ٹرن"}
            icon={Hourglass}
            slice={effSlice("turn")}
            presets={TURN_PRESETS}
            durationKey="turn"
            accent="emerald"
            lang={lang}
            disabled={connecting || stale}
            onCommand={send}
          />
        )}

        <button
          onClick={() => send({ type: "cmd", action: "toggleSound" })}
          disabled={connecting || stale}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-2xl border px-4 py-4 text-sm font-bold transition-all cursor-pointer active:scale-95 disabled:cursor-not-allowed disabled:opacity-40",
            state?.soundEnabled
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
              : "border-zinc-700 text-zinc-400",
          )}
        >
          {state?.soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          {state?.soundEnabled
            ? isEn
              ? "Expiry beep: ON (tap to mute)"
              : "اختتامی آواز: آن (بند کرنے کے لیے تھپکائیں)"
            : isEn
              ? "Expiry beep: OFF (tap to enable)"
              : "اختتامی آواز: بند (چالو کرنے کے لیے تھپکائیں)"}
        </button>

        <p className="flex items-center justify-center gap-2 pb-4 text-center text-xs text-zinc-600">
          <Check className="h-3.5 w-3.5 text-emerald-500" />
          {isEn
            ? "Keep this tab open. The projector stays in control."
            : "یہ ٹیب کھلا رکھیں۔ پروجیکٹر کنٹرول میں رہتا ہے۔"}
        </p>
      </main>
    </div>
  );
}
