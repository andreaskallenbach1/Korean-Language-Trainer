import { speak } from "../lib/speech";

/** Running text in which every Hangul run is a button that reads it aloud. */
export function HangulText({ text }: { text: string }) {
  const parts = text.split(/([가-힣]+(?:[ 가-힣]*[가-힣])?)/);
  return (
    <>
      {parts.map((part, i) =>
        /[가-힣]/.test(part) ? (
          <button type="button" key={i} className="inline-ko" onClick={() => speak(part)} title="Anhören">
            {part}
          </button>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

/** Minimal Markdown for tutor replies: paragraphs, "- " lists and **bold**. */
export function RichText({ text }: { text: string }) {
  const blocks: { list: boolean; lines: string[] }[] = [];
  for (const raw of text.split("\n")) {
    const line = raw.trimEnd();
    const isItem = /^\s*([-*•]|\d+\.)\s+/.test(line);
    if (!line.trim()) {
      blocks.push({ list: false, lines: [] });
      continue;
    }
    const last = blocks[blocks.length - 1];
    if (last && last.list === isItem && last.lines.length) last.lines.push(line);
    else blocks.push({ list: isItem, lines: [line] });
  }
  const inline = (s: string) =>
    s.split(/(\*\*[^*]+\*\*)/).map((seg, i) =>
      seg.startsWith("**") && seg.endsWith("**") ? (
        <strong key={i}>
          <HangulText text={seg.slice(2, -2)} />
        </strong>
      ) : (
        <HangulText key={i} text={seg.replace(/^#+\s*/, "")} />
      ),
    );
  return (
    <>
      {blocks
        .filter((b) => b.lines.length)
        .map((b, i) =>
          b.list ? (
            <ul key={i}>
              {b.lines.map((l, j) => (
                <li key={j}>{inline(l.replace(/^\s*([-*•]|\d+\.)\s+/, ""))}</li>
              ))}
            </ul>
          ) : (
            <p key={i}>{b.lines.map((l, j) => <span key={j}>{inline(l)}{j < b.lines.length - 1 && <br />}</span>)}</p>
          ),
        )}
    </>
  );
}
