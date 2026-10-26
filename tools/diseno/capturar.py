# Ocho Capitales · capturas de diseño (antes / después) a 390 y 1440 px, en claro y oscuro, con los errores de consola.
# Uso: python -I capturar.py <carpeta-salida> [base_url] [pagina ...]
#   base_url por defecto http://localhost:8091 · sin páginas = todas las de la auditoría.
import os, sys, json
os.environ.setdefault('PLAYWRIGHT_BROWSERS_PATH', r'C:\Users\pablo\Herramientas-IA\ms-playwright')
from playwright.sync_api import sync_playwright

PAGINAS = {
    'hermandad-esperanza': '/hermandad/esperanza-malaga/',
    'hermandad-sin-foto': '/hermandad/bellavista-sevilla/',
    'noticias': '/noticias/',
    'calendario': '/calendario/',
    'marchas': '/marchas/',
    'marcha': '/marcha/15-anos-marco-antonio-sanchez-garcia/',
    'bandas': '/bandas/',
    'banda': '/banda/agrupacion-musical-cristo-de-gracia/',
    'imagineros': '/imagineros/',
    'imaginero': '/imaginero/alfonso-berraquero/',
    'buscar': '/buscar/',
    'favoritos': '/favoritos/',
    'colabora': '/colabora/',
    'acerca': '/acerca/',
    '404': '/no-existe-esta-pagina/',
}
out = sys.argv[1]
base = sys.argv[2] if len(sys.argv) > 2 and sys.argv[2].startswith('http') else 'http://localhost:8091'
elegidas = [a for a in sys.argv[2:] if not a.startswith('http')] or list(PAGINAS)
os.makedirs(out, exist_ok=True)
informe = {}
with sync_playwright() as p:
    b = p.chromium.launch()
    for ancho, alto, movil in ((390, 844, True), (1440, 900, False)):
        for esquema in ('light', 'dark'):
            ctx = b.new_context(viewport={'width': ancho, 'height': alto}, color_scheme=esquema, device_scale_factor=1, is_mobile=movil, has_touch=movil)
            for nombre in elegidas:
                pg = ctx.new_page(); errores = []
                pg.on('console', lambda m, e=errores: e.append(m.text) if m.type == 'error' else None)
                pg.on('pageerror', lambda x, e=errores: e.append(str(x)))
                pg.goto(base + PAGINAS[nombre], wait_until='networkidle')
                pg.wait_for_timeout(700)
                # que las entradas al hacer scroll no dejen la captura a medias
                pg.evaluate("document.documentElement.style.scrollBehavior='auto'; window.scrollTo(0, document.body.scrollHeight); ")
                pg.wait_for_timeout(300); pg.evaluate('window.scrollTo(0,0)'); pg.wait_for_timeout(300)
                f = os.path.join(out, f'{nombre}-{ancho}-{"claro" if esquema == "light" else "oscuro"}.png')
                pg.screenshot(path=f, full_page=True)
                informe[f'{nombre}-{ancho}-{esquema}'] = {'errores': errores, 'alto': pg.evaluate('document.documentElement.scrollHeight'), 'desborde': pg.evaluate('document.documentElement.scrollWidth > window.innerWidth')}
                pg.close()
            ctx.close()
    b.close()
json.dump(informe, open(os.path.join(out, 'informe.json'), 'w', encoding='utf8'), ensure_ascii=False, indent=1)
for k, v in informe.items():
    if v['errores'] or v['desborde']: print(k, v)
print(len(informe), 'capturas en', out)
