import { forwardRef, memo } from 'react';
import type { RowStatus } from '../../lib/compensated';

interface Props {
  ys: number;
  names: string[];          // classi selezionate con questo YS (può essere vuoto)
  status: RowStatus;
  secondsToTransition: number | null;
  isMine: boolean;          // YS coincide con la mia classe
}

export const ClassRow = memo(
  forwardRef<HTMLLIElement, Props>(({ ys, names, status, secondsToTransition, isMine }, ref) => {
    const isRed = status === 'red';
    const hasSelection = names.length > 0;

    const bgClass = isRed
      ? hasSelection || isMine
        ? 'bg-red-600 text-white'
        : 'bg-red-950/60 text-red-200/80'
      : hasSelection || isMine
        ? 'bg-emerald-600 text-white'
        : 'bg-emerald-950/60 text-emerald-200/80';

    return (
      <li
        ref={ref}
        data-status={status}
        data-mine={isMine ? 'true' : undefined}
        className={`flex items-center justify-between px-4 py-3 transition-colors duration-300 ${bgClass}`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="tabular text-xl font-mono font-bold w-[3.5ch] text-right shrink-0">
            {ys}
          </span>
          {isMine && (
            <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-400 text-slate-900 rounded px-1.5 py-0.5 shrink-0">
              io
            </span>
          )}
          <span
            className={`truncate ${hasSelection ? 'font-medium' : 'opacity-60 italic text-xs'}`}
          >
            {hasSelection ? names.join(' · ') : '—'}
          </span>
        </div>
        <div className="ml-3 shrink-0 text-right">
          {isRed ? (
            <span className="tabular font-mono font-semibold text-sm">
              {secondsToTransition != null ? `${secondsToTransition}s` : '—'}
            </span>
          ) : (
            <span className="text-sm font-semibold">✓</span>
          )}
        </div>
      </li>
    );
  }),
);

ClassRow.displayName = 'ClassRow';
