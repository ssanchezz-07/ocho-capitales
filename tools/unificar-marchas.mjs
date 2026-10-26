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
const PILA_VIEJA = new Set('jose juan manuel francisco antonio miguel jesus javier luis pedro rafael carlos angel alberto david daniel pablo sergio maria ramon joaquin alejandro fernando jorge vicente andres enrique alfonso emilio eduardo salvador cristobal diego mario victor ignacio gabriel abel ivan oscar raul ruben sebastian perfecto agustin ana isaac primitivo benjamin gines gonzalo'.split(' '));
// Nombres de pila para comparar compositores (la lista vieja se conserva tal cual para reproducir las direcciones antiguas)
const PILA = new Set([...PILA_VIEJA, ...'desiderio paco pepe manolo manuela isidro narciso celestino eloy bienvenido dionisio nicolas ezequiel ismael sixto adolfo alfonso fernando gustavo hector jacinto julio marco nicolas octavio patricio ricardo roberto teodoro tomas valentin vicente victor alvaro cristian eugenio federico gregorio hugo jaime jorge leopoldo luciano maximo moises norberto ramiro rodrigo samuel silvestre virgilio'.split(' ')]);
const apellidos = (a) => new Set(norm(a).split(' ').filter((w) => w.length >= 3 && !PILA.has(w) && !['del', 'los', 'las', 'san'].includes(w)));
// Mismo compositor: un apellido poco corriente en común, o dos apellidos, o un apellido corriente y el mismo nombre de pila
// («Eloy García» = «Eloy García López», pero «Eloy García López» ≠ «Manuel López Farfán»)
const CORRIENTES = new Set('garcia lopez martinez sanchez fernandez perez gonzalez rodriguez gomez moreno jimenez ruiz hernandez diaz munoz alvarez romero alonso gutierrez navarro torres dominguez vazquez ramos gil ramirez serrano blanco molina morales suarez ortega delgado castro ortiz rubio marin sanz nunez iglesias medina garrido cortes castillo santos lozano guerrero cano prieto mendez cruz calvo gallego vidal leon marquez herrera pena flores cabrera campos vega fuentes carrasco diez reyes caballero nieto aguilar pascual santana herrero montero lorenzo hidalgo gimenez ibanez ferrer duran santiago benitez mora vicente vargas arias carmona crespo roman pastor soto saez velasco moya soler parra esteban bravo gallardo rojas'.split(' '));
const pila = (a) => norm(a).split(' ')[0] || '';
// Si cada nombre tiene un apellido que el otro no tiene, son personas distintas («Manuel López Farfán» ≠ «Manuel Miguel López Martínez»).
// Erratas de una letra en apellidos largos cuentan como el mismo (Albero/Abero, Puyuelo/Poyuelo).
const lev1 = (x, y) => { if (Math.abs(x.length - y.length) > 1) return false; let i = 0, j = 0, d = 0; while (i < x.length && j < y.length) { if (x[i] === y[j]) { i++; j++; continue; } if (++d > 1) return false; if (x.length > y.length) i++; else if (y.length > x.length) j++; else { i++; j++; } } return d + (x.length - i) + (y.length - j) <= 1; };
const igualAp = (x, y) => x === y || (x.length >= 5 && y.length >= 5 && lev1(x, y));
const mismoAutor = (a, b) => {
  const x = [...apellidos(a)], y = [...apellidos(b)];
  const comun = x.filter((w) => y.some((v) => igualAp(w, v)));
  if (!comun.length) return false;
  const soloX = x.filter((w) => !y.some((v) => igualAp(w, v))), soloY = y.filter((v) => !x.some((w) => igualAp(w, v)));
  if (soloX.length && soloY.length) return false;
  // nombres de pila completos y distintos: otra persona (Perfecto Artola Prats y su hijo Desiderio Artola Tena)
  // (se comparan todos los nombres de pila conocidos: «Vicente Micó» = «José Vicente Micó Álvarez»; varios autores en otro orden, también)
  const pilas = (n) => norm(n).split(' ').filter((w) => PILA.has(w) && !CORRIENTES.has(w));
  const pa = pilas(a), pb = pilas(b);
  if (pa.length && pb.length && !pa.some((w) => pb.includes(w))) return false;
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
const FIABLE = new Set(['fgr', 'pm', 'mdp', 'bne', 'part', 'cyh', 'rev']);
const OFICIAL = new Set(['fgr', 'rev']);

// ---------- lugares: ¿de qué ciudad habla una dedicatoria? ----------
// Municipios andaluces que también son advocaciones o palabras corrientes: no cuentan como lugar si no van tras «de»/entre paréntesis
const AMBIGUOS = new Set(['la victoria', 'victoria', 'gines', 'fuentes', 'dos torres', 'pilas', 'la puebla', 'santiago', 'rota', 'olivares', 'la luisiana', 'el bosque', 'los corrales', 'la paz', 'paterna', 'la guardia', 'cuevas', 'la rambla', 'villanueva', 'los barrios', 'la carolina', 'la zubia', 'gador', 'la herradura']);
const FUERA = ['madrid', 'toledo', 'murcia', 'cartagena', 'lorca', 'cieza', 'jumilla', 'caravaca', 'albacete', 'hellin', 'tobarra', 'cuenca', 'ciudad real', 'puertollano', 'valdepenas', 'badajoz', 'merida', 'caceres', 'plasencia', 'zafra', 'salamanca', 'zamora', 'valladolid', 'leon', 'burgos', 'palencia', 'segovia', 'avila', 'soria', 'logrono', 'bilbao', 'zaragoza', 'huesca', 'teruel', 'valencia', 'alicante', 'elche', 'orihuela', 'crevillente', 'castellon', 'barcelona', 'tarragona', 'ferrol', 'vigo', 'pontevedra', 'oviedo', 'gijon', 'santander', 'pamplona', 'ceuta', 'melilla', 'tenerife', 'las palmas', 'mallorca', 'guadalajara', 'getafe', 'mostoles', 'ponferrada', 'astorga', 'benavente', 'calahorra', 'lisboa', 'olivenza', 'jerez de los caballeros', 'don benito', 'almendralejo', 'villafranca de los barros', 'talavera', 'yecla', 'totana', 'mula', 'moratalla', 'alhama de murcia', 'aguilas', 'torrevieja'];
// Municipios que son también nombres corrientes de las dedicatorias: no se detectan nunca como lugar (María, en Almería, es «María Santísima»)
const NUNCA_LUGAR = new Set(['maria']);
const LUGARES = [
  ...Object.keys(MUNI).map((m) => ({ n: norm(m), cap: null, prov: MUNI[m] })),
  ...FUERA.map((n) => ({ n, cap: null, prov: 'fuera' })),
].filter((l) => l.n.length >= 3 && !NUNCA_LUGAR.has(l.n)).sort((a, b) => b.n.length - a.n.length);
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
  // Empate de titulares (dos «Jesús Nazareno del Paso» en Málaga): desempata el nombre oficial si una sola comparte más palabras
  // con la dedicatoria («Al Dulce Nombre de Jesús Nazareno del Paso» → Archicofradía del Dulce Nombre… del Paso y la Esperanza)
  if (cand.length > 1) {
    const tk = new Set(contenido(texto));
    const sc = cand.map((h) => contenido(h.nombre_oficial).filter((w) => tk.has(w)).length);
    const mx = Math.max(...sc);
    if (sc.filter((x) => x === mx).length === 1 && mx > top) cand = [cand[sc.indexOf(mx)]];
  }
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
  // Nombra un templo que no es la sede de la hermandad («Virgen de Guadalupe de la iglesia de San Buenaventura»): es otra imagen
  const templo = sinTildes(texto).match(/\b(?:iglesia|parroquia|capilla|convento|basilica|ermita|monasterio)\s+(?:de\s+|del\s+)?(?:la\s+|el\s+|los\s+|las\s+)?(?:san\s+|santa\s+|santo\s+|nuestra\s+senora\s+de\s+(?:la\s+|los\s+)?)?([a-z]{4,})/);
  if (templo && !norm(h.sede).includes(templo[1])) return { e: 'otra', m: `nombra otro templo (${templo[0]})` };
  const { top, cand, porNombre } = mejorHermandad(texto, ciudad);
  if (porNombre) return cand.some((x) => x.slug === h.slug) ? { e: 'casa' } : { e: 'otra', m: `nombra a ${cand[0].nombre} (${CAP[ciudad]})`, otra: cand[0].slug };
  // Nombra un barrio o un lugar que no es de esta hermandad («Virgen del Dulce Nombre de Bellavista»): es otra imagen
  const permitidas = new Set([...FRASES[h.slug].flat(), ...NOMBRES[h.slug].flat(), ...contenido(h.sede), ...contenido(h.nombre_oficial), ...(h.titulares || []).flatMap((t) => contenido(t.nombre)), ...Object.keys(CAPN), 'andalucia']);
  // (solo en la frase principal, hasta la primera coma o «para…»: «…por las calles de Roma» es la ocasión, no la imagen;
  // sin números romanos ni palabras de aniversario; «Pinomontano» = «Pino Montano»)
  for (const f of [...FRASES[h.slug], ...NOMBRES[h.slug]]) permitidas.add(f.join(''));
  const principal = String(texto).split(/,|\s(?:para|con motivo|en conmemoraci[oó]n|por su|en el)\s/)[0];
  const raro = [...principal.matchAll(/\b(?:de|del)\s+((?:[A-ZÁÉÍÓÚÑ][\wáéíóúñü]+\s?){1,3})/g)].flatMap((x) => contenido(x[1])).find((w) => !permitidas.has(w) && !COMUN.has(w) && !/^[ivxlc]+$/.test(w) && !/^(aniversario|centenario|coronacion|fundacion|bendicion|hechura|canonica|cincuentenario)$/.test(w));
  if (raro) return { e: 'otra', m: `nombra «${raro}», que no es de ${h.nombre}` };
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
  const ta = (t) => new Set(norm(t).split(' ').filter((w) => w.length >= 3 && !PILA_VIEJA.has(w) && !['del', 'los', 'las', 'san'].includes(w)));
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

// ---------- 2b. Biblioteca Nacional (datos.bne.es, datos abiertos): partituras con compositor ----------
// Confirma título y compositor; si una nota de la ficha trae la dedicatoria, cuenta como fuente de la dedicatoria.
// La fecha es la de la partitura (edición o manuscrito), no siempre la de composición: no se usa como año.
const BNE = leer(path.join(DIR, 'sources/marchas-bne.json'), { marchas: [] });
// Subcampos de la BNE: [título, subtítulo…, mención de responsabilidad]. El compositor sale de la mención (nombre completo)
// si parece un nombre de persona y casa con el autor del registro («Quirós, Miguel (1941-)»); si no, del autor del registro.
const nombreBne = (o) => {
  const sc = o.subcampos || [];
  const ult = sc.length >= 2 ? String(sc.at(-1)).replace(/\[|\]/g, '').replace(/^(m[uú]sica|letra|arreglo|instrumentaci[oó]n|original)( de| y letra de)?\s+/i, '').split(/\s*[;,]\s*|\s+y\s+/)[0].trim() : '';
  const pareceNombre = ult && !/[:]|marcha|procesi|para |por |siglo|banda|piano|op\.|n[ºo]\s/i.test(ult) && ult.split(' ').length <= 6 && /^[A-ZÁÉÍÓÚÑ]/.test(ult);
  const inv = String(o.autor_bne || '').replace(/\s*\([^)]*\)\s*$/, '').split(',').map((x) => x.trim()).reverse().join(' ').trim();
  // sin autor en el registro no hay compositor fiable (el último subcampo puede ser un subtítulo o la banda de un disco)
  if (!inv) return '';
  return pareceNombre && mismoAutor(ult, inv) ? ult : inv;
};
const tituloBne = (o) => String((o.subcampos || [])[0] || o.titulo || '').replace(/\s*[:;/].*$/, '').replace(/\s*\.\s*$/, '').replace(/^\[|\]$/g, '').trim();
// Partituras que no están en el catálogo: solo entran si el título es de Semana Santa (la BNE también trae Corpus, piezas de piano francesas…)
const COFRADE = /procesi|semana santa|palio|cofrad|cristo|virgen|nuestra se[nñ]ora|nuestro padre|jes[uú]s|mar[ií]a sant|esperanza|soledad|dolor|angustia|amargura|macaren|triana|exaltaci|expiraci|buena muerte|piedad|penas|l[aá]grimas|nazareno|cautivo|pasi[oó]n|crucifix|sepulcro|calvario|saeta|cruz/i;
const EXTRANJERO = /\b(marche|processionnelle|pour|et|und|the|for|marcia|funebre)\b/i;
const porTituloR = new Map(); for (const r of R) { const k = nt(r.titulo); (porTituloR.get(k) || porTituloR.set(k, []).get(k)).push(r); }
const bnePorClave = new Map();
for (const o of BNE.marchas) {
  // solo partituras (impresas o manuscritas): el tema también trae discos y recopilaciones
  if (!o.leida || !o.subcampos || !/impresa|manuscrita/i.test(o.tipo || '')) continue;
  const titulo = tituloBne(o); const autor = nombreBne(o);
  if (!titulo || !autor) continue;
  const ded = (o.notas || []).find((n) => /dedicad|dedicatoria/i.test(n));
  let r = (porTituloR.get(nt(titulo)) || []).find((x) => mismoAutor(x.autor, autor)) || bnePorClave.get(nt(titulo) + '|' + [...apellidos(autor)].sort().join(' '));
  if (!r && (!COFRADE.test((o.subcampos || []).join(' ')) || EXTRANJERO.test((o.subcampos || []).join(' ')))) continue;
  if (!r) { r = nuevo({ slug: darSlug(titulo + ' ' + autor), titulo, autor }); bnePorClave.set(nt(titulo) + '|' + [...apellidos(autor)].sort().join(' '), r); (porTituloR.get(nt(titulo)) || porTituloR.set(nt(titulo), []).get(nt(titulo))).push(r); }
  fuente(r, 'titulo', 'bne', o.url); fuente(r, 'autor', 'bne');
  (r.partituras ||= []).push({ url: o.url, fecha: o.fecha || o.anio || '', tipo: o.tipo || '' });
  if (ded) r._deds = [...(r._deds || []), { texto: ded.replace(/^.*?(dedicad[ao]s?|dedicatoria)\s*:?\s*/i, ''), loc: '', f: 'bne', url: o.url }];
}

