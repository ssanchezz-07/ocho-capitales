// Ocho Capitales: descarga las agendas cofrades de terceros y las normaliza en tools/sources/agenda-externa.json.
//  · Agenda de InfoCofrade (https://infocofrade.com/agenda/): un año de cultos, rosarios, traslados, procesiones extraordinarias y de gloria.
//  · El Itinerario (https://elitinerario.es/agenda/): cultos de Málaga (Google Calendar).
// Solo se toman hechos (fecha, hora, qué es, dónde) y se enlaza siempre a la fuente. Los eventos salen como «detectados»,
// nunca como verificados: lo verificado vive en portal-cofrade/data/eventos.json.
// Uso: node tools/agenda-externa.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const UA = 'OchoCapitales/1.0 (https://github.com/ssanchezz-07/ocho-capitales; portal cofrade sin animo de lucro)';
const LOCS = JSON.parse(fs.readFileSync(path.join(DIR, 'sources', 'localidades.json'), 'utf8'));
const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
const CAPS = ['malaga', 'sevilla', 'granada', 'cordoba', 'jaen', 'huelva', 'cadiz', 'almeria'];
const MESES = { enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6, julio: 7, agosto: 8, septiembre: 9, octubre: 10, noviembre: 11, diciembre: 12 };
const pad = (n) => String(n).padStart(2, '0');

