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

const JORNADAS = ['Viernes de Dolores', 'Sábado de Pasión', 'Domingo de Ramos', 'Lunes Santo', 'Martes Santo', 'Miércoles Santo', 'Jueves Santo', 'Viernes Santo', 'Sábado Santo', 'Domingo de Resurrección'];
const ORDEN = (d) => { const i = JORNADAS.indexOf(d); return i >= 0 ? i : /Madrug/.test(d) ? 6.5 : /Jueves/.test(d) ? 6 : 99; };
// palabras de los nombres populares de cada ciudad (para penalizar cabeceras que nombran a otra hermandad)
const OTRAS = new Map();
for (const h of D.hermandades) { const s = OTRAS.get(h.ciudad) || new Set(); for (const t of toks(h.nombre)) s.add(t); OTRAS.set(h.ciudad, s); }
function puntuar(h, cab) {
  const a = toks(cab.replace(/CRUZ DE GU[IÍ]+A|FINAL DEL CORTEJO|MISTERIO|PALIO|PASO/gi, ' ')), b = new Set([...toks(h.sede)]);
  const tit = new Set((h.titulares || []).flatMap((t) => [...toks(t.nombre.split(',')[0])]));
  // el identificador corto (mena-malaga, columna…) recoge el nombre popular que usan las guías
  const n = new Set([...toks(h.nombre), ...toks(h.slug.replace(/-/g, ' ').replace(new RegExp(' ' + h.ciudad + '$'), ''))]);
  // nombre o alias: 3 · advocación de un titular (la guía rotula «PAZ», «PRIMER DOLOR»…): 2 · sede: 1
  let s = 0; for (const t of a) { if (n.has(t)) s += 3; else if (tit.has(t)) s += 2; else if (b.has(t)) s += 1; }
  // una palabra distintiva que solo encaja en el nombre de OTRA hermandad («DOLORES (Alcolea)» no es «Los Dolores»)
  const otra = OTRAS.get(h.ciudad);
  for (const t of a) if (!n.has(t) && !tit.has(t) && !b.has(t) && otra && otra.has(t)) s -= 2;
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
const HORA_RE = /\(?(?<!\d)([01]?\d|2[0-4])[:.]([0-5]\d)(?!\d)\s*(?:h\b|horas\b)?\)?|\((\d{1,2}),(\d{2})\)/g;
function limpiarLugar(ciudad, l0) {
  let l = String(l0 || '');
  l = l.replace(/\s*ITINERARIOS\s*\d*\s*/g, '').replace(/([a-záéíóúñ])\d{1,3}\s+([a-záéíóúñ])/g, '$1$2').replace(/^\d{1,3}\s+(?=[A-ZÁÉÍÓÚÑ])/, '');
  // texto espaciado letra a letra con la hora dentro («. S a l id a o 1 7: 2 0»): se junta antes de buscar horas
  const tk0 = l.trim().split(/\s+/);
  if (tk0.filter((t) => /^\p{L}$/u.test(t)).length >= 3 && tk0.filter((t) => t.length <= 2).length / tk0.length >= 0.6 && /\d/.test(l))
    l = tk0.join('').replace(/^[.·]+/, '').replace(/^(Salida|Entrada)o(?=\d)/i, '$1 ').replace(/(\d)(?=\d{1,2}:)/, '$1');
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
  // paréntesis sueltos («Salida )»)
  if (!l.includes('(')) l = l.replace(/\s*\)\s*/g, ' ').trim();
  if (!l.includes(')')) l = l.replace(/\s*\(\s*$/g, '').trim();
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
    // una hora suelta en la fila de abajo de una «Salida» sin hora es la de esa salida (Torreblanca: «Salida» / «16:45», comprobado
    // en la p. 2 de la rejilla del Consejo; Torreblanca va ahora copiada a mano, en A_MANO)
    const ant = out[out.length - 1];
    if (r && !r.lugar && r.horas.size === 1 && ant && !ant.hora && out.length === 1 && /^(salida|sale)$/i.test(ant.lugar)) { ant.hora = [...r.horas][0]; horasRescatadas++; quitados++; continue; }
    if (!r || !r.lugar) { quitados++; continue; }
    const p = { ...p0, lugar: r.lugar };
    if (!p.hora && r.horas.size === 1) { p.hora = [...r.horas][0]; horasRescatadas++; }
    // nombre partido en dos renglones: «Alameda de» + «Hércules», y también con el artículo en minúscula: «Javier Lasso de» +
    // «la Vega», «Santa Ángela de» + «la Cruz», «Camino de» + «los Toros» (Sevilla, Canal Sur)
    const prev = out[out.length - 1];
    const sigue = /^[A-ZÁÉÍÓÚÑ]/.test(p.lugar) || (prev && /\sde$/i.test(' ' + prev.lugar) && /^(el|la|los|las)\s+[A-ZÁÉÍÓÚÑ]/.test(p.lugar));
    if (prev && prev.fila && prev.fila === p.fila && CONECTOR.test(' ' + prev.lugar) && sigue &&!/^(calle|c\/|plaza|pza|pl\.|avda|av\.|salida|entrada|encierro|carrera|catedral|campana)/i.test(p.lugar) && !(prev.hora && p.hora)) {
      prev.lugar += ' ' + p.lugar; if (!prev.hora && p.hora) prev.hora = p.hora; continue;
    }
    out.push(p);
  }
  return { pts: out, quitados, horasRescatadas };
}

