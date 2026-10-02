// InfoCofrade — generador del sitio estático (dist/).
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
const NEWS = fs.existsSync(NEWS_FILE) ? JSON.parse(fs.readFileSync(NEWS_FILE, 'utf8')) : { items: [], actualizado: 0 };
const BRAND = 'InfoCofrade';

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const u = (p = '') => BASE + String(p).replace(/^\//, '');
const abs = (p) => (SITE ? SITE + '/' + String(p).replace(/^\//, '') : u(p));
const slugify = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// ---------- índices ----------
const CAP = Object.fromEntries(D.capitales.map((c) => [c.slug, c]));
const IMAG = Object.fromEntries(D.imagineros.map((i) => [i.slug, i]));
const BANDA = Object.fromEntries(D.bandas.map((b) => [b.slug, b]));
const HERM = Object.fromEntries(D.hermandades.map((h) => [h.slug, h]));
const DAY_ORDER = D.dias_orden;
const dayIdx = (d) => { const i = DAY_ORDER.indexOf(d); return i < 0 ? 99 : i; };
const imagSlug = (name) => (name ? slugify(name) : '');
const pages = [];

function write(rel, html) {
  const f = path.join(DIST, rel);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, html);
  if (rel.endsWith('index.html')) pages.push(rel.replace(/index\.html$/, ''));
}

// ---------- piezas ----------
const LOGO = `<svg class="ic-logo-mark" viewBox="0 0 40 40" aria-hidden="true"><defs><linearGradient id="icg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6a3497"/><stop offset="1" stop-color="#2f1446"/></linearGradient></defs><rect width="40" height="40" rx="10" fill="url(#icg)"/><path d="M20 7v26M12.5 15h15" stroke="#e7c873" stroke-width="3.4" stroke-linecap="round"/><circle cx="20" cy="15" r="3.2" fill="#e7c873"/></svg>`;

function imgTag(im, alt, cls = '', sizes = '(max-width: 600px) 100vw, 33vw') {
  if (!im) return '';
  const w = im.w || 900; const h = im.h || 600;
  return `<img src="${esc(String(im.src).split("?")[0])}" alt="${esc(alt)}" width="${w}" height="${h}" loading="lazy" decoding="async" sizes="${sizes}" class="${cls}">`;
}
function credit(im) {
  if (!im) return '';
  const lic = im.licurl ? `<a href="${esc(im.licurl)}" rel="license noopener" target="_blank">${esc(im.licencia)}</a>` : esc(im.licencia);
  return `Imagen: ${esc(im.autor || 'autor en Wikimedia Commons')} · ${lic} · <a href="${esc(im.pagina)}" target="_blank" rel="noopener">Wikimedia Commons</a>`;
}
const badge = (slug) => (CAP[slug] ? `<span class="pcof-badge" style="--c:${CAP[slug].color}">${esc(CAP[slug].nombre)}</span>` : '');
const favBtn = (type, slug, name) => `<button class="ic-fav" type="button" data-fav="${type}:${slug}" data-name="${esc(name)}" aria-pressed="false" title="Guardar en favoritos"><span aria-hidden="true">☆</span><span class="ic-fav-txt">Guardar</span></button>`;

function cardHerm(h, extra = '') {
  const c = CAP[h.ciudad];
  const im = h.imagen;
  const thumb = im ? `<div class="pcof-thumb${im.escudo ? ' is-escudo' : ''}">${imgTag(im, h.nombre)}</div>` : `<div class="pcof-thumb" style="--pcof-accent:${c.color}"></div>`;
  const tit = h.titulares.slice(0, 2).map((t) => t.nombre).join(' · ');
  return `<article class="pcof-card pcof-entry" style="--pcof-accent:${c.color}"${extra}>${thumb}<div class="pcof-card-body"><div class="pcof-meta">${badge(h.ciudad)}<span class="pcof-pill">${esc(h.dia)}</span></div><h3><a href="${u('hermandad/' + h.slug + '/')}">${esc(h.nombre)}</a></h3><p>${esc(tit || h.sede)}</p></div></article>`;
}
function cardSimple(href, title, sub, cities, extra = '', im = null) {
  const thumb = im ? `<div class="pcof-thumb${im.escudo ? ' is-escudo' : ''}">${imgTag(im, title)}</div>` : '';
  return `<article class="pcof-card pcof-entry"${extra}>${thumb}<div class="pcof-card-body"><div class="pcof-meta">${(cities || []).map(badge).join('')}</div><h3><a href="${href}">${esc(title)}</a></h3>${sub ? `<p>${esc(sub)}</p>` : ''}</div></article>`;
}
function newsCard(n) {
  const when = new Date(n.ts);
  const img = n.img ? `<a class="pcof-thumb" href="${esc(n.url)}" target="_blank" rel="nofollow noopener noreferrer" tabindex="-1" aria-hidden="true"><img src="${esc(n.img)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.parentNode.remove()"></a>` : '';
  return `<article class="pcof-card pcof-news">${img}<div class="pcof-card-body"><div class="pcof-meta">${n.ciudades.map(badge).join('')}<span class="pcof-src">${esc(n.fuente)}</span><time datetime="${when.toISOString()}" data-ago>${when.toLocaleDateString('es-ES')}</time></div><h3><a href="${esc(n.url)}" target="_blank" rel="nofollow noopener noreferrer">${esc(n.titulo)}</a></h3>${n.extracto ? `<p>${esc(n.extracto)}</p>` : ''}<span class="pcof-more">Leer en ${esc(n.fuente)} ↗</span></div></article>`;
}
const newsFor = (city, n = 6) => NEWS.items.filter((x) => !city || x.ciudades.includes(city)).slice(0, n);

function layout({ title, desc, body, path: p = '', image = '', accent = '', jsonld = null, active = '' }) {
  const fullTitle = title ? `${title} · ${BRAND}` : `${BRAND} — Semana Santa de Andalucía: noticias, hermandades y bandas`;
  const canonical = abs(p);
  const nav = [['noticias/', 'Noticias'], ['capitales/', 'Capitales'], ['calendario/', 'Calendario'], ['hermandades/', 'Hermandades'], ['bandas/', 'Bandas'], ['imagineros/', 'Imagineros']];
  return `<!doctype html>
<html lang="es" class="ic-site">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(desc || 'Noticias cofrades diarias e historia de las hermandades, bandas e imagineros de la Semana Santa de las ocho capitales andaluzas.')}">
<link rel="canonical" href="${esc(canonical)}">
<meta property="og:site_name" content="${BRAND}"><meta property="og:type" content="website"><meta property="og:title" content="${esc(fullTitle)}"><meta property="og:description" content="${esc(desc || '')}"><meta property="og:url" content="${esc(canonical)}">${image ? `<meta property="og:image" content="${esc(image)}">` : ''}
<meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}">
<meta name="theme-color" content="#3a1758">
<link rel="icon" href="${u('assets/icon.svg')}" type="image/svg+xml">
<link rel="manifest" href="${u('manifest.webmanifest')}">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700&family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${u('assets/portal.css')}">
<link rel="stylesheet" href="${u('assets/site.css')}">
${jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld)}</script>` : ''}
<script>try{var t=localStorage.getItem('ic-theme');if(t)document.documentElement.dataset.theme=t;}catch(e){}window.IC_BASE=${JSON.stringify(BASE)};window.IC_COLORS=${JSON.stringify(Object.fromEntries(D.capitales.map((c) => [c.slug, c.color])))};</script>
</head>
<body>
<a class="ic-skip" href="#contenido">Saltar al contenido</a>
<header class="ic-header">
  <div class="ic-wrap ic-header-in">
    <a class="ic-logo" href="${u()}" aria-label="${BRAND}, inicio">${LOGO}<span class="ic-logo-txt">Info<b>Cofrade</b></span></a>
    <nav class="ic-nav" aria-label="Principal"><ul>${nav.map(([h, l]) => `<li><a href="${u(h)}"${active === h ? ' aria-current="page"' : ''}>${l}</a></li>`).join('')}</ul></nav>
    <div class="ic-tools">
      <button class="ic-iconbtn" type="button" data-open-search aria-label="Buscar (tecla /)"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg></button>
      <a class="ic-iconbtn" href="${u('favoritos/')}" aria-label="Mis favoritos"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.2l1.1-6.2L3 9.6l6.2-.9z"/></svg></a>
      <button class="ic-iconbtn" type="button" data-theme-toggle aria-label="Cambiar tema claro/oscuro"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg></button>
      <button class="ic-iconbtn ic-menu-btn" type="button" data-menu aria-expanded="false" aria-label="Menú"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button>
    </div>
  </div>
</header>
<main id="contenido" class="ic-wrap pcof" ${accent ? `style="--pcof-accent:${accent}"` : ''}>
${body}
</main>
<footer class="ic-footer">
  <div class="ic-wrap ic-footer-in">
    <div><a class="ic-logo" href="${u()}">${LOGO}<span class="ic-logo-txt">Info<b>Cofrade</b></span></a><p>La Semana Santa de Andalucía en un solo lugar: noticias de cada día, historia, hermandades, bandas e imagineros de las ocho capitales.</p></div>
    <div><h2>Explora</h2><ul>${D.capitales.map((c) => `<li><a href="${u('semana-santa/' + c.slug + '/')}">${esc(c.nombre)}</a></li>`).join('')}</ul></div>
    <div><h2>InfoCofrade</h2><ul><li><a href="${u('acerca/')}">Fuentes y metodología</a></li><li><a href="${u('acerca/#imagenes')}">Créditos de imágenes</a></li><li><a href="${u('buscar/')}">Buscador</a></li><li><a href="${u('favoritos/')}">Mis favoritos</a></li></ul></div>
  </div>
  <p class="ic-wrap ic-legal">Las noticias pertenecen a sus medios y se enlazan a la fuente original. Datos de hermandades contrastados con consejos, agrupaciones y federaciones oficiales. Imágenes de Wikimedia Commons con su licencia.</p>
</footer>
<div class="ic-search-overlay" hidden data-search-overlay>
  <div class="ic-search-box" role="dialog" aria-modal="true" aria-label="Buscar en InfoCofrade">
    <div class="ic-search-row"><input type="search" placeholder="Hermandad, imagen, imaginero, banda, marcha…" aria-label="Buscar" data-search-input autocomplete="off"><button class="ic-iconbtn" type="button" data-close-search aria-label="Cerrar">✕</button></div>
    <div class="ic-search-results" data-search-results aria-live="polite"><p class="pcof-note">Escribe al menos 2 letras. Consejo: pulsa <kbd>/</kbd> en cualquier página.</p></div>
  </div>
</div>
<script src="${u('assets/site.js')}" defer></script>
</body>
</html>`;
}

const crumbs = (items) => `<nav class="pcof-crumbs" aria-label="Migas de pan">${items.map(([l, h]) => (h ? `<a href="${h}">${esc(l)}</a>` : `<span>${esc(l)}</span>`)).join(' › ')}</nav>`;
const facts = (rows) => { const r = rows.filter(([, v]) => v && String(v).trim()); return r.length ? `<dl class="pcof-facts">${r.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${v}</dd></div>`).join('')}</dl>` : ''; };
const section = (title, inner, id = '') => (inner && inner.trim() ? `<section class="pcof-section"${id ? ` id="${id}"` : ''}><h2>${title}</h2>${inner}</section>` : '');
const chips = (links) => (links.length ? `<ul class="pcof-chips">${links.map(([l, h]) => `<li><a href="${h}">${esc(l)}</a></li>`).join('')}</ul>` : '');
const p = (t) => (t ? `<p>${esc(t)}</p>` : '');
const mapLink = (q) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;

// ---------- Semana Santa: cuenta atrás ----------
function easter(y) { const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451), mo = Math.floor((h + l - 7 * m + 114) / 31), da = ((h + l - 7 * m + 114) % 31) + 1; return new Date(Date.UTC(y, mo - 1, da)); }

// ---------- páginas ----------
function pageHome() {
  const featured = newsFor('', 9);
  const caps = D.capitales.map((c) => `<article class="pcof-card pcof-cap" style="--c:${c.color}">${c.imagen ? `<div class="pcof-thumb">${imgTag(c.imagen, 'Semana Santa en ' + c.nombre)}</div>` : `<div class="pcof-thumb" style="--pcof-accent:${c.color}"></div>`}<div class="pcof-card-body"><h3><a href="${u('semana-santa/' + c.slug + '/')}">${esc(c.nombre)}</a></h3><p>${esc(c.lema)}</p><p class="pcof-meta"><span class="pcof-pill">${D.hermandades.filter((h) => h.ciudad === c.slug).length} hermandades</span></p></div></article>`).join('');
  const days = DAY_ORDER.filter((d) => D.hermandades.some((h) => h.dia === d));
  const body = `
<section class="pcof-hero">
  <p class="pcof-kicker">Semana Santa de Andalucía</p>
  <h1>Toda la información cofrade, en un solo sitio</h1>
  <p>Noticias de cada día de la prensa y de las webs oficiales, y la enciclopedia de las ocho capitales: ${D.hermandades.length} hermandades, sus titulares, imagineros, bandas y marchas.</p>
  <form class="pcof-search" action="${u('buscar/')}" role="search"><label class="ic-sr" for="q-home">Buscar</label><input id="q-home" name="q" type="search" placeholder="Busca una hermandad, imagen o imaginero (p. ej. Gran Poder, Juan de Mesa)"><button type="submit">Buscar</button></form>
  <ul class="pcof-stats"><li><strong>${D.hermandades.length}</strong>hermandades</li><li><strong>${D.imagineros.length}</strong>imagineros</li><li><strong>${D.bandas.length}</strong>bandas</li><li><strong>8</strong>capitales</li></ul>
  <p class="pcof-countdown" data-countdown hidden></p>
</section>
${section('Última hora cofrade', `<div class="pcof-grid pcof-grid-news">${featured.map(newsCard).join('') || '<p class="pcof-empty">Las noticias se cargan con la próxima actualización.</p>'}</div><p><a class="pcof-btn" href="${u('noticias/')}">Ver todas las noticias</a></p>`)}
${section('Las ocho capitales', `<div class="pcof-grid pcof-grid-caps">${caps}</div>`)}
${section('¿Qué día sale?', `<ul class="pcof-chips">${days.map((d) => `<li><a href="${u('hermandades/?dia=' + slugify(d))}">${esc(d)}</a></li>`).join('')}</ul>`)}
${section('Explora', `<ul class="pcof-chips"><li><a href="${u('calendario/')}">Calendario por días</a></li><li><a href="${u('hermandades/')}">Todas las hermandades</a></li><li><a href="${u('bandas/')}">Bandas</a></li><li><a href="${u('imagineros/')}">Imagineros</a></li><li><a href="${u('favoritos/')}">Mis favoritos</a></li></ul>`)}`;
  write('index.html', layout({ title: '', desc: 'Noticias cofrades diarias e historia de hermandades, bandas e imagineros de la Semana Santa de Sevilla, Málaga, Granada, Córdoba, Cádiz, Huelva, Almería y Jaén.', body, path: '', jsonld: { '@context': 'https://schema.org', '@type': 'WebSite', name: BRAND, url: abs(''), potentialAction: { '@type': 'SearchAction', target: abs('buscar/') + '?q={q}', 'query-input': 'required name=q' } } }));
}

function pageNews() {
  const body = `${crumbs([['Inicio', u()], ['Noticias', '']])}
<h1 class="ic-title">Noticias cofrades</h1>
<p class="pcof-note">Titulares de prensa, agregadores y webs oficiales de hermandades y consejos. Cada noticia enlaza a su medio. Última actualización: <time data-ago datetime="${new Date(NEWS.actualizado || Date.now()).toISOString()}"></time>.</p>
<div class="pcof-filters" data-news-filters>
  <input type="search" placeholder="Buscar en las noticias…" aria-label="Buscar en las noticias" data-f="q">
  <ul class="pcof-chips" data-f="ciudad"><li><button type="button" data-v="" aria-pressed="true">Todas</button></li>${D.capitales.map((c) => `<li><button type="button" data-v="${c.slug}" aria-pressed="false">${esc(c.nombre)}</button></li>`).join('')}</ul>
</div>
<div class="pcof-grid pcof-grid-news" data-news-list>${NEWS.items.slice(0, 24).map(newsCard).join('')}</div>
<p class="pcof-empty" data-news-empty hidden>No hay noticias con esos filtros.</p>
<p style="text-align:center"><button class="pcof-btn is-ghost" type="button" data-news-more>Cargar más</button></p>`;
  write('noticias/index.html', layout({ title: 'Noticias cofrades', desc: 'Noticias cofrades de hoy de la Semana Santa de Andalucía: hermandades, bandas, pregones y carteles.', body, path: 'noticias/', active: 'noticias/' }));
}

function pageCapitales() {
  const body = `${crumbs([['Inicio', u()], ['Capitales', '']])}<h1 class="ic-title">Las ocho capitales</h1><div class="pcof-grid pcof-grid-caps">${D.capitales.map((c) => `<article class="pcof-card pcof-cap" style="--c:${c.color}">${c.imagen ? `<div class="pcof-thumb">${imgTag(c.imagen, c.nombre)}</div>` : ''}<div class="pcof-card-body"><h3><a href="${u('semana-santa/' + c.slug + '/')}">${esc(c.nombre)}</a></h3><p>${esc(c.lema)}</p></div></article>`).join('')}</div>`;
  write('capitales/index.html', layout({ title: 'Capitales', desc: 'La Semana Santa de las ocho capitales andaluzas.', body, path: 'capitales/', active: 'capitales/' }));
}

function byDay(list) {
  const g = {};
  for (const h of list) (g[h.dia] = g[h.dia] || []).push(h);
  return Object.entries(g).sort((a, b) => dayIdx(a[0]) - dayIdx(b[0])).map(([d, hs]) => [d, hs.sort((a, b) => a.orden - b.orden)]);
}

function pageCapital(c) {
  const hs = D.hermandades.filter((h) => h.ciudad === c.slug);
  const groups = byDay(hs);
  const bandas = D.bandas.filter((b) => b.acompana.some((a) => a.ciudad === c.slug));
  const imag = D.imagineros.filter((i) => i.ciudades.includes(c.slug));
  const intro = c.intro.map(p).join('');
  const datos = c.datos.length ? `<table class="pcof-datos"><tbody>${c.datos.map(([k, v]) => `<tr><th scope="row">${esc(k)}</th><td>${esc(v)}</td></tr>`).join('')}</tbody></table>` : '';
  const claves = c.claves.length ? `<ul>${c.claves.map((k) => `<li>${esc(k)}</li>`).join('')}</ul>` : '';
  const body = `${crumbs([['Inicio', u()], ['Capitales', u('capitales/')], [c.nombre, '']])}
<div class="pcof-hero-ficha${c.imagen ? ' has-img' : ''}">
  <div><p class="pcof-kicker">Semana Santa</p><h1 class="ic-title ic-title-city" style="color:${c.color}">${esc(c.nombre)}</h1><p class="pcof-lema">${esc(c.lema)}</p>${favBtn('capital', c.slug, 'Semana Santa en ' + c.nombre)}</div>
  ${c.imagen ? `<figure class="pcof-figure">${imgTag(c.imagen, 'Semana Santa en ' + c.nombre, '', '(max-width: 820px) 100vw, 45vw')}<figcaption>${credit(c.imagen)}</figcaption></figure>` : ''}
</div>
<div class="pcof-body">${intro}</div>
${section('Datos clave', datos)}
${section('Imprescindibles', claves)}
<h2 class="pcof-h2">Hermandades por día <small>${hs.length} en total</small></h2>
<nav class="pcof-daynav" aria-label="Días">${groups.map(([d]) => `<a href="#${slugify(d)}">${esc(d)}</a>`).join('')}</nav>
${groups.map(([d, list]) => `<section class="pcof-section" id="${slugify(d)}"><h2>${esc(d)} <small>${list.length} ${list.length === 1 ? 'hermandad' : 'hermandades'}</small></h2><div class="pcof-grid">${list.map((h) => cardHerm(h)).join('')}</div></section>`).join('')}
${section('Bandas y música', chips(bandas.map((b) => [b.nombre, u('banda/' + b.slug + '/')])))}
${section('Imagineros con obra en la ciudad', chips(imag.map((i) => [i.nombre, u('imaginero/' + i.slug + '/')])))}
${section('Últimas noticias de ' + esc(c.nombre), `<div class="pcof-grid pcof-grid-news">${newsFor(c.slug, 6).map(newsCard).join('')}</div><p><a class="pcof-btn is-ghost" href="${u('noticias/?ciudad=' + c.slug)}">Más noticias de ${esc(c.nombre)}</a></p>`)}`;
  write(`semana-santa/${c.slug}/index.html`, layout({ title: 'Semana Santa de ' + c.nombre, desc: `${c.lema} Las ${hs.length} hermandades de ${c.nombre} por días, con su historia, titulares, imagineros y bandas.`, body, path: `semana-santa/${c.slug}/`, image: c.imagen?.src, accent: c.color, active: 'capitales/' }));
}

function pageHerm(h) {
  const c = CAP[h.ciudad];
  const im = h.imagen;
  const tit = h.titulares.map((t) => {
    const s = imagSlug(t.imaginero);
    const autor = t.autor ? (s && IMAG[s] ? `<a href="${u('imaginero/' + s + '/')}">${esc(t.autor)}</a>` : esc(t.autor)) : '<span class="pcof-note">—</span>';
    return `<tr><td><strong>${esc(t.nombre)}</strong></td><td>${autor}</td></tr>`;
  }).join('');
  const bandas = (h.bandas_slugs || []).filter((s) => BANDA[s]).map((s) => [BANDA[s].nombre, u('banda/' + s + '/')]);
  const musicaOf = (h.musica_oficial || []).length ? `<div class="pcof-scroll"><table class="pcof-table"><thead><tr><th>Paso / titular</th><th>Formación</th></tr></thead><tbody>${h.musica_oficial.map((m) => `<tr><td>${esc(m.titular)}</td><td>${esc(m.banda)}</td></tr>`).join('')}</tbody></table></div><p class="pcof-note">Acompañamiento musical oficial de 2026 publicado por la Agrupación.</p>` : '';
  const marchas = (h.marchas || []).length ? `<div class="pcof-scroll"><table class="pcof-table"><thead><tr><th>Marcha</th><th>Compositor</th><th>Año</th><th>Formación</th></tr></thead><tbody>${h.marchas.map((m) => `<tr><td>${esc(m.titulo)}</td><td>${esc(m.autor)}</td><td>${esc(m.anio)}</td><td>${esc(m.tipo)}</td></tr>`).join('')}</tbody></table></div>` : '';
  const isWiki = /wikipedia\.org/.test(h.fuente_url || '');
  const fuente = h.fuente_url ? `<p class="pcof-note">Fuente de los datos: <a href="${esc(h.fuente_url)}" target="_blank" rel="noopener">${isWiki ? 'artículo de Wikipedia (CC BY-SA 4.0)' : 'ficha oficial en ' + esc(new URL(h.fuente_url).hostname)}</a>.</p>` : '';
  const vecinos = D.hermandades.filter((x) => x.ciudad === h.ciudad && x.dia === h.dia).sort((a, b) => a.orden - b.orden);
  const idx = vecinos.findIndex((x) => x.slug === h.slug);
  const prev = vecinos[idx - 1]; const next = vecinos[idx + 1];
  const body = `${crumbs([['Inicio', u()], [c.nombre, u('semana-santa/' + c.slug + '/')], [h.dia, u('semana-santa/' + c.slug + '/#' + slugify(h.dia))], [h.nombre, '']])}
<div class="pcof-hero-ficha${im ? ' has-img' : ''}">
  <div>
    <p class="pcof-kicker">${esc(c.nombre)} · ${esc(h.dia)}</p>
    <h1 class="ic-title">${esc(h.nombre)}</h1>
    ${h.nombre_oficial ? `<p class="ic-subtitle">${esc(h.nombre_oficial)}</p>` : ''}
    <div class="ic-actions">${favBtn('hermandad', h.slug, h.nombre + ' (' + c.nombre + ')')}<button class="pcof-btn is-ghost" type="button" data-share>Compartir</button>${h.sede ? `<a class="pcof-btn is-ghost" href="${mapLink(h.sede + ', ' + c.nombre)}" target="_blank" rel="noopener">Cómo llegar</a>` : ''}</div>
    ${facts([['Día', esc(h.dia)], ['Sede', esc(h.sede)], ['Fundación', esc(h.fundacion)], ['Web oficial', h.web ? `<a href="${esc(h.web)}" target="_blank" rel="noopener">${esc(h.web.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, ''))}</a>` : '']])}
  </div>
  ${im ? `<figure class="pcof-figure${im.escudo ? ' is-escudo' : ''}">${imgTag(im, h.nombre, '', '(max-width: 820px) 100vw, 45vw')}<figcaption>${credit(im)}</figcaption></figure>` : ''}
</div>
<div class="pcof-body">${p(h.historia)}</div>
${section('Titulares e imagineros', tit ? `<div class="pcof-scroll"><table class="pcof-table"><thead><tr><th>Titular</th><th>Autor y año</th></tr></thead><tbody>${tit}</tbody></table></div>` : '')}
${section('Pasos y cortejo', p(h.paso))}
${section('Acompañamiento musical', (musicaOf || p(h.musica)) + (bandas.length ? '<h3 class="ic-h3">Bandas en InfoCofrade</h3>' + chips(bandas) : ''))}
${section('Marchas dedicadas', marchas)}
${fuente}
<nav class="ic-prevnext" aria-label="Hermandades del mismo día">${prev ? `<a href="${u('hermandad/' + prev.slug + '/')}">← ${esc(prev.nombre)}</a>` : '<span></span>'}${next ? `<a href="${u('hermandad/' + next.slug + '/')}">${esc(next.nombre)} →</a>` : ''}</nav>
${section('Noticias de ' + esc(c.nombre), `<div class="pcof-grid pcof-grid-news">${newsFor(c.slug, 3).map(newsCard).join('')}</div>`)}`;
  write(`hermandad/${h.slug}/index.html`, layout({
    title: `${h.nombre} (${c.nombre})`, desc: `${h.nombre}, hermandad de la Semana Santa de ${c.nombre} que procesiona el ${h.dia}. ${h.historia}`.slice(0, 300), body, path: `hermandad/${h.slug}/`, image: im?.src, accent: c.color, active: 'hermandades/',
    jsonld: { '@context': 'https://schema.org', '@type': 'Organization', name: h.nombre_oficial || h.nombre, alternateName: h.nombre, foundingDate: (h.fundacion.match(/\d{4}/) || [])[0], address: h.sede ? { '@type': 'PostalAddress', streetAddress: h.sede, addressLocality: c.nombre, addressCountry: 'ES' } : undefined, url: h.web || undefined, image: im?.src },
  }));
}

