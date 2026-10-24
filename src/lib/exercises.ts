import { JAMO, JAMO_BY_CHAR } from "../data/jamo";
import { LESSONS, type InfoCard, type Lesson, type Word } from "../data/lessons";
import { compose, isVowel, romanizeSimple, soundSyllable } from "./hangul";
import type { Progress } from "./progress";

export type ChoiceMode = "sound" | "listen" | "read" | "meaning" | "listenWord" | "pair" | "syllable";

export type Exercise =
  | { kind: "info"; card: InfoCard }
  | { kind: "intro"; jamo: string }
  | {
      kind: "choice";
      mode: ChoiceMode;
      itemId: string | null;
      prompt: string;
      audio?: string;
      options: string[];
      answer: string;
      word?: Word;
    }
  | { kind: "type"; itemId: string; word: Word }
  | { kind: "speak"; itemId: string; word: Word };

export const jamoId = (c: string) => `j:${c}`;
export const wordId = (ko: string) => `w:${ko}`;

const WORDS: Word[] = LESSONS.flatMap((l) => l.words);
export const WORD_BY_KO: Record<string, Word> = Object.fromEntries(WORDS.map((w) => [w.ko, w]));

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pick<T>(arr: T[], n: number): T[] {
  return shuffle(arr).slice(0, n);
}

/** Builds options: the answer plus up to three distinct distractors, shuffled. */
function options(answer: string, candidates: string[], n = 4): string[] {
  const pool = [...new Set(candidates.filter((c) => c && c !== answer))];
  return shuffle([answer, ...pick(pool, n - 1)]);
}

export function knownJamoUpTo(lessonIndex: number): string[] {
  return LESSONS.slice(0, lessonIndex + 1).flatMap((l) => l.newJamo);
}

export function knownWordsUpTo(lessonIndex: number): Word[] {
  return LESSONS.slice(0, lessonIndex + 1).flatMap((l) => l.words);
}

const MUTATIONS: [string, string][] = [
  ["eo", "o"], ["o", "eo"], ["u", "eu"], ["eu", "u"], ["ae", "e"], ["e", "ae"],
  ["kk", "k"], ["k", "g"], ["g", "k"], ["tt", "t"], ["t", "d"], ["d", "t"],
  ["pp", "p"], ["p", "b"], ["b", "p"], ["jj", "j"], ["ch", "j"], ["j", "ch"],
  ["ss", "s"], ["s", "ss"], ["r", "l"], ["ng", "n"], ["n", "m"], ["m", "n"],
  ["ya", "yeo"], ["yeo", "yo"], ["yo", "yu"], ["wa", "wo"], ["wo", "wa"], ["i", "ui"],
];

function romanDistractors(roman: string): string[] {
  const out = new Set<string>();
  for (const [from, to] of shuffle(MUTATIONS)) {
    const idx = roman.indexOf(from);
    if (idx >= 0) out.add(roman.slice(0, idx) + to + roman.slice(idx + from.length));
    if (out.size >= 6) break;
  }
  out.delete(roman);
  return [...out];
}

// --- single exercise builders ---------------------------------------------

function jamoSound(c: string, pool: string[]): Exercise {
  const j = JAMO_BY_CHAR[c];
  const sameKind = pool.filter((p) => isVowel(p) === isVowel(c));
  const cands = (sameKind.length >= 4 ? sameKind : JAMO.map((x) => x.char).filter((x) => isVowel(x) === isVowel(c)))
    .map((p) => JAMO_BY_CHAR[p].roman);
  return { kind: "choice", mode: "sound", itemId: jamoId(c), prompt: c, options: options(j.roman, cands), answer: j.roman };
}

function jamoListen(c: string, pool: string[]): Exercise {
  const syl = soundSyllable(c);
  const sameKind = pool.filter((p) => isVowel(p) === isVowel(c));
  const cands = (sameKind.length >= 4 ? sameKind : JAMO.map((x) => x.char).filter((x) => isVowel(x) === isVowel(c)))
    .map(soundSyllable);
  return { kind: "choice", mode: "listen", itemId: jamoId(c), prompt: "", audio: syl, options: options(syl, cands), answer: syl };
}

