// Prueba rápida a mano: node scripts/preguntar-cunao.mjs "pregunta 1" "pregunta 2" …  (antes: node build.mjs)
// Cada pregunta se hace en una conversación nueva; con --seguido, todas en la misma (para probar el contexto).
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(DIR, 'dist', 'data');
const D = JSON.parse(fs.readFileSync(path.join(DIST, 'cunao.json'), 'utf8'));
const leer = (f) => JSON.parse(fs.readFileSync(path.join(DIST, 'cunao', f), 'utf8'));
const sb = { module: { exports: {} }, Intl, Date, Math, JSON, Set, Map, RegExp, String, Array, Object, Number, console };
vm.runInNewContext(fs.readFileSync(path.join(DIR, 'assets', 'cunao.js'), 'utf8'), sb);
const { crearMotor } = sb.module.exports;
const hoy = process.env.HOY || '2026-11-08';
const nuevo = () => crearMotor(D, { base: '/', azar: (l) => l[0], hoy: (mas) => { const d = new Date(hoy + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + (mas || 0)); return d.toISOString().slice(0, 10); }, horaAhora: () => 18 });
const args = process.argv.slice(2).filter((a) => a !== '--seguido');
let m = nuevo();
for (const q of args) {
  if (!process.argv.includes('--seguido')) m = nuevo();
  let r = m.responder(q), n = 0;
  while (r.necesita && n++ < 4) { for (const k of r.necesita) m.cargarDatos ? m.cargarDatos(k, leer(k + '.json')) : m.cargarCiudad(k, leer(k + '.json')); r = m.responder(q); }
  console.log('P: ' + q + '\nR: ' + [r.texto, ...r.enlaces.map((e) => '  → ' + e.join(' ')), r.chips.length ? '  [' + r.chips.map((c) => c[0]).join(' | ') + ']' : ''].filter(Boolean).join('\n   ') + '\n');
}
