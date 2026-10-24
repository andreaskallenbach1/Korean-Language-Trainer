import { describe, expect, it } from "vitest";
import { JAMO_BY_CHAR } from "../src/data/jamo";
import { LESSONS } from "../src/data/lessons";
import { buildLesson, buildReview, knownJamoUpTo } from "../src/lib/exercises";
import { decompose, isVowel } from "../src/lib/hangul";
import { applyRun, emptyProgress, weekStats } from "../src/lib/progress";
import { schedule } from "../src/lib/srs";

describe("curriculum", () => {
  it("every lesson word uses only letters taught up to that lesson", () => {
    const vowelParts: Record<string, string[]> = { "ㅘ": ["ㅘ"], "ㅝ": ["ㅝ"] };
    LESSONS.forEach((lesson, i) => {
      const known = new Set(knownJamoUpTo(i));
      for (const w of lesson.words) {
        for (const ch of w.ko.replace(/\s/g, "")) {
          const p = decompose(ch)!;
          const used = [p.initial, ...(vowelParts[p.medial] ?? [p.medial])];
          for (const j of used) expect(known.has(j), `${w.ko} uses ${j} before it is taught (lesson ${lesson.id})`).toBe(true);
          if (p.final) expect(i >= 6, `${w.ko} has a final consonant before lesson 7`).toBe(true);
        }
      }
    });
  });

  it("every jamo exists in the jamo table and is taught once", () => {
    const all = LESSONS.flatMap((l) => l.newJamo);
    expect(new Set(all).size).toBe(all.length);
    all.forEach((c) => expect(JAMO_BY_CHAR[c]).toBeTruthy());
    expect(all.length).toBe(40);
  });

  it("builds every lesson with valid choice exercises", () => {
    for (const l of LESSONS) {
      const ex = buildLesson(l);
      expect(ex.length).toBeGreaterThan(10);
      for (const e of ex) {
        if (e.kind === "choice") {
          expect(e.options).toContain(e.answer);
          expect(new Set(e.options).size).toBe(e.options.length);
          expect(e.options.length).toBeGreaterThanOrEqual(2);
        }
      }
    }
  });

  it("vowel/consonant split is right", () => {
    expect(isVowel("ㅏ")).toBe(true);
    expect(isVowel("ㄱ")).toBe(false);
  });
});

describe("srs + progress", () => {
  it("grows intervals on success and resets on failure", () => {
    const now = new Date("2026-10-24T10:00:00").getTime();
    let s = schedule(undefined, true, now);
    expect(s.interval).toBe(1);
    s = schedule(s, true, now);
    expect(s.interval).toBe(3);
    s = schedule(s, true, now);
    expect(s.interval).toBeGreaterThan(3);
    s = schedule(s, false, now);
    expect(s.interval).toBe(0);
    expect(s.due).toBeGreaterThan(now);
  });

  it("records a lesson run and builds a review later", () => {
    const now = new Date("2026-10-24T10:00:00").getTime();
    const p = applyRun(emptyProgress(), { items: { "j:ㅏ": true, "w:아이": false }, correct: 5, total: 6, minutes: 25, lessonId: "h1" }, now);
    expect(p.lessons.h1.best).toBeCloseTo(5 / 6);
    expect(p.xp).toBe(100);
    expect(weekStats(p, now).studyDays).toBe(1);
    const later = now + 2 * 24 * 60 * 60 * 1000;
    const review = buildReview(p, later);
    expect(review.length).toBe(2);
  });
});