// ---------- 2c. Repertorio de bandas a partir de sus partituras (tools/sources/repertorio-*.json) ----------
// La cabecera de la partitura da título, compositor, año y, a veces, la dedicatoria. Las partituras no se publican.
const REPS = process.env.SIN_REPERTORIO ? [] : fs.readdirSync(path.join(DIR, 'sources')).filter((f) => /^repertorio-.*\.json$/.test(f)).map((f) => leer(path.join(DIR, 'sources', f)));
for (const rp of REPS) for (const x of rp.marchas) {
  let r = (porTituloR.get(nt(x.titulo)) || []).find((y) => mismoAutor(y.autor, x.autor));
  if (!r) { r = nuevo({ slug: darSlug(x.titulo + ' ' + x.autor), titulo: x.titulo, autor: x.autor }); (porTituloR.get(nt(x.titulo)) || porTituloR.set(nt(x.titulo), []).get(nt(x.titulo))).push(r); }
  fuente(r, 'titulo', 'part'); fuente(r, 'autor', 'part');
  (r.repertorio ||= []).push({ banda: rp.banda, nombre: rp.nombre_banda, ...(x.arreglo ? { arreglo: x.arreglo } : {}) }); fuente(r, 'repertorio', 'part');
  if (x.anio) r._anios = [...(r._anios || []), { v: x.anio, f: 'part' }];
  if (x.dedicatoria) r._deds = [...(r._deds || []), { texto: x.dedicatoria, loc: '', f: 'part', url: '' }];
}

