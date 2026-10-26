// Ocho Capitales: segunda fuente de Cádiz 2026, el cuadernillo «Semana Santa de la Bahía de Cádiz 2026» de Radio Cádiz
// (Cadena SER), págs. 3-46. Por hermandad: página, templo de 2026, itinerario literal y horas (salida, Catedral, recogida).
// Las fichas van en el mismo orden que el programa de Canal Sur (listas-cadiz-2026.json); se comprueba con el templo.
// Uso: curl -s "<URL>" | uvx --from pdfplumber python -I leer-pdf-stdin.py > texto.txt
//      node cruzdeguia-cadiz.mjs texto.txt   → cadiz-2026-cruzdeguia.json
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
export const URL_CG = 'https://files.qualifio.com/library/prisa_noticias/emails/emisoras%20varios/cruz%20de%20gu%C3%ADa%20radio%20c%C3%A1diz%202026.pdf';
const txt = fs.readFileSync(process.argv[2], 'utf8');
const D = JSON.parse(fs.readFileSync(path.join(DIR, 'listas-cadiz-2026.json'), 'utf8'));
const pags = txt.split(/===== PAG (\d+)\n/);
const fichas = [];
for (let i = 1; i < pags.length; i += 2) {
  const n = +pags[i], p = pags[i + 1];
  if (n < 4 || n > 46) continue;
  const m = p.match(/Itinerario:\s*([\s\S]*?)Semana Santa C[aá]diz 2026/); if (!m) continue;
  let t = ''; for (const l of m[1].split('\n')) { const s = l.trim(); if (s) t = t.endsWith('-') ? t.slice(0, -1) + s : t ? t + ' ' + s : s; }
  const lin = p.split('\n'), templo = lin.find((l) => /^(PARROQUIA|IGLESIA|CAPILLA|ORATORIO|SANTA IGLESIA)/.test(l)) || '';
  const horas = [...p.matchAll(/(Salida|Catedral Entrada|Catedral Salida|Catedral|Nueva|Candelaria|Palillero|Recogida):\s*(\d{1,2}[:.]\d{2})/g)].map((x) => [x[1], x[2]]);
  fichas.push({ pagina: n, templo: templo.replace(/\.\s*(UN|DOS|TRES) PASOS?\.?$/, ''), itinerario_literal: t.replace(/\s+/g, ' '), horas });
}
const ids = Object.keys(D.hermandades);
if (fichas.length !== ids.length) throw new Error(`${fichas.length} fichas en el cuadernillo y ${ids.length} en la lista`);
const out = { fuente: 'Semana Santa de la Bahía de Cádiz 2026, Radio Cádiz (Cadena SER)', url: URL_CG, hermandades: Object.fromEntries(ids.map((id, k) => [id, fichas[k]])) };
fs.writeFileSync(path.join(DIR, 'cadiz-2026-cruzdeguia.json'), JSON.stringify(out, null, 1) + '\n');
console.log(ids.length, 'fichas →', 'cadiz-2026-cruzdeguia.json');
