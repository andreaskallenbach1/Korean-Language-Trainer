import { useEffect, useState } from "react";
import { KEY_LAYOUT, jamoForKey } from "../lib/hangul";

interface Props {
  onJamo: (j: string) => void;
  onBackspace: () => void;
  onSpace?: () => void;
  onEnter?: () => void;
  /** Jamo to highlight as a hint. */
  hint?: string | null;
  disabled?: boolean;
}

// Key captions follow the German QWERTZ layout, where Y and Z are swapped.
const GERMAN_LABEL: Record<string, string> = { KeyY: "Z", KeyZ: "Y" };

/** On-screen Dubeolsik keyboard that also listens to the physical keyboard. */
export function Keyboard({ onJamo, onBackspace, onSpace, onEnter, hint, disabled }: Props) {
  const [shift, setShift] = useState(false);

  useEffect(() => {
    if (disabled) return;
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === "Backspace") {
        e.preventDefault();
        onBackspace();
        return;
      }
      if (e.code === "Space" && onSpace) {
        e.preventDefault();
        onSpace();
        return;
      }
      if (e.code === "Enter" && onEnter) {
        e.preventDefault();
        onEnter();
        return;
      }
      const j = jamoForKey(e.code, e.shiftKey);
      if (j) {
        e.preventDefault();
        onJamo(j);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onJamo, onBackspace, onSpace, onEnter, disabled]);

  return (
    <div className="kb" aria-label="Koreanische Tastatur">
      {KEY_LAYOUT.map((row, r) => (
        <div className="kb-row" key={r} style={{ paddingLeft: `${r * 1.1}rem` }}>
          {r === 2 && (
            <button
              type="button"
              className={`kb-key kb-wide ${shift ? "is-on" : ""}`}
              onClick={() => setShift((s) => !s)}
              disabled={disabled}
              aria-pressed={shift}
            >
              Shift
            </button>
          )}
          {row.map((k) => {
            const j = shift && k.shift ? k.shift : k.base;
            const isHint = hint === j || (hint && !shift && k.shift === hint);
            return (
              <button
                type="button"
                key={k.code}
                className={`kb-key ${isHint ? "is-hint" : ""}`}
                disabled={disabled}
                onClick={() => {
                  onJamo(j);
                  if (shift) setShift(false);
                }}
              >
                <span className="kb-jamo">{j}</span>
                <span className="kb-latin">{GERMAN_LABEL[k.code] ?? k.code.slice(3)}</span>
              </button>
            );
          })}
          {r === 2 && (
            <button type="button" className="kb-key kb-wide" onClick={onBackspace} disabled={disabled} aria-label="Löschen">
              ⌫
            </button>
          )}
        </div>
      ))}
      {onSpace && (
        <div className="kb-row">
          <button type="button" className="kb-key kb-space" onClick={onSpace} disabled={disabled}>
            Leerzeichen
          </button>
        </div>
      )}
    </div>
  );
}
