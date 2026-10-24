import { schedule, type SrsState } from "./srs";

export interface LessonRecord {
  best: number; // 0..1
  attempts: number;
  completedAt: number;
}

export interface StudyLog {
  day: string; // YYYY-MM-DD (local)
  minutes: number;
}

export interface Settings {
  rate: number;
  voiceURI: string;
  showRoman: boolean;
}

export interface Progress {
  version: 1;
  updatedAt: number;
  xp: number;
  items: Record<string, SrsState>;
  lessons: Record<string, LessonRecord>;
  log: StudyLog[];
  settings: Settings;
}

export const WEEKLY_GOAL_DAYS = 3;
export const SESSION_MINUTES = 20; // a day counts as a study day from this many minutes

export function emptyProgress(): Progress {
  return {
    version: 1,
    updatedAt: 0,
    xp: 0,
    items: {},
    lessons: {},
    log: [],
    settings: { rate: 0.85, voiceURI: "", showRoman: true },
  };
}

export function normalize(raw: unknown): Progress {
  const base = emptyProgress();
  if (!raw || typeof raw !== "object") return base;
  const p = raw as Partial<Progress>;
  return {
    version: 1,
    updatedAt: typeof p.updatedAt === "number" ? p.updatedAt : 0,
    xp: typeof p.xp === "number" ? p.xp : 0,
    items: p.items && typeof p.items === "object" ? p.items : {},
    lessons: p.lessons && typeof p.lessons === "object" ? p.lessons : {},
    log: Array.isArray(p.log) ? p.log : [],
    settings: { ...base.settings, ...(p.settings ?? {}) },
  };
}

export function dayKey(t: number): string {
  const d = new Date(t - 4 * 60 * 60 * 1000); // days roll over at 4 a.m.
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export interface RunResult {
  /** item id → answered without mistakes */
  items: Record<string, boolean>;
  correct: number;
  total: number;
  minutes: number;
  lessonId?: string;
}

export function applyRun(p: Progress, run: RunResult, now: number): Progress {
  const items = { ...p.items };
  for (const [id, passed] of Object.entries(run.items)) {
    items[id] = schedule(items[id], passed, now);
  }
  const lessons = { ...p.lessons };
  const score = run.total ? run.correct / run.total : 0;
  let bonus = 0;
  if (run.lessonId) {
    const prev = lessons[run.lessonId];
    if (!prev) bonus = 50;
    lessons[run.lessonId] = {
      best: Math.max(prev?.best ?? 0, score),
      attempts: (prev?.attempts ?? 0) + 1,
      completedAt: now,
    };
  }
  const day = dayKey(now);
  const log = [...p.log];
  const today = log.find((l) => l.day === day);
  if (today) today.minutes = Math.round((today.minutes + run.minutes) * 10) / 10;
  else log.push({ day, minutes: Math.round(run.minutes * 10) / 10 });
  return {
    ...p,
    updatedAt: now,
    xp: p.xp + run.correct * 10 + bonus,
    items,
    lessons,
    log: log.slice(-400),
  };
}

/** Monday-based week start, as a day key. */
function weekStart(t: number): string {
  const d = new Date(t - 4 * 60 * 60 * 1000);
  const offset = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - offset);
  d.setHours(12);
  return dayKey(d.getTime() + 4 * 60 * 60 * 1000);
}

export interface WeekStats {
  studyDays: number;
  minutes: number;
  days: { key: string; minutes: number }[];
}

export function weekStats(p: Progress, now: number): WeekStats {
  const start = weekStart(now);
  const startDate = new Date(`${start}T12:00:00`);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const key = dayKey(d.getTime() + 4 * 60 * 60 * 1000);
    return { key, minutes: p.log.find((l) => l.day === key)?.minutes ?? 0 };
  });
  return {
    studyDays: days.filter((d) => d.minutes >= SESSION_MINUTES).length,
    minutes: Math.round(days.reduce((s, d) => s + d.minutes, 0)),
    days,
  };
}

/** Consecutive weeks (ending with the current or previous one) that met the weekly goal. */
export function weekStreak(p: Progress, now: number): number {
  let streak = 0;
  const WEEK = 7 * 24 * 60 * 60 * 1000;
  const current = weekStats(p, now);
  if (current.studyDays >= WEEKLY_GOAL_DAYS) streak += 1;
  for (let i = 1; i < 104; i++) {
    if (weekStats(p, now - i * WEEK).studyDays >= WEEKLY_GOAL_DAYS) streak += 1;
    else break;
  }
  return streak;
}
