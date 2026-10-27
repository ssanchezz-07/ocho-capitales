# Ocho Capitales · prueba de la ficha de hermandad (oc-diseno): a 390 y 1440 px, en claro y oscuro, con movimiento normal y reducido.
# Comprueba en varias fichas (díptico, foto, foto conjunta, sin foto, nombre largo, sin titulares): cabecera de terciopelo con su
# imagen o estampa, tarjetas de datos, secciones visibles (nunca en blanco), sin desbordamiento, sin errores de consola, «Guardar»
# que funciona y, con movimiento reducido, sin animaciones. Uso: python -I probar-ficha.py [base_url]   (por defecto localhost:8091)
import os, sys
os.environ.setdefault('PLAYWRIGHT_BROWSERS_PATH', r'C:\Users\pablo\Herramientas-IA\ms-playwright')
from playwright.sync_api import sync_playwright
BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8091'
FICHAS = {
    'díptico': 'el-gran-poder-sevilla', 'foto': 'esperanza-malaga', 'foto conjunta': 'cautivo-malaga',
    'sin foto': 'el-calvario-huelva', 'nombre largo': 'cristo-de-gracia-el-esparraguero-cordoba', 'sin titulares': 'san-jose-obrero-sevilla',
}
ok = []
def check(c, t): ok.append(bool(c)); print(('OK   ' if c else 'FALLO') + ' ' + t)
with sync_playwright() as p:
    b = p.chromium.launch()
    for w, h, mv in ((390, 844, True), (1440, 900, False)):
        for esq in ('light', 'dark'):
            for rm in ('no-preference', 'reduce'):
                if rm == 'reduce' and esq == 'dark': continue
                ctx = b.new_context(viewport={'width': w, 'height': h}, color_scheme=esq, is_mobile=mv, has_touch=mv, reduced_motion=rm)
                for nombre, slug in FICHAS.items():
                    pg = ctx.new_page(); err = []
                    pg.on('console', lambda m, e=err: e.append(m.text) if m.type == 'error' and 'Failed to load resource' not in m.text else None)
                    pg.on('pageerror', lambda x, e=err: e.append(str(x)))
                    pg.goto(f'{BASE}/hermandad/{slug}/', wait_until='networkidle'); pg.wait_for_timeout(500)
                    r = pg.evaluate('''() => {
                      const hero = document.querySelector('.fx-hero'), media = hero && hero.querySelector('.fx-media > *');
                      const bg = hero ? getComputedStyle(hero).backgroundColor : '';
                      const datos = document.querySelectorAll('.fx-dato').length;
                      // secciones: tras bajar hasta cada una, su título se ve (opacidad > 0.5)
                      const secs = [...document.querySelectorAll('.fx-sec > .nx-h')];
                      const ov = document.documentElement.scrollWidth - innerWidth;
                      const anim = document.getAnimations().filter(a => a.playState === 'running' && a.animationName !== 'oc-cab').length; // oc-cab: solo la sombra de la cabecera al bajar, sin movimiento
                      return { hero: !!hero, media: !!media, datos, secs: secs.length, ov, anim, titulo: (document.querySelector('.fx-title') || {}).textContent || '' };
                    }''')
                    vis = pg.evaluate('''async () => { let peor = 1; for (const s of document.querySelectorAll('.fx-sec > .nx-h, .fx-dato, .fx-titulares li')) { s.scrollIntoView({block: 'center'}); await new Promise(r => setTimeout(r, 40)); peor = Math.min(peor, +getComputedStyle(s).opacity); } scrollTo(0, 0); return peor; }''')
                    fav = pg.locator('.fx-hero [data-fav]').first
                    favok = True
                    if fav.count():
                        antes = fav.get_attribute('aria-pressed'); fav.click(); pg.wait_for_timeout(150); despues = fav.get_attribute('aria-pressed'); fav.click()
                        favok = antes != despues
                    tag = f'{w}px {esq}{" reducido" if rm == "reduce" else ""} · {nombre}'
                    check(r['hero'] and r['media'] and r['datos'] >= 1 and r['secs'] >= 1 and r['titulo'], f'{tag}: cabecera con imagen o estampa, {r["datos"]} datos, {r["secs"]} secciones')
                    check(vis > .5, f'{tag}: secciones visibles al llegar a ellas (opacidad mínima {vis:.2f})')
                    check(r['ov'] <= 0, f'{tag}: sin desbordamiento ({r["ov"]} px)')
                    check(not err, f'{tag}: sin errores de consola' + ('' if not err else ': ' + ' | '.join(err[:2])))
                    check(favok, f'{tag}: «Guardar» cambia de estado')
                    if rm == 'reduce': check(r['anim'] == 0, f'{tag}: sin animaciones en marcha ({r["anim"]})')
                    pg.close()
                ctx.close()
    b.close()
print(f'{sum(ok)}/{len(ok)} comprobaciones')
