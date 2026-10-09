// Ocho Capitales: marchas dedicadas a las cofradías de Málaga, del listado «Marchas procesionales de Málaga» del foro de Patrimonio Musical
// (https://www.patrimoniomusical.com/foro/viewtopic.php?t=1959, primer mensaje: una lista por día y hermandad, «- Título, de Compositor»).
// Es una lista de aficionados de 2008: trae título, compositor y hermandad, pero no el año ni la formación; se publica con esa fuente y sin inventar lo que falta.
// Resultado: tools/sources/marchas-malaga.json  { <slug>: {fuente_url, marchas:[{titulo, autor}]} }
// Uso: node tools/importar-marchas-malaga.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const URL_FORO = 'https://www.patrimoniomusical.com/foro/viewtopic.php?t=1959';
const OUT = path.join(DIR, 'sources', 'marchas-malaga.json');
const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();

// encabezado del foro (sin «Hermandad de …») → slug de la cofradía en el portal
export const SLUGS = {
  'pollinica': 'pollinica', 'huerto': 'huerto', 'dulce nombre': 'dulce-nombre', 'salutacion': 'salutacion', 'salud': 'salud', 'prendimiento': 'prendimiento', 'humildad': 'humildad',
  'crucifixion': 'crucifixion', 'gitanos': 'gitanos', 'dolores del puente': 'dolores-del-puente', 'pasion': 'pasion', 'estudiantes': 'estudiantes', 'cautivo': 'cautivo',
  'nueva esperanza': 'nueva-esperanza', 'penas': 'penas', 'estrella': 'humillacion-y-estrella', 'rescate': 'rescate', 'sentencia': 'sentencia', 'rocio': 'rocio',
  'salesianos': 'salesianos', 'fusionadas': 'fusionadas', 'paloma': 'paloma', 'rico': 'el-rico', 'sangre': 'sangre', 'expiracion': 'expiracion',
  'santa cruz': 'santa-cruz', 'cena': 'sagrada-cena', 'vineros': 'vineros', 'mena': 'mena', 'misericordia': 'misericordia', 'zamarrilla': 'zamarrilla', 'esperanza': 'esperanza',
  'dolores de san juan': 'dolores-de-san-juan', 'descendimiento': 'descendimiento', 'monte calvario': 'monte-calvario', 'traslado': 'traslado', 'amor': 'amor', 'piedad': 'piedad',
  'sepulcro': 'santo-sepulcro', 'mediadora': 'mediadora', 'humildad y paciencia': 'humildad-y-paciencia',
};

export function parseForo(texto) {
  const lineas = texto.split('\n').map((l) => l.trim());
  const ini = lineas.findIndex((l) => l === 'DOMINGO DE RAMOS'); if (ini < 0) return {};
  let fin = lineas.findIndex((l, i) => i > ini && /^MARCHAS GENERALES/.test(l)); if (fin < 0) fin = lineas.length;
  const res = {}; let slug = null;
  for (const l of lineas.slice(ini, fin)) {
    if (/^(DOMINGO DE RESURRECCI[OÓ]N)$/.test(l)) { slug = 'resucitado-malaga'; continue; }
    const h = l.match(/^(?:HERMANDAD(?:ES)?|CONGREGACI[OÓ]N|COFRAD[IÍ]A|ARCHICOFRAD[IÍ]A)\s+(?:DE LA|DE LAS|DE LOS|DEL|DE)\s+(.+)$/);
    if (h) { const k = norm(h[1]); slug = SLUGS[k] ? SLUGS[k] + '-malaga' : null; continue; }
    if (/^[A-ZÁÉÍÓÚÑ ]{6,}$/.test(l)) { slug = null; continue; } // otro encabezado (día, gloria…)
    if (!slug || !/^-\s*/.test(l)) continue;
    const t = l.replace(/^-\s*/, '').replace(/\.$/, '');
    const c = t.lastIndexOf(','); if (c < 2) continue;
    const titulo = t.slice(0, c).trim(); const autor = t.slice(c + 1).trim().replace(/^(?:de|del|d\.)\s+/i, '');
    if (!titulo || !autor || titulo.length > 90 || autor.length > 70) continue;
    (res[slug] = res[slug] || []).push({ titulo, autor });
  }
  return res;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const html = await (await fetch(URL_FORO, { headers: { 'User-Agent': 'OchoCapitales/1.0 (https://github.com/ssanchezz-07/ocho-capitales)' } })).text();
  const m = html.match(/<div class="content">[\s\S]*?<\/div>/i) || [html];
  const texto = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, '').replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|div|li|h\d|tr)>/gi, '\n').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n)).replace(/&[a-z]+;/g, '');
  const r = parseForo(texto);
  const out = {}; let n = 0;
  for (const [slug, ms] of Object.entries(r)) { out[slug] = { fuente_url: URL_FORO, marchas: ms }; n += ms.length; }
  fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
  console.log(Object.keys(out).length, 'cofradías;', n, 'marchas');
}
