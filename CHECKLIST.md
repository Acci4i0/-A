# CHECKLIST — verifica replica vs oklama.com

Confronto per ogni comportamento estratto in EXTRACTED_PARAMS.md.
✅ = replicato con gli stessi valori del bundle · ⚠️ = differente, con motivo.

## Drag dei folder

| Comportamento | Stato |
|---|---|
| Nessuna fisica: posizione 1:1 col puntatore, niente lerp/inerzia/momentum | ✅ (nessun rAF, update su mousemove/touchmove come l'originale) |
| Soglia attivazione drag: distanza euclidea < 4px | ✅ (`Math.sqrt(dx*dx+dy*dy) < 4`) |
| Formula: `left% = clamp(dx + rect.x, 0, W) / W * 100` (idem Y) | ✅ identica, riferita a `getBoundingClientRect()` al grab |
| Area di clamp: viewport − 90px destra/basso | ✅ (`.folders-area` con `bottom:90px; right:90px`) |
| Drag solo tasto sinistro; outline con qualunque tasto | ✅ (`e.button === 0` solo per il grab) |
| Multi-touch annulla/ignora il drag | ✅ (`touches.length > 1`) |
| Rilascio mouse su evento `click` in fase capture + `touchend` | ✅ stessi listener sugli stessi target (window) |
| `touchmove` con `{passive:false}` + `preventDefault` durante il drag | ✅ |
| Dopo un drag il click non naviga (`preventDefault`) | ✅ |
| Outline selezione `2px dotted black`, rimosso al mousedown successivo altrove | ✅ inline style, stessa stringa |
| z-index: contatore da 1, `String(i++)` a ogni grab (anche semplice click) | ✅ |
| Persistenza `localStorage["ok3"]` = `{pathname: [[x,y]|null,...]}`, riscrittura con solo pathname corrente, validazione al load | ✅ stesso formato, stessa validazione, riapplicata al load |
| Posizioni iniziali fisse (0.65,0.75) (0.55,0.15) (0.18,0.48) (0.5,0.5) | ✅ inline style identici al render SSR (incluso `55.00000000000001%`) |
| Item: w 90px, icone 64×64 (immagine 84×84), `image-rendering:pixelated`, label span bg bianco, U+200B sui folder senza nome, `draggable=false`, `-webkit-touch-callout:none` | ✅ |
| Long-press 800ms + context-menu custom | ✅ non implementati: nel sorgente sono attivi solo con prop `context`, che la homepage non passa (inattivi anche sull'originale) |
| Click su folder senza drag → naviga a /nuthoughts, /master, /step | ⚠️ resi inerti (`preventDefault`): le pagine interne non fanno parte della replica homepage. Aspetto, cursore e soppressione post-drag identici |

## Item immagine centrale + modal

| Comportamento | Stato |
|---|---|
| Click apre modal; NON si apre se il click segue un drag (`defaultPrevented`) | ✅ stessa guardia |
| Overlay `rgba(0,0,0,.5)` z-40, panel bianco centrato, max w/h `calc(min(100vh,100vw,800px) − 32px)` | ✅ stessi valori |
| Apertura/chiusura senza animazione (block/hidden) | ✅ |
| Chiusura: Escape e click fuori dal panel | ✅ |
| Focus-trap / attributi ARIA / scroll-lock di Headless UI Dialog | ⚠️ non replicati: interni di libreria, segnalati in EXTRACTED_PARAMS come "NON TROVATO — stima"; nessun effetto osservabile (la pagina non scrolla e il panel non ha elementi focusabili) |
| Immagine modal 3000×3000 (ratio 1:1) | ⚠️ placeholder 1500×1500, stesso ratio 1:1 (peso file; sostituibile con qualunque quadrato, resa identica perché scala al panel) |

## Nav top

| Comportamento | Stato |
|---|---|
| `fixed top/left/right 1.75rem`, z-30, flex space-between, testo `rgba(0,0,0,.5)` | ✅ |
| Link `display:block; padding:.25rem`, hover `#cd3f25` istantaneo (zero transition nel CSS originale) | ✅ nessuna transition |
| "music" → link esterno | ⚠️ reso inerte su richiesta (stessi stili/hover) |
| "tour" → pagina interna (next/link) | ⚠️ reso inerte su richiesta; la client-side navigation di Next è comunque irrilevante senza navigazione |

## Dropdown store

| Comportamento | Stato |
|---|---|
| Apre su click e su mouseenter del bottone (immediato) | ✅ |
| Chiude 200ms dopo mouseleave del bottone (`setTimeout 200`) | ✅ |
| mouseenter dropdown annulla il timer; mouseleave dropdown chiude subito (delay 0) | ✅ |
| Click su voce del dropdown chiude subito | ✅ |
| `pointerdown` in capture fuori dal wrapper chiude subito | ✅ |
| Label `store →` ↔ `store ↓` (U+2192/U+2193, spazio dopo "store") | ✅ |
| Nessuna animazione: toggle hidden ↔ display:grid | ✅ (nell'originale vince `.grid` su `.block` per ordine nel CSS) |
| Stile: `top:100%; left:-.25rem; margin-x:-2px; border 2px #000; bg white; padding-y .25rem; shadow 4px 4px 0 rgba(0,0,0,.25)`; voci `nowrap, .25rem .5rem` | ✅ stessi valori |
| `console.log("enter wrapper")` / `console.log("leave wrapper")` presenti in produzione | ✅ replicati (visibili in console come sull'originale) |
| Voci "music store" / "eu/uk store" → store esterni | ⚠️ href rimossi su richiesta; il dropdown si apre/chiude comunque con la logica originale |

## Social bottom

| Comportamento | Stato |
|---|---|
| `fixed bottom:2rem`, wrapper h-0 flex centrato, inner `absolute bottom-0`, testo `rgba(0,0,0,.5)`, separatore testuale ` / `, hover `#cd3f25` | ✅ |
| twitter / instagram / facebook / youtube | ⚠️ sostituiti su richiesta con mail / instagram / github. instagram e github mantengono `target="_blank" rel="noreferrer"` come l'originale; mail è `mailto:` senza `target` (un `_blank` su mailto aprirebbe una tab vuota — unico scostamento, motivato) |

## Tipografia / base

| Comportamento | Stato |
|---|---|
| JetBrains Mono Regular 400 self-hosted (font OFL) | ✅ stesso file woff2 di produzione; ⚠️ omesso il fallback .woff (solo per browser pre-2016) |
| `text-sm` custom: `font-size:.8125rem; line-height:1.1rem` | ✅ |
| `html` h-full + font-mono; `body` min-h-full flex flex-col text-sm | ✅ |
| `user-select:none` solo sul layer folder; nav/social selezionabili | ✅ |
| Cursor: default UA, `pointer` su link/bottone e sull'item immagine | ✅ |
| `theme-color #ffffff`, `msapplication-TileColor #da532c` | ✅ meta replicati |
| Resize: posizioni in %, riflow proporzionale, nessun breakpoint | ✅ |
| Title "oklama", favicon/apple-touch-icon, og:image | ⚠️ title "oklama replica" e nessuna favicon: sono asset/identità del brand, deliberatamente non copiati |
| Google Analytics (G-8TZJQZSM1R) | ⚠️ non replicato: tracking di terzi, nessun effetto visivo |

## Immagini (sostituite su richiesta)

| Originale | Placeholder | Dimensioni |
|---|---|---|
| default.png 32×32 | `assets/folder-default.png` | 32×32 ✅ |
| black.png 32×32 | `assets/folder-black.png` | 32×32 ✅ |
| gray.png 32×32 | `assets/folder-gray.png` | 32×32 ✅ |
| /mm.jpg 168×168 | `assets/icon-168.png` | 168×168 ✅ |
| mm.88f5fe45.jpg 3000×3000 | `assets/modal-1500.png` | 1500×1500, ratio 1:1 ⚠️ (vedi sopra) |

Per sostituire: stessa risoluzione (o superiore, stesso ratio); i folder a 32×32
sono voluti — vengono upscalati 2× con `image-rendering:pixelated` come
sull'originale.

*(Nota struttura file: `index.html` è il desktop (pagina d'atterraggio);
`nuthoughts.html` è la replica di `/nuthoughts`. Il folder "nu thoughts"
naviga a `nuthoughts.html` come nell'originale naviga a `/nuthoughts`.)*

**Personalizzazioni richieste dall'utente (deviazioni volute dall'originale):**
- folder 0 "nu thoughts": icona grigia (era gialla)
- folder 2: icona azzurra (stile cartelle Apple, stesso dither pixel-art),
  link a https://acci4i0.github.io/3Dgallery/, sottotitolo "alcune foto"
- folder 4 (nuovo): azzurro, https://acci4i0.github.io/2Dgallery/, "altre foto",
  posizione iniziale x 0.3 / y 0.78
- folder 5 (nuovo): azzurro, https://acci4i0.github.io/crossword/, "basic info",
  posizione iniziale x 0.8 / y 0.32
- i nuovi folder ereditano identici drag/z-index/persistenza (indici 4-5 in
  localStorage) e soppressione del click dopo drag

---

# PAGINA /nuthoughts (`nuthoughts.html`)

| Comportamento | Stato |
|---|---|
| Pagina statica: zero JS, zero animazioni, zero listener (verificato nel chunk) | ✅ nessuno script incluso |
| `body{background:black;color:white}` inline in `<head>` (styled-jsx) | ✅ stessa regola, stessa collocazione |
| Header `p-6 pb-4 flex items-center` (padding 1.5rem / pb 1rem) | ✅ |
| Link `←` (U+2190) con `pr-1.5` (.375rem) verso la homepage | ✅ (→ `home.html`, come l'originale → `/`) |
| Data `august 20 2021` in `ml-3 text-xs` con **text-xs custom .625rem/1rem** | ✅ stringa e metriche identiche |
| Contenitore `prose mx-6 pb-6 max-w-[440px]` | ✅ |
| `.prose` custom: `color:inherit; font-size:inherit; line-height:1.1rem; max-width` → 440px | ✅ stessi valori (niente default del plugin) |
| Paragrafi `margin: 1.3em 0`; primo `mt:0`, ultimo `mb:0` | ✅ |
| Testo selezionabile, nessun cursor custom, font JetBrains Mono 0.8125rem | ✅ |
| Immagine centrata `flex justify-center my-5`, resa intrinsic max 210×140, ratio 3:2, shrink su schermi stretti | ✅ stesse metriche via CSS (`width:210px; max-width:100%`) |
| Markup next/image (doppio span wrapper + spacer svg + blur placeholder) | ⚠️ sostituito da `<img>` semplice: artefatto di framework, risultato visivo identico (max 210×140 centrato); il blur-up placeholder di next/image non è replicato (lampo di blur solo al primissimo load su rete lenta) |
| Testo della lettera originale | ⚠️ NON copiato (contenuto protetto da copyright). Al suo posto il testo fornito da te in `content:nuthoughts.rtf` (brano di Tabucchi con attribuzione), reso con la stessa struttura a paragrafi. NB: il file contiene una riga isolata "S" tra il 1° e il 2° paragrafo — inclusa tale e quale, verifica se è voluta |
| Foto `IMG_3419` 2400×1600 | ⚠️ placeholder `assets/photo-2400x1600.png`, stesso ratio 3:2, stessa resa 210×140 — sostituiscila con una tua foto 3:2 |
| Title `nu thoughts`, meta theme-color | ✅ replicati (favicon/og-image del brand esclusi come per la homepage) |
| next/link client-side navigation per `←` | ⚠️ link normale: senza router SPA la navigazione è un load di pagina — visivamente equivalente |
