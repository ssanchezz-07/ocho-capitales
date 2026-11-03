# Ocho Capitales · el botón de erCuñao no tapa el plano «En la calle»: ni el crédito de OpenStreetMap (obligatorio por la
# licencia ODbL) ni los controles del plano. En las 8 capitales a 390 px (y 1440 px), con el plano en su sitio y bajado hasta
# el borde inferior de la pantalla. Uso: python -I probar-cunao-plano.py [base_url] [carpeta para capturas]
import os, sys
sys.stdout.reconfigure(encoding="utf-8")
os.environ.setdefault('PLAYWRIGHT_BROWSERS_PATH', r'C:\Users\pablo\Herramientas-IA\ms-playwright')
from playwright.sync_api import sync_playwright
BASE = (sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8095').rstrip('/')
CAPT = sys.argv[2] if len(sys.argv) > 2 else ''
CAPITALES = ['almeria', 'cadiz', 'cordoba', 'granada', 'huelva', 'jaen', 'malaga', 'sevilla']
ok = []
def check(c, t): ok.append(bool(c)); print(('OK   ' if c else 'FALLO') + ' ' + t)
# elementos del plano que el botón no puede tapar: el crédito y todo lo que se toca dentro del plano
MIDE = """(() => {
  const b = document.querySelector('.oc-cunao-btn'); if (!b) return { sin: true };
  const r = b.getBoundingClientRect(), vis = getComputedStyle(b).opacity !== '0' && getComputedStyle(b).visibility !== 'hidden' && r.width > 0;
  const choca = (e) => { const q = e.getBoundingClientRect(); if (!q.width || !q.height) return false; const cs = getComputedStyle(e); if (cs.visibility === 'hidden' || cs.display === 'none') return false;
    return q.left < r.right - 2 && q.right > r.left + 2 && q.top < r.bottom - 2 && q.bottom > r.top + 2; };
  const mapa = document.querySelector('.oc-calle-mapa') || document.querySelector('.oc-calle');
  const cosas = [...document.querySelectorAll('.oc-calle-osm, .oc-calle-osm a')].concat(mapa ? [...mapa.querySelectorAll('button, a, input, select, [role=slider], [tabindex]')] : []);
  const tapa = cosas.filter(choca).map((e) => (e.className && e.className.baseVal === undefined ? e.className : e.tagName) + ' «' + (e.getAttribute('aria-label') || e.textContent || '').trim().slice(0, 30) + '»');
  return { vis, tapa, btn: [Math.round(r.left), Math.round(r.top), Math.round(r.width)] };
})()"""
with sync_playwright() as p:
    b = p.chromium.launch()
    for w, h, mv in ((390, 844, True), (1440, 900, False)):
        ctx = b.new_context(viewport={'width': w, 'height': h}, is_mobile=mv, has_touch=mv, locale='es-ES')
        for c in CAPITALES:
            pg = ctx.new_page()
            pg.goto(f'{BASE}/en-la-calle/{c}/', wait_until='networkidle'); pg.wait_for_timeout(700)
            if not pg.evaluate("!!(document.querySelector('.oc-calle-mapa') || document.querySelector('.oc-calle'))"):
                print(f'--   {w}px {c}: sin plano en esta capital (nada que tapar)'); pg.close(); continue
            # barrido: el botón es fijo y el plano se mueve con el scroll; se mira cada 16 px mientras el plano está en pantalla
            tapa, z = set(), {}
            alto = pg.evaluate("document.documentElement.scrollHeight - innerHeight")
            for y in range(0, alto + 16, 16):
                pg.evaluate(f"scrollTo(0, {y})"); pg.wait_for_timeout(60)
                z = pg.evaluate(MIDE)
                if z.get('vis'): tapa.update(z.get('tapa') or [])
            tapa = sorted(tapa); a = z
            check(not a.get('sin') and not tapa, f'{w}px {c}: el botón ({"visible" if z.get("vis") else "oculto"}, {z.get("btn")}) no tapa crédito ni controles' + (': tapa ' + ', '.join(tapa) if tapa else ''))
            if CAPT and c in ('malaga', 'jaen'): pg.screenshot(path=os.path.join(CAPT, f'plano-{c}-{w}.png'))
            pg.close()
        ctx.close()
    b.close()
print(f'{sum(ok)}/{len(ok)} comprobaciones')
sys.exit(0 if all(ok) else 1)
