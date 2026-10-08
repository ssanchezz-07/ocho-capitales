// Ocho Capitales: importa el acompañamiento musical de la Semana Santa de Málaga desde Málaga Musical
// (https://malagamusical.blogspot.com/): lista completa de 2026 y «Novedades 2027».
// Guarda tools/sources/malaga-musical.json con la fuente y avisa de lo que no consigue enlazar.
// Uso: node tools/importar-malaga-musical.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const D = JSON.parse(fs.readFileSync(path.join(DIR, '..', 'portal-cofrade', 'data', 'portal.json'), 'utf8'));
const OUT = path.join(DIR, 'sources', 'malaga-musical.json');
const UA = 'OchoCapitales/1.0 (https://github.com/ssanchezz-07/ocho-capitales; portal cofrade sin animo de lucro)';
const U26 = 'https://malagamusical.blogspot.com/2026/04/2026.html';
const U27 = 'https://malagamusical.blogspot.com/2026/04/novedades2027.html';
const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();

// Nombre usado por el blog → slug en el portal (solo Málaga). «Columna» es la cofradía de los Gitanos.
const COF = {
  'pollinica': 'pollinica', 'lagrimas y favores': 'lagrimas-y-favores', 'dulce nombre': 'dulce-nombre', 'salutacion': 'salutacion', 'humildad': 'humildad',
  'salud': 'salud', 'humildad y paciencia': 'humildad-y-paciencia', 'huerto': 'huerto', 'prendimiento': 'prendimiento', 'pasion': 'pasion', 'crucifixion': 'crucifixion',
  'columna': 'gitanos', 'dolores del puente': 'dolores-del-puente', 'cautivo': 'cautivo', 'estudiantes': 'estudiantes', 'rocio': 'rocio', 'penas': 'penas',
  'nueva esperanza': 'nueva-esperanza', 'humillacion': 'humillacion-y-estrella', 'rescate': 'rescate', 'sentencia': 'sentencia', 'fusionadas': 'fusionadas',
  'mediadora': 'mediadora', 'salesianos': 'salesianos', 'sangre': 'sangre', 'rico': 'el-rico', 'el rico': 'el-rico', 'la puente': 'paloma', 'expiracion': 'expiracion', 'cena': 'sagrada-cena',
  'vineros': 'vineros', 'santa cruz': 'santa-cruz', 'vera cruz': 'vera-cruz', 'mena': 'mena', 'zamarrilla': 'zamarrilla', 'misericordia': 'misericordia',
  'esperanza': 'esperanza', 'calvario': 'monte-calvario', 'descendimiento': 'descendimiento', 'amor': 'amor', 'dolores de san juan': 'dolores-de-san-juan',
  'piedad': 'piedad', 'santo sepulcro': 'santo-sepulcro', 'servitas': 'servitas', 'resucitado': 'resucitado', 'verdad y sagrario': 'verdad-y-sagrario',
  'medinaceli': 'medinaceli-martiricos', 'jesus ante anas': null, 'soledad de san pablo': null, 'monte calvario': 'monte-calvario', 'traslado': 'traslado',
};
const SLUGS = new Set(D.hermandades.filter((h) => h.ciudad === 'malaga').map((h) => h.slug.replace(/-malaga$/, '')));
const DIAS = ['DOMINGO DE RAMOS', 'LUNES SANTO', 'MARTES SANTO', 'MIÉRCOLES SANTO', 'JUEVES SANTO', 'VIERNES SANTO', 'DOMINGO DE RESURRECCIÓN'];
const ROLES = /^(cruz de gu[ií]a|cristo|virgen|abriendo secci[oó]n de la virgen|delante del trono.*|delante del trono|exaltaci[oó]n|azotes y columna|[aá]nimas de ciegos)$/i;

