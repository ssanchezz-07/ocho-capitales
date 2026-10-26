// Ocho Capitales · editor de correcciones de recorridos (solo en el ordenador de Pablo, no se publica).
// Sirve editor.html en http://localhost:8765, guarda las correcciones en laboratorio/correcciones-malaga.json
// y vuelve a trazar la hermandad con el método nuevo (GraphHopper en http://localhost:8989).
// Arranque: doble clic en «Abrir editor de rutas.bat» (o: node servidor.mjs).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LAB, LAS_10, LISTAS, VIAS, NODOS, LL, candidatas, FCORR, leerCorrecciones } from '../laboratorio/comun.mjs';
import { trazar, GH } from '../laboratorio/emparejar.mjs';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const PUERTO = 8765;
const r6 = (x) => Math.round(x * 1e6) / 1e6;
const linea = (pts) => pts.map((p) => LL(...p).map(r6));
const NOMBRES = { 'pollinica-malaga': 'Pollinica', 'pasion-malaga': 'Pasión', 'dolores-del-puente-malaga': 'Dolores del Puente', 'el-rico-malaga': 'El Rico', 'paloma-malaga': 'La Paloma', 'fusionadas-malaga': 'Fusionadas', 'resucitado-malaga': 'Resucitado', 'humildad-y-paciencia-malaga': 'Humildad y Paciencia', 'estudiantes-malaga': 'Estudiantes', 'esperanza-malaga': 'Esperanza' };
const nombreDe = (id) => NOMBRES[id] || id.replace('-malaga', '');

async function ghEncendido() { try { const r = await fetch(GH + '/health', { signal: AbortSignal.timeout(1500) }); return r.ok; } catch { return false; } }

async function datos(id) {
  const lista = LISTAS[id].calles;
  const corr = leerCorrecciones()[id] || {};
  const leer = (f) => (fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null);
  const actual = leer(path.join(LAB, 'actual', 'salida', 'trazas', id + '.json'));
  let nuevo = null, error = null;
  try { nuevo = await trazar(id, { corr }); guardarTraza(id, nuevo); } catch (e) { error = e.message; }
  // calles candidatas de cada elemento de la lista (para que Pablo elija la buena en el plano)
  const elegidas = new Map((nuevo?.informe.calles || []).map((c) => [c.i, c]));
  const filas = lista.map((t, i) => {
    const c = elegidas.get(i);
    const h = nuevo?.hitos.find((x) => x.i === i);
    const cands = candidatas(t).slice(0, 8).map((g) => ({ ids: g.ids, nombre: g.nombre, lineas: g.vias.map((v) => linea(VIAS[v].pts)), elegida: !!c?.vias && g.ids.some((x) => c.vias.includes(x)) }));
    return { i, lugar: t, tipo: h?.tipo || 'hito', osm: c?.osm || null, punto: h?.punto || null, tramo: h?.tramo, candidatas: cands, correccion: corr.calles?.[i] || null, punto_movido: corr.puntos?.[i] || null };
  });
  // fondo: calles a menos de ~500 m del recorrido
  const todos = [...(nuevo ? [...nuevo.ida, ...nuevo.regreso] : []), ...(actual ? [...actual.ida, ...actual.regreso] : [])];
  let caja = null;
  if (todos.length) { const la = todos.map((p) => p[0]), lo = todos.map((p) => p[1]); caja = [Math.min(...la) - 0.0045, Math.min(...lo) - 0.0055, Math.max(...la) + 0.0045, Math.max(...lo) + 0.0055]; }
  const fondo = caja ? VIAS.filter((v) => v.nodos.some((n) => NODOS[n].la > caja[0] && NODOS[n].la < caja[2] && NODOS[n].lo > caja[1] && NODOS[n].lo < caja[3])).map((v) => ({ id: v.id, n: v.nombre, h: v.highway, p: linea(v.pts) })) : [];
  return { id, nombre: nombreDe(id), fuente: LISTAS[id].fuente, filas, actual, nuevo: nuevo && { ida: nuevo.ida.map((p) => p.map(r6)), regreso: nuevo.regreso.map((p) => p.map(r6)), salida: nuevo.informe.salida || null, entrada: nuevo.informe.entrada || null, avisos: nuevo.informe.avisos, enlaces: nuevo.informe.enlaces || [], largo_m: nuevo.informe.largo_m, ms: nuevo.informe.ms_total }, error, correcciones: corr, caja, fondo };
}
function guardarTraza(id, r) {
  const dir = path.join(LAB, 'salida', 'nuevo', 'trazas'); fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, id + '.json'), JSON.stringify({ ida: r.ida, regreso: r.regreso, puntos: r.hitos.filter((h) => h.punto).map((h) => ({ lugar: h.lugar, lat: h.punto[0], lon: h.punto[1], tramo: h.tramo })) }));
}
// Mezcla los cambios del editor en el archivo de correcciones (null = quitar esa corrección)
function guardarCorrecciones(id, cambios) {
  const todo = leerCorrecciones(); const c = todo[id] || {};
  for (const k of ['calles', 'puntos']) for (const [i, v] of Object.entries(cambios[k] || {})) { c[k] = c[k] || {}; if (v === null) delete c[k][i]; else c[k][i] = v; if (!Object.keys(c[k]).length) delete c[k]; }
  for (const k of ['salida', 'entrada']) if (k in cambios) { if (cambios[k] === null) delete c[k]; else c[k] = cambios[k]; }
  if (cambios.borrar_todo) for (const k of Object.keys(c)) delete c[k];
  if (cambios.fuente) (c.fuentes = c.fuentes || []).push({ fecha: new Date().toISOString().slice(0, 16).replace('T', ' '), fuente: cambios.fuente, cambios: cambios.resumen || '' });
  if (Object.keys(c).length) { c.actualizado = new Date().toISOString().slice(0, 16).replace('T', ' '); todo[id] = c; } else delete todo[id];
  fs.writeFileSync(FCORR, JSON.stringify(todo, null, 1));
}

