import { JAMO, JAMO_BY_CHAR } from "../data/jamo";
import {
  LESSONS,
  type Dialogue,
  type DialogueLine,
  type GrammarCard,
  type InfoCard,
  type Lesson,
  type Mission,
  type Sentence,
  type Verb,
  type Word,
} from "../data/lessons";
import { WORD_IMAGES } from "../data/images";
import { compose, isVowel, romanizeSimple, soundSyllable } from "./hangul";
import { formatNumber, native, sino } from "./numbers";
import type { Progress } from "./progress";

export type ChoiceMode =
  | "sound"
  | "listen"
  | "read"
  | "meaning"
  | "listenWord"
  | "pair"
  | "syllable"
  | "fill"
  | "number"
  | "conjugate"
  | "picture";

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
      /** German meaning shown with fill-in-the-gap and conjugation prompts. */
      hint?: string;
    }
  | { kind: "type"; itemId: string; word: Word; dictation?: boolean }
  | { kind: "speak"; itemId: string; word: Word }
  | { kind: "grammar"; card: GrammarCard }
  | { kind: "vocab"; words: Word[] }
  | { kind: "dialogue"; dialogue: Dialogue }
  | { kind: "role"; itemId: null; prev: DialogueLine | null; line: DialogueLine; options: string[] }
  | { kind: "build"; itemId: string; sentence: Sentence; tiles: string[] }
  | { kind: "mission"; mission: Mission; lesson: Lesson };

/** Exercises that teach or wrap up but are not scored. */
export const UNSCORED = new Set<Exercise["kind"]>(["info", "intro", "grammar", "vocab", "dialogue", "mission"]);

export const jamoId = (c: string) => `j:${c}`;
export const wordId = (ko: string) => `w:${ko}`;
export const sentenceId = (ko: string) => `s:${ko}`;

const WORDS: Word[] = LESSONS.flatMap((l) => l.words);
export const WORD_BY_KO: Record<string, Word> = Object.fromEntries(WORDS.map((w) => [w.ko, w]));
const SENTENCES: Sentence[] = LESSONS.flatMap((l) => l.sentences ?? []);
export const SENTENCE_BY_KO: Record<string, Sentence> = Object.fromEntries(SENTENCES.map((x) => [x.ko, x]));

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

export const hasImage = (w: Word) => !!WORD_IMAGES[w.ko];

/** Hear and read a word, then pick its photo. Needs three other pictured words in the pool. */
function wordPicture(w: Word, pool: Word[]): Exercise | null {
  const others = pool.filter((p) => p.ko !== w.ko && hasImage(p));
  if (!hasImage(w) || others.length < 3) return null;
  return {
    kind: "choice", mode: "picture", itemId: wordId(w.ko), prompt: w.ko, audio: w.ko,
    options: shuffle([w.ko, ...pick(others, 3).map((p) => p.ko)]), answer: w.ko, word: w,
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
  if (lesson.stage >= 1) return buildConversationLesson(lesson);
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
      ex.push(wordPicture(w, wordPool) ?? wordMeaning(w, wordPool));
    }
  });
  return ex;
}

export function itemIdsOfLesson(lesson: Lesson): string[] {
  return [
    ...lesson.newJamo.filter((c) => c !== "ㅇ").map(jamoId),
    ...lesson.words.map((w) => wordId(w.ko)),
    ...(lesson.sentences ?? []).map((x) => sentenceId(x.ko)),
  ];
}

// --- stage 1+: conversation lessons ------------------------------------------

function sentenceBuild(x: Sentence): Exercise {
  return { kind: "build", itemId: sentenceId(x.ko), sentence: x, tiles: shuffle([...x.tiles, ...(x.distractors ?? [])]) };
}

function sentenceDictation(x: Sentence): Exercise {
  return { kind: "type", itemId: sentenceId(x.ko), word: { ko: x.ko, roman: "", de: x.de }, dictation: true };
}

const ALL_LEARNER_LINES = LESSONS.flatMap((l) => l.dialogue?.lines.filter((d) => d.who === "B").map((d) => d.ko) ?? []);

