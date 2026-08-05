export interface FontOption {
  id: string;
  name: string;
  family: string;
}

export const ARABIC_FONTS: FontOption[] = [
  { id: "amiri-quran", name: "Amiri Quran", family: "Amiri Quran" },
  { id: "amiri", name: "Amiri", family: "Amiri" },
  { id: "aref-ruqaa", name: "Aref Ruqaa", family: "Aref Ruqaa" },
  { id: "el-messiri", name: "El Messiri", family: "El Messiri" },
  { id: "alkalami", name: "Alkalami", family: "Alkalami" },
  { id: "fustat", name: "Fustat", family: "Fustat" },
  { id: "harmattan", name: "Harmattan", family: "Harmattan" },
  { id: "kfgqpc", name: "KFGQPC Uthman Taha Naskh", family: "KFGQPC Uthman Taha Naskh" },
  { id: "al-qalam", name: "Al Qalam Quran Majeed", family: "Al Qalam Quran Majeed Web" },
  { id: "me-quran", name: "Me Quran Volt Newmet", family: "Me Quran Volt Newmet" },
  { id: "scheherazade", name: "Scheherazade New", family: "Scheherazade New" },
  { id: "noto-naskh", name: "Noto Naskh Arabic", family: "Noto Naskh Arabic" },
];

export const URDU_FONTS: FontOption[] = [
  { id: "noto-nastaliq", name: "Noto Nastaliq Urdu", family: "Noto Nastaliq Urdu" },
  { id: "gulzar", name: "Gulzar", family: "Gulzar" },
  { id: "noto-naskh", name: "Noto Naskh Arabic", family: "Noto Naskh Arabic" },
];

export const ENGLISH_FONTS: FontOption[] = [
  { id: "georgia", name: "Georgia", family: "Georgia" },
  { id: "times", name: "Times New Roman", family: "Times New Roman" },
  { id: "palatino", name: "Palatino Linotype", family: "Palatino Linotype" },
  { id: "garamond", name: "Garamond", family: "Garamond" },
  { id: "system-serif", name: "System Serif", family: "serif" },
];

export const DEFAULT_FONTS = {
  arabic: "kfgqpc",
  urdu: "noto-nastaliq",
  english: "georgia",
} as const;

export type ReaderPrefs = {
  fontSize: number;
  lineSpacing: number;
  fontAr: string;
  fontUr: string;
  fontEn: string;
  circleModeEnabled: boolean;
  circleChunkSize: number;
  circleViewStyle: "focused" | "continuous";
};

const PREF_KEYS = {
  fontSize: "qp_reader_fontsize",
  lineSpacing: "qp_reader_linespacing",
  fontAr: "qp_reader_font_ar",
  fontUr: "qp_reader_font_ur",
  fontEn: "qp_reader_font_en",
  circleModeEnabled: "qp_reader_circle_mode",
  circleChunkSize: "qp_reader_circle_chunk_size",
  circleViewStyle: "qp_reader_circle_view_style",
} as const;

export function loadReaderPrefs(): ReaderPrefs {
  if (typeof window === "undefined") {
    return {
      fontSize: 100,
      lineSpacing: 1.7,
      fontAr: DEFAULT_FONTS.arabic,
      fontUr: DEFAULT_FONTS.urdu,
      fontEn: DEFAULT_FONTS.english,
      circleModeEnabled: false,
      circleChunkSize: 5,
      circleViewStyle: "focused",
    };
  }
  const num = (k: string, fallback: number) => {
    const v = parseFloat(localStorage.getItem(k) ?? "");
    return Number.isFinite(v) ? v : fallback;
  };
  const bool = (k: string, fallback: boolean) => {
    const raw = localStorage.getItem(k);
    if (raw === null) return fallback;
    return raw === "true";
  };
  const viewStyle =
    (localStorage.getItem(PREF_KEYS.circleViewStyle) as "focused" | "continuous") ?? "focused";

  return {
    fontSize: num(PREF_KEYS.fontSize, 100),
    lineSpacing: num(PREF_KEYS.lineSpacing, 1.7),
    fontAr: localStorage.getItem(PREF_KEYS.fontAr) ?? DEFAULT_FONTS.arabic,
    fontUr: localStorage.getItem(PREF_KEYS.fontUr) ?? DEFAULT_FONTS.urdu,
    fontEn: localStorage.getItem(PREF_KEYS.fontEn) ?? DEFAULT_FONTS.english,
    circleModeEnabled: bool(PREF_KEYS.circleModeEnabled, false),
    circleChunkSize: Math.max(1, Math.min(50, Math.floor(num(PREF_KEYS.circleChunkSize, 5)))),
    circleViewStyle: viewStyle === "continuous" ? "continuous" : "focused",
  };
}

export function saveReaderPrefs(prefs: ReaderPrefs) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PREF_KEYS.fontSize, String(prefs.fontSize));
  localStorage.setItem(PREF_KEYS.lineSpacing, String(prefs.lineSpacing));
  localStorage.setItem(PREF_KEYS.fontAr, prefs.fontAr);
  localStorage.setItem(PREF_KEYS.fontUr, prefs.fontUr);
  localStorage.setItem(PREF_KEYS.fontEn, prefs.fontEn);
  localStorage.setItem(PREF_KEYS.circleModeEnabled, String(prefs.circleModeEnabled));
  localStorage.setItem(PREF_KEYS.circleChunkSize, String(prefs.circleChunkSize));
  localStorage.setItem(PREF_KEYS.circleViewStyle, prefs.circleViewStyle);
}

const SETTINGS_POS_KEY = "qp_settings_pos";

export function loadSettingsPos(): { x: number; y: number } {
  if (typeof window === "undefined") return { x: 8, y: 80 };
  try {
    const v = JSON.parse(localStorage.getItem(SETTINGS_POS_KEY) ?? "");
    if (typeof v?.x === "number" && typeof v?.y === "number") return { x: v.x, y: v.y };
  } catch {
    /* fall through */
  }
  return { x: Math.max(8, window.innerWidth - 120), y: 80 };
}

export function saveSettingsPos(pos: { x: number; y: number }): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SETTINGS_POS_KEY, JSON.stringify(pos));
}

export function getFontFamily(id: string): string {
  const name =
    [...ARABIC_FONTS, ...URDU_FONTS, ...ENGLISH_FONTS].find((f) => f.id === id)?.family ?? "serif";
  if (name.includes(" ") && !name.includes('"')) {
    return `"${name}"`;
  }
  return name;
}

const GOOGLE_FONTS_URL =
  "https://fonts.googleapis.com/css2?family=Amiri+Quran&family=Amiri:wght@400;700&family=Aref+Ruqaa:wght@400;700&family=El+Messiri:wght@400;500;600;700&family=Alkalami:wght@400;500;600;700&family=Fustat:wght@300;400;500;600;700&family=Harmattan:wght@400;500;600;700&family=Noto+Naskh+Arabic:wght@400;500;600;700&family=Noto+Nastaliq+Urdu:wght@400;500;600;700&family=Scheherazade+New:wght@400;500;600;700&display=swap";

let fontsInjected = false;

export function ensureReaderFonts() {
  if (fontsInjected || typeof document === "undefined") return;
  fontsInjected = true;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = GOOGLE_FONTS_URL;
  document.head.appendChild(link);
}
