// Ocho Capitales: base de datos única y verificada (SQLite) con TODO lo que muestra la web y la fuente de cada dato.
// Se genera a partir de las fuentes del proyecto (portal.json, complementos, imágenes, itinerarios, noticias, agenda);
// nunca se edita a mano: si un dato cambia, se cambia en su fuente y se vuelve a generar.
// Salida: datos/ocho-capitales.sqlite (consultas, auditoría) y site/data/base.json (resumen ligero que usa la web y erCuñao).
// Uso: node tools/db/construir.mjs      (lo ejecuta GitHub Actions en cada actualización)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const RAIZ = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const leer = (p, d = null) => { const f = path.join(RAIZ, p); return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : d; };
const D = leer('portal-cofrade/data/portal.json');
const COMP = leer('tools/sources/complementos.json', {});
const IMG = leer('site/data/imagenes.json', { hermandades: {}, capitales: {}, titulares: {} });
const ITI = leer('tools/sources/itinerarios-2026.json', { hermandades: {} });
const NEWS = leer('site/data/news.json', { items: [] });
const EVT = leer('portal-cofrade/data/eventos.json', { eventos: [] });
const AGX = leer('tools/sources/agenda-externa.json', { eventos: [] });
const HAB = leer('tools/sources/habitos.json', {});

