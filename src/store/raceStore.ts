import { create } from 'zustand';
import {
  bumpMinute as bumpMinuteFn,
  initialCountdownTarget,
  snapRemainingToNearestMinute,
} from '../lib/countdown';
import type { AppPhase, BoatClass } from '../types';

const LAST_MY_CLASS_KEY = 'ysf:lastMyClass';
const OPPONENTS_KEY = 'ysf:opponents';
const SESSION_KEY = 'ysf:session';
// Una sessione non-finished più vecchia di 12h al rientro viene scartata,
// per evitare che una regata dimenticata si presenti come "in corso" alla regata successiva.
const SESSION_MAX_AGE_MS = 12 * 3600 * 1000;

// Migrazione one-shot: chiavi precedenti usavano il prefisso 'yfc:'.
// Rinominate a 'ysf:' (= YS Finisher). Copia i valori vecchi se i nuovi non esistono, poi rimuove i vecchi.
function migrateLegacyKeys(): void {
  if (typeof localStorage === 'undefined') return;
  const renames: Array<[string, string]> = [
    ['yfc:lastMyClass', LAST_MY_CLASS_KEY],
    ['yfc:opponents', OPPONENTS_KEY],
    ['yfc:session', SESSION_KEY],
  ];
  for (const [oldKey, newKey] of renames) {
    try {
      const oldVal = localStorage.getItem(oldKey);
      if (oldVal == null) continue;
      if (localStorage.getItem(newKey) == null) {
        localStorage.setItem(newKey, oldVal);
      }
      localStorage.removeItem(oldKey);
    } catch {
      // ignore
    }
  }
}

migrateLegacyKeys();

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

type PersistablePhase = 'countdown' | 'race' | 'finished';

interface PersistedSession {
  phase: PersistablePhase;
  countdownTargetMs: number | null;
  raceStartMs: number | null;
  finishedAtMs: number | null;
}

function isPersistablePhase(x: unknown): x is PersistablePhase {
  return x === 'countdown' || x === 'race' || x === 'finished';
}

function isValidPersistedSession(x: unknown): x is PersistedSession {
  if (!x || typeof x !== 'object') return false;
  const o = x as Record<string, unknown>;
  const numOrNull = (v: unknown) => v === null || typeof v === 'number';
  return (
    isPersistablePhase(o.phase) &&
    numOrNull(o.countdownTargetMs) &&
    numOrNull(o.raceStartMs) &&
    numOrNull(o.finishedAtMs)
  );
}

function readSession(): PersistedSession | null {
  const v = readJson<PersistedSession>(SESSION_KEY);
  if (!isValidPersistedSession(v)) return null;
  if (v.phase !== 'finished') {
    const refMs = v.raceStartMs ?? v.countdownTargetMs;
    if (refMs != null && Date.now() - refMs > SESSION_MAX_AGE_MS) {
      writeJson(SESSION_KEY, null);
      return null;
    }
  }
  return v;
}

function writeSession(s: PersistedSession): void {
  writeJson(SESSION_KEY, s);
}

function clearSession(): void {
  writeJson(SESSION_KEY, null);
}

export interface RaceState {
  phase: AppPhase;
  myClass: BoatClass | null;
  opponentClasses: BoatClass[];
  countdownTargetMs: number | null;
  raceStartMs: number | null;
  finishedAtMs: number | null;
  isDemo: boolean;
  // Fase da cui è stata aperta la pagina Help, per tornare indietro al posto giusto.
  helpReturnPhase: AppPhase | null;

  setMyClass: (c: BoatClass) => void;
  addOpponent: (c: BoatClass) => void;
  removeOpponent: (ys: number, name: string) => void;
  clearOpponents: () => void;
  goToSetup: () => void;
  goToHelp: () => void;
  exitHelp: () => void;
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

const initialMyClass = readMyClass();
// Una sessione persistita ha senso solo se la classe è ancora configurata.
const initialSession = initialMyClass ? readSession() : null;

export const useRaceStore = create<RaceState>((set, get) => ({
  phase: initialSession?.phase ?? 'welcome',
  myClass: initialMyClass,
  opponentClasses: readOpponents(),
  countdownTargetMs: initialSession?.countdownTargetMs ?? null,
  raceStartMs: initialSession?.raceStartMs ?? null,
  finishedAtMs: initialSession?.finishedAtMs ?? null,
  isDemo: false,
  helpReturnPhase: null,

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

  goToHelp: () => {
    const { phase } = get();
    // Non sovrascrivere helpReturnPhase se già in 'help' (no-op difensivo).
    if (phase === 'help') return;
    set({ phase: 'help', helpReturnPhase: phase });
  },

  exitHelp: () => {
    const { helpReturnPhase } = get();
    set({ phase: helpReturnPhase ?? 'welcome', helpReturnPhase: null });
  },

  goToWelcome: () => set({ phase: 'welcome' }),

  startCountdown: () => {
    if (!get().myClass) return;
    const countdownTargetMs = initialCountdownTarget(Date.now());
    set({
      phase: 'countdown',
      countdownTargetMs,
      raceStartMs: null,
      finishedAtMs: null,
      isDemo: false,
    });
    writeSession({
      phase: 'countdown',
      countdownTargetMs,
      raceStartMs: null,
      finishedAtMs: null,
    });
  },

  startDemo: () => {
    if (!get().myClass) return;
    // Demo non viene mai persistita: azzera eventuale sessione precedente.
    clearSession();
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
    const state = get();
    const target = state.countdownTargetMs;
    if (target == null) return;
    const now = Date.now();
    const newTarget = now + snapRemainingToNearestMinute(target - now);
    set({ countdownTargetMs: newTarget });
    if (!state.isDemo && state.phase === 'countdown') {
      writeSession({
        phase: 'countdown',
        countdownTargetMs: newTarget,
        raceStartMs: null,
        finishedAtMs: null,
      });
    }
  },

  bumpMinute: (delta) => {
    const state = get();
    const target = state.countdownTargetMs;
    if (target == null) return;
    const bumped = bumpMinuteFn(target, delta);
    if (delta === -1 && bumped - Date.now() < 1_000) return;
    set({ countdownTargetMs: bumped });
    if (!state.isDemo && state.phase === 'countdown') {
      writeSession({
        phase: 'countdown',
        countdownTargetMs: bumped,
        raceStartMs: null,
        finishedAtMs: null,
      });
    }
  },

  goToRace: () => {
    const { countdownTargetMs, phase, isDemo } = get();
    if (phase !== 'countdown' || countdownTargetMs == null) return;
    set({ phase: 'race', raceStartMs: countdownTargetMs });
    if (!isDemo) {
      writeSession({
        phase: 'race',
        countdownTargetMs: null,
        raceStartMs: countdownTargetMs,
        finishedAtMs: null,
      });
    }
  },

  finishRace: () => {
    const { phase, raceStartMs, isDemo } = get();
    if (phase !== 'race' || raceStartMs == null) return;
    const finishedAtMs = Date.now();
    set({ phase: 'finished', finishedAtMs });
    if (!isDemo) {
      writeSession({
        phase: 'finished',
        countdownTargetMs: null,
        raceStartMs,
        finishedAtMs,
      });
    }
  },

  reset: () => {
    // Mantieni mia classe e avversari (persistiti). Resetta solo lo stato di regata
    // e torna alla pagina di benvenuto, cancellando la sessione persistita.
    clearSession();
    set({
      phase: 'welcome',
      countdownTargetMs: null,
      raceStartMs: null,
      finishedAtMs: null,
      isDemo: false,
    });
  },
}));
