import { create } from 'zustand';
import {
  ONE_MINUTE_MS,
  bumpMinute as bumpMinuteFn,
  initialCountdownTarget,
  snapToNearestMinute,
} from '../lib/countdown';
import type { AppPhase, BoatClass } from '../types';

const LAST_MY_CLASS_KEY = 'yfc:lastMyClass';

function readLastMyClass(): BoatClass | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(LAST_MY_CLASS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as BoatClass;
  } catch {
    return null;
  }
}

function writeLastMyClass(c: BoatClass | null): void {
  if (typeof localStorage === 'undefined') return;
  try {
    if (c) {
      localStorage.setItem(LAST_MY_CLASS_KEY, JSON.stringify(c));
    } else {
      localStorage.removeItem(LAST_MY_CLASS_KEY);
    }
  } catch {
    // ignore
  }
}

export interface RaceState {
  phase: AppPhase;
  myClass: BoatClass | null;
  opponentClasses: BoatClass[];
  countdownTargetMs: number | null;
  raceStartMs: number | null;
  finishedAtMs: number | null;

  setMyClass: (c: BoatClass) => void;
  addOpponent: (c: BoatClass) => void;
  removeOpponent: (ys: number, name: string) => void;
  startCountdown: () => void;
  syncToNearestMinute: () => void;
  bumpMinute: (delta: 1 | -1) => void;
  // Promuove a fase race: chiamato dal componente quando il countdown raggiunge zero.
  goToRace: () => void;
  finishRace: () => void;
  reset: () => void;
}

export const useRaceStore = create<RaceState>((set, get) => ({
  phase: 'setup',
  myClass: readLastMyClass(),
  opponentClasses: [],
  countdownTargetMs: null,
  raceStartMs: null,
  finishedAtMs: null,

  setMyClass: (c) => {
    writeLastMyClass(c);
    set({ myClass: c });
  },

  addOpponent: (c) => {
    const { opponentClasses } = get();
    // Unicità per (ys, name)
    if (opponentClasses.some((o) => o.ys === c.ys && o.name === c.name)) return;
    const next = [...opponentClasses, c].sort((a, b) => a.ys - b.ys);
    set({ opponentClasses: next });
  },

  removeOpponent: (ys, name) => {
    set({
      opponentClasses: get().opponentClasses.filter((o) => !(o.ys === ys && o.name === name)),
    });
  },

  startCountdown: () => {
    if (!get().myClass) return;
    set({
      phase: 'countdown',
      countdownTargetMs: initialCountdownTarget(Date.now()),
      raceStartMs: null,
      finishedAtMs: null,
    });
  },

  syncToNearestMinute: () => {
    const target = get().countdownTargetMs;
    if (target == null) return;
    // Lo snap è riferito al clock di sistema (timestamp assoluti),
    // ma garantiamo almeno 1 secondo nel futuro per evitare GO immediato indesiderato.
    let snapped = snapToNearestMinute(target);
    if (snapped - Date.now() < 1_000) snapped += ONE_MINUTE_MS;
    set({ countdownTargetMs: snapped });
  },

  bumpMinute: (delta) => {
    const target = get().countdownTargetMs;
    if (target == null) return;
    const bumped = bumpMinuteFn(target, delta);
    // Non permettere bumper -1 sotto il now corrente.
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
    const keep = get().myClass;
    set({
      phase: 'setup',
      myClass: keep,
      opponentClasses: [],
      countdownTargetMs: null,
      raceStartMs: null,
      finishedAtMs: null,
    });
  },
}));
