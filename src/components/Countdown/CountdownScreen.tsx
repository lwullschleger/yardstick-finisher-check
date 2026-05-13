import { useEffect } from 'react';
import { useTick } from '../../hooks/useTick';
import { useVisibility } from '../../hooks/useVisibility';
import { useWakeLock } from '../../hooks/useWakeLock';
import { remainingMs } from '../../lib/countdown';
import { useRaceStore } from '../../store/raceStore';
import { SlideToConfirm } from '../shared/SlideToConfirm';
import { CountdownDisplay } from './CountdownDisplay';
import { MinuteBumper } from './MinuteBumper';
import { SyncButton } from './SyncButton';

export function CountdownScreen() {
  const target = useRaceStore((s) => s.countdownTargetMs);
  const syncToNearestMinute = useRaceStore((s) => s.syncToNearestMinute);
  const bumpMinute = useRaceStore((s) => s.bumpMinute);
  const goToRace = useRaceStore((s) => s.goToRace);
  const reset = useRaceStore((s) => s.reset);

  const visible = useVisibility();
  const now = useTick(visible);
  useWakeLock(true);

  const left = target == null ? 0 : remainingMs(target, now);

  // Auto-transizione a race quando il countdown raggiunge zero.
  useEffect(() => {
    if (target == null) return;
    if (Date.now() >= target) {
      goToRace();
    }
  }, [now, target, goToRace]);

  return (
    <div className="flex-1 flex flex-col px-5 py-6">
      <header className="text-center">
        <p className="text-sm font-semibold uppercase tracking-wider text-slate-400">
          Countdown alla partenza
        </p>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center gap-8">
        <CountdownDisplay remainingMs={left} />

        <div className="flex items-center justify-center gap-4">
          <MinuteBumper delta={-1} onBump={bumpMinute} />
          <SyncButton onSync={syncToNearestMinute} />
          <MinuteBumper delta={1} onBump={bumpMinute} />
        </div>

        <p className="text-xs text-slate-500 max-w-xs text-center leading-relaxed">
          Tocca <strong>SYNC</strong> sul colpo del comitato: il countdown si allinea al minuto
          pieno più vicino del clock di sistema.
        </p>
      </div>

      <div className="mt-6">
        <SlideToConfirm label="Slide to Reset" variant="subtle" onConfirm={reset} />
      </div>
    </div>
  );
}
