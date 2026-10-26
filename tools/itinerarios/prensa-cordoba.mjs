// Ocho Capitales · Córdoba: debate.json → tools/itinerarios/cordoba-prensa-2026.json, con el id del sitio y la URL de cada guía.
// Uso: node prensa-cordoba.mjs <carpeta>/debate.json tools/itinerarios/cordoba-prensa-2026.json
import fs from 'node:fs';
const [, , fIn, fOut] = process.argv;
const D = JSON.parse(fs.readFileSync(fIn, 'utf8'));
const B = 'https://www.eldebate.com/espana/la-voz-de-cordoba/religion-y-cofradias/';
const GUIAS = {
  'guia-procesiones-domingo-ramos-cordoba': ['20260329/guia-procesiones-domingo-ramos-cordoba_401155.html', ['entrada-triunfal', 'penas-de-santiago', 'el-huerto', 'el-rescatado', 'vera-cruz', 'la-esperanza', 'el-amor']],
  'guia-procesiones-lunes-santo-cordoba': ['20260330/guia-procesiones-lunes-santo-cordoba_401486.html', ['la-merced', 'presentacion-al-pueblo', 'la-estrella', 'la-sentencia', 'via-crucis', 'animas']],
  'guia-procesiones-martes-santo-cordoba': ['20260331/guia-procesiones-martes-santo-cordoba_401690.html', ['la-agonia', 'la-universitaria', 'la-sangre', 'el-buen-suceso', 'la-santa-faz', 'el-prendimiento']],
  'guia-procesiones-miercoles-santo-cordoba': ['20260401/guia-procesiones-miercoles-santo-cordoba_401901.html', ['el-perdon', 'la-paz', 'el-calvario', 'la-misericordia', 'la-pasion', 'la-piedad']],
  'guia-procesiones-jueves-santo-madrugada-cordoba': ['20260402/guia-procesiones-jueves-santo-madrugada-cordoba_402071.html', ['jesus-nazareno', 'la-caridad', 'jesus-caido', 'la-cena', 'las-angustias', 'cristo-de-gracia-el-esparraguero', 'la-buena-muerte']],
  'guia-procesiones-viernes-santo-cordoba-2026': ['20260403/guia-procesiones-viernes-santo-cordoba-2026_402605.html', ['santo-sepulcro', 'la-soledad', 'la-expiracion', 'el-descendimiento', 'la-conversion', 'los-dolores']],
};
const out = { fuente: 'El Debate · La Voz de Córdoba, guías de las procesiones de 2026 (una por día). Texto del recorrido copiado literal; el horario, también.', hermandades: {} };
for (const [k, [url, ids]] of Object.entries(GUIAS)) {
  const bl = D[k]; if (bl.length !== ids.length) throw new Error(`${k}: ${bl.length} bloques y ${ids.length} ids`);
  bl.forEach((b, i) => {
    let { horario, recorrido } = b;
    if (!/^Salida\b/.test(recorrido || '') && /^Salida\b/.test(horario || '')) [recorrido, horario] = [horario, recorrido ?? null]; // la guía cruza «Horario» y «Recorrido»
    out.hermandades[ids[i] + '-cordoba'] = { url: B + url, horario: horario ?? null, recorrido: recorrido ?? null };
  });
}
fs.writeFileSync(fOut, JSON.stringify(out, null, 1));
for (const [id, h] of Object.entries(out.hermandades)) if (!h.recorrido || !h.horario) console.log('incompleto:', id, !h.recorrido ? 'sin recorrido' : 'sin horario');
console.log(Object.keys(out.hermandades).length, 'hermandades');
