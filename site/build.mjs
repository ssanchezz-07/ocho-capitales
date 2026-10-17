// Ocho Capitales: generador del sitio estático (dist/).
// Uso: node build.mjs   (variables opcionales: BASE_PATH="/repo/"  SITE_URL="https://usuario.github.io/repo")
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { detectarEventos } from './eventos.mjs';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(DIR, process.env.DIST_DIR || 'dist');
const BASE = (process.env.BASE_PATH || '/').replace(/\/?$/, '/');
const SITE = (process.env.SITE_URL || '').replace(/\/$/, '');
const D = JSON.parse(fs.readFileSync(path.join(DIR, '..', 'portal-cofrade', 'data', 'portal.json'), 'utf8'));
const NEWS_FILE = path.join(DIR, 'data', 'news.json');
const NEWS_RAW = fs.existsSync(NEWS_FILE) ? JSON.parse(fs.readFileSync(NEWS_FILE, 'utf8')) : { items: [], actualizado: 0 };
// Eventos verificados a mano (prioridad sobre los detectados en noticias).
const EVENTOS_FILE = path.join(DIR, '..', 'portal-cofrade', 'data', 'eventos.json');
const EVENTOS_VERIFICADOS = fs.existsSync(EVENTOS_FILE) ? JSON.parse(fs.readFileSync(EVENTOS_FILE, 'utf8')).eventos : [];
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
const MAPA_FILE = path.join(DIR, 'data', 'mapa-andalucia.json');
const MAPA = fs.existsSync(MAPA_FILE) ? JSON.parse(fs.readFileSync(MAPA_FILE, 'utf8')) : null;
const IMG_FILE = path.join(DIR, 'data', 'imagenes.json');
const IMGX = fs.existsSync(IMG_FILE) ? JSON.parse(fs.readFileSync(IMG_FILE, 'utf8')) : { hermandades: {}, capitales: {} };
const localImg = (kind, slug, x) => ({ local: true, kind, slug, sizes: x.widths, src: `assets/img/${kind}-${slug}-${x.widths.at(-1)}.webp`, w: x.w, h: x.h, escudo: x.escudo, autor: x.autor, licencia: x.licencia, licurl: x.licurl, pagina: x.pagina });
for (const h of D.hermandades) if (IMGX.hermandades[h.slug]) h.imagen = localImg('h', h.slug, IMGX.hermandades[h.slug]);
for (const c of D.capitales) if (IMGX.capitales[c.slug]) c.imagen = localImg('c', c.slug, IMGX.capitales[c.slug]);
// Díptico de titulares (petición de Pablo, 2026-10-15): el Cristo y la Virgen juntos, o una foto en la que salgan los dos.
for (const h of D.hermandades) {
  const t = (IMGX.titulares || {})[h.slug]; if (!t) continue;
  const im = (tipo) => (t[tipo] ? { ...localImg('t', `${h.slug}-${tipo}`, t[tipo]), titular: t[tipo].titular } : null);
  h.diptico = { cristo: im('cristo'), virgen: im('virgen'), juntos: im('juntos'), sede: im('sede') };
  // La miniatura de las listas pasa a ser el Cristo (o la Virgen, o el cortejo) en lugar del escudo; la sede, solo si no hay otra
  const lead = h.diptico.juntos || h.diptico.cristo || h.diptico.virgen || (!h.imagen ? h.diptico.sede : null);
  if (lead && (!h.imagen || h.imagen.escudo)) h.imagen = lead;
}

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
// Marchas dedicadas: una por título+compositor+hermandad, con ficha propia
const HABITOS_FILE = path.join(DIR, '..', 'tools', 'sources', 'habitos.json');
const HABITOS = fs.existsSync(HABITOS_FILE) ? JSON.parse(fs.readFileSync(HABITOS_FILE, 'utf8')) : {};
// Colores que aparecen junto a cada prenda en el texto del hábito («túnica negra con escapulario y antifaz verde»)
const COLORES = { negro: '#1b1b1f', negra: '#1b1b1f', blanco: '#f5f3ee', blanca: '#f5f3ee', crema: '#efe3c2', hueso: '#e8dfc8', marfil: '#efe6cf', morado: '#5b2a86', morada: '#5b2a86', purpura: '#6a1b6e', violeta: '#6a3d9a', azul: '#1f3f8f', celeste: '#7fb2e5', verde: '#1f6b3a', rojo: '#b3202a', roja: '#b3202a', granate: '#6e1424', burdeos: '#5a1020', gris: '#8a8a90', amarillo: '#e6b800', oro: '#c9a227', dorado: '#c9a227', marron: '#6b4423', beige: '#d9c8a5', naranja: '#d9741a', rosa: '#d98aa6', plata: '#bfc3c9', vino: '#5a1020', turquesa: '#2a9d9a', cardenal: '#8b1a2b' };
const PRENDAS = ['tunica', 'capa', 'antifaz', 'capirote', 'capuchon', 'botonadura', 'cingulo', 'cinturon', 'escapulario', 'fajin', 'morrion'];
function coloresHabito(texto) {
  const t = norm(texto).replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ');
  const out = []; const vistos = new Set();
  for (const p of PRENDAS) {
    const re = new RegExp('\\b' + p + 's?\\b[^.]{0,36}?\\b(' + Object.keys(COLORES).join('|') + ')\\b', 'g');
    let m; while ((m = re.exec(t))) { const k = p + '|' + m[1]; if (vistos.has(k)) continue; vistos.add(k); out.push({ prenda: p === 'tunica' ? 'túnica' : p === 'cingulo' ? 'cíngulo' : p === 'cinturon' ? 'cinturón' : p === 'capuchon' ? 'capuchón' : p === 'morrion' ? 'morrión' : p === 'fajin' ? 'fajín' : p, color: m[1].replace(/a$/, (x) => x), hex: COLORES[m[1]] }); }
  }
  return out.slice(0, 8);
}
const MARCHAS = []; const MARCHA_SLUG = new Map();
const ESP_FILE = path.join(DIR, '..', 'tools', 'sources', 'marchas-espana.json');
const ESP = fs.existsSync(ESP_FILE) ? JSON.parse(fs.readFileSync(ESP_FILE, 'utf8')) : { marchas: [] };
for (const h of D.hermandades) for (const m of h.marchas || []) {
  let slug = slugify(m.titulo + ' ' + (m.autor || h.slug)); if (!slug) continue;
  let n = 2; const base = slug; while (MARCHAS.some((x) => x.slug === slug)) slug = base + '-' + n++;
  MARCHAS.push({ ...m, slug, h }); MARCHA_SLUG.set(h.slug + '|' + m.titulo + '|' + (m.autor || ''), slug);
}
{
  const nt = (t) => norm(t).replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
  const ta = (t) => new Set(nt(t).split(' ').filter((w) => w.length >= 4));
  const coincide = (a, b) => { const x = ta(a), y = ta(b); for (const w of x) if (y.has(w)) return true; return false; };
  for (const e of ESP.marchas) {
    const hit = MARCHAS.find((m) => !m.video && nt(m.titulo) === nt(e.titulo) && coincide(m.autor, e.autor));
    if (hit) { hit.video = e.video; hit.dedicatoria = hit.dedicatoria || e.dedicatoria; hit.tipo = hit.tipo || e.formacion; hit.estreno = e.estreno; hit.detalles = e.detalles; hit.anio = hit.anio || e.anio; continue; }
    let slug = slugify(e.titulo + ' ' + (e.autor || '')); if (!slug) continue;
    let n = 2; const base = slug; while (MARCHAS.some((x) => x.slug === slug)) slug = base + '-' + n++;
    MARCHAS.push({ titulo: e.titulo, autor: e.autor, anio: e.anio, tipo: e.formacion, video: e.video, dedicatoria: e.dedicatoria, estreno: e.estreno, detalles: e.detalles, lugar: e.lugar, tipoMarcha: e.tipo, slug, h: null, espana: true });
  }
}
const DAY_ORDER = D.dias_orden;
const dayIdx = (d) => { const i = DAY_ORDER.indexOf(d); return i < 0 ? 99 : i; };
const imagSlug = (name) => (name ? slugify(name) : '');
const hermsOf = (city) => D.hermandades.filter((h) => h.ciudad === city);
const pages = [];

