// Stroke order for all 40 jamo in a 100×100 box. Each stroke is a polyline
// drawn from its first to its last point. Rules: top to bottom, left to right.

export type Point = [number, number];
export type Stroke = Point[];

function circle(cx: number, cy: number, r: number): Stroke {
  // starts at the top and runs counter-clockwise, as ㅇ is written
  const pts: Stroke = [];
  for (let i = 0; i <= 24; i++) {
    const a = -Math.PI / 2 - (i / 24) * Math.PI * 2;
    pts.push([Math.round((cx + r * Math.cos(a)) * 10) / 10, Math.round((cy + r * Math.sin(a)) * 10) / 10]);
  }
  return pts;
}

/** Squeezes a glyph into the left or right half, for double consonants. */
function half(strokes: Stroke[], side: 0 | 1): Stroke[] {
  return strokes.map((s) => s.map(([x, y]) => [Math.round(x * 0.5 + side * 50), y] as Point));
}

const ㄱ: Stroke[] = [[[20, 25], [78, 25], [78, 85]]];
const ㄷ: Stroke[] = [[[22, 25], [78, 25]], [[22, 25], [22, 78], [80, 78]]];
const ㅂ: Stroke[] = [[[25, 18], [25, 82]], [[75, 18], [75, 82]], [[25, 50], [75, 50]], [[25, 82], [75, 82]]];
const ㅅ: Stroke[] = [[[50, 18], [20, 82]], [[50, 45], [82, 82]]];
const ㅈ: Stroke[] = [[[22, 22], [74, 22], [24, 84]], [[50, 48], [82, 84]]];

export const STROKES: Record<string, Stroke[]> = {
  ㄱ,
  ㄴ: [[[25, 20], [25, 78], [82, 78]]],
  ㄷ,
  ㄹ: [[[22, 20], [78, 20], [78, 50]], [[22, 50], [78, 50]], [[22, 50], [22, 82], [80, 82]]],
  ㅁ: [[[22, 22], [22, 80]], [[22, 22], [78, 22], [78, 80]], [[22, 80], [78, 80]]],
  ㅂ,
  ㅅ,
  ㅇ: [circle(50, 50, 30)],
  ㅈ,
  ㅊ: [[[44, 8], [56, 18]], [[22, 32], [74, 32], [24, 88]], [[50, 57], [82, 88]]],
  ㅋ: [[[22, 22], [78, 22], [78, 85]], [[22, 52], [78, 52]]],
  ㅌ: [[[22, 22], [78, 22]], [[22, 50], [78, 50]], [[22, 22], [22, 80], [80, 80]]],
  ㅍ: [[[18, 22], [82, 22]], [[35, 22], [35, 78]], [[65, 22], [65, 78]], [[15, 78], [85, 78]]],
  ㅎ: [[[45, 8], [55, 16]], [[22, 28], [78, 28]], circle(50, 62, 19)],
  ㄲ: [...half(ㄱ, 0), ...half(ㄱ, 1)],
  ㄸ: [...half(ㄷ, 0), ...half(ㄷ, 1)],
  ㅃ: [...half(ㅂ, 0), ...half(ㅂ, 1)],
  ㅆ: [...half(ㅅ, 0), ...half(ㅅ, 1)],
  ㅉ: [...half(ㅈ, 0), ...half(ㅈ, 1)],

  ㅣ: [[[50, 12], [50, 88]]],
  ㅏ: [[[42, 12], [42, 88]], [[42, 50], [70, 50]]],
  ㅓ: [[[30, 50], [58, 50]], [[58, 12], [58, 88]]],
  ㅗ: [[[50, 35], [50, 62]], [[12, 62], [88, 62]]],
  ㅜ: [[[12, 40], [88, 40]], [[50, 40], [50, 72]]],
  ㅡ: [[[12, 50], [88, 50]]],
  ㅑ: [[[38, 12], [38, 88]], [[38, 38], [66, 38]], [[38, 62], [66, 62]]],
  ㅕ: [[[28, 38], [56, 38]], [[28, 62], [56, 62]], [[56, 12], [56, 88]]],
  ㅛ: [[[38, 35], [38, 62]], [[62, 35], [62, 62]], [[12, 62], [88, 62]]],
  ㅠ: [[[12, 40], [88, 40]], [[38, 40], [38, 72]], [[62, 40], [62, 72]]],
  ㅐ: [[[30, 12], [30, 88]], [[30, 50], [52, 50]], [[68, 12], [68, 88]]],
  ㅔ: [[[22, 50], [44, 50]], [[44, 12], [44, 88]], [[70, 12], [70, 88]]],
  ㅒ: [[[30, 12], [30, 88]], [[30, 38], [52, 38]], [[30, 62], [52, 62]], [[68, 12], [68, 88]]],
  ㅖ: [[[18, 38], [42, 38]], [[18, 62], [42, 62]], [[42, 12], [42, 88]], [[70, 12], [70, 88]]],
  ㅘ: [[[30, 42], [30, 62]], [[8, 62], [55, 62]], [[70, 12], [70, 88]], [[70, 50], [90, 50]]],
  ㅙ: [[[25, 42], [25, 62]], [[6, 62], [45, 62]], [[58, 12], [58, 88]], [[58, 50], [72, 50]], [[84, 12], [84, 88]]],
  ㅚ: [[[32, 42], [32, 62]], [[8, 62], [58, 62]], [[76, 12], [76, 88]]],
  ㅝ: [[[6, 40], [52, 40]], [[30, 40], [30, 70]], [[56, 52], [72, 52]], [[72, 12], [72, 88]]],
  ㅞ: [[[5, 40], [45, 40]], [[25, 40], [25, 70]], [[50, 52], [62, 52]], [[62, 12], [62, 88]], [[84, 12], [84, 88]]],
  ㅟ: [[[6, 40], [58, 40]], [[32, 40], [32, 70]], [[76, 12], [76, 88]]],
  ㅢ: [[[6, 58], [60, 58]], [[76, 12], [76, 88]]],
};

