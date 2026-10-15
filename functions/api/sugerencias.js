// Ocho Capitales · Cloudflare Pages Function: recoge las sugerencias que llegan por erCuñao y las guarda en D1 (gratis).
// POST /api/sugerencias  {texto, pagina, hermandad}  → guarda (sin datos personales; IP solo como huella para frenar abusos)
// GET  /api/sugerencias?token=…&dias=7               → lista para el resumen semanal (solo con el token secreto RESUMEN_TOKEN)
// Tabla: ver datos/sugerencias.sql
const JSONH = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' };
const r = (cuerpo, estado = 200) => new Response(JSON.stringify(cuerpo), { status: estado, headers: JSONH });

async function huella(texto) {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto));
  return [...new Uint8Array(b)].slice(0, 8).map((x) => x.toString(16).padStart(2, '0')).join('');
}

export async function onRequestPost({ request, env }) {
  if (!env.DB) return r({ error: 'sin base de datos' }, 503);
  let d; try { d = await request.json(); } catch (e) { return r({ error: 'formato' }, 400); }
  const texto = String(d.texto || '').trim().slice(0, 2000);
  if (texto.length < 8) return r({ error: 'demasiado corta' }, 400);
  const ip = request.headers.get('CF-Connecting-IP') || '';
  const h = await huella(ip + (env.SAL || 'ocho'));
  // máximo 10 sugerencias por persona y día
  const n = await env.DB.prepare("SELECT count(*) n FROM sugerencias WHERE huella = ? AND fecha > datetime('now', '-1 day')").bind(h).first();
  if (n && n.n >= 10) return r({ error: 'demasiadas' }, 429);
  await env.DB.prepare('INSERT INTO sugerencias (fecha, texto, pagina, hermandad, huella) VALUES (datetime(\'now\'), ?, ?, ?, ?)')
    .bind(texto, String(d.pagina || '').slice(0, 200), String(d.hermandad || '').slice(0, 120), h).run();
  return r({ ok: true });
}

export async function onRequestGet({ request, env }) {
  const u = new URL(request.url);
  if (!env.RESUMEN_TOKEN || u.searchParams.get('token') !== env.RESUMEN_TOKEN) return r({ error: 'no autorizado' }, 401);
  const dias = Math.min(31, Math.max(1, +u.searchParams.get('dias') || 7));
  const { results } = await env.DB.prepare("SELECT id, fecha, texto, pagina, hermandad FROM sugerencias WHERE fecha > datetime('now', ?) ORDER BY fecha").bind(`-${dias} day`).all();
  return r({ dias, total: results.length, sugerencias: results });
}
