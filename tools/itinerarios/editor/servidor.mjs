// Ocho Capitales · editor de correcciones de recorridos (solo en el ordenador de Pablo, no se publica). Vale para cualquier capital
// con lista de calles (rutas/listas/<capital>.json). Sirve editor.html en http://localhost:8765, guarda las correcciones en
// rutas/correcciones-<capital>.json y vuelve a trazar la hermandad con el método nuevo (GraphHopper en http://localhost:8989).
// Arranque: doble clic en «Abrir editor de rutas.bat» (o: node servidor.mjs [capital]).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CIUDADES } from '../rutas/ciudades.mjs';
import { capitalesConLista, nombreDe, fCorrecciones, leerCorrecciones } from '../rutas/comun.mjs';
import { motor, guardarTraza, GH } from '../rutas/emparejar.mjs';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const PUERTO = +(process.env.PUERTO_EDITOR || 8765);
const INICIAL = process.argv[2] && CIUDADES[process.argv[2]] ? process.argv[2] : null;
const r6 = (x) => Math.round(x * 1e6) / 1e6;
const motores = new Map(); const M = (c) => motores.get(c) || motores.set(c, motor(c)).get(c);

async function ghEncendido() { try { const r = await fetch(GH + '/health', { signal: AbortSignal.timeout(1500) }); return r.ok; } catch { return false; } }

async function datos(c, id) {
  const { C, trazar } = M(c);
  const linea = (pts) => pts.map((p) => C.LL(...p).map(r6));
  const lista = C.LISTAS[id].calles;
  const corr = leerCorrecciones(c)[id] || {};
  const actual = C.publicado(id);
  let nuevo = null, error = null;
  try { nuevo = await trazar(id, { corr }); guardarTraza(c, nuevo); } catch (e) { error = e.message; }
  // calles candidatas de cada elemento de la lista (para que Pablo elija la buena en el plano)
  const elegidas = new Map((nuevo?.informe.calles || []).map((k) => [k.i, k]));
  const filas = lista.map((t, i) => {
    const k = elegidas.get(i);
    const h = nuevo?.hitos.find((x) => x.i === i);
    const cands = C.candidatas(t).slice(0, 8).map((g) => ({ ids: g.ids, nombre: g.nombre, lineas: g.vias.map((v) => linea(C.VIAS[v].pts)), elegida: !!k?.vias && g.ids.some((x) => k.vias.includes(x)) }));
    return { i, lugar: t, tipo: h?.tipo || 'hito', osm: k?.osm || null, punto: h?.punto || null, tramo: h?.tramo, candidatas: cands, correccion: corr.calles?.[i] || null, punto_movido: corr.puntos?.[i] || null };
  });
  // fondo: calles a menos de ~500 m del recorrido
  const todos = [...(nuevo ? [...nuevo.ida, ...nuevo.regreso] : []), ...(actual ? [...actual.ida, ...actual.regreso] : [])];
  let caja = null;
  if (todos.length) { const la = todos.map((p) => p[0]), lo = todos.map((p) => p[1]); caja = [Math.min(...la) - 0.0045, Math.min(...lo) - 0.0055, Math.max(...la) + 0.0045, Math.max(...lo) + 0.0055]; }
  const fondo = caja ? C.VIAS.filter((v) => v.nodos.some((n) => C.NODOS[n].la > caja[0] && C.NODOS[n].la < caja[2] && C.NODOS[n].lo > caja[1] && C.NODOS[n].lo < caja[3])).map((v) => ({ id: v.id, n: v.nombre, h: v.highway, p: linea(v.pts) })) : [];
  return { capital: c, id, nombre: nombreDe(id), fuente: C.LISTAS[id].fuente, filas, actual: actual && { ida: actual.ida, regreso: actual.regreso }, nuevo: nuevo && { ida: nuevo.ida.map((p) => p.map(r6)), regreso: nuevo.regreso.map((p) => p.map(r6)), salida: nuevo.informe.salida || null, entrada: nuevo.informe.entrada || null, avisos: nuevo.informe.avisos, enlaces: nuevo.informe.enlaces || [], largo_m: nuevo.informe.largo_m, ms: nuevo.informe.ms_total }, error, correcciones: corr, caja, fondo };
}
// Mezcla los cambios del editor en el archivo de correcciones de la capital (null = quitar esa corrección)
function guardarCorrecciones(c, id, cambios) {
  const todo = leerCorrecciones(c); const k0 = todo[id] || {};
  for (const k of ['calles', 'puntos']) for (const [i, v] of Object.entries(cambios[k] || {})) { k0[k] = k0[k] || {}; if (v === null) delete k0[k][i]; else k0[k][i] = v; if (!Object.keys(k0[k]).length) delete k0[k]; }
  for (const k of ['salida', 'entrada']) if (k in cambios) { if (cambios[k] === null) delete k0[k]; else k0[k] = cambios[k]; }
  if (cambios.borrar_todo) for (const k of Object.keys(k0)) delete k0[k];
  if (cambios.fuente) (k0.fuentes = k0.fuentes || []).push({ fecha: new Date().toISOString().slice(0, 16).replace('T', ' '), fuente: cambios.fuente, cambios: cambios.resumen || '' });
  if (Object.keys(k0).length) { k0.actualizado = new Date().toISOString().slice(0, 16).replace('T', ' '); todo[id] = k0; } else delete todo[id];
  fs.writeFileSync(fCorrecciones(c), JSON.stringify(todo, null, 1));
}

