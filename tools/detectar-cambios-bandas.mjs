// Ocho Capitales: cola de revisión de cambios de banda. Recorre las noticias recogidas y separa las que anuncian que una hermandad firma, renueva,
// estrena o cambia de banda («renueva con su banda», «firma a la banda…», «acompañará a…»). Nunca se publica solo: el resultado
// (tools/sources/cambios-bandas.json y un resumen por pantalla) es una lista para que una persona confirme y, si procede,
// lo pase a los ficheros de tools/sources/*-musica.json con su fuente.
// Uso: node tools/detectar-cambios-bandas.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const news = JSON.parse(fs.readFileSync(path.join(DIR, '..', 'site', 'data', 'news.json'), 'utf8')).items;
const D = JSON.parse(fs.readFileSync(path.join(DIR, '..', 'portal-cofrade', 'data', 'portal.json'), 'utf8'));
const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
const VERBO = /(renueva|renuevan|firma|firman|ficha|fichan|contrata|contratan|estrena|estrenan|cambia|cambian|nueva banda|nuevas bandas|acompanara|acompanaran|acompanado por|pone musica|sonara|sonaran|vuelve|regresa|dejara|deja de|rescinde|no renueva|anuncia a|anuncian a|ratifica|ratifican)/;
const BANDA = /(banda|agrupacion musical|cornetas|tambores|capilla musical|filarmonica|sinfonica)/;
const NO = /(concierto|certamen|festival|disco|grabacion|aniversario de la banda|pasacalles|cartel|gala)/;
const prev = fs.existsSync(path.join(DIR, 'sources', 'cambios-bandas.json')) ? JSON.parse(fs.readFileSync(path.join(DIR, 'sources', 'cambios-bandas.json'), 'utf8')).items : [];
const vistos = new Set(prev.map((x) => x.url));
const hermandades = D.hermandades.map((h) => ({ h, n: norm(h.nombre) })).filter((x) => x.n.length >= 4);
const nuevos = [];
for (const n of news) {
  const t = norm(n.titulo);
  if (!VERBO.test(t) || !BANDA.test(t) || NO.test(t) || vistos.has(n.url)) continue;
  const cs = n.ciudades && n.ciudades.length ? n.ciudades : [];
  const cand = hermandades.filter(({ h, n: hn }) => (!cs.length || cs.includes(h.ciudad)) && (' ' + t + ' ').includes(' ' + hn + ' ')).map((x) => x.h.slug);
  nuevos.push({ fecha: new Date(n.ts).toISOString().slice(0, 10), titulo: n.titulo, fuente: n.fuente, url: n.url, ciudades: cs, hermandad_posible: cand.length === 1 ? cand[0] : '', estado: 'pendiente de revisar' });
}
const items = [...nuevos, ...prev].sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 300);
fs.writeFileSync(path.join(DIR, 'sources', 'cambios-bandas.json'), JSON.stringify({ generado: new Date().toISOString().slice(0, 10), items }, null, 1));
console.log(`${nuevos.length} noticias nuevas sobre bandas (${items.length} en la cola).`);
for (const x of nuevos.slice(0, 15)) console.log(` · ${x.fecha} ${x.fuente}: ${x.titulo.slice(0, 100)}${x.hermandad_posible ? ' [' + x.hermandad_posible + ']' : ''}`);
