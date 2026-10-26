// Ocho Capitales · qué noticia entra y de qué trata (criterio editorial de Pablo, 27-oct-2026; ver DECISIONS.md).
// Entra solo lo cofrade de las ocho capitales. Las dudosas, fuera.
// 1) Fuentes cofrades (medios cofrades, agrupaciones, consejos, federaciones, webs de hermandades): pasan siempre.
// 2) Diócesis: solo si hablan de cofradías (vocabulario cofrade claro).
// 3) Prensa generalista y Google Noticias: vocabulario cofrade claro, de una de las ocho capitales, y nunca política,
//    sucesos, deporte, toros, ferias ni comercio, aunque nombren de pasada a una hermandad.
// Cada noticia que entra lleva sus temas (salidas, cultos, coronaciones, música, patrimonio, cabildos, pregones, agenda).
// Uso suelto: node filtro-noticias.mjs [--fuera|--dentro|--temas]  → mide el criterio sobre data/news.json (no cambia nada).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
export const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const re = (lista) => new RegExp('(^|[^a-z0-9ñ])(' + lista.join('|') + ')(?=$|[^a-z0-9ñ])');

// Fuentes cuyo oficio es lo cofrade (nombre del medio, normalizado; basta con que lo contenga)
const COFRADES = ['mundo cofrade', 'gente de paz', 'el pespunte', 'artesacro', 'arte sacro', 'isla pasion', 'pasion en sevilla', 'la hornacina', 'el llamador', 'cruz de guia', 'el diario cofrade', 'diario cofrade', 'cofrade', 'cofradia', 'hermandad', 'agrupacion de cofradias', 'agrupacion de hermandades', 'federacion de hermandades', 'consejo de hermandades', 'consejo general de hermandades', 'consejo de cofradias', 'kerygma', 'la saeta', 'nazarenos', 'sevilla cofrade', 'malaga cofrade', 'granada cofrade', 'cordoba cofrade', 'cadiz cofrade', 'huelva cofrade', 'jaen cofrade', 'almeria cofrade', 'el costal', 'la trabajadera', 'patrimonio musical'];
const DIOCESIS = ['archidiocesis', 'diocesis', 'obispado', 'odisur'];
// Vocabulario cofrade claro (palabra completa o raíz inequívoca)
const CLARO = re(['semana santa', 'archicofrad[a-zñ]*', 'cofrad\[a-zñ]*', 'hermandad(es)?', 'costaler\[a-zñ]*', 'capataz\[a-zñ]*', 'nazaren[oa]s?', 'procesion(es)?', 'procesional(es)?', 'procesiona\[a-zñ]*', 'saetas?', 'saeter\[a-zñ]*', 'besamanos', 'besapies', 'quinario', 'triduo', 'septenario', 'funcion principal', 'estacion de penitencia', 'salida extraordinaria', 'salida procesional', 'coronacion canonica', 'coronacion pontificia', 'banda de cornetas', 'cornetas y tambores', 'agrupacion musical', 'marchas? procesional(es)?', 'imaginer\[a-zñ]*', 'hermanos? mayor(es)?', 'hermana mayor', 'cabildo de (oficiales|elecciones|salida)', 'cabildo general', 'pregon de (la )?semana santa', 'pregonero', 'pregonera', 'cartel de (la )?semana santa', 'via crucis', 'rosario de la aurora', 'paso de (misterio|palio|cristo)', 'palio', 'misterio de', 'tronos?', 'portadores', 'capataces', 'lunes santo', 'martes santo', 'miercoles santo', 'sabado santo', 'domingo de resurreccion', 'viernes de dolores', 'sabado de pasion', 'paso del (cristo|senor|misterio)', 'pasos de', 'centuria macarena', 'via sacra', 'mayordom\[a-zñ]*', 'priost\[a-zñ]*', 'carrera oficial', 'madruga', 'domingo de ramos', 'jueves santo', 'viernes santo', 'magna', 'nuestro padre jesus', 'maria santisima', 'nuestra senora de los dolores', 'dolorosa', 'titular(es)? de', 'cuaresma', 'rocio', 'romeria', 'traslado (de la imagen|del cristo|de la virgen|procesional|del titular|a su templo|al altar)']);
// Advocación + algo que se le hace (saya, cultos, traslado…): lo más cofrade de todo, aunque no diga «hermandad»
const DEVOCION = re(['virgen(es)?', 'del cerro','cristo', 'senor de(l)?', 'nuestra senora', 'nuestro padre', 'jesus (de|del|nazareno|cautivo|rescatado|despojado)', 'santisim[oa]', 'la macarena', 'esperanza de triana', 'gran poder', 'cachorro', 'titular(es)?', 'imagen(es)?', 'dolorosa', 'crucificado', 'patron[ao]', 'hermandad[a-zñ]*', 'cofradia[a-zñ]*', 'santa cena', 'santo entierro', 'soledad del?', 'angustias', 'santa cruz', 'siete dolores', 'dolores de', 'madre de gracia', 'resucitado', 'descendimiento', 'dulce nombre', 'la aurora', 'el cerro', 'la agonia', 'la misericordia', 'el consuelo', 'la merced', 'afligidos', 'el prendimiento', 'la universitaria', 'simpecados?', 'esperanza macarena', 'divina pastora', 'merced', 'basilica', 'parroquia', 'consolacion y lagrimas', 'buena muerte', 'expiracion', 'humildad y paciencia', 'presentacion al pueblo', 'reina de los martires', 'cigarreras', 'tres caidas', 'la canina']);
const ACCION = re(['sayas?', 'mantos?', 'tunicas?', 'bordad[a-zñ]*', 'bordador[a-zñ]*', 'restaur[a-zñ]*', 'cultos?', 'novena', 'triduo', 'quinario', 'rosarios?', 'recorrido', 'itinerario', 'traslad[a-zñ]*', 'salida', 'salen', 'sale', 'saldra', 'procesion[a-zñ]*', 'coronad[a-zñ]*', 'estren[a-zñ]*', 'altar', 'retablo', 'misterio', 'nimbo', 'corona', 'labaro', 'elecciones', 'cabildo[a-zñ]*', 'medalla de', 'exposicion', 'aniversario', 'centenario', 'veneracion', 'besamanos', 'peregrinacion', 'romeria', 'ofrenda', 'iconografia', 'talla', 'imaginer[a-zñ]*', 'bendecira', 'bendicion', 'calles', 'vigilia', 'presidir[a-zñ]*', 'dia grande', 'devocion', 'banda', 'marcha', 'capilla', 'tesoro', 'musica', 'acompanara', 'regresa', 'vuelve']);
// Palabras propias del mundo cofrade que no caben en las listas anteriores
const PROPIAS = re(['glorias', 'cultos', 'pregon(es)?','cartelista', 'kerygma', 'primer golpe', 'cruz de guia', 'trabajadera', 'capirote', 'cirios?', 'cera', 'pregon de las glorias', 'consejo de cofradias', 'sayas?', 'pregoner[oa]s?', 'cartelistas?', 'recoronacion[a-zñ]*', 'rosario vespertino', 'rosario de enfermos', 'cabildo (extraordinario|ordinario)', 'marchas? (de|del)', 'sgae', 'rocier[oa]s?', 'agrupacion musical', 'bandas de musica', 'banda de musica']);
// Temas que no son de este portal: con ellos la noticia sale, aunque nombre a una hermandad (salvo fuente cofrade)
const AJENO = re([
  // política
  'psoe', 'pp', 'vox', 'sumar', 'elecciones (generales|municipales|autonomicas|andaluzas)', 'diputad[oa]s?', 'senado', 'parlamento', 'oposicion municipal', 'campana electoral', 'precampana', 'pleno (municipal|del ayuntamiento)', 'moncloa', 'gobierno central', 'ministr[oa]', 'concejal(es|a)? de (urbanismo|hacienda|movilidad)',
  // sucesos
  'detenid[oa]s?', 'arrestad[oa]s?', 'asesin\[a-zñ]*', 'apuñal\[a-zñ]*', 'agresion', 'agredid[oa]', 'robo', 'robad[oa]', 'hurto', 'roban', 'robar', 'robaron', 'estafa\[a-zñ]*', 'incendio', 'accidente', 'atropell\[a-zñ]*', 'heridos', 'fallecid[oa]s? en','tiroteo', 'violencia de genero', 'guardia civil investiga', 'policia investiga', 'juzgado', 'condenad[oa]',
  // deporte
  'futbol', 'baloncesto', 'balonmano', 'rugby', 'liga', 'laliga', 'champions', 'partido de (futbol|liga|baloncesto)', 'gol', 'goles', 'estadio', 'entrenador', 'fichaje', 'tenis', 'padel', 'atletismo', 'maraton', 'ciclismo', 'betis', 'sevilla fc', 'malaga cf', 'cadiz cf', 'granada cf', 'cordoba cf', 'recreativo de huelva', 'real jaen', 'ud almeria', 'unicaja', 'kenpo',
  // toros y ferias
  'toros (de|en)', 'torer[oa]s?', 'torea\[a-zñ]*', 'corrida', 'novillad\[a-zñ]*', 'taurin[oa]s?', 'maestranza', 'feria de (abril|agosto|mayo|san lucas|la tapa|los pueblos|malaga|cordoba)', 'caseta de feria', 'oktoberfest', 'halloween',
  // comercio y consumo
  'mercadona', 'carrefour', 'lidl', 'aldi', 'centro comercial', 'rebajas', 'black friday', 'franquicia', 'restaurante', 'bar', 'tapas?', 'hosteler\[a-zñ]*', 'gastronom\[a-zñ]*', 'receta', 'inmobiliari\[a-zñ]*', 'alquiler', 'hipoteca', 'precio de la vivienda',
  // otros temas que no son del portal
  'vacuna\[a-zñ]*', 'covid', 'gripe', 'metro de', 'licitacion\[a-zñ]*','festival de (cine|rock|jazz)', 'concierto de rock', 'carnaval', 'chirigota', 'comparsa', 'trump', 'putin', 'ucrania', 'gaza', 'pregon de (la )?feria', 'feria del libro', 'flamenc[oa]s?', 'cantaor[a-zñ]*', 'jazz', 'tenorio', 'danza', 'conservatorio', 'candlelight','festival de malaga', 'salud mental', 'navidad']);
