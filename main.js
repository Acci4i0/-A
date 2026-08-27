/* Replica del comportamento della homepage di oklama.com.
   Implementazione originale in vanilla JS dei parametri documentati in
   EXTRACTED_PARAMS.md (modulo "Folders" 9858 + chunk pages/index).
   Nessuna fisica: posizionamento diretto, soglia 4px, z-index incrementale,
   persistenza localStorage "ok3". */

(function () {
  "use strict";

  /* ========================= FOLDERS (drag) ========================= */

  var container = document.getElementById("folders-area");
  var STATE_KEY = "ok3";          // stateKey originale
  var PERSIST = true;             // prop persist: true

  var zCounter = 1;               // originale: var i = 1
  var active = null;              // elemento in presa
  var selected = null;            // elemento con outline
  var dragging = false;           // diventa true oltre la soglia di 4px
  var startClientX = 0, startClientY = 0;   // puntatore al grab
  var startRectX = 0, startRectY = 0;       // rect.x/y elemento al grab
  var lastFracX = 0, lastFracY = 0;         // ultima posizione (frazioni 0-1)

  // lettura stato: localStorage[STATE_KEY][location.pathname],
  // valido solo se array di null | [number, number]
  function readState(key) {
    try {
      var raw = localStorage.getItem(key);
      if (raw) {
        var arr = JSON.parse(raw)[location.pathname];
        if (Array.isArray(arr) && arr.every(function (e) {
          return e === null || (Array.isArray(e) &&
            typeof e[0] === "number" && typeof e[1] === "number");
        })) return arr;
      }
    } catch (err) { /* come l'originale: ignora */ }
    return [];
  }

  // scrittura: come l'originale riscrive l'oggetto con SOLO il pathname corrente
  function saveState(key, index, pos) {
    var arr = readState(key);
    arr[index] = pos;
    try {
      var obj = {};
      obj[location.pathname] = arr;
      localStorage.setItem(key, JSON.stringify(obj));
    } catch (err) { /* ignora */ }
  }

  // riapplica le posizioni salvate al load (persist: true)
  readState(STATE_KEY).forEach(function (pos, idx) {
    if (pos) {
      var el = container.querySelector('[data-drag][data-index="' + idx + '"]');
      if (el) {
        el.style.left = (100 * pos[0]) + "%";
        el.style.top = (100 * pos[1]) + "%";
      }
    }
  });

  function resetDrag() {
    active = null;
    dragging = false;
  }

  function onPointerStart(e) {
    var isMouse = e instanceof MouseEvent;
    var x, y;
    if (isMouse) {
      x = e.clientX;
      y = e.clientY;
    } else {
      if (e.touches.length > 1) { resetDrag(); return; }
      x = e.touches[0].clientX;
      y = e.touches[0].clientY;
      // long-press 800ms/context-menu: solo con prop `context`, assente in homepage
    }

    // deseleziona il folder precedente (outline via)
    if (selected) {
      selected.style.outline = "none";
      selected = null;
    }

    // risali il DOM fino a un elemento con data-drag
    var el = e.target;
    while (el && !(el.hasAttribute && el.hasAttribute("data-drag"))) {
      el = el.parentElement;
    }
    if (!el) return;

    // selezione: outline con qualunque pulsante
    el.style.outline = "2px dotted black";
    selected = el;

    // grab (e z-index) solo con tasto sinistro per il mouse
    if (!isMouse || e.button === 0) {
      active = el;
      var rect = el.getBoundingClientRect();
      el.style.zIndex = String(zCounter++);   // stacking: contatore incrementale
      startClientX = x;
      startClientY = y;
      startRectX = rect.x;
      startRectY = rect.y;
    }
  }

  function onPointerMove(e) {
    if (!active) return;
    var isMouse = e instanceof MouseEvent;
    var x, y;
    if (isMouse) {
      x = e.clientX;
      y = e.clientY;
    } else {
      if (e.touches.length > 1) return;
      x = e.touches[0].clientX;
      y = e.touches[0].clientY;
    }

    var dx = x - startClientX;
    var dy = y - startClientY;

    // soglia di attivazione: distanza euclidea < 4px -> nessun drag
    if (!dragging) {
      if (Math.sqrt(dx * dx + dy * dy) < 4) return;
      dragging = true;
    }

    e.preventDefault();

    // posizione = puntatore, clampata all'area (viewport - 90px dx/basso),
    // espressa in % del contenitore. Nessun lerp/inerzia.
    lastFracX = Math.min(container.offsetWidth,
      Math.max(0, dx + startRectX)) / container.offsetWidth;
    lastFracY = Math.min(container.offsetHeight,
      Math.max(0, dy + startRectY)) / container.offsetHeight;

    active.style.left = (100 * lastFracX) + "%";
    active.style.top = (100 * lastFracY) + "%";
  }

  function onPointerEnd(e) {
    var isMouse = e instanceof MouseEvent;
    if (!isMouse && e.touches.length > 1) return;

    if (dragging && active) {
      if (PERSIST) {
        var idx = active.getAttribute("data-index");
        if (typeof idx === "string" && !isNaN(parseInt(idx, 10))) {
          saveState(STATE_KEY, parseInt(idx, 10), [lastFracX, lastFracY]);
        }
      }
      // sopprime click/navigazione dopo un drag
      e.preventDefault();
    }
    resetDrag();
  }

  // stessi listener dell'originale (rilascio mouse su `click` in capture)
  window.addEventListener("mousedown", onPointerStart);
  window.addEventListener("touchstart", onPointerStart);
  window.addEventListener("mousemove", onPointerMove);
  window.addEventListener("touchmove", onPointerMove, { passive: false });
  window.addEventListener("click", onPointerEnd, true);
  window.addEventListener("touchend", onPointerEnd);

  /* Nav top (music / store → / tour) eliminata su richiesta:
     rimossa anche tutta la logica del dropdown store. */

  /* ======================== MODAL ======================== */

  var modalRoot = document.getElementById("modal-root");
  var modalPanel = document.getElementById("modal-panel");
  var imageItem = document.getElementById("image-item");
  var modalOpen = false;

  function setModal(open) {
    modalOpen = open;
    modalRoot.classList.toggle("hidden", !open);
  }

  // onClick dell'item immagine: NON scatta se defaultPrevented (post-drag)
  imageItem.addEventListener("click", function (e) {
    if (e.defaultPrevented) return;
    setModal(true);
  });

  // chiusura: Escape o click fuori dal panel (comportamento Dialog)
  window.addEventListener("keydown", function (e) {
    if (modalOpen && e.key === "Escape") setModal(false);
  });
  modalRoot.addEventListener("click", function (e) {
    if (modalOpen && !modalPanel.contains(e.target)) setModal(false);
  });

  /* ============ link resi non funzionanti (richiesta) ============ */
  /* music, tour, voci store, folder interni: aspetto/hover identici,
     nessuna navigazione. */
  document.querySelectorAll('a[data-inert="true"]').forEach(function (a) {
    a.addEventListener("click", function (e) { e.preventDefault(); });
  });

  /* ================= FIGURE (sprite click-to-play) ================= */
  /* Due figure animate ai lati della riga social. L'asset di partenza e' un GIF,
     che il browser non sa pilotare: parte da solo al load e cicla all'infinito,
     senza modo di fermarlo o riavvolgerlo. E' stato convertito una tantum in uno
     sprite sheet (tools/build-sprite.py) e qui viene avanzato a mano, un frame
     alla volta, spostando il background-position.

     175 frame su una griglia 14x13, 60ms l'uno: 10.5s, la cadenza con cui
     l'animazione e' stata disegnata.

     Il riposo NON e' il frame 0: quello e' il blob, brutto da tenere fermo sotto
     gli occhi. Il ciclo e' chiuso (la giuntura muove meno pixel di un normale
     passo fra frame), quindi puo' partire da dove si vuole. Parte dal 158, una
     persona in piedi: da li' la figura si ripiega nel blob, che resta come fase
     interna dell'animazione, poi si riapre e torna in piedi. */

  var FIG_COLS = 14;
  var FIG_FRAMES = 175;
  var FIG_FRAME_MS = 60;
  var FIG_REST = 158;

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  // Uno stato per istanza: le due figure non condividono niente, cliccarne una
  // non tocca l'altra.
  var figures = [].map.call(document.querySelectorAll("[data-figure]"), function (button) {
    var fig = {
      button: button,
      sprite: button.querySelector(".figure-sprite"),
      playing: false,
      rafId: 0,
      startTime: 0,
      cellW: 0,
      cellH: 0
    };
    button.addEventListener("click", function () { startFigure(fig); });
    return fig;
  });

  // Il passo della cella e' la dimensione resa dello sprite, non una costante:
  // cosi' segue il breakpoint del CSS senza doverne duplicare i valori qui.
  function measureFigure(fig) {
    var rect = fig.sprite.getBoundingClientRect();
    fig.cellW = rect.width;
    fig.cellH = rect.height;
  }

  /* Tornare a riposo significa TOGLIERE lo stile inline, non riscriverlo: cosi'
     la posizione torna quella dichiarata in .figure-sprite, espressa in multipli
     delle variabili CSS. Segue da se' il breakpoint, senza rimisurare niente.
     Riscrivendola in pixel resterebbe congelata alla dimensione del momento. */
  function restFigure(fig) {
    fig.sprite.style.backgroundPosition = "";
  }

  function showFigureFrame(fig, frame) {
    fig.sprite.style.backgroundPosition =
      -(frame % FIG_COLS) * fig.cellW + "px " +
      -Math.floor(frame / FIG_COLS) * fig.cellH + "px";
  }

  function startFigure(fig) {
    // Click durante la riproduzione: ignorato. Niente coda, niente ripartenza,
    // niente secondo rAF sullo stesso elemento.
    if (fig.playing || reducedMotion.matches) return;

    measureFigure(fig);
    fig.playing = true;
    fig.startTime = performance.now();
    fig.rafId = requestAnimationFrame(function tick(now) {
      // Il frame si ricava dal tempo trascorso, non da un contatore che avanza:
      // se la tab va in background il rAF si ferma, e al ritorno il ciclo
      // risulta gia' concluso invece di restare bloccato a meta'.
      // Il timestamp del rAF puo' precedere di poco performance.now(), da cui il
      // clamp: senza, il primo giro mostrerebbe la cella -1.
      var step = Math.max(0, Math.floor((now - fig.startTime) / FIG_FRAME_MS));
      if (step >= FIG_FRAMES) {
        fig.playing = false;
        restFigure(fig);
        return;
      }
      showFigureFrame(fig, (FIG_REST + step) % FIG_FRAMES);
      fig.rafId = requestAnimationFrame(tick);
    });
  }

  /* prefers-reduced-motion: resta il fotogramma di riposo e nient'altro. Il
     bottone smette di essere un controllo azionabile, altrimenti verrebbe
     annunciato come tale pur non facendo piu' niente. */
  function applyFigureMotionPreference() {
    var off = reducedMotion.matches;
    figures.forEach(function (fig) {
      if (off && fig.playing) {
        cancelAnimationFrame(fig.rafId);
        fig.playing = false;
        restFigure(fig);
      }
      fig.button.disabled = off;
      if (off) fig.button.setAttribute("aria-hidden", "true");
      else fig.button.removeAttribute("aria-hidden");
    });
  }

  applyFigureMotionPreference();
  if (reducedMotion.addEventListener) {
    reducedMotion.addEventListener("change", applyFigureMotionPreference);
  } else if (reducedMotion.addListener) {
    reducedMotion.addListener(applyFigureMotionPreference);   // Safari < 14
  }

  // Il passo cambia col breakpoint: chi sta girando va rimisurato al volo.
  // Chi e' fermo non ha stile inline e sta sulla posizione di riposo dichiarata
  // in CSS, che e' espressa in multipli delle stesse variabili: si adatta da se'.
  window.addEventListener("resize", function () {
    figures.forEach(function (fig) { if (fig.playing) measureFigure(fig); });
  });
})();
