import { useRaceStore } from '../../store/raceStore';

export function HelpScreen() {
  const exitHelp = useRaceStore((s) => s.exitHelp);

  return (
    <div className="flex-1 overflow-y-auto px-5 py-6 space-y-8">
      <header className="flex items-start gap-3">
        <button
          type="button"
          onClick={exitHelp}
          aria-label="Torna indietro"
          className="h-11 w-11 flex items-center justify-center rounded-full bg-slate-800 border border-slate-700 text-slate-200 text-lg shrink-0"
        >
          ‹
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-100 leading-tight">Help</h1>
          <p className="text-sm text-slate-400 mt-0.5">Come funziona YS Finisher</p>
        </div>
      </header>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-emerald-400">
          L'idea
        </h2>
        <div className="space-y-3 text-slate-200 text-sm leading-relaxed">
          <p>
            Nelle regate Yardstick svizzero, ogni classe corre con un coefficiente di handicap
            (YS): più basso → barca veloce, più alto → barca lenta. Il vincitore non è chi taglia
            per primo, ma chi ha il <strong>tempo compensato</strong> minore.
          </p>
          <p>
            Tagliato il traguardo, mi resta una domanda: <em>chi può ancora battermi?</em> Le
            barche più lente che sono ancora in mare hanno un margine di tempo entro cui devono
            arrivare per superarmi a compensato. Più passa il tempo, più classi escono dal gioco.
          </p>
          <p>
            YS Finisher fa esattamente questo: dopo il mio finish mostra in tempo reale, classe
            per classe, chi è ancora una minaccia (<span className="text-red-400">rosso</span>) e
            chi non può più battermi (<span className="text-emerald-400">verde</span>), con il
            countdown residuo prima di ogni transizione rosso → verde.
          </p>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-emerald-400">
          Come funziona
        </h2>

        <div className="space-y-4 text-slate-200 text-sm leading-relaxed">
          <Step n={1} title="Impostazioni">
            Seleziona la <strong>tua classe</strong> e aggiungi le <strong>classi avversarie</strong>
            {' '}presenti in regata. Le impostazioni vengono ricordate tra una regata e l'altra.
          </Step>

          <Step n={2} title="Pre-partenza (countdown 5')">
            Avvia il countdown. Tocca <strong>SYNC</strong> sul colpo del comitato: il target si
            allinea al minuto pieno più vicino del clock di sistema. I bottoni{' '}
            <strong>+1 / −1</strong> correggono manualmente.
          </Step>

          <Step n={3} title="Regata">
            Il telefono va in tasca. Il cronometro si basa sul clock di sistema, quindi è immune
            allo sleep dello schermo: se chiudi e riapri l'app, il tempo è sempre quello vero.
          </Step>

          <Step n={4} title="Arrivo">
            <strong>Slide to confirm</strong> al taglio del traguardo: cattura il tuo tempo{' '}
            <code className="font-mono text-emerald-400">T_me</code>. Da qui parte la vista live
            ordinata per YS crescente: ogni riga rossa mostra il countdown prima di diventare verde.
          </Step>

          <div className="rounded-lg bg-slate-900 border border-slate-800 p-3 mt-2">
            <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">
              Formula tempo compensato
            </p>
            <p className="font-mono text-emerald-400">
              T_comp = T_reale × 100 / YS
            </p>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Sistema Tempo-su-Tempo standard adottato in Svizzera, Germania, Austria. Una classe{' '}
              <em>x</em> mi batte se{' '}
              <code className="text-emerald-400">T_now × 100 / YS_x &lt; T_comp_me</code>.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="h-6 w-6 shrink-0 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center mt-0.5">
        {n}
      </span>
      <div>
        <h3 className="text-slate-100 font-semibold mb-0.5">{title}</h3>
        <p>{children}</p>
      </div>
    </div>
  );
}