// ---------- 2d. cofradiasyhermandades.es: listado de las 8 capitales (auditoria/cyh-marchas.json, local; tools/importar-marchas-cyh.mjs) ----------
// Solo para cruzar y completar: si la marcha ya está (título comparable + compositor), su ficha se cita y completa formación,
// año y capital de la dedicatoria. Las que no están solo entran si la dedicatoria de su ficha nombra una hermandad del portal.
// Interruptores para subir por bloques: SIN_CYH=1, SIN_NUEVAS_PM=1, SIN_REPERTORIO=1 dejan fuera esas importaciones
const CYH = process.env.SIN_CYH ? null : leer(path.join(RAIZ, 'auditoria', 'cyh-marchas.json'), null);
const urlCyh = (id) => `https://www.cofradiasyhermandades.es/fichamarcha.php?mm=${id}`;
const tituloCyh = (t) => { const s = String(t || '').replace(/^[¡!¿?«»"'\s]+|[¡!¿?«»"'\s]+$/g, (m) => m.trim()).trim(); return s === s.toUpperCase() ? s.toLowerCase().replace(/(^|[\s(¡¿«"'])(\p{L})/gu, (m, a, b) => a + b.toUpperCase()).replace(/\b(De|Del|La|Las|Los|El|Y|E|En|A|Al|Su|Sus|Mi|Tu)\b(?!$)/g, (w, x, i) => (i ? w.toLowerCase() : w)) : s; };
const cyhSinCasar = [];
if (CYH) for (const [cap, v] of Object.entries(CYH.capitales)) for (const x of v.marchas) {
  if (!x.titulo) continue;
  const r = (porTituloR.get(nt(x.titulo)) || []).find((y) => mismoAutor(y.autor, x.autor));
  if (!r) { cyhSinCasar.push({ ...x, capital: cap }); continue; }
  fuente(r, 'titulo', 'cyh', urlCyh(x.id)); if (x.autor) fuente(r, 'autor', 'cyh');
  if (x.formacion.length === 1) { if (!r.formacion) { r.formacion = x.formacion[0]; fuente(r, 'formacion', 'cyh'); } else if (norm(r.formacion) === norm(x.formacion[0])) fuente(r, 'formacion', 'cyh'); }
  if (/^\d{4}$/.test(x.anio)) r._anios = [...(r._anios || []), { v: x.anio, f: 'cyh', url: urlCyh(x.id) }];
  (r._ciudadesCyh ||= new Set()).add(cap);
  const f = CYH.fichas && CYH.fichas[x.id];
  if (f && f.dedicatoria) r._deds = [...(r._deds || []), { texto: f.dedicatoria, loc: CAP[cap], f: 'cyh', url: urlCyh(x.id) }];
}
// Marchas que no teníamos: entran solo si su ficha (leída con --fichas) dedica la marcha a una hermandad del portal
if (CYH) for (const x of cyhSinCasar) {
  const f = CYH.fichas && CYH.fichas[x.id];
  if (!f || !f.dedicatoria) continue;
  const h = (() => { const { top, cand } = mejorHermandad(f.dedicatoria, x.capital); return top && cand.length === 1 ? cand[0] : null; })();
  if (!h || clasifica(f.dedicatoria, CAP[x.capital], h).e !== 'casa') continue;
  const titulo = tituloCyh(x.titulo);
  const r = nuevo({ slug: darSlug(titulo + ' ' + x.autor), titulo, autor: x.autor, formacion: x.formacion.length === 1 ? x.formacion[0] : '' });
  fuente(r, 'titulo', 'cyh', urlCyh(x.id)); if (x.autor) fuente(r, 'autor', 'cyh'); if (r.formacion) fuente(r, 'formacion', 'cyh');
  if (/^\d{4}$/.test(x.anio)) r._anios = [{ v: x.anio, f: 'cyh', url: urlCyh(x.id) }];
  r._deds = [{ texto: f.dedicatoria, loc: CAP[x.capital], f: 'cyh', url: urlCyh(x.id) }];
  r._ciudadesCyh = new Set([x.capital]); r._soloNueva = true;
  (porTituloR.get(nt(titulo)) || porTituloR.set(nt(titulo), []).get(nt(titulo))).push(r);
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
// Marchas de Patrimonio Musical que no teníamos (orden del 27-oct): entran solo si su ficha las dedica a una hermandad del
// portal en su capital (campo de dedicatoria + localidad), con el enlace a la ficha; el resto de la base sigue siendo de uso interno.
if (PM && !process.env.SIN_NUEVAS_PM) {
  const casadas = new Set(R.flatMap((r) => (r._pm || []).map((f) => f.id)));
  const titulo = (t) => tituloCyh(t);
  for (const [id, f] of Object.entries(PM)) {
    if (!f || !f.t || !f.a || casadas.has(id) || !f.d) continue;
    const loc = (f.u || '').split(' - ').length >= 3 ? f.u.split(' - ').pop() : '';
    const cap = CAPN[norm(loc)]; if (!cap) continue;
    const { top, cand } = mejorHermandad(f.d, cap); if (!top || cand.length !== 1) continue;
    const h = cand[0]; if (clasifica(f.d, loc, h).e !== 'casa') continue;
    if ((porTituloR.get(nt(f.t)) || []).some((y) => mismoAutor(y.autor, f.a))) continue;
    const r = nuevo({ slug: darSlug(titulo(f.t) + ' ' + f.a), titulo: titulo(f.t), autor: f.a });
    fuente(r, 'titulo', 'pm', urlPm(id)); fuente(r, 'autor', 'pm');
    r._pm = [{ id, y: f.y, d: f.d, u: f.u }]; r._soloNueva = true;
    (porTituloR.get(nt(f.t)) || porTituloR.set(nt(f.t), []).get(nt(f.t))).push(r);
  }
}

// Segunda pasada de Cofradías y Hermandades para las marchas nuevas de Patrimonio Musical (se crean después del primer cruce):
// formación, año y capital, con su ficha
if (CYH) for (const [cap, v] of Object.entries(CYH.capitales)) for (const x of v.marchas) {
  const r = (porTituloR.get(nt(x.titulo)) || []).find((y) => y._soloNueva && !(y.urls && y.urls.cyh) && mismoAutor(y.autor, x.autor));
  if (!r) continue;
  fuente(r, 'titulo', 'cyh', urlCyh(x.id)); if (x.autor) fuente(r, 'autor', 'cyh');
  if (x.formacion.length === 1 && !r.formacion) { r.formacion = x.formacion[0]; fuente(r, 'formacion', 'cyh'); }
  if (/^\d{4}$/.test(x.anio)) r._anios = [...(r._anios || []), { v: x.anio, f: 'cyh', url: urlCyh(x.id) }];
  (r._ciudadesCyh ||= new Set()).add(cap);
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
      // (sí vale una advocación corriente si la hermandad se llama así: «Virgen de la Amargura de Jaén» → La Amargura de Jaén)
      const unica = (w) => P.hermandades.filter((x) => x.ciudad === h.ciudad && x.slug !== h.slug && (FRASES[x.slug].some((g) => g.includes(w)) || NOMBRES[x.slug].some((g) => g.includes(w)))).length === 0;
      const seLlamaAsi = (w) => NOMBRES[h.slug].some((n) => n.length === 1 && n[0] === w);
      const especifica = porNombre || FRASES[h.slug].some((f) => f.every((w) => tk.has(w)) && (f.length >= 2 || ((!COMUN.has(f[0]) || seLlamaAsi(f[0])) && unica(f[0]))));
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
  const r = R.find((x) => (v.slug ? x.slug === v.slug || x.alias.includes(v.slug) : nt(x.titulo) === nt(v.titulo) && (!v.autor || mismoAutor(x.autor, v.autor)) && (!v.hermandad || (x.dedicatoria && x.dedicatoria.hermandad === v.hermandad) || x._h === v.hermandad || x.retiradas.some((y) => y.hermandad === v.hermandad))));
  if (!r) { sinUsar.push(v); continue; }
  const src = { f: 'rev', url: v.fuente };
  r.urls['rev'] = v.fuente; (r.revision ||= []).push({ fecha: v.fecha, nota: v.nota || '', url: v.fuente, fuente: v.nombre_fuente || '' });
  for (const [c, val] of Object.entries(v.campos || {})) {
    if (c === 'titulo' && r.titulo !== val) r.discrepancias.push({ campo: 'titulo', valores: [{ valor: r.titulo, fuente: (r.fuentes.titulo || [])[0] || '' }], elegido: 'rev' });
    r[c] = val; r.fuentes[c] = ['rev'];
    if (c === 'anio') for (const d of r.discrepancias) if (d.campo === 'anio') d.elegido = 'rev';
  }
  if (v.accion === 'confirmar' || v.accion === 'ligar') {
    const h = HERM[v.hermandad]; const prev = r.dedicatoria && r.dedicatoria.hermandad === h.slug ? r.dedicatoria : null;
    // Otra fuente fiable distinta de la revisada (si la revisión se hizo con la ficha de Patrimonio Musical, PM no cuenta dos veces)
    const host = (u) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return ''; } };
    const otrasF = prev ? (r.fuentes.dedicatoria || []).filter((f) => FIABLE.has(f) && f !== 'rev' && host(r.urls[f === 'mdp' ? 'mdpFicha' : f] || (FUENTES_URL[f] || '')) !== host(v.fuente)) : [];
    r.retiradas = r.retiradas.filter((x) => x.hermandad !== h.slug);
    const antes = r.dedicatoria;
    r.dedicatoria = { hermandad: h.slug, ciudad: h.ciudad, titular: v.titular || (prev && prev.titular) || '', texto: v.texto || (antes && antes.texto) || '', estado: otrasF.length ? 'contrastada' : 'dedicada' };
    // «ligar»: la dedicatoria del catálogo ya decía el texto; la revisión solo resuelve a qué hermandad es, así que su fuente se queda
    if (!prev && !(v.accion === 'ligar' && antes && !antes.hermandad)) r.fuentes.dedicatoria = [];
    // solo_desambigua: la fuente (p. ej. un blog cofrade) solo dice de qué hermandad es; la dedicatoria la siguen dando las fuentes del catálogo
    if (v.solo_desambigua && v.accion === 'ligar' && antes && !antes.hermandad) r.urls.desambigua = v.fuente; else fuente(r, 'dedicatoria', 'rev', v.fuente);
  } else if (v.accion === 'retirar') {
    const hs = v.hermandad || (r.dedicatoria && r.dedicatoria.hermandad);
    if (r.dedicatoria && r.dedicatoria.hermandad === hs) { r.dedicatoria = null; delete r.fuentes.dedicatoria; }
    if (!r.retiradas.some((x) => x.hermandad === hs)) r.retiradas.push({ hermandad: hs, origen: r._o || '', url: r._oUrl || '', motivo: v.nota, fuente: v.fuente });
  }
}

