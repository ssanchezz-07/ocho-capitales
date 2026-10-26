// Ocho Capitales · rutas: genera listas/cordoba.json (formato común de listas) y la parte automática de alias-calles-cordoba.json.
// Las calles salen de ../listas-cordoba.json (rejilla oficial de la Agrupación 2026 + guías de El Debate 2026, ver
// PROGRESO-RUTAS-CORDOBA.md); las sedes, de ../casas-hermandad-cordoba.json (con su fuente).
// - calles: sede de salida, elementos de la lista y sede de entrada. Nombres literales de las fuentes.
// - horas: las oficiales de la rejilla (salida, carrera oficial, Catedral, entrada) y, para cada calle, la fila de la rejilla
//   en la que la cruz de guía pasa por ella (un punto oficial cada 10 minutos).
// - catedral: las que salen del Patio de los Naranjos por la puerta del Perdón (la rejilla o la prensa lo dicen) en vez de
//   por la de Santa Catalina.
// - alias: el templo de cada sede → su edificio en OSM («osm:») o su punto («geo:», cuando OSM solo tiene un nodo o lo da
//   Wikidata); y los nombres abreviados de la rejilla («C/ NTRA. SRA.…») → el nombre desarrollado, si así existe en OSM.
// Los alias escritos a mano en alias-calles-cordoba.json se respetan (solo se añaden los que faltan).
// Uso: node lista-cordoba.mjs
import fs from 'node:fs';
import path from 'node:path';
import { RUTAS, ITI, sn, clave } from './comun.mjs';

const L = JSON.parse(fs.readFileSync(path.join(ITI, 'listas-cordoba.json'), 'utf8')).hermandades;
const S = JSON.parse(fs.readFileSync(path.join(ITI, 'casas-hermandad-cordoba.json'), 'utf8'));
const OSM = JSON.parse(fs.readFileSync(path.join(ITI, 'cache', 'osm-cordoba.json'), 'utf8')).elements;
const fAlias = path.join(ITI, 'alias-calles-cordoba.json');
const alias = fs.existsSync(fAlias) ? JSON.parse(fs.readFileSync(fAlias, 'utf8')) : {};
const PERDON = 11613100948; // nodo OSM «Puerta del Perdón» (entrance=main) de la Mezquita-Catedral

const hhmm = (h) => { const m = String(h).match(/^(\d{1,2}):(\d{2})$/); return m ? m[1].padStart(2, '0') + ':' + m[2] : null; };
// templos de OSM con geometría y nombre (los que comun.mjs puede usar como edificio)
const templos = OSM.filter((e) => e.tags?.name && e.geometry && (e.tags.amenity === 'place_of_worship' || /iglesia|parroquia|basilica|capilla|ermita|santuario|oratorio|abadia/.test(sn(e.tags.name))));
const aliasTemplo = (t, sede) => {
  if (!sede?.punto) return null;
  const e = sede.osm && /^[WR]/.test(sede.osm) ? templos.find((x) => x.type[0].toUpperCase() + x.id === sede.osm) : null;
  if (e && templos.filter((x) => sn(x.tags.name) === sn(e.tags.name)).length === 1) return 'osm:' + e.tags.name;
  return 'geo:' + sede.punto.join(',');
};
// nombres de calle de OSM (para saber si un nombre desarrollado existe)
const clavesOSM = new Set(OSM.filter((e) => e.type === 'way' && e.tags?.name).flatMap((e) => ['name', 'official_name', 'alt_name'].filter((k) => e.tags[k]).flatMap((k) => e.tags[k].split(';').map(clave))));
const DESARROLLO = [[/^C\/\s*/i, 'Calle '], [/^AVDA?\.?\s+|^AVD\.?\s+|^AV\.\s*/i, 'Avenida '], [/^PZA\.?\s+|^PLZ\.?\s+/i, 'Plaza '], [/^PSO\.?\s+/i, 'Paseo '], [/^CTRA\.?\s+/i, 'Carretera '],
  [/\bNTRA\.?\s*/gi, 'Nuestra '], [/\bSRA\.?\s*/gi, 'Señora '], [/\bSTMO\.?\s*/gi, 'Santísimo '], [/\bSTA\.?\s+/gi, 'Santa '], [/\bGLEZ\.?\s*/gi, 'González '], [/\bJ\.Mª\.?\s*/g, 'José María ']];
