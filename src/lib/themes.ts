import rawThemes from "@/data/themes.json";
import {
  loadProjects,
  saveProjects,
  saveActiveProjectId,
  type ResearchProject,
} from "@/lib/verse-collections";

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

/**
 * Expand verse range strings (e.g. "2:153", "2:155-157", "103:1-3") into individual verse keys
 */
export function parseVerseSpecs(
  verseSpecs: string[],
): { surah: number; ayah: number; key: string }[] {
  const result: { surah: number; ayah: number; key: string }[] = [];
  const seen = new Set<string>();

  for (const spec of verseSpecs) {
    const [surahStr, ayahRange] = spec.split(":");
    const surah = parseInt(surahStr, 10);
    if (!Number.isFinite(surah)) continue;

    if (!ayahRange) continue;

    if (ayahRange.includes("-")) {
      const [startStr, endStr] = ayahRange.split("-");
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      if (Number.isFinite(start) && Number.isFinite(end)) {
        for (let a = start; a <= end; a++) {
          const key = `${surah}:${a}`;
          if (!seen.has(key)) {
            seen.add(key);
            result.push({ surah, ayah: a, key });
          }
        }
      }
    } else {
      const ayah = parseInt(ayahRange, 10);
      if (Number.isFinite(ayah)) {
        const key = `${surah}:${ayah}`;
        if (!seen.has(key)) {
          seen.add(key);
          result.push({ surah, ayah, key });
        }
      }
    }
  }

  return result;
}

/**
 * Automatically create or update a Research Project for a Theme, populating it with all theme verses
 */
export function getOrCreateThemeProject(
  theme: ThemeEntry,
  lang: "en" | "ur" = "en",
): ResearchProject {
  const projects = loadProjects();
  const themeProjId = `theme_${theme.id}`;
  const parsedVerses = parseVerseSpecs(theme.verses);
  const versesMap: Record<string, true> = {};
  parsedVerses.forEach((v) => {
    versesMap[v.key] = true;
  });

  const projName = lang === "ur" ? `موضوع: ${theme.ur}` : `Theme: ${theme.en}`;
  const projDesc =
    lang === "ur"
      ? `${theme.desc_ur} (${theme.source_note})`
      : `${theme.desc_en} (${theme.source_note})`;

  const existingIdx = projects.findIndex((p) => p.id === themeProjId);
  if (existingIdx !== -1) {
    const updatedProj: ResearchProject = {
      ...projects[existingIdx],
      name: projName,
      description: projDesc,
      verses: versesMap,
      updatedAt: Date.now(),
    };
    projects[existingIdx] = updatedProj;
    saveProjects(projects);
    saveActiveProjectId(themeProjId);
    return updatedProj;
  }

  const newProj: ResearchProject = {
    id: themeProjId,
    name: projName,
    description: projDesc,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    verses: versesMap,
    savedSearches: [],
  };

  const updated = [newProj, ...projects];
  saveProjects(updated);
  saveActiveProjectId(newProj.id);
  return newProj;
}
