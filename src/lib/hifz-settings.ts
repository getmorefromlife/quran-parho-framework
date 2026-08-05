export type HifzPrefs = {
  enabled: boolean;
  verseRepeatCount: number; // 1, 3, 5, 10, 20, 999 (infinite)
  playbackSpeed: number; // 0.75, 0.85, 1.0, 1.25, 1.5, 1.75, 2.0
  silenceGapSeconds: number; // 0, 2, 3, 5, 10
  selfTestBlur: boolean; // Blur text for memory testing
};

export const DEFAULT_HIFZ_PREFS: HifzPrefs = {
  enabled: false,
  verseRepeatCount: 1,
  playbackSpeed: 1.0,
  silenceGapSeconds: 0,
  selfTestBlur: false,
};

const STORAGE_KEY = "qp_hifz_prefs";

export function loadHifzPrefs(): HifzPrefs {
  if (typeof window === "undefined") return DEFAULT_HIFZ_PREFS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_HIFZ_PREFS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_HIFZ_PREFS, ...parsed };
  } catch {
    return DEFAULT_HIFZ_PREFS;
  }
}

export function saveHifzPrefs(prefs: HifzPrefs): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // ignore
  }
}
