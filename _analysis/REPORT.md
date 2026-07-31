# FASE 1 — Analisi dell'intro di klikkentheke.com

Misurazioni raccolte con Playwright/Chromium 151, viewport 1440×900 e 390×844, DPR 2, cache disabilitata.
Tutti i valori sotto sono **letti dal browser** (`getComputedStyle`, `document.getAnimations()`,
`getBoundingClientRect`), non stimati dai frame.

---

## 1. Sintesi in una riga

L'intro è **un singolo `<div>` fisso a tutto schermo** (`.cover`) che copre la pagina già renderizzata
sotto, resta immobile per 2 s e poi svanisce in opacità in 1 s con `cubic-bezier(0, 0.95, 0.44, 1)`.
Non c'è nessun altro movimento: nessuna traslazione, nessuna scala, nessun `clip-path`, nessuno stagger
sul testo.

---

## 2. Sequenza step-by-step (timing in ms, origine = primo render del `.cover`)

| t (ms) | Cosa accade |
|---|---|
| 0 | Il `.cover` è già nel markup servito (SSR, WordPress) e dipinge al **first paint**. Opacità 1, tinta piatta a tutto schermo, tre testi su una riga a metà altezza. La home vera è già montata sotto, a `z-index` inferiore. |
| 0 → 2000 | **Hold assoluto.** Nessuna proprietà cambia. Verificato campionando `getComputedStyle(.cover).opacity` a ogni `requestAnimationFrame`: costante `1` per tutta la fase. |
| 2000 | Parte `@keyframes fadeOut` (fase attiva dell'animazione, dopo `animation-delay: 2s`). |
| 2000 → 3000 | **Fade out dell'opacità 1 → 0.** L'easing è fortemente front-loaded: a soli 100 ms (10 % della durata) l'opacità è già 0.387; a 300 ms è 0.137. Gli ultimi 400 ms sono visivamente impercettibili. |
| 3000 | `animation-fill-mode: forwards` congela l'opacità a 0. Il nodo **resta nel DOM** (nessuna rimozione osservata da `MutationObserver`), reso innocuo da `pointer-events: none`. |

**Timing reale misurato** (run singola, rete reale): `first-paint` a 1116 ms dalla navigazione,
`animation.startTime` = 1032 ms sulla document timeline → l'animazione è ancorata al render dell'elemento,
non a `load` (che è arrivato a 2607 ms). Su una pagina statica leggera il ciclo completo è quindi
0 → 3000 ms dal primo paint.

---

## 3. Tabella animazioni

| Elemento | Proprietà | Da → A | Durata | Delay | Easing | Fill |
|---|---|---|---|---|---|---|
| `.cover` | `opacity` | `1` → `0` | **1000 ms** | **2000 ms** | **`cubic-bezier(0, 0.95, 0.44, 1)`** | `forwards` |

Nient'altro. Nessuna animazione sui tre testi, sul contenitore o sulla pagina sottostante durante l'intro.

`document.getAnimations()` sul sottoalbero `.cover` restituisce **esattamente una** animazione, con keyframes:

```
offset 0 → opacity 1   easing cubic-bezier(0, 0.95, 0.44, 1)
offset 1 → opacity 0   easing cubic-bezier(0, 0.95, 0.44, 1)
```

### Curva di opacità campionata (verifica dell'easing)

Valori letti seekando l'animazione a step di 100 ms (`_analysis/frames/desktop/opacity.json`):

| t rel. al fade (ms) | 0 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 1000 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| opacity | 1.0000 | 0.3870 | 0.2266 | 0.1366 | 0.0810 | 0.0458 | 0.0239 | 0.0109 | 0.0038 | 0.0007 | 0.0000 |

Questa è la firma inequivocabile di `cubic-bezier(0, 0.95, 0.44, 1)`: il primo punto di controllo a
y = 0.95 con x = 0 produce una partenza quasi verticale.

---

## 4. Struttura DOM dell'intro

Il nodo esiste nell'HTML servito dal server (nessuna costruzione via JS) ed è strutturalmente minimo:
un contenitore `.cover` → una riga flex a piena larghezza → un `<h1>` col wordmark, poi un sotto-gruppo
flex con la tagline (`<p>`) e l'anno (`<div>`, spinto a destra).

Gerarchia misurata:

```
div.cover                          fixed, inset 0, z-index 1200
└─ div.module (riga)               display:flex, margin-top:50lvh, padding-inline: gutter
   ├─ h1                           wordmark            → colonna 1
   └─ div.module (sotto-gruppo)    display:flex        → colonne 2-3
      ├─ p                         tagline             → colonna 2 (nascosta < 667px)
      └─ div                       anno, allineato dx  → colonna 3
```

---

## 5. Geometria misurata

### Desktop 1440×900

| Nodo | x | y | larghezza | altezza | padding-inline |
|---|---|---|---|---|---|
| `.cover` | 0 | 0 | 1440 | 900 | 0 |
| riga | 0 | **450** | 1440 | 14 | 3 px |
| wordmark (col 1) | 3 | 450 | 478 | 14 | 3 px |
| tagline (col 2) | 481 | 450 | 478 | 14 | 3 px |
| anno (col 3) | 959 | 450 | 478 | 14 | 3 px |

- **Posizione x del testo renderizzato**: 6 px, 484 px, 962 px (bordo colonna + 3 px di padding interno).
- **Griglia**: 3 colonne uguali. `(1440 − 2×3) / 3 = 478`.
- **Verticale**: `margin-top` calcolato = **450 px = esattamente 50 lvh**. La riga *inizia* a metà
  viewport, non è centrata su di esso (il suo centro ottico cade a 457 px).

### Mobile 390×844

| Nodo | x | y | larghezza | altezza | padding-inline |
|---|---|---|---|---|---|
| riga | 0 | **422** | 390 | 15 | 4 px |
| wordmark (col 1) | 4 | 422 | 191 | 15 | 4 px |
| tagline | — | — | — | — | `display: none` |
| anno | 340.14 | 422 | 45.86 | 15 | 4 px |

- `margin-top` = 422 px = di nuovo **esattamente 50 lvh**.
- Passa a **2 colonne**: `(390 − 2×4) / 2 = 191`. La tagline centrale sparisce sotto i 667 px.
- L'anno è allineato a destra dentro la seconda colonna (`margin-left: auto`), non a inizio colonna.

---

## 6. Tipografia

| Proprietà | Desktop (≥1281px) | Mobile (<667px) |
|---|---|---|
| `font-family` | `neuehaas` (webfont proprietario del tema) | idem |
| `font-size` | **14 px** | **15 px** |
| `line-height` | **14 px** (= 1.0) | **15 px** (= 1.0) |
| `font-weight` | **400** | 400 |
| `letter-spacing` | **normal** (0) | normal |
| `font-style` | normal | normal |
| `text-transform` | none | none |

Il font è dichiarato via `@font-face { font-family: "neuehaas"; src: url('font.woff2') … }` servito
dal dominio del tema. È un **webfont commerciale sotto licenza del sito**: non va scaricato né
ridistribuito sul tuo dominio. Il disegno è quello di un grottesco neo-svizzero della famiglia
Neue Haas / Helvetica.

**Fallback proposto per la replica** (da confermare in Fase 2): stack di sistema
`-apple-system, "Helvetica Neue", Helvetica, Arial, sans-serif`. Motivo: a 14–15 px con
`line-height: 1` e `letter-spacing: 0`, Helvetica Neue ha altezza-x, larghezze e apertura praticamente
sovrapponibili; su macOS (dove verificheremo il diff) il rendering è quasi indistinguibile e non
introduce alcuna richiesta di rete, quindi zero FOUC. L'alternativa self-hosted più vicina e libera
sarebbe Inter, ma ha altezza-x più alta e apparirebbe più grande a parità di `font-size`.

**Breakpoint tipografici del tema** (per riferimento):

| Larghezza | `font-size` base | gutter |
|---|---|---|
| ≥ 1621 px | 18 px | 3 px |
| 1281–1620 px | 14 px | 3 px |
| 667–1280 px | fluido (20 px min/max nella formula) | 3 px |
| 0–666 px | 15 px | 4 px |

---

## 7. Colori — ⚠️ la palette è randomizzata a ogni caricamento

Questa è la scoperta meno prevedibile dell'analisi. `--cover-bck` e `--cover-txt` sono scritti
**server-side in un `<style>` inline nel `<head>`** e cambiano a ogni richiesta.

Su 22 caricamenti a cache disabilitata ho osservato 5 coppie:

| # | sfondo cover | testo cover | occorrenze |
|---|---|---|---|
| 1 | `#002aff` (blu elettrico) | `#ffffff` | 6 |
| 2 | `#999999` (grigio medio) | `#222222` | 5 |
| 3 | `#fff723` (giallo acido) | `#222222` | 4 |
| 4 | `#dd3333` (rosso) | `#ffffff` | 4 |
| 5 | `#222222` (quasi nero) | `#eeeeee` | 2 |

La distribuzione è compatibile con una scelta uniforme su 5 valori; non escludo che l'insieme reale sia
leggermente più ampio. **Il colore non è quindi un dato fisso da replicare**: è una scelta di design che
dovrai fare tu in Fase 2 (o replicare come randomizzazione).

Lo stato finale su cui si atterra è la home vera, che ha una sua palette indipendente (anch'essa
variabile: ho visto rosa pallido, celeste…). Nel tuo caso lo stato finale è la tua home esistente.

---

## 8. Tecnologia — nessuna libreria necessaria

Verificato ispezionando tutti i 19 bundle JS caricati e strumentando la pagina prima di ogni script:

| Cosa ho cercato | Esito |
|---|---|
| GSAP / TweenMax / TimelineMax / ScrollTrigger | **assente** |
| `Element.animate()` (WAAPI) durante l'intro | **0 chiamate** (patchato `Element.prototype.animate`) |
| Rimozione del `.cover` dal DOM | **mai** (`MutationObserver` su tutto il documento) |
| `sessionStorage` / `localStorage` | **0 accessi**, storage vuoto a fine caricamento |
| Cookie di gating | nessuno |
| `clip-path` / `mix-blend-mode` sull'intro | non usati |
| `transform` sull'intro al primo caricamento | non usato |
| `requestAnimationFrame` | presente nei bundle, ma solo in lazysizes/jQuery/Swup/complianz — **non per l'intro** |

Le librerie presenti (Swup per le transizioni di pagina, lazysizes, infinite-scroll, Complianz) non
toccano l'intro al primo caricamento. Esiste una regola `html.to-homepage .cover { transform: translateY(0);
transition: transform .5s ease }` ma appartiene alle **transizioni di navigazione interna** con Swup,
non all'apertura — fuori scope.

### → Conclusione sullo stack

**L'intro è 100 % CSS.** GSAP non serve e sarebbe ingiustificato: un `@keyframes` con un solo cubic-bezier
è riproducibile in modo identico al pixel. In Fase 2 userò CSS puro, con un filo di JS solo per
`prefers-reduced-motion` e per togliere il cover dal flusso a fine animazione.

### Nessun gating di sessione

L'intro **parte a ogni caricamento**, senza eccezioni. Non ho dovuto forzare alcun replay.
(Se in Fase 2 vuoi il comportamento "una volta per sessione", è una funzionalità da aggiungere, non da
replicare.)

---

## 9. Stato finale preciso

- `.cover`: `opacity: 0`, congelata da `fill: forwards`, ancora nel DOM, `pointer-events: none`,
  `z-index: 1200`. Nessuna trasformazione: posizione e scala restano identiche a quelle iniziali —
  **il testo non si sposta mai**, sparisce e basta.
- La pagina sotto non ha ricevuto nessuna animazione d'ingresso coordinata con il fade. Le uniche
  animazioni concorrenti sono i fade-in individuali delle immagini lazy-loaded
  (`opacity 300ms cubic-bezier(0, 0.95, 0.44, 1)`, stesso easing) che partono quando ciascuna immagine
  decodifica, in modo indipendente dall'intro.

---

## 10. Cosa NON sono riuscito a determinare con certezza

1. **L'insieme completo della palette.** Ho osservato 5 coppie su 22 caricamenti; la logica di scelta è
   server-side e non ispezionabile. Potrebbero essercene altre più rare.
2. **Se la palette sia davvero casuale o ruoti su un criterio** (ora, IP, contatore). Le mie richieste
   erano ravvicinate e da un solo IP.
3. **L'identità esatta del webfont.** Il file è servito come `font.woff2` senza metadati nel nome e la
   `font-family` dichiarata è la stringa generica `neuehaas`. È della famiglia Neue Haas Grotesk /
   Helvetica, ma non posso dire quale taglio esatto senza ispezionare le tabelle del font — cosa che
   non ho fatto perché comunque non è riutilizzabile sul tuo dominio.
4. **Il comportamento a viewport molto basso** (`height < 300px`), dove il tema ha media query dedicate
   che non ho campionato.
5. **Il valore di `min-height: 100lvh` su iOS Safari reale.** L'ho misurato in Chromium, dove `lvh`
   coincide con l'altezza del viewport; su Safari mobile con barra dinamica il comportamento di `lvh`
   è per definizione diverso da `vh` ma non ho potuto testarlo su dispositivo.

---

## 11. File prodotti

```
_analysis/
├── REPORT.md                    ← questo file
├── frames/desktop/              61 frame PNG, t_0000ms … t_6000ms (step 100ms) + opacity.json
├── frames/mobile/               61 frame PNG idem a 390×844
├── cover.desktop.json           struttura, geometria, tipografia, keyframes, 131 custom properties
├── cover.mobile.json            idem a 390×844
├── timing.desktop.json          357 campioni a rAF di opacity/startTime + paint & navigation timing
├── timeline.desktop.json        cattura wall-clock con stato di tutte le animazioni della pagina
├── palette-samples.json         22 letture di --cover-bck / --cover-txt
├── breakpoint-sweep.json        griglia e tipografia su 13 larghezze da 390 a 1800px
├── storage.desktop.json         session/local storage e cookie a fine caricamento (vuoti)
└── sidebyside/                  confronti originale/replica prodotti in Fase 3
```

> Durante l'analisi ho scaricato in `_analysis/raw/` il CSS e il JS del tema originale come riferimento
> di misura. **È stata cancellata a fine Fase 1**: nel repository restano solo le mie misurazioni.
> Anche `frames/` (380 screenshot, in gran parte del sito altrui) resta in locale, esclusa via `.gitignore`.

---

## 12. Cosa serve da te prima della Fase 2

### A. Contraddizione nel brief sul testo — devo sapere quale vale

- L'intestazione del task dice: sostituire il wordmark con **tre** testi — `andre`, `sito personale`,
  `2026` — «allineate a quelle del sito originale» (cioè le tre colonne).
- Il punto 2 della Fase 2 dice: **solo** `andre`, allineato a sinistra, «nessun altro testo, nessun 2026,
  nessuna tagline».

Le due versioni portano a risultati diversi. Ti chiedo quale intendi.

### B. Colore della cover

Il sito originale non ha un colore "giusto" da copiare: ne estrae uno a caso tra i 5 della tabella §7.
Devo sapere se vuoi un colore fisso (quale) o la stessa randomizzazione.

### C. Il tuo stato finale

La tua home è bianca con le icone-cartella. L'intro atterrerà su quella così com'è: il cover svanisce e
sotto c'è già la tua home montata. Confermi che non vuoi nessuna modifica alla home attuale?

---

**Fase 1 conclusa. Attendo la tua conferma prima di scrivere codice.**
