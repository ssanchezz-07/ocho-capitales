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
// Erratas y omisiones del programa, con su fuente. «de»→«a» cambia la calle limpia (el texto literal se conserva);
// «insertar» añade una calle que el programa omite, entre «tras» y «antes».
const ERRATAS_PABLO = {
  'siete-palabras-cadiz': [{ tras: 'Plaza San Agustín', de: 'San Agustín', a: 'San Francisco', nota: '«San Agustín» por «San Francisco» (la calle que une la Plaza de San Agustín con Nueva; confirmado por Pablo el 2026-10-26)' }],
  'el-descendimiento-cadiz': [{ tras: 'Plaza Palillero', de: 'Javier de Burgos', a: 'Novena', nota: 'regreso «Plaza Palillero, Novena, Barrié» y no «Javier de Burgos» (Canal Sur): así lo dan el cuadernillo de Radio Cádiz 2026 (pág. 41) y Andalucía Información (https://www.andaluciainformacion.es/articulo/cadiz-cofrade/guia-completa-semana-santa-cadiz-2026-horarios-itinerarios/202603251050453233593.html); Isla Pasión tampoco nombra Javier de Burgos (resuelto por la sesión coordinadora a petición de Pablo, 2026-10-27)' }, { tras: 'Plaza Palillero', antes: 'San Francisco', insertar: 'Columela', nota: 'falta «Columela» entre la Plaza del Palillero y San Francisco (ida): la trae el cuadernillo de Radio Cádiz 2026, pág. 41, y es el mismo paso que hace La Palma' }],
};
// Segunda fuente de 2026 (cruzdeguia-cadiz.mjs): cuadernillo de Radio Cádiz, con templo, itinerario y horas
const fCG = path.join(DIR, 'cadiz-2026-cruzdeguia.json');
const CG = fs.existsSync(fCG) ? JSON.parse(fs.readFileSync(fCG, 'utf8')) : null;
const claveC = (t) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\(.*?\)/g, " ").replace(/\b(plaza|calle|avda|avenida|de|del|la|las|el|los)\b|[.“”"]/g, " ").replace(/\s+/g, " ").trim();
// Diferencias entre las dos fuentes de 2026 que quedan para Pablo (se mantiene el programa de Canal Sur)
const DUDAS = {
  'el-perdon-cadiz': 'Resuelto (2026-10-27): la cruz de guía sale a las 00:50 en las cuatro fuentes (Canal Sur, pág. 24; Andalucía Información, https://www.andaluciainformacion.es/articulo/cadiz-cofrade/guia-completa-semana-santa-cadiz-2026-horarios-itinerarios/202603251050453233593.html; Isla Pasión, https://islapasion.net/horarios-e-itinerarios-completos-de-la-semana-santa-de-cadiz-2026-guia-con-todas-las-hermandades-dia-a-dia/; OKDiario, https://okdiario.com/andalucia/procesiones-semana-santa-cadiz-2026-fechas-horario-recorrido-16449980). El plano usa, como en todas, la fila del primer paso, que en Canal Sur es «PASO DE MISTERIO» a las 01:10 (el cuadernillo de Radio Cádiz da 01:30 a ese paso).',
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
  // coincidencia con la segunda fuente, calle a calle, antes de corregir nada
  const cg = CG?.hermandades[slug];
  const seq = (o) => o.map((e) => (e.catedral ? 'EST' : e.fin ? 'FIN' : claveC(e.calle))), a1 = seq(out), a2 = cg ? seq(elementos(cg.itinerario_literal).out) : null;
  let dif = null; if (a2 && a1.join('|') !== a2.join('|')) { let i = 0; while (i < a1.length && a1[i] === a2[i]) i++; dif = `desde el elemento ${i}: programa «${a1.slice(i, i + 3).join(', ')}», cuadernillo «${a2.slice(i, i + 3).join(', ')}»`; }
  for (const c of ERRATAS_PABLO[slug] || []) {
    if (c.insertar) { const k = out.findIndex((e, i) => e.calle === c.tras && out[i + 1]?.calle === c.antes); if (k < 0) throw new Error(`omisión no encontrada: ${slug} ${c.insertar}`); out.splice(k + 1, 0, { texto: '', calle: c.insertar, insertada: c.nota }); erratas.push(c.nota); continue; }
    const k = out.findIndex((e, i) => e.calle === c.de && out[i - 1]?.calle === c.tras); if (k < 0) throw new Error(`errata no encontrada: ${slug} ${c.de}`); out[k].calle = c.a; out[k].errata = c.nota; erratas.push(c.nota);
  }
  const ic = out.findIndex((e) => e.catedral);
  const ida = ic >= 0 ? out.slice(0, ic + 1) : out, regreso = ic >= 0 ? out.slice(ic + 1) : [];
  const canon = templo(h.ficha.sede_canonica), esp = S.hermandades[slug];
  const fPrograma = `${crudo.url} (ficha, pág. ${h.ficha.pagina})`;
  const hz = h.ficha.horas, horas = {};
  // Humillación (pág. 8): no pasa por Nueva y la columna rotulada «NUEVA» es la entrada en la Catedral; todo va una columna
  // antes y la última (23:40 / 00:00) no tiene rótulo. Así cuadra con el cuadernillo de Radio Cádiz 2026 (pág. 6).
  if (slug === 'humillacion-piedad-cadiz' && hz?.columnas?.[1] === 'nueva') {
    const cols = ['salida', 'catedral_entrada', 'catedral_salida', 'candelaria', 'palillero', 'entrada', 'sin_rotulo'];
    hz.filas = hz.filas.map((f) => Object.fromEntries(hz.columnas.map((c, i) => [cols[i], f[c]]).filter(([, v]) => v)));
    hz.columnas = cols; hz.nota = 'Columnas de la tabla del programa corregidas: «NUEVA» es la entrada en la Catedral (no pasa por Nueva); la última hora no tiene rótulo y no se usa. Coincide con el cuadernillo de Radio Cádiz 2026.';
  }
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
    horas: hz ? { anio_de_la_tabla: hz.anio_tabla, columnas: hz.columnas, ...(hz.nota ? { nota: hz.nota } : {}), ...horas } : null,
    ...(DUDAS[slug] ? { duda: DUDAS[slug] } : {}),
    ...(cg ? { segunda_fuente: { documento: CG.fuente, url: CG.url, pagina: cg.pagina, templo_2026: cg.templo, itinerario: dif ? 'difiere ' + dif : 'coincide calle a calle con el programa', horas: cg.horas } } : {}),
  };
  // horas de la tabla rotulada con otro año: valen si el cuadernillo de 2026 da las mismas
  if (hz && hz.anio_tabla && hz.anio_tabla !== '2026' && cg) {
    const v = (k) => cg.horas.filter(([n]) => n === k).map(([, h]) => h.replace('.', ':').padStart(5, '0'));
    const igual = r.horas.cruz_de_guia?.salida === v('Salida')[0] && r.horas.cruz_de_guia?.entrada === v('Recogida')[0] && r.horas.paso?.salida === v('Salida')[1];
    if (igual) { r.horas.anio_de_la_tabla = '2026'; r.horas.nota = `La tabla del programa dice «${hz.anio_tabla}», pero son las horas de 2026: las mismas del cuadernillo de Radio Cádiz 2026, pág. ${cg.pagina}.`; hz.anio_tabla = '2026'; }
  }
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