// ---------- 6b. la misma obra en dos fichas (p. ej. tras corregir el título con su fuente): se une en una ----------
// Mismo título comparable, mismo compositor y formación compatible. Queda la ficha ligada a una hermandad (o la de más fuentes);
// la dirección de la otra pasa a alias y redirige.
{
  const peso = (r) => (r.dedicatoria && r.dedicatoria.hermandad ? 100 : 0) + Object.values(r.fuentes).flat().length;
  // título casi literal (solo sin artículo inicial): «Padre Nuestro» y «Señora» no pueden quedar en la misma clave
  const tk = (t) => norm(t).replace(/^(el|la|los|las|a la|al|a)s+/, '');
  const grupos = new Map(); for (const r of R) { const k = tk(r.titulo); if (!k) continue; (grupos.get(k) || grupos.set(k, []).get(k)).push(r); }
  const fuera = new Set();
  for (const g of grupos.values()) {
    if (g.length < 2) continue;
    for (const a of [...g].sort((x, y) => peso(y) - peso(x))) {
      if (fuera.has(a)) continue;
      for (const b of g) {
        if (b === a || fuera.has(b) || !mismoAutor(a.autor, b.autor)) continue;
        if (a.formacion && b.formacion && norm(a.formacion) !== norm(b.formacion)) continue;
        // dos dedicatorias distintas = pueden ser dos obras con el mismo título
        // (una ligada y otra solo con texto: se unen si ese texto no la dedica a otra hermandad u otro lugar)
        if (a.dedicatoria && b.dedicatoria) {
          const ha = a.dedicatoria.hermandad, hb = b.dedicatoria.hermandad;
          if (ha && hb && ha !== hb) continue;
          if (!ha && !hb && norm(a.dedicatoria.texto) !== norm(b.dedicatoria.texto)) continue;
          if ((ha && !hb && b.dedicatoria.texto && clasifica(b.dedicatoria.texto, '', HERM[ha]).e === 'otra') || (hb && !ha && a.dedicatoria.texto && clasifica(a.dedicatoria.texto, '', HERM[hb]).e === 'otra')) continue;
          if (hb && !ha) { const d = a.dedicatoria; a.dedicatoria = b.dedicatoria; b.dedicatoria = d; }
        }
        for (const [c, fs_] of Object.entries(b.fuentes)) for (const f of fs_) fuente(a, c, f);
        for (const [k, u] of Object.entries(b.urls)) a.urls[k] = a.urls[k] || u;
        for (const c of ['anio', 'formacion', 'video', 'tipo', 'estreno', 'lugar', 'detalles']) if (!a[c] && b[c]) a[c] = b[c];
        if (!a.dedicatoria && b.dedicatoria) a.dedicatoria = b.dedicatoria;
        if (b.video && b.video !== a.video) (a.videos ||= []).includes(b.video) || a.videos.push(b.video);
        a.alias.push(b.slug, ...b.alias); a.retiradas.push(...b.retiradas); a.discrepancias.push(...b.discrepancias);
        if (b.revision) (a.revision ||= []).push(...b.revision);
        if (b.partituras) (a.partituras ||= []).push(...b.partituras);
        if (b.repertorio) (a.repertorio ||= []).push(...b.repertorio);
        fuera.add(b); (informe.pares ||= []).push([a.slug, b.slug, a.formacion, b.formacion]);
      }
    }
  }
  for (let i = R.length - 1; i >= 0; i--) if (fuera.has(R[i])) R.splice(i, 1);
  informe.unidas = fuera.size;
}

