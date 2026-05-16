# YS Finisher

PWA mobile **personale, offline-first, senza backend** per regatanti che usano il sistema **Yardstick svizzero** (Swiss Sailing) sui laghi.

L'app accompagna il regatante in tre fasi: pre-start con countdown sincronizzabile al colpo del comitato, regata con cronometro background, e — al traguardo — una vista **rosso → verde** che mostra in tempo reale quali classi avversarie sono ancora in grado di battermi a compensato e quali ho già "lasciato indietro".

## Come funziona

1. **Setup** — Seleziono la mia classe (es. Asso 99, YS 84) e aggiungo le classi avversarie presenti in regata.
2. **Countdown 5'** — Tocco `SYNC` sul colpo del comitato: il target si allinea al minuto pieno più vicino del clock di sistema. I bottoni `+1 min` / `−1 min` correggono manualmente.
3. **Race** — Il telefono va in tasca. Cronometro basato su `Date.now()`, immune allo sleep dello schermo.
4. **Finished** — Slide-to-confirm cattura il mio tempo `T_me`. Da qui in poi vedo una lista ordinata per YS crescente:
   - **Rosso**: la classe può ancora battermi a compensato (`T_now × 100 / YS_x < T_comp_me`)
   - **Verde**: la classe non può più battermi (e per monotonicità ci resta)
   - Ogni riga rossa mostra il countdown residuo prima del transition rosso → verde.

### Formula tempo compensato

Sistema **Tempo-su-Tempo** standard adottato in Svizzera, Germania, Austria:

```
T_comp = T_reale × 100 / Yardstickzahl
```

YS basso → barca veloce (più handicap), YS alto → barca lenta (meno handicap). Riferimento 100.

## Setup locale

Requisiti: Node.js 18+, pnpm 9+.

```bash
pnpm install
pnpm dev          # dev server con HMR
pnpm test         # unit test (Vitest) sulla logica di calcolo
pnpm build        # build produzione
pnpm preview      # preview build di produzione
pnpm lint         # Biome
```

## Aggiornamento dataset Yardstick

Il file [src/data/yardstick2026.json](src/data/yardstick2026.json) contiene un subset di bootstrap. Per aggiornarlo dal PDF ufficiale Swiss Sailing:

```bash
pnpm add -D pdf-parse @types/pdf-parse
pnpm run parse-yardstick
```

In caso di problemi di parsing, intervenire manualmente sul JSON di output.

## Riferimenti

- Swiss Sailing — Vermessung & Yardstick: <https://www.swiss-sailing.ch/regattieren/vermessung>
- Reglement Yardstick (PDF DE): [Reglement Yardstick DE 2021](https://www.swiss-sailing.ch/_Resources/Persistent/b/6/8/9/b689aed3bd89d348e4c25fa5cab093539eeb112c/Reglement%20Yardstick_DE_2021.pdf)
- Yardstickzahlen 2026 (PDF): [Yardstickzahlen 2026](https://www.swiss-sailing.ch/_Resources/Persistent/8/5/6/5/856574101793d127739073b39bde20817a90f594/Yardstickzahlen2026.pdf)

## Documentazione interna

Per il modello di stato, la persistenza, le decisioni di design e cosa è esplicitamente fuori scope, vedi [ARCHITECTURE.md](ARCHITECTURE.md).

## Licenza

MIT — vedi [LICENSE](LICENSE).
