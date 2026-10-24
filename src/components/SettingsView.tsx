import { useEffect, useState } from "react";
import { emptyProgress, normalize, type Progress, type Settings } from "../lib/progress";
import { koreanVoices, onVoicesChanged, recognitionSupported, speak, ttsSupported } from "../lib/speech";
import type { SyncMode } from "../lib/storage";
import { statusText } from "../lib/status";

interface Props {
  progress: Progress;
  sync: SyncMode;
  onSettings: (s: Settings) => void;
  onReplace: (p: Progress) => void;
}

export function SettingsView({ progress, sync, onSettings, onReplace }: Props) {
  const [voices, setVoices] = useState(koreanVoices());
  const [backupText, setBackupText] = useState("");
  const [importText, setImportText] = useState("");
  const [msg, setMsg] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);
  const s = progress.settings;

  useEffect(() => onVoicesChanged(() => setVoices(koreanVoices())), []);

  const [statusMsg, setStatusMsg] = useState("");
  const [statusOut, setStatusOut] = useState("");
  const copyStatus = async () => {
    const text = statusText(progress);
    setStatusOut(text);
    try {
      await navigator.clipboard.writeText(text);
      setStatusMsg("Kopiert. Füge den Text in einen Claude-Chat ein und sag z. B. „Lass uns Koreanisch üben“.");
    } catch {
      setStatusMsg("Kopieren nicht möglich. Markiere den Text unten und kopiere ihn selbst.");
    }
  };

  const copyBackup = async () => {
    const json = JSON.stringify(progress);
    setBackupText(json);
    try {
      await navigator.clipboard.writeText(json);
      setMsg("Sicherung in die Zwischenablage kopiert. Speichere sie z. B. in einer Notiz.");
    } catch {
      setMsg("Kopieren nicht möglich. Markiere den Text unten und kopiere ihn selbst.");
    }
  };

  const doImport = () => {
    try {
      const p = normalize(JSON.parse(importText));
      onReplace({ ...p, updatedAt: Date.now() });
      setImportText("");
      setMsg("Sicherung wiederhergestellt.");
    } catch {
      setMsg("Das ist keine gültige Sicherung. Füge den vollständigen Text ein.");
    }
  };

  return (
    <div className="settings">
      <h1>Einstellungen</h1>

      <section className="card">
        <h2>Aussprache</h2>
        {!ttsSupported() && <p className="chat-error">Dieser Browser unterstützt keine Sprachausgabe. Nimm am besten Chrome oder Edge.</p>}
        {ttsSupported() && voices.length === 0 && (
          <p className="chat-error">
            Keine koreanische Stimme gefunden. In Chrome und Edge ist eine dabei. Unter Windows kannst du außerdem in den
            Systemeinstellungen (Zeit und Sprache → Sprache) Koreanisch mit Sprachausgabe hinzufügen.
          </p>
        )}
        <div className="field">
          <label htmlFor="voice">Stimme</label>
          <select id="voice" value={s.voiceURI} onChange={(e) => onSettings({ ...s, voiceURI: e.target.value })}>
            <option value="">Automatisch (beste verfügbare)</option>
            {voices.map((v) => (
              <option key={v.voiceURI} value={v.voiceURI}>
                {v.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="rate">Sprechtempo: {Math.round(s.rate * 100)} %</label>
          <input
            id="rate"
            type="range"
            min={0.5}
            max={1.2}
            step={0.05}
            value={s.rate}
            onChange={(e) => onSettings({ ...s, rate: Number(e.target.value) })}
          />
        </div>
        <button type="button" className="btn-audio" onClick={() => speak("안녕하세요. 만나서 반갑습니다.")}>
          🔊 Probe hören
        </button>
        <p className="muted small">
          Spracherkennung (Aussprache prüfen): {recognitionSupported() ? "vom Browser unterstützt" : "nicht verfügbar"}. Wo das Mikrofon
          nicht erlaubt ist, bewertest du deine Aussprache selbst.
        </p>
      </section>

      <section className="card">
        <h2>Lernhilfen</h2>
        <label className="check" htmlFor="roman">
          <input id="roman" type="checkbox" checked={s.showRoman} onChange={(e) => onSettings({ ...s, showRoman: e.target.checked })} />
          Umschrift (lateinische Buchstaben) bei Wörtern anzeigen
        </label>
        <p className="muted small">Schalte das aus, sobald du Hangul sicher liest. Das trainiert das echte Lesen.</p>
      </section>

      <section className="card">
        <h2>Mit Claude im Chat üben</h2>
        <p className="muted">
          Mit dem Skill „koreanisch-tutor“ kannst du in jedem Claude-Chat üben. Damit Claude weiß, wo du stehst, kopiere deinen Lernstand und füge
          ihn dort ein.
        </p>
        <div className="row">
          <button type="button" className="btn-secondary" onClick={copyStatus}>
            Lernstand für Claude kopieren
          </button>
        </div>
        {statusOut && <textarea id="status-out" readOnly value={statusOut} rows={6} onFocus={(e) => e.target.select()} />}
        {statusMsg && <p className="muted">{statusMsg}</p>}
      </section>

      <section className="card">
        <h2>Fortschritt sichern</h2>
        <p className="muted">
          {sync === "account"
            ? "Dein Fortschritt wird automatisch in deinem Claude-Konto gespeichert. Eine zusätzliche Sicherung schadet trotzdem nicht."
            : "Dein Fortschritt liegt nur in diesem Browser. Mach regelmäßig eine Sicherung."}
        </p>
        <div className="row">
          <button type="button" className="btn-secondary" onClick={copyBackup}>
            Sicherung kopieren
          </button>
        </div>
        {backupText && <textarea id="backup-out" readOnly value={backupText} rows={3} onFocus={(e) => e.target.select()} />}
        <div className="field">
          <label htmlFor="backup-in">Sicherung wiederherstellen</label>
          <textarea id="backup-in" rows={3} value={importText} placeholder="Sicherung hier einfügen" onChange={(e) => setImportText(e.target.value)} />
        </div>
        <button type="button" className="btn-secondary" onClick={doImport} disabled={!importText.trim()}>
          Wiederherstellen
        </button>
        {msg && <p className="muted">{msg}</p>}
      </section>

      <section className="card danger">
        <h2>Neu anfangen</h2>
        {!confirmReset ? (
          <button type="button" className="btn-secondary" onClick={() => setConfirmReset(true)}>
            Fortschritt zurücksetzen
          </button>
        ) : (
          <div className="confirm">
            <p>Wirklich alles löschen? Lektionen, Wiederholungen und Lernzeit gehen verloren.</p>
            <div className="row">
              <button type="button" className="btn" onClick={() => setConfirmReset(false)}>
                Abbrechen
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={() => {
                  onReplace({ ...emptyProgress(), settings: s, updatedAt: Date.now() });
                  setConfirmReset(false);
                }}
              >
                Ja, alles löschen
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
