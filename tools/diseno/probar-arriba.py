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
      return { ver: s.display !== 'none' && s.visibility === 'visible' && +s.opacity > .9, r: [r.left, r.top, r.right, r.bottom], borde: s.borderTopColor, label: b.getAttribute('aria-label') }; }""")
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
                # con la ficha de una cofradía abierta (En la calle) y con la hoja de sede abierta (plano de la portada):
                # volver arriba no está, el reloj no queda bajo el panel y el botón de la ficha se puede tocar
                if not quieto:
                    pg.evaluate('scrollTo(0, 0)'); pg.locator('.oc-calle-item button').first.click(); pg.wait_for_timeout(900)
                    pg.evaluate(f'scrollTo(0, {h * 3})'); pg.wait_for_timeout(450)
                    check(not estado(pg)['ver'], f'{tag} ficha abierta: volver arriba no está')
                    pg.evaluate("scrollTo(0, scrollY + document.querySelector('.oc-calle-mapa').getBoundingClientRect().bottom - innerHeight + 140)"); pg.wait_for_timeout(450)
                    f = pg.evaluate("""() => { const g = e => { const r = e.getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom]; };
                      const p = document.querySelector('.oc-calle-ficha .oc-sheet-panel'), rl = document.querySelector('.oc-calle-reloj'), inp = rl.querySelector('input');
                      const a = [...p.querySelectorAll('a.oc-btn')].find(x => /hermandad/i.test(x.textContent)); if (a) a.scrollIntoView({ block: 'nearest' });
                      const b = a && g(a), cx = b && (b[0] + b[2]) / 2, cy = b && (b[1] + b[3]) / 2, t = b && document.elementFromPoint(cx, cy);
                      return { panel: g(p), reloj: g(rl), inp: g(inp), boton: !!a, tocable: !!(t && a.contains(t)) }; }""")
                    en_vista = f['reloj'][3] > 0 and f['reloj'][1] < h
                    check(en_vista and not choca(f['reloj'], f['panel']), f'{tag} ficha abierta: el reloj a la vista y fuera del panel (reloj {[round(x) for x in f["reloj"]]}, panel {[round(x) for x in f["panel"]]})')
                    check(f['inp'][2] - f['inp'][0] > 150, f'{tag} ficha abierta: la barra de la hora entera ({round(f["inp"][2] - f["inp"][0])} px)')
                    check(f['boton'] and f['tocable'], f'{tag} ficha abierta: «Ver la hermandad» se puede tocar (nada encima)')
                    # hoja de sede en el plano de la portada
                    pg.evaluate("sessionStorage.setItem('oc-colg', '1')"); pg.goto(BASE + '/#sevilla', wait_until='networkidle'); pg.wait_for_timeout(2000)
                    s = pg.evaluate("""async () => { const s = document.querySelector('.oc-pl-sede'); for (let k = 0; k < 8 && document.querySelector('[data-sede-hoja]').hidden; k++) { s.dispatchEvent(new MouseEvent('click', { bubbles: true })); await new Promise(r => setTimeout(r, 450)); }
                      const l = document.querySelector('[data-sede-hoja] .oc-sede-lista button'); if (l) { l.click(); await new Promise(r => setTimeout(r, 350)); }
                      const v = document.querySelector('[data-sede-hoja] .oc-sede-cuerpo > .oc-btn'), r = v.getBoundingClientRect(), t = document.elementFromPoint((r.left + r.right) / 2, (r.top + r.bottom) / 2);
                      const ar = getComputedStyle(document.querySelector('[data-arriba]')), rj = document.querySelector('.oc-colg-reloj');
                      const rr = rj && rj.getClientRects().length ? rj.getBoundingClientRect() : null;
                      return { ver: r.top >= 0 && r.bottom <= innerHeight, tocable: !!(t && v.contains(t)), arriba: ar.display !== 'none' && ar.visibility === 'visible', reloj: rr ? [rr.left, rr.top, rr.right, rr.bottom] : null, boton: [r.left, r.top, r.right, r.bottom] }; }""")
                    check(s['ver'] and s['tocable'] and not s['arriba'] and not (s['reloj'] and choca(s['reloj'], s['boton'])), f'{tag} hoja de sede: «Ver su ficha» a la vista y tocable, sin volver arriba ni reloj encima')
                check(pg.evaluate('document.documentElement.scrollWidth - document.documentElement.clientWidth') <= 0, f'{tag}: sin desbordamiento')
                check(not err, f'{tag}: sin errores' + ('' if not err else ': ' + err[0]))
                ctx.close()
    br.close()
print(f'{sum(ok)}/{len(ok)} comprobaciones')
