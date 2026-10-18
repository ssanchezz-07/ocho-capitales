// Ocho Capitales: auditoría automática de los recorridos de site/data/recorridos/<ciudad>.json.
// Marca, por hermandad, lo que huele mal: puntos sin situar, saltos de más de 1,2 km entre puntos seguidos, velocidades imposibles
// para un cortejo (más de 150 m/min con las horas del itinerario), recorridos que no vuelven cerca de la sede, puntos lejos del
// resto de la ciudad, horas que retroceden y tramos largos en recta (sin calle).
// Escribe tools/itinerarios/auditoria-rutas.json (datos) y auditoria-rutas.md (informe para revisar a ojo contra el PDF oficial).
// Uso: node tools/itinerarios/auditar.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const REC = path.join(DIR, '..', '..', 'site', 'data', 'recorridos');
const dist = (a, b) => {
  const kx = 111320 * Math.cos(((a.lat + b.lat) / 2) * Math.PI / 180);
  return Math.hypot((a.lon - b.lon) * kx, (a.lat - b.lat) * 110540);
};
const mins = (t) => { const m = /^(\d{1,2}):(\d{2})/.exec(t || ''); return m ? +m[1] * 60 + +m[2] : null; };
const med = (xs) => { const s = [...xs].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };

const informe = {};
for (const f of fs.readdirSync(REC).sort()) {
  const ciudad = f.replace('.json', '');
  const R = JSON.parse(fs.readFileSync(path.join(REC, f), 'utf8'));
  const todos = Object.values(R.hermandades).flatMap((h) => Object.values(h.tramos).flat()).filter((p) => p.lat != null);
  const centro = { lat: med(todos.map((p) => p.lat)), lon: med(todos.map((p) => p.lon)) };
  informe[ciudad] = {};
  for (const [slug, h] of Object.entries(R.hermandades)) {
    const fl = [];
    let nSin = 0, nEst = 0, nTot = 0, rectaLarga = 0;
    for (const [tramo, pts] of Object.entries(h.tramos)) {
      nTot += pts.length;
      let prev = null, prevT = null, diaMas = 0;
      pts.forEach((p, i) => {
        if (p.lat == null) { nSin++; return; }
        if (p.como === 'estimado') nEst++;
        if (dist(p, centro) > 7000) fl.push(`${tramo}: «${p.lugar}» a ${(dist(p, centro) / 1000).toFixed(1)} km del centro`);
        const t = mins(p.hora || p.fila);
        if (prev) {
          const d = dist(prev, p);
          if (d > 1200) fl.push(`${tramo}: salto de ${Math.round(d)} m de «${prev.lugar}» a «${p.lugar}»`);
          if (!(p.via && p.via.length) && d > 350) rectaLarga++;
          if (t != null && prevT != null) {
            let dt = t - prevT; if (dt < -600) dt += 1440;
            if (dt < 0) fl.push(`${tramo}: la hora retrocede en «${p.lugar}» (${p.hora || p.fila})`);
            else if (dt > 0 && d / dt > 150 && d > 300) fl.push(`${tramo}: ${Math.round(d / dt)} m/min entre «${prev.lugar}» y «${p.lugar}»`);
          }
        }
        prev = p; if (t != null) prevT = t;
      });
      const v = pts.filter((p) => p.lat != null);
      if (v.length > 3) {
        const cierre = dist(v[0], v[v.length - 1]);
        if (cierre > 900 && !/fusion|traslado|extraord/i.test(slug)) fl.push(`${tramo}: acaba a ${Math.round(cierre)} m de donde sale`);
      }
    }
    if (nTot && nSin / nTot > 0.15) fl.push(`${nSin} de ${nTot} puntos sin situar`);
    if (nTot && nEst / nTot > 0.6) fl.push(`${Math.round(100 * nEst / nTot)}% de los puntos son estimados`);
    if (rectaLarga >= 3) fl.push(`${rectaLarga} tramos de más de 350 m en recta (sin calle)`);
    informe[ciudad][slug] = { dia: h.dia, fuente: h.fuente, puntos: nTot, sinSituar: nSin, estimados: nEst, avisos: fl };
  }
}
fs.writeFileSync(path.join(DIR, 'auditoria-rutas.json'), JSON.stringify(informe, null, 1));
let md = '# Auditoría automática de recorridos\n\nGenerada por `tools/itinerarios/auditar.mjs`. Cada aviso hay que comprobarlo a ojo contra el itinerario oficial (PDF/web de la fuente indicada).\n';
let total = 0, con = 0;
for (const [ciudad, hs] of Object.entries(informe)) {
  const lista = Object.entries(hs).filter(([, x]) => x.avisos.length).sort((a, b) => b[1].avisos.length - a[1].avisos.length);
  total += Object.keys(hs).length; con += lista.length;
  md += `\n## ${ciudad}: ${lista.length} de ${Object.keys(hs).length} con avisos\n`;
  for (const [slug, x] of lista) md += `\n### ${slug} (${x.dia})\nFuente: ${x.fuente}\n${x.avisos.map((a) => '- ' + a).join('\n')}\n`;
}
fs.writeFileSync(path.join(DIR, 'auditoria-rutas.md'), md);
console.log(`${con} de ${total} hermandades con avisos`);
for (const [ciudad, hs] of Object.entries(informe)) console.log(ciudad, Object.values(hs).filter((x) => x.avisos.length).length, '/', Object.keys(hs).length);
