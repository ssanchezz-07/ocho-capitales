# Ocho Capitales · erCuñao en un navegador de verdad, a 390 px (móvil táctil) y 1440 px.
# Comprueba: no pide ningún dato hasta abrirse; abre al primer toque; responde preguntas de Jaén, combinadas y de marchas
# pidiendo solo los trozos que necesita; «Sugerir» lleva a Colabora; sin desbordes ni errores de consola; Esc cierra.
# Uso: python -I probar-cunao-navegador.py [base_url] [carpeta para capturas]   (con site/serve.mjs sirviendo site/dist)
import os, sys, re
sys.stdout.reconfigure(encoding="utf-8")
os.environ.setdefault('PLAYWRIGHT_BROWSERS_PATH', r'C:\Users\pablo\Herramientas-IA\ms-playwright')
from playwright.sync_api import sync_playwright
BASE = (sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8093').rstrip('/')
CAPT = sys.argv[2] if len(sys.argv) > 2 else ''
ok = []
def check(c, t): ok.append(bool(c)); print(('OK   ' if c else 'FALLO') + ' ' + t)

PREGUNTAS = [
    ('¿A qué hora sale el Abuelo de Jaén?', r'«El Abuelo» \(Jaén\) sale la Madrugá a las 02:30', ['cunao.json']),
    ('¿Cuál es la primera cofradía que sale en Jaén?', r'La primera en salir .* Jaén es La Borriquilla', []),
    ('que sale el jueves santo en jaen por la tarde', r'Jueves Santo en Jaén, por la tarde', []),
    ('historia de la borriquilla de jaen', r'llamá', ['cunao/jaen.json']),
    ('¿Quién compuso Amarguras?', r'Font de Anta', ['cunao/m/autores.json', 'cunao/m/a.json']),
    ('¿Quién ganó la liga?', r'no lo sé|no me suena|Me has pillado', []),
]

with sync_playwright() as p:
    b = p.chromium.launch()
    for w, h, mv in ((390, 844, True), (1440, 900, False)):
        ctx = b.new_context(viewport={'width': w, 'height': h}, is_mobile=mv, has_touch=mv, locale='es-ES')
        pg = ctx.new_page()
        errores, datos = [], []
        pg.on('console', lambda m: errores.append(m.text) if m.type == 'error' else None)
        pg.on('pageerror', lambda e: errores.append(str(e)))
        pg.on('request', lambda r: datos.append(r.url) if '/data/cunao' in r.url else None)
        pg.goto(BASE + '/hermandad/la-expiracion-jaen/', wait_until='networkidle'); pg.wait_for_timeout(600)
        check(not datos, f'{w}px no pide datos de erCuñao hasta abrirlo ({len(datos)} peticiones)')
        btn = pg.locator('.oc-cunao-btn')
        if mv: btn.tap()
        else: btn.click()
        pg.wait_for_timeout(450)
        abierto = pg.evaluate("(() => { const h = document.querySelector('[data-cunao-hoja]'); return !h.hidden && h.classList.contains('is-open') && document.querySelector('[data-cunao]').getAttribute('aria-expanded') === 'true'; })()")
        check(abierto, f'{w}px se abre al primer toque')
        q = pg.locator('[data-cunao-q]')
        for pregunta, espera, trozos in PREGUNTAS:
            antes = pg.locator('.oc-cunao-msg.is-cunao').count()
            q.fill(pregunta); q.press('Enter')
            # sin wait_for_function: evalúa texto y la CSP de la web (sin 'unsafe-eval') lo bloquea con un error de consola
            for _ in range(40):
                pg.wait_for_timeout(200)
                if pg.locator('.oc-cunao-msg.is-cunao:not(.is-pensando)').count() > antes: break
            pg.wait_for_timeout(300)
            t = pg.locator('.oc-cunao-msg.is-cunao').last.inner_text()
            pedidos = [u for u in datos if any(u.endswith(x) or ('/' + x) in u for x in trozos)]
            check(re.search(espera, t) is not None and len(pedidos) >= len(trozos), f'{w}px «{pregunta}» → {t[:90].replace(chr(10), " ")}…' + (f' (trozos: {", ".join(trozos)})' if trozos else ''))
        sug = pg.locator('.oc-cunao-msg.is-cunao').last.locator('a', has_text='Sugerir')
        check(sug.count() == 1 and '/colabora/?texto=' in (sug.get_attribute('href') or ''), f'{w}px «Sugerir» lleva a Colabora con la pregunta')
        check(len(set(datos)) == len(datos), f'{w}px ningún trozo se pide dos veces ({len(datos)} peticiones: {", ".join(sorted(set(u.split("/data/")[1] for u in datos)))})')
        desb = pg.evaluate("(() => { const c = document.querySelector('[data-cunao-chat]'); return [c.scrollWidth - c.clientWidth, document.documentElement.scrollWidth - innerWidth]; })()")
        check(desb[0] <= 0 and desb[1] <= 0, f'{w}px sin desbordes (chat {desb[0]}, página {desb[1]})')
        if CAPT: pg.screenshot(path=os.path.join(CAPT, f'cunao-{w}.png'), scale='css')
        pg.keyboard.press('Escape'); pg.wait_for_timeout(350)
        check(pg.evaluate("document.querySelector('[data-cunao-hoja]').hidden"), f'{w}px Esc cierra')
        check(not errores, f'{w}px sin errores de consola' + (': ' + ' | '.join(errores[:3]) if errores else ''))
        pg.close(); ctx.close()
    b.close()
print(f'{sum(ok)}/{len(ok)} comprobaciones')
sys.exit(0 if all(ok) else 1)
