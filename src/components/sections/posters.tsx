import { Download, ExternalLink } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { Badge } from "@/components/ui/badge";

export function Posters() {
  const { tr, lang } = useLang();
  const posters = [
    {
      src: "/Quran Parho - English Poster.png",
      label: lang === "en" ? "English Poster" : "انگریزی پوسٹر",
    },
    {
      src: "/Quran Parho - Urdu Poster.png",
      label: lang === "en" ? "Urdu Poster" : "اردو پوسٹر",
    },
  ];

  return (
    <section id="posters" className="py-20 lg:py-28 border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto">
          <Badge className="bg-gold/20 text-gold border-gold/40">
            <Download className="h-3 w-3" /> {tr("posters_badge")}
          </Badge>
          <h2 className="mt-4 text-3xl sm:text-4xl font-bold">{tr("posters_title")}</h2>
          <p className="mt-3 text-muted-foreground">{tr("posters_sub")}</p>
        </div>

        <div className="mt-12 grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {posters.map((p) => (
            <div
              key={p.label}
              className="group rounded-3xl overflow-hidden border border-border bg-card hover:border-gold/60 hover:shadow-elegant transition-all"
            >
              <a href={p.src} target="_blank" rel="noopener noreferrer">
                <div className="bg-muted relative overflow-hidden">
                  <img
                    src={p.src}
                    alt={p.label}
                    className="w-full h-auto object-contain group-hover:scale-[1.02] transition-transform duration-500"
                  />
                </div>
              </a>
              <div className="flex items-center justify-between px-6 py-5">
                <span className="text-lg font-semibold">{p.label}</span>
                <div className="flex items-center gap-2">
                  <a
                    href={p.src}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 px-3.5 py-1.5 text-xs font-semibold text-gold hover:bg-gold/10 transition-all"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    {tr("posters_open")}
                  </a>
                  <a
                    href={p.src}
                    download
                    className="inline-flex items-center gap-1.5 rounded-full bg-emerald-gradient px-3.5 py-1.5 text-xs font-semibold text-gold hover:opacity-90 transition-all"
                  >
                    <Download className="h-3.5 w-3.5" />
                    {tr("posters_download")}
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
