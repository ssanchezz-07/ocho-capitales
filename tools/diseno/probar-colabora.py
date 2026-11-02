# Ocho Capitales · prueba de Colabora (oc-diseno): a 390 y 1440 px, en claro y oscuro. Intercepta el envío: nunca llega nada al correo.
# Uso: python -I probar-colabora.py [base_url]
import os, sys
os.environ.setdefault('PLAYWRIGHT_BROWSERS_PATH', os.path.expandvars(r'%LOCALAPPDATA%\ms-playwright'))
from playwright.sync_api import sync_playwright
BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8091'
ok = []
def check(c, t): ok.append(bool(c)); print(('OK   ' if c else 'FALLO') + ' ' + t)
TACTIL = """(sel) => [...document.querySelectorAll(sel)].filter(e => e.offsetParent).map(e => { const r = e.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height), e.id || (e.textContent || '').trim().slice(0, 24)]; }).filter(([w, h]) => h < 44 || w < 44)"""
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
            enviados = []; respuesta = {'status': 200}
            def falso(ruta):
                enviados.append(ruta.request.post_data or '')
                ruta.fulfill(status=respuesta['status'], content_type='application/json', headers={'Access-Control-Allow-Origin': '*'}, body='{"success":%s}' % ('true' if respuesta['status'] == 200 else 'false'))
            ctx.route('https://api.web3forms.com/**', falso)
            pg = ctx.new_page(); err = errores(pg)
            pg.goto(BASE + '/colabora/', wait_until='networkidle'); pg.wait_for_timeout(500)
            check(pg.locator('.nx-head h1').inner_text().upper() == 'COLABORA' and pg.locator('form[data-colabora]').is_visible(), f'{tag} cabecera y formulario')
            check(pg.locator('style').filter(has_text='oc-colabora-form').count() == 0, f'{tag} sin estilos en línea')
            trampa = pg.locator('.oc-trampa').bounding_box()
            check(trampa is None or trampa['x'] < 0, f'{tag} el campo trampa no se ve')
            check(pg.locator('[data-estado]').is_hidden() and pg.locator('[data-pagina-aviso]').is_hidden(), f'{tag} sin avisos al entrar')
            t = pg.evaluate(TACTIL, '.oc-colabora-form input:not([type=hidden]):not([name=web]):not([name=botcheck]), .oc-colabora-form select, .oc-colabora-form textarea, .oc-colabora-form button')
            check(not t, f'{tag} zonas táctiles de 44 px {t[:3]}')
            check(pg.evaluate('document.documentElement.scrollWidth - innerWidth') <= 0, f'{tag} sin desbordamiento')
            pg.wait_for_timeout(3000)
            pg.locator('.oc-colabora-form button[type=submit]').click(); pg.wait_for_timeout(200)
            check('10 caracteres' in pg.locator('[data-estado]').inner_text() and pg.evaluate("document.activeElement.id") == 'c-msg', f'{tag} texto corto: avisa y lleva al campo')
            pg.locator('#c-msg').fill('Prueba de diseño: esto no llega a ningún sitio.')
            pg.locator('#c-fuente').fill('nada'); pg.locator('.oc-colabora-form button[type=submit]').click(); pg.wait_for_timeout(200)
            check('https://' in pg.locator('[data-estado]').inner_text(), f'{tag} fuente mal escrita: avisa')
            pg.locator('#c-fuente').fill('')
            respuesta['status'] = 500; pg.locator('.oc-colabora-form button[type=submit]').click(); pg.wait_for_timeout(500)
            check(pg.locator('.oc-colabora-estado.is-error').is_visible() and pg.locator('#c-msg').input_value() != '' and pg.locator('.oc-colabora-form button[type=submit]').is_enabled(), f'{tag} si falla: conserva el texto')
            respuesta['status'] = 200; pg.locator('.oc-colabora-form button[type=submit]').click(); pg.wait_for_timeout(500)
            check(pg.locator('.oc-colabora-estado.is-ok').is_visible() and pg.locator('#c-msg').input_value() == '' and len(enviados) == 2, f'{tag} envío simulado: confirma y limpia')
            check(not err, f'{tag} sin errores' + ('' if not err else ': ' + err[0])); pg.close()
            pg = ctx.new_page(); pg.goto(BASE + '/colabora/?pagina=/hermandad/amor-malaga/&nombre=Amor&capital=malaga&texto=Hola', wait_until='networkidle'); pg.wait_for_timeout(300)
            check(pg.locator('[data-pagina-aviso]').is_visible() and pg.locator('#c-capital').input_value() == 'malaga' and pg.locator('#c-herm').input_value() == 'Amor', f'{tag} llega desde una ficha con sus datos')
            pg.close(); ctx.close()
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, reduced_motion='reduce')
    pg = ctx.new_page(); pg.goto(BASE + '/colabora/', wait_until='networkidle'); pg.wait_for_timeout(300)
    a = pg.evaluate("[...document.querySelectorAll('.oc-colabora-form, .cl-lado')].filter(e => e.getAnimations().some(x => x.playState === 'running')).length")
    check(a == 0, 'reducir movimiento: nada en marcha'); pg.close(); ctx.close(); b.close()
print(f'{sum(ok)}/{len(ok)} comprobaciones')
