import { useEffect, useMemo, useRef } from 'react';
import { compensatedTime, rowStatus, secondsToTransition } from '../../lib/compensated';
import type { BoatClass } from '../../types';
import { ClassRow } from './ClassRow';

interface Props {
  opponents: BoatClass[];
  myTimeMs: number;
  myYs: number;
  nowFromStartMs: number;
}

export function ResultsList({ opponents, myTimeMs, myYs, nowFromStartMs }: Props) {
  const myCompMs = useMemo(() => compensatedTime(myTimeMs, myYs), [myTimeMs, myYs]);
  const containerRef = useRef<HTMLUListElement>(null);
  const lastFrontierRef = useRef<string | null>(null);

  const rows = useMemo(
    () =>
      opponents
        .slice()
        .sort((a, b) => a.ys - b.ys)
        .map((boat) => {
          const status = rowStatus(nowFromStartMs, myCompMs, boat.ys);
          const secs =
            status === 'red'
              ? secondsToTransition(nowFromStartMs, myTimeMs, myYs, boat.ys)
              : null;
          return { boat, status, secs };
        }),
    [opponents, nowFromStartMs, myCompMs, myTimeMs, myYs],
  );

  // Identifica la frontiera (prima riga rossa partendo dall'alto, lista ordinata YS↑).
  const frontierIndex = useMemo(() => rows.findIndex((r) => r.status === 'red'), [rows]);

  // Auto-scroll: centra la frontiera quando si sposta.
  useEffect(() => {
    const list = containerRef.current;
    if (!list) return;
    const frontierKey = frontierIndex >= 0 ? `${rows[frontierIndex]?.boat.ys}` : 'none';
    if (lastFrontierRef.current === frontierKey) return;
    lastFrontierRef.current = frontierKey;
    if (frontierIndex < 0) return;
    const child = list.children[frontierIndex] as HTMLElement | undefined;
    child?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [frontierIndex, rows]);

  if (opponents.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center px-6 py-10">
        <p className="text-slate-400 text-center text-sm">
          Nessun avversario inserito. Torna a setup per aggiungere classi avversarie.
        </p>
      </div>
    );
  }

  return (
    <ul
      ref={containerRef}
      className="flex-1 overflow-y-auto divide-y divide-slate-950/30"
      aria-label="Stato classi avversarie"
    >
      {rows.map(({ boat, status, secs }) => (
        <ClassRow
          key={`${boat.ys}::${boat.name}`}
          boat={boat}
          status={status}
          secondsToTransition={secs}
        />
      ))}
    </ul>
  );
}