const enviar = (res, cod, obj, tipo = 'application/json; charset=utf-8') => { res.writeHead(cod, { 'Content-Type': tipo, 'Cache-Control': 'no-store' }); res.end(typeof obj === 'string' || Buffer.isBuffer(obj) ? obj : JSON.stringify(obj)); };
const cuerpo = (req) => new Promise((ok, mal) => { let s = ''; req.on('data', (d) => { s += d; if (s.length > 2e6) mal(new Error('demasiado grande')); }); req.on('end', () => { try { ok(s ? JSON.parse(s) : {}); } catch (e) { mal(e); } }); });

http.createServer(async (req, res) => {
  try {
    const u = new URL(req.url, 'http://localhost');
    if (req.method === 'GET' && (u.pathname === '/' || u.pathname === '/editor.html')) return enviar(res, 200, fs.readFileSync(path.join(DIR, 'editor.html')), 'text/html; charset=utf-8');
    if (req.method === 'GET' && u.pathname === '/api/estado') return enviar(res, 200, { trazador: await ghEncendido(), capital: INICIAL, capitales: capitalesConLista().map((c) => ({ c, nombre: CIUDADES[c].nombre })) });
    if (req.method === 'GET' && u.pathname === '/api/hermandades') { const c = u.searchParams.get('capital'); if (!capitalesConLista().includes(c)) return enviar(res, 404, { error: 'capital sin lista' }); return enviar(res, 200, Object.keys(M(c).C.LISTAS).map((id) => ({ id, nombre: nombreDe(id) })).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))); }
    const m = u.pathname.match(/^\/api\/([a-z]+)\/hermandad\/([a-z0-9-]+)$/);
    if (m && capitalesConLista().includes(m[1]) && M(m[1]).C.LISTAS[m[2]]) {
      if (req.method === 'GET') return enviar(res, 200, await datos(m[1], m[2]));
      if (req.method === 'POST') { guardarCorrecciones(m[1], m[2], await cuerpo(req)); return enviar(res, 200, await datos(m[1], m[2])); }
    }
    enviar(res, 404, { error: 'no encontrado' });
  } catch (e) { enviar(res, 500, { error: e.message }); }
}).listen(PUERTO, '127.0.0.1', () => console.log(`Editor de rutas en http://localhost:${PUERTO}  (cierra esta ventana para apagarlo)`));
