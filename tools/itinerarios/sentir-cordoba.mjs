// Ocho Capitales · Córdoba: recorridos 2026 del blog Sentir Córdoba (guía de la Semana Santa de Córdoba 2026, una entrada por
// día) para las hermandades que El Debate no publicó o publicó incompletas. Añade o sustituye su entrada en
// cordoba-prensa-2026.json, con «medio» y URL. Texto del recorrido literal, sin las horas entre paréntesis.
// Uso: node sentir-cordoba.mjs <carpeta con el HTML guardado de cada guía>
//   (los nombres de archivo y su URL están en GUIAS).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ITI = path.dirname(fileURLToPath(import.meta.url));
const dir = process.argv[2];
const B = 'https://sentircordoba.blogspot.com/2026/';
// archivo → [URL, { id: texto con el que empieza su bloque en la guía }]
const GUIAS = {
  's1.html': [B + '03/guia-de-la-semana-santa-de-cordoba-2026_28.html', { 'la-o': 'Hermandad de la O', lagrimas: 'Hermandad de las Lágrimas' }],
  's4.html': [B + '04/guia-de-la-semana-santa-de-cordoba-2026_3.html', { 'dolores-de-alcolea': 'Hermandad de los Dolores de Alcolea', 'la-conversion': 'Hermandad de la Conversión' }],
  's5.html': [B + '04/guia-de-la-semana-santa-2026-domingo-de.html', { 'el-resucitado': 'Hermandad del Resucitado' }],
};
// La Conversión: se queda la lista de El Debate (coincide con la rejilla oficial en el orden de las primeras calles; Sentir
// las invierte) y solo se le añaden, entre dos calles seguidas, las que da Sentir: [tras, antes, [calles de Sentir]].
const INSERTAR = {
  'la-conversion': [['carretera de Palma del Río', 'Manuel Fuentes Bocanegra', ['Quesada y Chacón', 'Viejo Almodovar']], ['José María Martorell', 'carretera de Palma del Río', ['Quesada Chacón']]],
};
const dec = (s) => s.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ' ').replace(/<br\s*\/?>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n)).replace(/&amp;/g, '&').replace(/\s+/g, ' ');
const f = path.join(ITI, 'cordoba-prensa-2026.json');
const P = JSON.parse(fs.readFileSync(f, 'utf8'));
for (const [arch, [url, ids]] of Object.entries(GUIAS)) {
  const t = dec(fs.readFileSync(path.join(dir, arch), 'utf8'));
  for (const [id, cab] of Object.entries(ids)) {
    const i = t.indexOf(cab + ' Nombre Completo'); if (i < 0) throw new Error(`${arch}: no está «${cab}»`);
    const bloque = t.slice(i, t.indexOf(' Nombre Completo', i + cab.length + 20) > 0 ? t.indexOf(' Nombre Completo', i + cab.length + 20) : undefined);
    const m = bloque.match(/Recorrido\s*:\s*(.*?)(?:\s*Lugares recomendados|\s*Datos de inter[eé]s|$)/);
    if (!m) throw new Error(`${id}: sin recorrido`);
    // las horas («(12:30 horas)», «(Tramo azul, 18:50 horas)») hacen a veces de separador: se cambian por una coma
    const recorrido = m[1].replace(/\s*\([^)]*(\d{1,2}[:.]\d{2}|tramo azul)[^)]*\)\s*,?/gi, ', ').replace(/,?\s*(y\s+)?Entrada\s*,?\s*\.?\s*$/i, ' y Entrada')
      .replace('Avenida Conde de Vallellano Doctor Marañón', 'Avenida Conde de Vallellano, Doctor Marañón') // coma que falta en la guía
      .replace(/\s+,/g, ',').replace(/\s+/g, ' ').trim();
    if (INSERTAR[id]) { // se queda la lista de El Debate y se le añaden los tramos que da Sentir
      const h = P.hermandades[id + '-cordoba'], orig = h.recorrido_original || h.recorrido; let r = orig;
      for (const [tras, antes, calles] of INSERTAR[id]) { const a = tras + ', ' + antes; if (!r.includes(a)) throw new Error(`${id}: no está «${a}»`); r = r.replace(a, [tras, ...calles, antes].join(', ')); }
      P.hermandades[id + '-cordoba'] = { ...h, recorrido: r, recorrido_original: orig, completado_con: { medio: 'Sentir Córdoba', url, insertadas: INSERTAR[id] } };
      console.log(id, '← El Debate + tramos de Sentir'); continue;
    }
    P.hermandades[id + '-cordoba'] = { medio: 'Sentir Córdoba', url, horario: null, recorrido };
    console.log(id, '←', recorrido.slice(0, 160), '…');
  }
}
fs.writeFileSync(f, JSON.stringify(P, null, 1));
