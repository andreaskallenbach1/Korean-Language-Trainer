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
        Wochen, danach folgt Stufe 1.
      </p>
      {ROADMAP.map((stage) => (
        <section key={stage.stage} className={`stage-block ${stage.stage === 0 ? "" : "is-future"}`}>
          <header>
            <p className="eyebrow">
              Stufe {stage.stage} · {stage.level}
            </p>
            <h2>{stage.title}</h2>
          </header>
          {stage.stage === 0 ? (
            <ol className="lesson-list">
              {LESSONS.filter((l) => l.stage === 0).map((l, i) => {
                const rec = progress.lessons[l.id];
                const locked = firstOpen >= 0 && i > firstOpen;
                const current = i === firstOpen;
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