// ---------- 6c. estado de cada dedicatoria, al final (tras revisiones y uniones): sitios fiables distintos ----------
// La revisión cuenta como el sitio de su enlace: hecha con una ficha de Patrimonio Musical, es Patrimonio Musical.
const clavesFiables = (r) => new Set((r.fuentes.dedicatoria || []).filter((f) => FIABLE.has(f)).map((f) => { if (f !== 'rev') return f; const u = r.urls.rev || ''; let h = ''; try { h = new URL(u).hostname.replace(/^www./, ''); } catch (e) { /* sin url */ } return h === 'patrimoniomusical.com' ? 'pm' : u && u === r.urls.mdpFicha ? 'mdp' : 'rev:' + h; }));
for (const r of R) if (r.dedicatoria && r.dedicatoria.hermandad) { const n = clavesFiables(r).size; r.dedicatoria.estado = n >= 2 ? 'contrastada' : n === 1 ? 'dedicada' : 'sin-verificar'; }

// Las marchas que solo vienen de Patrimonio Musical o de Cofradías y Hermandades entran únicamente si quedan ligadas a una hermandad
for (let i = R.length - 1; i >= 0; i--) if (R[i]._soloNueva && !(R[i].dedicatoria && R[i].dedicatoria.hermandad)) R.splice(i, 1);

