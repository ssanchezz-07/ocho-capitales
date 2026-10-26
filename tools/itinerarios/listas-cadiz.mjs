// Ocho Capitales: lista oficial de calles 2026 de cada hermandad de Cádiz, con ida, regreso, horas y sede.
// Entrada: cache/cadiz-2026-crudo.json (leer-cadiz-2026.py sobre el programa de Canal Sur) y sedes-cadiz.json.
// Salida: listas-cadiz-2026.json. No interpreta calles: cada elemento guarda el texto literal del programa
// y, aparte, la calle sin la indicación de lado («(Izq.)», «(Drcha.)»…), para el emparejador.
// Uso: node tools/itinerarios/listas-cadiz.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const crudo = JSON.parse(fs.readFileSync(path.join(DIR, 'cache', 'cadiz-2026-crudo.json'), 'utf8'));
const S = JSON.parse(fs.readFileSync(path.join(DIR, 'sedes-cadiz.json'), 'utf8'));

// Cabecera del programa → ficha del portal (portal-cofrade/data/portal.json). La Humillación tiene ficha desde el 2026-10-26 («Humillación (Piedad)», alta en tools/sources/complementos.json).
const SLUG = {
  'SERVITAS': 'servitas-cadiz', 'NAZARENO DE LA OBEDIENCIA': 'merced-obediencia-cadiz', 'HUMILLACIÓN': 'humillacion-piedad-cadiz',
  'LA BORRIQUITA': 'la-borriquita-cadiz', 'LAS PENAS': 'las-penas-cadiz', 'SAGRADA CENA': 'sagrada-cena-cadiz',
  'DESPOJADO': 'el-despojado-cadiz', 'HUMILDAD Y PACIENCIA': 'humildad-y-paciencia-cadiz', 'NAZARENO DEL AMOR': 'nazareno-del-amor-cadiz',
  'LA PALMA': 'la-palma-cadiz', 'EL PRENDIMIENTO': 'el-prendimiento-cadiz', 'VERA+CRUZ': 'vera-cruz-cadiz', 'SANIDAD': 'la-sanidad-cadiz',
  'PIEDAD': 'la-piedad-cadiz', 'JESÚS CAÍDO': 'jesus-caido-el-senor-del-parque-cadiz', 'COLUMNA': 'la-columna-cadiz', 'ECCE-HOMO': 'ecce-homo-cadiz',
  'LA SENTENCIA': 'la-sentencia-cadiz', 'LAS CIGARRERAS': 'las-cigarreras-cadiz', 'LAS AGUAS': 'las-aguas-cadiz', 'CAMINITO': 'el-caminito-cadiz',
  'AFLIGIDOS': 'los-afligidos-cadiz', 'ORACIÓN EN EL HUERTO': 'oracion-en-el-huerto-cadiz', 'EL NAZARENO': 'nazareno-de-santa-maria-cadiz',
  'MEDINACELI': 'medinaceli-cadiz', 'EL PERDÓN': 'el-perdon-cadiz', 'SIETE PALABRAS': 'siete-palabras-cadiz', 'EXPIRACIÓN': 'la-expiracion-cadiz',
  'DESCENDIMIENTO': 'el-descendimiento-cadiz', 'BUENA MUERTE': 'la-buena-muerte-cadiz', 'ECCE-MATER-TUA': 'ecce-mater-tua-cadiz',
  'SANTO ENTIERRO': 'santo-entierro-cadiz', 'LA RESURRECCIÓN': 'la-resurreccion-cadiz',
};
const DIA = (d) => d.charAt(0) + d.slice(1).toLowerCase().replace(/ de (\w)/, (m, c) => ' de ' + c.toUpperCase()).replace(/ santo$/, ' Santo').replace(/ ramos$/, ' Ramos');

