# Ocho Capitales · rutas: captura con los dos trazados superpuestos: lo publicado en rojo ancho y el nuevo en azul fino
# (ida continua, regreso discontinuo). Título con las cifras del evaluador y lo que propone.
# Uso: python -I capturar.py <capital> [id ...]   Salida: capturas/<capital>/<id>.png (no se sube a git)
import json, sys, os
import matplotlib; matplotlib.use('Agg')
import matplotlib.pyplot as plt
D = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.join(D, '..', '..', '..')
if len(sys.argv) < 2: sys.exit('Uso: python -I capturar.py <capital> [id ...]')
c = sys.argv[1]
leer = lambda f: json.load(open(f, encoding='utf8')) if os.path.exists(f) else {}
lista = leer(os.path.join(D, 'listas', c + '.json')).get('hermandades', {})
ids = [i if i in lista else i + '-' + c for i in sys.argv[2:]] or list(lista)
osm = leer(os.path.join(D, '..', 'cache', 'osm-' + c + '.json'))
pub = leer(os.path.join(RAIZ, 'site', 'data', 'recorridos', c + '.json')).get('hermandades', {})
ev = leer(os.path.join(D, 'salida', c, 'evaluacion.json'))
vias = [(e['tags']['highway'], [q['lon'] for q in e['geometry'] if q], [q['lat'] for q in e['geometry'] if q]) for e in osm.get('elements', []) if e.get('geometry') and (e.get('tags') or {}).get('highway')]
os.makedirs(os.path.join(D, 'capturas', c), exist_ok=True)

def publicado(h):
    if not h or 'tramos' not in h: return None
    pts = h['tramos'].get('paso') or list(h['tramos'].values())[0]
    geo, k = [], -1
    for p in pts:
        if p.get('lat') is None: continue
        geo.append([p['lat'], p['lon']])
        if p.get('tramo') == 'regreso' and k < 0: k = len(geo) - 1
        geo += p.get('via') or []
    return geo

for i in ids:
    tn = leer(os.path.join(D, 'salida', c, 'trazas', i + '.json'))
    gp = publicado(pub.get(i))
    pts = (gp or []) + (tn.get('ida', []) + tn.get('regreso', []))
    if not pts: print('sin trazados:', i); continue
    xs = [p[1] for p in pts]; ys = [p[0] for p in pts]
    mx = 0.0025; x0, x1, y0, y1 = min(xs) - mx, max(xs) + mx, min(ys) - mx * .8, max(ys) + mx * .8
    fig, ax = plt.subplots(figsize=(11, 11 * (y1 - y0) / (x1 - x0) * 1.22))
    for h, X, Y in vias:
        if X and max(X) > x0 and min(X) < x1 and max(Y) > y0 and min(Y) < y1: ax.plot(X, Y, color='#d4d4d4', lw=.6, zorder=1)
    if gp: ax.plot([p[1] for p in gp], [p[0] for p in gp], color='#e74c3c', lw=6, alpha=.35, solid_capstyle='round', zorder=2, label='publicado')
    if tn:
        ax.plot([p[1] for p in tn['ida']], [p[0] for p in tn['ida']], color='#1f4e9c', lw=1.6, zorder=3, label='nuevo · ida')
        ax.plot([p[1] for p in tn['regreso']], [p[0] for p in tn['regreso']], color='#1f4e9c', lw=1.6, ls=(0, (4, 2)), zorder=3, label='nuevo · regreso')
        for k, p in enumerate(tn['puntos']):
            if k % 4 == 0: ax.annotate(p['lugar'][:24], (p['lon'], p['lat']), fontsize=6, color='#333', zorder=4)
        s = tn['ida'][0]; e = tn['regreso'][-1]
        ax.plot(s[1], s[0], 'o', color='#27ae60', ms=10, zorder=5, label='salida (nuevo)'); ax.plot(e[1], e[0], 's', color='#111', ms=6, zorder=6, label='entrada (nuevo)')
    r = ev.get(i, {})
    def linea(m):
        x = r.get(m)
        return f"{m}: {x['recorridas']}/{x['comprobables']} calles, {x['en_orden']} en orden, salida {x['salida_m']} m, entrada {x['entrada_m']} m, retrocesos {x['retrocesos']}, {x['largo_m']} m" if x else m + ': -'
    d = r.get('decision', {})
    ax.set_title(i.replace('-' + c, '') + f"  ·  propuesta: {d.get('queda', '-')}\n" + linea('publicado') + '\n' + linea('nuevo') + ('\n' + ' · '.join(d.get('motivo', []))[:180] if d else ''), fontsize=8)
    ax.legend(loc='lower left', fontsize=7)
    ax.set_xlim(x0, x1); ax.set_ylim(y0, y1); ax.set_aspect(1 / 0.8); ax.axis('off')
    out = os.path.join(D, 'capturas', c, i.replace('-' + c, '') + '.png')
    fig.savefig(out, dpi=90, bbox_inches='tight'); plt.close(fig)
    print(out)
