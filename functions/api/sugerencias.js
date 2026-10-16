// Ocho Capitales · Cloudflare Pages Function: recoge las sugerencias que llegan por erCuñao y las guarda en D1 (gratis).
// POST /api/sugerencias  {texto, pagina, hermandad}  → guarda (sin datos personales; la IP solo como huella cifrada y
//                                                       con sal diaria, para frenar abusos)
// GET  /api/sugerencias?dias=7  con cabecera «Authorization: Bearer <RESUMEN_TOKEN>» → lista para el resumen semanal
// Tabla: ver datos/sugerencias.sql. Secretos del proyecto de Pages: RESUMEN_TOKEN (obligatorio) y SAL (recomendado).
const JSONH = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
const r = (cuerpo, estado = 200) => new Response(JSON.stringify(cuerpo), { status: estado, headers: JSONH });
const MAX = 16 * 1024;

async function huella(texto) {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto));
  return [...new Uint8Array(b)].slice(0, 8).map((x) => x.toString(16).padStart(2, '0')).join('');
}
// Comparación en tiempo constante (no revela por el tiempo de respuesta cuántos caracteres del token acierta)
function iguales(a, b) {
  const x = new TextEncoder().encode(a), y = new TextEncoder().encode(b);
  let d = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) d |= (x[i] || 0) ^ (y[i] || 0);
  return d === 0;
}

export async function onRequestPost({ request, env }) {
  if (!env.DB) return r({ error: 'sin base de datos' }, 503);
  // Solo desde la propia web (los navegadores siempre envían Origin en un POST con fetch)
  const origen = request.headers.get('Origin');
  if (origen && new URL(origen).host !== new URL(request.url).host) return r({ error: 'origen no permitido' }, 403);
  if (+(request.headers.get('Content-Length') || 0) > MAX) return r({ error: 'demasiado larga' }, 413);
  let d; try { const t = await request.text(); if (t.length > MAX) return r({ error: 'demasiado larga' }, 413); d = JSON.parse(t); } catch (e) { return r({ error: 'formato' }, 400); }
  if (!d || typeof d !== 'object') return r({ error: 'formato' }, 400);
  const texto = String(d.texto || '').trim().slice(0, 2000);
  if (texto.length < 8) return r({ error: 'demasiado corta' }, 400);
  const ip = request.headers.get('CF-Connecting-IP') || '';
  // Sal secreta + fecha: la huella cambia cada día y no se puede revertir probando todas las IP
  const sal = (env.SAL || env.RESUMEN_TOKEN || '') + new Date().toISOString().slice(0, 10);
  const h = await huella(ip + '|' + sal);
  // máximo 10 sugerencias por persona y día
  const n = await env.DB.prepare("SELECT count(*) n FROM sugerencias WHERE huella = ? AND fecha > datetime('now', '-1 day')").bind(h).first();
  if (n && n.n >= 10) return r({ error: 'demasiadas' }, 429);
  await env.DB.prepare('INSERT INTO sugerencias (fecha, texto, pagina, hermandad, huella) VALUES (datetime(\'now\'), ?, ?, ?, ?)')
    .bind(texto, String(d.pagina || '').slice(0, 200), String(d.hermandad || '').slice(0, 120), h).run();
  return r({ ok: true });
}

export async function onRequestGet({ request, env }) {
  const auth = request.headers.get('Authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!env.RESUMEN_TOKEN || !token || !iguales(token, env.RESUMEN_TOKEN)) return r({ error: 'no autorizado' }, 401);
  const u = new URL(request.url);
  const dias = Math.min(31, Math.max(1, +u.searchParams.get('dias') || 7));
  const { results } = await env.DB.prepare("SELECT id, fecha, texto, pagina, hermandad FROM sugerencias WHERE fecha > datetime('now', ?) ORDER BY fecha").bind(`-${dias} day`).all();
  return r({ dias, total: results.length, sugerencias: results });
}
