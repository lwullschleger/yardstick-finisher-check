import { useTick } from '../../hooks/useTick';
import { useVisibility } from '../../hooks/useVisibility';
import { formatDuration } from '../../lib/time';
import { useRaceStore } from '../../store/raceStore';
import { SlideToConfirm } from '../shared/SlideToConfirm';
import { FinishedSlider } from './FinishedSlider';

export function RaceScreen() {
  const raceStartMs = useRaceStore((s) => s.raceStartMs);
  const isDemo = useRaceStore((s) => s.isDemo);
  const finishRace = useRaceStore((s) => s.finishRace);
  const adjustDemoElapsed = useRaceStore((s) => s.adjustDemoElapsed);
  const reset = useRaceStore((s) => s.reset);

  const visible = useVisibility();
  const now = useTick(visible);

  const elapsed = raceStartMs == null ? 0 : Math.max(0, now - raceStartMs);

  return (
    <div className="flex-1 flex flex-col px-5 py-6 bg-slate-950">
      <header className="space-y-3">
        <div className="text-center">
          {isDemo ? (
            <p className="inline-block text-xs font-bold uppercase tracking-[0.3em] bg-amber-400 text-slate-900 px-3 py-1 rounded-full">
              Demo
            </p>
          ) : (
            <p className="text-sm font-semibold uppercase tracking-wider text-slate-400">
              In regata
            </p>
          )}
        </div>
        <SlideToConfirm label="Slide to Reset" variant="subtle" onConfirm={reset} />
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

        {isDemo && (
          <div className="mt-8 flex items-center gap-3">
            <button
              type="button"
              onClick={() => adjustDemoElapsed(-60)}
              className="h-14 px-5 rounded-full bg-slate-800 text-slate-100 font-semibold border border-slate-700"
            >
              −1 min
            </button>
            <button
              type="button"
              onClick={() => adjustDemoElapsed(60)}
              className="h-14 px-5 rounded-full bg-slate-800 text-slate-100 font-semibold border border-slate-700"
            >
              +1 min
            </button>
          </div>
        )}
      </div>

      <div>
        <FinishedSlider onFinish={finishRace} />
      </div>
    </div>
  );
}
