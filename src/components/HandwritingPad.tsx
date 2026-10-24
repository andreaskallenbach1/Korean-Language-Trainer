import { useEffect, useRef, useState } from "react";
import { getSample, SAMPLE_ERRORS, sampleErrorCode, type SampleFn } from "../lib/claude";
import { checkStrokes, STROKES, strokePath, type Point, type Stroke } from "../lib/strokes";

/** Animated stroke order: strokes are drawn one after another, numbered at their start. */
export function StrokeOrder({ jamo, size = 200 }: { jamo: string; size?: number }) {
  const strokes = STROKES[jamo] ?? [];
  const [run, setRun] = useState(0);
  return (
    <button type="button" className="stroke-order" onClick={() => setRun((r) => r + 1)} title="Noch einmal abspielen">
      <svg key={`${jamo}-${run}`} viewBox="0 0 100 100" width={size} height={size} role="img" aria-label={`Strichfolge von ${jamo}`}>
        <GuideGrid />
        {strokes.map((s, i) => (
          <path key={`bg${i}`} d={strokePath(s)} className="stroke-ghost" />
        ))}
        {strokes.map((s, i) => (
          <path
            key={i}
            d={strokePath(s)}
            pathLength={1}
            className="stroke-anim"
            style={{ animationDelay: `${0.3 + i * 0.9}s` }}
          />
        ))}
        {strokes.map((s, i) => (
          <g key={`n${i}`} className="stroke-num" style={{ animationDelay: `${0.3 + i * 0.9}s` }}>
            <circle cx={s[0][0]} cy={s[0][1]} r={5} />
            <text x={s[0][0]} y={s[0][1] + 2.4} textAnchor="middle">
              {i + 1}
            </text>
          </g>
        ))}
      </svg>
      <span className="muted small">
        {strokes.length} {strokes.length === 1 ? "Strich" : "Striche"} · antippen zum Wiederholen
      </span>
    </button>
  );
}

function GuideGrid() {
  return (
    <g className="guide">
      <rect x={1} y={1} width={98} height={98} rx={6} />
      <line x1={50} y1={2} x2={50} y2={98} />
      <line x1={2} y1={50} x2={98} y2={50} />
    </g>
  );
}

/** The learner's strokes alone (no template), black on white, as a PNG. */
function drawingToBlob(strokes: Stroke[]): Promise<Blob | null> {
  const c = document.createElement("canvas");
  c.width = c.height = 400;
  const ctx = c.getContext("2d");
  if (!ctx) return Promise.resolve(null);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, 400, 400);
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 22;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const s of strokes) {
    ctx.beginPath();
    s.forEach(([x, y], i) => (i ? ctx.lineTo(x * 4, y * 4) : ctx.moveTo(x * 4, y * 4)));
    ctx.stroke();
  }
  return new Promise((r) => c.toBlob(r, "image/png"));
}

interface PadProps {
  jamo: string;
  /** Called after an offline check with its result. */
  onChecked?: (ok: boolean) => void;
}

