# Yardstick Finisher Check — Piano di Sviluppo

> **Documento destinato a Claude Code.** Lo sviluppo è previsto in una sola sessione completa, dall'inizio alla fine. Le specifiche sono congelate.

---

## 1. Concetto e dominio

### 1.1 Cosa è

PWA mobile **personale, offline-first, senza backend** destinata al singolo regatante che usa il sistema **Yardstick svizzero** (Swiss Sailing) per regate sui laghi.

L'app accompagna il regatante in tre fasi:

1. **Pre-start**: countdown di 5 minuti con sync manuale al colpo del comitato di regata
2. **Regata**: cronometro in background mentre il telefono è in tasca
3. **Finish**: al tocco di "Finished" l'app cattura il tempo proprio dell'utente e mostra in tempo reale una vista **rosso → verde** che indica, classe per classe, quali avversari (per YS) sono ancora in grado di battermi in tempo compensato e quali ho già "lasciato indietro".

### 1.2 Formula del tempo compensato

Sistema **Tempo-su-Tempo** standard, applicato in Svizzera, Germania, Austria:

```
T_comp = T_reale × 100 / Yardstickzahl
```

YS basso = barca veloce (più handicap), YS alto = barca lenta (meno handicap). Riferimento 100.

### 1.3 Logica core della vista rosso/verde

Definizioni:
- `T_me` = tempo reale dell'utente al traguardo
- `YS_me` = Yardstickzahl dell'utente
- `T_comp_me` = `T_me × 100 / YS_me` (costante dopo il Finished)
- `T_now` = tempo dalla partenza al momento corrente (continua a crescere dopo il Finished)
- `YS_x` = Yardstickzahl di una classe avversaria pre-inserita

Per ogni classe avversaria, si calcola in continuo:

```
T_comp_x_hypothetical = T_now × 100 / YS_x
```

Significato: "se una barca della classe X tagliasse il traguardo **adesso**, che tempo compensato avrebbe?"

Stato della riga:
- `T_comp_x_hypothetical < T_comp_me` → **ROSSO** (quella classe mi batte se taglia ora)
- `T_comp_x_hypothetical ≥ T_comp_me` → **VERDE** (sono al sicuro da quella classe)

Il momento del transition rosso→verde rappresenta il **deadline** entro cui una barca di classe X doveva tagliare per battermi. Superato il deadline, sono al sicuro.

**Inversione monotona**: una volta che una riga diventa verde, lo resta per sempre (perché `T_now` cresce monotonicamente e `T_comp_x_hypothetical` cresce con esso).

### 1.4 Calcolo del countdown al transition

Per una riga ROSSA, il "tempo residuo prima del transition verde" è il momento futuro `T*_now` in cui:

```
T*_now × 100 / YS_x = T_comp_me = T_me × 100 / YS_me

→ T*_now = T_me × YS_x / YS_me

→ secondi_al_transition = T*_now - T_now
```

Se `YS_x > YS_me` (avversario più lento di me): il transition avverrà in futuro. La riga partirà rossa e diventerà verde.

Se `YS_x < YS_me` (avversario più veloce di me): il transition è già nel passato. La riga sarà già verde all'istante del Finished (se l'avversario ipotetico non ha ancora tagliato, ha già perso a compensato).

Se `YS_x == YS_me`: caso degenere, transition esattamente al momento del Finished. La riga è verde al limite (uso `>=` nella formula).

---

## 2. Stack tecnico

| Componente | Scelta | Note |
|---|---|---|
| Build tool | **Vite** | con `vite-plugin-pwa` |
| Framework UI | **React 18+** | functional components, hooks |
| Linguaggio | **TypeScript** | strict mode |
| Styling | **Tailwind CSS** | mobile-first, utility classes |
| State management | **Zustand** | leggero, ideale per timer + lista classi |
| Package manager | **pnpm** | coerente con stack esistente |
| Linter/formatter | **Biome** | (o ESLint+Prettier se Biome dà problemi con PWA plugin) |
| Test | **Vitest** | unit test sulla logica di calcolo |
| Service worker | **Workbox** via vite-plugin-pwa | precache di tutti gli asset |
| Persistenza | **localStorage** | solo per ultima classe selezionata (UX) |
| Hosting | da decidere | dev locale prima, deploy in seguito |
| Repo | `lwullschleger/yardstick-finisher-check` | pubblico, MIT license |

