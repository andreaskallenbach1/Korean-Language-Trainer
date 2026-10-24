import { useCallback, useEffect, useRef, useState } from "react";
import type { Dialogue, GrammarCard, Word } from "../data/lessons";
import type { Exercise } from "../lib/exercises";
import { speak, speakAsync, stopSpeaking } from "../lib/speech";
import { HangulText } from "./HangulText";
import { SpeakerButton, useEnter, WordImage } from "./ui";

export function GrammarStep({ card, onNext }: { card: GrammarCard; onNext: () => void }) {
  useEnter(onNext);
  return (
    <div className="card info grammar">
      <p className="eyebrow">Grammatik</p>
      <h2>
        <HangulText text={card.title} />
      </h2>
      {card.body.map((p, i) => (
        <p key={i} className="info-p">
          <HangulText text={p} />
        </p>
      ))}
      <ul className="examples">
        {card.examples.map((e) => (
          <li key={e.ko}>
            <button type="button" className="example-ko ko" onClick={() => speak(e.ko)}>
              🔊 {e.ko}
            </button>
            <span className="muted">{e.de}</span>
          </li>
        ))}
      </ul>
      <button type="button" className="btn" onClick={onNext}>
        Weiter
      </button>
    </div>
  );
}

export function VocabStep({ words, showRoman, onNext }: { words: Word[]; showRoman: boolean; onNext: () => void }) {
  const [playing, setPlaying] = useState(-1);
  const cancelled = useRef(false);
  useEnter(onNext);
  useEffect(() => () => {
    cancelled.current = true;
    stopSpeaking();
  }, []);

  const playAll = async () => {
    cancelled.current = false;
    for (let i = 0; i < words.length && !cancelled.current; i++) {
      setPlaying(i);
      await speakAsync(words[i].ko);
      await new Promise((r) => setTimeout(r, 350));
    }
    setPlaying(-1);
  };

  return (
    <div className="card vocab">
      <p className="eyebrow">Neue Wörter · tippe zum Anhören</p>
      <ul className="vocab-list">
        {words.map((w, i) => (
          <li key={w.ko} className={playing === i ? "is-playing" : ""}>
            <button type="button" className="vocab-ko ko" onClick={() => speak(w.ko)}>
              <WordImage ko={w.ko} size="sm" />
              {w.ko}
            </button>
            <span className="vocab-de">
              {w.de}
              {showRoman && <span className="muted small"> · {w.roman}</span>}
              {w.say && (
                <span className="muted small">
                  {" "}· gesprochen <span className="ko">[{w.say}]</span>
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>
      <div className="row">
        <button type="button" className="btn-audio" onClick={playAll}>
          🔊 Alle nacheinander
        </button>
        <button type="button" className="btn" onClick={onNext}>
          Weiter
        </button>
      </div>
    </div>
  );
}

export function DialogueStep({ dialogue, onNext }: { dialogue: Dialogue; onNext: () => void }) {
  const [playing, setPlaying] = useState(-1);
  const [showDe, setShowDe] = useState(false);
  const cancelled = useRef(false);
  useEnter(onNext);
  useEffect(() => () => {
    cancelled.current = true;
    stopSpeaking();
  }, []);

  const playAll = async () => {
    cancelled.current = false;
    for (let i = 0; i < dialogue.lines.length && !cancelled.current; i++) {
      setPlaying(i);
      await speakAsync(dialogue.lines[i].ko, dialogue.lines[i].who);
      await new Promise((r) => setTimeout(r, 450));
    }
    setPlaying(-1);
  };

  return (
    <div className="card dialogue">
      <p className="eyebrow">Dialog</p>
      <p className="scene">{dialogue.scene}</p>
      <p className="muted small">Hör dir den Dialog zuerst ohne Übersetzung an. Tippe auf eine Zeile, um sie einzeln zu hören.</p>
      <ol className="dlg">
        {dialogue.lines.map((l, i) => (
          <li key={i} className={`dlg-line who-${l.who} ${playing === i ? "is-playing" : ""}`}>
            <span className="dlg-name ko">{l.name}</span>
            <button type="button" className="dlg-bubble" onClick={() => speak(l.ko, undefined, l.who)}>
              <span className="ko">{l.ko}</span>
              {showDe && <span className="dlg-de">{l.de}</span>}
            </button>
          </li>
        ))}
      </ol>
      <div className="row">
        <button type="button" className="btn-audio" onClick={playAll}>
          🔊 Ganzen Dialog abspielen
        </button>
        <button type="button" className="btn-secondary" onClick={() => setShowDe((v) => !v)} aria-pressed={showDe}>
          {showDe ? "Übersetzung ausblenden" : "Übersetzung zeigen"}
        </button>
        <button type="button" className="btn" onClick={onNext}>
          Weiter
        </button>
      </div>
    </div>
  );
}

export function RoleStep({
  ex,
  onAnswer,
  onNext,
}: {
  ex: Extract<Exercise, { kind: "role" }>;
  onAnswer: (c: boolean) => void;
  onNext: () => void;
}) {
  const [picked, setPicked] = useState<string | null>(null);
  useEffect(() => {
    if (ex.prev) speak(ex.prev.ko, undefined, ex.prev.who);
  }, [ex.prev]);
  const choose = useCallback(
    (o: string) => {
      if (picked) return;
      setPicked(o);
      onAnswer(o === ex.line.ko);
      speak(ex.line.ko, undefined, "B");
    },
    [picked, ex.line.ko, onAnswer],
  );
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const n = Number(e.key);
      if (!picked && n >= 1 && n <= ex.options.length) choose(ex.options[n - 1]);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [picked, ex.options, choose]);
  useEnter(picked ? onNext : null);

  return (
    <div className="card role">
      <p className="eyebrow">Du bist dran: Was antwortest du?</p>
      {ex.prev ? (
        <div className="dlg-line who-A">
          <span className="dlg-name ko">{ex.prev.name}</span>
          <button type="button" className="dlg-bubble" onClick={() => speak(ex.prev!.ko, undefined, ex.prev!.who)}>
            <span className="ko">{ex.prev.ko}</span>
            <span className="dlg-de">{ex.prev.de}</span>
          </button>
        </div>
      ) : (
        <p className="muted">Du beginnst das Gespräch. Gemeint ist: „{ex.line.de}“</p>
      )}
      <div className="options options-sentences">
        {ex.options.map((o, i) => {
          const state = !picked ? "" : o === ex.line.ko ? "is-right" : o === picked ? "is-wrong" : "is-dim";
          return (
            <button type="button" key={o} className={`option ${state}`} disabled={!!picked} onClick={() => choose(o)}>
              <span className="option-key">{i + 1}</span>
              <span className="ko">{o}</span>
            </button>
          );
        })}
      </div>
      {picked && (
        <div className={`feedback ${picked === ex.line.ko ? "ok" : "bad"}`}>
          <p className="feedback-title">{picked === ex.line.ko ? "Passt!" : "Das passt hier nicht ganz."}</p>
          <p>
            <span className="ko">{ex.line.ko}</span> · {ex.line.de}
          </p>
          <button type="button" className="btn" onClick={onNext}>
            Weiter
          </button>
        </div>
      )}
    </div>
  );
}

export function BuildStep({
  ex,
  onAnswer,
  onNext,
}: {
  ex: Extract<Exercise, { kind: "build" }>;
  onAnswer: (c: boolean) => void;
  onNext: () => void;
}) {
  // indexes into ex.tiles, so repeated tile texts stay distinct
  const [chosen, setChosen] = useState<number[]>([]);
  const [checked, setChecked] = useState<boolean | null>(null);
  const answer = ex.sentence.ko;
  const built = chosen.map((i) => ex.tiles[i]).join(" ");

  const check = () => {
    if (checked !== null || !chosen.length) return;
    const ok = built === answer;
    setChecked(ok);
    onAnswer(ok);
    speak(answer);
  };
  useEnter(checked === null ? (chosen.length ? check : null) : onNext);

  return (
    <div className="card build">
      <p className="eyebrow">Bau den Satz auf Koreanisch</p>
      <p className="build-de">{ex.sentence.de}</p>
      <div className={`build-line ${checked === true ? "ok" : checked === false ? "bad" : ""}`} aria-live="polite">
        {chosen.length === 0 && <span className="muted small">Tippe die Bausteine in der richtigen Reihenfolge an.</span>}
        {chosen.map((i) => (
          <button
            type="button"
            key={i}
            className="tile-chip ko"
            disabled={checked !== null}
            onClick={() => setChosen((c) => c.filter((x) => x !== i))}
          >
            {ex.tiles[i]}
          </button>
        ))}
      </div>
      <div className="tile-bank">
        {ex.tiles.map((t, i) => (
          <button
            type="button"
            key={i}
            className="tile-chip ko"
            disabled={chosen.includes(i) || checked !== null}
            onClick={() => setChosen((c) => [...c, i])}
          >
            {t}
          </button>
        ))}
      </div>
      {checked === null ? (
        <div className="row">
          <button type="button" className="btn-secondary" onClick={() => setChosen([])} disabled={!chosen.length}>
            Zurücksetzen
          </button>
          <button type="button" className="btn" onClick={check} disabled={!chosen.length}>
            Prüfen
          </button>
        </div>
      ) : (
        <div className={`feedback ${checked ? "ok" : "bad"}`}>
          <p className="feedback-title">{checked ? "Richtig gebaut!" : "Nicht ganz. So heißt der Satz:"}</p>
          <p className="row">
            <span className="ko big-inline">{answer}</span>
            <SpeakerButton text={answer} />
          </p>
          <button type="button" className="btn" onClick={onNext}>
            Weiter
          </button>
        </div>
      )}
    </div>
  );
}