const DB = path.join(RAIZ, 'datos', 'ocho-capitales.sqlite');
fs.mkdirSync(path.dirname(DB), { recursive: true });
if (fs.existsSync(DB)) fs.rmSync(DB);
const db = new DatabaseSync(DB);
db.exec(`
PRAGMA journal_mode = OFF;
CREATE TABLE meta (clave TEXT PRIMARY KEY, valor TEXT);
CREATE TABLE capitales (slug TEXT PRIMARY KEY, nombre TEXT, color TEXT, lema TEXT, intro TEXT, imagen TEXT);
CREATE TABLE hermandades (slug TEXT PRIMARY KEY, nombre TEXT, nombre_oficial TEXT, ciudad TEXT REFERENCES capitales(slug), dia TEXT, orden INTEGER,
  sede TEXT, fundacion TEXT, historia TEXT, paso TEXT, musica TEXT, web TEXT, hora_salida TEXT, habito TEXT, fuente_url TEXT);
CREATE TABLE titulares (hermandad TEXT REFERENCES hermandades(slug), n INTEGER, nombre TEXT, autor TEXT, imaginero TEXT, atribucion INTEGER);
CREATE TABLE imagenes (hermandad TEXT, uso TEXT, archivo TEXT, autor TEXT, licencia TEXT, pagina TEXT);
CREATE TABLE bandas (slug TEXT PRIMARY KEY, nombre TEXT, tipo TEXT, localidad TEXT, origen TEXT);
CREATE TABLE acompanamientos (banda TEXT REFERENCES bandas(slug), hermandad TEXT REFERENCES hermandades(slug), rol TEXT, anio INTEGER);
CREATE TABLE imagineros (slug TEXT PRIMARY KEY, nombre TEXT, vida TEXT, escuela TEXT, bio TEXT, fuente_url TEXT);
CREATE TABLE obras (imaginero TEXT REFERENCES imagineros(slug), hermandad TEXT, titular TEXT, detalle TEXT, atribucion INTEGER);
-- Marchas dedicadas a una hermandad del portal (modelo único, tools/sources/marchas.json): estado = contrastada | dedicada | sin-verificar;
-- fuentes = JSON {campo: [fuentes]} y urls = JSON {fuente: url}
CREATE TABLE marchas (hermandad TEXT, titulo TEXT, autor TEXT, anio TEXT, tipo TEXT, slug TEXT, titular TEXT, estado TEXT, fuentes TEXT, urls TEXT);
-- Catálogo general (no ligado a una hermandad): «Marchas de Procesión» (marchas más populares de España, con vídeo)
-- y partituras procesionales de la Biblioteca Nacional (bne: enlace a su registro). Son filas separadas: no se cruzan.
CREATE TABLE catalogo_marchas (titulo TEXT, autor TEXT, formacion TEXT, anio TEXT, dedicatoria TEXT, tipo TEXT, estreno TEXT,
  video TEXT, bne TEXT, fuente TEXT, fuente_url TEXT);
CREATE TABLE itinerarios (hermandad TEXT, anio INTEGER, tramo TEXT, n INTEGER, fila TEXT, lugar TEXT, hora TEXT, fuente TEXT);
CREATE TABLE noticias (url TEXT PRIMARY KEY, titulo TEXT, fuente TEXT, fecha TEXT, ciudades TEXT);
CREATE TABLE agenda (fecha TEXT, ciudad TEXT, tipo TEXT, titulo TEXT, verificado INTEGER, fuente TEXT);
-- Procedencia: de dónde sale cada dato rellenado o corregido (además de la fuente general de cada ficha)
CREATE TABLE procedencia (tabla TEXT, clave TEXT, campo TEXT, fuente TEXT, fecha TEXT);
`);
const ins = (t, cols) => db.prepare(`INSERT INTO ${t} (${cols.join(',')}) VALUES (${cols.map(() => '?').join(',')})`);
const v = (x) => (x === undefined || x === null ? null : typeof x === 'object' ? JSON.stringify(x) : x);
db.exec('BEGIN');
ins('meta', ['clave', 'valor']).run('generado', new Date().toISOString());
const iC = ins('capitales', ['slug', 'nombre', 'color', 'lema', 'intro', 'imagen']);
for (const c of D.capitales) iC.run(c.slug, c.nombre, c.color, c.lema, (c.intro || []).join('\n\n'), IMG.capitales[c.slug] ? IMG.capitales[c.slug].pagina : null);
const iH = ins('hermandades', ['slug', 'nombre', 'nombre_oficial', 'ciudad', 'dia', 'orden', 'sede', 'fundacion', 'historia', 'paso', 'musica', 'web', 'hora_salida', 'habito', 'fuente_url']);
const iT = ins('titulares', ['hermandad', 'n', 'nombre', 'autor', 'imaginero', 'atribucion']);
const iI = ins('imagenes', ['hermandad', 'uso', 'archivo', 'autor', 'licencia', 'pagina']);
const iM = ins('marchas', ['hermandad', 'titulo', 'autor', 'anio', 'tipo', 'slug', 'titular', 'estado', 'fuentes', 'urls']);
const MU = leer('tools/sources/marchas.json', { marchas: [] });
for (const m of MU.marchas) if (m.dedicatoria && m.dedicatoria.hermandad) iM.run(m.dedicatoria.hermandad, m.titulo, v(m.autor), v(m.anio), v(m.formacion), m.slug, v(m.dedicatoria.titular), m.dedicatoria.estado, v(m.fuentes), v(m.urls));
const iP = ins('procedencia', ['tabla', 'clave', 'campo', 'fuente', 'fecha']);
for (const h of D.hermandades) {
  iH.run(h.slug, h.nombre, v(h.nombre_oficial), h.ciudad, h.dia, h.orden, v(h.sede), v(h.fundacion), v(h.historia), v(h.paso), v(h.musica), v(h.web), v(h.hora), v(HAB[h.slug] && HAB[h.slug].texto), v(h.fuente_url));
  (h.titulares || []).forEach((t, i) => iT.run(h.slug, i, t.nombre, v(t.autor), v(t.imaginero), t.atrib ? 1 : 0));
  const x = IMG.hermandades[h.slug]; if (x) iI.run(h.slug, x.escudo ? 'escudo' : 'foto', x.pagina, x.autor, x.licencia, x.pagina);
  for (const [uso, t] of Object.entries((IMG.titulares || {})[h.slug] || {})) iI.run(h.slug, uso, t.pagina, t.autor, t.licencia, t.pagina);
  const c = (COMP.hermandades || {})[h.slug] || {};
  for (const [campo, r] of Object.entries(c.relleno || {})) iP.run('hermandades', h.slug, campo, r.fuente, r.revisado || null);
  if (c.web_oficial) iP.run('hermandades', h.slug, 'web', c.web_oficial.fuente || c.web_oficial.url, c.web_oficial.comprobada || null);
}
const iB = ins('bandas', ['slug', 'nombre', 'tipo', 'localidad', 'origen']), iA = ins('acompanamientos', ['banda', 'hermandad', 'rol', 'anio']);
for (const b of D.bandas) { iB.run(b.slug, b.nombre, v(b.tipo), v(b.localidad), v(b.origen)); for (const a of b.acompana || []) iA.run(b.slug, a.hermandad_slug, v(a.rol), v(a.anio)); }
const iG = ins('imagineros', ['slug', 'nombre', 'vida', 'escuela', 'bio', 'fuente_url']), iO = ins('obras', ['imaginero', 'hermandad', 'titular', 'detalle', 'atribucion']);
for (const i of D.imagineros) { iG.run(i.slug, i.nombre, v(i.vida), v(i.escuela), v(i.bio), v(i.fuente_url)); for (const o of i.obras || []) iO.run(i.slug, v(o.hermandad_slug), v(o.titular), v(o.detalle), o.atrib ? 1 : 0); }
const iR = ins('itinerarios', ['hermandad', 'anio', 'tramo', 'n', 'fila', 'lugar', 'hora', 'fuente']);
for (const [slug, e] of Object.entries(ITI.hermandades)) for (const [tramo, pts] of Object.entries(e.tramos)) pts.forEach((p, n) => iR.run(slug, ITI.anio || 2026, tramo, n, v(p.fila), p.lugar, v(p.hora), e.fuente));
const iN = ins('noticias', ['url', 'titulo', 'fuente', 'fecha', 'ciudades']);
for (const n of NEWS.items || []) try { iN.run(n.url, n.titulo, n.fuente, new Date(n.ts).toISOString(), (n.ciudades || []).join(' ')); } catch (e) { /* url repetida */ }
const CAT = leer('tools/sources/marchas-espana.json', { marchas: [] }), BNE = leer('tools/sources/marchas-bne.json', { marchas: [] });
// Sin emparejar por título: la BNE no da el autor en el listado y hay muchas marchas homónimas («Esperanza»,
// «Marcha fúnebre»…). Unirlas por el nombre atribuiría años y partituras a obras distintas.
const iK = ins('catalogo_marchas', ['titulo', 'autor', 'formacion', 'anio', 'dedicatoria', 'tipo', 'estreno', 'video', 'bne', 'fuente', 'fuente_url']);
for (const m of MU.marchas) if (!(m.dedicatoria && m.dedicatoria.hermandad)) iK.run(m.titulo, v(m.autor), v(m.formacion), v(m.anio), v(m.dedicatoria && m.dedicatoria.texto), v(m.tipo), v(m.estreno), m.video ? 'https://www.youtube.com/watch?v=' + m.video : null, null, CAT.fuente, CAT.url);
for (const b of BNE.marchas) iK.run(b.titulo, null, null, v(b.anio), null, b.tipo, null, null, b.url, BNE.fuente, BNE.url);
const iE = ins('agenda',['fecha', 'ciudad', 'tipo', 'titulo', 'verificado', 'fuente']);
for (const e of EVT.eventos || []) iE.run(v(e.fecha), v(e.ciudad), v(e.tipo), v(e.titulo), 1, v(e.fuente));
for (const e of AGX.eventos || []) iE.run(v(e.fecha), v(e.ciudad), v(e.tipo), v(e.titulo), 0, v(e.fuente || e.url));
db.exec('COMMIT');

