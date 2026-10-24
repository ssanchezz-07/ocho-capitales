// Fase 1, revisión del 100 %: recorre TODOS los puntos de TODAS las rutas y marca diferencias con su fuente
// (columna del PDF de la que salen) y con OpenStreetMap (caché de geocodificar.mjs). Solo lee.
import fs from 'node:fs';
import path from 'node:path';
const RAIZ = process.argv[2], OUT = process.argv[3];
const J = (p) => JSON.parse(fs.readFileSync(path.join(RAIZ, p), 'utf8'));
const P = J('portal-cofrade/data/portal.json'); const H = Object.fromEntries(P.hermandades.map((h) => [h.slug, h]));
// mismas normalizaciones que geocodificar.mjs, SIN convertir «P.» en paseo (para no repetir su error)
const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  .replace(/\bc\s*\/\s*/g, 'calle ').replace(/\bpza\.?\s|\bpl\.\s|\bplza\.?\s/g, 'plaza ').replace(/\bavda?\.?\s|\bav\.\s/g, 'avenida ').replace(/\bpte\.?\s/g, 'puente ').replace(/\bpº\s|\bpso\.?\s/g, 'paseo ')
  .replace(/\bsto\.?\s/g, 'santo ').replace(/\bsta\.?\s/g, 'santa ').replace(/\bs\.\s/g, 'san ').replace(/\bntra\.?\s/g, 'nuestra ').replace(/\bsra\.?\s/g, 'senora ').replace(/\bdr\.?\s/g, 'doctor ')
  .replace(/\(.*?\)/g, ' ').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
const TIPO = /^(calle|plaza|avenida|paseo|puente|cuesta|glorieta|callejon|ronda|carrera|camino|pasaje|travesia|alameda|costanilla|plazuela|patio|muelle|explanada|carretera)\s+/;
const nucleo = (s) => norm(s).replace(TIPO, '').replace(/^(de|del|de la|de los|de las)\s+/, '').trim();
const m = (a, b) => { const kx = 111320 * Math.cos(((a[0] + b[0]) / 2) * Math.PI / 180); return Math.hypot((a[1] - b[1]) * kx, (a[0] - b[0]) * 110540); };
const mins = (t) => { const x = /^(\d{1,2}):(\d{2})/.exec(t || ''); return x ? +x[1] * 60 + +x[2] : null; };
const STOP = new Set(['hermandad', 'cofradia', 'real', 'ilustre', 'nuestra', 'nuestro', 'senora', 'senor', 'padre', 'jesus', 'cristo', 'santisimo', 'santisima', 'maria', 'parroquia', 'iglesia', 'capilla', 'san', 'santa', 'santo', 'virgen', 'del', 'los', 'las', 'salida', 'entrada']);
const toks = (s) => new Set(norm(s).split(' ').filter((w) => w.length >= 4 && !STOP.has(w)));

