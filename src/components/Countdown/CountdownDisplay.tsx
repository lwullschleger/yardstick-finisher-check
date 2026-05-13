import { formatDuration } from '../../lib/time';

interface Props {
  remainingMs: number;
}

export function CountdownDisplay({ remainingMs }: Props) {
  const text = formatDuration(remainingMs);
  return (
    <div className="flex flex-col items-center">
      <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Partenza tra</p>
      <p
        className="tabular font-mono font-bold text-slate-50 leading-none mt-3"
        style={{ fontSize: 'min(28vw, 7rem)' }}
      >
        {text}
      </p>
    </div>
  );
}
