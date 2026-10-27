# Ocho Capitales · prueba de Imagineros (oc-diseno): lista y fichas a 390 y 1440 px, en claro y oscuro.
# Comprueba la cabecera de terciopelo, «Por época» que filtra, las tarjetas, sin desbordamiento ni errores, y las fichas
# (con biografía y sin ella) con sus datos y obras. Uso: python -I probar-imagineros.py [base_url]
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
            pg.goto(BASE + '/imagineros/', wait_until='networkidle'); pg.wait_for_timeout(400)
            n0 = pg.locator('[data-dir] > li:not([hidden])').count()
            pg.locator('[data-filtro-tipo="siglo-xvii"]').first.click(); pg.wait_for_timeout(400)
            n1 = pg.locator('[data-dir] > li:not([hidden])').count()
            tag = f'{w}px {esq}'
            check(pg.locator('.nx-head').count() == 1 and n0 > 20, f'{tag} lista: cabecera y {n0} tarjetas visibles')
            check(0 < n1 < n0, f'{tag} lista: «Siglo XVII» filtra ({n1})')
            check(pg.evaluate('document.documentElement.scrollWidth - innerWidth') <= 0, f'{tag} lista: sin desbordamiento')
            check(not err, f'{tag} lista: sin errores' + ('' if not err else ': ' + err[0]))
            pg.close()
            for slug in ('luis-alvarez-duarte', 'sebastian-santos'):
                pg = ctx.new_page(); err = []
                pg.on('console', lambda m, e=err: e.append(m.text) if m.type == 'error' and 'Failed to load resource' not in m.text else None)
                pg.goto(BASE + f'/imaginero/{slug}/', wait_until='networkidle'); pg.wait_for_timeout(300)
                r = pg.evaluate("({h: document.querySelectorAll('.ix-head').length, d: document.querySelectorAll('.fx-dato').length, o: document.querySelectorAll('.ix-obra').length, ov: document.documentElement.scrollWidth - innerWidth})")
                check(r['h'] == 1 and r['d'] >= 2 and r['o'] >= 1, f'{tag} ficha {slug}: cabecera, {r["d"]} datos, {r["o"]} obras')
                check(r['ov'] <= 0 and not err, f'{tag} ficha {slug}: sin desbordamiento ni errores' + ('' if not err else ': ' + err[0]))
                pg.close()
            ctx.close()
    b.close()
print(f'{sum(ok)}/{len(ok)} comprobaciones')
