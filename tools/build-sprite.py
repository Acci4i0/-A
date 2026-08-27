#!/usr/bin/env python3
"""Genera assets/figure-sprite.png dal GIF sorgente della figura.

One-off: si lancia a mano quando cambia colore, scala o sorgente. NON fa parte
del deploy — il sito resta statico e senza build step, quello che viene committato
e' il solo PNG prodotto.

    python3 tools/build-sprite.py

Sorgente (fuori dal repo, fornito dall'utente):
    ~/Desktop/al./C595C1EE-711C-485B-B0AD-C0014A3C288A.GIF

Cosa fa, e perche':

  - tiene UN FRAME SU DUE. Il GIF dichiara 350 frame a 3/100s (30 fps) ma ogni
    frame e' duplicato: 171 coppie su 175 sono identiche al pixel, le altre 4
    differiscono di 1 px. La cadenza autorata e' quindi 175 frame a ~16.7 fps,
    cioe' gli stessi 10.5 s. Scartare i duplicati dimezza il foglio senza
    toccare il movimento.

  - ritaglia alla union bbox del soggetto su tutti i frame. Il 43% del canvas
    640x640 e' sfondo che non viene mai coperto.

  - ricava l'alpha dalla distanza dal colore di sfondo e la quantizza a 8
    livelli. Lo sfondo del GIF e' OPACO (#EDEDEC): senza questo passaggio si
    vedrebbe un rettangolo grigio sul bianco della pagina. A 8 livelli il
    risultato e' indistinguibile da 256 alla scala di resa (~50x68 px) e il
    file passa da 535 KB a ~100 KB.

  - impagina su griglia 14x13 e stampa i rapporti geometrici che stanno in
    style.css, cosi' se si cambia scala si sa cosa aggiornare.
"""

import os
from PIL import Image, ImageChops

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.expanduser("~/Desktop/al./C595C1EE-711C-485B-B0AD-C0014A3C288A.GIF")
DST = os.path.join(HERE, os.pardir, "assets", "figure-sprite.png")

# Colore di sfondo del GIF, campionato agli angoli di ogni frame.
BG = (237, 237, 236)

# Azzurro del sito (--intro-blue in index.html). Il colore viene cotto qui:
# il PNG e' una silhouette monocroma, il CSS non lo puo' cambiare.
INK = (73, 164, 246)

# Union bbox del soggetto su tutti i 350 frame (370x504 dentro 640x640).
CROP = (123, 67, 493, 571)

# Fotogramma di riposo: una persona in piedi, non il blob (che resta come fase
# interna dell'animazione, a cavallo della giuntura del ciclo). Indice fra i 175
# frame unici. Il ciclo e' chiuso, quindi puo' partire da qualunque frame.
REST_FRAME = 158

# Cella a 2x della resa (~49.9x68.0 px). Griglia scelta per stare larga sui 175
# frame senza sprecare troppe celle: 14x13 = 182.
CELL_H = 136
COLS = 14
ALPHA_LEVELS = 8

# Sotto questa distanza dal colore di sfondo il pixel e' gia' completamente
# opaco: e' la larghezza del bordo antialiasato del GIF, non una soglia magica.
ALPHA_SPAN = 150


def unique_frames(path):
    """I 175 frame reali: uno su due, i dispari sono duplicati dei pari."""
    im = Image.open(path)
    return [im.seek(i) or im.convert("RGB").copy() for i in range(0, im.n_frames, 2)]


def to_cell(frame, size):
    """Ritaglia, estrae l'alpha dallo sfondo opaco, ricolora e ridimensiona."""
    crop = frame.crop(CROP)
    distance = ImageChops.difference(crop, Image.new("RGB", crop.size, BG)).convert("L")
    alpha = distance.point(lambda v: min(255, int(v * 255 / ALPHA_SPAN)))
    alpha = alpha.resize(size, Image.LANCZOS)

    step = 255 / (ALPHA_LEVELS - 1)
    alpha = alpha.point(lambda v: int(round(v / step) * step))

    cell = Image.new("RGBA", size, INK + (0,))
    cell.putalpha(alpha)
    return cell


def subject_bbox(frame):
    """Bbox del soggetto dentro il crop, a piena risoluzione."""
    crop = frame.crop(CROP)
    mask = ImageChops.difference(crop, Image.new("RGB", crop.size, BG)) \
        .convert("L").point(lambda v: 255 if v > 18 else 0)
    return mask.getbbox()


def main():
    frames = unique_frames(SRC)
    crop_w, crop_h = CROP[2] - CROP[0], CROP[3] - CROP[1]
    cell_w = round(crop_w / crop_h * CELL_H)
    rows = -(-len(frames) // COLS)

    sheet = Image.new("RGBA", (COLS * cell_w, rows * CELL_H), (0, 0, 0, 0))
    for n, frame in enumerate(frames):
        sheet.paste(to_cell(frame, (cell_w, CELL_H)),
                    ((n % COLS) * cell_w, (n // COLS) * CELL_H))

    # Gli RGBA distinti sono esattamente ALPHA_LEVELS (tinta fissa, alpha a
    # gradini), quindi la palette li mappa senza perdita.
    sheet.quantize(colors=ALPHA_LEVELS, method=Image.FASTOCTREE).save(DST, optimize=True)

    rest = subject_bbox(frames[REST_FRAME])
    rest_h = rest[3] - rest[1]
    print("frame unici:   %d" % len(frames))
    print("cella:         %dx%d" % (cell_w, CELL_H))
    print("foglio:        %dx%d  (griglia %dx%d)" % (sheet.width, sheet.height, COLS, rows))
    print("scritto:       %s  (%.0f KB)" % (os.path.relpath(DST, os.path.join(HERE, os.pardir)),
                                            os.path.getsize(DST) / 1024))
    print("riposo:        frame %d, bbox nel crop %s (%dx%d)"
          % (REST_FRAME, rest, rest[2] - rest[0], rest_h))
    print()
    print("rapporti per style.css (moltiplicatori di --fig-h, l'altezza resa"
          " della persona a riposo):")
    print("  --fig-w         %.4f   (larghezza del box = della persona)" % ((rest[2] - rest[0]) / rest_h))
    print("  --fig-sprite-w  %.4f" % (crop_w / rest_h))
    print("  --fig-sprite-h  %.4f" % (crop_h / rest_h))
    print("  --fig-offset-x  %.4f" % (-rest[0] / rest_h))
    print("  --fig-offset-y  %.4f" % (-rest[1] / rest_h))
    print("  background-position di riposo: colonna %d, riga %d"
          % (REST_FRAME % COLS, REST_FRAME // COLS))
    print("  COLS %d  ROWS %d  FRAMES %d  REST %d" % (COLS, rows, len(frames), REST_FRAME))
    print()
    # Quanto l'animazione esce dal box, ora che il box e' una figura intera.
    over = [(0, 0, 0, 0)]
    for f in frames:
        b = subject_bbox(f)
        over.append((rest[0] - b[0], rest[1] - b[1], b[2] - rest[2], b[3] - rest[3]))
    print("sbordo massimo dal box, in multipli di --fig-h:")
    print("  sinistra %.3f  sopra %.3f  destra %.3f  sotto %.3f"
          % tuple(max(o[i] for o in over) / rest_h for i in range(4)))


if __name__ == "__main__":
    main()
