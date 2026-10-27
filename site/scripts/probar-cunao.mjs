// Pruebas del motor de erCuñao (sin navegador): node scripts/probar-cunao.mjs   (antes: node build.mjs)
// Carga site/assets/cunao.js en un contexto aislado de Node, le pasa los datos generados en dist/data
// y comprueba que cada pregunta real devuelve datos que existen en el portal.
// Opción: --ver  muestra todas las respuestas aunque pasen.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(DIR, 'dist', 'data');
if (!fs.existsSync(path.join(DIST, 'cunao.json'))) { console.error('Falta dist/data/cunao.json: ejecuta antes «node build.mjs».'); process.exit(1); }
const D = JSON.parse(fs.readFileSync(path.join(DIST, 'cunao.json'), 'utf8'));
const CIU = Object.fromEntries(D.capitales.map(([c]) => [c, JSON.parse(fs.readFileSync(path.join(DIST, 'cunao', c + '.json'), 'utf8'))]));
const PORTAL = JSON.parse(fs.readFileSync(path.join(DIR, '..', 'portal-cofrade', 'data', 'portal.json'), 'utf8'));
const HP = Object.fromEntries(PORTAL.hermandades.map((h) => [h.slug, h]));

// el mismo archivo que usa el navegador, sin tocarlo
const sandbox = { module: { exports: {} }, Intl, Date, Math, JSON, Set, Map, RegExp, String, Array, Object, Number, console };
vm.runInNewContext(fs.readFileSync(path.join(DIR, 'assets', 'cunao.js'), 'utf8'), sandbox, { filename: 'cunao.js' });
const { crearMotor } = sandbox.module.exports;

const VER = process.argv.includes('--ver');
// Fechas de prueba: fuera de temporada (16-10-2026) y en plena Semana Santa (Jueves Santo)
function motor(hoy = '2026-10-16', hora = 18) {
  const m = crearMotor(D, { base: '/', azar: (l) => l[0], hoy: (mas) => { const d = new Date(hoy + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + (mas || 0)); return d.toISOString().slice(0, 10); }, horaAhora: () => hora });
  return m;
}
// pregunta → respuesta, cargando los datos de ciudad que pida (como hace la interfaz)
function pregunta(m, q) {
  let r = m.responder(q), n = 0;
  while (r.necesita && n++ < 3) { r.necesita.forEach((c) => m.cargarCiudad(c, CIU[c])); r = m.responder(q); }
  return r;
}
const todo = (r) => [r.texto, ...r.enlaces.map((e) => e.join(' ')), ...r.chips.map((c) => c.join(' '))].join('\n');

let ok = 0, mal = 0;
function caso(nombre, m, q, comprobar) {
  const r = pregunta(m, q);
  let fallo = null;
  try { const v = comprobar(r, todo(r)); if (v !== true && v !== undefined) fallo = v || 'comprobación falsa'; } catch (e) { fallo = e.message; }
  if (fallo) { mal++; console.log(`✗ ${nombre}\n   P: ${q}\n   R: ${todo(r).replace(/\n/g, '\n      ')}\n   → ${fallo}`); }
  else { ok++; if (VER) console.log(`✓ ${nombre}\n   P: ${q}\n   R: ${todo(r).replace(/\n/g, '\n      ')}`); }
  return r;
}
const contiene = (...xs) => (r, t) => { for (const x of xs) if (!(x instanceof RegExp ? x.test(t) : t.includes(x))) return 'no contiene ' + x; return true; };
const y = (...fs) => (r, t) => { for (const f of fs) { const v = f(r, t); if (v !== true && v !== undefined) return v; } return true; };
const elige = (n) => (r) => (r.chips.filter((c) => /^@h:/.test(c[1])).length >= n ? true : 'esperaba ' + n + '+ botones de desambiguación');
const enlace = (re) => (r) => (r.enlaces.some((e) => re.test(e[1])) ? true : 'no enlaza a ' + re);
const tit = (slug, i) => HP[slug].titulares[i];

// ---------- datos esperados sacados del propio portal (nunca escritos a mano) ----------
const mac = HP['la-macarena-sevilla'], cach = HP['el-cachorro-sevilla'], gp = HP['el-gran-poder-sevilla'];
const cautivoM = PORTAL.hermandades.find((h) => h.ciudad === 'malaga' && h.nombre === 'Cautivo');
const triana = HP['la-esperanza-de-triana-sevilla'];
const paloma = PORTAL.hermandades.find((h) => h.ciudad === 'malaga' && h.nombre === 'Paloma');
const nHerm = (c) => PORTAL.hermandades.filter((h) => h.ciudad === c).length;
const fechas = D.fechas;

