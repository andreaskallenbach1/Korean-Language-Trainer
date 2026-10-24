import { useCallback, useEffect, useRef, useState } from "react";
import { JAMO_BY_CHAR, GROUP_LABELS } from "../data/jamo";
import type { Word } from "../data/lessons";
import { shuffle, UNSCORED, type Exercise } from "../lib/exercises";
import { composeJamo, toKeySequence, keysForJamo, soundSyllable } from "../lib/hangul";
import type { RunResult } from "../lib/progress";
import { listenOnce, matchesSpoken, recognitionSupported, recordingSupported, speak, startRecording } from "../lib/speech";
import { HangulText } from "./HangulText";
import { Keyboard } from "./Keyboard";
import { BuildStep, DialogueStep, GrammarStep, RoleStep, VocabStep } from "./ConversationSteps";
import { MissionStep } from "./MissionStep";
import { SyllableAssembly } from "./SyllableAssembly";
import { HandwritingPad, StrokeOrder } from "./HandwritingPad";
import { SpeakerButton, useEnter, WordImage, WordReveal } from "./ui";

interface Props {
  title: string;
  exercises: Exercise[];
  showRoman: boolean;
  lessonId?: string;
  onFinish: (r: RunResult) => void;
  onAbort: (r: RunResult | null) => void;
}

interface QueueEntry {
  ex: Exercise;
  retry: boolean;
}

const IDLE_CAP_MS = 2 * 60 * 1000;

const QUESTIONS: Record<string, string> = {
  sound: "Wie klingt dieses Zeichen?",
  listen: "Was hörst du?",
  read: "Wie liest man dieses Wort?",
  meaning: "Was bedeutet dieses Wort?",
  listenWord: "Welches Wort hörst du?",
  pair: "Genau hinhören: Welche Silbe war das?",
  syllable: "Wie liest man diese Silbe?",
  fill: "Was gehört in die Lücke?",
  number: "Welche Zahl hörst du?",
  conjugate: "Wie lautet die höfliche Alltagsform?",
  picture: "Welches Bild passt?",
};

const MISSION_XP = 30;

/** A retried exercise gets its options in a new order, so position cannot be memorised. */
function reshuffled(ex: Exercise): Exercise {
  if (ex.kind === "choice" || ex.kind === "role") return { ...ex, options: shuffle(ex.options) };
  if (ex.kind === "build") return { ...ex, tiles: shuffle(ex.tiles) };
  return ex;
}