// ---------- 6d. capital de la dedicatoria: la de la hermandad; si no, la de Cofradías y Hermandades o la de Patrimonio Musical ----------
for (const r of R) {
  let c = '', fu = '';
  if (r.dedicatoria && r.dedicatoria.hermandad) { c = r.dedicatoria.ciudad; fu = (r.fuentes.dedicatoria || [])[0] || ''; }
  else if (r._ciudadesCyh && r._ciudadesCyh.size === 1) { c = [...r._ciudadesCyh][0]; fu = 'cyh'; }
  else if ((r._pm || []).length === 1 && r._pm[0].u) { const l = norm(r._pm[0].u.split(' - ').pop()); if (CAPN[l]) { c = CAPN[l]; fu = 'pm'; } }
  if (c) { r.ciudad = c; r.fuentes.ciudad = [fu]; }
}
// Fichas de Cofradías y Hermandades que conviene abrir (para la dedicatoria): las que no teníamos y las nuestras sin hermandad
if (CYH) {
  const ids = new Set(cyhSinCasar.map((x) => x.id));
  for (const [cap, v] of Object.entries(CYH.capitales)) for (const x of v.marchas) { const r = (porTituloR.get(nt(x.titulo)) || []).find((y) => mismoAutor(y.autor, x.autor)); if (r && !(r.dedicatoria && r.dedicatoria.hermandad)) ids.add(x.id); }
  for (const id of Object.keys(CYH.fichas || {})) ids.delete(id);
  fs.writeFileSync(path.join(RAIZ, 'auditoria', 'cyh-fichas-pendientes.json'), JSON.stringify([...ids]));
}

