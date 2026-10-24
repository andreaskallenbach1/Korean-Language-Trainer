// Writes skill/koreanisch-tutor/references/lehrplan.md from the app's curriculum,
// so the Claude skill and the app always teach the same material.
import { writeFileSync } from "node:fs";
import { LESSONS } from "../src/data/lessons";
import { STATIONS } from "../src/data/stations";

const out: string[] = [
  "# Lehrplan der Koreanisch-Werkstatt",
  "",
  "Automatisch aus der App erzeugt (`npm run skill`). Reihenfolge = Lernreihenfolge. Lektions-IDs wie `h3` oder `s5` entsprechen den Schlüsseln in der Fortschritts-Sicherung (`lessons`).",
  "",
];
for (const l of LESSONS) {
  const st = STATIONS[l.id];
  out.push(`## ${l.id} · ${l.stage === 0 ? "Hangul" : `Stufe ${l.stage}`} · ${l.title}${st ? ` (Station ${st.ko})` : ""}`);
  out.push("", `Inhalt: ${l.summary}`);
  if (l.newJamo.length) out.push(`Neue Zeichen: ${l.newJamo.join(" ")}`);
  if (l.grammar?.length) {
    out.push("", "Grammatik:");
    for (const g of l.grammar) out.push(`- **${g.title}**: ${g.body.join(" ")}`);
  }
  out.push("", "Wörter:");
  for (const w of l.words) out.push(`- ${w.ko} (${w.roman}) – ${w.de}${w.say ? ` [gesprochen ${w.say}]` : ""}`);
  if (l.sentences?.length) {
    out.push("", "Schlüsselsätze:");
    for (const x of l.sentences) out.push(`- ${x.ko} – ${x.de}`);
  }
  if (l.mission) out.push("", `Mission „${l.mission.title}“: ${l.mission.goal}`);
  out.push("");
}
writeFileSync("skill/koreanisch-tutor/references/lehrplan.md", out.join("\n"));
console.log("lehrplan.md:", out.length, "Zeilen");