export function HandwritingPad({ jamo, onChecked }: PadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const drawing = useRef<Stroke | null>(null);
  const [ghost, setGhost] = useState(true);
  const [result, setResult] = useState<{ ok: boolean; messages: string[] } | null>(null);
  const [sample, setSample] = useState<SampleFn | null>(null);
  const [canSendImages, setCanSendImages] = useState(false);
  const [aiText, setAiText] = useState("");
  const [aiBusy, setAiBusy] = useState(false);

  useEffect(() => {
    getSample().then(async (s) => {
      setSample(s);
      try {
        const lim = await s?.limits?.();
        setCanSendImages(!!lim?.images);
      } catch {
        setCanSendImages(false);
      }
    });
  }, []);

  useEffect(() => {
    setStrokes([]);
    setResult(null);
    setAiText("");
  }, [jamo]);

  // redraw whenever strokes change
  useEffect(() => {
    const c = canvasRef.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    const k = c.width / 100;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    if (ghost) {
      ctx.strokeStyle = "rgba(45,110,98,0.16)";
      ctx.lineWidth = 9 * k;
      for (const s of STROKES[jamo] ?? []) {
        ctx.beginPath();
        s.forEach(([x, y], i) => (i ? ctx.lineTo(x * k, y * k) : ctx.moveTo(x * k, y * k)));
        ctx.stroke();
      }
    }
    ctx.strokeStyle = "#17221f";
    ctx.lineWidth = 6 * k;
    for (const s of strokes) {
      ctx.beginPath();
      s.forEach(([x, y], i) => (i ? ctx.lineTo(x * k, y * k) : ctx.moveTo(x * k, y * k)));
      if (s.length === 1) ctx.lineTo(s[0][0] * k + 0.1, s[0][1] * k);
      ctx.stroke();
    }
  }, [strokes, ghost, jamo]);

  const toPoint = (e: React.PointerEvent): Point => {
    const r = (e.target as HTMLCanvasElement).getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * 100, ((e.clientY - r.top) / r.height) * 100];
  };

  const down = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    drawing.current = [toPoint(e)];
    setStrokes((s) => [...s, drawing.current!]);
    setResult(null);
  };
  const move = (e: React.PointerEvent) => {
    if (!drawing.current) return;
    const p = toPoint(e);
    const last = drawing.current[drawing.current.length - 1];
    if (Math.hypot(p[0] - last[0], p[1] - last[1]) < 1.2) return;
    drawing.current = [...drawing.current, p];
    const cur = drawing.current;
    setStrokes((s) => [...s.slice(0, -1), cur]);
  };
  const up = () => {
    drawing.current = null;
  };

  const check = () => {
    const r = checkStrokes(jamo, strokes);
    setResult(r);
    onChecked?.(r.ok);
  };

  const askClaude = async () => {
    if (!sample) return;
    setAiBusy(true);
    setAiText("");
    const blob = await drawingToBlob(strokes);
    if (!blob) {
      setAiBusy(false);
      return;
    }
    try {
      const res = await sample(
        `Auf dem Bild ist ein von Hand gezeichnetes koreanisches Zeichen (Hangul-Buchstabe). Es soll „${jamo}“ sein. Erkennst du es eindeutig? Gib auf Deutsch in höchstens drei kurzen Sätzen Rückmeldung zu Form und Proportionen und einen konkreten Tipp. Sei ermutigend. Die Strichreihenfolge kannst du auf dem Bild nicht sehen, beurteile sie nicht.`,
        { images: [blob], cache: false, onText: ({ text }) => setAiText(text) },
      );
      setAiText(res.text);
    } catch (e) {
      const code = sampleErrorCode(e);
      if (code === "images_unavailable" || code === "not_granted") setCanSendImages(false);
      setAiText(SAMPLE_ERRORS[code] ?? "Die Rückmeldung hat nicht geklappt.");
    } finally {
      setAiBusy(false);
    }
  };

  return (
    <div className="pad">
      <canvas
        ref={canvasRef}
        width={520}
        height={520}
        className="pad-canvas"
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        aria-label={`Zeichenfeld: schreibe ${jamo}`}
      />
      <div className="row">
        <button type="button" className="btn-secondary" onClick={() => setStrokes((s) => s.slice(0, -1))} disabled={!strokes.length}>
          Letzten Strich löschen
        </button>
        <button type="button" className="btn-secondary" onClick={() => setStrokes([])} disabled={!strokes.length}>
          Alles löschen
        </button>
        <label className="check small" htmlFor={`ghost-${jamo}`}>
          <input id={`ghost-${jamo}`} type="checkbox" checked={ghost} onChange={(e) => setGhost(e.target.checked)} />
          Vorlage zeigen
        </label>
      </div>
      <div className="row">
        <button type="button" className="btn" onClick={check} disabled={!strokes.length}>
          Prüfen
        </button>
        {sample && canSendImages && (
          <button type="button" className="btn-audio" onClick={askClaude} disabled={!strokes.length || aiBusy}>
            {aiBusy ? "Claude schaut …" : "Claude fragen"}
          </button>
        )}
      </div>
      {result && (
        <div className={`feedback ${result.ok ? "ok" : "bad"}`}>
          <p className="feedback-title">{result.ok ? "Strichzahl, Reihenfolge und Richtung stimmen!" : "Fast. Schau dir die Strichfolge noch einmal an."}</p>
          {result.messages.map((m) => (
            <p key={m}>{m}</p>
          ))}
        </div>
      )}
      {aiText && <p className="ai-feedback">{aiText}</p>}
    </div>
  );
}