// ---------- auditoría: lo que falta o parece erróneo, para completarlo ----------
const q = (s) => db.prepare(s).all();
const vac = (c) => `(${c} IS NULL OR trim(${c}) = '')`;
const audit = {
  generado: new Date().toISOString(),
  totales: Object.fromEntries(['capitales', 'hermandades', 'titulares', 'bandas', 'imagineros', 'marchas', 'catalogo_marchas', 'itinerarios', 'noticias', 'agenda', 'imagenes'].map((t) => [t, q(`SELECT count(*) n FROM ${t}`)[0].n])),
  hermandades_sin: Object.fromEntries(['historia', 'fundacion', 'web', 'sede', 'paso', 'nombre_oficial', 'hora_salida'].map((c) => [c, q(`SELECT slug FROM hermandades WHERE ${vac(c)}`).map((r) => r.slug)])),
  sin_imagen: q(`SELECT slug FROM hermandades WHERE slug NOT IN (SELECT hermandad FROM imagenes WHERE uso <> 'escudo')`).map((r) => r.slug),
  sin_itinerario: q(`SELECT slug FROM hermandades WHERE slug NOT IN (SELECT DISTINCT hermandad FROM itinerarios)`).map((r) => r.slug),
  titulares_sin_autor: q(`SELECT hermandad, nombre FROM titulares WHERE ${vac('autor')}`),
  imagineros_sin_bio: q(`SELECT slug FROM imagineros WHERE ${vac('bio')}`).map((r) => r.slug),
  catalogo_marchas_sin: Object.fromEntries(['autor', 'anio', 'dedicatoria', 'video'].map((c) => [c, q(`SELECT count(*) n FROM catalogo_marchas WHERE ${vac(c)}`)[0].n])),
  bandas_sin_localidad:q(`SELECT slug FROM bandas WHERE ${vac('localidad')}`).map((r) => r.slug),
  // posibles errores: banda que acompaña en una ciudad distinta de su origen y sin localidad; hermandades con día fuera de la lista
  dias_raros: q(`SELECT slug, dia FROM hermandades WHERE dia NOT IN (${D.dias_orden.map((d) => `'${d.replace(/'/g, "''")}'`).join(',')})`),
  webs_duplicadas: q(`SELECT web, group_concat(slug, ' ') hs FROM hermandades WHERE ${'web'} <> '' GROUP BY web HAVING count(*) > 1`),
};
fs.writeFileSync(path.join(RAIZ, 'datos', 'auditoria.json'), JSON.stringify(audit, null, 1));
const res = Object.fromEntries(Object.entries(audit.hermandades_sin).map(([k, l]) => [k, l.length]));
console.log('Base de datos:', path.relative(RAIZ, DB), JSON.stringify(audit.totales));
console.log('Huecos en hermandades:', JSON.stringify(res), '· sin imagen:', audit.sin_imagen.length, '· sin itinerario:', audit.sin_itinerario.length, '· titulares sin autor:', audit.titulares_sin_autor.length, '· webs duplicadas:', audit.webs_duplicadas.length);
