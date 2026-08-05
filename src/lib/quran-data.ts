export type QVerse = {
  surah: number;
  ayah: number;
  arabic: string;
  english_qarai: string;
  urdu_jawadi: string;
  [field: string]: string | number;
};

const quranCache = new Map<number, QVerse[]>();

export async function loadSurah(n: number): Promise<QVerse[]> {
  if (quranCache.has(n)) return quranCache.get(n)!;
  const res = await fetch(`/quran/surah-${n}.json`);
  if (!res.ok) throw new Error(`Failed to load surah ${n}`);
  const data = (await res.json()) as QVerse[];
  quranCache.set(n, data);
  return data;
}
