// Ocho Capitales: importa el acompañamiento musical de una capital desde una guía publicada (texto ya descargado
// con tools/texto-web.mjs) y lo guarda como tools/sources/<ciudad>-musica.json, con el mismo esquema que malaga-musical.json.
// Uso: node tools/importar-bandas.mjs <granada|sevilla> <texto.txt> <url-de-la-fuente> [medio]
// Avisa de las cofradías que no consigue enlazar y de las localidades desconocidas (a añadir en tools/sources/localidades.json).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const D = JSON.parse(fs.readFileSync(path.join(DIR, '..', 'portal-cofrade', 'data', 'portal.json'), 'utf8'));
const LOCS = JSON.parse(fs.readFileSync(path.join(DIR, 'sources', 'localidades.json'), 'utf8'));
const [ciudad, txt, url, medio = ''] = process.argv.slice(2);
if (!ciudad || !txt || !url) { console.error('Uso: node tools/importar-bandas.mjs <ciudad> <texto.txt> <url> [medio]'); process.exit(1); }
const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
const DIAS = { 'viernes de dolores': 'Viernes de Dolores', 'sabado de pasion': 'Sábado de Pasión', 'domingo de ramos': 'Domingo de Ramos', 'lunes santo': 'Lunes Santo', 'martes santo': 'Martes Santo', 'miercoles santo': 'Miércoles Santo', 'jueves santo': 'Jueves Santo', 'madrugada': 'Madrugá', 'madruga': 'Madrugá', 'viernes santo': 'Viernes Santo', 'sabado santo': 'Sábado Santo', 'domingo de resurreccion': 'Domingo de Resurrección' };
const PROV = { Gr: 'Granada', Má: 'Málaga', Se: 'Sevilla', Ja: 'Jaén', Al: 'Almería', Có: 'Córdoba', Ca: 'Cádiz', Hu: 'Huelva', 'C.R.': 'Ciudad Real' };

// alias manuales por ciudad: nombre en la guía (normalizado) → slug sin sufijo de ciudad
const ALIAS = {
  granada: { 'borriquilla': 'la-borriquilla', 'santa cena': 'santa-cena', 'despojado': 'el-despojado-silencio-blanco', 'maravillas': 'la-sentencia-maravillas', 'cautivo y encarnacion': 'el-cautivo', 'huerto': 'el-huerto', 'trabajo y luz': 'el-trabajo', 'los dolores': 'nuestra-senora-de-los-dolores', 'el rescate': 'jesus-del-rescate', 'san agustin': 'cristo-de-san-agustin', 'lanzada': 'la-lanzada', 'via crucis': 'el-via-crucis', 'esperanza': 'la-esperanza', 'canilla': 'la-canilla', 'los gitanos': 'los-gitanos', 'estudiantes': 'los-estudiantes', 'paciencia y penas': 'paciencia-y-penas', 'rosario': 'tres-caidas-y-rosario', 'nazareno': 'el-nazareno', 'salesianos': 'los-salesianos', 'concha': 'la-concha', 'aurora': 'la-aurora', 'estrella': 'la-estrella', 'silencio': 'el-silencio', 'escolapios': 'los-escolapios', 'ferroviarios': 'los-ferroviarios', 'los favores': 'los-favores', 'santo sepulcro': 'santo-entierro', 'soledad de san jeronimo': null, 'alhambra': 'santa-maria-de-la-alhambra', 'facundillos': 'los-facundillos', 'resurreccion y triunfo': 'la-resurreccion', 'resucitado y alegria': 'el-resucitado', 'hora nona': null },
  sevilla: { 'dulce nombre de bellavista': 'bellavista', 'paz y misericordia': null, 'divino perdon de alcosa': 'divino-perdon', 'san jeronimo': null, 'el santo angel': null, 'las maravillas': null, 'la espiga': null, 'las penas de san vicente': 'las-penas', 'el cerro del aguila': 'el-cerro', 'la soledad de san buenaventura': 'san-buenaventura', 'la o': 'la-o' },
};

const lines = fs.readFileSync(txt, 'utf8').split('\n');
const hs = D.hermandades.filter((h) => h.ciudad === ciudad);
const bySlug = new Map(hs.map((h) => [h.slug, h]));
const STOP = new Set(['de', 'la', 'el', 'los', 'las', 'del', 'y', 'hermandad', 'cofradia', 'nuestra', 'nuestro', 'senora', 'senor', 'santisimo', 'santisima', 'padre', 'maria', 'jesus', 'cristo']);
const toks = (s) => norm(s).split(' ').filter((t) => t.length > 2 && !STOP.has(t));
function enlazar(nombre) {
  const key = norm(nombre);
  const al = ALIAS[ciudad] || {};
  if (key in al) { const s = al[key]; return s && bySlug.has(s + '-' + ciudad) ? s + '-' + ciudad : null; }
  const t = toks(nombre); if (!t.length) return null;
  let best = null, score = 0, tie = false;
  for (const h of hs) {
    const ht = new Set([...toks(h.nombre), ...toks(h.nombre_oficial || '')]);
    const hit = t.filter((x) => ht.has(x)).length;
    const sc = hit / Math.max(t.length, 1) - (ht.size > 6 ? 0.05 : 0);
    if (norm(h.nombre) === key) { best = h; score = 9; tie = false; break; }
    if (sc > score + 1e-9) { best = h; score = sc; tie = false; } else if (Math.abs(sc - score) < 1e-9 && sc > 0) tie = true;
  }
  return best && score >= 0.99 && !tie ? best.slug : null;
}

