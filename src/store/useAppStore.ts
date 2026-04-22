import { create } from 'zustand';
import type { Machine } from '../types';
import { listMachines } from '../db/machines';

interface AppState {
  machines: Machine[];
  loaded: boolean;
  refreshMachines: () => Promise<void>;
}

export const useAppStore = create<AppState>((set) => ({
  machines: [],
  loaded: false,
  refreshMachines: async () => {
    const list = await listMachines();
    set({ machines: list, loaded: true });
  },
}));
