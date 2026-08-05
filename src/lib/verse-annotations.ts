const KEY_HIGHLIGHTS = "qp_highlights";
const KEY_VERSE_NOTES = "qp_verse_notes";
const KEY_SHARE_PREFS = "qp_share_prefs";
const KEY_FAVORITES = "qp_favorites";

function canStore(): boolean {
  return typeof window !== "undefined";
}

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function verseKey(surah: number, ayah: number): string {
  return `${surah}:${ayah}`;
}

/* ── Highlights ── */

export type HighlightColor = "gold" | "green" | "blue" | "pink" | "purple";

export const HIGHLIGHT_COLORS: HighlightColor[] = ["gold", "green", "blue", "pink", "purple"];

export const HIGHLIGHT_CLASSES: Record<
  HighlightColor,
  { border: string; bg: string; dot: string }
> = {
  gold: { border: "border-l-gold", bg: "bg-gold/8", dot: "bg-gold" },
  green: { border: "border-l-emerald-500", bg: "bg-emerald-500/8", dot: "bg-emerald-500" },
  blue: { border: "border-l-sky-500", bg: "bg-sky-500/8", dot: "bg-sky-500" },
  pink: { border: "border-l-pink-500", bg: "bg-pink-500/8", dot: "bg-pink-500" },
  purple: { border: "border-l-violet-500", bg: "bg-violet-500/8", dot: "bg-violet-500" },
};

export function loadHighlights(): Record<string, HighlightColor> {
  if (!canStore()) return {};
  return safeParse<Record<string, HighlightColor>>(localStorage.getItem(KEY_HIGHLIGHTS), {});
}

export function saveHighlight(
  surah: number,
  ayah: number,
  color: HighlightColor | null,
): Record<string, HighlightColor> {
  if (!canStore()) return {};
  const all = loadHighlights();
  const key = verseKey(surah, ayah);
  if (color === null) {
    delete all[key];
  } else {
    all[key] = color;
  }
  localStorage.setItem(KEY_HIGHLIGHTS, JSON.stringify(all));
  return all;
}

/* ── Favorites (Backed by Research Projects) ── */
import {
  loadProjects,
  loadActiveProjectId,
  toggleVerseInProject,
  getActiveProject,
} from "@/lib/verse-collections";

export function loadFavorites(): Record<string, true> {
  const activeProject = getActiveProject();
  return activeProject ? activeProject.verses : {};
}

export function toggleFavorite(surah: number, ayah: number): Record<string, true> {
  const activeId = loadActiveProjectId();
  toggleVerseInProject(activeId, surah, ayah);
  return loadFavorites();
}

/* ── Verse Notes ── */

export function loadVerseNotes(): Record<string, string> {
  if (!canStore()) return {};
  return safeParse<Record<string, string>>(localStorage.getItem(KEY_VERSE_NOTES), {});
}

export function saveVerseNote(surah: number, ayah: number, note: string): Record<string, string> {
  if (!canStore()) return {};
  const all = loadVerseNotes();
  const key = verseKey(surah, ayah);
  if (!note.trim()) {
    delete all[key];
  } else {
    all[key] = note.trim();
  }
  localStorage.setItem(KEY_VERSE_NOTES, JSON.stringify(all));
  return all;
}

/* ── Share Preferences ── */

export type SharePrefs = { ar: boolean; en: boolean; ur: boolean; ref: boolean; note: boolean };

const DEFAULT_SHARE_PREFS: SharePrefs = { ar: true, en: true, ur: false, ref: true, note: false };

export function loadSharePrefs(): SharePrefs {
  if (!canStore()) return DEFAULT_SHARE_PREFS;
  const v = safeParse<Partial<SharePrefs>>(localStorage.getItem(KEY_SHARE_PREFS), {});
  return {
    ar: v.ar !== false,
    en: v.en !== false,
    ur: v.ur === true,
    ref: v.ref !== false,
    note: v.note === true,
  };
}

export function saveSharePrefs(p: SharePrefs): void {
  if (!canStore()) return;
  localStorage.setItem(KEY_SHARE_PREFS, JSON.stringify(p));
}

/* ── Compose share text from a verse ── */

export type VerseText = {
  surah: number;
  ayah: number;
  arabic: string;
  english_qarai: string;
  urdu_jawadi: string;
  [field: string]: string | number;
};

