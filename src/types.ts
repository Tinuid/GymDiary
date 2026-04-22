export type MuscleGroup =
  | 'Brust'
  | 'Rücken'
  | 'Beine'
  | 'Schultern'
  | 'Arme'
  | 'Bauch'
  | 'Sonstige';

export const MUSCLE_GROUPS: MuscleGroup[] = [
  'Brust',
  'Rücken',
  'Schultern',
  'Arme',
  'Beine',
  'Bauch',
  'Sonstige',
];

export interface Machine {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  settings: string;
  photoBlob: Blob;
  photoThumbBlob: Blob;
  createdAt: number;
  lastUsedAt: number;
}

export interface Session {
  id: string;
  machineId: string;
  date: number;
  notes: string;
}

export interface SetEntry {
  id: string;
  sessionId: string;
  machineId: string;
  weightKg: number;
  reps: number;
  setIndex: number;
  createdAt: number;
}