// ¿a qué capital (provincia) pertenece el acto? Se mira el paréntesis «(Córdoba)» y, si no, el pueblo nombrado.
function ciudadDe(t) {
  const par = t.match(/\(([^)]+)\)/g) || [];
  for (const p of par) { const k = norm(p.replace(/[()]/g, '')); if (CAPS.includes(k)) return k; }
  const k = norm(t);
  for (const [loc, cap] of Object.entries(LOCS)) { if (loc.startsWith('_')) continue; if (loc.length > 4 && (' ' + k + ' ').includes(' ' + loc.replace(/-/g, ' ') + ' ')) return cap; }
  for (const c of CAPS) if ((' ' + k + ' ').includes(' ' + c + ' ') && c !== 'sevilla') return c;
  return 'sevilla';
}
function tipoDe(t) {
  const k = norm(t);
  if (/^procesion magna|^magna/.test(k)) return 'magna';
  if (/coronacion canonica|^coronacion/.test(k) || /misa estacional y coronacion/.test(k)) return 'coronacion';
  if (/^procesion extraordinaria|^salida extraordinaria|^traslado extraordinario/.test(k)) return 'extraordinaria';
  if (/^(traslado|vuelta a su)/.test(k)) return 'traslado';
  if (/^rosario/.test(k) && /(aurora|vespertino|callejero|presidido por|por las calles|publico)/.test(k)) return 'procesion';
  if (/^(procesion|rosario de la aurora|rosario vespertino|rosario con|rosario publico|rosario de|desfile procesional|salida procesional)/.test(k)) return 'procesion';
  if (/^(besamanos|besamano|besapies|besapie)/.test(k)) return 'besamanos';
  if (/^(via crucis|viacrucis)/.test(k)) return 'via-crucis';
  if (/^(concierto|marchas|certamen|festival|gala)/.test(k)) return 'concierto';
  if (/^(pregon|exaltacion)/.test(k)) return 'pregon';
  if (/cartel/.test(k) && /^(presentacion|cartel)/.test(k)) return 'cartel';
  if (/^(triduo|novena|septenario|quinario|funcion|misa|veneracion|solemne|eucaristia|santa misa|rosario|aniversario|ofrenda|cabildo|jura|bendicion|vigilia|hora santa|exposicion|pleito|acto|encuentro|peregrinacion|consejo de|conferencia|presentacion|inauguracion|cultos)/.test(k)) return 'culto';
  return '';
}
const horaDe = (t) => { const m = t.match(/(?:a las|salida:?|sale a las|desde las)\s*(\d{1,2})[:.](\d{2})/i); return m ? pad(+m[1]) + ':' + m[2] : ''; };
// la hora ya va en su propio campo: se quita de la nota («A las 19.30 horas, en la parroquia…» → «En la parroquia…»)
const notaLimpia = (t, max = 240) => { let n = String(t || '').replace(/(^|\.\s+)(?:A las|A partir de las)\s+\d{1,2}(?:[:.]\d{2})?\s+horas?,?\s*/gi, '$1').replace(/^\s*[a-z]/, (c) => c.toUpperCase()).trim(); if (n.length > max) n = n.slice(0, max).replace(/\s+\S*$/, '') + '…'; return n; };
const limpia = (t) => t.replace(/^[^\p{L}\p{N}¡¿"“«]+/u, '').replace(/\s+/g, ' ').trim();

async function infocofrade() {
  const url = 'https://infocofrade.com/agenda/';
  const r = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!r.ok) throw new Error('InfoCofrade HTTP ' + r.status);
  let h = await r.text();
  const m = h.match(/<article[\s\S]*?<\/article>/i) || h.match(/<main[\s\S]*?<\/main>/i);
  h = (m ? m[0] : h).replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, '').replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|div|li|h\d|tr)>/gi, '\n').replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#8211;|&ndash;/g, '-').replace(/&#8217;|&rsquo;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n));
  const lines = h.split('\n').map((l) => l.replace(/\s+/g, ' ').trim()).filter(Boolean);
  const out = []; let year = null, mes = 0, dia = 0, prev = null;
  for (const l of lines) {
    if (/^\d{4}$/.test(l)) { year = +l; continue; }
    const mm = norm(l).match(/^(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)$/);
    if (mm) { const n = MESES[mm[1]]; if (mes && n < mes) year++; mes = n; continue; }
    const d = l.match(/^(?:LUNES|MARTES|MI[ÉE]RCOLES|JUEVES|VIERNES|S[ÁA]BADO|DOMINGO)\s+(\d{1,2})/i);
    if (d && year && mes) { dia = +d[1]; prev = null; continue; }
    if (!dia || l === '-' || l.length < 8) continue;
    if (/^🎺/.test(l)) { if (prev) prev.nota = (prev.nota ? prev.nota + ' ' : '') + limpia(l).replace(/^Acompa[ñn]amientos? musicales?:\s*/i, 'Música: '); continue; }
    if (/^✝️/.test(l)) continue; // el calendario litúrgico lo calcula el portal
    const texto = limpia(l);
    const tipo = /^🔴/.test(l) ? 'magna' : /^👑/.test(l) ? 'coronacion' : tipoDe(texto);
    if (!tipo) continue;
    // título = primera frase; lo demás (salida, recorrido, música) pasa a la nota
    const partes = texto.split(/\.\s+(?=[A-ZÁÉÍÓÚ])/);
    let titulo = partes[0].replace(/\.$/, '');
    const resto = partes.slice(1).filter((p) => !/^Recorrido/i.test(p)).join('. ');
    const music = (texto.match(/Acompa[ñn]a(?:n|rán)?:?\s+([^.]+(?:\.[^.]{0,0})?)/i) || [])[1];
    const e = { fecha: `${year}-${pad(mes)}-${pad(dia)}`, hora: horaDe(texto), ciudad: ciudadDe(titulo + ' ' + resto), tipo, titulo, nota: [resto && !music ? resto : '', music ? 'Música: ' + music.trim() : ''].filter(Boolean).join(' ').slice(0, 320), fuente: 'InfoCofrade', url };
    out.push(e); prev = e;
  }
  return out;
}

