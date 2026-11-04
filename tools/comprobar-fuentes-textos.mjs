// Ocho Capitales: cada texto de autor de la web tiene su fuente registrada (EQUIPO/ORDEN-VERIFICAR-TEXTOS.md, 3-nov-2026).
// 1. portal.json: de cada capital, el lema, la historia, cada fila de «Datos clave» y cada «Imprescindible» llevan fuente;
//    cada historia de hermandad, también.
// 2. site/build.mjs: cada descripción de página (desc) y cada entradilla (oc-lead) está en tools/sources/textos-autor.json,
//    con sus fuentes si afirma algo o como «web» si solo describe la propia web («Buscador de hermandades…»).
// Si falta alguna, sale con error y la red de seguridad para la publicación.
// Uso: node tools/comprobar-fuentes-textos.mjs
import fs from 'node:fs';
const D = JSON.parse(fs.readFileSync('portal-cofrade/data/portal.json', 'utf8'));
const REG = JSON.parse(fs.readFileSync('tools/sources/textos-autor.json', 'utf8')).textos;
const url = (u) => /^https?:\/\/\S+$/.test(u);
const conFuente = (fs_) => Array.isArray(fs_) && fs_.length > 0 && fs_.every(url);
let errores = 0;
const mal = (m) => { console.log('ERROR', m); errores++; };

for (const c of D.capitales) {
  const n = c.nombre;
  if (!conFuente(c.lema_fuentes)) mal(`${n}: el lema no tiene fuente`);
  if (!conFuente(c.intro_fuentes)) mal(`${n}: la historia no tiene fuente`);
  c.datos.forEach(([k], i) => { if (!conFuente((c.datos_fuentes || [])[i])) mal(`${n}: el dato clave «${k}» no tiene fuente`); });
  c.claves.forEach((k, i) => { if (!conFuente((c.claves_fuentes || [])[i])) mal(`${n}: el imprescindible «${k.slice(0, 50)}…» no tiene fuente`); });
}
for (const h of D.hermandades) if (h.historia && !conFuente(h.historia_fuentes)) mal(`${h.slug}: la historia no tiene fuente`);

// Textos fijos de build.mjs: se comparan tal cual están escritos en el código (con sus ${…} si los llevan): descripciones de
// página, entradillas (oc-lead y nx-lead) y notas del calendario litúrgico (add(días, 'Título', 'Nota'))
const src = fs.readFileSync('site/build.mjs', 'utf8');
const fijos = [
  ...src.matchAll(/\bdesc: '((?:[^'\\]|\\.)+)'/g), ...src.matchAll(/\bdesc: `([^`]+)`/g),
  ...src.matchAll(/class="(?:oc|nx)-lead">((?:[^<]|<(?!\/p>))+)<\/p>/g),
  ...src.matchAll(/\badd\(-?\d+, '[^']+', '((?:[^'\\]|\\.)+)'\)/g),
  // páginas legales (pulido, 4-nov-2026): cada frase lp(…), lpl(…) (con un enlace) o ll(…) y la descripción de cada página, pag('ruta/', 'Título', …)
  ...src.matchAll(/\b(?:lp|lpl|ll)\('((?:[^'\\]|\\.)+)'[,)]/g), ...src.matchAll(/\bpag\('[^']+', '[^']+', '((?:[^'\\]|\\.)+)'/g),
].map((m) => m[1]);
const porTexto = new Map(REG.map((r) => [r.texto, r]));
for (const t of new Set(fijos)) {
  const r = porTexto.get(t);
  if (!r) { mal(`build.mjs: texto sin registrar en textos-autor.json: «${t.slice(0, 70)}»`); continue; }
  if (r.tipo === 'afirmacion' && !conFuente(r.fuentes)) mal(`build.mjs: «${t.slice(0, 70)}» afirma algo y no tiene fuente`);
  if (!['afirmacion', 'web'].includes(r.tipo)) mal(`textos-autor.json: tipo «${r.tipo}» en «${t.slice(0, 40)}» (vale «afirmacion» o «web»)`);
}
console.log(`Fuentes de los textos: ${D.capitales.length} capitales, ${D.hermandades.length} hermandades, ${new Set(fijos).size} textos fijos, ${errores} errores`);
process.exit(errores ? 1 : 0);
