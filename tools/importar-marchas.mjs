// Ocho Capitales: catálogo de marchas procesionales de España a partir de las listas de reproducción de
// «Marchas de Procesión» (https://www.marchasdeprocesion.com/p/marchas-de-espana.html), una por formación:
// Agrupación Musical [AM], Cornetas y Tambores [CT], Banda de Música [BM] y Capilla Musical [CM].
// De cada vídeo se toma el título («Marcha - Compositor [formación]») y la ficha de su descripción
// (año de composición, dedicatoria, tipo, banda que la estrenó) cuando está rellena; el enlace lleva al vídeo original de YouTube.
// Resultado: tools/sources/marchas-espana.json. Se puede relanzar: conserva lo ya leído (caché por vídeo).
// Uso: node tools/importar-marchas.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(DIR, 'sources', 'marchas-espana.json');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36';
const HDR = { 'User-Agent': UA, 'Accept-Language': 'es-ES,es;q=0.9', Cookie: 'CONSENT=YES+1; SOCS=CAI' };
const LISTAS = [
  ['PLnUDHJz-31cGFxb2huUej4uCnr_w9Kdew', 'Banda de música'],
  ['PLnUDHJz-31cG0LxrW_rxbIEopoRtUq9ID', 'Banda de cornetas y tambores'],
  ['PLnUDHJz-31cFCiwZ8hfirCTty4RMr1kZh', 'Agrupación musical'],
  ['PLnUDHJz-31cGXOQJVp1C_ihqfi0nas1sf', 'Capilla musical'],
];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const FORMACION = { AM: 'Agrupación musical', CT: 'Banda de cornetas y tambores', BM: 'Banda de música', CM: 'Capilla musical' };

async function lista(id) {
  const html = await (await fetch(`https://www.youtube.com/playlist?list=${id}&hl=es&gl=ES`, { headers: HDR })).text();
  const m = html.match(/var ytInitialData = (\{[\s\S]*?\});<\/script>/); if (!m) return [];
  const items = []; let cont = '';
  const walk = (o) => {
    if (!o || typeof o !== 'object') return;
    if (o.lockupViewModel && o.lockupViewModel.contentId) { const md = (o.lockupViewModel.metadata || {}).lockupMetadataViewModel || {}; items.push({ id: o.lockupViewModel.contentId, titulo: (md.title || {}).content || '' }); }
    if (o.continuationCommand && o.continuationCommand.token) cont = o.continuationCommand.token;
    for (const k of Object.keys(o)) walk(o[k]);
  };
  walk(JSON.parse(m[1]));
  const key = (html.match(/"INNERTUBE_API_KEY":"([^"]+)"/) || [])[1]; const ver = (html.match(/"INNERTUBE_CONTEXT_CLIENT_VERSION":"([^"]+)"/) || [])[1];
  for (let g = 0; cont && g < 40; g++) {
    const r = await fetch('https://www.youtube.com/youtubei/v1/browse?key=' + key, { method: 'POST', headers: { 'User-Agent': UA, 'content-type': 'application/json' }, body: JSON.stringify({ context: { client: { clientName: 'WEB', clientVersion: ver, hl: 'es', gl: 'ES' } }, continuation: cont }) });
    cont = ''; walk(await r.json()); await sleep(300);
  }
  return items;
}

async function ficha(id) {
  const h = await (await fetch(`https://www.youtube.com/watch?v=${id}&hl=es`, { headers: HDR })).text();
  const m = h.match(/"shortDescription":"((?:[^"\\]|\\.)*)"/); if (!m) throw new Error('sin descripción (YouTube limita las lecturas)');
  const d = JSON.parse('"' + m[1] + '"');
  const campo = (n) => { const x = d.match(new RegExp(n + ':\\s*([^\\n]*)')); const v = x ? x[1].trim() : ''; return v === '-' ? '' : v; };
  return { anio: (campo('AÑO DE COMPOSICIÓN').match(/\d{4}/) || [''])[0], dedicatoria: campo('DEDICATORIA'), tipo: campo('TIPO'), estreno: campo('BANDA QUE LA ESTRENÓ'), lugar: campo('UBICACIÓN GEOGRÁFICA'), detalles: campo('MÁS DETALLES') };
}

let prev = { marchas: [] }; try { prev = JSON.parse(fs.readFileSync(OUT, 'utf8')); } catch (e) { /* primera vez */ }
const hechas = new Map(prev.marchas.map((m) => [m.video, m]));
const marchas = []; let fallos = 0, bloqueado = false;
for (const [pl, formacionLista] of LISTAS) {
  const items = await lista(pl);
  console.log(formacionLista, items.length);
  for (const it of items) {
    if (marchas.some((x) => x.video === it.id)) continue;
    const t = it.titulo.replace(/\s*\[(AM|CT|BM|CM)\]\s*$/, ''); const tag = (it.titulo.match(/\[(AM|CT|BM|CM)\]\s*$/) || [])[1];
    const i = t.indexOf(' - '); const titulo = i > 0 ? t.slice(0, i).trim() : t; const autor = i > 0 ? t.slice(i + 3).trim() : '';
    let f = hechas.get(it.id); let leida = !!(f && f.leida);
    if (!leida && !bloqueado) { try { f = { ...(await ficha(it.id)) }; leida = true; } catch (e) { f = f || {}; if (++fallos > 6) bloqueado = true; } await sleep(400); }
    f = f || {};
    marchas.push({ titulo, autor, formacion: tag ? FORMACION[tag] : formacionLista, video: it.id, leida, anio: f.anio || '', dedicatoria: f.dedicatoria || '', tipo: f.tipo || '', estreno: f.estreno || '', lugar: f.lugar || '', detalles: f.detalles || '' });
  }
}
fs.writeFileSync(OUT, JSON.stringify({ generado: new Date().toISOString().slice(0, 10), fuente: 'Marchas de Procesión (marchasdeprocesion.com), listas de reproducción de marchas más populares de España', url: 'https://www.marchasdeprocesion.com/p/marchas-de-espana.html', marchas }, null, 1));
const con = (k) => marchas.filter((m) => m[k]).length;
console.log(`${marchas.length} marchas; con año ${con('anio')}, dedicatoria ${con('dedicatoria')}, tipo ${con('tipo')}`);
