# Ocho Capitales · prueba de «Volver arriba» y del reloj de En la calle (oc-diseno, 5-nov).
# Volver arriba: no está al cargar; aparece pasadas dos pantallas; 44 px, aria-label y borde dorado; no choca con erCuñao,
# la barra de abajo ni el reloj; nunca encima del plano ni de su crédito de OpenStreetMap; un toque real recién bajado
# (erCuñao escondido) sube del todo, de golpe con «reducir movimiento», y deja el foco en el contenido.
# Reloj: la barra de la hora y «Ahora» de 44 px. Recorriendo En la calle cada 60 px: erCuñao no pisa el reloj, el crédito
# de OSM no queda bajo nada y, en horizontal, el reloj no tapa los botones del plano. Con la ficha de una cofradía abierta:
# el reloj fuera del panel y «Ver la hermandad» a la vista sin desplazar la hoja. Con la hoja de sede de la portada:
# «Ver su ficha» a la vista y tocable. A 390, 768, 844×390 y 1440 px, en claro y oscuro.
# Uso: python -I probar-arriba.py [base_url]
import os, sys
sys.stdout.reconfigure(encoding='utf-8')
os.environ.setdefault('PLAYWRIGHT_BROWSERS_PATH', os.path.expandvars(r'%LOCALAPPDATA%\ms-playwright'))
from playwright.sync_api import sync_playwright
BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8091'
ok = []
def check(c, t): ok.append(bool(c)); print(('OK   ' if c else 'FALLO') + ' ' + t)
# rectángulos de lo que se ve de verdad (ni display:none, ni visibility:hidden, ni opacidad casi nula)
RECT = """(s) => [...document.querySelectorAll(s)].filter(e => { if (!e.getClientRects().length) return false; const c = getComputedStyle(e); return c.visibility === 'visible' && +c.opacity > .3; })
  .map(e => { const r = e.getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom]; }).filter(r => r[3] > 0 && r[1] < innerHeight)"""
# lo mismo, recortado a la parte que no tapa la barra de abajo (lo que queda detrás de ella no se ve)
RECTV = RECT.replace(".filter(r => r[3] > 0", ".map(r => { const t = document.querySelector('.oc-tabbar'), lim = t && t.getClientRects().length ? t.getBoundingClientRect().top : innerHeight; return [r[0], r[1], r[2], Math.min(r[3], lim)]; }).filter(r => r[3] > r[1] && r[3] > 0")
def choca(a, b, m=0): return a[0] < b[2] - m and a[2] > b[0] + m and a[1] < b[3] - m and a[3] > b[1] + m
def estado(pg):
    return pg.evaluate("""() => { const b = document.querySelector('[data-arriba]'), s = getComputedStyle(b), r = b.getBoundingClientRect();
      return { ver: s.display !== 'none' && s.visibility === 'visible' && +s.opacity > .9, r: [r.left, r.top, r.right, r.bottom], borde: s.borderTopColor, ancho: s.borderTopWidth, label: b.getAttribute('aria-label') }; }""")
def toque(pg, e):  # toque o clic real en el centro del botón, donde está ahora
    x, y = (e['r'][0] + e['r'][2]) / 2, (e['r'][1] + e['r'][3]) / 2
    pg.mouse.click(x, y)
