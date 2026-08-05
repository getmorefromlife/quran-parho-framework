import { useState, useMemo } from "react";
import { BookOpen, Search, Filter, Layers, Check, Sparkles, Disc } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  filterThemes,
  getThemeCategories,
  parseVerseSpecs,
  THEMES,
  type ThemeEntry,
  type Tradition,
} from "@/lib/themes";

type Props = {
  onOpenTheme: (theme: ThemeEntry, mode?: "playlist" | "project") => void;
};

export function ThematicLibrary({ onOpenTheme }: Props) {
  const { tr, lang } = useLang();
  const [selectedTradition, setSelectedTradition] = useState<Tradition | "all">("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const categories = useMemo(() => getThemeCategories(), []);

  const filteredThemes = useMemo(() => {
    return filterThemes({
      tradition: selectedTradition,
      category: selectedCategory,
      query: searchQuery,
      lang: lang as "en" | "ur",
    });
  }, [selectedTradition, selectedCategory, searchQuery, lang]);

  const traditionBadges: {
    key: Tradition | "all";
    labelKey: string;
    colorClass: string;
    activeClass: string;
  }[] = [
    {
      key: "all",
      labelKey: "themes_all",
      colorClass: "hover:border-gold/50",
      activeClass: "bg-gold text-foreground border-gold shadow-gold font-semibold",
    },
    {
      key: "shared",
      labelKey: "themes_shared",
      colorClass: "hover:border-emerald-500/50",
      activeClass:
        "bg-emerald-600 dark:bg-emerald-500 text-white border-emerald-500 shadow-md font-semibold",
    },
    {
      key: "shia",
      labelKey: "themes_shia",
      colorClass: "hover:border-indigo-500/50",
      activeClass:
        "bg-indigo-600 dark:bg-indigo-500 text-white border-indigo-500 shadow-md font-semibold",
    },
    {
      key: "sunni",
      labelKey: "themes_sunni",
      colorClass: "hover:border-amber-500/50",
      activeClass:
        "bg-amber-600 dark:bg-amber-500 text-white border-amber-500 shadow-md font-semibold",
    },
  ];

  return (
    <section
      id="themes"
      className="py-20 lg:py-28 bg-card/40 border-t border-border relative overflow-hidden"
    >
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-10 w-96 h-96 bg-gold/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-emerald-deep/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto">
          <Badge className="bg-gold/20 text-gold border-gold/40 px-3.5 py-1 text-xs shadow-gold inline-flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-gold" /> {tr("themes_badge")}
          </Badge>
          <h2 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-emerald-deep via-emerald-deep to-gold bg-clip-text text-transparent">
              {tr("themes_title")}
            </span>
          </h2>
          <p className="mt-3 text-muted-foreground text-sm sm:text-base leading-relaxed">
            {tr("themes_sub")}
          </p>
        </div>

        {/* Filter Controls */}
        <div className="mt-10 max-w-4xl mx-auto space-y-4">
          {/* Tradition Filter Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {traditionBadges.map((t) => {
              const isActive = selectedTradition === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setSelectedTradition(t.key)}
                  className={cn(
                    "px-4 py-2 rounded-full text-xs font-medium border transition-all duration-200 cursor-pointer flex items-center gap-1.5 backdrop-blur-sm",
                    isActive
                      ? t.activeClass
                      : cn("bg-card/70 border-border text-muted-foreground", t.colorClass),
                  )}
                >
                  {isActive && <Check className="h-3 w-3" />}
                  {tr(t.labelKey)}
                </button>
              );
            })}
          </div>

          {/* Search and Category Filter Bar */}
          <div className="grid sm:grid-cols-[1fr_220px] gap-3 bg-card border border-border p-2.5 rounded-2xl shadow-sm">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={tr("themes_search")}
                className="pl-10 h-10 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-sm"
              />
            </div>

            {/* Category Select */}
            <div className="relative border-t sm:border-t-0 sm:border-l border-border pt-2 sm:pt-0 sm:pl-3 flex items-center">
              <Filter className="h-4 w-4 text-muted-foreground ml-2 sm:ml-0 mr-2 shrink-0" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-transparent text-xs sm:text-sm font-medium focus:outline-none cursor-pointer py-1 text-foreground"
              >
                <option value="all" className="bg-card text-foreground">
                  {tr("themes_all_categories")} ({categories.length})
                </option>
                {categories.map((c) => (
                  <option key={c} value={c} className="bg-card text-foreground">
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Results Counter */}
        <div className="mt-6 flex items-center justify-between text-xs text-muted-foreground max-w-7xl mx-auto px-1">
          <span>
            {lang === "en"
              ? `Showing ${filteredThemes.length} of ${THEMES.length} themes`
              : `${THEMES.length} میں سے ${filteredThemes.length} موضوعات نمایاں`}
          </span>
          {(selectedTradition !== "all" || selectedCategory !== "all" || searchQuery) && (
            <button
              onClick={() => {
                setSelectedTradition("all");
                setSelectedCategory("all");
                setSearchQuery("");
              }}
              className="text-gold hover:underline font-medium cursor-pointer"
            >
              {lang === "en" ? "Clear Filters" : "فلٹرز ختم کریں"}
            </button>
          )}
        </div>

        {/* Theme Cards Grid */}
        {filteredThemes.length === 0 ? (
          <div className="mt-12 text-center py-16 bg-card/60 rounded-3xl border border-dashed border-border max-w-xl mx-auto">
            <Layers className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-60" />
            <h3 className="text-base font-semibold">
              {lang === "en" ? "No matching themes found" : "کوئی موضوع نہیں ملا"}
            </h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              {lang === "en"
                ? "Try adjusting your search query or tradition filter to see more results."
                : "مزید نتائج دیکھنے کے لیے تلاش کی عبارت یا فلٹر تبدیل کریں۔"}
            </p>
          </div>
        ) : (
          <div className="mt-8 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredThemes.map((theme) => {
              const isShia = theme.tradition === "shia";
              const isSunni = theme.tradition === "sunni";
              const isShared = theme.tradition === "shared";

              return (
                <div
                  key={theme.id}
                  className="group rounded-3xl bg-card border border-border/80 p-6 flex flex-col justify-between hover:border-gold/60 hover:shadow-elegant transition-all duration-300 relative overflow-hidden"
                >
                  {/* Top Subtle Gradient Stripe */}
                  <div
                    className={cn(
                      "absolute top-0 inset-x-0 h-1 transition-opacity opacity-70 group-hover:opacity-100",
                      isShared && "bg-gradient-to-r from-emerald-500 to-teal-400",
                      isShia && "bg-gradient-to-r from-indigo-500 to-purple-400",
                      isSunni && "bg-gradient-to-r from-amber-500 to-gold",
                    )}
                  />

                  <div>
                    {/* Header Badges */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-[11px] font-mono tracking-wider uppercase text-muted-foreground bg-muted/60 px-2.5 py-0.5 rounded-full border border-border/50">
                        {theme.category}
                      </span>
                      <span
                        className={cn(
                          "text-[10px] font-semibold tracking-wide uppercase px-2.5 py-0.5 rounded-full border",
                          isShared &&
                            "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
                          isShia &&
                            "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30",
                          isSunni &&
                            "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
                        )}
                      >
                        {isShared
                          ? tr("themes_shared")
                          : isShia
                            ? tr("themes_shia")
                            : tr("themes_sunni")}
                      </span>
                    </div>

                    {/* Arabic Title */}
                    <div className="font-arabic text-xl sm:text-2xl text-emerald-deep dark:text-gold text-right mb-1 leading-snug">
                      {theme.ar}
                    </div>

                    {/* English / Urdu Title */}
                    <h3 className="text-lg font-bold text-foreground group-hover:text-gold transition-colors">
                      {lang === "ur" ? theme.ur : theme.en}
                    </h3>

                    {/* Description */}
                    <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                      {lang === "ur" ? theme.desc_ur : theme.desc_en}
                    </p>

                    {/* Source Note Footnote */}
                    <div className="mt-3 text-[10px] text-muted-foreground/80 italic font-mono bg-muted/30 px-2.5 py-1 rounded-md border border-border/40 inline-block">
                      {theme.source_note}
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="mt-6 pt-4 border-t border-border/60 flex items-center justify-between gap-3">
                    {/* Verse references list preview */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[11px] font-semibold text-gold bg-gold/10 px-2.5 py-0.5 rounded-full border border-gold/20">
                          {parseVerseSpecs(theme.verses).length}{" "}
                          {lang === "en" ? "verses combined" : "آیات مجموعی"}
                        </span>
                      </div>
                      <div className="text-[10px] font-mono text-muted-foreground truncate">
                        {theme.verses.join(" · ")}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        onClick={() => onOpenTheme(theme, "playlist")}
                        size="sm"
                        className="bg-emerald-gradient hover:opacity-95 text-white shadow-gold text-xs px-3 py-1.5 h-8 gap-1 cursor-pointer rounded-xl font-semibold"
                        title={tr("themes_start_playlist")}
                      >
                        <Disc
                          className="h-3.5 w-3.5 text-gold animate-spin"
                          style={{ animationDuration: "6s" }}
                        />
                        <span>{lang === "en" ? "Play Playlist" : "پلے لسٹ"}</span>
                      </Button>
                      <Button
                        onClick={() => onOpenTheme(theme, "project")}
                        size="sm"
                        variant="outline"
                        className="border-border hover:border-gold/60 text-xs px-2.5 py-1.5 h-8 gap-1 cursor-pointer rounded-xl font-semibold"
                        title={lang === "en" ? "Open Combined Project" : "پروجیکٹ میں دیکھیں"}
                      >
                        <BookOpen className="h-3.5 w-3.5 text-gold" />
                        <span className="hidden sm:inline">
                          {lang === "en" ? "Project" : "پروجیکٹ"}
                        </span>
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
