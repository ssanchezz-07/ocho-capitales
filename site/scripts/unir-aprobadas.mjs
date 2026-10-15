// Ocho Capitales: une las revisiones a ojo (cache/aprobadas*.json: índice de la candidata elegida por hermandad)
// con site/data/titulares-candidatas.json y genera site/data/imagenes-titulares.json, que lee procesar-imagenes.mjs.
// Uso: cd site/scripts && node unir-aprobadas.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const CAND = JSON.parse(fs.readFileSync(path.join(DIR, '..', 'data', 'titulares-candidatas.json'), 'utf8')).hermandades;
const OUT = path.join(DIR, '..', 'data', 'imagenes-titulares.json');
const out = { revisado: new Date().toISOString().slice(0, 10), hermandades: {} };
const files = fs.readdirSync(path.join(DIR, 'cache')).filter((f) => /^aprobadas.*\.json$/.test(f)).sort();
let n = 0, err = 0;
for (const f of files) {
  const J = JSON.parse(fs.readFileSync(path.join(DIR, 'cache', f), 'utf8'));
  for (const [slug, sel] of Object.entries(J)) {
    if (slug.startsWith('_')) continue;
    const list = CAND[slug] || [];
    for (const tipo of ['cristo', 'virgen', 'juntos', 'sede']) {
      if (sel[tipo] == null) continue;
      const x = list[sel[tipo]];
      if (!x) { console.log('FALTA', slug, tipo, sel[tipo]); err++; continue; }
      const titular = sel['titular_' + tipo] || (tipo === 'juntos' ? '' : x.titular);
      (out.hermandades[slug] = out.hermandades[slug] || {})[tipo] = { pagina: x.pagina, titulo: x.titulo, autor: x.autor, licencia: x.licencia, licurl: x.licurl, titular };
      n++;
    }
  }
}
// Segunda ronda (data/segunda-candidatas.json): fotos del cortejo o de la sede, con su uso decidido a mano
const SEG_F = path.join(DIR, '..', 'data', 'segunda-candidatas.json'), SEG_A = path.join(DIR, 'cache', 'segunda-aprobadas.json');
if (fs.existsSync(SEG_F) && fs.existsSync(SEG_A)) {
  const SEG = JSON.parse(fs.readFileSync(SEG_F, 'utf8')).hermandades, AP = JSON.parse(fs.readFileSync(SEG_A, 'utf8'));
  const D = JSON.parse(fs.readFileSync(path.join(DIR, '..', '..', 'portal-cofrade', 'data', 'portal.json'), 'utf8'));
  const HS = Object.fromEntries(D.hermandades.map((h) => [h.slug, h]));
  for (const [slug, sel] of Object.entries(AP)) {
    if (slug.startsWith('_')) continue;
    for (const [i, uso] of sel) {
      const x = (SEG[slug] || [])[i]; if (!x) { console.log('FALTA', slug, i); err++; continue; }
      const h = HS[slug] || {};
      const titular = uso === 'sede' ? (h.sede || '') : uso === 'juntos' ? '' : ((h.titulares || []).find((t) => (uso === 'cristo') !== /\b(Mar[ií]a|Virgen|Nuestra Se[ñn]ora)\b/i.test(t.nombre)) || {}).nombre || '';
      const dest = (out.hermandades[slug] = out.hermandades[slug] || {});
      if (dest[uso]) continue; // la primera ronda (titulares) tiene prioridad
      dest[uso] = { pagina: x.pagina, titulo: x.titulo, autor: x.autor, licencia: x.licencia, licurl: x.licurl, titular };
      n++;
    }
  }
}
fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
const H = Object.values(out.hermandades);
console.log(`Imágenes aprobadas: ${n} en ${H.length} hermandades (díptico completo: ${H.filter((h) => (h.cristo && h.virgen) || h.juntos).length}); errores: ${err}`);
