import { useState } from "react";
import { Check, Clock, Copy, Download, Share2 } from "lucide-react";
import { useLang } from "@/lib/i18n";

export function Footer() {
  const { tr, lang } = useLang();
  const [copied, setCopied] = useState(false);
  const SITE_URL = "https://quran-parho.vercel.app";
  const shareMsg = tr("share_msg");
  const shareText = encodeURIComponent(`${shareMsg} ${SITE_URL}`);
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(SITE_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* noop */
    }
  };
  return (
    <footer className="border-t border-border bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid md:grid-cols-[1.5fr_1fr_1fr] gap-10">
          <div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-card/60 grid place-items-center ring-1 ring-gold/20 shadow-gold">
                <img
                  src="/logo.png"
                  alt="Qurʼān Parho"
                  className="h-9 w-9 object-contain"
                  loading="lazy"
                />
              </div>
              <div className="font-serif-display text-lg">Qurʼān Parho Framework</div>
            </div>
            <p className="mt-4 text-sm text-muted-foreground max-w-md">
              {tr("footer_attribution")}
            </p>
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest text-gold">
              {lang === "en" ? "Blueprint" : "خاکہ"}
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <a
                href="/quran_parho_framework_2025.pdf"
                download
                className="flex items-center gap-2 hover:text-gold transition-colors"
              >
                <Download className="h-4 w-4" /> {tr("footer_pdf")}
              </a>
              <a href="#cycles" className="block hover:text-gold transition-colors">
                {tr("nav_cycles")}
              </a>
              <a href="#kit" className="block hover:text-gold transition-colors">
                {tr("nav_kit")}
              </a>
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest text-gold">{tr("footer_share")}</div>
            <div className="mt-4 flex gap-2">
              <a
                href={`https://wa.me/?text=${shareText}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={tr("social_wa")}
                className="h-9 w-9 rounded-full border border-gold/40 grid place-items-center text-xs font-bold hover:bg-emerald-gradient hover:text-gold transition-all"
              >
                W
              </a>
              <a
                href={`https://t.me/share/url?url=${encodeURIComponent(SITE_URL)}&text=${encodeURIComponent(shareMsg)}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={tr("social_tg")}
                className="h-9 w-9 rounded-full border border-gold/40 grid place-items-center text-xs font-bold hover:bg-emerald-gradient hover:text-gold transition-all"
              >
                T
              </a>
              <a
                href={`https://twitter.com/intent/tweet?text=${shareText}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={tr("social_x")}
                className="h-9 w-9 rounded-full border border-gold/40 grid place-items-center text-xs font-bold hover:bg-emerald-gradient hover:text-gold transition-all"
              >
                X
              </a>
              <button
                onClick={copyLink}
                aria-label={tr("copy_link")}
                className="h-9 w-9 rounded-full border border-gold/40 grid place-items-center hover:bg-emerald-gradient hover:text-gold transition-all"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
            <button
              onClick={copyLink}
              className="mt-6 inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-gold transition-colors"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}{" "}
              {copied ? tr("link_copied") : tr("copy_link")}
            </button>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-border flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} Qurʼān Parho Framework Portal</span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />{" "}
            {lang === "en" ? "Built for lifelong circles" : "تاحیات حلقوں کے لیے"}
          </span>
        </div>
      </div>
    </footer>
  );
}
