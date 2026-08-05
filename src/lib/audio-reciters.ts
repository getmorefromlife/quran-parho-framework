export type ReciterId =
  | "alafasy"
  | "sudais"
  | "abdulbasit"
  | "husary"
  | "hudhaify"
  | "ayyoub"
  | "jibreel";

export type Reciter = {
  id: ReciterId;
  folder: string;
  name_en: string;
  name_ur: string;
};

export const RECITERS: Reciter[] = [
  {
    id: "alafasy",
    folder: "Alafasy_128kbps",
    name_en: "Mishari Alafasy",
    name_ur: "مشاری علافاسی",
  },
  {
    id: "sudais",
    folder: "Saood_ash-Shuraym_128kbps",
    name_en: "Abdurrahmaan As-Sudais",
    name_ur: "عبدالرحمن السدیس",
  },
  {
    id: "abdulbasit",
    folder: "Abdul_Basit_Murattal_192kbps",
    name_en: "Abdul Basit",
    name_ur: "عبدالباسط",
  },
  { id: "husary", folder: "Husary_128kbps", name_en: "Husary", name_ur: "الحصリー" },
  { id: "hudhaify", folder: "Hudhaify_128kbps", name_en: "Hudhaify", name_ur: "الحدیفی" },
  {
    id: "ayyoub",
    folder: "Muhammad_Ayyoub_128kbps",
    name_en: "Muhammad Ayyoub",
    name_ur: "محمد ایوب",
  },
  {
    id: "jibreel",
    folder: "Muhammad_Jibreel_128kbps",
    name_en: "Muhammad Jibreel",
    name_ur: "محمد جبریل",
  },
];

export const DEFAULT_RECITER: ReciterId = "alafasy";

export const EVERYAYAH_BASE = "https://everyayah.com/data";

export function verseAudioUrl(reciterId: ReciterId, surah: number, ayah: number): string {
  const reciter = RECITERS.find((r) => r.id === reciterId) ?? RECITERS[0];
  const s = String(surah).padStart(3, "0");
  const a = String(ayah).padStart(3, "0");
  return `${EVERYAYAH_BASE}/${reciter.folder}/${s}${a}.mp3`;
}

const KEY_RECITER = "qp_reciter";

export function loadReciter(): ReciterId {
  if (typeof window === "undefined") return DEFAULT_RECITER;
  const v = localStorage.getItem(KEY_RECITER);
  if (RECITERS.some((r) => r.id === v)) return v as ReciterId;
  return DEFAULT_RECITER;
}

export function saveReciter(id: ReciterId): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY_RECITER, id);
}
