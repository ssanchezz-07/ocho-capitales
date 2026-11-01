# Ocho Capitales · prueba de Favoritos (oc-diseno): vacío, con guardados y al quitarlos, a 390 y 1440 px, en claro y oscuro.
# Uso: python -I probar-favoritos.py [base_url]
import json, os, sys
os.environ.setdefault('PLAYWRIGHT_BROWSERS_PATH', os.path.expandvars(r'%LOCALAPPDATA%\ms-playwright'))
from playwright.sync_api import sync_playwright
BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8091'
ok = []
def check(c, t): ok.append(bool(c)); print(('OK   ' if c else 'FALLO') + ' ' + t)
TACTIL = """(sel) => [...document.querySelectorAll(sel)].filter(e => e.offsetParent).map(e => { const r = e.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height), (e.textContent || '').trim().slice(0, 24)]; }).filter(([w, h]) => h < 44 || w < 44)"""
FAVS = {'hermandad:amor-malaga': {'n': 'Amor', 'u': '/hermandad/amor-malaga/', 't': 3}, 'capital:sevilla': {'n': 'Sevilla', 'u': '/semana-santa/sevilla/', 't': 2}}
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
            pg.goto(BASE + '/favoritos/', wait_until='networkidle'); pg.wait_for_timeout(500)
            check(pg.locator('.fv-vacio').is_visible() and not pg.locator('[data-fav-pulso]').is_visible(), f'{tag} vacío: invita a guardar y no hay cifra')
            check(pg.locator('.fv-pasos li').count() == 3 and pg.locator('.fv-acc a').count() == 3, f'{tag} vacío: tres pasos y tres salidas')
            t = pg.evaluate(TACTIL, '.fv-acc a')
            check(not t, f'{tag} vacío: zonas táctiles {t[:3]}')
            check(pg.evaluate('document.documentElement.scrollWidth - innerWidth') <= 0, f'{tag} vacío: sin desbordamiento')
            pg.evaluate('(v) => localStorage.setItem("oc-favs", v)', json.dumps(FAVS)); pg.reload(wait_until='networkidle'); pg.wait_for_timeout(500)
            check(pg.locator('.fv-lista .oc-entry').count() == 2 and not pg.locator('.fv-vacio').is_visible(), f'{tag} con guardados: lista y sin estado vacío')
            check(pg.locator('[data-fav-n]').inner_text() == '2', f'{tag} con guardados: cifra en la cabecera')
            check(pg.locator('[data-mi-ss]').is_visible() and pg.locator('[data-mi-ss-list] .oc-ev').count() == 1, f'{tag} Mi Semana Santa con la hermandad')
            check('--c' in (pg.locator('[data-mi-ss-list] .oc-ev').get_attribute('style') or ''), f'{tag} Mi Semana Santa con el color de su capital')
            t = pg.evaluate(TACTIL, '.oc-fav-quitar, [data-mi-ss-ics]')
            check(not t, f'{tag} con guardados: zonas táctiles {t[:3]}')
            check(pg.evaluate('document.documentElement.scrollWidth - innerWidth') <= 0, f'{tag} con guardados: sin desbordamiento')
            with pg.expect_download(timeout=5000) as d: pg.locator('[data-mi-ss-ics]').click()
            check(d.value.suggested_filename.startswith('mi-semana-santa-'), f'{tag} descarga {d.value.suggested_filename}')
            cab = pg.evaluate("(() => { const p = document.querySelector('[data-fav-pulso] > span').getBoundingClientRect(), t = document.querySelector('[data-fav-n-txt]').getBoundingClientRect(); return t.right <= p.right && t.left >= p.left && t.width > 30; })()")
            check(cab, f'{tag} la cifra y su texto caben en la píldora')
            pg.locator('.oc-fav-quitar').first.focus(); pg.keyboard.press('Enter'); pg.wait_for_timeout(400)
            check(pg.locator('.fv-lista .oc-entry').count() == 1 and pg.locator('[data-fav-n-txt]').inner_text() == 'guardado', f'{tag} quitar uno: lista y singular')
            check(pg.evaluate("document.activeElement.hasAttribute('data-fav-quitar')"), f'{tag} quitar uno: el foco pasa a la fila vecina')
            check(not pg.locator('[data-mi-ss]').is_visible() and pg.locator('[data-mi-ss-list] .oc-ev').count() == 0, f'{tag} quitar la hermandad: Mi Semana Santa se actualiza')
            pg.locator('.oc-fav-quitar').first.focus(); pg.keyboard.press('Enter'); pg.wait_for_timeout(400)
            check(pg.evaluate("document.activeElement.matches('.fv-acc a')"), f'{tag} quitar todo: el foco pasa a las salidas')
            check(pg.locator('.fv-vacio').is_visible() and not pg.locator('[data-mi-ss]').is_visible() and not pg.locator('[data-fav-pulso]').is_visible(), f'{tag} quitar todo: vuelve el estado vacío')
            check(pg.evaluate('localStorage.getItem("oc-favs")') == '{}', f'{tag} quitar todo: se borra lo guardado')
            check(not err, f'{tag} sin errores' + ('' if not err else ': ' + err[0])); pg.close(); ctx.close()
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, reduced_motion='reduce')
    pg = ctx.new_page(); pg.goto(BASE + '/favoritos/', wait_until='networkidle'); pg.wait_for_timeout(300)
    a = pg.evaluate("[...document.querySelectorAll('.fv-vacio, .nx-title')].filter(e => e.getAnimations().some(x => x.playState === 'running')).length")
    check(a == 0, 'reducir movimiento: nada en marcha'); pg.close(); ctx.close(); b.close()
print(f'{sum(ok)}/{len(ok)} comprobaciones')
