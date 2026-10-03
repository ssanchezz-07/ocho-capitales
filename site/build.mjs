// Ocho Capitales: generador del sitio estático (dist/).
// Uso: node build.mjs   (variables opcionales: BASE_PATH="/repo/"  SITE_URL="https://usuario.github.io/repo")
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(DIR, 'dist');
const BASE = (process.env.BASE_PATH || '/').replace(/\/?$/, '/');
const SITE = (process.env.SITE_URL || '').replace(/\/$/, '');
const D = JSON.parse(fs.readFileSync(path.join(DIR, '..', 'portal-cofrade', 'data', 'portal.json'), 'utf8'));
const NEWS_FILE = path.join(DIR, 'data', 'news.json');
const NEWS_RAW = fs.existsSync(NEWS_FILE) ? JSON.parse(fs.readFileSync(NEWS_FILE, 'utf8')) : { items: [], actualizado: 0 };
const BRAND = 'Ocho Capitales';
const TAGLINE = 'La Semana Santa de las ocho capitales andaluzas: qué sale hoy, noticias de cada ciudad y la historia de sus hermandades, bandas e imagineros.';
const TZ = 'Europe/Madrid';

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const u = (p = '') => BASE + String(p).replace(/^\//, '');
const abs = (p) => (SITE ? SITE + '/' + String(p).replace(/^\//, '') : u(p));
const slugify = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

// Noticias: solo imágenes https y sin iconos/emojis de WordPress (no son fotos).
const badImg = (s) => !s || !/^https:/.test(s) || /s\.w\.org\/images\/core\/emoji|gravatar|feeds\.feedburner/.test(s);
const NEWS = { ...NEWS_RAW, items: NEWS_RAW.items.map((n) => ({ ...n, img: badImg(n.img) ? '' : n.img })) };

// Imágenes alojadas en el sitio (WebP 160/480/960 generados con scripts/procesar-imagenes.mjs).
// Si una hermandad o capital tiene entrada en data/imagenes.json, se sirve la copia local en vez de la de Wikimedia.
const IMG_FILE = path.join(DIR, 'data', 'imagenes.json');
const IMGX = fs.existsSync(IMG_FILE) ? JSON.parse(fs.readFileSync(IMG_FILE, 'utf8')) : { hermandades: {}, capitales: {} };
const localImg = (kind, slug, x) => ({ local: true, kind, slug, sizes: x.widths, src: `assets/img/${kind}-${slug}-${x.widths.at(-1)}.webp`, w: x.w, h: x.h, escudo: x.escudo, autor: x.autor, licencia: x.licencia, licurl: x.licurl, pagina: x.pagina });
for (const h of D.hermandades) if (IMGX.hermandades[h.slug]) h.imagen = localImg('h', h.slug, IMGX.hermandades[h.slug]);
for (const c of D.capitales) if (IMGX.capitales[c.slug]) c.imagen = localImg('c', c.slug, IMGX.capitales[c.slug]);

// Salidas adicionales de vísperas (p. ej. la Virgen de los Dolores de la Lanzada de Huelva el Viernes de Dolores):
// entradas virtuales que se listan en su jornada y enlazan a la misma ficha.
const conSalidas = (list) => [...list, ...list.flatMap((h) => (h.salidas || []).map((s, i) => ({ ...h, dia: s.dia, orden: 90 + i, sede: s.sede || h.sede, hora: s.hora || '', extra: s })))];

// Solo desarrollo: PEOR_CASO=1 genera el sitio con datos extremos pero plausibles para comprobar que nada se rompe.
if (process.env.PEOR_CASO) {
  const longest = [...D.hermandades].sort((a, b) => (b.nombre_oficial || '').length - (a.nombre_oficial || '').length);
  D.hermandades.forEach((h, i) => {
    if (i % 4 === 0 && longest[i % 20].nombre_oficial) h.nombre = longest[i % 20].nombre_oficial; // nombre oficial completo como nombre visible
    if (i % 5 === 1) { h.sede = ''; h.titulares = []; h.historia = ''; h.fundacion = ''; h.imagen = null; h.web = ''; h.nombre_oficial = ''; h.paso = ''; h.musica = ''; }
    if (i % 7 === 2) { h.web = 'https://www.hermandaddelsantisimocristodelaexpiracionymariasantisimadelaesperanza.es/inicio/historia-de-la-hermandad/'; h.sede = 'Parroquia de Nuestra Señora de la Asunción y San Juan Bautista (Barrio de San Juan de Aznalfarache, junto a la Plaza de la Constitución)'; }
  });
  D.bandas[0].acompana = []; D.bandas[1].nombre = 'Agrupación Musical Nuestra Señora de los Reyes y Santísimo Cristo de la Buena Muerte de San Juan de Aznalfarache';
  D.imagineros[0].obras = D.imagineros[0].obras.slice(0, 1); D.imagineros[1].obras = []; D.imagineros[1].bio = ''; D.imagineros[1].vida = '';
  NEWS.items.forEach((n, i) => {
    if (i % 3 === 0) n.titulo = 'La Agrupación de Hermandades y Cofradías presenta el cartel, el pregón y el itinerario oficial de la Semana Santa 2027 con importantes novedades en la carrera oficial, los horarios de paso por la Catedral y el acompañamiento musical';
    if (i % 4 === 1) { n.ciudades = ['sevilla', 'cordoba', 'almeria']; n.fuente = 'Agrupación de Hermandades y Cofradías de la Ciudad de Almería'; }
    if (i % 5 === 2) n.img = 'https://example.invalid/imagen-que-no-existe.jpg';
  });
}

// ---------- índices ----------
const CAP = Object.fromEntries(D.capitales.map((c) => [c.slug, c]));
const IMAG = Object.fromEntries(D.imagineros.map((i) => [i.slug, i]));
const BANDA = Object.fromEntries(D.bandas.map((b) => [b.slug, b]));
const HERM = Object.fromEntries(D.hermandades.map((h) => [h.slug, h]));
const DAY_ORDER = D.dias_orden;
const dayIdx = (d) => { const i = DAY_ORDER.indexOf(d); return i < 0 ? 99 : i; };
const imagSlug = (name) => (name ? slugify(name) : '');
const hermsOf = (city) => D.hermandades.filter((h) => h.ciudad === city);
const pages = [];

function write(rel, html) {
  const f = path.join(DIST, rel);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, html);
  if (rel.endsWith('index.html')) pages.push(rel.replace(/index\.html$/, ''));
}

// ---------- jornadas de la Semana Santa (desde la fecha de Pascua) ----------
// off = días respecto al Domingo de Resurrección. La misma lógica vive en site.js para recalcular en el navegador.
const SLOTS = [
  { id: 'visperas', label: 'Vísperas', corto: 'Vísperas', off: -9, span: 2, dias: ['Viernes de Dolores', 'Sábado de Pasión', 'Vísperas'] },
  { id: 'ramos', label: 'Domingo de Ramos', corto: 'Ramos', off: -7, dias: ['Domingo de Ramos'] },
  { id: 'lunes', label: 'Lunes Santo', corto: 'Lunes', off: -6, dias: ['Lunes Santo'] },
  { id: 'martes', label: 'Martes Santo', corto: 'Martes', off: -5, dias: ['Martes Santo'] },
  { id: 'miercoles', label: 'Miércoles Santo', corto: 'Miércoles', off: -4, dias: ['Miércoles Santo'] },
  { id: 'jueves', label: 'Jueves Santo', corto: 'Jueves', off: -3, dias: ['Jueves Santo', 'Jueves Santo y Madrugada'] },
  { id: 'madruga', label: 'Madrugá', corto: 'Madrugá', off: -2, dias: ['Madrugá'] },
  { id: 'viernes', label: 'Viernes Santo', corto: 'Viernes', off: -2, dias: ['Viernes Santo'] },
  { id: 'sabado', label: 'Sábado Santo', corto: 'Sábado', off: -1, dias: ['Sábado Santo'] },
  { id: 'resurreccion', label: 'Domingo de Resurrección', corto: 'Resurrección', off: 0, dias: ['Domingo de Resurrección'] },
];
function easter(y) { const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451), mo = Math.floor((h + l - 7 * m + 114) / 31), da = ((h + l - 7 * m + 114) % 31) + 1; return Date.UTC(y, mo - 1, da); }
function madridNow() {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', hourCycle: 'h23' }).formatToParts(new Date()).map((x) => [x.type, x.value]));
  return { y: +p.year, m: +p.month, d: +p.day, h: +p.hour };
}
function pickSlot({ y, m, d, h }) {
  const today = Date.UTC(y, m - 1, d);
  let off = Math.round((today - easter(y)) / 864e5);
  if (off >= -9 && off <= 0) {
    const id = off <= -8 ? 'visperas' : off === -2 ? (h < 7 ? 'madruga' : 'viernes') : SLOTS.find((s) => s.off === off).id;
    return { id, hoy: true, year: y, days: 0 };
  }
  const yy = off > 0 ? y + 1 : y;
  return { id: 'ramos', hoy: false, year: yy, days: Math.round((easter(yy) - 7 * 864e5 - today) / 864e5) };
}
const fmtDay = (ms, opts) => new Intl.DateTimeFormat('es-ES', { timeZone: 'UTC', ...opts }).format(new Date(ms));
function slotDate(s, year) {
  const e = easter(year);
  if (s.span) return `${fmtDay(e + s.off * 864e5, { day: 'numeric' })} y ${fmtDay(e + (s.off + 1) * 864e5, { day: 'numeric', month: 'long' })}`;
  return fmtDay(e + s.off * 864e5, { day: 'numeric', month: 'long' });
}

// ---------- iconos (trazo 1.75, cuadrícula 24) ----------
const IC = {
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>',
  home: '<path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1z"/>',
  news: '<path d="M5 4h11a1 1 0 0 1 1 1v14a2 2 0 0 0 2 2H6a2 2 0 0 1-2-2V5a1 1 0 0 1 1-1z"/><path d="M17 9h2a1 1 0 0 1 1 1v9a2 2 0 0 1-2 2"/><path d="M8 8h5M8 12h5M8 16h3"/>',
  cal: '<rect x="3.5" y="5" width="17" height="15.5" rx="1.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  more: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  star: '<path d="m12 3.5 2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.8l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z"/>',
  share: '<path d="M12 15V4M8 8l4-4 4 4"/><path d="M5 12v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7"/>',
  pin: '<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>',
  out: '<path d="M14 5h5v5M19 5l-8 8"/><path d="M17 14v4a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h4"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  back: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
};
const icon = (n, cls = 'oc-i') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${IC[n]}</svg>`;

// Estrella de ocho puntas (dos cuadrados): una punta por capital.
const MARK_INNER = '<rect width="40" height="40" rx="9" fill="#2b1340"/><g fill="none" stroke="#d6b263" stroke-width="2"><rect x="11.5" y="11.5" width="17" height="17"/><rect x="11.5" y="11.5" width="17" height="17" transform="rotate(45 20 20)"/></g><circle cx="20" cy="20" r="2.6" fill="#d6b263"/>';
const LOGO = `<svg class="oc-mark" viewBox="0 0 40 40" aria-hidden="true" focusable="false">${MARK_INNER}</svg>`;
const WORDMARK = `${LOGO}<span class="oc-wordmark">Ocho <span>Capitales</span></span>`;

// ---------- imágenes ----------
// Las miniaturas de Wikimedia admiten otro ancho cambiando «/960px-» en la URL.
const clean = (src) => String(src).split('?')[0];
const wmAt = (src, w) => clean(src).replace(/\/\d+px-/, `/${w}px-`);
const isThumb = (src) => /\/\d+px-/.test(clean(src));
const localUrl = (im, w) => `assets/img/${im.kind}-${im.slug}-${w}.webp`;
// Ancho más pequeño disponible que cubre la mayor de las medidas pedidas (evita descargar 960 px para una miniatura).
const localSet = (im, widths) => { const max = Math.max(...widths); const cut = im.sizes.findIndex((x) => x >= max); return im.sizes.slice(0, cut < 0 ? im.sizes.length : cut + 1); };
const ogOf = (im) => (!im ? '' : im.local ? abs(localUrl(im, im.sizes.at(-1))) : isThumb(im.src) ? wmAt(im.src, 960) : clean(im.src));
function imgTag(im, alt, { cls = '', sizes = '(max-width: 640px) 100vw, 33vw', widths = [330, 500, 960], eager = false } = {}) {
  if (!im) return '';
  if (im.local) {
    const set = localSet(im, widths);
    const pick = set.find((x) => x >= 480) || set.at(-1);
    return `<img src="${u(localUrl(im, pick))}" srcset="${set.map((x) => `${u(localUrl(im, x))} ${x}w`).join(', ')}" sizes="${sizes}" alt="${esc(alt)}" width="${im.w}" height="${im.h}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async"${cls ? ` class="${cls}"` : ''}>`;
  }
  const w = im.w || 900; const h = im.h || 600;
  const srcset = isThumb(im.src) ? ` srcset="${widths.map((x) => `${esc(wmAt(im.src, x))} ${x}w`).join(', ')}" sizes="${sizes}"` : '';
  const src = isThumb(im.src) ? wmAt(im.src, widths[Math.min(1, widths.length - 1)]) : clean(im.src);
  return `<img src="${esc(src)}"${srcset} alt="${esc(alt)}" width="${w}" height="${h}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" crossorigin="anonymous" referrerpolicy="no-referrer"${cls ? ` class="${cls}"` : ''}>`;
}
// Imagen principal (LCP) de fichas y capitales: conexión previa y precarga con el mismo srcset que la etiqueta.
function heroPreload(im, sizes, widths) {
  if (!im) return '';
  if (im.local) { const set = localSet(im, widths); return `<link rel="preload" as="image" href="${u(localUrl(im, set.find((x) => x >= 480) || set.at(-1)))}" imagesrcset="${set.map((x) => `${u(localUrl(im, x))} ${x}w`).join(', ')}" imagesizes="${sizes}" fetchpriority="high">`; }
  let origin = ''; try { origin = new URL(im.src).origin; } catch (e) { return ''; }
  const set = isThumb(im.src) ? ` imagesrcset="${widths.map((x) => `${esc(wmAt(im.src, x))} ${x}w`).join(', ')}" imagesizes="${sizes}"` : '';
  const href = isThumb(im.src) ? wmAt(im.src, widths[Math.min(1, widths.length - 1)]) : clean(im.src);
  return `<link rel="preconnect" href="${origin}" crossorigin><link rel="preload" as="image" href="${esc(href)}"${set} fetchpriority="high" crossorigin="anonymous">`;
}
function credit(im) {
  if (!im) return '';
  const lic = im.licurl ? `<a href="${esc(im.licurl)}" rel="license noopener" target="_blank">${esc(im.licencia)}</a>` : esc(im.licencia);
  return `Imagen: ${esc(im.autor || 'autor en Wikimedia Commons')}, ${lic}, vía <a href="${esc(im.pagina)}" target="_blank" rel="noopener">Wikimedia Commons</a>`;
}

const cityTag = (slug) => (CAP[slug] ? `<span class="oc-city" style="--c:${CAP[slug].color}">${esc(CAP[slug].nombre)}</span>` : '');
const favBtn = (type, slug, name) => `<button class="oc-btn is-quiet oc-fav" type="button" data-fav="${type}:${slug}" data-name="${esc(name)}" aria-pressed="false">${icon('star')}<span class="oc-fav-txt">Guardar</span></button>`;
const shareBtn = () => `<button class="oc-btn is-quiet" type="button" data-share>${icon('share')}<span>Compartir</span></button>`;
const timeTag = (ts) => { const d = new Date(ts); return `<time datetime="${d.toISOString()}" data-ago>${fmtDay(d.getTime() + 0, { day: 'numeric', month: 'short' })}</time>`; };

function entryHerm(h, extra = '') {
  const c = CAP[h.ciudad];
  const im = h.imagen;
  const thumb = im ? `<div class="oc-entry-img${im.escudo ? ' is-escudo' : ''}">${imgTag(im, '', { sizes: '72px', widths: [120, 250] })}</div>` : `<div class="oc-entry-img is-blank" style="--c:${c.color}" aria-hidden="true"><span>${esc(h.nombre.replace(/^(La|El|Los|Las)\s+/i, '').charAt(0))}</span></div>`;
  const tit = h.titulares.slice(0, 2).map((t) => t.nombre.split(',')[0]).join(' · ');
  return `<li class="oc-entry"${extra}>${thumb}<div class="oc-entry-body"><h3 class="oc-entry-title"><a href="${u('hermandad/' + h.slug + '/')}">${esc(h.nombre)}</a></h3><p class="oc-entry-meta">${cityTag(h.ciudad)}<span>${esc(h.dia)}</span></p>${tit || h.sede ? `<p class="oc-entry-sub">${esc(tit || h.sede)}</p>` : ''}</div></li>`;
}
function entrySimple(href, title, sub, cities, extra = '') {
  return `<li class="oc-entry is-text"${extra}><div class="oc-entry-body"><h3 class="oc-entry-title"><a href="${href}">${esc(title)}</a></h3>${sub ? `<p class="oc-entry-sub">${esc(sub)}</p>` : ''}${cities && cities.length ? `<p class="oc-entry-meta">${cities.map(cityTag).join('')}</p>` : ''}</div></li>`;
}
// Noticia: titular, medio, hora relativa y capital. Siempre enlaza al medio original.
// Iniciales del medio para el recuadro de las noticias sin foto (o con foto rota): «Diario de Sevilla» → DS, «ABC» → ABC.
const STOPW = new Set(['el', 'la', 'los', 'las', 'de', 'del', 'y', 'en']);
function srcMono(f) {
  const w = String(f || '').replace(/[^\p{L}\p{N} ]/gu, ' ').split(/\s+/).filter((x) => x && !STOPW.has(x.toLowerCase()));
  if (!w.length) return '·';
  if (w.length === 1) return /\d|^[A-ZÁÉÍÓÚÑ]{2,5}$/.test(w[0]) ? w[0].slice(0, 5) : w[0].slice(0, 2).toUpperCase();
  return (w[0][0] + w[1][0]).toUpperCase();
}
// Noticia: titular a la izquierda y recuadro fijo a la derecha (foto del medio o sus iniciales), para que todas tengan el mismo ritmo.
function newsItem(n, { img = true, eager = false } = {}) {
  const col = CAP[n.ciudades[0]] ? CAP[n.ciudades[0]].color : '#4a1f6e';
  const pic = img ? `<div class="oc-news-img" style="--c:${col}" aria-hidden="true"><span class="oc-news-mono">${esc(srcMono(n.fuente))}</span>${n.img ? `<img src="${esc(n.img)}" alt="" width="160" height="120" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" referrerpolicy="no-referrer" data-hide-broken>` : ''}</div>` : '';
  return `<article class="oc-news${pic ? ' has-img' : ''}" data-cities="${n.ciudades.join(' ')}">${pic}<div class="oc-news-body"><p class="oc-news-meta">${n.ciudades.map(cityTag).join('')}<span class="oc-news-src">${esc(n.fuente)}</span>${timeTag(n.ts)}</p><h3 class="oc-news-title"><a href="${esc(n.url)}" target="_blank" rel="nofollow noopener noreferrer">${esc(n.titulo)}<span class="oc-sr"> (abre ${esc(n.fuente)} en otra pestaña)</span></a></h3>${n.extracto ? `<p class="oc-news-text">${esc(n.extracto)}</p>` : ''}</div></article>`;
}
const newsFor = (city, n = 6) => NEWS.items.filter((x) => !city || x.ciudades.includes(city)).slice(0, n);

// ---------- agenda cofrade: fechas litúrgicas calculadas + eventos anunciados en las noticias ----------
const TIPOS = { liturgico: 'Calendario litúrgico', magna: 'Magna', extraordinaria: 'Salida extraordinaria', procesion: 'Procesión', traslado: 'Traslado', coronacion: 'Coronación', 'via-crucis': 'Vía crucis', culto: 'Cultos', besamanos: 'Besamanos', concierto: 'Concierto', pregon: 'Pregón', cartel: 'Cartel' };
const GRUPOS = [['', 'Todo'], ['liturgico', 'Litúrgico'], ['salidas', 'Procesiones'], ['via-crucis', 'Vía crucis'], ['cultos', 'Cultos'], ['musica', 'Conciertos'], ['anuncios', 'Pregones y carteles']];
const GRUPO_DE = { liturgico: 'liturgico', magna: 'salidas', extraordinaria: 'salidas', procesion: 'salidas', traslado: 'salidas', coronacion: 'salidas', 'via-crucis': 'via-crucis', culto: 'cultos', besamanos: 'cultos', concierto: 'musica', pregon: 'anuncios', cartel: 'anuncios' };
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const DIAS_SEM = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
const isoDay = (ms) => new Date(ms).toISOString().slice(0, 10);
function eventosLiturgicos(years) {
  const ev = [];
  for (const y of years) {
    const e = easter(y);
    const add = (off, titulo, nota) => ev.push({ fecha: isoDay(e + off * 864e5), tipo: 'liturgico', titulo, nota, ciudad: '' });
    add(-46, 'Miércoles de Ceniza', 'Comienza la Cuaresma.');
    add(-9, 'Viernes de Dolores', 'Vísperas de la Semana Santa.');
    add(-7, 'Domingo de Ramos', 'Comienza la Semana Santa.');
    add(-3, 'Jueves Santo', 'Santos Oficios y, por la noche, la Madrugá.');
    add(-2, 'Viernes Santo', 'Pasión y muerte del Señor.');
    add(0, 'Domingo de Resurrección', 'Termina la Semana Santa.');
    add(60, 'Corpus Christi', 'Procesión del Santísimo en las capitales andaluzas.');
  }
  return ev;
}
// Tipo y fecha a partir del titular y el extracto. Solo se acepta con una fecha concreta y si la noticia es de una capital.
const EV_TIPOS = [['magna', /\bmagna\b/], ['coronacion', /coronacion/], ['extraordinaria', /(salida|procesion|recorrido|itinerario)[^.]{0,40}extraordinari|extraordinari[^.]{0,20}(salida|procesion)/], ['via-crucis', /via ?crucis/], ['traslado', /traslado/], ['besamanos', /besamanos|besapies/], ['culto', /triduo|quinario|novena|septenario|funcion principal/], ['concierto', /concierto/], ['pregon', /pregon/], ['cartel', /cartel (oficial|de la semana santa)|presentacion del cartel|presentara el cartel/], ['procesion', /procesion|procesiona|rosario de la aurora/]];
const EV_NO = /torea|toros|maestranza|futbol|liga |asamblea|cabildo|elecciones|junta de gobierno/;
function eventosNoticias() {
  const ev = new Map();
  for (const n of NEWS.items) {
    if (!n.ciudades || !n.ciudades.length) continue;
    const t = norm(n.titulo + ' . ' + (n.extracto || ''));
    if (EV_NO.test(t)) continue;
    const ty = EV_TIPOS.find(([, r]) => r.test(t)); if (!ty) continue;
    const pub = new Date(n.ts); const pubDay = Date.UTC(pub.getUTCFullYear(), pub.getUTCMonth(), pub.getUTCDate());
    let when = null;
    const m = t.match(/\b(\d{1,2})(?: y \d{1,2})? de (enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\b/);
    if (m && +m[1] >= 1 && +m[1] <= 31) { let d = Date.UTC(pub.getUTCFullYear(), MESES.indexOf(m[2]), +m[1]); if (d < pubDay - 60 * 864e5) d = Date.UTC(pub.getUTCFullYear() + 1, MESES.indexOf(m[2]), +m[1]); when = d; }
    else if (!m) { const w = t.match(/\b(?:este|el proximo|proximo) (lunes|martes|miercoles|jueves|viernes|sabado|domingo)\b/); if (w) { const target = DIAS_SEM.indexOf(w[1]); const diff = (target - new Date(pubDay).getUTCDay() + 7) % 7; when = pubDay + diff * 864e5; } }
    if (when == null || when < pubDay - 3 * 864e5 || when > pubDay + 240 * 864e5) continue;
    const fecha = isoDay(when);
    for (const ciudad of n.ciudades) {
      const k = fecha + '|' + ty[0] + '|' + ciudad;
      const prev = ev.get(k);
      if (prev) { if (prev.fuentes.length < 3 && !prev.fuentes.some((f) => f.url === n.url || f.medio === n.fuente)) prev.fuentes.push({ url: n.url, medio: n.fuente }); continue; }
      ev.set(k, { fecha, tipo: ty[0], titulo: n.titulo, ciudad, fuentes: [{ url: n.url, medio: n.fuente }] });
    }
  }
  return [...ev.values()];
}
function agenda() {
  const now = madridNow();
  const list = [...eventosLiturgicos([now.y - 1, now.y, now.y + 1]), ...eventosNoticias()];
  return list.sort((a, b) => a.fecha.localeCompare(b.fecha) || (a.tipo === 'liturgico' ? -1 : 1));
}
function agendaItem(e) {
  const d = new Date(e.fecha + 'T12:00:00Z').getTime();
  const c = CAP[e.ciudad];
  const link = e.fuentes ? `<a href="${esc(e.fuentes[0].url)}" target="_blank" rel="nofollow noopener noreferrer">${esc(e.titulo)}<span class="oc-sr"> (abre ${esc(e.fuentes[0].medio)})</span></a>` : esc(e.titulo);
  return `<li class="oc-ev" data-grupo="${GRUPO_DE[e.tipo]}" data-ciudad="${e.ciudad}" data-fecha="${e.fecha}"><time class="oc-ev-date" datetime="${e.fecha}"><span>${fmtDay(d, { day: 'numeric' })}</span>${fmtDay(d, { month: 'short' }).replace('.', '')}</time><div class="oc-ev-body"><p class="oc-ev-meta"><span class="oc-ev-tipo is-${GRUPO_DE[e.tipo]}">${TIPOS[e.tipo]}</span>${c ? cityTag(e.ciudad) : '<span>Todas las capitales</span>'}</p><p class="oc-ev-title">${link}</p>${e.nota ? `<p class="oc-ev-note">${esc(e.nota)}</p>` : ''}${e.fuentes ? `<p class="oc-ev-note">Fuente: ${e.fuentes.map((f) => esc(f.medio)).join(', ')}</p>` : ''}</div></li>`;
}

// ---------- maqueta común ----------
const NAV = [['noticias/', 'Noticias'], ['capitales/', 'Capitales'], ['calendario/', 'Calendario'], ['hermandades/', 'Hermandades'], ['bandas/', 'Bandas'], ['imagineros/', 'Imagineros']];
const OG_DEFAULT = 'assets/og.png';

function layout({ title, desc, body, path: p = '', image = '', jsonld = null, active = '', crumbs: cr = null, wide = false, head = '' }) {
  const fullTitle = title ? `${title} | ${BRAND}` : `${BRAND}: Semana Santa de Andalucía hoy, noticias y hermandades`;
  const description = desc || TAGLINE;
  const canonical = abs(p);
  const ogImage = image ? (image.startsWith('http') ? clean(image) : image) : abs(OG_DEFAULT);
  const ld = [jsonld, cr && cr.length > 1 ? { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: cr.map(([l, h], i) => ({ '@type': 'ListItem', position: i + 1, name: l, item: h ? (SITE ? SITE + h.slice(BASE.length - 1) : h) : canonical })) } : null].filter(Boolean);
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(description.slice(0, 300))}">
<link rel="canonical" href="${esc(canonical)}">
<meta name="color-scheme" content="light dark">
<meta name="theme-color" media="(prefers-color-scheme: light)" content="#2b1340">
<meta name="theme-color" media="(prefers-color-scheme: dark)" content="#17101e">
<meta property="og:site_name" content="${BRAND}"><meta property="og:locale" content="es_ES"><meta property="og:type" content="${p.startsWith('hermandad/') || p.startsWith('banda/') || p.startsWith('imaginero/') ? 'article' : 'website'}">
<meta property="og:title" content="${esc(title || BRAND)}"><meta property="og:description" content="${esc(description.slice(0, 200))}"><meta property="og:url" content="${esc(canonical)}"><meta property="og:image" content="${esc(ogImage)}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title || BRAND)}"><meta name="twitter:description" content="${esc(description.slice(0, 200))}"><meta name="twitter:image" content="${esc(ogImage)}">
<link rel="icon" href="${u('assets/icon.svg')}" type="image/svg+xml">
<link rel="icon" href="${u('assets/icon-192.png')}" type="image/png" sizes="192x192">
<link rel="apple-touch-icon" href="${u('assets/apple-touch-icon.png')}">
<link rel="manifest" href="${u('manifest.webmanifest')}">
<link rel="preload" href="${u('assets/fonts/source-sans-3-latin.woff2')}" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="${u('assets/fonts/newsreader-latin.woff2')}" as="font" type="font/woff2" crossorigin>
${head}<link rel="stylesheet" href="${u('assets/site.css')}">
${ld.map((x) => `<script type="application/ld+json">${JSON.stringify(x).replace(/</g, '\\u003c')}</script>`).join('\n')}
<script>try{var t=localStorage.getItem('oc-theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t;var c=localStorage.getItem('oc-city');if(c)document.documentElement.dataset.city=c;}catch(e){}window.OC_BASE=${JSON.stringify(BASE)};${active === 'noticias/' || active === 'calendario/' ? `window.OC_COLORS=${JSON.stringify(Object.fromEntries(D.capitales.map((c) => [c.slug, c.color])))};` : ''}</script>
</head>
<body>
<a class="oc-skip" href="#contenido">Saltar al contenido</a>
<header class="oc-header">
  <div class="oc-wrap oc-header-in">
    <a class="oc-logo" href="${u()}" aria-label="${BRAND}, portada">${WORDMARK}</a>
    <nav class="oc-nav" aria-label="Secciones"><ul>${NAV.map(([h, l]) => `<li><a href="${u(h)}"${active === h ? ' aria-current="page"' : ''}>${l}</a></li>`).join('')}</ul></nav>
    <div class="oc-tools">
      <button class="oc-searchbtn" type="button" data-open-search aria-label="Buscar">${icon('search')}<span class="oc-searchbtn-txt">Buscar</span><kbd>/</kbd></button>
      <label class="oc-cityselect"><span class="oc-sr">Mi ciudad</span><select data-city-select><option value="">8 capitales</option>${D.capitales.map((c) => `<option value="${c.slug}">${esc(c.nombre)}</option>`).join('')}</select></label>
    </div>
  </div>
</header>
<main id="contenido" class="oc-main${wide ? ' is-wide' : ''}" tabindex="-1">
<div class="oc-wrap">
${cr ? crumbsHtml(cr) : ''}
${body}
</div>
</main>
<footer class="oc-footer">
  <div class="oc-wrap">
    <div class="oc-footer-grid">
      <div class="oc-footer-brand"><a class="oc-logo" href="${u()}">${WORDMARK}</a><p>${TAGLINE}</p></div>
      <nav aria-label="Capitales"><h2>Capitales</h2><ul>${D.capitales.map((c) => `<li><a href="${u('semana-santa/' + c.slug + '/')}">${esc(c.nombre)}</a></li>`).join('')}</ul></nav>
      <nav aria-label="Archivo"><h2>Archivo</h2><ul><li><a href="${u('noticias/')}">Noticias</a></li><li><a href="${u('calendario/')}">Calendario</a></li><li><a href="${u('hermandades/')}">Hermandades</a></li><li><a href="${u('bandas/')}">Bandas</a></li><li><a href="${u('imagineros/')}">Imagineros</a></li><li><a href="${u('favoritos/')}">Mis favoritos</a></li></ul></nav>
      <div><h2>${BRAND}</h2><ul><li><a href="${u('acerca/')}">Fuentes y metodología</a></li><li><a href="${u('acerca/#imagenes')}">Créditos de imágenes</a></li><li><a href="${u('buscar/')}">Buscador</a></li></ul>
        <label class="oc-theme"><span>Tema</span><select data-theme-select><option value="">Automático</option><option value="light">Claro</option><option value="dark">Oscuro</option></select></label></div>
    </div>
    <p class="oc-legal">Las noticias pertenecen a sus medios y se enlazan a la fuente original. Datos de hermandades contrastados con consejos, agrupaciones y federaciones oficiales. Imágenes de Wikimedia Commons con su licencia.</p>
  </div>
</footer>
<nav class="oc-tabbar" aria-label="Accesos rápidos">
  <a href="${u()}"${p === '' ? ' aria-current="page"' : ''}>${icon('home')}<span>Hoy</span></a>
  <a href="${u('noticias/')}"${active === 'noticias/' ? ' aria-current="page"' : ''}>${icon('news')}<span>Noticias</span></a>
  <a href="${u('calendario/')}"${active === 'calendario/' ? ' aria-current="page"' : ''}>${icon('cal')}<span>Calendario</span></a>
  <a href="${u('buscar/')}" data-open-search${p === 'buscar/' ? ' aria-current="page"' : ''}>${icon('search')}<span>Buscar</span></a>
  <button type="button" data-more aria-expanded="false" aria-controls="oc-more">${icon('more')}<span>Más</span></button>
</nav>
<div class="oc-sheet" id="oc-more" hidden data-more-sheet>
  <div class="oc-sheet-panel" role="dialog" aria-modal="true" aria-label="Más secciones">
    <div class="oc-sheet-head"><p class="oc-sheet-title">Secciones</p><button class="oc-iconbtn" type="button" data-more-close aria-label="Cerrar">${icon('x')}</button></div>
    <ul class="oc-sheet-list">${[['capitales/', 'Capitales'], ['hermandades/', 'Hermandades'], ['bandas/', 'Bandas'], ['imagineros/', 'Imagineros'], ['favoritos/', 'Mis favoritos'], ['acerca/', 'Fuentes y metodología']].map(([h, l]) => `<li><a href="${u(h)}">${l}${icon('arrow')}</a></li>`).join('')}</ul>
    <p class="oc-sheet-sub">Capitales</p>
    <ul class="oc-sheet-caps">${D.capitales.map((c) => `<li><a href="${u('semana-santa/' + c.slug + '/')}" style="--c:${c.color}">${esc(c.nombre)}</a></li>`).join('')}</ul>
  </div>
</div>
<div class="oc-search" hidden data-search-overlay>
  <div class="oc-search-box" role="dialog" aria-modal="true" aria-label="Buscar en ${BRAND}">
    <div class="oc-search-row">${icon('search')}<input type="search" placeholder="Hermandad, imagen, banda, imaginero, noticia…" aria-label="Buscar" data-search-input autocomplete="off" autocapitalize="none" spellcheck="false" enterkeyhint="search"><button class="oc-iconbtn" type="button" data-close-search aria-label="Cerrar buscador">${icon('x')}</button></div>
    <div class="oc-search-results" data-search-results aria-live="polite"><p class="oc-hint">Escribe al menos dos letras. Da igual con o sin tildes.</p></div>
  </div>
</div>
<script src="${u('assets/site.js')}" defer></script>
</body>
</html>`;
}

