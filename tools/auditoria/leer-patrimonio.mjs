// Ocho Capitales · auditoría: lee las fichas «bd-marcha-N» de patrimoniomusical.com (título, autor, año, dedicatoria,
// ubicación) para CONTRASTAR las marchas del portal. Uso interno de verificación: el resultado queda en
// auditoria/patrimonio-marchas.json (fuera de git) y no se publica (la web prohíbe reproducir sus contenidos).
// Reanudable; una petición cada 1,5 s. Uso: node tools/auditoria/leer-patrimonio.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = path.join(RAIZ, 'auditoria', 'patrimonio-marchas.json');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const dec = (s) => s.replace(/&#(\d+);/g, (m, n) => String.fromCodePoint(+n)).replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&nbsp;/g, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
let db = {}; try { db = JSON.parse(fs.readFileSync(OUT, 'utf8')); } catch (e) { db = {}; }
const guardar = () => fs.writeFileSync(OUT, JSON.stringify(db));
let vacios = 0;
const DESDE = +(process.env.DESDE || 1), HASTA = +(process.env.HASTA || 20000);
for (let id = DESDE; id < HASTA && vacios < 150; id++) {
  if (db[id] !== undefined) { vacios = db[id] ? 0 : vacios + 1; continue; }
  let html = '';
  for (let k = 0; k < 3 && !html; k++) {
    try { const r = await fetch(`https://www.patrimoniomusical.com/bd-marcha-${id}`, { headers: { 'User-Agent': 'OchoCapitales-auditoria/1.0 (verificación de datos, sin reproducción)' } }); html = await r.text(); if (r.url.includes('inexistente')) html = 'X'; }
    catch (e) { await sleep(5000); }
  }
  if (!html || html === 'X' || /La página solicitada no existe/.test(html)) { db[id] = null; vacios++; }
  else {
    const f = {};
    for (const mm of html.matchAll(/class="bd_etiqueta">([\s\S]*?)<\/div>\s*<div class="bd_celda[^"]*">([\s\S]*?)<\/div>/g)) f[dec(mm[1].replace(/&ntilde;/g, 'ñ').replace(/&oacute;/g, 'ó').replace(/&aacute;/g, 'á'))] = dec(mm[2].replace(/&ntilde;/g, 'ñ').replace(/&([aeiou])acute;/g, (x, v) => ({ a: 'á', e: 'é', i: 'í', o: 'ó', u: 'ú' })[v]));
    const tit = /class="bd_titulo">([^<]*)</.exec(html);
    db[id] = { t: tit ? dec(tit[1]) : '', a: f['Autor'] || '', y: f['Año composición'] || '', d: f['Dedicatoria'] || '', u: f['Ubicación Geográfica'] || '' };
    vacios = 0;
  }
  if (id % 50 === 0) { guardar(); console.log(id, Object.values(db).filter(Boolean).length, 'fichas'); }
  await sleep(1500);
}
guardar();
console.log('fin', Object.values(db).filter(Boolean).length, 'fichas');
