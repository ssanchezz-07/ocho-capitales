// Ocho Capitales: piezas de alojamiento que genera build.mjs y que no tocan el diseño.
// - sw.js: service worker (abre al instante con poca cobertura y funciona sin conexión).
// - _headers y _redirects: caché y seguridad en Cloudflare Pages (GitHub Pages los ignora).
// - Límites de Cloudflare Pages (plan gratuito): 20.000 archivos y 25 MiB por archivo.
// Uso suelto: node despliegue.mjs [carpeta]   → comprueba los límites de esa carpeta (por defecto dist) y sale con error si se pasa.
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

export const LIMITES = { archivos: 20000, aviso: 18000, bytes: 25 * 1024 * 1024 };

// ---------- service worker ----------
// Cachés con nombre fijo: una publicación nueva (cada hora, por las noticias) ya no borra las páginas guardadas.
// La versión solo cambia cuando cambian el CSS, el JS o las fuentes (la «carcasa» que se guarda al instalar).
export function escribeSw({ DIST, BASE, carcasa }) {
  const v = createHash('sha256').update(JSON.stringify(carcasa)).digest('hex').slice(0, 10);
  const sw = `// Ocho Capitales: caché para usar el portal sin cobertura (en la calle, entre bullas). Generado por despliegue.mjs.
const BASE = ${JSON.stringify(BASE)}, CARCASA = 'oc-carcasa-${v}', PAGINAS = 'oc-paginas', DATOS = 'oc-datos', RECURSOS = 'oc-recursos';
const LISTA = ${JSON.stringify(carcasa)};
const MAX = { [PAGINAS]: 120, [DATOS]: 30, [RECURSOS]: 250 }, ESPERA = 2500;
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CARCASA).then((c) => c.addAll(LISTA)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const vivas = [CARCASA, PAGINAS, DATOS, RECURSOS];
    for (const k of await caches.keys()) if (k.startsWith('oc-') && !vivas.includes(k)) await caches.delete(k);
    if (self.registration.navigationPreload) await self.registration.navigationPreload.enable();
    await self.clients.claim();
  })());
});
// Guarda una copia y recorta la caché a su máximo (se van las más antiguas)
function guarda(nombre, r, res) {
  if (!res || !res.ok || res.type === 'opaque') return;
  const cp = res.clone();
  caches.open(nombre).then((c) => c.put(r, cp).then(() => c.keys()).then((ks) => Promise.all(ks.slice(0, Math.max(0, ks.length - MAX[nombre])).map((k) => c.delete(k))))).catch(() => {});
}
// Red primero, pero si la red tarda más de ESPERA ms y hay copia, se enseña la copia (y la red la renueva para la próxima vez)
function redPrimero(e, nombre, reserva) {
  const r = e.request;
  const red = Promise.resolve(e.preloadResponse).then((p) => p || fetch(r)).then((res) => { guarda(nombre, r, res); return res; });
  e.waitUntil(red.then(() => {}, () => {}));
  const copia = caches.open(nombre).then((c) => c.match(r)).then((m) => m || (nombre === PAGINAS ? caches.match(r) : undefined));
  return new Promise((ok) => {
    let hecho = false; const da = (x) => { if (!hecho && x) { hecho = true; ok(x); } };
    const t = setTimeout(() => copia.then(da), ESPERA);
    red.then((res) => { clearTimeout(t); da(res); }, () => { clearTimeout(t); copia.then((m) => m || (reserva ? caches.match(reserva) : undefined)).then((m) => { da(m); if (!hecho) { hecho = true; ok(Response.error()); } }); });
  });
}
self.addEventListener('fetch', (e) => {
  const r = e.request; if (r.method !== 'GET') return;
  const url = new URL(r.url); if (url.origin !== location.origin || !url.pathname.startsWith(BASE)) return;
  if (url.pathname.startsWith(BASE + 'api/')) return;
  if (r.mode === 'navigate') {
    // páginas: al día si hay red; con poca cobertura, la última copia; sin nada, la página de reserva
    e.respondWith(redPrimero(e, PAGINAS, BASE + 'offline/'));
  } else if (/\\.(?:json|ics)$/.test(url.pathname)) {
    // datos (noticias, buscador, planos, calendarios): igual que las páginas
    e.respondWith(redPrimero(e, DATOS));
  } else if (url.pathname.startsWith(BASE + 'assets/')) {
    // recursos con huella (?v=) y fuentes: no cambian nunca, la copia vale siempre.
    // Imágenes y demás: la copia al instante y se renueva en segundo plano.
    const fijo = url.searchParams.has('v') || url.pathname.startsWith(BASE + 'assets/fonts/');
    e.respondWith(caches.match(r).then((m) => {
      if (m && fijo) return m;
      const red = fetch(r).then((res) => { guarda(RECURSOS, r, res); return res; });
      if (m) { e.waitUntil(red.catch(() => {})); return m; }
      return red;
    }));
  }
});
`;
  fs.writeFileSync(path.join(DIST, 'sw.js'), sw);
}

