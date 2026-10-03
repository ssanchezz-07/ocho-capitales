// Ocho Capitales: busca datos que faltan en portal.json en fuentes abiertas y verificables (Wikidata / Wikipedia)
// y los guarda en tools/sources/complementos.json con la fuente de cada dato. build-data.js solo los usa para
// rellenar campos vacíos; nunca sustituye datos oficiales.
// Uso: node tools/buscar-complementos.mjs [imagineros|sevilla|todo]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const D = JSON.parse(fs.readFileSync(path.join(DIR, '..', 'portal-cofrade', 'data', 'portal.json'), 'utf8'));
const OUT = path.join(DIR, 'sources', 'complementos.json');
const UA = 'OchoCapitales/1.0 (https://github.com/ssanchezz-07/ocho-capitales; portal cofrade sin animo de lucro)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const what = process.argv[2] || 'todo';
const C = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {};
C.imagineros = C.imagineros || {}; C.hermandades = C.hermandades || {};
const save = () => fs.writeFileSync(OUT, JSON.stringify(C, null, 1));

async function getJSON(url, tries = 4) {
  for (let i = 0; i < tries; i++) {
    const r = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } });
    if (r.status === 429 || r.status >= 500) { await sleep(5000 * (i + 1)); continue; }
    const j = await r.json(); await sleep(350);
    if (j.error && j.error.code === 'maxlag') { await sleep(5000); continue; }
    return j;
  }
  throw new Error('sin respuesta ' + url);
}
const wd = (params) => getJSON('https://www.wikidata.org/w/api.php?' + new URLSearchParams({ format: 'json', maxlag: '5', ...params }));
const claim = (e, p) => (e.claims && e.claims[p] || []).filter((c) => c.rank !== 'deprecated').map((c) => c.mainsnak.datavalue && c.mainsnak.datavalue.value).filter(Boolean);
const year = (t) => (t && t.time ? (t.time.match(/^[+-](\d{4})/) || [])[1] : '');
async function labels(ids) {
  if (!ids.length) return {};
  const j = await wd({ action: 'wbgetentities', ids: ids.join('|'), props: 'labels', languages: 'es|en' });
  return Object.fromEntries(Object.entries(j.entities || {}).map(([k, v]) => [k, (v.labels.es || v.labels.en || {}).value || '']));
}
const SCULPTOR = new Set(['Q1281618', 'Q2309784', 'Q3391743', 'Q5960245', 'Q1028181', 'Q10862983', 'Q12101409']); // escultor, imaginero, artista, tallista…

// ---------- imagineros ----------
async function imagineros() {
  for (const im of D.imagineros.filter((i) => !i.bio && !(i.nombre in C.imagineros))) {
    let found = null;
    try {
      const s = await wd({ action: 'wbsearchentities', search: im.nombre, language: 'es', uselang: 'es', type: 'item', limit: '7' });
      const ids = (s.search || []).map((x) => x.id);
      if (ids.length) {
        const g = await wd({ action: 'wbgetentities', ids: ids.join('|'), props: 'claims|descriptions|labels|sitelinks', languages: 'es|en', sitefilter: 'eswiki' });
        for (const id of ids) {
          const e = g.entities[id]; if (!e) continue;
          const label = (e.labels.es || e.labels.en || {}).value || '';
          const desc = ((e.descriptions.es || e.descriptions.en || {}).value || '');
          const occ = claim(e, 'P106').map((v) => v.id);
          const isSculptor = occ.some((o) => SCULPTOR.has(o)) || /escultor|imaginer|sculptor/i.test(desc);
          // el nombre debe coincidir (todas las palabras del nombre del portal en la etiqueta)
          const words = norm(im.nombre).split(/\s+/).filter((w) => w.length > 2);
          if (!isSculptor || !words.every((w) => norm(label).includes(w))) continue;
          const born = year(claim(e, 'P569')[0]); const died = year(claim(e, 'P570')[0]);
          const placeId = (claim(e, 'P19')[0] || {}).id;
          const place = placeId ? (await labels([placeId]))[placeId] : '';
          const wiki = e.sitelinks && e.sitelinks.eswiki ? 'https://es.wikipedia.org/wiki/' + encodeURIComponent(e.sitelinks.eswiki.title.replace(/ /g, '_')) : '';
          found = { wikidata: 'https://www.wikidata.org/wiki/' + id, etiqueta: label, descripcion: desc, nacimiento: born, muerte: died, lugar: place, wikipedia: wiki };
          break;
        }
      }
    } catch (e) { console.log('error', im.nombre, e.message); continue; }
    C.imagineros[im.nombre] = found;
    console.log(im.nombre, '→', found ? `${found.etiqueta} (${found.nacimiento}-${found.muerte}) ${found.lugar}` : 'sin coincidencia fiable');
    save();
  }
}

