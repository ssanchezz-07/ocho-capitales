# Ocho Capitales · rutas: comprueba el plano «En la calle» de una capital con Playwright a 390 y 1440 px, sobre site/dist
# (lo compila antes en modo de prueba, con la temporada forzada a Semana Santa). Levanta su propio servidor estático en un puerto libre.
# Comprueba: que el plano trae todos los recorridos de site/data/recorridos/<c>.json; que cada jornada dibuja los suyos;
# que cada recorrido tiene sus puntos oficiales repartidos por el trazado (no amontonados) y, si tiene regreso, con geometría;
# sin errores en la consola ni desbordamiento horizontal. Capturas: capturas/<c>/plano-<ancho>.png
# Uso: python -I probar-plano.py <capital> [--sin-compilar]
import json, os, sys, threading, functools, http.server, socketserver
os.environ.setdefault('PLAYWRIGHT_BROWSERS_PATH', r'C:\Users\pablo\Herramientas-IA\ms-playwright')
from playwright.sync_api import sync_playwright
D = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.join(D, '..', '..', '..', 'site')
if len(sys.argv) < 2: sys.exit('Uso: python -I probar-plano.py <capital>')
c = sys.argv[1]
OUT = os.path.join(D, 'capturas', c); os.makedirs(OUT, exist_ok=True)
# Fuera de temporada el plano solo enseña las extraordinarias vigentes: para ver todos los recorridos se compila en modo de prueba
# (OC_TEMPORADA=semana-santa: franja roja y «noindex» en cada página; no se publica). --sin-compilar usa el dist que haya.
if '--sin-compilar' not in sys.argv:
    import subprocess
    print('Compilando en modo de prueba (temporada forzada a Semana Santa)…', flush=True)
    r = subprocess.run(['node', os.path.join(SITE, 'build.mjs')], env={**os.environ, 'OC_TEMPORADA': 'semana-santa'}, capture_output=True, text=True, encoding='utf8')
    if r.returncode: sys.exit('La compilación ha fallado:\n' + (r.stderr or r.stdout)[-2000:])
R = json.load(open(os.path.join(SITE, 'data', 'recorridos', c + '.json'), encoding='utf8'))
CAL = json.load(open(os.path.join(SITE, 'dist', 'data', 'calle', c + '.json'), encoding='utf8'))
ok = []
def check(cond, txt): ok.append(bool(cond)); print(('OK   ' if cond else 'FALLO') + ' ' + txt)

# ---- datos compilados ----
esperadas = len(R['hermandades']) + len(R.get('extraordinarias', {}))
check(len(CAL['hermandades']) == esperadas, f"el plano trae {len(CAL['hermandades'])} recorridos ({len(R['hermandades'])} + {len(R.get('extraordinarias', {}))} extraordinarias)")
malos = []
for h in CAL['hermandades']:
    if h['s'] not in R['hermandades']: continue
    P = h['t'].get('paso') or h['t'].get('cruz') or []
    of = [p for p in P if not p[6]]
    distintos = len({(p[0], p[1]) for p in of})
    reg_of = sum(1 for p in of if p[7]); reg = sum(1 for p in P if p[7])
    if distintos < 0.6 * len(of): malos.append(f"{h['s']}: puntos amontonados ({distintos} sitios para {len(of)} puntos)")
    if reg_of > 1 and reg <= reg_of: malos.append(f"{h['s']}: regreso sin geometría")
check(not malos, 'cada recorrido con sus puntos repartidos y el regreso dibujado' + ('' if not malos else ': ' + '; '.join(malos[:6])))

# ---- servidor estático ----
H = functools.partial(http.server.SimpleHTTPRequestHandler, directory=os.path.join(SITE, 'dist'))
H = type('H', (http.server.SimpleHTTPRequestHandler,), {'log_message': lambda *a: None}); H = functools.partial(H, directory=os.path.join(SITE, 'dist'))
srv = socketserver.TCPServer(('127.0.0.1', 0), H); puerto = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()
URL = f'http://127.0.0.1:{puerto}/en-la-calle/{c}/'
dias = {}
for h in CAL['hermandades']:
    if h['s'] in R['hermandades']: dias.setdefault(h['d'], set()).add(h['s'])
with sync_playwright() as p:
    b = p.chromium.launch()
    for w, alto in ((390, 844), (1440, 900)):
        pg = b.new_page(viewport={'width': w, 'height': alto}); err = []
        pg.on('console', lambda m: err.append(m.text) if m.type == 'error' and 'Failed to load resource' not in m.text else None)  # los fallos de red del entorno de prueba no son errores del plano; pg.on('pageerror', lambda e: err.append(str(e)))
        pg.goto(URL); pg.wait_for_selector('path.oc-c-ruta', state='attached', timeout=20000)
        faltan = []
        ocultas = []
        for dia, ss in dias.items():
            # fuera de temporada (site/data/temporada.json) el plano solo enseña las extraordinarias vigentes: se prueban las jornadas visibles
            if not pg.locator(f'button[data-dia="{dia}"]').count(): ocultas.append(dia); continue
            pg.locator(f'button[data-dia="{dia}"]').click(); pg.wait_for_timeout(600)
            vis = set(pg.evaluate("[...document.querySelectorAll('path.oc-c-ruta:not(.is-regreso):not(.is-aprox)')].filter(e => e.getTotalLength() > 50).map(e => e.dataset.s)"))
            if ss - vis: faltan.append(f"{dia}: {', '.join(sorted(ss - vis))}")
        check(not faltan and len(ocultas) < len(dias), f'{w}px: cada jornada visible dibuja todos sus recorridos ({len(dias) - len(ocultas)} de {len(dias)} jornadas' + (f'; {len(ocultas)} ocultas fuera de temporada' if ocultas else '') + ')' + ('' if not faltan else ': ' + '; '.join(faltan)))
        sw = pg.evaluate('document.documentElement.scrollWidth'); check(sw <= w, f'{w}px: sin desbordamiento horizontal ({sw} px)')
        check(not err, f'{w}px: sin errores en la consola' + ('' if not err else ': ' + ' | '.join(err[:3])))
        pg.locator('.oc-calle-mapa').scroll_into_view_if_needed(); pg.wait_for_timeout(300)
        pg.screenshot(path=os.path.join(OUT, f'plano-{w}.png'))
        pg.close()
    b.close()
srv.shutdown()
print(f'{sum(ok)}/{len(ok)} comprobaciones'); sys.exit(0 if all(ok) else 1)
