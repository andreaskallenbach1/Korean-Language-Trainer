import { useState } from "react";
import { GROUP_LABELS, JAMO, JAMO_BY_CHAR, type JamoGroup } from "../data/jamo";
import { LESSONS } from "../data/lessons";
import { compose, FINALS, INITIALS, MEDIALS, romanizeSimple, soundSyllable } from "../lib/hangul";
import type { Progress } from "../lib/progress";
import { SyllableAssembly } from "./SyllableAssembly";
import { HandwritingPad, StrokeOrder } from "./HandwritingPad";
import { strength } from "../lib/srs";
import { speak } from "../lib/speech";

const ORDER: JamoGroup[] = ["basic-vowel", "y-vowel", "ae-e", "compound-vowel", "basic-consonant", "aspirated", "tense"];

export function AlphabetView({ progress }: { progress: Progress }) {
  const [selected, setSelected] = useState("ㅏ");
  const learned = new Set(LESSONS.filter((l) => progress.lessons[l.id]).flatMap((l) => l.newJamo));
  const j = JAMO_BY_CHAR[selected];

  return (
    <div className="alphabet">
      <h1>Alphabet</h1>
      <p className="lead">Tippe ein Zeichen an, um es zu hören. Farbig markiert ist, was du schon gelernt hast.</p>

      <div className="alpha-layout">
        <div className="alpha-groups">
          {ORDER.map((g) => (
            <section key={g}>
              <h2 className="eyebrow">{GROUP_LABELS[g]}</h2>
              <div className="alpha-grid">
                {JAMO.filter((x) => x.group === g).map((x) => {
                  const st = strength(progress.items[`j:${x.char}`]);
                  return (
                    <button
                      type="button"
                      key={x.char}
                      className={`alpha-tile ${learned.has(x.char) ? "is-learned" : ""} ${selected === x.char ? "is-sel" : ""} st-${st}`}
                      onClick={() => {
                        setSelected(x.char);
                        speak(x.char === "ㅇ" ? "앙" : soundSyllable(x.char));
                      }}
                    >
                      <span className="ko alpha-char">{x.char}</span>
                      <span className="alpha-roman">{x.roman}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        <aside className="card alpha-detail" aria-live="polite">
          <div className="glyph">{j.char}</div>
          <p className="intro-roman">
            <span className="label">Umschrift</span> {j.roman}
          </p>
          {j.name && (
            <p className="intro-roman">
              <span className="label">Name</span>{" "}
              <button type="button" className="inline-ko" onClick={() => speak(j.name!)}>
                {j.name}
              </button>{" "}
              ({j.nameRoman})
            </p>
          )}
          <p>{j.sound}</p>
          <p className="mnemonic">
            <span className="label">Merkhilfe</span> {j.mnemonic}
          </p>
          <p className="muted small">Stand: {learned.has(j.char) ? strength(progress.items[`j:${j.char}`]) : "noch nicht gelernt"}</p>
          <StrokeOrder jamo={j.char} size={160} />
          <details className="write-details">
            <summary>Schreiben üben</summary>
            <HandwritingPad jamo={j.char} />
          </details>
        </aside>
      </div>

      <SyllableBuilder />
    </div>
  );
}

function SyllableBuilder() {
  const [l, setL] = useState("ㅎ");
  const [v, setV] = useState("ㅏ");
  const [t, setT] = useState("ㄴ");
  const syl = compose(l, v, t);
  return (
    <section className="card builder">
      <p className="eyebrow">Silbenbaukasten</p>
      <h2>Bau dir eine Silbe</h2>
      <p className="muted">Wähle Anfangskonsonant, Vokal und optional einen Schlusskonsonanten. So entstehen alle 11.172 möglichen Silben.</p>
      <div className="builder-row">
        <label>
          Anfang
          <select id="builder-initial" value={l} onChange={(e) => setL(e.target.value)} className="ko">
            {INITIALS.map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>
        </label>
        <span className="plus">+</span>
        <label>
          Vokal
          <select id="builder-vowel" value={v} onChange={(e) => setV(e.target.value)} className="ko">
            {MEDIALS.map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>
        </label>
        <span className="plus">+</span>
        <label>
          Ende
          <select id="builder-final" value={t} onChange={(e) => setT(e.target.value)} className="ko">
            {FINALS.map((x) => (
              <option key={x || "none"} value={x}>
                {x || "–"}
              </option>
            ))}
          </select>
        </label>
        <span className="plus">=</span>
        <button type="button" className="builder-result ko" onClick={() => speak(syl)} title="Anhören">
          {syl}
        </button>
        <span className="builder-roman">{romanizeSimple(syl)}</span>
      </div>
      <SyllableAssembly syllable={syl} />
    </section>
  );
}
