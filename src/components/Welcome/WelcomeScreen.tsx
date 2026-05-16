import { useEffect } from 'react';
import { useRaceStore } from '../../store/raceStore';

export function WelcomeScreen() {
  const myClass = useRaceStore((s) => s.myClass);
  const opponents = useRaceStore((s) => s.opponentClasses);
  const startCountdown = useRaceStore((s) => s.startCountdown);
  const startDemo = useRaceStore((s) => s.startDemo);
  const goToSetup = useRaceStore((s) => s.goToSetup);
  const goToHelp = useRaceStore((s) => s.goToHelp);

  // Setup non fatto: forza l'utente sulla pagina di setup.
  useEffect(() => {
    if (!myClass) goToSetup();
  }, [myClass, goToSetup]);

  if (!myClass) return null;

  const opponentSummary =
    opponents.length === 0
      ? 'Nessun avversario configurato'
      : opponents.length === 1
        ? '1 avversario'
        : `${opponents.length} avversari`;
  const ysRange =
    opponents.length > 0
      ? `YS ${opponents[0]!.ys}–${opponents[opponents.length - 1]!.ys}`
      : null;

  return (
    <div className="flex-1 flex flex-col px-5 py-6">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-slate-100 leading-tight">YS Finisher</h1>
          <p className="text-xs text-slate-500 mt-1">Swiss Sailing · YS 2026</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={startDemo}
            className="h-11 px-3 rounded-full bg-slate-900 text-amber-300 text-xs font-semibold border border-amber-500/40"
          >
            Demo
          </button>
          <button
            type="button"
            onClick={goToSetup}
            aria-label="Apri setup"
            className="h-11 w-11 flex items-center justify-center rounded-full bg-slate-800 border border-slate-700 text-slate-200 text-xl"
          >
            ⚙
          </button>
          <button
            type="button"
            onClick={goToHelp}
            aria-label="Help"
            className="h-11 w-11 flex items-center justify-center rounded-full bg-slate-800 border border-slate-700 text-slate-200 text-lg font-semibold"
          >
            ?
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-start gap-4 mt-6">
        <div className="w-full max-w-sm space-y-3">
          <div className="bg-emerald-950/40 border border-emerald-700/60 rounded-xl p-4">
            <p className="text-[10px] uppercase tracking-wider text-emerald-300">La mia classe</p>
            <div className="flex items-center justify-between mt-1">
              <span className="text-lg font-semibold text-slate-100 truncate pr-3">
                {myClass.name}
              </span>
              <span className="tabular text-3xl font-mono font-bold text-emerald-400 shrink-0">
                {myClass.ys}
              </span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-300">{opponentSummary}</span>
              {ysRange && (
                <span className="tabular font-mono text-xs text-slate-500">{ysRange}</span>
              )}
            </div>
            {opponents.length > 0 && (
              <ul className="mt-3 pt-3 border-t border-slate-800 space-y-1.5">
                {opponents.map((o) => (
                  <li
                    key={`${o.name}-${o.ys}`}
                    className="flex items-center justify-between gap-3"
                  >
                    <span className="text-sm text-slate-200 truncate">{o.name}</span>
                    <span className="tabular font-mono text-sm text-slate-400 shrink-0">
                      {o.ys}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <div className="safe-pb">
        <button
          type="button"
          onClick={startCountdown}
          className="w-full h-16 rounded-xl font-bold text-lg bg-emerald-600 text-white shadow-lg shadow-emerald-900/30"
        >
          Start 5''
        </button>
      </div>
    </div>
  );
}