function pageBanda(b) {
  const links = b.acompana.filter((a) => HERM[a.hermandad_slug]).map((a) => [`${HERM[a.hermandad_slug].nombre} (${CAP[a.ciudad].nombre})${a.rol ? ' — ' + a.rol : ''}`, u('hermandad/' + a.hermandad_slug + '/')]);
  const body = `${crumbs([['Inicio', u()], ['Bandas', u('bandas/')], [b.nombre, '']])}<p class="pcof-kicker">${esc(b.tipo)}</p><h1 class="ic-title">${esc(b.nombre)}</h1><div class="ic-actions">${favBtn('banda', b.slug, b.nombre)}</div>${facts([['Tipo', esc(b.tipo)], ['Localidad', esc(b.localidad)]])}${section('Acompaña a', chips(links))}<p class="pcof-note">Configuración musical según la última información recopilada; las hermandades la cambian con frecuencia de un año a otro.</p>`;
  write(`banda/${b.slug}/index.html`, layout({ title: b.nombre, desc: `${b.nombre} (${b.tipo}${b.localidad ? ', ' + b.localidad : ''}): hermandades a las que acompaña en la Semana Santa andaluza.`, body, path: `banda/${b.slug}/`, active: 'bandas/' }));
}

function pageImag(i) {
  const rows = i.obras.map((o) => `<tr><td><strong>${esc(o.titular)}</strong>${o.atrib ? ' <em class="pcof-note">(atribución)</em>' : ''}</td><td>${HERM[o.hermandad_slug] ? `<a href="${u('hermandad/' + o.hermandad_slug + '/')}">${esc(o.hermandad)}</a>` : esc(o.hermandad)}</td><td>${esc(CAP[o.ciudad]?.nombre)}</td><td><small>${esc(o.detalle)}</small></td></tr>`).join('');
  const body = `${crumbs([['Inicio', u()], ['Imagineros', u('imagineros/')], [i.nombre, '']])}<p class="pcof-kicker">Imaginero</p><h1 class="ic-title">${esc(i.nombre)}</h1><div class="ic-actions">${favBtn('imaginero', i.slug, i.nombre)}</div>${facts([['Años', esc(i.vida)], ['Escuela', esc(i.escuela)], ['Obras en el portal', String(i.obras.length)]])}<div class="pcof-body">${p(i.bio)}</div>${section('Obras en la Semana Santa andaluza', `<div class="pcof-scroll"><table class="pcof-table"><thead><tr><th>Imagen</th><th>Hermandad</th><th>Capital</th><th>Detalle</th></tr></thead><tbody>${rows}</tbody></table></div>`)}`;
  write(`imaginero/${i.slug}/index.html`, layout({ title: i.nombre, desc: `${i.nombre}${i.vida ? ' (' + i.vida + ')' : ''}: ${i.obras.length} obras en la Semana Santa de Andalucía. ${i.bio || ''}`.slice(0, 300), body, path: `imaginero/${i.slug}/`, active: 'imagineros/' }));
}

