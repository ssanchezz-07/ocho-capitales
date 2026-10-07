// InfoCofrade — lector de noticias.
// Lee las fuentes RSS/Atom de ../portal-cofrade/data/fuentes.json y actualiza data/news.json
// (titular, extracto corto, imagen y enlace a la fuente original; nunca el texto completo).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { XMLParser } from 'fast-xml-parser';
import { detectarEventos } from './eventos.mjs';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const FUENTES = JSON.parse(fs.readFileSync(path.join(DIR, '..', 'portal-cofrade', 'data', 'fuentes.json'), 'utf8'));
const PORTAL = JSON.parse(fs.readFileSync(path.join(DIR, '..', 'portal-cofrade', 'data', 'portal.json'), 'utf8'));
const OUT = path.join(DIR, 'data', 'news.json');
const UA = 'Mozilla/5.0 (compatible; InfoCofrade/1.0; +https://github.com)';
const RETENCION_DIAS = 365;
const MAX_ITEMS = 2500;

const KEYWORDS = ['semana santa', 'cofrad', 'hermandad', 'costaler', 'cornetas', 'agrupacion musical', 'palio', 'saeta', 'procesion', 'imaginer', 'besamanos', 'via crucis', 'capataz', 'marcha procesional'];
const WEAK = ['nazaren', 'penitencia', 'cristo', 'dolorosa'];
const NEG = ['futbol', 'baloncesto', 'voleibol', 'balonmano', 'segunda b', 'primera rfef', 'liga ', 'jornada', 'penitenciari', 'prision', 'carcel', 'tenis', 'padel', 'rugby'];
const CIUDADES = PORTAL.capitales.map((c) => c.slug);

const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const ent = (s) => String(s || '')
  .replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'")
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
  .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16))).replace(/&amp;/g, '&');
