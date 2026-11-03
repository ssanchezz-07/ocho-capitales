// Ocho Capitales: comprueba tools/sources/historias.json (fase 3 de PROGRESO-HISTORIAS.md).
// Siempre: que cada historia tenga texto, fuentes abribles (http/https) y estado; las «pendiente», una nota.
// Con --fuentes <carpeta> (textos bajados con tools/texto-web.mjs, uno por ficha: <slug>.txt, o <slug>.<n>.txt si hay varias
// fuentes): que cada año, cifra y nombre propio de la historia aparezca en el texto de sus fuentes. Lo que no aparece se lista
// para revisarlo a mano (puede ser una paráfrasis legítima: «Siloé» por «Diego de Siloé»).
// Uso: node tools/comprobar-historias.mjs [--fuentes <carpeta>] [--capital <id>]
import fs from 'node:fs';
const arg = (n) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : ''; };
const dir = arg('--fuentes'); const cap = arg('--capital');
const HI = JSON.parse(fs.readFileSync('tools/sources/historias.json', 'utf8')).historias;
const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[«»"“”'’]/g, '').replace(/\s+/g, ' ');
const COMUNES = new Set('en el la los las de del y a al su sus se ese esa este esta desde hasta tras con por para que como hoy ya fue era es son hacia entre durante sin sobre cuando ante hermandad cofradia virgen cristo senor nuestra nuestro padre madre jesus maria santisima santisimo semana santa domingo lunes martes miercoles jueves viernes sabado ramos resurreccion iglesia parroquia convento capilla catedral san santo santa calle'.split(' '));
let errores = 0, avisos = 0;
for (const [slug, x] of Object.entries(HI)) {
  if (cap && !slug.endsWith('-' + cap)) continue;
  const mal = (m) => { console.log('ERROR', slug + ':', m); errores++; };
  if (!['completa', 'pendiente'].includes(x.estado)) mal('estado «' + x.estado + '»');
  if (x.estado === 'pendiente') { if (!x.nota) mal('pendiente sin nota'); continue; }
  if (!x.texto || x.texto.length < 200) mal('texto vacío o de menos de 200 caracteres');
  if (!/[.»)]$/.test((x.texto || '').trim())) mal('el texto no acaba en punto');
  if (!(x.fuentes || []).length || x.fuentes.some((u) => !/^https?:\/\/\S+$/.test(u))) mal('fuentes vacías o no abribles');
  if (!dir || !x.texto) continue;
  const fs_ = fs.readdirSync(dir).filter((f) => f === slug + '.txt' || (f.startsWith(slug + '.') && f.endsWith('.txt')));
  if (!fs_.length) { console.log('AVISO', slug + ': no hay texto de la fuente en', dir); avisos++; continue; }
  const src = norm(fs_.map((f) => fs.readFileSync(dir + '/' + f, 'utf8')).join('\n'));
  const faltan = new Set();
  for (const n of x.texto.match(/\d+/g) || []) if (!new RegExp('(^|[^0-9])' + n + '([^0-9]|$)').test(src)) faltan.add(n);
  // Nombres propios: palabras en mayúscula que no abren frase (la primera de cada frase es redacción propia)
  const enMedio = x.texto.replace(/(^|[.!?»]\s+|\n)[«"]?[A-ZÁÉÍÓÚÑ][\wáéíóúñü]*/g, '$1');
  for (const w of enMedio.match(/[A-ZÁÉÍÓÚÑ][\wáéíóúñü]+/g) || []) { const k = norm(w); if (k.length > 2 && !COMUNES.has(k) && !src.includes(k)) faltan.add(w); }
  if (faltan.size) { console.log('REVISAR', slug + ':', [...faltan].join(', ')); avisos++; }
}
console.log(`historias.json: ${Object.keys(HI).length} entradas, ${errores} errores, ${avisos} para revisar`);
process.exit(errores ? 1 : 0);
