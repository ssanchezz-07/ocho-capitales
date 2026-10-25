// Ocho Capitales · Málaga: lista TODAS las dedicatorias de marchas que tocan Málaga y las cruza con portal.json y con la base
// de datos de Patrimonio Musical (auditoria/patrimonio-marchas.json, uso interno; ver leer-patrimonio.mjs).
//   A) marchas ligadas a una hermandad de Málaga (portal.json → h.marchas): ¿hay ficha con el mismo título y apellido de compositor?
//      ¿su dedicatoria nombra a esa hermandad / a una advocación suya, o a otra (otra hermandad, otra ciudad, una persona)?
//   B) marchas del catálogo de España (tools/sources/marchas-espana.json) cuya dedicatoria nombra Málaga: ¿la advocación existe en
//      alguna hermandad de Málaga del portal?
// Aplica tools/sources/marchas-correcciones.json (lo ya retirado o confirmado a mano) y marca lo que queda por decidir.
// Uso: node tools/auditoria/marchas-malaga.mjs   → auditoria/marchas-malaga.json + resumen en consola
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const leer = (f) => JSON.parse(fs.readFileSync(path.join(RAIZ, f), 'utf8'));
const P = leer('portal-cofrade/data/portal.json');
const DB = leer('auditoria/patrimonio-marchas.json');
const ESP = leer('tools/sources/marchas-espana.json').marchas;
const VERIF = leer('tools/sources/marchas-verificacion.json').hermandades;
const fCor = path.join(RAIZ, 'tools/sources/marchas-correcciones.json');
const COR = fs.existsSync(fCor) ? JSON.parse(fs.readFileSync(fCor, 'utf8')) : { retirar: {}, confirmar: {} };

const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
const nt = (t) => norm(t).replace(/\b(a|al|la|el|los|las|de|del|y|en|ntra|nuestra|senora|sra|nuestro|padre|n|p|stma|santisima|santisimo|maria|virgen)\b/g, ' ').replace(/\s+/g, ' ').trim();
const PILA = new Set('jose juan manuel francisco antonio miguel jesus javier luis pedro rafael carlos angel alberto david daniel pablo sergio maria ramon joaquin alejandro fernando jorge vicente andres enrique alfonso emilio eduardo salvador cristobal diego mario victor ignacio gabriel abel ivan oscar raul ruben sebastian perfecto agustin ana isaac primitivo benjamin gines gonzalo'.split(' '));
const apellidos = (a) => new Set(norm(a).split(' ').filter((w) => w.length >= 3 && !PILA.has(w) && !['del', 'los', 'las', 'san'].includes(w)));
const mismoAutor = (a, b) => { const x = apellidos(a); return [...apellidos(b)].some((w) => x.has(w)); };
const STOP = new Set(['hermandad', 'cofradia', 'cofradias', 'hdad', 'nuestra', 'nuestro', 'senora', 'senor', 'padre', 'santisimo', 'santisima', 'maria', 'jesus', 'cristo', 'virgen', 'real', 'archicofradia', 'nazarenos', 'malaga', 'sacramental', 'procesion', 'culto', 'fervorosa', 'pontificia', 'ilustre', 'venerable', 'antigua', 'reales', 'nuestras']);
const CIUDADES = ['sevilla', 'granada', 'cordoba', 'cadiz', 'huelva', 'almeria', 'jaen', 'antequera', 'alhaurin', 'velez', 'ronda', 'marbella', 'salamanca', 'zamora', 'valencia', 'jerez', 'utrera', 'ayamonte', 'baena', 'bailen', 'lucena', 'linares', 'cabra', 'osuna', 'ecija', 'carmona', 'motril'];
const MAL = P.hermandades.filter((h) => h.ciudad === 'malaga');
const claves = (h) => new Set([...norm(h.nombre).split(' '), ...norm(h.nombre_oficial).split(' '), ...(h.titulares || []).flatMap((t) => norm(t.nombre).split(' '))].filter((w) => (w.length >= 4 || w === 'o') && !STOP.has(w)));
const idx = new Map(); for (const [id, f] of Object.entries(DB)) if (f && f.t) { const k = nt(f.t); (idx.get(k) || idx.set(k, []).get(k)).push({ id, ...f }); }
const otraCiudad = (d) => CIUDADES.find((c) => new RegExp('\\b' + c + '\\b').test(d) && !/\bmalaga\b/.test(d.replace(new RegExp('\\b' + c + '\\b.*'), ''))) || null;
// hermandad de Málaga a la que apunta una dedicatoria (por sus palabras propias)
const aQuien = (d) => MAL.map((h) => [h, [...claves(h)].filter((w) => new RegExp('\\b' + w + '\\b').test(d)).length]).filter(([, n]) => n).sort((a, b) => b[1] - a[1]).map(([h, n]) => h.slug + '×' + n);

