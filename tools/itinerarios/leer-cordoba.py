# Ocho Capitales: lee el itinerario oficial de la Agrupación de Córdoba. Hay dos maquetas:
# - Rejilla «clásica» (Lunes a Viernes Santo y la mitad baja del Domingo de Ramos): columna de horas cada 10 minutos
#   a izquierda y derecha y, por cada hermandad, dos columnas (cruz de guía y final del cortejo) bajo un rótulo con su
#   nombre. Las celdas se agrupan por su centro horizontal (van centradas en su columna).
# - «Bloques» (Sábado de Pasión, Entrada Triunfal del Domingo de Ramos, Dolores de Alcolea y Resucitado): cada hermandad
#   es una tablita con su propia columna «Hora» y subcolumnas que empiezan y acaban con el rótulo blanco «CRUZ DE GUÍA» o
#   «FINAL DEL CORTEJO». El nombre va en blanco junto al rótulo o como título grande del bloque.
# Una página puede mezclar ambas: se parte en regiones por cada cabecera «Hora(s)» del margen izquierdo y en cada región
# se prueba la rejilla clásica; si no hay rótulos de hermandad, se lee como bloques.
# Uso: uvx --from pdfplumber python leer-cordoba.py <pdf> <salida.json>
import sys, re, json, pdfplumber

HORA = re.compile(r'^\d{1,2}[:.]\d{2}$')
DIAS = ['VIERNES DE DOLORES', 'SÁBADO DE PASIÓN', 'DOMINGO DE RAMOS', 'LUNES SANTO', 'MARTES SANTO', 'MIÉRCOLES SANTO',
        'JUEVES SANTO', 'VIERNES SANTO', 'SÁBADO SANTO', 'DOMINGO DE RESURRECCIÓN']
VARIANTES = {'DOMINGO DE RESURECCIÓN': 'DOMINGO DE RESURRECCIÓN'}  # errata del propio PDF (página del Resucitado)
MARCAS = ('CRUZ DE GUÍA', 'FINAL DEL CORTEJO', 'FINAL DE CORTEJO', 'FIN DEL CORTEJO')
ROTULO = re.compile(r'^(CRUZ DE GU[IÍ]A|FIN(AL)? DEL? CORTEJO)$')
DIA_RE = re.compile(r'DOMINGO|LUNES|MARTES|MI[EÉ]RCOLES|JUEVES|VIERNES|S[AÁ]BADO|SEMANA SANTA|^\d{4}$')

def grupos(ln, gap=4):
    ln = sorted(ln, key=lambda w: w['x0']); g = []
    for w in ln:
        if g and w['x0'] - g[-1][-1]['x1'] <= gap: g[-1].append(w)
        else: g.append([w])
    return [{'x0': a[0]['x0'], 'x1': a[-1]['x1'], 'top': min(w['top'] for w in a), 'text': ' '.join(w['text'] for w in a),
             'size': max(w.get('size', 0) for w in a), 'blanco': all(es_blanco(w) for w in a)} for a in g]

def es_blanco(w):
    c = w.get('non_stroking_color')
    return isinstance(c, (list, tuple)) and len(c) >= 3 and all(isinstance(v, (int, float)) and v > 0.95 for v in c[:3])

def lineas(ws, tol=1.5):
    out = []
    for w in sorted(ws, key=lambda w: (w['top'], w['x0'])):
        if out and abs(out[-1][0]['top'] - w['top']) <= tol: out[-1].append(w)
        else: out.append([w])
    return out

def punto(fila, texto):
    t = texto.strip()
    m = re.search(r'(\d{1,2}[:.]\d{2})', t)
    p = {'fila': fila, 'lugar': re.sub(r'\s*\(?\d{1,2}[:.]\d{2}\)?\s*', ' ', t).strip()} if fila else {'lugar': re.sub(r'\s*\(?\d{1,2}[:.]\d{2}\)?\s*', ' ', t).strip()}
    if m: p['hora'] = m.group(1).replace('.', ':')
    return p

