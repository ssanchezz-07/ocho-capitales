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

async function sourceUrl(title, ancho = 1280) {
  const url = 'https://commons.wikimedia.org/w/api.php?' + new URLSearchParams({ action: 'query', format: 'json', formatversion: '2', maxlag: '5', titles: title, prop: 'imageinfo', iiprop: 'url|size|mime', ...(ancho ? { iiurlwidth: String(ancho) } : {}) });
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
  // con recorte se parte del original completo: el titular ocupa solo una parte de la foto
  const src = await sourceUrl(title, Array.isArray(meta.recorte) ? 0 : 1280);
  if (!src) throw new Error('no encontrado en Commons');
  const orig = await download(src, path.join(CACHE, `${kind}-${slug}${Array.isArray(meta.recorte) ? '-grande' : ''}${path.extname(new URL(src).pathname) || '.jpg'}`));
  const img = sharp(orig, { failOn: 'none' }).rotate();
  const m = await img.metadata();
  const fullW = m.autoOrient ? m.autoOrient.width : m.width;
  const fullH = m.autoOrient ? m.autoOrient.height : m.height;
  // recorte [x, y, ancho, alto] en fracciones del original: acerca el titular cuando la foto es un paso en la calle
  const rc = Array.isArray(meta.recorte) ? { left: Math.round(meta.recorte[0] * fullW), top: Math.round(meta.recorte[1] * fullH), width: Math.round(meta.recorte[2] * fullW), height: Math.round(meta.recorte[3] * fullH) } : null;
  const base = () => { const s = sharp(orig, { failOn: 'none' }).rotate(); return rc ? s.extract(rc) : s; };
  const srcW = rc ? rc.width : fullW;
  const widths = WIDTHS.filter((w, i) => w <= srcW || i === 0);
  // Entre 480 y 960 px de original, también una versión a su ancho natural: no se pierde nitidez en la ficha
  if (srcW > widths.at(-1) + 60 && srcW < WIDTHS.at(-1)) widths.push(srcW);
  let outW = 0, outH = 0;
  for (const w of widths) {
    const file = path.join(OUT_DIR, `${kind}-${slug}-${w}.webp`);
    const info = await (rc ? sharp(await base().toBuffer()) : base()).resize({ width: Math.min(w, srcW), withoutEnlargement: true })
      .webp({ quality: meta.escudo ? 74 : 66, alphaQuality: 80, effort: 6, smartSubsample: true }).toFile(file);
    outW = info.width; outH = info.height;
  }
  const out = { w: outW, h: outH, widths: widths.map((w) => Math.min(w, srcW)), escudo: !!meta.escudo, autor: meta.autor || '', licencia: meta.licencia || '', licurl: meta.licurl || '', pagina: meta.pagina || '' };
  if (meta.foco && !out.escudo) out.foco = meta.foco;
  if (rc) out.recorte = meta.recorte;
  return out;
}

// Encuadre (object-position) de los recortes de la ficha, el díptico y la hoja del plano: solo el puesto a mano en
// data/imagenes-titulares.json («foco», p. ej. "50% 15%"); sin él, cada recorte usa su encuadre por defecto.
// Copia a lo ya procesado el encuadre puesto a mano (o lo quita si se ha borrado)
function completarFoco(entry, manual) {
  if (!entry || entry.escudo) return;
  if (manual) entry.foco = manual; else delete entry.foco;
}

// Fotos retiradas (tools/sources/fotos-retiradas.json): no se descargan ni se generan, para que no vuelvan a publicarse sus archivos
const FRET = JSON.parse(fs.readFileSync(path.join(SITE, '..', 'tools', 'sources', 'fotos-retiradas.json'), 'utf8'));
const archivoDe = (u) => { try { return decodeURIComponent(String(u || '').split('?')[0].split('/').pop()).replace(/^File:/, '').replace(/ /g, '_'); } catch { return ''; } };
const retirada = (meta, slug, rol) => !!((FRET.retiradas || {})[archivoDe(meta.pagina || meta.titulo)] || (FRET.retiradas_en || {})[slug + '|' + rol]);

const jobs = [];
for (const h of D.hermandades) if (h.imagen) jobs.push(['h', h.slug, h.imagen]);
for (const c of D.capitales) if (c.imagen) jobs.push(['c', c.slug, c.imagen]);
for (const [slug, x] of Object.entries(NUEVAS.hermandades || {})) if (x && x.aprobada) jobs.push(['h', slug, { ...x, escudo: /escudo/i.test(x.titulo) }]);
for (const [slug, list] of Object.entries(NUEVAS.capitales || {})) { const x = (list || []).find((y) => y.aprobada); if (x) jobs.push(['c', slug, x]); }

