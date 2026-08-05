import { BookOpen, Infinity as InfinityIcon, MessageCircle, Users } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function Philosophy() {
  const { tr, lang } = useLang();
  const items = [
    { i: Users, t: "p1_t", d: "p1_d" },
    { i: BookOpen, t: "p2_t", d: "p2_d" },
    { i: MessageCircle, t: "p3_t", d: "p3_d" },
    { i: InfinityIcon, t: "p4_t", d: "p4_d" },
  ] as const;

  return (
    <section id="about" className="py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Attribution banner */}
        <div className="mx-auto max-w-3xl rounded-2xl bg-emerald-gradient text-gold border border-gold/40 shadow-elegant p-6 sm:p-8 text-center">
          <div className="text-[10px] uppercase tracking-[0.3em] opacity-80">Framework by</div>
          <div className="mt-2 font-serif-display text-2xl sm:text-3xl">
            Maulana Syed Imon Rizvi
          </div>
          <div className="mt-1 text-lg opacity-90" style={{ fontFamily: "var(--font-urdu)" }}>
            مولانا سیّد آئمن رضوی
          </div>
        </div>

        <div className="mt-16 text-center max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold">{tr("philosophy_title")}</h2>
          <p className="mt-3 text-muted-foreground">{tr("philosophy_sub")}</p>
        </div>

        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {items.map(({ i: Icon, t, d }, idx) => (
            <div
              key={t}
              className="group relative rounded-2xl bg-card border border-border p-6 hover:border-gold/60 hover:shadow-elegant transition-all"
            >
              <div className="absolute top-4 right-4 text-[10px] font-mono text-gold/60">
                0{idx + 1}
              </div>
              <div className="h-11 w-11 rounded-xl bg-emerald-gradient grid place-items-center shadow-gold">
                <Icon className="h-5 w-5 text-gold" strokeWidth={2} />
              </div>
              <h3 className={cn("mt-5 text-lg font-bold", lang === "ur" && "text-xl")}>{tr(t)}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{tr(d)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
