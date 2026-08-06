export type TimerDurations = { session: number; qa: number; turn: number };

export const DEFAULT_DURATIONS: TimerDurations = { session: 60, qa: 15, turn: 5 };

export const SESSION_PRESETS = [30, 45, 60, 90];
export const QA_PRESETS = [2, 5, 10, 15];
export const TURN_PRESETS = [3, 5, 10];

const STORAGE_KEY = "qp_timer_durations";
const MAX_MINUTES = 480;

export function toSeconds(min: number): number {
  return Math.round(min) * 60;
}

function clampMin(n: number): number {
  if (!Number.isFinite(n)) return 1;
  return Math.max(1, Math.min(MAX_MINUTES, Math.round(n)));
}

export function loadTimerDurations(): TimerDurations {
  if (typeof window === "undefined") return { ...DEFAULT_DURATIONS };
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (raw && typeof raw === "object") {
      return {
        session: clampMin(raw.session),
        qa: clampMin(raw.qa),
        turn: clampMin(raw.turn),
      };
    }
  } catch {
    // ignore malformed storage, fall back to defaults
  }
  return { ...DEFAULT_DURATIONS };
}

export function saveTimerDurations(d: TimerDurations): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        session: clampMin(d.session),
        qa: clampMin(d.qa),
        turn: clampMin(d.turn),
      }),
    );
  } catch {
    // storage unavailable (private mode) — ignore
  }
}
