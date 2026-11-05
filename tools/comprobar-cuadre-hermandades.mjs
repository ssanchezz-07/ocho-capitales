// Ocho Capitales: las fichas de hermandad de cada capital cuadran con su cifra oficial (Pablo, 5-nov-2026: «todo debe cuadrar»).
// El portal tiene una ficha por cortejo o salida; la cifra oficial (capitales[].cifra.n, con su fuente) cuenta hermandades. Las fichas
// que son otro cortejo o sección de una hermandad que ya tiene ficha están en tools/sources/cuadre-hermandades.json, cada una con
// su ficha principal, su motivo y su fuente. Las fichas que no son de ninguna hermandad (como el Resucitado de Málaga, titular de la
// propia Agrupación) van en «sin_hermandad», también con su motivo y su fuente. Para la publicación si:
//   - una capital no tiene cifra oficial con fuente, o no está en cuadre-hermandades.json;
//   - fichas − cortejos − sin hermandad ≠ cifra oficial (falta o sobra una ficha, o la cifra está mal);
//   - la entidad oficial da el número de cortejos y las fichas no son esas;
//   - un cortejo apuntado no existe, es de otra capital, no tiene motivo o fuente, o su ficha principal no existe;
//   - una ficha sin hermandad no existe, es de otra capital, no tiene motivo o fuente, o está apuntada además como cortejo o como ficha principal.
// Uso: node tools/comprobar-cuadre-hermandades.mjs [portal.json, para probar con otro]
import fs from 'node:fs';
const D = JSON.parse(fs.readFileSync(process.argv[2] || 'portal-cofrade/data/portal.json', 'utf8'));
const C = JSON.parse(fs.readFileSync('tools/sources/cuadre-hermandades.json', 'utf8')).capitales;
const url = (u) => /^https?:\/\/\S+$/.test(u || '');
const HERM = new Map(D.hermandades.map((h) => [h.slug, h]));
let errores = 0;
const mal = (m) => { console.log('ERROR', m); errores++; };
const filas = [];
for (const c of D.capitales) {
  const n = c.nombre; const fichas = D.hermandades.filter((h) => h.ciudad === c.slug);
  const q = C[c.slug];
  if (!c.cifra || !Number.isInteger(c.cifra.n) || !c.cifra.fuente || !url(c.cifra.fuente[1])) { mal(`${n}: no tiene cifra oficial de hermandades con fuente`); continue; }
  if (!q) { mal(`${n}: no está en tools/sources/cuadre-hermandades.json`); continue; }
  for (const k of ['cortejos', 'sin_hermandad']) if (q[k] != null && !Array.isArray(q[k])) { mal(`${n}: «${k}» en cuadre-hermandades.json tiene que ser una lista`); q[k] = []; }
  const cortejos = q.cortejos || []; const vistos = new Set(); const antes = errores;
  for (const x of cortejos) {
    const h = HERM.get(x.slug), p = HERM.get(x.hermandad);
    if (vistos.has(x.slug)) mal(`${n}: «${x.slug}» está apuntado dos veces como cortejo`);
    vistos.add(x.slug);
    if (!h) mal(`${n}: el cortejo apuntado «${x.slug}» no tiene ficha`);
    else if (h.ciudad !== c.slug) mal(`${n}: el cortejo apuntado «${x.slug}» es de otra capital`);
    if (!p) mal(`${n}: la hermandad principal «${x.hermandad}» de «${x.slug}» no tiene ficha`);
    else if (p.ciudad !== c.slug) mal(`${n}: la hermandad principal «${x.hermandad}» es de otra capital`);
    if (x.hermandad === x.slug || cortejos.some((y) => y.slug === x.hermandad)) mal(`${n}: «${x.hermandad}» no puede ser a la vez cortejo y ficha principal`);
    if (!String(x.motivo || '').trim()) mal(`${n}: el cortejo «${x.slug}» no dice por qué`);
    if (!Array.isArray(x.fuentes) || !x.fuentes.length || !x.fuentes.every(url)) mal(`${n}: el cortejo «${x.slug}» no tiene fuente`);
  }
  const sin = q.sin_hermandad || []; const vistosS = new Set();
  for (const x of sin) {
    const h = HERM.get(x.slug);
    if (vistosS.has(x.slug)) mal(`${n}: «${x.slug}» está apuntada dos veces como ficha sin hermandad`);
    vistosS.add(x.slug);
    if (!h) mal(`${n}: la ficha sin hermandad «${x.slug}» no existe en portal.json`);
    else if (h.ciudad !== c.slug) mal(`${n}: la ficha sin hermandad «${x.slug}» es de otra capital`);
    if (vistos.has(x.slug)) mal(`${n}: «${x.slug}» está apuntada a la vez como cortejo y como ficha sin hermandad`);
    if (cortejos.some((y) => y.hermandad === x.slug)) mal(`${n}: «${x.slug}» es ficha principal de un cortejo y no puede ser ficha sin hermandad`);
    if (!String(x.motivo || '').trim()) mal(`${n}: la ficha sin hermandad «${x.slug}» no dice por qué`);
    if (!Array.isArray(x.fuentes) || !x.fuentes.length || !x.fuentes.every(url)) mal(`${n}: la ficha sin hermandad «${x.slug}» no tiene fuente`);
  }
  const hermandades = fichas.length - cortejos.length - sin.length;
  if (hermandades !== c.cifra.n) mal(`${n}: ${fichas.length} fichas − ${cortejos.length} cortejos de otra hermandad${sin.length ? ` − ${sin.length} sin hermandad` : ''} = ${hermandades}, pero la cifra oficial dice ${c.cifra.n} «${c.cifra.corto}». Falta o sobra una ficha, falta apuntar un cortejo o la cifra está mal`);
  if (q.cortejos_oficiales != null) {
    if (!url(q.cortejos_fuente)) mal(`${n}: el número de cortejos oficiales no tiene fuente`);
    if (!String(q.cortejos_como || '').trim()) mal(`${n}: falta decir de dónde sale el número de cortejos oficiales (cortejos_como)`);
    if (fichas.length !== q.cortejos_oficiales) mal(`${n}: ${fichas.length} fichas, pero los cortejos oficiales son ${q.cortejos_oficiales}, según ${q.cortejos_como || 'la entidad oficial'} (${q.cortejos_fuente})`);
  }
  if (errores === antes) filas.push(`${n}: ${fichas.length} fichas = ${c.cifra.n} hermandades${cortejos.length ? ' + ' + cortejos.length + ' ' + (cortejos.length === 1 ? 'cortejo' : 'cortejos') + ' de otra hermandad' : ''}${sin.length ? ' + ' + sin.length + (sin.length === 1 ? ' ficha' : ' fichas') + ' sin hermandad' : ''}${q.cortejos_oficiales != null ? ` (${q.cortejos_oficiales} cortejos oficiales)` : ''}`);
}
const CIUDADES = new Set(D.capitales.map((c) => c.slug));
for (const h of D.hermandades) if (!CIUDADES.has(h.ciudad)) mal(`la ficha «${h.slug}» tiene una ciudad que no es una capital del portal («${h.ciudad}»)`);
for (const s of Object.keys(C)) if (!D.capitales.some((c) => c.slug === s)) mal(`cuadre-hermandades.json: «${s}» no es una capital del portal`);
for (const f of filas) console.log(f);
console.log(`Cuadre de hermandades: ${D.capitales.length} capitales, ${errores} errores`);
process.exit(errores ? 1 : 0);
