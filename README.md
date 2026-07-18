# A

Sito personale con interfaccia "desktop": cartelle trascinabili in stile
retro pixel-art, una pagina-lettera e una pagina-immagine.

L'interazione replica fedelmente le meccaniche di [oklama.com](https://oklama.com/)
(drag senza fisica con soglia di 4px, z-index incrementale a ogni presa,
persistenza delle posizioni in localStorage, modal senza animazioni),
ricavate dai parametri documentati in [EXTRACTED_PARAMS.md](EXTRACTED_PARAMS.md).
Il confronto comportamento per comportamento è in [CHECKLIST.md](CHECKLIST.md).

## Pagine

| File | Contenuto |
|---|---|
| `index.html` | pagina-lettera (brano di Antonio Tabucchi) con foto in fondo |
| `home.html` | desktop con le cartelle trascinabili, modal dell'immagine centrale, social |
| `master.html` | pagina-immagine |

## Struttura

```
index.html      pagina-lettera
home.html       desktop
master.html     pagina-immagine
style.css       tutti gli stili (valori estratti dal CSS originale)
main.js         drag, persistenza, modal (vanilla JS, nessuna dipendenza)
assets/         icone pixel-art, immagini, font
```

## Eseguire in locale

```bash
python3 -m http.server 8000
# poi apri http://localhost:8000
```

Qualsiasi server statico va bene; non c'è build, non ci sono dipendenze.

## Crediti

- Design d'interazione basato su [oklama.com](https://oklama.com/)
- Font: [JetBrains Mono](https://www.jetbrains.com/lp/mono/) (SIL Open Font License)
- Citazione in `index.html`: Antonio Tabucchi
- Icone cartella: pixel-art disegnata per questo progetto
