import { useEffect } from "react";
import type { Word } from "../data/lessons";
import { speak, type Voice } from "../lib/speech";

export function useEnter(fn: (() => void) | null) {
  useEffect(() => {
    if (!fn) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        fn();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [fn]);
}

export function SpeakerButton({ text, label = "Anhören", big, who }: { text: string; label?: string; big?: boolean; who?: Voice }) {
  return (
    <button type="button" className={big ? "btn-audio big" : "btn-audio"} onClick={() => speak(text, undefined, who)}>
      <span aria-hidden="true">🔊</span> {label}
    </button>
  );
}

export function WordReveal({ word, showRoman }: { word: Word; showRoman: boolean }) {
  return (
    <div className="reveal">
      <span className="ko reveal-ko">{word.ko}</span>
      {showRoman && word.roman && <span className="reveal-roman">{word.roman}</span>}
      <span className="reveal-de">{word.de}</span>
      {word.say && <span className="reveal-say">gesprochen: <span className="ko">[{word.say}]</span></span>}
    </div>
  );
}
