import { useState } from "react";
import { Check, Compass, Layers, ScrollText } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function Cycles() {
  const { tr, lang } = useLang();
  const [active, setActive] = useState(0);
  const cycles = [
    {
      icon: Compass,
      t: "cycle1_t",
      sub: "cycle1_sub",
      d: "cycle1_d",
      benefits:
        lang === "en"
          ? [
              "Immediate impact on daily Salah",
              "Short surahs build reading confidence",
              "Quick first-cycle completion",
            ]
          : ["نماز پر فوری اثر", "مختصر سورتیں اعتماد بناتی ہیں", "پہلا مرحلہ جلد مکمل"],
      pace:
        lang === "en"
          ? "Read several short surahs per week — for a long surah, 1–2 per week is ideal"
          : "مختصر سورتیں ہفتے میں کئی پڑھیں؛ طویل سورہ ہو تو ۱ تا ۲ فی ہفتہ بہتر",
      progress: 33,
    },
    {
      icon: ScrollText,
      t: "cycle2_t",
      sub: "cycle2_sub",
      d: "cycle2_d",
      benefits:
        lang === "en"
          ? [
              "Seerah context for every revelation",
              "Understand asbab-un-nuzul",
              "See the Prophetic mission unfold",
            ]
          : ["ہر آیت کا سیرت سے تعلق", "اسبابِ نزول کی سمجھ", "مشنِ نبوی کھلتا ہے"],
      pace:
        lang === "en"
          ? "Short surahs: several per week · long surahs: 1–2 per week"
          : "مختصر سورتیں: کئی فی ہفتہ · طویل سورتیں: ۱ تا ۲ فی ہفتہ",
      progress: 66,
    },
    {
      icon: Layers,
      t: "cycle3_t",
      sub: "cycle3_sub",
      d: "cycle3_d",
      benefits:
        lang === "en"
          ? [
              "Full thematic mastery",
              "Cross-references across surahs",
              "Prepares long-form teaching",
            ]
          : ["مکمل موضوعاتی مہارت", "سورتوں کے درمیان ربط", "طویل درس کی تیاری"],
      pace:
        lang === "en"
          ? "Short surahs: a few per week · long surahs: 1–2 per week, ruku by ruku"
          : "مختصر سورتیں: چند فی ہفتہ · طویل سورتیں: ۱ تا ۲ فی ہفتہ، رکوع بہ رکوع",
      progress: 100,
    },
  ] as const;

  const c = cycles[active];
  const Icon = c.icon;

  return (
    <section id="cycles" className="py-20 lg:py-28 bg-card/40 border-y border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto">
          <Badge className="bg-gold/20 text-gold border-gold/40 px-3">
            {lang === "en" ? "Interactive Roadmap" : "انٹرایکٹو نقشہ"}
          </Badge>
          <h2 className="mt-4 text-3xl sm:text-4xl font-bold">{tr("cycles_title")}</h2>
          <p className="mt-3 text-muted-foreground">{tr("cycles_sub")}</p>
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-2">
          {cycles.map((cy, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-semibold border transition-all",
                active === i
                  ? "bg-emerald-gradient text-gold border-gold shadow-gold"
                  : "bg-card border-border text-muted-foreground hover:border-gold/60",
              )}
            >
              {tr(cy.t)}
            </button>
          ))}
        </div>

        <div className="mt-10 grid lg:grid-cols-[1.2fr_1fr] gap-6">
          <div className="rounded-3xl bg-card border border-border p-8 shadow-elegant">
            <div className="flex items-start gap-4">
              <div className="h-14 w-14 rounded-2xl bg-emerald-gradient grid place-items-center shadow-gold shrink-0">
                <Icon className="h-7 w-7 text-gold" />
              </div>
              <div className="min-w-0">
                <div className="text-xs text-gold uppercase tracking-widest">{tr(c.sub)}</div>
                <h3 className="mt-1 text-2xl sm:text-3xl font-bold">{tr(c.t)}</h3>
              </div>
            </div>
            <p className="mt-6 text-muted-foreground leading-relaxed">{tr(c.d)}</p>

            <div className="mt-8">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{lang === "en" ? "Journey Progress" : "سفر کی پیش رفت"}</span>
                <span className="text-gold font-mono">{c.progress}%</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-gold-gradient transition-all duration-700"
                  style={{ width: `${c.progress}%` }}
                />
              </div>
              <div className="mt-3 flex justify-between text-[10px] text-muted-foreground uppercase tracking-wider">
                <span>Foundation</span>
                <span>Seerah</span>
                <span>Mastery</span>
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-2xl bg-card border border-border p-6">
              <div className="text-xs uppercase tracking-widest text-gold">{tr("benefits")}</div>
              <ul className="mt-4 space-y-3">
                {c.benefits.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl bg-emerald-gradient text-gold p-6 shadow-elegant border border-gold/30">
              <div className="text-xs uppercase tracking-widest opacity-80">{tr("pace")}</div>
              <div className="mt-2 text-lg font-semibold">{c.pace}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
