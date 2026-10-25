// Parsea el PDF oficial de la Agrupación de Cofradías de Málaga 2026 (texto con pdftotext -layout) → itinerarios en texto literal.
// Salida: cache/malaga-itinerarios-texto.json  [{dia, cabecera, itinerario:[...]}]
import fs from 'node:fs';
const T = fs.readFileSync(new URL('./cache/horarios-acc-2026.txt', import.meta.url), 'latin1').split(String.fromCharCode(13)).join('').split(String.fromCharCode(12)).join('\n');
const L = T.split('\n');
const DIAS = ['Domingo de Ramos', 'Lunes Santo', 'Martes Santo', 'Miércoles Santo', 'Jueves Santo', 'Madrugada', 'Viernes Santo', 'Sábado Santo', 'Domingo de Resurrección'];
let dia = '', out = [];
for (let i = 0; i < L.length; i++) {
  const l = L[i];
  const d = DIAS.find((x) => new RegExp('^\\s*' + x.split(' ').join('\\s+'), 'i').test(l) && l.trim().length < 60);
  if (d) dia = d;
  const m = l.match(/^\s*Itinerario\s*\|?\s*(.*)$/);
  if (!m) continue;
  let a = i - 1; while (a > 0 && L[a].trim() === '') a--; while (a > 0 && L[a].trim() !== '') a--;
  const cab = L.slice(a + 1, i).join(' ').replace(/\s{2,}/g, '  ').trim();
  let b = i, txt = m[1];
  const esCabecera = (x) => { const t = x.trim(); if (!t) return false; if (/\d\d:\d\dh/.test(t)) return true; const l = t.replace(/[^A-Za-zÁÉÍÓÚÑáéíóúñ]/g, ''); return l.length > 12 && l.replace(/[^A-ZÁÉÍÓÚÑ]/g, '').length / l.length > 0.7; };
  const esDia = (x) => DIAS.some((d) => new RegExp('^\s*' + d.split(' ').join('\s+'), 'i').test(x) && x.trim().length < 60);
  while (b + 1 < L.length && !esCabecera(L[b + 1]) && !esDia(L[b + 1]) && !/^\s*Itinerario/.test(L[b + 1])) { b++; if (L[b].trim()) txt += ' ' + L[b].trim(); }
  txt = txt.replace(/\s+(Lunes|Martes|Mi.rcoles|Jueves|Viernes|S.bado)\s+Santo.*$/, '').replace(/\s+Domingo\s+de\s+(Ramos|Resurrecci.n).*$/, '').replace(/\s+TORRE SUR.*$/, '').replace(/\s+Estos horarios.*$/, '');
  txt = txt.replace(/-\s+(?=[a-záéíóúñ])/g, '').replace(/\s+/g, ' ').trim().replace(/[.,]\s*$/, '');
  const itinerario = txt.split(/\s*,\s*/).map((s) => s.replace(/^y\s+/i, '').trim()).filter(Boolean);
  out.push({ dia, cabecera: cab, itinerario });
}
fs.writeFileSync(new URL('./cache/malaga-itinerarios-texto.json', import.meta.url), JSON.stringify(out, null, 1));
for (const e of out) console.log(e.dia.slice(0, 6), '|', e.cabecera.replace(/\s+/g, ' ').slice(0, 60), '|', e.itinerario[0], '→', e.itinerario.at(-1), '|', e.itinerario.length);
console.log(out.length);
