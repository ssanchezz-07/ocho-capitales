// Ocho Capitales: propone el nombre oficial (y la web) de las hermandades que no lo tienen, leyendo el artículo de Wikipedia
// (Sevilla) o la ficha del consejo local (Cádiz, Almería) que ya figura como fuente. Solo escribe BORRADORES para revisar a ojo:
// tools/sources/borradores/nombres-oficiales.json. Nada entra en el portal sin pasar por integrar-propuestas.mjs.
// Uso: node tools/buscar-nombres-oficiales.mjs [sevilla|cadiz|almeria]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const DIR = path.dirname(fileURLToPath(import.meta.url));
const P = JSON.parse(fs.readFileSync(path.join(DIR, '..', 'portal-cofrade', 'data', 'portal.json'), 'utf8'));
const OUT = path.join(DIR, 'sources', 'borradores', 'nombres-oficiales.json');
const ciudad = process.argv[2] || 'sevilla';
const UA = 'OchoCapitales/1.0 (https://github.com/ssanchezz-07/ocho-capitales; portal cofrade sin animo de lucro)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const res = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {};
const limpia = (t) => t.replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, '$1').replace(/<ref[\s\S]*?(?:<\/ref>|\/>)/g, '').replace(/'''?/g, '').replace(/\s+/g, ' ').trim().replace(/[.\s]+$/, '');
const faltan = P.hermandades.filter((h) => h.ciudad === ciudad && !h.nombre_oficial && h.fuente_url);
for (const h of faltan) {
  try {
    if (/wikipedia\.org\/wiki\//.test(h.fuente_url)) {
      const t = decodeURIComponent(h.fuente_url.split('/wiki/')[1].split('#')[0]);
      const r = await fetch('https://es.wikipedia.org/w/api.php?action=query&prop=revisions&rvprop=content&rvslots=main&redirects=1&format=json&titles=' + encodeURIComponent(t), { headers: { 'User-Agent': UA } });
      const j = await r.json(); const pg = Object.values(j.query.pages)[0];
      const w = (pg.revisions && pg.revisions[0].slots.main['*']) || '';
      const lm = /nombre (?:completo|oficial)[^'\n]{0,40}'''([^']{15,700}?)'''/i.exec(w) || /nombre (?:completo|oficial)[^\n]{0,40}? es ([^\n]{15,600}?)\.(?:\s|$)/i.exec(w);
      const wm = /\|\s*Web\s*=\s*([^\n|]+)/i.exec(w);
      let web = wm ? wm[1].replace(/\[|\]|\{\{[^}]*\}\}/g, '').trim().split(' ')[0] : '';
      if (web && !/^https?:/.test(web)) web = 'https://' + web;
      res[h.slug] = { ciudad, nombre: h.nombre, fuente: h.fuente_url, propuesta: lm ? limpia(lm[1]) : undefined, web: web || undefined };
    } else {
      const r = await fetch(h.fuente_url, { headers: { 'User-Agent': UA } });
      const html = await r.text();
      const m = /<h1[^>]*>([\s\S]*?)<\/h1>/i.exec(html) || /<title>([\s\S]*?)<\/title>/i.exec(html);
      res[h.slug] = { ciudad, nombre: h.nombre, fuente: h.fuente_url, texto: m ? m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 700) : '' };
    }
  } catch (e) { res[h.slug] = { ciudad, nombre: h.nombre, fuente: h.fuente_url, error: String(e.message || e) }; }
  await sleep(250);
}
fs.writeFileSync(OUT, JSON.stringify(res, null, 1));
console.log(ciudad, faltan.length, 'borradores en', path.relative(process.cwd(), OUT));
