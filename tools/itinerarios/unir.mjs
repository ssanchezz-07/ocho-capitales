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
  // nombre completo contenido en la cabecera, como palabras enteras («MISERICORDIA» no contiene a «Rico»)
  if ((' ' + norm(cab) + ' ').includes(' ' + norm(h.nombre).replace(/^(la|el|los|las) /, '') + ' ')) s += 4;
  return s;
}

// ---------- Málaga: horas oficiales de la Agrupación (Horarios_ACC) ----------
// Cada ficha trae el nombre oficial completo, las horas de SALIDA, TRIBUNA, TORRE SUR, CATEDRAL y ENCIERRO y el
// itinerario completo. Se empareja con la hermandad de la misma jornada por nombre, titulares y sede (asignación única).
const ETIQ = { salida: 'Salida', tribuna: 'Tribuna', torre_sur: 'Torre Sur', catedral: 'Catedral', encierro: 'Encierro' };
const minutos = (h) => { const [a, b] = String(h).split(':').map(Number); return (a < 6 ? a + 24 : a) * 60 + b; };
function puntuarFicha(h, cab) {
  const a = toks(cab), nom = toks(h.nombre), ali = toks(h.slug.replace(/-/g, ' ').replace(/ malaga$/, ''));
  const tit = new Set((h.titulares || []).flatMap((t) => [...toks(t.nombre)])), sede = toks(h.sede);
  let s = 0; for (const t of a) { if (nom.has(t) || ali.has(t)) s += 3; if (tit.has(t)) s += 1; if (sede.has(t)) s += 1; }
  // apodo entre paréntesis en la ficha: (Pollinica), (Servitas), (RR.CC. Fusionadas)…
  const ap = (cab.match(/\(([^)]+)\)/g) || []).map((x) => norm(x));
  if (ap.some((x) => x.includes(norm(h.nombre)) || norm(h.nombre).includes(x))) s += 6;
  return s;
}
function emparejarFichas(fichas, hs) {
  const pares = [];
  for (const f of fichas) {
    const dia = DIA[f.dia];
    for (const h of hs.filter((h) => h.dia === dia)) pares.push([f, h, puntuarFicha(h, f.cabecera)]);
  }
  pares.sort((x, y) => y[2] - x[2]);
  const usadaF = new Set(), usadaH = new Set(), res = [];
  for (const [f, h, s] of pares) {
    if (s < 3 || usadaF.has(f) || usadaH.has(h.slug)) continue;
    usadaF.add(f); usadaH.add(h.slug); res.push([f, h, s]);
  }
  return { res, sueltas: fichas.filter((f) => !usadaF.has(f)) };
}
// Pone las horas oficiales en los puntos de la rejilla (Salida, Tribuna, Torre Sur, Catedral, Encierro); si la rejilla no
// tiene ese punto, lo añade en su sitio por orden horario. Devuelve cuántas horas puso o corrigió.
function horasEnRejilla(pts, horas) {
  let n = 0;
  for (const [k, et] of Object.entries(ETIQ)) {
    const v = horas[k]; if (!v || !v.length) continue;
    const hora = k === 'encierro' ? v[v.length - 1] : v[0];
    const re = new RegExp('^' + et + '$', 'i');
    const idx = k === 'encierro' ? pts.map((p) => re.test(p.lugar)).lastIndexOf(true) : pts.findIndex((p) => re.test(p.lugar));
    if (idx >= 0) { if (pts[idx].hora !== hora) { pts[idx].hora = hora; n++; } continue; }
    const m = minutos(hora);
    let pos = pts.findIndex((p) => minutos(p.hora || p.fila) > m);
    if (pos < 0) pos = pts.length;
    pts.splice(pos, 0, { fila: hora, lugar: et, hora }); n++;
  }
  return n;
}
// Itinerario completo de la ficha (sin rejilla): horas de salida y encierro en el primer y último punto, catedral en la
// estación de penitencia y tribuna / torre sur en «Tribuna Principal» / «Torre Sur» si aparecen en la lista.
function horasEnLista(pts0, horas) {
  const pts = pts0.map((p) => ({ ...p }));
  const sal = horas.salida && horas.salida[0];
  if (sal) { const s = pts.find((p) => p.salida && p.hora === sal) || pts[0]; s.hora = sal; }
  for (const p of pts) delete p.salida;
  const pon = (re, h) => { const p = pts.find((p) => re.test(p.lugar)); if (p && h) p.hora = h; };
  pon(/Tribuna Principal/i, horas.tribuna && horas.tribuna[0]);
  pon(/Torre Sur/i, horas.torre_sur && horas.torre_sur[0]);
  const cat = pts.find((p) => p.catedral); if (cat && horas.catedral && horas.catedral[0]) cat.hora = horas.catedral[0];
  const e = horas.encierro; if (e && e.length && pts.length) pts[pts.length - 1].hora = e[e.length - 1];
  return pts;
}

