# Ocho Capitales · prueba de la cabecera de capital y de la barra de abajo (oc-diseno, 4-nov).
# 1) En móvil y tableta, ningún texto de la cabecera se mete bajo la colgadura (8 capitales, /musica/ y bandas).
# 2) La barra marca la pestaña que toca: Inicio, Hoy, Noticias, Buscar o «Más» para lo que está dentro de «Más».
# Uso: python -I probar-cabecera-barra.py [base_url] [carpeta_capturas]
import json, os, sys
os.environ.setdefault('PLAYWRIGHT_BROWSERS_PATH', os.path.expandvars(r'%LOCALAPPDATA%\ms-playwright'))
from playwright.sync_api import sync_playwright
BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8091'
CAPT = sys.argv[2] if len(sys.argv) > 2 else ''
RAIZ = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
D = json.load(open(os.path.join(RAIZ, 'portal-cofrade', 'data', 'portal.json'), encoding='utf8'))
CABECERAS = ['/semana-santa/' + c['slug'] + '/' for c in D['capitales']] + ['/hermandad/el-gran-poder-sevilla/musica/', '/hermandad/la-aurora-granada/musica/', '/banda/agrupacion-musical-fusionadas-malaga/']
# página → pestaña marcada (texto) o «Más»
BARRA = {'/': 'Inicio', '/hoy/': 'Hoy', '/noticias/': 'Noticias', '/buscar/': 'Buscar', '/semana-santa/sevilla/': 'Más', '/hermandad/la-aurora-granada/': 'Más',
         '/hermandad/la-aurora-granada/musica/': 'Más', '/hermandades/': 'Más', '/en-la-calle/': 'Más', '/calendario/': 'Más'}
ok = []
def check(c, t): ok.append(bool(c)); print(('OK   ' if c else 'FALLO') + ' ' + t)
SOLAPE = """() => { const g = document.querySelector('.oc-caphero-colg'); if (!g) return null; const r = g.getBoundingClientRect();
  const malos = [...document.querySelectorAll('.oc-caphero-text *')].filter((e) => e.children.length === 0 && e.textContent.trim()).filter((e) => {
    const t = e.getBoundingClientRect(); return t.right > r.left + 1 && t.left < r.right && t.bottom > r.top && t.top < r.bottom; }).map((e) => e.textContent.trim().slice(0, 30));
  return malos; }"""
with sync_playwright() as p:
    b = p.chromium.launch()
    for w, h, mv in ((360, 780, True), (390, 844, True), (768, 1024, True), (1440, 900, False)):
        for esq in ('light', 'dark'):
            ctx = b.new_context(viewport={'width': w, 'height': h}, color_scheme=esq, is_mobile=mv, has_touch=mv)
            tag = f'{w}px {esq}'; pg = ctx.new_page(); err = []
            pg.on('pageerror', lambda x: err.append(str(x)))
            for ruta in CABECERAS:
                r = pg.goto(BASE + ruta, wait_until='networkidle')
                if r.status != 200: check(False, f'{tag} {ruta}: {r.status}'); continue
                pg.wait_for_timeout(2100)  # la colgadura se mece al entrar
                malos = pg.evaluate(SOLAPE)
                if malos is not None: check(not malos, f'{tag} {ruta}: nada bajo la colgadura {malos}')
                if CAPT and w == 390 and ruta in ('/semana-santa/malaga/', '/semana-santa/cordoba/', '/hermandad/el-gran-poder-sevilla/musica/'):
                    pg.screenshot(path=f'{CAPT}/cab-{ruta.strip("/").replace("/", "_")}-{w}-{esq}.png')
            if w < 960:
                for ruta, tab in BARRA.items():
                    pg.goto(BASE + ruta, wait_until='networkidle'); pg.wait_for_selector('.oc-tabbar')
                    marcadas = pg.evaluate("[...document.querySelectorAll('.oc-tabbar [aria-current=\"page\"], .oc-tabbar .is-aqui')].map((e) => e.textContent.trim())")
                    check(marcadas == [tab], f'{tag} {ruta}: barra marca {marcadas} (esperada {tab})')
            check(pg.evaluate('document.documentElement.scrollWidth - document.documentElement.clientWidth') <= 0, f'{tag}: sin desbordamiento')
            check(not err, f'{tag}: sin errores' + ('' if not err else ': ' + err[0]))
            ctx.close()
    b.close()
print(f'{sum(ok)}/{len(ok)} comprobaciones')
