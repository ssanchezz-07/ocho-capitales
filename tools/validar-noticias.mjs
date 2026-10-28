// Ocho Capitales · red de seguridad: valida el news.json que se va a subir a R2 (la página de Noticias lo lee de ahí).
// Si no pasa, no se sube y se queda el anterior; la página tiene además el respaldo que va dentro de la web.
// Comprueba: JSON válido; «actualizado» reciente; entre 50 y 1.000 noticias; cada una con titular, enlace https, fuente,
// fecha y capitales; tamaño entre 20 KB y 5 MB.
// Uso: node tools/validar-noticias.mjs [site/dist/news.json]   → código 1 si no vale
import fs from 'node:fs';

const f = process.argv[2] || 'site/dist/news.json';
const fallos = [];
let j = null;
const tam = fs.existsSync(f) ? fs.statSync(f).size : 0;
if (!tam) fallos.push('no existe o está vacío');
else {
  if (tam < 20e3 || tam > 5e6) fallos.push(`tamaño raro: ${(tam / 1024).toFixed(0)} KB`);
  try { j = JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { fallos.push('no es JSON válido: ' + e.message); }
}
if (j) {
  const dias = (Date.now() - (+j.actualizado || 0)) / 864e5;
  if (!(dias < 3)) fallos.push(`«actualizado» de hace ${dias.toFixed(1)} días`);
  const it = Array.isArray(j.items) ? j.items : null;
  if (!it) fallos.push('sin lista de noticias');
  else {
    if (it.length < 50 || it.length > 1000) fallos.push(`${it.length} noticias (se esperan entre 50 y 1.000)`);
    const malas = it.filter((n) => !n || typeof n.titulo !== 'string' || !n.titulo.trim() || !/^https:\/\//.test(n.url || '') || typeof n.fuente !== 'string' || !Number.isFinite(n.ts) || !Array.isArray(n.ciudades));
    if (malas.length > it.length * 0.02) fallos.push(`${malas.length} noticias sin titular, enlace https, fuente, fecha o capitales`);
  }
}
if (fallos.length) { for (const x of fallos) console.log(`::error::news.json (${f}): ${x}`); process.exit(1); }
console.log(`news.json válido: ${j.items.length} noticias, ${(tam / 1024).toFixed(0)} KB`);
