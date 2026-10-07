// Ocho Capitales — detección de eventos (salidas, cultos, pregones…) en texto de noticias.
// Se usa al leer noticias (texto completo de la fuente) y al generar la web (titular + extracto).
// Criterio: un evento solo cuenta si su tipo y UNA fecha futura concreta aparecen en la MISMA frase.
// Se descartan rangos («del 5 al 11»), crónicas en pasado y fechas de años anteriores (aniversarios).

export const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const DIAS_SEM = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
const DIA = 864e5;
const CERCA = 90; // caracteres máximos entre el tipo de evento y su fecha

export const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// El orden importa: gana el primer tipo que encaja.
export const EV_TIPOS = [
  ['magna', /\bmagna\b/],
  ['coronacion', /coronacion/],
  ['extraordinaria', /(salida|procesion|recorrido|itinerario)[^.]{0,40}extraordinari|extraordinari[^.]{0,20}(salida|procesion)/],
  ['via-crucis', /via ?crucis/],
  ['traslado', /\btraslado/],
  ['besamanos', /besamanos|besapies/],
  ['culto', /triduo|quinario|novena|septenario|funcion principal/],
  ['concierto', /concierto/],
  ['pregon', /\bpregon\b/],
  ['cartel', /presentacion del cartel|presentara el cartel|cartel (oficial|de la semana santa)/],
  ['procesion', /procesion|procesiona|rosario de la aurora/],
];
const EV_NO = /torea|toros|maestranza|futbol|liga |asamblea|cabildo|elecciones|junta de gobierno|designad|nombrad|elegid/;
// Crónicas: verbos en pasado junto al evento.
const PASADO = /\b(celebro|celebraron|vivio|vivieron|tuvo lugar|recorrio|recorrieron|salio|salieron|procesiono|procesionaron|presento|presentaron|ayer|anoche|el pasado)\b/;
const RANGO = /\b(del|entre el) \d{1,2}( de [a-z]+)? (al|y el) \d{1,2}\b/;
const FECHA = new RegExp(`\\b(\\d{1,2})(?: y \\d{1,2})? de (${MESES.join('|')})(?: de (\\d{4}))?\\b`, 'g');

const frases = (t) => t.split(/(?<=[.!?;:])\s+|\n+|\s+[|·–—]\s+/).map((s) => s.trim()).filter((s) => s.length > 8);

/**
 * Busca eventos en un texto.
 * @param {string} texto   titular, extracto o texto completo (HTML ya limpio)
 * @param {number} pubTs   fecha de publicación (ms)
 * @returns {{fecha: string, tipo: string, frase: string}[]}
 */
export function detectarEventos(texto, pubTs) {
  const pub = new Date(pubTs);
  const pubDay = Date.UTC(pub.getUTCFullYear(), pub.getUTCMonth(), pub.getUTCDate());
  const out = [];
  for (const original of frases(String(texto || ''))) {
    const f = norm(original);
    if (EV_NO.test(f) || PASADO.test(f) || RANGO.test(f)) continue;
    const ty = EV_TIPOS.find(([, r]) => r.test(f));
    if (!ty) continue;
    const kw = f.search(ty[1]);
    const fechas = new Set();
    for (const m of f.matchAll(FECHA)) {
      // La fecha debe estar cerca del tipo de evento: los extractos a veces pegan frases sin punto.
      if (Math.abs(m.index - kw) > CERCA) continue;
      const d = +m[1]; if (d < 1 || d > 31) continue;
      const mes = MESES.indexOf(m[2]);
      let y = m[3] ? +m[3] : pub.getUTCFullYear();
      if (m[3] && y < pub.getUTCFullYear()) { fechas.add('pasado'); continue; } // aniversario o dato histórico
      let ms = Date.UTC(y, mes, d);
      if (!m[3] && ms < pubDay - 60 * DIA) ms = Date.UTC(y + 1, mes, d); // «el 10 de enero» publicado en diciembre
      fechas.add(ms);
    }
    if (!fechas.size) {
      const w = f.match(/\b(?:este|esta|el proximo|la proxima|proximo|proxima) (lunes|martes|miercoles|jueves|viernes|sabado|domingo)\b/);
      if (w) fechas.add(pubDay + ((DIAS_SEM.indexOf(w[1]) - new Date(pubDay).getUTCDay() + 7) % 7) * DIA);
      else if (/\b(hoy|esta tarde|esta noche)\b/.test(f)) fechas.add(pubDay);
      else if (/\bmanana\b/.test(f) && !/\bmanana de\b/.test(f)) fechas.add(pubDay + DIA);
    }
    if (fechas.size !== 1 || fechas.has('pasado')) continue; // sin fecha o ambigua: mejor no inventar
    const when = [...fechas][0];
    if (when < pubDay - 3 * DIA || when > pubDay + 300 * DIA) continue;
    const fecha = new Date(when).toISOString().slice(0, 10);
    if (out.some((e) => e.fecha === fecha && e.tipo === ty[0])) continue; // misma noticia, mismo evento en otra frase
    out.push({ fecha, tipo: ty[0], frase: original.slice(0, 200) });
  }
  return out;
}

// Autocomprobación: node site/eventos.mjs
if (process.argv[1] && import.meta.url === (await import('node:url')).pathToFileURL(process.argv[1]).href) {
  const pub = Date.UTC(2026, 9, 2);
  const t = (s) => detectarEventos(s, pub).map((e) => e.fecha + ' ' + e.tipo);
  const eq = (a, b, msg) => { if (JSON.stringify(a) !== JSON.stringify(b)) { console.error('FALLO', msg, a); process.exitCode = 1; } };
  eq(t('El sábado 14 de noviembre, procesión extraordinaria de Jesús de la Pasión por su 50 aniversario.'), ['2026-11-14 extraordinaria'], 'fecha + extraordinaria');
  eq(t('La agenda cofrade de Córdoba del 5 al 11 de octubre: cultos y una salida extraordinaria'), [], 'rango descartado');
  eq(t('La hermandad celebró ayer su salida extraordinaria del 1 de octubre.'), [], 'crónica en pasado');
  eq(t('Fundada el 14 de noviembre de 1950, la hermandad prepara su triduo.'), [], 'año antiguo');
  eq(t('Isaac Vilches es designado pregonero de la Semana Santa 2027, que se celebrará el 27 de marzo'), [], 'nombramiento no es evento');
  eq(t('Triduo los días 9, 10 y 11. Besamanos el próximo domingo.'), ['2026-10-04 besamanos'], 'día de la semana');
  eq(t('El traslado será el 10 de enero.'), ['2027-01-10 traslado'], 'cambio de año');
  eq(t('Saldrá en procesión extraordinaria el 10 de octubre. La procesión extraordinaria del 10 de octubre recorrerá el barrio.'), ['2026-10-10 extraordinaria'], 'sin duplicados');
  eq(t('La venerada imagen será retirada del Santuario el próximo 13 de octubre y está previsto que vuelva a recibir culto a finales de mes El fervor inunda Dalías al ver pasar a su Cristo de la Luz en procesión'), [], 'fecha lejos del evento');
  console.log(process.exitCode ? 'Hay fallos' : 'eventos.mjs: todas las comprobaciones OK');
}
