# Ocho Capitales · prueba de la hoja de sede del plano de la portada (oc-diseno, 4-nov): arriba van los titulares, en díptico
# (Cristo | Virgen) o en una sola foto; sin ellos, la lámina del nazareno. Nunca iniciales, la miniatura del punto ni la foto de la sede.
# Los puntos de En la calle: medallón con su nazareno si no hay foto; medallón neutro (cruz) si la procesión no tiene ficha. Nunca una letra. La hoja tiene fondo opaco.
# A 390, 768, 960 y 1440 px y con el móvil en horizontal (844×390), en claro y oscuro. Uso: python -I probar-hoja-sede.py [base_url] [carpeta_capturas]
import os, sys
sys.stdout.reconfigure(encoding="utf-8")
os.environ.setdefault('PLAYWRIGHT_BROWSERS_PATH', os.path.expandvars(r'%LOCALAPPDATA%\ms-playwright'))
from playwright.sync_api import sync_playwright
BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8091'
CAPT = sys.argv[2] if len(sys.argv) > 2 else ''
ok = []
def check(c, t): ok.append(bool(c)); print(('OK   ' if c else 'FALLO') + ' ' + t)
# abre la hoja del punto n-ésimo; si agrupa varias hermandades, la primera de la lista
ABRIR = """async (i) => {
  const s = [...document.querySelectorAll('.oc-pl-sede')][i];
  // el plano tarda en estar listo (más en horizontal): repite el toque hasta que se abra la hoja
  for (let k = 0; k < 8 && document.querySelector('[data-sede-hoja]').hidden; k++) { s.dispatchEvent(new MouseEvent('click', { bubbles: true })); await new Promise(r => setTimeout(r, 450)); }
  const b = document.querySelector('[data-sede-hoja] .oc-sede-lista button'); if (b) { b.click(); await new Promise(r => setTimeout(r, 350)); }
  const c = document.querySelector('[data-sede-hoja]');
  await Promise.all([...c.querySelectorAll('img')].map(i => i.complete ? 0 : new Promise(r => { i.addEventListener('load', r); i.addEventListener('error', r); setTimeout(r, 5000); })));
  return { t: c.querySelector('[data-sede-titulo]').textContent, par: !!c.querySelector('.oc-sede-par'), uno: !!c.querySelector('.oc-sede-dip.is-uno'), naz: !!c.querySelector('.oc-sede-foto.is-naz'),
    ini: !!c.querySelector('.is-ini'), html: c.innerHTML.length };
}"""
# cierra con su botón (data-sede-cerrar) y espera a que la hoja quede oculta: si no, se mediría siempre la misma
CERRAR = """async () => { const c = document.querySelector('[data-sede-hoja]'); c.querySelector('[data-sede-cerrar]').click();
  for (let k = 0; k < 20 && !c.hidden; k++) await new Promise(r => setTimeout(r, 100)); return c.hidden; }"""