const CAPITALES = ['sevilla', 'malaga', 'granada', 'cordoba', 'cadiz', 'huelva', 'almeria', 'jaen'];
const CAP_RE = re(CAPITALES);

// Hermandades por su nombre distintivo (≥ 9 letras y de una sola capital): reconocen la capital aunque no se nombre
let PORNOMBRE = [];
try {
  const P = JSON.parse(fs.readFileSync(path.join(DIR, '..', 'portal-cofrade', 'data', 'portal.json'), 'utf8'));
  const cuenta = new Map();
  for (const h of P.hermandades) { const k = norm(h.nombre).replace(/^(la|el|los|las)\s+/, '').replace(/\s*\(.*\)$/, '').trim(); if (k.length < 9) continue; (cuenta.get(k) || cuenta.set(k, new Set()).get(k)).add(h.ciudad); }
  PORNOMBRE = [...cuenta].filter(([k, s]) => s.size === 1 && k.length >= 14 && k.includes(' ')).map(([k, s]) => [new RegExp('(^|[^a-z0-9ñ])' + k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?=$|[^a-z0-9ñ])'), [...s][0]]);
} catch (e) { /* sin portal.json: solo por el nombre de la capital */ }

// Pueblos y ciudades que no son capital y salen a menudo en las noticias cofrades (de Andalucía y del resto de España).
// Si la noticia nombra uno de estos y no nombra una capital, es de ese pueblo: fuera.
const OTROS = re(['jerez', 'algeciras', 'san fernando', 'el puerto de santa maria', 'chiclana', 'arcos( de la frontera)?', 'sanlucar', 'rota', 'roteñ[oa]s?', 'conil', 'la linea', 'puerto real', 'ubrique', 'barbate', 'medina sidonia', 'picaduenas',
  'dos hermanas', 'utrera', 'ecija', 'osuna', 'carmona', 'marchena', 'alcala de guadaira', 'lebrija', 'moron de la frontera', 'gines', 'aljarafe', 'tomares', 'mairena del (alcor|aljarafe)', 'camas', 'arahal', 'montellano', 'salteras', 'san juan de aznalfarache', 'valme', 'la rinconada', 'estepa', 'coria del rio', 'alcala del rio', 'el viso', 'brenes', 'castilleja',
  'antequera', 'velez(-| )malaga', 'velenñ?[oa]s?', 'veleñ[oa]s?', 'marbella', 'ronda', 'archidona', 'alhaurin( de la torre| el grande)?', 'torremolinos', 'fuengirola', 'benalmadena', 'coin', 'nerja', 'bobadilla', 'mijas', 'estepona', 'alora', 'cartama', 'rincon de la victoria', 'axarquia', 'campillos', 'san pedro alcantara',
  'motril', 'guadix', 'baza', 'loja', 'almunecar', 'atarfe', 'maracena', 'pinos puente', 'ogijares', 'santa fe', 'armilla', 'la herradura', 'salobrena', 'huetor', 'alhama',
  'lucena', 'cabra', 'baena', 'puente genil', 'priego', 'montilla', 'pozoblanco', 'palma del rio', 'aguilar de la frontera', 'la rambla', 'castro del rio', 'hinojosa del duque', 'montoro', 'los pedroches', 'fernan nunez', 'rute', 'benameji',
  'linares', 'ubeda', 'baeza', 'andujar', 'alcala la real', 'martos', 'bailen', 'la carolina', 'torredonjimeno', 'mancha real', 'valdepenas de jaen', 'jodar', 'alcaudete',
  'roquetas', 'el ejido', 'vera \(almeria\)', 'berja', 'dalias', 'adra', 'albox', 'huercal', 'vicar', 'nijar', 'abrucena', 'huercal-overa',
  'almonte', 'moguer', 'lepe', 'ayamonte', 'isla cristina', 'punta umbria', 'bollullos', 'la palma del condado', 'valverde', 'aracena', 'el rocio de almonte',
  'murcia', 'cartagena', 'lorca', 'zamora', 'semana santa de leon', 'valladolid', 'salamanca', 'cuenca', 'toledo', 'merida', 'badajoz', 'caceres', 'ciudad real', 'albacete', 'orihuela', 'valencia', 'torrent', 'riba-roja', 'manises', 'ceuta', 'melilla', 'oviedo', 'tarancon', 'astorga', 'palencia', 'medina del campo', 'toro', 'ferrol', 'hellin', 'crevillent', 'elche', 'calzada de calatrava', 'miguelturra', 'daimiel', 'puertollano', 'alcala de henares', 'cabanyal', 'bercianos', 'la laguna', 'madrid', 'barcelona', 'cataluna', 'zaragoza', 'avila', 'burgos', 'segovia', 'la solana', 'cieza', 'mula', 'santa cruz de la palma', 'canarias', 'tenerife', 'galicia', 'asturias', 'extremadura']);
// «Vélez-Málaga», «provincia de Córdoba» o «Diputación de Jaén» no son la capital
const limpia = (texto) => norm(texto).replace(/velez[- ]malaga|alhaurin( de la torre| el grande)?|provincia de (sevilla|malaga|granada|cordoba|cadiz|huelva|almeria|jaen)|diputacion de (sevilla|malaga|granada|cordoba|cadiz|huelva|almeria|jaen)|campo de gibraltar|(un|los|varios|dos|tres) pueblos? de (sevilla|malaga|granada|cordoba|cadiz|huelva|almeria|jaen)|pueblos de la provincia/g, ' ');
export function ciudadesDe(texto) {
  const n = ' ' + limpia(texto) + ' ';
  const c = new Set(CAPITALES.filter((x) => new RegExp('(^|[^a-z0-9ñ])' + x + '(?=$|[^a-z0-9ñ])').test(n)));
  for (const [r, cap] of PORNOMBRE) if (r.test(n)) c.add(cap);
  return [...c];
}

// Temas (orden = prioridad para la etiqueta principal)
export const TEMAS = [
  ['coronaciones', 'Coronaciones', re(['coronacion\[a-zñ]*', 'coronada', 'coronar'])],
  ['salidas', 'Salidas', re(['salida(s)? (extraordinaria|procesional|penitencial)\[a-zñ]*', 'salida extraordinaria', 'procesion(es)?', 'procesiona\[a-zñ]*', 'estacion de penitencia', 'recorrido', 'itinerario', 'horario(s)?', 'orden de paso', 'magna', 'rosario de la aurora', 'carrera oficial', 'saldra', 'saldran', 'salio', 'recorrio'])],
  ['cultos', 'Cultos y traslados', re(['besamanos', 'besapies', 'triduo', 'quinario', 'novena', 'septenario', 'funcion principal', 'cultos?', 'misa', 'eucaristia', 'via crucis', 'traslado\[a-zñ]*', 'ofrenda', 'rosario', 'jubileo', 'adoracion', 'bendicion'])],
  ['musica', 'Música', re(['bandas?', 'marchas?', 'cornetas', 'agrupacion musical', 'concierto', 'compositor\[a-zñ]*', 'musica', 'musical', 'certamen', 'disco', 'grabacion'])],
  ['patrimonio', 'Patrimonio y estrenos', re(['estren\[a-zñ]*', 'restaur\[a-zñ]*', 'manto', 'saya', 'bordad\[a-zñ]*', 'orfebr\[a-zñ]*', 'talla', 'tallad\[a-zñ]*', 'imaginer\[a-zñ]*', 'nueva imagen', 'nuevo paso', 'nuevo palio', 'palio', 'enseres', 'patrimonio', 'dorado', 'candelabr\[a-zñ]*', 'corona'])],
  ['cabildos', 'Cabildos y cargos', re(['cabildo\[a-zñ]*', 'elecciones', 'hermanos? mayor(es)?', 'hermana mayor', 'junta de gobierno', 'nombra\[a-zñ]*', 'toma de posesion', 'candidat\[a-zñ]*', 'reelegid\[a-zñ]*', 'elegid[oa]', 'consejo de hermandades', 'agrupacion de cofradias', 'presidente', 'presidenta'])],
  ['pregones', 'Pregones y carteles', re(['pregon\[a-zñ]*', 'cartel\[a-zñ]*', 'exaltacion\[a-zñ]*', 'pintor', 'pintora'])],
  ['agenda', 'Agenda', re(['conferencia', 'exposicion', 'presentacion', 'presenta', 'jornadas?', 'mesa redonda', 'curso', 'visita', 'convivencia', 'certamen', 'documental', 'libro', 'muestra'])],
];
export const temasDe = (texto) => { const n = norm(texto); return TEMAS.filter(([, , r]) => r.test(n)).map(([k]) => k); };

// ¿Entra? → { entra, motivo, temas, ciudades }
export function clasificar(n) {
  const texto = (n.titulo || '') + ' ' + (n.extracto || '');
  const t = norm(texto), f = norm(n.fuente);
  const ciudades = [...new Set([...(n.ciudades || []), ...ciudadesDe(texto)])];
  const temas = temasDe(texto);
  const sal = (motivo) => ({ entra: false, motivo, temas, ciudades });
  const dentro = (motivo) => ({ entra: true, motivo, temas, ciudades });
  if (/^etiqueta:|^\d\d:\d\dh \|/.test(t)) return sal('página de etiquetas o de programa, no es una noticia');
  if (/loteria de navidad|^loteria/.test(t)) return sal('aviso de venta de lotería, no es una noticia');
  // entradas vacías o que solo repiten el nombre del medio
  if (t.replace(/[^a-z]/g, '') === f.replace(/[^a-z]/g, '') || /^s*-s/.test(t) || t.replace(/[^a-z]/g, '').length < 8) return sal('entrada vacía, no es una noticia');
  if (n.tipo === 'oficial' && !DIOCESIS.some((d) => f.includes(d))) return dentro('fuente oficial cofrade');
  // medios cofrades: siempre son cofrades, pero también tienen que ser de una de las ocho capitales
  const capNom = CAPITALES.some((c) => new RegExp('(^|[^a-z0-9ñ])' + c + '(?=$|[^a-z0-9ñ])').test(' ' + limpia(texto) + ' '));
  if (COFRADES.some((m) => f.includes(m))) return OTROS.test(t) && !capNom ? sal('medio cofrade, pero de otro pueblo o ciudad: ' + t.match(OTROS)[2]) : dentro('medio cofrade');
  // vocabulario claro, palabra propia, advocación o nombre de una hermandad del portal
  const claro = CLARO.test(t) || PROPIAS.test(t) || DEVOCION.test(t) || PORNOMBRE.some(([r]) => r.test(' ' + t + ' '));
  if (DIOCESIS.some((d) => f.includes(d))) return claro ? dentro('diócesis, tema cofrade') : sal('diócesis, tema no cofrade');
  if (!claro) return sal('sin vocabulario cofrade claro');
  const aj = t.match(AJENO);
  if (aj) return sal('tema ajeno: ' + aj[2]);
  // de otro pueblo o ciudad (y sin nombrar una capital): fuera
  if (OTROS.test(t) && !capNom) return sal('es de otro pueblo o ciudad: ' + t.match(OTROS)[2]);
  // lo de toda Andalucía (consejos andaluces, SGAE, Junta…) también es de las ocho capitales
  if (!ciudades.length && !/(^|[^a-z])andalu(cia|z|ces|zas)/.test(t)) return sal('no es de ninguna de las ocho capitales');
  return dentro('prensa con tema cofrade');
}
// Compatibilidad con la llamada antigua (fetch-news): ¿habla de lo cofrade?
export const relevante = (texto, fuente = '') => clasificar({ titulo: texto, fuente, tipo: 'agregador' }).entra;

// Medición sobre el archivo (no toca nada)
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const N = JSON.parse(fs.readFileSync(path.join(DIR, 'data', 'news.json'), 'utf8'));
  const r = N.items.map((i) => ({ i, c: clasificar(i) }));
  const fuera = r.filter((x) => !x.c.entra), dentro = r.filter((x) => x.c.entra);
  const por = {}; for (const x of fuera) { const k = x.c.motivo.replace(/:.*/, ''); por[k] = (por[k] || 0) + 1; }
  const porTipo = {}; for (const x of r) { const k = x.i.tipo + (x.c.entra ? ' dentro' : ' fuera'); porTipo[k] = (porTipo[k] || 0) + 1; }
  console.log(`Archivo: ${N.items.length} noticias → entran ${dentro.length}, salen ${fuera.length}.`, por, porTipo);
  const tem = {}; for (const x of dentro) for (const k of (x.c.temas.length ? x.c.temas : ['(sin tema)'])) tem[k] = (tem[k] || 0) + 1;
  console.log('Temas de las que entran:', tem);
  const arg = process.argv[2];
  if (arg === '--fuera') for (const x of fuera) console.log(`- [${x.c.motivo}] ${x.i.fuente}: ${x.i.titulo}`);
  if (arg === '--dentro') for (const x of dentro) console.log(`+ [${x.c.motivo}] (${x.c.ciudades.join(',')}) {${x.c.temas.join(',')}} ${x.i.fuente}: ${x.i.titulo}`);
}