export function Player({ title, exercises, showRoman, lessonId, onFinish, onAbort }: Props) {
  const [queue, setQueue] = useState<QueueEntry[]>(() => exercises.map((ex) => ({ ex, retry: false })));
  const [pos, setPos] = useState(0);
  const [confirmAbort, setConfirmAbort] = useState(false);
  const stats = useRef({ correct: 0, total: 0, items: {} as Record<string, boolean>, activeMs: 0, last: Date.now(), bonusXp: 0 });

  const tick = useCallback(() => {
    const now = Date.now();
    stats.current.activeMs += Math.min(now - stats.current.last, IDLE_CAP_MS);
    stats.current.last = now;
  }, []);

  const result = useCallback((): RunResult => {
    tick();
    const s = stats.current;
    return { items: s.items, correct: s.correct, total: s.total, minutes: s.activeMs / 60000, lessonId, bonusXp: s.bonusXp };
  }, [lessonId, tick]);

  const entry = queue[pos];
  const scoredTotal = exercises.filter((e) => !UNSCORED.has(e.kind)).length;

  // `requeue` defaults to "answer was wrong"; a solution found with a hint
  // counts as a mistake but does not need to come back in this run
  const answer = useCallback(
    (correct: boolean, requeue = !correct) => {
      tick();
      const s = stats.current;
      const { ex, retry } = queue[pos];
      const itemId = "itemId" in ex ? ex.itemId : null;
      if (!retry) {
        s.total += 1;
        if (correct) s.correct += 1;
      }
      if (itemId) s.items[itemId] = (s.items[itemId] ?? true) && correct && !retry;
      if (requeue) setQueue((q) => [...q, { ex: reshuffled(ex), retry: true }]);
    },
    [pos, queue, tick],
  );

  const next = useCallback(() => {
    tick();
    if (pos + 1 >= queue.length) onFinish(result());
    else setPos(pos + 1);
  }, [pos, queue.length, onFinish, result, tick]);

  if (!entry) return null;
  const done = Math.min(pos, queue.length);

  return (
    <div className="player">
      <div className="player-top">
        <button type="button" className="btn-ghost" onClick={() => setConfirmAbort(true)} aria-label="Beenden">
          ✕
        </button>
        <div className="player-progress" role="progressbar" aria-valuenow={done} aria-valuemax={queue.length}>
          <div style={{ width: `${(done / queue.length) * 100}%` }} />
        </div>
        <span className="player-count">
          {done}/{queue.length}
        </span>
      </div>
      <p className="player-title">{title}</p>

      {confirmAbort && (
        <div className="confirm">
          <p>Jetzt beenden? Was du bisher richtig hattest, wird gespeichert.</p>
          <div className="row">
            <button type="button" className="btn" onClick={() => setConfirmAbort(false)}>
              Weiterlernen
            </button>
            <button type="button" className="btn-secondary" onClick={() => onAbort(stats.current.total ? result() : null)}>
              Beenden
            </button>
          </div>
        </div>
      )}

      <div className="stage" key={pos}>
        {entry.retry && <p className="retry-tag">Noch einmal</p>}
        {entry.ex.kind === "info" && <InfoStep ex={entry.ex} onNext={next} />}
        {entry.ex.kind === "intro" && <IntroStep jamo={entry.ex.jamo} onNext={next} />}
        {entry.ex.kind === "choice" && (
          <ChoiceStep ex={entry.ex} showRoman={showRoman} onAnswer={answer} onNext={next} />
        )}
        {entry.ex.kind === "type" && (
          <TypeStep word={entry.ex.word} dictation={entry.ex.dictation} showRoman={showRoman} onAnswer={answer} onNext={next} />
        )}
        {entry.ex.kind === "speak" && <SpeakStep word={entry.ex.word} onAnswer={answer} onNext={next} />}
        {entry.ex.kind === "grammar" && <GrammarStep card={entry.ex.card} onNext={next} />}
        {entry.ex.kind === "write" && <WriteStep jamo={entry.ex.jamo} onNext={next} />}
        {entry.ex.kind === "vocab" && <VocabStep words={entry.ex.words} showRoman={showRoman} onNext={next} />}
        {entry.ex.kind === "dialogue" && <DialogueStep dialogue={entry.ex.dialogue} onNext={next} />}
        {entry.ex.kind === "role" && <RoleStep ex={entry.ex} onAnswer={answer} onNext={next} />}
        {entry.ex.kind === "build" && <BuildStep ex={entry.ex} onAnswer={answer} onNext={next} />}
        {entry.ex.kind === "mission" && (
          <MissionStep
            mission={entry.ex.mission}
            lesson={entry.ex.lesson}
            onDone={(passed) => {
              if (passed) stats.current.bonusXp += MISSION_XP;
              next();
            }}
          />
        )}
      </div>
      <p className="player-foot">{scoredTotal} Aufgaben in dieser Runde · Fehler kommen am Ende noch einmal</p>
    </div>
  );
}

function WriteStep({ jamo, onNext }: { jamo: string; onNext: () => void }) {
  return (
    <div className="card write">
      <p className="eyebrow">Schreiben: Schau dir die Strichfolge an und zeichne {jamo} nach</p>
      <div className="write-grid">
        <StrokeOrder jamo={jamo} />
        <HandwritingPad jamo={jamo} />
      </div>
      <button type="button" className="btn" onClick={onNext}>
        Weiter
      </button>
    </div>
  );
}

