import { useEffect, useMemo, useState } from "react";
import { BookOpen, RotateCcw, Search } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { SURAHS } from "@/lib/surahs";
import { loadReaderBookmark, type ReaderBookmark } from "@/lib/storage";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function SurahExplorer({ onOpenSurah }: { onOpenSurah: (n: number) => void }) {
  const { tr, lang } = useLang();
  const [mode, setMode] = useState<"reverse" | "nuzul" | "mushaf">("mushaf");
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "meccan" | "medinan">("all");
  const [letter, setLetter] = useState("");
  const [bookmark, setBookmark] = useState<ReaderBookmark | null>(() => loadReaderBookmark());

  useEffect(() => {
    const refresh = () => setBookmark(loadReaderBookmark());
    window.addEventListener("qp-bookmark", refresh);
    return () => window.removeEventListener("qp-bookmark", refresh);
  }, []);

  const letters = useMemo(
    () =>
      SURAHS.map((s) => s.en[0].toUpperCase())
        .filter((v, i, a) => a.indexOf(v) === i)
        .sort(),
    [],
  );

  const sorted = useMemo(() => {
    const arr = SURAHS.filter((s) => {
      if (
        q &&
        !s.en.toLowerCase().includes(q.toLowerCase()) &&
        !s.ar.includes(q) &&
        !String(s.n).includes(q)
      )
        return false;
      if (letter && s.en[0].toUpperCase() !== letter) return false;
      if (typeFilter !== "all" && s.type !== typeFilter) return false;
      return true;
    });
    if (mode === "mushaf") return [...arr].sort((a, b) => a.n - b.n);
    if (mode === "reverse") return [...arr].sort((a, b) => b.n - a.n);
    return [...arr].sort((a, b) => a.nuzul - b.nuzul);
  }, [mode, q, typeFilter, letter]);

  return (
    <section
      id="explorer"
      className="py-20 lg:py-28 bg-card/40 border-y border-border relative overflow-hidden"
    >
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gold/10 rounded-full blur-3xl pointer-events-none" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative">
        <div
          className={cn("text-center max-w-2xl mx-auto", lang === "ur" ? "space-y-5" : "space-y-3")}
        >
          <Badge className="bg-gold/20 text-gold border border-gold/40 px-4 py-1 text-xs font-semibold uppercase tracking-wider">
            <BookOpen className="h-3.5 w-3.5 mr-1.5 inline" />
            {lang === "en" ? "Interactive Qurʼān Explorer" : "قرآنی سورتوں کا ایکسپلورر"}
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-serif-display">
            {tr("surah_title")}
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            {tr("surah_sub")}
          </p>
        </div>

        {bookmark && (
          <button
            type="button"
            onClick={() => onOpenSurah(bookmark.surahN)}
            className="mt-6 mx-auto flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-5 py-2.5 text-sm font-semibold text-gold hover:bg-gold/20 transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {tr("continue_reading")}:{" "}
            {SURAHS.find((s) => s.n === bookmark.surahN)?.en ?? bookmark.surahN} ·{" "}
            {lang === "en" ? "verse" : "آیت"} {bookmark.verse}
          </button>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex rounded-full border border-gold/40 bg-card p-1 shadow-sm">
            {(["reverse", "nuzul", "mushaf"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cn(
                  "px-3 py-1 text-xs font-semibold rounded-full transition-all",
                  mode === m
                    ? "bg-emerald-gradient text-gold shadow-gold"
                    : "text-muted-foreground",
                )}
              >
                {tr(m)}
              </button>
            ))}
          </div>
          <div className="inline-flex rounded-full border border-gold/40 bg-card p-1 shadow-sm">
            {(["all", "meccan", "medinan"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={cn(
                  "px-3 py-1 text-xs font-semibold rounded-full transition-all",
                  typeFilter === t
                    ? "bg-emerald-gradient text-gold shadow-gold"
                    : "text-muted-foreground",
                )}
              >
                {tr(t)}
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder={tr("search_surah")}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-8 h-8 text-xs border-gold/40"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-1 justify-center">
          <button
            onClick={() => setLetter("")}
            className={cn(
              "px-2.5 py-1 text-xs font-semibold rounded-full transition-all",
              !letter
                ? "bg-emerald-gradient text-gold shadow-gold"
                : "text-muted-foreground bg-card border border-border",
            )}
          >
            {lang === "en" ? "All" : "تمام"}
          </button>
          {letters.map((l) => (
            <button
              key={l}
              onClick={() => setLetter(l)}
              className={cn(
                "w-7 h-7 text-xs font-bold rounded-full transition-all",
                letter === l
                  ? "bg-emerald-gradient text-gold shadow-gold"
                  : "text-muted-foreground bg-card border border-border hover:border-gold/40",
              )}
            >
              {l}
            </button>
          ))}
        </div>

        <div className="mt-4 text-xs text-muted-foreground text-center">
          {sorted.length} / 114 {lang === "en" ? "surahs" : "سورتیں"}
        </div>
        <div className="mt-1.5 text-xs text-gold/70 text-center">{tr("explorer_hint")}</div>

        <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-2">
          {sorted.map((s) => (
            <button
              key={s.n}
              type="button"
              onClick={() => onOpenSurah(s.n)}
              aria-label={`${tr("read_surah")} ${s.en}`}
              className={cn(
                "group text-left rounded-xl border p-2.5 hover:border-gold hover:shadow-gold hover:-translate-y-0.5 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60",
                s.type === "meccan"
                  ? "bg-gold/10 dark:bg-gold/20 border-gold/20"
                  : "bg-primary/10 dark:bg-primary/20 border-primary/20",
              )}
            >
              <div className="flex items-start justify-between">
                <span className="text-[9px] font-mono text-gold/70">
                  {mode === "nuzul" ? `#${s.nuzul}` : `#${s.n}`}
                </span>
                <span
                  className={cn(
                    "text-[9px] px-1.5 py-0.5 rounded-full border leading-none",
                    s.type === "meccan"
                      ? "border-gold/40 text-gold/70"
                      : "border-primary/30 text-primary/70",
                  )}
                >
                  {s.type === "meccan" ? "مکی" : "مدنی"}
                </span>
              </div>
              <div className="mt-1.5 font-serif-display text-xs font-semibold leading-snug break-words group-hover:text-gold transition-colors">
                {s.en}
              </div>
              <div
                className="text-sm mt-0.5 leading-snug"
                style={{ fontFamily: "var(--font-arabic)" }}
              >
                {s.ar}
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">
                  {s.verses} {tr("verses")}
                </span>
                <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-gold opacity-0 group-hover:opacity-100 transition-opacity">
                  <BookOpen className="h-3 w-3" />
                  {tr("read_surah")}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
