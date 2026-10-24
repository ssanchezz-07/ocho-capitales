# Ocho Capitales · auditoría: cotejo de cada recorrido con la REJILLA del PDF oficial del que se leyó.
# Para cada tramo (cruz de guía / paso / palio) busca en el PDF, con las coordenadas de cada palabra (pdfplumber),
# dónde aparece cada calle del tramo; mira en qué columna cae la mayoría y qué dice la cabecera de esa columna.
# Marca: calles que el PDF no tiene en esa columna (celdas pegadas o de otra columna), cabecera que no nombra a la
# hermandad (columna cambiada) y tramos que no se encuentran.
# Uso: uvx --from pdfplumber python tools/auditoria/cotejo-rejillas.py <ciudad> [<ciudad>…]  → auditoria/rejilla-<ciudad>.json
import sys, os, re, json, unicodedata, statistics
import pdfplumber

RAIZ = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
PDF = {
    'sevilla': ['Sevilla/SEVILLA 26.pdf', 'Sevilla/Itinerario SS Sevilla 2026 2.pdf'],
    'cordoba': ['Córdoba/Itinerario Córdoba 2026.pdf'],
    'granada': ['Granada/GRANADA 26.pdf'],
    'huelva': ['Huelva/HUELVA 26.pdf'],
    'jaen': ['Jaén/JAEN 26.pdf'],
    'almeria': ['Almería/ALMERIA 26.pdf'],
}
STOP = {'la', 'el', 'los', 'las', 'de', 'del', 'y', 'e', 'en', 'parr', 'parroquia', 'iglesia', 'igl', 'cap', 'capilla', 'san', 'santa', 'santo', 'sta', 'sto', 'hermandad', 'hdad', 'nuestra', 'senora', 'nuestro', 'padre', 'jesus', 'maria', 'cristo', 'cruz', 'guia', 'paso', 'palio', 'misterio', 'salida', 'entrada', 'entra', 'templo', 'sale', 'virgen', 'santisimo', 'santisima', 'real', 'cofradia'}
ESPECIAL = re.compile(r'^(salida|entrada|entra|encierro|recogida|templo|a su templo|sale|se recoge|carrera oficial|c o|entrada c o|salida c o)$')

def norm(s):
    s = unicodedata.normalize('NFD', str(s or '')).encode('ascii', 'ignore').decode().lower()
    return re.sub(r'\s+', ' ', re.sub(r'[^a-z0-9 ]', ' ', s)).strip()

def toks(s):
    return {w for w in norm(s).split() if len(w) >= 4 and w not in STOP}

def cargar(rel):
    with open(os.path.join(RAIZ, rel), encoding='utf-8') as f:
        return json.load(f)

def palabras_pdf(rutas):
    out = []
    for rel in rutas:
        with pdfplumber.open(os.path.join(RAIZ, 'Itinerarios Semana Santa', '2026', rel)) as pdf:
            for i, pg in enumerate(pdf.pages):
                ws = pg.extract_words(keep_blank_chars=False, use_text_flow=False, x_tolerance=1.5)
                out.append({'pdf': rel, 'pag': i + 1, 'ws': ws, 'ancho': pg.width})
    return out

def buscar(pagina, lugar):
    """Posiciones (x centro, y) donde aparece la secuencia de palabras de «lugar» (en una línea o en dos seguidas)."""
    objetivo = norm(lugar).split()
    if not objetivo: return []
    ws = pagina['ws']; res = []
    nw = [norm(w['text']) for w in ws]
    for i, w in enumerate(nw):
        if not w or not objetivo[0].startswith(w[:max(3, len(w))]) and w != objetivo[0]: continue
        # avanzar por palabras cercanas (misma columna: |dx| pequeño) hasta cubrir el objetivo
        seq = [i]; texto = w; j = i
        while len(texto.split()) < len(objetivo) and j + 1 < len(ws):
            cand = [k for k in range(j + 1, min(j + 40, len(ws))) if abs(ws[k]['top'] - ws[j]['top']) < 14 and 0 <= ws[k]['x0'] - ws[j]['x1'] < 9 or (0 < ws[k]['top'] - ws[j]['top'] < 14 and abs(ws[k]['x0'] - ws[seq[0]]['x0']) < 25)]
            if not cand: break
            j = cand[0]; seq.append(j); texto += ' ' + nw[j]
        if texto.split()[:len(objetivo)] == objetivo:
            x = statistics.mean([(ws[k]['x0'] + ws[k]['x1']) / 2 for k in seq]); y = ws[seq[0]]['top']
            res.append((x, y))
    return res

