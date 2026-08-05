import { useRef, useState } from "react";
import { Bot, Check, Copy, Image as ImageIcon, ListChecks, Map as MapIcon } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AILab() {
  const { tr, lang } = useLang();
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const copyTimerRef = useRef<number | null>(null);
  const items = [
    { i: MapIcon, t: "ai1_t", d: "ai1_d", p: "ai1_p", tag: "NotebookLM" },
    { i: ListChecks, t: "ai2_t", d: "ai2_d", p: "ai2_p", tag: "ChatGPT" },
    { i: ImageIcon, t: "ai3_t", d: "ai3_d", p: "ai3_p", tag: "Canva" },
  ] as const;

  const copyPrompt = (idx: number) => {
    const prompt = tr(items[idx].p);
    navigator.clipboard.writeText(prompt).catch(() => {});
    setCopiedIdx(idx);
    if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current);
    copyTimerRef.current = window.setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <section id="ai" className="py-20 lg:py-28 bg-card/40 border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto">
          <Badge className="bg-gold/20 text-gold border-gold/40 px-3">
            <Bot className="h-3 w-3" /> {lang === "en" ? "Creative Showcase" : "تخلیقی نمونہ"}
          </Badge>
          <h2 className="mt-4 text-3xl sm:text-4xl font-bold">{tr("ai_title")}</h2>
          <p className="mt-3 text-muted-foreground">{tr("ai_sub")}</p>
        </div>

        <div className="mt-12 grid md:grid-cols-3 gap-5">
          {items.map(({ i: Icon, t, d, p, tag }, idx) => (
            <div
              key={t}
              className="group rounded-3xl bg-card border border-border p-6 hover:border-gold hover:shadow-elegant transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="h-11 w-11 rounded-xl bg-emerald-gradient grid place-items-center shadow-gold">
                  <Icon className="h-5 w-5 text-gold" />
                </div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-gold border border-gold/40 rounded-full px-2 py-0.5">
                  {tag}
                </span>
              </div>
              <h3 className="mt-5 text-lg font-bold">{tr(t)}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{tr(d)}</p>
              <div className="mt-5">
                <textarea
                  readOnly
                  dir="auto"
                  value={tr(p)}
                  rows={7}
                  onFocus={(e) => e.target.select()}
                  className="w-full p-3 rounded-xl bg-background border border-border text-xs leading-relaxed resize-none focus:border-gold/60 outline-none"
                />
                <Button
                  onClick={() => copyPrompt(idx)}
                  variant="outline"
                  className={cn(
                    "mt-2 w-full h-9 text-xs sm:text-xs border-gold/40",
                    copiedIdx === idx && "bg-emerald-gradient text-gold",
                  )}
                >
                  {copiedIdx === idx ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  {copiedIdx === idx ? tr("ai_copied") : tr("ai_copy")}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
