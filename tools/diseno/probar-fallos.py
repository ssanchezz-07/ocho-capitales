# Ocho Capitales · prueba de los fallos conocidos (oc-diseno, 27-oct): «Quitar» en Favoritos se puede pulsar; el bocadillo de
# erCuñao se retira al bajar; la cabecera de la ficha de capital deja ver contenido en la primera pantalla; Colabora sin
# desbordamiento. A 390 y 1440 px. Uso: python -I probar-fallos.py [base_url]
import os, sys, json
sys.stdout.reconfigure(encoding="utf-8")
os.environ.setdefault('PLAYWRIGHT_BROWSERS_PATH', r'C:\Users\pablo\Herramientas-IA\ms-playwright')
from playwright.sync_api import sync_playwright
BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8091'
ok = []
def check(c, t): ok.append(bool(c)); print(('OK   ' if c else 'FALLO') + ' ' + t)
with sync_playwright() as p:
    b = p.chromium.launch()
    for w, h, mv in ((390, 844, True), (1440, 900, False)):
        ctx = b.new_context(viewport={'width': w, 'height': h}, is_mobile=mv, has_touch=mv)
        pg = ctx.new_page()
        pg.goto(BASE + '/hermandad/el-gran-poder-sevilla/', wait_until='networkidle')
        pg.locator('.fx-hero [data-fav]').first.click(); pg.wait_for_timeout(200)
        pg.goto(BASE + '/favoritos/', wait_until='networkidle'); pg.wait_for_timeout(500)
        n0 = pg.locator('.oc-fav-quitar').count()
        if n0: pg.locator('.oc-fav-quitar').first.click(); pg.wait_for_timeout(400)
        n1 = pg.locator('.oc-fav-quitar').count()
        check(n0 >= 1 and n1 == n0 - 1 and pg.url.rstrip('/').endswith('favoritos'), f'{w}px Favoritos: «Quitar» quita la fila sin abrir la ficha ({n0} → {n1})')
        pg.close(); ctx.close()
        ctx = b.new_context(viewport={'width': w, 'height': h}, is_mobile=mv, has_touch=mv)
        pg = ctx.new_page(); pg.goto(BASE + '/noticias/', wait_until='networkidle'); pg.wait_for_timeout(400)
        s0 = pg.evaluate("document.querySelector('.oc-cunao-btn')?.classList.contains('is-saludo')")
        pg.mouse.wheel(0, 300); pg.wait_for_timeout(300)
        s1 = pg.evaluate("document.querySelector('.oc-cunao-btn')?.classList.contains('is-saludo')")
        check(s0 and not s1, f'{w}px erCuñao: el bocadillo se ve al llegar y se retira al bajar ({s0} → {s1})')
        pg.goto(BASE + '/semana-santa/malaga/', wait_until='networkidle'); pg.wait_for_timeout(400)
        hb = pg.evaluate("document.querySelector('.oc-caphero').getBoundingClientRect().bottom")
        check(hb < h * .62, f'{w}px capital: la cabecera acaba a {hb:.0f} px de {h} (deja ver lo de hoy)')
        pg.goto(BASE + '/colabora/', wait_until='networkidle'); pg.wait_for_timeout(300)
        check(pg.evaluate('document.documentElement.scrollWidth - innerWidth') <= 0, f'{w}px Colabora: sin desbordamiento')
        pg.close(); ctx.close()
    b.close()
print(f'{sum(ok)}/{len(ok)} comprobaciones')
