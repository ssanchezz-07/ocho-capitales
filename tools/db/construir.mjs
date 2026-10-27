// Ocho Capitales: base de datos única (SQLite) con todo lo que muestra la web y la fuente de cada dato, segmentada por tipo.
// Solo LEE los archivos de origen (portal.json, marchas.json, sedes, recorridos, imágenes, agenda…): los datos siguen viviendo
// en ellos. Nunca se edita a mano: si un dato cambia, se cambia en su archivo (ver datos/COMO-CORREGIR.md) y se vuelve a generar.
// Claves comunes en todas las tablas: `hermandad` (slug de la ficha) y `capital` (slug de la capital).
// Salida: datos/ocho-capitales.sqlite (no se sube; se genera) y datos/auditoria.json (huecos y posibles errores).
// Uso: node tools/db/construir.mjs      (también lo ejecuta GitHub Actions en cada publicación). Mapa de los datos: datos/LEEME.md
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const RAIZ = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const leer = (p, d = null) => { const f = path.join(RAIZ, p); return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : d; };
const porCapital = (dir) => { const d = path.join(RAIZ, dir); return fs.existsSync(d) ? fs.readdirSync(d).filter((f) => f.endsWith('.json')).map((f) => [f.replace(/\.json$/, ''), JSON.parse(fs.readFileSync(path.join(d, f), 'utf8'))]) : []; };
const D = leer('portal-cofrade/data/portal.json');
const COMP = leer('tools/sources/complementos.json', {});
const IMG = leer('site/data/imagenes.json', { hermandades: {}, capitales: {}, titulares: {} });
const ITI = leer('tools/sources/itinerarios-2026.json', { hermandades: {} });
const EXT = leer('tools/sources/itinerarios-extraordinarios.json', { salidas: {} });
const NEWS = leer('site/data/news.json', { items: [] });
const EVT = leer('portal-cofrade/data/eventos.json', { eventos: [] });
const AGX = leer('tools/sources/agenda-externa.json', { eventos: [] });
const HAB = leer('tools/sources/habitos.json', {});
const MU = leer('tools/sources/marchas.json', { marchas: [], fuentes: {} });
const BNE = leer('tools/sources/marchas-bne.json', { marchas: [] });
const REV = leer('tools/sources/marchas-revision.json', { revisiones: [] });
const MCO = leer('tools/sources/marchas-correcciones.json', {});
const FRE = leer('tools/sources/fotos-retiradas.json', { retiradas: {} });
const BRE = leer('tools/sources/bandas-redirecciones.json', { redirecciones: {} });
const IRE = leer('tools/sources/imagineros-redirecciones.json', { redirecciones: {} });
const SEDES = porCapital('site/data/sedes'), RECS = porCapital('site/data/recorridos');
const HC = Object.fromEntries(D.hermandades.map((h) => [h.slug, h.ciudad])); // hermandad → capital

