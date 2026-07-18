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
})();