export function composeShareText(
  v: VerseText,
  surahName: string,
  surahAr: string,
  note: string | undefined,
  prefs: SharePrefs,
  selectedTranslations?: string[],
): string {
  const lines: string[] = [];
  if (prefs.ref) lines.push(`Quran ${v.surah}:${v.ayah} · ${surahName} (${surahAr})`);
  if (prefs.ar && v.arabic) lines.push(`Arabic: ${v.arabic}`);
  if (selectedTranslations && selectedTranslations.length > 0) {
    // Use selected translations with their labels
    for (const tid of selectedTranslations) {
      const text = v[tid] as string | undefined;
      if (!text) continue;
      // Import would be circular; use inline label map
      const labels: Record<string, string> = {
        qarai: "English (Qar'ai)",
        pickthall: "English (Pickthall)",
        sahih: "English (Sahih)",
        khattab: "English (Khattab)",
        yusufali: "English (Yusuf Ali)",
        maududi: "English (Maududi)",
        hilali: "English (Hilali)",
        ahmedraza: "English (Ahmed Raza)",
        asad: "English (Asad)",
        wahiduddin: "English (Wahiduddin)",
        arberry: "English (Arberry)",
        daryabadi: "English (Daryabadi)",
        abdelhaleem: "English (Abdel Haleem)",
        usmani: "English (Taqi Usmani)",
        itani: "English (Itani)",
        mubarakpuri: "English (Mubarakpuri)",
        sarwar: "English (Sarwar)",
        shakir: "English (Shakir)",
        ahmedali: "English (Ahmed Ali)",
        jawadi: "Urdu (Jawadi)",
        jalandhry: "Urdu (Jalandhry)",
        kanzuliman: "Urdu (Kanz-ul-Iman)",
        maududi_ur: "Urdu (Maududi)",
        qadri: "Urdu (Qadri)",
        junagarhi: "Urdu (Junagarhi)",
        taqiusmani: "Urdu (Taqi Usmani)",
        karamshah: "Urdu (Karam Shah)",
        mahmudalhasan: "Urdu (Mahmud al-Hasan)",
        zilalquran: "Urdu (Zilal al-Quran)",
        bayanulquran: "Urdu (Bayan ul-Quran)",
        wahiduddin_ur: "Urdu (Wahiduddin)",
        ahmedali_ur: "Urdu (Ahmed Ali)",
        najafi: "Urdu (Najafi)",
        ayati: "فارسی (آیتی)",
        bahrampour: "فارسی (بهرامپور)",
        khorramshahi: "فارسی (خرمشاهی)",
        ansarian: "فارسی (انصاریان)",
        gharaati: "فارسی (قرائتی)",
        ghomshei: "فارسی (قمشه‌ای)",
        makarem: "فارسی (مکارم)",
        tehrani: "فارسی (تهرانی)",
        mojtabavi: "فارسی (مجتبوی)",
        khorramdel: "فارسی (خررامدل)",
        aburida: "Deutsch (Abu-Rida)",
        bubenheim: "Deutsch (Bubenheim)",
        khoury: "Deutsch (Khoury)",
        zaidan: "Deutsch (Zaidan)",
      };
      lines.push(`${labels[tid] ?? tid}: ${text}`);
    }
  } else {
    // Fallback to original behavior
    if (prefs.en && v.english_qarai) lines.push(`English: ${v.english_qarai}`);
    if (prefs.ur && v.urdu_jawadi) lines.push(`Urdu: ${v.urdu_jawadi}`);
  }
  if (prefs.note && note) lines.push(`Note: ${note}`);
  return lines.join("\n");
}

/* ── Compose WYSIWYG block for Saved-panel copy ── */

export type SavedLangs = { ar: boolean; en: boolean; ur: boolean };

export function composeSavedBlock(
  surahN: number,
  ayah: number,
  surahName: string,
  surahAr: string,
  v: VerseText | undefined,
  note: string | undefined,
  langs: SavedLangs,
): string {
  const lines: string[] = [];
  lines.push(`Quran ${surahN}:${ayah} · ${surahName} (${surahAr})`);
  if (v?.arabic && langs.ar) lines.push(`Arabic: ${v.arabic}`);
  if (v?.english_qarai && langs.en) lines.push(`English: ${v.english_qarai}`);
  if (v?.urdu_jawadi && langs.ur) lines.push(`Urdu: ${v.urdu_jawadi}`);
  if (note) lines.push(`Note: ${note}`);
  return lines.join("\n");
}
