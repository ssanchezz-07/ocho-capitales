// Ocho Capitales · red de seguridad: busca enlaces internos rotos en la web generada (site/dist) antes de publicarla.
// Mira href y src de todas las páginas: si apuntan dentro de la web, el archivo tiene que existir (carpeta/index.html,
// archivo tal cual o .html). No mira enlaces externos (otros sitios), anclas ni correos.
// Uso: node tools/comprobar-enlaces.mjs [carpeta=site/dist] [base=/]   → código 1 si hay alguno roto
import fs from 'node:fs';
import path from 'node:path';

const DIST = path.resolve(process.argv[2] || 'site/dist');
const BASE = (process.argv[3] || '/').replace(/\/?$/, '/');
const existe = new Map();
const hay = (rel) => { if (!existe.has(rel)) { const f = path.join(DIST, rel); existe.set(rel, fs.existsSync(f) && (fs.statSync(f).isFile() || fs.existsSync(path.join(f, 'index.html')))); } return existe.get(rel); };

const rotos = new Map(); let paginas = 0, enlaces = 0;
const anda = (d) => {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) { anda(p); continue; }
    if (!e.name.endsWith('.html')) continue;
    paginas++;
    const html = fs.readFileSync(p, 'utf8');
    const dir = '/' + path.relative(DIST, path.dirname(p)).split(path.sep).join('/');
    for (const m of html.matchAll(/\s(?:href|src)="([^"]+)"/g)) {
      let u = m[1].replace(/&amp;/g, '&');
      if (/^(?:[a-z][a-z0-9+.-]*:|\/\/|#|\$\{)/i.test(u)) continue;      // externos, correo, anclas, plantillas de JS
      u = u.split('#')[0].split('?')[0]; if (!u) continue;
      let abs;
      if (u.startsWith('/')) { if (!u.startsWith(BASE)) { anota(u, p); continue; } abs = u.slice(BASE.length); }
      else abs = path.posix.normalize(path.posix.join(dir, u)).replace(/^\//, '');
      try { abs = decodeURIComponent(abs); } catch { /* se deja tal cual */ }
      enlaces++;
      if (!(hay(abs) || hay(abs.replace(/\/$/, '') + '.html'))) anota(u, p);
    }
  }
};
function anota(u, p) { if (!rotos.has(u)) rotos.set(u, []); const l = rotos.get(u); if (l.length < 3) l.push(path.relative(DIST, p)); }
anda(DIST);
console.log(`Enlaces internos: ${enlaces} en ${paginas} páginas; rotos: ${rotos.size}`);
for (const [u, ps] of [...rotos].slice(0, 40)) console.log(`::error::Enlace roto ${u} (en ${ps.join(', ')})`);
process.exit(rotos.size ? 1 : 0);