// ---------- cabeceras y redirecciones de Cloudflare Pages ----------
// Las reglas de caché no se solapan: si dos reglas ponen la misma cabecera, Cloudflare junta los valores con comas.
export function escribeCabeceras({ DIST, BASE, SITE }) {
  const b = BASE;
  const fijo = 'public, max-age=31536000, immutable';
  const reglas = [
    [b + '*', [
      'X-Content-Type-Options: nosniff',
      'Referrer-Policy: strict-origin-when-cross-origin',
      'X-Frame-Options: DENY',
      "Content-Security-Policy: frame-ancestors 'none'",
      'Cross-Origin-Opener-Policy: same-origin',
      'Permissions-Policy: camera=(), microphone=(), payment=(), usb=()',
      'Strict-Transport-Security: max-age=31536000',
    ]],
    // siempre se piden con ?v=<huella> (build.mjs): una versión nueva es otra URL
    ...['site.css', 'site.js', 'calle.js', 'plano.js', 'cunao.js', 'colabora.js'].map((f) => [b + 'assets/' + f, ['Cache-Control: ' + fijo]]),
    [b + 'assets/fonts/*', ['Cache-Control: ' + fijo]],
    // imágenes con nombre fijo: una semana, y renovación en segundo plano durante un mes
    [b + 'assets/img/*', ['Cache-Control: public, max-age=604800, stale-while-revalidate=2592000']],
    [b + 'assets/plates/*', ['Cache-Control: public, max-age=604800, stale-while-revalidate=2592000']],
    ...['og.png', 'icon.svg', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'].map((f) => [b + 'assets/' + f, ['Cache-Control: public, max-age=86400, stale-while-revalidate=604800']]),
    // noticias: se leen cada hora; 5 minutos de caché y la copia vale mientras llega la nueva
    [b + 'news.json', ['Cache-Control: public, max-age=300, stale-while-revalidate=3600']],
    [b + 'search-index.json', ['Cache-Control: public, max-age=3600, stale-while-revalidate=86400']],
    [b + 'search-marchas.json', ['Cache-Control: public, max-age=3600, stale-while-revalidate=86400']],
    [b + 'data/*', ['Cache-Control: public, max-age=3600, stale-while-revalidate=86400']],
    [b + 'manifest.webmanifest', ['Cache-Control: public, max-age=86400']],
    // el service worker se comprueba siempre: así llega enseguida cualquier arreglo
    [b + 'sw.js', ['Cache-Control: no-cache']],
    // vistas previas de cada despliegue (<hash>.ocho-capitales.pages.dev): fuera de Google
    ['https://:hash.ocho-capitales.pages.dev/*', ['X-Robots-Tag: noindex']],
  ];
  // con dominio propio, la dirección pages.dev tampoco se indexa (el canónico es el dominio)
  if (SITE && !/\.pages\.dev$/.test(new URL(SITE).hostname)) reglas.push(['https://ocho-capitales.pages.dev/*', ['X-Robots-Tag: noindex']]);
  fs.writeFileSync(path.join(DIST, '_headers'), '# Generado por site/despliegue.mjs (Cloudflare Pages). Máximo 100 reglas.\n' + reglas.map(([p, hs]) => p + '\n' + hs.map((h) => '  ' + h).join('\n')).join('\n\n') + '\n');
  // enlaces copiados de GitHub Pages (…/ocho-capitales/…) en el dominio nuevo
  if (b === '/') fs.writeFileSync(path.join(DIST, '_redirects'), '# Generado por site/despliegue.mjs\n/ocho-capitales/* /:splat 301\n/ocho-capitales /  301\n');
}

// ---------- límites ----------
export function comprobarLimites(DIST) {
  let archivos = 0, total = 0; const grandes = [];
  const anda = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) anda(p); else { const s = fs.statSync(p).size; archivos++; total += s; if (s > LIMITES.bytes) grandes.push([path.relative(DIST, p), s]); } } };
  anda(DIST);
  const errores = [];
  if (archivos > LIMITES.archivos) errores.push(`${archivos} archivos (límite de Cloudflare Pages gratis: ${LIMITES.archivos})`);
  for (const [p, s] of grandes) errores.push(`${p} pesa ${(s / 1048576).toFixed(1)} MiB (límite: 25 MiB)`);
  const aviso = archivos > LIMITES.aviso ? `${archivos} archivos: cerca del límite de ${LIMITES.archivos}` : '';
  return { archivos, total, errores, aviso };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const dir = path.resolve(process.argv[2] || path.join(path.dirname(fileURLToPath(import.meta.url)), 'dist'));
  const r = comprobarLimites(dir);
  console.log(`Límites de Cloudflare Pages: ${r.archivos} archivos, ${(r.total / 1048576).toFixed(0)} MB en ${dir}`);
  if (r.aviso) console.log('::warning::' + r.aviso);
  for (const e of r.errores) console.log('::error::' + e);
  process.exit(r.errores.length ? 1 : 0);
}
