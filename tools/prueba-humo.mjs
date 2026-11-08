// Ocho Capitales · red de seguridad: prueba de humo con un navegador de verdad (Playwright, Chromium).
// Abre portada, Hoy, Noticias, una hermandad, una marcha, Buscar y el plano de Málaga a 390 y 1440 px y falla (código 1) si
// una página no responde 200, si hay errores de JavaScript o de recursos de la propia web, o si algo se sale por los lados.
// Los fallos de sitios ajenos (fotos de los medios, por ejemplo) no cuentan: no dependen de nosotros.
// Uso: node tools/prueba-humo.mjs <dirección base, p. ej. http://localhost:8080/ o https://ocho-capitales.pages.dev/>
// Playwright: el del proyecto o el de la carpeta PLAYWRIGHT_DIR (en GitHub Actions se instala aparte, sin tocar package.json).
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { pruebaBuscador } from './prueba-buscador.mjs';

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
    const medir = () => p.evaluate(() => new Promise((ok) => {
      let lcp = 0, tarea = 0;
      try { new PerformanceObserver((l) => { for (const x of l.getEntries()) lcp = Math.max(lcp, x.startTime); }).observe({ type: 'largest-contentful-paint', buffered: true }); } catch { }
      try { new PerformanceObserver((l) => { for (const x of l.getEntries()) tarea = Math.max(tarea, x.duration); }).observe({ type: 'longtask', buffered: true }); } catch { }
      setTimeout(() => ok({ lcp: Math.round(lcp), tarea: Math.round(tarea) }), 300);
    })).catch(() => ({ lcp: 0, tarea: 0 }));
    let m = await medir();
    // La primera carga de un navegador recién abierto compila todo el código y puede dar un pico suelto (medido: 1,4 s frente
    // a 0,2 s en las siguientes), y la máquina de GitHub tiene ruido. Si se pasa, se carga otra vez y solo falla si se repite.
    if (m.lcp > LIM.lcp || m.tarea > LIM.tarea) { await p.reload({ waitUntil: 'load', timeout: 45000 }).catch(() => {}); await p.waitForTimeout(1200); const m2 = await medir(); m = { lcp: Math.min(m.lcp, m2.lcp), tarea: Math.min(m.tarea, m2.tarea) }; }
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
      if (destino) await p.goBack({ waitUntil: 'load' }).catch(() => {}); // solo si el toque de antes llevó a otra página
      const total = await p.locator('[data-dir-count]').first().textContent().catch(() => ''), t = Date.now();
      await p.locator('[data-filtro-ciudad]').first().click({ timeout: LIM.toque }).catch(() => e.push('no se puede tocar una capital en Marchas'));
      // se mira cada 200 ms (waitForFunction no vale: la CSP de la web, bien puesta, no deja evaluar texto como código)
      let listo = false;
      while (!listo && Date.now() - t < LIM.filtro) {
        const x = await p.locator('[data-dir-count]').first().textContent().catch(() => '');
        listo = /^\d+ resultados?$/.test(x || '') && x !== total;
        if (!listo) await p.waitForTimeout(200);
      }
      if (!listo) e.push(`filtrar Marchas por capital no termina en ${LIM.filtro} ms`);
    }
    return e;
  };
  // erCuñao: abrir la hoja, preguntar y leer SOLO el texto de la respuesta (sin los botones de sugerencia, que también dicen «sale»)
  async function pruebaCunao(p) {
    const err = [];
    const pregunta = async (q) => {
      const n0 = await p.evaluate(() => document.querySelectorAll('.oc-cunao-msg.is-cunao').length);
      await p.fill('[data-cunao-q]', q); await p.press('[data-cunao-q]', 'Enter');
      await p.waitForFunction((n) => { const l = document.querySelectorAll('.oc-cunao-msg.is-cunao:not(.is-pensando)'); return l.length > n && !document.querySelector('.oc-cunao-msg.is-pensando'); }, n0, { timeout: 15000 });
      return p.evaluate(() => [...document.querySelectorAll('.oc-cunao-msg.is-cunao')].pop().querySelector('p').textContent);
    };
    try {
      await p.click('[data-cunao]');
      const t = await pregunta('¿A qué hora sale la Macarena de Sevilla?');
      if (!/Macarena.*\bsale\b.*\d{1,2}:\d{2}/.test(t)) err.push('erCuñao no contesta bien: ' + t.slice(0, 100));
      // maquetación a 360 px: horas («15:15»), años y palabras enteras; solo se puede partir lo que no cabe ni en una línea
      await p.setViewportSize({ width: 360, height: 780 });
      for (const q of ['¿Por dónde pasa la Pasión de Málaga?', '¿Por dónde pasa la Crucifixión de Málaga?', '¿Quién talló los Negritos de Sevilla?', '¿Qué banda lleva el Cautivo de Málaga?', '¿Cuál es la web de Divino Maestro de Jaén?']) {
        await pregunta(q);
        const rotas = await p.evaluate(() => {
          const out = [], b = [...document.querySelectorAll('.oc-cunao-msg.is-cunao')].pop();
          b.querySelectorAll('.oc-cunao-lista a, .oc-cunao-lista b, .oc-cunao-lista span, p, .oc-cunao-link, .oc-cunao-chips button').forEach((el) => {
            const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let nd;
            while ((nd = w.nextNode())) for (const m of nd.textContent.matchAll(/[^\s\-–]+/g)) { // por un guion sí se puede partir («Gutiérrez-Reyes»)
              const r = document.createRange(); r.setStart(nd, m.index); r.setEnd(nd, m.index + m[0].length);
              const rs = [...r.getClientRects()].filter((x) => x.width > 0), tops = new Set(rs.map((x) => Math.round(x.top)));
              // solo es un fallo si la palabra entera cabía en su caja (una web más larga que la línea sí se tiene que partir)
              const cs = getComputedStyle(b), caja = b.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - 32, larga = rs.reduce((a, x) => a + x.width, 0);
              if (tops.size > 1 && larga < caja - 1) out.push(m[0]);
            }
            const e = el.getBoundingClientRect(), c = b.getBoundingClientRect(); if (e.right > c.right + 1) out.push('se sale: ' + el.textContent.slice(0, 30));
          });
          return out;
        });
        if (rotas.length) err.push('a 360 px se parten en dos líneas (' + q + '): ' + [...new Set(rotas)].slice(0, 6).join(' | '));
        const lateral = await p.evaluate(() => { const c = document.querySelector('[data-cunao-chat]'); return c.scrollWidth - c.clientWidth; });
        if (lateral > 1) err.push('a 360 px el chat se desplaza ' + lateral + ' px en horizontal (' + q + ')');
      }
      await p.setViewportSize({ width: 390, height: 844 });
    } catch (e) { err.push('erCuñao no se abre o no contesta: ' + String(e.message || e).slice(0, 100)); }
    return err;
  }
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
      // el filtro de Marchas, con una batería de búsquedas reales (tools/prueba-buscador.mjs); a 1440 px, que va más deprisa
      if (ancho === 1440 && nombre === 'Marchas' && estado === 200) for (const e of await pruebaBuscador(p, BASE)) errores.push(e);
      // erCuñao (en la primera página de la lista, a 390 px; después de la prueba de soltura): se abre, contesta de verdad y, a 360 px,
      // ninguna hora ni palabra se parte en dos líneas y nada se sale (una web larga se parte dentro de su botón)
      if (ancho === 390 && nombre === 'Portada' && estado === 200) for (const e of await pruebaCunao(p)) errores.push(e);
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
