# Ocho Capitales: lee el programa de Canal Sur de Cádiz 2026. Los itinerarios van en texto a dos columnas
# («NOMBRE» / «Itinerario: calle, calle, (Estación de Penitencia en la S.I.C.), …») y, en la ficha de cada hermandad,
# una tabla con las horas de SALIDA, CATEDRAL y ENTRADA de la cruz de guía y del paso.
# Uso: uvx --from pdfplumber python leer-cadiz.py <pdf> <salida.json>
import sys, re, json, pdfplumber

DIAS = ['VIERNES DE DOLORES', 'SÁBADO DE PASIÓN', 'DOMINGO DE RAMOS', 'LUNES SANTO', 'MARTES SANTO', 'MIÉRCOLES SANTO',
        'JUEVES SANTO', 'MADRUGADA', 'VIERNES SANTO', 'SÁBADO SANTO', 'DOMINGO DE RESURRECCIÓN']
H = re.compile(r'(\d{1,2}):(\d{2})\s*h')

def columnas(pg):
    W = pg.width
    return [pg.crop((0, 0, W / 2, pg.height)).extract_text() or '', pg.crop((W / 2, 0, W, pg.height)).extract_text() or '']

def itinerarios(P):
    texto = []
    for pg in P.pages:
        t = pg.extract_text() or ''
        if 'Itinerario:' in t: texto += columnas(pg)
    lineas = '\n'.join(texto).split('\n')
    res, dia, nombre, buf = [], None, None, None
    def cerrar():
        if nombre and buf is not None:
            t = re.sub(r'-\s*\n\s*', '', '\n'.join(buf)).replace('\n', ' ')
            t = re.sub(r'\s+', ' ', t).strip()
            calles, cat = [], False
            for c in re.split(r',\s*', t):
                c = c.strip().rstrip('.')
                if not c: continue
                if 'Estación de Penitencia' in c or 'S.I.C' in c:
                    c2 = re.sub(r'\(?Estaci[oó]n de Penitencia en la S\.I\.C\.\)?', '', c).strip()
                    if c2: calles.append({'lugar': c2})
                    calles.append({'lugar': 'Estación de penitencia en la Catedral', 'catedral': True}); continue
                calles.append({'lugar': re.sub(r'\s*\((Izda?|Izq|Dcha|Drcha)\.?\)', '', c, flags=re.I).strip()})
            res.append({'dia': dia, 'cabecera': nombre, 'puntos': calles})
    for ln in lineas:
        s = ln.strip()
        up = s.upper()
        d = next((x for x in DIAS if up == x), None)
        if d: cerrar(); dia, nombre, buf = d, None, None; continue
        if s.startswith('Itinerario:'):
            buf = [s[len('Itinerario:'):]]; continue
        if s and s == up and re.search(r'[A-ZÁÉÍÓÚÑ]{3}', s) and not re.search(r'\d', s) and len(s) < 60 and 'ITINERARIOS' not in s:
            cerrar(); nombre, buf = s, None; continue
        if buf is not None and s: buf.append(s)
    cerrar()
    return res

def horas(P):
    # Fichas: «SALIDA CATEDRAL ENTRADA» con dos filas (cruz de guía y paso). Se lee por posición.
    out = []
    for n, pg in enumerate(P.pages):
        ws = pg.extract_words(x_tolerance=1.5, y_tolerance=2)
        sal = [w for w in ws if w['text'] == 'SALIDA']
        for s in sal:
            fila = [w for w in ws if abs(w['top'] - s['top']) < 3]
            cat = next((w for w in fila if w['text'] == 'CATEDRAL'), None); ent = next((w for w in fila if w['text'] == 'ENTRADA'), None)
            if not (cat and ent): continue
            cols = {'salida': s['x0'], 'catedral': cat['x0'], 'entrada': ent['x0']}
            bajo = [w for w in ws if s['top'] + 3 < w['top'] < s['top'] + 40 and re.fullmatch(r'\d{1,2}:\d{2}', w['text'])]
            vals = {}
            for w in sorted(bajo, key=lambda w: w['top']):
                k = min(cols, key=lambda c: abs(cols[c] - w['x0']) if w['x0'] >= cols[c] - 40 else 999)
                vals.setdefault(k, []).append(w['text'])
            # nombre de la hermandad: rótulo grande más cercano por encima en esa media página
            mitad = 0 if s['x0'] < pg.width / 2 else 1
            cab = [w for w in ws if w['top'] < s['top'] and (w['x0'] < pg.width / 2) == (mitad == 0) and w['text'].isupper() and len(w['text']) > 2 and w['text'] not in ('SALIDA', 'CATEDRAL', 'ENTRADA', 'CRUZ', 'GUÍA', 'PASO')]
            out.append({'pagina': n + 1, 'horas': vals, 'cerca': ' '.join(w['text'] for w in sorted(cab, key=lambda w: -w['top'])[:6])})
    return out

if __name__ == '__main__':
    with pdfplumber.open(sys.argv[1]) as P:
        it = itinerarios(P)
        hs = horas(P)
    json.dump({'fuente': sys.argv[1].replace('\\', '/').split('/')[-1], 'columnas': it, 'horas': hs}, open(sys.argv[2], 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(sys.argv[2], len(it), 'itinerarios', len(hs), 'tablas de horas')
