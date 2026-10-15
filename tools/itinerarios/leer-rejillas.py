# Ocho Capitales: lee las rejillas de horarios e itinerarios de los PDF oficiales (programas de Canal Sur Radio
# y guías de las agrupaciones). Cada rejilla tiene filas de media hora (hora a la izquierda) y una columna por
# hermandad con las calles por las que pasa; las horas exactas van entre paréntesis (Salida (17:15), CATEDRAL (19:50)…).
# Salida: un JSON por PDF con, para cada columna, la jornada, el nombre de cabecera y la lista ordenada de puntos.
# Uso: uvx --from pdfplumber python leer-rejillas.py <pdf> <salida.json>
import sys, re, json, pdfplumber

HORA = re.compile(r'^\d{1,2}[:.]\d{2}$')
DIAS = ['VIERNES DE DOLORES', 'SÁBADO DE PASIÓN', 'DOMINGO DE RAMOS', 'LUNES SANTO', 'MARTES SANTO', 'MIÉRCOLES SANTO',
        'JUEVES SANTO', 'MADRUGADA', 'MADRUGÁ', 'VIERNES SANTO', 'SÁBADO SANTO', 'DOMINGO DE RESURRECCIÓN']

def minutos(h):
    h = h.replace('.', ':'); a, b = h.split(':'); m = int(a) * 60 + int(b)
    return m

def lineas(words, tol=2.5):
    out = []
    for w in sorted(words, key=lambda w: (round(w['top']), w['x0'])):
        if out and abs(out[-1][0]['top'] - w['top']) <= tol: out[-1].append(w)
        else: out.append([w])
    return out

def grupos_horizontales(ws, gap=7):
    ws = sorted(ws, key=lambda w: w['x0']); g = []
    for w in ws:
        if g and w['x0'] - g[-1][-1]['x1'] <= gap: g[-1].append(w)
        else: g.append([w])
    return [{'x0': gg[0]['x0'], 'x1': gg[-1]['x1'], 'top': min(x['top'] for x in gg), 'text': ' '.join(x['text'] for x in gg)} for gg in g]

