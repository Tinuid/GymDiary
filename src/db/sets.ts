import { v4 as uuid } from 'uuid';
import { getDb } from './schema';
import type { SetEntry } from '../types';

export async function listSetsBySession(sessionId: string): Promise<SetEntry[]> {
  const db = await getDb();
  const all = await db.getAllFromIndex('sets', 'by-sessionId', sessionId);
  return all.sort((a, b) => a.setIndex - b.setIndex);
}

export async function listSetsByMachine(machineId: string): Promise<SetEntry[]> {
  const db = await getDb();
  return db.getAllFromIndex('sets', 'by-machineId', machineId);
}

export interface AddSetInput {
  sessionId: string;
  machineId: string;
  weightKg: number;
  reps: number;
}

export async function addSet(input: AddSetInput): Promise<SetEntry> {
  const db = await getDb();
  const existing = await db.getAllFromIndex('sets', 'by-sessionId', input.sessionId);
  const nextIndex = existing.length + 1;
  const entry: SetEntry = {
    id: uuid(),
    setIndex: nextIndex,
    createdAt: Date.now(),
    ...input,
  };
  await db.put('sets', entry);
  return entry;
}

export async function deleteSet(id: string): Promise<void> {
  const db = await getDb();
  await db.delete('sets', id);
}
