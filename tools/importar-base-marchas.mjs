// Ocho Capitales: base de datos COMPLETA de marchas procesionales de España a partir de las cuatro tablas de
// «Marchas de Procesión» (https://www.marchasdeprocesion.com/p/base-de-datos.html): bandas de música, cornetas y tambores,
// agrupaciones musicales y capillas musicales. De la tabla salen título, compositor, formación y vídeo; la ficha de la descripción
// del vídeo (año, dedicatoria, tipo, banda que la estrenó, ubicación) se lee de YouTube cuando está rellena.
// Resultado: tools/sources/marchas-espana.json (mismo formato que el importador antiguo). Se puede relanzar y parar: guarda el avance
// cada 100 fichas y no repite las ya leídas.
// Uso: node tools/importar-base-marchas.mjs [--max N]   (N = fichas a leer en esta pasada; por defecto todas)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(DIR, 'sources', 'marchas-espana.json');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36';
const HDR = { 'User-Agent': UA, 'Accept-Language': 'es-ES,es;q=0.9', Cookie: 'CONSENT=YES+1; SOCS=CAI' };
const TABLAS = [
  ['bandas-musica', 'Banda de música'],
  ['cornetas-tambores', 'Banda de cornetas y tambores'],
  ['agrupaciones-musicales', 'Agrupación musical'],
  ['capilla-musical', 'Capilla musical'],
];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const iMax = process.argv.indexOf('--max');
const MAX = iMax >= 0 ? +process.argv[iMax + 1] : Infinity;
// Ritmo suave: YouTube devuelve 429 si se va deprisa (probado: 3 hilos a 250 ms bloquean enseguida)
const HILOS = +(process.env.HILOS || 1), PAUSA = +(process.env.PAUSA || 1000);
const dec = (s) => s.replace(/&#x([0-9a-f]+);/gi, (m, n) => String.fromCodePoint(parseInt(n, 16))).replace(/&#(\d+);/g, (m, n) => String.fromCodePoint(+n)).replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

async function tabla(slug, formacion) {
  const h = await (await fetch(`https://www.marchasdeprocesion.com/p/base-datos-${slug}.html`, { headers: HDR })).text();
  const out = [];
  for (const m of h.matchAll(/<a class="red" href="https:\/\/www\.youtube\.com\/watch\?v=([\w-]{11})[^"]*"[^>]*>([\s\S]*?)<\/a>/g)) {
    const t = dec(m[2].replace(/<[^>]+>/g, ''));
    const i = t.lastIndexOf(' - ');
    out.push({ titulo: i > 0 ? t.slice(0, i).trim() : t, autor: i > 0 ? t.slice(i + 3).trim() : '', formacion, video: m[1] });
  }
  return out;
}

async function ficha(id) {
  const h = await (await fetch(`https://www.youtube.com/watch?v=${id}&hl=es`, { headers: HDR })).text();
  const m = h.match(/"shortDescription":"((?:[^"\\]|\\.)*)"/);
  if (!m) throw new Error('sin descripción');
  const d = JSON.parse('"' + m[1] + '"');
  const campo = (n) => { const x = d.match(new RegExp(n + ':\\s*([^\\n]*)')); const v = x ? x[1].trim() : ''; return v === '-' ? '' : v; };
  const det = campo('MÁS DETALLES');
  return {
    autoria: campo('AUTORÍA'),
    anio: (campo('AÑO DE COMPOSICIÓN').match(/\d{4}/) || [''])[0],
    dedicatoria: campo('DEDICATORIA'),
    tipo: campo('TIPO'),
    estreno: campo('BANDA QUE LA ESTRENÓ'),
    lugar: campo('UBICACIÓN GEOGRÁFICA'),
    detalles: /^Si puedes aportar/i.test(det) ? '' : det,
  };
}

let prev = { marchas: [] };
try { prev = JSON.parse(fs.readFileSync(OUT, 'utf8')); } catch (e) { /* primera vez */ }
const hechas = new Map(prev.marchas.map((m) => [m.video, m]));
const marchas = [];
const vistos = new Set();
for (const [slug, formacion] of TABLAS) {
  const filas = await tabla(slug, formacion);
  console.log(formacion, filas.length, 'filas');
  for (const f of filas) {
    if (vistos.has(f.video)) continue;
    vistos.add(f.video);
    const p = hechas.get(f.video);
    marchas.push(p ? { ...p, titulo: f.titulo || p.titulo, autor: f.autor || p.autor, formacion } : { ...f, leida: false, anio: '', dedicatoria: '', tipo: '', estreno: '', lugar: '', detalles: '' });
  }
}
// Lo que ya teníamos del catálogo de «más populares» y no sale en las tablas (novedades posteriores a su fecha) se conserva.
for (const p of prev.marchas) if (!vistos.has(p.video)) { vistos.add(p.video); marchas.push(p); }
console.log('en la base de datos:', marchas.length, '· ya leídas:', marchas.filter((m) => m.leida).length);

const guardar = () => fs.writeFileSync(OUT, JSON.stringify({ generado: new Date().toISOString().slice(0, 10), fuente: 'Marchas de Procesión (marchasdeprocesion.com), bases de datos de bandas de música, cornetas y tambores, agrupaciones musicales y capillas musicales de España', url: 'https://www.marchasdeprocesion.com/p/base-de-datos.html', marchas }, null, 1));
const pend = marchas.filter((m) => !m.leida).slice(0, MAX);
let n = 0, fallos = 0;
const cola = pend.slice();
async function obrero() {
  while (cola.length && fallos < 25) {
    const m = cola.shift();
    try {
      const f = await ficha(m.video);
      Object.assign(m, { leida: true, anio: f.anio, dedicatoria: f.dedicatoria, tipo: f.tipo, estreno: f.estreno, lugar: f.lugar, detalles: f.detalles });
      if (!m.autor && f.autoria) m.autor = f.autoria;
      fallos = Math.max(0, fallos - 1);
    } catch (e) { fallos++; await sleep(/429|sin descripción/.test(String(e.message)) ? 20000 : 3000); }
    if (++n % 100 === 0) { guardar(); console.log(n, '/', pend.length, 'leídas; con año', marchas.filter((x) => x.anio).length, '· fallos', fallos); }
    await sleep(PAUSA);
  }
}
await Promise.all(Array.from({ length: HILOS }, () => obrero()));
guardar();
const con = (k) => marchas.filter((m) => m[k]).length;
console.log(`${marchas.length} marchas; leídas ${con('leida')}; con año ${con('anio')}, dedicatoria ${con('dedicatoria')}, tipo ${con('tipo')}${fallos >= 25 ? ' · PARADO por fallos seguidos (YouTube limita); relanzar más tarde' : ''}`);