// Columnas que la rejilla lee juntas (cabeceras pegadas): las primeras «filas» puntos son de una hermandad concreta (slug) y el
// resto sigue como columna aparte. Cada caso, con su página del PDF.
// · Granada, Viernes Santo, «El Llamador» 2026 (GRANADA 26.pdf), p. 32: la columna «TRES TARDE» (Santo Domingo) va de 13:30 a 16:00,
//   «SALE (13:45)» … «ENTRA»; en la fila de las 16:00 la «SALIDA» es de la columna vecina. Es la Soledad de la Humildad (p. 30).
const PARTIR = [
  { ciudad: 'granada', dia: 'VIERNES SANTO', cabecera: 'TRES TARDE ESCOLAPIOS FERROVIARIOS', filas: 6, slug: 'soledad-de-nuestra-senora-humildad-granada',
    lugares: { SALE: 'SALIDA', 'ENTRA SALIDA': 'ENTRA' }, resto: { cabecera: 'ESCOLAPIOS FERROVIARIOS', lugares: { 'ENTRA SALIDA': 'SALIDA' } } },
];
function partir(ciudad, cols) {
  const res = [];
  for (const c of cols) {
    const p = PARTIR.find((x) => x.ciudad === ciudad && x.dia === c.dia && x.cabecera === c.cabecera);
    if (!p) { res.push(c); continue; }
    const pon = (pts, l) => pts.map((q) => (l[q.lugar] ? { ...q, lugar: l[q.lugar] } : q));
    res.push({ ...c, cabecera: c.cabecera, slug: p.slug, puntos: pon(c.puntos.slice(0, p.filas), p.lugares) });
    const resto = pon(c.puntos.slice(p.filas - 1), p.resto.lugares);
    res.push({ ...c, cabecera: p.resto.cabecera, puntos: resto.slice(resto[0].lugar === 'SALIDA' ? 0 : 1) });
  }
  return res;
}

