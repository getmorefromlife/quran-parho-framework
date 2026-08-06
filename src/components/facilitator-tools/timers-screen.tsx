import { useEffect, useRef, useState } from "react";
import {
  Clock,
  Maximize2,
  MessageSquare,
  Minimize2,
  Presentation,
  Smartphone,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { BigTimerCard } from "@/components/shared/big-timer-card";
import { RemotePanel } from "@/components/shared/remote-panel";
import { useCountdownTimer } from "@/hooks/use-countdown-timer";
import { useRemoteHost } from "@/hooks/use-remote-host";
import type { RemoteCommand } from "@/lib/remote-control";
import {
  loadTimerDurations,
  saveTimerDurations,
  QA_PRESETS,
  SESSION_PRESETS,
  toSeconds,
  type TimerDurations,
} from "@/lib/timer-durations";
import { playAlertBeep, playWarningBeep } from "@/lib/timer-beep";
import { cn } from "@/lib/utils";

export function TimersScreen({ lang, onClose }: { lang: string; onClose: () => void }) {
  const [durations, setDurations] = useState<TimerDurations>(() => loadTimerDurations());
  const session = useCountdownTimer(toSeconds(durations.session));
  const qa = useCountdownTimer(toSeconds(durations.qa));
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const sessionBeepRef = useRef(false);
  const qaBeepRef = useRef(false);

  useEffect(() => {
    saveTimerDurations(durations);
  }, [durations]);

  const setDurationSetting = (key: keyof TimerDurations, min: number) => {
    setDurations((d) => ({ ...d, [key]: min }));
    if (key === "session") session.setDuration(toSeconds(min));
    if (key === "qa") qa.setDuration(toSeconds(min));
  };

  // Phone remote control: host relay + pairing panel (Session + Q&A only)
  const buildStateSnapshot = () => ({
    type: "state" as const,
    session: { secs: session.seconds, active: session.active, total: session.total },
    qa: { secs: qa.seconds, active: qa.active, total: qa.total },
    turn: { secs: 0, active: false, total: 0 },
    soundEnabled,
    supportsTurn: false,
  });

  const handleRemoteCommand = (cmd: RemoteCommand) => {
    switch (cmd.action) {
      case "toggleSession":
        session.toggle();
        break;
      case "resetSession":
        session.reset();
        break;
      case "toggleQa":
        qa.toggle();
        break;
      case "resetQa":
        qa.reset();
        break;
      case "toggleSound":
        setSoundEnabled((v) => !v);
        break;
      case "setDuration":
        if (cmd.key === "session" || cmd.key === "qa") {
          setDurationSetting(cmd.key, cmd.minutes);
        }
        break;
      case "toggleTurn":
      case "resetTurn":
        break;
    }
  };

  const remote = useRemoteHost({ getSnapshot: buildStateSnapshot, onCommand: handleRemoteCommand });

  // Expiry + one-minute warning beeps (ref-guarded against repeat fires)
  useEffect(() => {
    if (session.seconds === 0 && session.active) {
      if (!sessionBeepRef.current && soundEnabled) playAlertBeep();
      sessionBeepRef.current = true;
    } else if (session.seconds > 0) {
      sessionBeepRef.current = false;
    }
  }, [session.seconds, session.active, soundEnabled]);

  useEffect(() => {
    if (qa.seconds === 0 && qa.active) {
      if (!qaBeepRef.current && soundEnabled) playAlertBeep();
      qaBeepRef.current = true;
    } else if (qa.seconds > 0) {
      qaBeepRef.current = false;
    }
  }, [qa.seconds, qa.active, soundEnabled]);

  useEffect(() => {
    if (session.seconds === 60 && session.active && soundEnabled) playWarningBeep();
  }, [session.seconds, session.active, soundEnabled]);

  useEffect(() => {
    if (qa.seconds === 60 && qa.active && soundEnabled) playWarningBeep();
  }, [qa.seconds, qa.active, soundEnabled]);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  };

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  // Esc exits the projection (letting the browser exit fullscreen first on the same keypress)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !document.fullscreenElement) {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[120] flex flex-col bg-zinc-950 text-zinc-100 overflow-y-auto select-none">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-4 sm:px-8 py-4 bg-zinc-950/90 backdrop-blur-xl border-b border-zinc-800">
        <div className="flex items-center gap-3 min-w-0">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-400">
            <Presentation className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <div className="text-sm sm:text-base font-bold tracking-wide truncate">
              {lang === "en" ? "Qurʼān Parho · Circle Timers" : "قرآن پڑھو · سرکل ٹائمرز"}
            </div>
            <div className="text-[11px] text-zinc-500 truncate">
              {lang === "en"
                ? "Session + Q&A fullscreen projection"
                : "سیشن + سوال و جواب فل اسکرین پروجیکشن"}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => remote.setPanelOpen((v) => !v)}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl border transition-all cursor-pointer",
              remote.panelOpen
                ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-400"
                : "border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800",
            )}
            title={
              lang === "en" ? "Control timers from your phone" : "فون سے ٹائمرز کو کنٹرول کریں"
            }
          >
            <Smartphone className="h-4 w-4" />
          </button>
          <button
            onClick={() => setSoundEnabled((v) => !v)}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl border transition-all cursor-pointer",
              soundEnabled
                ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-400"
                : "border-zinc-700 text-zinc-500 hover:text-zinc-300",
            )}
            title={
              soundEnabled
                ? lang === "en"
                  ? "Expiry beep is ON — click to mute"
                  : "اختتامی آواز آن ہے — بند کرنے کے لیے کلک کریں"
                : lang === "en"
                  ? "Expiry beep is OFF — click to enable"
                  : "اختتامی آواز بند ہے — چالو کرنے کے لیے کلک کریں"
            }
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>
          <button
            onClick={toggleFullscreen}
            className="grid h-10 w-10 place-items-center rounded-xl border border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer"
            title={lang === "en" ? "Toggle Fullscreen" : "فل اسکرین آن/آف"}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
          <button
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-xl text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
            title={lang === "en" ? "Close Timers (Esc)" : "ٹائمر بند کریں (Esc)"}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Big timer cards */}
      <div className="flex-1 grid gap-6 lg:grid-cols-2 items-center max-w-6xl w-full mx-auto px-4 sm:px-8 py-8 sm:py-12">
        <BigTimerCard
          label={lang === "en" ? "Session Reading" : "سیشن"}
          icon={Clock}
          seconds={session.seconds}
          total={session.total}
          active={session.active}
          onToggle={session.toggle}
          onReset={session.reset}
          durationMin={durations.session}
          presets={SESSION_PRESETS}
          onDurationChange={(m) => setDurationSetting("session", m)}
          accent="amber"
          lang={lang}
        />
        <BigTimerCard
          label={lang === "en" ? "Q&A" : "سوال و جواب"}
          icon={MessageSquare}
          seconds={qa.seconds}
          total={qa.total}
          active={qa.active}
          onToggle={qa.toggle}
          onReset={qa.reset}
          durationMin={durations.qa}
          presets={QA_PRESETS}
          onDurationChange={(m) => setDurationSetting("qa", m)}
          accent="blue"
          lang={lang}
        />
      </div>

      {/* Footer hint */}
      <div className="px-4 sm:px-8 pb-6 text-center text-[11px] text-zinc-600">
        {lang === "en"
          ? "Durations are saved on this device and shared with Quran presentation mode."
          : "مدت اس ڈیوائس پر محفوظ ہوتی ہے اور قرآن پریزنٹیشن موڈ کے ساتھ مشترک ہے۔"}
      </div>

      {remote.panelOpen && remote.roomCode && (
        <RemotePanel
          lang={lang}
          room={remote.roomCode}
          status={remote.status}
          members={remote.members}
          onClose={() => remote.setPanelOpen(false)}
        />
      )}
    </div>
  );
}

export default TimersScreen;
