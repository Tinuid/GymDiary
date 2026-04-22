import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Machine, Session, SetEntry } from '../types';

interface GymDiaryDB extends DBSchema {
  machines: {
    key: string;
    value: Machine;
    indexes: { 'by-muscleGroup': string; 'by-lastUsedAt': number };
  };
  sessions: {
    key: string;
    value: Session;
    indexes: { 'by-machineId': string; 'by-date': number };
  };
  sets: {
    key: string;
    value: SetEntry;
    indexes: { 'by-sessionId': string; 'by-machineId': string };
  };
  meta: {
    key: string;
    value: unknown;
  };
}

const DB_NAME = 'gymdiary';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<GymDiaryDB>> | null = null;

export function getDb(): Promise<IDBPDatabase<GymDiaryDB>> {
  if (!dbPromise) {
    dbPromise = openDB<GymDiaryDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          const machines = db.createObjectStore('machines', { keyPath: 'id' });
          machines.createIndex('by-muscleGroup', 'muscleGroup');
          machines.createIndex('by-lastUsedAt', 'lastUsedAt');

          const sessions = db.createObjectStore('sessions', { keyPath: 'id' });
          sessions.createIndex('by-machineId', 'machineId');
          sessions.createIndex('by-date', 'date');

          const sets = db.createObjectStore('sets', { keyPath: 'id' });
          sets.createIndex('by-sessionId', 'sessionId');
          sets.createIndex('by-machineId', 'machineId');

          db.createObjectStore('meta');
        }
      },
    });
  }
  return dbPromise;
}

export type { GymDiaryDB };