const TIPO = (n) => /Cornetas y Tambores|Cornetas|Tambores/i.test(n) ? 'Banda de cornetas y tambores' : /Agrupaci[oó]n/i.test(n) ? 'Agrupación musical' : /Capilla|Coral|Quinteto|Trío|Tr[ií]o|Escolan/i.test(n) ? 'Capilla musical' : /Guerra|Unidad de M[uú]sica|Legi[oó]n/i.test(n) ? 'Música militar' : 'Banda de música';
const NO_BANDA = /^(capilla musical\.?$|silencio|un tambor|quinteto|tr[ií]o|coral|grupo vocal|escolan[ií]a$|cornet[ií]n|propia|sin m[uú]sica)/i;
const unknownLoc = new Map();
const CORTA = { sevilla: true, granada: false }[ciudad] ?? true; // en Granada «de Armilla» forma parte del nombre; en Sevilla «de Sevilla» lo añade la guía
const CANON = [
  [/^Banda de Cornetas y Tambores (de )?(Nuestro Padres?|N.? ?P.?) Jes[uú]s Despojado( de sus Vestiduras)?$/i, 'Banda de Cornetas y Tambores Nuestro Padre Jesús Despojado de sus Vestiduras', 'Granada'],
  [/^Banda de Cornetas y Tambores (de )?(Nuestra Señora|María Santísima) de la Victoria$/i, 'Banda de Cornetas y Tambores María Santísima de la Victoria', 'Granada'],
  [/^Banda y Unidad de M[uú]sica (Nuestra Señora de los )?[AÁ]ngeles( de Granada)?$/i, 'Banda y Unidad de Música Nuestra Señora de los Ángeles', 'Granada'],
  [/^Agrupaci[oó]n M[uú]sico[- ]Cultural San Sebasti[aá]n de Padul$/i, 'Agrupación Músico-Cultural San Sebastián de Padul', 'Padul'],
  [/^Asociaci[oó]n M[uú]sico[- ]Cultural San Sebasti[aá]n de Padul$/i, 'Agrupación Músico-Cultural San Sebastián de Padul', 'Padul'],
  [/^Asociaci[oó]n Musical San Isidro de Armilla$/i, 'Asociación Musical San Isidro de Armilla', 'Armilla'],
  [/^Banda (de M[uú]sica )?Felipe Moreno (e|de) C[uú]llar Vega$/i, 'Banda de Música Felipe Moreno de Cúllar Vega', 'Cúllar Vega'],
  [/^Agrupaci[oó]n Musical (del )?Dulce Nombre de Jes[uú]s$/i, 'Agrupación Musical Dulce Nombre de Jesús', 'Granada'],
  [/^Agrupaci[oó]n Musical (Nuestra Señora|Virgen) de la Cabeza de Exfiliana$/i, 'Agrupación Musical Virgen de la Cabeza de Exfiliana', 'Exfiliana'],
  [/^Banda de m[uú]sica Nuestra Señora de la Soledad de Mena$/i, 'Banda de Música Nuestra Señora de la Soledad', 'Mena'],
  [/^Agrupaci[oó]n M[uú]sico-Cultural de la Santa Vera Cruz .La Pepa. de Alhaurín el Grande$/i, 'Agrupación Músico-Cultural de la Santa Vera Cruz «La Pepa»', 'Alhaurín el Grande'],
  [/^Banda de M[uú]sica Los Iris de Instinci[oó]n de Almer[ií]a$/i, 'Banda de Música Los Iris', 'Instinción'],
  [/^Agrupaci[oó]n Musical Jes[uú]s Despojado de Ja[eé]n$/i, 'Agrupación Musical Jesús Despojado', 'Jaén'],
  [/^Banda de M[uú]sica Mar[ií]a Sant[ií]sima de la Esperanza de C[oó]rdoba$/i, 'Banda de Música María Santísima de la Esperanza', 'Córdoba'],
  [/^Banda Municipal de Granada$/i, 'Banda Municipal de Música de Granada', 'Granada'],
  [/^Capilla Musical Granamusic$/i, 'Capilla Musical Granamusic', 'Granada'],
];
const canon = (b) => { if (!b.es_banda) return b; for (const [re, n, loc] of CANON) if (re.test(b.nombre)) return { ...b, nombre: n, localidad: loc, tipo: TIPO(n) }; return b; };
const locDe = (nombre, prov) => {
  // Se busca « de <Localidad>» al final; solo se separa si la localidad está en tools/sources/localidades.json o es una capital.
  const re = /\s+(?:de|del)\s+/gi; let m;
  while ((m = re.exec(nombre))) {
    const cand = nombre.slice(m.index + m[0].length).trim();
    const k = norm(cand), k2 = norm(cand.replace(/^(la|el|los|las)\s+/i, ''));
    const cap = D.capitales.find((c) => norm(c.nombre) === k);
    if (cap || LOCS[k] || LOCS[k2]) return { nombre: !CORTA ? nombre : nombre.slice(0, m.index).replace(/[\s–-]+$/, '').trim(), localidad: cap ? cap.nombre : cand };
  }
  if (prov) return { nombre, localidad: prov };
  const tail = nombre.match(/\sde\s+((?:[A-ZÁÉÍÓÚÑ][\wáéíóúñÁÉÍÓÚÑ.]*)(?:\s+(?:de\s+|del\s+)?[A-ZÁÉÍÓÚÑ][\wáéíóúñÁÉÍÓÚÑ.]*)*)$/);
  if (tail) unknownLoc.set(tail[1], (unknownLoc.get(tail[1]) || 0) + 1);
  return { nombre, localidad: '' };
};
function banda(raw) {
  let t = raw.trim().replace(/\.$/, '');
  if (NO_BANDA.test(t) || !t) return { nombre: t || 'Sin música', localidad: '', es_banda: false, nota: '', novedad: false, redes: [] };
  let prov = '';
  const pm = t.match(/\s*\(([^)]+)\)\s*$/);
  if (pm) { prov = PROV[pm[1].trim()] || pm[1].trim(); t = t.replace(pm[0], '').trim(); }
  let { nombre, localidad } = locDe(t, prov);
  // «Banda Municipal» sin el pueblo es ambiguo: se conserva «de <pueblo>» en el nombre
  if (/(M[uú]sica Municipal|Banda Municipal|Municipal de M[uú]sica)$/i.test(nombre) && localidad) nombre = nombre + ' de ' + localidad;
  let loc = localidad;
  if (!loc && prov) loc = prov;
  return { nombre: nombre.replace(/\s+–\s+/g, ' – ').replace(/ - /g, ' – '), localidad: loc, tipo: TIPO(nombre), es_banda: true, nota: '', novedad: false, redes: [] };
}

