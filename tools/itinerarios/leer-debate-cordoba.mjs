// Ocho Capitales · Córdoba: extrae de las guías de El Debate 2026 (HTML guardado en una carpeta) título, horario y recorrido de cada hermandad.
// Uso: node leer-debate-cordoba.mjs <carpeta con los .html>  →  <carpeta>/debate.json (luego prensa-cordoba.mjs)
import fs from 'node:fs';
import path from 'node:path';
const dir = process.argv[2];
const dec = (s) => s.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n)).replace(/&([a-z]+);/gi, (m, e) => ({ aacute: 'á', eacute: 'é', iacute: 'í', oacute: 'ó', uacute: 'ú', ntilde: 'ñ', Aacute: 'Á', Eacute: 'É', Iacute: 'Í', Oacute: 'Ó', Uacute: 'Ú', Ntilde: 'Ñ', uuml: 'ü', laquo: '«', raquo: '»', ordf: 'ª', ordm: 'º', iexcl: '¡', iquest: '¿' }[e] ?? m)).replace(/\s+/g, ' ').trim();
const out = {};
for (const f of fs.readdirSync(dir).filter((f) => f.endsWith('.html'))) {
  const h = fs.readFileSync(path.join(dir, f), 'utf8');
  const ps = [...h.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)].map((m) => dec(m[1])).filter(Boolean);
  const bloques = []; let cur = null;
  for (const p of ps) {
    if (/^(Pasos?)\s*:/i.test(p)) { cur = { titulo: bloques.length ? ps[ps.indexOf(p) - 1] : ps[ps.indexOf(p) - 1], pasos: p }; bloques.push(cur); continue; }
    if (!cur) continue;
    if (/^Horarios?\s*:/i.test(p)) cur.horario = p.replace(/^Horarios?\s*:\s*/i, '');
    else if (/^Recorrido\s*:/i.test(p)) cur.recorrido = p.replace(/^Recorrido\s*:\s*/i, '');
  }
  out[f.replace(/_\d+\.html$/, '')] = bloques;
}
fs.writeFileSync(path.join(dir, 'debate.json'), JSON.stringify(out, null, 1));
for (const [k, v] of Object.entries(out)) { console.log('##', k, v.length); for (const b of v) console.log(' -', (b.titulo || '').slice(0, 90), '|', (b.horario || 'SIN HORARIO').slice(0, 140), '|', b.recorrido ? b.recorrido.split(',').length + ' calles' : 'SIN RECORRIDO'); }
