# Ocho Capitales: lee el programa de Canal Sur Radio de la Semana Santa de Cádiz 2026 (itinerarios del Consejo).
# Saca, sin interpretar nada:
#  - el texto literal de cada itinerario (págs. 32-35, a dos columnas), con su jornada y su cabecera;
#  - la tabla de horas de cada ficha (págs. 6-30), leída por la posición de cada hora bajo su columna;
#  - la «Sede Canónica» de cada ficha.
# Las fichas y los itinerarios van en el mismo orden (33 en 2026), así que se emparejan por orden y se comprueba.
# Uso: uvx --from pdfplumber python -I leer-cadiz-2026.py "<CADIZ 26.pdf>" <salida.json>
import sys, re, json, pdfplumber

DIAS = ['VIERNES DE DOLORES', 'SÁBADO DE PASIÓN', 'DOMINGO DE RAMOS', 'LUNES SANTO', 'MARTES SANTO', 'MIERCOLES SANTO', 'MIÉRCOLES SANTO',
        'JUEVES SANTO', 'MADRUGADA', 'VIERNES SANTO', 'SÁBADO SANTO', 'DOMINGO DE RESURRECCIÓN']
HORA = re.compile(r'^(\d{1,2})[:.](\d{2})h?$')
COLS = ('SALIDA', 'NUEVA', 'CATEDRAL', 'CANDELARIA', 'PALILLERO', 'ENTRADA')


def itinerarios(P):
    lineas = []
    for n, pg in enumerate(P.pages):
        t = pg.extract_text() or ''
        if 'Itinerario' not in t or n < 30: continue
        W = pg.width
        for a, b in ((0, W / 2), (W / 2, W)):
            for ln in (pg.crop((a, 0, b, pg.height)).extract_text() or '').split('\n'):
                lineas.append((n + 1, ln.strip()))
    res, dia, cur = [], None, None
    for pag, s in lineas:
        if not s or re.fullmatch(r'(ITINERARIOS\s*)?\d+', s): continue  # números y rótulos de página
        if s.upper() in DIAS: dia = s.upper().replace('MIERCOLES', 'MIÉRCOLES'); cur = None; continue
        if s.startswith('Itinerario'):
            cur['texto'] = [re.sub(r'^Itinerario\s*:\s*', '', s)]; cur['pagina'] = pag; continue
        if s == s.upper() and re.search(r'[A-ZÁÉÍÓÚÑ]{3}', s) and 'ESTACIÓN' not in s and 'S.I.C' not in s:
            cur = {'dia': dia, 'cabecera': s, 'texto': None}; res.append(cur); continue
        if cur and cur['texto'] is not None: cur['texto'].append(s)
    for r in res:
        t = ''
        for s in r['texto']:
            t = t[:-1] + s if t.endswith('-') else (t + ' ' + s if t else s)  # «Mon-» + «tañés»
        r['texto'] = re.sub(r'\s+', ' ', t).strip()
    return res


def fichas(P):
    out = []
    for n, pg in enumerate(P.pages[5:31], start=6):
        ws = pg.extract_words(x_tolerance=1.5, y_tolerance=2)
        eventos = []
        for w in ws:
            if w['text'].startswith('Can') and 'nica' in w['text'] and any(x['text'] == 'Sede' and abs(x['top'] - w['top']) < 3 for x in ws):
                cerca = [x for x in ws if -2 <= x['top'] - w['top'] < 30 and x['x0'] >= w['x0'] - 45]
                txt = ' '.join(x['text'] for x in sorted(cerca, key=lambda x: (round(x['top'] / 4), x['x0'])))
                m = re.search(r'Can[oó]nica:?\s*(.*?)\s*(A[ñn]o |de fundaci|https?:|X:|M[uú]sica|\d|$)', txt)
                eventos.append((w['top'], 'sede', m.group(1) if m else txt))
        sal = [w for w in ws if w['text'] == 'SALIDA']
        for s in sal:
            fila = [w for w in ws if abs(w['top'] - s['top']) < 4]
            if not any(w['text'] == 'ENTRADA' for w in fila): continue
            heads = [w['text'] for w in sorted(fila, key=lambda w: w['x0']) if w['text'] in COLS]
            anio = next((w['text'] for w in ws if re.fullmatch(r'20\d\d', w['text']) and abs(w['top'] - s['top']) < 16), None)
            lim = min([w['top'] for w in sal if w['top'] > s['top'] + 20] + [s['top'] + 105])
            tw = [w for w in ws if s['top'] + 3 < w['top'] < lim and HORA.match(w['text'])]
            filas = []
            for w in sorted(tw, key=lambda w: w['top']):
                if filas and abs(filas[-1][0]['top'] - w['top']) < 5: filas[-1].append(w)
                else: filas.append([w])
            filas = [sorted(f, key=lambda w: w['x0']) for f in filas]
            ref = max(filas, key=len); cx = [w['x0'] for w in ref]
            cols = []
            for h in heads:
                if h == 'CATEDRAL' and len(ref) > len(heads): cols += ['catedral_entrada', 'catedral_salida']
                else: cols.append(h.lower())
            tabla = []
            for f in filas:
                d = {}
                for w in f:
                    k = min(range(len(cx)), key=lambda i: abs(cx[i] - w['x0']))
                    m = HORA.match(w['text']); d[cols[k]] = f'{int(m[1]):02d}:{m[2]}'
                tabla.append(d)
            eventos.append((s['top'], 'horas', {'pagina': n, 'anio_tabla': anio, 'columnas': cols, 'filas': tabla, 'columnas_ok': len(cols) == len(cx)}))
        for t, k, v in sorted(eventos, key=lambda e: e[0]):
            if k == 'sede':
                # la misma sede puede repetirse en la ficha (arriba y junto a la música): una por ficha
                if out and out[-1]['pagina'] == n and 'horas' not in out[-1] and out[-1]['sede_canonica'] == v: continue
                out.append({'pagina': n, 'sede_canonica': v})
            else:
                out[-1]['horas'] = v
    return out


if __name__ == '__main__':
    with pdfplumber.open(sys.argv[1]) as P:
        it, fi = itinerarios(P), fichas(P)
    assert len(it) == len(fi), f'{len(it)} itinerarios y {len(fi)} fichas'
    for a, b in zip(it, fi): a['ficha'] = b
    json.dump({'fuente': 'Programa de la Semana Santa de Cádiz 2026, Canal Sur Radio (itinerarios del Consejo)',
               'url': 'https://www.canalsur.es/resources/archivos_offline/2026/3/26/1774544876433CADIZ_26.pdf',
               'hermandades': it}, open(sys.argv[2], 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(sys.argv[2], len(it), 'itinerarios con su ficha')