const decode = (s) => s.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n)).replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
async function fetchText(url) {
  const r = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!r.ok) throw new Error(url + ' → ' + r.status);
  const h = await r.text();
  const m = h.match(/<div class=['"]post-body[^>]*>([\s\S]*?)<div class=['"]post-footer/);
  const body = (m ? m[1] : h).replace(/<br\s*\/?>/g, '\n').replace(/<\/(p|div|tr|li|h\d)>/g, '\n').replace(/<\/t[dh]>/g, ' | ').replace(/<[^>]+>/g, '');
  return decode(body).split('\n').map((l) => l.replace(/\s+/g, ' ').trim()).filter(Boolean);
}

const ABR = [[/Ntra\. ?Sra\./g, 'Nuestra Señora'], [/Ntro\. ?Padre/g, 'Nuestro Padre'], [/Ntra\./g, 'Nuestra'], [/Ntro\./g, 'Nuestro']];
function parseBand(line) {
  let t = line.replace(/^[-–•]\s*/, '').trim();
  if (!t || /^no lleva/i.test(t)) return null;
  const social = (t.match(/\s@\w+/g) || []).map((x) => x.trim()); t = t.replace(/\s@\w+/g, '').trim();
  const novedad = /\*/.test(t); t = t.replace(/\*/g, '').trim();
  let nota = '';
  const dot = t.match(/^(.*?\)?)\.\s+(.+)$/); if (dot && !/^[a-záéíóú]/.test(dot[2]) === false) { t = dot[1]; nota = dot[2].trim(); }
  const vuelta = t.match(/\(vuelta\)/i); if (vuelta) { nota = 'Vuelta'; t = t.replace(/\(vuelta\)/i, '').trim(); }
  let loc = ''; const par = t.match(/^(.*?)\s*\(([^)]+)\)\s*[.,]?\s*(.*)$/);
  if (par && !/^(propia|vuelta)/i.test(par[2])) { t = par[1]; loc = par[2].split(',')[0].trim(); if (par[3]) nota = (nota ? nota + ' ' : '') + par[3].replace(/^[,.\s]+/, ''); }
  t = t.replace(/[“”"«»]/g, '').replace(/\s+de\s*$/i, '').replace(/[.,;]\s*$/, '').trim();
  for (const [a, b] of ABR) t = t.replace(a, b);
  t = t.replace(/\bDe la\b/, 'de la').replace(/Cornetas Y Tambores/, 'Cornetas y Tambores').replace(/ Ntro\. /, ' Nuestro ');
  if (!t || t.length < 4 || /^(capilla musical|nazarenos con timbales|guardia romana|grupo vocal|tambor del)/i.test(t) && !/^capilla musical \w/i.test(t) && false) return null;
  return { nombre: t, localidad: loc, nota: nota.replace(/\.$/, ''), novedad, redes: social };
}

function parse(lines, conDias) {
  const res = []; let dia = '', cof = null, paso = null;
  for (const l of lines) {
    if (conDias && DIAS.includes(l.toUpperCase()) && l === l.toUpperCase()) { dia = l[0] + l.slice(1).toLowerCase(); cof = null; paso = null; continue; }
    if (/^(asociaciones|hermandades y cofrad)/i.test(l)) { cof = null; continue; }
    if (/^[-–•]/.test(l)) {
      if (!cof) continue;
      const b = parseBand(l); if (!b) continue;
      if (!paso) paso = { paso: 'Cortejo', bandas: [] }, cof.pasos.push(paso);
      paso.bandas.push(b); continue;
    }
    const key = norm(l);
    if (key in COF && !ROLES.test(l)) { cof = { blog: l, slug: COF[key] ? COF[key] + '-malaga' : null, dia, pasos: [] }; res.push(cof); paso = null; continue; }
    if (cof) { paso = { paso: l.replace(/\s+/g, ' '), bandas: [] }; cof.pasos.push(paso); }
  }
  return res.map((c) => ({ ...c, pasos: c.pasos.filter((p) => p.bandas.length) })).filter((c) => c.pasos.length);
}


// ---------- normalización: variantes del mismo nombre → una sola formación ----------
const ALIAS = [
  [/^Banda de Cornetas y Tambores (Los )?Gitanos$/i, 'Banda de Cornetas y Tambores Los Gitanos'],
  [/^Banda de Cornetas y Tambores (de )?(la )?(Archicofradía del )?Paso y (la )?Esperanza$/i, 'Banda de Cornetas y Tambores del Paso y la Esperanza'],
  [/^Banda de Música (de )?(la )?Archicofradía del Paso y (la )?Esperanza$/i, 'Banda de Música de la Archicofradía del Paso y la Esperanza'],
  [/^Banda de Cornetas y Tambores (de )?Nuestra Señora del Carmen$/i, 'Banda de Cornetas y Tambores Nuestra Señora del Carmen'],
  [/^Banda de Música (de )?Virgen del Rocío$/i, 'Banda de Música Virgen del Rocío'],
  [/^Banda de Música Nuestra Señora de la Soledad( Mena)?$/i, 'Banda de Música Nuestra Señora de la Soledad', 'Mena'],
  [/^Banda de Música Cruz de(l)? Humilladero$/i, 'Banda de Música Cruz del Humilladero'],
  [/^Agrupación Musical (Nuestro Padre )?Jesús Cautivo$/i, 'Agrupación Musical Nuestro Padre Jesús Cautivo'],
  [/^Banda de Música Municipal de Arahal$/i, 'Banda de Música Municipal de Arahal', 'Arahal'],
  [/^Banda de Música Maestro Eloy García de la Archicofradía de la Expiración$/i, 'Banda de Música Maestro Eloy García de la Archicofradía de la Expiración'],
  [/^Banda de Música de la Vera Cruz$/i, 'Banda de Música de la Vera Cruz'],
  [/^Banda de Música Jesús Nazareno$/i, 'Banda de Música Jesús Nazareno', 'Almogía'],
  [/^Banda de Guerra del Núcleo de Apoyo.*Legión.*$/i, 'Banda de Guerra de la Brigada de La Legión Rey Alfonso XIII', 'Viator'],
  [/^Unidad de Música de la Brigada de la Legión.*$/i, 'Unidad de Música de la Brigada de La Legión Rey Alfonso XIII', 'Viator'],
  [/^Banda de Guerra y Compañía de Honores de la Brigada Almogávares VI de Paracaidistas$/i, 'Banda de Guerra de la Brigada Almogávares VI de Paracaidistas', 'Paracuellos de Jarama'],
  [/^Banda de Cornetas y Tambores con escuadra de gastadores y guión de la Santa Vera Cruz$/i, 'Banda de Cornetas y Tambores de la Santa Vera Cruz'],
  [/^Agrupación Músico-Cultural de la Santa Vera-Cruz La Pepa$/i, 'Agrupación Músico-Cultural de la Santa Vera Cruz «La Pepa»'],
  [/^Banda de Cornetas y Tambores Colegio de guardias jóvenes Duque de Ahumada$/i, 'Banda de Cornetas y Tambores del Colegio de Guardias Jóvenes Duque de Ahumada'],
  [/^Banda Municipal de Música Maestro Paco Tenorio de Arriate$/i, 'Banda Municipal de Música Maestro Paco Tenorio'],
];
// No son bandas: se muestran en el texto del paso, pero no tienen ficha propia.
const NO_BANDA = /^(Nazarenos con Timbales|Guardia Romana|Tambor del Real Cuerpo|Grupo vocal|Compañía de honores|Escuadra de Gastadores|Capilla Musical$)/i;
const tipoDe = (n) => /Cornetas y Tambores/.test(n) ? 'Banda de cornetas y tambores' : /Agrupación/.test(n) ? 'Agrupación musical' : /Capilla/.test(n) ? 'Capilla musical' : /Banda de Guerra|Unidad de Música/.test(n) ? 'Música militar' : 'Banda de música';
function canonBand(b) {
  let { nombre, localidad } = b; let inferida = false;
  for (const [re, canon, loc] of ALIAS) if (re.test(nombre)) { nombre = canon; if (loc && !localidad) localidad = loc; if (loc && localidad && /^(Sevilla)$/.test(localidad)) localidad = loc; break; }
  if (NO_BANDA.test(nombre)) return { ...b, nombre, es_banda: false };
  if (!localidad) { localidad = 'Málaga'; inferida = true; }
  return { ...b, nombre, localidad, localidad_inferida: inferida, tipo: tipoDe(nombre), es_banda: true };
}
const canonAll = (arr) => arr.map((c) => ({ ...c, pasos: c.pasos.map((p) => ({ ...p, bandas: p.bandas.map(canonBand) })) }));

const l26 = await fetchText(U26), l27 = await fetchText(U27);
const a26 = canonAll(parse(l26, true)), a27 = canonAll(parse(l27, false));
const miss = (arr) => arr.filter((c) => !c.slug || !SLUGS.has(c.slug.replace(/-malaga$/, ''))).map((c) => c.blog);
const out = {
  generado: new Date().toISOString().slice(0, 10),
  fuente: 'Málaga Musical (https://malagamusical.blogspot.com/)',
  nota_localidad: 'Convención del blog: las formaciones sin paréntesis son de Málaga capital; las de fuera llevan su localidad entre paréntesis.',
  anio_lista: 2026, url_lista: U26, url_novedades: U27,
  lista2026: a26, novedades2027: a27,
};
fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
const bandas = new Set(); for (const c of a26) for (const p of c.pasos) for (const b of p.bandas) if (b.es_banda) bandas.add(b.nombre + '|' + b.localidad);
console.log(`2026: ${a26.length} cofradías, ${bandas.size} formaciones distintas. Novedades 2027: ${a27.length} cofradías.`);
console.log('Sin enlazar (2026):', miss(a26).join('; ') || '—');
console.log('Sin enlazar (2027):', miss(a27).join('; ') || '—');
console.log('Cofradías de Málaga sin dato 2026:', [...SLUGS].filter((s) => !a26.some((c) => c.slug === s + '-malaga')).join(', '));