// ---------- 7. compositores escritos de varias formas (M7): una sola forma por persona ----------
const claveAutor = (a) => norm(a).split(' ').filter((w) => !['de', 'del', 'la', 'y'].includes(w)).join(' ');
const formas = new Map();
for (const r of R) if (r.autor) { const k = claveAutor(r.autor); const m = formas.get(k) || formas.set(k, new Map()).get(k); m.set(r.autor, (m.get(r.autor) || 0) + 1); }
const tildes = (s) => (s.normalize('NFD').match(/[̀-ͯ]/g) || []).length;
for (const r of R) if (r.autor) { const m = formas.get(claveAutor(r.autor)); const mejor = [...m].sort((a, b) => tildes(b[0]) - tildes(a[0]) || b[1] - a[1])[0][0]; r.autor = mejor; }

// ---------- 7a. las partituras no se citan en la web (Pablo, 27-oct): lo que SOLO dicen ellas no se publica ----------
// Regla firme: todo dato con una fuente que se pueda abrir. Fuera las marchas cuya única fuente es la partitura y, en las demás,
// el año o la dedicatoria que solo da la partitura. El repertorio (qué marchas toca la banda) sí se muestra.
const soloPartitura = (fs_) => (fs_ || []).length > 0 && fs_.every((f) => f === 'part');
const fueraPart = [];
for (let i = R.length - 1; i >= 0; i--) {
  const r = R[i];
  if (soloPartitura(r.fuentes.titulo)) { fueraPart.push(r.slug); R.splice(i, 1); continue; }
  if (soloPartitura(r.fuentes.anio)) { r.anio = ''; delete r.fuentes.anio; }
  if (soloPartitura(r.fuentes.dedicatoria)) { r.dedicatoria = null; delete r.fuentes.dedicatoria; if (soloPartitura(r.fuentes.ciudad)) { delete r.ciudad; delete r.fuentes.ciudad; } }
  for (const c of ['titulo', 'autor', 'anio', 'dedicatoria', 'ciudad']) if (r.fuentes[c]) r.fuentes[c] = r.fuentes[c].filter((f) => f !== 'part');
}
informe.solo_partitura = fueraPart;
// Tras unir fichas: una discrepancia de año heredada sin fuente elegida toma la del año que se muestra (o el año queda en blanco)
for (const r of R) for (const d of r.discrepancias) if (d.campo === 'anio' && !d.elegido && r.anio) { if ((r.fuentes.anio || []).length) d.elegido = r.fuentes.anio.join('+'); else r.anio = ''; }
for (const r of R) if (r.dedicatoria && r.dedicatoria.hermandad) { const n = clavesFiables(r).size; r.dedicatoria.estado = n >= 2 ? 'contrastada' : n === 1 ? 'dedicada' : 'sin-verificar'; }

