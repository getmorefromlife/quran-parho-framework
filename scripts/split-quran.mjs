#!/usr/bin/env node
/**
 * Splits the Quran Samjho quran-complete.json into per-surah files.
 *
 * Usage:
 *   node scripts/split-quran.mjs [--source path/to/quran-complete.json]
 *
 * Default source: ../Quran webapp - June 2026/src/lib/quran-complete.json
 * Output: public/quran/surah-<n>.json (n = 1..114)
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");

const argIdx = process.argv.indexOf("--source");
const source =
  argIdx !== -1
    ? resolve(process.argv[argIdx + 1])
    : resolve(__dirname, "../../Quran webapp - June 2026/src/lib/quran-complete.json");

const outDir = join(projectRoot, "public", "quran");

console.log(`Reading source: ${source}`);
const verses = JSON.parse(readFileSync(source, "utf8"));

const bySurah = new Map();
for (const v of verses) {
  if (!bySurah.has(v.surah)) bySurah.set(v.surah, []);
  bySurah.get(v.surah).push({
    surah: v.surah,
    ayah: v.ayah,
    arabic: v.arabic,
    english_qarai: v.english_qarai,
    urdu_jawadi: v.urdu_jawadi,
  });
}

mkdirSync(outDir, { recursive: true });
let total = 0;
for (const [n, list] of bySurah) {
  const file = join(outDir, `surah-${n}.json`);
  writeFileSync(file, JSON.stringify(list));
  total += list.length;
  console.log(
    `surah-${n}.json  ${String(list.length).padStart(4)} verses  ${(JSON.stringify(list).length / 1024).toFixed(1)} kB`,
  );
}

console.log(`\nWrote ${bySurah.size} surah files, ${total} verses to ${outDir}`);
