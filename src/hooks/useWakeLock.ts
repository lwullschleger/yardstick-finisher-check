import { useEffect } from 'react';

interface WakeLockSentinelLike {
  release: () => Promise<void>;
}

export function useWakeLock(enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return;
    if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) return;

    let lock: WakeLockSentinelLike | null = null;
    let cancelled = false;

    const acquire = async () => {
      try {
        const sentinel = await (navigator as any).wakeLock.request('screen');
        if (cancelled) {
          sentinel.release().catch(() => {});
          return;
        }
        lock = sentinel;
      } catch {
        // utente ha negato o la pagina non è visibile
      }
    };

    acquire();

    const onVisibility = () => {
      if (document.visibilityState === 'visible' && !lock) acquire();
    };

    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibility);
      lock?.release().catch(() => {});
      lock = null;
    };
  }, [enabled]);
}
