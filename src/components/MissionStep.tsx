import { useCallback, useEffect, useRef, useState } from "react";
import { LESSONS, type Lesson, type Mission } from "../data/lessons";
import {
  getSample,
  SAMPLE_ERRORS,
  SAMPLE_FATAL,
  sampleErrorCode,
  type ChatMsg,
  type SampleFn,
} from "../lib/claude";
import { composeJamo } from "../lib/hangul";
import { speak } from "../lib/speech";
import { RichText } from "./HangulText";
import { Keyboard } from "./Keyboard";

interface Evaluation {
  erfuellt: boolean;
  erreicht: string[];
  lob: string;
  korrekturen: { falsch: string; richtig: string; warum: string }[];
}

function knownWords(lesson: Lesson): string {
  const idx = LESSONS.indexOf(lesson);
  return LESSONS.slice(0, idx + 1)
    .filter((l) => l.stage >= 1)
    .flatMap((l) => l.words.map((w) => w.ko))
    .join(", ");
}

function rolePrompt(m: Mission, lesson: Lesson): string {
  return [
    "Wir spielen ein Rollenspiel, damit ein deutschsprachiger Koreanisch-Anfänger sprechen übt.",
    `Deine Rolle: ${m.role}`,
    `Ziel der lernenden Person: ${m.goal}`,
    `Aktuelle Lektion: ${lesson.title} (${lesson.summary}). Bekannter Wortschatz: ${knownWords(lesson)}.`,
    "Regeln:",
    "- Antworte in 1–2 kurzen, einfachen koreanischen Sätzen in der höflichen -요-Form. Nutze möglichst bekannte Wörter.",
    "- Schreibe in einer zweiten Zeile die deutsche Übersetzung in Klammern.",
    "- Macht die Person einen Fehler, füge eine dritte Zeile hinzu, die mit „Tipp:“ beginnt und kurz auf Deutsch die richtige Form zeigt.",
    "- Schreibt die Person auf Deutsch, hilf kurz auf Deutsch (z. B. wie man etwas sagt) und führe dann das Rollenspiel weiter.",
    "- Bleib in deiner Rolle und führe das Gespräch so, dass die Person ihr Ziel erreichen kann. Keine Überschriften, keine Listen.",
  ].join("\n");
}

function transcript(msgs: ChatMsg[]): string {
  return msgs.map((m) => `${m.role === "user" ? "Lernende Person" : "Rolle"}: ${m.content}`).join("\n");
}