function wordRead(w: Word, pool: Word[]): Exercise {
  const cands = [...romanDistractors(w.roman), ...pool.map((p) => p.roman)];
  // prefer close mutations over unrelated words
  const close = romanDistractors(w.roman);
  const opts = close.length >= 3 ? shuffle([w.roman, ...pick(close, 3)]) : options(w.roman, cands);
  return { kind: "choice", mode: "read", itemId: wordId(w.ko), prompt: w.ko, options: opts, answer: w.roman, word: w };
}

function wordMeaning(w: Word, pool: Word[]): Exercise {
  return {
    kind: "choice", mode: "meaning", itemId: wordId(w.ko), prompt: w.ko,
    options: options(w.de, pool.map((p) => p.de)), answer: w.de, word: w,
  };
}

function wordListen(w: Word, pool: Word[]): Exercise {
  const similar = pool.filter((p) => Math.abs(p.ko.length - w.ko.length) <= 1);
  return {
    kind: "choice", mode: "listenWord", itemId: wordId(w.ko), prompt: "", audio: w.ko,
    options: options(w.ko, (similar.length >= 4 ? similar : pool).map((p) => p.ko)), answer: w.ko, word: w,
  };
}

function soundPair(group: string[]): Exercise {
  const answer = group[Math.floor(Math.random() * group.length)];
  return { kind: "choice", mode: "pair", itemId: null, prompt: "", audio: answer, options: shuffle(group), answer };
}

function syllableRead(syl: string, pool: string[]): Exercise {
  const roman = romanizeSimple(syl);
  return {
    kind: "choice", mode: "syllable", itemId: null, prompt: syl,
    options: options(roman, [...romanDistractors(roman), ...pool.map(romanizeSimple)]), answer: roman,
  };
}

function practiceSyllables(newJamo: string[], known: string[]): string[] {
  const vowels = known.filter(isVowel);
  const consonants = known.filter((c) => !isVowel(c));
  const out: string[] = [];
  for (const c of newJamo) {
    if (isVowel(c)) {
      const cs = consonants.length ? pick(consonants, 2) : ["ㅇ"];
      cs.forEach((k) => out.push(compose(k, c)));
    } else {
      pick(vowels, 2).forEach((v) => out.push(compose(c, v)));
    }
  }
  return pick([...new Set(out)], 5);
}

// --- full runs -------------------------------------------------------------

export function buildLesson(lesson: Lesson): Exercise[] {
  const index = LESSONS.indexOf(lesson);
  const known = knownJamoUpTo(index);
  const wordPool = knownWordsUpTo(index);
  const ex: Exercise[] = lesson.info.map((card) => ({ kind: "info", card }));

  // ㅇ is introduced but not drilled on its own: it is silent at the start of a syllable
  const drilled = lesson.newJamo.filter((c) => c !== "ㅇ");
  for (const c of lesson.newJamo) {
    ex.push({ kind: "intro", jamo: c });
    if (c !== "ㅇ") ex.push(jamoSound(c, known));
  }
  ex.push(...shuffle(drilled.map((c) => jamoListen(c, known))));

  if (drilled.length) {
    const syls = practiceSyllables(drilled, known);
    ex.push(...syls.map((s) => syllableRead(s, syls)));
  }

  const groups = lesson.soundGroups ?? [];
  const pairCount = lesson.newJamo.length ? 4 : 8;
  for (let i = 0; i < Math.min(pairCount, groups.length * 2); i++) ex.push(soundPair(groups[i % groups.length]));

  for (const w of lesson.words) ex.push(wordRead(w, wordPool));

  // second pass over the words: meaning, listening, typing and speaking
  const cycle = ["meaning", "type", "listenWord", "speak", "meaning", "type", "listenWord"] as const;
  let types = 0;
  let speaks = 0;
  shuffle(lesson.words).forEach((w, i) => {
    let kind: (typeof cycle)[number] = cycle[i % cycle.length];
    if (kind === "type" && types >= 4) kind = "meaning";
    if (kind === "speak" && speaks >= 3) kind = "listenWord";
    if (kind === "type") {
      types++;
      ex.push({ kind: "type", itemId: wordId(w.ko), word: w });
    } else if (kind === "speak") {
      speaks++;
      ex.push({ kind: "speak", itemId: wordId(w.ko), word: w });
    } else if (kind === "listenWord") {
      ex.push(wordListen(w, wordPool));
    } else {
      ex.push(wordMeaning(w, wordPool));
    }
  });
  return ex;
}