### 2.1 Browser target

- iOS Safari 16.4+ (Wake Lock API supportata)
- Chrome / Edge mobile recenti
- Solo **portrait orientation**, lock via CSS `@media (orientation: landscape)` con messaggio "ruota in portrait"

---

## 3. Architettura

### 3.1 Struttura cartelle

```
yardstick-finisher-check/
├── public/
│   ├── manifest.webmanifest
│   ├── icons/
│   │   ├── icon-192.png
│   │   ├── icon-512.png
│   │   └── icon-maskable-512.png
│   └── favicon.svg
├── src/
│   ├── main.tsx                     # entry point, registra SW
│   ├── App.tsx                      # router di stato (setup → countdown → race → finished)
│   ├── index.css                    # Tailwind directives
│   ├── data/
│   │   ├── yardstick2026.json       # lista classi Swiss Sailing 2026 (asset statico)
│   │   └── yardstick.types.ts       # tipi TypeScript per la lista
│   ├── lib/
│   │   ├── compensated.ts           # formule pure (T_comp, T_transition)
│   │   ├── time.ts                  # utility timestamp, formattazione MM:SS
│   │   └── countdown.ts             # logica snap-to-minute, sync, bumper
│   ├── store/
│   │   └── raceStore.ts             # Zustand store (stato globale)
│   ├── components/
│   │   ├── Setup/
│   │   │   ├── SetupScreen.tsx
│   │   │   ├── ClassPicker.tsx     # search + lista filtrata
│   │   │   └── OpponentsList.tsx   # selezione multipla
│   │   ├── Countdown/
│   │   │   ├── CountdownScreen.tsx
│   │   │   ├── CountdownDisplay.tsx
│   │   │   ├── SyncButton.tsx
│   │   │   └── MinuteBumper.tsx
│   │   ├── Race/
│   │   │   ├── RaceScreen.tsx       # tempo grande + slider Finished
│   │   │   └── FinishedSlider.tsx
│   │   ├── Finished/
│   │   │   ├── FinishedScreen.tsx
│   │   │   ├── HeaderTimes.tsx     # T_me, T_comp_me, T_now sempre visibili
│   │   │   ├── ClassRow.tsx         # singola riga rosso/verde
│   │   │   └── ResultsList.tsx     # lista ordinata + auto-scroll
│   │   └── shared/
│   │       ├── SlideToConfirm.tsx
│   │       └── PortraitOnly.tsx
│   ├── hooks/
│   │   ├── useTick.ts               # refresh UI 1Hz quando in foreground
│   │   ├── useWakeLock.ts          # gestione Wake Lock API
│   │   └── useVisibility.ts        # detect foreground/background
│   └── types/
│       └── index.ts                 # tipi condivisi (BoatClass, RaceState, etc.)
├── scripts/
│   └── parse-yardstick-pdf.ts       # script per generare yardstick2026.json dal PDF
├── tests/
│   ├── compensated.test.ts
│   ├── countdown.test.ts
│   └── time.test.ts
├── index.html
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── biome.json
├── package.json
├── LICENSE                          # MIT
└── README.md
```

### 3.2 Macchina a stati dell'app

```
   ┌─────────┐  Start →   ┌──────────┐  GO →     ┌──────┐  Finished slide → ┌──────────┐
   │  SETUP  │ ─────────▶ │COUNTDOWN │ ────────▶ │ RACE │ ────────────────▶│ FINISHED │
   └─────────┘            └──────────┘           └──────┘                   └──────────┘
        ▲                       │                    │                          │
        │                       │ Reset slide        │ Reset slide              │ Reset slide
        └───────────────────────┴────────────────────┴──────────────────────────┘
```

5 stati discreti, rappresentati come union type:

```typescript
type AppPhase = 'setup' | 'countdown' | 'race' | 'finished';
```

### 3.3 Store Zustand (modello dati)

