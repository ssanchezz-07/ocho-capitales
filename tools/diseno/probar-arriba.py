# Ocho Capitales · prueba de «Volver arriba» y del reloj de En la calle (oc-diseno, 5-nov).
# Volver arriba: no está al cargar; aparece pasadas dos pantallas; 44 px, aria-label y borde dorado; no choca con erCuñao,
# la barra de abajo ni el reloj; nunca encima del plano ni de su crédito de OpenStreetMap; sube del todo (de golpe con
# «reducir movimiento») y deja el foco en el contenido. Reloj: la barra de la hora y «Ahora» de 44 px; erCuñao no lo roza;
# el reloj no tapa el crédito de OSM. A 390, 768 y 1440 px, en claro y oscuro. Uso: python -I probar-arriba.py [base_url]
import os, sys
os.environ.setdefault('PLAYWRIGHT_BROWSERS_PATH', os.path.expandvars(r'%LOCALAPPDATA%\ms-playwright'))
from playwright.sync_api import sync_playwright
BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8091'
ok = []
def check(c, t): ok.append(bool(c)); print(('OK   ' if c else 'FALLO') + ' ' + t)
RECT = "(s) => [...document.querySelectorAll(s)].filter(e => e.getClientRects().length).map(e => { const r = e.getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom]; })"
def choca(a, b, m=0): return a[0] < b[2] - m and a[2] > b[0] + m and a[1] < b[3] - m and a[3] > b[1] + m
def estado(pg):
    return pg.evaluate("""() => { const b = document.querySelector('[data-arriba]'), s = getComputedStyle(b), r = b.getBoundingClientRect();
      return { ver: s.visibility === 'visible' && +s.opacity > .9, r: [r.left, r.top, r.right, r.bottom], borde: s.borderTopColor, label: b.getAttribute('aria-label') }; }""")