const decode = (s) => ent(ent(String(s || '').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')))
  .replace(/<(script|style)[^>]*>[\s\S]*?<\/>/gi, ' ')
  .replace(/<[^>]*>/g, ' ').replace(/<[^>]*$/, ' ')
  .replace(/\s*The post .{0,200}? first appeared on .*$/s, '')
  .replace(/\s+/g, ' ').trim();
const txt = (v) => (v == null ? '' : typeof v === 'object' ? (v['#text'] ?? v['@_href'] ?? '') : String(v));

function temaCofrade(t) {
  const n = norm(t);
  if (KEYWORDS.some((k) => n.includes(k))) return true;
  if (NEG.some((k) => n.includes(k))) return false;
  return WEAK.some((k) => n.includes(k));
}
function ciudades(t) {
  const n = ' ' + norm(t) + ' ';
  return CIUDADES.filter((c) => new RegExp('\\b' + c + '\\b').test(n));
}
function recorta(s, max = 320) {
  const w = s.split(' ');
  let out = w.slice(0, 42).join(' ');
  if (w.length > 42) out += '…';
  return out.length > max ? out.slice(0, max - 1) + '…' : out;
}
async function get(url) {
  const ac = new AbortController();
  const to = setTimeout(() => ac.abort(), 20000);
  try {
    const r = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*' }, signal: ac.signal, redirect: 'follow' });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return await r.text();
  } finally { clearTimeout(to); }
}

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_', textNodeName: '#text', cdataPropName: false, processEntities: false, htmlEntities: false });

function items(xml) {
  const doc = parser.parse(xml);
  if (doc.rss) {
    const ch = doc.rss.channel || {};
    return [].concat(ch.item || []).map((it) => {
      const enc = [].concat(it.enclosure || []).find((e) => String(e['@_type'] || '').startsWith('image'));
      const media = [].concat(it['media:content'] || [], it['media:thumbnail'] || []).find((m) => m && m['@_url']);
      const content = txt(it['content:encoded']) || txt(it.description);
      const imgInHtml = (content.match(/<img[^>]+src=["']([^"']+)["']/i) || [])[1];
      return {
        titulo: decode(txt(it.title)), url: txt(it.link).trim(), fecha: txt(it.pubDate) || txt(it['dc:date']),
        desc: decode(txt(it.description) || content), cuerpo: decode(content.replace(/<\/(p|li|h\d|div)>|<br\s*\/?>/gi, '. ')), img: (enc && enc['@_url']) || (media && media['@_url']) || imgInHtml || '',
        fuente: it.source ? decode(txt(it.source)) : '',
      };
    });
  }
  if (doc.feed) {
    return [].concat(doc.feed.entry || []).map((e) => {
      const links = [].concat(e.link || []);
      const l = links.find((x) => !x['@_rel'] || x['@_rel'] === 'alternate') || links[0] || {};
      const content = txt(e.content) || txt(e.summary);
      return { titulo: decode(txt(e.title)), url: l['@_href'] || '', fecha: txt(e.published) || txt(e.updated), desc: decode(txt(e.summary) || content), cuerpo: decode(content.replace(/<\/(p|li|h\d|div)>|<br\s*\/?>/gi, '. ')), img: (content.match(/<img[^>]+src=["']([^"']+)["']/i) || [])[1] || '', fuente: '' };
    });
  }
  return [];
}

async function main() {
  const prev = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : { items: [], fuentes: {} };
  // Las noticias guardadas con HTML a medias se descartan para volver a leerlas limpias
  prev.items = prev.items.filter((n) => !/<|&lt;/.test(n.extracto + n.titulo));
  const seen = new Set(prev.items.flatMap((n) => [n.h, n.t]));
  const nuevos = [];
  const estado = {};
  const limite = Date.now() - RETENCION_DIAS * 864e5;
  let i = 0;
  async function worker() {
    while (i < FUENTES.length) {
      const f = FUENTES[i++];
      const nombre = f.nombre.replace(/\s*\(.*\)\s*$/, '');
      try {
        const xml = await get(f.url);
        let n = 0;
        for (const it of items(xml).slice(0, 60)) {
          if (!it.titulo || !/^https?:\/\//.test(it.url)) continue;
          let fuente = nombre;
          let titulo = it.titulo;
          let extracto = '';
          if (f.tipo === 'agregador') {
            fuente = it.fuente || 'Google Noticias';
            if (it.fuente && titulo.endsWith(' - ' + it.fuente)) titulo = titulo.slice(0, -(it.fuente.length + 3)).trim();
          } else {
            extracto = recorta(it.desc);
            if (norm(extracto) === norm(titulo)) extracto = '';
          }
          if (f.filtro && !temaCofrade(titulo + ' ' + extracto)) continue;
          let ts = Date.parse(it.fecha) || Date.now();
          if (ts > Date.now()) ts = Date.now();
          if (ts < limite) continue;
          const h = 'h' + Buffer.from(it.url).toString('base64url').slice(-40);
          const t = norm(titulo).replace(/[^a-z0-9]+/g, '') + '|' + norm(fuente);
          if (seen.has(h) || seen.has(t)) continue;
          seen.add(h); seen.add(t);
          let cs = ciudades(titulo + ' ' + extracto);
          if (!cs.length && f.ciudad) cs = [f.ciudad];
          const img = f.tipo === 'agregador' ? '' : (/^https?:\/\//.test(it.img) ? it.img : '');
          // Eventos con fecha leídos del texto completo de la fuente (no se guarda el texto, solo fecha, tipo y una frase corta).
          const ev = detectarEventos(titulo + '. ' + (it.cuerpo || extracto), ts).map((e) => ({ f: e.fecha, t: e.tipo, s: e.frase.slice(0, 160) }));
          nuevos.push({ h, t, titulo, extracto, url: it.url, fuente, ts, img, ciudades: cs, tipo: f.tipo, ...(ev.length ? { ev } : {}) });
          n++;
        }
        estado[f.nombre] = { ok: true, nuevas: n, fecha: Date.now() };
      } catch (e) {
        estado[f.nombre] = { ok: false, error: String(e.message || e).slice(0, 120), fecha: Date.now() };
      }
    }
  }
  await Promise.all(Array.from({ length: 6 }, worker));
  const all = prev.items.concat(nuevos).filter((n) => n.ts >= limite).sort((a, b) => b.ts - a.ts).slice(0, MAX_ITEMS);
  fs.writeFileSync(OUT, JSON.stringify({ actualizado: Date.now(), items: all, fuentes: estado }));
  const ok = Object.values(estado).filter((x) => x.ok).length;
  console.log(`Noticias: ${nuevos.length} nuevas, ${all.length} en total. Fuentes correctas: ${ok}/${FUENTES.length}.`);
  for (const [k, v] of Object.entries(estado)) if (!v.ok) console.log('  ✗', k, '—', v.error);
}
// Salida explícita: en GitHub Actions alguna conexión keep-alive dejaba el proceso vivo ~10 min
// después de terminar (las fuentes acaban en ~15 s).
main().then(() => process.exit(0), (e) => { console.error(e); process.exit(1); });
