import { LESSONS } from "../data/lessons";
import { STATIONS } from "../data/stations";
import { describeItem, dueItems } from "./exercises";
import { weekStats, type Progress } from "./progress";

/** A short plain-text summary to paste into a Claude chat (used by the koreanisch-tutor skill). */
export function statusText(p: Progress, now = Date.now()): string {
  const done = LESSONS.filter((l) => p.lessons[l.id]);
  const next = LESSONS.find((l) => !p.lessons[l.id]);
  const week = weekStats(p, now);
  const mistakes = Object.entries(p.mistakes)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10)
    .map(([id, m]) => {
      const d = describeItem(id);
      return d ? `${d.ko} (${d.de}, ${m.count}× falsch)` : null;
    })
    .filter(Boolean);
  const lines = [
    "Lernstand Koreanisch-Werkstatt",
    `Abgeschlossen: ${done.length ? done.map((l) => `${l.id} ${l.title} (${Math.round(p.lessons[l.id].best * 100)} %)`).join("; ") : "noch keine Lektion"}`,
    `Als Nächstes: ${next ? `${next.id} ${next.title}${STATIONS[next.id] ? ` (Station ${STATIONS[next.id].ko})` : ""}` : "alle verfügbaren Lektionen erledigt"}`,
    `Gelernte Elemente: ${Object.keys(p.items).length}, davon heute fällig: ${dueItems(p, now).length}`,
    `Diese Woche: ${week.studyDays} von 3 Lerntagen, ${week.minutes} Minuten`,
    `Fehlerheft: ${mistakes.length ? mistakes.join(", ") : "leer"}`,
  ];
  return lines.join("\n");
}
