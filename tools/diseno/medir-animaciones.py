# Mide la fluidez de las animaciones en un móvil lento simulado (CPU ×6, 390×844, táctil) con Playwright + Chrome DevTools.
# Para cada página: fotogramas durante la carga (2 s) y durante un scroll largo, fotogramas perdidos (> 25 ms),
# tareas largas (> 50 ms) y cuánto tarda en quedarse quieta la cabecera. Uso: python -I medir-animaciones.py <salida.json> [base_url]
import os, sys, json
sys.stdout.reconfigure(encoding='utf-8')
os.environ.setdefault('PLAYWRIGHT_BROWSERS_PATH', r'C:\Users\pablo\Herramientas-IA\ms-playwright')
from playwright.sync_api import sync_playwright
out = sys.argv[1]; base = sys.argv[2] if len(sys.argv) > 2 else 'http://localhost:8091'
PAGINAS = {'noticias': '/noticias/', 'hermandad': '/hermandad/esperanza-malaga/', 'marchas': '/marchas/', 'calendario': '/calendario/'}
SONDA = """(() => { window.__f = []; window.__lt = []; let t0 = performance.now();
  const paso = (t) => { window.__f.push(t); if (t - t0 < 60000) requestAnimationFrame(paso); }; requestAnimationFrame(paso);
  try { new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__lt.push(e.duration))).observe({ type: 'longtask', buffered: true }); } catch (e) {} })()"""
def resumen(fr):
    d = [b - a for a, b in zip(fr, fr[1:])]
    if not d: return {}
    d.sort()
    return {'fotogramas': len(d), 'fps_medio': round(1000 * len(d) / (fr[-1] - fr[0]), 1), 'perdidos_25ms': sum(1 for x in d if x > 25), 'p95_ms': round(d[int(len(d) * .95) - 1], 1), 'peor_ms': round(d[-1], 1)}
res = {}
with sync_playwright() as p:
    b = p.chromium.launch()
    for nombre, ruta in PAGINAS.items():
        ctx = b.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True, device_scale_factor=2)
        pg = ctx.new_page(); cdp = ctx.new_cdp_session(pg)
        cdp.send('Emulation.setCPUThrottlingRate', {'rate': 6})
        pg.add_init_script(SONDA)
        pg.goto(base + ruta, wait_until='domcontentloaded')
        pg.wait_for_timeout(2000)
        carga = pg.evaluate('window.__f.slice()')
        lt_carga = pg.evaluate('window.__lt.slice()')
        pg.evaluate('window.__f.length = 0; window.__lt.length = 0')
        # scroll largo con la rueda (como un dedo rápido): 24 pasos de 300 px
        for _ in range(24): pg.mouse.wheel(0, 300); pg.wait_for_timeout(60)
        pg.wait_for_timeout(600)
        scroll = pg.evaluate('window.__f.slice()'); lt_scroll = pg.evaluate('window.__lt.slice()')
        res[nombre] = {'carga': resumen(carga), 'tareas_largas_carga': len(lt_carga), 'ms_tareas_largas_carga': round(sum(lt_carga)), 'scroll': resumen(scroll), 'tareas_largas_scroll': len(lt_scroll)}
        print(nombre, json.dumps(res[nombre], ensure_ascii=False))
        ctx.close()
    b.close()
json.dump(res, open(out, 'w', encoding='utf8'), ensure_ascii=False, indent=1)
