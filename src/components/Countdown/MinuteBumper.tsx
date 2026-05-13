interface Props {
  delta: 1 | -1;
  onBump: (delta: 1 | -1) => void;
}

export function MinuteBumper({ delta, onBump }: Props) {
  const label = delta > 0 ? '+1 min' : '−1 min';
  return (
    <button
      type="button"
      onClick={() => onBump(delta)}
      className="h-14 px-5 rounded-full bg-slate-800 text-slate-100 font-semibold border border-slate-700"
    >
      {label}
    </button>
  );
}
