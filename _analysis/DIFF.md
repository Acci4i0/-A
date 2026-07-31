# FASE 3 — Confronto originale vs replica

Metodo: entrambe le pagine caricate nello stesso Chromium, DPR 2, cache disabilitata; **tutte le
animazioni messe in pausa e seekate agli stessi timestamp** (0 → 6000 ms, step 100 ms) invece che
campionate a wall-clock. Così il confronto non dipende dalla latenza di rete né dal carico della
macchina: allo stesso `currentTime` corrisponde lo stesso frame, sempre.

Per isolare layout e timing dal colore, entrambe le pagine sono state forzate sulla stessa coppia
`#dd3333` / `#ffffff` (l'originale randomizza la palette a ogni load — vedi REPORT.md §7).

Dati grezzi: `verification.json`. Immagini: `sidebyside/` (**sinistra = originale, destra = replica**).

---

## 1. Il numero che conta: la curva di opacità

| | desktop 1440×900 | mobile 390×844 |
|---|---|---|
| Frame confrontati | 61 | 61 |
| **Delta massimo di opacità** | **0** | **0** |

Zero. Non "arrotondato a zero": i due valori `getComputedStyle().opacity` coincidono cifra per cifra
su tutti e 61 i campioni, in entrambi i viewport. Era atteso — la replica usa lo stesso identico
`cubic-bezier(0, 0.95, 0.44, 1)` con gli stessi 2000 ms di delay e 1000 ms di durata — ma è la
verifica che chiude il punto.

Valori condivisi durante il fade:

| t (ms) | 2000 | 2100 | 2200 | 2300 | 2400 | 2500 | 2600 | 2700 | 2800 | 2900 | 3000 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| opacity (entrambi) | 1.0000 | 0.3870 | 0.2266 | 0.1366 | 0.0810 | 0.0458 | 0.0239 | 0.0109 | 0.0038 | 0.0007 | 0.0000 |

Frame affiancati a t = 0: `sidebyside/desktop_t0000ms.png`, `sidebyside/mobile_t0000ms.png`.
Quelli durante il fade (2000 → 3000 ms) sono generati in locale ma **non committati**: scoprendo
progressivamente la home del sito di riferimento, ne riprodurrebbero il contenuto in un repo pubblico.

---

## 2. Box del cover

Confrontate 9 proprietà calcolate. **Tutte identiche**, su entrambi i viewport:

| Proprietà | Originale | Replica | Δ |
|---|---|---|---|
| `position` | `fixed` | `fixed` | — |
| `inset` | `0px 0px 0px 0px` | `0px 0px 0px 0px` | — |
| dimensione (desktop) | `1440px × 900px` | `1440px × 900px` | — |
| dimensione (mobile) | `390px × 844px` | `390px × 844px` | — |
| `min-height` | `900px` / `844px` | `900px` / `844px` | — |
| `z-index` | `1200` | `1200` | — |
| `background-color` | `rgb(221, 51, 51)` | `rgb(221, 51, 51)` | — |
| `color` | `rgb(255, 255, 255)` | `rgb(255, 255, 255)` | — |
| `pointer-events` | `none` | `none` | — |
| `transform` | `none` | `none` | — |

---

## 3. Griglia e posizione del testo

### Desktop 1440×900

| Misura | Originale | Replica | Δ |
|---|---|---|---|
| `margin-top` della riga | 450px | 450px | **0** |
| `padding-inline` della riga | 3px | 3px | **0** |
| Origine box colonne | 3 / 481 / 959 | 3 / 481 / 959 | **0 / 0 / 0** |
| **Origine testo (ink.x)** | **6 / 484 / 962** | **6 / 484 / 962** | **0 / 0 / 0** |
| Colonne visibili | 3 | 3 | — |

### Mobile 390×844

| Misura | Originale | Replica | Δ |
|---|---|---|---|
| `margin-top` della riga | 422px | 422px | **0** |
| `padding-inline` della riga | 4px | 4px | **0** |
| Origine testo wordmark | 8 | 8 | **0** |
| **Bordo destro dell'anno** | **382** | **382** | **0** |
| Colonne visibili | 2 (tagline nascosta) | 2 (tagline nascosta) | — |
| Tagline centrale | `display: none` | `display: none` | — |

Nota su una differenza *strutturale che non produce differenza visiva*: su mobile l'originale spinge
l'anno a destra con `margin-left: auto` dentro un flex, quindi il suo box si stringe attorno al testo
(x = 340.14, w = 45.86). La replica usa una cella di griglia piena con `text-align: right`
(x = 195, w = 191). I box hanno origini diverse, ma **il testo renderizzato finisce esattamente allo
stesso pixel** (bordo destro 382 in entrambi), che è ciò che si vede.

---

## 4. Tipografia

| Proprietà | Originale | Replica | Δ |
|---|---|---|---|
| `font-size` desktop | 14px | 14px | **0** |
| `font-size` mobile | 15px | 15px | **0** |
| `line-height` | 14px / 15px (= 1.0) | 14px / 15px (= 1.0) | **0** |
| `font-weight` | 400 | 400 | **0** |
| `letter-spacing` | normal | normal | **0** |
| `font-family` | `neuehaas` (webfont proprietario) | stack Helvetica di sistema | **sostituito** |

Breakpoint replicati e verificati: 15px/gutter 4px sotto 667px, fluido `8px → 15px` tra 667 e 1280px
(interpolazione lineare ricavata da 4 punti misurati), 14px tra 1281 e 1620px, 18px sopra.

---

## 5. Allineamento al pixel — misurato sui glifi, non sui box

`2026` è l'unica stringa **identica** nelle due pagine, quindi è il controllo pulito. Ho estratto il
bounding box dell'inchiostro direttamente dai PNG, contando i pixel diversi dallo sfondo.

### Prima della correzione

| | left | top | **bottom (baseline)** | cap-height |
|---|---|---|---|---|
| desktop Δ | +1px | +2px | **+3px** | +1px |
| mobile Δ | +1px | +1px | **+3px** | +2px |

Il testo della replica poggiava **3px più in basso**. Causa: con `line-height: 1` la posizione della
baseline dipende da `ascent`/`descent` dichiarati nel font, e il fallback Helvetica ha metriche
diverse dal webfont originale. Non è un errore di layout — i box coincidevano già perfettamente.

### Correzione applicata

Una singola costante nominata, espressa in `em` così da restare corretta a ogni breakpoint:

```css
--intro-baseline-nudge: -0.21em;   /* applicata come translateY sulla riga */
```

### Dopo la correzione

| | left | top | **bottom (baseline)** | cap-height | larghezza |
|---|---|---|---|---|---|
| desktop Δ | +1px | −1px | **0px** | +1px | −2px |
| mobile Δ | +1px | −2px | **0px** | +2px | −1px |

**Baseline allineata esattamente su entrambi i viewport.** I residui (±1–2px di altezza delle maiuscole,
1px di sidebearing sinistro, 1–2px di larghezza complessiva) sono la firma del disegno del carattere
sostituito: le cifre di Helvetica sono leggermente più alte e strette di quelle del webfont originale.
Non sono eliminabili senza il font originale, che è sotto licenza del loro dominio e non è
ridistribuibile.

Ispezione visiva: `sidebyside/desktop_row_zoom.png` e `sidebyside/mobile_row_zoom.png` (riga di testo
ritagliata e ingrandita 2× / 3× con interpolazione nearest-neighbor).

---

## 6. Comportamento a runtime della replica

Misurato in tempo reale, **senza seeking**, campionando a ogni `requestAnimationFrame`:

| Verifica | Atteso | Misurato | Esito |
|---|---|---|---|
| Hold prima del fade | 2000ms | 1997ms dal first paint | ✅ |
| Durata del fade | 1000ms | 1002ms | ✅ |
| Opacità finale | 0 | 0 | ✅ |
| `prefers-reduced-motion: reduce` | stato finale immediato | `opacity: 0`, `animation-name: none`, **0 animazioni attive** già al load | ✅ |
| FOUC | nessuno | cover già `fixed`, colorata e con font risolto al `DOMContentLoaded` | ✅ |
| Richieste webfont per l'intro | 0 | **0** (stack di sistema) | ✅ |
| Palette randomizzata | 5 coppie | 5 su 5 osservate in 12 caricamenti | ✅ |
| Proprietà animate | solo `opacity` | solo `opacity` | ✅ |

L'ultima riga è il requisito dei 60fps: l'unica proprietà animata è `opacity`, che il compositore
gestisce senza layout né paint. Il `translateY` della correzione baseline è statico, non animato.
A fine animazione il cover riceve `visibility: hidden` e `will-change: auto`, così non resta un layer
di composizione a tutto schermo attivo per il resto della sessione.

---

## 7. Riepilogo: cosa resta diverso

| Differenza | Origine | Eliminabile? |
|---|---|---|
| Le parole (`andre` / `sito personale` vs le loro) | **richiesto** | — |
| Larghezza dei glifi, cap-height ±1–2px, sidebearing 1px | font proprietario non ridistribuibile | no |
| Contenuto sotto al cover | è la tua home, non la loro | — |

Nessuna differenza residua in **timing, easing, curva di opacità, geometria, colori, breakpoint o
posizione del testo**. L'obiettivo della Fase 3 — «iterare finché le differenze sono solo il contenuto
testuale» — è raggiunto, con l'unica eccezione dichiarata della sostituzione del carattere, che è un
vincolo di licenza e non una scelta implementativa.

---

## 8. Nota sui file di analisi

`_analysis/raw/` conteneva CSS e JS del tema originale, scaricati solo come riferimento di misura:
**è stata cancellata** e non entra nel repository. `_analysis/frames/` (380 screenshot, 14 MB) e i
frame affiancati durante il fade restano in locale, esclusi via `.gitignore`: sono in gran parte
riproduzioni del sito di riferimento e non vanno ripubblicate.

Nel repository restano le misurazioni in JSON, i due report, i due ritagli ingranditi della riga di
testo che documentano il delta tipografico e i due frame a t = 0 (cover piena, nessun contenuto della
pagina sottostante visibile).