// ---------- Sevilla: rejilla del Consejo («Itinerario SS Sevilla 2026 2.pdf») ----------
// Cada hermandad ocupa un bloque de columnas que empieza por su CRUZ DE GUÍA, con el nombre alineado a la izquierda del bloque.
// El lector da a cada subcolumna el nombre que la cubre, y el palio o el paso, a la derecha del bloque, salía con el nombre de
// la hermandad siguiente o con los dos («A · B»): La Amargura se quedaba con el palio de La Estrella, Redención con el de San
// Pablo, Bellavista con el paso de La Misión… (comprobado sobre el PDF, p. ej. la p. 6). Aquí:
// · el paso o el palio es de la hermandad de la cruz de guía que lo precede en la página;
// · una cruz de guía con dos nombres es del que no es la hermandad anterior («Jesús Despojado · La Hiniesta», tras el bloque
//   de Jesús Despojado, es La Hiniesta);
// · la primera columna de una página sin cruz delante (su cruz no se leyó) se descarta, porque no se sabe de quién es;
// · dos bloques seguidos con el mismo rótulo son dos hermandades cuyos nombres salen pegados en un renglón («Pasión y Muerte
//   Cristo de la Corona…», «Santa Genoveva Santa Marta…»): si el rótulo trae los nombres de dos hermandades de la ciudad, el
//   primer bloque es el de la que va primero (a la izquierda) y el segundo el de la otra; si no, se descartan los dos.
const NOMBRES_SEV = D.hermandades.filter((h) => h.ciudad === 'sevilla').map((h) => ({ nombre: h.nombre, n: norm(h.nombre).replace(/^(la|el|los|las) /, '') })).filter((x) => x.n.length >= 5);
function nombresPegados(rotulo, cuantos) {
  const t = ' ' + norm(rotulo) + ' ';
  const v = NOMBRES_SEV.map((x) => ({ ...x, i: t.indexOf(' ' + x.n + ' ') })).filter((x) => x.i >= 0)
    .filter((x, _, a) => !a.some((y) => y !== x && y.n.length > x.n.length && y.n.includes(x.n))).sort((a, b) => a.i - b.i);
  return v.length === cuantos ? v.map((x) => x.nombre) : null;
}
function bloquesConsejo(cols) {
  const porPag = new Map(), res = [], fuera = [];
  for (const c of cols) { if (!porPag.has(c.pagina)) porPag.set(c.pagina, []); porPag.get(c.pagina).push(c); }
  for (const [pag, cs] of porPag) {
    const bloques = []; let prev = null;
    for (const c of cs) {
      if (/cruz/.test(c.sub)) {
        const partes = c.cabecera.split(' · ');
        const nom = partes.length > 1 && prev && partes.includes(prev.nom) ? partes.filter((x) => x !== prev.nom).join(' · ') : c.cabecera;
        prev = { nom, cols: [{ ...c, cabecera: nom }] }; bloques.push(prev);
      } else if (prev) prev.cols.push({ ...c, cabecera: prev.nom });
      else fuera.push(`p. ${pag}, ${c.sub} rotulado «${c.cabecera}»: sin cruz de guía delante`);
    }
    const veces = {}; for (const b of bloques) veces[b.nom] = (veces[b.nom] || 0) + 1;
    const reparto = {}; for (const nom of Object.keys(veces)) if (veces[nom] > 1) reparto[nom] = nombresPegados(nom, veces[nom]);
    for (const b of bloques) {
      if (veces[b.nom] === 1) { res.push(...b.cols); continue; }
      const r = reparto[b.nom];
      if (!r) { fuera.push(`p. ${pag}, bloque «${b.nom}»: ${veces[b.nom]} cruces de guía con el mismo nombre`); continue; }
      const nuevo = r.shift(); res.push(...b.cols.map((c) => ({ ...c, cabecera: nuevo })));
    }
  }
  return { cols: res, fuera };
}
// Sevilla: columna leída junto con la vecina (celdas pegadas: «Salida 20:59 Alberto», «Doña Guiomar Entrada») o columna única con
// la cruz y el palio juntos (vísperas de Canal Sur: «Entrada», «Emilia Barral», «Entrada palio»): una segunda salida, dos entradas
// o dos salidas en un mismo punto. Solo vale si la hermandad no tiene otra columna limpia para ese papel. (Un lugar repetido en dos
// renglones seguidos, «Entrada (1:45)» en las franjas de 1:30 y 2:00, no cuenta.)
const mezclada = (pts) => {
  const v = pts.filter((p, i) => !i || p.lugar !== pts[i - 1].lugar);
  return v.some((p, i) => i > 0 && /\b(salida|sale)\b/i.test(p.lugar)) || v.filter((p) => /\b(entrada|entra)\b/i.test(p.lugar)).length > 1 || v.some((p) => (p.lugar.match(/\bsalida\b/gi) || []).length > 1);
};
// hora de salida de una columna (la exacta si la hay; si no, la franja), para comprobar que la cruz de guía sale antes que sus pasos
function salidaDe(ciudad, pts) {
  const p = pts[0]; if (!p) return null;
  const r = limpiarLugar(ciudad, p.lugar), h = p.hora || (r && r.horas.size ? [...r.horas][0] : '') || p.fila;
  return h && /^\d{1,2}:\d{2}$/.test(h) ? minutos(h) : null;
}
// Columnas que el lector mezcla con la vecina, copiadas a mano de la rejilla, celda a celda ([franja, lugar, hora exacta]).
// · Huelva, Jueves Santo, «El Llamador» 2026 (HUELVA 26.pdf), p. 26: la cabecera «CRUZ DE / GUÍA» va en dos renglones y el lector
//   no separó las columnas: el paso de La Misericordia salió pegado a la cruz de guía de La Buena Muerte (Salida 19:20, Plaza de
//   las Monjas…), su cruz de guía se quedó sin la salida (19:40) y el paso de La Buena Muerte, mezclado con el de al lado.
const A_MANO = {
  'la-misericordia-huelva': { pdf: 'HUELVA 26.pdf', pagina: 26, tramos: {
    'cruz de guía': [['20:00', 'Salida', '19:40'], ['20:30', 'Hernán Cortés'], ['21:00', 'C. OFICIAL', '20:45'], ['21:30', 'Plaza Monjas'], ['22:00', 'Plaza Constitución'], ['22:30', 'Sta. Ángela Cruz'], ['23:00', 'La Paz/Rábida'], ['23:30', 'Templo', '23:20']],
    paso: [['20:00', 'Salida'], ['20:30', 'Rábida'], ['21:00', 'C. OFICIAL'], ['21:30', 'Plaza Constitución'], ['22:00', 'Berdigón'], ['22:30', 'Alonso Sánchez'], ['23:00', 'La Paz'], ['23:30', 'Rábida'], ['00:00', 'Templo', '23:40']],
  } },
  'la-buena-muerte-huelva': { pdf: 'HUELVA 26.pdf', pagina: 26, tramos: {
    'cruz de guía': [['19:00', 'Salida', '19:20'], ['19:30', 'Plaza de las Monjas'], ['20:00', 'Pérez Carasa'], ['20:30', 'Rábida'], ['21:00', 'C. OFICIAL'], ['21:30', 'Espronceda'], ['22:00', 'Plaza Constitución'], ['22:30', 'Palos/Tres Agosto'], ['23:00', 'Templo', '23:15']],
    palio: [['19:30', 'Salida', '19:50'], ['20:00', 'Pérez Carasa'], ['20:30', 'Murillo'], ['21:00', 'Hernán Cortés'], ['21:30', 'Bocas'], ['22:00', 'C. OFICIAL', '21:40'], ['22:30', 'Plaza de las Monjas'], ['23:00', 'Plaza Constitución'], ['23:30', 'Palos/Tres Agosto'], ['00:00', 'Templo']],
  } },
  //   Misma página: «ORACIÓN EN EL HUERTO» (Parroquia de la Concepción) salía en una sola columna con la cruz y el palio mezclados
  //   («Mora Claros Salida», «Méndez Hernán Cortés Núñez») y la hora del palio (19:55) como salida; su cruz sale a las 19.10.
  //   «JUDÍOS» (Parroquia de la Merced) no tenía itinerario. Su «Salida (20.30)» está en la fila de las 19:30 y las dos celdas
  //   siguientes van una franja por delante; la hora es la buena: cuadra con el palio (sale 50 min después, pasa por la carrera
  //   oficial 55 min después y entra 60 min después). Se copia tal cual; build.mjs no deja que el tiempo retroceda.
  'vera-cruz-y-oracion-huelva': { pdf: 'HUELVA 26.pdf', pagina: 26, tramos: {
    'cruz de guía': [['19:00', 'Salida', '19:10'], ['19:30', 'Mora Claros'], ['20:00', 'C. OFICIAL'], ['20:30', 'Plaza Constitución'], ['21:00', 'Alfonso XII'], ['21:30', 'Plaza Niña'], ['22:00', 'Rábida/Murillo'], ['22:30', 'Vázquez López'], ['23:00', 'Rico/Concepción'], ['23:30', 'Méndez Núñez'], ['00:00', 'Templo', '23:15']],
    palio: [['19:30', 'Salida', '19:55'], ['20:00', 'José Nogales'], ['20:30', 'C. OFICIAL', '20:45'], ['21:00', 'Gran Vía'], ['21:30', 'Plaza Constitución'], ['22:00', 'Plaza Niña'], ['22:30', 'Rábida'], ['23:00', 'Vázquez López'], ['23:30', 'Hernán Cortés'], ['00:00', 'Rico'], ['00:30', 'Concepción'], ['01:00', 'Templo', '00:10']],
  } },
  'los-judios-la-merced-huelva': { pdf: 'HUELVA 26.pdf', pagina: 26, tramos: {
    'cruz de guía': [['19:30', 'Salida', '20:30'], ['20:00', 'Paseo Independencia'], ['20:30', 'San José'], ['21:00', 'Isabel II'], ['21:30', 'José Nogales'], ['22:00', 'C. OFICIAL', '21:40'], ['22:30', 'Plaza Monjas'], ['23:00', 'Plaza Constitución'], ['23:30', 'Pérez Carasa'], ['00:00', 'Plaza Coto Mora'], ['00:30', 'Concepción'], ['01:00', 'Puerto'], ['01:30', 'Vázquez Limón'], ['02:00', 'Templo', '01:30']],
    palio: [['21:00', 'Salida', '21:20'], ['21:30', 'Paseo Independencia'], ['22:00', 'Isabel II'], ['22:30', 'C. OFICIAL', '22:35'], ['23:00', 'Plaza Monjas'], ['23:30', 'Plaza Constitución'], ['00:00', 'Berdigón'], ['00:30', 'Gobernador Alonso'], ['01:00', 'Concepción'], ['01:30', 'San José'], ['02:00', 'Amado de Lázaro'], ['02:30', 'Plaza Merced'], ['03:00', 'Templo', '02:30']],
  } },
  // · Sevilla, Sábado de Pasión, rejilla del Consejo (Itinerario SS Sevilla 2026 2.pdf), p. 2: la página tiene dos escalas de horas,
  //   la del Viernes de Dolores a la izquierda (de 17:30 a 2:00, 18 filas) y la del Sábado de Pasión a la derecha (de 15:00 a 1:30,
  //   22 filas más estrechas). El lector usó la de la izquierda para todo: las franjas del Sábado de Pasión iban de 2 h 30 min a 30 min
  //   tarde y los nombres partidos entre dos filas. Por eso la cruz de Padre Pío (15:10, que sí es suya: columna «CRUZ DE GUÍA» de
  //   Padre Pío, fila de las 15:00) salía más de tres horas antes que su palio (leído en la franja de las 18:30; es la de las 16:00).
  //   Las columnas de Canal Sur (SEVILLA 26.pdf, p. 14) son una por
  //   hermandad: la cruz de guía, con la recogida del palio en rojo; coinciden calle a calle con las cruces de aquí. El «paso» de
  //   Divino Perdón y el de San José Obrero eran esas columnas de Canal Sur mal leídas (cruz de guía, no paso): se quitan.
  //   Torreblanca: la «Salida 16:45» es de su cruz de guía (aquí, fila de las 16:30; en Canal Sur, «Salida (16:45)» en su columna).
  'padre-pio-sevilla': { pdf: 'Itinerario SS Sevilla 2026 2.pdf', pagina: 2, fuente: 'cgh', tramos: {
    'cruz de guía': [['15:00', 'Salida', '15:10'], ['15:30', 'Doctora'], ['16:00', 'Puebla del Río'], ['16:30', 'Doña Francisquita'], ['17:00', 'Doña Francisquita'], ['17:30', 'Puerto de la Mora'], ['18:00', 'Calatayud'], ['18:30', 'Ntra. Sra. Dolores'], ['19:00', 'Párroco A. Gómez Villa.'], ['19:30', 'Párroco A. Gómez Villa.'], ['20:00', 'Galicia'], ['20:30', 'Coimbra'], ['21:00', 'Avda. Gavilanes'], ['21:30', 'Doña Francisquita'], ['22:00', 'Doña Francisquita'], ['22:30', 'Ronda Padre Pío'], ['23:00', 'Carrión de los Céspedes'], ['23:30', 'Puebla de Cazalla'], ['0:00', 'Castillo de las Guardas'], ['0:30', 'Entrada']],
    palio: [['16:00', 'Salida'], ['16:30', 'Avda. La Plata'], ['17:00', 'Doña Francisquita'], ['17:30', 'Doña Francisquita'], ['18:00', 'Puerto de Piedrafita'], ['18:30', 'Fco Carrera Iglesias'], ['19:00', 'Afán de Ribera'], ['19:30', 'Ntra. Sra. Dolores'], ['20:00', 'Párroco A. Gómez Villa.'], ['20:30', 'Galicia'], ['21:00', 'Lisboa'], ['21:30', 'Coimbra'], ['22:00', 'Doña Francisquita'], ['22:30', 'Avda. Plata'], ['23:00', 'Ronda de Padre Pío'], ['23:30', 'Carrión de los Céspedes'], ['0:00', 'Puebla de Cazalla'], ['0:30', 'Castillo de las Guardas'], ['1:00', 'Ronda Padre Pío'], ['1:30', 'Entrada']],
  }, pendiente: ['Hora exacta de salida del palio: el Consejo (p. 2) solo da la franja de las 16:00 y Canal Sur (p. 14) no la trae.'] },
  'dolores-de-torreblanca-sevilla': { pdf: 'Itinerario SS Sevilla 2026 2.pdf', pagina: 2, fuente: 'cgh', tramos: {
    'cruz de guía': [['16:30', 'Salida', '16:45'], ['17:00', 'Pl. Platanero'], ['17:30', 'Álamo'], ['18:00', 'Encina'], ['18:30', 'Torresquevedo'], ['19:00', 'Torresquevedo'], ['19:30', 'Torrebermeja'], ['20:00', 'Torres Naharro'], ['20:30', 'Torrenueva'], ['21:00', 'Torredonjimeno'], ['21:30', 'Torrecuadrada'], ['22:00', 'Torres del Río'], ['22:30', 'Torrescarcela'], ['23:00', 'Torrelaguna'], ['23:30', 'Torremegía'], ['0:00', 'Pl. Salvador Valverde'], ['0:30', 'Cedro'], ['1:00', 'Entrada']],
    palio: [['17:30', 'Salida', '17:45'], ['18:00', 'Pl. Platanero'], ['18:30', 'Pl. Platanero'], ['19:00', 'Pl. Acacias'], ['19:30', 'Pino'], ['20:00', 'Torresquevedo'], ['20:30', 'Torrellana'], ['21:00', 'Torres Naharro'], ['21:30', 'Torres Naharro'], ['22:00', 'Torrenueva'], ['22:30', 'Torrelaguna'], ['23:00', 'Torrecuadrada'], ['23:30', 'Torregrosa'], ['0:00', 'Torrescarcela'], ['0:30', 'Torregorda'], ['1:00', 'Acedo'], ['1:30', 'J. M. S. Román'], ['1:30', 'Entrada', '2:15']],
  } },
  // (Alcosa en la rejilla del Consejo; «Divino Perdón» en Canal Sur)
  'divino-perdon-sevilla': { pdf: 'Itinerario SS Sevilla 2026 2.pdf', pagina: 2, fuente: 'cgh', tramos: {
    'cruz de guía': [['17:30', 'Salida'], ['18:00', 'Carmen Conde'], ['18:30', 'Pintor Alfonso Grosso'], ['19:00', 'Avda. Ciudad de Chiva'], ['19:30', 'Avda. Ciudad de Chiva'], ['20:00', 'Ciudad de Alfafar'], ['20:30', 'Ciudad de Paterna'], ['21:00', 'Ontur'], ['21:30', 'Pl. Zocodover'], ['22:00', 'Avda. Ciudad de Chiva'], ['22:30', 'Pl. Obradoiro'], ['23:00', 'Avda. Ciudad de Chiva'], ['23:30', 'Emilia Barral'], ['0:00', 'Entrada']],
    palio: [['18:00', 'Salida', '18:15'], ['18:30', 'Carmen Conde'], ['19:00', 'Carmen Conde'], ['19:30', 'Pintor Alfonso Grosso'], ['20:00', 'Avda. Ciudad de Chiva'], ['20:30', 'Avda. Ciudad de Chiva'], ['21:00', 'Parroquia'], ['21:30', 'Ciudad de Paterna'], ['22:00', 'Ontur'], ['22:30', 'Pl. Zocodover'], ['23:00', 'Ciudad de Chivas'], ['23:30', 'Pl. Obradoiro'], ['0:00', 'Avda. Ciudad de Chiva'], ['0:30', 'Emilia Barral'], ['1:00', 'Entrada']],
  }, pendiente: ['Hora exacta de salida de la cruz de guía: ni el Consejo (p. 2) ni Canal Sur (p. 14) la dan, solo la franja de las 17:30 (no se pone como hora).'] },
  'san-jose-obrero-sevilla': { pdf: 'Itinerario SS Sevilla 2026 2.pdf', pagina: 2, fuente: 'cgh', tramos: {
    'cruz de guía': [['17:00', 'Salida', '16:55'], ['17:30', 'Antonio Filpo Rojas'], ['18:00', 'Venecia'], ['18:30', 'Joaquín Morales y T.'], ['19:00', 'Mateos'], ['19:30', 'Sol'], ['20:00', 'María Auxiliadora'], ['20:30', 'Carretera de Carmona'], ['21:00', 'Jabugo'], ['21:30', 'Mamá Margarita'], ['22:00', 'José María de Mena'], ['22:30', 'Arroyo'], ['23:00', 'Luis Álvarez Duarte'], ['23:30', 'Nicasio Gallego'], ['0:00', 'Entrada']],
    palio: [['17:30', 'Salida', '17:35'], ['18:00', 'Antonio Filpo Rojas'], ['18:30', 'Venecia'], ['19:00', 'Arroyo'], ['19:30', 'Mateos'], ['20:00', 'Cristo de las Cinco Llagas'], ['20:30', 'Madre Isabel de la Trinidad'], ['21:00', 'Carretera de Carmona'], ['21:30', 'San Juan Bosco'], ['22:00', 'Pinta'], ['22:30', 'Maestro Góm. Zarzuela'], ['23:00', 'Vicente Alanís'], ['23:30', 'Guanahaní'], ['0:00', 'Luis Álvarez Duarte'], ['0:30', 'Iriarte'], ['1:00', 'Entrada', '0:50']],
  } },
  // · Sevilla, Sábado Santo, Canal Sur (SEVILLA 26.pdf), p. 81: El Santo Entierro, «CRUZ DE GUÍA» y «DUELO». El lector juntó las dos
  //   columnas en una (dos «Salida», horas que retrocedían) y el plano la usaba como paso. La rejilla del Consejo (p. 18) da las
  //   mismas calles y horas.
  'el-santo-entierro-sevilla': { pdf: 'SEVILLA 26.pdf', pagina: 81, tramos: {
    'cruz de guía': [['18:30', 'Salida', '18:45'], ['19:00', 'CAMPANA', '19:03'], ['19:30', 'PLAZA', '19:43'], ['20:00', 'P. SAN MIGUEL', '20:09'], ['20:30', 'PALOS', '20:28'], ['21:00', 'Hernando Colón'], ['21:30', 'Tetuán'], ['22:00', 'Alfonso XII'], ['22:30', 'Entrada']],
    paso: [['19:00', 'Salida', '19:15'], ['19:30', 'CAMPANA', '19:43'], ['20:00', 'PLAZA', '20:23'], ['20:30', 'P. SAN MIGUEL', '20:49'], ['21:00', 'PALOS', '21:08'], ['21:30', 'Alemanes'], ['22:00', 'Hernando Colón'], ['22:30', 'O´Donnell'], ['23:00', 'Entrada']],
  } },
};
// fuente de las columnas copiadas a mano que no son del PDF de la primera lectura («cgh»: la rejilla del Consejo de Sevilla)
const FUENTE_A_MANO = { cgh: FUENTES.find(([, f]) => f === 'sevilla-cgh-2026.json')[2] };

