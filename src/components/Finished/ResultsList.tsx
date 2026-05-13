import { useEffect, useMemo, useRef } from 'react';
import { compensatedTime, rowStatus, secondsToTransition } from '../../lib/compensated';
import { YS_RANGE } from '../../lib/ysRange';
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
  const lastFrontierRef = useRef<number | null>(null);

  // Mappa YS → nomi delle classi selezionate con quel YS.
  const namesByYs = useMemo(() => {
    const m = new Map<number, string[]>();
    for (const o of opponents) {
      const arr = m.get(o.ys) ?? [];
      arr.push(o.name);
      m.set(o.ys, arr);
    }
    return m;
  }, [opponents]);

  const rows = useMemo(
    () =>
      YS_RANGE.map((ys) => {
        const status = rowStatus(nowFromStartMs, myCompMs, ys);
        const secs =
          status === 'red' ? secondsToTransition(nowFromStartMs, myTimeMs, myYs, ys) : null;
        return {
          ys,
          names: namesByYs.get(ys) ?? [],
          status,
          secs,
          isMine: ys === myYs,
        };
      }),
    [namesByYs, nowFromStartMs, myCompMs, myTimeMs, myYs],
  );

  // Lista ordinata YS ascendente → top = veloci (verdi), bottom = lente (rosse).
  // La frontiera è la prima riga rossa partendo dall'alto, e si sposta verso il basso
  // (verso YS maggiori) man mano che T_now cresce.
  const frontierIndex = useMemo(() => rows.findIndex((r) => r.status === 'red'), [rows]);

  useEffect(() => {
    const list = containerRef.current;
    if (!list) return;
    if (frontierIndex < 0) {
      lastFrontierRef.current = null;
      return;
    }
    const frontierYs = rows[frontierIndex]?.ys ?? null;
    if (lastFrontierRef.current === frontierYs) return;
    lastFrontierRef.current = frontierYs;
    const child = list.children[frontierIndex] as HTMLElement | undefined;
    child?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [frontierIndex, rows]);

  return (
    <ul
      ref={containerRef}
      className="flex-1 overflow-y-auto divide-y divide-slate-950/30"
      aria-label="Stato per ogni Yardstick"
    >
      {rows.map(({ ys, names, status, secs, isMine }) => (
        <ClassRow
          key={ys}
          ys={ys}
          names={names}
          status={status}
          secondsToTransition={secs}
          isMine={isMine}
        />
      ))}
    </ul>
  );
}
