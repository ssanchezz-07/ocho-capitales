// Ocho Capitales: decide si este disparo programado lee y publica las noticias (escribe seguir=si|no en GITHUB_OUTPUT).
// Pablo: una publicación al día, a las 7:00 de España, sin fallo. GitHub retrasa o se salta avisos, así que hay muchos disparos
// desde las 5 UTC y solo vale el primero a partir de las 7:00 hora de Madrid (cubre invierno y verano). Si la publicación del
// día ya está en R2, los demás no hacen nada; si falló, el siguiente disparo lo reintenta.
// Los push nunca leen noticias: solo publican la web con las ya guardadas.
// Uso: node tools/noticias-hoy.mjs   (EVENTO, NOTICIAS_URL; ARCHIVO = news.json de respaldo si R2 no responde)
import fs from 'node:fs';

const E = process.env;
const HORA = 7, TOPE = 14; // de 7:00 a 13:59 de Madrid
const madrid = (ms) => Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23' }).formatToParts(ms).map((p) => [p.type, p.value]));
const dia = (m) => `${m.year}-${m.month}-${m.day}`;
export const publicadaHoy = (actualizado, ahora) => { const a = madrid(actualizado), h = madrid(ahora); return dia(a) === dia(h) && +a.hour >= HORA; };
export const toca = (actualizado, ahora) => { const h = +madrid(ahora).hour; return h >= HORA && h < TOPE && !publicadaHoy(actualizado, ahora); };

async function ultima() {
  if (E.NOTICIAS_URL) {
    try { const r = await fetch(`${E.NOTICIAS_URL}?c=${Date.now()}`); if (r.ok) return +(await r.json()).actualizado || 0; } catch { /* se mira el respaldo */ }
  }
  try { return +JSON.parse(fs.readFileSync(E.ARCHIVO || 'news.json', 'utf8')).actualizado || 0; } catch { return 0; }
}

if (process.argv[1] && process.argv[1].endsWith('noticias-hoy.mjs')) {
  const ahora = Date.now(), act = await ultima();
  const seguir = E.EVENTO !== 'schedule' || toca(act, ahora);
  const m = madrid(ahora);
  console.log(`Madrid: ${dia(m)} ${m.hour}h; última publicación: ${act ? new Date(act).toISOString() : '—'}; evento: ${E.EVENTO}; sigue: ${seguir ? 'sí' : 'no'}`);
  if (E.GITHUB_OUTPUT) fs.appendFileSync(E.GITHUB_OUTPUT, `seguir=${seguir ? 'si' : 'no'}\n`);
}