// ---------- Limpieza de etiquetas basura (celdas combinadas, rótulos, horas pegadas) ----------
const SUELTAS = /^(de|del|la|las|los|el|y|e|san|santa|sta\.?|s\.|pl\.?|pza\.?|p\.|c\.|c\/|calle|plaza|avda\.?|av\.?|avd|cruz|gu[ií]a|-|·)$/i;
const ROTULOS = /^(cruz de gu[ií]a|fin(al)? del?( cortejo)?|fin(al)? de cortejo|gu[ií]a|cortejo)$/i;
const CONECTOR = /\s(de|del|de la|de los|de las|y|san|santa)$/i;
const HORA_RE = /\(?\b([01]?\d|2[0-4])[:.]([0-5]\d)\b\s*(?:h\b|horas\b)?\)?|\((\d{1,2}),(\d{2})\)/g;
function limpiarLugar(ciudad, l0) {
  let l = String(l0 || '');
  l = l.replace(/\s*ITINERARIOS\s*\d*\s*/g, '').replace(/([a-záéíóúñ])\d{1,3}\s+([a-záéíóúñ])/g, '$1$2').replace(/^\d{1,3}\s+(?=[A-ZÁÉÍÓÚÑ])/, '');
  const horas = new Set();
  l = l.replace(HORA_RE, (m, a, b, c, d) => { horas.add(a != null ? `${a}:${b}` : `${c}:${d}`); return ' '; });
  l = l.replace(/\(\s*\)/g, ' ').replace(/\(\s*(Venia)\s*\)/gi, '($1)').replace(/\s+/g, ' ').trim().replace(/^[-–/·,.\s]+|[-–/·,\s]+$/g, '').trim();
  // texto espaciado letra a letra («A l m i ra n t e»)
  const tk = l.split(' ');
  if (tk.filter((t) => /^\p{L}$/u.test(t)).length >= 3 && tk.filter((t) => t.length <= 2).length / tk.length >= 0.5 && Math.max(...tk.map((t) => t.length)) <= 4)
    l = tk.join('').replace(/\.(?=\S)/g, '. ').replace(/([a-záéíóúñ])([A-ZÁÉÍÓÚÑ])/g, '$1 $2');
  // rótulo de jornada superpuesto («D DEE R ERSEUSRURRERCECCIÓCNIÓN»)
  if (tk.filter((t) => t.length === 1 && !/^[yeaoYEAO]$/.test(t)).length >= 2 && tk.some((t) => t.length >= 12 && t === t.toUpperCase())) return null;
  // frases repetidas por celdas combinadas («Campana Campana», «P. PALOS P. PALOS»)
  for (let i = 0; i < 3; i++) l = l.replace(/(^|\s)(\S+(?:\s\S+){0,3})\s\2(?=\s|$)/g, '$1$2');
  // cola minúscula pegada a un nombre en mayúsculas («JUDERÍA hy»)
  l = l.replace(/^([^a-záéíóúñ]+)\s[a-záéíóúñ]{1,2}$/, '$1');
  if (!/[A-Za-zÁÉÍÓÚÑáéíóúñ]{2}/.test(l)) return { lugar: '', horas };
  if (ROTULOS.test(l)) return { lugar: '', horas };
  if (SUELTAS.test(l) && !(ciudad === 'sevilla' && l === 'PLAZA')) return { lugar: '', horas }; // en Sevilla «PLAZA» es la de San Francisco (carrera oficial)
  return { lugar: l, horas };
}
function limpiar(ciudad, pts) {
  const out = [];
  let quitados = 0, horasRescatadas = 0;
  for (const p0 of pts) {
    const r = limpiarLugar(ciudad, p0.lugar);
    if (!r || !r.lugar) { quitados++; continue; }
    const p = { ...p0, lugar: r.lugar };
    if (!p.hora && r.horas.size === 1) { p.hora = [...r.horas][0]; horasRescatadas++; }
    // nombre partido en dos renglones: «Alameda de» + «Hércules»
    const prev = out[out.length - 1];
    if (prev && CONECTOR.test(' ' + prev.lugar) && /^[A-ZÁÉÍÓÚÑ]/.test(p.lugar) && !/^(calle|c\/|plaza|pza|pl\.|avda|av\.|salida|entrada|encierro|carrera|catedral|campana)/i.test(p.lugar) && !(prev.hora && p.hora)) {
      prev.lugar += ' ' + p.lugar; if (!prev.hora && p.hora) prev.hora = p.hora; continue;
    }
    out.push(p);
  }
  return { pts: out, quitados, horasRescatadas };
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
