import { LESSONS, ROADMAP, type Lesson } from "../data/lessons";
import type { Progress } from "../lib/progress";

interface Props {
  progress: Progress;
  onLesson: (l: Lesson) => void;
}

export function PathView({ progress, onLesson }: Props) {
  const firstOpen = LESSONS.findIndex((l) => !progress.lessons[l.id]);
  return (
    <div className="path">
      <h1>Lernpfad</h1>
      <p className="lead">
        Der Weg zu einfachen Gesprächen, orientiert an TOPIK 1 und 2. Bei drei Sitzungen pro Woche schaffst du Hangul in etwa drei
        Wochen und Stufe 1 in weiteren sechs bis acht Wochen.
      </p>
      {ROADMAP.map((stage) => (
        <section key={stage.stage} className={`stage-block ${LESSONS.some((l) => l.stage === stage.stage) ? "" : "is-future"}`}>
          <header>
            <p className="eyebrow">
              Stufe {stage.stage} · {stage.level}
            </p>
            <h2>{stage.title}</h2>
          </header>
          {LESSONS.some((l) => l.stage === stage.stage) ? (
            <ol className="lesson-list">
              {LESSONS.filter((l) => l.stage === stage.stage).map((l, i) => {
                const g = LESSONS.indexOf(l);
                const rec = progress.lessons[l.id];
                const locked = firstOpen >= 0 && g > firstOpen;
                const current = g === firstOpen;
                return (
                  <li key={l.id} className={rec ? "is-done" : current ? "is-current" : locked ? "is-locked" : ""}>
                    <span className="lesson-num">{i + 1}</span>
                    <div className="lesson-text">
                      <strong>{l.title}</strong>
                      <span className="ko-mixed">{l.summary}</span>
                    </div>
                    <span className="lesson-state">
                      {rec ? `${Math.round(rec.best * 100)} %` : current ? "als Nächstes" : locked ? "gesperrt" : ""}
                    </span>
                    <button type="button" className={rec ? "btn-secondary" : "btn"} disabled={locked} onClick={() => onLesson(l)}>
                      {rec ? "Wiederholen" : "Starten"}
                    </button>
                  </li>
                );
              })}
            </ol>
          ) : (
            <>
              <p className="muted small">In Vorbereitung. Wird gebaut, während du Hangul lernst.</p>
              <ul className="unit-list">
                {stage.units.map((u) => (
                  <li key={u}>{u}</li>
                ))}
              </ul>
            </>
          )}
        </section>
      ))}
    </div>
  );
}
