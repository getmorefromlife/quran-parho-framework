import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  normalize,
  normalizeQuery,
  searchVerse,
  findHighlightRanges,
  type SearchMode,
} from "@/lib/search";
import type { QVerse } from "@/lib/quran-data";

const ROOT = join(import.meta.dir, "..", "..", "public", "quran");

function loadAll(): QVerse[] {
  const all: QVerse[] = [];
  for (let n = 1; n <= 114; n++) {
    all.push(...(JSON.parse(readFileSync(join(ROOT, `surah-${n}.json`), "utf8")) as QVerse[]));
  }
  return all;
}

const ALL = loadAll();
const V1 = ALL.find((v) => v.surah === 1 && v.ayah === 1)!;

function countMatches(q: string, mode: SearchMode = "contains"): number {
  const qn = normalizeQuery(q);
  return ALL.filter((v) => searchVerse(v, qn, mode)).length;
}

describe("normalize", () => {
  test("strips Arabic diacritics, dagger-alef, tatweel, quranic marks", () => {
    expect(normalize("ٱلرَّحْمَـٰنِ")).toBe("الرحمن");
    expect(normalize("ٱللَّهِ")).toBe("الله");
    expect(normalize("َّ")).toBe("");
    expect(normalize("بِسْمِ")).toBe("بسم");
  });

  test("merges alef/hamza/wasla variants", () => {
    expect(normalize("أ إ آ ٱ ا")).toBe("ا ا ا ا ا");
    expect(normalize("ٱلَّذِينَ")).toBe("\u0627\u0644\u0630\u06CC\u0646");
  });

  test("merges yeh variants (maksura, Arabic yeh, Farsi yeh)", () => {
    expect(normalize("خداى خدای خداي")).toBe("خدای خدای خدای");
  });

  test("merges kaf variants", () => {
    expect(normalize("ك ک")).toBe("ک ک");
  });

  test("merges heh variants and ta-marbuta", () => {
    expect(normalize("الله اللہ اللَّهِ رحمة")).toBe("الله الله الله رحمه");
  });

  test("removes ZWNJ / join controls", () => {
    expect(normalize("می\u200Cکنم")).toBe("میکنم");
    expect(normalize("a\u200Db")).toBe("ab");
  });

  test("lowercases and strips Latin accents", () => {
    expect(normalize("Barmherzigen")).toBe("barmherzigen");
    expect(normalize("Möchten Öl")).toBe("mochten ol");
  });
});

describe("searchVerse — all translations searched by default", () => {
  test("plain Arabic finds vocalized text", () => {
    expect(searchVerse(V1, normalizeQuery("رحمن"), "contains")).toBe(true);
    expect(searchVerse(V1, normalizeQuery("الرحمن"), "contains")).toBe(true);
    expect(searchVerse(V1, normalizeQuery("الرحمن الرحيم"), "contains")).toBe(true);
  });

  test("plain Arabic 'الله' finds 'ٱللَّهِ'", () => {
    expect(searchVerse(V1, normalizeQuery("الله"), "contains")).toBe(true);
  });

  test("German found without being selected", () => {
    expect(searchVerse(V1, normalizeQuery("Barmherzigen"), "contains")).toBe(true);
  });

  test("Abdel-Haleem-only phrase found", () => {
    expect(searchVerse(V1, normalizeQuery("giver of mercy"), "contains")).toBe(true);
  });

  test("Persian found", () => {
    expect(searchVerse(V1, normalizeQuery("مهربان"), "contains")).toBe(true);
    expect(searchVerse(V1, normalizeQuery("خداوند"), "contains")).toBe(true);
  });

  test("Urdu 'اللہ' found", () => {
    expect(searchVerse(V1, normalizeQuery("اللہ"), "contains")).toBe(true);
  });
});

describe("searchVerse — selected-only scope", () => {
  test("German hidden when scope restricted to English fields", () => {
    expect(searchVerse(V1, normalizeQuery("Barmherzigen"), "contains", ["english_qarai"])).toBe(
      false,
    );
    expect(searchVerse(V1, normalizeQuery("Barmherzigen"), "contains", ["de_bubenheim"])).toBe(
      true,
    );
  });
});