// Erratas del programa que impiden separar las calles; se anotan en el propio elemento.
const ERRATAS = [
  [/Plaza de Mina\. Tinte/, 'Plaza de Mina, Tinte', 'punto en lugar de coma'],
  [/Plaza del Palillero Columela/, 'Plaza del Palillero, Columela', 'falta la coma'],
  [/\)\s+(?=[A-ZÁÉÍÓÚ])/g, '), ', 'falta la coma tras el paréntesis'],
  [/,(?=\S)/g, ', ', 'falta el espacio tras la coma'],
];
const ERRATAS_PABLO = {
  'siete-palabras-cadiz': [{ tras: 'Plaza San Agustín', de: 'San Agustín', a: 'San Francisco', nota: '«San Agustín» por «San Francisco» (la calle que une la Plaza de San Agustín con Nueva; confirmado por Pablo el 2026-10-26)' }],
};
const CATEDRAL = /\(?\s*Estaci[oó]n de Penitencia en la S\.I\.C\.?\s*\)?/i;
const LADO = [[/^(Izda?|Izqda?|Izq|izq|Lado Izda)\.?$/i, 'izquierda'], [/^(Dcha|Drcha|Dr-?cha)\.?$/i, 'derecha'], [/^centro$/i, 'centro'], [/^interior$/i, 'interior'],
  [/^lado Izda\.?$/i, 'izquierda'], [/^por el lado izquierdo$/i, 'izquierda']];

