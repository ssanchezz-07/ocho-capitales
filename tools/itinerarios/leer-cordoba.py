# Ocho Capitales: lee el itinerario oficial de la Agrupación de Córdoba. Cada página es una jornada: columna de
# horas cada 10 minutos a la izquierda y, por cada hermandad, dos columnas (cruz de guía y final del cortejo) bajo
# un rótulo con su nombre. Las celdas se agrupan por su centro horizontal (van centradas en su columna).
# Uso: uvx --from pdfplumber python leer-cordoba.py <pdf> <salida.json>
import sys, re, json, pdfplumber

HORA = re.compile(r'^\d{1,2}[:.]\d{2}$')
DIAS = ['VIERNES DE DOLORES', 'SÁBADO DE PASIÓN', 'DOMINGO DE RAMOS', 'LUNES SANTO', 'MARTES SANTO', 'MIÉRCOLES SANTO',
        'JUEVES SANTO', 'VIERNES SANTO', 'SÁBADO SANTO', 'DOMINGO DE RESURRECCIÓN']
MARCAS = ('CRUZ DE GUÍA', 'FINAL DEL CORTEJO')

def grupos(ln, gap=4):
    ln = sorted(ln, key=lambda w: w['x0']); g = []
    for w in ln:
        if g and w['x0'] - g[-1][-1]['x1'] <= gap: g[-1].append(w)
        else: g.append([w])
    return [{'x0': a[0]['x0'], 'x1': a[-1]['x1'], 'text': ' '.join(w['text'] for w in a)} for a in g]

def main(pdf, out):
    todo = []
    with pdfplumber.open(pdf) as P:
        for n, pg in enumerate(P.pages):
            W = pg.width
            ws = pg.extract_words(x_tolerance=1.2, y_tolerance=1.5)
            titulo = ' '.join(w['text'] for w in ws if w['top'] < 0.2 * pg.height).upper()
            dia = next((d for d in DIAS if d in titulo), None)
            izq = sorted([w for w in ws if HORA.match(w['text']) and w['x1'] < 0.1 * W], key=lambda w: w['top'])
            if len(izq) < 10 or not dia: continue
            y0 = izq[0]['top']; xl = max(w['x1'] for w in izq) + 2
            xr = min([w['x0'] for w in ws if HORA.match(w['text']) and w['x0'] > 0.9 * W] or [W]) - 2
            # rótulos de hermandad: línea inmediatamente encima de la primera hora
            cab = [w for w in ws if y0 - 14 <= w['top'] < y0 - 2 and xl <= w['x0'] < xr and w['text'].upper() not in ('HORAS', 'HORA')]
            nombres = [g for g in grupos(cab, gap=6) if not any(d in g['text'].upper() for d in DIAS)]
            if not nombres: continue
            filas = [(w['top'], w['text'].replace('.', ':')) for w in izq]
            cuerpo = [w for w in ws if w['top'] >= y0 - 1 and xl <= w['x0'] and w['x1'] <= xr and not HORA.match(w['text'])]
            celdas = []
            for f_top, f_txt in filas:
                ln = [w for w in cuerpo if abs(w['top'] - f_top) < 2.2]
                for g in grupos(ln):
                    celdas.append({**g, 'fila': f_txt, 'cx': (g['x0'] + g['x1']) / 2})
            # columnas: cada rótulo cubre dos; se dividen por su mitad
            nombres.sort(key=lambda g: g['x0'])
            cen = [(g['x0'] + g['x1']) / 2 for g in nombres]
            # límites de cada hermandad: a medio camino entre su rótulo y los vecinos (los rótulos van centrados sobre sus dos columnas)
            bordes = [xl] + [(cen[i] + cen[i + 1]) / 2 for i in range(len(cen) - 1)] + [xr]
            for i, nm in enumerate(nombres):
                mid = cen[i]
                for sub, lo, hi in (('cruz de guía', bordes[i], mid), ('final del cortejo', mid, bordes[i + 1])):
                    pts = []
                    for c in celdas:
                        if not (lo <= c['cx'] < hi): continue
                        t = c['text'].strip()
                        if t.upper() in MARCAS or t.upper() == nm['text'].upper(): continue
                        m = re.search(r'(\d{1,2}[:.]\d{2})', t)
                        p = {'fila': c['fila'], 'lugar': re.sub(r'\s*\(?\d{1,2}[:.]\d{2}\)?\s*', ' ', t).strip()}
                        if m: p['hora'] = m.group(1).replace('.', ':')
                        if p['lugar']: pts.append(p)
                    if len(pts) >= 3: todo.append({'dia': dia, 'cabecera': nm['text'], 'sub': sub, 'puntos': pts, 'pagina': n + 1})
    json.dump({'fuente': pdf.replace('\\', '/').split('/')[-1], 'columnas': todo}, open(out, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(out, len(todo), 'columnas')

if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
