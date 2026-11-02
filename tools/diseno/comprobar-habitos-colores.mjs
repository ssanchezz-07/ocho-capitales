// Ocho Capitales · comprobación de tools/sources/habitos-colores.json contra el texto de habitos.json (oc-diseno).
// Cada color y cada prenda de la tabla tienen que aparecer escritos en el texto de su hermandad, y no puede faltar ninguna hermandad.
// Uso: node tools/diseno/comprobar-habitos-colores.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const DIR = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(DIR, '..', 'sources');
const TXT = JSON.parse(fs.readFileSync(path.join(SRC, 'habitos.json'), 'utf8'));
const COL = JSON.parse(fs.readFileSync(path.join(SRC, 'habitos-colores.json'), 'utf8'));
const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
// Raíz que tiene que aparecer en el texto (sin la vocal de género ni el plural)
const raiz = (w) => norm(w).replace(/(os|as|es|o|a|s)$/, '');
const fallos = [];
for (const [slug, h] of Object.entries(TXT)) if (h && h.texto && !(slug in COL)) fallos.push(`${slug}: falta en la tabla`);
for (const [slug, secs] of Object.entries(COL)) {
  if (slug.startsWith('_')) continue;
  const t = TXT[slug] && norm(TXT[slug].texto);
  if (!t) { fallos.push(`${slug}: no está en habitos.json`); continue; }
  for (const [nombre, prendas] of secs) {
    for (const [p, c] of Object.entries(prendas)) {
      // Erratas de la ficha: «ceñido» por «ceñidor» (El Despojado) y «T única» (La Sentencia); «hábito» es el color de todo el hábito («Color marfil», La Palma)
      const r = raiz({ ceñidor: 'ceñido' }[p] || p);
      if (p !== 'hábito' && !t.includes(r) && !t.includes(r.replace(/z$/, 'c')) && !(p === 'túnica' && t.includes('t unica'))) fallos.push(`${slug} ${nombre || ''}: prenda «${p}» no está en el texto`);
      for (const w of c.split(/\s+y\s+|\s+/)) if (!t.includes(raiz(w))) fallos.push(`${slug} ${nombre || ''}: color «${w}» (${p}) no está en el texto`);
    }
  }
}
console.log(fallos.length ? fallos.join('\n') : 'OK');
console.log(`${Object.keys(COL).filter((k) => !k.startsWith('_')).length} hermandades en la tabla, ${fallos.length} fallos`);
process.exitCode = fallos.length ? 1 : 0;