function InfoStep({ ex, onNext }: { ex: Extract<Exercise, { kind: "info" }>; onNext: () => void }) {
  useEnter(onNext);
  return (
    <div className="card info">
      <p className="eyebrow">Wissen</p>
      <h2>{ex.card.title}</h2>
      {ex.card.body.map((p, i) => (
        <p key={i} className="info-p">
          <HangulText text={p} />
        </p>
      ))}
      {ex.card.demo && <SyllableAssembly syllable={ex.card.demo} />}
      <button type="button" className="btn" onClick={onNext}>
        Weiter
      </button>
    </div>
  );
}

function IntroStep({ jamo, onNext }: { jamo: string; onNext: () => void }) {
  const j = JAMO_BY_CHAR[jamo];
  // ㅇ is silent at the start, so let it be heard as the final "ng"
  const sample = jamo === "ㅇ" ? "앙" : soundSyllable(jamo);

  useEffect(() => {
    speak(sample);
  }, [sample]);
  useEnter(onNext);

  const keys = keysForJamo(jamo);
  return (
    <div className="card intro">
      <p className="eyebrow">Neues Zeichen · {GROUP_LABELS[j.group]}</p>
      <div className="intro-grid">
        <div className="glyph" aria-label={`Zeichen ${jamo}`}>
          {jamo}
        </div>
        <div className="intro-text">
          <p className="intro-roman">
            <span className="label">Umschrift</span> {j.roman}
          </p>
          {j.name && (
            <p className="intro-roman">
              <span className="label">Name</span> <span className="ko">{j.name}</span> ({j.nameRoman})
            </p>
          )}
          <p>{j.sound}</p>
          <p className="mnemonic">
            <span className="label">Merkhilfe</span> {j.mnemonic}
          </p>
          <p className="muted small">
            Tastatur: {keys.join(" + ")}
          </p>
        </div>
      </div>
      <div className="row">
        <SpeakerButton text={sample} label={`Laut hören (${sample})`} />
        {j.name && <SpeakerButton text={j.name} label="Namen hören" />}
      </div>
      <button type="button" className="btn" onClick={onNext}>
        Verstanden
      </button>
    </div>
  );
}

