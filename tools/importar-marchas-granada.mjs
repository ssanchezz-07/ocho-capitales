// Ocho Capitales: marchas dedicadas a las hermandades de Granada, leídas del apartado «Patrimonio musical» de la ficha de cada hermandad
// en la web de la Real Federación (hermandadesdegranada.com). Cada línea trae «Título. (Compositor, año) B.M.» y suele enlazar al vídeo de YouTube.
// El código del final manda para la formación: B.M. = banda de música, CC. Y TT. = cornetas y tambores, A.M. = agrupación musical, C.M. = capilla.
// Resultado: tools/sources/granada-marchas.json  { <slug de la ficha>: [{titulo, autor, anio, tipo, video}] }
// Uso: node tools/importar-marchas-granada.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const D = JSON.parse(fs.readFileSync(path.join(DIR, '..', 'portal-cofrade', 'data', 'portal.json'), 'utf8'));
const OUT = path.join(DIR, 'sources', 'granada-marchas.json');
const UA = 'OchoCapitales/1.0 (https://github.com/ssanchezz-07/ocho-capitales; portal cofrade sin animo de lucro)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const FORMACION = (c) => {
  const k = c.toUpperCase().replace(/[\s.]/g, '');
  if (/^(BM|BANDA)/.test(k)) return 'Banda de música';
  if (/^(CCYTT|CCTT|CT|CORNETAS)/.test(k)) return 'Banda de cornetas y tambores';
  if (/^(AM|AGRUPACION)/.test(k)) return 'Agrupación musical';
  if (/^(CM|CAPILLA)/.test(k)) return 'Capilla musical';
  return '';
};
const txt = (s) => s.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#8211;/g, '-').replace(/&#8217;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n)).replace(/\s+/g, ' ').trim();

export function parsea(html) {
  const i = html.search(/PATRIMONIO MUSICAL/i); if (i < 0) return [];
  const bloque = html.slice(i, i + 12000);
  const out = [];
  for (const p of bloque.split(/<\/p>|<br\s*\/?>/i)) {
    const video = (p.match(/watch\?v=([A-Za-z0-9_-]{11})/) || [])[1] || (p.match(/youtu\.be\/([A-Za-z0-9_-]{11})/) || [])[1] || '';
    // erratas conocidas de la web: paréntesis de apertura que falta
    const t = txt(p).replace(/^PATRIMONIO MUSICAL/i, '').trim().replace('El Misterio de la Fe Manuel Jesús', 'El Misterio de la Fe (Manuel Jesús');
    // «Título. (Autor, 2008) B.M.»  ·  año opcional o «??»  ·  solo «Título. A.M.» (sin autor)
    let m = t.match(/^(.+?)[.,]?\s*\((.+?)(?:,\s*(\d{4}|\?+))?\)\s*(.*)$/);
    let titulo, autor, anio, cod;
    if (m) { titulo = m[1]; autor = m[2].replace(/,?\s*\?+$/, ''); anio = /^\d{4}$/.test(m[3] || '') ? m[3] : ''; cod = m[4]; }
    else { m = t.match(/^(.+?)[.,]?\s+((?:B\.\s?M\.|C\.?\s?C\.?\s?(?:y|Y)?\s?T\.?\s?T\.?|A\.\s?M\.|C\.\s?M\.))\s*$/); if (!m) continue; titulo = m[1]; autor = ''; anio = ''; cod = m[2]; }
    titulo = titulo.replace(/[.,\s]+$/, '').trim(); if (!titulo || titulo.length > 90) continue;
    autor = autor.replace(/[.\s]+$/, '').trim();
    out.push({ titulo, autor, anio, tipo: FORMACION(cod), video });
  }
  return out;
}

if (process.argv[1] && import.meta.url === new URL('file:///' + process.argv[1].split('\\').join('/')).href) {
  const prev = JSON.parse(fs.readFileSync(OUT, 'utf8')); const out = {};
  for (const h of D.hermandades.filter((x) => x.ciudad === 'granada' && /hermandadesdegranada\.com/.test(x.fuente_url || ''))) {
    const key = h.fuente_url.replace(/\/$/, '').split('/').pop();
    let html = ''; try { html = await (await fetch(h.fuente_url, { headers: { 'User-Agent': UA } })).text(); } catch (e) { /* se conserva lo anterior */ }
    const ms = parsea(html);
    if (ms.length) out[key] = ms; else if (prev[key]) out[key] = prev[key];
    await sleep(500);
  }
  fs.writeFileSync(OUT, JSON.stringify(out));
  let n = 0, c = {}, v = 0; for (const a of Object.values(out)) for (const m of a) { n++; c[m.tipo] = (c[m.tipo] || 0) + 1; if (m.video) v++; }
  console.log(Object.keys(out).length, 'hermandades;', n, 'marchas;', v, 'con vídeo;', c);
}
