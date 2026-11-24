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
  // «marchas procesionales», «música procesional» o «paso procesional» no son una procesión; «salida procesional» sí
  ['procesion', /procesion(?!al)|procesiona(?!l)|(salida|desfile) procesional|rosario de la aurora/],
];
const EV_NO = /torea|toros|maestranza|futbol|liga |asamblea|cabildo|elecciones|junta de gobierno|designad|nombrad|elegid/;
// Crónicas: verbos en pasado junto al evento.
const PASADO = /\b(celebro|celebraron|ha celebrado|han celebrado|ha tenido lugar|vivio|vivieron|tuvo lugar|recorrio|recorrieron|realizo|realizaron|salio|salieron|procesiono|procesionaron|presento|presentaron|ayer|anoche|el pasado|aquel ano)\b/;
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

// Título de un acto sacado de una noticia. Una frase suelta («Por último, también hay que recordar que…») no es el nombre de
// un acto: si la frase es una oración (conector, anáfora, verbo conjugado, cortada o larga) se usa el titular de la noticia,
// pero solo si el titular habla de ese tipo de acto y es el único acto de ese tipo en la noticia; si no, no hay título y el
// evento se descarta. Nunca se compone un nombre que no esté en la fuente.
const ARRANQUE = /^(por ultimo|por otro lado|por su parte|ademas|tambien|asimismo|igualmente|antes|despues|tras|luego|mientras|aunque|asi|como|ya|y|e|pero|sin embargo|cabe|hay que|con motivo|durante|a partir|al dia siguiente|en cuanto|esta|este|estos|estas|ese|esa|dicho|dicha|la cofradia|la hermandad|la corporacion|la efigie|la imagen|la talla|la programacion|el acto|el cortejo|el (lunes|martes|miercoles|jueves|viernes|sabado|domingo)|los dias|el dia|el proximo|la proxima|por que)\b/;
const VERBO = /(?<!\p{L})(\p{L}+(rá|rán)|se \p{L}+|ha \p{L}+do|han \p{L}+do|prevé|sale|salen|hace|hacen|es|son|está|están|tiene|tienen|celebra|celebran|acoge|organiza|vive|recuerda)(?!\p{L})/u;
const limpiaT = (t) => String(t || '').replace(/\s+/g, ' ').trim().replace(/^[¿¡"“«(]+/, '');
// Trozo de frase: empieza en minúscula, por un conector o una anáfora, o está cortado. Vale también para titulares ya guardados.
export function trozoDeFrase(t) {
  const s = limpiaT(t);
  return !s || !/^[\p{Lu}\p{N}]/u.test(s) || /([;,:]|…|\.\.\.)$/.test(s) || ARRANQUE.test(norm(s));
}
// Oración completa (lleva verbo conjugado) o demasiado larga para ser el nombre de un acto.
export const pareceFrase = (t) => trozoDeFrase(t) || VERBO.test(limpiaT(t).toLowerCase()) || limpiaT(t).split(' ').length > 16;
/**
 * @param {{tipo: string, frase: string}} e  evento detectado
 * @param {string} titular                   titular de la noticia
 * @param {{tipo: string}[]} todos           todos los eventos detectados en esa noticia
 * @returns {string} título, o '' si no hay un nombre claro (el evento se descarta)
 */
export function tituloDeActo(e, titular, todos) {
  const frase = limpiaT(e.frase).replace(/[\s.;,:]+$/, '');
  const re = (EV_TIPOS.find(([k]) => k === e.tipo) || [])[1];
  // la frase vale si es el nombre del acto: sin ser una oración y con el acto en sus primeras palabras («Solemne triduo…»),
  // no al final de otra cosa («El 5 de diciembre, segunda fecha prevista…», «Incluye los recorridos… de los traslados…»)
  if (!pareceFrase(frase) && re && re.test(norm(frase.split(' ').slice(0, 4).join(' ')))) return frase;
  const unico = todos.filter((x) => x.tipo === e.tipo).length === 1;
  // el titular tampoco vale si es una oración («Osuna comenzará este viernes el camino hacia la coronación…»): es la noticia, no el acto
  return re && unico && re.test(norm(titular)) && !pareceFrase(titular) ? String(titular).trim() : '';
}
// Un evento guardado (agenda-cuerpos.json, news.json) se detectó con las reglas de entonces: solo sigue valiendo si su frase,
// leída con las reglas de hoy, da el mismo tipo y la misma fecha (así un arreglo del detector alcanza a lo ya leído).
export const sigueValiendo = (e, pubTs) => detectarEventos(e.frase, pubTs).some((x) => x.fecha === e.fecha && x.tipo === e.tipo);

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
  const tit = (frase, tipo, titular, todos = [{ tipo }, { tipo: 'pregon' }]) => tituloDeActo({ tipo, frase }, titular, todos);
  eq(tit('Por último, también hay que recordar que a partir del próximo miércoles 18 de noviembre se celebrará un piadoso triduo', 'culto', 'La Esperanza estrena manto'), '', 'frase de noticia sin titular útil: se descarta');
  eq(tit('el 3 de abril habrá un pregón especial de esta efeméride, a cargo del periodista Santi Souvirón;', 'pregon', 'El Cautivo celebra su 75 aniversario', [{ tipo: 'pregon' }, { tipo: 'procesion' }]), '', 'trozo en minúscula');
  eq(tit('Solemne triduo en honor de Nuestra Señora de la Esperanza.', 'culto', 'x'), 'Solemne triduo en honor de Nuestra Señora de la Esperanza', 'frase que ya es el nombre del acto');
  eq(tit('Antes habrá otro traslado el 29 de octubre, de nuevo a la Catedral.', 'traslado', 'El traslado del Cautivo a la Catedral, en imágenes', [{ tipo: 'traslado' }, { tipo: 'extraordinaria' }]), 'El traslado del Cautivo a la Catedral, en imágenes', 'titular si habla del único acto de ese tipo');
  eq(tit('Antes habrá otro traslado el 29 de octubre.', 'traslado', 'Traslados del Cautivo', [{ tipo: 'traslado' }, { tipo: 'traslado' }]), '', 'dos traslados: el titular no dice cuál');
  eq(t('Las hermandades andaluzas y la SGAE abordarán el 27 de noviembre el canon de las marchas procesionales.'), [], 'marchas procesionales no es procesión');
  eq(t('La banda acompañará a la Virgen en su salida procesional del 28 de noviembre.'), ['2026-11-28 procesion'], 'salida procesional sí');
  eq(t('El primer encuentro se ha celebrado este viernes en Sevilla con las cofradías en procesión.'), [], 'pretérito perfecto: crónica');
  eq(t('Fue bendecida el 30 de enero de 1977 y realizó su primera salida procesional el 4 de abril de aquel año.'), [], 'dato histórico («de aquel año»): no se le pone el año que viene');
  eq(tit('Osuna comenzará este viernes el camino hacia la coronación de la Virgen de los Dolores', 'coronacion', 'San Esteban procesiona hoy por su centenario', [{ tipo: 'coronacion' }, { tipo: 'procesion' }]), '', 'frase de otra noticia: se descarta');
  eq(tit('José Manuel Peña dará el pregón el 26 de febrero.', 'pregon', 'José Manuel Peña será el pregonero de la hermandad de Los Gitanos de 2027', [{ tipo: 'pregon' }]), '', 'titular-oración no es nombre de acto');
  eq(tit('Tambin incluye los recorridos completos previstos para los traslados del sbado 28 de noviembre', 'traslado', 'Granada programa 45 traslados desde la Catedral para el regreso de las imágenes de Kerygma: cuatro rutas y horarios del 28 de noviembre', [{ tipo: 'traslado' }]), '', 'el acto no está al principio de la frase');
  eq(tit('Traslado de la Virgen de la Paz a la Catedral el 28 de noviembre', 'traslado', 'x', [{ tipo: 'traslado' }]), 'Traslado de la Virgen de la Paz a la Catedral el 28 de noviembre', 'frase que empieza por el acto');
  eq(sigueValiendo({ fecha: '2026-10-09', tipo: 'procesion', frase: 'El encuentro sobre las marchas procesionales será este viernes.' }, pub), false, 'evento guardado con la regla vieja');
  eq(sigueValiendo({ fecha: '2026-11-14', tipo: 'extraordinaria', frase: 'El sábado 14 de noviembre, procesión extraordinaria de Jesús de la Pasión.' }, pub), true, 'evento guardado que sigue valiendo');
  console.log(process.exitCode ? 'Hay fallos' : 'eventos.mjs: todas las comprobaciones OK');
}