PAGINAS = ('/noticias/', '/hermandades/', '/semana-santa/sevilla/', '/en-la-calle/sevilla/')
with sync_playwright() as p:
    br = p.chromium.launch()
    for w, h, mv in ((390, 844, True), (768, 1024, True), (844, 390, True), (1440, 900, False)):
        for esq in ('light', 'dark'):
            for quieto in (False, True):
                if quieto and esq == 'dark': continue
                ctx = br.new_context(viewport={'width': w, 'height': h}, color_scheme=esq, is_mobile=mv, has_touch=mv, reduced_motion='reduce' if quieto else 'no-preference')
                ctx.add_init_script("try { sessionStorage.setItem('oc-entrada', '1'); sessionStorage.setItem('oc-cunao', '1'); } catch (e) {}")
                pg = ctx.new_page(); err = []; pg.on('pageerror', lambda x: err.append(str(x)))
                tag = f'{w}×{h} {esq}' + (' reducido' if quieto else '')
                for ruta in PAGINAS:
                    pg.goto(BASE + ruta, wait_until='networkidle'); pg.wait_for_timeout(500)
                    t = f'{tag} {ruta}'
                    check(not estado(pg)['ver'], f'{t}: al cargar no está')
                    largo = pg.evaluate('document.documentElement.scrollHeight - innerHeight')
                    if largo <= h: print(f'     {t}: apenas hay que desplazar ({largo} px), sin botón'); continue
                    # bajar de una vez hasta pasado el umbral: erCuñao se esconde y volver arriba ocupa su sitio
                    pg.evaluate(f'window.scrollTo(0, {int(min(h * 2.5, largo))})'); pg.wait_for_timeout(450)
                    e = estado(pg)
                    planos = pg.evaluate(RECT, '.oc-calle-mapa, .oc-calle-osm')
                    check(e['ver'] and not any(choca(e['r'], r) for r in planos), f'{t}: al bajar aparece (y no sobre el plano)')
                    check(round(e['r'][2] - e['r'][0]) >= 44 and round(e['r'][3] - e['r'][1]) >= 44 and e['label'] == 'Volver arriba', f'{t}: 44 px y «Volver arriba» ({round(e["r"][2] - e["r"][0])}×{round(e["r"][3] - e["r"][1])})')
                    check('0, 0, 0' not in e['borde'] and e['ancho'] == '2px', f'{t}: borde dorado de 2 px ({e["borde"]}, {e["ancho"]})')
                    otros = pg.evaluate(RECT, '.oc-tabbar, .oc-cunao-btn, .oc-calle-reloj')
                    check(not any(choca(e['r'], r, 1) for r in otros), f'{t}: no pisa la barra, erCuñao ni el reloj')
                    if ruta in ('/noticias/', '/en-la-calle/sevilla/'):
                        # toque real recién bajado (el caso normal): tiene que subir, también con «reducir movimiento»
                        toque(pg, e); pg.wait_for_timeout(80 if quieto else 1500)
                        y = pg.evaluate('scrollY'); foco = pg.evaluate('document.activeElement && document.activeElement.id')
                        check(y == 0 and foco == 'contenido' and pg.url.startswith(BASE + ruta), f'{t}: el toque sube del todo' + (' de golpe' if quieto else '') + f' y el foco va al contenido (y={y}, foco={foco})')
                        pg.wait_for_timeout(300); check(not estado(pg)['ver'], f'{t}: arriba ya no está')
                    # subir un poco: vuelve erCuñao y volver arriba se queda encima de él, sin tocarlo
                    pg.evaluate(f'window.scrollTo(0, {int(min(h * 2.5, largo))})'); pg.wait_for_timeout(400)
                    pg.evaluate(f'window.scrollTo(0, {int(min(h * 2.5, largo)) - 200})'); pg.wait_for_timeout(450)
                    e = estado(pg); otros = pg.evaluate(RECT, '.oc-tabbar, .oc-cunao-btn, .oc-calle-reloj')
                    check(not e['ver'] or not any(choca(e['r'], r, 1) for r in otros), f'{t}: al subir, junto a erCuñao sin tocarlo')
                # En la calle: reloj de 44 px y recorrido de toda la página cada 60 px, bajando y subiendo
                pg.goto(BASE + '/en-la-calle/sevilla/', wait_until='networkidle'); pg.wait_for_timeout(500)
                m = pg.evaluate("() => { const r = document.querySelector('.oc-calle-tiempo input').getBoundingClientRect(); return [r.height, getComputedStyle(document.querySelector('.oc-calle-ahora')).minHeight]; }")
                check(round(m[0]) >= 44 and m[1] == '44px', f'{tag} reloj: barra de la hora de {round(m[0])} px y «Ahora» de {m[1]}')
                largo = pg.evaluate('document.documentElement.scrollHeight - innerHeight')
                malos = []
                for y in list(range(0, largo + 1, 60)) + list(range(largo, -1, -60)):
                    pg.evaluate(f'scrollTo(0, {y})'); pg.wait_for_timeout(260)
                    g = lambda s: pg.evaluate(RECTV, s)
                    reloj, osm, cunao, arriba = g('.oc-calle-reloj'), g('.oc-calle-osm'), g('.oc-cunao-btn'), g('.oc-arriba')
                    for a, b, que in ((cunao, reloj, 'erCuñao/reloj'), (arriba, reloj, 'arriba/reloj'), (osm, reloj, 'OSM/reloj'), (osm, cunao, 'OSM/erCuñao'), (osm, arriba, 'OSM/arriba'), (arriba, g('.oc-calle-mapa'), 'arriba/plano')):
                        if a and b and choca(a[0], b[0]): malos.append(f'{que}@{y}')
                    if h <= 500 and reloj and any(choca(reloj[0], c) for c in g('.oc-calle-btn')): malos.append(f'reloj/botones del plano@{y}')
                pg.wait_for_timeout(500)
                check(not malos, f'{tag} En la calle, toda la página cada 60 px: nada se pisa' + ('' if not malos else ': ' + ', '.join(malos[:6])))
                # con la ficha de una cofradía abierta y con la hoja de sede de la portada abierta
                if not quieto:
                    pg.evaluate('scrollTo(0, 0)'); pg.wait_for_timeout(300)
                    pg.evaluate("document.querySelector('.oc-calle-item button').click()"); pg.wait_for_timeout(900)
                    pg.evaluate(f'scrollTo(0, {h * 3})'); pg.wait_for_timeout(450)
                    check(not estado(pg)['ver'], f'{tag} ficha abierta: volver arriba no está')
                    pg.evaluate("scrollTo(0, scrollY + document.querySelector('.oc-calle-mapa').getBoundingClientRect().bottom - innerHeight + 140)"); pg.wait_for_timeout(450)
                    f = pg.evaluate("""() => { const g = e => { const r = e.getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom]; };
                      const p = document.querySelector('.oc-calle-ficha .oc-sheet-panel'), rl = document.querySelector('.oc-calle-reloj'), inp = rl.querySelector('input');
                      const a = [...p.querySelectorAll('a.oc-btn')].find(x => /hermandad/i.test(x.textContent));
                      const b = a && g(a), t = b && document.elementFromPoint((b[0] + b[2]) / 2, (b[1] + b[3]) / 2);
                      return { panel: g(p), reloj: g(rl), inp: g(inp), boton: b, tocable: !!(t && a.contains(t)) }; }""")
                    en_vista = f['reloj'][3] > 0 and f['reloj'][1] < h
                    if h > 500: check(en_vista and not choca(f['reloj'], f['panel']), f'{tag} ficha abierta: el reloj a la vista y fuera del panel (reloj {[round(x) for x in f["reloj"]]}, panel {[round(x) for x in f["panel"]]})')
                    else: check(not en_vista or not choca(f['reloj'], f['panel']), f'{tag} ficha abierta: el reloj no queda bajo el panel')
                    check(f['inp'][2] - f['inp'][0] > 150, f'{tag} ficha abierta: la barra de la hora entera ({round(f["inp"][2] - f["inp"][0])} px)')
                    b = f['boton']
                    check(b and b[1] >= 0 and b[3] <= h and f['tocable'], f'{tag} ficha abierta: «Ver la hermandad» a la vista sin desplazar la hoja y tocable ({b and [round(x) for x in b]})')
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
