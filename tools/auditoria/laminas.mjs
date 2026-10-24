// Ocho Capitales · auditoría: una lámina por capital y jornada con TODOS sus recorridos dibujados desde los datos
// (site/data/recorridos + site/data/planos), para revisarlos a ojo sin depender de la hora del plano.
// Rojo discontinuo = tramo de más de 350 m en recta (sin seguir calles); círculo rojo = punto sin calle (estimado).
// Uso: node tools/auditoria/laminas.mjs   → auditoria/laminas/<ciudad>-<jornada>.png
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const RAIZ = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const sharp = createRequire(path.join(RAIZ, 'site', 'scripts') + '/')('sharp');
const OUT = path.join(RAIZ, 'auditoria', 'laminas'); fs.mkdirSync(OUT, { recursive: true });
const COL = ['#e6194b', '#3cb44b', '#4363d8', '#f58231', '#911eb4', '#42d4f4', '#f032e6', '#9a6324', '#469990', '#808000', '#000075', '#e6beff', '#aaffc3', '#ffd8b1', '#800000', '#bfef45'];
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const slug = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z]+/g, '-');
const dist = (a, b) => { const kx = 111320 * Math.cos(((a[0] + b[0]) / 2) * Math.PI / 180); return Math.hypot((a[1] - b[1]) * kx, (a[0] - b[0]) * 110540); };
let n = 0;
for (const f of fs.readdirSync(path.join(RAIZ, 'site/data/recorridos')).sort()) {
  const c = f.replace('.json', '');
  const R = JSON.parse(fs.readFileSync(path.join(RAIZ, 'site/data/recorridos', f), 'utf8'));
  const PL = JSON.parse(fs.readFileSync(path.join(RAIZ, 'site/data/planos', f), 'utf8'));
  const [la0, lo0] = PL.origen; const xy = ([la, lo]) => [(lo - lo0) * PL.kx, (la0 - la) * PL.ky];
  const jornadas = {};
  for (const [s, h] of Object.entries(R.hermandades)) (jornadas[h.dia] ||= []).push([s, h]);
  for (const [s, h] of Object.entries(R.extraordinarias || {})) (jornadas['Extraordinaria ' + (h.fecha || s)] ||= []).push([s, h]);
  for (const [dia, hs] of Object.entries(jornadas)) {
    const capas = []; let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    const ext = (p) => { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); };
    hs.forEach(([s, h], i) => {
      const col = COL[i % COL.length]; const lin = []; const marcas = []; let ini = null;
      for (const pts of Object.values(h.tramos)) {
        const sit = pts.filter((p) => p.lat != null);
        for (let k = 0; k < sit.length; k++) {
          const p = sit[k], q = sit[k + 1]; const a = xy([p.lat, p.lon]); ext(a); if (!ini) ini = a;
          if (p.como === 'estimado') marcas.push(`<circle cx="${a[0]}" cy="${a[1]}" r="18" fill="none" stroke="#d00" stroke-width="6"/>`);
          if (!q) continue;
          const via = (p.via && p.via.length > 2) ? p.via : null;
          if (via) lin.push(`<polyline points="${via.map(xy).map((v) => v.join(',')).join(' ')}" fill="none" stroke="${col}" stroke-width="12" stroke-opacity=".85"/>`);
          else { const b = xy([q.lat, q.lon]); const d = dist([p.lat, p.lon], [q.lat, q.lon]); lin.push(`<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="${d > 350 ? '#d00' : col}" stroke-width="${d > 350 ? 10 : 12}" ${d > 350 ? 'stroke-dasharray="40 25"' : ''}/>`); }
        }
      }
      capas.push({ s, col, lin, marcas, ini, sin: Object.values(h.tramos).flat().filter((p) => p.lat == null).length });
    });
    if (!isFinite(x0)) continue;
    const m = 0.08 * Math.max(x1 - x0, y1 - y0, 800); x0 -= m; y0 -= m; x1 += m; y1 += m;
    const W = x1 - x0, H = y1 - y0, px = 1600, ph = Math.round(px * H / W), sw = W / px;
    const enCaja = (arr) => arr.some((v, i) => i % 2 === 0 && v > x0 && v < x1 && arr[i + 1] > y0 && arr[i + 1] < y1);
    const calles = PL.calles.filter(enCaja).map((a) => `<polyline points="${a.join(' ')}"/>`).join('');
    const princ = PL.principales.filter(enCaja).map((a) => `<polyline points="${a.join(' ')}"/>`).join('');
    const ley = capas.map((k, i) => `<g transform="translate(${x0 + 30 * sw},${y0 + (40 + i * 34) * sw}) scale(${sw})"><rect width="26" height="26" fill="${k.col}"/><text x="36" y="21" font-size="24" font-family="Arial" fill="#000" stroke="#fff" stroke-width="5" paint-order="stroke">${esc(k.s)}${k.sin ? ` · ${k.sin} sin situar` : ''}</text></g>`).join('');
    const tit = `<text x="${x0 + 30 * sw}" y="${y0 + 26 * sw}" font-size="${26 * sw}" font-family="Arial" font-weight="bold">${esc(c + ' · ' + dia + ' · ' + capas.length + ' recorridos')}</text>`;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${ph}" viewBox="${x0} ${y0} ${W} ${H}"><rect x="${x0}" y="${y0}" width="${W}" height="${H}" fill="#fff"/><g fill="none" stroke="#ddd" stroke-width="${2 * sw}">${calles}</g><g fill="none" stroke="#aaa" stroke-width="${4 * sw}">${princ}</g>${capas.map((k) => k.lin.join('')).join('')}${capas.map((k) => k.marcas.join('') + (k.ini ? `<circle cx="${k.ini[0]}" cy="${k.ini[1]}" r="${9 * sw}" fill="${k.col}" stroke="#000" stroke-width="${2 * sw}"/>` : '')).join('')}${tit}${ley}</svg>`;
    await sharp(Buffer.from(svg)).png().toFile(path.join(OUT, `${c}-${slug(dia)}.png`)); n++;
  }
}
console.log(n, 'láminas en', OUT);
