// Ocho Capitales · rutas: salidas extraordinarias y magnas con el método nuevo (continuidad + GraphHopper).
// Entrada: tools/sources/itinerarios-extraordinarios.json (itinerario literal de la fuente oficial, por tramos «ida» y, si lo hay,
// «regreso», con las horas que dé la fuente). Correcciones: las de la capital (correcciones-<capital>.json), con el id de la salida.
// Salida: site/data/recorridos/<capital>.json → «extraordinarias»[id] (mismo formato de puntos que los recorridos) y
// salida/<capital>/trazas/<id>.json + informe.json. Solo se publican las horas de la fuente: si solo hay hora de salida, no se
// inventa ninguna otra (el plano no puede calcular la posición del cortejo sin dos horas).
// Uso: node extraordinarias.mjs <capital> [id …]
import fs from 'node:fs';
import path from 'node:path';
import { ciudad, ITI, RAIZ, fPublicado, sn, TEMPLO, d2 } from './comun.mjs';
import { motor, guardarTraza } from './emparejar.mjs';
import { aPuntos } from './publicar.mjs';

const fFuente = path.join(RAIZ, 'tools', 'sources', 'itinerarios-extraordinarios.json');
const [c, ...pedidos] = process.argv.slice(2);
const C = ciudad(c), { trazar } = motor(c);
const S = JSON.parse(fs.readFileSync(fFuente, 'utf8')).salidas;
const ids = Object.keys(S).filter((id) => S[id].ciudad === c && (!pedidos.length || pedidos.some((p) => id.startsWith(p))));
const fR = fPublicado(c), R = JSON.parse(fs.readFileSync(fR, 'utf8'));
const esSede = (t) => TEMPLO.test(sn(t)) || sn(t).startsWith('casa hermandad');

for (const id of ids) {
  const e = S[id];
  // lista: ida + regreso; el templo del acto aparece al final de la ida y al principio del regreso (con sus dos horas)
  const calles = [], horas = {}, hitos = [];
  let regreso_desde;
  for (const [nom, tr] of Object.entries(e.tramos)) {
    if (nom === 'regreso') regreso_desde = calles.length;
    for (const p of tr) { if (p.hora) horas[calles.length] = p.hora; if (p.hito) hitos.push(calles.length); calles.push(p.lugar); } // «hito»: un acto o un punto de la fuente que no es una calle
  }
  // correcciones automáticas: sede de casa hermandad (las de la hermandad) y templos intermedios (el del acto) situados en su
  // edificio; las de correcciones-<capital>.json mandan
  const auto = { calles: {} };
  const sedeH = (t) => C.sedeDe(e.hermandad, t);
  const pts0 = Object.values(e.tramos).flat();
  for (const [k, i] of [['salida', 0], ['entrada', calles.length - 1]]) { const p = i ? pts0.at(-1) : pts0[0]; if (p.templo && !auto[k] && !TEMPLO.test(sn(calles[i]))) { if (!hitos.includes(i)) hitos.push(i); const s = C.sedeDe(id, p.templo); if (s?.edificio) { const pu = C.PUERTAS.filter((d) => d.tags.entrance === 'main' && d2(d.xy, C.X(...s.punto)) < 80).sort((a, b) => d2(a.xy, C.X(...s.punto)) - d2(b.xy, C.X(...s.punto)))[0]; auto[k] = { lat: (pu || { lat: s.punto[0] }).lat, lon: (pu || { lon: s.punto[1] }).lon, fuente: `${s.fuente}${pu ? ', puerta ' + pu.id : ''} («${p.templo}»)` }; } } }
  if (sn(calles[0]).startsWith('casa hermandad')) { const s = sedeH(calles[0]); if (s) auto.salida = { lat: s.punto[0], lon: s.punto[1], fuente: `${s.fuente} (${s.como})` }; }
  if (sn(calles.at(-1)).startsWith('casa hermandad')) { const s = sedeH(calles.at(-1)); if (s) auto.entrada = { lat: s.punto[0], lon: s.punto[1], fuente: `${s.fuente} (${s.como})` }; }
  calles.forEach((t, i) => { if (i > 0 && i < calles.length - 1 && esSede(t)) { const tp = e.tramos.ida.concat(e.tramos.regreso || []).find((p) => p.lugar === t && p.templo)?.templo; const s = C.sedeDe(id, tp || t); if (s) auto.calles[i] = { punto: s.punto, fuente: s.fuente }; } });
  C.LISTAS[id] = { calles, horas, hitos: new Set(hitos), fuente: e.fuente_url || e.fuente, ...(regreso_desde != null ? { regreso_desde } : {}) };
  const fc = C.leerCorrecciones()[id] || {};
  const corr = { ...auto, ...fc, calles: { ...auto.calles, ...(fc.calles || {}) } };
  const r = await trazar(id, { corr });
  guardarTraza(c, r);
  const pts = aPuntos(C, id, { ida: r.ida, regreso: r.regreso, puntos: r.hitos.filter((h) => h.punto).map((h) => ({ i: h.i, lugar: h.lugar, lat: h.punto[0], lon: h.punto[1], tramo: h.tramo, tipo: h.tipo, pos: h.pos })) }, r.informe, C.LISTAS[id]);
  const tramos = { ida: pts.filter((p) => p.tramo !== 'regreso') };
  if (regreso_desde != null) tramos.regreso = pts.filter((p) => p.tramo === 'regreso');
  for (const t of Object.values(tramos)) for (const p of t) delete p.tramo;
  // el templo del acto cierra la ida y abre el regreso: sus dos puntos van en su tramo, cada uno con su hora
  const { tramos: _t, ...meta } = e;
  R.extraordinarias = R.extraordinarias || {};
  R.extraordinarias[id] = { ...meta, tramos, metodo: 'continuidad + GraphHopper', reconstruido: new Date().toISOString().slice(0, 10), ...(Object.keys(horas).length < 2 ? { solo_hora_salida: true } : {}) };
  console.log(id, '|', r.informe.largo_m, 'm |', pts.length, 'puntos | horas', JSON.stringify(horas), '| avisos:', r.informe.avisos.join(' · ') || '—');
}
fs.writeFileSync(fR, JSON.stringify(R));
