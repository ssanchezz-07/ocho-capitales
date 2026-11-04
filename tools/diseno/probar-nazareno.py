# Ocho Capitales · prueba del nazareno pequeño de la ficha de hermandad (oc-diseno): una figura por sección con colores de la tabla,
# texto alternativo con los colores, nada sin datos, sin desbordamiento, a 360/390/1440 px en claro y oscuro.
# Uso: python -I probar-nazareno.py [base_url] [carpeta_capturas]
import os, sys
os.environ.setdefault('PLAYWRIGHT_BROWSERS_PATH', os.path.expandvars(r'%LOCALAPPDATA%\ms-playwright'))
from playwright.sync_api import sync_playwright
BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8091'
CAPT = sys.argv[2] if len(sys.argv) > 2 else ''
# ficha → (figuras esperadas, color de la túnica de la primera, trozo del texto alternativo)
FICHAS = {
    'nazareno-de-santa-maria-cadiz': (2, '#5b2a86', 'túnica morada'),   # dos secciones
    'fusionadas-malaga': (4, '#5b2a86', 'cinturón de esparto'),        # cuatro secciones
    'amor-malaga': (1, '#1b1b1f', 'capirote negro'),
    'gitanos-malaga': (2, '#5b2a86', 'capillo morado'),                # capillo
    'los-estudiantes-huelva': (1, '#1b1b1f', 'morrión negro'),         # morrión
    'piedad-malaga': (1, '#1b1b1f', 'cíngulo dorado'),                 # sin tocado: solo contorno
    'la-borriquilla-jaen': (1, '#f5f3ee', 'caperuz blanco'),          # caperuz: la cabeza va pintada, no vacía (auditor, 4-nov)
    'nuestra-senora-de-los-dolores-granada': (1, '#f5f3ee', 'cíngulo blanco'),  # cíngulo del color de la túnica: lleva contorno
    'servitas-malaga': (0, None, None),                                # tabla vacía: sin figura
    'la-aurora-granada': (1, '#f5f3ee', 'fajín rojo'),               # Granada, cargada el 4-nov (blanco, capillo y fajín rojo)
}
ok = []
def check(c, t): ok.append(bool(c)); print(('OK   ' if c else 'FALLO') + ' ' + t)
with sync_playwright() as p:
    b = p.chromium.launch()
    for w, h, mv in ((360, 780, True), (390, 844, True), (1440, 900, False)):
        for esq in ('light', 'dark'):
            ctx = b.new_context(viewport={'width': w, 'height': h}, color_scheme=esq, is_mobile=mv, has_touch=mv)
            tag = f'{w}px {esq}'
            for slug, (n, tun, alt) in FICHAS.items():
                pg = ctx.new_page(); err = []
                pg.on('pageerror', lambda x: err.append(str(x)))
                pg.goto(f'{BASE}/hermandad/{slug}/', wait_until='networkidle')
                figs = pg.locator('svg.oc-nazm')
                check(figs.count() == n, f'{tag} {slug}: {figs.count()} nazarenos (esperados {n})')
                if n:
                    f = figs.first
                    check(f.get_attribute('role') == 'img' and alt in f.get_attribute('aria-label'), f'{tag} {slug}: texto alternativo «{f.get_attribute("aria-label")}»')
                    ft = pg.evaluate("(s) => s.querySelector('path[d^=\"M86 228\"]').getAttribute('fill')", f.element_handle())
                    check(ft == tun, f'{tag} {slug}: túnica {ft} (esperada {tun})')
                    bb = f.bounding_box(); check(bb and 30 <= bb['width'] <= 60 and bb['height'] <= 170, f'{tag} {slug}: tamaño de la figura {bb and round(bb["width"])}×{bb and round(bb["height"])}')
                    anim = pg.evaluate("(s) => getComputedStyle(s).animationName + '|' + getComputedStyle(s).transitionDuration", f.element_handle())
                    check(anim.startswith('none'), f'{tag} {slug}: figura quieta ({anim})')
                    vacia = pg.evaluate("(s) => s.querySelectorAll('.is-vacio').length", f.element_handle())
                    if slug in ('la-borriquilla-jaen', 'fusionadas-malaga', 'nazareno-de-santa-maria-cadiz'): check(vacia == 0, f'{tag} {slug}: la cabeza lleva su color')
                    if 'cíngulo' in alt: check(f.locator('.oc-nazm-cinto-b').count() == 1, f'{tag} {slug}: el cíngulo lleva contorno')
                    if 'cíngulo' in alt:
                        cb = pg.evaluate("(s) => getComputedStyle(s.querySelector('.oc-nazm-cinto-b')).stroke", f.element_handle())
                        check('255, 255, 255' not in cb, f'{tag} {slug}: el contorno del cíngulo es oscuro también en {esq} ({cb})')
                    borde = pg.evaluate("(s) => getComputedStyle(s.querySelector('path')).stroke", f.element_handle())
                    check(('255, 255, 255' in borde) == (esq == 'dark'), f'{tag} {slug}: contorno según el modo ({borde})')
                    if CAPT and slug in ('nazareno-de-santa-maria-cadiz', 'fusionadas-malaga', 'los-estudiantes-huelva', 'la-borriquilla-jaen', 'nuestra-senora-de-los-dolores-granada') and w != 360:
                        sec = pg.locator('.oc-habito-cols'); sec.scroll_into_view_if_needed(); pg.wait_for_timeout(200)
                        sec.screenshot(path=f'{CAPT}/{slug}-{w}-{esq}.png')
                check(pg.evaluate('document.documentElement.scrollWidth - document.documentElement.clientWidth') <= 0, f'{tag} {slug}: sin desbordamiento')
                check(not err, f'{tag} {slug}: sin errores' + ('' if not err else ': ' + err[0]))
                pg.close()
            ctx.close()
    b.close()
print(f'{sum(ok)}/{len(ok)} comprobaciones')
