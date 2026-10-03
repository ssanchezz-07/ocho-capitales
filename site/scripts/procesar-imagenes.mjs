// Ocho Capitales: descarga de Wikimedia Commons las imágenes del portal (las de portal.json y las nuevas aprobadas
// en data/imagenes-nuevas.json) y las guarda optimizadas en WebP (160, 480 y 960 px) en assets/img/.
// Genera data/imagenes.json con medidas y créditos; build.mjs lo usa para servirlas desde el propio sitio.
// Uso: cd site/scripts && node procesar-imagenes.mjs   (solo procesa lo que falte; --todo para rehacer)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.join(DIR, '..');
const D = JSON.parse(fs.readFileSync(path.join(SITE, '..', 'portal-cofrade', 'data', 'portal.json'), 'utf8'));
const NEW_FILE = path.join(SITE, 'data', 'imagenes-nuevas.json');
const NUEVAS = fs.existsSync(NEW_FILE) ? JSON.parse(fs.readFileSync(NEW_FILE, 'utf8')) : { hermandades: {}, capitales: {} };
const OUT_DIR = path.join(SITE, 'assets', 'img');
const INDEX = path.join(SITE, 'data', 'imagenes.json');
const CACHE = path.join(DIR, 'cache', 'orig');
fs.mkdirSync(OUT_DIR, { recursive: true }); fs.mkdirSync(CACHE, { recursive: true });
const UA = 'OchoCapitales/1.0 (https://github.com/ssanchezz-07/ocho-capitales; portal cofrade sin animo de lucro)';
const WIDTHS = [160, 480, 960];
const ALL = process.argv.includes('--todo');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const prev = fs.existsSync(INDEX) && !ALL ? JSON.parse(fs.readFileSync(INDEX, 'utf8')) : { hermandades: {}, capitales: {} };
const index = { generado: new Date().toISOString(), hermandades: prev.hermandades || {}, capitales: prev.capitales || {} };

const fileTitle = (pagina) => { const m = decodeURIComponent(String(pagina || '')).match(/(File:[^?#]+)$/); return m ? m[1].replace(/_/g, ' ') : null; };

async function sourceUrl(title) {
  const url = 'https://commons.wikimedia.org/w/api.php?' + new URLSearchParams({ action: 'query', format: 'json', formatversion: '2', maxlag: '5', titles: title, prop: 'imageinfo', iiprop: 'url|size|mime', iiurlwidth: '1280' });
  for (let i = 0; i < 4; i++) {
    const r = await fetch(url, { headers: { 'User-Agent': UA } });
    if (r.status === 429 || r.status >= 500) { await sleep(5000 * (i + 1)); continue; }
    const j = await r.json(); await sleep(400);
    const ii = j.query && j.query.pages && j.query.pages[0].imageinfo && j.query.pages[0].imageinfo[0];
    return ii ? (ii.thumburl || ii.url) : null;
  }
  return null;
}
async function download(url, file) {
  if (fs.existsSync(file)) return file;
  for (let i = 0; i < 4; i++) {
    const r = await fetch(url, { headers: { 'User-Agent': UA } });
    if (r.status === 429 || r.status >= 500) { await sleep(6000 * (i + 1)); continue; }
    if (!r.ok) throw new Error('HTTP ' + r.status);
    fs.writeFileSync(file, Buffer.from(await r.arrayBuffer())); await sleep(600);
    return file;
  }
  throw new Error('demasiados reintentos');
}

async function processOne(kind, slug, meta) {
  const title = fileTitle(meta.pagina) || meta.titulo;
  if (!title) throw new Error('sin título de archivo');
  const src = await sourceUrl(title);
  if (!src) throw new Error('no encontrado en Commons');
  const orig = await download(src, path.join(CACHE, `${kind}-${slug}${path.extname(new URL(src).pathname) || '.jpg'}`));
  const img = sharp(orig, { failOn: 'none' }).rotate();
  const m = await img.metadata();
  const srcW = m.autoOrient ? m.autoOrient.width : m.width;
  const srcH = m.autoOrient ? m.autoOrient.height : m.height;
  const widths = WIDTHS.filter((w, i) => w <= srcW || i === 0);
  let outW = 0, outH = 0;
  for (const w of widths) {
    const file = path.join(OUT_DIR, `${kind}-${slug}-${w}.webp`);
    const info = await sharp(orig, { failOn: 'none' }).rotate().resize({ width: Math.min(w, srcW), withoutEnlargement: true })
      .webp({ quality: meta.escudo ? 74 : 66, alphaQuality: 80, effort: 6, smartSubsample: true }).toFile(file);
    outW = info.width; outH = info.height;
  }
  return { w: outW, h: outH, widths: widths.map((w) => Math.min(w, srcW)), escudo: !!meta.escudo, autor: meta.autor || '', licencia: meta.licencia || '', licurl: meta.licurl || '', pagina: meta.pagina || '' };
}

const jobs = [];
for (const h of D.hermandades) if (h.imagen) jobs.push(['h', h.slug, h.imagen]);
for (const c of D.capitales) if (c.imagen) jobs.push(['c', c.slug, c.imagen]);
for (const [slug, x] of Object.entries(NUEVAS.hermandades || {})) if (x && x.aprobada) jobs.push(['h', slug, { ...x, escudo: /escudo/i.test(x.titulo) }]);
for (const [slug, list] of Object.entries(NUEVAS.capitales || {})) { const x = (list || []).find((y) => y.aprobada); if (x) jobs.push(['c', slug, x]); }

let done = 0, fail = 0;
for (const [kind, slug, meta] of jobs) {
  const bucket = kind === 'h' ? index.hermandades : index.capitales;
  if (bucket[slug] && bucket[slug].pagina === meta.pagina && fs.existsSync(path.join(OUT_DIR, `${kind}-${slug}-${bucket[slug].widths.at(-1)}.webp`))) continue;
  try { bucket[slug] = await processOne(kind, slug, meta); done++; console.log('ok', kind, slug, bucket[slug].w + 'x' + bucket[slug].h); }
  catch (e) { fail++; console.log('FALLO', kind, slug, e.message); }
  fs.writeFileSync(INDEX, JSON.stringify(index, null, 1));
}
fs.writeFileSync(INDEX, JSON.stringify(index, null, 1));
const bytes = fs.readdirSync(OUT_DIR).reduce((a, f) => a + fs.statSync(path.join(OUT_DIR, f)).size, 0);
console.log(`Procesadas ${done}, fallos ${fail}, total en índice ${Object.keys(index.hermandades).length + Object.keys(index.capitales).length}, peso ${(bytes / 1e6).toFixed(1)} MB`);
