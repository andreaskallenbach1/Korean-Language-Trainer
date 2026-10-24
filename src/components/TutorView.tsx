import { useEffect, useRef, useState } from "react";
import { LESSONS } from "../data/lessons";
import type { Progress } from "../lib/progress";
import { RichText } from "./HangulText";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

interface SampleFn {
  (input: Msg[], opts: { onText?: (u: { text: string }) => void; cache?: boolean; signal?: AbortSignal }): Promise<{ text: string }>;
}

const SUGGESTIONS = [
  "Was ist der Unterschied zwischen ㅓ und ㅗ?",
  "Gib mir 5 Wörter zum Lesen üben, nur mit Zeichen, die ich kenne.",
  "Wie stelle ich mich auf Koreanisch vor?",
  "Lass uns ein ganz einfaches Gespräch im Café üben.",
];

function instructions(p: Progress): string {
  const done = LESSONS.filter((l) => p.lessons[l.id]);
  const jamo = done.flatMap((l) => l.newJamo).join(" ");
  const words = done.flatMap((l) => l.words.map((w) => w.ko)).slice(-60).join(", ");
  return [
    "Du bist ein geduldiger, freundlicher Koreanisch-Tutor für einen deutschsprachigen Anfänger.",
    "Ziel: alltagstaugliches, gesprächsorientiertes Koreanisch (Reisen, K-Dramen, Medien), Niveau TOPIK 1–2. Kein Business-Koreanisch.",
    `Lernstand: ${done.length} von ${LESSONS.length} Lektionen abgeschlossen (zuletzt: ${done[done.length - 1]?.title ?? "keine"}).`,
    jamo ? `Bekannte Zeichen: ${jamo}.` : "Der Lernende kann noch kein Hangul lesen.",
    words ? `Bekannte Wörter: ${words}.` : "",
    "Regeln: Antworte auf Deutsch, kurz und klar (höchstens ca. 150 Wörter, außer es wird mehr verlangt).",
    "Schreibe Koreanisch immer in Hangul, gefolgt von Umschrift in Klammern und deutscher Übersetzung.",
    "Bevorzuge Wörter und Zeichen, die der Lernende schon kennt. Verwende die höfliche -요-Form, wenn nicht anders gewünscht.",
    "Bei Rollenspielen: Schreibe deinen Satz, warte dann auf die Antwort des Lernenden und korrigiere Fehler freundlich.",
    "Benutze einfache Markdown-Listen und **fett** sparsam, keine Tabellen und keine Überschriften.",
  ]
    .filter(Boolean)
    .join("\n");
}

const ERRORS: Record<string, string> = {
  rate_limited: "Gerade zu viele Anfragen. Versuch es in ein paar Minuten noch einmal.",
  session_expired: "Bitte melde dich bei Claude neu an.",
  refused: "Darauf kann ich nicht antworten. Formuliere die Frage bitte anders.",
  empty_completion: "Es kam keine Antwort. Versuch eine einfachere Frage.",
  upstream_error: "Die Verbindung wurde unterbrochen. Versuch es noch einmal.",
};
const FATAL = new Set(["not_granted", "sampling_disabled", "not_declared", "capability_disabled", "capability_removed"]);

export function TutorView({ progress }: { progress: Progress }) {
  const [sample, setSample] = useState<SampleFn | null | undefined>(undefined);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const ctl = useRef<AbortController | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const claude = (window as unknown as { claude?: { use(n: string): Promise<unknown> } }).claude;
    if (!claude?.use) {
      setSample(null);
      return;
    }
    claude.use("sample").then((s) => setSample((s as SampleFn) ?? null), () => setSample(null));
    return () => ctl.current?.abort();
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [msgs]);

  const send = async (text: string) => {
    if (!sample || busy || !text.trim()) return;
    setError("");
    const history: Msg[] = [...msgs, { role: "user", content: text.trim() }];
    setMsgs([...history, { role: "assistant", content: "" }]);
    setInput("");
    setBusy(true);
    // the first turn carries the tutor instructions; keep the last 12 turns
    const recent = history.slice(-12);
    if (recent[0].role === "assistant") recent.shift();
    const payload: Msg[] = recent.map((m, i) =>
      i === 0 ? { role: "user", content: `${instructions(progress)}\n\n---\n\n${m.content}` } : m,
    );
    ctl.current = new AbortController();
    try {
      const res = await sample(payload, {
        cache: false,
        signal: ctl.current.signal,
        onText: ({ text: t }) => setMsgs([...history, { role: "assistant", content: t }]),
      });
      setMsgs([...history, { role: "assistant", content: res.text }]);
    } catch (e) {
      const code = (e as { code?: string; text?: string }).code ?? "upstream_error";
      const partial = (e as { text?: string }).text;
      if (FATAL.has(code)) setSample(null);
      if (code !== "cancelled") setError(ERRORS[code] ?? ERRORS.upstream_error);
      setMsgs(partial ? [...history, { role: "assistant", content: `${partial} …` }] : history);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="tutor">
      <h1>KI-Tutor</h1>
      <p className="lead">
        Stell Fragen zu Aussprache und Grammatik oder übe kleine Gespräche. Der Tutor kennt deinen Lernstand und nutzt dein
        Claude-Konto, du brauchst keinen API-Schlüssel.
      </p>

      {sample === null && (
        <div className="card notice">
          <p>
            Der Tutor funktioniert, wenn du die App auf claude.ai öffnest und ihr erlaubst, Claude zu fragen. In dieser Ansicht ist das
            nicht verfügbar. Alle anderen Funktionen laufen trotzdem.
          </p>
        </div>
      )}

      {sample !== null && (
        <div className="card chat">
          <div className="chat-log">
            {msgs.length === 0 && (
              <div className="chat-empty">
                <p className="muted">Zum Beispiel:</p>
                <div className="chips">
                  {SUGGESTIONS.map((s) => (
                    <button type="button" key={s} className="chip" onClick={() => send(s)} disabled={!sample || busy}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {msgs.map((m, i) => (
              <div key={i} className={`bubble ${m.role}`}>
                {m.role === "assistant" ? (m.content ? <RichText text={m.content} /> : <p className="muted">Denkt nach …</p>) : <p>{m.content}</p>}
              </div>
            ))}
            <div ref={endRef} />
          </div>
          {error && <p className="chat-error">{error}</p>}
          <form
            className="chat-form"
            onSubmit={(e) => {
              e.preventDefault();
              void send(input);
            }}
          >
            <label htmlFor="tutor-input" className="sr-only">
              Nachricht an den Tutor
            </label>
            <textarea
              id="tutor-input"
              value={input}
              rows={2}
              placeholder="Frag etwas oder antworte auf Koreanisch …"
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send(input);
                }
              }}
            />
            {busy ? (
              <button type="button" className="btn-secondary" onClick={() => ctl.current?.abort()}>
                Stopp
              </button>
            ) : (
              <button type="submit" className="btn" disabled={!sample || !input.trim()}>
                Senden
              </button>
            )}
          </form>
          {msgs.length > 0 && !busy && (
            <button type="button" className="btn-link" onClick={() => setMsgs([])}>
              Neues Gespräch
            </button>
          )}
        </div>
      )}
    </div>
  );
}
