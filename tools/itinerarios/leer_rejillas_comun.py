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

