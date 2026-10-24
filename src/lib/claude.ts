// Access to the claude.ai artifact runtime ("ask Claude" from the page).
// Outside claude.ai every capability resolves to null.

export interface ChatMsg {
  role: "user" | "assistant";
  content: string;
}

export interface SampleOptions {
  onText?: (u: { text: string }) => void;
  cache?: boolean;
  signal?: AbortSignal;
  images?: Blob[];
}

export interface SampleFn {
  (input: string | ChatMsg[], opts?: SampleOptions): Promise<{ text: string }>;
  json?: <T>(input: string | ChatMsg[], opts?: SampleOptions) => Promise<T>;
  limits?: () => Promise<{ images?: unknown }>;
}

interface ClaudeLike {
  use(name: string): Promise<unknown>;
}

export function claudeRuntime(): ClaudeLike | null {
  const c = (window as unknown as { claude?: ClaudeLike }).claude;
  return c?.use ? c : null;
}

let samplePromise: Promise<SampleFn | null> | null = null;

export function getSample(): Promise<SampleFn | null> {
  const c = claudeRuntime();
  if (!c) return Promise.resolve(null);
  samplePromise ??= c.use("sample").then(
    (s) => (s as SampleFn) ?? null,
    () => null,
  );
  return samplePromise;
}

export const SAMPLE_ERRORS: Record<string, string> = {
  rate_limited: "Gerade zu viele Anfragen. Versuch es in ein paar Minuten noch einmal.",
  session_expired: "Bitte melde dich bei Claude neu an.",
  refused: "Darauf kann ich nicht antworten. Formuliere es bitte anders.",
  empty_completion: "Es kam keine Antwort. Versuch es mit einer einfacheren Nachricht.",
  upstream_error: "Die Verbindung wurde unterbrochen. Versuch es noch einmal.",
  invalid_json: "Die Auswertung hat nicht geklappt. Versuch es noch einmal.",
};

export const SAMPLE_FATAL = new Set(["not_granted", "sampling_disabled", "not_declared", "capability_disabled", "capability_removed"]);

export function sampleErrorCode(e: unknown): string {
  return (e as { code?: string })?.code ?? "upstream_error";
}
