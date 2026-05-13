import { useEffect, useState } from 'react';

// Refresh UI a 1 Hz quando attivo. Restituisce Date.now() corrente.
export function useTick(active: boolean, intervalMs = 1000): number {
  const [tick, setTick] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    setTick(Date.now());
    const id = setInterval(() => setTick(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [active, intervalMs]);
  return tick;
}