let m = motor();
console.log('— Saludos y personalidad');
caso('saludo', m, 'hola', contiene('cuñao'));
caso('quién eres', m, '¿Quién eres?', contiene('erCuñao', 'No soy una inteligencia artificial'));
caso('ayuda', m, '¿qué sabes hacer?', contiene('Esperanza de Triana'));
caso('gracias', m, 'muchas gracias', (r) => (r.texto.length > 5 ? true : 'vacío'));

console.log('— Fechas');
caso('cuánto falta', m, '¿Cuánto falta para la Semana Santa?', contiene(/Faltan \d+ días/, '21 de marzo de 2027'));
caso('cuándo es el Jueves Santo', m, '¿Cuándo es el Jueves Santo?', contiene('Jueves Santo de 2027 cae el 25 de marzo'));
caso('qué sale hoy (fuera de temporada)', m, '¿Qué sale hoy?', contiene('Hoy no sale nadie', 'Domingo de Ramos'));

console.log('— Jornadas');
caso('Jueves Santo en Málaga', m, 'Jueves Santo en Málaga', y(contiene('Jueves Santo en Málaga', 'Mena', 'Esperanza'), enlace(/en-la-calle\/malaga\/\?dia=Jueves/)));
caso('contexto: ¿y el martes?', m, '¿y el martes?', contiene('Martes Santo en Málaga', 'Rocío'));
caso('contexto: ¿y en Sevilla?', m, '¿y en Sevilla?', contiene('Martes Santo en Sevilla', 'Los Estudiantes'));
caso('madrugada = Madrugá', m, '¿qué sale en la madrugada de Sevilla?', contiene('Madrugá en Sevilla', 'La Macarena', 'El Gran Poder'));
caso('día sin ciudad pide ciudad', motor(), '¿Qué sale el Domingo de Ramos?', (r) => (r.chips.some((c) => /^@c:sevilla/.test(c[1])) ? true : 'sin botones de ciudad'));
{ const mm = motor(fechas['Jueves Santo']); pregunta(mm, 'Málaga');
  caso('hoy en Semana Santa (Jueves Santo, contexto Málaga)', mm, '¿Qué sale hoy?', contiene('Jueves Santo en Málaga', 'Mena'));
  caso('mañana = Madrugá/Viernes', mm, '¿y mañana?', contiene(/Viernes Santo en Málaga|Madrugá en Málaga/)); }
caso('gentilicio + errata', motor(), 'que salen el lunes en malga', contiene('Lunes Santo en Málaga', 'Cautivo'));

console.log('— Hermandades: hora, sede, día');
m = motor();
caso('hora de la Macarena de Sevilla', m, '¿A qué hora sale la Macarena de Sevilla?', contiene('La Macarena (Sevilla) sale la Madrugá a las ' + mac.hora.padStart(5, '0'), mac.sede));
caso('Macarena sin ciudad → desambigua', motor(), '¿A qué hora sale la Macarena?', y(elige(2), contiene('Sevilla', 'Almería')));
caso('desambiguación con botón', (() => { const x = motor(); pregunta(x, '¿A qué hora sale la Macarena?'); return x; })(), '@h:la-macarena-sevilla', contiene('La Macarena (Sevilla) sale la Madrugá'));
caso('Esperanza: varias', motor(), 'la esperanza', y(elige(3), contiene('¿Cuál de estas Esperanzas')));
caso('Esperanza de Triana', motor(), '¿a que hora sale la esperanza de triana?', contiene('La Esperanza de Triana (Sevilla) sale la Madrugá', triana.sede));
caso('errata «macarna»', motor(), 'hora de la macarna de sevilla', contiene('La Macarena (Sevilla)'));
caso('errata «cachoro»', motor(), 'cuando sale el cachoro', contiene('El Cachorro (Sevilla) sale el Viernes Santo'));
caso('apodo «Señor de Sevilla»', motor(), '¿cuándo sale el Señor de Sevilla?', contiene('El Gran Poder (Sevilla)', 'Madrugá'));
caso('apodo en el nombre «la Bofetá»', motor(), 'a que hora sale la bofeta', contiene('Dulce Nombre («La Bofetá») (Sevilla)'));
caso('sede del Cautivo de Málaga', motor(), '¿Dónde está la sede del Cautivo de Málaga?', contiene(cautivoM.sede));
caso('día + hermandad', motor(), '¿a qué hora sale el Cautivo el lunes en Málaga?', contiene('Cautivo (Málaga) sale el Lunes Santo'));