export function strokePath(s: Stroke): string {
  return s.map(([x, y], i) => `${i ? "L" : "M"}${x} ${y}`).join(" ");
}

function dist(a: Point, b: Point): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

export interface StrokeCheck {
  ok: boolean;
  messages: string[];
}

/**
 * A forgiving offline check of a drawing against the model strokes: stroke
 * count, and whether each stroke starts and ends roughly where it should
 * (which catches wrong order and wrong direction).
 */
export function checkStrokes(jamo: string, drawn: Stroke[]): StrokeCheck {
  const model = STROKES[jamo];
  if (!model) return { ok: false, messages: ["Für dieses Zeichen gibt es keine Vorlage."] };
  const messages: string[] = [];
  const strokes = drawn.filter((s) => s.length > 1);
  if (strokes.length !== model.length) {
    messages.push(`Du hast ${strokes.length} ${strokes.length === 1 ? "Strich" : "Striche"} gezeichnet, ${jamo} hat ${model.length}.`);
    return { ok: false, messages };
  }
  const TOL = 26;
  model.forEach((m, i) => {
    const d = strokes[i];
    const start = dist(d[0], m[0]);
    const end = dist(d[d.length - 1], m[m.length - 1]);
    // a closed circle (ㅇ, ㅎ) starts and ends at the same place, so only its start counts
    const closed = dist(m[0], m[m.length - 1]) < 5;
    if (start <= TOL && (closed || end <= TOL)) return;
    const reversed = !closed && dist(d[0], m[m.length - 1]) < TOL && dist(d[d.length - 1], m[0]) < TOL;
    if (reversed) messages.push(`Strich ${i + 1} geht in die falsche Richtung.`);
    else messages.push(`Strich ${i + 1} sitzt an einer anderen Stelle oder kommt in der Reihenfolge später.`);
  });
  return { ok: messages.length === 0, messages };
}
