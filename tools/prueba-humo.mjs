// Ocho Capitales · red de seguridad: prueba de humo con un navegador de verdad (Playwright, Chromium).
// Abre portada, Hoy, Noticias, una hermandad, una marcha, Buscar y el plano de Málaga a 390 y 1440 px y falla (código 1) si
// una página no responde 200, si hay errores de JavaScript o de recursos de la propia web, o si algo se sale por los lados.
// Los fallos de sitios ajenos (fotos de los medios, por ejemplo) no cuentan: no dependen de nosotros.
// Uso: node tools/prueba-humo.mjs <dirección base, p. ej. http://localhost:8080/ o https://ocho-capitales.pages.dev/>
// Playwright: el del proyecto o el de la carpeta PLAYWRIGHT_DIR (en GitHub Actions se instala aparte, sin tocar package.json).
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const BASE = (process.argv[2] || 'http://localhost:8080/').replace(/\/?$/, '/');
const require = createRequire(import.meta.url);
const ruta = require.resolve('playwright', { paths: [process.env.PLAYWRIGHT_DIR, process.cwd()].filter(Boolean) });
const PW = await import(pathToFileURL(ruta).href);
const { chromium } = PW.chromium ? PW : PW.default;

const origen = new URL(BASE).origin;
const fallos = [];
// NAVEGADOR: ruta a un Chrome ya instalado (para probar en local sin descargar Chromium)
const navegador = await chromium.launch(process.env.NAVEGADOR ? { executablePath: process.env.NAVEGADOR } : {});
try {
  // una hermandad y una marcha cualesquiera, sacadas de sus listados (así la prueba no depende de un nombre concreto)
  const primera = async (listado, tipo) => {
    const p = await navegador.newPage();
    try { await p.goto(BASE + listado, { waitUntil: 'domcontentloaded', timeout: 45000 }); return (await p.$$eval('a[href*="/' + tipo + '/"]', (as) => as.map((a) => a.pathname))).find((h) => new RegExp('/' + tipo + '/[^/]+/$').test(h)); }
    catch { return null; } finally { await p.close(); }
  };
  const rel = (abs) => abs ? abs.slice(new URL(BASE).pathname.length) : null;
  const herm = rel(await primera('hermandades/', 'hermandad')), marcha = rel(await primera('marchas/', 'marcha'));
  if (!herm) { fallos.push('listado de hermandades'); console.log('::error::No se encuentra ninguna hermandad en hermandades/'); }
  if (!marcha) { fallos.push('listado de marchas'); console.log('::error::No se encuentra ninguna marcha en marchas/'); }
  const PAGINAS = [['Portada', ''], ['Hoy', 'hoy/'], ['Noticias', 'noticias/'], ['Hermandad', herm], ['Marcha', marcha],
    ['Buscar', 'buscar/?q=esperanza'], ['Plano de Málaga', 'en-la-calle/malaga/'], ['Calendario', 'calendario/'], ['Marchas', 'marchas/']].filter(([, r]) => r !== null);
  // Soltura en móvil (390 px, procesador 4 veces más lento): que la página no se quede pillada ni se coma los toques.
  // Límites holgados para que el ruido de la máquina de GitHub no dé falsos fallos; lo que los pasa se nota en un móvil de verdad.
  const LIM = { lcp: 5000, tarea: 2000, toque: 4000, filtro: 10000 };
  const soltura = async (p, nombre) => {
    const e = [];
    const m = await p.evaluate(() => new Promise((ok) => {
      let lcp = 0, tarea = 0;
      try { new PerformanceObserver((l) => { for (const x of l.getEntries()) lcp = Math.max(lcp, x.startTime); }).observe({ type: 'largest-contentful-paint', buffered: true }); } catch { }
      try { new PerformanceObserver((l) => { for (const x of l.getEntries()) tarea = Math.max(tarea, x.duration); }).observe({ type: 'longtask', buffered: true }); } catch { }
      setTimeout(() => ok({ lcp: Math.round(lcp), tarea: Math.round(tarea) }), 300);
    })).catch(() => ({ lcp: 0, tarea: 0 }));
    if (m.lcp > LIM.lcp) e.push(`tarda en pintarse: LCP ${m.lcp} ms (límite ${LIM.lcp})`);
    if (m.tarea > LIM.tarea) e.push(`se queda pillada ${m.tarea} ms seguidos al cargar (límite ${LIM.tarea})`);
    // un toque en la barra de abajo tiene que llevar a otra página: si algo la tapa o el móvil no responde, falla
    const destino = await p.$$eval('.oc-tabbar a[href]', (as) => { const a = as.find((x) => !x.getAttribute('aria-current') && x.getBoundingClientRect().height > 0); return a ? a.href : null; }).catch(() => null);
    if (destino) {
      const t = Date.now();
      await p.locator(`.oc-tabbar a[href="${new URL(destino).pathname}"]`).first().click({ timeout: LIM.toque, noWaitAfter: true }).catch(() => e.push('la barra de abajo no se puede tocar (algo la tapa)'));
      await p.waitForURL((u) => u.href === destino, { timeout: LIM.toque, waitUntil: 'commit' }).then(() => { if (Date.now() - t > LIM.toque) e.push('el toque tarda ' + (Date.now() - t) + ' ms'); }).catch(() => e.push(`un toque en la barra de abajo no lleva a ${new URL(destino).pathname} en ${LIM.toque} ms`));
      // se espera a que cargue la página de destino: cerrar la pestaña a media carga deja colgado al navegador de pruebas
      await p.waitForLoadState('load', { timeout: 45000 }).catch(() => {});
    }
    // Marchas: elegir una capital tiene que dar resultados (descarga la lista completa)
    if (nombre === 'Marchas') {
      await p.goBack({ waitUntil: 'load' }).catch(() => {});
      const total = await p.locator('[data-dir-count]').first().textContent().catch(() => ''), t = Date.now();
      await p.locator('[data-filtro-ciudad]').first().click({ timeout: LIM.toque }).catch(() => e.push('no se puede tocar una capital en Marchas'));
      await p.waitForFunction((antes) => { const x = document.querySelector('[data-dir-count]')?.textContent || ''; return /^\d+ resultados?$/.test(x) && x !== antes; }, total, { timeout: LIM.filtro })
        .catch(() => e.push(`filtrar Marchas por capital no termina en ${LIM.filtro} ms (${Date.now() - t} ms)`));
    }
    return e;
  };
  for (const ancho of [390, 1440]) {
    const ctx = await navegador.newContext({ viewport: { width: ancho, height: ancho < 768 ? 844 : 900 }, serviceWorkers: 'block' });
    // la entrada animada de la portada sale una vez por sesión: aquí se da por vista para medir la web en sí
    await ctx.addInitScript(() => { try { sessionStorage.setItem('oc-entrada', '1'); } catch { } });
    for (const [nombre, dir] of PAGINAS) {
      const p = await ctx.newPage(); const errores = [];
      if (ancho === 390) { const cdp = await ctx.newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 }).catch(() => {}); }
      p.on('pageerror', (e) => errores.push('JS: ' + String(e.message || e).slice(0, 160)));
      // Cloudflare Web Analytics (lo inyecta el borde en el dominio): sus avisos no son fallos de la web
      p.on('console', (m) => { if (m.type() !== 'error') return; const u = m.location().url || ''; if (u && !u.startsWith(origen)) return; if (/cloudflareinsights/i.test(m.text())) return; errores.push('consola: ' + m.text().slice(0, 160)); });
      p.on('requestfailed', (r) => { if (r.url().startsWith(origen) && !/net::ERR_ABORTED/.test(r.failure()?.errorText || '')) errores.push('recurso: ' + r.url().replace(origen, '') + ' ' + r.failure()?.errorText); });
      let estado = 0;
      try { const r = await p.goto(BASE + dir, { waitUntil: 'load', timeout: 45000 }); estado = r ? r.status() : 0; await p.waitForTimeout(1200); }
      catch (e) { errores.push('no carga: ' + String(e.message).slice(0, 120)); }
      if (estado && estado !== 200) errores.push('estado HTTP ' + estado);
      const desborda = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth).catch(() => 0);
      if (desborda > 1) errores.push(`se sale ${desborda}px por los lados`);
      if (ancho === 390 && estado === 200) for (const e of await soltura(p, nombre)) errores.push(e);
      const linea = `${nombre} (/${dir}) a ${ancho}px`;
      if (errores.length) { fallos.push(linea); for (const e of [...new Set(errores)].slice(0, 5)) console.log(`::error::${linea}: ${e}`); }
      else console.log(`✓ ${linea}`);
      await p.close();
    }
    await ctx.close();
  }
} finally { await navegador.close(); }
console.log(fallos.length ? `Prueba de humo: ${fallos.length} fallos en ${BASE}` : `Prueba de humo: todo bien en ${BASE}`);
process.exit(fallos.length ? 1 : 0);
