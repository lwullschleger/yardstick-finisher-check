import { forwardRef, memo } from 'react';
import type { RowStatus } from '../../lib/compensated';
import type { BoatClass } from '../../types';

interface Props {
  boat: BoatClass;
  status: RowStatus;
  secondsToTransition: number | null;
}

export const ClassRow = memo(
  forwardRef<HTMLLIElement, Props>(({ boat, status, secondsToTransition }, ref) => {
    const isRed = status === 'red';
    return (
      <li
        ref={ref}
        data-status={status}
        className={`flex items-center justify-between px-4 py-4 transition-colors duration-300 ${
          isRed ? 'bg-red-600/85 text-white' : 'bg-emerald-600/85 text-white'
        }`}
      >
        <div className="flex items-center gap-4 min-w-0">
          <span className="tabular text-2xl font-mono font-bold w-[3.5ch] text-right shrink-0">
            {boat.ys}
          </span>
          <span className="font-medium truncate">{boat.name}</span>
        </div>
        <div className="ml-3 shrink-0 text-right">
          {isRed ? (
            <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase tracking-wider opacity-80">Verde tra</span>
              <span className="tabular font-mono font-semibold">
                {secondsToTransition != null ? `${secondsToTransition}s` : '—'}
              </span>
            </div>
          ) : (
            <span className="text-sm font-semibold">✓ Battuta</span>
          )}
        </div>
      </li>
    );
  }),
);

ClassRow.displayName = 'ClassRow';