function dirFilters(withDay, tipos) {
  return `<div class="pcof-filters" data-dir-filters>
  <input type="search" data-f="q" placeholder="Filtrar por nombre, sede, titular, imaginero…" aria-label="Filtrar">
  <select data-f="ciudad" aria-label="Capital"><option value="">Todas las capitales</option>${D.capitales.map((c) => `<option value="${c.slug}">${esc(c.nombre)}</option>`).join('')}</select>
  ${withDay ? `<select data-f="dia" aria-label="Día"><option value="">Todos los días</option>${DAY_ORDER.filter((d) => D.hermandades.some((h) => h.dia === d)).map((d) => `<option value="${slugify(d)}">${esc(d)}</option>`).join('')}</select>` : ''}
  ${tipos ? `<select data-f="tipo" aria-label="Tipo"><option value="">Todos los tipos</option>${tipos.map((t) => `<option value="${slugify(t)}">${esc(t)}</option>`).join('')}</select>` : ''}
  <span class="pcof-count" aria-live="polite"></span>
</div>`;
}
function pageDirHerm() {
  const cards = [...D.hermandades].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')).map((h) => cardHerm(h, ` data-q="${esc(norm([h.nombre, h.nombre_oficial, h.sede, CAP[h.ciudad].nombre, h.dia, ...h.titulares.map((t) => t.nombre + ' ' + t.autor)].join(' ')))}" data-ciudad="${h.ciudad}" data-dia="${slugify(h.dia)}"`)).join('');
  const body = `${crumbs([['Inicio', u()], ['Hermandades', '']])}<h1 class="ic-title">Hermandades</h1>${dirFilters(true)}<div class="pcof-grid" data-dir>${cards}</div><p class="pcof-empty" data-dir-empty hidden>Ningún resultado con esos filtros.</p>`;
  write('hermandades/index.html', layout({ title: 'Hermandades', desc: `Directorio de las ${D.hermandades.length} hermandades de la Semana Santa de las capitales andaluzas, filtrable por ciudad y día.`, body, path: 'hermandades/', active: 'hermandades/' }));
}
function pageDirBandas() {
  const tipos = [...new Set(D.bandas.map((b) => b.tipo))].sort();
  const cards = [...D.bandas].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')).map((b) => { const cs = [...new Set(b.acompana.map((a) => a.ciudad))]; return cardSimple(u('banda/' + b.slug + '/'), b.nombre, [b.tipo, b.localidad].filter(Boolean).join(' · '), cs, ` data-q="${esc(norm(b.nombre + ' ' + b.localidad + ' ' + b.acompana.map((a) => a.hermandad).join(' ')))}" data-ciudad="${cs.join(' ')}" data-tipo="${slugify(b.tipo)}"`); }).join('');
  const body = `${crumbs([['Inicio', u()], ['Bandas', '']])}<h1 class="ic-title">Bandas y formaciones musicales</h1>${dirFilters(false, tipos)}<div class="pcof-grid" data-dir>${cards}</div><p class="pcof-empty" data-dir-empty hidden>Ningún resultado con esos filtros.</p>`;
  write('bandas/index.html', layout({ title: 'Bandas', desc: 'Bandas de cornetas y tambores, agrupaciones musicales y bandas de música que acompañan a las hermandades andaluzas.', body, path: 'bandas/', active: 'bandas/' }));
}
function pageDirImag() {
  const cards = [...D.imagineros].sort((a, b) => b.obras.length - a.obras.length || a.nombre.localeCompare(b.nombre, 'es')).map((i) => cardSimple(u('imaginero/' + i.slug + '/'), i.nombre, `${i.obras.length} ${i.obras.length === 1 ? 'obra' : 'obras'}${i.vida ? ' · ' + i.vida : ''}`, i.ciudades, ` data-q="${esc(norm(i.nombre + ' ' + i.escuela + ' ' + i.obras.map((o) => o.titular + ' ' + o.hermandad).join(' ')))}" data-ciudad="${i.ciudades.join(' ')}"`)).join('');
  const body = `${crumbs([['Inicio', u()], ['Imagineros', '']])}<h1 class="ic-title">Imagineros</h1>${dirFilters(false)}<div class="pcof-grid" data-dir>${cards}</div><p class="pcof-empty" data-dir-empty hidden>Ningún resultado con esos filtros.</p>`;
  write('imagineros/index.html', layout({ title: 'Imagineros', desc: 'Los escultores e imagineros de la Semana Santa andaluza y sus obras.', body, path: 'imagineros/', active: 'imagineros/' }));
}
function pageCalendario() {
  const body = `${crumbs([['Inicio', u()], ['Calendario', '']])}<h1 class="ic-title">Calendario de hermandades</h1><p class="pcof-note">Orden de paso según la última configuración documentada. Consulta siempre los horarios oficiales de cada año.</p>
<nav class="pcof-tabs" aria-label="Capital" data-cal-tabs>${D.capitales.map((c, i) => `<a href="#cal-${c.slug}"${i === 0 ? ' aria-current="true"' : ''}>${esc(c.nombre)}</a>`).join('')}</nav>
${D.capitales.map((c, i) => `<section class="ic-cal" id="cal-${c.slug}" data-cal${i === 0 ? '' : ' hidden'} style="--pcof-accent:${c.color}"><h2>${esc(c.nombre)}</h2>${byDay(D.hermandades.filter((h) => h.ciudad === c.slug)).map(([d, list]) => `<h3 class="ic-h3">${esc(d)}</h3><ol class="pcof-order">${list.map((h) => `<li><a href="${u('hermandad/' + h.slug + '/')}">${esc(h.nombre)}</a>${h.sede ? ` <small>${esc(h.sede)}</small>` : ''}</li>`).join('')}</ol>`).join('')}</section>`).join('')}`;
  write('calendario/index.html', layout({ title: 'Calendario de hermandades', desc: 'Qué hermandades salen cada día de la Semana Santa en las ocho capitales andaluzas.', body, path: 'calendario/', active: 'calendario/' }));
}
function pageBuscar() {
  const body = `${crumbs([['Inicio', u()], ['Buscar', '']])}<h1 class="ic-title">Buscar en InfoCofrade</h1><form class="pcof-search" role="search" data-search-page><label class="ic-sr" for="q-page">Buscar</label><input id="q-page" name="q" type="search" placeholder="Hermandad, imagen, imaginero, banda, marcha…" autocomplete="off"><button type="submit">Buscar</button></form><div data-search-page-results aria-live="polite"></div>`;
  write('buscar/index.html', layout({ title: 'Buscar', desc: 'Buscador de hermandades, imágenes, imagineros, bandas y marchas.', body, path: 'buscar/' }));
}
function pageFavoritos() {
  const body = `${crumbs([['Inicio', u()], ['Mis favoritos', '']])}<h1 class="ic-title">Mis favoritos</h1><p class="pcof-note">Pulsa «Guardar» en cualquier hermandad, banda, imaginero o capital para tenerla aquí. Se guarda solo en este dispositivo, sin registro.</p><div class="pcof-grid" data-fav-list></div><p class="pcof-empty" data-fav-empty>Aún no has guardado nada.</p>`;
  write('favoritos/index.html', layout({ title: 'Mis favoritos', desc: 'Tus hermandades, bandas e imagineros guardados.', body, path: 'favoritos/' }));
}
function pageAcerca() {
  const imgs = D.hermandades.filter((h) => h.imagen).map((h) => `<li><a href="${u('hermandad/' + h.slug + '/')}">${esc(h.nombre)} (${esc(CAP[h.ciudad].nombre)})</a>: ${credit(h.imagen)}</li>`).join('') + D.capitales.filter((c) => c.imagen).map((c) => `<li>${esc(c.nombre)}: ${credit(c.imagen)}</li>`).join('');
  const body = `${crumbs([['Inicio', u()], ['Fuentes y metodología', '']])}<h1 class="ic-title">Fuentes y metodología</h1>
<div class="pcof-body"><p>InfoCofrade reúne en un solo sitio la actualidad y la historia de la Semana Santa de las ocho capitales andaluzas.</p>
<h2>De dónde salen los datos</h2><ul>
<li><strong>Málaga:</strong> fichas oficiales de la Agrupación de Cofradías de Semana Santa de Málaga.</li>
<li><strong>Granada:</strong> fichas oficiales de la Real Federación de Hermandades y Cofradías de Granada.</li>
<li><strong>Córdoba:</strong> fichas oficiales de la Agrupación de Hermandades y Cofradías de Córdoba.</li>
<li><strong>Cádiz:</strong> fichas oficiales del Consejo Local de Hermandades y Cofradías.</li>
<li><strong>Huelva:</strong> fichas oficiales del Consejo de Hermandades y Cofradías de la Ciudad de Huelva.</li>
<li><strong>Almería:</strong> fichas y horarios oficiales de la Agrupación de Hermandades y Cofradías (incluido el acompañamiento musical de 2026).</li>
<li><strong>Jaén:</strong> fichas oficiales de la Agrupación de Cofradías y Hermandades de la Ciudad de Jaén.</li>
<li><strong>Sevilla:</strong> el Consejo General no publica fichas por hermandad; se usan los artículos de Wikipedia (CC BY-SA 4.0) para sede, fundación y titulares.</li></ul>
<p>Las reseñas están redactadas por InfoCofrade a partir de esas fuentes; cada ficha enlaza a la suya. Si detectas un error, la ficha oficial de la hermandad prevalece.</p>
<h2>Noticias</h2><p>Se leen automáticamente cada pocas horas de ${NEWS.fuentes ? Object.keys(NEWS.fuentes).length : 'decenas de'} fuentes (prensa andaluza, Google Noticias por capital y tema, y webs oficiales de hermandades y consejos). Solo se muestran titular, un extracto breve e imagen, siempre con enlace al medio original.</p>
<h2 id="imagenes">Créditos de imágenes</h2><p>Todas las imágenes proceden de Wikimedia Commons y se muestran con su autor y licencia.</p><ul class="ic-credits">${imgs}</ul></div>`;
  write('acerca/index.html', layout({ title: 'Fuentes y metodología', desc: 'De dónde salen los datos y las noticias de InfoCofrade.', body, path: 'acerca/' }));
}
function page404() {
  write('404.html', layout({ title: 'Página no encontrada', body: `<h1 class="ic-title">No encontramos esta página</h1><p>Prueba con el buscador o vuelve a la <a href="${u()}">portada</a>.</p><form class="pcof-search" action="${u('buscar/')}"><input name="q" type="search" placeholder="Buscar…" aria-label="Buscar"><button>Buscar</button></form>`, path: '404.html' }));
}