const DB = path.join(RAIZ, 'datos', 'ocho-capitales.sqlite');
fs.mkdirSync(path.dirname(DB), { recursive: true });
if (fs.existsSync(DB)) fs.rmSync(DB);
const db = new DatabaseSync(DB);
db.exec(`
PRAGMA journal_mode = OFF;
CREATE TABLE meta (clave TEXT PRIMARY KEY, valor TEXT);
CREATE TABLE capitales (slug TEXT PRIMARY KEY, nombre TEXT, color TEXT, lema TEXT, intro TEXT, imagen TEXT);
-- Fichas de hermandad (portal.json ← tools/build-data.js). sede = texto de la ficha; las coordenadas, en «sedes».
CREATE TABLE hermandades (slug TEXT PRIMARY KEY, capital TEXT REFERENCES capitales(slug), nombre TEXT, nombre_oficial TEXT, dia TEXT, orden INTEGER,
  sede TEXT, fundacion TEXT, historia TEXT, paso TEXT, musica TEXT, web TEXT, hora_salida TEXT, fuente_url TEXT);
CREATE TABLE sedes (hermandad TEXT REFERENCES hermandades(slug), capital TEXT, tipo TEXT, nombre TEXT, lat REAL, lon REAL, fuente TEXT, fuente_coordenadas TEXT);
CREATE TABLE titulares (hermandad TEXT REFERENCES hermandades(slug), capital TEXT, n INTEGER, nombre TEXT, autor TEXT, imaginero TEXT, atribucion INTEGER, autor_fuente TEXT);
CREATE TABLE imagenes (hermandad TEXT, capital TEXT, uso TEXT, archivo TEXT, autor TEXT, licencia TEXT, pagina TEXT);
CREATE TABLE habitos (hermandad TEXT REFERENCES hermandades(slug), capital TEXT, texto TEXT, fuente_url TEXT);
CREATE TABLE bandas (slug TEXT PRIMARY KEY, nombre TEXT, tipo TEXT, localidad TEXT, capital_origen TEXT);
CREATE TABLE acompanamientos (banda TEXT REFERENCES bandas(slug), hermandad TEXT REFERENCES hermandades(slug), capital TEXT, rol TEXT, anio INTEGER, fuente TEXT);
CREATE TABLE imagineros (slug TEXT PRIMARY KEY, nombre TEXT, vida TEXT, escuela TEXT, bio TEXT, fuente_url TEXT, fuentes TEXT);
CREATE TABLE obras (imaginero TEXT REFERENCES imagineros(slug), hermandad TEXT, capital TEXT, titular TEXT, detalle TEXT, atribucion INTEGER);
-- Todas las marchas (modelo único tools/sources/marchas.json). hermandad/capital: a quién está dedicada (vacío si no consta);
-- estado = contrastada | dedicada | sin-verificar; fuentes = JSON {campo: [fuentes]}; urls = JSON {fuente: url}
CREATE TABLE marchas (slug TEXT PRIMARY KEY, titulo TEXT, autor TEXT, anio TEXT, formacion TEXT, hermandad TEXT, capital TEXT, titular TEXT,
  estado TEXT, video TEXT, fuentes TEXT, urls TEXT);
CREATE TABLE partituras_bne (titulo TEXT, anio TEXT, tipo TEXT, url TEXT);
-- Itinerario oficial leído (tools/sources/itinerarios-2026.json) y recorrido geolocalizado del mapa (site/data/recorridos)
CREATE TABLE itinerarios (hermandad TEXT, capital TEXT, anio INTEGER, tramo TEXT, n INTEGER, fila TEXT, lugar TEXT, hora TEXT, fuente TEXT);
CREATE TABLE recorridos (hermandad TEXT, capital TEXT, anio INTEGER, tramo TEXT, n INTEGER, lugar TEXT, hora TEXT, lat REAL, lon REAL, fuente TEXT);
CREATE TABLE extraordinarias (clave TEXT PRIMARY KEY, hermandad TEXT, capital TEXT, fecha TEXT, tipo TEXT, titulo TEXT, fuente TEXT);
CREATE TABLE agenda (fecha TEXT, capital TEXT, tipo TEXT, titulo TEXT, verificado INTEGER, fuente TEXT);
CREATE TABLE noticias (url TEXT PRIMARY KEY, titulo TEXT, fuente TEXT, fecha TEXT, capitales TEXT);
-- Fuentes: cada enlace que respalda un dato (tabla + clave + campo → url)
CREATE TABLE fuentes (tabla TEXT, clave TEXT, hermandad TEXT, capital TEXT, campo TEXT, url TEXT, nombre TEXT);
-- Correcciones hechas a mano y dónde viven (para saber qué se tocó, por qué y con qué fuente)
CREATE TABLE correcciones (archivo TEXT, tipo TEXT, clave TEXT, hermandad TEXT, capital TEXT, detalle TEXT, fuente TEXT, fecha TEXT);
`);
const ins = (t, cols) => db.prepare(`INSERT INTO ${t} (${cols.join(',')}) VALUES (${cols.map(() => '?').join(',')})`);
const v = (x) => (x === undefined || x === null || x === '' ? null : typeof x === 'object' ? JSON.stringify(x) : x);
const num = (x) => (typeof x === 'number' && isFinite(x) ? x : null);
db.exec('BEGIN');
ins('meta', ['clave', 'valor']).run('generado', new Date().toISOString());
const iF = ins('fuentes', ['tabla', 'clave', 'hermandad', 'capital', 'campo', 'url', 'nombre']);
const fuente = (tabla, clave, h, campo, url, nombre) => { if (url) iF.run(tabla, clave, v(h), v(h && HC[h]), campo, url, v(nombre)); };
const iX = ins('correcciones', ['archivo', 'tipo', 'clave', 'hermandad', 'capital', 'detalle', 'fuente', 'fecha']);
const corr = (archivo, tipo, clave, h, detalle, f, fecha) => iX.run(archivo, tipo, v(clave), v(h), v(h && HC[h]), v(detalle), v(f), v(fecha));

