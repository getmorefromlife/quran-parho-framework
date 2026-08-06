import { Pause, Play, RotateCcw, type LucideIcon } from "lucide-react";
import { NumInput } from "@/components/num-input";
import { cn } from "@/lib/utils";

function formatTimer(secs: number) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

const ACCENTS = {
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
} as const;

export function BigTimerCard({
  label,
  icon: Icon,
  seconds,
  total,
  active,
  onToggle,
  onReset,
  durationMin,
  presets,
  onDurationChange,
  accent,
  lang,
}: {
  label: string;
  icon: LucideIcon;
  seconds: number;
  total: number;
  active: boolean;
  onToggle: () => void;
  onReset: () => void;
  durationMin: number;
  presets: number[];
  onDurationChange: (min: number) => void;
  accent: "amber" | "blue";
  lang: string;
}) {
  const a = ACCENTS[accent];
  const pct = total > 0 ? Math.max(0, Math.min(1, seconds / total)) : 0;
  const urgent = active && seconds > 0 && seconds <= 60;
  const expired = seconds === 0;
  const digitsClass = expired ? "text-red-500" : urgent ? "text-red-400 animate-pulse" : a.text;

  return (
    <div className="flex flex-col items-center rounded-3xl border border-zinc-800 bg-zinc-950/70 backdrop-blur p-5 sm:p-8 lg:p-10 text-center shadow-2xl">
      <div
        className={cn(
          "inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-sm font-bold uppercase tracking-wider",
          a.chip,
        )}
      >
        <Icon className="h-4 w-4" />
        {label}
      </div>

      <div
        className={cn(
          "mt-6 font-mono tabular-nums font-bold leading-none tracking-tight transition-colors text-7xl sm:text-8xl lg:text-9xl",
          digitsClass,
        )}
      >
        {formatTimer(seconds)}
      </div>

      <div className="mt-8 w-full max-w-md h-2 rounded-full bg-zinc-800/70 overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-1000", a.fill)}
          style={{ width: `${pct * 100}%` }}
        />
      </div>

      <div className="mt-8 flex items-center gap-3">
        <button
          onClick={onToggle}
          className={cn(
            "inline-flex h-12 items-center gap-2 rounded-xl px-5 text-sm font-bold border transition-all cursor-pointer",
            active
              ? "bg-zinc-800 text-zinc-100 border-zinc-700 hover:bg-zinc-700"
              : cn("border-0", a.chip, "hover:opacity-90"),
          )}
        >
          {active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {active ? (lang === "en" ? "Pause" : "روکیں") : lang === "en" ? "Start" : "شروع"}
        </button>
        <button
          onClick={onReset}
          className="grid h-12 w-12 place-items-center rounded-xl border border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer"
          title={lang === "en" ? "Reset Timer" : "ٹائمر دوبارہ ترتیب دیں"}
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-8 w-full max-w-md space-y-3">
        <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
          {lang === "en" ? "Duration" : "مدت"}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          {presets.map((m) => (
            <button
              key={m}
              onClick={() => onDurationChange(m)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer",
                durationMin === m
                  ? cn("border-0", a.activeChip)
                  : "border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500",
              )}
            >
              {m} {lang === "en" ? "min" : "منٹ"}
            </button>
          ))}
        </div>
        <div className="flex items-center justify-center gap-2">
          <span className="text-xs text-zinc-500">{lang === "en" ? "Custom" : "اپنی مرضی"}</span>
          <NumInput
            value={durationMin}
            onChange={onDurationChange}
            min={1}
            max={480}
            className="w-20 h-9 text-center rounded-lg border border-zinc-700 bg-zinc-900 text-sm text-zinc-200"
            ariaLabel={lang === "en" ? "Custom duration in minutes" : "منٹوں میں مرضی کی مدت"}
          />
          <span className="text-xs text-zinc-500">{lang === "en" ? "min" : "منٹ"}</span>
        </div>
      </div>
    </div>
  );
}