function roleExercises(d: Dialogue): Exercise[] {
  const own = d.lines.filter((l) => l.who === "B").map((l) => l.ko);
  return d.lines.flatMap((line, i) => {
    if (line.who !== "B") return [];
    const distractors = [...own.filter((k) => k !== line.ko), ...ALL_LEARNER_LINES.filter((k) => !own.includes(k))];
    const near = pick(distractors.filter((k) => own.includes(k)), 1);
    const far = pick(distractors.filter((k) => !near.includes(k)), 2 - near.length);
    return [
      {
        kind: "role" as const,
        itemId: null,
        prev: i > 0 ? d.lines[i - 1] : null,
        line,
        options: shuffle([line.ko, ...near, ...far]),
      },
    ];
  });
}

function gapExercise(g: NonNullable<Lesson["gaps"]>[number]): Exercise {
  return { kind: "choice", mode: "fill", itemId: null, prompt: g.ko, options: shuffle(g.options), answer: g.answer, hint: g.de };
}

const VOWEL_A = /[ㅏㅗ]/;

/** Plausible wrong polite forms for a verb (stem + wrong ending). */
function wrongPolite(v: Verb): string[] {
  const stem = v.dict.slice(0, -1);
  const last = stem[stem.length - 1];
  const parts = last ? decomposeVowel(last) : "";
  const out = new Set<string>([`${stem}요`]);
  if (stem.endsWith("하")) {
    out.add(`${stem}아요`);
    out.add(`${stem.slice(0, -1)}해어요`);
  } else {
    out.add(VOWEL_A.test(parts) ? `${stem}어요` : `${stem}아요`);
    out.add(`${stem}해요`);
  }
  out.delete(v.polite);
  return [...out];
}

function decomposeVowel(syl: string): string {
  const code = (syl.codePointAt(0) ?? 0) - 0xac00;
  if (code < 0 || code > 11171) return "";
  return "ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ"[Math.floor((code % 588) / 28)];
}

function conjugateExercise(v: Verb): Exercise {
  return {
    kind: "choice", mode: "conjugate", itemId: null, prompt: v.dict, hint: v.de,
    options: shuffle([v.polite, ...wrongPolite(v).slice(0, 3)]), answer: v.polite,
  };
}

const COUNTERS = [
  { ko: "명", de: "Personen", max: 8 },
  { ko: "잔", de: "Tassen", max: 6 },
  { ko: "병", de: "Flaschen", max: 6 },
  { ko: "개", de: "Stück", max: 10 },
];

export function numberExercise(kind: "sino" | "native"): Exercise {
  if (kind === "sino") {
    // prices in Won: 1.000–59.500 in steps of 500
    const n = (2 + Math.floor(Math.random() * 118)) * 500;
    const near = [n * 10, Math.max(500, n / 10), n + 1000, n >= 2000 ? n - 1000 : n + 2000, n + 500].filter(
      (x) => Number.isInteger(x) && x !== n && x <= 600000,
    );
    const label = (x: number) => `${formatNumber(x)} Won`;
    return {
      kind: "choice", mode: "number", itemId: null, prompt: "", audio: `${sino(n)} 원`,
      options: shuffle([label(n), ...pick([...new Set(near)], 3).map(label)]), answer: label(n),
    };
  }
  if (Math.random() < 0.3) {
    const age = 18 + Math.floor(Math.random() * 30);
    const near = [age + 1, age - 1, age + 10, age - 10].filter((x) => x >= 11 && x <= 59);
    const label = (x: number) => `${x} Jahre`;
    return {
      kind: "choice", mode: "number", itemId: null, prompt: "", audio: `${native(age, true)} 살`,
      options: shuffle([label(age), ...pick(near, 3).map(label)]), answer: label(age),
    };
  }
  const c = COUNTERS[Math.floor(Math.random() * COUNTERS.length)];
  const n = 1 + Math.floor(Math.random() * c.max);
  const others = [1, 2, 3, 4, 5, 6, 7, 8].filter((x) => x !== n);
  const label = (x: number) => `${x} ${c.de}`;
  return {
    kind: "choice", mode: "number", itemId: null, prompt: "", audio: `${native(n, true)} ${c.ko}`,
    options: shuffle([label(n), ...pick(others, 3).map(label)]), answer: label(n),
  };
}

