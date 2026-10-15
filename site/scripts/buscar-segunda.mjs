// Ocho Capitales: segunda ronda para que TODAS las hermandades tengan imagen (petición de Pablo, 2026-10-16).
// 1) Recorre las categorías de Commons «Holy Week in <ciudad>» (dos niveles) y casa por nombre de hermandad o titular.
// 2) Si no hay nada, busca la sede canónica (iglesia o capilla) y la marca como «sede»: nunca se presenta como titular.
// Solo propone (data/segunda-candidatas.json + hojas cache/segunda-N.png); se aprueba a ojo como la primera ronda.
// Uso: cd site/scripts && node buscar-segunda.mjs [--hoja]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import sharp from 'sharp';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.join(DIR, '..');
const D = JSON.parse(fs.readFileSync(path.join(SITE, '..', 'portal-cofrade', 'data', 'portal.json'), 'utf8'));
const IMGX = JSON.parse(fs.readFileSync(path.join(SITE, 'data', 'imagenes.json'), 'utf8'));
const TIT = JSON.parse(fs.readFileSync(path.join(SITE, 'data', 'imagenes-titulares.json'), 'utf8')).hermandades;
const OUT = path.join(SITE, 'data', 'segunda-candidatas.json');
const CACHE = path.join(DIR, 'cache', 'segunda');
fs.mkdirSync(CACHE, { recursive: true });
const UA = 'OchoCapitales/1.0 (https://github.com/ssanchezz-07/ocho-capitales; portal cofrade sin animo de lucro)';
const API = 'https://commons.wikimedia.org/w/api.php';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const strip = (s) => String(s || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const FREE = /^(cc0|cc[ -]by(-sa)?( \d\.\d)?|public domain|pd\b|attribution)/i;
const GEN = new Set(['santisimo', 'santisima', 'cristo', 'nuestro', 'nuestra', 'padre', 'jesus', 'maria', 'senor', 'senora', 'virgen', 'madre', 'de', 'la', 'el', 'los', 'las', 'del', 'y', 'e', 'en', 'su', 'sus', 'san', 'santo', 'santa', 'real', 'divino', 'dulce', 'nombre', 'hermandad', 'cofradia', 'pro', 'grupo', 'parroquial', 'jaen', 'cadiz', 'huelva', 'almeria', 'malaga', 'granada', 'cordoba', 'sevilla']);
const EN = { sevilla: 'Seville', malaga: 'Málaga', granada: 'Granada', cordoba: 'Córdoba', cadiz: 'Cádiz', huelva: 'Huelva', almeria: 'Almería', jaen: 'Jaén' };
const NO = /\b(museo|museum|pintura|painting|oleo|lienzo|grabado|cartel|poster|mapa|map|logo|programa|firma)\b/;

async function api(params) {
  const url = API + '?' + new URLSearchParams({ format: 'json', formatversion: '2', maxlag: '5', ...params });
  for (let i = 0; i < 4; i++) {
    const r = await fetch(url, { headers: { 'User-Agent': UA } });
    if (r.status === 429 || r.status >= 500) { await sleep(4000 * (i + 1)); continue; }
    const j = await r.json(); await sleep(400);
    if (j.error && j.error.code === 'maxlag') { await sleep(5000); continue; }
    return j;
  }
  throw new Error('API sin respuesta');
}
async function miembros(cat, tipo) {
  const out = []; let cont = {};
  do {
    const j = await api({ action: 'query', list: 'categorymembers', cmtitle: cat, cmtype: tipo, cmlimit: '500', ...cont });
    out.push(...((j.query && j.query.categorymembers) || []).map((m) => m.title));
    cont = j.continue || null;
  } while (cont);
  return out;
}
async function info(titles) {
  const res = [];
  for (let i = 0; i < titles.length; i += 40) {
    const j = await api({ action: 'query', titles: titles.slice(i, i + 40).join('|'), prop: 'imageinfo|categories', iiprop: 'url|size|mime|extmetadata', iiurlwidth: '480', cllimit: 'max', clshow: '!hidden' });
    for (const p of (j.query && j.query.pages) || []) {
      const ii = p.imageinfo && p.imageinfo[0]; if (!ii) continue;
      const m = ii.extmetadata || {};
      res.push({ titulo: p.title, w: ii.width, h: ii.height, mime: ii.mime, thumb: ii.thumburl, licencia: strip(m.LicenseShortName && m.LicenseShortName.value), licurl: (m.LicenseUrl && m.LicenseUrl.value) || '', autor: strip(m.Artist && m.Artist.value).slice(0, 120), pagina: ii.descriptionurl, texto: norm([p.title, strip(m.ImageDescription && m.ImageDescription.value), ...(p.categories || []).map((c) => c.title)].join(' | ')) });
    }
  }
  return res.filter((x) => /jpeg|png/.test(x.mime) && FREE.test(x.licencia) && Math.max(x.w, x.h) >= 600 && !NO.test(norm(x.titulo)));
}
async function search(q) {
  const j = await api({ action: 'query', generator: 'search', gsrnamespace: '6', gsrsearch: q + ' filetype:bitmap', gsrlimit: '20', prop: 'imageinfo|categories', iiprop: 'url|size|mime|extmetadata', iiurlwidth: '480', cllimit: 'max', clshow: '!hidden' });
  return ((j.query && j.query.pages) || []).map((p) => { const ii = p.imageinfo && p.imageinfo[0]; if (!ii) return null; const m = ii.extmetadata || {}; return { titulo: p.title, w: ii.width, h: ii.height, mime: ii.mime, thumb: ii.thumburl, licencia: strip(m.LicenseShortName && m.LicenseShortName.value), licurl: (m.LicenseUrl && m.LicenseUrl.value) || '', autor: strip(m.Artist && m.Artist.value).slice(0, 120), pagina: ii.descriptionurl, texto: norm([p.title, strip(m.ImageDescription && m.ImageDescription.value), ...(p.categories || []).map((c) => c.title)].join(' | ')) }; }).filter((x) => x && /jpeg|png/.test(x.mime) && FREE.test(x.licencia) && Math.max(x.w, x.h) >= 600 && !NO.test(norm(x.titulo)));
}
const toks = (s) => norm(s).replace(/[«»"().,;:]/g, ' ').split(/\s+/).filter((t) => t.length > 3 && !GEN.has(t));
const nombreMini = (slug, titulo) => slug + '-' + createHash('sha1').update(titulo).digest('hex').slice(0, 12) + '.jpg';
async function thumb(x, file) {
  const f = path.join(CACHE, file);
  if (!fs.existsSync(f)) { const r = await fetch(x.thumb, { headers: { 'User-Agent': UA } }); if (!r.ok) throw new Error('descarga ' + r.status); fs.writeFileSync(f, Buffer.from(await r.arrayBuffer())); await sleep(300); }
  return path.basename(f);
}

async function hoja() {
  const J = JSON.parse(fs.readFileSync(OUT, 'utf8'));
  const items = []; for (const [slug, list] of Object.entries(J.hermandades)) list.forEach((x, i) => x.cache && items.push({ id: `${slug}#${i}`, ...x }));
  const COLS = 5, TW = 300, TH = 260, LH = 40, PER = 25;
  const xml = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  for (let p = 0; p * PER < items.length; p++) {
    const page = items.slice(p * PER, (p + 1) * PER), rows = Math.ceil(page.length / COLS), comps = [];
    for (let i = 0; i < page.length; i++) {
      const it = page[i], x = (i % COLS) * TW, y = Math.floor(i / COLS) * (TH + LH), n = p * PER + i + 1;
      try { comps.push({ input: await sharp(path.join(CACHE, it.cache)).resize(TW - 6, TH - 6, { fit: 'contain', background: '#fff' }).toBuffer(), left: x + 3, top: y + 3 }); } catch (e) { }
      comps.push({ input: Buffer.from(`<svg width="${TW}" height="${LH}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#2b1340"/><text x="6" y="16" font-family="Arial" font-size="13" fill="#fff">${n}. ${xml(it.id.slice(0, 34))}</text><text x="6" y="33" font-family="Arial" font-size="12" fill="#f0d79c">${xml(it.tipo)} · ${xml(it.titulo.replace('File:', '').slice(0, 40))}</text></svg>`), left: x, top: y + TH });
      console.log(`${n}. ${it.id} | ${it.tipo} | ${it.titulo}`);
    }
    await sharp({ create: { width: COLS * TW, height: rows * (TH + LH), channels: 3, background: '#ddd' } }).composite(comps).png().toFile(path.join(DIR, 'cache', `segunda-${p + 1}.png`));
  }
}
if (process.argv.includes('--hoja')) { await hoja(); process.exit(0); }

const faltan = D.hermandades.filter((h) => !TIT[h.slug] && (!IMGX.hermandades[h.slug] || IMGX.hermandades[h.slug].escudo));
const porCiudad = {};
for (const h of faltan) (porCiudad[h.ciudad] = porCiudad[h.ciudad] || []).push(h);
const out = { generado: new Date().toISOString(), hermandades: {} };
for (const [ciudad, hs] of Object.entries(porCiudad)) {
  // Archivo de Semana Santa de la ciudad en Commons (categoría y subcategorías de primer nivel)
  const raiz = `Category:Holy Week in ${EN[ciudad]}`;
  let files = [];
  try {
    const subs = await miembros(raiz, 'subcat');
    files = await miembros(raiz, 'file');
    for (const s of subs.slice(0, 120)) files.push(...(await miembros(s, 'file')));
  } catch (e) { console.log('categoría', raiz, e.message); }
  files = [...new Set(files)];
  console.log(ciudad, files.length, 'archivos en', raiz);
  const titulosN = files.map((t) => [t, norm(t)]);
  for (const h of hs) {
    const claves = [...new Set([...toks(h.nombre), ...(h.titulares || []).flatMap((t) => toks(t.nombre.split(',')[0]))])];
    const pre = titulosN.filter(([, n]) => claves.some((c) => n.includes(c))).map(([t]) => t).slice(0, 40);
    let cands = pre.length ? await info(pre) : [];
    cands = cands.map((x) => ({ ...x, tipo: 'cortejo', score: claves.filter((c) => x.texto.includes(c)).length })).filter((x) => x.score > 0).sort((a, b) => b.score - a.score).slice(0, 4);
    if (!cands.length) {
      const q = await search(`${h.nombre} ${EN[ciudad]} Semana Santa`);
      cands = q.filter((x) => x.texto.includes(norm(EN[ciudad]).slice(0, 5)) && claves.some((c) => x.texto.includes(c))).slice(0, 3).map((x) => ({ ...x, tipo: 'cortejo' }));
    }
    if (h.sede) {
      const sedeT = toks(h.sede);
      const q = await search(`${h.sede} ${EN[ciudad]}`);
      cands.push(...q.filter((x) => x.texto.includes(norm(EN[ciudad]).slice(0, 5)) && sedeT.length && sedeT.every((t) => x.texto.includes(t))).slice(0, 2).map((x) => ({ ...x, tipo: 'sede', sede: h.sede })));
    }
    for (const x of cands) { try { x.cache = await thumb(x, nombreMini(h.slug, x.titulo)); } catch (e) { x.cache = ''; } delete x.texto; }
    out.hermandades[h.slug] = cands;
    console.log(h.slug, cands.map((x) => x.tipo[0] + ':' + x.titulo).join(' || ') || '—');
    fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
  }
}
fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
console.log('Con candidata:', Object.values(out.hermandades).filter((l) => l.length).length, 'de', Object.keys(out.hermandades).length);
