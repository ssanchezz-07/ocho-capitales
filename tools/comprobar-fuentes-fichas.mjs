// Ocho Capitales: cada ficha lleva a sus fuentes (pulido, encargo 5, 4-nov-2026).
// Las fichas ya no pintan sus bloques «Fuentes»: dejan una línea «Fuentes de esta ficha →» que lleva a su apartado en
// «Fuentes y metodología» (acerca/fuentes/…). Esta comprobación para la publicación si:
//   - una ficha con datos no tiene su enlace (capitales, hermandades y marchas siempre; imagineros con biografía;
//     bandas con historia o datos);
//   - el enlace no lleva a un apartado que exista;
//   - el apartado está vacío (sin ninguna fuente);
//   - una ficha vuelve a pintar un bloque de fuentes propio.
// Uso: node tools/comprobar-fuentes-fichas.mjs <carpeta de la web> <base, «/» o «/ocho-capitales/»>
import fs from 'node:fs';
import path from 'node:path';
const DIST = process.argv[2] || 'site/dist';
const BASE = process.argv[3] || '/';
let errores = 0; let fichas = 0; let enlaces = 0;
const mal = (m) => { if (errores < 40) console.log('ERROR', m); errores++; };
const paginas = new Map();
const leer = (rel) => { if (!paginas.has(rel)) { const f = path.join(DIST, rel, 'index.html'); paginas.set(rel, fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : null); } return paginas.get(rel); };
const TIPOS = [
  ['semana-santa', () => true],
  ['hermandad', () => true],
  ['marcha', () => true],
  ['imaginero', (html) => html.includes('>Biografía</h2>')],
  ['banda', (html) => html.includes('class="bx-datos"') || /<h2 class="oc-h2">Historia<\/h2><div class="oc-prose">/.test(html)],
];
for (const [dir, obligado] of TIPOS) {
  const raiz = path.join(DIST, dir);
  if (!fs.existsSync(raiz)) { mal(`no existe ${dir}/ en la web generada`); continue; }
  for (const slug of fs.readdirSync(raiz)) {
    const rel = `${dir}/${slug}`; const html = leer(rel);
    if (!html || html.includes('http-equiv="refresh"')) continue; // redirecciones
    fichas++;
    if (html.includes('<ul class="oc-fuentes">')) mal(`${rel}: vuelve a pintar un bloque de fuentes; van en «Fuentes y metodología»`);
    const m = /<p class="oc-fuentes-ficha"><a href="([^"#]+)#([^"]+)">/.exec(html);
    if (!m) { if (obligado(html)) mal(`${rel}: le falta el enlace «Fuentes de esta ficha»`); continue; }
    enlaces++;
    const [, ruta, ancla] = m;
    if (!ruta.startsWith(BASE)) { mal(`${rel}: el enlace de fuentes no empieza por la base (${ruta})`); continue; }
    const destino = ruta.slice(BASE.length).replace(/\/$/, '');
    const pag = leer(destino);
    if (!pag) { mal(`${rel}: el enlace de fuentes lleva a una página que no existe (${ruta})`); continue; }
    const i = pag.indexOf(`<section class="oc-fuente-ficha" id="${ancla}"`);
    if (i < 0) { mal(`${rel}: el enlace de fuentes lleva a un apartado que no existe (${ruta}#${ancla})`); continue; }
    const sec = pag.slice(i, pag.indexOf('</section>', i));
    if (!/<ul class="oc-fuentes"><li>/.test(sec)) mal(`${rel}: su apartado de fuentes está vacío (${ruta}#${ancla})`);
    // un texto basado en Wikipedia (historia o biografía) lleva en la ficha su línea de licencia
    if (/wikipedia\.org[^"]*"[^>]*>[^<]*<\/a><span>[^<]*\b(historia|biografía)/.test(sec) && !html.includes('class="oc-wiki"')) mal(`${rel}: su texto viene de Wikipedia y le falta la línea «Texto basado en Wikipedia (CC BY-SA 4.0)»`);
  }
}
console.log(`Fuentes de las fichas: ${fichas} fichas, ${enlaces} con su enlace a fuentes, ${errores} errores`);
process.exit(errores ? 1 : 0);
