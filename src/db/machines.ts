import { v4 as uuid } from 'uuid';
import { getDb } from './schema';
import type { Machine, MuscleGroup } from '../types';

export async function listMachines(): Promise<Machine[]> {
  const db = await getDb();
  return db.getAll('machines');
}

export async function getMachine(id: string): Promise<Machine | undefined> {
  const db = await getDb();
  return db.get('machines', id);
}

export interface NewMachineInput {
  name: string;
  muscleGroup: MuscleGroup;
  settings: string;
  photoBlob: Blob;
  photoThumbBlob: Blob;
}

export async function createMachine(input: NewMachineInput): Promise<Machine> {
  const now = Date.now();
  const machine: Machine = {
    id: uuid(),
    createdAt: now,
    lastUsedAt: now,
    ...input,
  };
  const db = await getDb();
  await db.put('machines', machine);
  return machine;
}

export async function updateMachine(machine: Machine): Promise<void> {
  const db = await getDb();
  await db.put('machines', machine);
}

export async function touchMachine(id: string): Promise<void> {
  const db = await getDb();
  const m = await db.get('machines', id);
  if (!m) return;
  m.lastUsedAt = Date.now();
  await db.put('machines', m);
}

export async function deleteMachine(id: string): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(['machines', 'sessions', 'sets'], 'readwrite');
  await tx.objectStore('machines').delete(id);

  const sessionStore = tx.objectStore('sessions');
  const sessionIds: string[] = [];
  for (const s of await sessionStore.index('by-machineId').getAll(id)) {
    sessionIds.push(s.id);
    await sessionStore.delete(s.id);
  }

  const setStore = tx.objectStore('sets');
  for (const s of await setStore.index('by-machineId').getAll(id)) {
    await setStore.delete(s.id);
  }

  await tx.done;
  void sessionIds;
}