const iC = ins('capitales', ['slug', 'nombre', 'color', 'lema', 'intro', 'imagen']);
for (const c of D.capitales) iC.run(c.slug, c.nombre, v(c.color), v(c.lema), v((c.intro || []).join('\n\n')), IMG.capitales[c.slug] ? IMG.capitales[c.slug].pagina : null);

const iH = ins('hermandades', ['slug', 'capital', 'nombre', 'nombre_oficial', 'dia', 'orden', 'sede', 'fundacion', 'historia', 'paso', 'musica', 'web', 'hora_salida', 'fuente_url']);
const iT = ins('titulares', ['hermandad', 'capital', 'n', 'nombre', 'autor', 'imaginero', 'atribucion', 'autor_fuente']);
const iI = ins('imagenes', ['hermandad', 'capital', 'uso', 'archivo', 'autor', 'licencia', 'pagina']);
const iHa = ins('habitos', ['hermandad', 'capital', 'texto', 'fuente_url']);
for (const h of D.hermandades) {
  iH.run(h.slug, h.ciudad, h.nombre, v(h.nombre_oficial), h.dia, h.orden, v(h.sede), v(h.fundacion), v(h.historia), v(h.paso), v(h.musica), v(h.web), v(h.hora), v(h.fuente_url));
  fuente('hermandades', h.slug, h.slug, 'ficha', h.fuente_url); fuente('hermandades', h.slug, h.slug, 'web', h.web_fuente); fuente('hermandades', h.slug, h.slug, 'hora_salida', h.hora_fuente);
  for (const [campo, f] of Object.entries(h.relleno_fuentes || {})) fuente('hermandades', h.slug, h.slug, campo, f);
  (h.titulares || []).forEach((t, i) => { iT.run(h.slug, h.ciudad, i, t.nombre, v(t.autor), v(t.imaginero), t.atrib ? 1 : 0, v(t.autor_fuente)); fuente('titulares', h.slug + '#' + i, h.slug, 'autor', t.autor_fuente); });
  const x = IMG.hermandades[h.slug]; if (x) { iI.run(h.slug, h.ciudad, x.escudo ? 'escudo' : 'foto', x.pagina, v(x.autor), v(x.licencia), x.pagina); fuente('imagenes', h.slug, h.slug, x.escudo ? 'escudo' : 'foto', x.pagina); }
  for (const [uso, t] of Object.entries((IMG.titulares || {})[h.slug] || {})) { iI.run(h.slug, h.ciudad, uso, t.pagina, v(t.autor), v(t.licencia), t.pagina); fuente('imagenes', h.slug + '#' + uso, h.slug, uso, t.pagina); }
  if (HAB[h.slug]) { iHa.run(h.slug, h.ciudad, v(HAB[h.slug].texto), v(HAB[h.slug].fuente_url)); fuente('habitos', h.slug, h.slug, 'habito', HAB[h.slug].fuente_url); }
}
const iS = ins('sedes', ['hermandad', 'capital', 'tipo', 'nombre', 'lat', 'lon', 'fuente', 'fuente_coordenadas']);
for (const [cap, J] of SEDES) for (const [slug, s] of Object.entries(J.hermandades || {})) for (const tipo of ['templo', 'casa_hermandad']) {
  const p = s[tipo]; if (!p) continue;
  iS.run(slug, cap, tipo, v(p.nombre || p.dir), num(p.lat), num(p.lon), v(p.fuente), v(p.fuente_coordenadas)); fuente('sedes', slug + '#' + tipo, slug, tipo, p.fuente);
}
const iB = ins('bandas', ['slug', 'nombre', 'tipo', 'localidad', 'capital_origen']), iA = ins('acompanamientos', ['banda', 'hermandad', 'capital', 'rol', 'anio', 'fuente']);
for (const b of D.bandas) { iB.run(b.slug, b.nombre, v(b.tipo), v(b.localidad), v(b.origen)); fuente('bandas', b.slug, null, 'localidad', b.localidad_fuente); for (const a of b.acompana || []) { iA.run(b.slug, a.hermandad_slug, a.ciudad, v(a.rol), num(a.anio), v(a.fuente)); fuente('acompanamientos', b.slug, a.hermandad_slug, 'acompañamiento', a.fuente); } }
const iG = ins('imagineros', ['slug', 'nombre', 'vida', 'escuela', 'bio', 'fuente_url', 'fuentes']), iO = ins('obras', ['imaginero', 'hermandad', 'capital', 'titular', 'detalle', 'atribucion']);
for (const i of D.imagineros) {
  iG.run(i.slug, i.nombre, v(i.vida), v(i.escuela), v(i.bio), v(i.fuente_url), v(i.fuentes));
  for (const f of i.fuentes || (i.fuente_url ? [i.fuente_url] : [])) fuente('imagineros', i.slug, null, 'biografia', f);
  for (const o of i.obras || []) iO.run(i.slug, v(o.hermandad_slug), v(o.ciudad), v(o.titular), v(o.detalle), o.atrib ? 1 : 0);
}
const iM = ins('marchas', ['slug', 'titulo', 'autor', 'anio', 'formacion', 'hermandad', 'capital', 'titular', 'estado', 'video', 'fuentes', 'urls']);
for (const m of MU.marchas) {
  const d = m.dedicatoria || {};
  iM.run(m.slug, m.titulo, v(m.autor), v(m.anio), v(m.formacion), v(d.hermandad), v(d.ciudad || m.ciudad), v(d.titular), v(d.estado), m.video ? 'https://www.youtube.com/watch?v=' + m.video : null, v(m.fuentes), v(m.urls));
  for (const [f, url] of Object.entries(m.urls || {})) fuente('marchas', m.slug, d.hermandad, f, url, (MU.fuentes[f] || {}).nombre);
}
const iPb = ins('partituras_bne', ['titulo', 'anio', 'tipo', 'url']);
for (const b of BNE.marchas || []) iPb.run(b.titulo, v(b.anio), v(b.tipo), v(b.url));
const iR = ins('itinerarios', ['hermandad', 'capital', 'anio', 'tramo', 'n', 'fila', 'lugar', 'hora', 'fuente']);
for (const [slug, e] of Object.entries(ITI.hermandades)) { fuente('itinerarios', slug, slug, 'itinerario', e.fuente); for (const [tramo, pts] of Object.entries(e.tramos)) pts.forEach((p, n) => iR.run(slug, v(HC[slug]), ITI.anio || 2026, tramo, n, v(p.fila), v(p.lugar), v(p.hora), v(e.fuente))); }
const iRe = ins('recorridos', ['hermandad', 'capital', 'anio', 'tramo', 'n', 'lugar', 'hora', 'lat', 'lon', 'fuente']);
for (const [cap, J] of RECS) for (const [slug, e] of Object.entries(J.hermandades || {})) for (const [tramo, pts] of Object.entries(e.tramos || {})) pts.forEach((p, n) => iRe.run(slug, cap, num(J.anio), tramo, n, v(p.lugar), v(p.hora || p.fila), num(p.lat), num(p.lon), v(e.fuente)));
const iE = ins('extraordinarias', ['clave', 'hermandad', 'capital', 'fecha', 'tipo', 'titulo', 'fuente']);
for (const [k, s] of Object.entries(EXT.salidas || {})) { iE.run(k, v(s.hermandad), v(s.ciudad), v(s.fecha), v(s.tipo), v(s.titulo), v(s.fuente_url || s.fuente)); fuente('extraordinarias', k, s.hermandad, 'salida', s.fuente_url || (/^https?:/.test(s.fuente || '') ? s.fuente : null)); }
const iAg = ins('agenda', ['fecha', 'capital', 'tipo', 'titulo', 'verificado', 'fuente']);
for (const e of EVT.eventos || []) iAg.run(v(e.fecha), v(e.ciudad), v(e.tipo), v(e.titulo), 1, v(e.fuente || e.fuentes));
for (const e of AGX.eventos || []) iAg.run(v(e.fecha), v(e.ciudad), v(e.tipo), v(e.titulo), 0, v(e.fuente || e.url));
const iN = ins('noticias', ['url', 'titulo', 'fuente', 'fecha', 'capitales']);
for (const n of NEWS.items || []) try { iN.run(n.url, n.titulo, n.fuente, new Date(n.ts).toISOString(), (n.ciudades || []).join(' ')); } catch (e) { /* url repetida */ }

