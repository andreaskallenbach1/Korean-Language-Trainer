// A small SM-2 style spaced-repetition scheduler. One update per item per
// study run: "passed" means the item was answered without a mistake.

export interface SrsState {
  due: number;
  interval: number; // days
  ease: number;
  reps: number;
  lapses: number;
  lastSeen: number;
}

const DAY = 24 * 60 * 60 * 1000;
const RETRY_DELAY = 10 * 60 * 1000;

export function newState(now: number): SrsState {
  return { due: now, interval: 0, ease: 2.5, reps: 0, lapses: 0, lastSeen: now };
}

export function schedule(prev: SrsState | undefined, passed: boolean, now: number): SrsState {
  const s = prev ? { ...prev } : newState(now);
  s.lastSeen = now;
  if (passed) {
    if (s.reps === 0) s.interval = 1;
    else if (s.reps === 1) s.interval = 3;
    else s.interval = Math.round(s.interval * s.ease);
    s.reps += 1;
    s.ease = Math.min(2.8, s.ease + 0.05);
    s.due = startOfDay(now) + s.interval * DAY;
  } else {
    s.lapses += 1;
    s.reps = 0;
    s.interval = 0;
    s.ease = Math.max(1.3, s.ease - 0.2);
    s.due = now + RETRY_DELAY;
  }
  return s;
}

function startOfDay(t: number): number {
  const d = new Date(t);
  d.setHours(4, 0, 0, 0); // a "day" starts at 4 a.m. so late sessions count for the evening
  return d.getTime();
}

export function isDue(s: SrsState, now: number): boolean {
  return s.due <= now;
}

/** Rough strength label for the UI. */
export function strength(s: SrsState | undefined): "neu" | "lernend" | "gefestigt" | "sicher" {
  if (!s) return "neu";
  if (s.interval < 3) return "lernend";
  if (s.interval < 21) return "gefestigt";
  return "sicher";
}
