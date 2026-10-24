import { describeItem } from "../lib/exercises";
import type { Progress } from "../lib/progress";
import { speak } from "../lib/speech";
import { WordImage } from "./ui";

interface Props {
  progress: Progress;
  onPractice: (ids: string[]) => void;
  onAskTutor: (prompt: string) => void;
}

export function MistakesView({ progress, onPractice, onAskTutor }: Props) {
  const entries = Object.entries(progress.mistakes)
    .map(([id, m]) => ({ id, ...m, info: describeItem(id) }))
    .filter((e) => e.info)
    .sort((a, b) => b.count - a.count || b.last - a.last);
  const top = entries.slice(0, 12);

  const tutorPrompt = () =>
    `Diese Wörter und Zeichen fallen mir noch schwer: ${top
      .map((e) => `${e.info!.ko} (${e.info!.de})`)
      .join(", ")}. Erklär mir kurz, wie ich sie mir merken kann, und gib mir 5 kleine Übungen dazu. Die Lösungen bitte erst, wenn ich geantwortet habe.`;

  return (
    <div className="mistakes">
      <h1>Fehlerheft</h1>
      <p className="lead">
        Hier sammelt die App automatisch alles, was dir noch schwerfällt. Jede richtige Antwort lässt einen Eintrag schrumpfen, bis er
        verschwindet.
      </p>
      {entries.length === 0 ? (
        <div className="card">
          <p>Dein Fehlerheft ist leer. Sobald dir in einer Übung etwas danebengeht, taucht es hier auf.</p>
        </div>
      ) : (
        <>
          <div className="row">
            <button type="button" className="btn" onClick={() => onPractice(top.map((e) => e.id))}>
              Die {top.length} schwierigsten gezielt üben
            </button>
            <button type="button" className="btn-secondary" onClick={() => onAskTutor(tutorPrompt())}>
              Mit dem Tutor daran arbeiten
            </button>
          </div>
          <ul className="mistake-list">
            {entries.map((e) => (
              <li key={e.id} className="card">
                <WordImage ko={e.info!.ko} size="sm" />
                <button type="button" className="mistake-ko ko" onClick={() => speak(e.info!.ko)} title="Anhören">
                  {e.info!.ko}
                </button>
                <span className="mistake-de">
                  {e.info!.de}
                  <span className="muted small"> · {e.info!.kind}</span>
                </span>
                <span className="mistake-count" title="Wie oft zuletzt falsch">
                  {"●".repeat(Math.min(e.count, 5))}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
