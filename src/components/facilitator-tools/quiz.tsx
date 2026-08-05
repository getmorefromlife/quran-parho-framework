import { useCallback, useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { SURAHS, type Surah } from "@/lib/surahs";
import { loadQuizBest, saveQuizBest } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
export function SurahQuizzer({ lang }: { lang: string }) {
  const [mode, setMode] = useState<"name" | "type" | "verses" | "nuzul">("name");
  const [current, setCurrent] = useState<Surah | null>(null);
  const [options, setOptions] = useState<{ label: string; correct: boolean }[]>([]);
  const [answered, setAnswered] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [total, setTotal] = useState(0);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [lifetime, setLifetime] = useState(() => loadQuizBest());

  const modes = [
    { key: "name", label: lang === "en" ? "Name the Surah" : "سورہ کا نام بتائیں" },
    { key: "type", label: lang === "en" ? "Meccan or Medinan" : "مکی یا مدنی" },
    { key: "verses", label: lang === "en" ? "Guess Verses" : "آیات کا اندازہ" },
    { key: "nuzul", label: lang === "en" ? "Nuzul Order" : "نزول کی ترتیب" },
  ] as const;

  const generateQuestion = useCallback(
    (m: typeof mode) => {
      const all = SURAHS.slice();
      const surah = all[Math.floor(Math.random() * all.length)];
      let opts: { label: string; correct: boolean }[] = [];

      if (m === "name") {
        const correct = surah.en;
        const wrong = all
          .filter((s) => s.en !== correct)
          .sort(() => Math.random() - 0.5)
          .slice(0, 3)
          .map((s) => s.en);
        opts = [
          { label: `${surah.n}. ${correct}`, correct: true },
          ...wrong.map((w) => ({ label: w, correct: false })),
        ].sort(() => Math.random() - 0.5);
      } else if (m === "type") {
        const correct =
          surah.type === "meccan"
            ? lang === "en"
              ? "Meccan"
              : "مکی"
            : lang === "en"
              ? "Medinan"
              : "مدنی";
        opts = [
          { label: lang === "en" ? "Meccan" : "مکی", correct: surah.type === "meccan" },
          { label: lang === "en" ? "Medinan" : "مدنی", correct: surah.type === "medinan" },
        ].sort(() => Math.random() - 0.5);
      } else if (m === "verses") {
        const v = surah.verses;
        const wrongs = new Set<number>();
        while (wrongs.size < 3) {
          const offset = Math.floor(Math.random() * 20) - 10;
          const w = Math.max(1, v + offset);
          if (w !== v && !wrongs.has(w)) wrongs.add(w);
        }
        opts = [
          { label: String(v), correct: true },
          ...[...wrongs].map((w) => ({ label: String(w), correct: false })),
        ].sort(() => Math.random() - 0.5);
      } else if (m === "nuzul") {
        const correct = surah.nuzul;
        const wrongs = new Set<number>();
        while (wrongs.size < 3) {
          const offset = Math.floor(Math.random() * 30) - 15;
          const w = Math.max(1, correct + offset);
          if (w !== correct && !wrongs.has(w)) wrongs.add(w);
        }
        opts = [
          { label: `#${correct}`, correct: true },
          ...[...wrongs].map((w) => ({ label: `#${w}`, correct: false })),
        ].sort(() => Math.random() - 0.5);
      }

      setCurrent(surah);
      setOptions(opts);
      setAnswered(false);
      setSelected(null);
      setFeedback(null);
    },
    [lang],
  );

  const handleSelect = (idx: number) => {
    if (answered) return;
    setSelected(idx);
    setAnswered(true);
    const correct = options[idx].correct;
    if (correct) {
      const nextStreak = streak + 1;
      setScore((s) => s + 1);
      setStreak((s) => {
        const next = s + 1;
        if (next > bestStreak) setBestStreak(next);
        return next;
      });
      setLifetime((prev) => {
        const next = {
          score: Math.max(prev.score, score + 1),
          streak: Math.max(prev.streak, nextStreak),
        };
        saveQuizBest(next);
        return next;
      });
      setFeedback("correct");
    } else {
      setStreak(0);
      setFeedback("wrong");
    }
    setTotal((t) => t + 1);
  };

  useEffect(() => {
    generateQuestion(mode);
  }, [mode, generateQuestion]);

  const modeIcons: Record<string, string> = { name: "🔤", type: "🕌", verses: "🔢", nuzul: "📜" };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="rounded-3xl bg-card border border-border shadow-elegant p-5 sm:p-8">
        {/* Mode selector */}
        <div className="flex flex-wrap justify-center gap-2.5 sm:gap-2 mb-6">
          {modes.map((m) => (
            <button
              key={m.key}
              onClick={() => setMode(m.key as typeof mode)}
              className={cn(
                "px-5 sm:px-4 py-3 sm:py-2 rounded-full text-sm sm:text-sm font-semibold border transition-all",
                mode === m.key
                  ? "bg-emerald-gradient text-gold border-gold shadow-gold"
                  : "bg-background border-border text-muted-foreground",
              )}
            >
              {modeIcons[m.key]} {m.label}
            </button>
          ))}
        </div>

        {/* Score bar */}
        <div className="flex justify-center gap-8 sm:gap-6 mb-6 sm:mb-8 text-sm">
          <div className="text-center">
            <div className="text-xl sm:text-lg font-bold font-mono text-emerald-deep">
              {score}/{total}
            </div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              {lang === "en" ? "Score" : "اسکور"}
            </div>
          </div>
          <div className="text-center">
            <div
              className={cn(
                "text-xl sm:text-lg font-bold font-mono",
                streak > 0 ? "text-gold" : "text-muted-foreground",
              )}
            >
              {streak}
              {streak >= 3 && " 🔥"}
            </div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              {lang === "en" ? "Streak" : "سلسلہ"}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xl sm:text-lg font-bold font-mono text-muted-foreground">
              {bestStreak}
            </div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              {lang === "en" ? "Best" : "بہترین"}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xl sm:text-lg font-bold font-mono text-emerald-deep">
              {lifetime.score}
            </div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              {lang === "en" ? "All-time" : "اب تک"}
            </div>
            <div className="text-[10px] font-mono text-gold">
              {lifetime.streak} {lang === "en" ? "streak" : "سلسلہ"}
            </div>
          </div>
        </div>

        {/* Question card */}
        {current && (
          <div className="rounded-2xl border border-border bg-background p-5 sm:p-6 mb-6">
            {mode === "name" && (
              <div className="text-center">
                <div className="text-4xl sm:text-3xl font-serif-display mb-2">{current.ar}</div>
                <div className="text-base sm:text-sm text-muted-foreground">
                  {lang === "en" ? "What is this surah?" : "یہ کون سی سورہ ہے؟"}
                </div>
              </div>
            )}
            {mode === "type" && (
              <div className="text-center">
                <div className="text-2xl sm:text-2xl font-bold">{current.en}</div>
                <div className="text-2xl sm:text-xl font-serif-display text-muted-foreground mt-1">
                  {current.ar}
                </div>
                <div className="text-base sm:text-sm text-muted-foreground mt-2">
                  {lang === "en" ? "Is it Meccan or Medinan?" : "مکی ہے یا مدنی؟"}
                </div>
              </div>
            )}
            {mode === "verses" && (
              <div className="text-center">
                <div className="text-2xl sm:text-2xl font-bold">{current.en}</div>
                <div className="text-2xl sm:text-xl font-serif-display text-muted-foreground mt-1">
                  {current.ar}
                </div>
                <div className="text-base sm:text-sm text-muted-foreground mt-2">
                  {lang === "en" ? "How many verses?" : "کتنے آیات ہیں؟"}
                </div>
              </div>
            )}
            {mode === "nuzul" && (
              <div className="text-center">
                <div className="text-2xl sm:text-2xl font-bold">{current.en}</div>
                <div className="text-2xl sm:text-xl font-serif-display text-muted-foreground mt-1">
                  {current.ar}
                </div>
                <div className="text-base sm:text-sm text-muted-foreground mt-2">
                  {lang === "en" ? "What is its Nuzul order?" : "نزول کی کون سی ترتیب ہے؟"}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Options */}
        <div className="grid gap-3 sm:gap-3 mb-6">
          {options.map((opt, i) => {
            let className =
              "p-4 sm:p-4 rounded-xl border text-left font-medium transition-all text-base sm:text-sm ";
            if (!answered)
              className +=
                "border-border bg-background hover:border-gold/60 hover:bg-card cursor-pointer";
            else if (opt.correct)
              className += "border-emerald-deep bg-emerald-deep/10 text-emerald-deep";
            else if (i === selected)
              className += "border-destructive bg-destructive/10 text-destructive";
            else className += "border-border bg-background opacity-50";
            return (
              <button
                key={i}
                onClick={() => handleSelect(i)}
                className={className}
                dangerouslySetInnerHTML={{ __html: opt.label }}
              />
            );
          })}
        </div>

        {/* Feedback */}
        {feedback && (
          <div
            className={cn(
              "text-center text-base sm:text-sm font-semibold mb-4",
              feedback === "correct" ? "text-emerald-deep" : "text-destructive",
            )}
          >
            {feedback === "correct"
              ? lang === "en"
                ? "✅ Correct!"
                : "✅ صحیح!"
              : lang === "en"
                ? `❌ Wrong! It was: ${options.find((o) => o.correct)?.label}`
                : `❌ غلط! صحیح جواب: ${options.find((o) => o.correct)?.label}`}
          </div>
        )}

        {/* Next button */}
        {answered && (
          <div className="text-center">
            <Button
              onClick={() => generateQuestion(mode)}
              className="bg-emerald-gradient text-gold border border-gold/40 h-10 sm:h-9 text-sm sm:text-sm px-5 sm:px-4"
            >
              <ArrowRight className="h-4 w-4" /> {lang === "en" ? "Next Question" : "اگلا سوال"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default SurahQuizzer;
