# EXTRACTED_PARAMS — oklama.com homepage

Fonte: bundle reali scaricati il 2026-07-17 da https://oklama.com/
- HTML SSR: `oklama.com/` (build Next.js `9dLLZsmhGcvG9sAYd3R7q`)
- Logica homepage: `/_next/static/chunks/pages/index-830153a7483262b6.js` (modulo 8226)
- Componente drag "Folders": `/_next/static/chunks/787-bdbf6e75789edb0a.js` (modulo 9858)
- CSS: `/_next/static/css/d291c0c2a5f69739.css` (Tailwind con config custom)
- Modal: Headless UI `Dialog` (modulo 7533, chunk `113-03130541d3b0e3ac.js`)

Nessuna libreria di animazione (niente GSAP / framer-motion / react-spring) e
**zero `requestAnimationFrame`** nel codice della pagina (i 6 match di rAF sono
interni a React/Next, non alla logica di interazione). Nessuna `transition` CSS
in tutto il foglio di stile: ogni cambio di stato è istantaneo.

---

## 1. Meccanica di interazione delle immagini ("folders")

**Draggabili sì, MA SENZA FISICA.** Il codice reale non ha lerp, friction,
damping, spring, velocity o momentum: il posizionamento è diretto 1:1 col
puntatore, aggiornato sull'evento `mousemove`/`touchmove` (nessun rAF loop).

Valori esatti dal modulo 9858:

