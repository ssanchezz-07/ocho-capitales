// Ocho Capitales: ¿habla de Semana Santa o del mundo cofrade? Se aplica a las noticias de agregador (Google Noticias), que
// traen de todo (una tertulia de política en Málaga, un bar de Murcia…). Criterio: ante la duda, se queda (no perder ninguna cofrade).
// 1) Los medios cofrades y religiosos pasan siempre. 2) Una palabra cofrade fuerte basta. 3) Si no hay ninguna y el texto es
// claramente de otro tema (lista AJENO), se descarta. 4) El resto pasa solo si encaja con vocabulario cofrade o religioso amplio
// o con el nombre de una hermandad del portal.
// Uso suelto: node filtro-noticias.mjs   → aplica el filtro al archivo de noticias y lista lo que quitaría (no cambia nada).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// Medios cofrades, consejos, agrupaciones y diócesis: todo lo suyo es del mundo cofrade o religioso
const MEDIOS = ['mundo cofrade', 'gente de paz', 'el pespunte', 'artesacro', 'arte sacro', 'isla pasion', 'pasion en sevilla', 'la hornacina', 'el llamador', 'cruz de guia', 'cofrade', 'cofradia', 'hermandad', 'agrupacion de cofradias', 'federacion de hermandades', 'consejo de hermandades', 'consejo general de hermandades', 'archidiocesis', 'diocesis', 'obispado', 'odisur', 'catedral de', 'religion digital', 'kerygma', 'cadena cope'];
const FUERTES = ['semana santa', 'cofrad', 'hermandad', 'costaler', 'cornetas', 'agrupacion musical', 'palio', 'saeta', 'procesion', 'imaginer', 'besamanos', 'besapies', 'via crucis', 'via sacra', 'capataz', 'capataces', 'marcha procesional', 'marcha funebre', 'marchas de', 'traslado', 'kerygma', 'prioste', 'salida extraordinaria', 'hermana mayor', 'hermano mayor', 'hermanos mayores', 'consejo de hermandades', 'agrupacion de cofradias', 'federacion de hermandades', 'trabajadera', 'costal', 'levanta', 'revira', 'paso de misterio', 'la patrona', 'su patrona', 'el patron', 'su patron', 'coronacion canonica', 'divina pastora', 'rocier', 'romeria', 'nazaren', 'sgae', 'una marcha', 'marcha de', 'primer golpe', 'cachorro', 'canina', 'el caido', 'silencio', 'socorro', 'agonia', 'indulta', 'madre de gracia'];
const AMPLIO = ['virgen', 'cristo', 'penitencia', 'trono', 'misterio', 'rosario', 'triduo', 'quinario', 'novena', 'pregon', 'cartel de', 'banda de musica', 'bandas de musica', 'formaciones musicales', 'agrupaciones musicales', 'banda de cornetas', 'dolorosa', 'soledad', 'macarena', 'titular', 'nuestro padre', 'nuestra senora', 'gran poder', 'madruga', 'manto', 'saya', 'bordad', 'tallista', 'orfebre', 'procesional', 'cabildo', 'pleno', 'cultos', 'hdad', 'gloria', 'esperanza', 'caridad', 'resucit', 'sepulcro', 'calvario', 'lagrimas', 'dolores', 'amargura', 'cautivo', 'prendimiento', 'consuelo', 'angustias', 'misericordia', 'merced', 'pastora', 'domingo de ramos', 'lunes santo', 'martes santo', 'miercoles santo', 'jueves santo', 'viernes santo', 'sabado de pasion', 'viernes de dolores', 'magna', 'cruz de guia', 'capirote', 'servit', 'humildad', 'crucificad', 'coronacion', 'coronar', 'cuaresma', 'orden de paso', 'carrera oficial', 'estacion de penitencia', 'imagen', 'santisim', 'ntro. padre', 'ntra. sra', 'sagrad', 'ecce homo', 'encuentro', 'exalt', 'cirineo', 'rocio', 'patrona', 'restaura', 'catedral', 'basilica', 'parroquia', 'iglesia de', 'convento', 'eucarist', 'misa ', 'arzobispo', 'obispo', 'papa leon', 'seminari', 'diocesan', 'religios', 'devocion', 'devot', 'fe ', 'oracion', 'mistica', 'beat', 'santa angela', 'san juan de la cruz', 'san francisco', 'martires', 'santos', 'zaguan', 'joyero', 'enseres', 'patrimonio', 'saetera', 'cera ', 'enaguas', 'pasion', 'agrupacion', 'federaciones', 'cartel', 'iglesia', 'fray ', 'carmel', 'patron', 'ofrenda', 'el cerro', 'el amor'];
// Temas claramente ajenos (con límite de palabra: «liga» no es «obliga»). Solo cuentan si no hay ninguna palabra cofrade fuerte.
const AJENO = /\b(trump|putin|ucrania|gaza|israel|elecciones generales|psoe|pp|vox|sumar|senado|pedro sanchez|congreso de los diputados|detenid[oa]s?|asesin\w+|estafa\w*|transporte escolar|comedores escolares|receta|restaurante|gastronom\w+|tapa|bar|mercadona|supermercad\w+|futbol|baloncesto|balonmano|liga|tenis|padel|rugby|kenpo|toros?|torea\w*|corrida|cogida|taurin\w+|maestranza|feria de abril|feria de san lucas|feria de la tapa|feria de los pueblos|oktoberfest|verbena|festival de (cine|rock)|rock|flamenco|cantaor|teatro|danza|conservatorio|museo carmen thyssen|vacuna\w*|covid|gripe|vivienda|alquiler|inmobiliari\w+|trafico|obras de|ronda norte|metro de sevilla|licitaciones|accidente|muere una mujer|alzheimer|salud mental|edadismo|matanza|quesos|navidad|reyes magos|halloween)\b/;

let NOMBRES = [];
try {
  const P = JSON.parse(fs.readFileSync(path.join(DIR, '..', 'portal-cofrade', 'data', 'portal.json'), 'utf8'));
  NOMBRES = P.hermandades.map((h) => norm(h.nombre).replace(/^(la|el|los|las)\s+/, '').replace(/\s*\(.*\)$/, '')).filter((n) => n.length >= 9);
} catch (e) { /* sin portal.json: solo vocabulario */ }

export function relevante(texto, fuente = '') {
  const f = norm(fuente);
  if (MEDIOS.some((m) => f.includes(m))) return true;
  const n = norm(texto);
  if (FUERTES.some((k) => n.includes(k))) return true;
  if (AJENO.test(n)) return false;
  return AMPLIO.some((k) => n.includes(k)) || NOMBRES.some((x) => n.includes(x));
}

// Prueba sobre el archivo actual: qué quitaría (no toca nada)
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const N = JSON.parse(fs.readFileSync(path.join(DIR, 'data', 'news.json'), 'utf8'));
  const ag = N.items.filter((i) => i.tipo === 'agregador');
  const fuera = ag.filter((i) => !relevante(i.titulo + ' ' + (i.extracto || ''), i.fuente));
  console.log(`Agregador: ${ag.length} noticias; el filtro quitaría ${fuera.length}:`);
  for (const i of fuera) console.log(`- ${i.fuente}: ${i.titulo}`);
}
