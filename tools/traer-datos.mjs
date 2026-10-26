// Ocho Capitales: trae a tu copia local las noticias y agendas que el bot lee cada hora.
// Desde el 2026-10-26 el bot las guarda en la rama «datos» (un único commit que se reescribe; ver tools/datos-rama.sh);
// las copias de main se quedan fijas en esa fecha.
// Uso: node tools/traer-datos.mjs   (desde la raíz del proyecto; luego, node site/build.mjs)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const REPO = 'ssanchezz-07/ocho-capitales';
const ARCHIVOS = ['site/data/news.json', 'tools/sources/agenda-externa.json', 'tools/sources/agenda-cuerpos.json', 'tools/sources/agenda-urls.json', 'tools/sources/cambios-bandas.json'];

let fallos = 0;
for (const f of ARCHIVOS) {
  try {
    const r = await fetch(`https://raw.githubusercontent.com/${REPO}/datos/${f}`, { headers: { 'cache-control': 'no-cache' } });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const txt = await r.text(); JSON.parse(txt);
    fs.mkdirSync(path.dirname(path.join(RAIZ, f)), { recursive: true });
    fs.writeFileSync(path.join(RAIZ, f), txt);
    console.log(`✓ ${f} (${(txt.length / 1024).toFixed(0)} KB)`);
  } catch (e) { fallos++; console.log(`✗ ${f}: ${e.message}${fs.existsSync(path.join(RAIZ, f)) ? ' (se conserva la copia local)' : ''}`); }
}
process.exit(fallos === ARCHIVOS.length ? 1 : 0);
