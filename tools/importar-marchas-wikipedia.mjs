// Ocho Capitales: marchas dedicadas a cada hermandad según la sección «Marchas dedicadas / procesionales» de su artículo en Wikipedia (es).
// Lee los artículos de las hermandades que tienen enlace a Wikipedia en portal.json y guarda tools/sources/marchas-hermandades-wikipedia.json
// con {slug: {fuente_url, marchas:[{titulo, autor, anio}]}}. Se puede relanzar: respeta los límites de la API (pausas y reintentos).
// Uso: node tools/importar-marchas-wikipedia.mjs [ciudad ...]   (por defecto malaga sevilla)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(DIR, 'sources', 'marchas-hermandades-wikipedia.json');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const limpia = (s) => s.replace(/<ref[\s\S]*?<\/ref>|<ref[^>]*\/>/g, '').replace(/\{\{[^{}]*\}\}/g, '').replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, '$1').replace(/'{2,}/g, '').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

export function parseMarchas(wikitext) {
  const i = wikitext.search(/^==+\s*[^=\n]*marchas?[^=\n]*==+\s*$/im); if (i < 0) return [];
  const resto = wikitext.slice(i).split('\n').slice(1); const res = [];
  for (const l of resto) {
    if (/^==+[^=]/.test(l)) break;
    if (!/^\*/.test(l)) continue;
    // abreviaturas con punto («Stmo.», «Ntra.») y numeraciones («1.») no son separadores de campos
    const t = limpia(l.replace(/^\*+\s*/, '')).replace(/^\d+\.\s*/, '').replace(/\b(Stmo|Stma|Ntra|Ntro|Sra|Sr|Sta|Sto|Mª|D|Dña)\./g, '$1§').replace(/\s+\.(?=[A-ZÁÉÍÓÚ])/g, '. '); if (t.length < 4) continue;
    const y = [...t.matchAll(/\b(1[89]\d\d|20[0-3]\d)\b/g)].map((m) => m[1]); const anio = y.length ? y[y.length - 1] : '';
    let m, titulo = '', autor = '';
    if ((m = t.match(/^(.+?)\s*\(([^()]+?),\s*(?:\d{4}|s\.\s*\w+)\)/))) { titulo = m[1]; autor = m[2]; }              // Título (Autor, 1968)
    else if ((m = t.match(/^(.+),\s+de\s+(.+?)\s*\((?:\d{4})\)/))) { titulo = m[1]; autor = m[2]; }                    // Título, de Autor (1968)
    else if ((m = t.match(/^(.+?)\.\s+(.+?)[.,]?\s*(?:\d{4})\.?$/))) { titulo = m[1]; autor = m[2]; }                 // Título. Autor. 1958
    else if ((m = t.match(/^(.+?)\s+[-–]\s+(.+?)(?:\s*\(?\d{4}\)?)?$/))) { titulo = m[1]; autor = m[2]; }              // Título - Autor (1958)
    else continue;
    titulo = titulo.replace(/§/g, '.'); autor = autor.replace(/§/g, '.');
    titulo = titulo.replace(/^["“«]|["”»]$/g, '').replace(/[.,\s]+$/, '').trim(); autor = autor.replace(/[.,\s]+$/, '').trim();
    if (!titulo || titulo.length > 90 || autor.length > 80 || !autor) continue;
    res.push({ titulo, autor, anio });
  }
  return res;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const D = JSON.parse(fs.readFileSync(path.join(DIR, '..', 'portal-cofrade', 'data', 'portal.json'), 'utf8'));
  const ciudades = process.argv.slice(2).length ? process.argv.slice(2) : ['malaga', 'sevilla'];
  let out = {}; try { out = JSON.parse(fs.readFileSync(OUT, 'utf8')); } catch (e) { out = {}; }
  const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
  const STOP = new Set(['hermandad', 'cofradia', 'real', 'ilustre', 'nuestra', 'nuestro', 'senora', 'senor', 'padre', 'jesus', 'cristo', 'santisimo', 'santisima', 'maria', 'de', 'del', 'la', 'el', 'los', 'las', 'y', 'en', 'sus', 'penitencia', 'nazarenos', 'archicofradia']);
  const CIUDAD = { malaga: 'Málaga', sevilla: 'Sevilla', granada: 'Granada', cordoba: 'Córdoba', cadiz: 'Cádiz', huelva: 'Huelva', almeria: 'Almería', jaen: 'Jaén' };
  // hermandades sin enlace a Wikipedia: se busca su artículo y solo se acepta si el título nombra la ciudad y comparte palabras clave con la hermandad
  async function descubre(h) {
    const toks = [...new Set(norm(h.nombre + ' ' + (h.nombre_oficial || '')).split(' ').filter((w) => w.length > 3 && !STOP.has(w)))];
    const q = `${h.nombre} ${CIUDAD[h.ciudad]} hermandad cofradía`;
    for (let i = 0; i < 3; i++) {
      await sleep(1500 + i * 3000);
      const txt = await (await fetch(`https://es.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&srlimit=5&format=json&maxlag=5`, { headers: { 'User-Agent': 'OchoCapitales/1.0 (https://github.com/ssanchezz-07/ocho-capitales)' } })).text();
      if (!txt.startsWith('{')) continue;
      for (const r of JSON.parse(txt).query.search) {
        const t = norm(r.title); if (!t.includes(norm(CIUDAD[h.ciudad]))) continue;
        const hit = toks.filter((w) => t.includes(w)).length; if (hit >= 1 && !/semana santa en|anexo/.test(t)) return 'https://es.wikipedia.org/wiki/' + encodeURIComponent(r.title.replace(/ /g, '_'));
      }
      return '';
    }
    return '';
  }
  const hs = D.hermandades.filter((h) => ciudades.includes(h.ciudad));
  for (let h of hs) {
    if (out[h.slug] && out[h.slug].leida) continue;
    if (!/wikipedia\.org\/wiki\//.test(h.fuente_url || '')) {
      const url = out[h.slug] && out[h.slug].fuente_url ? out[h.slug].fuente_url : await descubre(h);
      if (!url) { out[h.slug] = { leida: true, fuente_url: '', marchas: [] }; fs.writeFileSync(OUT, JSON.stringify(out, null, 1)); continue; }
      h = { ...h, fuente_url: url };
    }
    const t = decodeURIComponent(h.fuente_url.split('/wiki/')[1].split('#')[0]);
    let w = '';
    for (let i = 0; i < 4 && !w; i++) {
      await sleep(1500 + i * 4000);
      const txt = await (await fetch(`https://es.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(t)}&prop=wikitext&format=json&redirects=1&maxlag=5`, { headers: { 'User-Agent': 'OchoCapitales/1.0 (https://github.com/ssanchezz-07/ocho-capitales)' } })).text();
      if (txt.startsWith('{')) { const j = JSON.parse(txt); w = (j.parse && j.parse.wikitext && j.parse.wikitext['*']) || ' '; }
    }
    out[h.slug] = { leida: true, fuente_url: h.fuente_url, marchas: parseMarchas(w) };
    fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
  }
  const con = Object.entries(out).filter(([, v]) => v.marchas.length);
  console.log(`${Object.keys(out).length} artículos leídos; ${con.length} con marchas; ${con.reduce((a, [, v]) => a + v.marchas.length, 0)} marchas`);
}
