// Ocho Capitales · Córdoba: listas oficiales de calles 2026 para el método nuevo (continuidad + GraphHopper).
// Fuente: rejilla oficial de la Agrupación de Hermandades y Cofradías de Córdoba («Itinerario Córdoba 2026.pdf»),
// ya leída por leer-cordoba.py en cordoba-2026.json: un punto cada 10 minutos para la cruz de guía y otro para el
// final del cortejo. Las dos columnas recorren las mismas calles; se unen en una sola lista ordenada (la de la cruz de
// guía manda y se intercalan las calles que solo aparecen en la del final), con los nombres tal como los escribe el PDF.
// La sede (templo de salida y entrada) sale de casas-hermandad-cordoba.json, con su fuente.
// Uso: node tools/itinerarios/listas-cordoba.mjs  →  tools/itinerarios/listas-cordoba.json
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ITI = path.dirname(fileURLToPath(import.meta.url));
const REJ = JSON.parse(fs.readFileSync(path.join(ITI, 'cordoba-2026.json'), 'utf8'));
const SEDES = JSON.parse(fs.readFileSync(path.join(ITI, 'casas-hermandad-cordoba.json'), 'utf8'));
const FUENTE = 'Agrupación de Hermandades y Cofradías de Córdoba, itinerario oficial 2026 (rejilla de horarios, «Itinerario Córdoba 2026.pdf»): https://www.hermandadesdecordoba.es/itinerario-2026/';

// rótulo de la rejilla → id del sitio
const IDS = {
  'LA O': 'la-o', 'LÁGRIMAS': 'lagrimas', 'ENTRADA TRIUNFAL': 'entrada-triunfal', 'PENAS': 'penas-de-santiago',
  'HUERTO': 'el-huerto', 'RESCATADO': 'el-rescatado', 'VERA CRUZ': 'vera-cruz', 'ESPERANZA': 'la-esperanza',
  'AMOR': 'el-amor', 'MERCED': 'la-merced', 'PRESENTACIÓN': 'presentacion-al-pueblo', 'ESTRELLA': 'la-estrella',
  'SENTENCIA': 'la-sentencia', 'VÍA CRUCIS': 'via-crucis', 'ÁNIMAS': 'animas', 'AGONÍA': 'la-agonia',
  'UNIVERSITARIA': 'la-universitaria', 'SANGRE': 'la-sangre', 'BUEN SUCESO': 'el-buen-suceso', 'SANTA FAZ': 'la-santa-faz',
  'PRENDIMIENTO': 'el-prendimiento', 'PERDÓN': 'el-perdon', 'PAZ': 'la-paz', 'CALVARIO': 'el-calvario',
  'MISERICORDIA': 'la-misericordia', 'PASIÓN': 'la-pasion', 'PIEDAD': 'la-piedad', 'NAZARENO': 'jesus-nazareno',
  'CARIDAD': 'la-caridad', 'CAÍDO': 'jesus-caido', 'CENA': 'la-cena', 'ANGUSTIAS': 'las-angustias',
  'CRISTO DE GRACIA': 'cristo-de-gracia-el-esparraguero', 'BUENA MUERTE': 'la-buena-muerte', 'SEPULCRO': 'santo-sepulcro',
  'SOLEDAD': 'la-soledad', 'EXPIRACIÓN': 'la-expiracion', 'DESCENDIMIENTO': 'el-descendimiento', 'CONVERSIÓN': 'la-conversion',
  'DOLORES': 'los-dolores', 'DOLORES (Alcolea)': 'dolores-de-alcolea', 'RESUCITADO': 'el-resucitado',
};

