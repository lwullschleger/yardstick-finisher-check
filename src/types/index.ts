export type BoatCategory =
  | 'Jollen'
  | 'Jollenkreuzer'
  | 'Libera'
  | 'Mehrrumpfboote'
  | 'Yachten';

export interface BoatClass {
  name: string;
  ys: number;
  category: BoatCategory;
}

export type AppPhase = 'welcome' | 'setup' | 'help' | 'countdown' | 'race' | 'finished';

export const BOAT_CATEGORIES: BoatCategory[] = [
  'Jollen',
  'Jollenkreuzer',
  'Libera',
  'Mehrrumpfboote',
  'Yachten',
];
