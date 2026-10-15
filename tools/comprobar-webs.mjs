// Ocho Capitales: de los enlaces externos de cada ficha (tools/sources/fichas/indice.json) elige la web oficial
// de la hermandad y comprueba que responde. Descarta prensa, agregadores, catálogos y el propio consejo.
// Deja el resultado en tools/sources/fichas/webs.json para revisarlo antes de pasarlo a complementos.json.
// Uso: node tools/comprobar-webs.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const IDX = JSON.parse(fs.readFileSync(path.join(DIR, 'sources', 'fichas', 'indice.json'), 'utf8'));
const UA = 'Mozilla/5.0 (OchoCapitales/1.0; portal cofrade sin animo de lucro)';
const NO = /abc\.es|abcdesevilla|elcorreoweb|diariode|artesacro|hemeroteca|pasionensevilla|rafaes|lahornacina|viaf\.org|loc\.gov|dialnet|hermandades-de-sevilla\.org|semanasantasevilla|sevillasemanasanta|nazarenodesevilla|wiktionary|elpais|europapress|cadenaser|odisur|elconfidencial|lagubiayeltas|sevillaguia|iaph\.es|us\.es|uanl\.mx|doi\.org|sanisidoro\.net|xyzdiario|lahoranica|arrakis|juanantonioblanco|gmpg\.org|anapi\.com|apiweb\.es|eticonsa|lamadrugagaditana|diocesisdehuelva|grupomelampo|correonistas|telegram|semanasantadesevilla\.tv|datos\.bne|elespanol|cordopolis|wordpress\.com\/20|virgendelosreyes|especiales\.|tienda\.|geopasos|externaliza|cookiedatabase/;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const fix = (u) => u.replace(/^https?:\/\/(https?:\/\/)/, '$1').replace(/[»"']+$/, '');
const out = {};
for (const [slug, x] of Object.entries(IDX)) {
  if (!x.faltan.includes('web')) continue;
  const cands = [...new Set(x.webs.map(fix))].filter((u) => !NO.test(u));
  let ok = null;
  for (const u of cands.slice(0, 3)) {
    const raiz = new URL(u).origin + '/';
    for (const intento of [raiz, u]) {
      try {
        const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 12000);
        const r = await fetch(intento, { headers: { 'User-Agent': UA }, redirect: 'follow', signal: ctl.signal });
        clearTimeout(t);
        const html = r.ok ? (await r.text()).slice(0, 4000) : '';
        // Dominio aparcado o en venta: no vale
        if (r.ok && !/(domain|dominio).{0,40}(sale|venta|parked|aparcado)|this domain|hugedomains|sedo\.com/i.test(html)) { ok = { url: new URL(r.url).origin + '/', probada: intento, estado: r.status }; break; }
      } catch (e) { /* siguiente */ }
      await sleep(300);
    }
    if (ok) break;
  }
  out[slug] = ok ? { ...ok, fuente: x.fuente } : { url: '', candidatas: cands.slice(0, 3), fuente: x.fuente };
  console.log(slug, ok ? ok.url : '— ' + cands.slice(0, 2).join(' '));
}
fs.writeFileSync(path.join(DIR, 'sources', 'fichas', 'webs.json'), JSON.stringify(out, null, 1));
console.log('Con web:', Object.values(out).filter((x) => x.url).length, 'de', Object.keys(out).length);