// ---------- índices y extras ----------
function searchIndex() {
  const idx = [];
  for (const h of D.hermandades) idx.push({ t: 'h', n: h.nombre, s: CAP[h.ciudad].nombre + ' · ' + h.dia, u: 'hermandad/' + h.slug + '/', k: norm([h.nombre, h.nombre_oficial, h.sede, h.dia, CAP[h.ciudad].nombre, ...h.titulares.map((t) => t.nombre + ' ' + t.autor), ...(h.marchas || []).map((m) => m.titulo)].join(' ')) });
  for (const i of D.imagineros) idx.push({ t: 'i', n: i.nombre, s: i.obras.length + ' obras', u: 'imaginero/' + i.slug + '/', k: norm(i.nombre + ' ' + i.escuela + ' ' + i.obras.map((o) => o.titular).join(' ')) });
  for (const b of D.bandas) idx.push({ t: 'b', n: b.nombre, s: b.tipo + (b.localidad ? ' · ' + b.localidad : ''), u: 'banda/' + b.slug + '/', k: norm(b.nombre + ' ' + b.localidad) });
  for (const c of D.capitales) idx.push({ t: 'c', n: 'Semana Santa de ' + c.nombre, s: c.lema, u: 'semana-santa/' + c.slug + '/', k: norm(c.nombre + ' semana santa') });
  for (const h of D.hermandades) for (const m of h.marchas || []) idx.push({ t: 'm', n: m.titulo, s: `Marcha${m.autor ? ' de ' + m.autor : ''} · ${h.nombre}`, u: 'hermandad/' + h.slug + '/', k: norm(m.titulo + ' ' + m.autor) });
  fs.writeFileSync(path.join(DIST, 'search-index.json'), JSON.stringify(idx));
}
function extras() {
  fs.mkdirSync(path.join(DIST, 'assets'), { recursive: true });
  for (const f of fs.readdirSync(path.join(DIR, 'assets'))) fs.copyFileSync(path.join(DIR, 'assets', f), path.join(DIST, 'assets', f));
  fs.writeFileSync(path.join(DIST, 'assets', 'icon.svg'), LOGO.replace('class="ic-logo-mark" ', 'xmlns="http://www.w3.org/2000/svg" '));
  fs.writeFileSync(path.join(DIST, 'news.json'), JSON.stringify({ actualizado: NEWS.actualizado, items: NEWS.items.slice(0, 600).map(({ h, t, ...n }) => n) }));
  fs.writeFileSync(path.join(DIST, 'manifest.webmanifest'), JSON.stringify({ name: BRAND, short_name: BRAND, lang: 'es', start_url: BASE, scope: BASE, display: 'standalone', background_color: '#f7f3ee', theme_color: '#3a1758', icons: [{ src: u('assets/icon.svg'), sizes: 'any', type: 'image/svg+xml' }] }));
  fs.writeFileSync(path.join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\n${SITE ? 'Sitemap: ' + SITE + '/sitemap.xml\n' : ''}`);
  if (SITE) fs.writeFileSync(path.join(DIST, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${pages.map((p) => `<url><loc>${SITE}/${p}</loc></url>`).join('')}</urlset>`);
  fs.writeFileSync(path.join(DIST, '.nojekyll'), '');
}

fs.rmSync(DIST, { recursive: true, force: true });
pageHome(); pageNews(); pageCapitales(); pageCalendario(); pageDirHerm(); pageDirBandas(); pageDirImag(); pageBuscar(); pageFavoritos(); pageAcerca(); page404();
D.capitales.forEach(pageCapital); D.hermandades.forEach(pageHerm); D.bandas.forEach(pageBanda); D.imagineros.forEach(pageImag);
searchIndex(); extras();
console.log(`InfoCofrade: ${pages.length} páginas generadas en dist/ (base ${BASE}).`);