const desarrollar = (t) => DESARROLLO.reduce((s, [re, r]) => s.replace(re, r), t).replace(/\s+/g, ' ').trim();

const out = { capital: 'cordoba', fuente: 'https://www.hermandadesdecordoba.es/itinerario-2026/', origen: 'tools/itinerarios/listas-cordoba.json: rejilla oficial de la Agrupación 2026 + guías de El Debate 2026 (ver PROGRESO-RUTAS-CORDOBA.md)', hermandades: {} };
let nAlias = 0;
for (const [id, h] of Object.entries(L)) {
  const sede = S[id];
  const tS = sede?.salida?.templo || sede?.templo || 'Salida', tE = sede?.templo || 'Entrada';
  const el = h.elementos.filter((e) => e.tipo !== 'salida' && e.tipo !== 'entrada');
  const eS = h.elementos.find((e) => e.tipo === 'salida'), eE = h.elementos.findLast((e) => e.tipo === 'entrada');
  const calles = [tS, ...el.map((e) => e.lugar), tE], horas = {}, hitos = [];
  const hora = (e) => hhmm(e?.hora || '') || hhmm(e?.cruz || '');
  if (hora(eS)) horas[0] = hora(eS);
  el.forEach((e, k) => { const hh = hora(e); if (hh) horas[k + 1] = hh; if (e.tipo === 'entrada_co' || e.tipo === 'salida_co') hitos.push(k + 1); });
  if (hhmm(eE?.hora || '') || hhmm(eE?.cruz || '')) horas[calles.length - 1] = hora(eE);
  const iSco = el.findIndex((e) => e.tipo === 'salida_co');
  const porPerdon = el.some((e) => e.tipo === 'salida_co' && /perd/i.test(e.lugar)) || h.salida_perdon || /perd[oó]n$/i.test(h.catedral_prensa?.at(-1) || '');
  const notas = [];
  if (h.diferencias.solo_prensa.length) notas.push('Solo en la guía de prensa: ' + h.diferencias.solo_prensa.join(', '));
  if (h.diferencias.solo_rejilla.length) notas.push('Solo en la rejilla oficial: ' + h.diferencias.solo_rejilla.join(', '));
  if (sede?.nota) notas.push(sede.nota);
  if (sede?.falta) notas.push(sede.falta);
  out.hermandades[id] = {
    // la URL de la rejilla primero: el plano enlaza la fuente de la primera hermandad como «documento de la fuente»
    fuente: [out.fuente, ...h.fuentes.slice(1).map((f) => f.replace(/^.*?(https?:\/\/\S+)$/, '$1'))].join(' · '), calles, horas, hitos,
    ...(iSco >= 0 ? { regreso_desde: iSco + 1 } : {}),
    ...(porPerdon ? { catedral: { sale: PERDON, nombre: 'de la puerta del Perdón al Patio de los Naranjos y salida por la misma puerta' } } : {}),
    ...(notas.length ? { notas } : {}),
  };
  // alias de las sedes
  for (const [t, sd] of [[tS, sede?.salida || sede], [tE, sede]]) { const a = aliasTemplo(t, sd); if (a && !alias['@' + t] && t !== 'Casa Hermandad') { alias['@' + t] = a; nAlias++; } }
  // alias de nombres abreviados de la rejilla
  for (const e of el) {
    if (e.tipo !== 'calle' || clavesOSM.has(clave(e.lugar)) || alias[e.lugar]) continue;
    const d = desarrollar(e.lugar);
    if (d !== e.lugar && clavesOSM.has(clave(d))) { alias[e.lugar] = d; nAlias++; }
  }
}
fs.mkdirSync(path.join(RUTAS, 'listas'), { recursive: true });
fs.writeFileSync(path.join(RUTAS, 'listas', 'cordoba.json'), JSON.stringify(out, null, 1));
fs.writeFileSync(fAlias, JSON.stringify(Object.fromEntries(Object.entries(alias).sort()), null, 1));
console.log(Object.keys(out.hermandades).length, 'hermandades →', path.join('listas', 'cordoba.json'), '·', nAlias, 'alias nuevos →', path.relative(process.cwd(), fAlias));