function crumbsHtml(items) {
  return `<nav class="oc-crumbs" aria-label="Migas de pan"><ol>${items.map(([l, h], i) => `<li>${h ? `<a href="${h}">${esc(l)}</a>` : `<span aria-current="page">${esc(l)}</span>`}</li>`).join('')}</ol></nav>`;
}
const facts = (rows, cls = '') => { const r = rows.filter(([, v]) => v && String(v).trim()); return r.length ? `<dl class="oc-facts ${cls}">${r.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${v}</dd></div>`).join('')}</dl>` : ''; };
const section = (title, inner, id = '', cls = '') => (inner && inner.trim() ? `<section class="oc-section ${cls}"${id ? ` id="${id}"` : ''}><h2 class="oc-h2">${title}</h2>${inner}</section>` : '');
const chips = (links) => (links.length ? `<ul class="oc-chips">${links.map(([l, h]) => `<li><a href="${h}">${esc(l)}</a></li>`).join('')}</ul>` : '');
const para = (t) => (t ? `<p>${esc(t)}</p>` : '');
const mapLink = (q) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
const stackTable = (heads, rows) => `<table class="oc-table"><thead><tr>${heads.map((h) => `<th scope="col">${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c, i) => `<td data-l="${esc(heads[i])}">${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`;

// ---------- portada ----------
function todayPanel() {
  const now = madridNow();
  const pick = pickSlot(now);
  const year = pick.year;
  const tabs = SLOTS.map((s) => `<button type="button" role="tab" id="tab-${s.id}" aria-controls="dia-${s.id}" aria-selected="${s.id === pick.id}" tabindex="${s.id === pick.id ? 0 : -1}" data-slot="${s.id}">${esc(s.corto)}</button>`).join('');
  const panels = SLOTS.map((s) => {
    const list = conSalidas(D.hermandades).filter((h) => s.dias.includes(h.dia));
    const groups = D.capitales.map((c) => {
      const hs = list.filter((h) => h.ciudad === c.slug).sort((a, b) => dayIdx(a.dia) - dayIdx(b.dia) || a.orden - b.orden);
      if (!hs.length) return '';
      const anchor = slugify(hs[0].dia);
      return `<section class="oc-group" data-city="${c.slug}" style="--c:${c.color}"><h4 class="oc-group-title"><a href="${u('semana-santa/' + c.slug + '/#' + anchor)}">${esc(c.nombre)}</a><span>${plural(hs.length, 'hermandad', 'hermandades')}</span></h4><ol class="oc-group-list">${hs.map((h) => `<li><a href="${u('hermandad/' + h.slug + '/')}">${esc(h.nombre)}</a>${h.extra ? `<span class="oc-group-day">${esc(h.extra.titulares)}</span>` : s.span ? `<span class="oc-group-day">${esc(h.dia)}</span>` : ''}${h.sede || h.hora ? `<span class="oc-group-sede">${h.hora ? esc(h.hora) + ' h' + (h.sede ? ', ' : '') : ''}${esc(h.sede)}</span>` : ''}</li>`).join('')}</ol>${hs.length > 3 ? `<a class="oc-group-more" href="${u('semana-santa/' + c.slug + '/#' + anchor)}">Ver las ${hs.length} de ${esc(c.nombre)}</a>` : ''}</section>`;
    }).join('');
    return `<div class="oc-daypanel" role="tabpanel" id="dia-${s.id}" aria-labelledby="tab-${s.id}" data-panel="${s.id}" tabindex="0"${s.id === pick.id ? '' : ' hidden'}><h3 class="oc-daytitle">${esc(s.label)} <span data-slot-date="${s.id}">${esc(slotDate(s, year))}</span></h3>${groups}<p class="oc-empty" data-today-empty hidden>Tu ciudad no tiene salidas documentadas esta jornada. Prueba otro día o elige «8 capitales».</p></div>`;
  }).join('');
  const ramos = easter(year) - 7 * 864e5;
  const lead = pick.hoy
    ? `<p class="oc-today-lead" data-today-lead>Orden de paso según la última configuración documentada. Consulta los horarios oficiales de este año.</p>`
    : `<p class="oc-today-lead" data-today-lead>Faltan <strong>${pick.days}</strong> días para el Domingo de Ramos (${fmtDay(ramos, { day: 'numeric', month: 'long' })}). Así sale cada jornada.</p>`;
  return `<section class="oc-today" aria-labelledby="hoy-titulo" data-today data-build-slot="${pick.id}" data-year="${year}">
  <h2 class="oc-today-title" id="hoy-titulo" data-today-title>${pick.hoy ? 'Hoy en la calle' : `Semana Santa ${year}`}</h2>
  ${lead}
  <div class="oc-daytabs" role="tablist" aria-label="Jornadas">${tabs}</div>
  ${panels}
</section>`;
}

function pageHome() {
  const latest = NEWS.items.slice(0, 40);
  const capBlocks = D.capitales.map((c, i) => {
    const n = newsFor(c.slug, 3);
    return `<article class="oc-capblock" style="--c:${c.color}">${c.imagen ? `<div class="oc-capblock-img">${imgTag(c.imagen, 'Semana Santa en ' + c.nombre, { sizes: '(max-width: 640px) 100vw, (max-width: 1100px) 50vw, 25vw', widths: [330, 500] })}</div>` : `<div class="oc-capblock-img is-blank" aria-hidden="true"></div>`}<h3 class="oc-capblock-title"><a href="${u('semana-santa/' + c.slug + '/')}">${esc(c.nombre)}</a></h3><p class="oc-capblock-meta">${plural(hermsOf(c.slug).length, 'hermandad', 'hermandades')}</p>${n.length ? `<ul class="oc-capblock-news">${n.map((x) => `<li><a href="${esc(x.url)}" target="_blank" rel="nofollow noopener noreferrer">${esc(x.titulo)}</a><span>${esc(x.fuente)}, ${timeTag(x.ts)}</span></li>`).join('')}</ul>` : ''}<a class="oc-link" href="${u('noticias/?ciudad=' + c.slug)}">Noticias de ${esc(c.nombre)}${icon('arrow')}</a></article>`;
  }).join('');
  const body = `<h1 class="oc-sr">${BRAND}: la Semana Santa de Andalucía hoy</h1>
<nav class="oc-capstrip" aria-label="Las ocho capitales"><ul>${D.capitales.map((c) => `<li><a href="${u('semana-santa/' + c.slug + '/')}" style="--c:${c.color}">${esc(c.nombre)}</a></li>`).join('')}</ul></nav>
${NEWS.items[0] ? `<p class="oc-breaking"><span class="oc-breaking-label">Última hora</span><a href="${esc(NEWS.items[0].url)}" target="_blank" rel="nofollow noopener noreferrer" data-breaking-link>${esc(NEWS.items[0].titulo)}</a><a class="oc-breaking-more" href="#ultimas-titulo">Más noticias</a></p>` : ''}
<div class="oc-home-top">
${todayPanel()}
<section class="oc-latest" aria-labelledby="ultimas-titulo" data-latest>
  <h2 class="oc-h2" id="ultimas-titulo">Últimas noticias</h2>
  <div class="oc-latest-list" data-latest-list>${latest.map((n) => newsItem(n, { img: false })).join('')}</div>
  <p class="oc-empty" data-latest-empty hidden>Aún no hay noticias recientes de tu ciudad.</p>
  <a class="oc-btn" href="${u('noticias/')}" data-latest-all>Todas las noticias${icon('arrow')}</a>
</section>
${(() => { const N = madridNow(); const hoy = isoDay(Date.UTC(N.y, N.m - 1, N.d)); const ev = agenda().filter((e) => e.fecha >= hoy).slice(0, 3); return ev.length ? `<section class="oc-homeagenda" aria-labelledby="agenda-home"><h2 class="oc-h2" id="agenda-home">Agenda</h2><ol class="oc-evs">${ev.map(agendaItem).join('')}</ol><a class="oc-link" href="${u('calendario/')}">Calendario cofrade completo${icon('arrow')}</a></section>` : ''; })()}
</div>
<section class="oc-section" aria-labelledby="porcapital-titulo"><h2 class="oc-h2" id="porcapital-titulo">Noticias por capital</h2><div class="oc-capgrid">${capBlocks}</div></section>
<section class="oc-section" aria-labelledby="archivo-titulo"><h2 class="oc-h2" id="archivo-titulo">El archivo cofrade</h2>
<ul class="oc-index">
<li><a href="${u('hermandades/')}"><strong>Hermandades</strong><span>${D.hermandades.length} fichas con sede, día de salida, titulares e historia.</span>${icon('arrow')}</a></li>
<li><a href="${u('bandas/')}"><strong>Bandas</strong><span>${D.bandas.length} formaciones y las cofradías a las que acompañan.</span>${icon('arrow')}</a></li>
<li><a href="${u('imagineros/')}"><strong>Imagineros</strong><span>${D.imagineros.length} escultores y sus obras en procesión.</span>${icon('arrow')}</a></li>
<li><a href="${u('calendario/')}"><strong>Calendario</strong><span>Qué sale cada jornada en cada capital, en orden de paso.</span>${icon('arrow')}</a></li>
</ul></section>`;
  write('index.html', layout({ title: '', body, path: '', jsonld: { '@context': 'https://schema.org', '@type': 'WebSite', name: BRAND, url: abs(''), inLanguage: 'es', description: TAGLINE, potentialAction: { '@type': 'SearchAction', target: abs('buscar/') + '?q={q}', 'query-input': 'required name=q' } } }));
}

function pageNews() {
  const body = `<header class="oc-pagehead"><h1 class="oc-title">Noticias cofrades</h1><p class="oc-lead">Titulares de la prensa andaluza, agregadores y webs oficiales de hermandades y consejos. Cada noticia lleva a su medio. Actualizado <time data-ago datetime="${new Date(NEWS.actualizado || Date.now()).toISOString()}">${fmtDay(NEWS.actualizado || Date.now(), { day: 'numeric', month: 'long' })}</time>.</p></header>
<div class="oc-filters" data-news-filters>
  <div class="oc-field oc-field-grow"><label for="nq">Buscar en las noticias</label><input id="nq" type="search" data-f="q" autocomplete="off" enterkeyhint="search"></div>
  <div class="oc-field"><span class="oc-label" id="nciudad">Capital</span><ul class="oc-chips is-filter" data-f="ciudad" aria-labelledby="nciudad"><li><button type="button" data-v="" aria-pressed="true">Todas</button></li>${D.capitales.map((c) => `<li><button type="button" data-v="${c.slug}" aria-pressed="false">${esc(c.nombre)}</button></li>`).join('')}</ul></div>
</div>
<h2 class="oc-sr">Listado de noticias</h2>
<p class="oc-count" data-news-count aria-live="polite">${Math.min(NEWS.items.length, 600)} noticias</p>
<div class="oc-newsgrid" data-news-list>${NEWS.items.slice(0, 24).map((n, i) => newsItem(n, { eager: i < 2 })).join('')}</div>
<p class="oc-empty" data-news-empty hidden>No hay noticias con esos filtros. Prueba con otra capital o borra la búsqueda.</p>
<p class="oc-center"><button class="oc-btn is-quiet" type="button" data-news-more>Cargar más noticias</button></p>`;
  write('noticias/index.html', layout({ title: 'Noticias cofrades de hoy', desc: 'Noticias cofrades de hoy en Sevilla, Málaga, Granada, Córdoba, Cádiz, Huelva, Almería y Jaén: hermandades, bandas, pregones y carteles, con enlace a cada medio.', body, path: 'noticias/', active: 'noticias/', crumbs: [['Portada', u()], ['Noticias', '']] }));
}

function pageCapitales() {
  const body = `<header class="oc-pagehead"><h1 class="oc-title">Las ocho capitales</h1><p class="oc-lead">Cada Semana Santa tiene su forma de andar, su música y su calendario.</p></header><div class="oc-capgrid is-big">${D.capitales.map((c) => `<article class="oc-capblock" style="--c:${c.color}">${c.imagen ? `<div class="oc-capblock-img">${imgTag(c.imagen, 'Semana Santa en ' + c.nombre, { sizes: '(max-width: 640px) 100vw, (max-width: 1100px) 50vw, 25vw', widths: [330, 500] })}</div>` : `<div class="oc-capblock-img is-blank" aria-hidden="true"></div>`}<h2 class="oc-capblock-title"><a href="${u('semana-santa/' + c.slug + '/')}">${esc(c.nombre)}</a></h2><p class="oc-capblock-lema">${esc(c.lema)}</p><p class="oc-capblock-meta">${plural(hermsOf(c.slug).length, 'hermandad', 'hermandades')}</p></article>`).join('')}</div>`;
  write('capitales/index.html', layout({ title: 'Las ocho capitales', desc: 'La Semana Santa de Sevilla, Málaga, Granada, Córdoba, Cádiz, Huelva, Almería y Jaén: historia, hermandades por días y noticias.', body, path: 'capitales/', active: 'capitales/', crumbs: [['Portada', u()], ['Capitales', '']] }));
}

function byDay(list) {
  const g = {};
  for (const h of list) (g[h.dia] = g[h.dia] || []).push(h);
  return Object.entries(g).sort((a, b) => dayIdx(a[0]) - dayIdx(b[0])).map(([d, hs]) => [d, hs.sort((a, b) => a.orden - b.orden)]);
}

function pageCapital(c) {
  const hs = hermsOf(c.slug);
  const groups = byDay(conSalidas(hs));
  const bandas = D.bandas.filter((b) => b.acompana.some((a) => a.ciudad === c.slug));
  const imag = D.imagineros.filter((i) => i.ciudades.includes(c.slug));
  const datos = c.datos.length ? facts(c.datos.map(([k, v]) => [k, esc(v)]), 'is-cols') : '';
  const claves = c.claves.length ? `<ul class="oc-list">${c.claves.map((k) => `<li>${esc(k)}</li>`).join('')}</ul>` : '';
  const news = newsFor(c.slug, 6);
  const body = `<header class="oc-hero${c.imagen ? ' has-img' : ''}" style="--c:${c.color}">
  <div class="oc-hero-text"><h1 class="oc-title oc-title-city">Semana Santa de ${esc(c.nombre)}</h1><p class="oc-lema">${esc(c.lema)}</p><p class="oc-hero-meta">${plural(hs.length, 'hermandad', 'hermandades')} · ${plural(groups.length, 'jornada', 'jornadas')}</p><div class="oc-actions">${favBtn('capital', c.slug, 'Semana Santa de ' + c.nombre)}<a class="oc-btn is-quiet" href="${u('calendario/#cal-' + c.slug)}">${icon('cal')}<span>Calendario</span></a></div></div>
  ${c.imagen ? `<figure class="oc-figure">${imgTag(c.imagen, 'Semana Santa en ' + c.nombre, { sizes: '(max-width: 860px) 100vw, 45vw', widths: [500, 960], eager: true })}<figcaption>${credit(c.imagen)}</figcaption></figure>` : ''}
</header>
<nav class="oc-daynav" aria-label="Jornadas de ${esc(c.nombre)}"><ul>${groups.map(([d]) => `<li><a href="#${slugify(d)}">${esc(d)}</a></li>`).join('')}</ul></nav>
<div class="oc-split">
<div class="oc-split-main">
${groups.map(([d, list]) => `<section class="oc-section oc-day" id="${slugify(d)}"><h2 class="oc-h2">${esc(d)} <small>${plural(list.length, 'hermandad', 'hermandades')}</small></h2><ol class="oc-entries is-ordered">${list.map((h) => entryHerm(h)).join('')}</ol></section>`).join('')}
</div>
<aside class="oc-split-side">
<section class="oc-section"><h2 class="oc-h2">Historia</h2><div class="oc-prose">${c.intro.map(para).join('')}</div></section>
${section('Datos clave', datos)}
${section('Imprescindibles', claves)}
${section('Bandas y música', chips(bandas.map((b) => [b.nombre, u('banda/' + b.slug + '/')])))}
${section('Imagineros con obra en la ciudad', chips(imag.map((i) => [i.nombre, u('imaginero/' + i.slug + '/')])))}
</aside>
</div>
${news.length ? section('Últimas noticias de ' + esc(c.nombre), `<div class="oc-newsgrid">${news.map((n) => newsItem(n)).join('')}</div><p><a class="oc-btn is-quiet" href="${u('noticias/?ciudad=' + c.slug)}">Más noticias de ${esc(c.nombre)}${icon('arrow')}</a></p>`) : ''}`;
  write(`semana-santa/${c.slug}/index.html`, layout({ title: 'Semana Santa de ' + c.nombre, desc: `${c.lema} Las ${hs.length} hermandades de ${c.nombre} por días, con su historia, titulares, imagineros y bandas.`, body, path: `semana-santa/${c.slug}/`, image: ogOf(c.imagen), active: 'capitales/', head: heroPreload(c.imagen, '(max-width: 860px) 100vw, 45vw', [500, 960]), crumbs: [['Portada', u()], ['Capitales', u('capitales/')], [c.nombre, '']] }));
}

function pageHerm(h) {
  const c = CAP[h.ciudad];
  const im = h.imagen;
  const titRows = h.titulares.map((t) => {
    const s = imagSlug(t.imaginero);
    const autor = t.autor ? (s && IMAG[s] ? `<a href="${u('imaginero/' + s + '/')}">${esc(t.autor)}</a>` : esc(t.autor)) : '<span class="oc-muted">Sin documentar</span>';
    return [`<strong>${esc(t.nombre)}</strong>`, autor];
  });
  const bandas = (h.bandas_slugs || []).filter((s) => BANDA[s]).map((s) => [BANDA[s].nombre, u('banda/' + s + '/')]);
  const musicaOf = (h.musica_oficial || []).length ? stackTable(['Paso o titular', 'Formación'], h.musica_oficial.map((m) => [esc(m.titular), esc(m.banda)])) + '<p class="oc-note">Acompañamiento musical oficial de 2026 publicado por la Agrupación.</p>' : '';
  const marchas = (h.marchas || []).length ? stackTable(['Marcha', 'Compositor', 'Año', 'Formación'], h.marchas.map((m) => [esc(m.titulo), esc(m.autor), esc(m.anio), esc(m.tipo)])) : '';
  const isWiki = /wikipedia\.org/.test(h.fuente_url || '');
  let host = ''; try { host = h.fuente_url ? new URL(h.fuente_url).hostname.replace(/^www\./, '') : ''; } catch (e) { host = ''; }
  const fuente = h.fuente_url ? `<p class="oc-note">Fuente de los datos: <a href="${esc(h.fuente_url)}" target="_blank" rel="noopener">${isWiki ? 'artículo de Wikipedia (CC BY-SA 4.0)' : (/agrupacion|consejo|hermandades|federacion|cofradias/.test(host) ? 'ficha oficial en ' : 'información publicada en ') + esc(host)}</a>.</p>` : '';
  const vecinos = D.hermandades.filter((x) => x.ciudad === h.ciudad && x.dia === h.dia).sort((a, b) => a.orden - b.orden);
  const idx = vecinos.findIndex((x) => x.slug === h.slug);
  const prev = vecinos[idx - 1]; const next = vecinos[idx + 1];
  const titList = h.titulares.length ? `<ul class="oc-inline-list">${h.titulares.slice(0, 4).map((t) => `<li>${esc(t.nombre.split(',')[0])}</li>`).join('')}</ul>` : '';
  const webTxt = h.web ? h.web.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '') : '';
  const news = newsFor(c.slug, 3);
  const body = `<article class="oc-ficha">
<header class="oc-hero${im ? ' has-img' : ''}" style="--c:${c.color}">
  <div class="oc-hero-text">
    <h1 class="oc-title${h.nombre.length > 60 ? ' is-long' : ''}">${esc(h.nombre)}</h1>
    ${h.nombre_oficial ? `<p class="oc-subtitle">${esc(h.nombre_oficial)}</p>` : ''}
    ${facts([['Capital', `<a href="${u('semana-santa/' + c.slug + '/')}">${esc(c.nombre)}</a>`], ['Día de salida', `<a href="${u('semana-santa/' + c.slug + '/#' + slugify(h.dia))}">${esc(h.dia)}</a>${vecinos.length > 1 ? ` <span class="oc-muted">(${idx + 1}.ª de ${vecinos.length})</span>` : ''}`], ['Sede', h.sede ? `${esc(h.sede)} <a class="oc-maplink" href="${mapLink(h.sede + ', ' + c.nombre)}" target="_blank" rel="noopener">${icon('pin')}Cómo llegar</a>` : ''], ['Titulares', titList], ['Hora de salida', h.hora ? esc(h.hora) + ' h <span class="oc-muted">(2026)</span>' : ''], ['Otras salidas', (h.salidas || []).map((s) => `${esc(s.dia)}${s.hora ? ', ' + esc(s.hora) + ' h' : ''}: ${esc(s.titulares)}${s.nota ? ` <span class="oc-muted">${esc(s.nota)}</span>` : ''} <a href="${esc(s.fuente)}" target="_blank" rel="noopener">fuente</a>`).join('<br>')], ['Fundación', esc(h.fundacion)], ['Web oficial', h.web ? `<a class="oc-break" href="${esc(h.web)}" target="_blank" rel="noopener">${esc(webTxt)}</a>` : '']], 'is-key')}
    <div class="oc-actions">${favBtn('hermandad', h.slug, h.nombre + ' (' + c.nombre + ')')}${shareBtn()}</div>
  </div>
  ${im ? `<figure class="oc-figure${im.escudo ? ' is-escudo' : ''}">${imgTag(im, im.escudo ? 'Escudo de la hermandad ' + h.nombre : h.nombre + ', Semana Santa de ' + c.nombre, { sizes: '(max-width: 860px) 100vw, 40vw', widths: [500, 960], eager: true })}<figcaption>${credit(im)}</figcaption></figure>` : ''}
</header>
${h.historia ? `<section class="oc-section"><h2 class="oc-h2">Historia</h2><div class="oc-prose">${para(h.historia)}</div></section>` : ''}
${section('Titulares e imagineros', titRows.length ? stackTable(['Titular', 'Autor y año'], titRows) : '')}
${section('Pasos y cortejo', h.paso ? `<div class="oc-prose">${para(h.paso)}</div>` : '')}
${section('Acompañamiento musical', (musicaOf || (h.musica ? `<div class="oc-prose">${para(h.musica)}</div>` : '')) + (bandas.length ? '<h3 class="oc-h3">Bandas en Ocho Capitales</h3>' + chips(bandas) : ''))}
${section('Marchas dedicadas', marchas)}
${fuente}
</article>
${prev || next ? `<nav class="oc-prevnext" aria-label="Hermandades del mismo día">${prev ? `<a class="is-prev" href="${u('hermandad/' + prev.slug + '/')}"><span>Anterior el ${esc(h.dia)}</span><strong>${esc(prev.nombre)}</strong></a>` : '<span></span>'}${next ? `<a class="is-next" href="${u('hermandad/' + next.slug + '/')}"><span>Siguiente el ${esc(h.dia)}</span><strong>${esc(next.nombre)}</strong></a>` : ''}</nav>` : ''}
${news.length ? section('Noticias de ' + esc(c.nombre), `<div class="oc-newsgrid">${news.map((n) => newsItem(n)).join('')}</div>`) : ''}`;
  write(`hermandad/${h.slug}/index.html`, layout({
    title: `${h.nombre} (${c.nombre})`, desc: `${h.nombre}, hermandad de la Semana Santa de ${c.nombre} que procesiona el ${h.dia}${h.sede ? ' desde ' + h.sede : ''}. ${h.historia || ''}`.slice(0, 300), body, path: `hermandad/${h.slug}/`, image: ogOf(im), active: 'hermandades/', head: heroPreload(im, '(max-width: 860px) 100vw, 40vw', [500, 960]),
    crumbs: [['Portada', u()], [c.nombre, u('semana-santa/' + c.slug + '/')], [h.dia, u('semana-santa/' + c.slug + '/#' + slugify(h.dia))], [h.nombre, '']],
    jsonld: { '@context': 'https://schema.org', '@type': 'Organization', name: h.nombre_oficial || h.nombre, alternateName: h.nombre, foundingDate: (String(h.fundacion).match(/\d{4}/) || [])[0], address: h.sede ? { '@type': 'PostalAddress', streetAddress: h.sede, addressLocality: c.nombre, addressRegion: 'Andalucía', addressCountry: 'ES' } : undefined, url: h.web || undefined, image: im ? ogOf(im) : undefined, description: h.historia || undefined },
  }));
}

function pageBanda(b) {
  const porCiudad = D.capitales.map((c) => [c, b.acompana.filter((a) => a.ciudad === c.slug && HERM[a.hermandad_slug])]).filter(([, l]) => l.length);
  const acompana = porCiudad.map(([c, l]) => `<h3 class="oc-h3">${esc(c.nombre)}</h3>${chips(l.map((a) => [`${HERM[a.hermandad_slug].nombre}${a.rol ? ' (' + a.rol + ')' : ''}`, u('hermandad/' + a.hermandad_slug + '/')]))}`).join('');
  const body = `<header class="oc-pagehead"><h1 class="oc-title${b.nombre.length > 60 ? ' is-long' : ''}">${esc(b.nombre)}</h1>${facts([['Tipo', esc(b.tipo)], ['Localidad', esc(b.localidad)], ['Hermandades en el portal', String(b.acompana.filter((a) => HERM[a.hermandad_slug]).length)]], 'is-key')}<div class="oc-actions">${favBtn('banda', b.slug, b.nombre)}${shareBtn()}</div></header>${section('Acompaña a', acompana || '<p class="oc-empty">No hay hermandades del portal asociadas a esta formación.</p>')}<p class="oc-note">Configuración musical según la última información recopilada; las hermandades la cambian con frecuencia de un año a otro.</p>`;
  write(`banda/${b.slug}/index.html`, layout({ title: b.nombre, desc: `${b.nombre} (${b.tipo}${b.localidad ? ', ' + b.localidad : ''}): hermandades a las que acompaña en la Semana Santa andaluza.`, body, path: `banda/${b.slug}/`, active: 'bandas/', crumbs: [['Portada', u()], ['Bandas', u('bandas/')], [b.nombre, '']], jsonld: { '@context': 'https://schema.org', '@type': 'MusicGroup', name: b.nombre, genre: b.tipo, foundingLocation: b.localidad ? { '@type': 'Place', name: b.localidad } : undefined } }));
}

function pageImag(i) {
  const rows = i.obras.map((o) => [`<strong>${esc(o.titular)}</strong>${o.atrib ? ' <span class="oc-muted">(atribución)</span>' : ''}`, HERM[o.hermandad_slug] ? `<a href="${u('hermandad/' + o.hermandad_slug + '/')}">${esc(o.hermandad)}</a>` : esc(o.hermandad), esc(CAP[o.ciudad]?.nombre), esc(o.detalle)]);
  const body = `<header class="oc-pagehead"><h1 class="oc-title">${esc(i.nombre)}</h1>${facts([['Años', esc(i.vida)], ['Escuela', esc(i.escuela)], ['Obras en el portal', String(i.obras.length)], ['Capitales', i.ciudades.map((s) => CAP[s] ? `<a href="${u('semana-santa/' + s + '/')}">${esc(CAP[s].nombre)}</a>` : '').filter(Boolean).join(', ')]], 'is-key')}<div class="oc-actions">${favBtn('imaginero', i.slug, i.nombre)}${shareBtn()}</div></header>${i.bio ? `<section class="oc-section"><h2 class="oc-h2">Biografía</h2><div class="oc-prose">${para(i.bio)}</div>${i.fuente_url ? `<p class="oc-note">Datos de <a href="${esc(i.fuente_url)}" target="_blank" rel="noopener">${/wikipedia/.test(i.fuente_url) ? 'Wikipedia' : 'Wikidata'}</a>.</p>` : ''}</section>` : ''}${section('Obras en la Semana Santa andaluza', rows.length ? stackTable(['Imagen', 'Hermandad', 'Capital', 'Detalle'], rows) : '')}`;
  write(`imaginero/${i.slug}/index.html`, layout({ title: i.nombre, desc: `${i.nombre}${i.vida ? ' (' + i.vida + ')' : ''}: ${i.obras.length} obras en la Semana Santa de Andalucía. ${i.bio || ''}`.slice(0, 300), body, path: `imaginero/${i.slug}/`, active: 'imagineros/', crumbs: [['Portada', u()], ['Imagineros', u('imagineros/')], [i.nombre, '']], jsonld: { '@context': 'https://schema.org', '@type': 'Person', name: i.nombre, jobTitle: 'Imaginero', description: i.bio || undefined } }));
}

function dirFilters(withDay, tipos, total) {
  return `<div class="oc-filters" data-dir-filters>
  <div class="oc-field oc-field-grow"><label for="fq">Filtrar</label><input id="fq" type="search" data-f="q" placeholder="Nombre, sede, titular…" autocomplete="off" enterkeyhint="search"></div>
  <div class="oc-field"><label for="fc">Capital</label><select id="fc" data-f="ciudad"><option value="">Todas</option>${D.capitales.map((c) => `<option value="${c.slug}">${esc(c.nombre)}</option>`).join('')}</select></div>
  ${withDay ? `<div class="oc-field"><label for="fd">Día</label><select id="fd" data-f="dia"><option value="">Todos</option>${DAY_ORDER.filter((d) => D.hermandades.some((h) => h.dia === d)).map((d) => `<option value="${slugify(d)}">${esc(d)}</option>`).join('')}</select></div>` : ''}
  ${tipos ? `<div class="oc-field"><label for="ft">Tipo</label><select id="ft" data-f="tipo"><option value="">Todos</option>${tipos.map((t) => `<option value="${slugify(t)}">${esc(t)}</option>`).join('')}</select></div>` : ''}
</div>
<p class="oc-count" aria-live="polite" data-dir-count>${total} resultados</p>`;
}
const dirEmpty = '<p class="oc-empty" data-dir-empty hidden>Ningún resultado con esos filtros. <button class="oc-textbtn" type="button" data-dir-reset>Quitar filtros</button></p>';
function pageDirHerm() {
  const items = [...D.hermandades].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')).map((h) => entryHerm(h, ` data-q="${esc(norm([h.nombre, h.nombre_oficial, h.sede, CAP[h.ciudad].nombre, h.dia, ...h.titulares.map((t) => t.nombre + ' ' + t.autor)].join(' ')))}" data-ciudad="${h.ciudad}" data-dia="${slugify(h.dia)}"`)).join('');
  const body = `<header class="oc-pagehead"><h1 class="oc-title">Hermandades</h1><p class="oc-lead">Las ${D.hermandades.length} hermandades de las ocho capitales. Filtra por ciudad, día o cualquier dato.</p></header>${dirFilters(true, null, D.hermandades.length)}<ul class="oc-entries" data-dir>${items}</ul>${dirEmpty}`;
  write('hermandades/index.html', layout({ title: 'Hermandades', desc: `Directorio de las ${D.hermandades.length} hermandades de la Semana Santa de las capitales andaluzas, filtrable por ciudad y día.`, body, path: 'hermandades/', active: 'hermandades/', crumbs: [['Portada', u()], ['Hermandades', '']] }));
}
function pageDirBandas() {
  const tipos = [...new Set(D.bandas.map((b) => b.tipo))].sort();
  const items = [...D.bandas].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')).map((b) => { const cs = [...new Set(b.acompana.map((a) => a.ciudad))]; return entrySimple(u('banda/' + b.slug + '/'), b.nombre, [b.tipo, b.localidad].filter(Boolean).join(', '), cs, ` data-q="${esc(norm(b.nombre + ' ' + b.localidad + ' ' + b.acompana.map((a) => a.hermandad).join(' ')))}" data-ciudad="${cs.join(' ')}" data-tipo="${slugify(b.tipo)}"`); }).join('');
  const body = `<header class="oc-pagehead"><h1 class="oc-title">Bandas y formaciones</h1><p class="oc-lead">Cornetas y tambores, agrupaciones musicales y bandas de música que acompañan a las hermandades.</p></header>${dirFilters(false, tipos, D.bandas.length)}<ul class="oc-entries" data-dir>${items}</ul>${dirEmpty}`;
  write('bandas/index.html', layout({ title: 'Bandas', desc: 'Bandas de cornetas y tambores, agrupaciones musicales y bandas de música que acompañan a las hermandades andaluzas.', body, path: 'bandas/', active: 'bandas/', crumbs: [['Portada', u()], ['Bandas', '']] }));
}
function pageDirImag() {
  const items = [...D.imagineros].sort((a, b) => b.obras.length - a.obras.length || a.nombre.localeCompare(b.nombre, 'es')).map((i) => entrySimple(u('imaginero/' + i.slug + '/'), i.nombre, `${plural(i.obras.length, 'obra', 'obras')}${i.vida ? ', ' + i.vida : ''}`, i.ciudades, ` data-q="${esc(norm(i.nombre + ' ' + i.escuela + ' ' + i.obras.map((o) => o.titular + ' ' + o.hermandad).join(' ')))}" data-ciudad="${i.ciudades.join(' ')}"`)).join('');
  const body = `<header class="oc-pagehead"><h1 class="oc-title">Imagineros</h1><p class="oc-lead">Los escultores de las imágenes que procesionan, ordenados por número de obras en el portal.</p></header>${dirFilters(false, null, D.imagineros.length)}<ul class="oc-entries" data-dir>${items}</ul>${dirEmpty}`;
  write('imagineros/index.html', layout({ title: 'Imagineros', desc: 'Los escultores e imagineros de la Semana Santa andaluza y sus obras.', body, path: 'imagineros/', active: 'imagineros/', crumbs: [['Portada', u()], ['Imagineros', '']] }));
}
function pageCalendario() {
  const EV = agenda();
  const N = madridNow();
  const today = isoDay(Date.UTC(N.y, N.m - 1, N.d));
  const proximos = EV.filter((e) => e.fecha >= today).slice(0, 14);
  const data = JSON.stringify(EV.map((e) => ({ f: e.fecha, t: e.tipo, g: GRUPO_DE[e.tipo], n: e.titulo, c: e.ciudad, o: e.nota || '', u: e.fuentes ? e.fuentes[0].url : '', m: e.fuentes ? e.fuentes.map((x) => x.medio).join(', ') : '' }))).replace(/</g, '\\u003c');
  const body = `<header class="oc-pagehead"><h1 class="oc-title">Calendario cofrade</h1><p class="oc-lead">La agenda de cultos, salidas y actos de las ocho capitales, y el orden de paso de cada jornada de la Semana Santa.</p></header>
<section class="oc-agenda" aria-labelledby="agenda-titulo" data-agenda data-hoy="${today}">
  <h2 class="oc-h2" id="agenda-titulo">Agenda cofrade</h2>
  <div class="oc-agenda-filters">
    <div class="oc-field oc-field-grow"><span class="oc-label" id="ag-tipo-l">Tipo</span><ul class="oc-chips is-filter" aria-labelledby="ag-tipo-l" data-agenda-tipo>${GRUPOS.map(([v, l], i) => `<li><button type="button" data-v="${v}" aria-pressed="${i === 0}">${l}</button></li>`).join('')}</ul></div>
    <div class="oc-field"><label for="ag-ciudad">Capital</label><select id="ag-ciudad" data-agenda-ciudad><option value="">Todas</option>${D.capitales.map((c) => `<option value="${c.slug}">${esc(c.nombre)}</option>`).join('')}</select></div>
  </div>
  <div class="oc-agenda-grid">
    <div class="oc-month" data-month hidden>
      <div class="oc-month-nav"><button class="oc-iconbtn" type="button" data-month-prev aria-label="Mes anterior">${icon('back')}</button><p class="oc-month-title" data-month-title aria-live="polite"></p><button class="oc-iconbtn" type="button" data-month-next aria-label="Mes siguiente">${icon('arrow')}</button></div>
      <div class="oc-month-week" aria-hidden="true"><span>L</span><span>M</span><span>X</span><span>J</span><span>V</span><span>S</span><span>D</span></div>
      <div class="oc-month-days" data-month-days></div>
      <p class="oc-month-legend"><span><i class="oc-dot is-liturgico"></i>Litúrgico</span><span><i class="oc-dot is-salidas"></i>Procesiones</span><span><i class="oc-dot is-cultos"></i>Cultos</span><span><i class="oc-dot is-otros"></i>Conciertos y anuncios</span></p>
    </div>
    <div class="oc-agenda-list">
      <div class="oc-agenda-listhead"><h3 class="oc-h3" data-agenda-list-title>Próximos eventos</h3><button class="oc-textbtn" type="button" data-agenda-reset hidden>Ver próximos</button></div>
      <ol class="oc-evs" data-agenda-list>${proximos.map(agendaItem).join('')}</ol>
      <p class="oc-empty" data-agenda-empty hidden>No hay eventos con esos filtros en estas fechas.</p>
    </div>
  </div>
  <p class="oc-note">Las fechas litúrgicas se calculan a partir de la Pascua. El resto se extrae automáticamente de las noticias cada dos horas; confirma siempre en la fuente enlazada.</p>
  <script type="application/json" id="oc-eventos">${data}</script>
  <script type="application/json" id="oc-tipos">${JSON.stringify(TIPOS)}</script>
</section>
<h2 class="oc-h2 oc-section" id="orden-de-paso">Orden de paso por capital</h2>
<p class="oc-note">Según la última configuración documentada. Consulta siempre los horarios oficiales del año.</p>
<div class="oc-captabs" role="tablist" aria-label="Capital" data-cal-tabs>${D.capitales.map((c, i) => `<a role="tab" id="caltab-${c.slug}" href="#cal-${c.slug}" aria-controls="cal-${c.slug}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}" data-city="${c.slug}">${esc(c.nombre)}</a>`).join('')}</div>
${D.capitales.map((c, i) => `<section class="oc-cal" id="cal-${c.slug}" role="tabpanel" aria-labelledby="caltab-${c.slug}" data-cal${i === 0 ? '' : ' hidden'} style="--c:${c.color}"><h2 class="oc-h2"><a href="${u('semana-santa/' + c.slug + '/')}">Semana Santa de ${esc(c.nombre)}</a></h2><div class="oc-cal-days">${byDay(conSalidas(hermsOf(c.slug))).map(([d, list]) => `<section class="oc-cal-day"><h3 class="oc-h3">${esc(d)}</h3><ol class="oc-order">${list.map((h) => `<li><a href="${u('hermandad/' + h.slug + '/')}">${esc(h.nombre)}${h.extra ? ` <small>(${esc(h.extra.titulares)})</small>` : ''}</a>${h.sede || h.hora ? `<span>${h.hora ? esc(h.hora) + ' h' + (h.sede ? ', ' : '') : ''}${esc(h.sede)}</span>` : ''}</li>`).join('')}</ol></section>`).join('')}</div></section>`).join('')}`;
  write('calendario/index.html', layout({ title: 'Calendario cofrade', desc: 'Agenda cofrade de las ocho capitales andaluzas: Cuaresma, Semana Santa, salidas extraordinarias, vía crucis, cultos, conciertos y pregones, y el orden de paso de cada jornada.', body, path: 'calendario/', active: 'calendario/', crumbs: [['Portada', u()], ['Calendario', '']] }));
}
function pageBuscar() {
  const body = `<header class="oc-pagehead"><h1 class="oc-title">Buscar</h1></header><form class="oc-searchform" role="search" data-search-page action="${u('buscar/')}"><label class="oc-label" for="q-page">Hermandad, imagen, imaginero, banda, capital o noticia</label><div class="oc-searchform-row"><input id="q-page" name="q" type="search" autocomplete="off" autocapitalize="none" spellcheck="false" enterkeyhint="search"><button class="oc-btn" type="submit">${icon('search')}<span>Buscar</span></button></div></form><div class="oc-search-results is-page" data-search-page-results aria-live="polite"></div>`;
  write('buscar/index.html', layout({ title: 'Buscar', desc: 'Buscador de hermandades, imágenes, imagineros, bandas, marchas y noticias de la Semana Santa andaluza.', body, path: 'buscar/', crumbs: [['Portada', u()], ['Buscar', '']] }));
}
function pageFavoritos() {
  const body = `<header class="oc-pagehead"><h1 class="oc-title">Mis favoritos</h1><p class="oc-lead">Pulsa «Guardar» en cualquier hermandad, banda, imaginero o capital para tenerla aquí. Se guarda solo en este dispositivo, sin registro.</p></header><ul class="oc-entries" data-fav-list></ul><div class="oc-emptystate" data-fav-empty><p>Aún no has guardado nada.</p><a class="oc-btn" href="${u('hermandades/')}">Explorar hermandades${icon('arrow')}</a></div>`;
  write('favoritos/index.html', layout({ title: 'Mis favoritos', desc: 'Tus hermandades, bandas e imagineros guardados.', body, path: 'favoritos/', crumbs: [['Portada', u()], ['Mis favoritos', '']] }));
}
function pageAcerca() {
  const imgs = D.hermandades.filter((h) => h.imagen).map((h) => `<li><a href="${u('hermandad/' + h.slug + '/')}">${esc(h.nombre)} (${esc(CAP[h.ciudad].nombre)})</a>: ${credit(h.imagen)}</li>`).join('') + D.capitales.filter((c) => c.imagen).map((c) => `<li>${esc(c.nombre)}: ${credit(c.imagen)}</li>`).join('');
  const body = `<header class="oc-pagehead"><h1 class="oc-title">Fuentes y metodología</h1><p class="oc-lead">${BRAND} reúne en un solo sitio la actualidad y la historia de la Semana Santa de las ocho capitales andaluzas.</p></header>
<div class="oc-prose">
<h2 class="oc-h2">De dónde salen los datos</h2><ul>
<li><strong>Málaga:</strong> fichas oficiales de la Agrupación de Cofradías de Semana Santa de Málaga.</li>
<li><strong>Granada:</strong> fichas oficiales de la Real Federación de Hermandades y Cofradías de Granada.</li>
<li><strong>Córdoba:</strong> fichas oficiales de la Agrupación de Hermandades y Cofradías de Córdoba.</li>
<li><strong>Cádiz:</strong> fichas oficiales del Consejo Local de Hermandades y Cofradías.</li>
<li><strong>Huelva:</strong> fichas oficiales del Consejo de Hermandades y Cofradías de la Ciudad de Huelva.</li>
<li><strong>Almería:</strong> fichas y horarios oficiales de la Agrupación de Hermandades y Cofradías (incluido el acompañamiento musical de 2026).</li>
<li><strong>Jaén:</strong> fichas oficiales de la Agrupación de Cofradías y Hermandades de la Ciudad de Jaén.</li>
<li><strong>Sevilla:</strong> el Consejo General no publica fichas por hermandad; se usan los artículos de Wikipedia (CC BY-SA 4.0) para sede, fundación y titulares.</li></ul>
<p>Las reseñas están redactadas a partir de esas fuentes y cada ficha enlaza a la suya. Si detectas un error, prevalece la ficha oficial de la hermandad.</p>
<h2 class="oc-h2">Noticias</h2><p>Se leen automáticamente cada dos horas de ${NEWS.fuentes ? Object.keys(NEWS.fuentes).length : 'decenas de'} fuentes: prensa andaluza, Google Noticias por capital y tema, y webs oficiales de hermandades y consejos. Solo se muestran el titular, un extracto breve y la imagen, siempre con enlace al medio original.</p>
<h2 class="oc-h2" id="imagenes">Créditos de imágenes</h2><p>Todas las imágenes proceden de Wikimedia Commons y se muestran con su autor y licencia.</p><ul class="oc-credits">${imgs}</ul></div>`;
  write('acerca/index.html', layout({ title: 'Fuentes y metodología', desc: `De dónde salen los datos y las noticias de ${BRAND}.`, body, path: 'acerca/', crumbs: [['Portada', u()], ['Fuentes y metodología', '']] }));
}
function page404() {
  write('404.html', layout({ title: 'Página no encontrada', desc: 'Esta página no existe.', body: `<div class="oc-emptystate is-404"><h1 class="oc-title">No encontramos esta página</h1><p>Puede que el enlace haya cambiado. Búscala o vuelve a la portada.</p><form class="oc-searchform" action="${u('buscar/')}" role="search"><label class="oc-label" for="q404">Buscar en ${BRAND}</label><div class="oc-searchform-row"><input id="q404" name="q" type="search" enterkeyhint="search"><button class="oc-btn" type="submit">${icon('search')}<span>Buscar</span></button></div></form><p><a class="oc-link" href="${u()}">${icon('back')}Volver a la portada</a></p></div>`, path: '404.html' }));
}

// ---------- índices y extras ----------
function searchIndex() {
  const idx = [];
  for (const c of D.capitales) idx.push({ t: 'c', n: 'Semana Santa de ' + c.nombre, s: plural(hermsOf(c.slug).length, 'hermandad', 'hermandades'), u: 'semana-santa/' + c.slug + '/', k: norm(c.nombre + ' semana santa capital') });
  for (const h of D.hermandades) idx.push({ t: 'h', n: h.nombre, s: CAP[h.ciudad].nombre + ', ' + h.dia, u: 'hermandad/' + h.slug + '/', k: norm([h.nombre, h.nombre_oficial, h.sede, h.dia, CAP[h.ciudad].nombre, ...h.titulares.map((t) => t.nombre + ' ' + t.autor), ...(h.marchas || []).map((m) => m.titulo)].join(' ')) });
  for (const b of D.bandas) idx.push({ t: 'b', n: b.nombre, s: b.tipo + (b.localidad ? ', ' + b.localidad : ''), u: 'banda/' + b.slug + '/', k: norm(b.nombre + ' ' + b.localidad + ' ' + b.tipo) });
  for (const i of D.imagineros) idx.push({ t: 'i', n: i.nombre, s: plural(i.obras.length, 'obra', 'obras'), u: 'imaginero/' + i.slug + '/', k: norm(i.nombre + ' ' + i.escuela + ' ' + i.obras.map((o) => o.titular).join(' ')) });
  for (const h of D.hermandades) for (const m of h.marchas || []) idx.push({ t: 'm', n: m.titulo, s: `Marcha${m.autor ? ' de ' + m.autor : ''}, ${h.nombre}`, u: 'hermandad/' + h.slug + '/', k: norm(m.titulo + ' ' + m.autor) });
  for (const n of NEWS.items.slice(0, 200)) idx.push({ t: 'n', n: n.titulo, s: n.fuente + ', ' + fmtDay(n.ts, { day: 'numeric', month: 'short' }), u: n.url, d: n.ts, k: norm(n.titulo + ' ' + (n.extracto || '') + ' ' + n.ciudades.map((c) => CAP[c]?.nombre).join(' ')) });
  fs.writeFileSync(path.join(DIST, 'search-index.json'), JSON.stringify(idx));
}
function extras() {
  fs.mkdirSync(path.join(DIST, 'assets'), { recursive: true });
  for (const f of fs.readdirSync(path.join(DIR, 'assets'))) {
    const src = path.join(DIR, 'assets', f), dst = path.join(DIST, 'assets', f);
    if (fs.statSync(src).isDirectory()) fs.cpSync(src, dst, { recursive: true });
    else if (f.endsWith('.css')) fs.writeFileSync(dst, fs.readFileSync(src, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').replace(/\s*([{};,>])\s*/g, '$1').replace(/;}/g, '}').trim());
    else fs.copyFileSync(src, dst);
  }
  fs.writeFileSync(path.join(DIST, 'assets', 'icon.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">${MARK_INNER}</svg>`);
  fs.writeFileSync(path.join(DIST, 'news.json'), JSON.stringify({ actualizado: NEWS.actualizado, items: NEWS.items.slice(0, 600).map(({ h, t, ...n }) => n) }));
  fs.writeFileSync(path.join(DIST, 'manifest.webmanifest'), JSON.stringify({ name: BRAND, short_name: BRAND, description: TAGLINE, lang: 'es', start_url: BASE, scope: BASE, display: 'standalone', background_color: '#f7f3ec', theme_color: '#2b1340', icons: [{ src: u('assets/icon.svg'), sizes: 'any', type: 'image/svg+xml' }, { src: u('assets/icon-192.png'), sizes: '192x192', type: 'image/png' }, { src: u('assets/icon-512.png'), sizes: '512x512', type: 'image/png' }, { src: u('assets/icon-512.png'), sizes: '512x512', type: 'image/png', purpose: 'maskable' }] }));
  fs.writeFileSync(path.join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\n${SITE ? 'Sitemap: ' + SITE + '/sitemap.xml\n' : ''}`);
  if (SITE) fs.writeFileSync(path.join(DIST, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map((p) => `<url><loc>${SITE}/${p}</loc></url>`).join('\n')}\n</urlset>\n`);
  fs.writeFileSync(path.join(DIST, '.nojekyll'), '');
}

fs.rmSync(DIST, { recursive: true, force: true });
pageHome(); pageNews(); pageCapitales(); pageCalendario(); pageDirHerm(); pageDirBandas(); pageDirImag(); pageBuscar(); pageFavoritos(); pageAcerca(); page404();
D.capitales.forEach(pageCapital); D.hermandades.forEach(pageHerm); D.bandas.forEach(pageBanda); D.imagineros.forEach(pageImag);
searchIndex(); extras();
console.log(`${BRAND}: ${pages.length} páginas generadas en dist/ (base ${BASE}).`);
