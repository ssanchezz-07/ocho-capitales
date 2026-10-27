# Ocho Capitales · prueba de la lista de Hermandades (oc-diseno): a 390 y 1440 px, en claro y oscuro.
# Cabecera de terciopelo, «Por capital» que filtra, tarjetas, sin desbordamiento ni errores. Uso: python -I probar-hermandades.py [base_url]
import os, sys
os.environ.setdefault('PLAYWRIGHT_BROWSERS_PATH', r'C:\Users\pablo\Herramientas-IA\ms-playwright')
from playwright.sync_api import sync_playwright
BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8091'
ok = []
def check(c, t): ok.append(bool(c)); print(('OK   ' if c else 'FALLO') + ' ' + t)
with sync_playwright() as p:
    b = p.chromium.launch()
    for w, h, mv in ((390, 844, True), (1440, 900, False)):
        for esq in ('light', 'dark'):
            ctx = b.new_context(viewport={'width': w, 'height': h}, color_scheme=esq, is_mobile=mv, has_touch=mv)
            pg = ctx.new_page(); err = []
            pg.on('console', lambda m, e=err: e.append(m.text) if m.type == 'error' and 'Failed to load resource' not in m.text else None)
            pg.on('pageerror', lambda x, e=err: e.append(str(x)))
            pg.goto(BASE + '/hermandades/', wait_until='networkidle'); pg.wait_for_timeout(400)
            n0 = pg.locator('[data-dir] > li:not([hidden])').count()
            pg.locator('[data-filtro-ciudad="cadiz"]').first.click(); pg.wait_for_timeout(500)
            vis = pg.evaluate("[...document.querySelectorAll('[data-dir] > li')].filter(l => !l.hidden && l.offsetParent)")
            ciud = pg.evaluate("[...new Set([...document.querySelectorAll('[data-dir] > li')].filter(l => !l.hidden && l.offsetParent).map(l => l.dataset.ciudad))]")
            tag = f'{w}px {esq}'
            check(pg.locator('.nx-head').count() == 1 and pg.locator('.hx-caps .nx-cap').count() == 8 and n0 > 20, f'{tag}: cabecera, 8 capitales y {n0} tarjetas')
            check(ciud == ['cadiz'], f'{tag}: «Cádiz» filtra la lista ({ciud})')
            check(pg.evaluate('document.documentElement.scrollWidth - innerWidth') <= 0, f'{tag}: sin desbordamiento')
            check(not err, f'{tag}: sin errores' + ('' if not err else ': ' + err[0]))
            pg.close(); ctx.close()
    b.close()
print(f'{sum(ok)}/{len(ok)} comprobaciones')
