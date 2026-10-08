// Ocho Capitales: descarga una página y guarda su texto limpio (líneas) para leerla y transcribir datos con fuente.
// Uso: node tools/texto-web.mjs <url> <salida.txt>
import fs from 'node:fs';
const [url, out] = process.argv.slice(2);
const UA = 'OchoCapitales/1.0 (https://github.com/ssanchezz-07/ocho-capitales; portal cofrade sin animo de lucro)';
const r = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'follow' });
if (!r.ok) { console.error('HTTP', r.status, url); process.exit(1); }
let h = await r.text();
const m = h.match(/<article[\s\S]*?<\/article>/i) || h.match(/<div[^>]+class="[^"]*(entry-content|post-content|article-body|td-post-content)[^"]*"[\s\S]*$/i);
let b = (m ? m[0] : h).replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<nav[\s\S]*?<\/nav>|<footer[\s\S]*?<\/footer>/gi, '')
  .replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|div|li|h\d|tr|figcaption)>/gi, '\n').replace(/<\/t[dh]>/gi, ' | ').replace(/<[^>]+>/g, '')
  .replace(/&#8220;|&#8221;|&quot;/g, '"').replace(/&#8211;|&ndash;/g, '-').replace(/&#8217;|&rsquo;/g, "'").replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
  .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n));
b = b.split('\n').map((l) => l.replace(/\s+/g, ' ').trim()).filter(Boolean).join('\n');
fs.writeFileSync(out, b);
console.log(out, b.length, 'caracteres');
