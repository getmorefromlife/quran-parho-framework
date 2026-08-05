import { useState } from "react";
import {
  RotateCcw,
  Gauge,
  Timer,
  Eye,
  EyeOff,
  X,
  Sparkles,
  BookOpenCheck,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useLang } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { HifzPrefs } from "@/lib/hifz-settings";

export type HifzControlsProps = {
  prefs: HifzPrefs;
  onChange: (next: HifzPrefs) => void;
  repeatIndex: number; // 0-based
  onClose: () => void;
};

const REPEAT_OPTIONS = [1, 3, 5, 10, 20, 999];
const SPEED_OPTIONS = [0.75, 0.85, 1.0, 1.25, 1.5, 2.0];
const GAP_OPTIONS = [0, 2, 3, 5, 10];

export function HifzControls({ prefs, onChange, repeatIndex, onClose }: HifzControlsProps) {
  const { lang } = useLang();
  const [expanded, setExpanded] = useState(false);

  const update = (patch: Partial<HifzPrefs>) => {
    onChange({ ...prefs, ...patch });
  };

  const isInfinite = prefs.verseRepeatCount >= 999;
  const targetRepeats = isInfinite ? "∞" : prefs.verseRepeatCount;

  return (
    <div className="bg-card/95 border-b border-gold/30 backdrop-blur-xl px-4 py-2.5 shadow-gold relative z-[94]">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
        {/* Left: Hifz Badge & Active Loop Counter */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-gold/15 text-gold border border-gold/40 shadow-sm">
            <BookOpenCheck className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gold uppercase tracking-wider">
                {lang === "en" ? "Hifz Suite" : "حفظ ٹولز"}
              </span>
              {prefs.verseRepeatCount > 1 && (
                <span className="text-[10px] font-semibold bg-gold/20 text-gold border border-gold/30 px-2 py-0.5 rounded-full shrink-0">
                  {lang === "en"
                    ? `Loop ${repeatIndex + 1}/${targetRepeats}`
                    : `تکرار ${repeatIndex + 1}/${targetRepeats}`}
                </span>
              )}
            </div>
            <div className="text-[11px] text-muted-foreground truncate hidden sm:block">
              {lang === "en"
                ? `${prefs.verseRepeatCount}x Loop · ${prefs.playbackSpeed}x Speed · ${prefs.silenceGapSeconds}s Gap`
                : `${prefs.verseRepeatCount} بار تکرار · ${prefs.playbackSpeed}x رفتار · ${prefs.silenceGapSeconds}s وقفہ`}
            </div>
          </div>
        </div>

        {/* Center/Right: Quick Hifz Controls */}
        <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
          {/* Quick Repeat selector */}
          <div className="flex items-center gap-1 bg-background/80 p-1 rounded-xl border border-border/60">
            <RotateCcw className="h-3.5 w-3.5 text-gold ml-1 hidden sm:block" />
            <span className="text-[10px] font-bold text-muted-foreground mr-1 hidden md:block">
              {lang === "en" ? "Loop:" : "تکرار:"}
            </span>
            {REPEAT_OPTIONS.slice(0, 4).map((opt) => {
              const active = prefs.verseRepeatCount === opt;
              return (
                <button
                  key={opt}
                  onClick={() => update({ verseRepeatCount: opt })}
                  className={cn(
                    "px-2 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                    active
                      ? "bg-gold text-background shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                  )}
                >
                  {opt}x
                </button>
              );
            })}
          </div>

          {/* Quick Speed Selector */}
          <div className="flex items-center gap-1 bg-background/80 p-1 rounded-xl border border-border/60">
            <Gauge className="h-3.5 w-3.5 text-gold ml-1 hidden sm:block" />
            <span className="text-[10px] font-bold text-muted-foreground mr-1 hidden md:block">
              {lang === "en" ? "Speed:" : "رفتار:"}
            </span>
            {[0.75, 1.0, 1.25, 1.5].map((s) => {
              const active = prefs.playbackSpeed === s;
              return (
                <button
                  key={s}
                  onClick={() => update({ playbackSpeed: s })}
                  className={cn(
                    "px-1.5 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                    active
                      ? "bg-gold text-background shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                  )}
                >
                  {s}x
                </button>
              );
            })}
          </div>

          {/* Self-Test Blur Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => update({ selfTestBlur: !prefs.selfTestBlur })}
            className={cn(
              "h-8 px-2.5 rounded-xl border text-xs gap-1 cursor-pointer transition-all",
              prefs.selfTestBlur
                ? "border-amber-500 bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold"
                : "border-border text-muted-foreground hover:border-gold/40",
            )}
            title={
              prefs.selfTestBlur
                ? lang === "en"
                  ? "Self-Test Blur: ON (Hover text to reveal)"
                  : "خود آزمائی: آن"
                : lang === "en"
                  ? "Self-Test Blur: OFF"
                  : "خود آزمائی: آف"
            }
          >
            {prefs.selfTestBlur ? (
              <EyeOff className="h-3.5 w-3.5 text-amber-500" />
            ) : (
              <Eye className="h-3.5 w-3.5 text-muted-foreground" />
            )}
            <span className="hidden sm:inline">{lang === "en" ? "Self-Test" : "خود آزمائی"}</span>
          </Button>

          {/* Expand Settings Drawer Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setExpanded((v) => !v)}
            className="h-8 w-8 rounded-xl text-muted-foreground hover:text-foreground cursor-pointer"
            title={lang === "en" ? "More Hifz Settings" : "مزید سیٹنگز"}
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>

          {/* Close Hifz Toolbar */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
            title={lang === "en" ? "Close Hifz Tools" : "حفظ ٹولز بند کریں"}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Expanded Hifz Detailed Controls */}
      {expanded && (
        <div className="max-w-4xl mx-auto mt-3 pt-3 border-t border-border/60 grid sm:grid-cols-3 gap-4 text-xs">
          {/* Verse Repetitions */}
          <div>
            <div className="font-bold text-foreground mb-1.5 flex items-center gap-1.5">
              <RotateCcw className="h-3.5 w-3.5 text-gold" />
              {lang === "en" ? "Verse Repetition Count" : "تکرار برائے ہر آیت"}
            </div>
            <div className="flex items-center gap-1 flex-wrap">
              {REPEAT_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  onClick={() => update({ verseRepeatCount: opt })}
                  className={cn(
                    "px-2.5 py-1 rounded-lg border text-xs font-bold transition-all cursor-pointer",
                    prefs.verseRepeatCount === opt
                      ? "border-gold bg-gold/15 text-gold shadow-sm"
                      : "border-border/60 bg-card hover:border-gold/40 text-muted-foreground",
                  )}
                >
                  {opt >= 999 ? "Infinite (∞)" : `${opt}x`}
                </button>
              ))}
            </div>
          </div>

          {/* Playback Speed */}
          <div>
            <div className="font-bold text-foreground mb-1.5 flex items-center gap-1.5">
              <Gauge className="h-3.5 w-3.5 text-gold" />
              {lang === "en" ? "Audio Recitation Speed" : "تلاوت کی رفتار"}
            </div>
            <div className="flex items-center gap-1 flex-wrap">
              {SPEED_OPTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => update({ playbackSpeed: s })}
                  className={cn(
                    "px-2.5 py-1 rounded-lg border text-xs font-bold transition-all cursor-pointer",
                    prefs.playbackSpeed === s
                      ? "border-gold bg-gold/15 text-gold shadow-sm"
                      : "border-border/60 bg-card hover:border-gold/40 text-muted-foreground",
                  )}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>

          {/* Recite-Along Silence Gap */}
          <div>
            <div className="font-bold text-foreground mb-1.5 flex items-center gap-1.5">
              <Timer className="h-3.5 w-3.5 text-gold" />
              {lang === "en" ? "Pause Gap (Recite Out Loud)" : "خود زبان سے دہرانے کا وقفہ"}
            </div>
            <div className="flex items-center gap-1 flex-wrap">
              {GAP_OPTIONS.map((gap) => (
                <button
                  key={gap}
                  onClick={() => update({ silenceGapSeconds: gap })}
                  className={cn(
                    "px-2.5 py-1 rounded-lg border text-xs font-bold transition-all cursor-pointer",
                    prefs.silenceGapSeconds === gap
                      ? "border-gold bg-gold/15 text-gold shadow-sm"
                      : "border-border/60 bg-card hover:border-gold/40 text-muted-foreground",
                  )}
                >
                  {gap === 0 ? "No Pause" : `${gap}s Pause`}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