// ---------- 7b. direcciones ya publicadas que dejan de existir: redirigen a la misma obra o al listado ----------
// Se acumulan de una pasada a otra en «redirecciones». Con --previo <marchas.json> se añaden las de otro modelo (p. ej. el publicado).
const PREVIOS = [PREV]; { const i = process.argv.indexOf('--previo'); if (i > 0) PREVIOS.push(JSON.parse(fs.readFileSync(process.argv[i + 1], 'utf8'))); }
const vivas = new Set(R.flatMap((r) => [r.slug, ...r.alias]));
const redirecciones = {};
for (const pv of PREVIOS) {
  for (const [a, b] of Object.entries(pv.redirecciones || {})) if (!vivas.has(a)) redirecciones[a] = b;
  for (const m of pv.marchas || []) for (const s of [m.slug, ...(m.alias || [])]) {
    if (!s || vivas.has(s) || s in redirecciones) continue;
    const dest = R.find((r) => nt(r.titulo) === nt(m.titulo) && mismoAutor(r.autor, m.autor));
    redirecciones[s] = dest ? dest.slug : '';
  }
}
for (const [a, b] of Object.entries(redirecciones)) if (b && !vivas.has(b)) redirecciones[a] = '';

// ---------- 8. salida ----------
const limpio = R.map((r) => {
  const o = { slug: r.slug, titulo: r.titulo, autor: r.autor, anio: r.anio, formacion: r.formacion, video: r.video, ...(r.ciudad ? { ciudad: r.ciudad } : {}) };
  if (r.videos) o.videos = r.videos.filter((v) => v !== r.video);
  for (const c of ['tipo', 'estreno', 'lugar', 'detalles']) if (r[c]) o[c] = r[c];
  if (r.dedicatoria) o.dedicatoria = r.dedicatoria;
  o.fuentes = r.fuentes; o.urls = r.urls;
  for (const c of ['retiradas', 'discrepancias', 'alias']) if (r[c].length) o[c] = r[c];
  if (r.revision) o.revision = r.revision;
  if (r.partituras) o.partituras = r.partituras;
  if (r.repertorio) o.repertorio = r.repertorio;
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
const FUENTES_URL = {};
const FUENTES = {
  mdp: { nombre: 'Marchas de Procesión (base de datos y ficha de cada vídeo)', url: 'https://www.marchasdeprocesion.com/p/base-de-datos.html', fiable: true },
  pm: { nombre: 'Patrimonio Musical (base de datos de marchas)', url: 'https://www.patrimoniomusical.com/', fiable: true },
  fgr: { nombre: 'Federación de Hermandades y Cofradías de Granada (ficha oficial, «Patrimonio musical»)', url: 'https://www.semanasantagranada.org/', fiable: true, oficial: true },
  wiki: { nombre: 'Wikipedia (sección de marchas de la hermandad)', url: 'https://es.wikipedia.org/', fiable: false },
  foro: { nombre: 'Foro de Patrimonio Musical: «Marchas procesionales de Málaga» (2008)', url: 'https://www.patrimoniomusical.com/foro/viewtopic.php?t=1959', fiable: false },
  cyh: { nombre: 'Cofradías y Hermandades (buscador de marchas)', url: 'https://www.cofradiasyhermandades.es/marchas.php', fiable: true },
  part: { nombre: 'Partituras de la banda, aportadas por Pablo Sánchez', url: '', fiable: true, privada: true },
  bne: { nombre: 'Biblioteca Nacional de España (datos.bne.es, partituras)', url: 'https://datos.bne.es/tema/XX536674.html', fiable: true },
  rev: { nombre: 'Revisión a mano con fuente (web de la hermandad, de la banda o prensa)', url: '', fiable: true, oficial: true },
};
fs.writeFileSync(OUT, '{"generado":' + JSON.stringify(new Date().toISOString().slice(0, 10)) + ',\n"nota":' + JSON.stringify('Modelo único de marchas (tools/unificar-marchas.mjs). Por campo, las fuentes que lo dan; dedicatoria.estado: contrastada (dos fuentes fiables), dedicada (una fiable), sin-verificar (solo foro o Wikipedia). De Patrimonio Musical solo se guarda el enlace.') + ',\n"fuentes":' + JSON.stringify(FUENTES) + ',\n"resumen":' + JSON.stringify(resumen) + ',\n"redirecciones":' + JSON.stringify(redirecciones) + ',\n"marchas":[\n' + limpio.map((m) => JSON.stringify(m)).join(',\n') + '\n]}\n');
fs.mkdirSync(path.join(RAIZ, 'auditoria'), { recursive: true });
fs.writeFileSync(path.join(RAIZ, 'auditoria/marchas-informe.json'), JSON.stringify({ ...informe, revision_sin_usar: sinUsar }, null, 1));
console.log(JSON.stringify(resumen, null, 1));
console.log('retiradas', informe.retiradas.length, '· nuevas', informe.nuevas.length, '· dudas', informe.dudas.length, '· revisiones sin casar', sinUsar.length, PM ? '' : '· (sin la base de Patrimonio Musical: se reutiliza la pasada anterior)');
