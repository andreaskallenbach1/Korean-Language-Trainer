// Saves progress in the viewer's private claude.ai artifact store when the
// page runs as an artifact, and always mirrors it to localStorage as a cache
// (or as the only store when opened outside claude.ai).

import { normalize, type Progress } from "./progress";

const LOCAL_KEY = "hangul-trainer-progress-v1";

interface DocSnap {
  exists: boolean;
  data(): Record<string, unknown> | undefined;
}
interface DocRef {
  get(): Promise<DocSnap>;
  set(data: Record<string, unknown>): Promise<void>;
}
interface DbLike {
  doc(path: string): DocRef;
}
interface UserLike {
  id(): Promise<string | null>;
}
interface ClaudeLike {
  use(name: string): Promise<unknown>;
}

export type SyncMode = "checking" | "account" | "local";

export function loadLocal(): Progress | null {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? normalize(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

function saveLocal(p: Progress) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(p));
  } catch {
    // storage blocked: the account store (if any) still has it
  }
}

export class ProgressStore {
  private ref: DocRef | null = null;
  private writing = false;
  private pending: Progress | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;

  /** Resolves with the account copy (if any) and the resulting sync mode. */
  async connect(): Promise<{ mode: SyncMode; remote: Progress | null }> {
    const claude = (window as unknown as { claude?: ClaudeLike }).claude;
    if (!claude?.use) return { mode: "local", remote: null };
    try {
      const [db, user] = (await Promise.all([claude.use("db"), claude.use("user")])) as [
        DbLike | null,
        UserLike | null,
      ];
      const uid = await user?.id();
      if (!db || !uid) return { mode: "local", remote: null };
      this.ref = db.doc(`data/users/${uid}/progress`);
      const snap = await this.ref.get();
      const remote = snap.exists ? normalize(snap.data()) : null;
      return { mode: "account", remote };
    } catch {
      this.ref = null;
      return { mode: "local", remote: null };
    }
  }

  save(p: Progress) {
    saveLocal(p);
    if (!this.ref) return;
    this.pending = p;
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => void this.flush(), 1200);
  }

  private async flush() {
    if (!this.ref || this.writing || !this.pending) return;
    const p = this.pending;
    this.pending = null;
    this.writing = true;
    try {
      await this.ref.set(JSON.parse(JSON.stringify(p)));
    } catch {
      // keep the local copy; the next change retries
      this.pending ??= p;
    } finally {
      this.writing = false;
      if (this.pending) this.timer = setTimeout(() => void this.flush(), 3000);
    }
  }
}
