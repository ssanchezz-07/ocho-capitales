// Inventario de cobertura de Ocho Capitales (Fase 0 de la auditoría). Solo lee.
import fs from 'node:fs';
import path from 'node:path';
const RAIZ = process.argv[2];
const J = (p) => JSON.parse(fs.readFileSync(path.join(RAIZ, p), 'utf8'));
const out = {};

// 1) Páginas de dist por tipo (primer segmento de la ruta)
const DIST = path.join(RAIZ, 'site', 'dist');
const tipos = {};
function walk(d, rel) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const r = rel ? rel + '/' + e.name : e.name;
    if (e.isDirectory()) { if (r === 'assets' || r === 'data') continue; walk(path.join(d, e.name), r); }
    else if (e.name.endsWith('.html')) {
      const seg = r.split('/');
      const k = seg.length === 1 ? r : seg[0] + (seg.length > 2 ? '/<slug>' + (seg.length > 3 ? '/' + seg.slice(2, -1).join('/') : '') : '');
      tipos[k] = (tipos[k] || 0) + 1;
    }
  }
}
walk(DIST, '');
out.paginas = tipos;
out.paginas_total = Object.values(tipos).reduce((a, b) => a + b, 0);

// 2) Entidades
const P = J('portal-cofrade/data/portal.json');
out.hermandades = P.hermandades.length;
out.hermandades_por_ciudad = P.hermandades.reduce((a, h) => (a[h.ciudad] = (a[h.ciudad] || 0) + 1, a), {});
out.imagineros = P.imagineros.length;
out.bandas = P.bandas.length;
out.marchas_en_hermandades = P.hermandades.reduce((a, h) => a + (h.marchas || []).length, 0);
out.hermandades_con_marchas = P.hermandades.filter((h) => (h.marchas || []).length).length;

// recorridos
let rec = 0, extra = 0, puntos = 0; const recPorCiudad = {}; const conRec = new Set();
for (const f of fs.readdirSync(path.join(RAIZ, 'site/data/recorridos'))) {
  const R = J('site/data/recorridos/' + f);
  const n = Object.keys(R.hermandades).length; rec += n; recPorCiudad[f.replace('.json', '')] = n;
  for (const [s, h] of Object.entries(R.hermandades)) { conRec.add(s); puntos += Object.values(h.tramos).flat().length; }
  extra += (R.extraordinarias || []).length;
}
out.recorridos = rec; out.recorridos_por_ciudad = recPorCiudad; out.extraordinarias = extra; out.puntos_itinerario = puntos;
const sinRec = P.hermandades.filter((h) => !conRec.has(h.slug));
out.hermandades_sin_recorrido = sinRec.length;
out.sin_recorrido_por_ciudad = sinRec.reduce((a, h) => (a[h.ciudad] = (a[h.ciudad] || 0) + 1, a), {});
out.sin_recorrido_lista = sinRec.map((h) => `${h.ciudad}|${h.dia}|${h.slug}`);
// slugs con recorrido que no existen en portal
out.recorridos_huerfanos = [...conRec].filter((s) => !P.hermandades.some((h) => h.slug === s));

// marchas
const ME = J('tools/sources/marchas-espana.json');
const lista = Array.isArray(ME) ? ME : (ME.marchas || []);
out.marchas_catalogo = lista.length;
const con = (k) => lista.filter((m) => m[k]).length;
out.marchas_catalogo_campos = { autor: con('autor'), anio: con('anio'), dedicatoria: con('dedicatoria'), formacion: con('formacion'), video: lista.filter((m) => m.video || m.youtube || m.url).length, leida: con('leida') };
out.marchas_claves = Object.keys(lista[0] || {});
for (const f of ['granada-marchas.json', 'marchas-hermandades-wikipedia.json', 'marchas-malaga.json', 'marchas-bne.json']) {
  try { const x = J('tools/sources/' + f); out['fuente_' + f] = Array.isArray(x) ? x.length : Object.keys(x).length + ' claves'; } catch (e) { out['fuente_' + f] = 'error ' + e.message; }
}
// agenda y noticias
const E = J('portal-cofrade/data/eventos.json'); out.eventos_verificados = (Array.isArray(E) ? E : E.eventos || []).length;
try { const A = J('tools/sources/agenda-externa.json'); out.agenda_externa = (Array.isArray(A) ? A : A.eventos || A.actos || []).length; } catch (e) {}
const F = J('portal-cofrade/data/fuentes.json'); out.fuentes_noticias = Array.isArray(F) ? F.length : Object.values(F).flat().length;
const N = J('site/data/news.json'); out.noticias = (N.items || N).length;
const AU = J('datos/auditoria.json'); out.auditoria_claves = Object.keys(AU);

// 3) Scripts: ¿quién los nombra?
const scripts = [];
for (const d of ['tools', 'tools/itinerarios', 'tools/db', 'site', 'site/scripts']) {
  for (const f of fs.readdirSync(path.join(RAIZ, d))) if (/\.(mjs|js|py)$/.test(f)) scripts.push(d + '/' + f);
}
const textos = [];
const leer = (p) => { try { return fs.readFileSync(path.join(RAIZ, p), 'utf8'); } catch { return ''; } };
for (const p of ['.github/workflows/publicar.yml', '.github/workflows/sugerencias-semanales.yml', 'site/package.json', 'Ocho Capitales.md', 'PUBLICAR.md', 'DECISIONS.md']) textos.push([p, leer(p)]);
for (const s of scripts) textos.push([s, leer(s)]);
out.scripts = scripts.map((s) => {
  const base = path.basename(s);
  const refs = textos.filter(([p, t]) => p !== s && t.includes(base)).map(([p]) => p);
  const enFlujo = refs.some((p) => p.includes('workflows') || p === 'site/package.json');
  return { s, enFlujo, refs: refs.length, donde: refs.slice(0, 4).join(', ') };
});
console.log(JSON.stringify(out, null, 1));
