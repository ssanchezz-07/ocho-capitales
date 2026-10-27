# Ocho Capitales · pasada completa de diseño (oc-diseno, 27-oct): las páginas principales a 390 y 1440 px, en claro y oscuro,
# con movimiento normal y reducido. Comprueba desbordamiento, errores de consola, animaciones que se mueven con movimiento
# reducido y botones o campos por debajo de 24 px; deja capturas de la primera pantalla y de la página entera.
# Uso: python -I pasada-completa.py [base_url] [carpeta_capturas]
import os, sys, json
sys.stdout.reconfigure(encoding='utf-8')
os.environ.setdefault('PLAYWRIGHT_BROWSERS_PATH', r'C:\Users\pablo\Herramientas-IA\ms-playwright')
from playwright.sync_api import sync_playwright
BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8091'
OUT = sys.argv[2] if len(sys.argv) > 2 else 'capturas/diseno/pasada'
os.makedirs(OUT, exist_ok=True)
P = {'portada': '/', 'capital': '/semana-santa/sevilla/', 'hoy': '/hoy/', 'calendario': '/calendario/', 'noticias': '/noticias/',
     'hermandades': '/hermandades/', 'ficha': '/hermandad/el-gran-poder-sevilla/', 'imagineros': '/imagineros/',
     'imaginero': '/imaginero/luis-alvarez-duarte/', 'bandas': '/bandas/', 'banda': '/banda/agrupacion-musical-bentomiz-de-arenas-de-malaga/',
     'marchas': '/marchas/', 'favoritos': '/favoritos/', 'colabora': '/colabora/', 'buscar': '/buscar/', 'capitales': '/capitales/'}
MIDE = """(() => {
  const ov = document.documentElement.scrollWidth - innerWidth;
  const vis = (e) => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && !e.closest('[hidden],.oc-sr,.oc-trampa'); };
  const peq = [...document.querySelectorAll('button, input:not([type=hidden]), select, textarea, [role=button]')].filter(vis)
    .filter((e) => { const r = e.getBoundingClientRect(); return r.width < 24 || r.height < 24; }).map((e) => (e.className || e.tagName) + ' ' + Math.round(e.getBoundingClientRect().width) + 'x' + Math.round(e.getBoundingClientRect().height));
  const mueve = document.getAnimations().filter((a) => a.playState === 'running' && !(a.animationName || '').includes('oc-cab') && a.effect && a.effect.getKeyframes().some((k) => k.transform || k.translate || k.scale || k.rotate)).map((a) => a.animationName || a.constructor.name);
  return { ov, peq: [...new Set(peq)].slice(0, 6), mueve: [...new Set(mueve)].slice(0, 6) };
})()"""
avisos = 0
with sync_playwright() as p:
    b = p.chromium.launch()
    for w, h, mv in ((390, 844, True), (1440, 900, False)):
        for esq in ('light', 'dark'):
            for rm in ('no-preference', 'reduce'):
                ctx = b.new_context(viewport={'width': w, 'height': h}, color_scheme=esq, is_mobile=mv, has_touch=mv, reduced_motion=rm)
                for k, path in P.items():
                    pg = ctx.new_page(); err = []
                    pg.on('console', lambda m, e=err: e.append(m.text[:120]) if m.type == 'error' and 'Failed to load resource' not in m.text else None)
                    pg.on('pageerror', lambda x, e=err: e.append(str(x)[:120]))
                    pg.goto(BASE + path, wait_until='networkidle'); pg.wait_for_timeout(600)
                    r = pg.evaluate(MIDE)
                    problemas = []
                    if r['ov'] > 0: problemas.append(f"desborda {r['ov']} px")
                    if err: problemas.append('errores ' + ' | '.join(err[:2]))
                    if rm == 'reduce' and r['mueve']: problemas.append('se mueve con movimiento reducido: ' + ', '.join(r['mueve']))
                    if r['peq'] and esq == 'light' and rm == 'reduce': problemas.append('pequeños: ' + ', '.join(r['peq']))
                    if problemas: avisos += 1; print(f'AVISO {k} {w} {esq} {rm}: ' + '; '.join(problemas))
                    if rm == 'reduce':
                        pg.screenshot(path=f'{OUT}/{k}-{w}-{esq}.png')
                        if esq == 'dark' or w == 390: pg.screenshot(path=f'{OUT}/{k}-{w}-{esq}-entera.png', full_page=True)
                    pg.close()
                ctx.close()
    b.close()
print(f'{len(P) * 8} vistas revisadas, {avisos} con avisos')
