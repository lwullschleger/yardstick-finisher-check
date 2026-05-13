import type { BoatClass } from '../../types';

interface Props {
  opponents: BoatClass[];
  onRemove: (c: BoatClass) => void;
  onAdd: () => void;
  onClear: () => void;
}

export function OpponentsList({ opponents, onRemove, onAdd, onClear }: Props) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
          Avversari (classi presenti)
        </h3>
        {opponents.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs text-slate-400 hover:text-red-400 underline-offset-2 hover:underline"
          >
            Svuota
          </button>
        )}
      </div>

      {opponents.length === 0 ? (
        <p className="text-slate-500 text-sm italic">
          Nessuna classe avversaria. Aggiungine almeno una per vedere la vista rosso/verde.
        </p>
      ) : (
        <ul className="space-y-2">
          {opponents.map((c) => (
            <li
              key={`${c.ys}::${c.name}`}
              className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-lg px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <span className="tabular text-xl font-mono font-semibold text-emerald-400 min-w-[3ch] text-right">
                  {c.ys}
                </span>
                <div className="flex flex-col">
                  <span className="font-medium text-slate-100">{c.name}</span>
                  <span className="text-xs text-slate-500">{c.category}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onRemove(c)}
                aria-label={`Rimuovi ${c.name}`}
                className="h-10 w-10 flex items-center justify-center rounded-full text-slate-400 hover:text-red-400 hover:bg-slate-800"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={onAdd}
        className="w-full h-12 rounded-lg border-2 border-dashed border-slate-700 text-slate-300 hover:border-emerald-600 hover:text-emerald-400"
      >
        + Aggiungi classe avversaria
      </button>
    </section>
  );
}
