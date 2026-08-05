import { SURAHS, type Surah } from "@/lib/surahs";

export type Cycle = {
  key: string;
  label: string;
  subtitle: string;
  surahs: Surah[];
};

export function getCycles(lang: string): Cycle[] {
  const all = SURAHS.slice();
  return [
    {
      key: "cycle1",
      label: lang === "en" ? "Cycle 1 · Foundation" : "مرحلہ ۱ · بنیاد",
      subtitle: lang === "en" ? "Reverse Order (114 → 1)" : "الٹی ترتیب (۱۱۴ → ۱)",
      surahs: [...all].sort((a, b) => b.n - a.n),
    },
    {
      key: "cycle2",
      label: lang === "en" ? "Cycle 2 · Seerah" : "مرحلہ ۲ · سیرت",
      subtitle: lang === "en" ? "Chronological (Nuzuli Order)" : "ترتیبِ نزولی",
      surahs: [...all].sort((a, b) => a.nuzul - b.nuzul),
    },
    {
      key: "cycle3",
      label: lang === "en" ? "Cycle 3 · Mastery" : "مرحلہ ۳ · مہارت",
      subtitle: lang === "en" ? "Mushaf Order (1 → 114)" : "مصحف کی ترتیب (۱ → ۱۱۴)",
      surahs: [...all].sort((a, b) => a.n - b.n),
    },
  ];
}