const FUENTES = { sevilla: ['sevilla-2026', 'sevilla-cgh-2026'], malaga: ['malaga-2026', 'malaga-acc-2026', 'malaga-horarios-2026'] };
const res = [];
for (const f of fs.readdirSync(path.join(RAIZ, 'site/data/recorridos')).sort()) {
  const c = f.replace('.json', '');
  const R = J('site/data/recorridos/' + f);
  const osm = J(`tools/itinerarios/cache/osm-${c}.json`);
  const calles = new Map(), templos = [];
  for (const e of osm.elements) {
    const t = e.tags || {}; const geo = e.geometry ? e.geometry.map((p) => [p.lat, p.lon]) : e.lat ? [[e.lat, e.lon]] : e.center ? [[e.center.lat, e.center.lon]] : null;
    if (!geo) continue;
    if (t.amenity === 'place_of_worship') { templos.push({ n: norm(t.name), geo }); continue; }
    for (const nm of [t.name, t.alt_name, t.old_name, t.official_name].filter(Boolean)) for (const k of new Set([norm(nm), nucleo(nm)])) if (k) (calles.get(k) || calles.set(k, []).get(k)).push(geo);
  }
  const cols = (FUENTES[c] || [c + '-2026']).flatMap((x) => { try { return J('tools/itinerarios/' + x + '.json').columnas.map((col) => ({ ...col, archivo: x })); } catch { return []; } });
  const firma = (pts) => pts.map((p) => norm(p.lugar)).join('|');
  const porFirma = new Map(); for (const col of cols) porFirma.set(firma(col.puntos), col);
  const todas = [...Object.entries(R.hermandades).map(([s, h]) => [s, h, false]), ...Object.entries(R.extraordinarias || {}).map(([s, h]) => [s, h, true])];
  for (const [slug, r, extra] of todas) {
    const h = H[slug] || H[r.hermandad] || {};
    const fl = []; let pts = 0;
    for (const [tramo, ps] of Object.entries(r.tramos)) {
      pts += ps.length;
      // 1) columna de origen y su cabecera
      if (!extra) {
        let col = porFirma.get(firma(ps)), sc = 1;
        if (!col) {
          const A = new Set(ps.map((p) => nucleo(p.lugar)).filter((x) => x.length > 2));
          let best = 0; for (const k of cols) { if (k.dia && r.dia && norm(k.dia).slice(0, 5) !== norm(r.dia).slice(0, 5) && !/madrug|jueves/.test(norm(k.dia) + norm(r.dia))) continue; const B = new Set(k.puntos.map((p) => nucleo(p.lugar)).filter((x) => x.length > 2)); let i = 0; for (const x of A) if (B.has(x)) i++; const j = i / (A.size + B.size - i || 1); if (j > best) { best = j; col = k; } }
          sc = best;
        }
        if (!col || sc < 0.5) fl.push(`[${tramo}] no se encuentra su columna en el PDF leído (parecido ${Math.round(sc * 100)} %)`);
        else {
          const cab = toks(col.cabecera); const mio = new Set([...toks(h.nombre), ...toks(h.nombre_oficial), ...toks(h.sede), ...(h.titulares || []).flatMap((t) => [...toks(t.nombre)])]);
          if (cab.size && ![...cab].some((w) => mio.has(w))) fl.push(`[${tramo}] cabecera del PDF «${col.cabecera}» no nombra a la hermandad (${col.archivo})`);
          const otras = P.hermandades.filter((x) => x.ciudad === c && x.slug !== slug && toks(x.nombre).size && [...toks(x.nombre)].every((w) => cab.has(w)));
          if (otras.length && cab.size > 2) fl.push(`[${tramo}] la cabecera «${col.cabecera}» nombra también a ${otras.map((x) => x.slug).join(', ')}`);
        }
      }
      let prev = null, prevT = null;
      ps.forEach((p, i) => {
        const L = p.lugar || '';
        if (/([A-Za-zÁÉÍÓÚáéíóúñ] ){3,}|\d: ?\d/.test(L)) fl.push(`[${tramo}] texto roto del PDF: «${L}»`);
        if (/^P\.\s?[A-ZÁÉÍÓÚ]/i.test(L.trim())) fl.push(`[${tramo}] «${L}»: «P.» es ambiguo (puerta, plaza o paseo) → situado como ${p.como}`);
        if (p.lat == null) { if (!/^(salida|entrada|entra|encierro)$/i.test(L.trim())) fl.push(`[${tramo}] sin situar: «${L}»`); else fl.push(`[${tramo}] ${L} sin coordenadas`); }
        else if (p.como === 'calle') {
          const k = nucleo(L); const gs = calles.get(k) || calles.get(norm(L));
          if (gs) {
            let best = Infinity; for (const g of gs) for (const q of g) best = Math.min(best, m(q, [p.lat, p.lon]));
            if (best > 60) fl.push(`[${tramo}] «${L}» situado a ${Math.round(best)} m de la calle de OSM con ese nombre`);
            // nombre que en OSM está en sitios muy separados
            const cs = gs.map((g) => g[0]); let sep = 0; for (const a of cs) for (const b of cs) sep = Math.max(sep, m(a, b));
            if (sep > 1500) fl.push(`[${tramo}] «${L}»: en OSM hay calles con ese nombre a ${Math.round(sep)} m entre sí (revisar cuál es)`);
          }
        } else if (p.como === 'estimado') fl.push(`[${tramo}] estimado: «${L}»`);
        if (p.como === 'sede' && i === 0 && h.sede) {
          const st = toks(h.sede); const cand = templos.map((t) => [t, [...st].filter((w) => t.n.includes(w)).length]).filter(([, n]) => n >= Math.min(2, st.size)).map(([t]) => t);
          if (cand.length) { let best = Infinity; for (const t of cand) for (const q of t.geo) best = Math.min(best, m(q, [p.lat, p.lon])); if (best > 150) fl.push(`[${tramo}] salida a ${Math.round(best)} m del templo de OSM que casa con la sede «${h.sede}»`); }
          else fl.push(`[${tramo}] la sede «${h.sede}» no casa con ningún templo de OSM (no se puede comprobar)`);
        }
        if (prev && p.lat != null) { const d = m([prev.lat, prev.lon], [p.lat, p.lon]); if (d > 350 && !(prev.via && prev.via.length > 2)) fl.push(`[${tramo}] recta de ${Math.round(d)} m: ${prev.lugar} → ${L}`); }
        const t = mins(p.hora), fi = mins(p.fila);
        if (t != null && fi != null) { let dd = Math.abs(t - fi); dd = Math.min(dd, 1440 - dd); if (dd > 40) fl.push(`[${tramo}] hora ${p.hora} y fila ${p.fila} difieren ${dd} min en «${L}»`); }
        if (t != null && prevT != null && t < prevT && !(prevT > 18 * 60 && t < 10 * 60)) fl.push(`[${tramo}] la hora retrocede en «${L}» (${p.hora})`);
        if (t != null) prevT = t;
        if (p.lat != null) prev = p;
      });
    }
    res.push({ ciudad: c, slug, dia: r.dia, extra, puntos: pts, avisos: fl });
  }
}
fs.writeFileSync(OUT, JSON.stringify(res, null, 1));
const tipo = (a) => a.replace(/^\[[^\]]*\]\s*/, '').replace(/«[^»]*»/g, '«…»').replace(/\d+/g, 'N').slice(0, 60);
const resumen = {};
for (const r of res) { const s = (resumen[r.ciudad] ||= { rutas: 0, puntos: 0, limpias: 0, tipos: {} }); s.rutas++; s.puntos += r.puntos; if (!r.avisos.length) s.limpias++; for (const a of new Set(r.avisos.map(tipo))) s.tipos[a] = (s.tipos[a] || 0) + 1; }
for (const [c, s] of Object.entries(resumen)) { console.log(`## ${c}: ${s.rutas} rutas, ${s.puntos} puntos, ${s.limpias} sin avisos`); for (const [k, n] of Object.entries(s.tipos).sort((a, b) => b[1] - a[1]).slice(0, 12)) console.log(`   ${n} rutas · ${k}`); }
