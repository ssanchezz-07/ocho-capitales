// Ocho Capitales · auditoría (fase 1): veredicto final de cada recorrido juntando todas las pruebas:
//  - cotejo calle a calle con el itinerario oficial en prosa (auditoria/cotejo-<ciudad>.json: Málaga, Cádiz),
//  - cotejo con la rejilla del PDF (auditoria/rejilla-resumen.json: % de calles del tramo en una misma columna),
//  - comprobación punto a punto (auditoria/rutas-100.json: rectas, salida lejos de la sede, «P.» ambiguo, homónimos),
//  - revisión a ojo de las láminas (lista REVISION_OJO, de AUDITORIA-INTEGRAL.md).
// Clases: correcto · corregible con fuente · dudoso · sin fuente.  Uso: node tools/auditoria/veredictos-rutas.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const A = (p) => { try { return JSON.parse(fs.readFileSync(path.join(RAIZ, 'auditoria', p), 'utf8')); } catch { return null; } };
const P = JSON.parse(fs.readFileSync(path.join(RAIZ, 'portal-cofrade/data/portal.json'), 'utf8'));
// rutas con un error visto a ojo en su lámina (salida lejos de la sede, rectas, ruta de otra hermandad, apelotonada…)
const REVISION_OJO = new Set(`pino-montano-sevilla pasion-y-muerte-sevilla la-mision-sevilla dolores-de-torreblanca-sevilla divino-perdon-sevilla jesus-despojado-sevilla la-paz-sevilla la-hiniesta-sevilla santa-marta-sevilla redencion-sevilla san-pablo-sevilla los-estudiantes-sevilla el-cerro-sevilla san-benito-sevilla cristo-de-burgos-sevilla los-panaderos-sevilla san-bernardo-sevilla la-quinta-angustia-sevilla el-calvario-sevilla la-macarena-sevilla la-esperanza-de-triana-sevilla el-cachorro-sevilla la-o-sevilla los-servitas-sevilla la-trinidad-sevilla la-candelaria-sevilla el-baratillo-sevilla
la-esperanza-cordoba la-agonia-cordoba la-merced-cordoba la-piedad-cordoba cristo-de-gracia-el-esparraguero-cordoba los-dolores-cordoba dolores-de-alcolea-cordoba la-o-cordoba
dolores-del-puente-malaga pasion-malaga humildad-malaga lagrimas-y-favores-malaga nueva-esperanza-malaga mediadora-malaga salesianos-malaga mena-malaga zamarrilla-malaga vera-cruz-malaga dolores-de-san-juan-malaga monte-calvario-malaga
la-sentencia-maravillas-granada santa-cena-granada nuestra-senora-de-los-dolores-granada jesus-del-rescate-granada la-esperanza-granada los-estudiantes-granada la-estrella-granada los-favores-granada la-resurreccion-granada
la-borriquita-cadiz el-despojado-cadiz
vera-cruz-y-oracion-huelva la-misericordia-huelva la-buena-muerte-huelva pasion-huelva el-silencio-la-soledad-huelva la-esperanza-huelva las-tres-caidas-huelva
el-resucitado-jaen nuestro-padre-jesus-el-abuelo-jaen el-gran-poder-jaen
gran-poder-almeria rosario-del-mar-almeria las-angustias-almeria
la-pasion-cordoba la-expiracion-cadiz los-afligidos-cadiz la-borriquilla-jaen el-resucitado-cordoba dulce-nombre-malaga huerto-malaga misericordia-malaga pasion-almeria la-coronacion-almeria la-sangre-cordoba la-borriquilla-granada el-trabajo-granada el-via-crucis-granada paciencia-y-penas-granada servitas-malaga expiracion-malaga resucitado-malaga el-valle-sevilla`.split(/\s+/).filter(Boolean));
// Fallos sistemáticos hallados en la ronda 2 de segunda opinión:
//  - Cádiz: unir.mjs:36 toma la hora de entrada de la ÚLTIMA fila (paso/palio) y la salida de la primera (cruz de guía).
//  - Málaga: el punto «Tribuna (Principal)» va estimado y cae al final de Larios, ~290 m fuera de su sitio.
const SISTEMATICO = {};
{ const J = JSON.parse(fs.readFileSync(path.join(RAIZ, 'tools/itinerarios/cadiz-2026.json'), 'utf8')); const n = (J.horas || []).filter((h) => h.horas && h.horas.entrada && h.horas.entrada.length > 1).length; if (n) SISTEMATICO.cadiz = 'hora de entrada tomada de la fila del paso (unir.mjs:36)'; }
const tribunaEstimada = (r) => Object.values(r.tramos).flat().some((p) => /^tribuna/i.test(String(p.lugar).trim()) && p.como === 'estimado');
// dudosas a ojo (salida lejos sin confirmar la sede)
const DUDOSO_OJO = new Set(['humillacion-y-estrella-malaga', 'paloma-malaga', 'los-gitanos-granada', 'el-rescatado-cordoba', 'la-santa-faz-cordoba', 'la-cena-cordoba', 'esperanza-malaga']);

