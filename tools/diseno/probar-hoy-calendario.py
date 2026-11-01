# Ocho Capitales · prueba de Hoy y Calendario (oc-diseno): a 390 y 1440 px, en claro y oscuro, y con movimiento reducido.
# Uso: python -I probar-hoy-calendario.py [base_url]
import os, sys, datetime
os.environ.setdefault('PLAYWRIGHT_BROWSERS_PATH', os.path.expandvars(r'%LOCALAPPDATA%\ms-playwright'))
from playwright.sync_api import sync_playwright
BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8091'
ok = []
def check(c, t): ok.append(bool(c)); print(('OK   ' if c else 'FALLO') + ' ' + t)
TACTIL = """(sel) => [...document.querySelectorAll(sel)].filter(e => e.offsetParent).map(e => { const r = e.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height), (e.textContent || e.getAttribute('aria-label') || '').trim().slice(0, 24)]; }).filter(([w, h]) => h < 44 || w < 44)"""
OCULTO = """() => [...document.querySelectorAll('.hy-cap, .cx-dia, .cx-lista .oc-ev, .hy-curio, .cx-suscribe')].filter(e => e.offsetParent && +getComputedStyle(e).opacity < .5).length"""
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
            # ---- Hoy
            pg = ctx.new_page(); err = errores(pg)
            pg.goto(BASE + '/hoy/', wait_until='networkidle'); pg.wait_for_timeout(500)
            check(pg.locator('.nx-head h1').inner_text().upper() == 'HOY' and pg.locator('.hy-tabs [role=tab]').count() == 10, f'{tag} Hoy: cabecera y 10 jornadas')
            n0 = pg.locator('.hy-panel:not([hidden]) .hy-cap').count()
            check(n0 >= 4, f'{tag} Hoy: {n0} capitales en la jornada')
            check(pg.locator('.hy-panel:not([hidden]) .hy-hora').count() > 0 and pg.locator('.hy-panel:not([hidden]) .hy-cap').first.locator('.hy-paso li:visible').count() == 3, f'{tag} Hoy: horas visibles y tres filas por tarjeta')
            check(mv or pg.evaluate("document.querySelector('.hy-tabs').scrollWidth - document.querySelector('.hy-tabs').clientWidth") <= 0, f'{tag} Hoy: las jornadas caben (escritorio)')
            pg.locator('[data-slot="viernes"]').click(); pg.wait_for_timeout(500)
            check(pg.locator('#dia-viernes').is_visible() and pg.locator('[data-panel]:not([hidden])').count() == 1, f'{tag} Hoy: cambiar de jornada')
            t = pg.evaluate(TACTIL, '.hy-tabs [role=tab], .hy-pie a, .hy-curio a')
            check(not t, f'{tag} Hoy: zonas táctiles de 44 px {t[:3]}')
            filas = pg.evaluate("[...document.querySelectorAll('.hy-paso li')].filter(e => e.offsetParent).map(e => e.getBoundingClientRect().height)")
            check(min(filas) >= 44, f'{tag} Hoy: filas de {round(min(filas))} px o más')
            check(pg.evaluate('document.documentElement.scrollWidth - innerWidth') <= 0, f'{tag} Hoy: sin desbordamiento')
            check(pg.evaluate(OCULTO) == 0, f'{tag} Hoy: nada se queda invisible')
            check(not err, f'{tag} Hoy: sin errores' + ('' if not err else ': ' + err[0])); pg.close()
            # ---- Calendario
            pg = ctx.new_page(); err = errores(pg)
            pg.goto(BASE + '/calendario/', wait_until='networkidle'); pg.wait_for_timeout(500)
            check(pg.locator('.nx-head').count() == 1 and pg.locator('.cx-mes').is_visible() and pg.locator('.cx-lista .oc-ev').count() > 0, f'{tag} Calendario: cabecera, mes y actos')
            t0 = pg.locator('[data-month-title]').inner_text()
            pg.locator('[data-month-next]').click(); pg.wait_for_timeout(300)
            check(pg.locator('[data-month-title]').inner_text() != t0, f'{tag} Calendario: mes siguiente')
            pg.locator('[data-month-prev]').click(); pg.wait_for_timeout(300)
            pg.locator('[data-agenda-tipo] button[data-v="salidas"]').click(); pg.wait_for_timeout(300)
            tipos = pg.locator('.cx-lista .oc-ev').count()
            pg.locator('[data-agenda-tipo] button').first.click(); pg.wait_for_timeout(200)
            check(pg.locator('[data-agenda-tipo] button').first.get_attribute('aria-pressed') == 'true', f'{tag} Calendario: filtro de tipo ({tipos} procesiones)')
            pg.locator('.oc-mday.has-ev').first.click(); pg.wait_for_timeout(300)
            check('eventos del' in pg.locator('[data-agenda-list-title]').inner_text().lower(), f'{tag} Calendario: elegir un día')
            pg.locator('[data-agenda-reset]').click(); pg.wait_for_timeout(200)
            pg.locator('#caltab-cadiz').click(); pg.wait_for_timeout(300)
            check(pg.locator('#cal-cadiz').is_visible() and pg.locator('[data-cal]:not([hidden])').count() == 1 and pg.locator('#cal-cadiz .hy-paso li').count() > 5, f'{tag} Calendario: orden de paso de Cádiz')
            t = pg.evaluate(TACTIL, '[data-agenda-tipo] button, [data-agenda-ciudad] button, [data-month-prev], [data-month-next], .cx-ics a, .cx-captabs a, .oc-mday.has-ev')
            check(not t, f'{tag} Calendario: zonas táctiles de 44 px {t[:3]}')
            check(pg.evaluate('document.documentElement.scrollWidth - innerWidth') <= 0, f'{tag} Calendario: sin desbordamiento')
            check(pg.evaluate(OCULTO) == 0, f'{tag} Calendario: nada se queda invisible')
            check(not err, f'{tag} Calendario: sin errores' + ('' if not err else ': ' + err[0])); pg.close()
            ctx.close()
    # Semana Santa simulada en el navegador
    ctx = b.new_context(viewport={'width': 1440, 'height': 900})
    pg = ctx.new_page()
    pg.clock.install(time=datetime.datetime(2027, 3, 23, 18, 0, tzinfo=datetime.timezone.utc))
    pg.goto(BASE + '/hoy/', wait_until='load'); pg.wait_for_timeout(300)
    check(pg.locator('[data-slot="martes"]').get_attribute('data-today-mark') is not None and pg.locator('#dia-martes').is_visible(), 'Semana Santa simulada (Martes Santo): sello «hoy» y su jornada')
    check('Martes Santo' in pg.locator('[data-today-lead]').inner_text(), 'Semana Santa simulada: la cabecera dice la jornada')
    pg.close(); ctx.close()
    # movimiento reducido
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, reduced_motion='reduce')
    for r in ('/hoy/', '/calendario/'):
        pg = ctx.new_page(); pg.goto(BASE + r, wait_until='networkidle'); pg.wait_for_timeout(300)
        a = pg.evaluate("[...document.querySelectorAll('.nx-title, .hy-cap, .cx-dia, .oc-ev, .cx-mes')].filter(e => e.getAnimations().some(x => x.playState === 'running')).length")
        check(a == 0, f'reducir movimiento {r}: nada en marcha'); pg.close()
    ctx.close(); b.close()
print(f'{sum(ok)}/{len(ok)} comprobaciones')