const enviar = (res, cod, obj, tipo = 'application/json; charset=utf-8') => { res.writeHead(cod, { 'Content-Type': tipo, 'Cache-Control': 'no-store' }); res.end(typeof obj === 'string' || Buffer.isBuffer(obj) ? obj : JSON.stringify(obj)); };
const cuerpo = (req) => new Promise((ok, mal) => { let s = ''; req.on('data', (d) => { s += d; if (s.length > 2e6) mal(new Error('demasiado grande')); }); req.on('end', () => { try { ok(s ? JSON.parse(s) : {}); } catch (e) { mal(e); } }); });

http.createServer(async (req, res) => {
  try {
    const u = new URL(req.url, 'http://localhost');
    if (req.method === 'GET' && (u.pathname === '/' || u.pathname === '/editor.html')) return enviar(res, 200, fs.readFileSync(path.join(DIR, 'editor.html')), 'text/html; charset=utf-8');
    if (req.method === 'GET' && u.pathname === '/api/estado') return enviar(res, 200, { trazador: await ghEncendido(), hermandades: LAS_10.map((id) => ({ id, nombre: nombreDe(id) })) });
    const m = u.pathname.match(/^\/api\/hermandad\/([a-z0-9-]+)$/);
    if (m && LISTAS[m[1]]) {
      if (req.method === 'GET') return enviar(res, 200, await datos(m[1]));
      if (req.method === 'POST') { guardarCorrecciones(m[1], await cuerpo(req)); return enviar(res, 200, await datos(m[1])); }
    }
    enviar(res, 404, { error: 'no encontrado' });
  } catch (e) { enviar(res, 500, { error: e.message }); }
}).listen(PUERTO, '127.0.0.1', () => console.log(`Editor de rutas en http://localhost:${PUERTO}  (cierra esta ventana para apagarlo)`));