def cabecera(pagina, x, y):
    """Texto de la cabecera de la columna x: palabras por encima de la primera hora de la rejilla, a ±45 pt de x."""
    ws = pagina['ws']
    horas = [w['top'] for w in ws if re.match(r'^\d{1,2}[:.]\d{2}$', w['text']) and w['x0'] < 60]
    tope = min(horas) if horas else y
    arriba = [w for w in ws if w['top'] < tope - 1 and abs((w['x0'] + w['x1']) / 2 - x) < 45]
    return ' '.join(w['text'] for w in sorted(arriba, key=lambda w: (round(w['top']), w['x0'])))

def main(ciudad):
    P = cargar('portal-cofrade/data/portal.json'); H = {h['slug']: h for h in P['hermandades']}
    R = cargar(f'site/data/recorridos/{ciudad}.json')
    pags = palabras_pdf(PDF[ciudad])
    out = []
    for slug, r in R['hermandades'].items():
        h = H.get(slug, {}); mio = toks(h.get('nombre', '')) | toks(h.get('nombre_oficial', '')) | toks(h.get('sede', ''))
        for t in (h.get('titulares') or []): mio |= toks(t.get('nombre', ''))
        for tramo, pts in r['tramos'].items():
            lugares = [p['lugar'] for p in pts if not ESPECIAL.match(norm(p['lugar'])) and len(norm(p['lugar'])) >= 4]
            if not lugares: out.append({'slug': slug, 'tramo': tramo, 'estado': 'sin calles'}); continue
            # mejor página: donde aparecen más calles del tramo
            mejor = None
            for pg in pags:
                hits = {l: buscar(pg, l) for l in lugares}
                n = sum(1 for v in hits.values() if v)
                if not mejor or n > mejor[0]: mejor = (n, pg, hits)
            n, pg, hits = mejor
            if n == 0: out.append({'slug': slug, 'tramo': tramo, 'estado': 'no se encuentra en el PDF', 'calles': len(lugares)}); continue
            xs = [p[0] for v in hits.values() for p in v]
            xm = statistics.median(xs)
            # columna: posiciones a menos de 30 pt de la mediana
            en_col = {l: any(abs(p[0] - xm) < 30 for p in v) for l, v in hits.items()}
            fuera = [l for l, ok in en_col.items() if not ok]
            cab = cabecera(pg, xm, min(p[1] for v in hits.values() for p in v))
            nombra = bool(toks(cab) & mio)
            otras = [s for s, x in H.items() if x['ciudad'] == ciudad and s != slug and toks(x['nombre']) and toks(x['nombre']) <= toks(cab)]
            pct = 100 * (len(lugares) - len(fuera)) // len(lugares)
            leida = len(toks(cab)) > 0
            if leida and (not nombra or otras): estado = 'columna de otra hermandad'
            else: estado = ('coincide' if pct >= 90 else 'parcial' if pct >= 70 else 'no coincide') + ('' if leida else ' (cabecera sin leer)')
            out.append({'slug': slug, 'dia': r['dia'], 'tramo': tramo, 'pdf': pg['pdf'], 'pag': pg['pag'], 'cabecera': cab[:140], 'calles': len(lugares), 'en_columna': len(lugares) - len(fuera), 'pct': pct, 'fuera_de_columna': fuera, 'cabecera_nombra': nombra, 'cabecera_tambien': otras, 'estado': estado})
    os.makedirs(os.path.join(RAIZ, 'auditoria'), exist_ok=True)
    with open(os.path.join(RAIZ, 'auditoria', f'rejilla-{ciudad}.json'), 'w', encoding='utf-8') as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
    c = {}
    for o in out: c[o['estado']] = c.get(o['estado'], 0) + 1
    rut = {}
    for o in out: rut.setdefault(o['slug'], []).append(o['estado'])
    bien = sum(1 for v in rut.values() if all(e == 'coincide' for e in v))
    print(ciudad, 'tramos', c, '| rutas con todos los tramos coincidentes:', bien, 'de', len(rut))

for c in sys.argv[1:]: main(c)
