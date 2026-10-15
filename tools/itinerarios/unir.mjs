// Ocho Capitales: empareja las columnas leídas de los PDF de itinerarios (<ciudad>-2026.json) con las hermandades
// del portal (misma ciudad y jornada, nombre parecido) y genera tools/sources/itinerarios-2026.json.
// Cada hermandad: fuente, jornada, y una o dos secuencias (cruz de guía / paso o palio) de puntos {fila, lugar, hora?}.
// Lo que no se empareja con seguridad se lista en «sin_emparejar» para revisarlo a mano.
// Uso: node tools/itinerarios/unir.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const D = JSON.parse(fs.readFileSync(path.join(DIR, '..', '..', 'portal-cofrade', 'data', 'portal.json'), 'utf8'));
const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
const STOP = new Set(['la', 'el', 'los', 'las', 'de', 'del', 'y', 'e', 'en', 'parr', 'parroquia', 'iglesia', 'ig', 'cap', 'capilla', 'san', 's', 'sta', 'santa', 'santo', 'hermandad', 'hdad', 'nuestra', 'senora', 'nuestro', 'padre', 'maria', 'santisima', 'santisimo', 'cristo', 'jesus', 'basilica', 'conv', 'convento', 'casa', 'colegial', 'real', 'menor', 'mayor', 'cofradia']);
const toks = (s) => new Set(norm(s).split(' ').filter((t) => t.length > 1 && !STOP.has(t)));
const DIA = { 'VIERNES DE DOLORES': 'Viernes de Dolores', 'SÁBADO DE PASIÓN': 'Sábado de Pasión', 'DOMINGO DE RAMOS': 'Domingo de Ramos', 'LUNES SANTO': 'Lunes Santo', 'MARTES SANTO': 'Martes Santo', 'MIÉRCOLES SANTO': 'Miércoles Santo', 'JUEVES SANTO': 'Jueves Santo', 'MADRUGADA': 'Madrugá', 'MADRUGÁ': 'Madrugá', 'VIERNES SANTO': 'Viernes Santo', 'SÁBADO SANTO': 'Sábado Santo', 'DOMINGO DE RESURRECCIÓN': 'Domingo de Resurrección' };
const FUENTES = [
  ['granada', 'granada-2026.json', 'Programa «El Llamador» de Canal Sur Radio, Semana Santa de Granada 2026'],
  ['almeria', 'almeria-2026.json', 'Programa «Pasión» de Canal Sur Radio, Semana Santa de Almería 2026 (horarios de la Agrupación)'],
  ['huelva', 'huelva-2026.json', 'Programa «El Llamador» de Canal Sur Radio, Semana Santa de Huelva 2026'],
  ['jaen', 'jaen-2026.json', 'Programa «Nazareno» de Canal Sur Radio, Semana Santa de Jaén 2026'],
  ['malaga', 'malaga-acc-2026.json', 'Itinerarios oficiales de la Agrupación de Cofradías de Málaga 2026'],
  ['sevilla', 'sevilla-2026.json', 'Programa de Canal Sur Radio, Semana Santa de Sevilla 2026'],
  ['sevilla', 'sevilla-cgh-2026.json', 'Horarios e itinerarios de Sevilla 2026 (vísperas y jornadas)'],
  ['cordoba', 'cordoba-2026.json', 'Itinerario oficial de la Agrupación de Hermandades y Cofradías de Córdoba 2026'],
  ['cadiz', 'cadiz-2026.json', 'Programa de Canal Sur Radio, Semana Santa de Cádiz 2026 (itinerarios del Consejo)'],
];
// Cádiz: el itinerario es una lista de calles sin horas; las horas de salida, catedral y entrada vienen en la ficha
function horasCadiz(J, c) {
  if (!J.horas) return c;
  const t = toks(c.cabecera);
  const h = J.horas.map((x) => [x, [...t].filter((k) => toks(x.cerca).has(k)).length]).sort((a, b) => b[1] - a[1])[0];
  if (!h || !h[1]) return c;
  const v = h[0].horas, pts = c.puntos.map((p) => ({ ...p }));
  if (v.salida && v.salida[0] && pts[0]) pts[0].hora = v.salida[0];
  const cat = pts.find((p) => p.catedral); if (cat && v.catedral && v.catedral[0]) cat.hora = v.catedral[0];
  const fin = pts[pts.length - 1]; if (fin && v.entrada && v.entrada.length) fin.hora = v.entrada[v.entrada.length - 1];
  return { ...c, puntos: pts };
}

