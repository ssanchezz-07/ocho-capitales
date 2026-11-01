# Ocho Capitales · prueba de Buscar (oc-diseno): a 390 y 1440 px, en claro y oscuro, y con movimiento reducido.
# Uso: python -I probar-buscar.py [base_url]
import os, sys
os.environ.setdefault('PLAYWRIGHT_BROWSERS_PATH', os.path.expandvars(r'%LOCALAPPDATA%\ms-playwright'))
from playwright.sync_api import sync_playwright
BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8091'
ok = []
def check(c, t): ok.append(bool(c)); print(('OK   ' if c else 'FALLO') + ' ' + t)
TACTIL = """(sel) => [...document.querySelectorAll(sel)].filter(e => e.offsetParent).map(e => { const r = e.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height), (e.textContent || e.getAttribute('aria-label') || '').trim().slice(0, 24)]; }).filter(([w, h]) => h < 44 || w < 44)"""
def errores(pg):
    err = []
    pg.on('console', lambda m: err.append(m.text) if m.type == 'error' and 'Failed to load resource' not in m.text else None)
    pg.on('pageerror', lambda x: err.append(str(x)))
    return err
with sync_playwright() as p:
    b = p.chromium.launch()
    for w, h, mv in ((390, 844, True), (1440, 900, False)):
        for esq in ('light', 'dark'):
            ctx = b.new_context(viewport={'width': w, 'height': h}, color_scheme=esq, is_mobile=mv, has_touch=mv)
            tag = f'{w}px {esq}'
            pg = ctx.new_page(); err = errores(pg)
            pg.goto(BASE + '/buscar/', wait_until='networkidle'); pg.wait_for_timeout(500)
            check(pg.locator('.nx-head h1').inner_text().upper() == 'BUSCAR' and pg.locator('.nx-head form[data-search-page]').count() == 1, f'{tag} cabecera con el buscador')
            check(pg.locator('.oc-explora-caps li').count() == 8 and pg.locator('.sx-dir a').count() == 6, f'{tag} 8 capitales y 6 accesos')
            cifras = pg.locator('.sx-dir b').all_inner_texts()
            check(all(len(c) < 4 or '.' in c for c in cifras), f'{tag} cifras con punto de millar {cifras}')
            t = pg.evaluate(TACTIL, '.oc-explora-caps a, .sx-dir a, .sx-form button')
            check(not t, f'{tag} zonas táctiles de 44 px {t[:3]}')
            pg.locator('#q-page').fill('esperanza'); pg.wait_for_timeout(900)
            n = pg.locator('.sx-results .oc-sr-item').count()
            check(n > 0 and pg.locator('.sx-results .oc-sr-group').count() > 0, f'{tag} resultados de «esperanza» ({n})')
            check(not pg.locator('.oc-explora').is_visible(), f'{tag} Explora se oculta al buscar')
            check('q=esperanza' in pg.url, f'{tag} la búsqueda queda en la dirección')
            t = pg.evaluate(TACTIL, '.sx-results .oc-sr-item')
            check(not t, f'{tag} resultados de 44 px {t[:3]}')
            check(pg.evaluate('document.documentElement.scrollWidth - innerWidth') <= 0, f'{tag} sin desbordamiento con resultados')
            pg.locator('#q-page').fill('xqzjw'); pg.wait_for_timeout(500)
            check('Sin resultados' in pg.locator('.sx-results').inner_text(), f'{tag} mensaje sin resultados')
            pg.locator('#q-page').fill(''); pg.wait_for_timeout(500)
            check(pg.locator('.sx-results .oc-hint').count() == 1, f'{tag} vacío: indica que escribas')
            check(pg.evaluate('document.documentElement.scrollWidth - innerWidth') <= 0, f'{tag} sin desbordamiento')
            check(not err, f'{tag} sin errores' + ('' if not err else ': ' + err[0])); pg.close()
            # con capital elegida, la cabecera toma su color
            pg = ctx.new_page(); pg.goto(BASE + '/buscar/?q=lastrucci', wait_until='networkidle'); pg.wait_for_timeout(900)
            check(pg.locator('.sx-results .oc-sr-item').count() > 0 and pg.locator('#q-page').input_value() == 'lastrucci', f'{tag} entra con búsqueda en la dirección')
            pg.close(); ctx.close()
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, reduced_motion='reduce')
    pg = ctx.new_page(); pg.goto(BASE + '/buscar/', wait_until='networkidle'); pg.wait_for_timeout(300)
    a = pg.evaluate("[...document.querySelectorAll('.sx-form, .oc-explora-caps li, .sx-dir li')].filter(e => e.getAnimations().some(x => x.playState === 'running')).length")
    check(a == 0, 'reducir movimiento: nada en marcha'); pg.close(); ctx.close(); b.close()
print(f'{sum(ok)}/{len(ok)} comprobaciones')
