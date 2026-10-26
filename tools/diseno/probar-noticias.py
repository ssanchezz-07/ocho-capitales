# Prueba de la página de Noticias rediseñada (390 y 1440 px, claro y oscuro) + interacciones. Un solo navegador, que se cierra al acabar.
# Uso: python -I probar-noticias.py <carpeta-capturas> [base_url]
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
    for ancho, alto, movil in ((390, 844, True), (1440, 900, False)):
        for esquema in ('light', 'dark'):
            ctx = b.new_context(viewport={'width': ancho, 'height': alto}, color_scheme=esquema, is_mobile=movil, has_touch=movil)
            pg = ctx.new_page(); err = []
            pg.on('console', lambda m: err.append(m.text) if m.type == 'error' and 'Failed to load resource' not in m.text else None)
            pg.on('pageerror', lambda e: err.append(str(e)))
            pg.goto(base + '/noticias/', wait_until='networkidle'); pg.wait_for_timeout(900)
            tag = f'{ancho}-{"claro" if esquema == "light" else "oscuro"}'
            alto_pag = pg.evaluate('document.documentElement.scrollHeight')
            pg.screenshot(path=os.path.join(out, f'noticias-{tag}.png'), full_page=True, clip={'x': 0, 'y': 0, 'width': ancho, 'height': min(alto_pag, alto * 3)})
            if esquema == 'light':
                ok(pg.locator('.nx-destacada').count() == 1, f'{tag}: hay destacada')
                ok(pg.locator('.nx-ultimo li').count() >= 4, f'{tag}: «Lo último» con {pg.locator(".nx-ultimo li").count()} titulares')
                ok(pg.locator('.nx-cap').count() == 8, f'{tag}: «En cada capital» con {pg.locator(".nx-cap").count()} capitales')
                ok(pg.locator('.nx-dia').count() >= 1, f'{tag}: archivo por días ({pg.locator(".nx-dia").count()} días)')
                imgs = pg.evaluate("[...document.querySelectorAll('.nx-lista img')].map(i => i.getAttribute('src'))")
                ok(len(imgs) == len(set(imgs)), f'{tag}: ninguna foto repetida ({len(imgs)} fotos)')
                ok(not pg.evaluate('document.documentElement.scrollWidth > innerWidth'), f'{tag}: sin desborde horizontal')
                # todo visible aunque no se haya bajado: ninguna tarjeta con opacidad < 0,3
                inv = pg.evaluate("[...document.querySelectorAll('.nx-card')].filter(e => +getComputedStyle(e).opacity < 0.3).length")
                ok(inv == 0, f'{tag}: ninguna tarjeta invisible antes de bajar ({inv})')
                # filtro de capital: Sevilla
                n0 = pg.inner_text('[data-news-count]')
                pg.click('[data-f="ciudad"] button[data-v="sevilla"]'); pg.wait_for_timeout(700)
                ok('Sevilla' in pg.inner_text('[data-news-count]'), f'{tag}: filtro Sevilla → «{pg.inner_text("[data-news-count]")}»')
                col = pg.evaluate("getComputedStyle(document.querySelector('[data-nx-head]')).getPropertyValue('--nx-c').trim()")
                ok(col.lower() in ('#5b2a86', 'rgb(91, 42, 134)'), f'{tag}: la cabecera toma el color de Sevilla ({col})')
                ok(pg.locator('.nx-cap').count() == 0, f'{tag}: con una capital no se repite «En cada capital»')
                pg.screenshot(path=os.path.join(out, f'noticias-{tag}-sevilla.png'), full_page=True, clip={'x': 0, 'y': 0, 'width': ancho, 'height': alto * 2})
                pg.click('[data-f="ciudad"] button[data-v=""]'); pg.wait_for_timeout(500)
                pg.click('[data-f="oficiales"]'); pg.wait_for_timeout(600)
                ok('oficiales' in pg.inner_text('[data-news-count]') and pg.locator('.nx-card').count() > 0 and pg.locator('.nx-oficial').count() == pg.locator('.nx-card').count(), f'{tag}: solo oficiales → «{pg.inner_text("[data-news-count]")}»')
                pg.click('[data-f="oficiales"]'); pg.wait_for_timeout(500)
                pg.click('[data-f="tema"] button[data-v="salidas"]'); pg.wait_for_timeout(700)
                n_t = pg.locator('.nx-card').count(); n_l = pg.evaluate("[...document.querySelectorAll('.nx-card .nx-tema')].filter(e => e.textContent === 'Salidas').length")
                ok(n_t > 0 and n_t == n_l and 'Salidas' in pg.inner_text('[data-news-count]'), f'{tag}: tema Salidas → «{pg.inner_text("[data-news-count]")}», {n_l}/{n_t} con su etiqueta')
                pg.click('[data-f="tema"] button[data-v=""]'); pg.wait_for_timeout(500)
                pg.fill('#nq', 'pregón'); pg.wait_for_timeout(500)
                ok(pg.locator('.nx-destacada').count() == 0 and 'noticia' in pg.inner_text('[data-news-count]'), f'{tag}: búsqueda «pregón» → «{pg.inner_text("[data-news-count]")}»')
                pg.fill('#nq', ''); pg.wait_for_timeout(500)
                c1 = pg.locator('.nx-card').count(); pg.click('[data-news-more]'); pg.wait_for_timeout(500)
                ok(pg.locator('.nx-card').count() > c1, f'{tag}: «Ver más» añade noticias ({c1} → {pg.locator(".nx-card").count()})')
                pg.locator('.nx-cap-nombre').first.click() if pg.locator('.nx-cap-nombre').count() else None
                pg.wait_for_timeout(600)
                ok('de ' in pg.inner_text('[data-news-count]'), f'{tag}: pulsar una capital en «En cada capital» filtra por ella')
            ok(not err, f'{tag}: sin errores de consola' + ('' if not err else ': ' + ' | '.join(err[:3])))
            ctx.close()
    # reducir movimiento: ninguna animación de entrada
    ctx = b.new_context(viewport={'width': 1440, 'height': 900}, reduced_motion='reduce'); pg = ctx.new_page()
    pg.goto(base + '/noticias/', wait_until='networkidle')
    an = pg.evaluate("[...document.querySelectorAll('.nx-card, .nx-title, .nx-head')].filter(e => getComputedStyle(e).animationName !== 'none').length")
    ok(an == 0, f'reducir movimiento: sin animaciones ({an})')
    ctx.close(); b.close()
print(f"{sum(1 for c, _ in res if c)}/{len(res)} comprobaciones")
