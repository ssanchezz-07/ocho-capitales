// Ocho Capitales: comprueba que portal.json es exactamente lo que genera tools/build-data.js desde sus fuentes.
// Un solo origen para cada dato: si alguien corrige algo a mano en portal.json, este comprobador lo detecta, y la corrección
// tiene que pasar a su archivo de fuentes (o al script). Falla (código 1) si hay diferencias; no toca el publicado.
// Uso: node tools/comprobar-origen.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const RAIZ = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUB = path.join(RAIZ, 'portal-cofrade', 'data', 'portal.json');
const TMP = path.join(os.tmpdir(), `portal-regenerado-${process.pid}.json`);
execFileSync(process.execPath, [path.join(RAIZ, 'tools', 'build-data.js')], { env: { ...process.env, PORTAL_OUT: TMP }, stdio: 'ignore' });
const A = JSON.parse(fs.readFileSync(PUB, 'utf8')), B = JSON.parse(fs.readFileSync(TMP, 'utf8'));
fs.unlinkSync(TMP);
const dif = [];
for (const k of new Set([...Object.keys(A), ...Object.keys(B)])) {
  if (k === 'generado') continue;
  if (!Array.isArray(A[k]) || !A[k][0] || !A[k][0].slug) { if (JSON.stringify(A[k]) !== JSON.stringify(B[k])) dif.push(k); continue; }
  const a = Object.fromEntries(A[k].map((x) => [x.slug, x])), b = Object.fromEntries((B[k] || []).map((x) => [x.slug, x]));
  for (const s of new Set([...Object.keys(a), ...Object.keys(b)])) {
    const campos = [...new Set([...Object.keys(a[s] || {}), ...Object.keys(b[s] || {})])].filter((c) => JSON.stringify((a[s] || {})[c]) !== JSON.stringify((b[s] || {})[c]));
    if (campos.length) dif.push(`${k}/${s}: ${campos.join(', ')}`);
  }
}
if (dif.length) { console.log(`portal.json NO coincide con lo que genera build-data.js (${dif.length} diferencias):`); for (const d of dif.slice(0, 30)) console.log('  ' + d); process.exit(1); }
console.log('portal.json coincide con lo que genera build-data.js');
