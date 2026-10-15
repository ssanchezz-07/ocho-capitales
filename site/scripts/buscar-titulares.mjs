// Ocho Capitales: busca en Wikimedia Commons una foto del Cristo (o, si no hay, de la Virgen) de cada hermandad
// que no tiene foto propia o solo tiene escudo. Criterio de Pablo (2026-10-15): «imagen del Cristo si hay; si no, la Virgen».
// Solo propone: exige licencia libre, que el texto del archivo nombre la ciudad y la advocación concreta,
// y descarta cuadros, museos y archivos de otros pueblos. Las candidatas se revisan a ojo (hoja de contactos)
// y solo las aprobadas pasan a data/imagenes-titulares.json.
// Uso: cd site/scripts && node buscar-titulares.mjs [--hoja]   → data/titulares-candidatas.json y cache/titulares-N.png
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { createHash } from 'node:crypto';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.join(DIR, '..');
const D = JSON.parse(fs.readFileSync(path.join(SITE, '..', 'portal-cofrade', 'data', 'portal.json'), 'utf8'));
const IMGX = JSON.parse(fs.readFileSync(path.join(SITE, 'data', 'imagenes.json'), 'utf8'));
const OUT = path.join(SITE, 'data', 'titulares-candidatas.json');
const CACHE = path.join(DIR, 'cache', 'titulares');
fs.mkdirSync(CACHE, { recursive: true });
const UA = 'OchoCapitales/1.0 (https://github.com/ssanchezz-07/ocho-capitales; portal cofrade sin animo de lucro)';
const API = 'https://commons.wikimedia.org/w/api.php';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const strip = (s) => String(s || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const FREE = /^(cc0|cc[ -]by(-sa)?( \d\.\d)?|public domain|pd\b|attribution)/i;
const CAP = Object.fromEntries(D.capitales.map((c) => [c.slug, c]));
// Palabras que no distinguen una advocación de otra
const GEN = new Set(['santisimo', 'santisima', 'cristo', 'nuestro', 'nuestra', 'padre', 'jesus', 'maria', 'senor', 'senora', 'virgen', 'madre', 'de', 'la', 'el', 'los', 'las', 'del', 'y', 'e', 'en', 'su', 'sus', 'san', 'santo', 'santa', 'real', 'divino', 'dulce', 'nombre']);
const ES_CRISTO = (t) => /\b(cristo|jesus|padre|senor(?! *de los)|nazareno|ecce|cautivo|crucificado|yacente|resucitado|santo entierro|cena|misterio|sentencia|prendimiento|lanzada|entrada)\b/.test(norm(t)) && !/\b(nuestra senora|maria|virgen)\b/.test(norm(t));
const ES_VIRGEN = (t) => /\b(maria|virgen|nuestra senora|madre de dios)\b/.test(norm(t));

async function api(params, tries = 4) {
  const url = API + '?' + new URLSearchParams({ format: 'json', formatversion: '2', maxlag: '5', ...params });
  for (let i = 0; i < tries; i++) {
    const r = await fetch(url, { headers: { 'User-Agent': UA } });
    if (r.status === 429 || r.status >= 500) { await sleep(4000 * (i + 1)); continue; }
    const j = await r.json();
    if (j.error && j.error.code === 'maxlag') { await sleep(5000); continue; }
    return j;
  }
  throw new Error('API sin respuesta');
}
async function search(q) {
  const j = await api({ action: 'query', generator: 'search', gsrnamespace: '6', gsrsearch: q + ' filetype:bitmap', gsrlimit: '25', prop: 'imageinfo|categories', iiprop: 'url|size|mime|extmetadata', iiurlwidth: '480', cllimit: 'max', clshow: '!hidden' });
  await sleep(600);
  return (j.query && j.query.pages) || [];
}
function describe(p) {
  const ii = p.imageinfo && p.imageinfo[0];
  if (!ii) return null;
  const m = ii.extmetadata || {};
  return {
    titulo: p.title, w: ii.width, h: ii.height, mime: ii.mime, thumb: ii.thumburl,
    licencia: strip(m.LicenseShortName && m.LicenseShortName.value), licurl: (m.LicenseUrl && m.LicenseUrl.value) || '',
    autor: strip(m.Artist && m.Artist.value).slice(0, 120), pagina: ii.descriptionurl,
    texto: norm([p.title, strip(m.ImageDescription && m.ImageDescription.value), strip(m.ObjectName && m.ObjectName.value), ...(p.categories || []).map((c) => c.title)].join(' | ')),
    tituloN: norm(p.title),
  };
}
const NO = /\b(museo|museum|pintura|painting|oleo|cuadro|grabado|lienzo|tabla|retablo mayor|cartel|poster|mapa|map|logo|escudo|coat of arms|programa|firma)\b/;
function okFile(x, city) {
  if (!x || !/jpeg|png/.test(x.mime) || !FREE.test(x.licencia)) return false;
  if (Math.max(x.w, x.h) < 600 || x.w / x.h < 0.45 || x.w / x.h > 2.2) return false;
  if (NO.test(x.tituloN)) return false;
  // «Lugar (Provincia)»: archivo de un pueblo de la provincia, no de la capital
  const m = x.tituloN.match(new RegExp('^file:([^()]*)\\(' + city + '\\)'));
  if (m && !m[1].includes(city)) return false;
  return x.texto.includes(city);
}
function distintivas(nombre) { return norm(nombre).replace(/[«»"().,;:]/g, ' ').split(/\s+/).filter((t) => t.length > 2 && !GEN.has(t)); }

async function candidatas(h, titular, tipo) {
  const c = CAP[h.ciudad], city = norm(c.nombre);
  const corto = titular.split(',')[0].trim();
  const toks = distintivas(corto);
  const palabraTipo = tipo === 'cristo' ? /\b(cristo|jesus|senor|nazareno|cautivo|ecce)\b/ : /\b(virgen|maria|senora|dolorosa|palio)\b/;
  const seen = new Map();
  const qs = [`${corto} ${c.nombre}`, `${corto} ${h.nombre} ${c.nombre}`, ...(toks.length ? [`${tipo === 'cristo' ? 'Cristo' : 'Virgen'} ${toks.join(' ')} ${c.nombre}`] : [])];
  for (const q of qs) for (const p of await search(q)) { const x = describe(p); if (x && !seen.has(x.titulo)) seen.set(x.titulo, x); }
  return [...seen.values()]
    .filter((x) => okFile(x, city) && palabraTipo.test(x.texto) && (toks.length ? toks.every((t) => x.texto.includes(t)) : x.texto.includes(norm(h.nombre))))
    .map((x) => ({ ...x, tipo, titular: corto, score: (toks.every((t) => x.tituloN.includes(t)) ? 8 : 0) + (x.tituloN.includes(city) ? 3 : 0) + (/semana santa|procesion|paso|besamanos|capilla/.test(x.texto) ? 2 : 0) + Math.min(3, Math.max(x.w, x.h) / 1000) }))
    .sort((a, b) => b.score - a.score).slice(0, 3);
}

async function thumb(x, file) {
  const f = path.join(CACHE, file);
  if (!fs.existsSync(f)) {
    const r = await fetch(x.thumb, { headers: { 'User-Agent': UA } });
    if (!r.ok) throw new Error('descarga ' + r.status);
    fs.writeFileSync(f, Buffer.from(await r.arrayBuffer())); await sleep(400);
  }
  return path.basename(f);
}

async function hoja() {
  const J = JSON.parse(fs.readFileSync(OUT, 'utf8'));
  const items = [];
  for (const [slug, list] of Object.entries(J.hermandades)) (list || []).forEach((x, i) => x.cache && items.push({ id: `${slug}#${i}`, ...x }));
  const COLS = 5, TW = 300, TH = 260, LH = 40, PER = 25;
  const xml = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  for (let p = 0; p * PER < items.length; p++) {
    const page = items.slice(p * PER, (p + 1) * PER), rows = Math.ceil(page.length / COLS), comps = [];
    for (let i = 0; i < page.length; i++) {
      const it = page[i], x = (i % COLS) * TW, y = Math.floor(i / COLS) * (TH + LH), n = p * PER + i + 1;
      const buf = await sharp(path.join(CACHE, it.cache)).resize(TW - 6, TH - 6, { fit: 'contain', background: '#ffffff' }).toBuffer();
      comps.push({ input: buf, left: x + 3, top: y + 3 });
      comps.push({ input: Buffer.from(`<svg width="${TW}" height="${LH}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#2b1340"/><text x="6" y="16" font-family="Arial" font-size="13" fill="#fff">${n}. ${xml(it.id.slice(0, 34))}</text><text x="6" y="33" font-family="Arial" font-size="12" fill="#f0d79c">${it.tipo === 'cristo' ? 'C' : 'V'} · ${xml(it.titular.slice(0, 36))}</text></svg>`), left: x, top: y + TH });
      console.log(`${n}. ${it.id} | ${it.tipo} ${it.titular} | ${it.titulo} | ${it.licencia}`);
    }
    await sharp({ create: { width: COLS * TW, height: rows * (TH + LH), channels: 3, background: '#dddddd' } }).composite(comps).png().toFile(path.join(DIR, 'cache', `titulares-${p + 1}.png`));
  }
  console.log('Hojas:', Math.ceil(items.length / PER), 'candidatas:', items.length);
}

// Nombre de miniatura único por archivo (antes se cortaba el título y dos archivos parecidos compartían miniatura)
const nombreMini = (slug, titulo) => slug + '-' + createHash('sha1').update(titulo).digest('hex').slice(0, 12) + '.jpg';
if (process.argv.includes('--miniaturas')) {
  const J = JSON.parse(fs.readFileSync(OUT, 'utf8'));
  for (const [slug, list] of Object.entries(J.hermandades)) for (const x of list || []) { try { x.cache = await thumb(x, nombreMini(slug, x.titulo)); } catch (e) { x.cache = ''; } }
  fs.writeFileSync(OUT, JSON.stringify(J, null, 1)); console.log('miniaturas rehechas'); process.exit(0);
}
if (process.argv.includes('--hoja')) { await hoja(); process.exit(0); }

const prev = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : { hermandades: {} };
const out = { generado: new Date().toISOString(), hermandades: prev.hermandades || {} };
// Petición de Pablo (2026-10-15): que aparezcan los dos titulares (díptico Cristo + Virgen), en todas las hermandades.
const todo = D.hermandades.filter((h) => !(h.slug in out.hermandades));
let n = 0;
for (const h of todo) {
  n++;
  const cristos = (h.titulares || []).filter((t) => ES_CRISTO(t.nombre)).map((t) => t.nombre);
  const virgenes = (h.titulares || []).filter((t) => ES_VIRGEN(t.nombre)).map((t) => t.nombre);
  let res = [];
  try {
    for (const t of cristos) { const r = await candidatas(h, t, 'cristo'); if (r.length) { res = res.concat(r); break; } }
    for (const t of virgenes) { const r = await candidatas(h, t, 'virgen'); if (r.length) { res = res.concat(r); break; } }
    for (const x of res) { try { x.cache = await thumb(x, nombreMini(h.slug, x.titulo)); } catch (e) { x.cache = ''; } delete x.texto; delete x.tituloN; }
  } catch (e) { console.log('error', h.slug, e.message); continue; }
  out.hermandades[h.slug] = res;
  console.log(`${n}/${todo.length} ${h.slug}: ${res.length ? res.map((x) => x.tipo[0].toUpperCase() + ' ' + x.titulo).join(' || ') : '—'}`);
  fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
}
fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
console.log('Con candidata:', Object.values(out.hermandades).filter((l) => l && l.length).length, 'de', Object.keys(out.hermandades).length);
