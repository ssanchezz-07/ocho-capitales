// Servidor local mínimo para previsualizar dist/ en http://localhost:8080
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';
const DIST = path.join(path.dirname(fileURLToPath(import.meta.url)), 'dist');
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json', '.xml': 'application/xml', '.txt': 'text/plain', '.png': 'image/png' };
const PORT = process.env.PORT || 8080;
// Con BASE_PATH (p. ej. /ocho-capitales/) se sirve igual que en GitHub Pages.
const BASE = (process.env.BASE_PATH || '/').replace(/\/?$/, '/');
http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (BASE !== '/') { if (!p.startsWith(BASE)) { res.writeHead(404); return res.end(); } p = '/' + p.slice(BASE.length); }
  let f = path.join(DIST, p);
  if (!f.startsWith(DIST)) { res.writeHead(403); return res.end(); }
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { res.writeHead(404, { 'Content-Type': TYPES['.html'] }); return fs.createReadStream(path.join(DIST, '404.html')).pipe(res); }
  // Comprime como GitHub Pages para que las pruebas de rendimiento locales sean comparables.
  const type = TYPES[path.extname(f)] || 'application/octet-stream';
  if (/gzip/.test(req.headers['accept-encoding'] || '') && /text|json|xml|svg|javascript|manifest/.test(type)) {
    res.writeHead(200, { 'Content-Type': type, 'Content-Encoding': 'gzip', Vary: 'Accept-Encoding' });
    return fs.createReadStream(f).pipe(zlib.createGzip()).pipe(res);
  }
  res.writeHead(200, { 'Content-Type': type });
  fs.createReadStream(f).pipe(res);
}).listen(PORT, () => console.log('InfoCofrade en http://localhost:' + PORT));