// correcciones a mano, cada una en su archivo
for (const r of REV.revisiones || []) corr('tools/sources/marchas-revision.json', 'marcha:' + r.accion, r.slug, r.hermandad, r.nota || r.campos, r.fuente, r.fecha);
for (const [tipo, o] of Object.entries(MCO)) if (o && typeof o === 'object' && !Array.isArray(o)) for (const [h, l] of Object.entries(o)) for (const x of [].concat(l)) corr('tools/sources/marchas-correcciones.json', 'marcha:' + tipo, typeof x === 'string' ? x : x.titulo, h, typeof x === 'string' ? x : JSON.stringify(x), typeof x === 'object' ? x.fuente : null, null);
for (const [archivo, motivo] of Object.entries(FRE.retiradas || {})) corr('tools/sources/fotos-retiradas.json', 'foto:retirada', archivo, null, motivo, null, null);
for (const [a, b] of Object.entries(BRE.redirecciones || {})) corr('tools/sources/bandas-redirecciones.json', 'banda:unida', a, null, b ? 'unida con ' + b : 'no era una banda', null, null);
for (const [a, b] of Object.entries(IRE.redirecciones || {})) corr('tools/sources/imagineros-redirecciones.json', 'imaginero:quitado', a, null, b ? 'redirige a ' + b : 'no era una persona', null, null);
for (const [a, b] of Object.entries(MU.redirecciones || {})) corr('tools/sources/marchas.json', 'marcha:direccion', a, null, b ? 'redirige a ' + b : 'retirada', null, null);
db.exec('COMMIT');

