import { getDb } from './schema';
import type { Machine, Session, SetEntry } from '../types';

interface BackupMachine extends Omit<Machine, 'photoBlob' | 'photoThumbBlob'> {
  photoDataUrl: string;
  photoThumbDataUrl: string;
  photoMime: string;
}

export interface BackupPayload {
  version: 1;
  exportedAt: number;
  machines: BackupMachine[];
  sessions: Session[];
  sets: SetEntry[];
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  return res.blob();
}

export async function exportBackup(): Promise<BackupPayload> {
  const db = await getDb();
  const [machines, sessions, sets] = await Promise.all([
    db.getAll('machines'),
    db.getAll('sessions'),
    db.getAll('sets'),
  ]);

  const encodedMachines: BackupMachine[] = await Promise.all(
    machines.map(async (m) => ({
      id: m.id,
      name: m.name,
      muscleGroup: m.muscleGroup,
      settings: m.settings,
      createdAt: m.createdAt,
      lastUsedAt: m.lastUsedAt,
      photoMime: m.photoBlob.type || 'image/webp',
      photoDataUrl: await blobToDataUrl(m.photoBlob),
      photoThumbDataUrl: await blobToDataUrl(m.photoThumbBlob),
    })),
  );

  return {
    version: 1,
    exportedAt: Date.now(),
    machines: encodedMachines,
    sessions,
    sets,
  };
}

export async function downloadBackup(): Promise<void> {
  const payload = await exportBackup();
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const stamp = new Date(payload.exportedAt).toISOString().replace(/[:.]/g, '-');
  a.href = url;
  a.download = `gymdiary-backup-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export interface ImportResult {
  machines: number;
  sessions: number;
  sets: number;
}

export async function importBackup(
  payload: BackupPayload,
  mode: 'merge' | 'replace',
): Promise<ImportResult> {
  if (payload.version !== 1) {
    throw new Error(`Unbekannte Backup-Version: ${payload.version}`);
  }
  const db = await getDb();

  const restoredMachines: Machine[] = await Promise.all(
    payload.machines.map(async (m) => ({
      id: m.id,
      name: m.name,
      muscleGroup: m.muscleGroup,
      settings: m.settings,
      createdAt: m.createdAt,
      lastUsedAt: m.lastUsedAt,
      photoBlob: await dataUrlToBlob(m.photoDataUrl),
      photoThumbBlob: await dataUrlToBlob(m.photoThumbDataUrl),
    })),
  );

  const tx = db.transaction(['machines', 'sessions', 'sets'], 'readwrite');
  if (mode === 'replace') {
    await tx.objectStore('machines').clear();
    await tx.objectStore('sessions').clear();
    await tx.objectStore('sets').clear();
  }
  for (const m of restoredMachines) await tx.objectStore('machines').put(m);
  for (const s of payload.sessions) await tx.objectStore('sessions').put(s);
  for (const s of payload.sets) await tx.objectStore('sets').put(s);
  await tx.done;

  return {
    machines: restoredMachines.length,
    sessions: payload.sessions.length,
    sets: payload.sets.length,
  };
}

export async function readBackupFile(file: File): Promise<BackupPayload> {
  const text = await file.text();
  const parsed = JSON.parse(text) as BackupPayload;
  return parsed;
}
