import rawThemes from "@/data/themes.json";

export type Tradition = "shared" | "sunni" | "shia";

export type ThemeEntry = {
  id: string;
  tradition: Tradition;
  category: string;
  en: string;
  ur: string;
  ar: string;
  desc_en: string;
  desc_ur: string;
  source_note: string;
  verses: string[]; // Format: "surah:ayah" e.g. "2:153"
};

export const THEMES: ThemeEntry[] = rawThemes as ThemeEntry[];

/**
 * Extract list of unique categories from dataset
 */
export function getThemeCategories(): string[] {
  const set = new Set<string>();
  THEMES.forEach((t) => set.add(t.category));
  return Array.from(set);
}

/**
 * Filter themes by tradition, category, and search query
 */
export function filterThemes(options: {
  tradition?: Tradition | "all";
  category?: string | "all";
  query?: string;
  lang?: "en" | "ur";
}): ThemeEntry[] {
  const { tradition = "all", category = "all", query = "", lang = "en" } = options;
  const q = query.trim().toLowerCase();

  return THEMES.filter((item) => {
    // Tradition filter
    if (tradition !== "all" && item.tradition !== tradition) {
      return false;
    }

    // Category filter
    if (category !== "all" && item.category !== category) {
      return false;
    }

    // Search query filter
    if (q) {
      const matchEn = item.en.toLowerCase().includes(q);
      const matchUr = item.ur.toLowerCase().includes(q);
      const matchAr = item.ar.toLowerCase().includes(q);
      const matchCategory = item.category.toLowerCase().includes(q);
      const matchDesc =
        lang === "ur"
          ? item.desc_ur.toLowerCase().includes(q)
          : item.desc_en.toLowerCase().includes(q);

      if (!matchEn && !matchUr && !matchAr && !matchCategory && !matchDesc) {
        return false;
      }
    }

    return true;
  });
}
