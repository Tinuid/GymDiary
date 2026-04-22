import { v4 as uuid } from 'uuid';
import { getDb } from './schema';
import type { Session } from '../types';

function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export async function getOrCreateTodaysSession(machineId: string): Promise<Session> {
  const db = await getDb();
  const today = startOfDay(Date.now());
  const existing = await db.getAllFromIndex('sessions', 'by-machineId', machineId);
  const match = existing.find((s) => startOfDay(s.date) === today);
  if (match) return match;

  const session: Session = {
    id: uuid(),
    machineId,
    date: Date.now(),
    notes: '',
  };
  await db.put('sessions', session);
  return session;
}

export async function listSessionsByMachine(machineId: string): Promise<Session[]> {
  const db = await getDb();
  const all = await db.getAllFromIndex('sessions', 'by-machineId', machineId);
  return all.sort((a, b) => b.date - a.date);
}

export async function getSession(id: string): Promise<Session | undefined> {
  const db = await getDb();
  return db.get('sessions', id);
}
