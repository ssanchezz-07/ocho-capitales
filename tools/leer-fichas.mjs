// Ocho Capitales: descarga el texto de la ficha oficial (consejo, agrupación o federación) o del artículo de Wikipedia
// de cada hermandad a la que le falta historia, fundación, web, paso o sede, para leerlo y rellenar esos campos con fuente.
// No escribe en portal.json: deja tools/sources/fichas/<slug>.txt y tools/sources/fichas/indice.json (webs candidatas).
// Los datos revisados se pasan a mano a complementos.json (campo «relleno»), que build-data.js usa solo para huecos.
// Uso: node tools/leer-fichas.mjs [ciudad]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const D = JSON.parse(fs.readFileSync(path.join(DIR, '..', 'portal-cofrade', 'data', 'portal.json'), 'utf8'));
const OUT = path.join(DIR, 'sources', 'fichas');
fs.mkdirSync(OUT, { recursive: true });
const UA = 'OchoCapitales/1.0 (https://github.com/ssanchezz-07/ocho-capitales; portal cofrade sin animo de lucro)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const vacio = (v) => !v || !String(v).trim();
const solo = process.argv[2];
const OFICIAL = /consejocofradiascadiz|consejohermandadeshuelva|cofradiasdealmeria|hermandadesdecordoba|agrupaciondecofradias|cofradiasjaen|wikipedia\.org/;
const REDES = /facebook|instagram|twitter|x\.com|youtube|tiktok|flickr|whatsapp|wp-content|wordpress\.org|google|apple\.com|gravatar|wikimedia|wikipedia|wikidata|creativecommons|mediawiki|archive\.org/;

function limpiar(h) {
  const m = h.match(/<article[\s\S]*?<\/article>/i) || h.match(/<main[\s\S]*?<\/main>/i) || h.match(/<div[^>]+(id|class)="[^"]*(mw-content-text|entry-content|post-content|content)[^"]*"[\s\S]*$/i);
  return (m ? m[0] : h).replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<nav[\s\S]*?<\/nav>|<footer[\s\S]*?<\/footer>|<sup[\s\S]*?<\/sup>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|div|li|h\d|tr|figcaption|th|td)>/gi, '\n').replace(/<[^>]+>/g, '')
    .replace(/&#8220;|&#8221;|&quot;|&#171;|&#187;/g, '"').replace(/&#8211;|&ndash;|&#8212;|&mdash;/g, '-').replace(/&#8217;|&rsquo;/g, "'").replace(/&nbsp;|&#160;/g, ' ').replace(/&amp;/g, '&')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
    .split('\n').map((l) => l.replace(/\s+/g, ' ').trim()).filter(Boolean).join('\n');
}

const idx = fs.existsSync(path.join(OUT, 'indice.json')) ? JSON.parse(fs.readFileSync(path.join(OUT, 'indice.json'), 'utf8')) : {};
const todo = D.hermandades.filter((h) => (!solo || h.ciudad === solo) && OFICIAL.test(h.fuente_url || '') && ['historia', 'fundacion', 'web', 'paso', 'sede'].some((k) => vacio(h[k])));
for (const h of todo) {
  if (idx[h.slug] && fs.existsSync(path.join(OUT, h.slug + '.txt'))) continue;
  try {
    const r = await fetch(h.fuente_url, { headers: { 'User-Agent': UA }, redirect: 'follow' });
    if (!r.ok) { console.log('HTTP', r.status, h.slug); continue; }
    const html = await r.text();
    const host = new URL(h.fuente_url).hostname;
    const webs = [...new Set([...html.matchAll(/href="(https?:\/\/[^"#]+)"/g)].map((m) => m[1]).filter((u) => { try { const x = new URL(u).hostname; return x !== host && !REDES.test(u); } catch (e) { return false; } }))].slice(0, 12);
    const faltan = ['historia', 'fundacion', 'web', 'paso', 'sede'].filter((k) => vacio(h[k]));
    fs.writeFileSync(path.join(OUT, h.slug + '.txt'), `# ${h.nombre} (${h.ciudad})\n# Fuente: ${h.fuente_url}\n# Faltan: ${faltan.join(', ')}\n\n` + limpiar(html).slice(0, 12000));
    idx[h.slug] = { fuente: h.fuente_url, faltan, webs };
    console.log('ok', h.slug, faltan.join(','), webs.length + ' enlaces');
    fs.writeFileSync(path.join(OUT, 'indice.json'), JSON.stringify(idx, null, 1));
    await sleep(800);
  } catch (e) { console.log('error', h.slug, e.message); }
}
fs.writeFileSync(path.join(OUT, 'indice.json'), JSON.stringify(idx, null, 1));
console.log('Fichas:', Object.keys(idx).length);