export function itemIdsOfLesson(lesson: Lesson): string[] {
  return [...lesson.newJamo.filter((c) => c !== "ㅇ").map(jamoId), ...lesson.words.map((w) => wordId(w.ko))];
}

function allKnown(p: Progress) {
  const jamo = Object.keys(p.items).filter((k) => k.startsWith("j:")).map((k) => k.slice(2));
  const words = Object.keys(p.items)
    .filter((k) => k.startsWith("w:"))
    .map((k) => WORD_BY_KO[k.slice(2)])
    .filter(Boolean);
  return { jamo, words };
}

function exerciseForItem(id: string, jamoPool: string[], wordPool: Word[]): Exercise | null {
  if (id.startsWith("j:")) {
    const c = id.slice(2);
    if (!JAMO_BY_CHAR[c]) return null;
    return Math.random() < 0.5 ? jamoSound(c, jamoPool) : jamoListen(c, jamoPool);
  }
  const w = WORD_BY_KO[id.slice(2)];
  if (!w) return null;
  const r = Math.random();
  if (r < 0.3) return wordRead(w, wordPool);
  if (r < 0.55) return wordMeaning(w, wordPool);
  if (r < 0.75) return wordListen(w, wordPool);
  return { kind: "type", itemId: id, word: w };
}

export function dueItems(p: Progress, now: number): string[] {
  return Object.entries(p.items)
    .filter(([, s]) => s.due <= now)
    .sort((a, b) => a[1].due - b[1].due)
    .map(([id]) => id);
}

export function buildReview(p: Progress, now: number, limit = 30): Exercise[] {
  const { jamo, words } = allKnown(p);
  return shuffle(dueItems(p, now).slice(0, limit))
    .map((id) => exerciseForItem(id, jamo, words))
    .filter((e): e is Exercise => e !== null);
}

export type PracticeKind = "listen" | "type" | "mixed";

export function buildPractice(p: Progress, kind: PracticeKind, count = 16): Exercise[] {
  const { jamo, words } = allKnown(p);
  if (!jamo.length) return [];
  const done = LESSONS.filter((l) => p.lessons[l.id]);
  const groups = done.flatMap((l) => l.soundGroups ?? []);
  const ex: Exercise[] = [];
  for (let i = 0; i < count; i++) {
    if (kind === "listen") {
      const r = Math.random();
      if (groups.length && r < 0.4) ex.push(soundPair(groups[Math.floor(Math.random() * groups.length)]));
      else if (words.length >= 4 && r < 0.75) ex.push(wordListen(pick(words, 1)[0], words));
      else ex.push(jamoListen(pick(jamo, 1)[0], jamo));
    } else if (kind === "type") {
      if (!words.length) break;
      const w = pick(words, 1)[0];
      ex.push({ kind: "type", itemId: wordId(w.ko), word: w });
    } else {
      const ids = [...jamo.map(jamoId), ...words.map((w) => wordId(w.ko))];
      const e = exerciseForItem(pick(ids, 1)[0], jamo, words);
      if (e) ex.push(e);
    }
  }
  return ex;
}
