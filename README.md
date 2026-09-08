# desktop — a personal site shaped like a desktop

A personal site with a desktop interface: draggable pixel-art folders, a letter
page and an image page. Vanilla HTML, CSS and JavaScript — no build, no
dependencies.

**Live:** https://acci4i0.github.io/-A/

> **Rebuild study.** The interaction is modelled on [oklama.com](https://oklama.com/):
> drag without physics past a 4 px threshold, z-index incremented on every grab,
> positions persisted in localStorage, modals without animation. Those
> parameters are documented in [EXTRACTED_PARAMS.md](EXTRACTED_PARAMS.md), and
> the behaviour-by-behaviour comparison is in [CHECKLIST.md](CHECKLIST.md).
> Not affiliated with the original; the content here is my own.

## Pages

| File | What it is |
|---|---|
| `index.html` | the desktop: draggable folders, centre image modal, social links |
| `nuthoughts.html` | a letter page — an Antonio Tabucchi passage, photo at the foot |
| `master.html` | an image page |

## Running it

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

Any static server will do. There is nothing to install and nothing to build.

## Structure

```
index.html            the desktop
nuthoughts.html       the letter page
master.html           the image page
style.css             every style (values extracted from the original CSS)
main.js               drag, persistence, modal — vanilla JS
assets/               pixel-art icons, images, fonts
EXTRACTED_PARAMS.md   the interaction parameters and where they came from
CHECKLIST.md          behaviour-by-behaviour comparison with the reference
```

## Credits

- Interaction design studied from [oklama.com](https://oklama.com/)
- Font: [JetBrains Mono](https://www.jetbrains.com/lp/mono/) (SIL Open Font License)
- Quotation in `index.html`: Antonio Tabucchi
- Folder icons: pixel art drawn for this project

## License

[MIT](LICENSE) © Andrea Lando ([Acci4i0](https://github.com/Acci4i0)).
Covers my code and content only — not the original design this study looks at.
