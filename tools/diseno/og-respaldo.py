# Ocho Capitales · imagen para compartir (og:image, 1200×630) de las hermandades sin foto de un titular (oc-diseno, 4-nov).
# Su nazareno (la lámina assets/naz/<slug>.svg que genera build.mjs), su nombre con las letras de la web y el terciopelo de su capital.
# Se hace con Playwright porque sharp no lee las fuentes woff2 de la web y en la publicación no está; las imágenes se guardan en
# site/assets/og/h-<slug>.jpg y build.mjs las usa solo mientras la hermandad no tenga foto.
# Volver a ejecutar cuando cambien los hábitos o las fotos: compila primero y sirve la web. Guarda la huella de cada lámina en
# assets/og/huellas.json: si el nazareno cambia, build.mjs deja de usar la imagen vieja (comparte la genérica) y avisa.
# Uso: python -I og-respaldo.py [base_url]   (por defecto http://localhost:8091)
import hashlib, json, os, re, sys, urllib.request
os.environ.setdefault('PLAYWRIGHT_BROWSERS_PATH', os.path.expandvars(r'%LOCALAPPDATA%\ms-playwright'))
from playwright.sync_api import sync_playwright
BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8091'
RAIZ = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
OUT = os.path.join(RAIZ, 'site', 'assets', 'og')
D = json.load(open(os.path.join(RAIZ, 'portal-cofrade', 'data', 'portal.json'), encoding='utf8'))
CAP = {c['slug']: c for c in D['capitales']}
esc = lambda t: str(t).replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
PAG = '''<!doctype html><html><head><meta charset="utf-8"><style>
@font-face { font-family: K; src: url(/assets/fonts/karantina-latin.woff2) format("woff2"); }
@font-face { font-family: H; src: url(/assets/fonts/heebo-latin.woff2) format("woff2"); font-weight: 100 900; }
html, body { margin: 0; width: 1200px; height: 630px; overflow: hidden; }
body { position: relative; display: grid; grid-template-columns: 1fr 470px; align-items: center; color: #f6efe2; font-family: H, sans-serif;
  background: radial-gradient(120% 110% at 85% 0%, __C__ 0%, __P__ 55%, #13071d 100%); }
body::after { content: ""; position: absolute; inset: 18px; border: 2px solid rgb(201 161 74 / .6); border-radius: 22px; pointer-events: none; }
.txt { padding: 0 40px 0 84px; }
.cap { margin: 0 0 18px; display: flex; align-items: center; gap: 16px; font: 700 26px/1 H; letter-spacing: .16em; text-transform: uppercase; color: #e2c27a; }
.cap::before { content: ""; width: 46px; height: 3px; border-radius: 3px; background: #e2c27a; }
h1 { margin: 0; font: 400 __T__px/.9 K; letter-spacing: .01em; text-wrap: balance; }
.dia { margin: 22px 0 0; font: 500 30px/1.2 H; color: #e9dcf2; }
.marca { position: absolute; left: 84px; bottom: 52px; font: 400 40px/1 K; letter-spacing: .02em; color: #f0d79c; }
.fig { height: 630px; display: grid; place-items: center; }
.fig svg { height: 540px; width: auto; filter: drop-shadow(0 24px 30px rgb(0 0 0 / .5)); }
</style></head><body><div class="txt"><p class="cap">__CAPN__</p><h1>__N__</h1><p class="dia">__DIA__</p></div><div class="fig">__SVG__</div><p class="marca">Ocho Capitales</p></body></html>'''
os.makedirs(OUT, exist_ok=True)
hechas = []; huellas = {}
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1200, 'height': 630})
    pg.goto(BASE + '/hermandades/', wait_until='domcontentloaded')
    NECESITAN = set(json.loads(urllib.request.urlopen(BASE + '/assets/naz/og.json').read()))  # sin ninguna foto (build.mjs)
    for h in D['hermandades']:
        if h['slug'] not in NECESITAN: continue  # tiene foto (o solo enlazada a Commons, que comparte la suya)
        svg = urllib.request.urlopen(f'{BASE}/assets/naz/{h["slug"]}.svg').read().decode('utf8')
        huellas[h['slug']] = hashlib.sha256(svg.encode('utf8')).hexdigest()[:12]  # build.mjs la compara con la lámina de hoy
        # solo la figura: sin el terciopelo ni el galón de la lámina, encuadrada en su alto
        svg = re.sub(r'<rect[^>]*/>', '', svg).replace('viewBox="0 0 360 240" width="360" height="240"', 'viewBox="124 6 112 228"')
        c = CAP[h['ciudad']]
        n = h['nombre']; t = 150 if len(n) <= 14 else 118 if len(n) <= 24 else 92
        html = PAG.replace('__C__', c['color']).replace('__P__', 'color-mix(in srgb, ' + c['color'] + ' 55%, #13071d)').replace('__T__', str(t)) \
            .replace('__CAPN__', esc('Semana Santa de ' + c['nombre'])).replace('__N__', esc(n)).replace('__DIA__', esc(h.get('dia') or '')).replace('__SVG__', svg)
        pg.set_content(html, wait_until='networkidle'); pg.evaluate('document.fonts.ready')
        f = os.path.join(OUT, f'h-{h["slug"]}.jpg')
        pg.screenshot(path=f, type='jpeg', quality=80)
        hechas.append(h['slug'])
    b.close()
# las que ya tienen foto no necesitan la suya
for f in os.listdir(OUT):
    m = re.match(r'h-(.+)\.jpg$', f)
    if m and m.group(1) not in hechas: os.remove(os.path.join(OUT, f))
json.dump(huellas, open(os.path.join(OUT, 'huellas.json'), 'w', encoding='utf8'), indent=0, sort_keys=True)
print(f'{len(hechas)} imágenes en site/assets/og/')
