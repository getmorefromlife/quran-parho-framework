/**
 * World-class Qur'an search engine.
 *
 * Normalizes Arabic/Urdu/Persian/Latin text into a single "search-canonical"
 * form (diacritics stripped, hamza/dagger-alef/wasla/alef variants merged,
 * yeh/kaf/heh variants merged, ZWNJ/join controls removed, Latin lowercased
 * and accent-free) so any query finds every instance regardless of how the
 * word is spelled or vocalized in the source data.
 */

import { TRANSLATIONS, getTranslationText } from "@/lib/translations";
import type { QVerse } from "@/lib/quran-data";

export const SEARCH_RESULT_CAP = 300;

export type SearchMode = "contains" | "word";

/* ── Character classes ── */

const CHAR_MARK = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u08F0-\u08FF\u0640\u200C\u200D]/;
const CHAR_ALEF = /[\u0623\u0625\u0622\u0671]/; // أ إ آ ٱ → ا
const CHAR_YEH = /[\u064A\u0649\u06CC]/; // ي ى ی → ی (keep ے U+06D2)
const CHAR_KAF = /[\u0643]/; // ك → ک
const CHAR_HEH = /[\u06BE\u06C1\u0629]/; // ھ ہ ة → ه
const CHAR_ACCENT = /[\u0300-\u036F]/;

/* ── Normalization ── */

function normChar(ch: string): string {
  if (CHAR_MARK.test(ch) || CHAR_ACCENT.test(ch)) return "";
  if (CHAR_ALEF.test(ch)) return "\u0627";
  if (CHAR_YEH.test(ch)) return "\u06CC";
  if (CHAR_KAF.test(ch)) return "\u06A9";
  if (CHAR_HEH.test(ch)) return "\u0647";
  return ch;
}

/** Convert text into search-canonical form (empty diacritics/joiners removed). */
export function normalize(text: string): string {
  const nfd = text.normalize("NFD");
  let out = "";
  for (const ch of nfd) out += normChar(ch);
  return out.toLowerCase();
}

export function normalizeQuery(q: string): string {
  return normalize(q.trim());
}

/* ── Verse search text (cached) ── */

const searchTextCache = new Map<string, string>();

/**
 * Build (and cache) the normalized search text for a verse.
 * By default covers the Arabic text + all 47 translations.
 * Pass `fields` (QVerse keys) to restrict to specific translations.
 */
export function getVerseSearchText(v: QVerse, fields?: ReadonlyArray<string>): string {
  const allFields = !fields;
  const key = allFields ? `${v.surah}:${v.ayah}` : "";
  if (allFields) {
    const hit = searchTextCache.get(key);
    if (hit !== undefined) return hit;
  }
  const parts: string[] = [normalize(String(v.arabic))];
  if (allFields) {
    for (const t of TRANSLATIONS) {
      const text = getTranslationText(v as Record<string, unknown>, t.id);
      if (text) parts.push(normalize(text));
    }
  } else {
    for (const f of fields) {
      const text = v[f];
      if (typeof text === "string" && text) parts.push(normalize(text));
    }
  }
  const joined = parts.join(" ");
  if (allFields) searchTextCache.set(key, joined);
  return joined;
}

/* ── Matching ── */

/**
 * Returns true if a verse matches the (already normalized) query.
 * - contains: substring match over the canonical text.
 * - word:     a whitespace token equals the query or starts with it
 *             (inflected forms), except multi-word queries fall back
 *             to substring matching.
 */
export function searchVerse(
  v: QVerse,
  qn: string,
  mode: SearchMode,
  fields?: ReadonlyArray<string>,
): boolean {
  if (!qn) return false;
  const text = getVerseSearchText(v, fields);
  if (mode === "contains") return text.includes(qn);
  if (qn.includes(" ")) return text.includes(qn);
  return text.split(/\s+/).some((tok) => tok === qn || tok.startsWith(qn));
}

/* ── Highlighting ── */

function esc(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const ALEF_CLASS = "[\u0627\u0623\u0625\u0622\u0671]";
const YEH_CLASS = "[\u064A\u0649\u06CC]";
const KAF_CLASS = "[\u0643\u06A9]";
const HEH_CLASS = "[\u0647\u06BE\u06C1\u0629]";

function letterClass(ch: string): string {
  if (/[\u0627\u0623\u0625\u0622\u0671]/.test(ch)) return ALEF_CLASS;
  if (/[\u064A\u0649\u06CC]/.test(ch)) return YEH_CLASS;
  if (/[\u0643\u06A9]/.test(ch)) return KAF_CLASS;
  if (/[\u0647\u06BE\u06C1\u0629]/.test(ch)) return HEH_CLASS;
  return esc(ch);
}

const MARKS_CLASS =
  "[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u08F0-\u08FF\u0640\u200C\u200D]";

/**
 * Build a regex that locates the query inside ORIGINAL (vocalized) text,
 * tolerating diacritics/joiners between letters and script variants.
 * Returns null when the query is empty.
 */
export function highlightRegex(q: string, mode: SearchMode): RegExp | null {
  const qn = normalizeQuery(q);
  if (!qn) return null;
  let body = "";
  for (const ch of qn) {
    if (ch === " ") {
      body += "\\s+";
      continue;
    }
    body += letterClass(ch) + MARKS_CLASS + "*";
  }
  if (mode === "word") {
    body = `(?<![\\u0600-\\u06FF\\p{L}\\p{N}])${body}[\\u0600-\\u06FF]*`;
  }
  return new RegExp(body, "gu");
}

/** Ranges (start, end) of query matches within the original text. */
export function findHighlightRanges(
  text: string,
  q: string,
  mode: SearchMode,
): Array<[number, number]> {
  const re = highlightRegex(q, mode);
  if (!re || !text) return [];
  const ranges: Array<[number, number]> = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    ranges.push([m.index, m.index + m[0].length]);
    if (m.index === re.lastIndex) re.lastIndex++;
  }
  return ranges;
}
