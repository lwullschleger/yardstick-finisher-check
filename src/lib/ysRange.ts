import yardstickData from '../data/yardstick2026.json';
import type { BoatClass } from '../types';

const ALL_CLASSES = yardstickData as BoatClass[];

// Estremi del range YS calcolati dal dataset completo Yardstick 2026.
const ALL_YS = ALL_CLASSES.map((c) => c.ys);
export const MIN_YS = Math.min(...ALL_YS);
export const MAX_YS = Math.max(...ALL_YS);

// Lista continua di tutti gli interi YS nel range del dataset.
// Usata come "ruler" della schermata Finished.
export const YS_RANGE: number[] = (() => {
  const out: number[] = [];
  for (let y = MIN_YS; y <= MAX_YS; y++) out.push(y);
  return out;
})();