const out = { generado: new Date().toISOString(), anio: 2026, hermandades: {}, sin_emparejar: [] };
// todas las columnas que caen en cada hermandad y papel (cruz de guía, paso, palio…); se elige al final
const CAND = new Map();
for (const [ciudad, f, fuente] of FUENTES) {
  const p = path.join(DIR, f); if (!fs.existsSync(p)) continue;
  const J = JSON.parse(fs.readFileSync(p, 'utf8'));
  // las fichas con columna asignada a mano (PARTIR) no compiten por las demás columnas
  const hs = D.hermandades.filter((h) => h.ciudad === ciudad && !PARTIR.some((p) => p.slug === h.slug));
  const hsTodas = D.hermandades.filter((h) => h.ciudad === ciudad);
  let columnas = J.columnas;
  if (f === 'sevilla-cgh-2026.json') { const b = bloquesConsejo(columnas); columnas = b.cols; for (const x of b.fuera) console.log('  Consejo, descartada:', x); }
  for (const c0 of partir(ciudad, columnas)) {
    const c = ciudad === 'cadiz' ? horasCadiz(J, c0) : c0;
    if (c.slug) { // columna asignada a mano (PARTIR)
      const h = hsTodas.find((x) => x.slug === c.slug); if (!h) { console.warn('PARTIR: no está la ficha', c.slug); continue; }
      out.hermandades[h.slug] = { ciudad, dia: h.dia, fuente, pdf: J.fuente, tramos: { paso: c.puntos } };
      continue;
    }
    const dia = DIA[c.dia] || null;
    let cands = hs.filter((h) => !dia || h.dia === dia || (dia === 'Madrugá' && /Madrug/.test(h.dia)) || (dia === 'Jueves Santo' && /Jueves/.test(h.dia)));
    if (!cands.length) cands = hs;
    let best = cands.map((h) => [h, puntuar(h, c.cabecera)]).sort((x, y) => y[1] - x[1]);
    // si la jornada leída no cuadra (página mal etiquetada), se busca en toda la ciudad
    // (exigiendo más: una sola palabra suelta, p. ej. «TRIANA», no basta para saltar de jornada)
    if (!best.length || best[0][1] < 3) {
      best = hs.map((h) => [h, puntuar(h, c.cabecera)]).sort((x, y) => y[1] - x[1]);
      // (las rejillas mal rotuladas se desplazan como mucho una jornada; ni un nombre completo vale para saltar más: «PAZ Y
      // MISERICORDIA», del Viernes de Dolores, contiene «Paz» y se quedaba como paso de La Paz, del Domingo de Ramos)
      if (best.length && dia && Math.abs(ORDEN(best[0][0].dia) - ORDEN(dia)) > 1) best[0][1] = Math.min(best[0][1], 1);
    }
    if (!best.length || best[0][1] < 2 || (best[1] && best[1][1] >= best[0][1] - 0.5)) { out.sin_emparejar.push({ ciudad, dia: c.dia, cabecera: c.cabecera, sub: c.sub, opciones: best.slice(0, 3).map(([h, s]) => h.slug + ':' + s) }); continue; }
    const h = best[0][0];
    const e = (out.hermandades[h.slug] = out.hermandades[h.slug] || { ciudad, dia: h.dia, fuente, pdf: J.fuente, tramos: {} });
    const sub = c.sub ? (/cruz/.test(c.sub) ? 'cruz de guía' : /final/.test(c.sub) ? 'final del cortejo' : /palio|virgen/.test(c.sub) ? 'palio' : 'paso') : 'paso';
    if (!e.tramos[sub]) e.tramos[sub] = c.puntos; // (el orden de los papeles, el de la primera columna leída)
    const k = h.slug + '|' + sub; if (!CAND.has(k)) CAND.set(k, []); CAND.get(k).push(c.puntos);
  }
}
// Elección de la columna de cada papel: la más larga (a igualdad, la primera leída), pero en Sevilla antes las que no salen
// mezcladas con la vecina y, para los pasos, antes las que no salen antes que su cruz de guía (La Quinta Angustia: Canal Sur pone
// «Salida (19:05)» al paso, en la franja de las 20:00; el Consejo, 20:05, y su cruz sale a las 19:35).
const masLarga = (v) => v.reduce((a, b) => (b.length > a.length ? b : a));
for (const [slug, e] of Object.entries(out.hermandades)) {
  const cand = (sub) => CAND.get(slug + '|' + sub) || [];
  const limpias = (v) => { if (e.ciudad !== 'sevilla') return v; const l = v.filter((p) => !mezclada(p)); return l.length ? l : v; };
  if (CAND.has(slug + '|cruz de guía')) e.tramos['cruz de guía'] = masLarga(limpias(cand('cruz de guía')));
  const cruz0 = e.tramos['cruz de guía'] ? salidaDe(e.ciudad, e.tramos['cruz de guía']) : null;
  for (const sub of Object.keys(e.tramos)) {
    if (sub === 'cruz de guía' || !CAND.has(slug + '|' + sub)) continue;
    let v = limpias(cand(sub));
    if (cruz0 != null) { const ok = v.filter((p) => { const t = salidaDe(e.ciudad, p); return t == null || t >= cruz0; }); if (ok.length) v = ok; }
    e.tramos[sub] = masLarga(v);
  }
  // Sevilla: un paso o palio mezclado sobra si la hermandad tiene otro limpio
  if (e.ciudad === 'sevilla') {
    const pasos = Object.keys(e.tramos).filter((s) => !/cruz/.test(s));
    if (pasos.some((s) => !mezclada(e.tramos[s]))) for (const s of pasos) if (mezclada(e.tramos[s])) delete e.tramos[s];
  }
}
// Málaga: horas oficiales de la Agrupación sobre la rejilla, o el itinerario completo de la ficha si no hay rejilla
const FH = path.join(DIR, 'malaga-horarios-2026.json');
const est = { fichas: 0, emparejadas: 0, horasPuestas: 0, nuevas: 0 };
if (fs.existsSync(FH)) {
  const J = JSON.parse(fs.readFileSync(FH, 'utf8'));
  const { res, sueltas } = emparejarFichas(J.fichas, D.hermandades.filter((h) => h.ciudad === 'malaga'));
  est.fichas = J.fichas.length; est.emparejadas = res.length;
  for (const [f, h] of res) {
    let e = out.hermandades[h.slug];
    if (e) for (const k of Object.keys(e.tramos)) {
      // la rejilla arrastra a veces filas de la jornada siguiente tras el encierro: se cortan
      const t = e.tramos[k], u = t.map((p) => /^Encierro$/i.test(p.lugar)).lastIndexOf(true);
      if (u >= 0 && u < t.length - 1) e.tramos[k] = t.slice(0, u + 1);
      // columna mezclada con la vecina (rótulos de control pegados a calles: «Atarazanas Tribuna», «Alameda Salida»):
      // se descarta y se usa el itinerario oficial completo de la ficha
      if (e.tramos[k].some((p) => !/^(Salida|Tribuna|Torre Sur|Catedral|Encierro)$/i.test(p.lugar) && !/Tribuna (de los )?Pobres/i.test(p.lugar) && /\b(Salida|Tribuna|Torre|Encierro)\b/i.test(p.lugar))) { delete e.tramos[k]; est.mezcladas = (est.mezcladas || 0) + 1; }
    }
    if (e && Object.keys(e.tramos).length) {
      for (const t of Object.values(e.tramos)) est.horasPuestas += horasEnRejilla(t, f.horas);
      e.horas_fuente = `Horarios oficiales de la Agrupación de Cofradías de Málaga 2026 (${J.fuente})`;
    } else {
      if (e) est.nuevas--; // ya existía (rejilla descartada): no cuenta como hermandad nueva
      e = out.hermandades[h.slug] = { ciudad: 'malaga', dia: h.dia, fuente: 'Horarios e itinerarios oficiales de la Agrupación de Cofradías de Málaga 2026', pdf: J.fuente, tramos: { paso: horasEnLista(f.puntos, f.horas) } };
      est.nuevas++;
    }
    e.horas_oficiales = f.horas;
  }
  for (const f of sueltas) out.sin_emparejar.push({ ciudad: 'malaga', dia: f.dia, cabecera: f.cabecera.slice(0, 120), sub: 'horarios', opciones: [] });
}
// Granada: todas las horas de la rejilla de «El Llamador» (que no tiene enlace que se pueda abrir) coinciden con la Guía oficial
// de horarios e itinerarios 2026 de la Real Federación de Cofradías de Granada (comprobado punto a punto el 5-nov-2026:
// 27 horas de salida y 141 puntos). Se cita la guía, con la página de cada cofradía.
const GUIA_GR = 'https://hermandadesdegranada.com/wp-content/uploads/2026/03/GUIA-HORARIOS-2026_FEDERACION.pdf';
const PAG_GR = {
  'la-borriquilla-granada': 10, 'santa-cena-granada': 11, 'el-despojado-silencio-blanco-granada': 12, 'la-sentencia-maravillas-granada': 13,
  'el-cautivo-granada': 14, 'el-huerto-granada': 18, 'el-trabajo-granada': 19, 'nuestra-senora-de-los-dolores-granada': 20,
  'jesus-del-rescate-granada': 21, 'la-lanzada-granada': 26, 'el-via-crucis-granada': 27, 'la-esperanza-granada': 28, 'la-canilla-granada': 29,
  'los-gitanos-granada': 32, 'los-estudiantes-granada': 33, 'paciencia-y-penas-granada': 34, 'tres-caidas-y-rosario-granada': 35,
  'la-concha-granada': 40, 'los-salesianos-granada': 41, 'la-aurora-granada': 42, 'la-estrella-granada': 43, 'el-silencio-granada': 44,
  'soledad-de-nuestra-senora-humildad-granada': 48, 'los-escolapios-granada': 49, 'los-ferroviarios-granada': 50, 'los-favores-granada': 51,
  'los-facundillos-granada': 60, 'la-resurreccion-granada': 61, 'el-resucitado-granada': 62,
};
const fuenteGR = (slug) => `${GUIA_GR} (pág. ${PAG_GR[slug]}: Guía oficial de horarios e itinerarios 2026 de la Real Federación de Cofradías de Granada)`;
// Escolapios y Ferroviarios: «El Llamador» los da pegados en una sola columna; sus horas salen de la guía (págs. 49 y 50)
const GUIA_SOLO = {
  'los-escolapios-granada': [['Salida', '18:20'], ['Pl. del Humilladero', '18:50'], ['Carrera de la Virgen', '19:10'], ['Ángel Ganivet', '19:55'], ['Plaza de las Pasiegas', '20:40'], ['Salida Puerta Perdón', '21:25'], ['Puente Romano', '00:00'], ['Encierro', '00:15']],
  'los-ferroviarios-granada': [['Salida', '16:00'], ['Málaga', '17:50'], ['Carrera de la Virgen', '19:50'], ['Ángel Ganivet', '20:30'], ['Plaza de las Pasiegas', '21:20'], ['Salida Puerta Perdón', '22:00'], ['Basílica S. Juan de Dios', '22:15'], ['Encierro', '00:15']],
};
for (const [slug, pts] of Object.entries(GUIA_SOLO)) {
  const h = D.hermandades.find((x) => x.slug === slug);
  if (h && !out.hermandades[slug]) out.hermandades[slug] = { ciudad: 'granada', dia: h.dia, fuente: '', pdf: 'GUIA-HORARIOS-2026_FEDERACION.pdf', tramos: { paso: pts.map(([lugar, hora]) => ({ fila: '', lugar, hora })) } };
}
for (const [slug, x] of Object.entries(A_MANO)) {
  const h = D.hermandades.find((y) => y.slug === slug), e = out.hermandades[slug];
  if (!h) { console.warn('A_MANO: no está la ficha', slug); continue; }
  const tramos = Object.fromEntries(Object.entries(x.tramos).map(([k, pts]) => [k, pts.map(([fila, lugar, hora]) => ({ fila, lugar, ...(hora ? { hora } : {}) }))]));
  out.hermandades[slug] = { ciudad: h.ciudad, dia: h.dia, fuente: x.fuente ? FUENTE_A_MANO[x.fuente] : e ? e.fuente : (FUENTES.find(([c]) => c === h.ciudad) || [])[2] || '', pdf: x.pdf, ...(e && e.horas_fuente ? { horas_fuente: e.horas_fuente } : {}), tramos, a_mano: `${x.pdf}, p. ${x.pagina}`, ...(x.pendiente ? { pendiente: x.pendiente } : {}) };
}
for (const [slug, e] of Object.entries(out.hermandades)) if (e.ciudad === 'granada') {
  if (PAG_GR[slug]) e.fuente = fuenteGR(slug); else console.warn('Granada sin página en la guía oficial:', slug);
}
// limpieza final de etiquetas en todas las ciudades
const lim = { quitados: 0, horasRescatadas: 0 };
for (const e of Object.values(out.hermandades)) for (const k of Object.keys(e.tramos)) {
  const r = limpiar(e.ciudad, e.tramos[k]); e.tramos[k] = r.pts; lim.quitados += r.quitados; lim.horasRescatadas += r.horasRescatadas;
}
const OUT = path.join(DIR, '..', 'sources', 'itinerarios-2026.json');
fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
const por = {}; for (const e of Object.values(out.hermandades)) por[e.ciudad] = (por[e.ciudad] || 0) + 1;
console.log('Málaga horarios:', JSON.stringify(est), '· limpieza:', JSON.stringify(lim));
console.log('Con itinerario:', Object.keys(out.hermandades).length, JSON.stringify(por), '· sin emparejar:', out.sin_emparejar.length);
for (const s of out.sin_emparejar) console.log('  ?', s.ciudad, s.dia, '|', s.cabecera, s.sub || '', '→', s.opciones.join(' '));