const prosa = {}; for (const c of ['malaga', 'cadiz']) { const j = A(`cotejo-${c}.json`); if (j) for (const r of j.res) if (r.slug) prosa[r.slug] = r; }
const rej = {}; for (const r of A('rejilla-resumen.json') || []) rej[r.slug] = r;
const p100 = {}; for (const r of A('rutas-100.json') || []) p100[r.slug] = r;
const out = []; const conRec = new Set();
for (const f of fs.readdirSync(path.join(RAIZ, 'site/data/recorridos'))) {
  const c = f.replace('.json', ''); const R = JSON.parse(fs.readFileSync(path.join(RAIZ, 'site/data/recorridos', f), 'utf8'));
  for (const [slug, r] of Object.entries(R.hermandades)) {
    conRec.add(slug); const mot = []; let clase = 'correcto';
    const pr = prosa[slug], rj = rej[slug], pt = p100[slug];
    if (pr) { if (pr.pct < 70) mot.push(`prosa oficial: ${pr.pct} % de calles`); else if (pr.pct < 90) mot.push(`prosa oficial: ${pr.pct} %`); }
    if (rj) { const min = Math.min(...rj.tramos.map((t) => t.pct)); if (min < 70) mot.push(`rejilla del PDF: un tramo con ${min} % de calles en su columna`); else if (min < 90) mot.push(`rejilla: ${min} %`); }
    const av = (pt ? pt.avisos : []);
    const rectas = av.filter((a) => /recta de (\d+)/.test(a) && +/recta de (\d+)/.exec(a)[1] > 900);
    if (rectas.length) mot.push(`${rectas.length} rectas de más de 900 m`);
    const lejos = av.filter((a) => /salida a (\d+) m/.test(a) && +/salida a (\d+) m/.exec(a)[1] > 300);
    if (lejos.length) mot.push('salida a más de 300 m del templo de su sede');
    if (av.some((a) => /«P\.?\s?SAN MIGUEL»|P\. SAN MIGUEL/i.test(a))) mot.push('Puerta de San Miguel mal situada');
    if (REVISION_OJO.has(slug)) mot.push('error visto en su lámina o en la segunda opinión');
    if (SISTEMATICO[c] && Object.values(r.tramos).flat().some((p) => p.hora)) mot.push(SISTEMATICO[c]);
    if (c === 'malaga' && tribunaEstimada(r)) mot.push('Tribuna Principal mal situada (estimada)');
    // R25: calles cortadas por la lectura de la última columna de la rejilla (y sus horas perdidas)
    const cortadas = Object.values(r.tramos).flat().filter((p) => /(\b(de|del|la|el|los|las|san|santa|y|pl\.|plaza|avda\.|calle|puerta|j|p\.)|\s[A-ZÁÉÍÓÚ]\.?)\s*$/i.test(String(p.lugar).trim())).length;
    if (cortadas >= 2) mot.push(`${cortadas} calles cortadas en la lectura del PDF`);
    // R26: «Entrada», «Encierro», «a su Templo» lejos de donde salió
    const dm = (a, b) => { const kx = 111320 * Math.cos(((a.lat + b.lat) / 2) * Math.PI / 180); return Math.hypot((a.lon - b.lon) * kx, (a.lat - b.lat) * 110540); };
    for (const pts of Object.values(r.tramos)) { const sit = pts.filter((p) => p.lat != null); const fin = pts[pts.length - 1]; if (sit.length > 1 && fin.lat != null && /^(entrada|encierro|entra|a su templo|templo|se recoge|recogida)/i.test(String(fin.lugar).trim()) && dm(sit[0], fin) > 300) { mot.push(`llegada «${fin.lugar}» a ${Math.round(dm(sit[0], fin))} m de la salida`); break; } }
    const sinSit = av.filter((a) => /sin situar:|sin coordenadas/.test(a)).length;
    if (pt && sinSit / pt.puntos > 0.25) mot.push(Math.round(100 * sinSit / pt.puntos) + ' % de puntos sin situar');
    const est = av.filter((a) => /estimado:/.test(a)).length;
    const n = pt ? pt.puntos : 1; if (est / n > 0.25) mot.push(`${Math.round(100 * est / n)} % de puntos estimados`);
    const grave = mot.some((m) => /prosa oficial: \d+ % de calles|rejilla del PDF|rectas de más|salida a más|San Miguel|lámina|sin situar|unir\.mjs|Tribuna|cortadas|llegada/.test(m));
    if (grave) clase = 'corregible con fuente';
    else if (mot.length || DUDOSO_OJO.has(slug)) clase = 'dudoso';
    out.push({ ciudad: c, slug, dia: r.dia, clase, motivos: mot });
  }
}
for (const h of P.hermandades) if (!conRec.has(h.slug)) out.push({ ciudad: h.ciudad, slug: h.slug, dia: h.dia, clase: 'sin fuente', motivos: ['sin recorrido: no viene en ningún PDF leído o su cabecera está fusionada'] });
fs.writeFileSync(path.join(RAIZ, 'auditoria', 'fase1-veredictos.json'), JSON.stringify(out, null, 1));
const t = {}; for (const o of out) { t[o.ciudad] ||= {}; t[o.ciudad][o.clase] = (t[o.ciudad][o.clase] || 0) + 1; }
const tot = {}; for (const o of out) tot[o.clase] = (tot[o.clase] || 0) + 1;
console.log(JSON.stringify(t, null, 1)); console.log('TOTAL', tot, out.length);
console.log('correctas:', out.filter((o) => o.clase === 'correcto').map((o) => o.slug).join(', '));
