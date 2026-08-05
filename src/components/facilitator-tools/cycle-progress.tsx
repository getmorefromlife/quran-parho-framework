import { useEffect, useMemo, useState } from "react";
import { Check } from "lucide-react";
import { SURAHS } from "@/lib/surahs";
import { cn } from "@/lib/utils";
export function CycleProgressDashboard({ lang }: { lang: string }) {
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

  const [activeCycle, setActiveCycle] = useState(0);
  const [completed, setCompleted] = useState<Record<string, number[]>>(() => {
    try {
      return JSON.parse(localStorage.getItem("qp_cycle_progress") || "{}");
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem("qp_cycle_progress", JSON.stringify(completed));
  }, [completed]);

  const toggleSurah = (cycleKey: string, surahN: number) => {
    setCompleted((prev) => {
      const list = prev[cycleKey] || [];
      const next = list.includes(surahN) ? list.filter((n) => n !== surahN) : [...list, surahN];
      return { ...prev, [cycleKey]: next };
    });
  };

  const total = SURAHS.length;
  const totalDone = Object.values(completed).flat().length;
  const overallPct = total > 0 ? Math.round((totalDone / (total * 3)) * 100) : 0;

  const c = cycles[activeCycle];
  const doneList = completed[c.key] || [];
  const doneCount = doneList.length;
  const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="rounded-3xl bg-card border border-border shadow-elegant p-5 sm:p-8">
        {/* Overall progress */}
        <div className="mb-6 sm:mb-8 text-center">
          <div className="text-4xl sm:text-3xl font-bold font-mono text-emerald-deep">
            {overallPct}%
          </div>
          <div className="text-sm sm:text-xs uppercase tracking-widest text-muted-foreground mt-1.5 sm:mt-1">
            {lang === "en" ? "Overall Progress" : "مجموعی پیش رفت"}
          </div>
          <div className="mt-3 sm:mt-2 h-3 sm:h-2 rounded-full bg-muted overflow-hidden mx-auto max-w-xs">
            <div
              className="h-full bg-gold-gradient transition-all duration-500"
              style={{ width: `${overallPct}%` }}
            />
          </div>
        </div>

        {/* Cycle tabs */}
        <div className="flex flex-wrap justify-center gap-2.5 sm:gap-2 mb-6">
          {cycles.map((cy, i) => {
            const cyDone = (completed[cy.key] || []).length;
            const cyPct = Math.round((cyDone / total) * 100);
            return (
              <button
                key={cy.key}
                onClick={() => setActiveCycle(i)}
                className={cn(
                  "px-5 sm:px-4 py-3 sm:py-2.5 rounded-xl text-sm sm:text-sm font-semibold border transition-all text-left",
                  activeCycle === i
                    ? "bg-emerald-gradient text-gold border-gold shadow-gold"
                    : "bg-background border-border text-muted-foreground hover:border-gold/60",
                )}
              >
                <div>{cy.label}</div>
                <div className="text-xs opacity-80">
                  {cyPct}% · {cyDone}/{total}
                </div>
              </button>
            );
          })}
        </div>

        {/* Active cycle header */}
        <div className="flex items-center justify-between mb-4 px-1">
          <div>
            <div className="font-semibold text-sm sm:text-sm">{c.label}</div>
            <div className="text-xs sm:text-xs text-muted-foreground">{c.subtitle}</div>
          </div>
          <div className="text-right text-sm font-mono text-gold">
            {pct}%{" "}
            <span className="text-xs text-muted-foreground">
              ({doneCount}/{total})
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-3 sm:h-2 rounded-full bg-muted overflow-hidden mb-4">
          <div
            className="h-full bg-emerald-gradient transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Surah grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-2">
          {c.surahs.map((s) => {
            const done = doneList.includes(s.n);
            return (
              <button
                key={s.n}
                onClick={() => toggleSurah(c.key, s.n)}
                className={cn(
                  "flex items-center gap-2.5 sm:gap-2 p-3 sm:p-2.5 rounded-xl border text-left transition-all text-sm",
                  done
                    ? "bg-emerald-gradient/10 border-gold/50 text-foreground"
                    : "bg-background border-border text-muted-foreground hover:border-gold/40",
                )}
              >
                <div
                  className={cn(
                    "h-8 sm:h-7 w-8 sm:w-7 rounded-full grid place-items-center text-xs font-bold shrink-0 border",
                    done ? "bg-emerald-gradient text-gold border-gold" : "border-border",
                  )}
                >
                  {done ? <Check className="h-3.5 sm:h-3 w-3.5 sm:w-3" /> : s.n}
                </div>
                <div className="min-w-0 leading-tight">
                  <div className="font-medium text-xs sm:text-xs break-words leading-snug">
                    {s.en}
                  </div>
                  <div className="text-xs opacity-60">{s.ar}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default CycleProgressDashboard;
