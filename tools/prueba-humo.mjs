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
    ['Buscar', 'buscar/?q=esperanza'], ['Plano de Málaga', 'en-la-calle/malaga/']].filter(([, r]) => r !== null);
  for (const ancho of [390, 1440]) {
    const ctx = await navegador.newContext({ viewport: { width: ancho, height: ancho < 768 ? 844 : 900 }, serviceWorkers: 'block' });
    for (const [nombre, dir] of PAGINAS) {
      const p = await ctx.newPage(); const errores = [];
      p.on('pageerror', (e) => errores.push('JS: ' + String(e.message || e).slice(0, 160)));
      p.on('console', (m) => { if (m.type() !== 'error') return; const u = m.location().url || ''; if (u && !u.startsWith(origen)) return; errores.push('consola: ' + m.text().slice(0, 160)); });
      p.on('requestfailed', (r) => { if (r.url().startsWith(origen) && !/net::ERR_ABORTED/.test(r.failure()?.errorText || '')) errores.push('recurso: ' + r.url().replace(origen, '') + ' ' + r.failure()?.errorText); });
      let estado = 0;
      try { const r = await p.goto(BASE + dir, { waitUntil: 'load', timeout: 45000 }); estado = r ? r.status() : 0; await p.waitForTimeout(1200); }
      catch (e) { errores.push('no carga: ' + String(e.message).slice(0, 120)); }
      if (estado && estado !== 200) errores.push('estado HTTP ' + estado);
      const desborda = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth).catch(() => 0);
      if (desborda > 1) errores.push(`se sale ${desborda}px por los lados`);
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
