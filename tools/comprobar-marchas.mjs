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
  for (const fs_ of Object.values(m.fuentes)) for (const f of fs_) if (!m.urls[f] && !(U.fuentes[f] && (U.fuentes[f].url || U.fuentes[f].privada))) err(m, `fuente «${f}» sin enlace`);
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
    // un sitio = una fuente: la revisión hecha con una ficha de Patrimonio Musical cuenta como Patrimonio Musical
    const sitio = (f) => { if (f !== 'rev') return f; const u = m.urls.rev || ''; let h = ''; try { h = new URL(u).hostname.replace(/^www\./, ''); } catch (e) { /* sin url */ } return h === 'patrimoniomusical.com' ? 'pm' : u && u === m.urls.mdpFicha ? 'mdp' : 'rev:' + h; };
    const fiables = new Set((m.fuentes.dedicatoria || []).filter((f) => FIABLE.has(f)).map(sitio));
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
// Duplicados (orden de Pablo, 27-oct: «No pueden haber marchas ni dedicatorias duplicadas»): la misma obra no puede estar en
// dos fichas. Misma obra = mismo título (sin artículo inicial) y mismo compositor (apellidos que casan sin contradecirse y
// nombres de pila compatibles, también con varios autores en otro orden) y formación igual o sin indicar. Dos versiones para
// formaciones distintas sí son fichas distintas (se distinguen por la formación).
{
  const kt = (t) => norm(t).replace(/^(el|la|los|las|a la|al|a)\s+/, '');
  const PILA = new Set('jose juan manuel francisco antonio miguel jesus javier luis pedro rafael carlos angel alberto david daniel pablo sergio maria ramon joaquin alejandro fernando jorge vicente andres enrique alfonso emilio eduardo salvador cristobal diego mario victor ignacio gabriel abel ivan oscar raul ruben sebastian perfecto agustin ana isaac primitivo benjamin gines gonzalo desiderio paco bienvenido dionisio nicolas adolfo alfonso fernando gustavo hector jacinto julio ricardo roberto tomas vicente victor alvaro jaime jorge'.split(' '));
  const ap = (a) => norm(a).split(' ').filter((w) => w.length >= 3 && !PILA.has(w) && !['del', 'los', 'las', 'san'].includes(w));
  const pil = (a) => norm(a).split(' ').filter((w) => PILA.has(w));
  const misma = (a, b) => {
    const x = ap(a.autor), y = ap(b.autor);
    if (!x.some((w) => y.includes(w))) return false;
    if (x.some((w) => !y.includes(w)) && y.some((w) => !x.includes(w))) return false;
    const pa = pil(a.autor), pb = pil(b.autor); if (pa.length && pb.length && !pa.some((w) => pb.includes(w))) return false;
    if (a.formacion && b.formacion && norm(a.formacion) !== norm(b.formacion)) return false;
    const ha = a.dedicatoria && a.dedicatoria.hermandad, hb = b.dedicatoria && b.dedicatoria.hermandad;
    return !(ha && hb && ha !== hb);
  };
  const g = new Map(); for (const m of U.marchas) { const k = kt(m.titulo); if (k) (g.get(k) || g.set(k, []).get(k)).push(m); }
  let dups = 0;
  for (const v of g.values()) for (let i = 0; i < v.length; i++) for (let j = i + 1; j < v.length; j++) if (misma(v[i], v[j])) { dups++; err(v[i], `duplicada con ${v[j].slug} («${v[j].titulo}», ${v[j].autor})`); }
  // dedicatorias repetidas: en una hermandad, la misma obra no puede salir dos veces
  const porH = new Map(); for (const m of U.marchas) if (m.dedicatoria && m.dedicatoria.hermandad) { const k = m.dedicatoria.hermandad + '|' + kt(m.titulo) + '|' + ap(m.autor).sort().join(' ') + '|' + norm(m.formacion); if (porH.has(k)) err(m, `dedicatoria repetida en ${m.dedicatoria.hermandad} (también ${porH.get(k)})`); else porH.set(k, m.slug); }
  console.log(`duplicados: ${dups}`);
}
// Bandas: dos fichas con el mismo nombre y la misma localidad son la misma banda partida en dos (Jesús Despojado, 27-oct)
{
  const vistas = new Map();
  for (const b of P.bandas) { const k = norm(b.nombre) + '|' + norm(b.localidad); if (vistas.has(k)) errores.push(`banda duplicada: ${b.slug} y ${vistas.get(k)} («${b.nombre}», ${b.localidad})`); else vistas.set(k, b.slug); }
  // nombres casi iguales: el mismo con la localidad pegada al final y sin localidad («… Despojado de Jaén», sin localidad)
  for (const b of P.bandas) { if (b.localidad) continue; const m = b.nombre.match(/^(.*)\s+de\s+(\S.*)$/); if (m && vistas.has(norm(m[1]) + '|' + norm(m[2]))) errores.push(`banda casi repetida: ${b.slug} y ${vistas.get(norm(m[1]) + '|' + norm(m[2]))} («${b.nombre}» sin localidad)`); }
}
// alias: no chocan con otra marcha
for (const m of U.marchas) for (const a of m.alias || []) if (slugs.has(a) && a !== m.slug) err(m, `alias ${a} es la dirección de otra marcha`);
// direcciones publicadas: siguen existiendo o redirigen
const sm = process.argv[2];
if (sm && fs.existsSync(sm)) {
  const vivos = [...fs.readFileSync(sm, 'utf8').matchAll(/\/marcha\/([^/<]+)\//g)].map((x) => x[1]);
  const al = new Set([...U.marchas.flatMap((m) => m.alias || []), ...Object.keys(U.redirecciones || {})]);
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
