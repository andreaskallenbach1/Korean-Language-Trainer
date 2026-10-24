import { describe, expect, it } from "vitest";
import { compose, composeJamo, decompose, romanizeSimple, toKeySequence } from "../src/lib/hangul";

describe("compose/decompose", () => {
  it("builds syllables", () => {
    expect(compose("ㅎ", "ㅏ", "ㄴ")).toBe("한");
    expect(compose("ㅇ", "ㅏ")).toBe("아");
    expect(decompose("국")).toEqual({ initial: "ㄱ", medial: "ㅜ", final: "ㄱ" });
  });
});

describe("composeJamo (IME automaton)", () => {
  const cases: [string[], string][] = [
    [["ㅎ", "ㅏ", "ㄴ", "ㄱ", "ㅜ", "ㄱ"], "한국"],
    [["ㄱ", "ㅏ", "ㄴ", "ㅏ"], "가나"],
    [["ㅅ", "ㅏ", "ㄱ", "ㅗ", "ㅏ"], "사과"],
    [["ㄷ", "ㅗ", "ㅐ", "ㅈ", "ㅣ"], "돼지"],
    [["ㅇ", "ㅡ", "ㅣ", "ㅅ", "ㅏ"], "의사"],
    [["ㄱ", "ㅗ", "ㅏ", "ㄴ", "ㅊ", "ㅏ", "ㄴ", "ㅎ", "ㅇ", "ㅏ", "ㅇ", "ㅛ"], "관찮아요"],
    [["ㅇ", "ㅓ", "ㅂ", "ㅅ", "ㅓ"], "업서"],
    [["ㄸ", "ㅓ", "ㄱ", "ㅃ", "ㅗ", "ㄲ", "ㅇ", "ㅣ"], "떡뽂이"],
    [["ㅏ"], "ㅏ"],
    [["ㄱ"], "ㄱ"],
    [["ㄱ", "ㄱ"], "ㄱㄱ"],
    [["ㅇ", "ㅏ", "ㄸ"], "아ㄸ"],
  ];
  it.each(cases)("%j → %s", (seq, out) => {
    expect(composeJamo(seq)).toBe(out);
  });

  it("round-trips every lesson word through its key sequence", async () => {
    const { LESSONS } = await import("../src/data/lessons");
    for (const w of LESSONS.flatMap((l) => l.words)) {
      expect(composeJamo(toKeySequence(w.ko))).toBe(w.ko);
    }
  });
});

describe("romanizeSimple", () => {
  it("romanizes syllable by syllable", () => {
    expect(romanizeSimple("가")).toBe("ga");
    expect(romanizeSimple("밥")).toBe("bap");
    expect(romanizeSimple("강")).toBe("gang");
  });
});