let done = 0, fail = 0;
for (const [kind, slug, meta] of jobs) {
  const bucket = kind === 'h' ? index.hermandades : index.capitales;
  if (kind === 'h' && retirada(meta, slug, 'ficha')) continue;
  if (bucket[slug] && bucket[slug].pagina === meta.pagina && fs.existsSync(path.join(OUT_DIR, `${kind}-${slug}-${bucket[slug].widths.at(-1)}.webp`))) { completarFoco(bucket[slug], meta.foco); continue; }
  try { bucket[slug] = await processOne(kind, slug, meta); done++; console.log('ok', kind, slug, bucket[slug].w + 'x' + bucket[slug].h); }
  catch (e) { fail++; console.log('FALLO', kind, slug, e.message); }
  fs.writeFileSync(INDEX, JSON.stringify(index, null, 1));
}
// Díptico de titulares (Cristo y Virgen), aprobados a ojo en data/imagenes-titulares.json (ver buscar-titulares.mjs)
const TIT_FILE = path.join(SITE, 'data', 'imagenes-titulares.json');
const TIT = fs.existsSync(TIT_FILE) ? JSON.parse(fs.readFileSync(TIT_FILE, 'utf8')) : { hermandades: {} };
index.titulares = prev.titulares || {};
for (const [slug, par] of Object.entries(TIT.hermandades || {})) {
  for (const tipo of ['cristo', 'virgen', 'juntos', 'sede']) {
    const meta = par && par[tipo]; if (!meta || !meta.pagina) continue;
    if (retirada(meta, slug, tipo)) continue;
    const prevT = (index.titulares[slug] || {})[tipo];
    if (prevT && prevT.pagina === meta.pagina && JSON.stringify(prevT.recorte || null) === JSON.stringify(meta.recorte || null) && fs.existsSync(path.join(OUT_DIR, `t-${slug}-${tipo}-${prevT.widths.at(-1)}.webp`))) { prevT.titular = meta.titular || prevT.titular; completarFoco(prevT, meta.foco); continue; }
    try { (index.titulares[slug] = index.titulares[slug] || {})[tipo] = { ...(await processOne('t', `${slug}-${tipo}`, meta)), titular: meta.titular || '' }; done++; console.log('ok', 't', slug, tipo); }
    catch (e) { fail++; console.log('FALLO', 't', slug, tipo, e.message); }
    fs.writeFileSync(INDEX, JSON.stringify(index, null, 1));
  }
}
// Díptico en una sola imagen (Pablo, 3-nov: «la misma imagen en toda la web»): el Cristo y la Virgen, cada uno recortado
// a 3:4 con su encuadre, uno junto al otro. Es la miniatura de listados, buscador y plano, y la imagen al compartir.
const recorte34 = async (file, foco, W, H) => {
  const m = await sharp(file).metadata();
  const k = Math.max(W / m.width, H / m.height), w = Math.round(m.width * k), h = Math.round(m.height * k);
  const [px, py] = (foco || '50% 22%').split(' ').map((v) => parseFloat(v) / 100);
  return sharp(file).resize(w, h).extract({ left: Math.round((w - W) * px), top: Math.round((h - H) * py), width: W, height: H }).toBuffer();
};
index.dipticos = {};
for (const [slug, t] of Object.entries(index.titulares)) {
  const par = (TIT.hermandades || {})[slug] || {};
  const c = t.cristo, v = t.virgen;
  if (!c || !v || !par.cristo || !par.virgen || retirada(par.cristo, slug, 'cristo') || retirada(par.virgen, slug, 'virgen')) continue;
  const firma = [c.pagina, c.recorte, c.foco, v.pagina, v.recorte, v.foco].map((x) => JSON.stringify(x || '')).join('|');
  const prevD = (prev.dipticos || {})[slug];
  if (prevD && prevD.firma === firma && fs.existsSync(path.join(OUT_DIR, `d-${slug}-960.webp`))) { index.dipticos[slug] = prevD; continue; }
  const fc = path.join(OUT_DIR, `t-${slug}-cristo-${c.widths.at(-1)}.webp`), fv = path.join(OUT_DIR, `t-${slug}-virgen-${v.widths.at(-1)}.webp`);
  const widths = [];
  for (const W of WIDTHS) {
    const half = Math.round(W / 2), H = Math.round((half * 4) / 3);
    const lienzo = sharp({ create: { width: W, height: H, channels: 3, background: '#1a0d26' } })
      .composite([{ input: await recorte34(fc, c.foco, half, H), left: 0, top: 0 }, { input: await recorte34(fv, v.foco, W - half, H), left: half, top: 0 }]);
    await sharp(await lienzo.png().toBuffer()).webp({ quality: 66, effort: 6, smartSubsample: true }).toFile(path.join(OUT_DIR, `d-${slug}-${W}.webp`));
    widths.push(W);
  }
  index.dipticos[slug] = { w: 960, h: 640, widths, firma };
  done++; console.log('ok', 'd', slug);
}
fs.writeFileSync(INDEX, JSON.stringify(index, null, 1));
const bytes =fs.readdirSync(OUT_DIR).reduce((a, f) => a + fs.statSync(path.join(OUT_DIR, f)).size, 0);
console.log(`Procesadas ${done}, fallos ${fail}, total en índice ${Object.keys(index.hermandades).length + Object.keys(index.capitales).length}, peso ${(bytes / 1e6).toFixed(1)} MB`);