with sync_playwright() as p:
    b = p.chromium.launch()
    for w, h, mv in ((390, 844, True), (844, 390, True), (768, 1024, True), (960, 800, False), (1440, 900, False)):
        for esq in ('light', 'dark'):
            ctx = b.new_context(viewport={'width': w, 'height': h}, color_scheme=esq, is_mobile=mv, has_touch=mv)
            ctx.add_init_script("try { sessionStorage.setItem('oc-entrada', '1'); sessionStorage.setItem('oc-colg', '1'); } catch (e) {}")
            tag = f'{w}px {esq}'; pg = ctx.new_page(); err = []
            pg.on('pageerror', lambda x: err.append(str(x)))
            todos = set()
            for ciudad in ('cordoba', 'sevilla'):
                pg.goto(f'{BASE}/#{ciudad}', wait_until='networkidle'); pg.wait_for_timeout(2200)
                n = pg.locator('.oc-pl-sede').count()
                vistos = {'par': None, 'uno': None, 'naz': None}; titulos = []
                for i in range(n):
                    r = pg.evaluate(ABRIR, i)
                    if r['ini'] or not (r['par'] or r['uno'] or r['naz']) or i < 3: check(not r['ini'] and (r['par'] or r['uno'] or r['naz']), f'{tag} {ciudad} {r["t"]}: titulares o nazareno, sin iniciales')
                    titulos.append(r['t'])
                    for k in vistos:
                        if r[k] and not vistos[k]:
                            vistos[k] = r['t']
                            panel = pg.locator('[data-sede-hoja] .oc-sheet-panel')
                            bg = pg.evaluate("(e) => getComputedStyle(e).backgroundColor", panel.element_handle())
                            check('/' not in bg and 'rgba' not in bg, f'{tag} {ciudad} {r["t"]} ({k}): fondo opaco {bg}')
                            im = pg.evaluate("() => [...document.querySelectorAll('[data-sede-hoja] .oc-sede-dip img, [data-sede-hoja] .oc-sede-foto')].map(i => [i.complete && i.naturalWidth > 0, Math.round(i.getBoundingClientRect().height)])")
                            check(im and all(x[0] for x in im), f'{tag} {ciudad} {r["t"]} ({k}): imágenes cargadas {im}')
                            alto = pg.evaluate("(e) => Math.round(e.getBoundingClientRect().height)", panel.element_handle())
                            check((h * .8 <= alto <= h * .86) if h <= 500 else alto <= h * .63, f'{tag} {ciudad} {r["t"]} ({k}): la hoja a media altura ({alto} de {h} px)')
                            vb = pg.evaluate("() => { const b = document.querySelector('[data-sede-hoja] .oc-sede-cuerpo > .oc-btn').getBoundingClientRect(), p = document.querySelector('[data-sede-hoja] .oc-sheet-panel').getBoundingClientRect(); return b.top >= p.top && b.bottom <= p.bottom + 1; }")
                            check(vb, f'{tag} {ciudad} {r["t"]} ({k}): «Ver su ficha» a la vista sin desplazar')
                            if CAPT: pg.wait_for_timeout(300); pg.screenshot(path=f'{CAPT}/hoja-{k}-{w}-{esq}.png')
                    cerrada = pg.evaluate(CERRAR); pg.wait_for_timeout(150)
                    if not cerrada or i < 2: check(cerrada, f'{tag} {ciudad} {r["t"]}: la hoja se cierra antes de abrir la siguiente')
                    if all(vistos.values()) and i >= 3: break  # ya están los tres casos: no hace falta abrir todas
                check(len(set(titulos)) > 1, f'{tag} {ciudad}: se han abierto sedes distintas ({len(set(titulos))} de {len(titulos)})')
                todos.update(k for k, v in vistos.items() if v)
                print(f'     {tag} {ciudad}: {n} puntos; díptico: {vistos["par"]}; una foto: {vistos["uno"]}; nazareno: {vistos["naz"]}')
            check(todos == {'par', 'uno', 'naz'}, f'{tag}: salen los tres casos (díptico, una foto y nazareno): {sorted(todos)}')
            # los puntos de «En la calle» (cabeza de cada procesión): las hermandades de la base sin foto llevan su medallón, no una letra
            med = pg.evaluate("""async () => { const t = (await Promise.all(['almeria', 'cadiz', 'cordoba', 'granada', 'huelva', 'jaen', 'malaga', 'sevilla'].map(async c => JSON.stringify(await (await fetch('/data/calle/' + c + '.json')).json())))).join('');
              const m = [...new Set(t.match(/assets\\/naz\\/[a-z0-9-]+-r\\.svg[^\"]*/g) || [])];
              const r = await Promise.all(m.slice(0, 5).map(u => fetch('/' + u).then(x => x.status))); return { n: m.length, neutro: (t.match(/_neutro-[a-z]+.svg/g) || []).length, vacias: (t.match(/\"img\":\"\"/g) || []).length, r }; }""")
            check(med['n'] > 0 and med['vacias'] == 0 and all(x == 200 for x in med['r']), f'{tag} En la calle, 8 capitales: {med["n"]} medallones con nazareno, {med["neutro"]} neutros (procesiones sin ficha), ninguna sin imagen ({med["vacias"]})')
            check(pg.evaluate('document.documentElement.scrollWidth - document.documentElement.clientWidth') <= 0, f'{tag}: sin desbordamiento')
            check(not err, f'{tag}: sin errores' + ('' if not err else ': ' + err[0]))
            ctx.close()
    b.close()
print(f'{sum(ok)}/{len(ok)} comprobaciones')
