// Ocho Capitales · auditoría (fase 3): coteja las 306 hermandades con el texto de SU fuente (fuente_url).
// Texto: tools/sources/fichas/<slug>.txt si existe; si no, se descarga la fuente_url a auditoria/fichas/<slug>.txt.
// Por hermandad comprueba que la fuente contiene: año de fundación, palabras de la sede, cada titular y el apellido
// de su autor, y el nombre oficial. Lo que no aparezca se marca para revisarlo a ojo (puede venir de otra fuente).
// Uso: node tools/auditoria/fichas-100.mjs   → auditoria/fichas-100.json
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const P = JSON.parse(fs.readFileSync(path.join(RAIZ, 'portal-cofrade/data/portal.json'), 'utf8'));
const CACHE = path.join(RAIZ, 'auditoria', 'fichas'); fs.mkdirSync(CACHE, { recursive: true });
const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
const STOP = new Set(['nuestra', 'nuestro', 'senora', 'senor', 'padre', 'santisimo', 'santisima', 'maria', 'jesus', 'cristo', 'parroquia', 'iglesia', 'capilla', 'real', 'ilustre', 'hermandad', 'cofradia', 'santa', 'santo', 'san', 'nazarenos', 'virgen', 'juan', 'evangelista', 'pontificia', 'antigua', 'venerable', 'archicofradia']);
const clave = (s) => norm(s).split(' ').filter((w) => w.length >= 4 && !STOP.has(w));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const html2txt = (h) => h.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&#(\d+);/g, (m, n) => String.fromCodePoint(+n)).replace(/&[a-z]+;/g, ' ');

async function texto(h) {
  const loc = path.join(RAIZ, 'tools/sources/fichas', h.slug + '.txt');
  if (fs.existsSync(loc) && fs.statSync(loc).size > 3000) return { t: fs.readFileSync(loc, 'utf8'), de: 'local' };
  const c = path.join(CACHE, h.slug + '.txt');
  if (fs.existsSync(c)) return { t: fs.readFileSync(c, 'utf8'), de: 'caché' };
  if (!/^https?:/.test(h.fuente_url || '')) return { t: '', de: 'sin fuente_url' };
  try {
    const r = await fetch(h.fuente_url, { headers: { 'User-Agent': 'Mozilla/5.0 OchoCapitales-auditoria' } });
    const t = html2txt(await r.text()); fs.writeFileSync(c, t); await sleep(800);
    return { t, de: 'descargada ' + r.status };
  } catch (e) { return { t: '', de: 'error ' + e.message }; }
}
// Además de fuente_url, cada campo rellenado en complementos.json trae su propia fuente: se leen todas.
const COMP = JSON.parse(fs.readFileSync(path.join(RAIZ, 'tools/sources/complementos.json'), 'utf8')).hermandades || {};
const urls = (o, acc = new Set()) => { if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) { if (k === 'fuente' && /^https?:/.test(v)) acc.add(v); else urls(v, acc); } return acc; };
async function textoUrl(slug, u, i) {
  const c = path.join(CACHE, `${slug}__${i}.txt`);
  if (fs.existsSync(c)) return fs.readFileSync(c, 'utf8');
  try { const r = await fetch(u, { headers: { 'User-Agent': 'Mozilla/5.0 OchoCapitales-auditoria' } }); const t = html2txt(await r.text()); fs.writeFileSync(c, t); await sleep(600); return t; } catch (e) { return ''; }
}
const res = [];
for (const h of P.hermandades) {
  const prim = await texto(h); let t = prim.t; const de = prim.de;
  const extra = [...urls(COMP[h.slug])].filter((u) => u !== h.fuente_url);
  for (let i = 0; i < extra.length; i++) t += '\n' + await textoUrl(h.slug, extra[i], i);
  const T = ' ' + norm(t) + ' ';
  const fl = [];
  if (!t) fl.push('fuente ilegible o sin fuente_url');
  else {
    const y = String(h.fundacion || '').match(/\b(1[0-9]{3}|20[0-2][0-9])\b/g) || [];
    if (y.length && !y.some((x) => T.includes(' ' + x + ' '))) fl.push(`fundación «${h.fundacion}» no aparece en la fuente`);
    const ks = clave(h.sede); if (ks.length && ks.filter((w) => T.includes(' ' + w + ' ')).length < Math.ceil(ks.length / 2)) fl.push(`sede «${h.sede}» no aparece`);
    for (const ti of h.titulares || []) {
      const kt = clave(ti.nombre); if (kt.length && !kt.some((w) => T.includes(' ' + w + ' '))) fl.push(`titular «${ti.nombre}» no aparece`);
      const ap = norm(ti.autor).split(' ').filter((w) => w.length >= 4 && !['atribuido', 'anonimo', 'escuela', 'siglo', 'taller'].includes(w));
      if (ap.length && !ap.some((w) => T.includes(' ' + w + ' '))) fl.push(`autor «${ti.autor}» de «${ti.nombre}» no aparece`);
    }
    const ko = clave(h.nombre_oficial); if (ko.length >= 3 && ko.filter((w) => T.includes(' ' + w + ' ')).length / ko.length < 0.6) fl.push(`nombre oficial no casa con la fuente`);
  }
  res.push({ slug: h.slug, ciudad: h.ciudad, fuente: h.fuente_url, texto: de, avisos: fl });
}
fs.writeFileSync(path.join(RAIZ, 'auditoria', 'fichas-100.json'), JSON.stringify(res, null, 1));
const por = {}; for (const r of res) { por[r.ciudad] ||= [0, 0]; por[r.ciudad][0]++; if (r.avisos.length) por[r.ciudad][1]++; }
const tipos = {}; for (const r of res) for (const a of new Set(r.avisos.map((x) => x.replace(/«[^»]*»/g, '«…»')))) tipos[a] = (tipos[a] || 0) + 1;
console.log('hermandades', res.length, 'con avisos', res.filter((r) => r.avisos.length).length, JSON.stringify(por)); console.log(tipos);