const A = [];
for (const h of MAL) for (const m of h.marchas || []) {
  const ret = COR.retirar?.[h.slug]?.[m.titulo], c0 = COR.confirmar?.[h.slug]?.[m.titulo], conf = c0 && (!c0.autor || mismoAutor(c0.autor, m.autor)) ? c0 : null;
  const foro = /patrimoniomusical\.com\/foro/.test(h.marchas_fuente || '');
  const ver = VERIF[h.slug]?.[m.titulo];
  const fichas = (idx.get(nt(m.titulo)) || []).filter((f) => mismoAutor(m.autor, f.a));
  const K = claves(h);
  const juicio = fichas.map((f) => { const d = norm(f.d + ' ' + f.u); const propia = [...K].some((w) => new RegExp('\\b' + w + '\\b').test(d)); const oc = otraCiudad(d); return { id: f.id, d: f.d, y: f.y, propia, otra_ciudad: oc, apunta_a: aQuien(d).slice(0, 2) }; });
  const esp = ESP.filter((e) => nt(e.titulo) === nt(m.titulo) && mismoAutor(m.autor, e.autor) && e.dedicatoria).map((e) => ({ dedicatoria: e.dedicatoria, otra_ciudad: otraCiudad(norm(e.dedicatoria)), propia: [...K].some((w) => new RegExp('\\b' + w + '\\b').test(norm(e.dedicatoria))) }));
  let estado;
  if (ret) estado = 'retirada';
  else if (ver || conf) estado = 'confirmada';
  else if (juicio.some((j) => j.propia && !j.otra_ciudad)) estado = 'confirmable (la ficha la dedica a la hermandad)';
  else if (juicio.length && juicio.every((j) => j.otra_ciudad || (!j.propia && j.apunta_a.length) || !j.propia)) estado = 'CONTRADICHA (la ficha la dedica a otra advocación, persona o ciudad)';
  else estado = foro ? 'sin verificar (solo el foro de 2008)' : 'sin segunda fuente';
  if (!ret && esp.some((e) => e.otra_ciudad && !e.propia)) estado = 'CONTRADICHA (el catálogo la dedica a otra ciudad)';
  A.push({ hermandad: h.slug, titulo: m.titulo, autor: m.autor, origen: foro ? 'foro 2008' : (h.marchas_fuente || 'ficha'), estado, motivo_retirada: ret || null, patrimonio: juicio, catalogo: esp });
}
for (const [slug, ms] of Object.entries(COR.anadir || {})) for (const a of ms) A.push({ hermandad: slug, titulo: a.titulo, autor: a.autor, origen: a.url, estado: 'añadida (dedicatoria expresa)', patrimonio: [], catalogo: [] });
const B = [];
for (const e of ESP) {
  if (!e.dedicatoria || !/malaga/.test(norm(e.dedicatoria + ' ' + e.lugar))) continue;
  const d = norm(e.dedicatoria); const oc = otraCiudad(d);
  const quien = aQuien(d);
  B.push({ titulo: e.titulo, autor: e.autor, dedicatoria: e.dedicatoria, estado: oc ? 'otra localidad de la provincia/ciudad: ' + oc : quien.length ? 'advocación de una hermandad del portal' : 'advocación SIN hermandad en el portal (se muestra como texto, sin enlace)', apunta_a: quien.slice(0, 3) });
}
fs.writeFileSync(path.join(RAIZ, 'auditoria/marchas-malaga.json'), JSON.stringify({ generado: new Date().toISOString(), ligadas: A, catalogo: B }, null, 1));
const cuenta = (l, k) => l.reduce((o, x) => ((o[x[k]] = (o[x[k]] || 0) + 1), o), {});
console.log('A) ligadas a hermandades de Málaga:', A.length, cuenta(A, 'estado'));
for (const x of A.filter((x) => /CONTRADICHA|confirmable/.test(x.estado))) console.log('  ·', x.hermandad.replace('-malaga', ''), '|', x.titulo, '|', x.autor, '|', x.estado, '|', [...x.patrimonio.map((j) => 'bd-marcha-' + j.id + ': ' + j.d), ...x.catalogo.map((c) => 'catálogo: ' + c.dedicatoria)].join(' / ').slice(0, 200));
console.log('B) catálogo de España con dedicatoria en Málaga:', B.length, cuenta(B, 'estado'));
for (const x of B.filter((x) => /SIN/.test(x.estado))) console.log('  ·', x.titulo, '|', x.autor, '|', x.dedicatoria);
