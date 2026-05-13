import { useMemo, useState } from 'react';
import { useRaceStore } from '../../store/raceStore';
import type { BoatClass } from '../../types';
import { ClassPicker } from './ClassPicker';
import { OpponentsList } from './OpponentsList';

type PickerMode = 'myClass' | 'opponent' | null;

export function SetupScreen() {
  const myClass = useRaceStore((s) => s.myClass);
  const opponents = useRaceStore((s) => s.opponentClasses);
  const setMyClass = useRaceStore((s) => s.setMyClass);
  const addOpponent = useRaceStore((s) => s.addOpponent);
  const removeOpponent = useRaceStore((s) => s.removeOpponent);
  const clearOpponents = useRaceStore((s) => s.clearOpponents);
  const startCountdown = useRaceStore((s) => s.startCountdown);

  const [picker, setPicker] = useState<PickerMode>(null);

  const excludeKeys = useMemo(() => {
    const set = new Set<string>();
    for (const o of opponents) set.add(`${o.ys}::${o.name}`);
    if (myClass) set.add(`${myClass.ys}::${myClass.name}`);
    return set;
  }, [opponents, myClass]);

  const handlePick = (c: BoatClass) => {
    if (picker === 'myClass') setMyClass(c);
    else if (picker === 'opponent') addOpponent(c);
    setPicker(null);
  };

  return (
    <>
      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-8">
        <header>
          <h1 className="text-2xl font-bold text-slate-100">Yardstick Finisher Check</h1>
          <p className="text-sm text-slate-400 mt-1">
            Setup regata: scegli la tua classe e le classi avversarie presenti.
          </p>
        </header>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
            La mia classe
          </h3>

          {myClass ? (
            <div className="flex items-center justify-between bg-emerald-950/40 border border-emerald-700/60 rounded-xl p-4">
              <div className="flex flex-col">
                <span className="text-xs text-emerald-300 uppercase tracking-wider">
                  {myClass.category}
                </span>
                <span className="text-xl font-semibold text-slate-100">{myClass.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="tabular text-3xl font-mono font-bold text-emerald-400">
                  {myClass.ys}
                </span>
                <button
                  type="button"
                  onClick={() => setPicker('myClass')}
                  className="text-xs font-medium px-3 h-9 rounded-full bg-slate-800 text-slate-200"
                >
                  Cambia
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setPicker('myClass')}
              className="w-full h-16 rounded-xl border-2 border-dashed border-emerald-600/60 text-emerald-400 font-semibold"
            >
              Seleziona la tua classe
            </button>
          )}
        </section>

        <OpponentsList
          opponents={opponents}
          onRemove={(c) => removeOpponent(c.ys, c.name)}
          onAdd={() => setPicker('opponent')}
          onClear={clearOpponents}
        />
      </div>

      <div className="sticky bottom-0 border-t border-slate-800 bg-slate-950/80 backdrop-blur px-5 py-4 safe-pb">
        <button
          type="button"
          disabled={!myClass}
          onClick={startCountdown}
          className="w-full h-14 rounded-xl font-semibold text-lg bg-emerald-600 text-white disabled:bg-slate-800 disabled:text-slate-500"
        >
          Avvia countdown 5'
        </button>
      </div>

      {picker && (
        <ClassPicker
          title={picker === 'myClass' ? 'Seleziona la tua classe' : 'Aggiungi avversario'}
          excludeKeys={picker === 'opponent' ? excludeKeys : undefined}
          onPick={handlePick}
          onClose={() => setPicker(null)}
        />
      )}
    </>
  );
}
