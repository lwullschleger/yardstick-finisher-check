import { formatDuration } from '../../lib/time';

interface Props {
  myTimeMs: number;
  myCompMs: number;
  liveElapsedMs: number;
}

export function HeaderTimes({ myTimeMs, myCompMs, liveElapsedMs }: Props) {
  const deltaMs = Math.max(0, liveElapsedMs - myTimeMs);
  const showHoursAny =
    myTimeMs >= 3_600_000 || myCompMs >= 3_600_000 || liveElapsedMs >= 3_600_000;
  return (
    <header className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex justify-center">
      <div className="grid grid-cols-[auto_auto_auto_auto] gap-x-2 gap-y-1 items-baseline text-base">
        <Label>Reale:</Label>
        <Value accent="text-slate-100">
          {formatDuration(myTimeMs, { showHours: showHoursAny })}
        </Value>
        <Label className="pl-6">Compensato:</Label>
        <Value accent="text-emerald-400">
          {formatDuration(myCompMs, { showHours: showHoursAny })}
        </Value>

        <Label>Live:</Label>
        <Value accent="text-slate-300">
          {formatDuration(liveElapsedMs, { showHours: showHoursAny })}
        </Value>
        <Label className="pl-6">Δ:</Label>
        <Value accent="text-slate-300">
          +{formatDuration(deltaMs, { showHours: showHoursAny })}
        </Value>
      </div>
    </header>
  );
}

function Label({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <span className={`text-slate-500 text-right ${className}`}>{children}</span>;
}

function Value({ children, accent }: { children: React.ReactNode; accent: string }) {
  return (
    <span className={`tabular font-mono font-bold text-2xl text-left ${accent}`}>{children}</span>
  );
}
