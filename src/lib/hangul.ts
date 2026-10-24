// Hangul composition, decomposition, a 2-set (Dubeolsik) input automaton
// and a simple syllable romanization (Revised Romanization, no sound changes).

export const INITIALS = [
  "ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ",
  "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ",
];
export const MEDIALS = [
  "ㅏ", "ㅐ", "ㅑ", "ㅒ", "ㅓ", "ㅔ", "ㅕ", "ㅖ", "ㅗ", "ㅘ", "ㅙ",
  "ㅚ", "ㅛ", "ㅜ", "ㅝ", "ㅞ", "ㅟ", "ㅠ", "ㅡ", "ㅢ", "ㅣ",
];
export const FINALS = [
  "", "ㄱ", "ㄲ", "ㄳ", "ㄴ", "ㄵ", "ㄶ", "ㄷ", "ㄹ", "ㄺ", "ㄻ", "ㄼ", "ㄽ",
  "ㄾ", "ㄿ", "ㅀ", "ㅁ", "ㅂ", "ㅄ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ",
  "ㅍ", "ㅎ",
];

const SYLLABLE_BASE = 0xac00;
const SYLLABLE_LAST = 0xd7a3;

export function isVowel(j: string): boolean {
  return MEDIALS.includes(j);
}

export function isConsonant(j: string): boolean {
  return j !== "" && (INITIALS.includes(j) || FINALS.includes(j));
}

export function isSyllable(ch: string): boolean {
  const c = ch.codePointAt(0) ?? 0;
  return c >= SYLLABLE_BASE && c <= SYLLABLE_LAST;
}

export function compose(initial: string, medial: string, final = ""): string {
  const l = INITIALS.indexOf(initial);
  const v = MEDIALS.indexOf(medial);
  const t = FINALS.indexOf(final);
  if (l < 0 || v < 0 || t < 0) throw new Error(`Cannot compose ${initial}+${medial}+${final}`);
  return String.fromCodePoint(SYLLABLE_BASE + (l * 21 + v) * 28 + t);
}

export interface Parts {
  initial: string;
  medial: string;
  final: string;
}

export function decompose(syllable: string): Parts | null {
  if (!isSyllable(syllable)) return null;
  const idx = (syllable.codePointAt(0) as number) - SYLLABLE_BASE;
  return {
    initial: INITIALS[Math.floor(idx / 588)],
    medial: MEDIALS[Math.floor((idx % 588) / 28)],
    final: FINALS[idx % 28],
  };
}

const VOWEL_COMBOS: Record<string, string> = {
  "ㅗㅏ": "ㅘ", "ㅗㅐ": "ㅙ", "ㅗㅣ": "ㅚ",
  "ㅜㅓ": "ㅝ", "ㅜㅔ": "ㅞ", "ㅜㅣ": "ㅟ",
  "ㅡㅣ": "ㅢ",
};

const FINAL_COMBOS: Record<string, string> = {
  "ㄱㅅ": "ㄳ", "ㄴㅈ": "ㄵ", "ㄴㅎ": "ㄶ", "ㄹㄱ": "ㄺ", "ㄹㅁ": "ㄻ",
  "ㄹㅂ": "ㄼ", "ㄹㅅ": "ㄽ", "ㄹㅌ": "ㄾ", "ㄹㅍ": "ㄿ", "ㄹㅎ": "ㅀ",
  "ㅂㅅ": "ㅄ",
};

const FINAL_SPLIT: Record<string, [string, string]> = Object.fromEntries(
  Object.entries(FINAL_COMBOS).map(([pair, combo]) => [combo, [pair[0], pair[1]]]),
);

interface Block {
  l?: string;
  v?: string;
  t?: string;
}

function renderBlock(b: Block): string {
  if (b.l && b.v) return compose(b.l, b.v, b.t ?? "");
  return (b.l ?? "") + (b.v ?? "");
}

/**
 * Turns a sequence of typed jamo into Hangul text the way a Korean IME does:
 * ㅎ ㅏ ㄴ ㄱ ㅜ ㄱ → 한국, and ㄱ ㅏ ㄴ ㅏ → 가나 (the final moves on).
 * Non-jamo entries (e.g. a space) are passed through unchanged.
 */
export function composeJamo(seq: string[]): string {
  let out = "";
  let cur: Block | null = null;
  const commit = () => {
    if (cur) out += renderBlock(cur);
    cur = null;
  };

  for (const j of seq) {
    if (isVowel(j)) {
      if (!cur) {
        cur = { v: j };
      } else if (cur.l && !cur.v) {
        cur.v = j;
      } else if (cur.v && !cur.t) {
        const combo = VOWEL_COMBOS[cur.v + j];
        if (combo) {
          cur.v = combo;
        } else {
          commit();
          cur = { v: j };
        }
      } else if (cur.t) {
        const split = FINAL_SPLIT[cur.t];
        let moved: string;
        if (split) {
          cur.t = split[0];
          moved = split[1];
        } else {
          moved = cur.t;
          cur.t = undefined;
        }
        commit();
        cur = { l: moved, v: j };
      } else {
        commit();
        cur = { v: j };
      }
    } else if (INITIALS.includes(j) || FINALS.includes(j)) {
      if (!cur) {
        cur = { l: j };
      } else if (cur.l && cur.v && !cur.t && FINALS.includes(j)) {
        cur.t = j;
      } else if (cur.t && FINAL_COMBOS[cur.t + j]) {
        cur.t = FINAL_COMBOS[cur.t + j];
      } else {
        commit();
        cur = { l: j };
      }
    } else {
      commit();
      out += j;
    }
  }
  commit();
  return out;
}