def pagina(pg, dia_actual):
    W = pg.width
    words = pg.extract_words(x_tolerance=1.5, y_tolerance=2, keep_blank_chars=False)
    if not words: return [], dia_actual
    txt = ' '.join(w['text'] for w in words[:40]).upper()
    for d in DIAS:
        if d in txt: dia_actual = d
    izq = [w for w in words if HORA.match(w['text']) and w['x1'] < 0.13 * W]
    if len(izq) < 4: return [], dia_actual
    izq.sort(key=lambda w: w['top'])
    der_x = 0.88 * W
    filas = [(w['top'], w['text']) for w in izq]
    y0, y1 = filas[0][0], filas[-1][0]
    paso = (y1 - y0) / max(1, len(filas) - 1)
    margen_izq = max(w['x1'] for w in izq) + 2
    # Cabecera: palabras justo encima de la primera fila (hasta ~6 líneas)
    cab = [w for w in words if y0 - 6.5 * paso <= w['top'] < y0 - 2 and w['x0'] >= margen_izq - 2 and w['x1'] <= der_x and not HORA.match(w['text'])]
    cab = [w for w in cab if w['text'].upper() not in ('HORAS', 'HORA', 'SALIDA')]
    # Subcolumnas (cruz de guía / paso / palio): cada hermandad puede tener dos columnas bajo un mismo nombre
    subs, usados = [], set()
    cs = sorted(cab, key=lambda w: (round(w['top']), w['x0']))
    for i, w in enumerate(cs):
        t = w['text'].upper()
        if t == 'CRUZ' and i + 2 < len(cs) and cs[i + 1]['text'].upper() == 'DE' and cs[i + 2]['text'].upper().startswith('GU'):
            subs.append({'x0': w['x0'], 'x1': cs[i + 2]['x1'], 'top': w['top'], 'sub': 'cruz de guía'}); usados |= {id(w), id(cs[i + 1]), id(cs[i + 2])}
        elif t in ('PALIO', 'PASO', '1ER', 'FINAL') and id(w) not in usados:
            nxt = cs[i + 1] if i + 1 < len(cs) and abs(cs[i + 1]['top'] - w['top']) < 2 and cs[i + 1]['x0'] - w['x1'] < 6 else None
            extra = nxt['text'].upper() if nxt and nxt['text'].upper() in ('PALIO', 'CRISTO', 'VIRGEN', 'JESÚS', 'TRAMO', 'MISTERIO') else ''
            subs.append({'x0': w['x0'], 'x1': (nxt['x1'] if extra else w['x1']), 'top': w['top'], 'sub': (t + ' ' + extra).strip().lower()}); usados.add(id(w))
            if extra: usados.add(id(nxt))
    cab = [w for w in cab if id(w) not in usados]
    grupos = []
    for ln in lineas(cab):
        for g in grupos_horizontales(ln):
            # une con un grupo de la línea anterior si se solapan en horizontal (nombres a dos líneas)
            for G in grupos:
                if G['x0'] - 6 <= (g['x0'] + g['x1']) / 2 <= G['x1'] + 6 and g['top'] - G['bottom'] < 14:
                    G['text'] += ' ' + g['text']; G['x0'] = min(G['x0'], g['x0']); G['x1'] = max(G['x1'], g['x1']); G['bottom'] = g['top']; break
            else:
                grupos.append({**g, 'bottom': g['top']})
    cols = [g for g in grupos if re.search(r'[A-ZÁÉÍÓÚÑ]{3}|[A-ZÁÉÍÓÚÑ][a-záéíóúñ]{2,}', g['text']) and not any(d in g['text'].upper() for d in DIAS) and not re.search(r'\b(MARZO|ABRIL)\b', g['text'].upper()) and not re.fullmatch(r'[\d\s]+', g['text']) and not re.fullmatch(r'(SANTO|SANTA|DE RAMOS|DE RESURRECCIÓN|DE DOLORES|DE PASIÓN|HORARIOS|SOIRAROH)', g['text'].strip().upper())]
    if subs:
        # cada subcolumna toma el nombre de la hermandad que la cubre (o la más cercana)
        nombres = cols
        cols = []
        for s in sorted(subs, key=lambda s: s['x0']):
            cx = (s['x0'] + s['x1']) / 2
            # todos los rótulos que cubren la subcolumna (nombre de la hermandad y su sede), de arriba abajo
            cand = [n for n in nombres if n['x0'] - 25 <= cx <= n['x1'] + 25]
            if not cand and nombres: cand = [min(nombres, key=lambda n: abs((n['x0'] + n['x1']) / 2 - cx))]
            cols.append({'x0': s['x0'], 'x1': s['x1'], 'text': ' · '.join(n['text'] for n in sorted(cand, key=lambda n: n['top'])) or '?', 'sub': s['sub']})
    if not cols: return [], dia_actual
    cols.sort(key=lambda g: g['x0'])
    centros = [(c['x0'] + c['x1']) / 2 for c in cols]
    res = [{'dia': dia_actual, 'cabecera': c['text'], 'sub': c.get('sub', ''), 'puntos': []} for c in cols]
    cuerpo = [w for w in words if y0 - paso / 2 <= w['top'] <= y1 + paso * 1.6 and margen_izq <= w['x0'] and w['x1'] <= der_x and not (HORA.match(w['text']) and (w['x1'] < 0.13 * W or w['x0'] > 0.87 * W))]
    for ln in lineas(cuerpo):
        top = ln[0]['top']
        fila = min(filas, key=lambda f: abs(f[0] - top))
        for g in grupos_horizontales(ln, gap=5):
            cx = (g['x0'] + g['x1']) / 2
            k = min(range(len(centros)), key=lambda i: abs(centros[i] - cx))
            if abs(centros[k] - cx) > max(60, (cols[k]['x1'] - cols[k]['x0'])): continue
            t = g['text'].strip()
            m = re.search(r'\((\d{1,2}[:.]\d{2})\)', t)
            p = {'fila': fila[1].replace('.', ':'), 'y': round(top, 1), 'lugar': re.sub(r'\s*\(\d{1,2}[:.]\d{2}\)\s*', ' ', t).strip()}
            if m: p['hora'] = m.group(1).replace('.', ':')
            res[k]['puntos'].append(p)
    for r in res:
        r['puntos'].sort(key=lambda p: p['y'])
        # une líneas sueltas de un mismo nombre partido en dos renglones dentro de la misma franja
        unidos = []
        for p in r['puntos']:
            if unidos and unidos[-1]['fila'] == p['fila'] and not p.get('hora') and p['y'] - unidos[-1]['y'] < paso * 0.45 and not unidos[-1].get('hora'):
                unidos[-1]['lugar'] += ' ' + p['lugar']; continue
            unidos.append(p)
        # una hora suelta en el renglón siguiente es la del lugar anterior (CARRERA VIRGEN / (18:40))
        limpios = []
        for p in unidos:
            if not p['lugar'] and p.get('hora') and limpios and not limpios[-1].get('hora'):
                limpios[-1]['hora'] = p['hora']; continue
            if not p['lugar'] or (len(p['lugar']) > 34 and p['lugar'].isupper()): continue
            limpios.append(p)
        unidos = limpios
        for p in unidos: p.pop('y', None)
        r['puntos'] = unidos
    return [r for r in res if len(r['puntos']) >= 3], dia_actual

def main(pdf, out):
    todo, dia = [], None
    with pdfplumber.open(pdf) as P:
        for i, pg in enumerate(P.pages):
            cols, dia = pagina(pg, dia)
            for c in cols: c['pagina'] = i + 1
            todo += cols
    json.dump({'fuente': pdf.replace('\\', '/').split('/')[-1], 'columnas': todo}, open(out, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(out, len(todo), 'columnas')

if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
