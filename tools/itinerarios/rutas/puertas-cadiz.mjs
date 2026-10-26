// Ocho Capitales · rutas: puertas de los templos de Cádiz que no están en OSM.
// Para cada templo con «portada» en sedes-cadiz.json ({ calle, fuente, cita }): punto medio de la fachada del edificio de OSM
// que da a esa calle o plaza (comun.mjs, fachadaHacia). Se escribe como sede fijada en alias-calles-cadiz.json
// («@<nombre del templo>»: "geo:lat,lon"), con la fuente en «_fuentes». Los templos sin «portada» siguen saliendo del edificio.
// Uso: node puertas-cadiz.mjs   (después, node emparejar.mjs cadiz)
import fs from 'node:fs';
import path from 'node:path';
import { ITI, ciudad, clave, sn, dAnillo } from './comun.mjs';

const fS = path.join(ITI, 'sedes-cadiz.json'), fA = path.join(ITI, 'alias-calles-cadiz.json');
const S = JSON.parse(fs.readFileSync(fS, 'utf8')), A = JSON.parse(fs.readFileSync(fA, 'utf8'));
const C = ciudad('cadiz');
const r6 = (x) => +x.toFixed(6);
for (const [id, t] of Object.entries(S.templos)) {
  if (!t.portada) continue;
  const [tipo, num] = t.osm.split('/');
  // edificios que no son templo en OSM (el Colegio Salesianos): cache/osm-cadiz-edificios-sedes.json (Overpass, con geometría)
  const EXTRA = fs.existsSync(path.join(ITI, 'cache', 'osm-cadiz-edificios-sedes.json')) ? JSON.parse(fs.readFileSync(path.join(ITI, 'cache', 'osm-cadiz-edificios-sedes.json'), 'utf8')).elements : [];
  const w = C.LUG.find((e) => e.type === tipo && e.id === +num) || EXTRA.find((e) => e.type === tipo && e.id === +num);
  if (!w) { console.log(`${id}: el edificio ${t.osm} no está en el callejero; se deja como está`); continue; }
  const R = C.anillo(w);
  // la calle de la portada: la pieza de OSM con ese nombre más cercana al edificio, y de ella solo las vías con ese nombre
  const k = clave(t.portada.calle);
  const grupos = C.candidatas(t.portada.calle).map((g) => ({ ...g, d: Math.min(...g.pts.map((p) => dAnillo(R, p))) })).sort((a, b) => a.d - b.d);
  if (!grupos.length) { console.log(`${id}: «${t.portada.calle}» no está en OSM`); continue; }
  // «Plaza de San Francisco» y «Calle San Francisco» tienen la misma clave: primero, las vías con el nombre completo
  const g = grupos[0], exactas = g.vias.filter((i) => sn(C.VIAS[i].nombre || '') === sn(t.portada.calle));
  const propias = exactas.length ? exactas : g.vias.filter((i) => C.VIAS[i].nombres.some(([cl]) => cl === k));
  const r = C.fachadaHacia(R, { ...g, nombre: t.portada.calle, vias: propias.length ? propias : g.vias });
  if (!r) { console.log(`${id}: sin fachada hacia «${t.portada.calle}»`); continue; }
  // la salida, en el punto de la calle de la portada justo delante de ella (así GraphHopper no la engancha a otra vía más cercana)
  const vs = propias.length ? propias : g.vias, P = C.X(...r.punto);
  let best = null;
  for (const i of vs) { const pts = C.VIAS[i].pts; for (let j = 1; j < pts.length; j++) { const A = pts[j - 1], B = pts[j], dx = B[0] - A[0], dy = B[1] - A[1], L2 = dx * dx + dy * dy, u = L2 ? Math.max(0, Math.min(1, ((P[0] - A[0]) * dx + (P[1] - A[1]) * dy) / L2)) : 0, Q = [A[0] + u * dx, A[1] + u * dy], d = Math.hypot(P[0] - Q[0], P[1] - Q[1]); if (!best || d < best.d) best = { Q, d }; } }
  // en una plaza (espacio abierto) se queda en la fachada; en una calle o avenida, hasta 30 m
  const mover = best && best.d <= 30 && !/^plaza/i.test(t.portada.calle);
  const [la, lo] = mover ? C.LL(...best.Q) : r.punto;
  r.como += mover ? `, llevado a la calle (${Math.round(best.d)} m)` : '';
  A['@' + t.nombre] = `geo:${r6(la)},${r6(lo)}`;
  A._fuentes['@' + t.nombre] = `${r.como.replace('punto medio', 'Puerta: punto medio')}. Portada a «${t.portada.calle}» según ${t.portada.fuente}${t.portada.cita ? ` («${t.portada.cita}»)` : ''}; edificio OSM ${t.osm}`;
  console.log(`${id.padEnd(20)} ${r6(la)},${r6(lo)}  ${r.como}`);
}
fs.writeFileSync(fA, JSON.stringify(A, null, 1) + '\n');
