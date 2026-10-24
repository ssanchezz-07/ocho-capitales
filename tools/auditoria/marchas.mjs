// Auditoría de marchas (Fase 2). Solo lee.
import fs from 'node:fs';
import path from 'node:path';
const RAIZ = process.argv[2];
const J = (p) => JSON.parse(fs.readFileSync(path.join(RAIZ, p), 'utf8'));
const P = J('portal-cofrade/data/portal.json');
const ME = J('tools/sources/marchas-espana.json'); const L = Array.isArray(ME) ? ME : ME.marchas;
const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[¡!¿?.,;:"'«»()\-]/g, ' ').replace(/\b(de|del|la|las|el|los|y|a|al|en|ntra|nuestra|senora|sra|nuestro|padre|maria|santisima|stma|n|p)\b/g, ' ').replace(/\s+/g, ' ').trim();
const out = {};
const CIUDADES = ['sevilla', 'malaga', 'granada', 'cordoba', 'cadiz', 'huelva', 'almeria', 'jaen'];

// --- Catálogo ---
const anioMal = L.filter((m) => m.anio && (!/^\d{4}$/.test(m.anio) || +m.anio < 1850 || +m.anio > 2026));
out.cat_anio_raro = anioMal.slice(0, 20).map((m) => `${m.titulo} | ${m.autor} | ${m.anio}`); out.cat_anio_raro_n = anioMal.length;
// duplicados exactos y casi
const g = {}; for (const m of L) (g[norm(m.titulo) + '|' + norm(m.autor)] ||= []).push(m);
const dups = Object.values(g).filter((x) => x.length > 1);
out.cat_dup_mismo_titulo_autor = dups.length;
out.cat_dup_mismo_titulo_autor_mismo_video = dups.filter((x) => new Set(x.map((m) => m.video)).size < x.length).length;
out.cat_dup_formacion_distinta = dups.filter((x) => new Set(x.map((m) => m.formacion)).size > 1).map((x) => x.map((m) => `${m.titulo} [${m.formacion}] ${m.video}`).join(' / ')).slice(0, 15);
out.cat_dup_formacion_distinta_n = dups.filter((x) => new Set(x.map((m) => m.formacion)).size > 1).length;
// mismo vídeo para títulos distintos
const v = {}; for (const m of L) if (m.video) (v[m.video] ||= []).push(m);
const vd = Object.values(v).filter((x) => new Set(x.map((m) => norm(m.titulo))).size > 1);
out.cat_video_compartido_titulos_distintos = vd.length;
out.cat_video_compartido_ej = vd.slice(0, 12).map((x) => x[0].video + ': ' + x.map((m) => `«${m.titulo}» (${m.autor})`).join(' / '));
// autores con variantes (mismo apellido final y nombre parecido)
const aut = {}; for (const m of L) aut[m.autor] = (aut[m.autor] || 0) + 1;
const porClave = {}; for (const a of Object.keys(aut)) { const k = norm(a).split(' ').filter(Boolean).sort().join(' '); (porClave[k] ||= []).push(a); }
out.cat_autores = Object.keys(aut).length;
out.cat_autores_variantes = Object.values(porClave).filter((x) => x.length > 1).slice(0, 15);
out.cat_autor_raro = Object.keys(aut).filter((a) => /^(anonimo|desconocido|varios|-|\?)$/i.test(norm(a)) || a.length < 4 || /\d/.test(a)).slice(0, 20);
// dedicatoria: ¿coincide tipo con formación?
const choque = L.filter((m) => m.tipo && m.formacion && ((/cornetas/i.test(m.tipo) && !/cornetas/i.test(m.formacion)) || (/banda de m[uú]sica/i.test(m.tipo) && !/banda de m[uú]sica/i.test(m.formacion)) || (/agrupaci[oó]n/i.test(m.tipo) && !/agrupaci/i.test(m.formacion))));
out.cat_tipo_vs_formacion_n = choque.length;
out.cat_tipo_vs_formacion_ej = choque.slice(0, 15).map((m) => `${m.titulo} | formacion=${m.formacion} | tipo=${m.tipo}`);
out.cat_dedicatoria_n = L.filter((m) => m.dedicatoria).length;
out.cat_dedicatoria_con_ciudad = L.filter((m) => m.dedicatoria && /\(|sevilla|m[aá]laga|granada|c[oó]rdoba|c[aá]diz|huelva|almer[ií]a|ja[eé]n/i.test(m.dedicatoria)).length;

// --- Marchas de hermandades ---
const catIdx = {}; for (const m of L) (catIdx[norm(m.titulo)] ||= []).push(m);
const hm = []; for (const h of P.hermandades) for (const m of h.marchas || []) hm.push({ h, m });
out.herm_total = hm.length;
// misma marcha (título) asignada a varias hermandades
const t2h = {}; for (const { h, m } of hm) (t2h[norm(m.titulo)] ||= new Set()).add(h.slug);
out.herm_titulo_en_varias = Object.entries(t2h).filter(([, s]) => s.size > 1).map(([t, s]) => `${t}: ${[...s].join(', ')}`).slice(0, 40);
out.herm_titulo_en_varias_n = Object.values(t2h).filter((s) => s.size > 1).length;
// cruce con el catálogo: dedicatoria del catálogo que nombra otra ciudad
const choqueCiudad = [], autorDistinto = [], anioDistinto = [];
for (const { h, m } of hm) {
  const cs = catIdx[norm(m.titulo)] || [];
  for (const c of cs) {
    if (c.dedicatoria) {
      const d = norm(c.dedicatoria);
      const otra = CIUDADES.filter((x) => x !== h.ciudad && d.includes(x));
      if (otra.length && !d.includes(h.ciudad)) choqueCiudad.push(`${h.slug}: «${m.titulo}» (${m.autor}) — catálogo: dedicada a «${c.dedicatoria}» (${c.autor}, vídeo ${c.video})`);
    }
    const am = norm(m.autor).split(' ').pop(), ac = norm(c.autor).split(' ').pop();
    if (cs.length === 1 && am && ac && am !== ac) autorDistinto.push(`${h.slug}: «${m.titulo}» portal=${m.autor} / catálogo=${c.autor}`);
    if (cs.length === 1 && m.anio && c.anio && m.anio !== c.anio) anioDistinto.push(`${h.slug}: «${m.titulo}» portal=${m.anio} / catálogo=${c.anio}`);
  }
}
out.herm_vs_cat_otra_ciudad_n = choqueCiudad.length; out.herm_vs_cat_otra_ciudad = choqueCiudad.slice(0, 40);
out.herm_vs_cat_autor_distinto_n = autorDistinto.length; out.herm_vs_cat_autor_distinto = autorDistinto.slice(0, 30);
out.herm_vs_cat_anio_distinto_n = anioDistinto.length; out.herm_vs_cat_anio_distinto = anioDistinto.slice(0, 20);
out.herm_sin_autor = hm.filter(({ m }) => !m.autor).length;
out.herm_sin_anio = hm.filter(({ m }) => !m.anio).length;
out.herm_con_video = hm.filter(({ m }) => m.video).length;
out.herm_anio_raro = hm.filter(({ m }) => m.anio && (+m.anio < 1850 || +m.anio > 2026)).map(({ h, m }) => `${h.slug}: ${m.titulo} ${m.anio}`);
// título que nombra advocación ajena a la hermandad (heurística de aviso: nombre propio de otra hermandad de la misma ciudad)
console.log(JSON.stringify(out, null, 1));