PAGINAS = ('/noticias/', '/hermandades/', '/semana-santa/sevilla/', '/en-la-calle/sevilla/')
with sync_playwright() as p:
    br = p.chromium.launch()
    for w, h, mv in ((390, 844, True), (768, 1024, True), (1440, 900, False)):
        for esq in ('light', 'dark'):
            for quieto in (False, True):
                if quieto and esq == 'dark': continue
                ctx = br.new_context(viewport={'width': w, 'height': h}, color_scheme=esq, is_mobile=mv, has_touch=mv, reduced_motion='reduce' if quieto else 'no-preference')
                ctx.add_init_script("try { sessionStorage.setItem('oc-entrada', '1'); sessionStorage.setItem('oc-cunao', '1'); } catch (e) {}")
                pg = ctx.new_page(); err = []; pg.on('pageerror', lambda x: err.append(str(x)))
                tag = f'{w}px {esq}' + (' reducido' if quieto else '')
                for ruta in PAGINAS:
                    pg.goto(BASE + ruta, wait_until='networkidle'); pg.wait_for_timeout(500)
                    t = f'{tag} {ruta}'
                    check(not estado(pg)['ver'], f'{t}: al cargar no está')
                    alto = pg.evaluate('document.documentElement.scrollHeight')
                    if alto < h * 3.2: print(f'     {t}: página corta ({alto} px), sin más'); continue
                    # bajar a 2,5 pantallas (erCuñao se esconde al bajar: volver arriba ocupa su sitio)
                    pg.mouse.wheel(0, 0); pg.evaluate(f'window.scrollTo(0, {int(h * 2.5)})'); pg.wait_for_timeout(450)
                    e = estado(pg)
                    planos = pg.evaluate(RECT, '.oc-calle-mapa, .oc-calle-osm')
                    sobre_plano = any(choca(e['r'], r) for r in planos)
                    check(e['ver'] and not sobre_plano, f'{t}: pasadas dos pantallas aparece (y no sobre el plano)')
                    check(round(e['r'][2] - e['r'][0]) >= 44 and round(e['r'][3] - e['r'][1]) >= 44 and e['label'] == 'Volver arriba', f'{t}: 44 px y «Volver arriba» ({round(e["r"][2] - e["r"][0])}×{round(e["r"][3] - e["r"][1])})')
                    check('0, 0, 0' not in e['borde'], f'{t}: borde dorado {e["borde"]}')
                    otros = pg.evaluate(RECT, '.oc-tabbar, .oc-cunao-btn:not(.is-oculto), .oc-calle-reloj')
                    check(not any(choca(e['r'], r, 1) for r in otros), f'{t}: no pisa la barra, erCuñao ni el reloj')
                    # subir un poco: vuelve erCuñao y volver arriba se queda encima de él, sin tocarlo
                    pg.evaluate(f'window.scrollTo(0, {int(h * 2.5) - 300})'); pg.wait_for_timeout(450)
                    e = estado(pg); otros = pg.evaluate(RECT, '.oc-tabbar, .oc-cunao-btn:not(.is-oculto), .oc-calle-reloj')
                    check(e['ver'] and not any(choca(e['r'], r, 1) for r in otros), f'{t}: al subir, junto a erCuñao sin tocarlo')
                    if ruta == '/noticias/' or ruta == '/en-la-calle/sevilla/':
                        pg.click('[data-arriba]')
                        pg.wait_for_timeout(60 if quieto else 1400)
                        y = pg.evaluate('scrollY'); foco = pg.evaluate('document.activeElement && document.activeElement.id')
                        check(y == 0 and foco == 'contenido', f'{t}: sube del todo' + (' de golpe' if quieto else '') + f' y el foco va al contenido (y={y}, foco={foco})')
                        pg.wait_for_timeout(300); check(not estado(pg)['ver'], f'{t}: arriba ya no está')
                # reloj de En la calle
                pg.goto(BASE + '/en-la-calle/sevilla/', wait_until='networkidle'); pg.wait_for_timeout(500)
                m = pg.evaluate("() => { const g = s => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom]; }; return { inp: g('.oc-calle-tiempo input'), ahora: getComputedStyle(document.querySelector('.oc-calle-ahora')).minHeight, reloj: g('.oc-calle-reloj'), cunao: g('.oc-cunao-btn'), osm: g('.oc-calle-osm'), mapa: g('.oc-calle-mapa') }; }")
                check(round(m['inp'][3] - m['inp'][1]) >= 44 and m['ahora'] == '44px', f'{tag} reloj: barra de la hora de {round(m["inp"][3] - m["inp"][1])} px y «Ahora» de {m["ahora"]}')
                check(not choca(m['cunao'], m['reloj']), f'{tag} reloj: erCuñao no lo roza (erCuñao acaba en {round(m["cunao"][3])}, el reloj empieza en {round(m["reloj"][1])})')
                # con el final del plano a la vista, el reloj descansa sobre él: el crédito de OSM tiene que verse
                pg.evaluate(f"window.scrollTo(0, scrollY + document.querySelector('.oc-calle-mapa').getBoundingClientRect().bottom - innerHeight + 140)"); pg.wait_for_timeout(400)
                m2 = pg.evaluate(RECT, '.oc-calle-reloj, .oc-calle-osm')
                check(len(m2) == 2 and not choca(m2[0], m2[1]), f'{tag} reloj: no tapa el crédito de OpenStreetMap')
                osm = pg.evaluate(RECT, '.oc-calle-osm')[0]
                for y in (0, 200, 400):  # erCuñao y volver arriba están fijos: el crédito no puede quedar debajo en ningún punto del plano
                    pg.evaluate(f'scrollTo(0, {y})'); pg.wait_for_timeout(350)
                    osm = pg.evaluate(RECT, '.oc-calle-osm')[0]; fijos = pg.evaluate(RECT, '.oc-cunao-btn:not(.is-oculto), .oc-arriba.is-visible')
                    check(not any(choca(osm, f) for f in fijos), f'{tag} plano a {y} px: erCuñao ni volver arriba tapan el crédito de OpenStreetMap')
                check(pg.evaluate('document.documentElement.scrollWidth - document.documentElement.clientWidth') <= 0, f'{tag}: sin desbordamiento')
                check(not err, f'{tag}: sin errores' + ('' if not err else ': ' + err[0]))
                ctx.close()
    br.close()
print(f'{sum(ok)}/{len(ok)} comprobaciones')
