// Ocho Capitales: pasa a tools/sources/complementos.json las propuestas REVISADAS de tools/sources/propuestas/.
// Las propuestas las preparan búsquedas (agentes) con su fuente; aquí solo entran las que:
//   - traen fuente (URL) y valor,
//   - rellenan un campo que hoy está vacío en portal.json (nunca sobrescriben un dato oficial),
//   - y no están en la lista de rechazadas (--rechazar slug.campo,…).
// Uso: node tools/integrar-propuestas.mjs [fichas|webs|autores|imagineros|todo] [--rechazar a.b,c.d] [--seco]
// Después: node tools/build-data.js; cd site; node build.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const F = (p) => path.join(RAIZ, p);
const leer = (p) => (fs.existsSync(F(p)) ? JSON.parse(fs.readFileSync(F(p), 'utf8')) : null);
const args = process.argv.slice(2);
const que = args.find((a) => !a.startsWith('--')) || 'todo';
const seco = args.includes('--seco');
const iR = args.indexOf('--rechazar');
const rech = new Set(iR >= 0 && args[iR + 1] ? args[iR + 1].split(',').map((s) => s.trim()).filter(Boolean) : []);
const HOY = new Date().toISOString().slice(0, 10);

const COMP = leer('tools/sources/complementos.json');
const P = leer('portal-cofrade/data/portal.json');
const H = Object.fromEntries(P.hermandades.map((h) => [h.slug, h]));
const IM = Object.fromEntries(P.imagineros.map((i) => [i.slug, i]));
const vacio = (v) => v == null || !String(v).trim();
const esUrl = (u) => /^https?:\/\/\S+$/.test(String(u || ''));
const hc = (slug) => (COMP.hermandades[slug] = COMP.hermandades[slug] || {});
const cuenta = {};
const suma = (k) => (cuenta[k] = (cuenta[k] || 0) + 1);

if (que === 'todo' || que === 'fichas') {
  const p = leer('tools/sources/propuestas/fichas.json');
  if (p) {
    for (const [slug, campos] of Object.entries(p.hermandades || {})) {
      if (!H[slug]) { suma('fichas: slug desconocido'); continue; }
      for (const [campo, v] of Object.entries(campos)) {
        if (rech.has(slug + '.' + campo)) { suma('fichas: rechazada'); continue; }
        if (!v || vacio(v.valor) || !esUrl(v.fuente)) { suma('fichas: sin fuente o valor'); continue; }
        if (!vacio(H[slug][campo])) { suma('fichas: ya tenía dato'); continue; }
        const r = (hc(slug).relleno = hc(slug).relleno || {});
        if (r[campo]) { suma('fichas: ya rellenado antes'); continue; }
        r[campo] = { valor: v.valor.trim(), fuente: v.fuente, revisado: HOY };
        suma('fichas: ' + campo);
      }
    }
    // Fichas oficiales que ya no existen: se enlaza su copia archivada (Wayback Machine) hasta que vuelvan
    for (const [slug, url] of Object.entries(p.fuentes_nuevas || {})) {
      const u = String(url).split(' ')[0];
      if (!H[slug] || !esUrl(u) || rech.has(slug + '.fuente')) continue;
      hc(slug).fuente_actual = { url: u, motivo: 'La ficha oficial dejó de estar disponible; copia archivada', revisado: HOY };
      suma('fichas: fuente archivada');
    }
  }
}

if (que === 'todo' || que === 'webs') {
  const p = leer('tools/sources/propuestas/webs.json');
  if (p) for (const [slug, w] of Object.entries(p.hermandades || {})) {
    if (!H[slug] || rech.has(slug + '.web')) { suma('webs: rechazada o desconocida'); continue; }
    if (!esUrl(w.url) || !esUrl(w.fuente)) { suma('webs: sin fuente'); continue; }
    if (!vacio(H[slug].web) || hc(slug).web_oficial) { suma('webs: ya tenía'); continue; }
    hc(slug).web_oficial = { url: w.url, fuente: w.fuente, comprobada: w.comprobada || HOY };
    suma('webs: añadida');
  }
}

if (que === 'todo' || que === 'autores') {
  const p = leer('tools/sources/propuestas/autores-titulares.json');
  if (p) for (const t of p.titulares || []) {
    const h = H[t.hermandad];
    if (!h || rech.has(t.hermandad + '.' + t.titular)) { suma('autores: rechazada o desconocida'); continue; }
    if (vacio(t.autor) || !esUrl(t.fuente)) { suma('autores: sin fuente'); continue; }
    const tit = (h.titulares || []).find((x) => x.nombre === t.titular);
    if (!tit) { suma('autores: titular no encontrado'); continue; }
    if (!vacio(tit.autor)) { suma('autores: ya tenía'); continue; }
    const l = (hc(t.hermandad).titulares_autor = hc(t.hermandad).titulares_autor || []);
    if (l.some((x) => x.titular === t.titular)) { suma('autores: ya integrado'); continue; }
    l.push({ titular: t.titular, autor: t.autor.trim(), anio: t.anio || '', atribucion: !!t.atribucion, fuente: t.fuente, revisado: HOY });
    suma('autores: ' + (t.atribucion ? 'atribuido' : 'documentado'));
  }
}

if (que === 'todo' || que === 'imagineros') {
  const p = leer('tools/sources/propuestas/imagineros.json');
  COMP.imagineros = COMP.imagineros || {};
  if (p) for (const [slug, b] of Object.entries(p.imagineros || {})) {
    const im = IM[slug];
    if (!im || rech.has(slug + '.bio')) { suma('imagineros: rechazada o desconocida'); continue; }
    if (vacio(b.bio) || !(b.fuentes || []).some(esUrl)) { suma('imagineros: sin fuente'); continue; }
    if (!vacio(im.bio)) { suma('imagineros: ya tenía'); continue; }
    const x = (COMP.imagineros[im.nombre] = COMP.imagineros[im.nombre] || {});
    if (x.rechazado) { suma('imagineros: rechazado antes'); continue; }
    x.bio_relleno = { valor: b.bio.trim(), vida: b.vida || '', fuentes: b.fuentes.filter(esUrl), revisado: HOY };
    suma('imagineros: bio');
  }
}

if (!seco) fs.writeFileSync(F('tools/sources/complementos.json'), JSON.stringify(COMP, null, 1));
console.log((seco ? '[prueba] ' : '') + JSON.stringify(cuenta, null, 1));
