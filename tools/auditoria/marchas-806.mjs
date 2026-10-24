// Ocho Capitales · auditoría (fase 2): cruza las 806 marchas ligadas a hermandades con una segunda fuente
// independiente, la base de datos de patrimoniomusical.com (auditoria/patrimonio-marchas.json, leída con
// tools/auditoria/leer-patrimonio.mjs; uso interno, no se publica). Por marcha:
//   verificado  = hay ficha con el mismo título y el mismo apellido de compositor, y su dedicatoria nombra la
//                 advocación/hermandad Y la ciudad (o no nombra otra ciudad);
//   otra ciudad = la ficha la dedica a una advocación de OTRA ciudad;
//   año distinto / compositor distinto = datos que no casan;  sin segunda fuente = no está en la base (aún).
// Uso: node tools/auditoria/marchas-806.mjs   → auditoria/marchas-806.json
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const P = JSON.parse(fs.readFileSync(path.join(RAIZ, 'portal-cofrade/data/portal.json'), 'utf8'));
const DB = JSON.parse(fs.readFileSync(path.join(RAIZ, 'auditoria/patrimonio-marchas.json'), 'utf8'));
const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
const nt = (t) => norm(t).replace(/\b(a|al|la|el|los|las|de|del|y|en|ntra|nuestra|senora|sra|nuestro|padre|n|p|stma|santisima|santisimo|maria)\b/g, ' ').replace(/\s+/g, ' ').trim();
const PILA = new Set('jose juan manuel francisco antonio miguel jesus javier luis pedro rafael carlos angel alberto david daniel pablo sergio maria ramon joaquin alejandro fernando jorge vicente andres enrique alfonso emilio eduardo salvador cristobal diego mario victor ignacio gabriel abel ivan oscar raul ruben sebastian perfecto agustin ana isaac primitivo benjamin gines gonzalo'.split(' '));
const apellidos = (a) => new Set(norm(a).split(' ').filter((w) => w.length >= 3 && !PILA.has(w) && !['del', 'los', 'las', 'san'].includes(w)));
const CIU = { sevilla: 'sevilla', malaga: 'malaga', granada: 'granada', cordoba: 'cordoba', cadiz: 'cadiz', huelva: 'huelva', almeria: 'almeria', jaen: 'jaen' };
const STOP = new Set(['hermandad', 'cofradia', 'hdad', 'nuestra', 'nuestro', 'senora', 'senor', 'padre', 'santisimo', 'santisima', 'maria', 'jesus', 'cristo', 'virgen', 'real', 'archicofradia', 'nazarenos']);
const idx = new Map(); for (const [id, f] of Object.entries(DB)) if (f && f.t) { const k = nt(f.t); (idx.get(k) || idx.set(k, []).get(k)).push({ id, ...f }); }
const res = [];
for (const h of P.hermandades) for (const m of h.marchas || []) {
  const cand = (idx.get(nt(m.titulo)) || []);
  const ap = apellidos(m.autor);
  const mismos = cand.filter((f) => [...apellidos(f.a)].some((w) => ap.has(w)));
  let estado = 'sin segunda fuente', detalle = '';
  if (mismos.length) {
    const claves = new Set([...norm(h.nombre).split(' '), ...norm(h.nombre_oficial).split(' '), ...(h.titulares || []).flatMap((t) => norm(t.nombre).split(' '))].filter((w) => w.length >= 4 && !STOP.has(w)));
    const buenas = mismos.filter((f) => { const d = norm(f.d + ' ' + f.u); const otra = Object.values(CIU).some((c) => c !== h.ciudad && d.includes(c)) && !d.includes(h.ciudad); return !otra && [...claves].some((w) => d.includes(w)); });
    const otraCiudad = mismos.filter((f) => { const d = norm(f.d + ' ' + f.u); return Object.values(CIU).some((c) => c !== h.ciudad && d.includes(c)) && !d.includes(h.ciudad); });
    if (buenas.length) {
      const f = buenas[0]; estado = 'verificado'; detalle = `bd-marcha-${f.id}: ${f.d}${f.y ? ' (' + f.y + ')' : ''}`;
      if (m.anio && f.y && /^\d{4}$/.test(f.y) && m.anio !== f.y) { estado = 'año distinto'; detalle += ` · portal ${m.anio}`; }
    } else if (otraCiudad.length) { const f = otraCiudad[0]; estado = 'otra ciudad'; detalle = `bd-marcha-${f.id}: ${f.d} · ${f.u}`; }
    else { const f = mismos[0]; estado = 'dedicatoria no casa'; detalle = `bd-marcha-${f.id}: ${f.d || '(sin dedicatoria)'} · ${f.u}`; }
  } else if (cand.length) { estado = 'compositor distinto'; detalle = cand.slice(0, 2).map((f) => `bd-marcha-${f.id}: ${f.a}`).join(' / '); }
  res.push({ slug: h.slug, ciudad: h.ciudad, titulo: m.titulo, autor: m.autor, anio: m.anio, origen: /foro/.test(h.marchas_fuente || '') ? 'foro' : /wikipedia/.test(h.marchas_fuente || '') ? 'wikipedia' : 'federacion', estado, detalle });
}
fs.writeFileSync(path.join(RAIZ, 'auditoria/marchas-806.json'), JSON.stringify(res, null, 1));
const t = {}; for (const r of res) { t[r.origen] ||= {}; t[r.origen][r.estado] = (t[r.origen][r.estado] || 0) + 1; }
console.log('fichas en la base', Object.values(DB).filter(Boolean).length, '· marchas', res.length); console.log(JSON.stringify(t, null, 1));
