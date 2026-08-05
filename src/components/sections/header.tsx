import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { useLang, t as dict } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function Header() {
  const { tr, lang, setLang } = useLang();
  const [dark, setDark] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    try {
      localStorage.setItem("qp_dark", dark ? "1" : "0");
    } catch {
      /* noop */
    }
  }, [dark]);
  useEffect(() => {
    try {
      setDark(localStorage.getItem("qp_dark") === "1");
    } catch {
      /* noop */
    }
  }, []);

  const links: (keyof typeof dict)[] = [
    "nav_about",
    "nav_cycles",
    "nav_explorer",
    "nav_themes",
    "nav_share",
    "nav_guide",
    "nav_kit",
    "nav_ai",
    "nav_tools",
  ];
  const anchors = ["about", "cycles", "explorer", "themes", "share", "guide", "kit", "ai", "tools"];

  return (
    <>
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/70 border-b border-border/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 grid grid-cols-[1fr_auto] items-center gap-3">
          <a href="#top" className="flex items-center gap-3 overflow-hidden">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-card/60 ring-1 ring-gold/20 shadow-gold">
              <img
                src="/logo.png"
                alt="Qurʼān Parho"
                className="h-9 w-9 object-contain"
                loading="eager"
              />
            </div>
            <div className="min-w-0">
              <div
                className={cn(
                  "truncate font-semibold text-sm sm:text-base tracking-tight",
                  lang === "ur" && "leading-relaxed pt-1",
                )}
              >
                {lang === "en" ? "Qurʼān Parho Framework" : "قرآن پڑھو فریم ورک"}
              </div>
              <div className="truncate text-[10px] uppercase tracking-widest text-gold">
                Neighborhood Blueprint
              </div>
            </div>
          </a>

          <div className="flex items-center gap-1.5">
            <nav className="hidden lg:flex items-center gap-1.5 pr-2">
              {links.map((k, i) => {
                const isFeatured = anchors[i] === "explorer" || anchors[i] === "tools";
                return (
                  <a
                    key={k}
                    href={`#${anchors[i]}`}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-sm transition-all font-medium",
                      isFeatured
                        ? "bg-gold/15 text-gold border border-gold/40 hover:bg-gold/25 font-semibold shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted",
                    )}
                  >
                    {tr(k)}
                  </a>
                );
              })}
            </nav>

            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="lg:hidden inline-flex items-center gap-1.5 px-3 py-2 rounded-full border border-gold/40 bg-card hover:bg-muted transition-colors text-xs font-semibold text-gold shrink-0"
              aria-label="Menu"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              {lang === "en" ? "Menu" : "مینیو"}
            </button>

            <div className="flex items-center rounded-full border border-gold/40 bg-card p-0.5 shadow-sm shrink-0">
              <button
                onClick={() => setLang("en")}
                className={cn(
                  "px-3 py-1 text-xs font-semibold rounded-full transition-all",
                  lang === "en"
                    ? "bg-emerald-gradient text-gold shadow-gold"
                    : "text-muted-foreground",
                )}
              >
                EN
              </button>
              <button
                onClick={() => setLang("ur")}
                className={cn(
                  "px-3 py-1 text-xs font-semibold rounded-full transition-all",
                  lang === "ur"
                    ? "bg-emerald-gradient text-gold shadow-gold"
                    : "text-muted-foreground",
                )}
              >
                اردو
              </button>
            </div>

            <button
              onClick={() => setDark((v) => !v)}
              className="grid h-9 w-9 place-items-center rounded-full border border-border bg-card hover:bg-muted transition-colors shrink-0"
              aria-label="Toggle theme"
            >
              {dark ? <Sun className="h-4 w-4 text-gold" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Mobile nav pills — always visible, horizontally scrollable */}
        <div className="lg:hidden overflow-x-auto scrollbar-none border-t border-border/40">
          <div className="flex gap-1.5 px-4 py-2 min-w-max">
            {links.map((k, i) => {
              const isFeatured = anchors[i] === "explorer" || anchors[i] === "tools";
              return (
                <a
                  key={k}
                  href={`#${anchors[i]}`}
                  className={cn(
                    "shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors whitespace-nowrap",
                    isFeatured
                      ? "bg-gold/15 text-gold border-gold/50 shadow-gold"
                      : "border-border bg-card text-muted-foreground hover:text-foreground hover:border-gold/60",
                  )}
                >
                  {tr(k)}
                </a>
              );
            })}
          </div>
        </div>
      </header>

      {/* Mobile nav drawer — outside header to avoid backdrop-bleed */}
      <div
        className={cn(
          "fixed inset-0 z-60 transition-opacity duration-300",
          menuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        )}
      >
        <div className="absolute inset-0 bg-black/50" onClick={() => setMenuOpen(false)} />
        <div
          className={cn(
            "absolute top-0 left-0 bottom-0 w-80 bg-white dark:bg-card border-r border-border shadow-2xl transition-transform duration-300",
            menuOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex items-center justify-between p-5 border-b border-border">
            <span className="flex items-center gap-2.5 font-bold text-base text-foreground">
              <img
                src="/logo.png"
                alt="Qurʼān Parho"
                className="h-7 w-7 object-contain"
                loading="lazy"
              />
              {lang === "en" ? "Navigation" : "نیویگیشن"}
            </span>
            <button
              onClick={() => setMenuOpen(false)}
              className="grid h-8 w-8 place-items-center rounded-full hover:bg-gray-100 dark:hover:bg-muted transition-colors"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <nav className="p-5 space-y-1.5 overflow-y-auto">
            {links.map((k, i) => (
              <a
                key={k}
                href={`#${anchors[i]}`}
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-3.5 rounded-xl text-sm font-semibold text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-muted transition-colors"
              >
                {tr(k)}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </>
  );
}
