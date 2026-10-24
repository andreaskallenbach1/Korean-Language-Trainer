import { useEffect, useState } from "react";
import { decompose } from "../lib/hangul";
import { speak } from "../lib/speech";

const VERTICAL = "ㅏㅐㅑㅒㅓㅔㅕㅖㅣ";
const HORIZONTAL = "ㅗㅛㅜㅠㅡ";

interface Slot {
  x: number;
  y: number;
  size: number;
}

/** Where each letter sits inside the block, in % of the box (x, y = centre). */
function layout(medial: string, hasFinal: boolean): { initial: Slot; medial: Slot; final: Slot } {
  const finalSlot = { x: 50, y: 80, size: 34 };
  if (VERTICAL.includes(medial)) {
    return hasFinal
      ? { initial: { x: 32, y: 30, size: 42 }, medial: { x: 72, y: 32, size: 46 }, final: finalSlot }
      : { initial: { x: 32, y: 50, size: 52 }, medial: { x: 72, y: 50, size: 60 }, final: finalSlot };
  }
  if (HORIZONTAL.includes(medial)) {
    return hasFinal
      ? { initial: { x: 50, y: 22, size: 36 }, medial: { x: 50, y: 50, size: 40 }, final: finalSlot }
      : { initial: { x: 50, y: 32, size: 46 }, medial: { x: 50, y: 70, size: 50 }, final: finalSlot };
  }
  // compound vowels wrap around the initial consonant
  return hasFinal
    ? { initial: { x: 34, y: 26, size: 36 }, medial: { x: 60, y: 42, size: 48 }, final: finalSlot }
    : { initial: { x: 34, y: 34, size: 42 }, medial: { x: 60, y: 54, size: 58 }, final: finalSlot };
}

/**
 * Shows the letters of a syllable side by side, then slides them into the
 * block and swaps in the real syllable: ㅎ ㅏ ㄴ → 한.
 */
export function SyllableAssembly({ syllable, autoPlay = true }: { syllable: string; autoPlay?: boolean }) {
  const parts = decompose(syllable);
  const [phase, setPhase] = useState<0 | 1 | 2>(0);
  const [run, setRun] = useState(0);

  useEffect(() => {
    if (!autoPlay && run === 0) return;
    setPhase(0);
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const t1 = setTimeout(() => setPhase(1), reduce ? 0 : 700);
    const t2 = setTimeout(() => setPhase(2), reduce ? 0 : 1600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [syllable, run, autoPlay]);

  if (!parts) return null;
  const letters = [parts.initial, parts.medial, ...(parts.final ? [parts.final] : [])];
  const slots = layout(parts.medial, !!parts.final);
  const targets = [slots.initial, slots.medial, slots.final];
  const spread = letters.length === 3 ? [18, 50, 82] : [30, 70];

  return (
    <div className="assembly">
      <button
        type="button"
        className={`assembly-box phase-${phase}`}
        onClick={() => {
          setRun((r) => r + 1);
          speak(syllable);
        }}
        aria-label={`${letters.join(" + ")} ergibt ${syllable}. Noch einmal abspielen`}
      >
        {letters.map((l, i) => {
          const t = phase === 0 ? { x: spread[i], y: 50, size: 44 } : targets[i];
          return (
            <span
              key={i}
              className={`assembly-piece piece-${i} ko`}
              style={{ left: `${t.x}%`, top: `${t.y}%`, fontSize: `${t.size * 0.09}rem` }}
            >
              {l}
            </span>
          );
        })}
        <span className="assembly-result ko">{syllable}</span>
      </button>
      <p className="assembly-caption ko">
        {letters.join(" + ")} = {syllable}
      </p>
    </div>
  );
}