import { createHash } from 'node:crypto';
// Política de contenido: solo scripts propios o con el hash exacto de los bloques en línea (tema, base), sin eval ni manejadores en línea.
// Huella del contenido de la CSS y el JS: cambia la URL al publicar para que ni el navegador ni el service worker sirvan una versión vieja.
const HUELLA = Object.fromEntries([['css', 'site.css'], ['js', 'site.js'],['calle', 'calle.js'], ['cunao', 'cunao.js']].map(([k, f]) => [k, createHash('sha256').update(fs.readFileSync(path.join(DIR, 'assets', f))).digest('hex').slice(0, 10)]));
function conCsp(html) {
  const hashes = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => "'sha256-" + createHash('sha256').update(m[1]).digest('base64') + "'");
  const csp = ["default-src 'self'", "script-src 'self' " + [...new Set(hashes)].join(' '), "style-src 'self' 'unsafe-inline'", "img-src 'self' https: data:", "font-src 'self'", "connect-src 'self'", "manifest-src 'self'", "worker-src 'self'", "object-src 'none'", "base-uri 'self'", "form-action 'self'"].join('; ');
  return html.replace('<meta charset="utf-8">', '<meta charset="utf-8">\n<meta http-equiv="Content-Security-Policy" content="' + csp + '">');
}
function write(rel, html) {
  if (rel.endsWith('.html') && html.includes('<meta charset="utf-8">')) html = conCsp(html);
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
const LOGO = '<svg class="oc-mark" viewBox="0 0 40 40" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2.4"><rect x="11" y="11" width="18" height="18"/><rect x="11" y="11" width="18" height="18" transform="rotate(45 20 20)"/><circle cx="20" cy="20" r="2.4" fill="#c79a3b" stroke="none"/></svg>';
const WORDMARK = `${LOGO}<span class="oc-wordmark">Ocho <span>Capitales</span></span>`;
// erCuñao: el cuñao que lo sabe todo de la Semana Santa. Gafas de sol en la cabeza y la medalla de su hermandad al cuello.
const CUNAO_SVG = `<svg class="oc-cunao-cara" viewBox="0 0 64 64" aria-hidden="true" focusable="false"><circle cx="32" cy="32" r="31" fill="#2b1140"/><path d="M14 64c2-11 9-16 18-16s16 5 18 16z" fill="#f4efe6"/><path d="M22 49l10 11 10-11" fill="none" stroke="#6b2fa3" stroke-width="3" stroke-linejoin="round"/><circle cx="32" cy="58" r="4.6" fill="#d9b560" stroke="#7a5a16" stroke-width="1"/><path d="M32 55.4v5.2M29.4 58h5.2" stroke="#7a5a16" stroke-width="1.2"/><ellipse cx="32" cy="33" rx="13.5" ry="15" fill="#e7b48c"/><path d="M18.5 30c0-11 6-16 13.5-16S45.5 19 45.5 30c-2-5-6-8-13.5-8s-11.5 3-13.5 8z" fill="#2a1b14"/><rect x="19.5" y="18.5" width="11" height="6.5" rx="3.2" fill="#1b1024" stroke="#d9b560" stroke-width="1.2"/><rect x="33.5" y="18.5" width="11" height="6.5" rx="3.2" fill="#1b1024" stroke="#d9b560" stroke-width="1.2"/><path d="M30.5 21.5h3" stroke="#d9b560" stroke-width="1.2"/><circle cx="26.5" cy="32.5" r="1.7" fill="#2a1b14"/><circle cx="37.5" cy="32.5" r="1.7" fill="#2a1b14"/><path d="M24 29.3q2.5-1.6 5 0M35 29.3q2.5-1.6 5 0" stroke="#2a1b14" stroke-width="1.3" fill="none" stroke-linecap="round"/><path d="M25.5 39.5q6.5-4 13 0q-6.5 2-13 0z" fill="#2a1b14"/><path d="M27.5 42.5q4.5 3 9 0" stroke="#8a3d2e" stroke-width="1.5" fill="none" stroke-linecap="round"/><circle cx="23" cy="37.5" r="2.2" fill="#e8907a" opacity=".45"/><circle cx="41" cy="37.5" r="2.2" fill="#e8907a" opacity=".45"/></svg>`;

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

// Hora siempre como HH:MM («0:00» → «00:00»)
const fmtHora = (s) => String(s || '').replace(/\b(\d{1,2})[:.](\d{2})\b/g, (_, a, b) => a.padStart(2, '0') + ':' + b);
function entryHerm(h, extra = '', enCapital = false) {
  const c = CAP[h.ciudad];
  // En la página de su capital, capital y día ya se saben: la fila dice la hora de salida y la sede
  if (enCapital) {
    const im = h.imagen;
    const thumb = im ? `<div class="oc-entry-img${im.escudo ? ' is-escudo' : ''}">${imgTag(im, '', { sizes: '72px', widths: [120, 250] })}</div>` : `<div class="oc-entry-img is-blank" style="--c:${c.color};--c-plate:${fondoLegible(c.color)}" aria-hidden="true"><span>${esc(h.nombre.replace(/^(La|El|Los|Las)\s+/i, '').charAt(0))}</span></div>`;
    const tit = h.titulares.slice(0, 2).map((t) => t.nombre.split(',')[0]).join(' · ');
    const meta = [h.hora ? fmtHora(h.hora) + ' h' : '', h.sede].filter(Boolean).map(esc).join(' · ');
    return `<li class="oc-entry"${extra}>${thumb}<div class="oc-entry-body"><h3 class="oc-entry-title"><a href="${u('hermandad/' + h.slug + '/')}">${esc(h.nombre)}</a></h3>${meta ? `<p class="oc-entry-sub is-hora">${meta}</p>` : ''}${tit ? `<p class="oc-entry-sub">${esc(tit)}</p>` : ''}</div></li>`;
  }
  const im = h.imagen;
  const thumb = im ? `<div class="oc-entry-img${im.escudo ? ' is-escudo' : ''}">${imgTag(im, '', { sizes: '72px', widths: [120, 250] })}</div>` : `<div class="oc-entry-img is-blank" style="--c:${c.color};--c-plate:${fondoLegible(c.color)}" aria-hidden="true"><span>${esc(h.nombre.replace(/^(La|El|Los|Las)\s+/i, '').charAt(0))}</span></div>`;
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
function newsItem(n, { img = true, eager = false, tile = true } = {}) {
  const col = CAP[n.ciudades[0]] ? CAP[n.ciudades[0]].color : '#4a1f6e';
  let pic = img && n.img ? `<div class="oc-news-img" aria-hidden="true"><img src="${esc(n.img)}" alt="" width="160" height="120" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" referrerpolicy="no-referrer" data-hide-broken></div>` : '';
  // Sin foto del medio, la miniatura es la colgadura de su capital (terciopelo y emblema), nunca un hueco.
  if (!pic && tile && CAP[n.ciudades[0]]) pic = `<div class="oc-news-img is-colg" aria-hidden="true" style="--c:${col}"><img src="${u('assets/plates/colgadura-' + n.ciudades[0] + '.webp')}" alt="" width="265" height="971" loading="lazy" decoding="async"></div>`;
  return `<article class="oc-news${pic ? ' has-img' : ''}" data-cities="${n.ciudades.join(' ')}">${pic}<div class="oc-news-body"><p class="oc-news-meta">${n.ciudades.map(cityTag).join('')}<span class="oc-news-src">${esc(n.fuente)}</span>${timeTag(n.ts)}</p><h3 class="oc-news-title"><a href="${esc(n.url)}" target="_blank" rel="nofollow noopener noreferrer">${esc(n.titulo)}<span class="oc-sr"> (abre ${esc(n.fuente)} en otra pestaña)</span></a></h3>${n.extracto ? `<p class="oc-news-text">${esc(n.extracto)}</p>` : ''}</div></article>`;
}
const newsFor = (city, n = 6) => NEWS.items.filter((x) => !city || x.ciudades.includes(city)).slice(0, n);

// ---------- agenda cofrade: fechas litúrgicas calculadas + eventos anunciados en las noticias ----------
const TIPOS = { liturgico: 'Calendario litúrgico', magna: 'Magna', extraordinaria: 'Salida extraordinaria', procesion: 'Procesión', traslado: 'Traslado', coronacion: 'Coronación', 'via-crucis': 'Vía crucis', culto: 'Cultos', acto: 'Acto', besamanos: 'Besamanos', concierto: 'Concierto', pregon: 'Pregón', cartel: 'Cartel' };
const GRUPOS = [['', 'Todo'], ['liturgico', 'Litúrgico'], ['salidas', 'Procesiones'], ['via-crucis', 'Vía crucis'], ['cultos', 'Cultos y actos'], ['musica', 'Conciertos'], ['anuncios', 'Pregones y carteles']];
const GRUPO_DE = { liturgico: 'liturgico', magna: 'salidas', extraordinaria: 'salidas', procesion: 'salidas', traslado: 'salidas', coronacion: 'salidas', 'via-crucis': 'via-crucis', culto: 'cultos', acto: 'cultos', besamanos: 'cultos', concierto: 'musica', pregon: 'anuncios', cartel: 'anuncios' };
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
// Eventos detectados en las noticias (ver eventos.mjs): del texto completo leído en fetch-news (n.ev)
// o, en noticias antiguas, del titular y el extracto. Solo noticias de una capital.
function eventosNoticias() {
  const ev = new Map();
  for (const n of NEWS.items) {
    if (!n.ciudades || !n.ciudades.length) continue;
    const found = n.ev ? n.ev.map((e) => ({ fecha: e.f, tipo: e.t, frase: e.s })) : detectarEventos(n.titulo + '. ' + (n.extracto || ''), n.ts);
    const multi = found.length > 1; // artículo con varias fechas (p. ej. «todas las extraordinarias del otoño»): se titula con la frase
    for (const e of found) {
      for (const ciudad of n.ciudades) {
        const k = e.fecha + '|' + GRUPO_DE[e.tipo] + '|' + ciudad;
        const prev = ev.get(k);
        if (prev) { if (prev.fuentes.length < 3 && !prev.fuentes.some((f) => f.url === n.url || f.medio === n.fuente)) prev.fuentes.push({ url: n.url, medio: n.fuente }); continue; }
        ev.set(k, { fecha: e.fecha, tipo: e.tipo, titulo: multi ? e.frase : n.titulo, ciudad, fuentes: [{ url: n.url, medio: n.fuente }] });
      }
    }
  }
  return [...ev.values()];
}
function eventosVerificados() {
  return EVENTOS_VERIFICADOS.map((e) => ({ fecha: e.fecha, hora: e.hora || '', tipo: e.tipo, titulo: e.titulo, ciudad: e.ciudad, nota: e.nota || '', fuentes: e.fuentes, verificado: true }));
}
// Agendas de terceros (tools/agenda-externa.mjs): InfoCofrade, El Itinerario y agendas semanales de prensa. Salen como «detectado».
const AGENDA_EXT_FILE = path.join(DIR, '..', 'tools', 'sources', 'agenda-externa.json');
const EXT_ORDEN = { 'Diario SUR': 0, 'La Opinión de Málaga': 0, InfoCofrade: 1, 'El Itinerario': 2 };
const STOPW_EV = new Set(['del', 'las', 'los', 'con', 'por', 'una', 'procesion', 'extraordinaria', 'nuestra', 'nuestro', 'senora', 'senor', 'virgen', 'santisima', 'maria', 'padre', 'jesus', 'dia', 'triduo', 'funcion', 'solemne', 'honor', 'ntra', 'sra', 'stma', 'stmo', 'cristo', 'traslado', 'vuelta', 'ida', 'regreso', 'besamanos', 'rosario', 'cultos', 'primer', 'segundo', 'tercer', 'principal', 'misa', 'hermandad', 'cofradia', 'este', 'esta', 'estos', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'itinerario', 'horario', 'horarios', 'recorrido', 'hora', 'horas', 'gloria', 'patrona', 'patron', 'calles', 'almeria', 'cadiz', 'cordoba', 'granada', 'huelva', 'jaen', 'malaga', 'sevilla']);
const sigEv = (t) => new Set(norm(t).replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter((w) => w.length >= 3 && !STOPW_EV.has(w)));
const mismoActo = (a, b) => { if (a.fecha !== b.fecha || a.ciudad !== b.ciudad || GRUPO_DE[a.tipo] !== GRUPO_DE[b.tipo]) return false; const x = sigEv(a.titulo), y = sigEv(b.titulo); let n = 0; for (const w of x) if (y.has(w)) n++; return x.size && y.size && n / Math.min(x.size, y.size) >= 0.5; };
function eventosExternos(previos) {
  if (!fs.existsSync(AGENDA_EXT_FILE)) return [];
  const raw = JSON.parse(fs.readFileSync(AGENDA_EXT_FILE, 'utf8')).eventos.filter((e) => GRUPO_DE[e.tipo] && CAP[e.ciudad]);
  // Las agendas dan el acto en pocas palabras; de la prensa solo valen los titulares cortos (una frase larga es una noticia, no un acto).
  const AGENDAS = new Set(['InfoCofrade', 'El Itinerario', 'Andalucía Información', 'Diario SUR', 'Diario Sur', 'La Opinión de Málaga', 'Real Federación de Hermandades y Cofradías de Granada']);
  for (let i = raw.length - 1; i >= 0; i--) { const e = raw[i]; if (!AGENDAS.has(e.fuente) && (e.titulo.length > 100 || /^Previous Post|…$|\.\.\.$/.test(e.titulo))) raw.splice(i, 1); }
  raw.sort((a, b) => (EXT_ORDEN[a.fuente] ?? 1) - (EXT_ORDEN[b.fuente] ?? 1));
  const out = [];
  for (const e of raw) {
    const ev = { fecha: e.fecha, hora: e.hora || '', tipo: e.tipo, titulo: e.titulo, ciudad: e.ciudad, nota: e.nota || '', fuentes: [{ url: e.url, medio: e.fuente }], externo: true };
    if (previos.some((p) => mismoActo(p, ev)) || out.some((p) => mismoActo(p, ev))) continue;
    out.push(ev);
  }
  return out;
}
// Municipios andaluces (Wikidata): un acto detectado «de/en <pueblo>» de la misma provincia no es de la capital.
const MUNI_FILE = path.join(DIR, '..', 'tools', 'sources', 'municipios-andalucia.json');
const MUNI = fs.existsSync(MUNI_FILE) ? Object.entries(JSON.parse(fs.readFileSync(MUNI_FILE, 'utf8')).municipios).map(([n, p]) => [' ' + norm(n).replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim() + ' ', p]) : [];
const CRONICA = /\b(en imagenes|las fotos|fotos de|fotogaleria|galeria|video|asi fue|asi vivio|asi se vivio|minuto a minuto|en directo)\b/;
function actoFuera(e) {
  if (e.verificado || e.tipo === 'liturgico') return false;
  const t = ' ' + norm(e.titulo).replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim() + ' ';
  if (CRONICA.test(t)) return true;
  // En conciertos «Banda de <pueblo>» dice de dónde es la banda, no dónde toca: solo cuenta «en <pueblo>».
  const deVale = GRUPO_DE[e.tipo] !== 'musica';
  return MUNI.some(([n, p]) => p === e.ciudad && ((deVale && t.includes(' de' + n)) || t.includes(' en' + n)) && !t.includes(n + 'cruz '));
}
// Títulos de terceros cortados a media palabra: se recortan en un espacio con puntos suspensivos.
const recorta = (t, n = 120) => { t = String(t || '').replace(/\s+/g, ' ').trim(); if (t.length <= n) return t; const c = t.slice(0, n); return c.slice(0, Math.max(c.lastIndexOf(' '), n - 20)).replace(/[\s,;:.-]+$/, '') + '…'; };
function agenda() {
  const now = madridNow();
  const verif = eventosVerificados();
  const clave = (e) => e.fecha + '|' + GRUPO_DE[e.tipo] + '|' + e.ciudad;
  const ya = new Set(verif.map(clave));
  // Las agendas externas suelen traer la hora: si una noticia habla del mismo acto, se queda el de la agenda.
  const externos = eventosExternos(verif).filter((e) => !actoFuera(e));
  const noticias = eventosNoticias().filter((e) => !ya.has(clave(e)) && !actoFuera(e) && !externos.some((x) => mismoActo(x, e)));
  const list = [...eventosLiturgicos([now.y - 1, now.y, now.y + 1]), ...verif, ...noticias, ...externos].map((e) => (e.verificado ? e : { ...e, titulo: recorta(e.titulo), fuentes: e.fuentes && e.fuentes.some((f) => /^https?:\/\//.test(f.url)) ? e.fuentes.filter((f) => /^https?:\/\//.test(f.url)) : undefined }));
  // Dentro de cada día: lo litúrgico primero, luego salidas, vía crucis, cultos y el resto; a igual grupo, por hora y lo verificado antes.
  const GP = { liturgico: 0, salidas: 1, 'via-crucis': 2, cultos: 3, musica: 4, anuncios: 5 };
  const orden = (e) => GP[GRUPO_DE[e.tipo]] ?? 9;
  return list.sort((a, b) => a.fecha.localeCompare(b.fecha) || orden(a) - orden(b) || (a.hora || '99').localeCompare(b.hora || '99') || (b.verificado ? 1 : 0) - (a.verificado ? 1 : 0));
}
// Hermandad a la que se refiere un acto: el nombre de la hermandad aparece entero en el título (o el encabezado «Hermandad: acto» es el comienzo de su nombre), dentro de su capital.
const nombresHerm = D.hermandades.map((h) => ({ h, n: norm(h.nombre).replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim() }));
function hermDeEvento(e) {
  if (!CAP[e.ciudad]) return '';
  const t = ' ' + norm(e.titulo).replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim() + ' ';
  const pre = (e.titulo.split(':')[1] !== undefined ? e.titulo.split(':')[0] : '');
  const pn = pre ? norm(pre).replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim() : '';
  const par = (e.titulo.match(/\(([^()]+)\)[^()]*$/) || [])[1];
  const parn = par ? norm(par).replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim() : '';
  let best = null;
  for (const { h, n } of nombresHerm) {
    if (h.ciudad !== e.ciudad || n.length < 4) continue;
    let sc = 0;
    if (pn && (n === pn || n.startsWith(pn + ' ') || pn.startsWith(n + ' '))) sc = 100 + n.length;
    else if (parn && parn.length >= 3 && (n === parn || n === 'la ' + parn || n === 'el ' + parn || n.endsWith(' ' + parn))) sc = 90 + n.length;
    else if (t.includes(' ' + n + ' ')) sc = n.length;
    if (sc && (!best || sc > best.sc)) best = { h, sc }; else if (sc && best && sc === best.sc) best.dup = true;
  }
  return best && !best.dup ? best.h.slug : '';
}
function agendaItem(e) {
  const d = new Date(e.fecha + 'T12:00:00Z').getTime();
  const c = CAP[e.ciudad];
  const link = e.fuentes ? `<a href="${esc(e.fuentes[0].url)}" target="_blank" rel="nofollow noopener noreferrer">${esc(e.titulo)}<span class="oc-sr"> (abre ${esc(e.fuentes[0].medio)})</span></a>` : esc(e.titulo);
  return `<li class="oc-ev" data-grupo="${GRUPO_DE[e.tipo]}" data-ciudad="${e.ciudad}" data-fecha="${e.fecha}"><time class="oc-ev-date" datetime="${e.fecha}"><span>${fmtDay(d, { day: 'numeric' })}</span>${fmtDay(d, { month: 'short' }).replace('.', '')}</time><div class="oc-ev-body"><p class="oc-ev-meta"><span class="oc-ev-tipo is-${GRUPO_DE[e.tipo]}">${TIPOS[e.tipo]}</span>${c ? cityTag(e.ciudad) : '<span>Todas las capitales</span>'}${e.verificado ? '<span class="oc-ev-ok">Confirmado</span>' : ''}</p><p class="oc-ev-title">${link}</p>${e.nota ? `<p class="oc-ev-note">${esc(e.nota)}</p>` : ''}${e.fuentes ? `<p class="oc-ev-note">Fuente: ${e.fuentes.map((f) => esc(f.medio)).join(', ')}</p>` : ''}</div></li>`;
}

// ---------- maqueta común ----------
const NAV = [['noticias/', 'Noticias'], ['capitales/', 'Capitales'], ['calendario/', 'Calendario'], ['hermandades/', 'Hermandades'], ['bandas/', 'Bandas'], ['marchas/', 'Marchas'], ['imagineros/', 'Imagineros']];
const OG_DEFAULT = 'assets/og.png';

const REPO = 'ssanchezz-07/ocho-capitales';
const issueUrl = (titulo, cuerpo) => `https://github.com/${REPO}/issues/new?title=${encodeURIComponent(titulo)}&body=${encodeURIComponent(cuerpo)}`;
const colabora = (p, t) => /^(hermandad|banda|imaginero|marcha|compositor)\//.test(p)
  ? `<p class="oc-note oc-colabora">¿Falta algún dato o hay un error? <a href="${esc(issueUrl('Corrección: ' + (t || p), 'Página: ' + abs(p) + '\n\n¿Qué hay que corregir o añadir?\n\n\nEnlace a la fuente que lo confirma:\n'))}" target="_blank" rel="noopener">Sugerir una corrección</a> (se abre en GitHub con esta página ya indicada).</p>` : '';
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
<meta name="theme-color" media="(prefers-color-scheme: light)" content="#ffffff">
<meta name="theme-color" media="(prefers-color-scheme: dark)" content="#1e1030">
<meta property="og:site_name" content="${BRAND}"><meta property="og:locale" content="es_ES"><meta property="og:type" content="${p.startsWith('hermandad/') || p.startsWith('banda/') || p.startsWith('imaginero/') ? 'article' : 'website'}">
<meta property="og:title" content="${esc(title || BRAND)}"><meta property="og:description" content="${esc(description.slice(0, 200))}"><meta property="og:url" content="${esc(canonical)}"><meta property="og:image" content="${esc(ogImage)}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title || BRAND)}"><meta name="twitter:description" content="${esc(description.slice(0, 200))}"><meta name="twitter:image" content="${esc(ogImage)}">
<link rel="icon" href="${u('assets/icon.svg')}?v=2" type="image/svg+xml">
<link rel="icon" href="${u('assets/icon-192.png')}?v=2" type="image/png" sizes="192x192">
<link rel="apple-touch-icon" href="${u('assets/apple-touch-icon.png')}?v=2">
<link rel="manifest" href="${u('manifest.webmanifest')}">
${head}<link rel="stylesheet" href="${u('assets/site.css')}?v=${HUELLA.css}">
${ld.map((x) => `<script type="application/ld+json">${JSON.stringify(x).replace(/</g, '\\u003c')}</script>`).join('\n')}
<script>try{var t=localStorage.getItem('oc-theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t;var c=localStorage.getItem('oc-city');if(c)document.documentElement.dataset.city=c;}catch(e){}window.OC_BASE=${JSON.stringify(BASE)};window.OC_COLORS=${JSON.stringify(Object.fromEntries(D.capitales.map((c) => [c.slug, c.color])))};</script>
</head>
<body>
<a class="oc-skip" href="#contenido">Saltar al contenido</a>
<header class="oc-header">
  <div class="oc-wrap oc-header-in">
    <a class="oc-logo" href="${u()}" aria-label="${BRAND}, portada">${WORDMARK}</a>
    <nav class="oc-nav" aria-label="Secciones"><ul>${NAV.map(([h, l]) => `<li><a href="${u(h)}"${active === h ? ' aria-current="page"' : ''}>${l}</a></li>`).join('')}</ul></nav>
    <div class="oc-tools">
      <button class="oc-searchbtn" type="button" data-open-search aria-label="Buscar">${icon('search')}<span class="oc-searchbtn-txt">Buscar</span><kbd>/</kbd></button>
      <select class="oc-cityselect" data-city-select hidden aria-hidden="true" tabindex="-1"><option value="">8 capitales</option>${D.capitales.map((c) => `<option value="${c.slug}">${esc(c.nombre)}</option>`).join('')}</select>
      <button class="oc-citychip" type="button" data-city-open aria-haspopup="dialog" aria-controls="oc-city" aria-expanded="false"><i class="oc-citychip-dot" aria-hidden="true"></i><span data-city-label>8 capitales</span><svg viewBox="0 0 12 8" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M1.5 1.5L6 6l4.5-4.5"/></svg><span class="oc-sr">: elegir tu capital</span></button>
    </div>
  </div>
</header>
<main id="contenido" class="oc-main${wide ? ' is-wide' : ''}" tabindex="-1">
<div class="oc-wrap">
${cr ? crumbsHtml(cr) : ''}
${body}${colabora(p, title)}
</div>
</main>
<footer class="oc-footer">
  <div class="oc-wrap">
    <div class="oc-footer-grid">
      <div class="oc-footer-brand"><a class="oc-logo" href="${u()}">${WORDMARK}</a><p>${TAGLINE}</p></div>
      <nav aria-label="Capitales"><h2>Capitales</h2><ul>${D.capitales.map((c) => `<li><a href="${u('semana-santa/' + c.slug + '/')}">${esc(c.nombre)}</a></li>`).join('')}</ul></nav>
      <nav aria-label="Archivo"><h2>Archivo</h2><ul><li><a href="${u('noticias/')}">Noticias</a></li><li><a href="${u('calendario/')}">Calendario</a></li><li><a href="${u('hermandades/')}">Hermandades</a></li><li><a href="${u('bandas/')}">Bandas</a></li><li><a href="${u('marchas/')}">Marchas</a></li><li><a href="${u('imagineros/')}">Imagineros</a></li><li><a href="${u('favoritos/')}">Mis favoritos</a></li></ul></nav>
      <div><h2>${BRAND}</h2><ul><li><a href="${u('colabora/')}">Colabora</a></li><li><a href="${u('acerca/')}">Fuentes y metodología</a></li><li><a href="${u('acerca/#imagenes')}">Créditos de imágenes</a></li><li><a href="${u('buscar/')}">Buscador</a></li></ul>
        <label class="oc-theme"><span>Tema</span><select data-theme-select><option value="">Automático</option><option value="light">Claro</option><option value="dark">Oscuro</option></select></label></div>
    </div>
    <p class="oc-legal">Las noticias pertenecen a sus medios y se enlazan a la fuente original. Datos de hermandades contrastados con consejos, agrupaciones y federaciones oficiales. Imágenes de Wikimedia Commons con su licencia.</p>
  </div>
</footer>
<nav class="oc-tabbar" aria-label="Accesos rápidos">
  ${[[u(), p === '' || active === 'capitales/' || /^(hermandad|semana-santa|en-la-calle)\//.test(p), 'home', 'Hoy', ''], [u('noticias/'), active === 'noticias/', 'news', 'Noticias', ''], [u('calendario/'), active === 'calendario/', 'cal', 'Calendario', ''], [u('buscar/'), p === 'buscar/', 'search', 'Buscar', ' data-open-search']].map(([h, cur, ic, l, x]) => `<a href="${h}"${x}${cur ? ' aria-current="page"' : ''}>${cur ? '<i class="oc-tabpill" aria-hidden="true"></i>' : ''}${icon(ic)}<span>${l}</span></a>`).join('\n  ')}
  <button type="button" data-more aria-expanded="false" aria-controls="oc-more">${icon('more')}<span>Más</span></button>
</nav>
<button class="oc-cunao-btn" type="button" data-cunao aria-controls="oc-cunao" aria-expanded="false" aria-label="Pregúntale a erCuñao">${CUNAO_SVG}<span class="oc-cunao-bocadillo" aria-hidden="true">¿Qué sale hoy?</span></button>
<div class="oc-sheet oc-cunao" id="oc-cunao" hidden data-cunao-hoja data-datos="${u('data/cunao.json')}">
  <div class="oc-sheet-panel" role="dialog" aria-modal="true" aria-labelledby="oc-cunao-t">
    <div class="oc-sheet-head oc-cunao-head">${CUNAO_SVG}<div><p class="oc-sheet-title" id="oc-cunao-t">erCuñao</p><p class="oc-cunao-sub">Lo sabe todo de la Semana Santa. O eso dice.</p></div><button class="oc-iconbtn" type="button" data-cunao-cerrar aria-label="Cerrar">${icon('x')}</button></div>
    <div class="oc-cunao-chat" data-cunao-chat aria-live="polite"></div>
    <form class="oc-cunao-form" data-cunao-form><label class="oc-sr" for="oc-cunao-q">Pregunta a erCuñao</label><input id="oc-cunao-q" type="text" autocomplete="off" enterkeyhint="send" placeholder="¿A qué hora sale la Macarena?" data-cunao-q><button class="oc-cunao-enviar" type="submit" aria-label="Enviar"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12l15-7-5 15-2.5-5.5z" fill="currentColor"/></svg></button></form>
  </div>
</div>
<script src="${u('assets/cunao.js')}?v=${HUELLA.cunao}" defer></script>
<div class="oc-sheet" id="oc-more" hidden data-more-sheet>
  <div class="oc-sheet-panel" role="dialog" aria-modal="true" aria-label="Más secciones">
    <div class="oc-sheet-head"><p class="oc-sheet-title">Secciones</p><button class="oc-iconbtn" type="button" data-more-close aria-label="Cerrar">${icon('x')}</button></div>
    <ul class="oc-sheet-caps is-colg">${D.capitales.map((c) => `<li><a href="${u('semana-santa/' + c.slug + '/')}" style="--c:${c.color}"><img src="${u('assets/plates/colgadura-' + c.slug + '.webp')}" alt="" width="265" height="971" loading="lazy" decoding="async"><span>${esc(c.nombre)}</span></a></li>`).join('')}</ul>
    <ul class="oc-sheet-list">${[['hermandades/', 'Hermandades'], ['bandas/', 'Bandas'], ['marchas/', 'Marchas'], ['imagineros/', 'Imagineros'], ['favoritos/', 'Mis favoritos'], ['colabora/', 'Colabora'], ['acerca/', 'Fuentes y metodología']].map(([h, l]) => `<li><a href="${u(h)}">${l}${icon('arrow')}</a></li>`).join('')}</ul>
  </div>
</div>
<div class="oc-sheet oc-citysheet" id="oc-city" hidden data-city-sheet>
  <div class="oc-sheet-panel" role="dialog" aria-modal="true" aria-labelledby="oc-city-t">
    <div class="oc-sheet-head"><p class="oc-sheet-title" id="oc-city-t">Tu capital</p><button class="oc-iconbtn" type="button" data-city-close aria-label="Cerrar">${icon('x')}</button></div>
    <p class="oc-citysheet-sub">«Hoy» te enseñará primero sus cofradías y el buscador la tendrá en cuenta. Puedes cambiarla cuando quieras.</p>
    <ul class="oc-citysheet-grid">${D.capitales.map((c) => `<li><button type="button" data-set-city="${c.slug}" style="--c:${c.color}"><img src="${u('assets/plates/colgadura-' + c.slug + '.webp')}" alt="" width="265" height="971" loading="lazy" decoding="async"><span>${esc(c.nombre)}</span></button></li>`).join('')}</ul>
    <button class="oc-btn is-quiet oc-citysheet-todas" type="button" data-set-city="">Ver las ocho capitales</button>
  </div>
</div>
<div class="oc-search" hidden data-search-overlay>
  <div class="oc-search-box" role="dialog" aria-modal="true" aria-label="Buscar en ${BRAND}">
    <div class="oc-search-row">${icon('search')}<input type="search" placeholder="Hermandad, banda, imaginero…" aria-label="Buscar" data-search-input autocomplete="off" autocapitalize="none" spellcheck="false" enterkeyhint="search"><button class="oc-iconbtn" type="button" data-close-search aria-label="Cerrar buscador">${icon('x')}</button></div>
    <div class="oc-search-results" data-search-results aria-live="polite"><p class="oc-hint">Escribe al menos dos letras. Da igual con o sin tildes.</p></div>
  </div>
</div>
<script src="${u('assets/site.js')}?v=${HUELLA.js}" defer></script>
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
function slotShort(s, year) {
  const e = easter(year);
  const f = (off) => fmtDay(e + off * 864e5, { day: 'numeric', month: 'short' }).replace('.', '');
  return s.span ? fmtDay(e + s.off * 864e5, { day: 'numeric' }) + '-' + f(s.off + 1) : f(s.off);
}
function todayPanel() {
  const now = madridNow();
  const pick = pickSlot(now);
  const year = pick.year;
  const tabs = SLOTS.map((s) => `<button type="button" role="tab" id="tab-${s.id}" aria-controls="dia-${s.id}" aria-selected="${s.id === pick.id}" tabindex="${s.id === pick.id ? 0 : -1}" data-slot="${s.id}">${esc(s.label)}<small>${slotShort(s, year)}</small></button>`).join('');
  const panels = SLOTS.map((s) => {
    const list = conSalidas(D.hermandades).filter((h) => s.dias.includes(h.dia));
    const groups = D.capitales.map((c) => {
      const hs = list.filter((h) => h.ciudad === c.slug).sort((a, b) => dayIdx(a.dia) - dayIdx(b.dia) || a.orden - b.orden);
      if (!hs.length) return '';
      const anchor = slugify(hs[0].dia);
      return `<section class="oc-group" data-city="${c.slug}" style="--c:${c.color}"><h4 class="oc-group-title"><a href="${u('semana-santa/' + c.slug + '/#' + anchor)}">${esc(c.nombre)}</a><span>${plural(hs.length, 'hermandad', 'hermandades')}</span></h4><ol class="oc-group-list">${hs.map((h) => `<li><a href="${u('hermandad/' + h.slug + '/')}">${esc(h.nombre)}</a>${h.extra ? `<span class="oc-group-day">${esc(h.extra.titulares)}</span>` : s.span ? `<span class="oc-group-day">${esc(h.dia)}</span>` : ''}${h.sede || h.hora ? `<span class="oc-group-sede">${h.hora ? esc(fmtHora(h.hora)) + ' h' + (h.sede ? ', ' : '') : ''}${esc(h.sede)}</span>` : ''}</li>`).join('')}</ol>${hs.length > 3 ? `<a class="oc-group-more" href="${u('semana-santa/' + c.slug + '/#' + anchor)}">Ver las ${hs.length} de ${esc(c.nombre)}</a>` : ''}${calleDias(c.slug).has(hs[0].dia) ? `<a class="oc-group-plano" href="${u('en-la-calle/' + c.slug + '/')}?dia=${encodeURIComponent(hs[0].dia)}"><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6l6-2.5 6 2.5 6-2.5v14.5l-6 2.5-6-2.5-6 2.5z"/><path d="M9 3.5v14.5M15 6v14.5"/></svg>En el plano</a>` : ''}</section>`;
    }).join('');
    return `<div class="oc-daypanel" role="tabpanel" id="dia-${s.id}" aria-labelledby="tab-${s.id}" data-panel="${s.id}" tabindex="0"${s.id === pick.id ? '' : ' hidden'}><h3 class="oc-daytitle">${esc(s.label)} <span data-slot-date="${s.id}">${esc(slotDate(s, year))}</span></h3>${groups}<p class="oc-empty" data-today-empty hidden>Tu ciudad no tiene salidas documentadas esta jornada. Prueba otro día o elige «8 capitales».</p></div>`;
  }).join('');
  return `<section class="oc-today" id="hoy" aria-labelledby="hoy-titulo" data-today data-build-slot="${pick.id}" data-year="${year}">
  <h2 class="oc-today-title" id="hoy-titulo" data-today-title>${pick.hoy ? 'Hoy en la calle' : `Así sale Semana Santa ${year}`}</h2>
  <p class="oc-today-sub">Orden de paso según la última configuración documentada; consulta los horarios oficiales de este año.</p>
  <p class="oc-today-showing" data-today-showing hidden><span>Mostrando solo <strong data-today-city></strong>.</span> <button type="button" class="oc-textbtn" data-set-city="">Ver las ocho capitales</button></p>
  <div class="oc-daytabs" role="tablist" aria-label="Jornadas">${tabs}</div>
  ${panels}
</section>`;
}

// Cuenta atrás (o «hoy») de la cabecera de la portada; el JS la corrige si la copia en caché se ha quedado atrás.
function leadHoy() {
  const pick = pickSlot(madridNow());
  const ramos = easter(pick.year) - 7 * 864e5;
  return pick.hoy
    ? `<p class="oc-hero2-count" data-today-lead>Hoy en la calle: <strong>${esc(SLOTS.find((s) => s.id === pick.id).label)}</strong></p>`
    : `<p class="oc-hero2-count" data-today-lead>Faltan <strong>${pick.days}</strong> ${pick.days === 1 ? 'día' : 'días'} para el Domingo de Ramos <span>(${fmtDay(ramos, { day: 'numeric', month: 'long' })})</span></p>`;
}

// ---------- Colgaduras: las ocho capitales colgadas sobre el mapa ----------
// En el orden del portal, como la maqueta aprobada; cada hilo baja a su capital.
// Cada hilo baja recto desde su colgadura, corre en horizontal por su «carril» y baja a su capital. Se elige el reparto de carriles
// (de 8! posibles) con menos cruces entre hilos, para que se lea como en la maqueta: líneas rectas con codos, sin enredo.
function carrilesHilos(caps) {
  const niveles = caps.map((_, k) => 4 + k * 3.4);
  const coste = (p) => {
    let n = 0;
    for (let i = 0; i < caps.length; i++) {
      const Li = niveles[p[i]]; if (Li > caps[i].y - 2) return 1e6;
      const lo = Math.min(caps[i].b, caps[i].x), hi = Math.max(caps[i].b, caps[i].x);
      for (let j = 0; j < caps.length; j++) {
        if (i === j) continue; const Lj = niveles[p[j]];
        if (caps[j].b > lo && caps[j].b < hi && Li < Lj) n++;
        if (caps[j].x > lo && caps[j].x < hi && Li > Lj && Li < caps[j].y) n++;
      }
    }
    return n;
  };
  let mejor = null, mejorC = Infinity; const a = caps.map((_, i) => i);
  const permuta = (n) => { if (n === 1) { const c = coste(a); if (c < mejorC) { mejorC = c; mejor = [...a]; } return; } for (let i = 0; i < n; i++) { permuta(n - 1); const j = n % 2 ? 0 : i; [a[j], a[n - 1]] = [a[n - 1], a[j]]; } };
  permuta(caps.length);
  return caps.map((c, i) => ({ ...c, l: +niveles[mejor[i]].toFixed(1) }));
}
function colgaduras() {
  const P = MAPA && MAPA.proyeccion;
  const orden = D.capitales;
  const pos = (c) => {
    const [lat, lon] = COORD[c.slug];
    return { x: P ? ((P.pad + (lon - P.lon0) * P.sx) / MAPA.ancho) * 100 : 10 + ((lon + 7.1) / 4.9) * 80, y: P ? ((P.pad + (P.lat1 - lat) * P.sy) / MAPA.alto) * 100 : 12 + ((38 - lat) / 1.65) * 76 };
  };
  // Cada colgadura es un enlace a la página de su capital (sin JavaScript sigue funcionando); con JS elige la ciudad y anima.
  const items = orden.map((c, i) => {
    const hermandades = hermsOf(c.slug).length;
    const letras = [...c.nombre.toUpperCase()].map((l) => `<i>${esc(l)}</i>`).join('');
    return `<li class="oc-colg-slot"><a class="oc-colg" data-colg="${c.slug}" href="${capHref(c)}" style="--c:${c.color};--i:${i}"><img src="${u('assets/plates/colgadura-' + c.slug + '.webp')}" alt="" width="265" height="971" decoding="async" style="view-transition-name:colg-${c.slug}"><span class="oc-colg-name" aria-hidden="true">${letras}</span><span class="oc-sr">Semana Santa de ${esc(c.nombre)}, ${plural(hermandades, 'hermandad', 'hermandades')}</span></a></li>`;
  }).join('');
  // El mapa y los hilos los dibuja el navegador a partir de estos datos (una gráfica con datos, no una ilustración incrustada).
  const datos = {
    vb: MAPA ? MAPA.viewBox : '0 0 100 60',
    prov: MAPA ? MAPA.provincias.map((p) => ({ s: p.slug, c: (CAP[p.slug] || {}).color || '#888', d: p.d })) : [],
    caps: carrilesHilos(orden.map((c, i) => { const { x, y } = pos(c); return { s: c.slug, c: c.color, x: +x.toFixed(2), y: +y.toFixed(2), b: +((i + 0.5) * 12.5).toFixed(2) }; })),
  };
  const lista = orden.map((c) => `<a class="oc-colg-ir" data-ir="${c.slug}" href="${capHref(c)}" hidden>Semana Santa de ${esc(c.nombre)}${icon('arrow')}</a>`).join('');
  return `<div class="oc-colgaduras" data-colgaduras>
  <ol class="oc-colg-row" aria-label="Elige tu capital">${items}</ol>
  <div class="oc-colg-map" data-colg-map>
    <div class="oc-colg-pie" data-colg-pie aria-live="polite">${lista}</div>
  </div>
  <script type="application/json" id="oc-mapa">${JSON.stringify(datos).replace(/</g, '\\u003c')}</script>
  <noscript><style>.oc-colg-map{display:none}</style></noscript>
</div>`;
}

// ---------- Atlas: plano de capitales, planchas y portada ----------
const STAR = '<svg class="oc-plate-seal" viewBox="0 0 40 40" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="11" y="11" width="18" height="18"/><rect x="11" y="11" width="18" height="18" transform="rotate(45 20 20)"/><circle cx="20" cy="20" r="2.2" fill="currentColor" stroke="none"/></svg>';
// [latitud, longitud, posición de la etiqueta] de cada capital, para el plano esquemático.
const COORD = { sevilla: [37.39, -5.98, 'r'], malaga: [36.72, -4.42, 'r'], granada: [37.18, -3.60, 'r'], cordoba: [37.88, -4.78, 't'], cadiz: [36.53, -6.29, 'r'], huelva: [37.26, -6.95, 'b'], almeria: [36.84, -2.46, 'b'], jaen: [37.77, -3.79, 'r'] };
const capHref = (c) => u('semana-santa/' + c.slug + '/');
function mapaCapitales() {
  const P = MAPA && MAPA.proyeccion;
  const pins = D.capitales.map((c, i) => {
    const [lat, lon, pos] = COORD[c.slug];
    const x = P ? ((P.pad + (lon - P.lon0) * P.sx) / MAPA.ancho) * 100 : 10 + ((lon + 7.1) / 4.9) * 80;
    const y = P ? ((P.pad + (P.lat1 - lat) * P.sy) / MAPA.alto) * 100 : 12 + ((38 - lat) / 1.65) * 76;
    const num = String(i + 1).padStart(2, '0');
    return `<a class="oc-pin${pos === 'l' ? ' is-l' : pos === 'b' ? ' is-b' : pos === 't' ? ' is-t' : ''}" style="--c:${c.color};left:${x.toFixed(1)}%;top:${y.toFixed(1)}%" href="${capHref(c)}">${num} <span>${esc(c.nombre)}</span></a>`;
  }).join('');
  const svg = MAPA ? `<svg class="oc-map-svg" viewBox="${MAPA.viewBox}" aria-hidden="true" focusable="false" preserveAspectRatio="xMidYMid meet">${MAPA.provincias.map((p) => `<path class="oc-prov" style="--c:${(CAP[p.slug] || {}).color || '#888'}" d="${p.d}"/>`).join('')}</svg>` : '';
  return `<div class="oc-map" role="group" aria-label="Mapa de las ocho capitales andaluzas" style="--ratio:${MAPA ? (MAPA.ancho / MAPA.alto).toFixed(3) : '1.667'}">${svg}${pins}<span class="oc-map-tag is-a oc-mono">Andalucía</span><span class="oc-map-tag is-b oc-mono">8 capitales</span></div>`;
}
// Fondo de placa con el color de la capital oscurecido lo justo para que el texto blanco pase AA (4,5:1) con margen.
function fondoLegible(hex, min = 4.8) {
  const rgb = hex.replace('#', '').match(/../g).map((x) => parseInt(x, 16));
  const lum = (c) => { const [r, g, b] = c.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  for (let k = 0; k <= 60; k += 2) { const c = rgb.map((v) => Math.round(v * (1 - k / 100))); if (1.05 / (lum(c) + 0.05) >= min) return '#' + c.map((v) => v.toString(16).padStart(2, '0')).join(''); }
  return hex;
}
function plates(big) {
  return `<ul class="oc-plates${big ? ' is-big' : ''}">${D.capitales.map((c, i) => {
    const bandas = D.bandas.filter((b) => b.origen === c.slug).length;
    const img = c.imagen ? imgTag(c.imagen, '', { sizes: '(max-width: 1000px) 50vw, 25vw', widths: [330, 500] }) : '';
    return `<li><article class="oc-plate${c.imagen ? '' : ' is-blank'}" style="--c:${c.color};--c-plate:${fondoLegible(c.color)}">${img}<div class="oc-plate-top"><span>${String(i + 1).padStart(2, '0')}<i>${COORD[c.slug][0].toFixed(2)}° N</i></span>${STAR}</div><div><h3><a href="${capHref(c)}">${esc(c.nombre)}</a></h3>${big ? `<p class="oc-plate-lema">${esc(c.lema)}</p>` : ''}<p class="oc-plate-meta">${plural(hermsOf(c.slug).length, 'hermandad', 'hermandades')}${bandas ? ' · ' + plural(bandas, 'banda', 'bandas') : ''}</p></div></article></li>`;
  }).join('')}</ul>`;
}

// Curiosidades calculadas con los datos del propio portal: cada una enlaza a su ficha. Una distinta cada día (según la fecha de Madrid).
function curiosidades() {
  const out = [];
  for (const i of D.imagineros) if (i.obras.length >= 6) out.push({ t: `${i.nombre} firma ${i.obras.length} de las imágenes que procesionan en el portal, repartidas en ${plural(i.ciudades.length, 'capital', 'capitales')}.`, u: u('imaginero/' + i.slug + '/'), l: 'Ver imaginero' });
  for (const a of AUTORES.values()) if (a.marchas.length >= 5) out.push({ t: `${a.nombre} ha compuesto ${a.marchas.length} marchas dedicadas a hermandades, entre ellas «${a.marchas[0].titulo}».`, u: u('compositor/' + a.slug + '/'), l: 'Ver compositor' });
  for (const b of D.bandas) { const n = new Set(b.acompana.map((x) => x.hermandad_slug)).size; const k = new Set(b.acompana.map((x) => x.ciudad)).size; if (n >= 4) out.push({ t: `${b.nombre} acompaña a ${n} cofradías en ${plural(k, 'capital', 'capitales')}.`, u: u('banda/' + b.slug + '/'), l: 'Ver banda' }); }
  for (const h of D.hermandades) { const y = String(h.fundacion).match(/^(\d{4})$/); if (y && +y[1] <= 1650) out.push({ t: `${h.nombre} (${CAP[h.ciudad].nombre}) se fundó en ${y[1]}: hace ${new Date().getFullYear() - +y[1]} años.`, u: u('hermandad/' + h.slug + '/'), l: 'Ver hermandad' }); }
  for (const cp of D.capitales) for (const d of DAY_ORDER) { const n = D.hermandades.filter((h) => h.ciudad === cp.slug && h.dia === d).length; if (n >= 6) out.push({ t: `El ${d} salen ${n} hermandades en ${cp.nombre}.`, u: u('semana-santa/' + cp.slug + '/#' + slugify(d)), l: 'Ver la jornada' }); }
  for (const m of MARCHAS) if (m.h && m.anio && m.autor && +m.anio <= 1960) out.push({ t: `«${m.titulo}», de ${m.autor}, se compuso en ${m.anio} y está dedicada a ${m.h.nombre} (${CAP[m.h.ciudad].nombre}).`, u: u('marcha/' + m.slug + '/'), l: 'Ver marcha' });
  return out;
}
function pageHome() {
  const latest = NEWS.items.slice(0, 40);
  const N = madridNow(); const hoy = isoDay(Date.UTC(N.y, N.m - 1, N.d));
  const evs = agenda().filter((e) => e.fecha >= hoy);
  // Rediseño «Colgaduras»: titular, cuenta atrás y ocho colgaduras (una por capital, de oeste a este) sobre el mapa.
  // En temporada «Hoy» sube justo tras el mapa (lo decide el JS con data-season); fuera de ella, las noticias van primero.
  const body = `<div class="oc-home" data-home>
<section class="oc-hero2" aria-labelledby="hero-titulo">
  <h1 class="oc-hero2-title" id="hero-titulo">Ocho ciudades,<br>una Semana Santa</h1>
  ${leadHoy()}
  <a class="oc-btn oc-hero2-cta" href="#hoy">Ver qué sale hoy</a>
  ${colgaduras()}
</section>
<section class="oc-news-home" aria-labelledby="ultimas-titulo" data-latest>
  <h2 class="oc-news-home-title" id="ultimas-titulo"><span>Últimas noticias</span></h2>
  <div class="oc-latest-list" data-latest-list>${latest.map((n) => newsItem(n, { img: true, tile: true })).join('')}</div>
  <p class="oc-empty" data-latest-empty hidden>Aún no hay noticias recientes de tu ciudad.</p>
  ${NEWS.actualizado ? `<p class="oc-note oc-updated">Leídas por última vez a las ${new Date(NEWS.actualizado).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' })} del ${fmtDay(NEWS.actualizado, { day: 'numeric', month: 'long' })} (<time data-ago datetime="${new Date(NEWS.actualizado).toISOString()}"></time>).</p>` : ''}
  <a class="oc-link" href="${u('noticias/')}" data-latest-all>Todas las noticias${icon('arrow')}</a>
</section>
${todayPanel()}
<section class="oc-section" aria-labelledby="capitales-titulo"><h2 class="oc-h2" id="capitales-titulo">Las ocho capitales</h2>${plates(false)}</section>
<section class="oc-agenda-home" aria-labelledby="agenda-home"><h2 class="oc-h2" id="agenda-home">Agenda</h2>${evs.length ? `<ol class="oc-evs">${evs.slice(0, 4).map(agendaItem).join('')}</ol>` : '<p class="oc-empty">Aún no hay eventos próximos.</p>'}<a class="oc-link" href="${u('calendario/')}">Calendario cofrade completo${icon('arrow')}</a></section>
<div class="oc-seal" aria-hidden="true">${STAR}</div>
${(() => { const L = curiosidades(); if (!L.length) return ''; const N = madridNow(); const dia = Math.floor(Date.UTC(N.y, N.m - 1, N.d) / 864e5); const k = L[(dia * 7919) % L.length]; return `<aside class="oc-curio" aria-label="Curiosidad del día">${STAR}<p>${esc(k.t)}</p><a class="oc-link" href="${k.u}">${esc(k.l)}${icon('arrow')}</a></aside>`; })()}
<section class="oc-section" aria-labelledby="archivo-titulo"><h2 class="oc-h2" id="archivo-titulo">El archivo cofrade</h2>
<ul class="oc-tiles">
<li><a class="oc-tile" href="${u('hermandades/')}"><b>${D.hermandades.length}</b><span><strong>Hermandades</strong><small>Sede, día de salida, titulares e historia.</small></span></a></li>
<li><a class="oc-tile" href="${u('bandas/')}"><b>${D.bandas.length}</b><span><strong>Bandas</strong><small>Formaciones y las cofradías a las que acompañan.</small></span></a></li>
<li><a class="oc-tile" href="${u('marchas/')}"><b>${MARCHAS.length}</b><span><strong>Marchas</strong><small>Compositor, año, formación y enlace para escucharlas.</small></span></a></li>
<li><a class="oc-tile" href="${u('imagineros/')}"><b>${D.imagineros.length}</b><span><strong>Imagineros</strong><small>Escultores y sus obras en procesión.</small></span></a></li>
<li><a class="oc-tile" href="${u('calendario/')}"><b>${evs.length}</b><span><strong>Agenda</strong><small>Eventos próximos y orden de paso por jornada.</small></span></a></li>
</ul></section>
</div>`;
  write('index.html', layout({ title: '', body, path: '', jsonld: { '@context': 'https://schema.org', '@type': 'WebSite', name: BRAND, url: abs(''), inLanguage: 'es', description: TAGLINE, potentialAction: { '@type': 'SearchAction', target: abs('buscar/') + '?q={q}', 'query-input': 'required name=q' } } }));
}

function pageNews() {
  const body = `<header class="oc-pagehead"><h1 class="oc-title">Noticias cofrades</h1><p class="oc-lead">Titulares de la prensa andaluza, agregadores y webs oficiales de hermandades y consejos. Cada noticia lleva a su medio. Actualizado <time data-ago datetime="${new Date(NEWS.actualizado || Date.now()).toISOString()}">${fmtDay(NEWS.actualizado || Date.now(), { day: 'numeric', month: 'long' })}</time>.</p></header>
<div class="oc-filters" data-news-filters>
  <div class="oc-field oc-field-grow"><label for="nq">Buscar en las noticias</label><input id="nq" type="search" data-f="q" placeholder="Hermandad, medio, tema…" autocomplete="off" enterkeyhint="search"></div>
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
  const body = `<header class="oc-pagehead"><h1 class="oc-title">Las ocho capitales</h1><p class="oc-lead">Cada Semana Santa tiene su forma de andar, su música y su calendario.</p></header><h2 class="oc-sr">Capitales</h2>${plates(true)}`;
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
  // Portada de capital «Colgaduras»: la foto a sangre, su colgadura colgando del balcón (la misma de la portada, que viaja con
  // la transición de página) y el titular sobre un velo nazareno. El crédito de la foto va justo debajo.
  const body = `<header class="oc-caphero${c.imagen ? ' has-img' : ''}" style="--c:${c.color};--c-plate:${fondoLegible(c.color)}">
  ${c.imagen ? `<div class="oc-caphero-img">${imgTag(c.imagen, 'Semana Santa en ' + c.nombre, { sizes: '(max-width: 1240px) 100vw, 1200px', widths: [500, 960, 1280], eager: true })}</div>` : ''}
  <img class="oc-caphero-colg" src="${u('assets/plates/colgadura-' + c.slug + '.webp')}" alt="" width="265" height="971" style="view-transition-name:colg-${c.slug}">
  <div class="oc-caphero-text"><h1 class="oc-caphero-title"><span>Semana Santa de</span> ${esc(c.nombre)}</h1><p class="oc-caphero-lema">${esc(c.lema)}</p><p class="oc-caphero-meta">${plural(hs.length, 'hermandad', 'hermandades')} · ${plural(groups.length, 'jornada', 'jornadas')}</p><div class="oc-actions">${favBtn('capital', c.slug, 'Semana Santa de ' + c.nombre)}<a class="oc-btn is-quiet" href="${u('calendario/#cal-' + c.slug)}">${icon('cal')}<span>Calendario</span></a></div></div>
</header>
${c.imagen ? `<p class="oc-caphero-credit">${credit(c.imagen)}</p>` : ''}
${fs.existsSync(path.join(DIR, 'data', 'recorridos', c.slug + '.json')) ? `<a class="oc-calle-acceso" href="${u('en-la-calle/' + c.slug + '/')}"><svg viewBox="0 0 48 48" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 12l12-5 12 5 12-5v29l-12 5-12-5-12 5z"/><path d="M18 7v29M30 12v29"/><circle cx="24" cy="22" r="4" fill="currentColor" stroke="none"/></svg><div><strong>En la calle</strong><span>Recorridos sobre el plano y dónde va cada cofradía, hora a hora</span></div></a>` : ''}
<nav class="oc-daynav" aria-label="Jornadas de ${esc(c.nombre)}"><ul>${groups.map(([d]) => `<li><a href="#${slugify(d)}">${esc(d)}</a></li>`).join('')}</ul></nav>
<div class="oc-split">
<div class="oc-split-main">
${groups.map(([d, list]) => `<section class="oc-section oc-day" id="${slugify(d)}"><h2 class="oc-h2">${esc(d)} <small>${plural(list.length, 'hermandad', 'hermandades')}</small></h2><ol class="oc-entries is-ordered">${list.map((h) => entryHerm(h, '', true)).join('')}</ol></section>`).join('')}
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
  write(`semana-santa/${c.slug}/index.html`, layout({ title: 'Semana Santa de ' + c.nombre, desc: `${c.lema} Las ${hs.length} hermandades de ${c.nombre} por días, con su historia, titulares, imagineros y bandas.`, body, path: `semana-santa/${c.slug}/`, image: ogOf(c.imagen), active: 'capitales/', head: heroPreload(c.imagen, '(max-width: 1240px) 100vw, 1200px', [500, 960, 1280]), crumbs: [['Portada', u()], ['Capitales', u('capitales/')], [c.nombre, '']] }));
}

const IGUSER = (r) => String(r).replace(/^@/, '');
function acompHtml(a) {
  if (!a) return '';
  const bandaLi = (x) => {
    const nom = x.slug ? '<a href="' + u('banda/' + x.slug + '/') + '">' + esc(x.nombre) + '</a>' : esc(x.nombre);
    const loc = x.banda && x.localidad && x.localidad !== 'Málaga' ? ' <span class="oc-muted">(' + esc(x.localidad) + ')</span>' : '';
    const nota = [x.novedad ? 'novedad' : '', x.nota].filter(Boolean).join(', ');
    const src = x.fuente ? ' <a class="oc-srclink" href="' + esc(x.fuente) + '" target="_blank" rel="noopener">' + esc(x.medio || 'fuente') + '</a>' : '';
    return nom + loc + (nota ? ' <span class="oc-muted">(' + esc(nota) + ')</span>' : '') + src;
  };
  const tabla = (pasos) => '<dl class="oc-acomp">' + pasos.map((p) => '<div><dt>' + esc(p.paso) + '</dt><dd>' + p.bandas.map(bandaLi).join('<br>') + '</dd></div>').join('') + '</dl>';
  const nv = a.novedades2027 && a.novedades2027.pasos.length ? '<h3 class="oc-h3">Novedades para 2027</h3>' + tabla(a.novedades2027.pasos) : '';
  return '<h3 class="oc-h3">Acompañamiento en ' + a.anio + '</h3>' + tabla(a.pasos) + nv + '<p class="oc-note">Fuente: <a href="' + esc(a.fuente) + '" target="_blank" rel="noopener">' + esc(a.medio || 'guía publicada') + '</a>. Los cambios se anuncian a lo largo del año; los de 2027 se indican como novedad.</p>';
}
// Estampa: cuando no existe ninguna foto con licencia libre, una lámina diseñada (colgadura de su capital, inicial bordada y
// nombres de sus titulares). No pretende ser una foto: se dice en el pie y se invita a aportar una.
function estampaHtml(h, c) {
  const ini = esc(h.nombre.replace(/^(La|El|Los|Las)\s+/i, '').charAt(0));
  const tit = (h.titulares || []).slice(0, 3).map((t) => `<li>${esc(t.nombre.split(',')[0])}</li>`).join('');
  return `<figure class="oc-estampa" style="--c:${c.color};--c-plate:${fondoLegible(c.color)}"><div class="oc-estampa-lamina" aria-hidden="true"><img src="${u('assets/plates/colgadura-' + c.slug + '.webp')}" alt="" width="265" height="971" loading="lazy" decoding="async"><span class="oc-estampa-ini">${ini}</span></div><figcaption>${tit ? `<ul class="oc-estampa-tit">${tit}</ul>` : ''}<span class="oc-diptico-cred">Aún no hay una foto con licencia libre de sus titulares. <a href="${u('colabora/')}">¿Tienes una? Compártela</a>.</span></figcaption></figure>`;
}
// Díptico: el Cristo y la Virgen de la hermandad, cada uno con su crédito (licencias de Commons por separado).
function dipticoHtml(h, c) {
  const d = h.diptico; if (!d) return '';
  const nombre = (x) => esc(String(x.titular || '').split(',')[0]);
  if (d.juntos) return `<figure class="oc-diptico is-juntos">${imgTag(d.juntos, `${String(d.juntos.titular || h.nombre)}, ${h.nombre} (${c.nombre})`, { sizes: '(max-width: 960px) 100vw, 42vw', widths: [500, 960], eager: true })}<figcaption><span class="oc-diptico-nombres"><b>${nombre(d.juntos) || esc(h.nombre)}</b></span><span class="oc-diptico-cred">${credit(d.juntos)}</span></figcaption></figure>`;
  if (!(d.cristo && d.virgen)) {
    // un solo titular: foto grande con su nombre
    const uno = d.cristo || d.virgen;
    if (uno) return `<figure class="oc-diptico is-juntos">${imgTag(uno, `${String(uno.titular || h.nombre).split(',')[0]}, ${h.nombre} (${c.nombre})`, { sizes: '(max-width: 960px) 100vw, 42vw', widths: [500, 960], eager: true })}<figcaption><span class="oc-diptico-nombres"><b>${nombre(uno) || esc(h.nombre)}</b></span><span class="oc-diptico-cred">${credit(uno)}</span></figcaption></figure>`;
    // solo hay foto de su sede: se dice claramente que es la iglesia, no los titulares
    if (d.sede && (!h.imagen || h.imagen === d.sede)) return `<figure class="oc-diptico is-juntos is-sede">${imgTag(d.sede, `Sede de la hermandad: ${h.sede || ''}`, { sizes: '(max-width: 960px) 100vw, 42vw', widths: [500, 960], eager: true })}<figcaption><span class="oc-diptico-nombres"><b>Sede: ${esc(h.sede || 'templo de la hermandad')}</b></span><span class="oc-diptico-cred">${credit(d.sede)}</span></figcaption></figure>`;
    return '';
  }
  const lado = (x, eager) => `<div class="oc-diptico-img">${imgTag(x, `${String(x.titular).split(',')[0]}, hermandad de ${h.nombre} (${c.nombre})`, { sizes: '(max-width: 960px) 50vw, 21vw', widths: [500, 960], eager })}</div>`;
  return `<figure class="oc-diptico"><div class="oc-diptico-par">${lado(d.cristo, true)}${lado(d.virgen, false)}</div><figcaption><span class="oc-diptico-nombres"><b>${nombre(d.cristo)}</b><b>${nombre(d.virgen)}</b></span><span class="oc-diptico-cred">Izquierda: ${credit(d.cristo)}. Derecha: ${credit(d.virgen)}</span></figcaption></figure>`;
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
  const marchas = (h.marchas || []).length ? stackTable(['Marcha', 'Compositor', 'Año', 'Formación'], h.marchas.map((m) => [MARCHA_SLUG.has(h.slug + '|' + m.titulo + '|' + (m.autor || '')) ? `<a href="${u('marcha/' + MARCHA_SLUG.get(h.slug + '|' + m.titulo + '|' + (m.autor || '')) + '/')}">${esc(m.titulo)}</a>` : esc(m.titulo), esc(m.autor), esc(m.anio), esc(m.tipo)])) : '';
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
    <p class="oc-kicker" style="--c:${c.color}">${esc(c.nombre)} · ${esc(h.dia)}</p>
    <h1 class="oc-title${h.nombre.length > 60 ? ' is-long' : ''}">${esc(h.nombre)}</h1>
    ${h.nombre_oficial ? `<p class="oc-subtitle">${esc(h.nombre_oficial)}</p>` : ''}
    ${facts([['Capital', `<a href="${u('semana-santa/' + c.slug + '/')}">${esc(c.nombre)}</a>`], ['Día de salida', `<a href="${u('semana-santa/' + c.slug + '/#' + slugify(h.dia))}">${esc(h.dia)}</a>${vecinos.length > 1 ? ` <span class="oc-muted">(${idx + 1}.ª de ${vecinos.length})</span>` : ''}`], ['Sede', h.sede ? `${esc(h.sede)} <a class="oc-maplink" href="${mapLink(h.sede + ', ' + c.nombre)}" target="_blank" rel="noopener">${icon('pin')}Cómo llegar</a>` : ''], ['Titulares', titList], ['Hora de salida', h.hora ? esc(fmtHora(h.hora)) + ' h <span class="oc-muted">(2026)</span>' : ''], ['Otras salidas', (h.salidas || []).map((s) => `${esc(s.dia)}${s.hora ? ', ' + esc(s.hora) + ' h' : ''}: ${esc(s.titulares)}${s.nota ? ` <span class="oc-muted">${esc(s.nota)}</span>` : ''} <a href="${esc(s.fuente)}" target="_blank" rel="noopener">fuente</a>`).join('<br>')], ['Fundación', esc(h.fundacion)], ['Web oficial', h.web ? `<a class="oc-break" href="${esc(h.web)}" target="_blank" rel="noopener">${esc(webTxt)}</a>` : '']], 'is-key')}
    <div class="oc-actions">${favBtn('hermandad', h.slug, h.nombre + ' (' + c.nombre + ')')}${shareBtn()}</div>
  </div>
  ${dipticoHtml(h, c) || (im ? `<figure class="oc-figure${im.escudo ? ' is-escudo' : ''}">${imgTag(im, im.escudo ? 'Escudo de la hermandad ' + h.nombre : h.nombre + ', Semana Santa de ' + c.nombre, { sizes: '(max-width: 860px) 100vw, 40vw', widths: [500, 960], eager: true })}<figcaption>${credit(im)}</figcaption></figure>` : estampaHtml(h, c))}
</header>
${h.historia ? `<section class="oc-section"><h2 class="oc-h2">Historia</h2><div class="oc-prose">${para(h.historia)}</div></section>` : ''}
${section('Titulares e imagineros', titRows.length ? stackTable(['Titular', 'Autor y año'], titRows) : '')}
${section('Pasos y cortejo', h.paso ? `<div class="oc-prose">${para(h.paso)}</div>` : '')}
${section('Acompañamiento musical', (h.acompanamiento ? acompHtml(h.acompanamiento) : (musicaOf || (h.musica ? `<div class="oc-prose">${para(h.musica)}</div>` : ''))) + (!h.acompanamiento && bandas.length ? '<h3 class="oc-h3">Bandas en Ocho Capitales</h3>' + chips(bandas) : ''))}
${(() => { const hb = HABITOS[h.slug]; if (!hb || !hb.texto) return ''; const col = coloresHabito(hb.texto); return section('Hábito de nazareno', `<div class="oc-prose">${para(hb.texto)}</div>${col.length ? `<ul class="oc-swatches" aria-label="Colores mencionados">${col.map((x) => `<li><i style="background:${x.hex}" aria-hidden="true"></i><span>${esc(x.prenda)} ${esc(x.color)}</span></li>`).join('')}</ul>` : ''}<p class="oc-note">Descripción de la ficha oficial de la hermandad; los colores se han leído del texto, consulta la ficha para el detalle.</p>`); })()}
${section('Marchas dedicadas', marchas)}
${(() => { const q = encodeURIComponent(h.nombre + ' ' + c.nombre + ' Semana Santa'); const e = [['Ver en YouTube', 'https://www.youtube.com/results?search_query=' + q], ['Marchas en Spotify', 'https://open.spotify.com/search/' + encodeURIComponent(h.nombre + ' marchas procesionales')], ...(h.web ? [['Web oficial', h.web]] : [['Buscar su web oficial', 'https://www.google.com/search?q=' + q + '+web+oficial']])]; return section('Escúchala y síguela', `<ul class="oc-linklist">${e.map(([l, hr]) => `<li><a class="oc-btn is-quiet" href="${esc(hr)}" target="_blank" rel="noopener nofollow">${esc(l)}${icon('out')}</a></li>`).join('')}</ul><p class="oc-note">Son búsquedas: el resultado depende de lo que cada hermandad haya publicado.</p>`); })()}
${fuente}
</article>
${prev || next ? `<nav class="oc-prevnext" aria-label="Hermandades del mismo día">${prev ? `<a class="is-prev" href="${u('hermandad/' + prev.slug + '/')}"><span>Anterior el ${esc(h.dia)}</span><strong>${esc(prev.nombre)}</strong></a>` : '<span></span>'}${next ? `<a class="is-next" href="${u('hermandad/' + next.slug + '/')}"><span>Siguiente el ${esc(h.dia)}</span><strong>${esc(next.nombre)}</strong></a>` : ''}</nav>` : ''}
${news.length ? section('Noticias de ' + esc(c.nombre), `<div class="oc-newsgrid">${news.map((n) => newsItem(n)).join('')}</div>`) : ''}`;
  write(`hermandad/${h.slug}/index.html`, layout({
    title: `${h.nombre} (${c.nombre})`, desc: `${h.nombre}, hermandad de la Semana Santa de ${c.nombre} que procesiona el ${h.dia}${h.sede ? ' desde ' + h.sede : ''}. ${h.historia || ''}`.slice(0, 300), body, path: `hermandad/${h.slug}/`, image: ogOf(im), active: 'hermandades/', head: h.diptico && h.diptico.juntos ? heroPreload(h.diptico.juntos, '(max-width: 960px) 100vw, 42vw', [500, 960]) : h.diptico && h.diptico.cristo && h.diptico.virgen ? heroPreload(h.diptico.cristo, '(max-width: 960px) 50vw, 21vw', [500, 960]) : heroPreload(im, '(max-width: 860px) 100vw, 40vw', [500, 960]),
    crumbs: [['Portada', u()], [c.nombre, u('semana-santa/' + c.slug + '/')], [h.dia, u('semana-santa/' + c.slug + '/#' + slugify(h.dia))], [h.nombre, '']],
    jsonld: { '@context': 'https://schema.org', '@type': 'Organization', name: h.nombre_oficial || h.nombre, alternateName: h.nombre, foundingDate: (String(h.fundacion).match(/\d{4}/) || [])[0], address: h.sede ? { '@type': 'PostalAddress', streetAddress: h.sede, addressLocality: c.nombre, addressRegion: 'Andalucía', addressCountry: 'ES' } : undefined, url: h.web || undefined, image: im ? ogOf(im) : undefined, description: h.historia || undefined },
  }));
}

function pageBanda(b) {
  const prov = CAP[b.origen];
  const col = prov ? prov.color : '#3a1a5c';
  const items = b.acompana.filter((a) => HERM[a.hermandad_slug]).map((a) => ({ ...a, h: HERM[a.hermandad_slug] }));
  const ciudades = D.capitales.filter((c) => items.some((a) => a.ciudad === c.slug));
  const jornadas = new Set(items.map((a) => a.h.dia));
  const porCiudad = ciudades.map((c) => {
    const rows = items.filter((a) => a.ciudad === c.slug).sort((x, y) => dayIdx(x.h.dia) - dayIdx(y.h.dia) || x.h.orden - y.h.orden);
    return `<h3 class="oc-h3">${esc(c.nombre)}</h3>` + stackTable(['Jornada', 'Cofradía', 'Paso', 'Año'], rows.map((a) => [esc(a.h.dia), `<a href="${u('hermandad/' + a.hermandad_slug + '/')}"><strong>${esc(a.h.nombre)}</strong></a>`, esc(a.rol || 'Cortejo'), a.anio ? String(a.anio) : '<span class="oc-muted" aria-label="Sin año">—</span>']));
  }).join('');
  const lugar = b.localidad ? `${b.localidad}${prov && norm(b.localidad) !== norm(prov.nombre) ? ' (provincia de ' + prov.nombre + ')' : ''}` : '';
  const resumen = items.length
    ? `${b.nombre} es ${/^[aeiou]/i.test(b.tipo) ? 'una' : 'una'} ${b.tipo.toLowerCase()}${lugar ? ' de ' + lugar : ''}. Acompaña a ${plural(new Set(items.map((a) => a.hermandad_slug)).size, 'cofradía', 'cofradías')} en ${ciudades.map((c) => c.nombre).join(', ')} (${plural(jornadas.size, 'jornada', 'jornadas')}).`
    : `${b.nombre} es ${b.tipo.toLowerCase()}${lugar ? ' de ' + lugar : ''}.`;
  const q = encodeURIComponent(b.nombre + (b.localidad ? ' ' + b.localidad : ''));
  const enlaces = [
    ['Escuchar en YouTube', `https://www.youtube.com/results?search_query=${q}`],
    ['Buscar en Spotify', `https://open.spotify.com/search/${q}`],
    ...(b.redes || []).map((r) => ['Instagram @' + IGUSER(r), `https://www.instagram.com/${IGUSER(r)}/`]),
    ['Buscar su web oficial', `https://www.google.com/search?q=${q}+web+oficial`],
  ];
  const vecinas = b.origen ? D.bandas.filter((x) => x.slug !== b.slug && x.origen === b.origen).slice(0, 16) : [];
  const nuevas = items.filter((a) => a.anio > 2026);
  const body = `<header class="oc-caphero is-compact" style="--c:${col};--c-plate:${fondoLegible(col)}">
  ${prov ? `<img class="oc-caphero-colg" src="${u('assets/plates/colgadura-' + prov.slug + '.webp')}" alt="" width="265" height="971">` : ''}
  <div class="oc-caphero-text">
    <h1 class="oc-caphero-title${b.nombre.length > 48 ? ' is-long' : ''}">${esc(b.nombre)}</h1>
    <p class="oc-caphero-lema">${esc(b.tipo)}${lugar ? ' de ' + esc(lugar) : ''}</p>
    ${(() => { // cifras solo cuando dicen algo (con todo a 1, la frase de resumen ya lo cuenta)
      const st = [[new Set(items.map((a) => a.hermandad_slug)).size, 'cofradía', 'cofradías'], [items.length, 'paso', 'pasos'], [jornadas.size, 'jornada', 'jornadas'], [ciudades.length, 'capital', 'capitales']];
      return st.some(([n]) => n > 1) ? `<ul class="oc-stats">${st.map(([n, s, p]) => `<li><b>${n}</b><span>${n === 1 ? s : p}</span></li>`).join('')}</ul>` : '';
    })()}
    <div class="oc-actions">${favBtn('banda', b.slug, b.nombre)}${shareBtn()}</div>
  </div>
</header>
<div class="oc-prose oc-bandaresumen"><p>${esc(resumen)}</p></div>
${section('Dónde sale', porCiudad || '<p class="oc-empty">Todavía no hay cofradías del portal asociadas a esta formación.</p>')}
${nuevas.length ? section('Novedades para 2027', chips(nuevas.map((a) => [`${a.h.nombre} (${a.rol || 'cortejo'})`, u('hermandad/' + a.hermandad_slug + '/')]))) : ''}
${section('Escúchala y síguela', `<ul class="oc-linklist">${enlaces.map(([l, h]) => `<li><a class="oc-btn is-quiet" href="${esc(h)}" target="_blank" rel="noopener nofollow">${esc(l)}${icon('out')}</a></li>`).join('')}</ul><p class="oc-note">Son búsquedas y perfiles públicos; el portal no aloja audio ni vídeo.</p>`)}
${vecinas.length ? section('Otras formaciones de ' + esc(prov.nombre) + ' y su provincia', chips(vecinas.map((x) => [x.nombre + (x.localidad ? ' (' + x.localidad + ')' : ''), u('banda/' + x.slug + '/')]))) : ''}
<p class="oc-note">Configuración musical según la información publicada; las cofradías la cambian con frecuencia de un año a otro. Las novedades llevan su fuente en la ficha de cada cofradía.</p>`;
  write(`banda/${b.slug}/index.html`, layout({ title: b.nombre + (b.localidad && D.bandas.some((x) => x !== b && x.nombre === b.nombre) ? ' (' + b.localidad + ')' : ''), desc: `${resumen}`.slice(0, 300), body, path: `banda/${b.slug}/`, active: 'bandas/', crumbs: [['Portada', u()], ['Bandas', u('bandas/')], [b.nombre, '']], jsonld: { '@context': 'https://schema.org', '@type': 'MusicGroup', name: b.nombre, genre: b.tipo, foundingLocation: b.localidad ? { '@type': 'Place', name: b.localidad } : undefined } }));
}

// Cifras grandes de cartel (obras, capitales, marchas…): solo las que dicen algo
const cifras = (list) => { const l = list.filter(([n]) => n > 0); return l.length ? `<ul class="oc-cifras">${l.map(([n, s, p]) => `<li><b>${n}</b><span>${n === 1 ? s : p}</span></li>`).join('')}</ul>` : ''; };
// Fila de obra o marcha con la miniatura de su hermandad (foto, díptico o monograma)
function filaHerm(h, titulo, sub, extra = '') {
  const c = h ? CAP[h.ciudad] : null;
  const thumb = h && h.imagen ? `<div class="oc-entry-img${h.imagen.escudo ? ' is-escudo' : ''}">${imgTag(h.imagen, '', { sizes: '72px', widths: [120, 250] })}</div>` : c ? `<div class="oc-entry-img is-blank" style="--c:${c.color};--c-plate:${fondoLegible(c.color)}" aria-hidden="true"><span>${esc((h.nombre.replace(/^(La|El|Los|Las)\s+/i, '') || '·').charAt(0))}</span></div>` : '';
  return `<li class="oc-entry${thumb ? '' : ' is-text'}"${extra}>${thumb}<div class="oc-entry-body"><h3 class="oc-entry-title">${titulo}</h3>${sub ? `<p class="oc-entry-sub">${sub}</p>` : ''}${h ? `<p class="oc-entry-meta">${cityTag(h.ciudad)}<span>${esc(h.dia)}</span></p>` : ''}</div></li>`;
}
function pageImag(i) {
  const obras = i.obras.map((o) => { const h = HERM[o.hermandad_slug]; return filaHerm(h, h ? `<a href="${u('hermandad/' + o.hermandad_slug + '/')}">${esc(o.titular)}</a>` : esc(o.titular), [h ? esc(h.nombre) : esc(o.hermandad), o.atrib ? 'atribución' : '', esc(String(o.detalle || '').replace(i.nombre + ', ', '').replace(i.nombre, '').trim())].filter(Boolean).join(' · ')); }).join('');
  let body = `<header class="oc-dossier"><p class="oc-kicker" style="--c:var(--primary)">Imaginero${i.vida ? ' · ' + esc(i.vida) : ''}</p><h1 class="oc-title">${esc(i.nombre)}</h1>${cifras([[i.obras.length, 'obra en el portal', 'obras en el portal'], [i.ciudades.length, 'capital', 'capitales']])}${facts([['Escuela', esc(i.escuela)], ['Capitales', i.ciudades.map((s) => CAP[s] ? `<a href="${u('semana-santa/' + s + '/')}">${esc(CAP[s].nombre)}</a>` : '').filter(Boolean).join(', ')]], 'is-key')}<div class="oc-actions">${favBtn('imaginero', i.slug, i.nombre)}${shareBtn()}</div></header>${i.bio ? `<section class="oc-section"><h2 class="oc-h2">Biografía</h2><div class="oc-prose">${para(i.bio)}</div>${i.fuente_url ? `<p class="oc-note">Datos de <a href="${esc(i.fuente_url)}" target="_blank" rel="noopener">${/wikipedia/.test(i.fuente_url) ? 'Wikipedia' : 'Wikidata'}</a>.</p>` : ''}</section>` : ''}${section('Obras en la Semana Santa andaluza', obras ? `<ul class="oc-entries">${obras}</ul>` : '')}`;
  const qi = encodeURIComponent(i.nombre + ' imaginero');
  body += `${section('Más sobre su obra', `<ul class="oc-linklist"><li><a class="oc-btn is-quiet" href="https://www.youtube.com/results?search_query=${qi}" target="_blank" rel="noopener nofollow">Ver en YouTube${icon('out')}</a></li><li><a class="oc-btn is-quiet" href="https://www.google.com/search?q=${qi}" target="_blank" rel="noopener nofollow">Buscar en la web${icon('out')}</a></li></ul>`)}`;
  write(`imaginero/${i.slug}/index.html`, layout({ title: i.nombre, desc: `${i.nombre}${i.vida ? ' (' + i.vida + ')' : ''}: ${i.obras.length} obras en la Semana Santa de Andalucía. ${i.bio || ''}`.slice(0, 300), body, path: `imaginero/${i.slug}/`, active: 'imagineros/', crumbs: [['Portada', u()], ['Imagineros', u('imagineros/')], [i.nombre, '']], jsonld: { '@context': 'https://schema.org', '@type': 'Person', name: i.nombre, jobTitle: 'Imaginero', description: i.bio || undefined } }));
}

const AUTORES = new Map();
for (const m of MARCHAS) {
  const a = (m.autor || '').trim(); if (!a || /( y | e |\/|,|-| & )/.test(a)) continue;
  const k = slugify(a); if (!k) continue;
  if (!AUTORES.has(k)) AUTORES.set(k, { slug: k, nombre: a, marchas: [] });
  AUTORES.get(k).marchas.push(m); m.autorSlug = k;
}
for (const [k, v] of AUTORES) if (v.marchas.length < 2) { v.marchas.forEach((m) => { delete m.autorSlug; }); AUTORES.delete(k); }
function pageCompositor(a) {
  const ms = [...a.marchas].sort((x, y) => (x.anio || '9999').localeCompare(y.anio || '9999') || x.titulo.localeCompare(y.titulo, 'es'));
  const q = encodeURIComponent(a.nombre + ' marchas procesionales');
  const rows = ms.map((m) => [`<a href="${u('marcha/' + m.slug + '/')}"><strong>${esc(m.titulo)}</strong></a>`, esc(m.anio), esc(m.tipo), m.h ? `<a href="${u('hermandad/' + m.h.slug + '/')}">${esc(m.h.nombre)}</a> (${esc(CAP[m.h.ciudad].nombre)})` : esc(m.dedicatoria)]);
  const ciudades = [...new Set(ms.filter((m) => m.h).map((m) => CAP[m.h.ciudad].nombre))];
  const resumen = `${a.nombre}, compositor de marchas procesionales: ${plural(ms.length, 'marcha', 'marchas')}${ciudades.length ? ' dedicadas a cofradías de ' + ciudades.join(', ') : ''}.`;
  const lista = ms.map((m) => filaHerm(m.h, `<a href="${u('marcha/' + m.slug + '/')}">${esc(m.titulo)}</a>`, [esc(m.anio), esc(m.tipo), m.h ? '' : m.dedicatoria ? 'dedicada a ' + esc(m.dedicatoria) : ''].filter(Boolean).join(' · '))).join('');
  const body = `<header class="oc-dossier"><p class="oc-kicker" style="--c:var(--primary)">Compositor</p><h1 class="oc-title">${esc(a.nombre)}</h1>${cifras([[ms.length, 'marcha', 'marchas'], [ciudades.length, 'capital', 'capitales']])}<p class="oc-lead">${esc(resumen)}</p></header>
${section('Marchas', `<ul class="oc-entries">${lista}</ul>`)}
${section('Escucha su música', `<ul class="oc-linklist"><li><a class="oc-btn is-quiet" href="https://www.youtube.com/results?search_query=${q}" target="_blank" rel="noopener nofollow">Buscar en YouTube${icon('out')}</a></li><li><a class="oc-btn is-quiet" href="https://open.spotify.com/search/${q}" target="_blank" rel="noopener nofollow">Buscar en Spotify${icon('out')}</a></li></ul>`)}`;
  write(`compositor/${a.slug}/index.html`, layout({ title: a.nombre, desc: resumen.slice(0, 300), body, path: `compositor/${a.slug}/`, active: 'marchas/', crumbs: [['Portada', u()], ['Marchas', u('marchas/')], [a.nombre, '']], jsonld: { '@context': 'https://schema.org', '@type': 'Person', name: a.nombre, jobTitle: 'Compositor' } }));
}
function pageMarcha(m) {
  const h = m.h; const c = h ? CAP[h.ciudad] : null;
  const q = encodeURIComponent(m.titulo + ' ' + (m.autor || '') + ' marcha procesional');
  const enlaces = [m.video ? ['Escuchar en YouTube', 'https://www.youtube.com/watch?v=' + m.video] : ['Buscar en YouTube', `https://www.youtube.com/results?search_query=${q}`], ['Buscar en Spotify', `https://open.spotify.com/search/${q}`]];
  const otras = MARCHAS.filter((x) => x.slug !== m.slug && ((m.autor && x.autor === m.autor) || (h && x.h && x.h.slug === h.slug))).slice(0, 14);
  const resumen = `«${m.titulo}»${m.autor ? ', marcha procesional de ' + m.autor : ', marcha procesional'}${m.anio ? ' (' + m.anio + ')' : ''}, ${h ? 'dedicada a ' + h.nombre + ' (' + c.nombre + ').' : (m.dedicatoria ? 'dedicada a ' + m.dedicatoria + '.' : '')}${m.tipo ? ' Formación: ' + m.tipo.toLowerCase() + '.' : ''}`;
  const yt = m.video ? 'https://www.youtube.com/watch?v=' + m.video : `https://www.youtube.com/results?search_query=${q}`;
  const escucha = `<div class="oc-escucha"><a class="oc-escucha-play" href="${esc(yt)}" target="_blank" rel="noopener nofollow" aria-label="${m.video ? 'Escuchar' : 'Buscar'} «${esc(m.titulo)}» en YouTube"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M8 5.5v13l11-6.5z" fill="currentColor"/></svg></a><div class="oc-escucha-txt"><strong>${m.video ? 'Escúchala en YouTube' : 'Búscala en YouTube'}</strong><span>${m.video ? 'Grabación de «Marchas de Procesión»' : 'La grabación depende de la banda que la interprete'}</span><a href="https://open.spotify.com/search/${q}" target="_blank" rel="noopener nofollow">Buscar en Spotify${icon('out')}</a></div></div>`;
  const body = `<header class="oc-dossier"><p class="oc-kicker" style="--c:${c ? c.color : 'var(--primary)'}">Marcha procesional${m.anio ? ' · ' + esc(m.anio) : ''}</p><h1 class="oc-title">${esc(m.titulo)}</h1>${escucha}${facts([['Compositor', m.autorSlug ? `<a href="${u('compositor/' + m.autorSlug + '/')}">${esc(m.autor)}</a>` : esc(m.autor)], ['Año', esc(m.anio)], ['Formación', esc(m.tipo)], ['Dedicada a', h ? `<a href="${u('hermandad/' + h.slug + '/')}">${esc(h.nombre)}</a>` : esc(m.dedicatoria)], ['Capital', h ? `<a href="${u('semana-santa/' + h.ciudad + '/')}">${esc(c.nombre)}</a>` : ''], ['Tipo de marcha', esc(m.tipoMarcha)], ['Banda que la estrenó', esc(m.estreno)], ['Lugar', esc(m.lugar)]])}</header>
${otras.length ? section('Más marchas', `<ul class="oc-entries">${otras.map((x) => filaHerm(x.h, `<a href="${u('marcha/' + x.slug + '/')}">${esc(x.titulo)}</a>`, [esc(x.autor), esc(x.anio)].filter(Boolean).join(' · '))).join('')}</ul>`) : ''}
<p class="oc-note">${m.espana ? 'Catálogo de marchas de España elaborado a partir de la base de datos de <a href="https://www.marchasdeprocesion.com/p/marchas-de-espana.html" target="_blank" rel="noopener nofollow">Marchas de Procesión</a>; solo se muestran los datos que su ficha tiene rellenos.' : 'Datos de composición tomados de la ficha de la hermandad (' + esc(h.fuente_url ? 'fuente enlazada en su página' : 'fuentes del portal') + ').'}</p>`;
  write(`marcha/${m.slug}/index.html`, layout({ title: m.titulo + (m.autor ? ' · ' + m.autor : ''), desc: resumen.slice(0, 300), body, path: `marcha/${m.slug}/`, active: 'marchas/', crumbs: [['Portada', u()], ['Marchas', u('marchas/')], [m.titulo, '']], jsonld: { '@context': 'https://schema.org', '@type': 'MusicComposition', name: m.titulo, composer: m.autor ? { '@type': 'Person', name: m.autor } : undefined, dateCreated: m.anio || undefined } }));
}
function pageDirMarchas() {
  const tipos = [...new Set(MARCHAS.map((m) => m.tipo).filter(Boolean))].sort();
  const items = [...MARCHAS].sort((a, b) => a.titulo.localeCompare(b.titulo, 'es')).map((m) => entrySimple(u('marcha/' + m.slug + '/'), m.titulo, [m.autor, m.anio, m.tipo].filter(Boolean).join(' · ') + (m.h ? ' — ' + m.h.nombre : m.dedicatoria ? ' — ' + m.dedicatoria : ''), m.h ? [m.h.ciudad] : [], ` data-q="${esc(norm([m.titulo, m.autor, m.h ? m.h.nombre : m.dedicatoria, m.tipo].join(' ')))}" data-ciudad="${m.h ? m.h.ciudad : ''}" data-tipo="${slugify(m.tipo || 'sin-formacion')}"`)).join('');
  const body = `<header class="oc-pagehead"><h1 class="oc-title">Marchas procesionales</h1><p class="oc-lead">${MARCHAS.length} marchas procesionales: las dedicadas a hermandades y las más escuchadas de España, con compositor, año, formación, a quién van dedicadas cuando se sabe y enlace para escucharlas.</p></header>${dirFilters(false, tipos, MARCHAS.length, false, 'Título, compositor, hermandad…')}<h2 class="oc-sr">Resultados</h2><ul class="oc-entries" data-dir>${items}</ul>${dirMore}${dirEmpty}`;
  write('marchas/index.html', layout({ title: 'Marchas', desc: 'Marchas procesionales dedicadas a las hermandades andaluzas: compositor, año, formación y enlace para escucharlas.', body, path: 'marchas/', active: 'marchas/', crumbs: [['Portada', u()], ['Marchas', '']] }));
}
function dirFilters(withDay, tipos, total, bandas = false, ph = 'Nombre, sede, titular…') {
  return `<div class="oc-filters" data-dir-filters>
  <div class="oc-field oc-field-grow"><label for="fq">Filtrar</label><input id="fq" type="search" data-f="q" placeholder="${esc(ph)}" autocomplete="off" enterkeyhint="search"></div>
  <details class="oc-morefilters" open data-morefilters><summary>Más filtros</summary><div class="oc-morefilters-body">
  ${bandas ? `<div class="oc-field"><label for="fo">De la provincia de</label><select id="fo" data-f="origen"><option value="">Todas</option>${D.capitales.map((c) => `<option value="${c.slug}">${esc(c.nombre)}</option>`).join('')}</select></div>` : ''}
  <div class="oc-field"><label for="fc">${bandas ? 'Acompaña en' : 'Capital'}</label><select id="fc" data-f="ciudad"><option value="">Todas</option>${D.capitales.map((c) => `<option value="${c.slug}">${esc(c.nombre)}</option>`).join('')}</select></div>
  ${withDay ? `<div class="oc-field"><label for="fd">Día</label><select id="fd" data-f="dia"><option value="">Todos</option>${DAY_ORDER.filter((d) => D.hermandades.some((h) => h.dia === d)).map((d) => `<option value="${slugify(d)}">${esc(d)}</option>`).join('')}</select></div>` : ''}
  ${tipos ? `<div class="oc-field"><label for="ft">Tipo</label><select id="ft" data-f="tipo"><option value="">Todos</option>${tipos.map((t) => `<option value="${slugify(t)}">${esc(t)}</option>`).join('')}</select></div>` : ''}
  </div></details>
</div>
<p class="oc-count" aria-live="polite" data-dir-count>${total} resultados</p>`;
}
// Tras cada listado: el navegador muestra 50 y este botón carga 50 más (sin JS se ven todos).
const dirMore = '<p class="oc-dirmore" data-dir-more hidden><button class="oc-btn is-quiet" type="button">Mostrar 50 más</button></p>';
const dirEmpty = '<p class="oc-empty" data-dir-empty hidden>Ningún resultado con esos filtros. <button class="oc-textbtn" type="button" data-dir-reset>Quitar filtros</button></p>';
function pageDirHerm() {
  const items = [...D.hermandades].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')).map((h) => entryHerm(h, ` data-q="${esc(norm([h.nombre, h.nombre_oficial, h.sede, CAP[h.ciudad].nombre, h.dia, ...h.titulares.map((t) => t.nombre + ' ' + t.autor)].join(' ')))}" data-ciudad="${h.ciudad}" data-dia="${slugify(h.dia)}"`)).join('');
  const body = `<header class="oc-pagehead"><h1 class="oc-title">Hermandades</h1><p class="oc-lead">Las ${D.hermandades.length} hermandades de las ocho capitales. Filtra por ciudad, día o cualquier dato.</p></header>${dirFilters(true, null, D.hermandades.length)}<h2 class="oc-sr">Resultados</h2><ul class="oc-entries" data-dir>${items}</ul>${dirMore}${dirEmpty}`;
  write('hermandades/index.html', layout({ title: 'Hermandades', desc: `Directorio de las ${D.hermandades.length} hermandades de la Semana Santa de las capitales andaluzas, filtrable por ciudad y día.`, body, path: 'hermandades/', active: 'hermandades/', crumbs: [['Portada', u()], ['Hermandades', '']] }));
}
function pageDirBandas() {
  const tipos = [...new Set(D.bandas.map((b) => b.tipo))].sort();
  const items = [...D.bandas].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')).map((b) => { const cs = [...new Set(b.acompana.map((a) => a.ciudad))]; return entrySimple(u('banda/' + b.slug + '/'), b.nombre, [b.tipo, b.localidad].filter(Boolean).join(', '), cs, ` data-q="${esc(norm(b.nombre + ' ' + b.localidad + ' ' + b.acompana.map((a) => a.hermandad).join(' ')))}" data-ciudad="${cs.join(' ')}" data-origen="${b.origen || ''}" data-tipo="${slugify(b.tipo)}"`); }).join('');
  const body = `<header class="oc-pagehead"><h1 class="oc-title">Bandas y formaciones</h1><p class="oc-lead">Cornetas y tambores, agrupaciones musicales y bandas de música que acompañan a las hermandades.</p></header>${dirFilters(false, tipos, D.bandas.length, true, 'Nombre, localidad, hermandad…')}<h2 class="oc-sr">Resultados</h2><ul class="oc-entries" data-dir>${items}</ul>${dirMore}${dirEmpty}`;
  write('bandas/index.html', layout({ title: 'Bandas', desc: 'Bandas de cornetas y tambores, agrupaciones musicales y bandas de música que acompañan a las hermandades andaluzas.', body, path: 'bandas/', active: 'bandas/', crumbs: [['Portada', u()], ['Bandas', '']] }));
}
function pageDirImag() {
  const items = [...D.imagineros].sort((a, b) => b.obras.length - a.obras.length || a.nombre.localeCompare(b.nombre, 'es')).map((i) => entrySimple(u('imaginero/' + i.slug + '/'), i.nombre, `${plural(i.obras.length, 'obra', 'obras')}${i.vida ? ', ' + i.vida : ''}`, i.ciudades, ` data-q="${esc(norm(i.nombre + ' ' + i.escuela + ' ' + i.obras.map((o) => o.titular + ' ' + o.hermandad).join(' ')))}" data-ciudad="${i.ciudades.join(' ')}"`)).join('');
  const body = `<header class="oc-pagehead"><h1 class="oc-title">Imagineros</h1><p class="oc-lead">Los escultores de las imágenes que procesionan, ordenados por número de obras en el portal.</p></header>${dirFilters(false, null, D.imagineros.length, false, 'Nombre, obra, hermandad…')}<h2 class="oc-sr">Resultados</h2><ul class="oc-entries" data-dir>${items}</ul>${dirMore}${dirEmpty}`;
  write('imagineros/index.html', layout({ title: 'Imagineros', desc: 'Los escultores e imagineros de la Semana Santa andaluza y sus obras.', body, path: 'imagineros/', active: 'imagineros/', crumbs: [['Portada', u()], ['Imagineros', '']] }));
}
// iCalendar: un archivo con todo lo próximo y uno por capital. Hora de Madrid; sin hora = acto de día completo.
// Los títulos y notas vienen de fuentes externas: se eliminan saltos de línea y caracteres de control antes de escapar, para que no puedan añadir líneas al .ics.
const icsEsc = (t) => String(t || '').replace(/\r\n|\r|\n/g, '\\n').replace(/[\x00-\x08\x0b-\x1f\x7f]/g, '').replace(/\\(?!n)/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,');
// Plegado a 75 octetos (RFC 5545) sin partir caracteres con tilde.
const icsFold = (l) => { const out = []; let cur = '', bytes = 0; for (const ch of l) { const b = Buffer.byteLength(ch); if (bytes + b > 75) { out.push(cur); cur = ' '; bytes = 1; } cur += ch; bytes += b; } out.push(cur); return out.join('\r\n'); };
function icsDe(eventos, nombre) {
  const sello = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  const L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Ocho Capitales//Agenda cofrade//ES', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'X-WR-CALNAME:' + icsEsc(nombre), 'X-WR-TIMEZONE:Europe/Madrid', 'REFRESH-INTERVAL;VALUE=DURATION:PT6H', 'BEGIN:VTIMEZONE', 'TZID:Europe/Madrid', 'BEGIN:STANDARD', 'DTSTART:19701025T030000', 'TZOFFSETFROM:+0200', 'TZOFFSETTO:+0100', 'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU', 'END:STANDARD', 'BEGIN:DAYLIGHT', 'DTSTART:19700329T020000', 'TZOFFSETFROM:+0100', 'TZOFFSETTO:+0200', 'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU', 'END:DAYLIGHT', 'END:VTIMEZONE'];
  for (const e of eventos) {
    const dia = e.fecha.replace(/-/g, '');
    const uid = slugify(e.fecha + '-' + e.ciudad + '-' + e.titulo).slice(0, 80) + '@' + (SITE ? SITE.replace(/^https?:\/\//, '') : 'ocho-capitales');
    L.push('BEGIN:VEVENT', 'UID:' + uid, 'DTSTAMP:' + sello);
    if (e.hora) { const [hh, mm] = e.hora.split(':'); const fin = String(Math.min(23, +hh + 1)).padStart(2, '0'); L.push('DTSTART;TZID=Europe/Madrid:' + dia + 'T' + hh + mm + '00', 'DTEND;TZID=Europe/Madrid:' + dia + 'T' + fin + mm + '00'); }
    else { const sig = new Date(Date.parse(e.fecha + 'T12:00:00Z') + 864e5).toISOString().slice(0, 10).replace(/-/g, ''); L.push('DTSTART;VALUE=DATE:' + dia, 'DTEND;VALUE=DATE:' + sig); }
    L.push('SUMMARY:' + icsEsc(e.titulo), 'LOCATION:' + icsEsc(CAP[e.ciudad] ? CAP[e.ciudad].nombre : ''));
    const desc = [e.nota, e.fuentes ? 'Fuente: ' + e.fuentes.map((f) => f.medio + ' ' + f.url).join(' · ') : '', e.verificado ? '' : 'Acto detectado automáticamente: confirma el horario con la hermandad.'].filter(Boolean).join('\n');
    if (desc) L.push('DESCRIPTION:' + icsEsc(desc));
    L.push('END:VEVENT');
  }
  L.push('END:VCALENDAR');
  return L.map(icsFold).join('\r\n') + '\r\n';
}
function escribeIcs() {
  const N = madridNow(); const hoy = isoDay(Date.UTC(N.y, N.m - 1, N.d));
  const desde = isoDay(Date.parse(hoy + 'T12:00:00Z') - 14 * 864e5);
  const EV = agenda().filter((e) => e.tipo !== 'liturgico' && e.fecha >= desde);
  fs.writeFileSync(path.join(DIST, 'agenda.ics'), icsDe(EV, 'Ocho Capitales: agenda cofrade'));
  for (const c of D.capitales) fs.writeFileSync(path.join(DIST, 'agenda-' + c.slug + '.ics'), icsDe(EV.filter((e) => e.ciudad === c.slug), 'Ocho Capitales: ' + c.nombre));
}
function pageCalendario() {
  const EV = agenda();
  const N = madridNow();
  const today = isoDay(Date.UTC(N.y, N.m - 1, N.d));
  const proximos = EV.filter((e) => e.fecha >= today).slice(0, 14);
  const data = JSON.stringify(EV.map((e) => ({ f: e.fecha, t: e.tipo, g: GRUPO_DE[e.tipo], n: e.titulo, c: e.ciudad, o: e.nota || '', u: e.fuentes ? e.fuentes[0].url : '', m: e.fuentes ? e.fuentes.map((x) => x.medio).join(', ') : '', ...(e.hora ? { hr: e.hora } : {}), ...(hermDeEvento(e) ? { h: hermDeEvento(e), hn: HERM[hermDeEvento(e)].nombre, hu: u('hermandad/' + hermDeEvento(e) + '/') } : {}), ...(e.verificado ? { v: 1 } : {}) }))).replace(/</g, '\\u003c');
  const body = `<header class="oc-pagehead"><h1 class="oc-title">Calendario cofrade</h1><p class="oc-lead">La agenda de cultos, salidas y actos de las ocho capitales, y el orden de paso de cada jornada de la Semana Santa.</p></header>
<section class="oc-agenda" aria-labelledby="agenda-titulo" data-agenda data-hoy="${today}">
  <h2 class="oc-sr" id="agenda-titulo">Agenda cofrade</h2>
  <div class="oc-agenda-filters">
    <div class="oc-field oc-field-grow"><span class="oc-label" id="ag-tipo-l">Tipo</span><ul class="oc-chips is-filter" aria-labelledby="ag-tipo-l" data-agenda-tipo>${GRUPOS.map(([v, l], i) => `<li><button type="button" data-v="${v}" aria-pressed="${i === 0}">${l}</button></li>`).join('')}</ul></div>
    <div class="oc-field oc-field-grow"><span class="oc-label" id="ag-ciudad-l">Capital</span><ul class="oc-chips is-filter" aria-labelledby="ag-ciudad-l" data-agenda-ciudad><li><button type="button" data-v="" aria-pressed="true">Todas</button></li>${D.capitales.map((c) => `<li><button type="button" data-v="${c.slug}" aria-pressed="false">${esc(c.nombre)}</button></li>`).join('')}</ul></div>
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
  <p class="oc-note">Las fechas litúrgicas se calculan a partir de la Pascua. Los eventos marcados como «Confirmado» están verificados en fuentes oficiales o prensa; el resto se detecta automáticamente en las noticias cada hora. Confirma siempre en la fuente enlazada.</p>
  <div class="oc-subscribe"><h3 class="oc-h3">Llévatela a tu calendario</h3><p class="oc-note">Suscríbete y tu móvil se actualizará solo con los nuevos actos. En Google Calendar: «Otros calendarios» → «Desde URL» y pega el enlace. En iPhone o Mac: Ajustes → Calendario → Cuentas → Añadir calendario suscrito.</p><ul class="oc-linklist"><li><a class="oc-btn" href="${u('agenda.ics')}" download>Toda la agenda (.ics)</a></li>${D.capitales.map((c) => `<li><a class="oc-btn is-quiet" href="${u('agenda-' + c.slug + '.ics')}" download>${esc(c.nombre)}</a></li>`).join('')}</ul></div>
  <script type="application/json" id="oc-eventos">${data}</script>
  <script type="application/json" id="oc-tipos">${JSON.stringify(TIPOS)}</script>
</section>
<h2 class="oc-h2 oc-section" id="orden-de-paso">Orden de paso por capital</h2>
<p class="oc-note">Según la última configuración documentada. Consulta siempre los horarios oficiales del año.</p>
<div class="oc-captabs" role="tablist" aria-label="Capital" data-cal-tabs>${D.capitales.map((c, i) => `<a role="tab" id="caltab-${c.slug}" href="#cal-${c.slug}" aria-controls="cal-${c.slug}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}" data-city="${c.slug}">${esc(c.nombre)}</a>`).join('')}</div>
${D.capitales.map((c, i) => `<section class="oc-cal" id="cal-${c.slug}" role="tabpanel" aria-labelledby="caltab-${c.slug}" data-cal${i === 0 ? '' : ' hidden'} style="--c:${c.color}"><h2 class="oc-h2"><a href="${u('semana-santa/' + c.slug + '/')}">Semana Santa de ${esc(c.nombre)}</a></h2><div class="oc-cal-days">${byDay(conSalidas(hermsOf(c.slug))).map(([d, list]) => `<section class="oc-cal-day"><h3 class="oc-h3">${esc(d)}</h3><ol class="oc-order">${list.map((h) => `<li><a href="${u('hermandad/' + h.slug + '/')}">${esc(h.nombre)}${h.extra ? ` <small>(${esc(h.extra.titulares)})</small>` : ''}</a>${h.sede || h.hora ? `<span>${h.hora ? esc(fmtHora(h.hora)) + ' h' + (h.sede ? ', ' : '') : ''}${esc(h.sede)}</span>` : ''}</li>`).join('')}</ol></section>`).join('')}</div></section>`).join('')}`;
  // Datos estructurados solo para los actos confirmados (los detectados pueden cambiar de hora o no celebrarse).
  const offMadrid = (f) => { const p = new Intl.DateTimeFormat('en', { timeZone: 'Europe/Madrid', timeZoneName: 'shortOffset' }).formatToParts(new Date(f + 'T12:00:00Z')).find((x) => x.type === 'timeZoneName').value; const m = p.match(/([+-])(\d+)/); return m ? m[1] + m[2].padStart(2, '0') + ':00' : '+01:00'; };
  const eventLd = EV.filter((e) => e.verificado && e.fecha >= today).map((e) => ({ '@context': 'https://schema.org', '@type': 'Event', name: e.titulo, startDate: e.hora ? e.fecha + 'T' + e.hora + ':00' + offMadrid(e.fecha) : e.fecha, eventStatus: 'https://schema.org/EventScheduled', eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode', location: { '@type': 'Place', name: CAP[e.ciudad].nombre, address: { '@type': 'PostalAddress', addressLocality: CAP[e.ciudad].nombre, addressRegion: 'Andalucía', addressCountry: 'ES' } }, description: e.nota || undefined, isAccessibleForFree: true, url: abs('calendario/') }));
  write('calendario/index.html', layout({ jsonld: eventLd.length ? eventLd : null, title: 'Calendario cofrade', desc: 'Agenda cofrade de las ocho capitales andaluzas: Cuaresma, Semana Santa, salidas extraordinarias, vía crucis, cultos, conciertos y pregones, y el orden de paso de cada jornada.', body, path: 'calendario/', active: 'calendario/', crumbs: [['Portada', u()], ['Calendario', '']] }));
}
function pageBuscar() {
  const body = `<header class="oc-pagehead"><h1 class="oc-title">Buscar</h1></header><form class="oc-searchform" role="search" data-search-page action="${u('buscar/')}"><label class="oc-label" for="q-page">Hermandad, imagen, imaginero, banda, capital o noticia</label><div class="oc-searchform-row"><input id="q-page" name="q" type="search" autocomplete="off" autocapitalize="none" spellcheck="false" enterkeyhint="search"><button class="oc-btn" type="submit">${icon('search')}<span>Buscar</span></button></div></form><div class="oc-search-results is-page" data-search-page-results aria-live="polite"></div>
<section class="oc-explora" aria-labelledby="explora-t"><h2 class="oc-h2" id="explora-t">Explora</h2>
<ul class="oc-explora-caps">${D.capitales.map((c) => `<li><a href="${capHref(c)}" style="--c:${c.color}"><img src="${u('assets/plates/colgadura-' + c.slug + '.webp')}" alt="" width="265" height="971" loading="lazy" decoding="async"><span>${esc(c.nombre)}</span></a></li>`).join('')}</ul>
<ul class="oc-explora-dir">${[['hermandades/', 'Hermandades', D.hermandades.length], ['bandas/', 'Bandas', D.bandas.length], ['marchas/', 'Marchas', MARCHAS.length], ['imagineros/', 'Imagineros', D.imagineros.length], ['calendario/', 'Calendario', 0], ['noticias/', 'Noticias', 0]].map(([h, l, n]) => `<li><a href="${u(h)}"><span>${l}</span>${n ? `<b>${n}</b>` : ''}${icon('arrow')}</a></li>`).join('')}</ul>
</section>`;
  write('buscar/index.html', layout({ title: 'Buscar', desc: 'Buscador de hermandades, imágenes, imagineros, bandas, marchas y noticias de la Semana Santa andaluza.', body, path: 'buscar/', crumbs: [['Portada', u()], ['Buscar', '']] }));
}
function datosSemanaSanta() {
  const N = madridNow(); const hoy = Date.UTC(N.y, N.m - 1, N.d);
  let y = N.y; if (hoy > easter(y) + 864e5) y++;
  const P = easter(y); const dias = {};
  for (const sl of SLOTS) for (const d of sl.dias) dias[d] = isoDay(P + sl.off * 864e5);
  dias['Viernes de Dolores'] = isoDay(P - 9 * 864e5); dias['Sábado de Pasión'] = isoDay(P - 8 * 864e5);
  return { anio: y, dias, herms: Object.fromEntries(D.hermandades.map((h) => [h.slug, { d: h.dia, o: h.orden, c: h.ciudad }])), ciudades: Object.fromEntries(D.capitales.map((c) => [c.slug, c.nombre])) };
}
function pageFavoritos() {
  const body = `<header class="oc-pagehead"><h1 class="oc-title">Mis favoritos</h1><p class="oc-lead">Pulsa «Guardar» en cualquier hermandad, banda, imaginero o capital para tenerla aquí. Se guarda solo en este dispositivo, sin registro.</p></header><ul class="oc-entries" data-fav-list></ul><section class="oc-miss" data-mi-ss hidden><h2 class="oc-h2">Mi Semana Santa</h2><p class="oc-note">Tus hermandades guardadas, ordenadas por jornada. Descarga el calendario para tener cada salida en tu móvil (el horario exacto lo publica cada hermandad cuando se acerca la fecha).</p><ol class="oc-evs" data-mi-ss-list></ol><p><button class="oc-btn" type="button" data-mi-ss-ics>Descargar mi Semana Santa (.ics)</button></p><script type="application/json" id="oc-ss">${JSON.stringify(datosSemanaSanta()).replace(/</g, '\\u003c')}</script></section><div class="oc-emptystate" data-fav-empty><p>Aún no has guardado nada.</p><a class="oc-btn" href="${u('hermandades/')}">Explorar hermandades${icon('arrow')}</a></div>`;
  write('favoritos/index.html', layout({ title: 'Mis favoritos', desc: 'Tus hermandades, bandas e imagineros guardados.', body, path: 'favoritos/', crumbs: [['Portada', u()], ['Mis favoritos', '']] }));
}
function pageColabora() {
  const body = `<header class="oc-pagehead"><h1 class="oc-title">Colabora</h1><p class="oc-lead">Este portal se mejora con lo que sabe la gente cofrade. Si algo está mal o falta, cuéntalo. Lo más rápido es decírselo a erCuñao (el botón de abajo a la derecha): no hace falta ninguna cuenta. Si prefieres dejarlo por escrito en público, abajo tienes cómo hacerlo con una cuenta gratuita de GitHub.</p></header>
<div class="oc-prose">
<h2 class="oc-h2">Cómo avisar de un error o aportar un dato</h2>
<ol><li>En cada ficha (hermandad, banda, imaginero, marcha) encontrarás el enlace <strong>«Sugerir una corrección»</strong>.</li><li>Se abre una incidencia en GitHub con la página ya indicada (necesitas una cuenta gratuita de GitHub).</li><li>Explica qué cambiar y, si puedes, enlaza la fuente (web de la hermandad, prensa, redes oficiales).</li></ol>
<p><a class="oc-btn" href="${esc(issueUrl('Aportación: ', 'Sección o dato:\n\nQué aportas:\n\nEnlace a la fuente:\n'))}" target="_blank" rel="noopener">Abrir una incidencia nueva${icon('out')}</a></p>
<h2 class="oc-h2">Qué se puede aportar</h2>
<ul><li>Bandas que acompañan a cada paso este año (con el enlace del anuncio de la hermandad).</li><li>Cultos, traslados, rosarios y salidas extraordinarias con fecha y hora.</li><li>Marchas dedicadas: título, compositor, año y formación.</li><li>Hábito de nazareno, imagineros y datos históricos de una hermandad.</li></ul>
<h2 class="oc-h2">Cómo se revisa</h2>
<p>Todo dato nuevo necesita una fuente. Los actos detectados automáticamente se muestran sin la marca «Confirmado» hasta que alguien comprueba el horario. El código y los datos están abiertos en <a href="https://github.com/${REPO}" target="_blank" rel="noopener">GitHub</a>.</p>
</div>`;
  write('colabora/index.html', layout({ title: 'Colabora', desc: 'Cómo avisar de un error o aportar un dato a Ocho Capitales.', body, path: 'colabora/', crumbs: [['Portada', u()], ['Colabora', '']] }));
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
<h2 class="oc-h2">Noticias</h2><p>Se leen automáticamente cada hora de ${NEWS.fuentes ? Object.keys(NEWS.fuentes).length : 'decenas de'} fuentes: prensa andaluza, Google Noticias por capital y tema, y webs oficiales de hermandades y consejos. Solo se muestran el titular, un extracto breve y la imagen, siempre con enlace al medio original.</p>
<h2 class="oc-h2" id="imagenes">Créditos de imágenes</h2><p>Todas las imágenes proceden de Wikimedia Commons y se muestran con su autor y licencia.</p><p>El contorno del mapa de la portada procede de <a href="https://www.naturalearthdata.com/" target="_blank" rel="noopener">Natural Earth</a> (dominio público), simplificado.</p><ul class="oc-credits">${imgs}</ul></div>`;
  write('acerca/index.html', layout({ title: 'Fuentes y metodología', desc: `De dónde salen los datos y las noticias de ${BRAND}.`, body, path: 'acerca/', crumbs: [['Portada', u()], ['Fuentes y metodología', '']] }));
}
function pageOffline() {
  const body = `<header class="oc-pagehead"><h1 class="oc-title">Sin conexión</h1><p class="oc-lead">No hay red ahora mismo. Las páginas que ya has visitado siguen disponibles; vuelve a intentarlo cuando recuperes la cobertura.</p></header><p><a class="oc-btn" href="${u()}">Ir a la portada${icon('arrow')}</a></p>`;
  write('offline/index.html', layout({ title: 'Sin conexión', desc: 'Página de reserva sin conexión.', body, path: 'offline/' }));
}
function escribeSw() {
  const lista = (d) => fs.existsSync(path.join(DIST, d)) ? fs.readdirSync(path.join(DIST, d)).map((x) => BASE + d + '/' + x) : [];
  const shell = [BASE, BASE + 'offline/', BASE + 'assets/site.css?v=' + HUELLA.css, BASE + 'assets/site.js?v=' + HUELLA.js, ...lista('assets/fonts').filter((f) => f.endsWith('.woff2'))];
  fs.writeFileSync(path.join(DIST, 'sw.js'), `// Ocho Capitales: caché para usar el portal sin cobertura (en la calle, entre bullas). Generado por build.mjs.
const V = 'oc-${Date.now()}', BASE = ${JSON.stringify(BASE)}, SHELL = ${JSON.stringify(shell)};
self.addEventListener('install', (e) => { e.waitUntil(caches.open(V).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== V).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  const r = e.request; if (r.method !== 'GET') return;
  const url = new URL(r.url); if (url.origin !== location.origin || !url.pathname.startsWith(BASE)) return;
  if (r.mode === 'navigate') {
    // páginas: red primero (datos al día) y, sin red, la última copia o la página de reserva
    e.respondWith(fetch(r).then((res) => { if (res.ok) { const cp = res.clone(); caches.open(V).then((c) => c.put(r, cp)); } return res; }).catch(() => caches.match(r).then((m) => m || caches.match(BASE + 'offline/'))));
  } else if (/\\.(?:json|ics)$/.test(url.pathname)) {
    // datos (noticias, buscador, calendarios): red primero; la copia guardada solo sin conexión
    e.respondWith(fetch(r).then((res) => { if (res.ok) { const cp = res.clone(); caches.open(V).then((c) => c.put(r, cp)); } return res; }).catch(() => caches.match(r)));
  } else if (url.pathname.startsWith(BASE + 'assets/')) {
    // recursos: copia guardada al instante y se refresca en segundo plano
    e.respondWith(caches.open(V).then((c) => c.match(r).then((m) => { const net = fetch(r).then((res) => { if (res.ok) c.put(r, res.clone()); return res; }).catch(() => m); return m || net; })));
  }
});
`);
}
function page404() {
  write('404.html', layout({ title: 'Página no encontrada', desc: 'Esta página no existe.', body: `<div class="oc-emptystate is-404"><h1 class="oc-title">No encontramos esta página</h1><p>Puede que el enlace haya cambiado. Búscala o vuelve a la portada.</p><form class="oc-searchform" action="${u('buscar/')}" role="search"><label class="oc-label" for="q404">Buscar en ${BRAND}</label><div class="oc-searchform-row"><input id="q404" name="q" type="search" enterkeyhint="search"><button class="oc-btn" type="submit">${icon('search')}<span>Buscar</span></button></div></form><p><a class="oc-link" href="${u()}">${icon('back')}Volver a la portada</a></p></div>`, path: '404.html' }));
}

// ---------- índices y extras ----------
function searchIndex() {
  const idx = [];
  // i: miniatura (foto del titular o colgadura de la capital); c: capital, para el monograma de color si no hay foto
  for (const c of D.capitales) idx.push({ t: 'c', n: 'Semana Santa de ' + c.nombre, s: plural(hermsOf(c.slug).length, 'hermandad', 'hermandades'), u: 'semana-santa/' + c.slug + '/', i: u('assets/plates/colgadura-' + c.slug + '.webp'), c: c.slug, k: norm(c.nombre + ' semana santa capital') });
  for (const h of D.hermandades) idx.push({ t: 'h', n: h.nombre, s: CAP[h.ciudad].nombre + ', ' + h.dia, u: 'hermandad/' + h.slug + '/', i: h.imagen && h.imagen.local ? u(localUrl(h.imagen, h.imagen.sizes[0])) : '', c: h.ciudad, k: norm([h.nombre, h.nombre_oficial, h.sede, h.dia, CAP[h.ciudad].nombre, ...h.titulares.map((t) => t.nombre + ' ' + t.autor), ...(h.marchas || []).map((m) => m.titulo)].join(' ')) });
  for (const b of D.bandas) idx.push({ t: 'b', n: b.nombre, s: b.tipo + (b.localidad ? ', ' + b.localidad : ''), u: 'banda/' + b.slug + '/', k: norm(b.nombre + ' ' + b.localidad + ' ' + b.tipo) });
  for (const i of D.imagineros) idx.push({ t: 'i', n: i.nombre, s: plural(i.obras.length, 'obra', 'obras'), u: 'imaginero/' + i.slug + '/', k: norm(i.nombre + ' ' + i.escuela + ' ' + i.obras.map((o) => o.titular).join(' ')) });
  // todas las marchas: las dedicadas a una hermandad y las del catálogo de España (antes estas no se encontraban)
  for (const m of MARCHAS) idx.push({ t: 'm', n: m.titulo, s: `Marcha${m.autor ? ' de ' + m.autor : ''}${m.h ? ', ' + m.h.nombre : m.tipo ? ' · ' + m.tipo.toLowerCase() : ''}`, u: 'marcha/' + m.slug + '/', c: m.h ? m.h.ciudad : '', k: norm([m.titulo, m.autor, m.dedicatoria, m.h ? m.h.nombre : ''].join(' ')) });
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
  fs.writeFileSync(path.join(DIST, 'manifest.webmanifest'), JSON.stringify({ name: BRAND, short_name: BRAND, description: TAGLINE, lang: 'es', start_url: BASE, scope: BASE, display: 'standalone', background_color: '#f1f2f4', theme_color: '#ffffff', shortcuts: [['Hoy', ''], ['Calendario', 'calendario/'], ['Buscar', 'buscar/'], ['Mis favoritos', 'favoritos/']].map(([name, p]) => ({ name, url: u(p), icons: [{ src: u('assets/icon-192.png'), sizes: '192x192' }] })), icons: [{ src: u('assets/icon.svg'), sizes: 'any', type: 'image/svg+xml' }, { src: u('assets/icon-192.png'), sizes: '192x192', type: 'image/png' }, { src: u('assets/icon-512.png'), sizes: '512x512', type: 'image/png' }, { src: u('assets/icon-512.png'), sizes: '512x512', type: 'image/png', purpose: 'maskable' }] }));
  fs.writeFileSync(path.join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\n${SITE ? 'Sitemap: ' + SITE + '/sitemap.xml\n' : ''}`);
  if (SITE) fs.writeFileSync(path.join(DIST, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map((p) => `<url><loc>${SITE}/${p}</loc></url>`).join('\n')}\n</urlset>\n`);
  fs.writeFileSync(path.join(DIST, '.nojekyll'), '');
}

// ---------- En la calle: mapa propio con los recorridos oficiales y la posición estimada de cada cortejo ----------
// Datos por ciudad (dist/data/calle/<ciudad>.json): plano (calles en metros) + recorridos con tiempo (min del día) y XY.
const minDia = (t) => { const m = /^(\d{1,2})[:.](\d{2})/.exec(t || ''); return m ? +m[1] * 60 + +m[2] : null; };
// Jornadas de una capital con algún recorrido en el plano (para enlazar «En el plano» desde Hoy)
const _calleDias = {};
function calleDias(slug) {
  if (_calleDias[slug]) return _calleDias[slug];
  const f = path.join(DIR, 'data', 'recorridos', slug + '.json'), s = new Set();
  if (fs.existsSync(f)) for (const k of Object.keys(JSON.parse(fs.readFileSync(f, 'utf8')).hermandades)) if (HERM[k]) s.add(HERM[k].dia);
  return (_calleDias[slug] = s);
}
// Algunos PDF escriben el nombre de la calle en vertical y llega troceado («P e ri o d is ta R a m ó n»):
// si casi todas las piezas tienen 1-2 letras, se juntan y se vuelve a separar por mayúsculas.
function limpiaLugar(s) {
  if (!s) return '';
  const pz = s.trim().split(/\s+/);
  if (pz.length >= 4 && pz.filter((p) => p.length <= 2).length / pz.length > 0.6) s = pz.join('').replace(/([a-záéíóúñ.])([A-ZÁÉÍÓÚÑ])/g, '$1 $2');
  // horas pegadas al nombre («Jesús Gran PoderSalida 19:35» → «Jesús Gran Poder»)
  s = s.replace(/(Salida|Entrada|Recogida)\s*\d{1,2}[:.]\d{2}/gi, ' ');
  return s.replace(/\s+/g, ' ').trim();
}
function datosCalle(c) {
  const fP = path.join(DIR, 'data', 'planos', c.slug + '.json'), fR = path.join(DIR, 'data', 'recorridos', c.slug + '.json');
  if (!fs.existsSync(fP) || !fs.existsSync(fR)) return null;
  const P = JSON.parse(fs.readFileSync(fP, 'utf8')), R = JSON.parse(fs.readFileSync(fR, 'utf8'));
  const xy = (la, lo) => [Math.round((lo - P.origen[1]) * P.kx), Math.round((P.origen[0] - la) * P.ky)];
  const hs = [];
  for (const [slug, e] of Object.entries(R.hermandades)) {
    const h = HERM[slug]; if (!h) continue;
    const tramos = {};
    for (const [nom, pts] of Object.entries(e.tramos)) {
      // tiempo de cada punto: la hora exacta si la hay; si no, la franja de la rejilla. Pasada la medianoche, +24 h
      let t0 = null; const out = [];
      for (const p of pts) {
        if (p.lat == null) continue;
        let t = minDia(p.hora) ?? minDia(p.fila); if (t == null) continue;
        if (t0 == null) t0 = t; else if (t < t0 - 180) t += 1440;
        const [x, y] = xy(p.lat, p.lon);
        const q = [x, y, t, limpiaLugar(p.lugar), p.hora ? 1 : 0, p.como === 'estimado' ? 1 : 0];
        if (p.via && p.via.length) Object.defineProperty(q, 'via', { value: p.via.map(([la, lo]) => xy(la, lo)) });
        out.push(q);
      }
      // la rejilla puede repetir franjas: el tiempo nunca retrocede
      for (let i = 1; i < out.length; i++) if (out[i][2] < out[i - 1][2]) out[i][2] = out[i - 1][2];
      // Vértices por calle (tools/itinerarios/enrutar.mjs) entre cada par de puntos oficiales: la hora se reparte según la
      // distancia andada; llevan 1 en la 7.ª posición para que la lista, la ficha y la ruta usen solo los puntos oficiales.
      const conCalles = [];
      for (let i = 0; i < out.length; i++) {
        const a = out[i]; conCalles.push(a);
        const b = out[i + 1]; if (!b || !a.via) continue;
        const cad = [[a[0], a[1]], ...a.via, [b[0], b[1]]], tramo = [0];
        for (let k = 1; k < cad.length; k++) tramo.push(tramo[k - 1] + Math.hypot(cad[k][0] - cad[k - 1][0], cad[k][1] - cad[k - 1][1]));
        const L = tramo[tramo.length - 1] || 1;
        for (let k = 1; k < cad.length - 1; k++) conCalles.push([cad[k][0], cad[k][1], Math.round((a[2] + (b[2] - a[2]) * tramo[k] / L) * 10) / 10, a[3], 0, 0, 1]);
      }
      if (conCalles.length >= 2) tramos[/cruz/.test(nom) ? 'cruz' : 'paso'] = conCalles;
    }
    if (!Object.keys(tramos).length) continue;
    const im = h.imagen;
    hs.push({ s: slug, n: h.nombre, d: h.dia, o: h.orden, img: im && im.local ? u(localUrl(im, im.sizes[0])) : '', ini: h.nombre.replace(/^(La|El|Los|Las)\s+/i, '').charAt(0), t: tramos });
  }
  const fS = path.join(DIR, 'data', 'sitios', c.slug + '.json');
  const sitios = fs.existsSync(fS) ? JSON.parse(fs.readFileSync(fS, 'utf8')).map(([la, lo, t, n]) => [...xy(la, lo), t, n]) : [];
  return { ciudad: c.slug, nombre: c.nombre, color: c.color, origen: P.origen, kx: P.kx, ky: P.ky, calles: P.calles, principales: P.principales, templos: P.templos, etiquetas: P.etiquetas || [], hermandades: hs, sitios, fuente: Object.values(R.hermandades)[0] ? Object.values(R.hermandades)[0].fuente : '', anio: R.anio };
}
function pageCalle(c) {
  const datos = datosCalle(c); if (!datos) return;
  fs.mkdirSync(path.join(DIST, 'data', 'calle'), { recursive: true });
  fs.writeFileSync(path.join(DIST, 'data', 'calle', c.slug + '.json'), JSON.stringify(datos));
  const N = madridNow(); const anio = (Date.UTC(N.y, N.m - 1, N.d) > easter(N.y) + 864e5) ? N.y + 1 : N.y; const P = easter(anio);
  const fechas = {}; for (const sl of SLOTS) for (const d of sl.dias) fechas[d] = isoDay(P + sl.off * 864e5);
  fechas['Viernes de Dolores'] = isoDay(P - 9 * 864e5); fechas['Sábado de Pasión'] = isoDay(P - 8 * 864e5);
  const dias = [...new Set(datos.hermandades.map((h) => h.d))].sort((a, b) => dayIdx(a) - dayIdx(b));
  const body = `<header class="oc-calle-head"><p class="oc-kicker" style="--c:${c.color}">${esc(c.nombre)} · Recorridos</p><h1 class="oc-title">En la calle</h1><p class="oc-lead">Dónde va cada cofradía, minuto a minuto, sobre el plano de ${esc(c.nombre)}. Elige jornada y hora, o pulsa reproducir.</p></header>
<section class="oc-calle" data-calle="${u('data/calle/' + c.slug + '.json')}" data-fechas='${esc(JSON.stringify(fechas))}' style="--c:${c.color};--c-plate:${fondoLegible(c.color)}">
  <div class="oc-calle-dias" role="tablist" aria-label="Jornada">${dias.map((d, i) => `<button type="button" role="tab" aria-selected="${i ? 'false' : 'true'}" data-dia="${esc(d)}">${esc(d)}</button>`).join('')}</div>
  <div class="oc-calle-mapa" data-mapa><svg class="oc-calle-svg" aria-label="Plano de ${esc(c.nombre)} con los recorridos" role="img"></svg>
    <div class="oc-calle-ctl"><button class="oc-calle-btn" type="button" data-zoom="1" aria-label="Acercar">+</button><button class="oc-calle-btn" type="button" data-zoom="-1" aria-label="Alejar">−</button><button class="oc-calle-btn" type="button" data-yo aria-label="Mi ubicación"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3.2" fill="currentColor"/><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3" stroke="currentColor" stroke-width="1.8"/></svg></button><button class="oc-calle-btn" type="button" data-encuadrar aria-label="Ver toda la jornada"><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg></button></div>
    <p class="oc-calle-osm">Plano: © colaboradores de OpenStreetMap</p>
  </div>
  <div class="oc-calle-reloj"><button class="oc-calle-play" type="button" data-play aria-label="Reproducir la jornada"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" fill="currentColor"/></svg></button><div class="oc-calle-tiempo"><output class="oc-calle-hora" data-hora>--:--</output><input type="range" min="0" max="1" step="1" value="0" data-tiempo aria-label="Hora"></div><button class="oc-calle-ahora" type="button" data-ahora>Ahora</button></div>
  <section class="oc-ruta" aria-labelledby="ruta-t">
    <h2 class="oc-h2" id="ruta-t">Tu ruta de penitencia</h2>
    <p class="oc-ruta-intro">Te propongo dónde ponerte en cada momento para ver las cofradías de la jornada, cuánto se anda entre un sitio y otro y dónde tomar algo o comprar agua cerca.</p>
    <form class="oc-ruta-form" data-ruta-form>
      <label class="oc-field"><span class="oc-label">Empiezo a las</span><select data-ruta-inicio></select></label>
      <label class="oc-field"><span class="oc-label">Durante</span><select data-ruta-horas><option value="3">3 horas</option><option value="5" selected>5 horas</option><option value="8">8 horas</option></select></label>
      <fieldset class="oc-ruta-modo"><legend class="oc-label">Prefiero</legend><label><input type="radio" name="modo" value="maximo" checked><span>Ver el máximo</span></label><label><input type="radio" name="modo" value="tranquilo"><span>Evitar la bulla</span></label></fieldset>
      <button class="oc-btn" type="submit">Crear mi ruta</button>
    </form>
    <ol class="oc-ruta-paradas" data-ruta-paradas aria-live="polite"></ol>
    <p class="oc-note">La afluencia es una estimación según cuántas cofradías coinciden en la zona; los locales salen de OpenStreetMap y conviene confirmar su horario en Semana Santa.</p>
  </section>
  <h2 class="oc-h2">Cofradías de la jornada</h2>
  <ol class="oc-calle-lista" data-lista aria-live="polite"></ol>
  <div class="oc-sheet oc-calle-ficha" hidden data-ficha><div class="oc-sheet-panel" role="dialog" aria-modal="true" aria-labelledby="calle-ficha-t"><div class="oc-sheet-head"><p class="oc-sheet-title" id="calle-ficha-t" data-ficha-titulo></p><button class="oc-iconbtn" type="button" data-ficha-cerrar aria-label="Cerrar">${icon('x')}</button></div><div data-ficha-cuerpo></div></div></div>
</section>
<p class="oc-note">Recorridos del último itinerario oficial publicado (${datos.anio}: ${esc(datos.fuente)}). La posición es una <strong>estimación</strong> a partir de las horas de paso: el cortejo puede ir adelantado o retrasado. Cuando se publiquen los itinerarios de ${anio}, se actualizarán.</p>
<noscript><p class="oc-note">El mapa necesita JavaScript. Consulta los horarios en la página de <a href="${capHref(c)}">la Semana Santa de ${esc(c.nombre)}</a>.</p></noscript>`;
  write(`en-la-calle/${c.slug}/index.html`, layout({ title: `En la calle: recorridos de ${c.nombre}`, desc: `Mapa de los recorridos de las cofradías de ${c.nombre}, con la posición estimada de cada una a cada hora y cómo llegar.`, body, path: `en-la-calle/${c.slug}/`, active: 'capitales/', head: `<script src="${u('assets/calle.js')}?v=${HUELLA.calle}" defer></script>`, crumbs: [['Portada', u()], [c.nombre, capHref(c)], ['En la calle', '']] }));
}

// ---------- erCuñao: datos compactos que consulta el asistente (sin IA, todo en el navegador) ----------
function datosCunao() {
  const N = madridNow(); const anio = (Date.UTC(N.y, N.m - 1, N.d) > easter(N.y) + 864e5) ? N.y + 1 : N.y; const P = easter(anio);
  const fechas = {}; for (const sl of SLOTS) for (const d of sl.dias) fechas[d] = isoDay(P + sl.off * 864e5);
  fechas['Viernes de Dolores'] = isoDay(P - 9 * 864e5); fechas['Sábado de Pasión'] = isoDay(P - 8 * 864e5);
  const conMapa = new Set(D.capitales.filter((c) => fs.existsSync(path.join(DIR, 'data', 'recorridos', c.slug + '.json'))).map((c) => c.slug));
  // Tablas compartidas: bandas e imagineros se citan por índice para que el JSON siga siendo ligero
  const B = [], bIdx = new Map();
  const banda = (slug, nombre) => { const k = slug || 'n:' + nombre; if (!bIdx.has(k)) { const b = slug && BANDA[slug]; bIdx.set(k, B.length); B.push([b ? b.slug : '', b ? b.nombre : nombre, b ? b.tipo || '' : '', b ? b.localidad || '' : '']); } return bIdx.get(k); };
  const I = D.imagineros.map((i) => [i.slug, i.nombre, i.vida || '', i.escuela || '']);
  const iIdx = new Map(D.imagineros.map((i, k) => [i.slug, k]));
  const hhmm = (t) => { const m = /^(\d{1,2})[:.](\d{2})/.exec(t || ''); return m ? m[1].padStart(2, '0') + ':' + m[2] : ''; };
  const lugarOk = (s) => /[a-záéíóúñ]{3}/i.test(s || '') && !/^(.)\1+$/.test(s);
  // Recorridos: el tramo principal (paso; si no, palio o cruz de guía) como [hora, lugar, exacta]
  const R = {};
  for (const c of D.capitales) {
    const f = path.join(DIR, 'data', 'recorridos', c.slug + '.json'); if (!fs.existsSync(f)) continue;
    const j = JSON.parse(fs.readFileSync(f, 'utf8')); R[c.slug] = { anio: j.anio, r: {} };
    for (const [slug, e] of Object.entries(j.hermandades)) {
      if (!HERM[slug]) continue;
      const k = e.tramos.paso ? 'paso' : e.tramos.palio ? 'palio' : Object.keys(e.tramos)[0]; if (!k) continue;
      const pts = []; let prev = '';
      for (const p of e.tramos[k]) {
        const t = hhmm(p.hora) || hhmm(p.fila); if (!t) continue;
        const l = limpiaLugar(p.lugar).replace(/\s*\(\d{1,2}[,.:]\d{2}\)/g, '').replace(/\b\d{1,2}[:.]\d{2}\b/g, '').replace(/\s+/g, ' ').trim();
        const cof = /carrera|catedral/.test(p.como || '') || /carrera|c\. ?oficial|catedral|campana|tribuna/i.test(l) ? 1 : 0;
        if (!lugarOk(l) && pts.length) continue;
        if (l === prev && pts.length) continue; prev = l;
        pts.push([t, lugarOk(l) ? l : '', p.hora ? 1 : 0, cof]);
      }
      if (pts.length >= 2) R[c.slug].r[slug] = { k, f: e.fuente || '', p: pts };
    }
  }
  const resumen = (c, s) => {
    const x = R[c] && R[c].r[s]; if (!x) return undefined;
    const p = x.p, co = p.find((q) => q[3]);
    return [p[0][0], p[0][2], p.at(-1)[0], p.at(-1)[2], co ? co[1] : '', co ? co[0] : '', co ? co[2] : 0];
  };
  const hs = D.hermandades.map((h) => {
    const o = {
      s: h.slug, n: h.nombre, c: h.ciudad, d: h.dia, o: h.orden, h: hhmm(h.hora), se: h.sede || '', f: h.fundacion || '', w: h.web || '',
      t: (h.titulares || []).map((t) => [t.nombre.split(',')[0].trim(), t.autor || '', t.imaginero && iIdx.has(imagSlug(t.imaginero)) ? iIdx.get(imagSlug(t.imaginero)) : -1]),
    };
    // Música: por paso si hay acompañamiento publicado; si no, la lista de bandas de la ficha
    const ac = h.acompanamiento && h.acompanamiento.pasos || [];
    if (ac.length) { o.b = ac.map((p) => [p.paso, p.bandas.map((b) => banda(b.slug && BANDA[b.slug] ? b.slug : '', b.nombre))]); o.ba = h.acompanamiento.anio; }
    else if ((h.bandas_slugs || []).length) o.b = [['', h.bandas_slugs.filter((s) => BANDA[s]).map((s) => banda(s))]];
    if (h.musica) o.mu = h.musica;
    if ((h.marchas || []).length) o.nm = h.marchas.length;
    if ((h.salidas || []).length) o.x = h.salidas.map((s) => [s.dia, hhmm(s.hora), s.sede || '', s.titulares || '']);
    const r = resumen(h.ciudad, h.slug); if (r) o.r = r;
    return o;
  });
  fs.mkdirSync(path.join(DIST, 'data', 'cunao'), { recursive: true });
  fs.writeFileSync(path.join(DIST, 'data', 'cunao.json'), JSON.stringify({ v: 2, anio, fechas, dias: DAY_ORDER, capitales: D.capitales.map((c) => [c.slug, c.nombre]), mapa: [...conMapa], B, I, hermandades: hs }));
  // Por capital (se carga solo cuando hace falta): recorridos completos, historia, pasos, marchas dedicadas y las seis noticias más recientes
  for (const c of D.capitales) {
    const hi = {}, pa = {}, m = {};
    for (const h of hermsOf(c.slug)) {
      if (h.historia) hi[h.slug] = h.historia; if (h.paso) pa[h.slug] = h.paso;
      if ((h.marchas || []).length) m[h.slug] = h.marchas.map((x) => [x.titulo, x.autor || '', x.anio || '', MARCHA_SLUG.get(h.slug + '|' + x.titulo + '|' + (x.autor || '')) || '']);
    }
    const no = NEWS.items.filter((n) => (n.ciudades || []).includes(c.slug)).sort((a, b) => b.ts - a.ts).slice(0, 6).map((n) => [n.titulo, n.url, n.fuente || '', n.ts]);
    fs.writeFileSync(path.join(DIST, 'data', 'cunao', c.slug + '.json'), JSON.stringify({ anio: R[c.slug] ? R[c.slug].anio : null, r: R[c.slug] ? R[c.slug].r : {}, hi, pa, m, no }));
  }
}

fs.rmSync(DIST, { recursive: true, force: true });
pageHome(); pageNews(); pageCapitales(); pageCalendario(); pageDirHerm(); pageDirBandas(); pageDirMarchas(); pageDirImag(); pageBuscar(); pageFavoritos(); pageAcerca(); pageColabora(); pageOffline(); page404();
// /hermandad/, /banda/, /marcha/, /imaginero/ y /en-la-calle/ sin nombre (URL recortada a mano): a su listado, no a un 404
for (const [d, a] of [['hermandad', 'hermandades/'], ['banda', 'bandas/'], ['marcha', 'marchas/'], ['imaginero', 'imagineros/'], ['en-la-calle', 'capitales/']]) {
  write(`${d}/index.html`, `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="robots" content="noindex"><meta http-equiv="refresh" content="0;url=${u(a)}"><link rel="canonical" href="${u(a)}"><title>${BRAND}</title></head><body><p><a href="${u(a)}">Ir al listado</a></p></body></html>`);
}
D.capitales.forEach(pageCapital); D.capitales.forEach(pageCalle); D.hermandades.forEach(pageHerm); D.bandas.forEach(pageBanda); MARCHAS.forEach(pageMarcha); [...AUTORES.values()].forEach(pageCompositor); D.imagineros.forEach(pageImag);
searchIndex(); extras(); datosCunao(); escribeIcs(); escribeSw();
console.log(`${BRAND}: ${pages.length} páginas generadas en dist/ (base ${BASE}).`);