def columna_horas(hs, minimo):
    """Agrupa horas sueltas por su x0 (±4) y devuelve las que forman columna (al menos `minimo`)."""
    hs = sorted(hs, key=lambda w: w['x0']); cl = []
    for w in hs:
        if cl and w['x0'] - cl[-1][-1]['x0'] <= 4: cl[-1].append(w)
        else: cl.append([w])
    return [c for c in cl if len(c) >= minimo]

def clasica(ws, W, dia, n):
    izq = sorted([w for w in ws if HORA.match(w['text']) and w['x1'] < 0.1 * W], key=lambda w: w['top'])
    if len(izq) < 10: return []
    y0 = izq[0]['top']; xl = max(w['x1'] for w in izq) + 2
    # borde derecho: la columna de horas del margen derecho (la más poblada), no cualquier hora suelta de una celda
    der = columna_horas([w for w in ws if HORA.match(w['text']) and w['x0'] > 0.9 * W], 5)
    xr = (min(w['x0'] for w in max(der, key=len)) - 2) if der else W
    # rótulos de hermandad: línea inmediatamente encima de la primera hora
    cab = [w for w in ws if y0 - 14 <= w['top'] < y0 - 2 and xl <= w['x0'] < xr and w['text'].upper() not in ('HORAS', 'HORA')]
    nombres = [g for g in grupos(cab, gap=6) if not any(d in g['text'].upper() for d in DIAS) and g['text'].upper() not in MARCAS]
    if not nombres: return []
    filas = [(w['top'], w['text'].replace('.', ':')) for w in izq]
    cuerpo = [w for w in ws if w['top'] >= y0 - 1 and xl <= w['x0'] and w['x1'] <= xr and not HORA.match(w['text'])]
    celdas = []
    for f_top, f_txt in filas:
        ln = [w for w in cuerpo if abs(w['top'] - f_top) < 2.2]
        for g in grupos(ln):
            celdas.append({**g, 'fila': f_txt, 'cx': (g['x0'] + g['x1']) / 2})
    nombres.sort(key=lambda g: g['x0'])
    cen = [(g['x0'] + g['x1']) / 2 for g in nombres]
    # límites de cada hermandad: a medio camino entre su rótulo y los vecinos (los rótulos van centrados sobre sus dos columnas)
    bordes = [xl] + [(cen[i] + cen[i + 1]) / 2 for i in range(len(cen) - 1)] + [xr]
    out = []
    for i, nm in enumerate(nombres):
        mid = cen[i]
        for sub, lo, hi in (('cruz de guía', bordes[i], mid), ('final del cortejo', mid, bordes[i + 1])):
            pts = []
            for c in celdas:
                if not (lo <= c['cx'] < hi): continue
                t = c['text'].strip()
                if t.upper() in MARCAS or t.upper() == nm['text'].upper(): continue
                p = punto(c['fila'], t)
                if p['lugar']: pts.append(p)
            if len(pts) >= 3: out.append({'dia': dia, 'cabecera': nm['text'], 'sub': sub, 'puntos': pts, 'pagina': n + 1})
    return out

