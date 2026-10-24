// Browser speech: Korean text-to-speech and (where the browser allows it)
// speech recognition. Both are free and need no API key.

let voices: SpeechSynthesisVoice[] = [];
const listeners = new Set<() => void>();

function refreshVoices() {
  if (typeof speechSynthesis === "undefined") return;
  voices = speechSynthesis.getVoices();
  listeners.forEach((fn) => fn());
}

if (typeof speechSynthesis !== "undefined") {
  refreshVoices();
  speechSynthesis.addEventListener?.("voiceschanged", refreshVoices);
}

export function ttsSupported(): boolean {
  return typeof speechSynthesis !== "undefined";
}

export function koreanVoices(): SpeechSynthesisVoice[] {
  return voices.filter((v) => v.lang.toLowerCase().replace("_", "-").startsWith("ko"));
}

export function onVoicesChanged(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function pickVoice(preferred: string): SpeechSynthesisVoice | undefined {
  const ko = koreanVoices();
  return (
    ko.find((v) => v.voiceURI === preferred) ??
    // natural/online voices sound much better where available
    ko.find((v) => /natural|online|google/i.test(v.name)) ??
    ko[0]
  );
}

export const speechPrefs = { rate: 0.85, voiceURI: "" };

export function speak(text: string, rate = speechPrefs.rate): void {
  if (!ttsSupported()) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "ko-KR";
  u.rate = rate;
  const v = pickVoice(speechPrefs.voiceURI);
  if (v) u.voice = v;
  speechSynthesis.speak(u);
}

// --- recognition -----------------------------------------------------------

interface RecognitionLike {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

function recognitionCtor(): (new () => RecognitionLike) | null {
  const w = window as unknown as Record<string, unknown>;
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null) as (new () => RecognitionLike) | null;
}

export function recognitionSupported(): boolean {
  return recognitionCtor() !== null;
}

/** Listens once; resolves with the alternatives heard, rejects with an error code. */
export function listenOnce(): { promise: Promise<string[]>; stop: () => void } {
  const Ctor = recognitionCtor();
  if (!Ctor) return { promise: Promise.reject(new Error("unsupported")), stop: () => {} };
  const rec = new Ctor();
  rec.lang = "ko-KR";
  rec.interimResults = false;
  rec.maxAlternatives = 5;
  const promise = new Promise<string[]>((resolve, reject) => {
    let done = false;
    rec.onresult = (e) => {
      done = true;
      const alts = Array.from(e.results[0] ?? []).map((a) => a.transcript.trim());
      resolve(alts);
    };
    rec.onerror = (e) => {
      done = true;
      reject(new Error(e.error));
    };
    rec.onend = () => {
      if (!done) reject(new Error("no-speech"));
    };
  });
  try {
    rec.start();
  } catch {
    return { promise: Promise.reject(new Error("not-allowed")), stop: () => {} };
  }
  return { promise, stop: () => rec.stop() };
}

/** Compares what was heard with the target, ignoring spaces and punctuation. */
export function matchesSpoken(heard: string[], target: string): boolean {
  const clean = (s: string) => s.replace(/[\s.,!?~]/g, "");
  const t = clean(target);
  return heard.some((h) => clean(h) === t || clean(h).includes(t));
}