/** Breaks Hangul text back into the jamo key sequence (compound vowels and finals split). */
export function toKeySequence(text: string): string[] {
  const vowelSplit: Record<string, string[]> = Object.fromEntries(
    Object.entries(VOWEL_COMBOS).map(([pair, combo]) => [combo, [pair[0], pair[1]]]),
  );
  const seq: string[] = [];
  for (const ch of text) {
    const p = decompose(ch);
    if (!p) {
      seq.push(ch);
      continue;
    }
    seq.push(p.initial);
    seq.push(...(vowelSplit[p.medial] ?? [p.medial]));
    if (p.final) seq.push(...(FINAL_SPLIT[p.final] ?? [p.final]));
  }
  return seq;
}

const ROMAN_INITIAL: Record<string, string> = {
  "ㄱ": "g", "ㄲ": "kk", "ㄴ": "n", "ㄷ": "d", "ㄸ": "tt", "ㄹ": "r", "ㅁ": "m",
  "ㅂ": "b", "ㅃ": "pp", "ㅅ": "s", "ㅆ": "ss", "ㅇ": "", "ㅈ": "j", "ㅉ": "jj",
  "ㅊ": "ch", "ㅋ": "k", "ㅌ": "t", "ㅍ": "p", "ㅎ": "h",
};
export const ROMAN_VOWEL: Record<string, string> = {
  "ㅏ": "a", "ㅐ": "ae", "ㅑ": "ya", "ㅒ": "yae", "ㅓ": "eo", "ㅔ": "e", "ㅕ": "yeo",
  "ㅖ": "ye", "ㅗ": "o", "ㅘ": "wa", "ㅙ": "wae", "ㅚ": "oe", "ㅛ": "yo", "ㅜ": "u",
  "ㅝ": "wo", "ㅞ": "we", "ㅟ": "wi", "ㅠ": "yu", "ㅡ": "eu", "ㅢ": "ui", "ㅣ": "i",
};
const ROMAN_FINAL: Record<string, string> = {
  "": "", "ㄱ": "k", "ㄲ": "k", "ㄳ": "k", "ㄴ": "n", "ㄵ": "n", "ㄶ": "n", "ㄷ": "t",
  "ㄹ": "l", "ㄺ": "k", "ㄻ": "m", "ㄼ": "l", "ㄽ": "l", "ㄾ": "l", "ㄿ": "p", "ㅀ": "l",
  "ㅁ": "m", "ㅂ": "p", "ㅄ": "p", "ㅅ": "t", "ㅆ": "t", "ㅇ": "ng", "ㅈ": "t", "ㅊ": "t",
  "ㅋ": "k", "ㅌ": "t", "ㅍ": "p", "ㅎ": "t",
};

/** Romanizes syllable by syllable, without cross-syllable sound changes. */
export function romanizeSimple(text: string): string {
  let out = "";
  for (const ch of text) {
    const p = decompose(ch);
    out += p ? ROMAN_INITIAL[p.initial] + ROMAN_VOWEL[p.medial] + ROMAN_FINAL[p.final] : ch;
  }
  return out;
}

/** The syllable used to make a single letter audible: ㄱ → 가, ㅓ → 어. */
export function soundSyllable(jamo: string): string {
  if (isVowel(jamo)) return compose("ㅇ", jamo);
  if (INITIALS.includes(jamo)) return compose(jamo, "ㅏ");
  return jamo;
}

/** Dubeolsik layout keyed by KeyboardEvent.code (physical position, layout-independent). */
export const KEY_LAYOUT: { code: string; base: string; shift?: string }[][] = [
  [
    { code: "KeyQ", base: "ㅂ", shift: "ㅃ" },
    { code: "KeyW", base: "ㅈ", shift: "ㅉ" },
    { code: "KeyE", base: "ㄷ", shift: "ㄸ" },
    { code: "KeyR", base: "ㄱ", shift: "ㄲ" },
    { code: "KeyT", base: "ㅅ", shift: "ㅆ" },
    { code: "KeyY", base: "ㅛ" },
    { code: "KeyU", base: "ㅕ" },
    { code: "KeyI", base: "ㅑ" },
    { code: "KeyO", base: "ㅐ", shift: "ㅒ" },
    { code: "KeyP", base: "ㅔ", shift: "ㅖ" },
  ],
  [
    { code: "KeyA", base: "ㅁ" },
    { code: "KeyS", base: "ㄴ" },
    { code: "KeyD", base: "ㅇ" },
    { code: "KeyF", base: "ㄹ" },
    { code: "KeyG", base: "ㅎ" },
    { code: "KeyH", base: "ㅗ" },
    { code: "KeyJ", base: "ㅓ" },
    { code: "KeyK", base: "ㅏ" },
    { code: "KeyL", base: "ㅣ" },
  ],
  [
    { code: "KeyZ", base: "ㅋ" },
    { code: "KeyX", base: "ㅌ" },
    { code: "KeyC", base: "ㅊ" },
    { code: "KeyV", base: "ㅍ" },
    { code: "KeyB", base: "ㅠ" },
    { code: "KeyN", base: "ㅜ" },
    { code: "KeyM", base: "ㅡ" },
  ],
];

export function jamoForKey(code: string, shift: boolean): string | null {
  for (const row of KEY_LAYOUT) {
    for (const k of row) {
      if (k.code === code) return shift && k.shift ? k.shift : k.base;
    }
  }
  return null;
}

/** Key presses needed to type a single jamo (compound vowels take two). */
export function keysForJamo(jamo: string): string[] {
  const entry = Object.entries(VOWEL_COMBOS).find(([, combo]) => combo === jamo);
  return entry ? [entry[0][0], entry[0][1]] : [jamo];
}
