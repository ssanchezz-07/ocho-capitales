// Ocho Capitales: hábito de nazareno de cada hermandad (túnica, capa, antifaz, capirote…) leído de su ficha oficial (la misma fuente_url del portal).
// Solo se guarda el párrafo que sigue a un encabezado de hábito/nazarenos/túnicas y que de verdad habla de prendas; si no hay, la hermandad se queda sin dato.
// Resultado: tools/sources/habitos.json  { <slug>: { texto, fuente_url } }. Se puede relanzar: conserva lo ya leído.
// Uso: node tools/importar-habitos.mjs [--todo]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(DIR, 'sources', 'habitos.json');
const UA = 'OchoCapitales/1.0 (https://github.com/ssanchezz-07/ocho-capitales; portal cofrade sin animo de lucro)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const PRENDA = /(t[uú]nica|capa\b|antifaz|capirote|capuch[oó]n|morri[oó]n|c[ií]ngulo|cintur[oó]n|escapulario|faj[ií]n|sarga|terciopelo|lanilla|raso|botonadura|esparto|guantes|medall[oó]n|babero)/i;
const ENCABEZADO = /^(h[aá]bito( de nazareno)?|h[aá]bito nazareno|vestimenta|indumentaria|t[uú]nicas?|nazarenos|el h[aá]bito|traje de nazareno)\s*:?$/i;

const textoHtml = (html) => html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<nav[\s\S]*?<\/nav>|<footer[\s\S]*?<\/footer>/gi, '').replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|div|li|h\d|tr|dt|dd|span)>/gi, '\n').replace(/<[^>]+>/g, '')
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#8211;|&ndash;/g, '-').replace(/&#8217;|&rsquo;/g, "'").replace(/&#8220;|&#8221;|&quot;/g, '"').replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n)).replace(/&[a-z]+;/g, '');

export function extraeHabito(html) {
  const ls = textoHtml(html).split('\n').map((l) => l.replace(/\s+/g, ' ').trim()).filter(Boolean);
  for (let i = 0; i < ls.length - 1; i++) {
    if (!ENCABEZADO.test(ls[i])) continue;
    // el texto del hábito puede ocupar varias líneas cortas; se unen hasta el siguiente encabezado corto sin punto
    let t = ''; for (let k = i + 1; k < Math.min(ls.length, i + 6); k++) { const l = ls[k]; if (l.length < 28 && !/[.]$/.test(l) && t) break; t += (t ? ' ' : '') + l; if (t.length > 700) break; }
    if (PRENDA.test(t) && t.length >= 25) return t.slice(0, 700).trim();
  }
  return '';
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const D = JSON.parse(fs.readFileSync(path.join(DIR, '..', 'portal-cofrade', 'data', 'portal.json'), 'utf8'));
  let out = {}; try { out = JSON.parse(fs.readFileSync(OUT, 'utf8')); } catch (e) { out = {}; }
  for (const h of D.hermandades) {
    if (!h.fuente_url || /wikipedia\.org/.test(h.fuente_url)) continue;
    if (out[h.slug] && !process.argv.includes('--todo')) continue;
    let html = ''; try { const r = await fetch(h.fuente_url, { headers: { 'User-Agent': UA } }); if (r.ok) html = await r.text(); } catch (e) { /* sin red o 404 */ }
    out[h.slug] = { texto: html ? extraeHabito(html) : '', fuente_url: h.fuente_url };
    await sleep(400);
  }
  fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
  const con = Object.entries(out).filter(([, v]) => v.texto);
  const by = {}; for (const [k] of con) { const h = D.hermandades.find((x) => x.slug === k); if (h) by[h.ciudad] = (by[h.ciudad] || 0) + 1; }
  console.log(Object.keys(out).length, 'fichas leídas;', con.length, 'con hábito;', by);
}
