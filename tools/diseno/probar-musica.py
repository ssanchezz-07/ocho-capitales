# Ocho Capitales · prueba de «pocas bandas y marchas» en la ficha de hermandad y su subpágina hermandad/<slug>/musica/ (oc-diseno).
# A 390 y 1440 px, en claro y oscuro, y sin JavaScript. Uso: python -I probar-musica.py [base_url]
import os, re, sys
os.environ.setdefault('PLAYWRIGHT_BROWSERS_PATH', os.path.expandvars(r'%LOCALAPPDATA%\ms-playwright'))
from playwright.sync_api import sync_playwright
BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8091'
CAPT = sys.argv[2] if len(sys.argv) > 2 else ''
# la Aurora (grabación de Marketing), muchas bandas por pasos, novedades de 2027 y una con pocas marchas (sin «Ver todas»)
FICHAS = ['la-aurora-granada', 'san-pablo-sevilla', 'fusionadas-malaga', 'el-rico-malaga', 'amor-malaga', 'mena-malaga', 'la-sed-sevilla']
# en la ficha resumida, los pasos de los titulares van antes que la Cruz de Guía (auditor, 3-nov)
PASOS = {'mena-malaga': ['Cristo', 'Virgen'], 'la-sed-sevilla': ['Paso de Cristo', 'Paso de Palio']}
import json
HAB = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'sources', 'habitos.json'), encoding='utf8'))
ok = []
def check(c, t): ok.append(bool(c)); print(('OK   ' if c else 'FALLO') + ' ' + t)
with sync_playwright() as p:
    b = p.chromium.launch()
    for w, h, mv in ((360, 780, True), (390, 844, True), (1440, 900, False)):
        for esq in ('light', 'dark'):
            for js in (True, False):
                if not js and esq == 'dark': continue
                ctx = b.new_context(viewport={'width': w, 'height': h}, color_scheme=esq, is_mobile=mv, has_touch=mv, java_script_enabled=js)
                tag = f'{w}px {esq}{"" if js else " sin JS"}'
                for slug in FICHAS:
                    pg = ctx.new_page(); err = []
                    pg.on('pageerror', lambda x: err.append(str(x)))
                    pg.goto(f'{BASE}/hermandad/{slug}/', wait_until='networkidle')
                    n = pg.locator('.fx-sec-marchas .fx-marchas > li').count()
                    ver = pg.locator('.fx-sec-marchas .fx-vermas a')
                    check(n <= 5, f'{tag} {slug}: {n} marchas en la ficha')
                    total = None
                    if ver.count():
                        t = ver.inner_text(); total = int(re.search(r'\d+', t).group())
                        check(total > 5 and ver.get_attribute('href').endswith(f'/hermandad/{slug}/musica/#marchas'), f'{tag} {slug}: «{t.strip()}» enlaza la subpágina')
                    nb = pg.locator('.fx-musica .oc-acomp dd a, .fx-musica .oc-acomp dd, .fx-musica .oc-chips li').count()
                    verb = pg.locator('.fx-musica .fx-vermas a')
                    if slug in PASOS: check([t.strip() for t in pg.locator('.fx-musica .oc-acomp dt').all_text_contents()] == PASOS[slug], f'{tag} {slug}: pasos de la ficha {PASOS[slug]}')
                    primera = pg.locator('.fx-sec-marchas .vx-tit').first.inner_text() if n else None
                    check(pg.evaluate('document.documentElement.scrollWidth - document.documentElement.clientWidth') <= 0, f'{tag} {slug}: ficha sin desbordamiento')
                    txt = pg.locator('main').inner_text()
                    check('=>' not in txt and 'undefined' not in txt and '[object' not in txt, f'{tag} {slug}: sin código suelto en la página')
                    check(pg.locator('.fx-sec h2', has_text='Hábito de nazareno').count() == (1 if (HAB.get(slug) or {}).get('texto') else 0), f'{tag} {slug}: la sección del hábito sigue como estaba')
                    if CAPT and js and slug == 'la-aurora-granada':
                        pg.locator('.fx-musica').scroll_into_view_if_needed(); pg.screenshot(path=f'{CAPT}/ficha-{w}-{esq}.png', full_page=False, scale='css')
                        pg.locator('.fx-sec-marchas').scroll_into_view_if_needed(); pg.screenshot(path=f'{CAPT}/ficha-marchas-{w}-{esq}.png', full_page=False, scale='css')
                    if total or verb.count():
                        pg.goto(f'{BASE}/hermandad/{slug}/musica/#marchas', wait_until='networkidle')
                        nm = pg.locator('#marchas .fx-marchas > li').count()
                        if total: check(nm == total, f'{tag} {slug}/musica: {nm} marchas, todas las prometidas ({total})')
                        if primera: check(pg.locator('#marchas .vx-tit').first.inner_text() == primera, f'{tag} {slug}/musica: empieza por la misma marcha que la ficha ({primera})')
                        check(pg.locator('#bandas').count() == 1, f'{tag} {slug}/musica: sección de bandas')
                        check(pg.locator('.fx-volver').get_attribute('href').endswith(f'/hermandad/{slug}/'), f'{tag} {slug}/musica: vuelve a la ficha')
                        check(pg.evaluate('document.documentElement.scrollWidth - document.documentElement.clientWidth') <= 0, f'{tag} {slug}/musica: sin desbordamiento')
                        top = pg.evaluate("document.querySelector('#marchas').getBoundingClientRect().top")
                        check(top >= 0, f'{tag} {slug}/musica: el ancla #marchas no queda bajo la cabecera ({top:.0f} px)')
                        if CAPT and js and slug == 'la-aurora-granada':
                            pg.goto(f'{BASE}/hermandad/{slug}/musica/', wait_until='networkidle'); pg.screenshot(path=f'{CAPT}/musica-{w}-{esq}.png', full_page=False, scale='css')
                    check(not err, f'{tag} {slug}: sin errores' + ('' if not err else ': ' + err[0]))
                    pg.close()
                ctx.close()
    b.close()
print(f'{sum(ok)}/{len(ok)} comprobaciones')
