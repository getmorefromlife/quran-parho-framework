import { useMemo, useState } from "react";
import { SURAHS } from "@/lib/surahs";
import { NumInput } from "@/components/num-input";
import { cn } from "@/lib/utils";
export function PaceCalculator({ lang }: { lang: string }) {
  const cycles = useMemo(() => {
    const all = SURAHS.slice();
    return [
      {
        key: "cycle1",
        label: lang === "en" ? "Cycle 1 · Foundation" : "مرحلہ ۱ · بنیاد",
        subtitle: lang === "en" ? "Reverse Order (114 → 1)" : "الٹی ترتیب (۱۱۴ → ۱)",
        surahs: [...all].sort((a, b) => b.n - a.n),
      },
      {
        key: "cycle2",
        label: lang === "en" ? "Cycle 2 · Seerah" : "مرحلہ ۲ · سیرت",
        subtitle: lang === "en" ? "Chronological (Nuzuli Order)" : "ترتیبِ نزولی",
        surahs: [...all].sort((a, b) => a.nuzul - b.nuzul),
      },
      {
        key: "cycle3",
        label: lang === "en" ? "Cycle 3 · Mastery" : "مرحلہ ۳ · مہارت",
        subtitle: lang === "en" ? "Mushaf Order (1 → 114)" : "مصحف کی ترتیب (۱ → ۱۱۴)",
        surahs: [...all].sort((a, b) => a.n - b.n),
      },
    ];
  }, [lang]);

  const [cycleIdx, setCycleIdx] = useState(0);
  const [weeks, setWeeks] = useState(12);
  const [sessionsPerWeek, setSessionsPerWeek] = useState(2);
  const [mode, setMode] = useState<"by-duration" | "by-pace">("by-duration");
  const [versesPerSession, setVersesPerSession] = useState(25);

  const c = cycles[cycleIdx];
  const totalSurahs = c.surahs.length;
  const totalVerses = c.surahs.reduce((sum, s) => sum + s.verses, 0);

  let result: {
    versesPerSession_result: number;
    surahsPerSession: number;
    sessionsPerWeek: number;
    weeksTotal: number;
  };

  if (mode === "by-duration") {
    const totalSessions = weeks * sessionsPerWeek;
    result = {
      versesPerSession_result: Math.ceil(totalVerses / totalSessions),
      surahsPerSession: Math.ceil(totalSurahs / totalSessions),
      sessionsPerWeek,
      weeksTotal: weeks,
    };
  } else {
    const totalSessions = Math.ceil(totalVerses / versesPerSession);
    const weeksNeeded = Math.ceil(totalSessions / sessionsPerWeek);
    result = {
      versesPerSession_result: versesPerSession,
      surahsPerSession: Math.ceil(totalSurahs / totalSessions),
      sessionsPerWeek,
      weeksTotal: weeksNeeded,
    };
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="rounded-3xl bg-card border border-border shadow-elegant p-5 sm:p-8">
        {/* Cycle selector */}
        <div className="flex flex-wrap justify-center gap-2.5 sm:gap-2 mb-6 sm:mb-8">
          {cycles.map((cy, i) => (
            <button
              key={cy.key}
              onClick={() => setCycleIdx(i)}
              className={cn(
                "px-5 sm:px-4 py-3 sm:py-2 rounded-full text-sm sm:text-sm font-semibold border transition-all",
                cycleIdx === i
                  ? "bg-emerald-gradient text-gold border-gold shadow-gold"
                  : "bg-background border-border text-muted-foreground",
              )}
            >
              {cy.label}
            </button>
          ))}
        </div>

        {/* Cycle summary */}
        <div className="flex justify-center gap-8 sm:gap-6 mb-6 sm:mb-8 text-sm">
          <div className="text-center">
            <div className="text-3xl sm:text-2xl font-bold font-mono text-emerald-deep">
              {totalSurahs}
            </div>
            <div className="text-xs sm:text-xs text-muted-foreground uppercase tracking-wider">
              {lang === "en" ? "Surahs" : "سورتیں"}
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl sm:text-2xl font-bold font-mono text-gold">{totalVerses}</div>
            <div className="text-xs sm:text-xs text-muted-foreground uppercase tracking-wider">
              {lang === "en" ? "Verses" : "آیات"}
            </div>
          </div>
        </div>

        {/* Mode toggle */}
        <div className="flex justify-center gap-2.5 sm:gap-2 mb-6">
          <button
            onClick={() => setMode("by-duration")}
            className={cn(
              "px-5 sm:px-4 py-3 sm:py-2 rounded-full text-sm sm:text-xs font-semibold border transition-all",
              mode === "by-duration"
                ? "bg-emerald-gradient text-gold border-gold shadow-gold"
                : "bg-background border-border text-muted-foreground",
            )}
          >
            {lang === "en" ? "By Duration" : "مدت کے مطابق"}
          </button>
          <button
            onClick={() => setMode("by-pace")}
            className={cn(
              "px-5 sm:px-4 py-3 sm:py-2 rounded-full text-sm sm:text-xs font-semibold border transition-all",
              mode === "by-pace"
                ? "bg-emerald-gradient text-gold border-gold shadow-gold"
                : "bg-background border-border text-muted-foreground",
            )}
          >
            {lang === "en" ? "By Verses/Session" : "فی نشست آیات"}
          </button>
        </div>

        {/* Inputs */}
        <div className="grid sm:grid-cols-2 gap-4 sm:gap-4 mb-6 sm:mb-8">
          {mode === "by-duration" ? (
            <>
              <label className="grid gap-1.5 text-sm">
                <span className="text-muted-foreground text-sm sm:text-sm">
                  {lang === "en" ? "Target Duration (weeks)" : "ہدف کی مدت (ہفتے)"}
                </span>
                <NumInput
                  value={weeks}
                  onChange={setWeeks}
                  min={1}
                  max={104}
                  className="border-gold/40 h-10 sm:h-9"
                />
              </label>
              <label className="grid gap-1.5 text-sm">
                <span className="text-muted-foreground text-sm sm:text-sm">
                  {lang === "en" ? "Sessions per Week" : "فی ہفتہ نشستیں"}
                </span>
                <NumInput
                  value={sessionsPerWeek}
                  onChange={setSessionsPerWeek}
                  min={1}
                  max={14}
                  className="border-gold/40 h-10 sm:h-9"
                />
              </label>
            </>
          ) : (
            <>
              <label className="grid gap-1.5 text-sm">
                <span className="text-muted-foreground text-sm sm:text-sm">
                  {lang === "en" ? "Verses per Session" : "فی نشست آیات"}
                </span>
                <NumInput
                  value={versesPerSession}
                  onChange={setVersesPerSession}
                  min={1}
                  max={200}
                  className="border-gold/40 h-10 sm:h-9"
                />
              </label>
              <label className="grid gap-1.5 text-sm">
                <span className="text-muted-foreground text-sm sm:text-sm">
                  {lang === "en" ? "Sessions per Week" : "فی ہفتہ نشستیں"}
                </span>
                <NumInput
                  value={sessionsPerWeek}
                  onChange={setSessionsPerWeek}
                  min={1}
                  max={14}
                  className="border-gold/40 h-10 sm:h-9"
                />
              </label>
            </>
          )}
        </div>

        {/* Results */}
        <div className="rounded-2xl bg-emerald-gradient text-gold border border-gold/40 p-5 sm:p-6 shadow-elegant">
          <div className="text-xs sm:text-xs uppercase tracking-widest opacity-80 mb-4">
            {lang === "en" ? "Your Pace Plan" : "آپ کی رفتار کا منصوبہ"}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-4 text-center">
            <div>
              <div className="text-3xl sm:text-2xl font-bold font-mono">
                {Math.ceil(result.versesPerSession_result)}
              </div>
              <div className="text-xs uppercase tracking-wider opacity-80">
                {lang === "en" ? "Verses/session" : "آیات/نشست"}
              </div>
            </div>
            <div>
              <div className="text-3xl sm:text-2xl font-bold font-mono">
                {result.surahsPerSession}
              </div>
              <div className="text-xs uppercase tracking-wider opacity-80">
                {lang === "en" ? "Surahs/session" : "سورتیں/نشست"}
              </div>
            </div>
            <div>
              <div className="text-3xl sm:text-2xl font-bold font-mono">
                {result.sessionsPerWeek}
              </div>
              <div className="text-xs uppercase tracking-wider opacity-80">
                {lang === "en" ? "Sessions/week" : "نشستیں/ہفتہ"}
              </div>
            </div>
            <div>
              <div className="text-3xl sm:text-2xl font-bold font-mono">{result.weeksTotal}</div>
              <div className="text-xs uppercase tracking-wider opacity-80">
                {lang === "en" ? "Total weeks" : "کل ہفتے"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PaceCalculator;