// ---------- vistas útiles (consultas listas para usar) ----------
db.exec(`
CREATE VIEW v_hermandades_sin_foto AS SELECT slug, capital, nombre FROM hermandades WHERE slug NOT IN (SELECT hermandad FROM imagenes WHERE uso <> 'escudo');
CREATE VIEW v_hermandades_sin_sede AS SELECT slug, capital, nombre, sede FROM hermandades WHERE slug NOT IN (SELECT hermandad FROM sedes WHERE lat IS NOT NULL);
CREATE VIEW v_hermandades_sin_marchas AS SELECT slug, capital, nombre FROM hermandades WHERE slug NOT IN (SELECT hermandad FROM marchas WHERE hermandad IS NOT NULL);
CREATE VIEW v_hermandades_sin_fuente AS SELECT slug, capital, nombre FROM hermandades WHERE fuente_url IS NULL;
CREATE VIEW v_hermandades_sin_itinerario AS SELECT slug, capital, nombre FROM hermandades WHERE slug NOT IN (SELECT hermandad FROM itinerarios) AND slug NOT IN (SELECT hermandad FROM recorridos);
CREATE VIEW v_titulares_sin_autor AS SELECT hermandad, capital, nombre FROM titulares WHERE autor IS NULL;
CREATE VIEW v_bandas_sin_localidad AS SELECT slug, nombre FROM bandas WHERE localidad IS NULL;
CREATE VIEW v_imagineros_sin_bio AS SELECT slug, nombre FROM imagineros WHERE bio IS NULL;
CREATE VIEW v_marchas_sin_verificar AS SELECT slug, titulo, autor, hermandad, capital FROM marchas WHERE estado = 'sin-verificar';
CREATE VIEW v_marchas_sin_formacion AS SELECT slug, titulo, autor FROM marchas WHERE formacion IS NULL;
CREATE VIEW v_resumen_capital AS SELECT c.slug capital, c.nombre,
  (SELECT count(*) FROM hermandades h WHERE h.capital = c.slug) hermandades,
  (SELECT count(*) FROM marchas m WHERE m.capital = c.slug AND m.hermandad IS NOT NULL) marchas_dedicadas,
  (SELECT count(*) FROM v_hermandades_sin_foto x WHERE x.capital = c.slug) sin_foto,
  (SELECT count(*) FROM v_hermandades_sin_sede x WHERE x.capital = c.slug) sin_sede,
  (SELECT count(*) FROM v_titulares_sin_autor x WHERE x.capital = c.slug) titulares_sin_autor
  FROM capitales c;
`);

