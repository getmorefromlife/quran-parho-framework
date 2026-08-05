import { useEffect, useMemo, useState } from "react";
import { Check, Copy, Download, Maximize2, Search as SearchIcon, Share2 } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { SURAHS } from "@/lib/surahs";
import { loadSurah, type QVerse } from "@/lib/quran-data";
import { NumInput } from "@/components/num-input";
import { pill } from "@/components/pill";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export function ShareSurah({
  langs,
  onToggleLang,
  onOpenReader,
}: {
  langs: { ar: boolean; en: boolean; ur: boolean };
  onToggleLang: (which: "ar" | "en" | "ur") => void;
  onOpenReader: (n: number, rangeStart: number, rangeEnd: number) => void;
}) {
  const { tr, lang } = useLang();
  const { ar: showAr, en: showEn, ur: showUr } = langs;
  const [surahN, setSurahN] = useState(1);
  const [mode, setMode] = useState<"full" | "range">("full");
  const [from, setFrom] = useState(1);
  const [to, setTo] = useState(7);
  const [verses, setVerses] = useState<QVerse[] | null>(null);
  const [hasError, setHasError] = useState(false);
  const [copied, setCopied] = useState(false);

  const surah = SURAHS.find((s) => s.n === surahN) ?? SURAHS[0];
  const maxVerses = surah.verses;

  useEffect(() => {
    setFrom(1);
    setTo(maxVerses);
  }, [surahN, maxVerses]);

  useEffect(() => {
    let cancelled = false;
    setHasError(false);
    setVerses(null);
    loadSurah(surahN)
      .then((d) => {
        if (!cancelled) setVerses(d);
      })
      .catch(() => {
        if (!cancelled) setHasError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [surahN]);

  const start = Math.min(from, to);
  const end = Math.max(from, to);
  const rangeStart = mode === "full" ? 1 : start;
  const rangeEnd = mode === "full" ? maxVerses : end;

  const selected = useMemo(() => {
    if (!verses) return [];
    return verses.filter((v) => v.ayah >= rangeStart && v.ayah <= rangeEnd);
  }, [verses, rangeStart, rangeEnd]);

  const composed = useMemo(() => {
    const lines: string[] = [];
    lines.push(
      lang === "en"
        ? `Surah ${surah.en} (${surah.ar}) — verses ${rangeStart}–${rangeEnd}`
        : `سورۃ ${surah.en} (${surah.ar}) — آیات ${rangeStart}–${rangeEnd}`,
    );
    lines.push("");
    for (const v of selected) {
      lines.push(`[${v.surah}:${v.ayah}]`);
      if (showAr) lines.push(v.arabic);
      if (showEn) lines.push(v.english_qarai);
      if (showUr) lines.push(v.urdu_jawadi);
      lines.push("");
    }
    return lines.join("\n").trim();
  }, [selected, showAr, showEn, showUr, surah, rangeStart, rangeEnd, lang]);

  const copy = async () => {
    await navigator.clipboard.writeText(composed);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const downloadTxt = () => {
    const blob = new Blob([composed], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `surah-${surahN}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <section id="share" className="py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto">
          <Badge className="bg-gold/20 text-gold border-gold/40 px-3">
            <Share2 className="h-3 w-3" /> <span className="ml-1.5">{tr("share_badge")}</span>
          </Badge>
          <h2 className="mt-4 text-3xl sm:text-4xl font-bold">{tr("share_title")}</h2>
          <p className="mt-3 text-muted-foreground">{tr("share_sub")}</p>
        </div>

        <div className="mt-10 grid lg:grid-cols-[1fr_1.1fr] gap-6 items-start">
          {/* Controls */}
          <div className="rounded-3xl bg-card border border-border shadow-elegant p-5 sm:p-7 space-y-6">
            <div className="grid gap-2">
              <label className="text-sm text-muted-foreground">
                {lang === "en" ? "Choose a Surah" : "سورہ منتخب کریں"}
              </label>
              <Select value={String(surahN)} onValueChange={(v) => setSurahN(Number(v))}>
                <SelectTrigger className="border-gold/40 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {[...SURAHS]
                    .sort((a, b) => a.n - b.n)
                    .map((s) => (
                      <SelectItem key={s.n} value={String(s.n)}>
                        <span className="font-mono text-muted-foreground">#{s.n}</span> {s.en}{" "}
                        <span className="text-xs text-muted-foreground">{s.ar}</span>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <label className="text-sm text-muted-foreground">
                {lang === "en" ? "What to share" : "کیا شیئر کرنا ہے"}
              </label>
              <div className="inline-flex rounded-full border border-gold/40 bg-card p-1 shadow-sm w-max">
                {(["full", "range"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={cn(
                      "px-3 py-1.5 text-xs font-semibold rounded-full transition-all",
                      mode === m
                        ? "bg-emerald-gradient text-gold shadow-gold"
                        : "text-muted-foreground",
                    )}
                  >
                    {m === "full"
                      ? lang === "en"
                        ? "Complete Surah"
                        : "مکمل سورہ"
                      : lang === "en"
                        ? "Custom Verses"
                        : "منتخب آیات"}
                  </button>
                ))}
              </div>
            </div>

            {mode === "range" && (
              <div className="grid grid-cols-2 gap-3">
                <label className="grid gap-1.5 text-sm">
                  <span className="text-muted-foreground">{tr("from_verse")}</span>
                  <NumInput
                    value={from}
                    onChange={setFrom}
                    min={1}
                    max={maxVerses}
                    className="border-gold/40 h-10"
                  />
                </label>
                <label className="grid gap-1.5 text-sm">
                  <span className="text-muted-foreground">{tr("to_verse")}</span>
                  <NumInput
                    value={to}
                    onChange={setTo}
                    min={1}
                    max={maxVerses}
                    className="border-gold/40 h-10"
                  />
                </label>
              </div>
            )}

            <div className="grid gap-2">
              <label className="text-sm text-muted-foreground">
                {lang === "en" ? "Languages" : "زبانیں"}
              </label>
              <div className="flex flex-wrap gap-2">
                {pill(showAr, () => onToggleLang("ar"), lang === "en" ? "Arabic" : "عربی", "py-2")}
                {pill(
                  showEn,
                  () => onToggleLang("en"),
                  lang === "en" ? "English" : "انگریزی",
                  "py-2",
                )}
                {pill(showUr, () => onToggleLang("ur"), lang === "en" ? "Urdu" : "اردو", "py-2")}
              </div>
            </div>

            <div className="rounded-2xl bg-muted/60 border border-border px-4 py-3 text-sm text-muted-foreground">
              {lang === "en"
                ? `${surah.en} · ${selected.length} of ${maxVerses} verses selected`
                : `${surah.en} · ${selected.length} میں سے ${maxVerses} آیات منتخب`}
            </div>
          </div>

          {/* Preview + actions */}
          <div className="rounded-3xl bg-card border border-border shadow-elegant p-5 sm:p-7">
            <div className="flex items-center justify-between gap-2 mb-4">
              <h3 className="font-semibold text-base">
                {surah.en}{" "}
                <span style={{ fontFamily: "var(--font-arabic)" }} className="text-gold">
                  {surah.ar}
                </span>
              </h3>
              <span className="text-xs text-muted-foreground">
                {lang === "en" ? `v. ${rangeStart}–${rangeEnd}` : `آیات ${rangeStart}–${rangeEnd}`}
              </span>
            </div>

            <div className="max-h-96 overflow-y-auto rounded-2xl border border-border bg-background/60 p-4 space-y-5">
              {!verses ? (
                <div className="text-sm text-muted-foreground">
                  {hasError
                    ? lang === "en"
                      ? "Couldn't load this surah. Please try again."
                      : "یہ سورہ لوڈ نہیں ہو سکی۔ دوبارہ کوشش کریں۔"
                    : lang === "en"
                      ? "Loading verses…"
                      : "آیات لوڈ ہو رہی ہیں…"}
                </div>
              ) : (
                selected.map((v) => (
                  <div key={v.ayah} className="space-y-1.5">
                    <div className="text-[11px] font-mono text-gold/70">
                      [{v.surah}:{v.ayah}]
                    </div>
                    {showAr && (
                      <div
                        dir="rtl"
                        className="text-right text-lg leading-loose"
                        style={{ fontFamily: "var(--font-arabic)" }}
                      >
                        {v.arabic}
                      </div>
                    )}
                    {showEn && (
                      <div dir="ltr" className="text-sm leading-relaxed text-muted-foreground">
                        {v.english_qarai}
                      </div>
                    )}
                    {showUr && (
                      <div
                        dir="rtl"
                        className="text-right text-sm leading-relaxed text-muted-foreground"
                        style={{ fontFamily: "var(--font-urdu)" }}
                      >
                        {v.urdu_jawadi}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {composed.length > 3500 && (
              <div className="mt-3 text-xs text-amber-600 dark:text-amber-400">
                {lang === "en"
                  ? "This is longer than WhatsApp's 4096-character message limit — use Copy or Download instead."
                  : "یہ واٹس ایپ کے 4096 حروف کی حد سے زیادہ ہے — کاپی یا ڈاؤن لوڈ استعمال کریں۔"}
              </div>
            )}

            <Button
              size="lg"
              onClick={() => onOpenReader(surahN, rangeStart, rangeEnd)}
              className="mt-4 w-full border border-gold/40 bg-gold/10 text-gold hover:bg-gold/20"
            >
              <Maximize2 className="h-4 w-4" />
              {tr("open_reader")}
            </Button>

            <div className="mt-3 flex flex-wrap gap-2.5">
              <Button
                size="lg"
                onClick={copy}
                className="bg-emerald-gradient text-gold shadow-elegant hover:opacity-90 border border-gold/30"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? tr("copied") : lang === "en" ? "Copy Text" : "متن کاپی کریں"}
              </Button>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(composed)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  size="lg"
                  variant="outline"
                  className="border-gold text-foreground hover:bg-gold/10"
                >
                  <Share2 className="h-4 w-4" />
                  {lang === "en" ? "WhatsApp" : "واٹس ایپ"}
                </Button>
              </a>
              <Button
                size="lg"
                variant="outline"
                onClick={downloadTxt}
                className="border-border hover:bg-muted"
              >
                <Download className="h-4 w-4" />
                {lang === "en" ? "Download .txt" : "ڈاؤن لوڈ"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
