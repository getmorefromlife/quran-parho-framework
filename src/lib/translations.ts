/**
 * Translation metadata, storage helpers, and utility functions
 * for the 40+ Qur'an translations across 4 languages.
 */

const KEY_SELECTED_TRANSLATIONS = "qp_selected_translations";

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

/* ── Translation metadata ── */

export type TranslationLang = "en" | "ur" | "fa" | "de";

export type TranslationDef = {
  id: string;
  field: string; // key in QVerse JSON object
  name: string; // display name (English)
  nameNative: string; // display name in its own script
  lang: TranslationLang;
  dir: "ltr" | "rtl";
  translator?: string; // translator credit (short)
};

export const TRANSLATIONS: TranslationDef[] = [
  // ── English ──
  {
    id: "qarai",
    field: "english_qarai",
    name: "Qar'ai",
    nameNative: "Qar'ai",
    lang: "en",
    dir: "ltr",
    translator: "Ali Quli Qar'ai",
  },
  {
    id: "pickthall",
    field: "en_pickthall",
    name: "Pickthall",
    nameNative: "Pickthall",
    lang: "en",
    dir: "ltr",
    translator: "Marmaduke Pickthall",
  },
  {
    id: "sahih",
    field: "en_sahih",
    name: "Sahih International",
    nameNative: "Sahih International",
    lang: "en",
    dir: "ltr",
  },
  {
    id: "khattab",
    field: "en_khattab",
    name: "The Clear Quran",
    nameNative: "The Clear Quran",
    lang: "en",
    dir: "ltr",
    translator: "Dr. Mustafa Khattab",
  },
  {
    id: "yusufali",
    field: "en_yusufali",
    name: "Yusuf Ali",
    nameNative: "Yusuf Ali",
    lang: "en",
    dir: "ltr",
    translator: "Abdullah Yusuf Ali",
  },
  {
    id: "maududi",
    field: "en_maududi",
    name: "Maududi",
    nameNative: "Maududi",
    lang: "en",
    dir: "ltr",
    translator: "Abul A'la Maududi",
  },
  {
    id: "hilali",
    field: "en_hilali",
    name: "Hilali & Khan",
    nameNative: "Hilali & Khan",
    lang: "en",
    dir: "ltr",
    translator: "Dr. Muhammad Taqi-ud-Din Hilali & Dr. Muhammad Muhsin Khan",
  },
  {
    id: "ahmedraza",
    field: "en_ahmedraza",
    name: "Ahmed Raza Khan",
    nameNative: "Ahmed Raza Khan",
    lang: "en",
    dir: "ltr",
    translator: "Ahmed Raza Khan",
  },
  {
    id: "asad",
    field: "en_asad",
    name: "Asad",
    nameNative: "Asad",
    lang: "en",
    dir: "ltr",
    translator: "Muhammad Asad",
  },
  {
    id: "wahiduddin",
    field: "en_wahiduddin",
    name: "Wahiduddin Khan",
    nameNative: "Wahiduddin Khan",
    lang: "en",
    dir: "ltr",
    translator: "Wahiduddin Khan",
  },
  {
    id: "arberry",
    field: "en_arberry",
    name: "Arberry",
    nameNative: "Arberry",
    lang: "en",
    dir: "ltr",
    translator: "A.J. Arberry",
  },
  {
    id: "daryabadi",
    field: "en_daryabadi",
    name: "Daryabadi",
    nameNative: "Daryabadi",
    lang: "en",
    dir: "ltr",
    translator: "Abdul Majid Daryabadi",
  },
  {
    id: "abdelhaleem",
    field: "en_abdelhaleem",
    name: "Abdel Haleem",
    nameNative: "Abdel Haleem",
    lang: "en",
    dir: "ltr",
    translator: "M.A.S. Abdel Haleem",
  },
  {
    id: "usmani",
    field: "en_usmani",
    name: "Taqi Usmani",
    nameNative: "Taqi Usmani",
    lang: "en",
    dir: "ltr",
    translator: "Muhammad Taqi Usmani",
  },
  {
    id: "itani",
    field: "en_itani",
    name: "Itani",
    nameNative: "Itani",
    lang: "en",
    dir: "ltr",
    translator: "Talal Itani",
  },
  {
    id: "mubarakpuri",
    field: "en_mubarakpuri",
    name: "Mubarakpuri",
    nameNative: "Mubarakpuri",
    lang: "en",
    dir: "ltr",
    translator: "Safi-ur-Rahman al-Mubarakpuri",
  },
  {
    id: "sarwar",
    field: "en_sarwar",
    name: "Sarwar",
    nameNative: "Sarwar",
    lang: "en",
    dir: "ltr",
    translator: "Muhammad Sarwar",
  },
  {
    id: "shakir",
    field: "en_shakir",
    name: "Shakir",
    nameNative: "Shakir",
    lang: "en",
    dir: "ltr",
    translator: "Mohammad Habib Shakir",
  },
  {
    id: "ahmedali",
    field: "en_ahmedali",
    name: "Ahmed Ali",
    nameNative: "Ahmed Ali",
    lang: "en",
    dir: "ltr",
    translator: "Ahmed Ali",
  },

  // ── Urdu ──
  {
    id: "jawadi",
    field: "urdu_jawadi",
    name: "Jawadi",
    nameNative: "جواہدی",
    lang: "ur",
    dir: "rtl",
    translator: "Syed Abul Hasan Ali Nadvi",
  },
  {
    id: "jalandhry",
    field: "ur_jalandhry",
    name: "Jalandhry",
    nameNative: "جلندھری",
    lang: "ur",
    dir: "rtl",
    translator: "Fateh Muhammad Jalandhry",
  },
  {
    id: "kanzuliman",
    field: "ur_kanzuliman",
    name: "Kanz-ul-Iman",
    nameNative: "کنزالایمان",
    lang: "ur",
    dir: "rtl",
    translator: "Shah Abdul Qadir Dehlawi",
  },
  {
    id: "maududi_ur",
    field: "ur_maududi",
    name: "Maududi (Urdu)",
    nameNative: "مولودی",
    lang: "ur",
    dir: "rtl",
    translator: "Abul A'la Maududi",
  },
  {
    id: "qadri",
    field: "ur_qadri",
    name: "Qadri",
    nameNative: "قادری",
    lang: "ur",
    dir: "rtl",
    translator: "Tehseen Ahmad Raza Qadri",
  },
  {
    id: "junagarhi",
    field: "ur_junagarhi",
    name: "Junagarhi",
    nameNative: "جنگڑھی",
    lang: "ur",
    dir: "rtl",
    translator: "Maulana Mehmud Hasan Deobandi",
  },
  {
    id: "taqiusmani",
    field: "ur_taqiusmani",
    name: "Taqi Usmani (Urdu)",
    nameNative: "تقی عثمانی",
    lang: "ur",
    dir: "rtl",
    translator: "Muhammad Taqi Usmani",
  },
  {
    id: "karamshah",
    field: "ur_karamshah",
    name: "Karam Shah",
    nameNative: "کرام شاہ",
    lang: "ur",
    dir: "rtl",
    translator: "Karam Shah Zahidi",
  },
  {
    id: "mahmudalhasan",
    field: "ur_mahmudalhasan",
    name: "Mahmud al-Hasan",
    nameNative: "محمود الحسن",
    lang: "ur",
    dir: "rtl",
    translator: "Maulana Mahmud al-Hasan",
  },
  {
    id: "zilalquran",
    field: "ur_zilalquran",
    name: "Zilal al-Quran",
    nameNative: "زلال القرآن",
    lang: "ur",
    dir: "rtl",
    translator: "Maududi (Zeeshan)",
  },
  {
    id: "bayanulquran",
    field: "ur_bayanulquran",
    name: "Bayan ul-Quran",
    nameNative: "بیان القرآن",
    lang: "ur",
    dir: "rtl",
    translator: "Maulana Ashraf Ali Thanvi",
  },
  {
    id: "wahiduddin_ur",
    field: "ur_wahiduddin",
    name: "Wahiduddin (Urdu)",
    nameNative: "واحد الدین",
    lang: "ur",
    dir: "rtl",
    translator: "Wahiduddin Khan",
  },
  {
    id: "ahmedali_ur",
    field: "ur_ahmedali",
    name: "Ahmed Ali (Urdu)",
    nameNative: "احمد علی",
    lang: "ur",
    dir: "rtl",
    translator: "Ahmed Ali",
  },
  {
    id: "najafi",
    field: "ur_najafi",
    name: "Najafi",
    nameNative: "نجفی",
    lang: "ur",
    dir: "rtl",
    translator: "Allama Muhammad Hadi Najafi",
  },

  // ── Persian (فارسی) ──
  {
    id: "ayati",
    field: "fa_ayati",
    name: "Ayati",
    nameNative: "آیتی",
    lang: "fa",
    dir: "rtl",
    translator: "AbdolMohammad Ayati",
  },
  {
    id: "bahrampour",
    field: "fa_bahrampour",
    name: "Bahrampour",
    nameNative: "بهرامپور",
    lang: "fa",
    dir: "rtl",
    translator: "Abolfazl Bahrampour",
  },
  {
    id: "khorramshahi",
    field: "fa_khorramshahi",
    name: "Khorramshahi",
    nameNative: "خرمشاهی",
    lang: "fa",
    dir: "rtl",
    translator: "Bahaoddin Khorramshahi",
  },
  {
    id: "ansarian",
    field: "fa_ansarian",
    name: "Ansarian",
    nameNative: "انصاریان",
    lang: "fa",
    dir: "rtl",
    translator: "Hussain Ansarian",
  },
  {
    id: "gharaati",
    field: "fa_gharaati",
    name: "Gharaati",
    nameNative: "قرائتی",
    lang: "fa",
    dir: "rtl",
    translator: "Mohsen Gharaati",
  },
  {
    id: "ghomshei",
    field: "fa_ghomshei",
    name: "Ghomshei",
    nameNative: "قمشه‌ای",
    lang: "fa",
    dir: "rtl",
    translator: "Mahdi Elahi Ghomshei",
  },
  {
    id: "makarem",
    field: "fa_makarem",
    name: "Makarem",
    nameNative: "مکارم شیرازی",
    lang: "fa",
    dir: "rtl",
    translator: "Naser Makarem Shirazi",
  },
  {
    id: "tehrani",
    field: "fa_tehrani",
    name: "Tehrani",
    nameNative: "تهرانی",
    lang: "fa",
    dir: "rtl",
    translator: "Mohammad Sadeqi Tehrani",
  },
  {
    id: "mojtabavi",
    field: "fa_mojtabavi",
    name: "Mojtabavi",
    nameNative: "مجتبوی",
    lang: "fa",
    dir: "rtl",
    translator: "Sayed Jalaloddin Mojtabavi",
  },
  {
    id: "khorramdel",
    field: "fa_khorramdel",
    name: "Khorramdel",
    nameNative: "خررامدل",
    lang: "fa",
    dir: "rtl",
    translator: "Mostafa Khorramdel",
  },

  // ── German (Deutsch) ──
  {
    id: "aburida",
    field: "de_aburida",
    name: "Abu-Rida",
    nameNative: "Abu-Rida",
    lang: "de",
    dir: "ltr",
    translator: "Muhammad Abu-Rida",
  },
  {
    id: "bubenheim",
    field: "de_bubenheim",
    name: "Bubenheim & Nekyar",
    nameNative: "Bubenheim & Nekyar",
    lang: "de",
    dir: "ltr",
    translator: "Frank Bubenheim & Adel Theodor Khoury",
  },
  {
    id: "khoury",
    field: "de_khoury",
    name: "Khoury",
    nameNative: "Khoury",
    lang: "de",
    dir: "ltr",
    translator: "Adel Theodor Khoury",
  },
  {
    id: "zaidan",
    field: "de_zaidan",
    name: "Zaidan",
    nameNative: "Zaidan",
    lang: "de",
    dir: "ltr",
    translator: "Amir Zaidan",
  },
];

