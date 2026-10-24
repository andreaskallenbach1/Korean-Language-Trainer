import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlphabetView } from "./components/AlphabetView";
import { Dashboard } from "./components/Dashboard";
import { PathView } from "./components/PathView";
import { Player } from "./components/Player";
import { SettingsView } from "./components/SettingsView";
import { TutorView } from "./components/TutorView";
import { LESSONS, type Lesson } from "./data/lessons";
import { buildLesson, buildPractice, buildReview, type Exercise, type PracticeKind } from "./lib/exercises";
import { applyRun, emptyProgress, type Progress, type RunResult, type Settings } from "./lib/progress";
import { speechPrefs } from "./lib/speech";
import { loadLocal, ProgressStore, type SyncMode } from "./lib/storage";

type View = "home" | "path" | "alphabet" | "tutor" | "settings";
type RunKind = "lesson" | "review" | "practice";

interface Run {
  kind: RunKind;
  title: string;
  exercises: Exercise[];
  lessonId?: string;
  thenLesson?: boolean;
}

interface Summary {
  run: Run;
  result: RunResult;
  xpBefore: number;
}

const NAV: { id: View; label: string }[] = [
  { id: "home", label: "Heute" },
  { id: "path", label: "Lernpfad" },
  { id: "alphabet", label: "Alphabet" },
  { id: "tutor", label: "Tutor" },
  { id: "settings", label: "Einstellungen" },
];

const PRACTICE_TITLES: Record<PracticeKind, string> = {
  listen: "Hörtraining",
  type: "Tipptraining",
  mixed: "Gemischtes Üben",
};

