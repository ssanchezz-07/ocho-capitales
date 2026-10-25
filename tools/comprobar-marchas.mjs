// Ocho Capitales: comprobación repetible del modelo único de marchas (tools/sources/marchas.json).
// Falla (código 1) si encuentra un error; los avisos son para revisar a mano. Se pasa antes de cada subida.
// Uso: node tools/comprobar-marchas.mjs [sitemap.xml]   (con el sitemap publicado, comprueba que ninguna dirección de marcha se pierde)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.join(DIR, '..');
const P = JSON.parse(fs.readFileSync(path.join(RAIZ, 'portal-cofrade/data/portal.json'), 'utf8'));
const U = JSON.parse(fs.readFileSync(path.join(DIR, 'sources/marchas.json'), 'utf8'));
const ESP = JSON.parse(fs.readFileSync(path.join(DIR, 'sources/marchas-espana.json'), 'utf8'));
const HERM = Object.fromEntries(P.hermandades.map((h) => [h.slug, h]));
const CAPS = Object.fromEntries(P.capitales.map((c) => [c.slug, c.nombre]));
const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
const FIABLE = new Set(Object.entries(U.fuentes).filter(([, f]) => f.fiable).map(([k]) => k));
const errores = [], avisos = [];
const err = (m, t) => errores.push(`${m.slug}: ${t}`), av = (m, t) => avisos.push(`${m.slug}: ${t}`);
const caidos = new Set(ESP.marchas.filter((e) => e.caido).map((e) => e.video));
const slugs = new Set();

for (const m of U.marchas) {
  if (!m.slug || slugs.has(m.slug)) err(m, 'dirección vacía o repetida'); slugs.add(m.slug);
  if (!m.titulo) err(m, 'sin título');
  // cada dato que se enseña tiene al menos una fuente, y cada fuente un enlace
  for (const c of ['titulo', 'autor', 'anio', 'formacion', 'video']) if (m[c] && !(m.fuentes[c] || []).length) err(m, `«${c}» sin fuente`);
  for (const fs_ of Object.values(m.fuentes)) for (const f of fs_) if (!m.urls[f] && !(U.fuentes[f] && U.fuentes[f].url)) err(m, `fuente «${f}» sin enlace`);
  if (m.video && caidos.has(m.video)) err(m, 'enlaza un vídeo retirado de YouTube');
  if (m.anio && !/^\d{4}$/.test(m.anio)) err(m, `año raro: ${m.anio}`);
  if (m.anio && (+m.anio < 1800 || +m.anio > new Date().getFullYear() + 1)) av(m, `año fuera de rango: ${m.anio}`);
  const dAnio = (m.discrepancias || []).find((d) => d.campo === 'anio');
  if (dAnio && m.anio && !dAnio.elegido) err(m, 'año con discrepancia sin fuente elegida');
  const d = m.dedicatoria;
  if (d && d.hermandad) {
    const h = HERM[d.hermandad];
    if (!h) { err(m, `dedicada a una hermandad que no está en el portal: ${d.hermandad}`); continue; }
    if (d.ciudad !== h.ciudad) err(m, `ciudad de la dedicatoria (${d.ciudad}) distinta de la de la hermandad (${h.ciudad})`);
    const fiables = new Set((m.fuentes.dedicatoria || []).filter((f) => FIABLE.has(f)));
    const esperado = fiables.size >= 2 ? 'contrastada' : fiables.size === 1 ? 'dedicada' : 'sin-verificar';
    if (d.estado !== esperado) err(m, `estado «${d.estado}» y sus fuentes dicen «${esperado}»`);
    // la dedicatoria no puede nombrar otra capital y no la suya
    const t = ' ' + norm(d.texto) + ' ';
    const otras = Object.entries(CAPS).filter(([s, n]) => s !== h.ciudad && t.includes(' ' + norm(n) + ' '));
    if (otras.length && !t.includes(' ' + norm(CAPS[h.ciudad]) + ' ')) err(m, `la dedicatoria nombra ${otras.map((o) => o[1]).join(', ')}: «${d.texto}»`);
    if (d.titular && !(h.titulares || []).some((x) => x.nombre === d.titular)) err(m, `titular «${d.titular}» que no es de ${h.nombre}`);
    if (d.estado === 'sin-verificar') av(m, `sin verificar (${(m.fuentes.dedicatoria || []).join('+')}) → ${h.nombre}`);
  }
  for (const r of m.retiradas || []) if (!r.motivo || !r.fuente) err(m, `retirada de ${r.hermandad} sin motivo o sin fuente`);
  for (const r of m.revision || []) if (!/^https?:\/\//.test(r.url || '')) err(m, 'revisión a mano sin URL de la fuente');
}
// alias: no chocan con otra marcha
for (const m of U.marchas) for (const a of m.alias || []) if (slugs.has(a) && a !== m.slug) err(m, `alias ${a} es la dirección de otra marcha`);
// direcciones publicadas: siguen existiendo o redirigen
const sm = process.argv[2];
if (sm && fs.existsSync(sm)) {
  const vivos = [...fs.readFileSync(sm, 'utf8').matchAll(/\/marcha\/([^/<]+)\//g)].map((x) => x[1]);
  const al = new Set(U.marchas.flatMap((m) => m.alias || []));
  const perdidas = vivos.filter((s) => !slugs.has(s) && !al.has(s));
  if (perdidas.length) errores.push(`${perdidas.length} direcciones publicadas se pierden: ${perdidas.slice(0, 5).join(', ')}`);
  else console.log(`direcciones publicadas: ${vivos.length}, todas cubiertas`);
}
const r = U.resumen;
console.log(`marchas ${r.marchas} · ligadas ${r.ligadas} en ${r.hermandades} hermandades (contrastadas ${r.contrastadas}, dedicadas ${r.dedicadas}, sin verificar ${r.sin_verificar}) · retiradas ${r.retiradas}`);
console.log(`errores ${errores.length} · avisos ${avisos.length}`);
for (const e of errores.slice(0, 40)) console.log('ERROR', e);
if (process.argv.includes('--avisos')) for (const a of avisos) console.log('aviso', a);
process.exit(errores.length ? 1 : 0);
