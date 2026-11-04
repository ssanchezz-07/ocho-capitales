# Ocho Capitales · prueba de las miniaturas del díptico d-<slug> (Cristo y Virgen en una imagen 3:2; oc-diseno, 4-nov): en el listado de
# Hermandades, las filas de capital y el buscador la caja sigue igual (el texto de todas las tarjetas empieza a la misma distancia) y dentro
# va la foto entera en 3:2, sin cortar por la junta; las tarjetas de una misma fila siguen igual de altas (subgrid de Pulido).
# A 390 y 1440 px, en claro y oscuro. Uso: python -I probar-diptico.py [base_url] [carpeta_capturas]
import os, sys
os.environ.setdefault('PLAYWRIGHT_BROWSERS_PATH', os.path.expandvars(r'%LOCALAPPDATA%\ms-playwright'))
from playwright.sync_api import sync_playwright
BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8091'
CAPT = sys.argv[2] if len(sys.argv) > 2 else ''
ok = []
def check(c, t): ok.append(bool(c)); print(('OK   ' if c else 'FALLO') + ' ' + t)
def caja(pg, sel): return pg.evaluate(f"[...document.querySelectorAll('{sel}')].filter(e => e.offsetParent).slice(0, 40).map(e => {{ const r = e.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; }})")
def tres_dos(fi, w): return fi and all(x[0] == w and abs(x[1] - w * 2 / 3) <= 1 for x in fi)
IZQ = """(sel) => new Set([...document.querySelectorAll(sel)].filter(e => e.offsetParent).map(e => Math.round(e.getBoundingClientRect().left - e.closest('li').getBoundingClientRect().left))).size"""
DESB = 'document.documentElement.scrollWidth - document.documentElement.clientWidth'
with sync_playwright() as p:
    b = p.chromium.launch()
    for w, h, mv in ((390, 844, True), (1440, 900, False)):
        for esq in ('light', 'dark'):
            ctx = b.new_context(viewport={'width': w, 'height': h}, color_scheme=esq, is_mobile=mv, has_touch=mv)
            tag = f'{w}px {esq}'; pg = ctx.new_page(); err = []
            pg.on('pageerror', lambda x: err.append(str(x)))
            # listado de Hermandades
            pg.goto(f'{BASE}/hermandades/', wait_until='networkidle')
            d = caja(pg, '.ix-foto.is-dip'); fi = caja(pg, '.ix-foto.is-dip img'); n = caja(pg, '.ix-foto:not(.is-dip)')
            check(d and all(x == [64, 64] for x in d) and tres_dos(fi, 64), f'{tag} listado: {len(d)} dípticos, caja 64×64 y foto 3:2 {sorted(set(map(tuple, fi)))}')
            check(n and all(x == [64, 64] for x in n), f'{tag} listado: las demás miniaturas siguen igual')
            izq = pg.evaluate(IZQ, '.oc-entry.vx-m.ix-obra .vx-tit')
            check(izq == 1, f'{tag} listado: el título empieza a la misma distancia del borde en todas las tarjetas ({izq} distintas)')
            filas = pg.evaluate("""() => { const m = {}; document.querySelectorAll('.oc-entry.vx-m.ix-obra').forEach(e => { if (!e.offsetParent) return; const r = e.getBoundingClientRect(); (m[Math.round(r.top)] ||= []).push(Math.round(r.height)); }); return Object.values(m).filter(v => v.length > 1).filter(v => Math.max(...v) - Math.min(...v) > 1).length; }""")
            check(filas == 0, f'{tag} listado: tarjetas de una misma fila igual de altas ({filas} filas desiguales)')
            check(pg.evaluate(DESB) <= 0, f'{tag} listado: sin desbordamiento')
            if CAPT: pg.locator('.ix-foto.is-dip >> visible=true').first.scroll_into_view_if_needed(); pg.wait_for_timeout(300); pg.screenshot(path=f'{CAPT}/listado-{w}-{esq}.png')
            # filas de una capital
            pg.goto(f'{BASE}/semana-santa/sevilla/', wait_until='networkidle')
            d = caja(pg, '.oc-entry-img.is-dip'); fi = caja(pg, '.oc-entry-img.is-dip img'); n = caja(pg, '.oc-entry-img:not(.is-dip)')
            check(d and all(x == [64, 64] for x in d) and tres_dos(fi, 64), f'{tag} Sevilla: {len(d)} dípticos, caja 64×64 y foto 3:2')
            check(n and all(x == [64, 64] for x in n), f'{tag} Sevilla: las demás siguen igual')
            izq = pg.evaluate(IZQ, '.oc-entry-title')
            check(izq == 1, f'{tag} Sevilla: el nombre empieza a la misma distancia en todas las filas ({izq} distintas)')
            check(pg.evaluate(DESB) <= 0, f'{tag} Sevilla: sin desbordamiento')
            if CAPT: pg.locator('.oc-entry-img.is-dip >> visible=true').first.scroll_into_view_if_needed(); pg.wait_for_timeout(300); pg.screenshot(path=f'{CAPT}/sevilla-{w}-{esq}.png')
            # buscador
            pg.goto(f'{BASE}/buscar/?q=gran%20poder', wait_until='networkidle'); pg.wait_for_timeout(600)
            d = caja(pg, '.oc-sr-thumb.is-dip'); fi = caja(pg, '.oc-sr-thumb.is-dip img'); n = caja(pg, '.oc-sr-thumb:not(.is-dip)')
            check(d and all(x == [40, 40] for x in d) and tres_dos(fi, 40), f'{tag} buscador: díptico, caja 40×40 y foto 3:2 {fi[:3]}')
            check(all(x == [40, 40] for x in n), f'{tag} buscador: las demás siguen igual')
            check(pg.evaluate(DESB) <= 0, f'{tag} buscador: sin desbordamiento')
            if CAPT: pg.screenshot(path=f'{CAPT}/buscar-{w}-{esq}.png')
            check(not err, f'{tag}: sin errores' + ('' if not err else ': ' + err[0]))
            ctx.close()
    b.close()
print(f'{sum(ok)}/{len(ok)} comprobaciones')
