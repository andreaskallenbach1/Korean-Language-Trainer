// Korean number words: Sino-Korean (일, 이, 삼 …) and native Korean (하나, 둘, 셋 …).

const SINO_DIGITS = ["", "일", "이", "삼", "사", "오", "육", "칠", "팔", "구"];

/** Below 10,000: 1 is dropped before 십, 백, 천 (십, not 일십). */
function sinoBelow10k(n: number): string {
  const units: [number, string][] = [[1000, "천"], [100, "백"], [10, "십"]];
  let out = "";
  let rest = n;
  for (const [value, word] of units) {
    const d = Math.floor(rest / value);
    if (d) out += (d === 1 ? "" : SINO_DIGITS[d]) + word;
    rest %= value;
  }
  return out + SINO_DIGITS[rest];
}

export function sino(n: number): string {
  if (n === 0) return "영";
  const man = Math.floor(n / 10000);
  const rest = n % 10000;
  // 만 alone means 10,000 (no 일), larger multiples are spelled out
  const manPart = man ? (man === 1 ? "만" : `${sinoBelow10k(man)}만`) : "";
  return manPart + (rest ? sinoBelow10k(rest) : "");
}

const NATIVE_ONES = ["", "하나", "둘", "셋", "넷", "다섯", "여섯", "일곱", "여덟", "아홉"];
const NATIVE_ONES_ATTR = ["", "한", "두", "세", "네", "다섯", "여섯", "일곱", "여덟", "아홉"];
const NATIVE_TENS = ["", "열", "스물", "서른", "마흔", "쉰", "예순", "일흔", "여든", "아흔"];

/** Native Korean 1–99. `attributive` gives the short forms used before counters (한 잔, 스무 살). */
export function native(n: number, attributive = false): string {
  if (n < 1 || n > 99) throw new Error("native numbers cover 1–99");
  const t = Math.floor(n / 10);
  const o = n % 10;
  if (attributive && n === 20) return "스무";
  return NATIVE_TENS[t] + (attributive ? NATIVE_ONES_ATTR[o] : NATIVE_ONES[o]);
}

/** Phone numbers are read digit by digit, 0 as 공. */
export function phone(digits: string): string {
  return [...digits].map((d) => (d === "0" ? "공" : SINO_DIGITS[Number(d)])).join("");
}

export function formatNumber(n: number): string {
  return n.toLocaleString("de-DE");
}
