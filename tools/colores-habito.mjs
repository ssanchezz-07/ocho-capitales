// Ocho Capitales: color de cada recorrido a partir del hábito de su hermandad.
// Lee tools/sources/habitos.json (texto del hábito con su fuente oficial) y escribe site/data/colores-habito.json:
//   { <slug>: { c: '#hex del tono en la gama del plano', n: 'crema y morado', f: '<url de la fuente>' } }
// No se inventa nada: solo se usan los colores que nombra el texto. Sin color reconocible, la hermandad no entra y su
// recorrido conserva el color de la paleta.
// El color no es el puro del hábito: cada familia se traduce a un tono de una gama común (luminosidad y saturación
// parecidas) que se lee sobre el terciopelo morado del plano y convive con el oro del cortejo.
// Uso: node tools/colores-habito.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const SRC = JSON.parse(fs.readFileSync(path.join(DIR, 'sources', 'habitos.json'), 'utf8'));
const OUT = path.join(DIR, '..', 'site', 'data', 'colores-habito.json');
const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// familia → [tono en la gama del plano, nombre]
const GAMA = {
  morado: ['#b78ee3', 'morado'], burdeos: ['#d4677f', 'burdeos'], rojo: ['#e8735a', 'rojo'], azul: ['#6f9de8', 'azul'], celeste: ['#86c8ec', 'celeste'],
  verde: ['#62c08a', 'verde'], negro: ['#a9a3ba', 'negro'], blanco: ['#efe4c8', 'blanco'], crema: ['#e6d3a6', 'crema'], marron: ['#c48f5f', 'marrón'],
  gris: ['#a4a6ad', 'gris'], amarillo: ['#d8c35c', 'amarillo'], rosa: ['#e891b6', 'rosa'],
};
const PALABRAS = [
  [/\bmorad[oa]s?\b|\bpurpura\b|\bviolet[ao]s?\b|\bnazareno\s+morado/, 'morado'], [/\bburdeos\b|\bgranates?\b|\bcorinto\b|\bvino\b/, 'burdeos'],
  [/\broj[oa]s?\b|\bencarnad[oa]s?\b|\bcarmesi\b|\bescarlata\b/, 'rojo'], [/\bceleste/, 'celeste'], [/\bazul(es)?\b|\bazul marino\b/, 'azul'],
  [/\bverdes?\b/, 'verde'], [/\bnegr[oa]s?\b|\bruan\b/, 'negro'], [/\bblanc[oa]s?\b/, 'blanco'], [/\bcrema\b|\bmarfil\b|\bhueso\b|\bbeige\b|\bcrudo\b/, 'crema'],
  [/\bmarron(es)?\b|\bpard[oa]s?\b|\bcanela\b|\bfranciscan[oa]\b/, 'marron'], [/\bgris(es)?\b|\bceniza\b/, 'gris'], [/\bamarill[oa]s?\b/, 'amarillo'], [/\brosa\b/, 'rosa'],
];
const familia = (t) => { let mejor = null; for (const [re, f] of PALABRAS) { const m = re.exec(t); if (m && (!mejor || m.index < mejor.i)) mejor = { f, i: m.index }; } return mejor && mejor.f; };
// color que acompaña a una prenda: el primero que se nombra en los 70 caracteres siguientes (o 40 anteriores: «de color morado el capirote»)
function prenda(t, re) {
  const m = re.exec(t); if (!m) return null;
  return familia(t.slice(m.index, m.index + 70)) || familia(t.slice(Math.max(0, m.index - 40), m.index));
}
const NEUTRO = new Set(['blanco', 'crema', 'negro', 'gris']);
const out = {}; let sin = 0;
for (const [slug, h] of Object.entries(SRC)) {
  const t = norm(h.texto);
  const cap = prenda(t, /capirotes?|antifaz|antifaces|caperuz/), tun = prenda(t, /tunicas?|habito/);
  const todos = PALABRAS.map(([re, f]) => { const m = re.exec(t); return m ? { f, i: m.index } : null; }).filter(Boolean).sort((a, b) => a.i - b.i).map((x) => x.f);
  // el que se ve de lejos: el capirote si tiene color; si no, la túnica si tiene color; si no, capirote o túnica aunque sean
  // blancos o negros (los botones o el cíngulo no cuentan). Solo si el texto no nombra ninguna de las dos, el primer color que diga.
  const f = [cap, tun].find((x) => x && !NEUTRO.has(x)) || cap || tun || todos.find((x) => !NEUTRO.has(x)) || todos[0];
  if (!f) { sin++; continue; }
  // nombre para la ficha: túnica y capirote, si son distintos («crema y morado»)
  const pares = [tun, cap].filter(Boolean), nombres = [...new Set(pares.length ? pares : [f])].map((x) => GAMA[x][1]);
  out[slug] = { c: GAMA[f][0], n: nombres.join(' y '), f: h.fuente_url || '' };
}
fs.writeFileSync(OUT, JSON.stringify(out));
const cuenta = {}; for (const v of Object.values(out)) cuenta[v.c] = (cuenta[v.c] || 0) + 1;
console.log(`colores-habito.json: ${Object.keys(out).length} hermandades con color (${sin} sin color reconocible)`);
console.log(Object.entries(GAMA).map(([k, [c]]) => `${k} ${cuenta[c] || 0}`).join(' · '));
