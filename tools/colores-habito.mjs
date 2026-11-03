// Ocho Capitales: color de cada recorrido a partir del hábito de su hermandad.
// Lee tools/sources/habitos-colores.json (la tabla de Diseño que usa la ficha: colores por sección y prenda, transcritos a
// mano del texto de habitos.json) y escribe site/data/colores-habito.json:
//   { <slug>: { c: '#hex del tono en la gama del plano', n: 'hueso y azul real', f: '<url de la fuente>' } }
// No se inventa nada: solo se usan los colores de la tabla, con su nombre tal cual. Con varias secciones manda la primera
// (el primer cortejo). Si la tabla tiene la hermandad pero ningún color escrito, va un tono neutro y sin nombre. Las que no
// están en la tabla no entran y su recorrido conserva el color de la paleta.
// El color no es el puro del hábito: cada color se traduce a un tono de una gama común (luminosidad y saturación parecidas)
// que se lee sobre el terciopelo morado del plano y convive con el oro del cortejo.
// Uso: node tools/colores-habito.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const TABLA = JSON.parse(fs.readFileSync(path.join(DIR, 'sources', 'habitos-colores.json'), 'utf8'));
const HAB = JSON.parse(fs.readFileSync(path.join(DIR, 'sources', 'habitos.json'), 'utf8'));
const OUT = path.join(DIR, '..', 'site', 'data', 'colores-habito.json');

// nombre de la tabla → tono en la gama del plano
const GAMA = {
  morado: '#b78ee3', malva: '#c6a2dc',
  burdeos: '#d4677f', vino: '#c95876', guinda: '#cf5a6c', corinto: '#c45a78', granate: '#cc5f62', rojo: '#e8735a',
  azul: '#6f9de8', 'azul real': '#6f9de8', 'azul marino': '#5c7fd6', 'azul noche': '#5873c8', azulino: '#82b0ee', 'azul pavo real': '#46b0c8',
  celeste: '#86c8ec', turquesa: '#4fc2b4', verde: '#62c08a', 'verde oscuro': '#4fa878',
  negro: '#a9a3ba', gris: '#a4a6ad', blanco: '#efe4c8', 'blanco roto': '#eadfc4', crema: '#e6d3a6', marfil: '#ecdcb6', hueso: '#e2d4b0', beige: '#d8c29a',
  marrón: '#c48f5f', esparto: '#c9ab72', amarillo: '#d8c35c', dorado: '#d9b862', rosa: '#e891b6',
};
const NEUTRO = '#a4a6ad'; // la tabla tiene la hermandad, pero el texto no dice ningún color
const CLAROS = new Set(['blanco', 'blanco roto', 'crema', 'marfil', 'hueso', 'beige', 'negro', 'gris', 'esparto']);
const CAPIROTE = ['capirote', 'antifaz', 'capillo'], TUNICA = ['túnica', 'hábito', 'sotana'];
// «negro y celeste»: el que tiene color, si lo hay
const tono = (v) => v && (v.split(' y ').find((x) => !CLAROS.has(x)) || v.split(' y ')[0]);
const de = (p, prendas) => { const k = prendas.find((x) => p[x]); return k ? p[k] : null; };

const out = {}, faltan = [];
for (const [slug, secs] of Object.entries(TABLA)) {
  if (slug.startsWith('_')) continue;
  const f = (HAB[slug] && HAB[slug].fuente_url) || '';
  const p = (secs.find(([, x]) => Object.keys(x).length) || [null, {}])[1];
  const cap = de(p, CAPIROTE), tun = de(p, TUNICA);
  // el que se ve de lejos: el capirote si tiene color; si no, la túnica si tiene color; si no, capirote o túnica aunque sean
  // claros o negros. Solo si no hay ninguna de las dos, el primer color de otra prenda (que no sea el esparto).
  const otro = Object.values(p).find((v) => v !== 'esparto');
  const elegido = [cap, tun].find((v) => v && !CLAROS.has(tono(v))) || cap || tun || otro;
  if (!elegido) { out[slug] = { c: NEUTRO, n: '', f }; faltan.push(slug); continue; }
  const t = tono(elegido);
  if (!GAMA[t]) throw new Error(`${slug}: el color «${t}» no tiene tono en la gama del plano; añádelo a GAMA`);
  // nombre para la ficha: túnica y capirote, si son distintos («hueso y azul real»), con las palabras de la tabla
  const nombres = [...new Set([tun, cap].filter(Boolean))];
  out[slug] = { c: GAMA[t], n: (nombres.length ? nombres : [elegido]).join(' y '), f };
}
fs.writeFileSync(OUT, JSON.stringify(out));
console.log(`colores-habito.json: ${Object.keys(out).length} hermandades (${faltan.length} sin color en el texto, en tono neutro: ${faltan.join(', ')})`);