def bloques(ws, W, dia, n):
    hcols = columna_horas([w for w in ws if HORA.match(w['text'])], 3)
    hset = {id(w) for c in hcols for w in c}
    hwords = [w for c in hcols for w in c]
    gs = [g for ln in lineas([w for w in ws if id(w) not in hset and w['text'] not in ('Hora', 'Horas', 'HORA', 'HORAS')]) for g in grupos(ln)]
    for g in gs: g['cx'] = (g['x0'] + g['x1']) / 2
    rot = [g for g in gs if ROTULO.match(g['text'].upper())]
    if not rot: return []
    # subcolumnas: rótulos del mismo tipo alineados (±30); se emparejan inicio y fin por orden vertical
    cols = []
    for sub in ('cruz de guía', 'final del cortejo'):
        rs = sorted([r for r in rot if r['text'].upper().startswith('CRUZ' if sub == 'cruz de guía' else 'FIN')], key=lambda r: r['cx'])
        cl = []
        for r in rs:
            if cl and abs(r['cx'] - cl[-1][-1]['cx']) <= 30: cl[-1].append(r)
            else: cl.append([r])
        for c in cl:
            c.sort(key=lambda r: r['top'])
            for i in range(0, len(c), 2):
                ini, fin = c[i], (c[i + 1] if i + 1 < len(c) else None)
                cols.append({'sub': sub, 'cx': sum(r['cx'] for r in c) / len(c), 'ini': ini, 'fin': fin, 'top0': ini['top'], 'top1': fin['top'] if fin else 1e9})
    size_rot = max(r['size'] for r in rot)
    titulos = [g for g in gs if g['size'] >= 1.4 * size_rot and not DIA_RE.search(g['text'].upper()) and not ROTULO.match(g['text'].upper())]
    for c in cols:
        nm = None
        # 1) nombre en blanco justo encima del rótulo de inicio, o 2) justo debajo del rótulo de fin
        for g in gs:
            if g['blanco'] and not ROTULO.match(g['text'].upper()) and abs(g['cx'] - c['cx']) < 30 and not re.search(r'\d', g['text']):
                if c['top0'] - 12 <= g['top'] < c['top0'] - 1 or (c['fin'] and c['top1'] + 1 < g['top'] <= c['top1'] + 12): nm = g['text']; break
        # 3) título grande del bloque por encima
        if not nm:
            arr = [t for t in titulos if t['top'] < c['top0']]
            if arr: nm = max(arr, key=lambda t: (t['size'], t['top']))['text']  # el más grande; a igualdad, el más cercano
        c['nombre'] = nm or '?'
    for c in cols: c['pts'] = []
    for g in gs:
        if ROTULO.match(g['text'].upper()) or (g['blanco'] and not re.search(r'\d', g['text'])): continue
        cand = [c for c in cols if abs(g['cx'] - c['cx']) < 45 and c['top0'] < g['top'] < c['top1'] - 0.5]
        if not cand: continue
        c = min(cand, key=lambda c: abs(g['cx'] - c['cx']))
        hs = [h for h in hwords if abs(h['top'] - g['top']) < 2]
        izq = [h for h in hs if h['x1'] <= g['x0']]
        h = max(izq, key=lambda h: h['x1']) if izq else (min(hs, key=lambda h: abs(h['x0'] - g['x0'])) if hs else None)
        p = punto(h['text'].replace('.', ':') if h else None, g['text'])
        if p['lugar'] and p['lugar'].upper() != c['nombre'].upper(): c['pts'].append((g['top'], p))
    # una hermandad partida en dos bloques (columna que sigue en otro sitio de la página) se une por nombre y tipo
    unidas = {}
    for c in sorted(cols, key=lambda c: (c['top0'], c['cx'])):
        k = (c['nombre'], c['sub'])
        unidas.setdefault(k, []).extend(p for _, p in sorted(c['pts'], key=lambda t: t[0]))
    return [{'dia': dia, 'cabecera': k[0], 'sub': k[1], 'puntos': v, 'pagina': n + 1, 'maqueta': 'bloques'} for k, v in unidas.items() if len(v) >= 3]

def main(pdf, out):
    todo = []
    with pdfplumber.open(pdf) as P:
        for n, pg in enumerate(P.pages):
            W = pg.width
            ws = pg.extract_words(x_tolerance=1.2, y_tolerance=1.5, extra_attrs=['non_stroking_color', 'size'])
            titulo = ' '.join(w['text'] for w in ws if w['top'] < 0.2 * pg.height).upper()
            for a, b in VARIANTES.items(): titulo = titulo.replace(a, b)
            dia = next((d for d in DIAS if d in titulo), None)
            if not dia: continue
            # regiones: una por cada cabecera «Hora(s)» del margen izquierdo
            cabs = sorted([w['top'] for w in ws if w['text'] in ('Hora', 'Horas', 'HORA', 'HORAS') and w['x1'] < 0.1 * W])
            cortes = [0] + [t - 25 for t in cabs[1:]] + [pg.height + 1]
            for a, b in zip(cortes, cortes[1:]):
                reg = [w for w in ws if a <= w['top'] < b]
                cols = clasica(reg, W, dia, n) or bloques(reg, W, dia, n)
                todo += cols
    json.dump({'fuente': pdf.replace('\\', '/').split('/')[-1], 'columnas': todo}, open(out, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(out, len(todo), 'columnas')

if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
