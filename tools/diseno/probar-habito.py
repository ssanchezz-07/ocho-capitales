# Ocho Capitales · prueba de los colores del hábito en la ficha de hermandad (oc-diseno): mayúscula inicial y concordancia, a 390 y 1440 px, en claro y oscuro.
# Uso: python -I probar-habito.py [base_url]
import os, re, sys
os.environ.setdefault('PLAYWRIGHT_BROWSERS_PATH', os.path.expandvars(r'%LOCALAPPDATA%\ms-playwright'))
from playwright.sync_api import sync_playwright
BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8091'
# Las tres últimas mezclaban «negro» y «negra» en la misma prenda: no deben repetir chip
FICHAS = ['/hermandad/nazareno-de-santa-maria-cadiz/', '/hermandad/amor-malaga/', '/hermandad/dulce-nombre-malaga/', '/hermandad/fusionadas-malaga/', '/hermandad/traslado-malaga/']
FEM = ('Túnica', 'Sotana', 'Capa', 'Botonadura', 'Botonera', 'Faja', 'Correa')
# Lo que dice el texto de cada ficha, sección por sección (antes se leía mal: «Capa roja» era la cruz de la capa)
ESPERADO = {'/hermandad/nazareno-de-santa-maria-cadiz/': [['Sección del Señor', 'Túnica morada', 'Antifaz morado', 'Capa blanca', 'Cíngulo amarillo'], ['Sección de la Virgen', 'Túnica guinda', 'Antifaz negro', 'Capa negra', 'Cíngulo amarillo']], '/hermandad/amor-malaga/': [['Túnica negra', 'Capirote negro']], '/hermandad/fusionadas-malaga/': [['Azotes y Columna', 'Túnica morada', 'Capirote blanco', 'Cinturón de esparto'], ['Exaltación', 'Túnica negra', 'Capirote rojo', 'Cinturón de esparto'], ['Ánimas de Ciegos', 'Túnica negra', 'Capirote negro', 'Cinturón de esparto'], ['Mayor Dolor', 'Túnica azul', 'Capirote azul', 'Cinturón de esparto']]}
ok = []
def check(c, t): ok.append(bool(c)); print(('OK   ' if c else 'FALLO') + ' ' + t)
with sync_playwright() as p:
    b = p.chromium.launch()
    for w, h, mv in ((390, 844, True), (1440, 900, False)):
        for esq in ('light', 'dark'):
            ctx = b.new_context(viewport={'width': w, 'height': h}, color_scheme=esq, is_mobile=mv, has_touch=mv)
            tag = f'{w}px {esq}'
            for ruta in FICHAS:
                pg = ctx.new_page(); err = []
                pg.on('pageerror', lambda x: err.append(str(x)))
                pg.goto(BASE + ruta, wait_until='networkidle'); pg.wait_for_timeout(300)
                et = [t.strip() for t in pg.locator('.oc-swatches li span').all_inner_texts()]
                check(et and all(re.match(r'^[A-ZÁÉÍÓÚÑÜ]', t) for t in et), f'{tag} {ruta} empiezan en mayúscula {et[:3]}')
                mal = [t for t in et if (t.startswith(FEM) and re.search(r'(negr|blanc|morad|roj|amarill|dorad)o$', t)) or (not t.startswith(FEM) and re.search(r'(negr|blanc|morad|roj|amarill|dorad)a$', t))]
                check(not mal, f'{tag} {ruta} concuerdan con la prenda {mal}')
                secs = pg.evaluate("[...document.querySelectorAll('.oc-habito-sec')].map(s => [...s.querySelectorAll('.oc-habito-sec-t, .oc-swatches span')].map(e => e.textContent.trim()))")
                if ruta in ESPERADO: check(secs == ESPERADO[ruta], f'{tag} {ruta} colores por sección como el texto {secs}')
                check(all(len(x) == len(set(x)) for x in secs), f'{tag} {ruta} sin chips repetidos')
                check(pg.evaluate('document.documentElement.scrollWidth - innerWidth') <= 0, f'{tag} {ruta} sin desbordamiento')
                check(not err, f'{tag} {ruta} sin errores' + ('' if not err else ': ' + err[0]))
                pg.close()
            ctx.close()
    b.close()
print(f'{sum(ok)}/{len(ok)} comprobaciones')
