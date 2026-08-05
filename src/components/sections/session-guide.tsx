import { MessageCircle, Play, Share2, Sparkles, Timer, Users } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SessionGuide({
  lang,
  split,
  onSplitChange,
  onNavigate,
}: {
  lang: string;
  split: { reading: number; discussion: number } | null;
  onSplitChange: (s: { reading: number; discussion: number }) => void;
  onNavigate: (tabIdx: number) => void;
}) {
  const { tr } = useLang();
  const options = [
    { reading: 50, label: "50/50" },
    { reading: 60, label: "60/40" },
    { reading: 70, label: "70/30" },
  ];
  const active = options.find((o) => o.reading === split?.reading) ?? options[0];
  const disc = 100 - active.reading;
  const readMin = Math.round((active.reading / 100) * 60);
  const discMin = 60 - readMin;

  const steps = [
    {
      icon: Timer,
      tab: 0,
      title: tr("guide_s1_t"),
      desc: tr("guide_s1_d"),
      tip: tr("guide_s1_tip"),
      cta: tr("guide_s1_cta"),
    },
    {
      icon: Users,
      tab: 1,
      title: tr("guide_s2_t"),
      desc: tr("guide_s2_d"),
      tip: tr("guide_s2_tip"),
      cta: tr("guide_s2_cta"),
    },
    {
      icon: MessageCircle,
      tab: 2,
      title: tr("guide_s3_t"),
      desc: tr("guide_s3_d"),
      tip: tr("guide_s3_tip"),
      cta: tr("guide_s3_cta"),
    },
    {
      icon: Sparkles,
      tab: 3,
      title: tr("guide_s4_t"),
      desc: tr("guide_s4_d"),
      tip: tr("guide_s4_tip"),
      cta: tr("guide_s4_cta"),
    },
    {
      icon: Share2,
      tab: 0,
      title: tr("guide_s5_t"),
      desc: tr("guide_s5_d"),
      tip: tr("guide_s5_tip"),
      cta: tr("guide_s5_cta"),
    },
  ];

  return (
    <section id="guide" className="py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto">
          <Badge className="bg-emerald-deep/10 text-emerald-deep border-emerald-deep/30 px-3">
            <Play className="h-3.5 w-3.5" /> {lang === "en" ? "Session Guide" : "نشست کا طریقہ"}
          </Badge>
          <h2 className="mt-4 text-3xl sm:text-4xl font-bold">{tr("guide_title")}</h2>
          <p className="mt-3 text-muted-foreground">{tr("guide_sub")}</p>
        </div>

        {/* Split selector */}
        <div className="mt-8 rounded-3xl bg-card border border-border shadow-elegant p-6 sm:p-8">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-gold font-semibold">
              <Timer className="h-4 w-4" /> {tr("guide_split_label")}
            </div>
            <div className="inline-flex rounded-full border border-gold/40 bg-background p-1">
              {options.map((o) => (
                <button
                  key={o.reading}
                  onClick={() => onSplitChange({ reading: o.reading, discussion: 100 - o.reading })}
                  className={cn(
                    "px-4 py-1.5 text-sm font-semibold rounded-full transition-all",
                    active.reading === o.reading
                      ? "bg-emerald-gradient text-gold shadow-gold"
                      : "text-muted-foreground",
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>
            <div className="w-full max-w-md rounded-full overflow-hidden border border-border bg-muted h-10 flex">
              <div
                className="bg-emerald-gradient flex items-center justify-center text-xs font-semibold text-gold uppercase tracking-widest"
                style={{ width: `${active.reading}%` }}
              >
                {lang === "en" ? "Read" : "ترجمہ"} · {active.reading}%
              </div>
              <div className="bg-gold-gradient flex items-center justify-center text-xs font-semibold text-emerald-deep uppercase tracking-widest flex-1">
                {lang === "en" ? "Discuss" : "مباحثہ"} · {disc}%
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              {tr("guide_model")}:{" "}
              <span className="font-semibold text-emerald-deep">
                {readMin} {tr("guide_min_read")}
              </span>{" "}
              ·{" "}
              <span className="font-semibold text-gold">
                {discMin} {tr("guide_min_discuss")}
              </span>
            </div>
          </div>
        </div>

        {/* Step cards */}
        <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <div
                key={i}
                className={cn(
                  "rounded-3xl bg-card border border-border shadow-elegant p-6 flex flex-col",
                  i === 4 && "sm:col-span-2 lg:col-span-1",
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-emerald-gradient text-gold font-bold shrink-0">
                    {i + 1}
                  </div>
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-gradient/20 text-emerald-deep shrink-0">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <h3 className="mt-4 text-base font-bold">
                  {i === 1
                    ? `${s.title} · ${active.reading}%`
                    : i === 3
                      ? `${s.title} · ${disc}%`
                      : s.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground flex-1">{s.desc}</p>
                <div className="mt-4 rounded-xl bg-gold/10 border border-gold/20 px-3 py-2 text-xs flex items-start gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-gold shrink-0 mt-0.5" />
                  <span>{s.tip}</span>
                </div>
                <Button
                  onClick={() => onNavigate(s.tab)}
                  className="mt-4 bg-emerald-gradient text-gold border border-gold/40"
                >
                  {s.cta}
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
