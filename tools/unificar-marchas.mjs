// Ocho Capitales: modelo ÚNICO de marchas procesionales. Junta todas las bases en tools/sources/marchas.json, con la fuente
// (y su URL) de cada campo y el estado de cada dedicatoria. build.mjs solo lee ese fichero.
//
// Bases:
//   mdp  Marchas de Procesión: 4 tablas /p/base-datos-*.html (título, compositor, formación, vídeo) y la ficha de la
//        descripción de cada vídeo (año, dedicatoria, tipo, estreno, lugar) → tools/sources/marchas-espana.json
//   fgr  Fichas de la Federación de Hermandades de Granada, apartado «Patrimonio musical» (oficial) → portal.json
//   wiki Sección de marchas de Wikipedia de cada hermandad → portal.json (solo pista: no basta para «dedicada»)
//   foro Lista «Marchas procesionales de Málaga» del foro de Patrimonio Musical (2008) → portal.json (débil)
//   pm   Base de datos de patrimoniomusical.com (auditoria/patrimonio-marchas.json, uso interno: solo se guarda el enlace)
//   rev  Revisión a mano con fuente abierta (web de la hermandad o de la banda, prensa…) → tools/sources/marchas-revision.json
//
// Reglas (orden de Pablo, 2026-10-25):
//   · «dedicada a» solo si una fuente fiable (fgr, pm, mdp, rev) lo dice expresamente; dos sitios distintos = «contrastada».
//   · Solo foro o Wikipedia = «sin verificar». Si una fuente fiable la dedica a OTRA hermandad u otra ciudad, el enlace se retira.
//   · Datos que no coinciden: se enseña el de la fuente oficial (fgr, rev con web oficial); sin oficial, el campo queda vacío.
// Uso: node tools/unificar-marchas.mjs   (sin la base de Patrimonio Musical conserva lo que ya dio en la pasada anterior)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.join(DIR, '..');
const leer = (f, d) => (fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : d);
const P = leer(path.join(RAIZ, 'portal-cofrade/data/portal.json'));
const ESP = leer(path.join(DIR, 'sources/marchas-espana.json'), { marchas: [] });
const PM_FILE = path.join(RAIZ, 'auditoria/patrimonio-marchas.json');
const PM = leer(PM_FILE, null);
const REV = leer(path.join(DIR, 'sources/marchas-revision.json'), { revisiones: [] }).revisiones;
const OUT = path.join(DIR, 'sources/marchas.json');
const PREV = leer(OUT, { marchas: [] });
const MUNI = leer(path.join(DIR, 'sources/municipios-andalucia.json'), { municipios: {} }).municipios;

export const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
const slugify = (s) => norm(s).replace(/ /g, '-').replace(/-+/g, '-').slice(0, 80).replace(/-$/, '');
// Título comparable: sin artículos ni tratamientos («Nuestra Señora del Mayor Dolor» = «Ntra. Sra. del Mayor Dolor»)
const nt = (t) => norm(t).replace(/\b(a|al|la|el|los|las|de|del|y|en|ntra|nuestra|senora|sra|nuestro|padre|n|p|stma|santisima|santisimo|maria)\b/g, ' ').replace(/\s+/g, ' ').trim();
const PILA = new Set('jose juan manuel francisco antonio miguel jesus javier luis pedro rafael carlos angel alberto david daniel pablo sergio maria ramon joaquin alejandro fernando jorge vicente andres enrique alfonso emilio eduardo salvador cristobal diego mario victor ignacio gabriel abel ivan oscar raul ruben sebastian perfecto agustin ana isaac primitivo benjamin gines gonzalo'.split(' '));
const apellidos = (a) => new Set(norm(a).split(' ').filter((w) => w.length >= 3 && !PILA.has(w) && !['del', 'los', 'las', 'san'].includes(w)));
// Mismo compositor: un apellido poco corriente en común, o dos apellidos, o un apellido corriente y el mismo nombre de pila
// («Eloy García» = «Eloy García López», pero «Eloy García López» ≠ «Manuel López Farfán»)
const CORRIENTES = new Set('garcia lopez martinez sanchez fernandez perez gonzalez rodriguez gomez moreno jimenez ruiz hernandez diaz munoz alvarez romero alonso gutierrez navarro torres dominguez vazquez ramos gil ramirez serrano blanco molina morales suarez ortega delgado castro ortiz rubio marin sanz nunez iglesias medina garrido cortes castillo santos lozano guerrero cano prieto mendez cruz calvo gallego vidal leon marquez herrera pena flores cabrera campos vega fuentes carrasco diez reyes caballero nieto aguilar pascual santana herrero montero lorenzo hidalgo gimenez ibanez ferrer duran santiago benitez mora vicente vargas arias carmona crespo roman pastor soto saez velasco moya soler parra esteban bravo gallardo rojas'.split(' '));
const pila = (a) => norm(a).split(' ')[0] || '';
const mismoAutor = (a, b) => {
  const x = apellidos(a), y = apellidos(b); const comun = [...x].filter((w) => y.has(w));
  if (!comun.length) return false;
  if (comun.some((w) => !CORRIENTES.has(w)) || comun.length >= 2) return true;
  return pila(a) && pila(a) === pila(b);
};

