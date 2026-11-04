# Ocho Capitales · prueba del respaldo de las hermandades sin foto de un titular (oc-diseno, 4-nov): su nazareno en la ficha,
# el listado, el buscador y al compartir; sin iniciales ni huecos. A 390 y 1440 px, en claro y oscuro.
# Uso: python -I probar-respaldo.py [base_url]
import json, os, sys, urllib.request
os.environ.setdefault('PLAYWRIGHT_BROWSERS_PATH', os.path.expandvars(r'%LOCALAPPDATA%\ms-playwright'))
from playwright.sync_api import sync_playwright
BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8091'
# con su hábito, en trazo dorado (sin hábito descrito) y una con foto, que no debe cambiar
SIN_FOTO = {'dolores-de-alcolea-cordoba': 'túnica negra', 'la-o-cordoba': 'sin colores'}
CON_FOTO = 'la-aurora-granada'
ok = []
def check(c, t): ok.append(bool(c)); print(('OK   ' if c else 'FALLO') + ' ' + t)
idx = json.loads(urllib.request.urlopen(BASE + '/search-index.json').read())
lst = idx if isinstance(idx, list) else idx.get('i') or idx.get('items') or []
for slug in SIN_FOTO:
    e = next((x for x in lst if isinstance(x, dict) and x.get('u') == f'hermandad/{slug}/'), None)
    check(e and '/assets/naz/' + slug + '.svg' in e.get('i', ''), f'buscador: {slug} lleva su nazareno ({e and e.get("i")})')
with sync_playwright() as p:
    b = p.chromium.launch()
    for w, h, mv in ((390, 844, True), (1440, 900, False)):
        for esq in ('light', 'dark'):
            ctx = b.new_context(viewport={'width': w, 'height': h}, color_scheme=esq, is_mobile=mv, has_touch=mv)
            tag = f'{w}px {esq}'; pg = ctx.new_page(); err = []
            pg.on('pageerror', lambda x: err.append(str(x)))
            for slug, alt in SIN_FOTO.items():
                pg.goto(f'{BASE}/hermandad/{slug}/', wait_until='networkidle')
                n = pg.locator('.oc-estampa-naz')
                check(n.count() == 1 and alt in n.get_attribute('aria-label'), f'{tag} {slug}: nazareno en la ficha «{n.count() and n.get_attribute("aria-label")}»')
                check(pg.locator('.oc-estampa-ini').count() == 0, f'{tag} {slug}: sin inicial')
                og = pg.locator('meta[property="og:image"]').get_attribute('content')
                check(og.endswith(f'/assets/og/h-{slug}.jpg') and urllib.request.urlopen(BASE + '/assets/og/h-' + slug + '.jpg').status == 200, f'{tag} {slug}: imagen al compartir {og}')
            pg.goto(f'{BASE}/hermandad/{CON_FOTO}/', wait_until='networkidle')
            check(pg.locator('.oc-estampa-naz').count() == 0 and '/assets/og/' not in pg.locator('meta[property="og:image"]').get_attribute('content'), f'{tag} {CON_FOTO}: con foto, sin respaldo')
            pg.goto(f'{BASE}/hermandades/', wait_until='networkidle')
            check(pg.locator('.ix-foto.is-sello').count() == 0, f'{tag} listado: ninguna inicial')
            for slug in SIN_FOTO:
                pg.fill('#fq', slug.split('-')[0] if slug != 'la-o-cordoba' else 'La O'); pg.wait_for_timeout(400)
                im = pg.locator(f'.oc-entry:has(a[href$="/hermandad/{slug}/"]) .ix-foto.is-naz img')
                check(im.count() == 1 and pg.evaluate('(i) => i.complete && i.naturalWidth > 0', im.element_handle()), f'{tag} listado: {slug} con su nazareno cargado')
            check(pg.evaluate('document.documentElement.scrollWidth - document.documentElement.clientWidth') <= 0, f'{tag}: sin desbordamiento')
            check(not err, f'{tag}: sin errores' + ('' if not err else ': ' + err[0]))
            ctx.close()
    b.close()
print(f'{sum(ok)}/{len(ok)} comprobaciones')
