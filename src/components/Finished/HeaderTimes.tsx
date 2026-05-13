import { formatDuration } from '../../lib/time';
import type { BoatClass } from '../../types';

interface Props {
  myClass: BoatClass;
  myTimeMs: number;
  myCompMs: number;
  liveElapsedMs: number;
}

export function HeaderTimes({ myClass, myTimeMs, myCompMs, liveElapsedMs }: Props) {
  return (
    <header className="bg-slate-900 border-b border-slate-800 px-4 py-3 grid grid-cols-3 gap-3 text-center">
      <Stat
        label="Mio tempo"
        value={formatDuration(myTimeMs, { showHours: myTimeMs >= 3_600_000 })}
        accent="text-slate-100"
      />
      <Stat
        label="Mio compensato"
        value={formatDuration(myCompMs, { showHours: myCompMs >= 3_600_000 })}
        accent="text-emerald-400"
      />
      <Stat
        label="Live"
        value={formatDuration(liveElapsedMs, { showHours: liveElapsedMs >= 3_600_000 })}
        accent="text-slate-300"
      />
      <div className="col-span-3 mt-1 text-xs text-slate-500">
        Mia classe: <span className="text-slate-300 font-medium">{myClass.name}</span> ·{' '}
        <span className="tabular font-mono text-emerald-400">YS {myClass.ys}</span>
      </div>
    </header>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-[10px] uppercase tracking-wider text-slate-500">{label}</span>
      <span className={`tabular font-mono text-base font-bold ${accent}`}>{value}</span>
    </div>
  );
}
