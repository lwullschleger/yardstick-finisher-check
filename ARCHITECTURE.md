# Architettura YS Finisher

Documentazione interna delle scelte di design e del modello di stato. Il README copre cos'è e come si avvia; questo file copre il "perché funziona così".

## 1. Concetto e dominio

PWA mobile personale, **offline-first, senza backend**, per il singolo regatante che corre regate Yardstick svizzero sui laghi. Risolve una domanda precisa: *al traguardo, chi può ancora battermi a compensato?*

### 1.1 Logica rosso/verde

Definizioni:
- `T_me` — tempo reale dell'utente al traguardo
- `YS_me` — Yardstickzahl dell'utente
- `T_comp_me = T_me × 100 / YS_me` — costante dopo il Finished
- `T_now` — tempo dalla partenza al momento corrente (continua a crescere dopo il Finished)
- `YS_x` — Yardstickzahl di una classe avversaria

Per ogni classe `x` si calcola in continuo:

```
T_comp_x_hypothetical = T_now × 100 / YS_x
```

Significato: "se una barca della classe X tagliasse il traguardo *adesso*, che tempo compensato avrebbe?"

- `T_comp_x_hypothetical < T_comp_me` → **ROSSO** (mi batte se taglia ora)
- `T_comp_x_hypothetical ≥ T_comp_me` → **VERDE** (sono al sicuro)

### 1.2 Countdown al transition

Per una riga rossa, il momento futuro `T*_now` in cui diventerà verde:

```
T*_now = T_me × YS_x / YS_me
seconds_to_transition = T*_now − T_now
```

### 1.3 Inversione monotona

Una riga verde resta verde per sempre: `T_now` cresce monotonicamente, quindi `T_comp_x_hypothetical` cresce con esso. Questa proprietà rende ridondante mostrare la maggior parte delle righe verdi non selezionate (vedi §3.5).

---

## 2. Stack tecnico

| Componente | Scelta |
|---|---|
| Build | Vite + `vite-plugin-pwa` (Workbox) |
| UI | React 18, functional components |
| Linguaggio | TypeScript strict |
| Styling | Tailwind CSS, mobile-first |
| State | Zustand |
| Lint/format | Biome |
| Test | Vitest (solo logica pura) |
| Persistenza | `localStorage` |

**Target browser**: iOS Safari 16.4+ (Wake Lock API), Chrome/Edge mobile recenti. Solo orientamento **portrait**.

---

## 3. Architettura

### 3.1 Macchina a stati

Sei fasi discrete (`AppPhase`):

```
        ┌─────────┐
        │ welcome │ ◀──┐
        └────┬────┘    │
       ┌────┴────┐    │ reset
   ⚙ ─▶│  setup  │    │
       └────┬────┘    │
       ?─▶ │  help   │ │
       ┌────┴────┐    │
       │countdown│────┼──► race ──► finished
       └─────────┘    │      │         │
                      └──────┴─────────┘
                          (reset)
```

`welcome`, `setup`, `help` sono pagine "informative" che non rappresentano stato di regata. `countdown`, `race`, `finished` sono fasi "attive" persistite (§3.3).

### 3.2 Store Zustand

Stato globale in [src/store/raceStore.ts](src/store/raceStore.ts). Tutti i derivati (`T_comp_me`, status riga, secondi al transition) sono calcolati nei componenti, **mai memorizzati nello store** — sono funzione del tempo corrente e cambierebbero ogni tick.

### 3.3 Persistenza

Tre chiavi `localStorage`:

| Chiave | Contenuto | Quando si scrive |
|---|---|---|
| `ysf:lastMyClass` | `BoatClass` | a ogni `setMyClass` |
| `ysf:opponents` | `BoatClass[]` | a ogni add/remove/clear |
| `ysf:session` | `{ phase, countdownTargetMs, raceStartMs, finishedAtMs }` | start/sync/bump countdown, go-to-race, finish-race, reset (clear) |

Regole sessione:
- **Scadenza 12h**: al boot, se la sessione persistita non è in `finished` e il timer più recente è > 12h fa, viene scartata. Evita che una regata dimenticata si presenti come "in corso" la settimana successiva.
- **`finished` resta fino a reset**: questa fase è esente dalla scadenza — l'utente vuole rivedere il risultato anche dopo ore o giorni.
- **Demo non persistita**: `startDemo` chiama `clearSession` e non scrive mai. Il flag `isDemo` esiste solo in memoria. Killare la demo riporta a welcome.
- **`goToSetup`, `goToHelp`, `goToWelcome` non toccano la sessione**: aprire impostazioni o help durante una regata non azzera lo stato persistito. Killare l'app da setup/help riporta alla fase attiva.

### 3.4 Time model

Tutti i calcoli di tempo si basano su `Date.now()`, mai accumulatori. `elapsed = Date.now() − raceStartMs` è sempre il valore vero, immune a:
- sleep del telefono
- chiusura/riapertura dell'app
- kill della PWA con ripristino della sessione persistita

`useTick` (1 Hz) si attiva/disattiva su `document.visibilityState`. Quando l'app torna in foreground non serve "rebasing": il prossimo render calcola da `Date.now()` e basta.