console.log('— Recorridos (itinerarios)');
m = motor();
caso('por dónde pasa el Cautivo de Málaga', m, '¿Por dónde pasa el Cautivo de Málaga?', y(contiene('Recorrido de Cautivo (Málaga)', CIU.malaga.r['cautivo-malaga'].p[0][1]), enlace(/en-la-calle\/malaga\/\?dia=Lunes%20Santo/)));
caso('contexto: ¿y cuándo entra?', m, '¿y cuándo entra?', contiene('Cautivo (Málaga) se recoge'));
caso('Macarena por la Campana', motor(), '¿Cuándo pasa la Macarena de Sevilla por la Campana?', contiene('La Macarena pasa por Campana', CIU.sevilla.r['la-macarena-sevilla'].p.find((p) => /campana/i.test(p[1]))[0]));
caso('carrera oficial', motor(), '¿a qué hora llega a la carrera oficial la Macarena de Sevilla?', contiene('llega a Campana'));
{ const porLarios = Object.entries(CIU.malaga.r).filter(([s, R]) => HP[s].dia === 'Domingo de Ramos' && (R.p.some((p) => /larios/i.test(p[1])) || (R.c || []).some((l) => /larios/i.test(l)))).map(([s]) => HP[s].nombre);
  caso('qué cofradías pasan por Larios', motor(), '¿Qué cofradías pasan por Larios en Málaga el Domingo de Ramos?', y(contiene(/Por (Marqués de )?Larios/, ...porLarios), () => (porLarios.length ? true : 'ninguna cofradía con Larios en los datos'))); }
caso('pasa por (lugar tras el nombre)', motor(), '¿cuándo pasa por la Campana la Macarena de Sevilla?', contiene('La Macarena pasa por Campana'));
caso('pasa por Sierpes', motor(), '¿a qué hora pasa el Gran Poder de Sevilla por Sierpes?', (r, t) => { const p = CIU.sevilla.r['el-gran-poder-sevilla'].p.find((x) => /sierpes/i.test(x[1])); return p ? (t.includes('pasa por') && t.includes(p[0]) ? true : 'no da la hora ' + p[0]) : (/No veo/.test(t) ? true : 'debía decir que no lo ve'); });
caso('dónde la veo cerca', motor(), '¿Dónde puedo ver la Esperanza de Triana cerca de mí?', enlace(/en-la-calle\/sevilla\/\?dia=Madrug/));

