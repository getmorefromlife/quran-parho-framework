export type LoggedEntry = { surahN: number; from: number; to: number; verses: number };

export type SessionRecord = {
  id: string;
  date: string;
  startedAt: number;
  endedAt: number;
  plannedMin: number;
  actualMin: number;
  cycleIdx: number;
  participants: string[];
  entries: LoggedEntry[];
  totalVerses: number;
};

const KEY_HISTORY = "qp_session_history";
const KEY_ROSTER = "qp_roster";
const KEY_CYCLE_IDX = "qp_cycle_idx";
const KEY_CYCLE_PROGRESS = "qp_cycle_progress";
const KEY_QUIZ_BEST = "qp_quiz_best";
const KEY_READER_BOOKMARK = "qp_reader_bookmark";

export type ReaderBookmark = { surahN: number; verse: number; updatedAt: number };

export function loadReaderBookmark(): ReaderBookmark | null {
  if (!canStore()) return null;
  const v = safeParse<Partial<ReaderBookmark>>(localStorage.getItem(KEY_READER_BOOKMARK), {});
  if (typeof v.surahN !== "number" || typeof v.verse !== "number") return null;
  return {
    surahN: v.surahN,
    verse: Math.max(1, Math.floor(v.verse)),
    updatedAt: typeof v.updatedAt === "number" ? v.updatedAt : 0,
  };
}

export function saveReaderBookmark(b: ReaderBookmark): void {
  if (!canStore()) return;
  localStorage.setItem(KEY_READER_BOOKMARK, JSON.stringify(b));
}

export type QuizBest = { score: number; streak: number };

export function loadQuizBest(): QuizBest {
  if (!canStore()) return { score: 0, streak: 0 };
  const v = safeParse<Partial<QuizBest>>(localStorage.getItem(KEY_QUIZ_BEST), {});
  return {
    score: typeof v.score === "number" && v.score >= 0 ? v.score : 0,
    streak: typeof v.streak === "number" && v.streak >= 0 ? v.streak : 0,
  };
}

export function saveQuizBest(best: QuizBest): void {
  if (!canStore()) return;
  localStorage.setItem(KEY_QUIZ_BEST, JSON.stringify(best));
}

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function canStore(): boolean {
  return typeof window !== "undefined";
}

export function loadSessionHistory(): SessionRecord[] {
  if (!canStore()) return [];
  return safeParse<SessionRecord[]>(localStorage.getItem(KEY_HISTORY), []);
}

export function addSessionRecord(rec: SessionRecord): SessionRecord[] {
  if (!canStore()) return [rec];
  const next = [rec, ...loadSessionHistory()];
  localStorage.setItem(KEY_HISTORY, JSON.stringify(next));
  return next;
}

export function loadCycleProgress(): Record<string, number[]> {
  if (!canStore()) return {};
  return safeParse<Record<string, number[]>>(localStorage.getItem(KEY_CYCLE_PROGRESS), {});
}

export function saveCycleProgress(progress: Record<string, number[]>): void {
  if (!canStore()) return;
  localStorage.setItem(KEY_CYCLE_PROGRESS, JSON.stringify(progress));
}

export type BackupData = {
  roster: string[];
  cycleIdx: number;
  cycleProgress: Record<string, number[]>;
  sessionHistory: SessionRecord[];
};

export function collectBackup(): BackupData {
  if (!canStore()) {
    return { roster: [], cycleIdx: 0, cycleProgress: {}, sessionHistory: [] };
  }
  return {
    roster: safeParse<string[]>(localStorage.getItem(KEY_ROSTER), []),
    cycleIdx: safeParse<number>(localStorage.getItem(KEY_CYCLE_IDX), 0),
    cycleProgress: loadCycleProgress(),
    sessionHistory: loadSessionHistory(),
  };
}

export function importBackup(data: Partial<BackupData>): void {
  if (!canStore()) return;
  if (Array.isArray(data.roster)) localStorage.setItem(KEY_ROSTER, JSON.stringify(data.roster));
  if (typeof data.cycleIdx === "number") localStorage.setItem(KEY_CYCLE_IDX, String(data.cycleIdx));
  if (data.cycleProgress && typeof data.cycleProgress === "object")
    localStorage.setItem(KEY_CYCLE_PROGRESS, JSON.stringify(data.cycleProgress));
  if (Array.isArray(data.sessionHistory))
    localStorage.setItem(KEY_HISTORY, JSON.stringify(data.sessionHistory));
}

export function clearAllData(): void {
  if (!canStore()) return;
  [KEY_ROSTER, KEY_CYCLE_IDX, KEY_CYCLE_PROGRESS, KEY_HISTORY].forEach((k) =>
    localStorage.removeItem(k),
  );
}