/* ── Grouped by language ── */

export const TRANSLATIONS_BY_LANG: Record<TranslationLang, TranslationDef[]> = {
  en: TRANSLATIONS.filter((t) => t.lang === "en"),
  ur: TRANSLATIONS.filter((t) => t.lang === "ur"),
  fa: TRANSLATIONS.filter((t) => t.lang === "fa"),
  de: TRANSLATIONS.filter((t) => t.lang === "de"),
};

export const LANG_LABELS: Record<TranslationLang, { en: string; native: string }> = {
  en: { en: "English", native: "English" },
  ur: { en: "Urdu", native: "اردو" },
  fa: { en: "Persian", native: "فارسی" },
  de: { en: "German", native: "Deutsch" },
};

/* ── Storage ── */

const DEFAULT_SELECTED = ["qarai", "jawadi"];

export function loadSelectedTranslations(): string[] {
  if (!canStore()) return DEFAULT_SELECTED;
  const raw = safeParse<string[]>(
    localStorage.getItem(KEY_SELECTED_TRANSLATIONS),
    DEFAULT_SELECTED,
  );
  // Validate: only include IDs that exist in TRANSLATIONS
  return raw.filter((id) => TRANSLATIONS.some((t) => t.id === id));
}

export function saveSelectedTranslations(ids: string[]): void {
  if (!canStore()) return;
  localStorage.setItem(KEY_SELECTED_TRANSLATIONS, JSON.stringify(ids));
}

/* ── Helpers ── */

/** Get the field name for a translation ID */
export function getFieldForId(id: string): string | undefined {
  return TRANSLATIONS.find((t) => t.id === id)?.field;
}

/** Get translation text from a verse object by translation ID */
export function getTranslationText(verse: Record<string, unknown>, id: string): string {
  const field = getFieldForId(id);
  if (!field) return "";
  return (verse[field] as string) ?? "";
}

/** Get translation definition by ID */
export function getTranslation(id: string): TranslationDef | undefined {
  return TRANSLATIONS.find((t) => t.id === id);
}

/** Language code for CSS dir attribute */
export function langDir(id: string): "ltr" | "rtl" {
  return getTranslation(id)?.dir ?? "ltr";
}

/** Check if a translation ID is an English one */
export function isEnglishTranslation(id: string): boolean {
  return getTranslation(id)?.lang === "en";
}

/** Check if a translation ID is an Urdu one */
export function isUrduTranslation(id: string): boolean {
  return getTranslation(id)?.lang === "ur";
}