function chunks<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function buildConversationLesson(lesson: Lesson): Exercise[] {
  const index = LESSONS.indexOf(lesson);
  const wordPool = knownWordsUpTo(index);
  const [firstGrammar, ...moreGrammar] = lesson.grammar ?? [];
  const ex: Exercise[] = [];

  if (firstGrammar) ex.push({ kind: "grammar", card: firstGrammar });

  // new words in small groups: look, listen, then check the meaning
  for (const group of chunks(lesson.words, 5)) {
    ex.push({ kind: "vocab", words: group });
    ex.push(...shuffle(group).map((w) => wordPicture(w, wordPool) ?? wordMeaning(w, wordPool)));
  }

  if (lesson.dialogue) {
    ex.push({ kind: "dialogue", dialogue: lesson.dialogue });
    ex.push(...roleExercises(lesson.dialogue));
  }

  for (const card of moreGrammar) ex.push({ kind: "grammar", card });
  ex.push(...shuffle(lesson.gaps ?? []).map(gapExercise));

  if (lesson.verbs) ex.push(...pick(lesson.verbs, 6).map(conjugateExercise));
  if (lesson.numbers) for (let i = 0; i < 6; i++) ex.push(numberExercise(lesson.numbers));

  ex.push(...(lesson.sentences ?? []).map(sentenceBuild));

  // second pass over the words: hearing and writing
  const words = shuffle(lesson.words);
  words.slice(0, 4).forEach((w) => ex.push(wordListen(w, wordPool)));
  words.slice(4, 7).forEach((w) => ex.push({ kind: "type", itemId: wordId(w.ko), word: w }));

  const sentences = shuffle(lesson.sentences ?? []);
  sentences.slice(0, 2).forEach((x) => ex.push(sentenceDictation(x)));

  const myLines = shuffle(lesson.dialogue?.lines.filter((l) => l.who === "B") ?? []).slice(0, 2);
  myLines.forEach((l) => {
    const match = SENTENCE_BY_KO[l.ko];
    ex.push({
      kind: "speak",
      itemId: match ? sentenceId(l.ko) : wordId(lesson.words[0].ko),
      word: { ko: l.ko, roman: "", de: l.de },
    });
  });

  if (lesson.mission) ex.push({ kind: "mission", mission: lesson.mission, lesson });
  return ex;
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
  if (id.startsWith("s:")) {
    const x = SENTENCE_BY_KO[id.slice(2)];
    if (!x) return null;
    return Math.random() < 0.6 ? sentenceBuild(x) : sentenceDictation(x);
  }
  const w = WORD_BY_KO[id.slice(2)];
  if (!w) return null;
  const r = Math.random();
  if (hasImage(w) && r < 0.2) return wordPicture(w, wordPool) ?? wordMeaning(w, wordPool);
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
      const sentenceIds = Object.keys(p.items).filter((k) => k.startsWith("s:"));
      const ids = [...jamo.map(jamoId), ...words.map((w) => wordId(w.ko)), ...sentenceIds];
      const e = exerciseForItem(pick(ids, 1)[0], jamo, words);
      if (e) ex.push(e);
    }
  }
  return ex;
}

/** Two exercises per item, for targeted practice (e.g. from the mistake notebook). */
export function buildFromItems(p: Progress, ids: string[]): Exercise[] {
  const { jamo, words } = allKnown(p);
  const ex: Exercise[] = [];
  for (const id of ids) {
    for (let i = 0; i < 2; i++) {
      const e = exerciseForItem(id, jamo, words);
      if (e) ex.push(e);
    }
  }
  return shuffle(ex);
}

/** Display info for any item id: Korean text and German meaning. */
export function describeItem(id: string): { ko: string; de: string; kind: string } | null {
  const key = id.slice(2);
  if (id.startsWith("j:")) {
    const j = JAMO_BY_CHAR[key];
    return j ? { ko: j.char, de: `Zeichen · ${j.roman}`, kind: "Zeichen" } : null;
  }
  if (id.startsWith("w:")) {
    const w = WORD_BY_KO[key];
    return w ? { ko: w.ko, de: w.de, kind: "Wort" } : null;
  }
  if (id.startsWith("s:")) {
    const x = SENTENCE_BY_KO[key];
    return x ? { ko: x.ko, de: x.de, kind: "Satz" } : null;
  }
  return null;
}