// ---------- Sevilla: web oficial, nombre oficial y fundación desde el elemento Wikidata del artículo fuente ----------
async function sevilla() {
  for (const h of D.hermandades.filter((x) => /wikipedia\.org/.test(x.fuente_url || '') && !(x.slug in C.hermandades))) {
    const title = decodeURIComponent(h.fuente_url.split('/wiki/')[1] || '').replace(/_/g, ' ').split('#')[0];
    let out = null;
    try {
      const p = await getJSON('https://es.wikipedia.org/w/api.php?' + new URLSearchParams({ action: 'query', format: 'json', prop: 'pageprops', ppprop: 'wikibase_item', redirects: '1', titles: title }));
      const page = Object.values(p.query.pages)[0];
      const qid = page.pageprops && page.pageprops.wikibase_item;
      if (qid) {
        const g = await wd({ action: 'wbgetentities', ids: qid, props: 'claims|labels', languages: 'es' });
        const e = g.entities[qid];
        const web = claim(e, 'P856')[0] || '';
        const oficial = (claim(e, 'P1448').find((v) => v.language === 'es') || {}).text || '';
        const fund = year(claim(e, 'P571')[0]);
        out = { wikidata: 'https://www.wikidata.org/wiki/' + qid, web, nombre_oficial: oficial, fundacion: fund };
      }
    } catch (e) { console.log('error', h.slug, e.message); continue; }
    C.hermandades[h.slug] = Object.assign(C.hermandades[h.slug] || {}, out ? { sevilla_wd: out } : { sevilla_wd: null });
    console.log(h.slug, '→', out ? [out.web, out.nombre_oficial, out.fundacion].filter(Boolean).join(' | ') || '(sin datos útiles)' : 'sin Wikidata');
    save();
  }
}

// ---------- resto de capitales: web propia enlazada desde la ficha oficial (agrupación o consejo) ----------
const SOCIAL = /facebook|instagram|twitter|x\.com|youtube|tiktok|whatsapp|flickr|linkedin|google|wordpress\.org|w\.org|gravatar|wikipedia|addtoany|share|mailto:|tel:/i;
const STOPN = new Set(['la', 'el', 'los', 'las', 'de', 'del', 'y', 'hermandad', 'cofradia', 'nuestra', 'nuestro', 'senora', 'senor', 'padre', 'santisimo', 'santisima', 'maria', 'jesus', 'cristo']);
async function oficiales() {
  for (const h of D.hermandades.filter((x) => x.fuente_url && !/wikipedia\.org/.test(x.fuente_url) && !x.web && !(C.hermandades[x.slug] && 'web_oficial' in C.hermandades[x.slug]))) {
    let web = '';
    try {
      const r = await fetch(h.fuente_url, { headers: { 'User-Agent': UA }, redirect: 'follow' });
      const html = await r.text(); await sleep(800);
      const host = new URL(h.fuente_url).hostname.replace(/^www\./, '');
      const tokens = norm(h.nombre + ' ' + (h.nombre_oficial || '')).replace(/[^a-z ]/g, ' ').split(/\s+/).filter((t) => t.length > 3 && !STOPN.has(t));
      const links = [...html.matchAll(/<a[^>]+href="(https?:\/\/[^"#]+)"[^>]*>([\s\S]*?)<\/a>/gi)].map((m) => [m[1], m[2].replace(/<[^>]+>/g, ' ').trim()]);
      for (const [href, text] of links) {
        let d; try { d = new URL(href).hostname.replace(/^www\./, ''); } catch (e) { continue; }
        if (d === host || d.endsWith('.' + host) || SOCIAL.test(href)) continue;
        const dn = norm(d);
        const looks = /hermandad|cofradia|cofrade|hdad/.test(dn) || tokens.some((t) => dn.includes(t)) || /p[aá]gina web|web oficial|sitio web/i.test(text);
        if (looks) { web = href.replace(/\/$/, ''); break; }
      }
    } catch (e) { console.log('error', h.slug, e.message); continue; }
    C.hermandades[h.slug] = Object.assign(C.hermandades[h.slug] || {}, { web_oficial: web ? { url: web, fuente: h.fuente_url } : null });
    console.log(h.slug, '→', web || '(la ficha oficial no enlaza web)');
    save();
  }
}

if (what === 'oficiales' || what === 'todo') await oficiales();
if (what === 'imagineros' || what === 'todo') await imagineros();
if (what === 'sevilla' || what === 'todo') await sevilla();
save();
console.log('Listo.');
