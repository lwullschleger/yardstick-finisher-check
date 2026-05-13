import { useEffect, useMemo, useRef, useState } from 'react';
import yardstickData from '../../data/yardstick2026.json';
import { BOAT_CATEGORIES, type BoatCategory, type BoatClass } from '../../types';

const ALL_CLASSES = yardstickData as BoatClass[];

interface Props {
  title: string;
  excludeKeys?: Set<string>; // chiavi `${ys}::${name}` da escludere
  onPick: (c: BoatClass) => void;
  onClose: () => void;
}

function classKey(c: BoatClass): string {
  return `${c.ys}::${c.name}`;
}

export function ClassPicker({ title, excludeKeys, onPick, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<BoatCategory | 'all'>('all');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ALL_CLASSES.filter((c) => {
      if (category !== 'all' && c.category !== category) return false;
      if (q && !c.name.toLowerCase().includes(q)) return false;
      if (excludeKeys?.has(classKey(c))) return false;
      return true;
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [query, category, excludeKeys]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur flex flex-col safe-pt safe-pb">
      <div className="flex items-center gap-3 p-4 border-b border-slate-800">
        <button
          type="button"
          onClick={onClose}
          aria-label="Chiudi"
          className="h-10 w-10 flex items-center justify-center rounded-full bg-slate-800 text-slate-200"
        >
          ✕
        </button>
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>

      <div className="p-4 space-y-3 border-b border-slate-800">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cerca classe…"
          className="w-full h-12 px-4 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <div className="flex flex-wrap gap-2">
          <CategoryChip
            label="Tutte"
            active={category === 'all'}
            onClick={() => setCategory('all')}
          />
          {BOAT_CATEGORIES.map((cat) => (
            <CategoryChip
              key={cat}
              label={cat}
              active={category === cat}
              onClick={() => setCategory(cat)}
            />
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="p-6 text-slate-400 text-center">Nessuna classe corrisponde alla ricerca.</p>
        ) : (
          <ul className="divide-y divide-slate-800">
            {filtered.map((c) => (
              <li key={classKey(c)}>
                <button
                  type="button"
                  onClick={() => onPick(c)}
                  className="w-full flex items-center justify-between px-4 py-4 text-left hover:bg-slate-900 active:bg-slate-800"
                >
                  <div className="flex flex-col">
                    <span className="font-medium text-slate-100">{c.name}</span>
                    <span className="text-xs text-slate-400">{c.category}</span>
                  </div>
                  <span className="tabular text-2xl font-mono font-semibold text-emerald-400">
                    {c.ys}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function CategoryChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 h-9 rounded-full text-sm font-medium border ${
        active
          ? 'bg-emerald-600 border-emerald-500 text-white'
          : 'bg-slate-900 border-slate-700 text-slate-300'
      }`}
    >
      {label}
    </button>
  );
}