function ChoiceStep({
  ex,
  showRoman,
  onAnswer,
  onNext,
}: {
  ex: Extract<Exercise, { kind: "choice" }>;
  showRoman: boolean;
  onAnswer: (c: boolean) => void;
  onNext: () => void;
}) {
  const [picked, setPicked] = useState<string | null>(null);
  const isAudio = ex.mode === "listen" || ex.mode === "listenWord" || ex.mode === "pair" || ex.mode === "number";
  const koOptions = ["listen", "listenWord", "pair", "fill", "conjugate"].includes(ex.mode);
  // the full sentence of a gap exercise, without the German hint in parentheses
  const filled = ex.mode === "fill" ? ex.prompt.replace("___", ex.answer).replace(/\s*\(.*?\)\s*$/, "") : null;

  useEffect(() => {
    if (ex.audio) speak(ex.audio);
  }, [ex.audio]);

  const choose = useCallback(
    (opt: string) => {
      if (picked) return;
      setPicked(opt);
      onAnswer(opt === ex.answer);
      if (filled) speak(filled);
      else if (ex.mode === "conjugate") speak(ex.answer);
      else if (!isAudio) speak(ex.word?.ko ?? ex.prompt);
    },
    [picked, ex, onAnswer, isAudio, filled],
  );

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const n = Number(e.key);
      if (!picked && n >= 1 && n <= ex.options.length) choose(ex.options[n - 1]);
      if (e.code === "Space" && ex.audio) {
        e.preventDefault();
        speak(ex.audio);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [picked, ex, choose]);
  useEnter(picked ? onNext : null);

  const correct = picked === ex.answer;
  return (
    <div className="card choice">
      <p className="eyebrow">{QUESTIONS[ex.mode]}</p>
      {isAudio ? (
        <div className="prompt-audio">
          <SpeakerButton text={ex.audio ?? ""} label="Nochmal hören" big />
          <span className="muted small">Leertaste spielt erneut ab</span>
        </div>
      ) : ex.mode === "fill" ? (
        <div className="prompt-fill">
          <p className="ko fill-sentence">
            {ex.prompt.split("___").map((part, i, arr) => (
              <span key={i}>
                {part}
                {i < arr.length - 1 && <span className={`gap ${picked ? (picked === ex.answer ? "ok" : "bad") : ""}`}>{picked ? ex.answer : "?"}</span>}
              </span>
            ))}
          </p>
          <p className="muted">{ex.hint}</p>
        </div>
      ) : ex.mode === "conjugate" ? (
        <div className="prompt-fill">
          <p className="prompt-word ko">{ex.prompt}</p>
          <p className="muted">{ex.hint}</p>
        </div>
      ) : (
        <div className={ex.mode === "sound" ? "glyph" : "prompt-word ko"}>{ex.prompt}</div>
      )}
      <div className={`options ${koOptions ? "options-ko" : ""} ${ex.mode === "picture" ? "options-pictures" : ""}`}>
        {ex.options.map((opt, i) => {
          const state = !picked ? "" : opt === ex.answer ? "is-right" : opt === picked ? "is-wrong" : "is-dim";
          return (
            <button type="button" key={opt} className={`option ${state}`} onClick={() => choose(opt)} disabled={!!picked}>
              <span className="option-key">{i + 1}</span>
              {ex.mode === "picture" ? (
                <>
                  <WordImage ko={opt} size="lg" />
                  {picked && <span className="picture-label ko">{opt}</span>}
                </>
              ) : (
                <span className={koOptions ? "ko" : ""}>{opt}</span>
              )}
            </button>
          );
        })}
      </div>
      {picked && (
        <div className={`feedback ${correct ? "ok" : "bad"}`}>
          <p className="feedback-title">{correct ? "Richtig!" : `Leider falsch. Richtig ist: ${ex.answer}`}</p>
          {ex.word && <WordReveal word={ex.word} showRoman={showRoman} />}
          {ex.mode === "syllable" && <SyllableAssembly syllable={ex.prompt} />}
          {filled && (
            <p className="row">
              <span className="ko big-inline">{filled}</span>
              <SpeakerButton text={filled} />
            </p>
          )}
          {ex.mode === "number" && ex.audio && (
            <p className="row">
              <span className="ko big-inline">{ex.audio}</span>
              <SpeakerButton text={ex.audio} />
            </p>
          )}
          {!ex.word && ex.mode === "pair" && (
            <div className="row">
              {ex.options.map((o) => (
                <SpeakerButton key={o} text={o} label={o} />
              ))}
            </div>
          )}
          <button type="button" className="btn" onClick={onNext} autoFocus>
            Weiter
          </button>
        </div>
      )}
    </div>
  );
}

const PUNCT = /[.,!?~]/g;

