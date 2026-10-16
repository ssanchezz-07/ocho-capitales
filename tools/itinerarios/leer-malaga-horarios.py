# Ocho Capitales: lee «Horarios_ACC_SS_2026.pdf» de la Agrupación de Cofradías de Málaga. Cada página es una jornada
# con fichas de hermandad: nombre oficial y sede a la izquierda, horas en columnas SALIDA · TRIBUNA · TORRE SUR ·
# CATEDRAL · ENCIERRO a la derecha (una ficha puede no tener alguna) y debajo «Itinerario| calle, calle, …».
# Las horas se asignan a su columna por posición (la hora más cercana al centro de cada cabecera).
# Salida: {fuente, fichas: [{dia, cabecera, pagina, horas: {salida, tribuna, torre_sur, catedral, encierro}, puntos}]}
# Uso: uvx --from pdfplumber python leer-malaga-horarios.py <pdf> <salida.json>
import sys, re, json, pdfplumber

HORA = re.compile(r'^(\d{1,2}):(\d{2})h$')
DIAS = ['VIERNES DE DOLORES', 'SÁBADO DE PASIÓN', 'DOMINGO DE RAMOS', 'LUNES SANTO', 'MARTES SANTO', 'MIÉRCOLES SANTO',
        'JUEVES SANTO', 'VIERNES SANTO', 'SÁBADO SANTO', 'DOMINGO DE RESURRECCIÓN']
COLS = [('salida', ('SALIDA',)), ('tribuna', ('TRIBUNA',)), ('torre_sur', ('TORRE', 'SUR')), ('catedral', ('CATEDRAL',)), ('encierro', ('ENCIERRO',))]
TEMPLO = re.compile(r'^(Casa Hermandad|Iglesia|Parroquia|Bas[ií]lica|Capilla|Ermita|Santuario|Oratorio|Templo|a su Templo)', re.I)

def lineas(ws, tol=2):
    out = []
    for w in sorted(ws, key=lambda w: (w['top'], w['x0'])):
        if out and abs(out[-1][0]['top'] - w['top']) <= tol: out[-1].append(w)
        else: out.append([w])
    return [sorted(l, key=lambda w: w['x0']) for l in out]

def mayusculas(txt):
    letras = [c for c in txt if c.isalpha()]
    return len(letras) >= 8 and sum(c.isupper() for c in letras) / len(letras) > 0.7

def calles(txt):
    t = re.sub(r'^Itinerario\s*\|?\s*,?\s*(Itinerario\s+)?', '', txt.strip())
    t = re.sub(r'\s*Estos horarios e itinerarios pueden.*$', '', t)  # nota final del PDF
    t = re.sub(r'^asa Hermandad', 'Casa Hermandad', t)  # la «C» capitular no está en la capa de texto (Descendimiento)
    t = re.sub(r'\s+', ' ', t).strip().rstrip('.,')
    trozos = [c.strip().rstrip('.') for c in re.split(r',\s*', t) if c.strip().strip('.')]
    # el último tramo suele ser «…, Calle y Casa Hermandad» / «… e Iglesia de San Juan»: se separa solo si lo que sigue es el templo
    if trozos:
        for m in re.finditer(r'\s(?:y|e)\s', trozos[-1]):
            izq, der = trozos[-1][:m.start()].strip(), trozos[-1][m.end():].strip()
            if izq and TEMPLO.match(der): trozos[-1:] = [izq, der]; break
    pts = []
    for c in trozos:
        if re.search(r'Estaci[oó]n de Penitencia|S\.I\.C\.?B?\.?$', c):
            pts.append({'lugar': 'Estación de penitencia en la Catedral', 'catedral': True}); continue
        # «(Salida 16:00)» dentro del itinerario: hora de salida de ese punto (Monte Calvario sale de dos sitios)
        m = re.search(r'\(\s*Salida\s+(\d{1,2}:\d{2})\s*\)', c)
        if m:
            l = re.sub(r'\s*\(\s*Salida\s+\d{1,2}:\d{2}\s*\)\s*', ' ', c).strip()
            pts.append({'lugar': l, 'hora': m.group(1).zfill(5), 'salida': True}); continue
        pts.append({'lugar': c})
    return pts