console.log('— Titulares e imagineros');
caso('quién talló el Cristo del Cachorro', motor(), '¿Quién talló el Cristo del Cachorro?', contiene(tit('el-cachorro-sevilla', 0).nombre.split(',')[0], tit('el-cachorro-sevilla', 0).autor));
caso('autor de la Virgen de la Macarena', motor(), '¿Quién hizo la Virgen de la Macarena de Sevilla?', y(contiene('Esperanza Macarena', 'Luisa Roldán'), (r, t) => (!/Sentencia/.test(r.texto) ? true : 'no debía listar al Cristo')));
caso('contexto: «¿y su banda?»', (() => { const x = motor(); pregunta(x, 'el gran poder de sevilla'); return x; })(), '¿y su banda?', contiene('El Gran Poder (Sevilla)'));
caso('quién es Juan de Mesa', motor(), '¿Quién es Juan de Mesa?', y(contiene('Juan de Mesa', 'Cristo del Amor'), enlace(/imaginero\/juan-de-mesa\//)));
caso('obras de Castillo Lastrucci', motor(), 'obras de Castillo Lastrucci', contiene('Antonio Castillo Lastrucci', /tengo \d+ obras/));
caso('errata en imaginero', motor(), 'quien es Ortega Bru', contiene('Luis Ortega Bru'));

console.log('— Música');
caso('qué banda acompaña a la Macarena de Sevilla', motor(), '¿Qué banda acompaña a la Macarena de Sevilla?', contiene('Música de La Macarena (Sevilla)', 'Centuria Romana Macarena'));
caso('banda de la Paloma', motor(), '¿qué banda lleva la Paloma de Málaga?', (r, t) => { const ac = paloma.acompanamiento?.pasos || []; const n = ac.length ? ac[0].bandas[0].nombre : (paloma.bandas || [])[0]; return n ? (t.includes(n) ? true : 'no cita ' + n) : (/No tengo/.test(t) ? true : 'debía reconocer que no lo sabe'); });
caso('marchas dedicadas', motor(), '¿qué marchas tiene la Esperanza de Málaga?', (r, t) => { const h = PORTAL.hermandades.find((x) => x.ciudad === 'malaga' && x.nombre === 'Esperanza'); return (h.marchas || []).length ? (t.includes(h.marchas[0].titulo) ? true : 'no cita ' + h.marchas[0].titulo) : (/No tengo marchas/.test(t) ? true : 'debía decir que no tiene'); });
caso('banda inversa', motor(), '¿A qué hermandades acompaña la banda Centuria Romana Macarena?', contiene('acompaña a', 'La Macarena'));

console.log('— Cifras, historia, noticias, web');
caso('cuántas hermandades tiene Jaén', motor(), '¿Cuántas hermandades tiene Jaén?', contiene('tengo ' + nHerm('jaen') + ' hermandades de Jaén'));
caso('cuántas en Sevilla (gentilicio)', motor(), 'cuantas cofradias sevillanas hay', contiene('tengo ' + nHerm('sevilla') + ' hermandades de Sevilla'));
caso('historia del Cachorro', motor(), 'historia del cachorro', contiene(cach.fundacion ? 'Fundación: ' + cach.fundacion : 'Cachorro', (cach.historia || '').slice(0, 30)));
caso('web de la Macarena de Sevilla', motor(), 'web de la macarena de sevilla', enlace(/hermandaddelamacarena\.es/));
caso('noticias de Granada', motor(), 'noticias de Granada', y(contiene(CIU.granada.no[0] ? CIU.granada.no[0][0] : 'No tengo noticias'), enlace(/noticias\/\?ciudad=granada/)));
caso('pasos del Gran Poder', motor(), '¿cómo es el paso del Gran Poder de Sevilla?', contiene(gp.paso || 'no tengo descripción'));

console.log('— Honradez: no inventa');
caso('pregunta absurda', motor(), '¿Cuál es la capital de Francia?', y(contiene('Eso no lo sé'), enlace(/buscar\/\?q=/)));
caso('pide sugerencia', motor(), 'quiero avisar de un error', contiene('cuéntamelo con detalle'));
{ const x = motor(); pregunta(x, 'quiero avisar de un error');
  caso('envía la sugerencia', x, 'La hora de la Pollinica está mal', (r) => (r.accion && r.accion.tipo === 'sugerencia' ? true : 'no prepara el envío')); }
caso('pronombre sin contexto', motor(), '¿y su banda?', contiene('¿De qué cofradía'));

// Las 7 preguntas mal respondidas de la auditoría (C1-C7, 27-oct)
console.log('— Auditoría C1-C7');
caso('C1 imaginero por nombre completo', motor(), '¿De dónde era Antonio León Ortega?', y(contiene('Antonio León Ortega', 'Ayamonte'), (r, t) => (/Torreblanca/.test(t) ? 'empareja con Torreblanca' : true)));
caso('C2 este fin de semana', motor(), '¿Hay alguna procesión este fin de semana?', y(contiene('fin de semana'), (r, t) => (/Buen Fin/.test(t) ? 'empareja con el Buen Fin' : true)));
caso('C3 Semana Santa de otro año', motor(), '¿Cuándo es la Semana Santa de 2028?', contiene('2028', '9 de abril de 2028', '16 de abril de 2028'));
caso('C4 Sábado de Pasión no es la hermandad de Pasión', motor(), 'El Sábado de Pasión en Sevilla', contiene('El Sábado de Pasión en Sevilla salen'));
{ const fund = PORTAL.hermandades.filter((h) => h.ciudad === 'cordoba' && /\b\d{4}\b/.test(h.fundacion || '')).sort((a, b) => +/\d{4}/.exec(a.fundacion)[0] - +/\d{4}/.exec(b.fundacion)[0])[0];
  caso('C5 la más antigua de Córdoba', motor(), '¿Cuál es la hermandad más antigua de Córdoba?', contiene('la más antigua de Córdoba es ' + fund.nombre)); }
caso('C6 una curiosidad', motor(), 'Dime una curiosidad', (r, t) => (D.cu.some((k) => t.includes(k[0])) ? true : 'no da una curiosidad'));
caso('C7 la Humillación de Cádiz', motor(), '¿Sale la Humillación de Cádiz?', contiene('Humillación (Piedad) (Cádiz)'));

console.log(`\n${ok} correctas, ${mal} fallidas (de ${ok + mal}).`);
process.exit(mal ? 1 : 0);