export function MissionStep({
  mission,
  lesson,
  onDone,
}: {
  mission: Mission;
  lesson: Lesson;
  onDone: (passed: boolean) => void;
}) {
  const [sample, setSample] = useState<SampleFn | null | undefined>(undefined);
  const opener: ChatMsg = { role: "assistant", content: `${mission.opener}\n(${mission.openerDe})` };
  const [msgs, setMsgs] = useState<ChatMsg[]>([opener]);
  const [keys, setKeys] = useState<string[]>([]);
  const [german, setGerman] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const ctl = useRef<AbortController | null>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const draft = composeJamo(keys);

  useEffect(() => {
    getSample().then(setSample);
    speak(mission.opener);
    return () => ctl.current?.abort();
  }, [mission.opener]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [msgs]);

  const send = async (text: string) => {
    if (!sample || busy || !text.trim()) return;
    setError("");
    const history: ChatMsg[] = [...msgs, { role: "user", content: text.trim() }];
    setMsgs([...history, { role: "assistant", content: "" }]);
    setKeys([]);
    setGerman("");
    setBusy(true);
    // the conversation has to start with a user turn, so the instructions and the opener go first
    const payload: ChatMsg[] = [
      { role: "user", content: `${rolePrompt(mission, lesson)}\n\nBeginne mit diesem Satz.` },
      ...history,
    ];
    ctl.current = new AbortController();
    try {
      const res = await sample(payload, {
        cache: false,
        signal: ctl.current.signal,
        onText: ({ text: t }) => setMsgs([...history, { role: "assistant", content: t }]),
      });
      setMsgs([...history, { role: "assistant", content: res.text }]);
      const firstLine = res.text.split("\n").find((l) => /[가-힣]/.test(l));
      if (firstLine) speak(firstLine.replace(/\(.*?\)/g, ""));
    } catch (e) {
      const code = sampleErrorCode(e);
      if (SAMPLE_FATAL.has(code)) setSample(null);
      if (code !== "cancelled") setError(SAMPLE_ERRORS[code] ?? SAMPLE_ERRORS.upstream_error);
      setMsgs(history);
    } finally {
      setBusy(false);
    }
  };

  const evaluate = async () => {
    if (!sample?.json || busy) return;
    setBusy(true);
    setError("");
    try {
      const result = await sample.json<Evaluation>(
        [
          "Bewerte dieses Koreanisch-Rollenspiel eines Anfängers. Sei ermutigend, aber ehrlich.",
          `Ziel: ${mission.goal}`,
          `Checkliste: ${mission.checklist.join("; ")}`,
          "Gespräch:",
          transcript(msgs),
          "",
          'Antworte nur mit JSON in dieser Form: {"erfuellt": true|false, "erreicht": [Punkte der Checkliste, die erreicht wurden, wörtlich], "lob": "ein Satz auf Deutsch", "korrekturen": [{"falsch": "koreanischer Ausdruck der Person", "richtig": "korrigierte Form", "warum": "kurze Erklärung auf Deutsch"}]}. Höchstens 3 Korrekturen.',
        ].join("\n"),
        { cache: false },
      );
      setEvaluation({
        erfuellt: !!result.erfuellt,
        erreicht: Array.isArray(result.erreicht) ? result.erreicht : [],
        lob: String(result.lob ?? ""),
        korrekturen: Array.isArray(result.korrekturen) ? result.korrekturen.slice(0, 3) : [],
      });
    } catch (e) {
      const code = sampleErrorCode(e);
      if (code !== "cancelled") setError(SAMPLE_ERRORS[code] ?? SAMPLE_ERRORS.upstream_error);
    } finally {
      setBusy(false);
    }
  };

  const onJamo = useCallback((j: string) => setKeys((k) => [...k, j]), []);
  const onBackspace = useCallback(() => setKeys((k) => k.slice(0, -1)), []);
  const onSpace = useCallback(() => setKeys((k) => [...k, " "]), []);
  const onEnter = useCallback(() => void send(draft), [draft, send]); // eslint-disable-line react-hooks/exhaustive-deps
  const userTurns = msgs.filter((m) => m.role === "user").length;

  if (sample === null) {
    return (
      <div className="card mission">
        <p className="eyebrow">Mission · {mission.title}</p>
        <p>{mission.goal}</p>
        <p className="notice-inline">
          Die Mission läuft mit dem KI-Tutor und funktioniert nur, wenn die App auf claude.ai geöffnet ist und Claude fragen darf. Du kannst sie
          jetzt überspringen und später wiederholen.
        </p>
        <button type="button" className="btn" onClick={() => onDone(false)}>
          Überspringen
        </button>
      </div>
    );
  }

  if (evaluation) {
    return (
      <div className="card mission">
        <p className="eyebrow">Mission · {mission.title}</p>
        <h2>{evaluation.erfuellt ? "Mission erfüllt!" : "Fast geschafft"}</h2>
        {evaluation.lob && <p>{evaluation.lob}</p>}
        <ul className="checklist">
          {mission.checklist.map((c) => {
            const ok = evaluation.erreicht.some((e) => e.toLowerCase().includes(c.toLowerCase().slice(0, 12)));
            return (
              <li key={c} className={ok ? "is-ok" : ""}>
                {ok ? "✓" : "○"} {c}
              </li>
            );
          })}
        </ul>
        {evaluation.korrekturen.length > 0 && (
          <div className="corrections">
            <p className="eyebrow">Verbesserungen</p>
            {evaluation.korrekturen.map((k, i) => (
              <p key={i}>
                <span className="ko strike">{k.falsch}</span> → <span className="ko">{k.richtig}</span>
                <span className="muted small"> · {k.warum}</span>
              </p>
            ))}
          </div>
        )}
        <div className="row">
          {!evaluation.erfuellt && (
            <button type="button" className="btn-secondary" onClick={() => setEvaluation(null)}>
              Weiterspielen
            </button>
          )}
          <button type="button" className="btn" onClick={() => onDone(evaluation.erfuellt)}>
            Weiter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card mission">
      <p className="eyebrow">Mission · {mission.title}</p>
      <p className="mission-goal">{mission.goal}</p>
      <ul className="checklist small">
        {mission.checklist.map((c) => (
          <li key={c}>○ {c}</li>
        ))}
      </ul>
      <div className="chat-log mission-log" ref={logRef}>
        {msgs.map((m, i) => (
          <div key={i} className={`bubble ${m.role}`}>
            {m.role === "assistant" ? m.content ? <RichText text={m.content} /> : <p className="muted">…</p> : <p className="ko">{m.content}</p>}
          </div>
        ))}
      </div>
      {error && <p className="chat-error">{error}</p>}
      <div className="type-field mission-draft" aria-live="polite">
        <span className="ko">{draft}</span>
        <span className="caret" />
      </div>
      <Keyboard onJamo={onJamo} onBackspace={onBackspace} onSpace={onSpace} onEnter={onEnter} disabled={busy || sample === undefined} />
      <div className="row">
        <button type="button" className="btn" onClick={() => void send(draft)} disabled={busy || !draft.trim()}>
          Senden
        </button>
        <label htmlFor="mission-de" className="sr-only">
          Frage auf Deutsch
        </label>
        <input
          id="mission-de"
          className="text-input"
          placeholder="Hilfe? Auf Deutsch fragen …"
          value={german}
          onChange={(e) => setGerman(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void send(german);
            }
          }}
        />
      </div>
      <div className="row">
        <button type="button" className="btn-secondary" onClick={evaluate} disabled={busy || userTurns < 2}>
          Mission beenden und auswerten
        </button>
        <button type="button" className="btn-link" onClick={() => onDone(false)}>
          Überspringen
        </button>
      </div>
    </div>
  );
}
