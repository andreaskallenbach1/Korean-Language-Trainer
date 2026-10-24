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
          const p = decompose(ch);
          if (!p) continue; // punctuation
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

describe("stage 1 content", () => {
  const stage1 = LESSONS.filter((l) => l.stage === 1);

  it("has 8 lessons with dialogue, sentences, gaps and a mission", () => {
    expect(stage1.length).toBe(8);
    for (const l of stage1) {
      expect(l.dialogue?.lines.some((d) => d.who === "B"), l.id).toBe(true);
      expect(l.sentences?.length, l.id).toBeGreaterThanOrEqual(3);
      expect(l.gaps?.length, l.id).toBeGreaterThanOrEqual(3);
      expect(l.mission, l.id).toBeTruthy();
    }
  });

  it("word entries are unique across the whole course", () => {
    const all = LESSONS.flatMap((l) => l.words.map((w) => w.ko));
    const dupes = all.filter((w, i) => all.indexOf(w) !== i);
    expect(dupes).toEqual([]);
  });

  it("sentence tiles rebuild the sentence and gaps offer their answer", () => {
    for (const l of stage1) {
      for (const x of l.sentences ?? []) expect(x.tiles.join(" "), x.ko).toBe(x.ko);
      for (const g of l.gaps ?? []) {
        expect(g.options).toContain(g.answer);
        expect(g.ko).toContain("___");
      }
    }
  });

  it("builds conversation lessons whose choices are well formed", () => {
    for (const l of stage1) {
      const ex = buildLesson(l);
      expect(ex.some((e) => e.kind === "dialogue")).toBe(true);
      expect(ex.some((e) => e.kind === "build")).toBe(true);
      expect(ex[ex.length - 1].kind).toBe("mission");
      for (const e of ex) {
        if (e.kind === "choice" || e.kind === "role") {
          const answer = e.kind === "choice" ? e.answer : e.line.ko;
          expect(e.options).toContain(answer);
          expect(new Set(e.options).size).toBe(e.options.length);
        }
      }
    }
  });
});

describe("numbers", () => {
  it("spells sino-korean numbers", async () => {
    const { sino, native, phone } = await import("../src/lib/numbers");
    expect(sino(7000)).toBe("칠천");
    expect(sino(10000)).toBe("만");
    expect(sino(15000)).toBe("만오천");
    expect(sino(12500)).toBe("만이천오백");
    expect(sino(50000)).toBe("오만");
    expect(sino(16)).toBe("십육");
    expect(sino(110)).toBe("백십");
    expect(native(1, true)).toBe("한");
    expect(native(20, true)).toBe("스무");
    expect(native(25, true)).toBe("스물다섯");
    expect(native(24)).toBe("스물넷");
    expect(native(24, true)).toBe("스물네");
    expect(phone("010")).toBe("공일공");
  });
});

describe("handwriting", () => {
  it("has stroke data for every jamo and accepts a perfect copy", async () => {
    const { STROKES, checkStrokes } = await import("../src/lib/strokes");
    const { JAMO } = await import("../src/data/jamo");
    for (const j of JAMO) {
      expect(STROKES[j.char], j.char).toBeTruthy();
      expect(checkStrokes(j.char, STROKES[j.char]).ok, j.char).toBe(true);
    }
  });

  it("notices wrong direction, order and count", async () => {
    const { STROKES, checkStrokes } = await import("../src/lib/strokes");
    const a = STROKES["ㅏ"];
    expect(checkStrokes("ㅏ", [a[0].slice().reverse(), a[1]]).ok).toBe(false);
    expect(checkStrokes("ㅏ", [a[1], a[0]]).ok).toBe(false);
    expect(checkStrokes("ㅏ", [a[0]]).messages[0]).toContain("1 Strich");
  });
});
