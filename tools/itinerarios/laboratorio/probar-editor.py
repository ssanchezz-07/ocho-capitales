# Prueba del editor de rutas con Playwright (Python). Necesita el editor (node ../editor/servidor.mjs) y GraphHopper encendidos.
# Hace lo que haría Pablo en la Pasión: elegir la calle buena en el plano, arrastrar un punto, cambiar la salida,
# intentar guardar sin fuente (debe impedirlo), guardar con fuente, comprobar el JSON y deshacerlo todo al final.
# Uso: python -I probar-editor.py      Capturas: capturas/editor-*.png
import json, os, sys
os.environ.setdefault('PLAYWRIGHT_BROWSERS_PATH', r'C:\Users\pablo\Herramientas-IA\ms-playwright')
from playwright.sync_api import sync_playwright
D = os.path.dirname(os.path.abspath(__file__))
FC = os.path.join(D, 'correcciones-malaga.json')
URL = 'http://localhost:8765'
ok = []
def check(c, txt):
    ok.append((bool(c), txt)); print(('OK   ' if c else 'FALLO') + ' ' + txt)
antes = open(FC, encoding='utf8').read() if os.path.exists(FC) else None
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={'width': 1440, 'height': 900})
    errores = []
    pg.on('console', lambda m: errores.append(m.text) if m.type == 'error' else None)
    pg.on('pageerror', lambda e: errores.append(str(e)))
    pg.goto(URL)
    pg.wait_for_selector('#lista li')
    check('encendido' in pg.inner_text('#estado'), 'el editor ve el trazador encendido')
    pg.select_option('#herm', 'pasion-malaga')
    pg.wait_for_function("document.querySelector('#lista').innerText.includes('Plaza de los Mártires') && getComputedStyle(document.querySelector('#cargando')).display === 'none'")
    n = pg.locator('#lista li').count()
    check(n == 33, f'la lista oficial de la Pasión tiene {n} elementos de la lista oficial (33 esperados)')
    check(pg.locator('#gNuevo path.ida').count() == 1 and pg.locator('#gActual path.actual').count() == 1, 'se ven los dos trazados (nuevo y actual)')
    pg.screenshot(path=os.path.join(D, 'capturas', 'editor-inicio.png'))
    # 1) elegir la calle buena en el plano para «Plaza de los Mártires» (fila 2)
    pg.locator('#lista li').nth(1).click()
    check(pg.locator('#gCand path.cand').count() > 0, 'al pulsar la calle se ven en naranja sus candidatas')
    pg.get_by_role('button', name='Elegir la calle buena en el plano').click()
    check('modo-elegir' in (pg.get_attribute('#svg', 'class') or ''), 'modo «elegir calle» activo')
    via = pg.evaluate("D.filas[1].candidatas[0].ids[0]")
    xy = pg.evaluate(f"""(() => {{ const e = document.querySelector('#gCand path.toque[data-via="{via}"]'); const L = e.getTotalLength(); const q = e.getPointAtLength(L / 2); const s = document.getElementById('svg').createSVGPoint(); s.x = q.x; s.y = q.y; const r = s.matrixTransform(e.getScreenCTM()); return [r.x, r.y]; }})()""")
    pg.mouse.click(*xy)
    check(pg.locator('#lista li').nth(1).locator('.sello.pend').count() == 1, f'calle elegida en el plano (vía OSM {via}) y marcada «sin guardar»')
    # 2) arrastrar un punto de paso
    c = pg.locator('circle.paso').nth(3); bb = c.bounding_box()
    pg.mouse.move(bb['x'] + bb['width'] / 2, bb['y'] + bb['height'] / 2); pg.mouse.down(); pg.mouse.move(bb['x'] + 30, bb['y'] + 25, steps=6); pg.mouse.up()
    check(pg.evaluate('Object.keys(pend.puntos).length') == 1, 'punto de paso arrastrado')
    # 3) cambiar la salida
    pg.click('#bSalida')
    s = pg.evaluate("(() => { const e = [...document.querySelectorAll('#gPuntos circle')].at(-1).getBoundingClientRect(); return [e.x + e.width / 2, e.y + e.height / 2]; })()")
    pg.mouse.click(s[0] + 12, s[1] + 6)
    check(pg.evaluate("'salida' in pend"), 'salida cambiada con un clic en el plano')
    check('3 cambios' in pg.inner_text('#pendientes'), 'el contador dice 3 cambios sin guardar')
    # 4) guardar sin fuente: no debe dejar
    pg.click('#bGuardar')
    check('Escribe de dónde sale' in pg.inner_text('#mensaje'), 'sin fuente no se guarda (pide la fuente)')
    pg.fill('#fuenteCorr', 'Prueba automática del editor (Playwright), se deshace al final')
    pg.click('#bGuardar')
    pg.wait_for_function("document.querySelector('#mensaje').innerText.includes('Guardado')", timeout=60000)
    j = json.load(open(FC, encoding='utf8')).get('pasion-malaga', {})
    check(j.get('calles', {}).get('1', {}).get('via') == via and j.get('salida') and len(j.get('puntos', {})) == 1 and j.get('fuentes'), 'correcciones-malaga.json guarda calle, punto, salida y fuente')
    check(pg.locator('#lista li').nth(1).locator('.sello').count() == 1, 'tras volver a trazar, la fila sale como «corregida»')
    pg.screenshot(path=os.path.join(D, 'capturas', 'editor-guardado.png'))
    # 5) deshacer: se deja el archivo como estaba
    pg.evaluate("fetch('/api/hermandad/pasion-malaga', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ borrar_todo: true }) })")
    pg.wait_for_timeout(2500)
    check('pasion-malaga' not in json.load(open(FC, encoding='utf8')), 'correcciones de prueba borradas')
    check(not errores, 'sin errores en la consola' + ('' if not errores else ': ' + ' | '.join(errores[:3])))
    b.close()
if antes is not None and 'pasion-malaga' not in json.loads(antes): open(FC, 'w', encoding='utf8').write(antes)
print(f"{sum(1 for c, _ in ok if c)}/{len(ok)} comprobaciones")
sys.exit(0 if all(c for c, _ in ok) else 1)