| Parametro | Valore | Origine nel sorgente |
|---|---|---|
| Soglia attivazione drag | distanza euclidea `< 4` px → nessun drag | `if (Math.sqrt(m*m + A*A) < 4) return;` |
| Lerp factor | **assente** (posizione = puntatore, nessuna interpolazione) | `a.style.left = (100*d)+"%"` sync nell'handler |
| Friction / momentum al rilascio | **assenti** (l'elemento si ferma dove lo lasci) | nessun codice post-release |
| Formula posizione | `left% = clamp(dx + rectX, 0, containerW) / containerW * 100` (idem top con H) | `d = Math.min(t.offsetWidth, Math.max(0, m + s)) / t.offsetWidth` |
| Riferimento | `dx = clientX - clientX_iniziale`; `rectX = getBoundingClientRect().x` al grab (angolo alto-sx dell'elemento) | handler `mousedown`/`mousemove` |
| Contenitore di clamp | div `position:absolute; top:0; left:0; bottom:90px; right:90px` (viewport meno 90px a destra e in basso → un folder largo/alto 90px non esce mai dallo schermo) | classi `bottom-[90px] right-[90px]` |
| Pulsante mouse | drag solo con tasto sinistro (`e.button === 0`); l'outline di selezione viene applicato con qualunque tasto | `!f(t,MouseEvent) \|\| 0===t.button` |
| Multi-touch | `touches.length > 1` annulla/ignora il drag | check in tutti gli handler touch |
| Eventi usati | `mousedown`/`touchstart` (window), `mousemove`/`touchmove` (window, touchmove `{passive:false}` + `preventDefault` durante il drag), rilascio su **`click` in fase capture** + `touchend` (window) | `addEventListener("click", y, !0)` |
| Dopo un drag | `preventDefault()` sul click → la navigazione del link folder NON scatta | in handler di rilascio se `dragging` |

**Selezione (outline):** al `mousedown`/`touchstart` su un elemento con
`data-drag` → `outline: 2px dotted black` (inline style). L'outline resta dopo
il rilascio e viene rimosso (`outline: none`) al successivo mousedown altrove.

**Persistenza:** posizioni salvate in `localStorage` chiave **`"ok3"`**, formato
`{"<pathname>": [[x,y]|null, ...]}` con x/y frazioni 0–1 indicizzate per
`data-index`. Al mount la pagina rilegge e riapplica (validazione: array di
`null` o `[number, number]`). NB dal sorgente: il salvataggio riscrive l'oggetto
con **solo** il pathname corrente (`JSON.stringify({[location.pathname]: arr})`).

## 2. Logica di stacking (z-index)

Contatore intero che parte da **1**; a ogni grab (`mousedown`/`touchstart` con
tasto valido su un folder): `el.style.zIndex = String(i++)`. Quindi l'elemento
preso passa sempre davanti a tutti; nessun riordino al rilascio. (Sorgente:
`var i = 1; ... m.style.zIndex = String(i++)`.)

## 3. Posizionamento iniziale — FISSO, non random

Coordinate frazioni (x, y) dal chunk index, applicate come `left`/`top` in % del
contenitore (angolo alto-sinistra dell'elemento):

| index | elemento | x | y | href originale | stile icona |
|---|---|---|---|---|---|
| 0 | "nu thoughts" | 0.65 | 0.75 | `/nuthoughts` | Default (default.png 32×32) |
| 1 | (senza nome, label = U+200B) | 0.55 | 0.15 | `/master` | Black (black.png 32×32) |
| 2 | (senza nome, label = U+200B) | 0.18 | 0.48 | `/step` | Gray (gray.png 32×32) |
| 3 | icona immagine | 0.5 | 0.5 | — (nessun link, `onClick` → modal) | Image (`/mm.jpg` 168×168) |

Render SSR: `top:75%;left:65%`, `top:15%;left:55.00000000000001%`,
`top:48%;left:18%`, `top:50%;left:50%` (il float è l'output JS di `100*0.55`).

Ogni item: `width:90px` (il n.3 anche `height:90px`), icone `<img>` renderizzate
a **64×64** (il n.3 a **84×84**) con `image-rendering: pixelated`, label in
`<span>` con `background:#fff`, `draggable="false"` su tutto,
`-webkit-touch-callout:none` inline.

## 4. Comportamento al click sulle immagini

Nessun cycling. Item 0–2 = link a pagine interne (dopo drag il click è
soppresso da `preventDefault`). Item 3 = `onClick` che apre una **modal**
(Headless UI Dialog, prop `static`):

- overlay: `position:fixed; inset:0; background:rgba(0,0,0,.5); z-index:40`
- wrapper panel: `position:fixed; inset:0; flex; items-center; justify-center; z-index:40`
- panel: `background:#fff; max-height e max-width = calc(min(100vh,100vw,800px) - 32px)`
- contenuto: immagine 3000×3000 (`mm.88f5fe45.jpg`, ratio 1:1) via next/image `priority`
- chiusura: `Escape`, click fuori dal panel (overlay), nessuna animazione (block/hidden)
- guard: l'onClick NON scatta se il click era `defaultPrevented` (cioè dopo un drag)

## 5. Hover states sui link

- Colore base testo nav/social: `rgba(0,0,0,.5)` (`text-black/50`)
- Hover: `color: rgb(205 63 37)` (**#cd3f25**) su tutti i link e sul bottone store
- **Nessuna transizione**: cambio colore istantaneo (0 regole `transition` nel CSS)
- Nessun cambio di opacità/underline; `a { text-decoration: inherit }` (preflight)
- Link nav: `display:block; padding:.25rem` (`p-1`)

## 6. Bottone "store →" (dropdown)

Sì, espande in dropdown con "music store" e "eu/uk store". **Nessuna
animazione di apertura**: toggle secco `hidden` ↔ visibile (quando aperto le
classi `grid`+`block` coesistono e vince `.grid`, che nel CSS viene dopo →
`display:grid`).

Logica esatta (chunk index):

| Trigger | Effetto |
|---|---|
| click sul bottone | apre subito (e cancella eventuale timer di chiusura) |
| `mouseenter` bottone | apre subito + `console.log("enter wrapper")` (sic, presente in produzione) |
| `mouseleave` bottone | chiude dopo **200 ms** (`setTimeout(..., 200)`) + `console.log("leave wrapper")` |
| `mouseenter` dropdown | riapre/cancella il timer |
| `mouseleave` dropdown | chiude **immediatamente** (delay 0) |
| click su un link del dropdown | chiude immediatamente |
| `pointerdown` (capture, window) fuori dal wrapper | chiude immediatamente |

Label: chiuso `store →` (U+2192), aperto `store ↓` (U+2193), con spazio dopo
"store".

Stile dropdown: `position:absolute; top:100%; left:-0.25rem;
margin-left:-2px; margin-right:-2px; border:2px solid #000; background:#fff;
display:grid; padding-block:0.25rem; box-shadow:4px 4px 0 rgba(0,0,0,0.25)`.
Voci: `white-space:nowrap; padding:0.25rem 0.5rem; display:block`, stesso hover
#cd3f25.

## 7. Responsive / touch / mobile

- Nessun breakpoint per la homepage: layout identico a ogni viewport (posizioni
  in %, contenitore = viewport − 90px dx/basso). Al resize i folder riflowano
  proporzionalmente (le % restano).
- Touch: drag con singolo dito (stessa soglia 4px), `touchmove` con
  `{passive:false}` + `preventDefault` per bloccare lo scroll durante il drag;
  multi-touch annulla.
- Long-press 800 ms + context-menu custom esistono nel componente ma SOLO con
  prop `context`, che la homepage NON passa → inattivi sulla homepage.
- `user-select: none` sull'intero layer dei folder; `-webkit-touch-callout:none`
  sui singoli item. Il testo di nav e social NON ha select-none.

## 8. Font

- `@font-face`: **JetBrains Mono** Regular 400 (woff2 + woff, self-hosted) —
  font open-source (OFL)
- `html` ha classi `h-full font-mono` → `font-family: JetBrains Mono, monospace`
  su tutto
- `body`: `min-h-full flex flex-col text-sm`
- **`text-sm` è custom**: `font-size: 0.8125rem; line-height: 1.1rem`
  (≠ default Tailwind 0.875rem/1.25rem)
- Nessun letter-spacing custom, weight solo 400

## 9. Layout esatto

- Nav top: `position:fixed; top:1.75rem; left:1.75rem; right:1.75rem;
  z-index:30; display:flex; justify-content:space-between;
  color:rgba(0,0,0,.5); pointer-events:none` con figli `pointer-events:auto`.
  Ordine: `music` (link esterno) — `store →` (button in wrapper
  `position:relative`) — `tour` (link interno)
- Social bottom: wrapper `position:fixed; bottom:2rem; left:0; right:0;
  height:0; display:flex; justify-content:center; align-items:center;
  z-index:30`; inner `position:absolute; bottom:0; color:rgba(0,0,0,.5)`.
  Separatore testuale ` / `. Originale: twitter / instagram / facebook /
  youtube, tutti `target="_blank" rel="noreferrer"`
- Layer folders: `position:absolute; inset:0; overflow:hidden;
  user-select:none; z-index:10`
- `theme-color: #ffffff`, `msapplication-TileColor: #da532c`, title `oklama`
- Sfondo pagina: bianco (nessun background impostato → default), testo nero
- Cursor: default UA (`pointer` sui link/button, `cursor-pointer` esplicito
  sull'item immagine n.3); nessun cursor custom durante il drag

## 10. Extra rilevati

- Google Analytics `G-8TZJQZSM1R` in `_app` (non replicato)
- I due `console.log` ("enter wrapper"/"leave wrapper") sono nel bundle di
  produzione e visibili in console: replicati per fedeltà
- Icone folder originali: PNG 32×32 (default/black/gray + white e una GIF non
  usati in homepage); `/mm.jpg` 168×168; immagine modal 3000×3000

---

# PAGINA /nuthoughts

Fonte: HTML SSR di `oklama.com/nuthoughts` + chunk
`/_next/static/chunks/pages/nuthoughts-30b692efc33d97e9.js` (modulo 5748),
stesso CSS `d291c0c2a5f69739.css`. Scaricati il 2026-07-17.

## Comportamento

**Pagina 100% statica.** Nel chunk della pagina: zero `addEventListener`, zero
`requestAnimationFrame`, nessun drag, nessun hover custom, nessuna animazione.
Gli unici elementi interattivi sono link nativi. Niente nav top, niente social,
niente folders.

## Struttura e valori esatti

- `<title>nu thoughts</title>`; html/body con le stesse classi del resto del
  sito (`h-full font-mono` / `min-h-full flex flex-col text-sm`)
- styled-jsx inline in `<head>`: `body{background:black;color:white}` —
  UNICA differenza cromatica rispetto alla homepage
- Header: div `p-6 pb-4 flex items-center` (padding 1.5rem, pb 1rem)
  - link `←` (U+2190) a `/` via next/link, classe `pr-1.5` (padding-right .375rem)
  - span data: `ml-3 text-xs` → margin-left .75rem; **`text-xs` custom:
    `font-size:.625rem; line-height:1rem`** (≠ default Tailwind .75rem);
    testo `august 20 2021`
- Contenuto: div `prose mx-6 pb-6 max-w-[440px]`
  - **`.prose` custom del sito**: `color:inherit; max-width:65ch;
    font-size:inherit; line-height:1.1rem` — NON i default del plugin
    typography (nessun grigio, nessun 1rem/1.75). Il testo resta quindi
    0.8125rem JetBrains Mono bianco su nero
  - `max-w-[440px]` (utility dopo `.prose` nel CSS) vince su 65ch → 440px
  - paragrafi: `margin-top:1.3em; margin-bottom:1.3em` (regola custom,
    default plugin sarebbe 1.25em); primo figlio `margin-top:0`, ultimo
    `margin-bottom:0`
  - i paragrafi originali usano NBSP (U+00A0) prima dell'ultima parola per
    evitare orfane (dettaglio tipografico del sorgente)
- Immagine in fondo, dentro il contenitore prose: div `flex justify-center
  my-5` (margini 1.25rem, che vincono sul `margin-bottom:0` di `:last-child`
  perché la utility viene dopo nel CSS); next/image `layout=intrinsic`
  reso **210×140**, file sorgente `IMG_3419.b3db22c6.jpeg` **2400×1600**
  (ratio 3:2). Intrinsic = larghezza max 210px, si restringe se il
  contenitore è più stretto
- Nessun `user-select:none`: il testo è selezionabile
- Meta identici al resto del sito (theme-color #ffffff ecc.)

## Contenuto nella replica

- Il testo della lettera originale e la foto sono contenuti protetti da
  copyright: NON copiati. Il testo della replica proviene dal file fornito
  dall'utente (`content:nuthoughts.rtf`, brano di Antonio Tabucchi con
  attribuzione); la foto è un placeholder 2400×1600 stesso ratio
- Data `august 20 2021` e title `nu thoughts` mantenuti 1:1 (stringhe di
  interfaccia/fatti, modificabili a piacere)

## NON TROVATO — stime (pagina /nuthoughts)

- Nessuna: tutti i valori provengono dal chunk o dal CSS. L'unica
  approssimazione è il markup di next/image (spans wrapper con stili inline),
  sostituito da un semplice `<img>` con lo stesso risultato visivo
  documentato (210×140 max, ratio conservato, centrato)

## NON TROVATO — stime

- Comportamento con **focus da tastiera / focus-trap** della modal Headless UI:
  non estratto istruzione per istruzione dal chunk 113 (libreria); replicati i
  comportamenti osservabili documentati (Escape, click fuori). STIMA: fedele.
- `scroll-lock` della modal: gestito internamente da Headless UI; la pagina non
  ha scroll, effetto non osservabile. STIMA: irrilevante.
- Ordine z quando due folder hanno lo stesso z-index iniziale (nessuno inline
  al load): vale l'ordine del DOM (0,1,2,3 → l'ultimo sopra). Derivato dalle
  regole CSS standard, non da codice esplicito.