// ---------- auditoría: lo que falta o parece erróneo, para completarlo ----------
const q = (s) => db.prepare(s).all();
const vac = (c) => `(${c} IS NULL OR trim(${c}) = '')`;
const TABLAS = ['capitales', 'hermandades', 'sedes', 'titulares', 'imagenes', 'habitos', 'bandas', 'acompanamientos', 'imagineros', 'obras', 'marchas', 'partituras_bne', 'itinerarios', 'recorridos', 'extraordinarias', 'agenda', 'noticias', 'fuentes', 'correcciones'];
const audit = {
  generado: new Date().toISOString(),
  totales: Object.fromEntries(TABLAS.map((t) => [t, q(`SELECT count(*) n FROM ${t}`)[0].n])),
  hermandades_sin: Object.fromEntries(['historia', 'fundacion', 'web', 'sede', 'paso', 'nombre_oficial', 'hora_salida', 'fuente_url'].map((c) => [c, q(`SELECT slug FROM hermandades WHERE ${vac(c)}`).map((r) => r.slug)])),
  sin_imagen: q('SELECT slug FROM v_hermandades_sin_foto').map((r) => r.slug),
  sin_sede_con_punto: q('SELECT slug FROM v_hermandades_sin_sede').map((r) => r.slug),
  sin_itinerario: q('SELECT slug FROM v_hermandades_sin_itinerario').map((r) => r.slug),
  sin_marchas: q('SELECT slug FROM v_hermandades_sin_marchas').map((r) => r.slug),
  titulares_sin_autor: q('SELECT hermandad, nombre FROM v_titulares_sin_autor'),
  imagineros_sin_bio: q('SELECT slug FROM v_imagineros_sin_bio').map((r) => r.slug),
  marchas_sin: Object.fromEntries(['autor', 'anio', 'formacion', 'hermandad', 'video'].map((c) => [c, q(`SELECT count(*) n FROM marchas WHERE ${vac(c)}`)[0].n])),
  bandas_sin_localidad: q('SELECT slug FROM v_bandas_sin_localidad').map((r) => r.slug),
  dias_raros: q(`SELECT slug, dia FROM hermandades WHERE dia NOT IN (${D.dias_orden.map((d) => `'${d.replace(/'/g, "''")}'`).join(',')})`),
  webs_duplicadas: q(`SELECT web, group_concat(slug, ' ') hs FROM hermandades WHERE web IS NOT NULL GROUP BY web HAVING count(*) > 1`),
  resumen_capital: q('SELECT * FROM v_resumen_capital'),
};
fs.writeFileSync(path.join(RAIZ, 'datos', 'auditoria.json'), JSON.stringify(audit, null, 1));
const res = Object.fromEntries(Object.entries(audit.hermandades_sin).map(([k, l]) => [k, l.length]));
console.log('Base de datos:', path.relative(RAIZ, DB), JSON.stringify(audit.totales));
console.log('Huecos en hermandades:', JSON.stringify(res), '· sin imagen:', audit.sin_imagen.length, '· sin sede con punto:', audit.sin_sede_con_punto.length, '· sin itinerario:', audit.sin_itinerario.length, '· sin marchas:', audit.sin_marchas.length, '· titulares sin autor:', audit.titulares_sin_autor.length, '· bandas sin localidad:', audit.bandas_sin_localidad.length);