describe("searchVerse — word mode", () => {
  let syntheticN = 990;
  const synthetic = (fields: Record<string, string>): QVerse =>
    ({
      surah: syntheticN++,
      ayah: 1,
      arabic: "",
      english_qarai: "",
      urdu_jawadi: "",
      ...fields,
    }) as QVerse;

  test("token equals query", () => {
    const v = synthetic({ english_qarai: "the mercy of Allah" });
    expect(searchVerse(v, normalizeQuery("mercy"), "word")).toBe(true);
    expect(searchVerse(v, normalizeQuery("the"), "word")).toBe(true);
  });

  test("token starts-with query (inflected forms)", () => {
    const v = synthetic({ english_qarai: "merciful mercy" });
    expect(searchVerse(v, normalizeQuery("mercy"), "word")).toBe(true);
    expect(searchVerse(v, normalizeQuery("mercif"), "word")).toBe(true);
  });

  test("mid-word substring does NOT match in word mode", () => {
    const v = synthetic({ english_qarai: "them their" });
    expect(searchVerse(v, normalizeQuery("the"), "word")).toBe(true); // token 'the' in 'them'
    expect(searchVerse(v, normalizeQuery("eir"), "word")).toBe(false); // inside word
  });

  test("Arabic inflected forms match via prefix", () => {
    const v = synthetic({ arabic: "الرحمن" });
    expect(searchVerse(v, normalizeQuery("الرحم"), "word")).toBe(true);
    expect(searchVerse(v, normalizeQuery("رحمن"), "word")).toBe(false); // not a token start (ال is prefix)
  });
});

describe("full-corpus regression (the evidence table)", () => {
  test("plain Arabic now finds all instances", () => {
    expect(countMatches("الرحمن")).toBeGreaterThan(0);
    expect(countMatches("الرحمن")).toBeGreaterThan(10);
    expect(countMatches("الله")).toBeGreaterThan(100);
    expect(countMatches("الرحمن الرحيم")).toBeGreaterThan(0);
  });

  test("German found corpus-wide without selection", () => {
    expect(countMatches("Barmherzigen")).toBeGreaterThan(0);
  });

  test("English Abdel-Haleem phrase found corpus-wide", () => {
    expect(countMatches("giver of mercy")).toBeGreaterThan(0);
  });

  test("Persian found corpus-wide", () => {
    expect(countMatches("مهربان")).toBeGreaterThan(0);
    expect(countMatches("خداوند")).toBeGreaterThan(0);
  });

  test("Urdu 'اللہ' finds Arabic + Urdu instances corpus-wide", () => {
    expect(countMatches("اللہ")).toBeGreaterThan(100);
  });

  test("word mode dramatically reduces noisy substring results", () => {
    const contains = countMatches("the", "contains");
    const word = countMatches("the", "word");
    expect(contains).toBeGreaterThan(1000);
    expect(word).toBeLessThan(contains);
    expect(word).toBeGreaterThan(0);
  });

  test("results span multiple surahs", () => {
    const surahs = new Set<number>();
    const qn = normalizeQuery("الرحمن");
    for (const v of ALL) if (searchVerse(v, qn, "contains")) surahs.add(v.surah);
    expect(surahs.size).toBeGreaterThan(3);
  });
});

describe("findHighlightRanges", () => {
  test("highlights vocalized Arabic for a plain query", () => {
    const ranges = findHighlightRanges("بِسْمِ ٱللَّهِ", "الله", "contains");
    expect(ranges.length).toBe(1);
    const [s, e] = ranges[0];
    expect("بِسْمِ ٱللَّهِ".slice(s, e)).toBe("ٱللَّهِ");
  });

  test("no false highlight for missing term", () => {
    expect(findHighlightRanges("In the name", "mercy", "contains")).toEqual([]);
  });
});
