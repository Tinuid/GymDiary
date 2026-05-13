import { create } from 'zustand';
import type { Machine } from '../types';
import { listMachines } from '../db/machines';
import { getMachineIdsUsedToday } from '../db/sessions';
import { getMeta, setMeta } from '../db/meta';

const META_REST_TIMER = 'restTimerSeconds';
const META_HIDE_USED_TODAY = 'hideUsedToday';
const DEFAULT_REST_TIMER_SECONDS = 90;

interface RestTimerState {
  endsAt: number;
  total: number;
}

interface AppState {
  machines: Machine[];
  loaded: boolean;
  restTimerSeconds: number;
  hideUsedToday: boolean;
  machineIdsUsedToday: Set<string>;
  timer: RestTimerState | null;
  init: () => Promise<void>;
  refreshMachines: () => Promise<void>;
  refreshUsedToday: () => Promise<void>;
  setRestTimerSeconds: (s: number) => Promise<void>;
  setHideUsedToday: (v: boolean) => Promise<void>;
  startRestTimer: () => void;
  cancelRestTimer: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  machines: [],
  loaded: false,
  restTimerSeconds: DEFAULT_REST_TIMER_SECONDS,
  hideUsedToday: false,
  machineIdsUsedToday: new Set(),
  timer: null,

  init: async () => {
    const [list, used, rest, hide] = await Promise.all([
      listMachines(),
      getMachineIdsUsedToday(),
      getMeta<number>(META_REST_TIMER, DEFAULT_REST_TIMER_SECONDS),
      getMeta<boolean>(META_HIDE_USED_TODAY, false),
    ]);
    set({
      machines: list,
      machineIdsUsedToday: used,
      restTimerSeconds: rest,
      hideUsedToday: hide,
      loaded: true,
    });
  },

  refreshMachines: async () => {
    const list = await listMachines();
    set({ machines: list, loaded: true });
  },

  refreshUsedToday: async () => {
    const used = await getMachineIdsUsedToday();
    set({ machineIdsUsedToday: used });
  },

  setRestTimerSeconds: async (s) => {
    const clamped = Math.max(5, Math.min(600, Math.round(s)));
    await setMeta(META_REST_TIMER, clamped);
    set({ restTimerSeconds: clamped });
  },

  setHideUsedToday: async (v) => {
    await setMeta(META_HIDE_USED_TODAY, v);
    set({ hideUsedToday: v });
  },

  startRestTimer: () => {
    const seconds = get().restTimerSeconds;
    set({ timer: { endsAt: Date.now() + seconds * 1000, total: seconds } });
  },

  cancelRestTimer: () => {
    set({ timer: null });
  },
}));
