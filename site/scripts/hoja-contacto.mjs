// Ocho Capitales: hojas de contacto para revisar a ojo las imágenes candidatas (data/imagenes-nuevas.json).
// Uso: node hoja-contacto.mjs   → cache/hoja-1.png, hoja-2.png… y la leyenda numerada por consola.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const J = JSON.parse(fs.readFileSync(path.join(DIR, '..', 'data', 'imagenes-nuevas.json'), 'utf8'));
const items = [];
for (const [slug, x] of Object.entries(J.hermandades)) if (x && x.cache) items.push({ slug, ...x });
for (const [slug, list] of Object.entries(J.capitales || {})) (list || []).forEach((x, i) => x.cache && items.push({ slug: `CAPITAL ${slug} #${i}`, ...x }));
const COLS = 5, TW = 280, TH = 200, LH = 34, PER = 25;
const xml = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
for (let p = 0; p * PER < items.length; p++) {
  const page = items.slice(p * PER, (p + 1) * PER);
  const rows = Math.ceil(page.length / COLS);
  const comps = [];
  for (let i = 0; i < page.length; i++) {
    const it = page[i], x = (i % COLS) * TW, y = Math.floor(i / COLS) * (TH + LH);
    const buf = await sharp(path.join(DIR, 'cache', it.cache)).resize(TW - 6, TH - 6, { fit: 'contain', background: '#ffffff' }).toBuffer();
    comps.push({ input: buf, left: x + 3, top: y + 3 });
    const n = p * PER + i + 1;
    comps.push({ input: Buffer.from(`<svg width="${TW}" height="${LH}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#2b1340"/><text x="6" y="22" font-family="Arial" font-size="15" fill="#fff">${n}. ${xml(it.slug.slice(0, 30))}</text></svg>`), left: x, top: y + TH });
    console.log(`${n}. ${it.slug} | ${it.titulo} | ${it.licencia} | lum ${it.lum}`);
  }
  await sharp({ create: { width: COLS * TW, height: rows * (TH + LH), channels: 3, background: '#dddddd' } }).composite(comps).png().toFile(path.join(DIR, 'cache', `hoja-${p + 1}.png`));
}
console.log('Hojas:', Math.ceil(items.length / PER));