const res = []; let dia = '', cof = null, paso = null; const sinEnlazar = [];
for (const l of lines) {
  const k = norm(l);
  if (k in DIAS && l.length < 32) { dia = DIAS[k]; cof = null; paso = null; continue; }
  if (!dia) continue;
  const m = l.match(/^([^:]{3,60}):\s*(.+)$/);
  if (m && cof && /^(m[uú]sica|abre|cruz|paso|delante|cristo|virgen|misterio|palio|se[nñ]or)/i.test(m[1].trim())) {
    const etiqueta = m[1].replace(/^M[uú]sica\s+/i, '').trim(); const lab = etiqueta.charAt(0).toUpperCase() + etiqueta.slice(1);
    const p = { paso: lab, bandas: m[2].split(/\s+\/\s+/).map((x) => canon(banda(x))) };
    cof.pasos.push(p); continue;
  }
  if (/^(popular ahora|cofrad[ií]as \|)/i.test(l)) break;
  if (l.length > 60 || /[.!?]$/.test(l) && l.length > 40) continue; // texto corrido
  if (/^\d{1,2}[:.]\d{2}/.test(l) || /^foto/i.test(l)) continue;
  // línea sin dos puntos: nombre de cofradía
  if (!m) {
    if (cof && cof.pasos.length === 0 && /silencio|sin m[uú]sica|capilla|tambor/i.test(l)) { cof.pasos.push({ paso: 'Cortejo', bandas: [{ nombre: l, localidad: '', es_banda: false, nota: '', novedad: false, redes: [] }] }); continue; }
    cof = { blog: l, slug: null, dia, pasos: [] }; res.push(cof);
  }
}
for (const c of res) { c.slug = enlazar(c.blog); }
const out = res.filter((c) => c.pasos.length);
for (const c of out) if (!c.slug) sinEnlazar.push(c.blog + ' [' + c.dia + ']');
const bandasUnicas = new Set(); for (const c of out) for (const p of c.pasos) for (const b of p.bandas) if (b.es_banda) bandasUnicas.add(b.nombre + '|' + b.localidad);
const file = path.join(DIR, 'sources', `${ciudad}-musica.json`);
fs.writeFileSync(file, JSON.stringify({ generado: new Date().toISOString().slice(0, 10), ciudad, fuente: medio || url, anio_lista: 2026, url_lista: url, url_novedades: '', lista2026: out.map((c) => ({ ...c, slug: c.slug })), novedades2027: [] }, null, 1));
console.log(`${ciudad}: ${out.length} cofradías, ${bandasUnicas.size} formaciones distintas → ${path.relative(process.cwd(), file)}`);
console.log('Sin enlazar:', sinEnlazar.join('; ') || '—');
console.log('Cofradías de la ciudad sin datos:', hs.filter((h) => !out.some((c) => c.slug === h.slug)).map((h) => h.slug.replace('-' + ciudad, '')).join(', ') || '—');
console.log('Localidades desconocidas (añadir a localidades.json):', [...unknownLoc].map(([k, v]) => k + (v > 1 ? ' ×' + v : '')).join('; ') || '—');