def main(pdf, out):
    fichas, dia = [], None
    # texto continuo de la columna izquierda (puede pasar de página) y horas por página
    with pdfplumber.open(pdf) as P:
        for n, pg in enumerate(P.pages):
            ws = pg.extract_words(x_tolerance=1.5, y_tolerance=2)
            cab = [w for w in ws if w['text'] in ('SALIDA', 'TRIBUNA', 'TORRE', 'SUR', 'CATEDRAL', 'ENCIERRO') and w['x0'] > 0.5 * pg.width]
            if len(cab) < 5: continue
            ytab = min(w['top'] for w in cab)
            titulo = ' '.join(w['text'] for w in ws if w['top'] < ytab + 3 and w['x0'] < 0.6 * pg.width).upper()
            titulo = re.sub(r'\s+', ' ', titulo)
            dia = next((d for d in DIAS if d in titulo), dia)
            centros = {}
            for k, pal in COLS:
                ps = [w for w in cab if w['text'] in pal]
                if ps: centros[k] = (min(w['x0'] for w in ps) + max(w['x1'] for w in ps)) / 2
            horas = [w for w in ws if HORA.match(w['text']) and w['x0'] > 0.55 * pg.width and w['top'] > ytab + 5]
            izq = [w for w in ws if w['x1'] < 0.62 * pg.width and w['top'] > ytab + 5 and not HORA.match(w['text'])]
            lns = [l for l in lineas(izq) if 'HERMANDADES' not in ' '.join(w['text'] for w in l)]
            # inicio de ficha: primera línea en mayúsculas tras un itinerario (o al principio de la página)
            i, bloques = 0, []
            for j, l in enumerate(lns):
                txt = ' '.join(w['text'] for w in l)
                if txt.startswith('Itinerario'):
                    bloques.append({'it': j})
            # cada bloque: nombre = líneas en mayúsculas (y la sede) antes de «Itinerario»; itinerario hasta el siguiente nombre
            marcas = [b['it'] for b in bloques]
            for bi, it in enumerate(marcas):
                ini = marcas[bi - 1] + 1 if bi else 0
                # salta la cola del itinerario anterior (líneas en minúscula) hasta la primera en mayúsculas
                k = ini
                while k < it and not mayusculas(' '.join(w['text'] for w in lns[k])): k += 1
                cola_prev = lns[ini:k]
                if bi == 0 and cola_prev and fichas:  # itinerario que viene de la página anterior
                    fichas[-1]['_it'] += ' ' + ' '.join(' '.join(w['text'] for w in l) for l in cola_prev)
                elif bi and cola_prev:
                    fichas[-1]['_it'] += ' ' + ' '.join(' '.join(w['text'] for w in l) for l in cola_prev)
                nombre = ' '.join(' '.join(w['text'] for w in l) for l in lns[k:it])
                y0 = lns[k][0]['top'] - 3 if k < it else lns[it][0]['top'] - 40
                y1 = lns[it][0]['top']
                hs = {}
                for h in sorted([h for h in horas if y0 <= h['top'] < y1], key=lambda h: (h['top'], h['x0'])):
                    cx = (h['x0'] + h['x1']) / 2
                    col = min(centros, key=lambda c: abs(centros[c] - cx))
                    hs.setdefault(col, []).append(h['text'][:-1].zfill(5))
                fichas.append({'dia': dia, 'cabecera': nombre, 'pagina': n + 1, 'horas': hs, '_it': ' '.join(w['text'] for w in lns[it])})
            # cola final de la página: sigue el itinerario de la última ficha
            if marcas and fichas:
                resto = lns[marcas[-1] + 1:]
                fichas[-1]['_it'] += ' ' + ' '.join(' '.join(w['text'] for w in l) for l in resto)
    for f in fichas:
        t = re.sub(r'(\w)-\s+(\w)', r'\1\2', f.pop('_it'))  # palabras partidas con guion al final de línea
        f['puntos'] = calles(t)
    json.dump({'fuente': pdf.replace('\\', '/').split('/')[-1], 'fichas': fichas}, open(out, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(out, len(fichas), 'fichas')

if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