function TypeStep({
  word,
  dictation,
  showRoman,
  onAnswer,
  onNext,
}: {
  word: Word;
  dictation?: boolean;
  showRoman: boolean;
  onAnswer: (c: boolean, requeue?: boolean) => void;
  onNext: () => void;
}) {
  const [keys, setKeys] = useState<string[]>([]);
  const [checked, setChecked] = useState<null | boolean>(null);
  const [showHint, setShowHint] = useState(false);
  const text = composeJamo(keys);
  // punctuation is not on the keyboard, so it is neither typed nor compared
  const plain = word.ko.replace(PUNCT, "").trim();
  const target = toKeySequence(plain);
  const nextKey = showHint ? target[keys.length] ?? null : null;

  useEffect(() => {
    speak(word.ko);
  }, [word.ko]);

  const check = useCallback(() => {
    if (checked !== null || !keys.length) return;
    const ok = text.replace(/\s+/g, " ").trim() === plain;
    setChecked(ok);
    onAnswer(ok && !showHint, !ok);
    speak(word.ko);
  }, [checked, keys.length, text, word.ko, onAnswer, showHint]);

  const onJamo = useCallback((j: string) => {
    if (checked === null) setKeys((k) => [...k, j]);
  }, [checked]);
  const onBackspace = useCallback(() => {
    if (checked === null) setKeys((k) => k.slice(0, -1));
  }, [checked]);
  const onSpace = useCallback(() => {
    if (checked === null && plain.includes(" ")) setKeys((k) => [...k, " "]);
  }, [checked, plain]);
  const onEnter = useCallback(() => (checked === null ? check() : onNext()), [checked, check, onNext]);

  return (
    <div className="card type">
      <p className="eyebrow">{dictation ? "Diktat: Hör zu und schreib den Satz" : "Schreib das Wort auf Koreanisch"}</p>
      <div className="type-prompt">
        <span className={dictation ? "type-de type-de-small" : "type-de"}>{word.de}</span>
        {showRoman && word.roman && <span className="type-roman">{word.roman}</span>}
        <SpeakerButton text={word.ko} />
      </div>
      <div className={`type-field ${checked === true ? "ok" : checked === false ? "bad" : ""}`} aria-live="polite">
        <span className="ko">{text}</span>
        {checked === null && <span className="caret" />}
      </div>
      {checked === null ? (
        <>
          <Keyboard onJamo={onJamo} onBackspace={onBackspace} onSpace={plain.includes(" ") ? onSpace : undefined} onEnter={onEnter} hint={nextKey} />
          <div className="row">
            <button type="button" className="btn-secondary" onClick={() => setShowHint(true)} disabled={showHint}>
              Tipp: nächste Taste zeigen
            </button>
            <button type="button" className="btn" onClick={check} disabled={!keys.length}>
              Prüfen
            </button>
          </div>
        </>
      ) : (
        <div className={`feedback ${checked ? "ok" : "bad"}`}>
          <p className="feedback-title">{checked ? (showHint ? "Richtig, mit Tipp." : "Richtig geschrieben!") : "Nicht ganz."}</p>
          {!checked && (
            <p>
              Richtig: <span className="ko big-inline">{word.ko}</span> · Tasten: <span className="ko">{target.join(" ")}</span>
            </p>
          )}
          <WordReveal word={word} showRoman={showRoman} />
          <KeyboardEnter onEnter={onEnter} />
          <button type="button" className="btn" onClick={onNext}>
            Weiter
          </button>
        </div>
      )}
    </div>
  );
}

function KeyboardEnter({ onEnter }: { onEnter: () => void }) {
  useEnter(onEnter);
  return null;
}

let recordingBlocked = false;

/** Record yourself, then play your version right after the model voice. */
function CompareRecorder({ text }: { text: string }) {
  const [state, setState] = useState<"idle" | "rec" | "done">("idle");
  const [url, setUrl] = useState("");
  const [available, setAvailable] = useState(recordingSupported() && !recordingBlocked);
  const stopRef = useRef<() => void>(() => {});
  useEffect(() => () => stopRef.current(), []);
  if (!available) return null;

  const start = async () => {
    try {
      const { stop, result } = await startRecording();
      stopRef.current = stop;
      setState("rec");
      const u = await result;
      setUrl(u);
      setState("done");
    } catch {
      // microphone refused (e.g. inside claude.ai): hide the feature for this visit
      recordingBlocked = true;
      setAvailable(false);
    }
  };

  const compare = () => {
    speak(text);
    const a = new Audio(url);
    setTimeout(() => void a.play(), 400 + text.length * 260);
  };

  return (
    <div className="row compare">
      {state === "rec" ? (
        <button type="button" className="btn-mic is-live" onClick={() => stopRef.current()}>
          ■ Aufnahme beenden
        </button>
      ) : (
        <button type="button" className="btn-secondary" onClick={start}>
          🎙 {state === "done" ? "Neu aufnehmen" : "Mich aufnehmen"}
        </button>
      )}
      {state === "done" && (
        <>
          <button type="button" className="btn-audio" onClick={() => void new Audio(url).play()}>
            ▶ Meine Aufnahme
          </button>
          <button type="button" className="btn-audio" onClick={compare}>
            ⇄ Vorbild, dann ich
          </button>
        </>
      )}
    </div>
  );
}

