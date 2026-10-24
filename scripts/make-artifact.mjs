// Turns the single-file build (dist/index.html) into a page fragment for a
// claude.ai artifact: the artifact host supplies doctype, <head> and <body>.
import { readFileSync, writeFileSync } from "node:fs";

const html = readFileSync("dist/index.html", "utf8");
const head = html.match(/<head>([\s\S]*?)<\/head>/)?.[1] ?? "";
const body = html.match(/<body>([\s\S]*?)<\/body>/)?.[1] ?? "";
const keep = head
  .split("\n")
  .filter((l) => !/<meta charset|<meta name="viewport"/i.test(l))
  .join("\n");
// title first so the artifact host finds it in the first 8 KB
const title = keep.match(/<title>[\s\S]*?<\/title>/)?.[0] ?? "";
const rest = keep.replace(title, "");
writeFileSync("dist/artifact.html", `${title}\n${rest.trim()}\n${body.trim()}\n`);
console.log("dist/artifact.html written");
