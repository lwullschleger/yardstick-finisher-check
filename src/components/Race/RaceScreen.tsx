import { useTick } from '../../hooks/useTick';
import { useVisibility } from '../../hooks/useVisibility';
import { formatDuration } from '../../lib/time';
import { useRaceStore } from '../../store/raceStore';
import { SlideToConfirm } from '../shared/SlideToConfirm';
import { FinishedSlider } from './FinishedSlider';

export function RaceScreen() {
  const raceStartMs = useRaceStore((s) => s.raceStartMs);
  const finishRace = useRaceStore((s) => s.finishRace);
  const reset = useRaceStore((s) => s.reset);

  const visible = useVisibility();
  const now = useTick(visible);

  const elapsed = raceStartMs == null ? 0 : Math.max(0, now - raceStartMs);

  return (
    <div className="flex-1 flex flex-col px-5 py-6 bg-slate-950">
      <header className="text-center">
        <p className="text-sm font-semibold uppercase tracking-wider text-slate-400">In regata</p>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center">
        <p
          className="tabular font-mono font-bold text-slate-50 leading-none"
          style={{ fontSize: 'min(24vw, 6.5rem)' }}
        >
          {formatDuration(elapsed, { showHours: elapsed >= 3_600_000 })}
        </p>
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500 mt-4">
          Tempo dalla partenza
        </p>
      </div>

      <div className="space-y-3">
        <FinishedSlider onFinish={finishRace} />
        <SlideToConfirm label="Slide to Reset" variant="subtle" onConfirm={reset} />
      </div>
    </div>
  );
}