// El lector no recoge la columna «cruz de guía» del Perdón (Miércoles Santo, primera columna de la página).
// Transcrita a mano del texto del PDF (pdftotext -layout), fila a fila y con la misma ortografía.
const PERDON_CRUZ = [
  ['17:00', 'SALIDA (17:15)'], ['17:10', 'BUEN PASTOR'], ['17:20', 'VALLADARES'], ['17:40', 'TESORO'], ['17:50', 'TESORO'],
  ['18:00', 'PLAZA DE LA TRINIDAD'], ['18:10', 'LOPE DE HOCES'], ['18:20', 'PUERTA ALMODÓVAR'], ['18:30', 'DOCTOR FLEMING'],
  ['18:40', 'DOCTOR FLEMING'], ['18:50', 'DOCTOR FLEMING'], ['19:00', 'DOCTOR FLEMING'], ['19:10', 'CAMPO SANTOS MÁRTIRES'],
  ['19:20', 'SANTA TERESA JORNET'], ['19:30', 'RONDA DE ISASA'], ['19:40', 'ENTRADA C.O. 19:45'], ['19:50', 'TRIUNFO'],
  ['20:00', 'TORRIJOS'], ['20:10', 'PUERTA DEL PERDÓN'], ['20:20', 'PUERTA DE LAS COFRADÍAS 20:25'], ['20:30', 'INTERIOR S.I.C.'],
  ['20:40', 'PATIO NARANJOS'], ['20:50', 'SALIDA C.O. 20:50'], ['21:00', 'MAGISTRAL GONZÁLEZ FRANCÉS'], ['21:10', 'CARDENAL GONZÁLEZ'],
  ['21:20', 'CARDENAL GONZÁLEZ'], ['21:30', 'CRUZ DEL RASTRO'], ['21:40', 'SAN FERNADO'], ['21:50', 'SAN FERNANDO'],
  ['22:00', 'SAN FERNANDO'], ['22:10', 'CLAUDIO MARCELO'], ['22:20', 'MARIA CRISTINA'], ['22:30', 'CONDE DE CÁRDENAS'],
  ['22:40', 'PLAZA DE LA COMPAÑÍA'], ['22:50', 'SANTA VICTORIA'], ['23:00', 'ÁNGEL DE SAAVEDRA'], ['23:10', 'BARROSO'],
  ['23:20', 'PLAZA SAN JUAN'], ['23:30', 'VALLADARES'], ['23:40', 'BUEN PASTOR'], ['23:50', 'BUEN PASTOR'], ['0:00', 'ENTRADA (0:00)'],
].map(([fila, t]) => { const m = t.match(/\(?(\d{1,2}:\d{2})\)?/); return { fila, lugar: t.replace(/\s*\(?\d{1,2}:\d{2}\)?\s*/, ' ').trim(), ...(m ? { hora: m[1] } : {}) }; });