let recognitionBlocked = false;

function SpeakStep({ word, onAnswer, onNext }: { word: Word; onAnswer: (c: boolean) => void; onNext: () => void }) {
  const [phase, setPhase] = useState<"ready" | "listening" | "heard" | "done">("ready");
  const [heard, setHeard] = useState<string[]>([]);
  const [canRecognize, setCanRecognize] = useState(recognitionSupported() && !recognitionBlocked);
  const [result, setResult] = useState<boolean | null>(null);
  const stopRef = useRef<() => void>(() => {});

  useEffect(() => {
    speak(word.ko);
    return () => stopRef.current();
  }, [word.ko]);

  const finish = (ok: boolean) => {
    setResult(ok);
    onAnswer(ok);
    setPhase("done");
  };

  const record = async () => {
    setPhase("listening");
    const { promise, stop } = listenOnce();
    stopRef.current = stop;
    try {
      const alts = await promise;
      setHeard(alts);
      setPhase("heard");
      if (matchesSpoken(alts, word.ko)) finish(true);
    } catch (e) {
      const code = (e as Error).message;
      if (code === "not-allowed" || code === "service-not-allowed" || code === "unsupported" || code === "network") {
        recognitionBlocked = true;
        setCanRecognize(false);
      }
      setPhase("ready");
    }
  };

  useEnter(phase === "done" ? onNext : null);

  return (
    <div className="card speak">
      <p className="eyebrow">Sprich laut nach</p>
      <div className="prompt-word ko">{word.ko}</div>
      <p className="muted">
        {word.roman && `${word.roman} · `}
        {word.de}
        {word.say && (
          <>
            {" "}· gesprochen <span className="ko">[{word.say}]</span>
          </>
        )}
      </p>
      <div className="row">
        <SpeakerButton text={word.ko} label="Vorsprechen" />
        <button type="button" className="btn-audio" onClick={() => speak(word.ko, 0.6)}>
          🐢 Langsam
        </button>
      </div>
      <CompareRecorder text={word.ko} />

      {phase !== "done" && canRecognize && (
        <div className="speak-rec">
          <button type="button" className={`btn-mic ${phase === "listening" ? "is-live" : ""}`} onClick={record} disabled={phase === "listening"}>
            {phase === "listening" ? "Ich höre zu …" : "🎙 Aufnehmen und prüfen"}
          </button>
          {phase === "heard" && (
            <p className="muted">
              Verstanden: <span className="ko">{heard[0] || "–"}</span>. Versuch es noch einmal oder bewerte dich selbst.
            </p>
          )}
        </div>
      )}

      {phase !== "done" && (
        <div className="self-rate">
          <p className="muted small">
            {canRecognize
              ? "Oder bewerte dich selbst, nachdem du laut nachgesprochen hast:"
              : "Sprich das Wort laut nach und vergleiche mit dem Vorbild. Wie war es?"}
          </p>
          <div className="row">
            <button type="button" className="btn-secondary" onClick={() => finish(false)}>
              Muss ich noch üben
            </button>
            <button type="button" className="btn" onClick={() => finish(true)}>
              Klang gut
            </button>
          </div>
        </div>
      )}

      {phase === "done" && (
        <div className={`feedback ${result ? "ok" : "bad"}`}>
          <p className="feedback-title">{result ? "Sehr gut!" : "Kein Problem, das Wort kommt bald wieder."}</p>
          <button type="button" className="btn" onClick={onNext}>
            Weiter
          </button>
        </div>
      )}
    </div>
  );
}
