# Ocho Capitales · laboratorio de rutas: captura con los dos trazados superpuestos (actual en rojo ancho, nuevo en azul fino).
# Uso: python -I capturar.py [id ...]   (sin ids = las 10). Salida: capturas/<id>.png
import json, sys, os
import matplotlib; matplotlib.use('Agg')
import matplotlib.pyplot as plt
D = os.path.dirname(os.path.abspath(__file__))
IDS = ['pollinica', 'pasion', 'dolores-del-puente', 'el-rico', 'paloma', 'fusionadas', 'resucitado', 'humildad-y-paciencia', 'estudiantes', 'esperanza']
ids = sys.argv[1:] or IDS
osm = json.load(open(os.path.join(D, '..', 'cache', 'osm-malaga.json'), encoding='utf8'))
cmp_ = json.load(open(os.path.join(D, 'salida', 'comparacion.json'), encoding='utf8'))
os.makedirs(os.path.join(D, 'capturas'), exist_ok=True)
for i in ids:
    i = i if i.endswith('-malaga') else i + '-malaga'
    tr = {}
    for k, f in (('actual', os.path.join(D, 'actual', 'salida', 'trazas', i + '.json')), ('nuevo', os.path.join(D, 'salida', 'nuevo', 'trazas', i + '.json'))):
        if os.path.exists(f): tr[k] = json.load(open(f, encoding='utf8'))
    pts = [p for t in tr.values() for p in t['ida'] + t['regreso']]
    xs = [p[1] for p in pts]; ys = [p[0] for p in pts]
    mx = 0.0025; x0, x1, y0, y1 = min(xs) - mx, max(xs) + mx, min(ys) - mx * .8, max(ys) + mx * .8
    fig, ax = plt.subplots(figsize=(11, 11 * (y1 - y0) / (x1 - x0) * 1.22))
    for e in osm['elements']:
        g = e.get('geometry'); h = (e.get('tags') or {}).get('highway')
        if not g or not h: continue
        X = [q['lon'] for q in g if q]; Y = [q['lat'] for q in g if q]
        if X and max(X) > x0 and min(X) < x1 and max(Y) > y0 and min(Y) < y1: ax.plot(X, Y, color='#d4d4d4', lw=.6, zorder=1)
    if 'actual' in tr:
        a = tr['actual']; g = a['ida'] + a['regreso'][1:]
        ax.plot([p[1] for p in g], [p[0] for p in g], color='#e74c3c', lw=6, alpha=.35, solid_capstyle='round', zorder=2, label='actual (reconstruir-malaga.mjs)')
    if 'nuevo' in tr:
        n = tr['nuevo']
        ax.plot([p[1] for p in n['ida']], [p[0] for p in n['ida']], color='#1f4e9c', lw=1.6, zorder=3, label='nuevo · ida')
        ax.plot([p[1] for p in n['regreso']], [p[0] for p in n['regreso']], color='#1f4e9c', lw=1.6, ls=(0, (4, 2)), zorder=3, label='nuevo · regreso')
        for k, p in enumerate(n['puntos']):
            if k % 4 == 0: ax.annotate(p['lugar'][:24], (p['lon'], p['lat']), fontsize=6, color='#333', zorder=4)
        s = n['ida'][0]; e = n['regreso'][-1]
        ax.plot(s[1], s[0], 'o', color='#27ae60', ms=10, zorder=5, label='salida (nuevo)'); ax.plot(e[1], e[0], 's', color='#111', ms=6, zorder=6, label='entrada (nuevo)')
    c = cmp_.get(i, {})
    def r(m):
        x = c.get(m)
        return f"{m}: {x['recorridas']}/{x['comprobables']} calles, {x['en_orden']} en orden, salida {x['salida_m']} m, retrocesos {x['retrocesos']}, {x['largo_m']} m" if x else m + ': -'
    ax.set_title(i.replace('-malaga', '') + '\n' + r('actual') + '\n' + r('nuevo'), fontsize=8)
    ax.legend(loc='lower left', fontsize=7)
    ax.set_xlim(x0, x1); ax.set_ylim(y0, y1); ax.set_aspect(1 / 0.8); ax.axis('off')
    out = os.path.join(D, 'capturas', i.replace('-malaga', '') + '.png')
    fig.savefig(out, dpi=90, bbox_inches='tight'); plt.close(fig)
    print(out)
