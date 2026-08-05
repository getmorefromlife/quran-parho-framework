import { ArrowRight, BookOpen, Maximize2, Sparkles, Star } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Hero() {
  const { tr, lang } = useLang();
  return (
    <section
      id="top"
      className="relative overflow-hidden min-h-[calc(100vh-80px)] flex items-center"
    >
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 14 }).map((_, i) => (
          <span
            key={i}
            className="particle absolute h-1.5 w-1.5 rounded-full bg-gold/60"
            style={{
              top: `${(i * 37) % 100}%`,
              left: `${(i * 53) % 100}%`,
              animationDelay: `${i * 0.4}s`,
              filter: "blur(0.5px)",
            }}
          />
        ))}
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 lg:py-12 w-full grid lg:grid-cols-[1.15fr_1fr] gap-8 lg:gap-12 items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/50 bg-card/70 px-3.5 py-1 shadow-gold">
            <Star className="h-3.5 w-3.5 text-gold" fill="currentColor" />
            <span className="text-[11px] sm:text-xs font-medium tracking-wide">
              {tr("hero_badge")}
            </span>
          </div>
          <h1 className="mt-5 sm:mt-6 text-3xl sm:text-4xl lg:text-5xl font-bold leading-[1.1]">
            <span className="bg-gradient-to-br from-emerald-deep via-emerald-deep to-gold bg-clip-text text-transparent">
              {tr("hero_title")}
            </span>
          </h1>
          <p className="mt-4 text-sm sm:text-base text-muted-foreground max-w-2xl leading-relaxed">
            {tr("hero_sub")}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="#cycles">
              <Button
                size="lg"
                className="bg-emerald-gradient text-gold shadow-elegant hover:opacity-90 border border-gold/30"
              >
                {tr("cta_explore")}
                <ArrowRight className={cn("h-4 w-4", lang === "ur" && "rotate-180")} />
              </Button>
            </a>
            <a href="#kit">
              <Button
                size="lg"
                variant="outline"
                className="border-gold text-foreground hover:bg-gold/10"
              >
                {tr("cta_launch")}
              </Button>
            </a>
            <a href="#share">
              <Button
                size="lg"
                variant="outline"
                className="border-gold/40 bg-gold/10 text-gold hover:bg-gold/20"
              >
                <Maximize2 className="h-4 w-4" />
                {tr("open_reader")}
              </Button>
            </a>
          </div>

          <div className="mt-8 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex -space-x-2">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-7 w-7 rounded-full bg-emerald-gradient border-2 border-background grid place-items-center text-gold text-[10px] font-bold"
                >
                  {["ن", "ق", "ح", "م"][i]}
                </div>
              ))}
            </div>
            <span>
              {lang === "en" ? "Circles running across neighborhoods" : "محلوں میں جاری حلقے"}
            </span>
          </div>
        </div>

        {/* Glassmorphism book card */}
        <div className="relative">
          <div className="absolute -inset-6 bg-gold/20 blur-3xl rounded-full" />
          <div className="relative rounded-3xl border border-gold/40 bg-card/60 backdrop-blur-xl p-5 sm:p-6 shadow-elegant glow-pulse max-w-md mx-auto lg:max-w-none">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-[0.2em] text-gold">Blueprint</span>
              <Sparkles className="h-4 w-4 text-gold" />
            </div>

            <div className="mt-3 aspect-[16/9] w-full rounded-2xl relative overflow-hidden border border-gold/30 shadow-gold bg-[#0c4b33] grid place-items-center">
              <img
                src="/hero-banner.png"
                alt="Qurʼān Parho - Iqra Bismi Rabbika"
                className="h-full w-full object-contain rounded-2xl"
              />
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              {[
                { l: "Cycles", v: "3" },
                { l: "Verses/turn", v: "5" },
                { l: "Q&A", v: "<2m" },
              ].map((s) => (
                <div key={s.l} className="rounded-xl border border-border bg-background/60 p-2.5">
                  <div className="font-serif-display text-xl text-gold">{s.v}</div>
                  <div className="text-[9px] uppercase tracking-wider text-muted-foreground">
                    {s.l}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