**Wake Lock** ([useWakeLock.ts](src/hooks/useWakeLock.ts)) attivo in `countdown` e `finished` (l'utente guarda lo schermo), **disattivato in `race`** (il telefono è in tasca, lo schermo deve spegnersi).

### 3.5 Logica visibilità ResultsList

Implementata in [src/components/Finished/ResultsList.tsx](src/components/Finished/ResultsList.tsx). Filtra le righe `YS_RANGE` (range completo Yardstick 2026) con tre regole:

1. **Selezionate o "io"** → sempre visibili, rosse o verdi
2. **Non selezionate verdi** → solo le 2 più vicine alla frontiera dal basso (YS maggiore = transizione più recente)
3. **Non selezionate rosse** → solo le 2 più vicine alla frontiera dall'alto (YS minore = transizione più imminente)

L'auto-scroll centra la frontiera (prima riga rossa) quando si sposta.

---

## 4. Decisioni con tradeoff

Scelte che non sono "ovvie dal codice" e che è utile ricordare prima di rimetterle in discussione.

**Auto-save in setup, niente "Salva" / "Annulla"**
Ogni `setMyClass` / `addOpponent` / `removeOpponent` scrive direttamente su `localStorage`. Il pannello impostazioni è uscibile solo via ‹ (back). Niente concetto di "annulla modifiche". Su una PWA personale offline-first il pattern auto-save è coerente con le app settings native; mantenere stato locale + bottone "Salva" sarebbe overhead senza beneficio.

**Reset sempre in alto in tutte le pagine attive**
Countdown, race e finished hanno il `SlideToConfirm` di reset nell'header, non in fondo. Sotto carico (regata in corso) è la posizione meno raggiungibile per tocco accidentale e la più facile da trovare deliberatamente.

**Scadenza sessione 12h, eccetto `finished`**
12h copre una regata lunga (max ~9h, vedi `adjustDemoElapsed`) + qualche ora di margine, ed esclude la regata di ieri. `finished` invece non scade: una volta tagliato, l'utente decide quando "chiudere".

**Demo non persistita**
La demo è una sessione "usa e getta" per esplorare la app. Persisterla creerebbe confusione (al rientro avresti una "demo da 3 giorni"). `startDemo` clearSession + isDemo solo in memoria.

**Niente landscape**
Mobile-first; landscape complicherebbe il layout della ResultsList senza valore d'uso reale (il telefono in regata sta in tasca, e davanti al timone si tiene in portrait).

**Niente storico regate, niente login**
È una app personale single-user. Lo storico introdurrebbe modello dati + UI lista + ricerca, e non risolve nessun problema reale: l'output utile (chi mi ha battuto) lo annoto a mano o lo leggo dalla classifica ufficiale del comitato.

---

## 5. Dataset Yardstick

- **Sorgente**: PDF annuale Swiss Sailing ([Yardstickzahlen 2026](https://www.swiss-sailing.ch/_Resources/Persistent/8/5/6/5/856574101793d127739073b39bde20817a90f594/Yardstickzahlen2026.pdf)).
- **Schema** `BoatClass`: `{ name: string; ys: number; category: BoatCategory }` ([src/types/index.ts](src/types/index.ts)).
- **Aggiornamento**: rilanciare `pnpm run parse-yardstick` quando Swiss Sailing pubblica la nuova lista (tipicamente dicembre). Lo script vive in [scripts/parse-yardstick-pdf.ts](scripts/parse-yardstick-pdf.ts).
- **Fallback**: se il parser sbaglia (cambia layout PDF), editare a mano `src/data/yardstick2026.json`. Nessun motivo per ostinarsi sull'automazione: è un'operazione annuale.

---

## 6. Fuori scope

Esplicitamente non implementati e non da implementare senza una riflessione lunga:

- Backend, account, login, analytics, multilingua, push notifications
- Storico regate, calcolo multi-regatante "ufficiale"
- Audio, beep
- Override manuale YS, toggle +2 YS no spi/gennaker
- Supporto handicap diversi (SCHRS, SRS, ORC)
- Barche con foil (Swiss Sailing non assegna YS)
- Landscape, gestione bandiere/penalità (DNF, OCS, ecc.)

---

## 7. Riferimenti normativi

- Swiss Sailing — Vermessung & Yardstick: <https://www.swiss-sailing.ch/regattieren/vermessung>
- Reglement Yardstick DE 2021: <https://www.swiss-sailing.ch/_Resources/Persistent/b/6/8/9/b689aed3bd89d348e4c25fa5cab093539eeb112c/Reglement%20Yardstick_DE_2021.pdf>
- Yardstickzahlen 2026: <https://www.swiss-sailing.ch/_Resources/Persistent/8/5/6/5/856574101793d127739073b39bde20817a90f594/Yardstickzahlen2026.pdf>
- Formula Tempo-su-Tempo (DSV, ÖSV, BSVb, Swiss-Sailing): `Berechnete Zeit = Gesegelte Zeit × 100 / Yardstickzahl`
