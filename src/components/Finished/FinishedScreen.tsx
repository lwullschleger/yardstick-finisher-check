import { useTick } from '../../hooks/useTick';
import { useVisibility } from '../../hooks/useVisibility';
import { useWakeLock } from '../../hooks/useWakeLock';
import { compensatedTime } from '../../lib/compensated';
import { useRaceStore } from '../../store/raceStore';
import { SlideToConfirm } from '../shared/SlideToConfirm';
import { HeaderTimes } from './HeaderTimes';
import { ResultsList } from './ResultsList';

export function FinishedScreen() {
  const myClass = useRaceStore((s) => s.myClass);
  const opponents = useRaceStore((s) => s.opponentClasses);
  const raceStartMs = useRaceStore((s) => s.raceStartMs);
  const finishedAtMs = useRaceStore((s) => s.finishedAtMs);
  const reset = useRaceStore((s) => s.reset);

  const visible = useVisibility();
  const now = useTick(visible);
  useWakeLock(true);

  if (!myClass || raceStartMs == null || finishedAtMs == null) {
    return (
      <div className="flex-1 flex items-center justify-center px-6">
        <p className="text-slate-400 text-center">Stato finished non valido — reset in corso.</p>
      </div>
    );
  }

  const myTimeMs = finishedAtMs - raceStartMs;
  const myCompMs = compensatedTime(myTimeMs, myClass.ys);
  const liveElapsedMs = Math.max(myTimeMs, now - raceStartMs);

  return (
    <div className="flex-1 flex flex-col">
      <HeaderTimes
        myClass={myClass}
        myTimeMs={myTimeMs}
        myCompMs={myCompMs}
        liveElapsedMs={liveElapsedMs}
      />

      <ResultsList
        opponents={opponents}
        myTimeMs={myTimeMs}
        myYs={myClass.ys}
        nowFromStartMs={liveElapsedMs}
      />

      <div className="px-4 py-3 border-t border-slate-800 bg-slate-950/80 backdrop-blur safe-pb">
        <SlideToConfirm label="Slide to Reset" variant="danger" onConfirm={reset} />
      </div>
    </div>
  );
}
