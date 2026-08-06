import { useEffect, useRef, useState } from "react";
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
  onCommand,
}: {
  label: string;
  icon: LucideIcon;
  slice?: RemoteState["session"];
  presets: number[];
  durationKey: keyof TimerDurations;
  accent: Accent;
  lang: string;
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
          className={cn(
            "col-span-2 inline-flex h-14 items-center justify-center gap-2 rounded-2xl text-sm font-bold transition-all cursor-pointer active:scale-95",
            active ? "border border-zinc-700 bg-zinc-800 text-zinc-100" : cn("border-0", a.chip),
          )}
        >
          {active ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          {active ? (isEn ? "Pause" : "روکیں") : isEn ? "Start" : "شروع"}
        </button>
        <button
          onClick={() => onCommand({ type: "cmd", action: resetAction })}
          className="grid h-14 place-items-center rounded-2xl border border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer active:scale-95"
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
            className={cn(
              "rounded-full border px-3.5 py-2 text-xs font-bold transition-all cursor-pointer active:scale-95",
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
    openRemoteRoom(room, "remote", {
      onState: (s) => {
        if (!cancelled) setState(s);
      },
      onMembers: (m) => {
        if (!cancelled) setMembers(m);
      },
      onConnectionState: (s) => {
        if (!cancelled) setStatus(s);
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
      setRoomHandle(opened);
      if (!opened) setStatus("not-configured");
      if (opened) saveRecentRoom(room);
    });
    return () => {
      cancelled = true;
      handle?.close();
      setRoomHandle(null);
      setMembers([]);
    };
  }, [room]);

  const hasHost = members.some((m) => m.role === "host");
  const connected = status === "connected";
  const connecting = !connected && status !== "failed" && !error;
  const failed = error !== null || status === "failed";
  // A state message only ever comes from the host, so treat it as proof the
  // host is paired even if presence membership is momentarily stale.
  const hostOnline = connected && (hasHost || state !== null);

  // Commands sent while the host is offline are buffered and flushed on connect,
  // so "will apply as soon as it comes online" is actually true.
  const pendingRef = useRef<RemoteCommand[]>([]);
  const send = (cmd: RemoteCommand) => {
    if (hostOnline && roomHandle) {
      roomHandle.publish(cmd);
    } else {
      pendingRef.current.push(cmd);
    }
  };

  useEffect(() => {
    if (!hostOnline || !roomHandle || pendingRef.current.length === 0) return;
    const pending = pendingRef.current;
    pendingRef.current = [];
    for (const cmd of pending) roomHandle.publish(cmd);
  }, [hostOnline, roomHandle]);

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
                failed ? "text-red-400" : hostOnline ? "text-emerald-400" : "text-amber-400",
              )}
            >
              {hostOnline || connecting ? (
                <Wifi className="h-3 w-3" />
              ) : (
                <WifiOff className="h-3 w-3" />
              )}
              {failed
                ? isEn
                  ? "Connection failed"
                  : "رابطہ ناکام"
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

        {configured && !hostOnline && (
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
          slice={state?.session}
          presets={SESSION_PRESETS}
          durationKey="session"
          accent="amber"
          lang={lang}
          onCommand={send}
        />
        <TimerControl
          label={isEn ? "Q&A" : "سوال و جواب"}
          icon={MessageSquare}
          slice={state?.qa}
          presets={QA_PRESETS}
          durationKey="qa"
          accent="blue"
          lang={lang}
          onCommand={send}
        />
        {state?.supportsTurn !== false && (
          <TimerControl
            label={isEn ? "Turn" : "ٹرن"}
            icon={Hourglass}
            slice={state?.turn}
            presets={TURN_PRESETS}
            durationKey="turn"
            accent="emerald"
            lang={lang}
            onCommand={send}
          />
        )}

        <button
          onClick={() => send({ type: "cmd", action: "toggleSound" })}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-2xl border px-4 py-4 text-sm font-bold transition-all cursor-pointer active:scale-95",
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
