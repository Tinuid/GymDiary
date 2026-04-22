import { useRef, useState } from 'react';
import { downloadBackup, importBackup, readBackupFile } from '../db/backup';
import { useAppStore } from '../store/useAppStore';

export default function Settings() {
  const inputRef = useRef<HTMLInputElement>(null);
  const refresh = useAppStore((s) => s.refreshMachines);
  const machineCount = useAppStore((s) => s.machines.length);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleExport() {
    setBusy(true);
    try {
      await downloadBackup();
      setStatus('Backup heruntergeladen.');
    } catch (err) {
      setStatus('Export fehlgeschlagen: ' + (err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function handleImportFile(file: File) {
    setBusy(true);
    try {
      const payload = await readBackupFile(file);
      const mode = confirm(
        'OK = Ersetzen (alle vorhandenen Daten werden überschrieben)\nAbbrechen = Zusammenführen',
      )
        ? 'replace'
        : 'merge';
      const result = await importBackup(payload, mode);
      await refresh();
      setStatus(
        `Import erfolgreich (${mode === 'replace' ? 'ersetzt' : 'zusammengeführt'}): ${result.machines} Geräte, ${result.sessions} Sessions, ${result.sets} Sätze.`,
      );
    } catch (err) {
      setStatus('Import fehlgeschlagen: ' + (err as Error).message);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div className="stack">
      <div className="card">
        <div style={{ color: 'var(--text-dim)', fontSize: 13 }}>Gespeicherte Geräte</div>
        <div style={{ fontSize: 28, fontWeight: 600 }}>{machineCount}</div>
      </div>

      <div className="card stack">
        <div>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Backup exportieren</div>
          <div style={{ color: 'var(--text-dim)', fontSize: 13 }}>
            Lädt eine JSON-Datei mit allen Geräten, Sessions und Fotos herunter.
          </div>
        </div>
        <button className="btn btn-primary btn-block" onClick={handleExport} disabled={busy}>
          Backup herunterladen
        </button>
      </div>

      <div className="card stack">
        <div>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Backup importieren</div>
          <div style={{ color: 'var(--text-dim)', fontSize: 13 }}>
            JSON-Datei auswählen. Du kannst ersetzen oder mit bestehenden Daten zusammenführen.
          </div>
        </div>
        <button
          className="btn btn-block"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
        >
          Datei auswählen …
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="application/json"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleImportFile(f);
          }}
        />
      </div>

      {status && (
        <div className="card" style={{ borderColor: 'var(--accent)' }}>
          {status}
        </div>
      )}

      <div style={{ color: 'var(--text-dim)', fontSize: 12, textAlign: 'center', padding: '16px 0' }}>
        GymDiary · Daten bleiben lokal im Browser
      </div>
    </div>
  );
}
