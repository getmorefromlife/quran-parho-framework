import { BookOpen, ExternalLink, Globe } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { Badge } from "@/components/ui/badge";

export function TafseerResources() {
  const { tr } = useLang();
  const groups = [
    {
      label: "Multilingual",
      links: [
        { name: "iNoor Quran Portal", url: "https://quran.inoor.ir" },
        { name: "Al-Islam.org", url: "https://www.al-islam.org" },
      ],
    },
    {
      label: "English",
      links: [
        { name: "AlMizan.org", url: "https://www.almizan.org" },
        { name: "ShiaVault", url: "https://www.shiavault.com" },
      ],
    },
    {
      label: "Persian",
      links: [
        { name: "iNoor Chat Tafseer", url: "https://quran.inoor.ir/fa/chattotafsir" },
        { name: "Hawzah.net", url: "https://www.hawzah.net" },
        { name: "Makarem.ir", url: "https://www.makarem.ir" },
      ],
    },
    {
      label: "اردو",
      links: [
        { name: "Balaghul Quran", url: "https://www.balaghulquran.com/tafseer.php" },
        { name: "Tafseer-e-Namoona", url: "https://www.tafseerenamoona.net" },
        { name: "Ziaraat.com", url: "https://www.ziaraat.com" },
        { name: "ShiaAudios (Tafseer Audios)", url: "https://www.shiaaudios.com" },
      ],
    },
  ];

  return (
    <section id="tafseer" className="py-20 lg:py-28 bg-card/40 border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto">
          <Badge className="bg-gold/20 text-gold border-gold/40 px-3">
            <BookOpen className="h-3 w-3" /> {tr("tafseer_badge")}
          </Badge>
          <h2 className="mt-4 text-3xl sm:text-4xl font-bold">{tr("tafseer_title")}</h2>
          <p className="mt-3 text-muted-foreground">{tr("tafseer_sub")}</p>
        </div>

        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {groups.map((g) => (
            <div
              key={g.label}
              className="rounded-2xl bg-card border border-border p-6 hover:border-gold/60 hover:shadow-elegant transition-all"
            >
              <div className="flex items-center gap-2 mb-4">
                <Globe className="h-4 w-4 text-gold" />
                <span className="text-xs uppercase tracking-widest text-gold font-semibold">
                  {g.label}
                </span>
              </div>
              <ul className="space-y-3">
                {g.links.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group/link flex items-start gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ExternalLink className="h-3.5 w-3.5 mt-0.5 shrink-0 opacity-60 group-hover/link:opacity-100" />
                      <span>{link.name}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
