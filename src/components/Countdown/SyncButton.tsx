interface Props {
  onSync: () => void;
}

export function SyncButton({ onSync }: Props) {
  return (
    <button
      type="button"
      onClick={onSync}
      className="h-16 w-32 rounded-full bg-emerald-600 text-white font-bold text-lg shadow-lg shadow-emerald-900/40 active:scale-95 transition-transform"
    >
      SYNC
    </button>
  );
}