export function App() {
  const store = useRef(new ProgressStore());
  const [progress, setProgress] = useState<Progress>(() => loadLocal() ?? emptyProgress());
  const [sync, setSync] = useState<SyncMode>("checking");
  const [view, setView] = useState<View>("home");
  const [run, setRun] = useState<Run | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    let alive = true;
    store.current.connect().then(({ mode, remote }) => {
      if (!alive) return;
      setSync(mode);
      if (mode !== "account") return;
      setProgress((local) => {
        if (remote && remote.updatedAt >= local.updatedAt) return remote;
        if (local.updatedAt > 0) store.current.save(local);
        return local;
      });
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    speechPrefs.rate = progress.settings.rate;
    speechPrefs.voiceURI = progress.settings.voiceURI;
  }, [progress.settings]);

  const update = useCallback((next: Progress) => {
    setProgress(next);
    store.current.save(next);
  }, []);

  const nextLesson = useMemo(() => LESSONS.find((l) => !progress.lessons[l.id]) ?? null, [progress.lessons]);

  const startLesson = (l: Lesson) => {
    setSummary(null);
    setRun({ kind: "lesson", title: `Lektion ${LESSONS.indexOf(l) + 1}: ${l.title}`, exercises: buildLesson(l), lessonId: l.id });
  };

  const startReview = (thenLesson = false) => {
    const exercises = buildReview(progress, Date.now());
    if (!exercises.length) {
      if (thenLesson && nextLesson) startLesson(nextLesson);
      return;
    }
    setSummary(null);
    setRun({ kind: "review", title: "Wiederholung", exercises, thenLesson });
  };

  const startPractice = (k: PracticeKind) => {
    const exercises = buildPractice(progress, k);
    if (!exercises.length) return;
    setSummary(null);
    setRun({ kind: "practice", title: PRACTICE_TITLES[k], exercises });
  };

  const finish = (result: RunResult, completed: boolean) => {
    if (!run) return;
    const before = progress.xp;
    const res = completed ? result : { ...result, lessonId: undefined };
    update(applyRun(progress, res, Date.now()));
    setSummary({ run, result: res, xpBefore: before });
    setRun(null);
    window.scrollTo({ top: 0 });
  };

  if (run) {
    return (
      <main className="app app-run">
        <Player
          key={run.title + run.exercises.length}
          title={run.title}
          exercises={run.exercises}
          showRoman={progress.settings.showRoman}
          lessonId={run.lessonId}
          onFinish={(r) => finish(r, true)}
          onAbort={(r) => {
            if (r) finish(r, false);
            else setRun(null);
          }}
        />
      </main>
    );
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark ko" aria-hidden="true">
            한
          </span>
          <span className="brand-name">Koreanisch-Werkstatt</span>
        </div>
        <nav aria-label="Hauptmenü">
          {NAV.map((n) => (
            <button
              type="button"
              key={n.id}
              className={`nav-btn ${view === n.id ? "is-active" : ""}`}
              aria-current={view === n.id ? "page" : undefined}
              onClick={() => {
                setView(n.id);
                setSummary(null);
              }}
            >
              {n.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="content">
        {summary && (
          <SummaryCard
            summary={summary}
            xpNow={progress.xp}
            nextLesson={nextLesson}
            onClose={() => setSummary(null)}
            onLesson={startLesson}
            onPractice={() => startPractice("mixed")}
          />
        )}
        {view === "home" && (
          <Dashboard
            progress={progress}
            sync={sync}
            nextLesson={nextLesson}
            onSession={() => startReview(true)}
            onReview={() => startReview(false)}
            onLesson={startLesson}
            onPractice={startPractice}
          />
        )}
        {view === "path" && <PathView progress={progress} onLesson={startLesson} />}
        {view === "alphabet" && <AlphabetView progress={progress} />}
        {view === "tutor" && <TutorView progress={progress} />}
        {view === "settings" && (
          <SettingsView
            progress={progress}
            sync={sync}
            onSettings={(s: Settings) => update({ ...progress, settings: s, updatedAt: Date.now() })}
            onReplace={update}
          />
        )}
      </main>
    </div>
  );
}

function SummaryCard({
  summary,
  xpNow,
  nextLesson,
  onClose,
  onLesson,
  onPractice,
}: {
  summary: Summary;
  xpNow: number;
  nextLesson: Lesson | null;
  onClose: () => void;
  onLesson: (l: Lesson) => void;
  onPractice: () => void;
}) {
  const { run, result } = summary;
  const pct = result.total ? Math.round((result.correct / result.total) * 100) : 0;
  const mistakes = Object.entries(result.items).filter(([, ok]) => !ok).length;
  const verdict = pct >= 90 ? "Hervorragend!" : pct >= 70 ? "Gut gemacht!" : "Weiter so, Übung macht den Unterschied.";
  return (
    <section className="card summary" aria-live="polite">
      <p className="eyebrow">{run.title} · abgeschlossen</p>
      <h2>{verdict}</h2>
      <dl className="summary-stats">
        <div>
          <dt>Richtig beim ersten Versuch</dt>
          <dd>{pct} %</dd>
        </div>
        <div>
          <dt>Lernzeit</dt>
          <dd>{Math.max(1, Math.round(result.minutes))} Min.</dd>
        </div>
        <div>
          <dt>Punkte</dt>
          <dd>+{xpNow - summary.xpBefore}</dd>
        </div>
      </dl>
      <p className="muted">
        {mistakes > 0
          ? `${mistakes} ${mistakes === 1 ? "Element kommt" : "Elemente kommen"} bald in der Wiederholung wieder.`
          : "Alles saß. Die Wiederholung meldet sich in ein paar Tagen."}
      </p>
      <div className="row">
        {run.thenLesson && nextLesson ? (
          <button type="button" className="btn" onClick={() => onLesson(nextLesson)}>
            Weiter zur Lektion: {nextLesson.title}
          </button>
        ) : (
          run.kind === "lesson" && (
            <button type="button" className="btn" onClick={onPractice}>
              Zum Abschluss frei üben
            </button>
          )
        )}
        <button type="button" className="btn-secondary" onClick={onClose}>
          Zur Übersicht
        </button>
      </div>
    </section>
  );
}