const sn = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[.,;:()]/g, ' ').replace(/\s+/g, ' ').trim();
const TIPOS = /^(c\/|c |calle|avda|av|avd|avenida|plz|pza|plaza|paza|plazuela|ronda|ronde|paseo|cuesta|pasaje|ps|pso|ctra|carretera|glorieta)\b\s*/;
const ABREV = { glez: 'gonzalez', ntra: 'nuestra', ntro: 'nuestro', sra: 'senora', stmo: 'santisimo', sto: 'santo', sta: 'santa', dr: 'doctor', 'mª': 'maria' };
const clave = (s) => {
  let k = sn(s.replace(/\(.*?\)/g, ' ')).replace(/^c\//, ''); // «SAN PABLO (IGLESIA)» = «SAN PABLO»
  for (let i = 0; i < 2; i++) k = k.replace(TIPOS, '');
  return k.split(' ').map((w) => ABREV[w] ?? w).join(' ').replace(/\b(de|del|la|las|los|el|y|e)\b/g, ' ').replace(/\s+/g, ' ').trim();
};
const lev = (a, b) => { const d = Array.from({ length: a.length + 1 }, (_, i) => [i]); for (let j = 1; j <= b.length; j++) d[0][j] = j; for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return d[a.length][b.length]; };
// mismas calles escritas de otra forma en la prensa y en la rejilla (clave de prensa → clave de rejilla). Las marcadas
// con «errata» son errores de la guía de prensa: se muestra el nombre de la rejilla oficial.
const EQUIV = {
  'rafae hoz': ['rafael hoz arderius', 'errata'], 'arco bajo corredera': ['arco bajo'], 'arco alto corredera': ['arco alto'],
  'conde vallellano': ['vallellano'], 'virgen perpetuo socorrro': ['perpetuo socorro', 'errata'], 'huerto san pedro real': ['huerto san pedro'],
  'mayor santa catalina': ['mayor santa marina', 'errata'], 'pintor bartolome blanco': ['parroco bartolome blanco', 'errata'],
  'san pablo plaza san andres': ['san pablo', 'errata'], 'santisimo cristo gracia': ['santo cristo gracia'],
};
const igual = (a, b) => a === b || (a.length > 5 && b.length > 5 && lev(a, b) <= 1) // «SAN FERNADO» = «SAN FERNANDO» (errata del PDF)
  || EQUIV[a]?.[0] === b || EQUIV[b]?.[0] === a;

const tipo = (s) => {
  const k = sn(s);
  if (/^salida c o\b/.test(k)) return 'salida_co';
  if (/^entrada c o\b/.test(k)) return 'entrada_co';
  if (/^salida\b/.test(k)) return 'salida';
  if (/^entrada\b/.test(k)) return 'entrada';
  if (/^(puerta del perdon|puerta de (las )?cofradias|interior s i c|patio (de los )?naranjos)/.test(k)) return 'catedral';
  return 'calle';
};

// secuencia de una columna: la misma calle en filas seguidas cuenta una vez; se guarda la primera y la última fila
function secuencia(puntos) {
  const s = [];
  for (const p of puntos) {
    const lugar = p.lugar.replace(/\s+hy$/, '').trim(); // «JUDERÍA hy»: resto de otra celda pegado por el lector
    if (!lugar || /^(cruz de gu[ií]a|final del cortejo)$/i.test(lugar)) continue;
    if (lugar === 'Entrada Triunfal') continue; // rótulo de la página del Domingo de Ramos colado en las columnas vecinas
    if (!/[A-Za-zÁÉÍÓÚÑáéíóúñ]{3}/.test(lugar)) continue; // basura del lector («''''''''''+`3»)
    if (/^\(.*\)$/.test(lugar)) continue; // «(P. PERDÓN)»: acotación de la celda anterior, no un lugar
    const k = clave(lugar), u = s.at(-1);
    if (u && igual(u.k, k) && tipo(lugar) === u.tipo) { u.hasta = p.fila; if (p.hora && !u.hora) u.hora = p.hora; continue; }
    s.push({ lugar, k, tipo: tipo(lugar), desde: p.fila, hasta: p.fila, ...(p.hora ? { hora: p.hora } : {}) });
  }
  // la rejilla del final del cortejo de la Buena Muerte (madrugada) sale con el regreso delante: se empieza en SALIDA
  const i = s.findIndex((e) => e.tipo === 'salida');
  const r = i > 0 ? s.slice(i).concat(s.slice(0, i)) : s;
  // lo que viene tras la ENTRADA es de otra hermandad (Nazareno: «ENTRADA · El Perdón» al pie de la página)
  const f = r.findIndex((e, k) => k > 0 && e.tipo === 'entrada');
  return f > 0 ? r.slice(0, f + 1) : r;
}

// une dos secuencias con la subsecuencia común más larga: manda la cruz de guía y se intercala lo que solo da el final
function unir(a, b) {
  const n = a.length, m = b.length, L = Array.from({ length: n + 1 }, () => new Int32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i][j] = igual(a[i].k, b[j].k) && a[i].tipo === b[j].tipo ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  const out = []; let i = 0, j = 0;
  while (i < n || j < m) {
    if (i < n && j < m && igual(a[i].k, b[j].k) && a[i].tipo === b[j].tipo) { out.push({ a: a[i], b: b[j] }); i++; j++; }
    else if (j < m && (i >= n || L[i][j + 1] >= L[i + 1][j])) { out.push({ b: b[j] }); j++; }
    else { out.push({ a: a[i] }); i++; }
  }
  return out;
}

// recorrido de prensa («Salida, Valladares, …, Santa Flora y María y Entrada.») → elementos
const PRENSA = JSON.parse(fs.readFileSync(path.join(ITI, 'cordoba-prensa-2026.json'), 'utf8'));
const tipoPrensa = (s) => {
  const k = sn(s);
  if (/^entrad?a? en (co|c o|carrera oficial)\b/.test(k)) return 'entrada_co';
  if (/^salida (de )?(co|c o|carrera oficial)\b/.test(k)) return 'salida_co';
  if (/^(puerta del? perdon|puerta de (las )?(cofradias|palmas)|(puerta|salida) (de |e )?santa catalina|interior( de la)? sic|patio de los naranjos)\b/.test(k)) return 'catedral';
  if (/^salida\b/.test(k)) return 'salida'; // «Salida», «Salida desde su templo»
  if (/^entrada\b/.test(k)) return 'entrada';
  return 'calle';
};
function prensa(txt) {
  const partes = txt.replace(/\.\s*$/, '').split(/,|\.\s+(?=[A-ZÁÉÍÓÚÑ])/).map((t) => t.trim()).filter(Boolean) // «Caravaca de la Cruz. Ronda del Marrubial»
    // «María Auxiliadora y plaza Santísimo Cristo de Gracia», «Santa Flora y María y Entrada»: se parte solo si tras la «y» viene un tipo de vía
    .flatMap((t) => t.split(/\s+y\s+(?=(?:plaza|plazuela|calle|avenida|avda|paseo|glorieta|ronda|cuesta|puerta|entrada)\b)/i));
  const s = partes.map((lugar) => ({ lugar, k: clave(lugar), tipo: tipoPrensa(lugar) }));
  // repeticiones de la guía: «San Fernando, Diario de Córdoba, San Fernando, Diario de Córdoba» (Entrada Triunfal)
  for (let i = s.length - 1; i > 0; i--) {
    if (s[i].k === s[i - 1].k) s.splice(i, 1);
    else if (i >= 3 && s[i].k === s[i - 2].k && s[i - 1].k === s[i - 3].k) s.splice(i - 1, 2);
  }
  return s;
}

const porId = {};
for (const c of REJ.columnas) {
  const id = IDS[c.cabecera]; if (!id) { console.warn('sin id:', c.cabecera); continue; }
  const h = (porId[id] ??= { cab: c.cabecera, dia: c.dia });
  h[c.sub === 'cruz de guía' ? 'cruz' : 'final'] = c.puntos;
}
porId['el-perdon'].cruz = PERDON_CRUZ;

const salida = {}, avisos = [];
for (const [id, h] of Object.entries(porId)) {
  const sid = id + '-cordoba';
  const a = h.cruz ? secuencia(h.cruz) : [], b = h.final ? secuencia(h.final) : [];
  if (!h.final) avisos.push(`${sid}: la rejilla no trae columna de final del cortejo; solo la cruz de guía`);
  // 1) rejilla: cruz de guía + final del cortejo
  const rej = unir(a, b).map(({ a: x, b: y }) => {
    const e = { ...(x || y) };
    e.cruz = x ? x.desde : null; e.final = y ? y.desde : null;
    e.hora = x?.hora ?? null; e.hora_final = y?.hora ?? null;
    return e;
  });
  // 2) prensa (si la hay) + rejilla: el orden lo da el recorrido de prensa; las marcas de la carrera oficial, la rejilla
  const pr = PRENSA.hermandades[sid];
  // dentro de la carrera oficial y la Catedral manda la rejilla (marcas con hora); las puertas que nombra la prensa se guardan aparte
  const todoPre = pr?.recorrido ? prensa(pr.recorrido) : null;
  const pre = todoPre?.filter((e) => !['entrada_co', 'salida_co', 'catedral'].includes(e.tipo)) ?? null;
  const catedralPrensa = todoPre?.filter((e) => e.tipo === 'catedral').map((e) => e.lugar) ?? [];
  const u = (pre ? unir(pre, rej) : rej.map((r) => ({ b: r }))).map(({ a: p, b: r }) => ({
    lugar: p && r && EQUIV[p.k]?.[1] === 'errata' ? r.lugar : p ? p.lugar : r.lugar, tipo: (p || r).tipo,
    ...(p && r && EQUIV[p.k]?.[1] === 'errata' ? { prensa: p.lugar } : {}),
    origen: p && r ? 'prensa y rejilla' : p ? 'prensa' : 'rejilla',
    ...(r ? { rejilla: r.lugar, cruz: r.cruz, final: r.final, ...(r.hora ? { hora: r.hora } : {}), ...(r.hora_final ? { hora_final: r.hora_final } : {}) } : {}),
  }));
  const iCat = u.findIndex((e) => e.tipo === 'catedral'), iSco = u.findIndex((e) => e.tipo === 'salida_co');
  const corte = iSco >= 0 ? iSco : u.findLastIndex((e) => e.tipo === 'catedral');
  if (iCat < 0) avisos.push(`${sid}: sin paso por la Catedral`);
  if (!pre) avisos.push(`${sid}: sin recorrido de prensa; solo la rejilla oficial`);
  const soloPrensa = u.filter((e) => e.origen === 'prensa' && e.tipo === 'calle').map((e) => e.lugar);
  const soloRejilla = u.filter((e) => e.origen === 'rejilla' && e.tipo === 'calle').map((e) => e.lugar);
  const sede = SEDES[sid];
  if (!sede) avisos.push(`${sid}: sin sede en casas-hermandad-cordoba.json`);
  salida[sid] = {
    dia: h.dia, cabecera: h.cab,
    fuentes: [FUENTE + (id === 'el-perdon' ? ' (columna de la cruz de guía transcrita a mano del PDF)' : ''), ...(pr ? [`El Debate · La Voz de Córdoba, guía de 2026: ${pr.url}`] : [])],
    horario_prensa: pr?.horario ?? null,
    // sale del Patio de los Naranjos por la puerta del Perdón: «SALIDA C.O. (PUERTA PERDÓN)» o la acotación «(P. PERDÓN)» de la rejilla
    salida_perdon: [...(h.cruz || []), ...(h.final || [])].some((p) => /\(P(UERTA)?\.? ?PERD/i.test(p.lugar)),
    sede: sede ? { templo: sede.templo, dir: sede.dir ?? null, fuente: sede.fuente, ...(sede.salida ? { salida: sede.salida.templo } : {}), ...(sede.falta ? { falta: sede.falta } : {}) } : null,
    calles: u.map((e) => e.lugar),
    diferencias: { solo_prensa: soloPrensa, solo_rejilla: soloRejilla },
    ...(catedralPrensa.length ? { catedral_prensa: catedralPrensa } : {}),
    elementos: u.map((e, i) => ({ ...e, tramo: corte >= 0 && i > corte ? 'regreso' : 'ida' })),
  };
}
const fOut = path.join(ITI, 'listas-cordoba.json');
fs.writeFileSync(fOut, JSON.stringify({ ciudad: 'Córdoba', anio: 2026, nota: 'Cada lista une dos fuentes de 2026: el recorrido calle a calle de la guía de El Debate (manda en el orden y en los nombres) y la rejilla oficial de la Agrupación (cruz de guía y final del cortejo, un punto cada 10 minutos: aporta las horas, las marcas de la carrera oficial y las calles que la prensa no nombra). «origen» dice de dónde sale cada elemento; «diferencias», qué calles da solo una de las dos.', avisos, hermandades: salida }, null, 1));
console.log(Object.keys(salida).length, 'hermandades →', path.relative(process.cwd(), fOut));
for (const a of avisos) console.log('aviso:', a);
