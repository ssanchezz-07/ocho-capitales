// Ocho Capitales: datos del globo de la entrada de la portada (site/assets/globo-datos.json), el mismo diseño que el vídeo
// de marketing («Terciopelo y oro», elegido por Pablo el 26-oct): tierra fundida sin fronteras a 1:110m para el globo entero,
// a 1:50m alrededor de la península para el acercamiento, y el contorno de España a 1:50m para su galón.
// Fuente: Natural Earth (dominio público) vía world-atlas 2.0.2 (ISC), ya en MARKETING/_src/motions/epico/assets/mundo.js;
// topojson-client 3.1.0 (ISC) para fundir los países. MARKETING/ está fuera de git: se pasa su carpeta «assets» si no es la de la
// carpeta principal del proyecto. Uso: node tools/generar-globo.mjs [ruta a MARKETING/_src/motions/epico/assets]
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const SRC = process.argv[2] || 'C:/Users/pablo/Desktop/Proyectos/Ocho Capitales/MARKETING/_src/motions/epico/assets';
const ctx = { window: {} }; ctx.self = ctx.window; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(SRC, 'topojson-client.min.js'), 'utf8'), ctx);
vm.runInContext(fs.readFileSync(path.join(SRC, 'mundo.js'), 'utf8'), ctx);
const topojson = ctx.topojson || ctx.window.topojson, T110 = ctx.window.TOPO110, T50 = ctx.window.TOPO50;
const r2 = (n) => Math.round(n * 100) / 100;
// fuera del recuadro de la península (bb) basta un vértice cada 1,5 grados: de lejos no se ve y el anillo sigue cerrado
const poda = (r, paso, bb) => { const o = [r[0]]; for (let i = 1; i < r.length - 1; i++) { const q = o[o.length - 1], [x, y] = r[i], p = bb && (x < bb[0] || x > bb[2] || y < bb[1] || y > bb[3]) ? 1.5 : paso; if (Math.abs(x - q[0]) + Math.abs(y - q[1]) >= p) o.push(r[i]); } o.push(r[r.length - 1]); return o; };
const ligero = (g, paso, bb) => ({ type: 'MultiPolygon', coordinates: (g.type === 'Polygon' ? [g.coordinates] : g.coordinates).map((p) => p.map((r) => poda(r, paso, bb).map(([x, y]) => [r2(x), r2(y)]))).filter((p) => p[0].length > 3) });
const dentro = (p, b) => p[0].some(([x, y]) => x >= b[0] && x <= b[2] && y >= b[1] && y <= b[3]);
const tierra110 = ligero(topojson.merge(T110, T110.objects.countries.geometries), 0.6);
// a 1:50m solo lo que se ve al acercarse a España (la península, el sur de Francia y el norte de África)
const BB = [-19, 26, 14, 50];
const t50 = ligero(topojson.merge(T50, T50.objects.countries.geometries), 0.1, BB);
const tierra50 = { type: 'MultiPolygon', coordinates: t50.coordinates.filter((p) => dentro(p, BB)) };
const esp = topojson.feature(T50, T50.objects.countries).features.find((f) => f.properties.name === 'Spain');
const espana = ligero(esp.geometry, 0.05);
const out = path.join(DIR, '..', 'site', 'assets', 'globo-datos.json');
fs.writeFileSync(out, JSON.stringify({ fuente: 'Natural Earth (dominio público) vía world-atlas 2.0.2 (ISC)', tierra110, tierra50, espana }));
console.log('globo-datos.json', fs.statSync(out).size, 'bytes');