async function elitinerario() {
  const url = 'https://elitinerario.es/agenda/';
  const out = [];
  const parseMonth = (html, year, month) => {
    html = html.replace(/\\"/g, '"').replace(/\\\//g, '/').replace(/\\n|\\t/g, ' ');
    for (const li of html.split('simcal-event simcal-event')) {
      const t = li.match(/itemprop="name">([^<]+)</); const s = li.match(/itemprop="startDate" content="(\d{4})-(\d\d)-(\d\d)T(\d\d):(\d\d)/);
      if (!t || !s) continue;
      const lugar = (li.match(/<meta itemprop="name" content="([^"]*)"/) || [])[1] || '';
      out.push({ fecha: `${s[1]}-${s[2]}-${s[3]}`, hora: `${s[4]}:${s[5]}`, ciudad: 'malaga', tipo: tipoDe(t[1].replace(/&amp;/g, '&')) || 'culto', titulo: t[1].replace(/&amp;/g, '&').replace(/&#8211;/g, '-'), nota: lugar, fuente: 'El Itinerario', url });
    }
  };
  const r = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!r.ok) throw new Error('El Itinerario HTTP ' + r.status);
  const first = await r.text();
  const ym = first.match(/simcal-month-(\d+)/); const hoy = new Date();
  parseMonth(first, hoy.getFullYear(), ym ? +ym[1] : hoy.getMonth() + 1);
  for (let i = 1; i <= 6; i++) {
    const d = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth() + i, 1));
    const rr = await fetch('https://elitinerario.es/wp-admin/admin-ajax.php', { method: 'POST', headers: { 'User-Agent': UA, 'content-type': 'application/x-www-form-urlencoded' }, body: `action=simcal_default_calendar_draw_grid&month=${d.getUTCMonth() + 1}&year=${d.getUTCFullYear()}&id=465` });
    if (rr.ok) { const j = await rr.json().catch(() => null); if (j && j.data) parseMonth(j.data, d.getUTCFullYear(), d.getUTCMonth() + 1); }
  }
  // sin duplicados (el mismo acto aparece en la rejilla y en el detalle)
  const seen = new Set(); return out.filter((e) => { const k = e.fecha + e.hora + e.titulo; if (seen.has(k)) return false; seen.add(k); return true; });
}

// Los enlaces de Google Noticias (news.google.com/rss/articles/…) se resuelven al enlace real del medio.
const UA_NAV = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36';
async function resolverGoogle(url) {
  try {
    const id = url.match(/articles\/([^?/]+)/)[1];
    const page = await (await fetch(`https://news.google.com/articles/${id}?hl=es&gl=ES&ceid=ES:es`, { headers: { 'User-Agent': UA_NAV } })).text();
    const sg = (page.match(/data-n-a-sg="([^"]+)"/) || [])[1], ts = (page.match(/data-n-a-ts="([^"]+)"/) || [])[1];
    if (!sg || !ts) return '';
    const req = JSON.stringify([[['Fbv4je', JSON.stringify(['garturlreq', [['es', 'ES', ['FINANCE_TOP_INDICES', 'WEB_TEST_1_0_0'], null, null, 1, 1, 'ES:es', null, 180, null, null, null, null, null, 0, 5], 'es', 'ES', 1, [2, 4, 8], 1, 1, null, 0, 0, null, 0], id, +ts, sg]), null, 'generic']]]);
    const r = await fetch('https://news.google.com/_/DotsSplashUi/data/batchexecute', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded;charset=UTF-8', 'User-Agent': UA_NAV }, body: 'f.req=' + encodeURIComponent(req) });
    const m = (await r.text()).match(/garturlres[^h]+(https?:[^"]+)/);
    return m ? m[1].split('\\').join('') : '';
  } catch (e) { return ''; }
}
const textoHtml = (html) => html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, '').replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|div|li|h\d)>/gi, '\n').replace(/<[^>]+>/g, '')
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#8211;|&ndash;/g, '-').replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n)).replace(/&[a-z]+;/g, '');
const CIUDAD_TITULO = (t) => CAPS.find((c) => (' ' + norm(t) + ' ').includes(' ' + c + ' ')) || '';

// Agendas de prensa. Dos formatos conocidos:
//  A) semanal con viñetas por día («Jueves 8 de octubre» / «• Hermandad. Acto. A las 19.30 horas, en …»), p. ej. Diario SUR (Málaga);
//  B) diaria «20:30 | Título» + lugar + descripción, con la fecha en el titular («Agenda cofrade del 8 de octubre en Córdoba»), p. ej. Andalucía Información.
// Se buscan en las noticias ya recogidas (titulares de «agenda cofrade» de los últimos días) y se leen enteras.
async function agendasPrensa() {
  let news = []; try { news = JSON.parse(fs.readFileSync(path.join(DIR, '..', 'site', 'data', 'news.json'), 'utf8')).items; } catch (e) { return []; }
  const desde = Date.now() - 10 * 864e5;
  const arts = news.filter((n) => n.ts >= desde && /agenda cofrade|fin de semana con procesiones/i.test(n.titulo)).slice(0, 60);
  const out = [];
  for (const a of arts) {
    let url = a.url;
    if (/news\.google\.com/.test(url)) { url = await resolverGoogle(url); if (!url) continue; }
    let r; try { r = await fetch(url, { headers: { 'User-Agent': UA } }); } catch (e) { continue; } if (!r.ok) continue;
    const h = textoHtml(await r.text());
    const anio = new Date(a.ts).getUTCFullYear();
    const ciudad = (a.ciudades && a.ciudades[0]) || CIUDAD_TITULO(a.titulo) || (/diariosur/.test(url) ? 'malaga' : '');
    if (!ciudad) continue;
    const base = { ciudad, fuente: a.fuente, url };
    const tit = norm(a.titulo).match(/del (\d{1,2}) de (enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\b/);
    if (tit && !/ al /.test(norm(a.titulo))) {
      // formato B: una agenda de un solo día
      const fecha = `${anio}-${pad(MESES[tit[2]])}-${pad(+tit[1])}`; const ls = h.split('\n').map((l) => l.replace(/\s+/g, ' ').trim()).filter(Boolean);
      for (let i = 0; i < ls.length; i++) {
        const m = ls[i].match(/^(\d{1,2}):(\d{2}) \| (.{4,200})$/); if (!m) continue;
        const titulo = m[3].trim(); const lugar = ls[i + 1] && ls[i + 1].length < 90 ? ls[i + 1] : '';
        const tipo = tipoDe(titulo) || (/conferencia|charla|exposici|presentaci|jornada|encuentro|visita|taller/i.test(titulo) ? 'acto' : /rosario|triduo|funci|misa|besamano|veneraci|novena/i.test(titulo) ? 'culto' : 'acto');
        out.push({ ...base, fecha, hora: pad(+m[1]) + ':' + m[2], tipo, titulo, nota: lugar });
      }
      continue;
    }
    // formato A
    let fecha = '';
    for (const raw of h.split('\n')) {
      const l = raw.replace(/\s+/g, ' ').trim();
      const d = norm(l).match(/^(lunes|martes|miercoles|jueves|viernes|sabado|domingo) (\d{1,2}) de (enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)$/);
      if (d) { fecha = `${anio}-${pad(MESES[d[3]])}-${pad(+d[2])}`; continue; }
      if (!fecha || !/^[•·▪-]\s*/.test(l)) continue;
      const m = l.replace(/^[•·▪-]\s*/, '').match(/^([^.]{2,60})\.\s+(.*)$/); if (!m) continue;
      const [, quien, resto] = m; const acto = resto.split(/\.\s+/)[0];
      const tipo = tipoDe(acto) || (/conferencia|charla|exposici|presentaci|jornada/i.test(acto) ? 'acto' : /rosario|triduo|funci|misa|besamano|veneraci|traslado|procesi/i.test(acto) ? 'culto' : '');
      if (!tipo || /^(fiesta|migas)/i.test(norm(acto))) continue;
      const hh = resto.match(/(?:a las|salida (?:ser[aá]|es) a las|a partir de las)\s*(\d{1,2})(?:[:.](\d{2}))?/i);
      const tr = resto.match(/A las (\d{1,2})(?:[:.](\d{2}))? horas?,? (traslado[^.]*)/i);
      if (tr && !/^traslado/i.test(norm(acto))) out.push({ ...base, fecha, hora: pad(+tr[1]) + ':' + (tr[2] || '00'), tipo: 'traslado', titulo: `${quien.trim()}: ${tr[3].replace(/\s+/g, ' ').slice(0, 140)}`, nota: '' });
      out.push({ ...base, fecha, hora: hh ? pad(+hh[1]) + ':' + (hh[2] || '00') : '', tipo, titulo: `${quien.trim()}: ${acto.replace(/\.$/, '')}`, nota: notaLimpia(resto.split(/\.\s+/).slice(1).filter((x) => !/^El itinerario/i.test(x)).join('. ')) });
    }
  }
  const seen = new Set(); return out.filter((e) => { const k = e.fecha + e.ciudad + norm(e.titulo); if (seen.has(k)) return false; seen.add(k); return true; });
}

const res = { generado: new Date().toISOString().slice(0, 10), fuentes: {}, eventos: [] };
for (const [nombre, fn] of [['InfoCofrade', infocofrade], ['El Itinerario', elitinerario], ['Prensa (agendas semanales)', agendasPrensa]]) {
  try { const ev = await fn(); res.fuentes[nombre] = ev.length; res.eventos.push(...ev); } catch (e) { console.error(nombre + ': ' + e.message); res.fuentes[nombre] = 0; }
}
// Contraste entre fuentes: mismo acto (palabras clave comunes) con fechas distintas = discrepancia que hay que revisar a mano.
const STOP = new Set(['del', 'las', 'los', 'con', 'por', 'una', 'regre', 'procesion', 'extraordinaria', 'nuestra', 'nuestro', 'senora', 'senor', 'virgen', 'santisima', 'maria', 'padre', 'jesus', 'dia', 'triduo', 'funcion', 'solemne', 'honor', 'ntra', 'sra', 'stma', 'stmo', 'cristo', 'traslado', 'vuelta', 'ida', 'regreso', 'besamanos', 'rosario', 'cultos', 'primer', 'segundo', 'tercer', 'principal', 'misa', 'hermandad', 'cofradia']);
const sig = (t) => new Set(norm(t).split(' ').filter((w) => w.length >= 3 && !STOP.has(w)));
const solapa = (a, b) => { let n = 0; for (const x of a) if (b.has(x)) n++; return n / Math.max(1, Math.min(a.size, b.size)); };
const DIA = 864e5; const conflictos = []; const ev = res.eventos;
for (let i = 0; i < ev.length; i++) for (let j = i + 1; j < ev.length; j++) {
  const a = ev[i], b = ev[j]; if (a.fuente === b.fuente || a.ciudad !== b.ciudad || a.tipo !== b.tipo || a.fecha === b.fecha) continue;
  if (Math.abs(Date.parse(a.fecha) - Date.parse(b.fecha)) > 2 * DIA) continue;
  const sa = sig(a.titulo), sb = sig(b.titulo);
  // en series de varios días (triduos…) cada fuente tiene su propio día: solo hay discrepancia si el acto no coincide con ninguno de la otra fuente
  const coincide = (x, fechaDe, otro) => ev.some((y) => y.fuente === otro.fuente && y.ciudad === x.ciudad && y.tipo === x.tipo && y.fecha === fechaDe && solapa(sig(y.titulo), sig(x.titulo)) >= 0.5);
  if (coincide(a, b.fecha, a) || coincide(b, a.fecha, b)) continue;
  if (sa.size && sb.size && solapa(sa, sb) >= 0.5) conflictos.push({ a: { fecha: a.fecha, hora: a.hora, titulo: a.titulo, fuente: a.fuente, url: a.url }, b: { fecha: b.fecha, hora: b.hora, titulo: b.titulo, fuente: b.fuente, url: b.url } });
}
res.conflictos = conflictos;
// el último archivo bueno se conserva si ambas fuentes fallan
const file = path.join(DIR, 'sources', 'agenda-externa.json');
if (res.eventos.length) fs.writeFileSync(file, JSON.stringify(res, null, 1));
else console.error('Sin eventos nuevos: se conserva el archivo anterior.');
const porTipo = {}; res.eventos.forEach((e) => { porTipo[e.tipo] = (porTipo[e.tipo] || 0) + 1; });
const porCiudad = {}; res.eventos.forEach((e) => { porCiudad[e.ciudad] = (porCiudad[e.ciudad] || 0) + 1; });
console.log(res.fuentes, porTipo, porCiudad);
if (conflictos.length) { console.log('Discrepancias entre fuentes (revisar):'); for (const c of conflictos) console.log(' · ' + c.a.fuente + ' ' + c.a.fecha + ' vs ' + c.b.fuente + ' ' + c.b.fecha + ' | ' + c.a.titulo.slice(0, 70)); }
