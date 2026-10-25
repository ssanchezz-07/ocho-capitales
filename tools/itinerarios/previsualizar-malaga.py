# Dibuja el recorrido reconstruido de una hermandad sobre el callejero de OSM (ida continua, regreso discontinuo).
# Uso: python previsualizar-malaga.py <id> [salida.png]
import json, sys, os
import matplotlib; matplotlib.use('Agg')
import matplotlib.pyplot as plt
D = os.path.dirname(os.path.abspath(__file__))
i = sys.argv[1]; out = sys.argv[2] if len(sys.argv) > 2 else os.path.join(D, 'cache', 'trazas-malaga', i + '.png')
t = json.load(open(os.path.join(D, 'cache', 'trazas-malaga', i + '.json'), encoding='utf8'))
osm = json.load(open(os.path.join(D, 'cache', 'osm-malaga.json'), encoding='utf8'))
pts = [(p[1], p[0]) for p in t['ida'] + t['regreso']]
xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
mx = 0.003; x0, x1, y0, y1 = min(xs) - mx, max(xs) + mx, min(ys) - mx * .8, max(ys) + mx * .8
fig, ax = plt.subplots(figsize=(10, 10 * (y1 - y0) / (x1 - x0) * 1.22))
for e in osm['elements']:
    g = e.get('geometry'); h = (e.get('tags') or {}).get('highway')
    if not g or not h: continue
    X = [q['lon'] for q in g if q]; Y = [q['lat'] for q in g if q]
    if X and max(X) > x0 and min(X) < x1 and max(Y) > y0 and min(Y) < y1: ax.plot(X, Y, color='#d0d0d0', lw=.6)
ax.plot([p[1] for p in t['ida']], [p[0] for p in t['ida']], color='#c0392b', lw=2.6)
ax.plot([p[1] for p in t['regreso']], [p[0] for p in t['regreso']], color='#1f4e9c', lw=1.8, ls=(0, (4, 3)))
for n, p in enumerate(t['puntos']):
    if p['lugar'] and (n % 3 == 0 or n in (0, len(t['puntos']) - 1)): ax.annotate(p['lugar'][:26], (p['lon'], p['lat']), fontsize=6, color='#222')
a = t['puntos'][0]; z = t['puntos'][-1]
ax.plot(a['lon'], a['lat'], 'go', ms=9); ax.plot(z['lon'], z['lat'], 'ks', ms=7)
ax.set_xlim(x0, x1); ax.set_ylim(y0, y1); ax.set_aspect(1 / 0.8); ax.axis('off'); ax.set_title(i + ' · ida continua (rojo) · regreso discontinuo (azul) · verde=salida, negro=entrada', fontsize=8)
fig.savefig(out, dpi=80, bbox_inches='tight')
print(out)
