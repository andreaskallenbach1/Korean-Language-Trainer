import { JAMO } from "../data/jamo";
import { LESSONS, type Lesson } from "../data/lessons";
import { dueItems, type PracticeKind } from "../lib/exercises";
import { SESSION_MINUTES, WEEKLY_GOAL_DAYS, weekStats, weekStreak, type Progress } from "../lib/progress";
import type { SyncMode } from "../lib/storage";

interface Props {
  progress: Progress;
  sync: SyncMode;
  nextLesson: Lesson | null;
  onSession: () => void;
  onReview: () => void;
  onLesson: (l: Lesson) => void;
  onPractice: (k: PracticeKind) => void;
}

const WEEKDAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

export function Dashboard({ progress, sync, nextLesson, onSession, onReview, onLesson, onPractice }: Props) {
  const now = Date.now();
  const due = dueItems(progress, now).length;
  const week = weekStats(progress, now);
  const streak = weekStreak(progress, now);
  const done = LESSONS.filter((l) => progress.lessons[l.id]);
  const learnedJamo = new Set(done.flatMap((l) => l.newJamo)).size;
  const words = Object.keys(progress.items).filter((k) => k.startsWith("w:")).length;
  const totalWords = LESSONS.reduce((s, l) => s + l.words.length, 0);
  const totalMinutes = Math.round(progress.log.reduce((s, l) => s + l.minutes, 0));
  const reviewMin = Math.max(5, Math.round(Math.min(due, 30) * 0.4));
  const isNew = done.length === 0;
  const maxMin = Math.max(SESSION_MINUTES * 2, ...week.days.map((d) => d.minutes));

  return (
    <div className="dash">
      <header className="dash-head">
        <h1>
          <span className="ko">{isNew ? "시작해요" : "안녕하세요"}</span>
          <span className="dash-sub">{isNew ? "Los geht's mit Koreanisch." : "Schön, dass du wieder da bist."}</span>
        </h1>
      </header>

      <section className="session card">
        <div className="session-head">
          <div>
            <p className="eyebrow">Deine nächste Sitzung · ca. 45–60 Minuten</p>
            <h2>{nextLesson ? nextLesson.title : "Hangul abgeschlossen"}</h2>
          </div>
          <button type="button" className="btn btn-lg" onClick={onSession} disabled={!nextLesson && due === 0}>
            Sitzung starten
          </button>
        </div>
        <ol className="steps">
          <li className={due ? "" : "is-skip"}>
            <span className="step-name">Aufwärmen mit Wiederholung</span>
            <span className="step-meta">
              {due ? `${due} fällig · ~${reviewMin} Min.` : "heute nichts fällig"}
            </span>
            {due > 0 && (
              <button type="button" className="btn-link" onClick={onReview}>
                nur das
              </button>
            )}
          </li>
          <li className={nextLesson ? "" : "is-skip"}>
            <span className="step-name">
              {nextLesson ? `Neue Lektion: ${nextLesson.summary}` : "Alle Hangul-Lektionen erledigt"}
            </span>
            <span className="step-meta">{nextLesson ? "~30 Min." : "Stufe 1 folgt"}</span>
            {nextLesson && (
              <button type="button" className="btn-link" onClick={() => onLesson(nextLesson)}>
                nur das
              </button>
            )}
          </li>
          <li>
            <span className="step-name">Zum Abschluss: freies Üben</span>
            <span className="step-meta">optional · 10 Min.</span>
          </li>
        </ol>
      </section>

      <div className="dash-grid">
        <section className="card week">
          <p className="eyebrow">Diese Woche</p>
          <p className="week-big">
            <strong>{week.studyDays}</strong> von {WEEKLY_GOAL_DAYS} Lerntagen
          </p>
          <div className="bars" aria-label="Lernminuten pro Tag">
            {week.days.map((d, i) => (
              <div className="bar-col" key={d.key}>
                <div className="bar-track">
                  <div
                    className={`bar ${d.minutes >= SESSION_MINUTES ? "is-goal" : ""}`}
                    style={{ height: `${(d.minutes / maxMin) * 100}%` }}
                    title={`${Math.round(d.minutes)} Min.`}
                  />
                  <div className="bar-goal" style={{ bottom: `${(SESSION_MINUTES / maxMin) * 100}%` }} />
                </div>
                <span className="bar-label">{WEEKDAYS[i]}</span>
              </div>
            ))}
          </div>
          <p className="muted small">
            {week.minutes} Min. diese Woche · ein Lerntag zählt ab {SESSION_MINUTES} Min.
            {streak > 0 && ` · ${streak} ${streak === 1 ? "Woche" : "Wochen"} in Folge geschafft`}
          </p>
        </section>

        <section className="card stats">
          <p className="eyebrow">Dein Stand</p>
          <dl>
            <div>
              <dt>Zeichen</dt>
              <dd>
                {learnedJamo}<span className="of">/{JAMO.length}</span>
              </dd>
            </div>
            <div>
              <dt>Wörter</dt>
              <dd>
                {words}<span className="of">/{totalWords}</span>
              </dd>
            </div>
            <div>
              <dt>Lektionen</dt>
              <dd>
                {done.length}<span className="of">/{LESSONS.length}</span>
              </dd>
            </div>
            <div>
              <dt>Lernzeit</dt>
              <dd>
                {totalMinutes}<span className="of"> Min.</span>
              </dd>
            </div>
          </dl>
          <p className="muted small">{progress.xp} Punkte gesammelt</p>
        </section>
      </div>

      <section className="card practice">
        <p className="eyebrow">Freies Üben</p>
        {isNew ? (
          <p className="muted">Sobald du die erste Lektion gemacht hast, kannst du hier mit allem üben, was du schon kennst.</p>
        ) : (
          <div className="practice-grid">
            <button type="button" className="tile" onClick={() => onPractice("listen")}>
              <strong>Hörtraining</strong>
              <span>Ähnliche Laute unterscheiden, Wörter erkennen</span>
            </button>
            <button type="button" className="tile" onClick={() => onPractice("type")}>
              <strong>Tipptraining</strong>
              <span>Gelernte Wörter auf Koreanisch schreiben</span>
            </button>
            <button type="button" className="tile" onClick={() => onPractice("mixed")}>
              <strong>Gemischt</strong>
              <span>Zufällige Aufgaben aus allem Gelernten</span>
            </button>
          </div>
        )}
      </section>

      <p className="sync muted small">
        {sync === "account" && "● Fortschritt wird in deinem Claude-Konto gespeichert."}
        {sync === "local" && "○ Fortschritt wird nur in diesem Browser gespeichert. Mach ab und zu eine Sicherung (Einstellungen)."}
        {sync === "checking" && "Speicher wird verbunden …"}
      </p>
    </div>
  );
}