function elementos(texto) {
  let t = texto, erratas = [];
  for (const [re, por, que] of ERRATAS) if (re.test(t)) { erratas.push(que); t = t.replace(re, por); }
  t = t.replace(CATEDRAL, ', @CATEDRAL@, ').replace(/\s+a su Templo\.?$/i, ', a su Templo').replace(/,\s*su Templo\.?$/i, ', su Templo');
  const out = [];
  for (let p of t.split(/\s*,\s*/)) {
    p = p.trim().replace(/\.$/, '');
    if (!p) continue;
    if (p === '@CATEDRAL@') { out.push({ texto: 'Estación de Penitencia en la S.I.C.', catedral: true }); continue; }
    if (/^(a )?su Templo$/i.test(p)) { out.push({ texto: p, fin: true }); continue; }
    const solo = /^\((.+)\)$/.exec(p);
    if (solo && out.length) { // «Rosario, (Izq.)», «Plaza del Mentidero, (por el lado izquierdo)», «Interior del Parque Genovés, (Paseo de las Palmeras)»
      const prev = out[out.length - 1], l = LADO.find(([re]) => re.test(solo[1].trim()));
      prev.texto += ', ' + p;
      if (l) prev.lado = l[1]; else prev.aclaracion = solo[1];
      continue;
    }
    const e = { texto: p };
    const m = /^(.*?)\s*\(([^)]+)\)$/.exec(p);
    let calle = p;
    if (m) {
      const l = LADO.find(([re]) => re.test(m[2].trim()));
      if (l) { calle = m[1]; e.lado = l[1]; }
    }
    e.calle = calle.replace(/^Plaza Istmo\./, 'Plaza Stmo.').replace(/[“”«»"]/g, '').trim();
    if (/^Plaza Istmo\./.test(calle)) e.errata = '«Istmo.» por «Stmo.»';
    out.push(e);
  }
  return { out, erratas };
}

function templo(nombreCanonica) {
  const c = Object.entries(S.templos).filter(([, t]) => (t.canonica || []).some((k) => nombreCanonica.includes(k)));
  if (c.length !== 1) throw new Error(`sede canónica sin templo único: ${nombreCanonica} → ${c.map((x) => x[0])}`);
  return c[0][0];
}
const sede = (id, fuente) => { const t = S.templos[id]; return { templo: id, nombre: t.nombre, lat: t.lat, lon: t.lon, osm: t.osm, ...(t.dir ? { dir: t.dir, fuente_dir: S.fuentes[t.fuente_dir] || t.fuente_dir } : {}), fuente }; };

const FILAS = (n) => (n === 1 ? ['cruz_de_guia'] : n === 2 ? ['cruz_de_guia', 'paso'] : ['cruz_de_guia', 'paso', 'ultimo_paso']);
const res = {}, avisos = [];
for (const h of crudo.hermandades) {
  if (!(h.cabecera in SLUG)) throw new Error('cabecera sin ficha: ' + h.cabecera);
  const slug = SLUG[h.cabecera];
  const { out, erratas } = elementos(h.texto);
  // Erratas del programa confirmadas por Pablo: la calle limpia se corrige; el texto literal se conserva
  for (const c of ERRATAS_PABLO[slug] || []) { const k = out.findIndex((e, i) => e.calle === c.de && out[i - 1]?.calle === c.tras); if (k < 0) throw new Error(`errata no encontrada: ${slug} ${c.de}`); out[k].calle = c.a; out[k].errata = c.nota; erratas.push(c.nota); }
  const ic = out.findIndex((e) => e.catedral);
  const ida = ic >= 0 ? out.slice(0, ic + 1) : out, regreso = ic >= 0 ? out.slice(ic + 1) : [];
  const canon = templo(h.ficha.sede_canonica), esp = S.hermandades[slug];
  const fPrograma = `${crudo.url} (ficha, pág. ${h.ficha.pagina})`;
  const hz = h.ficha.horas, horas = {};
  if (hz) FILAS(hz.filas.length).forEach((k, i) => (horas[k] = hz.filas[i]));
  const r = {
    nombre_programa: h.cabecera, dia: DIA(h.dia), ficha_portal: SLUG[h.cabecera] !== null,
    fuente: { documento: crudo.fuente, url: crudo.url, pagina_itinerario: h.pagina, pagina_ficha: h.ficha.pagina },
    itinerario_literal: h.texto,
    ida, regreso,
    ...(ic < 0 ? { sin_estacion: 'El itinerario oficial no pasa por la Catedral (no hace estación de penitencia): todo va en «ida».' } : {}),
    ...(erratas.length ? { erratas_del_programa: erratas } : {}),
    sede_canonica: { texto: h.ficha.sede_canonica, templo: canon, fuente: fPrograma },
    salida: esp ? sede(esp.salida, esp.fuente.map((f) => S.fuentes[f])) : sede(canon, [fPrograma]),
    entrada: esp ? sede(esp.entrada, esp.fuente.map((f) => S.fuentes[f])) : sede(canon, [fPrograma]),
    ...(esp ? { sede_2026: { cita: esp.cita, ...(esp.nota ? { nota: esp.nota } : {}) } } : {}),
    horas: hz ? { anio_de_la_tabla: hz.anio_tabla, columnas: hz.columnas, ...horas } : null,
  };
  if (hz && hz.anio_tabla && hz.anio_tabla !== '2026') avisos.push(`${slug}: la tabla de horas del programa dice ${hz.anio_tabla}`);
  if (!hz || !hz.columnas_ok) avisos.push(`${slug}: tabla de horas incompleta`);
  if (!out.length || !out[out.length - 1].fin) avisos.push(`${slug}: el itinerario no acaba en «a su Templo»`);
  if (ic < 0) avisos.push(`${slug}: sin estación de penitencia en la Catedral`);
  if (!r.ficha_portal) avisos.push(`${slug}: no tiene ficha en el portal (portal.json); no se puede publicar en el plano hasta que la tenga`);
  res[slug] = r;
}
const sal = {
  _nota: 'Listas oficiales de calles 2026 de Cádiz (Programa de Canal Sur Radio con los itinerarios del Consejo), con sede de salida y entrada y horas de paso. Generado por tools/itinerarios/listas-cadiz.mjs; no editar a mano: las correcciones van en correcciones-cadiz.json.',
  ciudad: 'cadiz', anio: 2026, avisos, hermandades: res,
};
fs.writeFileSync(path.join(DIR, 'listas-cadiz-2026.json'), JSON.stringify(sal, null, 1) + '\n');
console.log(Object.keys(res).length, 'hermandades →', 'tools/itinerarios/listas-cadiz-2026.json');
for (const a of avisos) console.log('  aviso:', a);