const CAP = Object.fromEntries(P.capitales.map((c) => [c.slug, c.nombre]));
const CAPN = Object.fromEntries(P.capitales.map((c) => [norm(c.nombre), c.slug]));
const HERM = Object.fromEntries(P.hermandades.map((h) => [h.slug, h]));
const TABLA = { 'Banda de música': 'bandas-musica', 'Banda de cornetas y tambores': 'cornetas-tambores', 'Agrupación musical': 'agrupaciones-musicales', 'Capilla musical': 'capilla-musical' };
const urlTabla = (f) => `https://www.marchasdeprocesion.com/p/base-datos-${TABLA[f] || 'bandas-musica'}.html`;
const urlPm = (id) => `https://www.patrimoniomusical.com/bd-marcha-${id}`;
const urlYt = (v) => `https://www.youtube.com/watch?v=${v}`;
const FIABLE = new Set(['fgr', 'pm', 'mdp', 'rev']);
const OFICIAL = new Set(['fgr', 'rev']);

// ---------- lugares: ¿de qué ciudad habla una dedicatoria? ----------
// Municipios andaluces que también son advocaciones o palabras corrientes: no cuentan como lugar si no van tras «de»/entre paréntesis
const AMBIGUOS = new Set(['la victoria', 'victoria', 'gines', 'fuentes', 'dos torres', 'pilas', 'la puebla', 'santiago', 'rota', 'olivares', 'la luisiana', 'el bosque', 'los corrales', 'la paz', 'paterna', 'la guardia', 'cuevas', 'la rambla', 'villanueva', 'los barrios', 'la carolina', 'la zubia', 'gador', 'la herradura']);
const FUERA = ['madrid', 'toledo', 'murcia', 'cartagena', 'lorca', 'cieza', 'jumilla', 'caravaca', 'albacete', 'hellin', 'tobarra', 'cuenca', 'ciudad real', 'puertollano', 'valdepenas', 'badajoz', 'merida', 'caceres', 'plasencia', 'zafra', 'salamanca', 'zamora', 'valladolid', 'leon', 'burgos', 'palencia', 'segovia', 'avila', 'soria', 'logrono', 'bilbao', 'zaragoza', 'huesca', 'teruel', 'valencia', 'alicante', 'elche', 'orihuela', 'crevillente', 'castellon', 'barcelona', 'tarragona', 'ferrol', 'vigo', 'pontevedra', 'oviedo', 'gijon', 'santander', 'pamplona', 'ceuta', 'melilla', 'tenerife', 'las palmas', 'mallorca', 'guadalajara', 'getafe', 'mostoles', 'ponferrada', 'astorga', 'benavente', 'calahorra', 'lisboa', 'olivenza', 'jerez de los caballeros', 'don benito', 'almendralejo', 'villafranca de los barros', 'talavera', 'yecla', 'totana', 'mula', 'moratalla', 'alhama de murcia', 'aguilas', 'torrevieja'];
const LUGARES = [
  ...Object.keys(MUNI).map((m) => ({ n: norm(m), cap: null, prov: MUNI[m] })),
  ...FUERA.map((n) => ({ n, cap: null, prov: 'fuera' })),
].filter((l) => l.n.length >= 3).sort((a, b) => b.n.length - a.n.length);
// Lugares nombrados en un texto: capitales y otros municipios (los ambiguos solo tras «de» o entre paréntesis)
function lugares(texto) {
  const t = ' ' + norm(texto) + ' ';
  const caps = new Set(); const otros = new Set();
  for (const [n, s] of Object.entries(CAPN)) if (new RegExp(`\\b${n}\\b`).test(t)) caps.add(s);
  let resto = t;
  for (const l of LUGARES) {
    const re = new RegExp(`\\b${l.n}\\b`);
    if (!re.test(resto)) continue;
    if (AMBIGUOS.has(l.n) && !new RegExp(`\\b(de|en)\\s+${l.n}\\b`).test(resto) && !new RegExp(`\\(\\s*${l.n}`).test(norm(texto).replace(/[^a-z0-9 (]/g, ' '))) continue;
    otros.add(l.n); resto = resto.replace(new RegExp(`\\b${l.n}\\b`, 'g'), ' ');
  }
  return { caps, otros };
}

// ---------- hermandades: frases que las identifican ----------
const GENERICO = new Set('nuestro nuestra padre madre senor senora jesus maria santisima santisimo santo santa cristo virgen de del la las los el y e en su sus a al san juan evangelista ntro ntra stmo stma n s sr sra hermandad cofradia real ilustre pontificia archicofradia sacramental fervorosa venerable primitiva antigua muy hdad cofr nazarenos penitencia culto procesion dona don nino mariano'.split(' '));
const COMUN = new Set('mercedes merced rosario carmen pilar salud angeles remedios consolacion aurora cabeza rocio reyes inmaculada concepcion asuncion pastora auxiliadora esperanza dolores dolorosa soledad amparo paz victoria angustias piedad caridad misericordia estrella luz gracia candelaria encarnacion nazareno amor perdon sangre expiracion humildad cautivo penas buena muerte amargura lagrimas traspaso socorro patrocinio refugio'.split(' '));
const contenido = (s) => norm(s).split(' ').filter((w) => w.length >= 3 && !GENERICO.has(w));
// Frases de sus titulares (el nombre de la hermandad va aparte, en NOMBRES). Cada una sabe si es de Cristo o de la Virgen:
// «Virgen del Buen Fin» no es el «Cristo del Buen Fin» (es de la Lanzada, no del Buen Fin)
const genero = (s) => { const t = ' ' + norm(s) + ' '; const m = /\b(virgen|maria|senora|sra|ntra|reina|madre|dolorosa|nuestra)\b/.test(t), c = /\b(cristo|jesus|senor|nazareno|padre|nuestro|ntro|crucificado|cautivo)\b/.test(t); return m && !c ? 'm' : c && !m ? 'c' : ''; };
const FRASES = {};
for (const h of P.hermandades) {
  const fr = [];
  for (const t of h.titulares || []) { const g = genero(t.nombre); for (const s of [t.nombre, ...String(t.nombre).split(/\s+y\s+|,/)]) { const c = contenido(s); if (c.length) fr.push(Object.assign(c, { g })); } }
  FRASES[h.slug] = fr;
}
// Cuánto nombra un texto a una hermandad: la frase de titular más larga que aparece entera (y del mismo género)
function puntua(texto, h) {
  const tk = new Set(contenido(texto)); const g = genero(texto); let best = 0;
  for (const f of FRASES[h.slug]) if ((!g || !f.g || f.g === g) && f.every((w) => tk.has(w))) best = Math.max(best, f.length);
  return best;
}
// Hermandades que el texto nombra por su nombre («Hdad. de la Carretería», «Cofradía de Salutación»): eso manda sobre los titulares,
// porque varias hermandades comparten advocación (el Mayor Dolor del Gran Poder y el de la Carretería)
const NOMBRES = {};
for (const h of P.hermandades) NOMBRES[h.slug] = [contenido(h.nombre.replace(/«[^»]*»/g, ' ')), ...(h.nombre.match(/«([^»]+)»/g) || []).map(contenido), ...(contenido(h.nombre_oficial).length >= 2 ? [contenido(h.nombre_oficial)] : [])].filter((f) => f.length);
const sinTildes = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
function nombradas(texto, ciudad) {
  const out = new Set();
  for (const m of sinTildes(texto).replace(/[()]/g, ' ').matchAll(/\b(?:hdad|hermandad(?:es)?|cofradia|cof|archicofradia|congregacion|hdades)\b\.?\s*([^,;:]+)/g)) {
    // En un mismo tramo, la hermandad con el nombre más largo («Dolores del Puente» antes que «Dolores de San Juan»)
    const tk = new Set(contenido(m[1])); let top = 0, cand = [];
    for (const h of P.hermandades) if (h.ciudad === ciudad) for (const f of NOMBRES[h.slug]) if (f.every((w) => tk.has(w))) { if (f.length > top) { top = f.length; cand = [h.slug]; } else if (f.length === top && !cand.includes(h.slug)) cand.push(h.slug); }
    for (const s of cand) out.add(s);
  }
  return out;
}
// Mejor hermandad de una capital para un texto: la nombrada por su nombre o, si no, la única con la frase de titular más larga
function mejorHermandad(texto, ciudad) {
  const nom = nombradas(texto, ciudad);
  if (nom.size) return { top: 99, cand: [...nom].map((s) => HERM[s]), porNombre: true };
  let top = 0, cand = [];
  for (const h of P.hermandades) if (h.ciudad === ciudad) { const p = puntua(texto, h); if (p > top) { top = p; cand = [h]; } else if (p && p === top) cand.push(h); }
  return { top, cand };
}
// Lo que dice una dedicatoria de una hermandad concreta:
//   casa  = la nombra y es de su ciudad · otra = otra ciudad u otra hermandad · nada = no la nombra · vacia = sin dedicatoria
function clasifica(texto, localidad, h) {
  if (!norm(texto)) return { e: 'vacia' };
  const ciudad = h.ciudad;
  if (localidad) {
    const l = norm(localidad);
    if (CAPN[l] && CAPN[l] !== ciudad) return { e: 'otra', m: `la sitúa en ${localidad}` };
    if (!CAPN[l] && l !== 'andalucia' && !/comunidad|region/.test(l) && !Object.values(CAP).some((c) => norm(c) === l)) return { e: 'otra', m: `la sitúa en ${localidad}` };
  }
  const { caps, otros } = lugares(texto);
  if ([...caps].some((c) => c !== ciudad) && !caps.has(ciudad)) return { e: 'otra', m: 'nombra otra capital' };
  if (otros.size && !caps.has(ciudad) && !(localidad && CAPN[norm(localidad)] === ciudad)) return { e: 'otra', m: `nombra ${[...otros][0]}` };
  const { top, cand, porNombre } = mejorHermandad(texto, ciudad);
  if (porNombre) return cand.some((x) => x.slug === h.slug) ? { e: 'casa' } : { e: 'otra', m: `nombra a ${cand[0].nombre} (${CAP[ciudad]})`, otra: cand[0].slug };
  const mine = puntua(texto, h);
  if (top > mine && cand.length === 1) return { e: 'otra', m: `nombra a ${cand[0].nombre} (${CAP[ciudad]})`, otra: cand[0].slug };
  if (mine) return { e: 'casa' };
  return { e: 'nada' };
}

// ---------- 1. registros del catálogo (mdp) ----------
const R = []; // registros del modelo
const nuevo = (o) => { const r = { titulo: '', autor: '', anio: '', formacion: '', video: '', tipo: '', estreno: '', lugar: '', detalles: '', dedicatoria: null, fuentes: {}, urls: {}, retiradas: [], discrepancias: [], alias: [], ...o }; R.push(r); return r; };
const fuente = (r, campo, id, url) => { if (!r.fuentes[campo]) r.fuentes[campo] = []; if (!r.fuentes[campo].includes(id)) r.fuentes[campo].push(id); if (url) r.urls[id] = r.urls[id] || url; };

// ---------- 2. marchas ligadas a hermandades (portal.json) ----------
const origen = (h) => (/patrimoniomusical\.com\/foro/.test(h.marchas_fuente || '') ? 'foro' : /wikipedia\.org/.test(h.marchas_fuente || '') ? 'wiki' : 'fgr');
// Direcciones (slug) ya publicadas: se repite el cálculo que tenía build.mjs hasta 2026-10-25 para que ninguna cambie.
// Una marcha que ahora se une con otra (duplicado del catálogo) deja su dirección antigua como alias, que redirige.
const slugB = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const SLUGS = new Set();
const darSlugB = (base) => { let s = slugB(base); if (!s) return ''; let n = 2; const b = s; while (SLUGS.has(s)) s = b + '-' + n++; SLUGS.add(s); return s; };
const viejoLig = [], viejoCat = [];
{
  const ntB = (t) => norm(t);
  const ta = (t) => new Set(norm(t).split(' ').filter((w) => w.length >= 3 && !PILA.has(w) && !['del', 'los', 'las', 'san'].includes(w)));
  const coincideB = (a, b) => { const x = ta(a), y = ta(b); for (const w of x) if (y.has(w)) return true; return false; };
  const sinVideo = new Map();
  for (const h of P.hermandades) for (const m of h.marchas || []) { const o = { m, video: m.video, slug: darSlugB(m.titulo + ' ' + (m.autor || h.slug)) }; viejoLig.push(o.slug); if (!o.video) { const k = ntB(m.titulo); (sinVideo.get(k) || sinVideo.set(k, []).get(k)).push(o); } }
  for (const e of ESP.marchas) {
    const hit = (sinVideo.get(ntB(e.titulo)) || []).find((o) => !o.video && coincideB(o.m.autor, e.autor));
    if (hit) { hit.video = e.video; viejoCat.push(null); continue; }
    viejoCat.push(darSlugB(e.titulo + ' ' + (e.autor || '')) || null);
  }
}
const darSlug = (base) => darSlugB(base); // direcciones nuevas: no pisan ninguna antigua
const ligadas = [];
let iLig = 0;
for (const h of P.hermandades) for (const m of h.marchas || []) {
  const o = origen(h); const url = o === 'fgr' ? h.fuente_url : h.marchas_fuente;
  const r = nuevo({ slug: viejoLig[iLig++], titulo: m.titulo, autor: m.autor || '', anio: m.anio || '', formacion: m.tipo || '', video: m.video || '' });
  for (const c of ['titulo', 'autor', 'anio', 'formacion', 'video']) if (r[c]) fuente(r, c, o, url);
  r._h = h.slug; r._o = o; r._oUrl = url;
  ligadas.push(r);
}
// Catálogo: une con la ligada si es la misma obra (título comparable + apellido del compositor); si no, registro propio
const porTitulo = new Map(); for (const r of ligadas) { const k = nt(r.titulo); (porTitulo.get(k) || porTitulo.set(k, []).get(k)).push(r); }
const catPorClave = new Map(); // título+autor+formación → registro (duplicados del catálogo, M6)
let caidos = 0;
for (const [j, e] of ESP.marchas.entries()) {
  const vivo = e.video && !e.caido; if (e.caido) caidos++;
  const viejo = viejoCat[j];
  const kDup = nt(e.titulo) + '|' + norm(e.autor) + '|' + e.formacion;
  const ficha = (r) => {
    fuente(r, 'titulo', 'mdp', urlTabla(e.formacion)); if (e.autor) fuente(r, 'autor', 'mdp');
    if (vivo) { if (!r.video) { r.video = e.video; fuente(r, 'video', 'mdp', urlTabla(e.formacion)); } else if (r.video !== e.video) (r.videos ||= []).includes(e.video) || r.videos.push(e.video); }
    if (vivo) r.urls.mdpFicha = r.urls.mdpFicha || urlYt(e.video);
    for (const [c, v] of [['tipo', e.tipo], ['estreno', e.estreno], ['lugar', e.lugar], ['detalles', e.detalles]]) if (v && !r[c]) { r[c] = v; fuente(r, c, 'mdp'); }
    if (e.anio) r._anios = [...(r._anios || []), { v: e.anio, f: 'mdp' }];
    if (e.dedicatoria) r._deds = [...(r._deds || []), { texto: e.dedicatoria, loc: '', f: 'mdp', url: vivo ? urlYt(e.video) : urlTabla(e.formacion) }];
    if (e.formacion && !r.formacion) { r.formacion = e.formacion; fuente(r, 'formacion', 'mdp'); }
    else if (e.formacion && r.formacion && norm(r.formacion) === norm(e.formacion)) fuente(r, 'formacion', 'mdp');
  };
  const lig = (porTitulo.get(nt(e.titulo)) || []).find((r) => mismoAutor(r.autor, e.autor) && (!r._mdp || r._mdpForm === e.formacion) && (!r.formacion || norm(r.formacion) === norm(e.formacion) || r._o !== 'fgr'));
  if (lig && !lig._mdp) { lig._mdp = true; lig._mdpForm = e.formacion; if (lig.autor.length < e.autor.length && mismoAutor(lig.autor, e.autor)) { lig.autor = e.autor; } if (viejo) lig.alias.push(viejo); ficha(lig); continue; }
  const dup = catPorClave.get(kDup);
  if (dup) { if (viejo) dup.alias.push(viejo); ficha(dup); continue; }
  const r = nuevo({ slug: viejo || darSlug(e.titulo + ' ' + (e.autor || '')), titulo: e.titulo, autor: e.autor || '', formacion: e.formacion || '' });
  fuente(r, 'formacion', 'mdp'); ficha(r); catPorClave.set(kDup, r);
}

// ---------- 3. Patrimonio Musical: segunda fuente (título comparable + apellido) ----------
const pmIdx = new Map();
if (PM) for (const [id, f] of Object.entries(PM)) if (f && f.t) { const k = nt(f.t); (pmIdx.get(k) || pmIdx.set(k, []).get(k)).push({ id, ...f }); }
const prevPm = new Map(PREV.marchas.filter((m) => m.urls && m.urls.pm).map((m) => [m.slug, m]));
for (const r of R) {
  if (PM) {
    const fs_ = (pmIdx.get(nt(r.titulo)) || []).filter((f) => mismoAutor(f.a, r.autor));
    if (!fs_.length) continue;
    r._pm = fs_.map((f) => ({ id: f.id, y: f.y, d: f.d, u: f.u }));
  } else if (prevPm.has(r.slug)) r._pmPrev = prevPm.get(r.slug);
}

// ---------- 4. dedicatorias: verificar las ligadas y ligar las del catálogo que nombran una hermandad ----------
const informe = { retiradas: [], nuevas: [], dudas: [] };
const ponDed = (r, h, estado, fuentes, texto) => {
  // Titular nombrado en la dedicatoria (del mismo género). Si solo nombra la hermandad («Hdad. Crucifixión»), no se deduce el titular.
  const tk = new Set(contenido(texto || '')); const g = genero(texto || ''); const nom = new Set(NOMBRES[h.slug].flat());
  const tit = (h.titulares || []).map((t) => t.nombre).find((t) => { const c = contenido(t); const gt = genero(t); return c.length && c.every((w) => tk.has(w)) && (!g || !gt || g === gt) && (g || !c.every((w) => nom.has(w))); }) || '';
  r.dedicatoria = { hermandad: h.slug, ciudad: h.ciudad, titular: tit, texto: texto || '', estado };
  for (const f of fuentes) fuente(r, 'dedicatoria', f.f, f.url);
};
for (const r of R) {
  const deds = [...(r._deds || []), ...(r._pm || []).filter((f) => f.d || f.u).map((f) => ({ texto: f.d, loc: (f.u || '').split(' - ').length >= 3 ? f.u.split(' - ').pop() : '', f: 'pm', id: f.id, url: urlPm(f.id) }))];
  r._pmCasa = new Set();
  if (r._h) {
    const h = HERM[r._h];
    const veredictos = deds.map((d) => ({ ...d, ...clasifica(d.texto, d.loc, h) }));
    const casan = veredictos.filter((v) => v.e === 'casa'); for (const v of casan) if (v.id) r._pmCasa.add(v.id);
    const otras = veredictos.filter((v) => v.e === 'otra');
    const fuentesCasa = [{ f: r._o, url: r._oUrl }, ...casan];
    const sitios = new Set(fuentesCasa.filter((f) => FIABLE.has(f.f)).map((f) => f.f));
    if (otras.length && !OFICIAL.has(r._o) && !casan.length) {
      const o = otras[0];
      r.retiradas.push({ hermandad: h.slug, origen: r._o, url: r._oUrl, motivo: `${o.f === 'pm' ? 'Patrimonio Musical' : 'Marchas de Procesión'} ${o.m}${o.texto ? ' («' + o.texto + '»)' : ''}`, fuente: o.url });
      informe.retiradas.push([r.slug, h.slug, r.retiradas.at(-1).motivo]);
      if (o.otra) r._otraHerm = o.otra;
    } else {
      const estado = sitios.size >= 2 ? 'contrastada' : sitios.size === 1 ? 'dedicada' : 'sin-verificar';
      ponDed(r, h, estado, fuentesCasa, casan[0] ? casan[0].texto : '');
      if (otras.length) { r.discrepancias.push({ campo: 'dedicatoria', valores: otras.map((o) => ({ valor: o.texto, fuente: o.f, url: o.url, nota: o.m })), elegido: r._o }); informe.dudas.push([r.slug, h.slug, "se mantiene (" + r._o + (casan.length ? " + " + casan.map((c) => c.f).join(" + ") : "") + ") aunque " + otras[0].f + " " + otras[0].m]); }
    }
  }
  if (!r.dedicatoria && deds.length) {
    // ¿La dedicatoria del catálogo o de Patrimonio Musical nombra una hermandad del portal en su ciudad?
    const porH = new Map();
    for (const d of deds) {
      const { caps, otros } = lugares(d.texto);
      const locCap = d.loc ? CAPN[norm(d.loc)] : null;
      if (d.loc && !locCap) continue;
      const ciudades = locCap ? [locCap] : [...caps];
      if (ciudades.length !== 1 || (otros.size && !locCap)) continue;
      // Dedicada a una persona («En memoria de…, capataz de…»): no es una dedicatoria a la hermandad
      if (/^\s*(en|a la)\s+memoria|^\s*in memoriam/i.test(sinTildes(d.texto))) continue;
      const { top, cand, porNombre } = mejorHermandad(d.texto, ciudades[0]);
      if (!top || cand.length !== 1) { if (cand.length > 1) informe.dudas.push([r.slug, cand.map((x) => x.slug).join(' / '), 'casa con varias hermandades de la ciudad: ' + d.texto]); continue; }
      const h = cand[0];
      if (clasifica(d.texto, d.loc, h).e !== 'casa') continue;
      // Hace falta una frase específica: el nombre de la hermandad, dos palabras de un titular, o una sola palabra que no sea
      // advocación corriente (las Mercedes, el Rosario o los Ángeles tienen hermandades de gloria que no están en el portal)
      const tk = new Set(contenido(d.texto));
      const especifica = porNombre || FRASES[h.slug].some((f) => f.every((w) => tk.has(w)) && (f.length >= 2 || (!COMUN.has(f[0]) && P.hermandades.filter((x) => x.ciudad === h.ciudad && x.slug !== h.slug && FRASES[x.slug].some((g) => g.includes(f[0]))).length === 0)));
      if (!especifica) { informe.dudas.push([r.slug, h.slug, 'dedicatoria poco específica: ' + d.texto]); continue; }
      (porH.get(h.slug) || porH.set(h.slug, []).get(h.slug)).push(d);
    }
    if (porH.size === 1) {
      const [hs, ds] = [...porH][0]; const h = HERM[hs];
      if (r.retiradas.some((x) => x.hermandad === hs)) { /* ya retirada */ } else {
        const sitios = new Set(ds.map((d) => d.f)); for (const d of ds) if (d.id) r._pmCasa.add(d.id);
        ponDed(r, h, sitios.size >= 2 ? 'contrastada' : 'dedicada', ds, ds[0].texto);
        informe.nuevas.push([r.slug, hs, ds[0].texto]);
      }
    } else if (porH.size > 1) informe.dudas.push([r.slug, [...porH.keys()].join(' / '), 'dedicatoria que casa con varias hermandades']);
  }
  if (!r.dedicatoria && deds.length) { const d = deds.find((x) => x.f === 'mdp') || deds[0]; r.dedicatoria = { hermandad: '', ciudad: '', titular: '', texto: d.texto, estado: 'dedicada' }; fuente(r, 'dedicatoria', d.f, d.url); }
}

// ---------- 5. año: si las fuentes discrepan, solo la oficial (sin oficial, vacío y anotado) ----------
for (const r of R) {
  const vals = [...(r.anio ? [{ v: r.anio, f: r._o }] : []), ...(r._anios || []), ...((r._pm || []).length > 1 ? r._pm.filter((f) => r._pmCasa.has(f.id)) : r._pm || []).filter((f) => /^\d{4}$/.test(f.y)).map((f) => ({ v: f.y, f: 'pm', url: urlPm(f.id) }))];
  const distintos = [...new Set(vals.map((x) => x.v))];
  r.fuentes.anio = [];
  if (distintos.length === 1) { r.anio = distintos[0]; for (const x of vals) fuente(r, 'anio', x.f, x.url); }
  else if (distintos.length > 1) {
    // Manda la oficial; sin ella, lo que digan las fiables (Wikipedia y el foro no cuentan) si están de acuerdo,
    // o el año que dan dos fuentes fiables distintas frente a uno que da una sola. Si no, vacío y anotado.
    const of = vals.find((x) => OFICIAL.has(x.f));
    const fi = vals.filter((x) => FIABLE.has(x.f));
    const apoyo = new Map(); for (const x of fi) (apoyo.get(x.v) || apoyo.set(x.v, new Set()).get(x.v)).add(x.f);
    const orden = [...apoyo].sort((a, b) => b[1].size - a[1].size);
    const elegido = of ? of.v : orden.length === 1 ? orden[0][0] : orden.length > 1 && orden[0][1].size > orden[1][1].size ? orden[0][0] : '';
    r.anio = elegido;
    if (elegido) for (const x of vals.filter((y) => y.v === elegido)) fuente(r, 'anio', x.f, x.url);
    r.discrepancias.push({ campo: 'anio', valores: vals.map((x) => ({ valor: x.v, fuente: x.f, url: x.url || r.urls[x.f] || '' })), elegido: elegido ? (of ? of.f : [...apoyo.get(elegido)].join('+')) : '' });
  }
  if (!r.fuentes.anio.length) delete r.fuentes.anio;
  for (const f of r._pm || []) { r.urls.pm = r.urls.pm || urlPm(f.id); fuente(r, 'titulo', 'pm'); fuente(r, 'autor', 'pm'); }
  if (r._pmPrev) { r.urls.pm = r._pmPrev.urls.pm; for (const c of ['titulo', 'autor']) fuente(r, c, 'pm'); }
  if (r.video && ESP.marchas.some((e) => e.video === r.video && e.caido)) { r.discrepancias.push({ campo: 'video', valores: [{ valor: r.video, fuente: 'mdp', nota: 'vídeo retirado de YouTube' }] }); r.video = ''; delete r.fuentes.video; }
}

// ---------- 6. revisión a mano (con fuente abierta): manda sobre todo lo anterior ----------
const sinUsar = [];
for (const v of REV) {
  const r = R.find((x) => (v.slug ? x.slug === v.slug : nt(x.titulo) === nt(v.titulo) && (!v.autor || mismoAutor(x.autor, v.autor)) && (!v.hermandad || (x.dedicatoria && x.dedicatoria.hermandad === v.hermandad) || x._h === v.hermandad || x.retiradas.some((y) => y.hermandad === v.hermandad))));
  if (!r) { sinUsar.push(v); continue; }
  const src = { f: 'rev', url: v.fuente };
  r.urls['rev'] = v.fuente; (r.revision ||= []).push({ fecha: v.fecha, nota: v.nota || '', url: v.fuente, fuente: v.nombre_fuente || '' });
  for (const [c, val] of Object.entries(v.campos || {})) {
    if (c === 'titulo' && r.titulo !== val) r.discrepancias.push({ campo: 'titulo', valores: [{ valor: r.titulo, fuente: (r.fuentes.titulo || [])[0] || '' }], elegido: 'rev' });
    r[c] = val; r.fuentes[c] = ['rev'];
  }
  if (v.accion === 'confirmar' || v.accion === 'ligar') {
    const h = HERM[v.hermandad]; const prev = r.dedicatoria && r.dedicatoria.hermandad === h.slug ? r.dedicatoria : null;
    const otrasF = prev ? (r.fuentes.dedicatoria || []).filter((f) => FIABLE.has(f) && f !== 'rev') : [];
    r.retiradas = r.retiradas.filter((x) => x.hermandad !== h.slug);
    r.dedicatoria = { hermandad: h.slug, ciudad: h.ciudad, titular: v.titular || (prev && prev.titular) || '', texto: v.texto || (prev && prev.texto) || '', estado: otrasF.length ? 'contrastada' : 'dedicada' };
    if (!prev) r.fuentes.dedicatoria = [];
    fuente(r, 'dedicatoria', 'rev', v.fuente);
  } else if (v.accion === 'retirar') {
    const hs = v.hermandad || (r.dedicatoria && r.dedicatoria.hermandad);
    if (r.dedicatoria && r.dedicatoria.hermandad === hs) { r.dedicatoria = null; delete r.fuentes.dedicatoria; }
    if (!r.retiradas.some((x) => x.hermandad === hs)) r.retiradas.push({ hermandad: hs, origen: r._o || '', url: r._oUrl || '', motivo: v.nota, fuente: v.fuente });
  }
}

// ---------- 7. compositores escritos de varias formas (M7): una sola forma por persona ----------
const claveAutor = (a) => norm(a).split(' ').filter((w) => !['de', 'del', 'la', 'y'].includes(w)).join(' ');
const formas = new Map();
for (const r of R) if (r.autor) { const k = claveAutor(r.autor); const m = formas.get(k) || formas.set(k, new Map()).get(k); m.set(r.autor, (m.get(r.autor) || 0) + 1); }
const tildes = (s) => (s.normalize('NFD').match(/[̀-ͯ]/g) || []).length;
for (const r of R) if (r.autor) { const m = formas.get(claveAutor(r.autor)); const mejor = [...m].sort((a, b) => tildes(b[0]) - tildes(a[0]) || b[1] - a[1])[0][0]; r.autor = mejor; }

// ---------- 8. salida ----------
const limpio = R.map((r) => {
  const o = { slug: r.slug, titulo: r.titulo, autor: r.autor, anio: r.anio, formacion: r.formacion, video: r.video };
  if (r.videos) o.videos = r.videos.filter((v) => v !== r.video);
  for (const c of ['tipo', 'estreno', 'lugar', 'detalles']) if (r[c]) o[c] = r[c];
  if (r.dedicatoria) o.dedicatoria = r.dedicatoria;
  o.fuentes = r.fuentes; o.urls = r.urls;
  for (const c of ['retiradas', 'discrepancias', 'alias']) if (r[c].length) o[c] = r[c];
  if (r.revision) o.revision = r.revision;
  return o;
});
const cuenta = (f) => limpio.filter(f).length;
const resumen = {
  marchas: limpio.length,
  ligadas: cuenta((m) => m.dedicatoria && m.dedicatoria.hermandad),
  contrastadas: cuenta((m) => m.dedicatoria && m.dedicatoria.hermandad && m.dedicatoria.estado === 'contrastada'),
  dedicadas: cuenta((m) => m.dedicatoria && m.dedicatoria.hermandad && m.dedicatoria.estado === 'dedicada'),
  sin_verificar: cuenta((m) => m.dedicatoria && m.dedicatoria.estado === 'sin-verificar'),
  retiradas: cuenta((m) => m.retiradas),
  hermandades: new Set(limpio.filter((m) => m.dedicatoria && m.dedicatoria.hermandad).map((m) => m.dedicatoria.hermandad)).size,
  videos_caidos: caidos,
};
const porCiudad = {}; for (const m of limpio) if (m.dedicatoria && m.dedicatoria.hermandad) porCiudad[m.dedicatoria.ciudad] = (porCiudad[m.dedicatoria.ciudad] || 0) + 1;
resumen.por_ciudad = porCiudad;
const FUENTES = {
  mdp: { nombre: 'Marchas de Procesión (base de datos y ficha de cada vídeo)', url: 'https://www.marchasdeprocesion.com/p/base-de-datos.html', fiable: true },
  pm: { nombre: 'Patrimonio Musical (base de datos de marchas)', url: 'https://www.patrimoniomusical.com/', fiable: true },
  fgr: { nombre: 'Federación de Hermandades y Cofradías de Granada (ficha oficial, «Patrimonio musical»)', url: 'https://www.semanasantagranada.org/', fiable: true, oficial: true },
  wiki: { nombre: 'Wikipedia (sección de marchas de la hermandad)', url: 'https://es.wikipedia.org/', fiable: false },
  foro: { nombre: 'Foro de Patrimonio Musical: «Marchas procesionales de Málaga» (2008)', url: 'https://www.patrimoniomusical.com/foro/viewtopic.php?t=1959', fiable: false },
  rev: { nombre: 'Revisión a mano con fuente (web de la hermandad, de la banda o prensa)', url: '', fiable: true, oficial: true },
};
fs.writeFileSync(OUT, '{"generado":' + JSON.stringify(new Date().toISOString().slice(0, 10)) + ',\n"nota":' + JSON.stringify('Modelo único de marchas (tools/unificar-marchas.mjs). Por campo, las fuentes que lo dan; dedicatoria.estado: contrastada (dos fuentes fiables), dedicada (una fiable), sin-verificar (solo foro o Wikipedia). De Patrimonio Musical solo se guarda el enlace.') + ',\n"fuentes":' + JSON.stringify(FUENTES) + ',\n"resumen":' + JSON.stringify(resumen) + ',\n"marchas":[\n' + limpio.map((m) => JSON.stringify(m)).join(',\n') + '\n]}\n');
fs.mkdirSync(path.join(RAIZ, 'auditoria'), { recursive: true });
fs.writeFileSync(path.join(RAIZ, 'auditoria/marchas-informe.json'), JSON.stringify({ ...informe, revision_sin_usar: sinUsar }, null, 1));
console.log(JSON.stringify(resumen, null, 1));
console.log('retiradas', informe.retiradas.length, '· nuevas', informe.nuevas.length, '· dudas', informe.dudas.length, '· revisiones sin casar', sinUsar.length, PM ? '' : '· (sin la base de Patrimonio Musical: se reutiliza la pasada anterior)');
