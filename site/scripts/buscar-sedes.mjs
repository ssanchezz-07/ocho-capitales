// Ocho Capitales: tercera ronda, solo la sede canónica de las hermandades que siguen sin ninguna foto.
// Exige que el archivo nombre la ciudad y al menos la mitad de las palabras distintivas de la sede. Se revisa a ojo.
// Uso: node buscar-sedes.mjs <slug> <slug>…   (o sin argumentos: las que no tienen imagen en dist) [--hoja]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import sharp from 'sharp';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const D = JSON.parse(fs.readFileSync(path.join(DIR, '..', '..', 'portal-cofrade', 'data', 'portal.json'), 'utf8'));
const OUT = path.join(DIR, '..', 'data', 'sedes-candidatas.json');
const CACHE = path.join(DIR, 'cache', 'sedes'); fs.mkdirSync(CACHE, { recursive: true });
const UA = 'OchoCapitales/1.0 (https://github.com/ssanchezz-07/ocho-capitales; portal cofrade sin animo de lucro)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const strip = (s) => String(s || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const FREE = /^(cc0|cc[ -]by(-sa)?( \d\.\d)?|public domain|pd\b|attribution)/i;
const GEN = new Set(['parroquia', 'iglesia', 'capilla', 'parroquial', 'de', 'la', 'el', 'los', 'las', 'del', 'y', 'san', 'santa', 'santo', 'nuestra', 'senora', 'nuestro', 'padre', 'templo', 'real', 'basilica', 'convento', 'ermita', 'casa', 'hermandad', 'en', 'barrio', 'maria']);
const CIUDAD = Object.fromEntries(D.capitales.map((c) => [c.slug, c.nombre]));
const H = Object.fromEntries(D.hermandades.map((h) => [h.slug, h]));
async function search(q) {
  const url = 'https://commons.wikimedia.org/w/api.php?' + new URLSearchParams({ format: 'json', formatversion: '2', action: 'query', generator: 'search', gsrnamespace: '6', gsrsearch: q + ' filetype:bitmap', gsrlimit: '20', prop: 'imageinfo|categories', iiprop: 'url|size|mime|extmetadata', iiurlwidth: '480', cllimit: 'max', clshow: '!hidden' });
  const r = await fetch(url, { headers: { 'User-Agent': UA } }); await sleep(500);
  const j = await r.json();
  return ((j.query && j.query.pages) || []).map((p) => { const ii = p.imageinfo && p.imageinfo[0]; if (!ii) return null; const m = ii.extmetadata || {}; return { titulo: p.title, w: ii.width, h: ii.height, mime: ii.mime, thumb: ii.thumburl, licencia: strip(m.LicenseShortName && m.LicenseShortName.value), licurl: (m.LicenseUrl && m.LicenseUrl.value) || '', autor: strip(m.Artist && m.Artist.value).slice(0, 120), pagina: ii.descriptionurl, texto: norm([p.title, strip(m.ImageDescription && m.ImageDescription.value), ...(p.categories || []).map((c) => c.title)].join(' | ')) }; }).filter((x) => x && /jpeg|png/.test(x.mime) && FREE.test(x.licencia) && Math.max(x.w, x.h) >= 600);
}
if (process.argv.includes('--hoja')) {
  const J = JSON.parse(fs.readFileSync(OUT, 'utf8')); const items = [];
  for (const [slug, l] of Object.entries(J)) l.forEach((x, i) => x.cache && items.push({ id: `${slug}#${i}`, ...x }));
  const COLS = 5, TW = 300, TH = 260, LH = 40, comps = [];
  const xml = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  for (let i = 0; i < items.length; i++) {
    const it = items[i], x = (i % COLS) * TW, y = Math.floor(i / COLS) * (TH + LH);
    try { comps.push({ input: await sharp(path.join(CACHE, it.cache)).resize(TW - 6, TH - 6, { fit: 'contain', background: '#fff' }).toBuffer(), left: x + 3, top: y + 3 }); } catch (e) { }
    comps.push({ input: Buffer.from(`<svg width="${TW}" height="${LH}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#2b1340"/><text x="6" y="16" font-family="Arial" font-size="13" fill="#fff">${i + 1}. ${xml(it.id.slice(0, 36))}</text><text x="6" y="33" font-family="Arial" font-size="12" fill="#f0d79c">${xml(it.titulo.replace('File:', '').slice(0, 44))}</text></svg>`), left: x, top: y + TH });
    console.log(`${i + 1}. ${it.id} | sede: ${H[it.id.split('#')[0]].sede} | ${it.titulo}`);
  }
  await sharp({ create: { width: COLS * TW, height: Math.ceil(items.length / COLS) * (TH + LH), channels: 3, background: '#ddd' } }).composite(comps).png().toFile(path.join(DIR, 'cache', 'sedes-1.png'));
  process.exit(0);
}
const slugs = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const out = {};
for (const slug of slugs) {
  const h = H[slug]; if (!h || !h.sede) { out[slug] = []; continue; }
  const city = norm(CIUDAD[h.ciudad]);
  const tk = norm(h.sede).replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter((t) => t.length > 2 && !GEN.has(t));
  const res = new Map();
  for (const q of [`${h.sede} ${CIUDAD[h.ciudad]}`, `${tk.join(' ')} ${CIUDAD[h.ciudad]}`]) for (const x of await search(q)) if (!res.has(x.titulo)) res.set(x.titulo, x);
  const c = [...res.values()].filter((x) => x.texto.includes(city) && tk.length && tk.filter((t) => x.texto.includes(t)).length >= Math.ceil(tk.length / 2)).slice(0, 2);
  for (const x of c) { const f = slug + '-' + createHash('sha1').update(x.titulo).digest('hex').slice(0, 10) + '.jpg'; try { if (!fs.existsSync(path.join(CACHE, f))) { const r = await fetch(x.thumb, { headers: { 'User-Agent': UA } }); fs.writeFileSync(path.join(CACHE, f), Buffer.from(await r.arrayBuffer())); } x.cache = f; } catch (e) { x.cache = ''; } delete x.texto; }
  out[slug] = c; console.log(slug, '|', h.sede, '|', c.map((x) => x.titulo).join(' || ') || '—');
}
fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