function puntuar(h, cab) {
  const a = toks(cab.replace(/CRUZ DE GU[IÍ]+A|FINAL DEL CORTEJO|MISTERIO|PALIO|PASO/gi, ' ')), b = new Set([...toks(h.sede)]);
  const tit = new Set((h.titulares || []).flatMap((t) => [...toks(t.nombre.split(',')[0])]));
  // el identificador corto (mena-malaga, columna…) recoge el nombre popular que usan las guías
  const n = new Set([...toks(h.nombre), ...toks(h.slug.replace(/-/g, ' ').replace(new RegExp(' ' + h.ciudad + '$'), ''))]);
  // nombre o alias: 3 · advocación de un titular (la guía rotula «PAZ», «PRIMER DOLOR»…): 2 · sede: 1
  let s = 0; for (const t of a) { if (n.has(t)) s += 3; else if (tit.has(t)) s += 2; else if (b.has(t)) s += 1; }
  if (norm(cab).includes(norm(h.nombre).replace(/^(la|el|los|las) /, ''))) s += 4;
  return s;
}

const out = { generado: new Date().toISOString(), anio: 2026, hermandades: {}, sin_emparejar: [] };
for (const [ciudad, f, fuente] of FUENTES) {
  const p = path.join(DIR, f); if (!fs.existsSync(p)) continue;
  const J = JSON.parse(fs.readFileSync(p, 'utf8'));
  const hs = D.hermandades.filter((h) => h.ciudad === ciudad);
  for (const c0 of J.columnas) {
    const c = ciudad === 'cadiz' ? horasCadiz(J, c0) : c0;
    const dia = DIA[c.dia] || null;
    let cands = hs.filter((h) => !dia || h.dia === dia || (dia === 'Madrugá' && /Madrug/.test(h.dia)) || (dia === 'Jueves Santo' && /Jueves/.test(h.dia)));
    if (!cands.length) cands = hs;
    let best = cands.map((h) => [h, puntuar(h, c.cabecera)]).sort((x, y) => y[1] - x[1]);
    // si la jornada leída no cuadra (página mal etiquetada), se busca en toda la ciudad
    if (!best.length || best[0][1] < 3) best = hs.map((h) => [h, puntuar(h, c.cabecera)]).sort((x, y) => y[1] - x[1]);
    if (!best.length || best[0][1] < 2 || (best[1] && best[1][1] >= best[0][1] - 0.5)) { out.sin_emparejar.push({ ciudad, dia: c.dia, cabecera: c.cabecera, sub: c.sub, opciones: best.slice(0, 3).map(([h, s]) => h.slug + ':' + s) }); continue; }
    const h = best[0][0];
    const e = (out.hermandades[h.slug] = out.hermandades[h.slug] || { ciudad, dia: h.dia, fuente, pdf: J.fuente, tramos: {} });
    const sub = c.sub ? (/cruz/.test(c.sub) ? 'cruz de guía' : /final/.test(c.sub) ? 'final del cortejo' : /palio|virgen/.test(c.sub) ? 'palio' : 'paso') : 'paso';
    if (!e.tramos[sub] || e.tramos[sub].length < c.puntos.length) e.tramos[sub] = c.puntos;
  }
}
const OUT = path.join(DIR, '..', 'sources', 'itinerarios-2026.json');
fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
const por = {}; for (const e of Object.values(out.hermandades)) por[e.ciudad] = (por[e.ciudad] || 0) + 1;
console.log('Con itinerario:', Object.keys(out.hermandades).length, JSON.stringify(por), '· sin emparejar:', out.sin_emparejar.length);
for (const s of out.sin_emparejar) console.log('  ?', s.ciudad, s.dia, '|', s.cabecera, s.sub || '', '→', s.opciones.join(' '));
