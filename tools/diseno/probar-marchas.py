# Prueba de la lista de Marchas rediseñada (390, 1280, 1440, 1920 px; claro y oscuro en 390 y 1440) + filtros. Un navegador, que se cierra al acabar.
# Uso: python -I probar-marchas.py <carpeta-capturas> [base_url]
import os, sys
sys.stdout.reconfigure(encoding='utf-8')
os.environ.setdefault('PLAYWRIGHT_BROWSERS_PATH', r'C:\Users\pablo\Herramientas-IA\ms-playwright')
from playwright.sync_api import sync_playwright
out = sys.argv[1]; base = sys.argv[2] if len(sys.argv) > 2 else 'http://localhost:8091'
os.makedirs(out, exist_ok=True)
res = []
def ok(c, t): res.append((bool(c), t)); print(('OK   ' if c else 'FALLO') + ' ' + t)
with sync_playwright() as p:
    b = p.chromium.launch()
    for ancho, alto, movil, esquemas in ((390, 844, True, ('light', 'dark')), (1280, 800, False, ('light',)), (1440, 900, False, ('light', 'dark')), (1920, 1080, False, ('light',))):
        for esquema in esquemas:
            ctx = b.new_context(viewport={'width': ancho, 'height': alto}, color_scheme=esquema, is_mobile=movil, has_touch=movil, reduced_motion='reduce')
            pg = ctx.new_page(); err = []
            pg.on('console', lambda m: err.append(m.text) if m.type == 'error' and 'Failed to load resource' not in m.text else None)
            pg.on('pageerror', lambda e: err.append(str(e)))
            pg.goto(base + '/marchas/', wait_until='networkidle'); pg.wait_for_timeout(500)
            pg.evaluate("document.querySelectorAll('.oc-cunao-btn').forEach(e=>e.style.display='none')")
            tag = f'{ancho}-{"claro" if esquema == "light" else "oscuro"}'
            pg.screenshot(path=os.path.join(out, f'marchas-{tag}.png'), full_page=True, clip={'x': 0, 'y': 0, 'width': ancho, 'height': min(pg.evaluate('document.documentElement.scrollHeight'), 2600)})
            ok(not pg.evaluate('document.documentElement.scrollWidth > innerWidth'), f'{tag}: sin desborde horizontal')
            if esquema == 'light':
                cols = pg.evaluate("getComputedStyle(document.querySelector('.vx-grid')).gridTemplateColumns.split(' ').length")
                ok(cols >= (1 if ancho < 700 else 2), f'{tag}: {cols} columnas de tarjetas')
                ok(pg.locator('.nx-cap').count() >= 6, f'{tag}: «Por capital» con {pg.locator(".nx-cap").count()} capitales')
                n0 = pg.locator('.vx-grid .oc-entry:not([hidden])').count()
                pg.locator('[data-filtro-ciudad="sevilla"]').click(); pg.wait_for_timeout(1500)
                val = pg.evaluate("document.getElementById('fc').value")
                vis = pg.evaluate("[...document.querySelectorAll('.vx-grid .oc-entry')].filter(e => !e.hidden && e.offsetParent)")
                n1 = pg.evaluate("[...document.querySelectorAll('.vx-grid .oc-entry')].filter(e => !e.hidden && e.offsetParent).length")
                ajenas = pg.evaluate("[...document.querySelectorAll('.vx-grid .oc-entry')].filter(e => !e.hidden && e.offsetParent && e.dataset.ciudad !== 'sevilla').length")
                ok(val == 'sevilla' and n1 > 0 and ajenas == 0, f'{tag}: tarjeta Sevilla filtra el listado ({n1} visibles, {ajenas} de otra capital)')
                pg.fill('#fq', 'esperanza'); pg.wait_for_timeout(1200)
                tit = pg.evaluate("[...document.querySelectorAll('.vx-grid .oc-entry')].filter(e => !e.hidden && e.offsetParent).map(e => e.querySelector('.vx-tit a').getAttribute('href'))")
                ok(len(tit) == len(set(tit)), f'{tag}: búsqueda «esperanza» sin repetidas ({len(tit)} resultados)')
            ok(not err, f'{tag}: sin errores de consola' + ('' if not err else ': ' + ' | '.join(err[:3])))
            ctx.close()
    b.close()
print(f"{sum(1 for c, _ in res if c)}/{len(res)} comprobaciones")
