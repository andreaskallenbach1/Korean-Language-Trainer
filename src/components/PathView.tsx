import type { CSSProperties } from "react";
import { LESSONS, ROADMAP, type Lesson } from "../data/lessons";
import { LINES, STATIONS } from "../data/stations";
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
        Deine Route durch Seoul, orientiert an TOPIK 1 und 2. Jede Lektion ist eine Station. Bei drei Sitzungen pro Woche schaffst du Linie 1
        (Hangul) in etwa drei Wochen und Linie 2 in weiteren sechs bis acht Wochen.
      </p>
      {ROADMAP.map((stage) => {
        const line = LINES[stage.stage];
        const lessons = LESSONS.filter((l) => l.stage === stage.stage);
        const style = { "--line": line.color } as CSSProperties;
        return (
          <section key={stage.stage} className={`metro ${lessons.length ? "" : "is-future"}`} style={style}>
            <header className="metro-head">
              <span className="line-badge" aria-hidden="true">
                {stage.stage + 1}
              </span>
              <div>
                <p className="eyebrow">
                  {line.name} · Stufe {stage.stage} · {stage.level}
                </p>
                <h2>{stage.title}</h2>
              </div>
            </header>
            <ol className="stations">
              {lessons.length
                ? lessons.map((l) => {
                    const g = LESSONS.indexOf(l);
                    const rec = progress.lessons[l.id];
                    const locked = firstOpen >= 0 && g > firstOpen;
                    const current = g === firstOpen;
                    const st = STATIONS[l.id];
                    const state = rec ? "is-done" : current ? "is-current" : locked ? "is-locked" : "";
                    return (
                      <li key={l.id} className={`station ${state}`}>
                        <span className="station-dot" aria-hidden="true" />
                        <div className="station-body">
                          {st && (
                            <p className="station-name">
                              <span className="ko">{st.ko}</span> <span className="muted small">{st.roman}</span>
                              {current && <span className="here">Nächster Halt</span>}
                            </p>
                          )}
                          <p className="station-lesson">
                            <strong>{l.title}</strong> <span className="ko-mixed">{l.summary}</span>
                          </p>
                          {st && (rec || current) && <p className="station-fact">{st.fact}</p>}
                        </div>
                        <div className="station-side">
                          {rec && <span className="lesson-state">{Math.round(rec.best * 100)} %</span>}
                          <button type="button" className={rec ? "btn-secondary" : "btn"} disabled={locked} onClick={() => onLesson(l)}>
                            {rec ? "Wiederholen" : locked ? "Gesperrt" : "Starten"}
                          </button>
                        </div>
                      </li>
                    );
                  })
                : stage.units.map((u) => (
                    <li key={u} className="station is-future">
                      <span className="station-dot" aria-hidden="true" />
                      <div className="station-body">
                        <p className="station-lesson">{u}</p>
                      </div>
                    </li>
                  ))}
            </ol>
            {!lessons.length && <p className="muted small metro-note">In Vorbereitung. Diese Linie wird gebaut, während du lernst.</p>}
          </section>
        );
      })}
    </div>
  );
}
