export const FIVE_MINUTES_MS = 5 * 60 * 1000;
export const ONE_MINUTE_MS = 60 * 1000;

export function initialCountdownTarget(nowMs: number): number {
  return nowMs + FIVE_MINUTES_MS;
}

// Snap del target al minuto pieno più vicino del clock di sistema.
// Esempio: 14:37:23 → 14:37:00, 14:37:37 → 14:38:00.
export function snapToNearestMinute(targetMs: number): number {
  return Math.round(targetMs / ONE_MINUTE_MS) * ONE_MINUTE_MS;
}

// Snap di una durata residua al minuto pieno più vicino. Usata dal SYNC:
// dato remainingMs = target - now, restituisce la nuova durata che, sommata a now,
// dà un display a 0 secondi. Mai sotto un minuto.
export function snapRemainingToNearestMinute(remainingMs: number): number {
  const rounded = Math.round(remainingMs / ONE_MINUTE_MS) * ONE_MINUTE_MS;
  return rounded < ONE_MINUTE_MS ? ONE_MINUTE_MS : rounded;
}

export function bumpMinute(targetMs: number, delta: 1 | -1): number {
  return targetMs + delta * ONE_MINUTE_MS;
}

export function remainingMs(targetMs: number, nowMs: number): number {
  return Math.max(0, targetMs - nowMs);
}
