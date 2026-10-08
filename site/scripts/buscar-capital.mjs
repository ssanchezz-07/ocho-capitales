// Ocho Capitales: busca en Wikimedia Commons fotos libres para la portada de una capital y las añade como candidatas
// a data/imagenes-nuevas.json (sin aprobar). Después: node hoja-contacto.mjs, elegir a ojo y poner "aprobada": true.
// Uso: node buscar-capital.mjs <slug> "<consulta 1>" ["<consulta 2>" …]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const [slug, ...queries] = process.argv.slice(2);
const OUT = path.join(DIR, '..', 'data', 'imagenes-nuevas.json');
const CACHE = path.join(DIR, 'cache'); fs.mkdirSync(CACHE, { recursive: true });
const UA = 'OchoCapitales/1.0 (https://github.com/ssanchezz-07/ocho-capitales; portal cofrade sin animo de lucro)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const strip = (s) => String(s || '').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const FREE = /^(cc0|cc[ -]by(-sa)?( \d\.\d)?|public domain|pd\b)/i;
const J = JSON.parse(fs.readFileSync(OUT, 'utf8')); J.capitales = J.capitales || {}; J.capitales[slug] = J.capitales[slug] || [];
const have = new Set(J.capitales[slug].map((x) => x.titulo));
for (const q of queries) {
  const url = 'https://commons.wikimedia.org/w/api.php?' + new URLSearchParams({ format: 'json', formatversion: '2', action: 'query', generator: 'search', gsrnamespace: '6', gsrsearch: q + ' filetype:bitmap', gsrlimit: '30', prop: 'imageinfo', iiprop: 'url|size|mime|extmetadata', iiurlwidth: '960' });
  const j = await (await fetch(url, { headers: { 'User-Agent': UA } })).json(); await sleep(800);
  for (const p of (j.query && j.query.pages) || []) {
    const ii = p.imageinfo && p.imageinfo[0]; if (!ii || have.has(p.title)) continue;
    const m = ii.extmetadata || {}; const lic = strip(m.LicenseShortName && m.LicenseShortName.value);
    if (!/jpeg|png/.test(ii.mime) || !FREE.test(lic) || ii.width < 1400 || ii.width / ii.height < 1.25) continue;
    try {
      const f = path.join(CACHE, 'cap-' + slug + '-' + Buffer.from(p.title).toString('base64url').slice(0, 24) + '.jpg');
      if (!fs.existsSync(f)) { const r = await fetch(ii.thumburl, { headers: { 'User-Agent': UA } }); fs.writeFileSync(f, Buffer.from(await r.arrayBuffer())); await sleep(500); }
      const s = await sharp(f).greyscale().stats(); const lum = Math.round(s.channels[0].mean); if (lum < 55 || lum > 225) continue;
      have.add(p.title);
      J.capitales[slug].push({ titulo: p.title, w: ii.width, h: ii.height, mime: ii.mime, thumb: ii.thumburl, licencia: lic, licurl: (m.LicenseUrl && m.LicenseUrl.value) || '', autor: strip(m.Artist && m.Artist.value).slice(0, 120), pagina: ii.descriptionurl, lum, cache: path.basename(f), consulta: q });
    } catch (e) { /* siguiente */ }
  }
}
fs.writeFileSync(OUT, JSON.stringify(J, null, 1));
console.log(slug, 'candidatas:', J.capitales[slug].length);
J.capitales[slug].forEach((x, i) => console.log(i, x.titulo, '|', x.licencia, '|', x.w + 'x' + x.h));
