import { Maximize2, Palette, Play, Search, Settings2, Share2 } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function HowToGuide() {
  const { tr, lang } = useLang();

  const steps = [
    {
      icon: Maximize2,
      titleKey: "howto_s1_t" as const,
      descKey: "howto_s1_d" as const,
      color: "text-emerald-500",
    },
    {
      icon: Play,
      titleKey: "howto_s2_t" as const,
      descKey: "howto_s2_d" as const,
      color: "text-sky-500",
    },
    {
      icon: Search,
      titleKey: "howto_s3_t" as const,
      descKey: "howto_s3_d" as const,
      color: "text-violet-500",
    },
    {
      icon: Palette,
      titleKey: "howto_s4_t" as const,
      descKey: "howto_s4_d" as const,
      color: "text-pink-500",
    },
    {
      icon: Share2,
      titleKey: "howto_s5_t" as const,
      descKey: "howto_s5_d" as const,
      color: "text-gold",
    },
  ];

  return (
    <section id="howto" className="py-16 sm:py-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <Badge
            variant="outline"
            className={cn("border-gold/30 text-gold mb-4", lang === "ur" && "mb-7")}
          >
            {lang === "en" ? "Quick Guide" : "مختصر رہنما"}
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">{tr("howto_title")}</h2>
          <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">{tr("howto_sub")}</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <div
                key={i}
                className="relative rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-elegant transition-shadow group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-xl bg-background border border-border",
                      s.color,
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-bold text-muted-foreground/50">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="text-base font-semibold text-foreground mb-2">{tr(s.titleKey)}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{tr(s.descKey)}</p>
              </div>
            );
          })}

          {/* Settings tip card */}
          <div className="relative rounded-2xl border border-gold/20 bg-gold/5 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10 border border-gold/30 text-gold">
                <Settings2 className="h-5 w-5" />
              </div>
              <span className="text-xs font-bold text-gold/60">TIP</span>
            </div>
            <h3 className="text-base font-semibold text-foreground mb-2">{tr("howto_settings")}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {tr("howto_settings_d")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