```typescript
interface BoatClass {
  name: string;       // "Asso 99"
  ys: number;         // 84
  category: 'Jollen' | 'Jollenkreuzer' | 'Libera' | 'Mehrrumpfboote' | 'Yachten';
}

interface RaceState {
  // Phase
  phase: AppPhase;

  // Setup
  myClass: BoatClass | null;
  opponentClasses: BoatClass[];           // unicità per YS, ordinate per YS crescente

  // Countdown
  countdownTargetMs: number | null;       // timestamp assoluto del GO previsto
                                           // (countdownTargetMs - Date.now() = ms residui)

  // Race
  raceStartMs: number | null;             // timestamp assoluto della partenza (GO)
                                           // === countdownTargetMs al momento del GO

  // Finished
  finishedAtMs: number | null;            // timestamp assoluto del Finished
                                           // T_me = finishedAtMs - raceStartMs

  // Actions
  setMyClass: (c: BoatClass) => void;
  addOpponent: (c: BoatClass) => void;
  removeOpponent: (ys: number) => void;
  startCountdown: () => void;             // imposta countdownTargetMs = Date.now() + 5*60*1000
  syncToNearestMinute: () => void;        // snap countdownTargetMs al minuto pieno più vicino
  bumpMinute: (delta: 1 | -1) => void;    // ±60s su countdownTargetMs
  finishRace: () => void;                 // imposta finishedAtMs
  reset: () => void;                      // azzera tutto, torna a setup

  // Derived (computed in component, non in store)
}
```

### 3.4 Logica core (`lib/compensated.ts`)

Funzioni pure, testabili, indipendenti da React:

```typescript
// Tempo compensato in millisecondi
export function compensatedTime(realTimeMs: number, ys: number): number {
  return realTimeMs * 100 / ys;
}

// Stato rosso/verde di una classe avversaria
export type RowStatus = 'red' | 'green';

export function rowStatus(
  nowMs: number,           // T_now (ms dalla partenza)
  myCompMs: number,        // T_comp_me
  opponentYs: number       // YS_x
): RowStatus {
  const hypotheticalComp = compensatedTime(nowMs, opponentYs);
  return hypotheticalComp >= myCompMs ? 'green' : 'red';
}

// Secondi residui prima del transition rosso → verde
// Restituisce null se la riga è già verde
export function secondsToTransition(
  nowMs: number,
  myTimeMs: number,        // T_me (tempo reale dell'utente)
  myYs: number,            // YS_me
  opponentYs: number       // YS_x
): number | null {
  // T*_now = T_me × YS_x / YS_me
  const transitionAtMs = myTimeMs * opponentYs / myYs;
  const remainingMs = transitionAtMs - nowMs;
  if (remainingMs <= 0) return null;     // già verde
  return Math.ceil(remainingMs / 1000);
}
```

### 3.5 Logica countdown (`lib/countdown.ts`)

```typescript
const FIVE_MINUTES_MS = 5 * 60 * 1000;
const ONE_MINUTE_MS = 60 * 1000;

export function initialCountdownTarget(nowMs: number): number {
  return nowMs + FIVE_MINUTES_MS;
}

// Snap del target al minuto pieno più vicino
// rispetto al "tempo assoluto di partenza"
export function snapToNearestMinute(targetMs: number): number {
  return Math.round(targetMs / ONE_MINUTE_MS) * ONE_MINUTE_MS;
}

// Bumper ±1 minuto
export function bumpMinute(targetMs: number, delta: 1 | -1): number {
  return targetMs + delta * ONE_MINUTE_MS;
}

// Calcolo ms residui per il display
export function remainingMs(targetMs: number, nowMs: number): number {
  return Math.max(0, targetMs - nowMs);
}
```

**Razionale semantica sync**: l'utente fa tap su "Sync" *al colpo del comitato*. In quel momento il target che è memorizzato come timestamp assoluto viene arrotondato al minuto pieno più vicino del *clock di sistema*. Esempio: se il target attuale è `Date.now() + 4:37`, ovvero le 14:37:23, lo snap lo porta a 14:37:00 (più vicino di 14:38:00 perché 23s < 30s). Questo allinea il GO previsto al minuto pieno del clock di sistema, che è esattamente quello che vuole un comitato che spara i colpi sui minuti pieni.

### 3.6 Logica tempo (`lib/time.ts`)

```typescript
// Formattazione MM:SS o HH:MM:SS
export function formatDuration(ms: number, opts?: { showHours?: boolean }): string {
  const totalSec = Math.floor(Math.abs(ms) / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const sign = ms < 0 ? '-' : '';
  if (opts?.showHours || h > 0) {
    return `${sign}${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  }
  return `${sign}${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}
```

### 3.7 Hook `useTick`

Refresh UI a 1 Hz quando in foreground, sospeso in background.

```typescript
export function useTick(active: boolean, intervalMs = 1000): number {
  const [tick, setTick] = useState(Date.now());
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setTick(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [active, intervalMs]);
  return tick;
}
```

