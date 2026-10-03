// Ocho Capitales: busca en Wikimedia Commons imágenes libres para las hermandades (y capitales) que no tienen.
// Solo acepta un archivo si su título, descripción o categorías nombran la hermandad Y la ciudad, con licencia libre,
// foto de al menos 1000 px y luminosidad suficiente. El resultado (data/imagenes-nuevas.json) se revisa a ojo antes de usarlo.
// Uso: cd site/scripts && node buscar-imagenes.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const D = JSON.parse(fs.readFileSync(path.join(DIR, '..', '..', 'portal-cofrade', 'data', 'portal.json'), 'utf8'));
const OUT = path.join(DIR, '..', 'data', 'imagenes-nuevas.json');
const CACHE = path.join(DIR, 'cache');
fs.mkdirSync(CACHE, { recursive: true });
const UA = 'OchoCapitales/1.0 (https://github.com/ssanchezz-07/ocho-capitales; portal cofrade sin animo de lucro)';
const API = 'https://commons.wikimedia.org/w/api.php';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const strip = (s) => String(s || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const FREE = /^(cc0|cc[ -]by(-sa)?( \d\.\d)?|public domain|pd\b|attribution)/i;
const STOP = new Set(['la', 'el', 'los', 'las', 'de', 'del', 'y', 'e', 'en', 'hermandad', 'cofradia', 'hdad', 'real', 'ilustre', 'grupo', 'parroquial', 'agrupacion']);
const CAP = Object.fromEntries(D.capitales.map((c) => [c.slug, c]));

async function api(params, tries = 4) {
  const url = API + '?' + new URLSearchParams({ format: 'json', formatversion: '2', maxlag: '5', ...params });
  for (let i = 0; i < tries; i++) {
    const r = await fetch(url, { headers: { 'User-Agent': UA } });
    if (r.status === 429 || r.status >= 500) { await sleep(4000 * (i + 1)); continue; }
    const j = await r.json();
    if (j.error && j.error.code === 'maxlag') { await sleep(5000); continue; }
    return j;
  }
  throw new Error('API sin respuesta: ' + url);
}

async function search(q) {
  const j = await api({ action: 'query', generator: 'search', gsrnamespace: '6', gsrsearch: q + ' filetype:bitmap', gsrlimit: '20', prop: 'imageinfo|categories', iiprop: 'url|size|mime|extmetadata', iiurlwidth: '960', cllimit: 'max', clshow: '!hidden' });
  await sleep(700);
  return (j.query && j.query.pages) || [];
}

function describe(p) {
  const ii = p.imageinfo && p.imageinfo[0];
  if (!ii) return null;
  const m = ii.extmetadata || {};
  const lic = strip(m.LicenseShortName && m.LicenseShortName.value);
  return {
    titulo: p.title, w: ii.width, h: ii.height, mime: ii.mime, thumb: ii.thumburl, licencia: lic,
    licurl: (m.LicenseUrl && m.LicenseUrl.value) || '', autor: strip(m.Artist && m.Artist.value).slice(0, 120),
    pagina: ii.descriptionurl, texto: norm([p.title, strip(m.ImageDescription && m.ImageDescription.value), strip(m.ObjectName && m.ObjectName.value), ...(p.categories || []).map((c) => c.title)].join(' | ')),
    tituloN: norm(p.title),
  };
}

async function luminance(url, file) {
  const f = path.join(CACHE, file);
  if (!fs.existsSync(f)) {
    const r = await fetch(url, { headers: { 'User-Agent': UA } });
    if (!r.ok) throw new Error('descarga ' + r.status);
    fs.writeFileSync(f, Buffer.from(await r.arrayBuffer()));
    await sleep(500);
  }
  const s = await sharp(f).greyscale().stats();
  return { lum: Math.round(s.channels[0].mean), sharp: Math.round(s.sharpness * 100) / 100, file: f };
}

function okFile(x) {
  return x && /jpeg|png/.test(x.mime) && FREE.test(x.licencia) && Math.max(x.w, x.h) >= 1000 && x.w / x.h > 0.55 && x.w / x.h < 2.1
    && !/\b(mapa|map|plano|logo|cartel|poster|programa|pdf|horario|itinerario|recorrido|firma|signature)\b/.test(x.tituloN);
}

async function forHerm(h) {
  const c = CAP[h.ciudad];
  const city = norm(c.nombre);
  const tokens = norm(h.nombre).replace(/[«»"().,]/g, ' ').split(/\s+/).filter((t) => t.length > 2 && !STOP.has(t));
  if (!tokens.length) return null;
  const seen = new Map();
  for (const q of [`${h.nombre} ${c.nombre} Semana Santa`, `${h.nombre} ${c.nombre}`, `Hermandad ${h.nombre} ${c.nombre}`]) {
    for (const p of await search(q)) { const x = describe(p); if (x && !seen.has(x.titulo)) seen.set(x.titulo, x); }
  }
  const cands = [...seen.values()].filter(okFile).filter((x) => x.texto.includes(city) && tokens.every((t) => x.texto.includes(t)))
    .map((x) => ({ ...x, score: (tokens.every((t) => x.tituloN.includes(t)) ? 10 : 0) + (x.tituloN.includes(city) ? 3 : 0) + (/semana santa|procesion|paso|palio|cristo|virgen|nazaren/.test(x.texto) ? 3 : 0) - (/escudo/.test(x.tituloN) ? 6 : 0) + Math.min(4, x.w / 1000) }))
    .sort((a, b) => b.score - a.score);
  for (const x of cands.slice(0, 4)) {
    try {
      const L = await luminance(x.thumb, h.slug + '-' + Buffer.from(x.titulo).toString('base64url').slice(0, 24) + '.jpg');
      if (L.lum < 60 || L.lum > 225) continue; // demasiado oscura o quemada
      const { texto, tituloN, score, ...keep } = x;
      return { ...keep, lum: L.lum, motivo: `coinciden «${tokens.join(' ')}» y «${c.nombre}»`, cache: path.basename(L.file) };
    } catch (e) { /* siguiente candidato */ }
  }
  return null;
}

async function forCapital(c) {
  const seen = new Map();
  for (const q of [`Semana Santa ${c.nombre} procesión`, `Semana Santa de ${c.nombre}`]) for (const p of await search(q)) { const x = describe(p); if (x && !seen.has(x.titulo)) seen.set(x.titulo, x); }
  const city = norm(c.nombre);
  const cands = [...seen.values()].filter(okFile).filter((x) => x.texto.includes(city) && /semana santa/.test(x.texto) && x.w > x.h).sort((a, b) => b.w - a.w);
  const res = [];
  for (const x of cands.slice(0, 6)) {
    try { const L = await luminance(x.thumb, 'cap-' + c.slug + '-' + Buffer.from(x.titulo).toString('base64url').slice(0, 24) + '.jpg'); if (L.lum >= 60 && L.lum <= 225) { const { texto, tituloN, ...keep } = x; res.push({ ...keep, lum: L.lum, cache: path.basename(L.file) }); } } catch (e) {}
  }
  return res;
}

const prev = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : { hermandades: {}, capitales: {} };
const out = { generado: new Date().toISOString(), hermandades: prev.hermandades || {}, capitales: prev.capitales || {} };
const todo = D.hermandades.filter((h) => !h.imagen && !(h.slug in out.hermandades));
let n = 0;
for (const h of todo) {
  n++;
  try { out.hermandades[h.slug] = await forHerm(h); } catch (e) { console.log('error', h.slug, e.message); continue; }
  console.log(`${n}/${todo.length} ${h.slug}: ${out.hermandades[h.slug] ? out.hermandades[h.slug].titulo : 'sin imagen fiable'}`);
  fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
}
for (const c of D.capitales.filter((x) => !x.imagen && !out.capitales[x.slug])) { out.capitales[c.slug] = await forCapital(c); console.log('capital', c.slug, out.capitales[c.slug].length, 'candidatas'); }
fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
console.log('Con imagen:', Object.values(out.hermandades).filter(Boolean).length, 'de', Object.keys(out.hermandades).length);
