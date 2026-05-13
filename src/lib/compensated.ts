// Tempo compensato in millisecondi: T_comp = T_reale × 100 / YS
export function compensatedTime(realTimeMs: number, ys: number): number {
  return (realTimeMs * 100) / ys;
}

export type RowStatus = 'red' | 'green';

// Una classe avversaria è verde quando il suo compensato ipotetico al T_now
// è già >= del mio compensato (ho vinto rispetto a quella classe).
export function rowStatus(nowMs: number, myCompMs: number, opponentYs: number): RowStatus {
  const hypotheticalComp = compensatedTime(nowMs, opponentYs);
  return hypotheticalComp >= myCompMs ? 'green' : 'red';
}

// Secondi residui prima del transition rosso → verde.
// Restituisce null se la riga è già verde (transition nel passato o coincidente).
export function secondsToTransition(
  nowMs: number,
  myTimeMs: number,
  myYs: number,
  opponentYs: number,
): number | null {
  const transitionAtMs = (myTimeMs * opponentYs) / myYs;
  const remainingMs = transitionAtMs - nowMs;
  if (remainingMs <= 0) return null;
  return Math.ceil(remainingMs / 1000);
}