Tutto il calcolo del tempo trascorso viene fatto da `Date.now() - raceStartMs`, mai accumulando. Quando l'app si risveglia dopo essere stata in tasca, il valore è sempre corretto.

### 3.8 Hook `useWakeLock`

Wake Lock attivo solo nelle fasi `countdown` e `finished` (non in `race`, perché il telefono è in tasca).

```typescript
export function useWakeLock(enabled: boolean): void {
  useEffect(() => {
    if (!enabled || !('wakeLock' in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    const acquire = async () => {
      try { lock = await (navigator as any).wakeLock.request('screen'); } catch {}
    };
    acquire();
    const onVisibility = () => {
      if (document.visibilityState === 'visible' && !lock) acquire();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      lock?.release().catch(() => {});
    };
  }, [enabled]);
}
```

---

## 4. UI / UX per schermata

### 4.1 Setup

Layout verticale, mobile-first, padding 16-24px.

**Sezione "La mia classe"** (in alto, prominente):
- Se non selezionata: button grande "Seleziona la tua classe" che apre un modale di ricerca.
- Se selezionata: card con nome classe + YS (font grande), bottone "Cambia" piccolo.

**Sezione "Avversari (classi presenti)"**:
- Lista chip/card delle classi aggiunte, con badge YS e tap-to-remove (X)
- Button "Aggiungi classe" che apre modale di ricerca
- Vuota inizialmente, almeno 1 classe obbligatoria per procedere? **No, anche 0 è ammesso** (l'app può servire solo per il countdown se voglio).

**Modale ricerca classi**:
- TextInput in alto con `autoFocus`
- Lista filtrata sotto, virtualizzata se >50 risultati (probabilmente non serve a ~600 totali)
- Match case-insensitive su `name`
- Filtro opzionale per categoria (5 chip in alto sotto il search: Jollen / Jollenkreuzer / Libera / Mehrrumpf / Yachten)
- Tap su classe → ritorna a setup con classe selezionata

**Bottone "Avvia countdown 5'"** in basso, sticky:
- Abilitato solo se `myClass` selezionata
- Tap → `startCountdown()` → transizione a phase `countdown`

### 4.2 Countdown

Layout verticale centrato. Schermo dominato dal numero.

**In alto, piccolo**: "Countdown alla partenza"

**Al centro, ENORME** (es. font-size 96-128px, monospace, tabular-nums):
- `MM:SS` residuo (es. `04:37`)
- Aggiornato a 1 Hz tramite `useTick`
- Calcolo: `(countdownTargetMs - Date.now())` formattato

**Sotto il numero**:
- Tre bottoni in fila:
  - `−1 min` (a sinistra)
  - `SYNC` (al centro, prominente — è il bottone più tappato in pratica)
  - `+1 min` (a destra)

**In basso, defilato**:
- Slider "Reset" (riporta a setup, conferma con slide-to-confirm)

**Quando il countdown raggiunge 0**:
- Transizione automatica a phase `race`
- `raceStartMs = countdownTargetMs`

**Wake Lock attivo** in questa fase.

### 4.3 Race

Layout minimalista.

**In alto, piccolo**: "In regata"

**Al centro, GRANDE**:
- Tempo trascorso dalla partenza, `MM:SS` o `HH:MM:SS` se >1h
- Calcolo: `Date.now() - raceStartMs`

**In basso, prominente**:
- **Slide-to-confirm "Finished"** (large, ben visibile, ma protetto da gesture)

**In fondo, defilato**:
- Slider "Reset"

**Wake Lock disattivato** in questa fase (telefono in tasca, schermo si spegne).

**Comportamento background**: anche se l'utente tiene attivo lo schermo, il display si aggiorna correttamente. Se l'utente apre l'app dopo 45 minuti, il tempo visualizzato è esatto.

### 4.4 Finished

Layout a due aree.

**Area superiore (header, ~25% schermo)**:
- "Mio tempo": `T_me` formattato (HH:MM:SS)
- "Mio compensato": `T_comp_me` formattato
- "Tempo live": `T_now` che continua a scorrere, monospace
- Mia classe + YS_me ben visibile

**Area inferiore (lista classi, ~70% schermo)**:
- Scrollabile verticalmente
- Una riga per ogni classe avversaria, ordinata per YS crescente (più veloci in alto, più lente in basso)
- **Auto-scroll** centra la frontiera rosso/verde nel viewport quando la frontiera si sposta
- Ogni riga contiene:
  - YS (font grande a sinistra)
  - Nome classe (a destra del YS)
  - Stato: sfondo ROSSO (es. `bg-red-500/80`) o VERDE (es. `bg-emerald-500/80`)
  - Se rossa: countdown "Verde tra `Xs`" (in piccolo, a destra)
  - Se verde: indicatore "✓" o "Battuta" (a destra)
- Animazione di transition rosso→verde: brief flash + cambio colore smooth (300ms)

**Slider "Reset" sticky in fondo**.

**Wake Lock attivo** in questa fase (l'utente vuole guardare lo schermo).

### 4.5 SlideToConfirm

Componente riusabile per Finished e Reset.

- Track largo con label centrale (es. "Slide to Finish" / "Slide to Reset")
- Thumb trascinabile da sinistra a destra
- Conferma quando il thumb raggiunge il bordo destro (≥ 90% width)
- Reset automatico se rilasciato prima del 90%
- Implementazione con `onPointerDown` / `onPointerMove` / `onPointerUp` (non drag HTML5, troppo limitato su mobile)

### 4.6 Tema visivo

- **Sfondo**: bianco/grigio chiarissimo per setup e countdown (massima leggibilità)
- **Sfondo**: nero o grigio scuro per race (consumo OLED ridotto, contrasto sole)
- **Rosso**: `#dc2626` (red-600) — sfondo righe rosse
- **Verde**: `#10b981` (emerald-500) — sfondo righe verdi
- **Font primario**: system-ui per tutto
- **Font per numeri grandi**: `font-mono` con `tabular-nums` per evitare jitter
- **Touch target minimo**: 48×48px su tutti i bottoni

---

## 5. Generazione del dataset Yardstick 2026

### 5.1 Output atteso

File `src/data/yardstick2026.json`:

```json
[
  { "name": "18-Footer", "ys": 74, "category": "Jollen" },
  { "name": "29er", "ys": 92, "category": "Jollen" },
  { "name": "Optimist", "ys": 173, "category": "Jollen" },
  { "name": "A-Cat", "ys": 82, "category": "Mehrrumpfboote" },
  { "name": "Asso 99", "ys": 84, "category": "Yachten" }
]
```

### 5.2 Sorgente

URL: `https://www.swiss-sailing.ch/_Resources/Persistent/8/5/6/5/856574101793d127739073b39bde20817a90f594/Yardstickzahlen2026.pdf`

### 5.3 Script di parsing

`scripts/parse-yardstick-pdf.ts` — esegue:

1. Scarica il PDF da URL (fetch + write a file temporaneo)
2. Estrae testo (libreria `pdf-parse` o `pdfjs-dist`)
3. Parsifica con regex/state machine:
   - Identifica le 5 sezioni header (`Jollen`, `Jollenkreuzer`, `Libera`, `Mehrrumpfboote`, `Yachten`)
   - Per ogni riga, estrae primo intero = YS, resto = name (eventualmente con dati tecnici di velatura tra slash, da scartare o conservare in campo `details`)
   - Pattern tipico: `^(\d+)\s+(.+?)$` con line preprocessing per gestire wrap di riga
4. Scrive `src/data/yardstick2026.json` ordinato per categoria poi per name

**Da eseguire manualmente** una volta l'anno (post-pubblicazione lista nuova da Swiss Sailing, tipicamente dicembre). Comando: `pnpm run parse-yardstick`.

In caso di problemi di parsing automatico, fallback: parsing manuale del PDF e salvataggio diretto del JSON. **Non bloccare lo sviluppo dell'app per questo** — se il parsing automatico non funziona al primo colpo, salvare manualmente il JSON con i dati che ho già estratto dalla preview del PDF in conversazione e proseguire.

### 5.4 Dataset di bootstrap minimo

In assenza di parsing automatico al primo run, includere almeno queste classi (estratte dalla preview del PDF) per garantire che l'app funzioni end-to-end durante lo sviluppo:

```json
[
  { "name": "Optimist", "ys": 173, "category": "Jollen" },
  { "name": "Laser / ILCA 7", "ys": 112, "category": "Jollen" },
  { "name": "ILCA 6", "ys": 116, "category": "Jollen" },
  { "name": "ILCA 4", "ys": 125, "category": "Jollen" },
  { "name": "470", "ys": 103, "category": "Jollen" },
  { "name": "420", "ys": 112, "category": "Jollen" },
  { "name": "29er", "ys": 92, "category": "Jollen" },
  { "name": "49er", "ys": 83, "category": "Jollen" },
  { "name": "Finn Dinghy (Carbonmast)", "ys": 110, "category": "Jollen" },
  { "name": "Flying Dutchman", "ys": 96, "category": "Jollen" },
  { "name": "505", "ys": 98, "category": "Jollen" },
  { "name": "Vaurien", "ys": 123, "category": "Jollen" },
  { "name": "Libera A 10,71 bis 12,7 m", "ys": 60, "category": "Libera" },
  { "name": "Libera B 8,71 bis 10,7 m", "ys": 70, "category": "Libera" },
  { "name": "Libera C 6,71 bis 8,7 m", "ys": 80, "category": "Libera" },
  { "name": "A-Cat", "ys": 82, "category": "Mehrrumpfboote" },
  { "name": "Tornado New", "ys": 70, "category": "Mehrrumpfboote" },
  { "name": "Dart", "ys": 85, "category": "Mehrrumpfboote" },
  { "name": "Asso 99", "ys": 84, "category": "Yachten" },
  { "name": "Aphrodite 101", "ys": 95, "category": "Yachten" },
  { "name": "Albin Express", "ys": 106, "category": "Yachten" },
  { "name": "Avance 24", "ys": 110, "category": "Yachten" },
  { "name": "Arpege", "ys": 109, "category": "Yachten" },
  { "name": "11 m One Design", "ys": 91, "category": "Yachten" }
]
```

Questo set permette di testare la search, la selezione multipla e la logica rosso/verde con valori realistici. L'integrazione completa va fatta in seguito via script di parsing.

---

## 6. PWA: configurazione

### 6.1 `vite.config.ts`

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/*.png'],
      manifest: {
        name: 'Yardstick Finisher Check',
        short_name: 'YS Finisher',
        description: 'Compensato Yardstick svizzero live per regate sui laghi',
        theme_color: '#0f172a',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,json}'],
        cleanupOutdatedCaches: true
      }
    })
  ]
});
```

### 6.2 Manifest

Standard PWA con `display: standalone`, `orientation: portrait`. Icone 192/512 + una maskable.

### 6.3 Icone

Per ora, placeholder generati (qualsiasi SVG/PNG semplice con tema vela — es. una "Y" stilizzata o una bandiera triangolare). Va bene anche un generatore tipo realfavicongenerator. **Non bloccare lo sviluppo per il design icone**.

---

## 7. Testing

### 7.1 Unit test (Vitest)

Coprire interamente `lib/`:

- `compensated.test.ts`:
  - `compensatedTime(3600000, 100) === 3600000` (barca a YS 100, tempo invariato)
  - `compensatedTime(3600000, 80) > 3600000` (più veloce → compensato penalizzato, tempo aumenta)
  - `compensatedTime(3600000, 120) < 3600000` (più lenta → compensato bonificato)
  - `rowStatus`: tutti i casi (rosso, verde, edge `===`)
  - `secondsToTransition`: caso futuro (positivo), caso passato (null), caso YS uguali (0 o null)

- `countdown.test.ts`:
  - `snapToNearestMinute`: timestamp con 23s → snap al minuto prima; timestamp con 37s → snap al minuto dopo
  - `bumpMinute`: ±60000 ms
  - `remainingMs`: mai negativo

- `time.test.ts`:
  - Formattazione MM:SS e HH:MM:SS
  - Edge cases: 0 ms, 59 sec, 60 sec, 3599 sec, 3600 sec

### 7.2 Manual E2E

Lista di scenari manuali da verificare prima di considerare "done":

1. Setup completo: seleziono mia classe (Asso 99, YS 84), aggiungo 3 avversari (Tornado 70, Finn 110, Optimist 173)
2. Avvio countdown, attendo 30s, premo SYNC: il countdown deve fare snap al minuto pieno più vicino al clock di sistema
3. Premo +1 e -1: il countdown si sposta di 60s avanti/indietro
4. Aspetto che vada a 0: l'app passa automaticamente a fase race
5. Metto telefono in tasca, schermo si spegne. Aspetto 2 minuti.
6. Riapro: il cronometro mostra esattamente ~2:00
7. Slide su Finished: l'app passa a fase finished
8. **Verifica logica rosso/verde**:
   - Tornado (YS 70 < 84): la sua riga deve essere già VERDE all'istante del Finished (Tornado che taglia 2 minuti dopo di me ha compensato peggiore se YS_me=84, T_me=2min)... no, attenzione: in realtà Tornado ha YS_more_low quindi è "più veloce di me a compensato", quindi se taglia adesso al mio stesso T_now (== T_me) ha compensato `T_me*100/70` che è MAGGIORE del mio `T_me*100/84`. Quindi `T_comp_x > T_comp_me` → ai sensi della formula questa è VERDE. ✓
   - Aspettiamo qualche secondo: deve restare verde (monotonicità).
   - Finn (YS 110 > 84): la sua riga deve essere ROSSA all'istante del Finished, e diventerà verde dopo un certo tempo. Verifico che il countdown del transition mostri il tempo corretto.
   - Optimist (YS 173 > 84): rossa, transition molto più in là nel tempo. Verifico il calcolo.
9. Auto-scroll: man mano che le righe virano, il viewport deve seguire la frontiera
10. Slider Reset: torna a setup, dati persi (eccetto preferenze opzionali)
11. Test offline: con DevTools network offline, ricaricare l'app — deve caricare dal service worker

### 7.3 Validazione formula con esempio numerico

Sanity check carta-e-penna che la logica funziona:

- `YS_me = 100`, `T_me = 3600s` → `T_comp_me = 3600s`
- Avversario `YS_x = 80`:
  - Al momento del mio finished `T_now = 3600s`: `T_comp_x = 3600*100/80 = 4500s > 3600s = T_comp_me` → VERDE ✓
  - Avversario YS 80 (più veloce di me) ha già perso a compensato perché non è arrivato prima di me; non può recuperare.
- Avversario `YS_x = 120`:
  - Al momento del mio finished `T_now = 3600s`: `T_comp_x = 3600*100/120 = 3000s < 3600s = T_comp_me` → ROSSO ✓
  - Transition: `T*_now = 3600 * 120/100 = 4320s` → dopo `720s = 12min` dal mio Finished la sua riga diventa verde
  - Significato: una barca YS 120 deve tagliare entro 4320s = 1h12m dalla partenza per battermi a compensato. Dopo, è battuta.

---

## 8. Convenzioni di codice

- TypeScript strict mode
- Funzioni pure dove possibile, side effects solo nei componenti
- Naming:
  - Componenti React: `PascalCase`
  - Funzioni e variabili: `camelCase`
  - Costanti: `SCREAMING_SNAKE_CASE`
  - Tipi e interfacce: `PascalCase`
  - File componenti: `PascalCase.tsx`, file lib: `kebab-case.ts`
- Tempi in millisecondi internamente, formattazione solo in display
- Nessun magic number nel codice — costanti nel file dove servono
- Commenti in italiano per la logica di dominio (è un progetto svizzero italiano), in inglese per dettagli tecnici generici
- README in italiano

---

## 9. Note di implementazione cross-cutting

### 9.1 Persistenza minima

`localStorage`:
- `yfc:lastMyClass` → nome classe ultima usata, ripristinato all'apertura del setup come pre-selezione (UX nice-to-have)
- Nient'altro.

Niente storico regate, niente preferenze complesse.

### 9.2 Background / foreground

- Tutti i calcoli di tempo da `Date.now()`, mai accumulatori
- `useTick` si attiva/disattiva su `document.visibilityState`
- Quando l'app torna in foreground dopo essere stata in background, calcolare lo stato corrente come `Date.now() - raceStartMs` (o `countdownTargetMs - Date.now()`) e rendere — non c'è bisogno di "rebase" o sincronizzazioni complesse

### 9.3 iOS Safari peculiarities

- Wake Lock supportato da iOS 16.4+
- PWA in standalone deve essere installata via "Aggiungi a Home Screen" da Safari
- `tabular-nums` per evitare il salto larghezza dei numeri
- `touch-action: manipulation` su bottoni per evitare zoom 300ms di delay
- Status bar in standalone mode: configurare `apple-mobile-web-app-status-bar-style` in `index.html`
- Safe area iPhone (notch): `padding: env(safe-area-inset-top)` etc.

### 9.4 Performance

- 30 righe max realisticamente in lista classi (uso pratico)
- Re-render a 1Hz solo della lista classi (memo dei componenti riga)
- Service worker precache dell'intero bundle (peso target < 200KB compresso)

### 9.5 Accessibilità (livello minimo)

- Contrasto WCAG AA su tutti i testi
- Touch target ≥ 48px
- ARIA labels su slider e bottoni icona
- No animazioni vitali se `prefers-reduced-motion`

---

## 10. Deliverables

Al termine dello sviluppo, il repo `lwullschleger/yardstick-finisher-check` deve contenere:

1. **Codice sorgente completo** secondo struttura cartelle in §3.1
2. **README.md** in italiano con:
   - Descrizione progetto
   - Setup locale (`pnpm install`, `pnpm dev`)
   - Build produzione (`pnpm build`)
   - Come funziona (sintetico)
   - Riferimento normativo a Swiss Sailing Yardstick Reglement
   - Licenza MIT
3. **LICENSE** MIT
4. **`yardstick2026.json`** popolato (almeno con dataset bootstrap §5.4, idealmente con tutta la lista via script di parsing)
5. **Build PWA installabile** — `pnpm build` deve produrre artefatti deployabili statici
6. **Test passanti** — `pnpm test` deve passare tutti i unit test in §7.1
7. **Manifest e icone** configurati per installazione

---

## 11. Cosa NON fare

Per evitare scope creep:

- ❌ NO backend, NO API esterne, NO database remoto
- ❌ NO autenticazione, NO login, NO account utente
- ❌ NO analytics, NO tracking, NO cookie banner
- ❌ NO multilingua (solo italiano)
- ❌ NO storico regate
- ❌ NO calcolo "officiale" multi-regatante (è una app personale)
- ❌ NO supporto SCHRS, SRS, ORC
- ❌ NO toggle "no spi/gennaker" (+2 YS)
- ❌ NO override manuale YS
- ❌ NO modalità landscape
- ❌ NO audio, NO beep, NO notifiche push
- ❌ NO gestione bandiere/penalità/abbandoni (DNF, OCS, ecc.)
- ❌ NO supporto barche con foil (Swiss Sailing non assegna YS a barche con foil)

---

## 12. Sequenza di sviluppo consigliata

Per Claude Code, in ordine per minimizzare rework:

1. **Bootstrap progetto**: `pnpm create vite`, configurare TypeScript, Tailwind, vite-plugin-pwa, Biome, Vitest
2. **Setup repo Git** con .gitignore, README, LICENSE
3. **Definire tipi** (`src/types/`, `src/data/yardstick.types.ts`)
4. **Inserire dataset bootstrap** in `src/data/yardstick2026.json` (§5.4)
5. **Scrivere lib pure** + relativi test: `compensated.ts`, `countdown.ts`, `time.ts`
6. **Far passare i test** prima di toccare UI
7. **Store Zustand** con tutte le actions
8. **Shell App** con state machine 4 fasi (placeholder per ogni schermata)
9. **Componenti shared**: SlideToConfirm, PortraitOnly
10. **Setup screen** + ClassPicker
11. **Countdown screen** completo
12. **Race screen** + FinishedSlider
13. **Finished screen** + lista righe rosso/verde + auto-scroll
14. **Hooks**: useTick, useWakeLock, useVisibility
15. **Polish UX**: animazioni di transition, micro-interazioni
16. **PWA**: manifest, icone placeholder, test installazione
17. **Script di parsing PDF** (opzionale, può rimanere come TODO)
18. **README**
19. **Build + smoke test**

---

## 13. Riferimenti

- Swiss Sailing — Vermessung & Yardstick: https://www.swiss-sailing.ch/regattieren/vermessung
- Swiss Sailing Yardstick Reglement (PDF DE): https://www.swiss-sailing.ch/_Resources/Persistent/b/6/8/9/b689aed3bd89d348e4c25fa5cab093539eeb112c/Reglement%20Yardstick_DE_2021.pdf
- Swiss Sailing Yardstickzahlen 2026 (PDF): https://www.swiss-sailing.ch/_Resources/Persistent/8/5/6/5/856574101793d127739073b39bde20817a90f594/Yardstickzahlen2026.pdf
- Formula Tempo-su-Tempo standard (DSV, ÖSV, BSVb, Swiss-Sailing): `Berechnete Zeit = Gesegelte Zeit × 100 / Yardstickzahl`

---

**Fine del piano.**
