# Vuelca las palabras de una página de PDF con su posición (para diseñar el lector de cada itinerario).
# Uso: uvx --from pdfplumber python volcar-palabras.py <pdf> <página 1..n>
import sys, pdfplumber
pdf, n = sys.argv[1], int(sys.argv[2])
with pdfplumber.open(pdf) as p:
    pg = p.pages[n - 1]
    print('size', pg.width, pg.height)
    for w in pg.extract_words(keep_blank_chars=False, x_tolerance=1.5, y_tolerance=2):
        print(f"{w['x0']:7.1f} {w['x1']:7.1f} {w['top']:7.1f} {w['text']}")
