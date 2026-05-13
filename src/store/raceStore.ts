import { create } from 'zustand';
import {
  bumpMinute as bumpMinuteFn,
  initialCountdownTarget,
  snapRemainingToNearestMinute,
} from '../lib/countdown';
import type { AppPhase, BoatClass } from '../types';

const LAST_MY_CLASS_KEY = 'yfc:lastMyClass';
const OPPONENTS_KEY = 'yfc:opponents';

function readJson<T>(key: string): T | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  if (typeof localStorage === 'undefined') return;
  try {
    if (value == null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

function isValidBoatClass(x: unknown): x is BoatClass {
  if (!x || typeof x !== 'object') return false;
  const o = x as Record<string, unknown>;
  return typeof o.name === 'string' && typeof o.ys === 'number' && typeof o.category === 'string';
}

function readMyClass(): BoatClass | null {
  const v = readJson<BoatClass>(LAST_MY_CLASS_KEY);
  return isValidBoatClass(v) ? v : null;
}

function readOpponents(): BoatClass[] {
  const v = readJson<BoatClass[]>(OPPONENTS_KEY);
  if (!Array.isArray(v)) return [];
  return v.filter(isValidBoatClass).sort((a, b) => a.ys - b.ys);
}

export interface RaceState {
  phase: AppPhase;
  myClass: BoatClass | null;
  opponentClasses: BoatClass[];
  countdownTargetMs: number | null;
  raceStartMs: number | null;
  finishedAtMs: number | null;
  isDemo: boolean;

  setMyClass: (c: BoatClass) => void;
  addOpponent: (c: BoatClass) => void;
  removeOpponent: (ys: number, name: string) => void;
  clearOpponents: () => void;
  goToSetup: () => void;
  goToWelcome: () => void;
  startCountdown: () => void;
  syncToNearestMinute: () => void;
  bumpMinute: (delta: 1 | -1) => void;
  // Promuove a fase race: chiamato dal componente quando il countdown raggiunge zero.
  goToRace: () => void;
  finishRace: () => void;
  reset: () => void;
  // Demo: avvia direttamente la fase race come se fossero trascorsi 30 minuti.
  startDemo: () => void;
  // Demo: aggiusta il tempo di regata corrente di ±60s (sposta raceStartMs).
  adjustDemoElapsed: (deltaSeconds: number) => void;
}

const DEMO_INITIAL_ELAPSED_MS = 30 * 60 * 1000;

export const useRaceStore = create<RaceState>((set, get) => ({
  phase: 'welcome',
  myClass: readMyClass(),
  opponentClasses: readOpponents(),
  countdownTargetMs: null,
  raceStartMs: null,
  finishedAtMs: null,
  isDemo: false,

  setMyClass: (c) => {
    writeJson(LAST_MY_CLASS_KEY, c);
    set({ myClass: c });
  },

  addOpponent: (c) => {
    const { opponentClasses } = get();
    if (opponentClasses.some((o) => o.ys === c.ys && o.name === c.name)) return;
    const next = [...opponentClasses, c].sort((a, b) => a.ys - b.ys);
    writeJson(OPPONENTS_KEY, next);
    set({ opponentClasses: next });
  },

  removeOpponent: (ys, name) => {
    const next = get().opponentClasses.filter((o) => !(o.ys === ys && o.name === name));
    writeJson(OPPONENTS_KEY, next);
    set({ opponentClasses: next });
  },

  clearOpponents: () => {
    writeJson(OPPONENTS_KEY, []);
    set({ opponentClasses: [] });
  },

  goToSetup: () => set({ phase: 'setup' }),

  goToWelcome: () => set({ phase: 'welcome' }),

  startCountdown: () => {
    if (!get().myClass) return;
    set({
      phase: 'countdown',
      countdownTargetMs: initialCountdownTarget(Date.now()),
      raceStartMs: null,
      finishedAtMs: null,
      isDemo: false,
    });
  },

  startDemo: () => {
    if (!get().myClass) return;
    // Salta countdown: parte direttamente in race come se fossero passati 30 minuti.
    set({
      phase: 'race',
      countdownTargetMs: null,
      raceStartMs: Date.now() - DEMO_INITIAL_ELAPSED_MS,
      finishedAtMs: null,
      isDemo: true,
    });
  },

  adjustDemoElapsed: (deltaSeconds) => {
    const { isDemo, raceStartMs, phase } = get();
    if (!isDemo || phase !== 'race' || raceStartMs == null) return;
    // +1 minuto elapsed = sposta raceStartMs all'indietro di 60s.
    const next = raceStartMs - deltaSeconds * 1000;
    // Evita di andare oltre il presente (elapsed negativo) o sopra ~9h.
    const now = Date.now();
    if (now - next < 1_000) return;
    if (now - next > 9 * 3600 * 1000) return;
    set({ raceStartMs: next });
  },

  syncToNearestMinute: () => {
    const target = get().countdownTargetMs;
    if (target == null) return;
    const now = Date.now();
    set({ countdownTargetMs: now + snapRemainingToNearestMinute(target - now) });
  },

  bumpMinute: (delta) => {
    const target = get().countdownTargetMs;
    if (target == null) return;
    const bumped = bumpMinuteFn(target, delta);
    if (delta === -1 && bumped - Date.now() < 1_000) return;
    set({ countdownTargetMs: bumped });
  },

  goToRace: () => {
    const { countdownTargetMs, phase } = get();
    if (phase !== 'countdown' || countdownTargetMs == null) return;
    set({ phase: 'race', raceStartMs: countdownTargetMs });
  },

  finishRace: () => {
    const { phase, raceStartMs } = get();
    if (phase !== 'race' || raceStartMs == null) return;
    set({ phase: 'finished', finishedAtMs: Date.now() });
  },

  reset: () => {
    // Mantieni mia classe e avversari (persistiti). Resetta solo lo stato di regata
    // e torna alla pagina di benvenuto.
    set({
      phase: 'welcome',
      countdownTargetMs: null,
      raceStartMs: null,
      finishedAtMs: null,
      isDemo: false,
    });
  },
}));
