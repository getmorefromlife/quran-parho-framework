import { Download } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { Badge } from "@/components/ui/badge";

export function Posters() {
  const { lang } = useLang();
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
            <Download className="h-3 w-3" /> {lang === "en" ? "Posters" : "پوسٹرز"}
          </Badge>
          <h2 className="mt-4 text-3xl sm:text-4xl font-bold">
            {lang === "en" ? "Download & Share" : "ڈاؤن لوڈ اور شیئر کریں"}
          </h2>
          <p className="mt-3 text-muted-foreground">
            {lang === "en"
              ? "Print-ready posters to promote your Qurʼān Parho circle in the neighborhood."
              : "اپنے قرآن پڑھو حلقہ کو محلے میں فروغ دینے کے لیے پوسٹرز"}
          </p>
        </div>

        <div className="mt-12 grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {posters.map((p) => (
            <a
              key={p.label}
              href={p.src}
              target="_blank"
              rel="noopener noreferrer"
              className="group rounded-3xl overflow-hidden border border-border bg-card hover:border-gold/60 hover:shadow-elegant transition-all"
            >
              <div className="bg-muted relative overflow-hidden">
                <img
                  src={p.src}
                  alt={p.label}
                  className="w-full h-auto object-contain group-hover:scale-[1.02] transition-transform duration-500"
                />
              </div>
              <div className="flex items-center justify-between px-6 py-5">
                <span className="text-lg font-semibold">{p.label}</span>
                <div className="flex items-center gap-2 text-sm text-gold font-semibold">
                  <Download className="h-4 w-4" />
                  {lang === "en" ? "Open" : "کھولیں"}
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
