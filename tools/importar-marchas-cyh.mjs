// Ocho Capitales: lee el buscador de marchas de cofradiasyhermandades.es (https://www.cofradiasyhermandades.es/marchas.php)
// SOLO para las 8 capitales (filtro por localidad) y SOLO para cruzar y completar nuestras marchas: formación, capital,
// compositor, año y la ficha de cada marcha. Su robots.txt permite el rastreo; no publican condiciones de uso. Por el derecho
// sui generis de las bases de datos no se vuelca su base: el listado se guarda en local (auditoria/, ignorado por git) y en el
// portal solo entra lo que casa con nuestras marchas o con una hermandad del portal, citando su ficha.
// Ritmo lento (PAUSA ms entre peticiones, 3 s por defecto). Reanudable: no repite capitales ya leídas enteras.
// Uso: node tools/importar-marchas-cyh.mjs [--fichas]   (--fichas: abre la ficha de las marchas que casan, para la dedicatoria)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(RAIZ, 'auditoria', 'cyh-marchas.json');
const B = 'https://www.cofradiasyhermandades.es/';
const UA = 'OchoCapitales/1.0 (+https://ssanchezz-07.github.io/ocho-capitales/)';
const PAUSA = +(process.env.PAUSA || 3000);
const PROVINCIAS = { almeria: [5, 'Almería'], cadiz: [12, 'Cádiz'], cordoba: [17, 'Córdoba'], granada: [20, 'Granada'], huelva: [23, 'Huelva'], jaen: [26, 'Jaén'], malaga: [33, 'Málaga'], sevilla: [43, 'Sevilla'] };
const FORM = { BM: 'Banda de música', AM: 'Agrupación musical', BCT: 'Banda de cornetas y tambores', BDT: 'Dulzainas y tambores', CM: 'Capilla musical' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const dec = (s) => String(s).replace(/&#(\d+);/g, (m, n) => String.fromCodePoint(+n)).replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

// Sesión con cookie: el formulario guarda los filtros en la sesión y redirige tras el POST
let cookie = '';
async function pedir(url, datos) {
  await sleep(PAUSA);
  let r = await fetch(url, { method: datos ? 'POST' : 'GET', headers: { 'User-Agent': UA, Cookie: cookie, ...(datos ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}) }, body: datos ? new URLSearchParams(datos).toString() : undefined, redirect: 'manual' });
  for (const c of r.headers.getSetCookie ? r.headers.getSetCookie() : []) { const kv = c.split(';')[0]; const k = kv.split('=')[0]; cookie = [...cookie.split('; ').filter((x) => x && !x.startsWith(k + '=')), kv].join('; '); }
  if (r.status >= 300 && r.status < 400) return pedir(new URL(r.headers.get('location'), url).href);
  if (!r.ok) throw new Error(r.status + ' ' + url);
  return r.text();
}
const filtro = (prov, loc) => ({ aplicar: '1', comunidad: '1', provincia: String(prov), localidad: String(loc), compositor: '0', titulo: '', desde: '', hasta: '', bm: '1', am: '1', bct: '1', bdt: '1', cm: '1', sc: '1' });
const filas = (h) => [...h.matchAll(/<article class="marcha-card">([\s\S]*?)<\/article>/g)].map(([, a]) => ({
  id: (a.match(/fichamarcha\.php\?mm=(\d+)/) || [])[1],
  titulo: dec((a.match(/marcha-ficha-enlace"[^>]*>([\s\S]*?)<\/a>/) || [])[1] || ''),
  autor: dec((a.match(/marcha-autores">([\s\S]*?)<\/p>/) || [])[1] || ''),
  lugar: dec((a.match(/marcha-lugar">([\s\S]*?)<\/p>/) || [])[1] || ''),
  anio: dec((a.match(/marcha-anno">([\s\S]*?)<\/div>/) || [])[1] || ''),
  formacion: [...a.matchAll(/icono-([A-Z]+)\.(?:png|svg)/g)].map((m) => FORM[m[1]]).filter(Boolean),
}));

const prev = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : { capitales: {}, fichas: {} };
const guardar = () => { fs.mkdirSync(path.dirname(OUT), { recursive: true }); fs.writeFileSync(OUT, JSON.stringify({ fuente: B + 'marchas.php', leido: new Date().toISOString().slice(0, 10), ...prev }, null, 1)); };

// --fichas: abre las fichas que el unificador apunta en auditoria/cyh-fichas-pendientes.json y guarda solo dos hechos:
// la imagen a la que está dedicada y el nombre de su hermandad (los dos enlaces de «Marcha dedicada a»)
if (process.argv.includes('--fichas')) {
  const pend = JSON.parse(fs.readFileSync(path.join(RAIZ, 'auditoria', 'cyh-fichas-pendientes.json'), 'utf8')).filter((id) => !(prev.fichas || {})[id]);
  prev.fichas ||= {};
  console.log('fichas por leer', pend.length);
  let n = 0;
  for (const id of pend) {
    try {
      const h = await pedir(B + 'fichamarcha.php?mm=' + id);
      const i = h.indexOf('Marcha dedicada a');
      const tramo = i < 0 ? '' : h.slice(i, i + 3000).split(/<div class="col-md|<h2|audio-block/)[0];
      const imagen = dec((tramo.match(/fichaimagineriaytallas\.php[^"]*">([\s\S]*?)<\/a>/) || [])[1] || '');
      const hermandad = dec((tramo.match(/fichacofradia[^"]*">([\s\S]*?)<\/a>/) || [])[1] || '');
      prev.fichas[id] = { imagen, hermandad, dedicatoria: [imagen, hermandad && `(${hermandad})`].filter(Boolean).join(' ') };
    } catch (e) { console.log('fallo', id, e.message); }
    if (++n % 50 === 0) { guardar(); console.log(n, '/', pend.length); }
  }
  guardar();
  console.log('fichas leídas', Object.keys(prev.fichas).length);
  process.exit(0);
}

await pedir(B + 'marchas.php');
for (const [cap, [prov, nombre]] of Object.entries(PROVINCIAS)) {
  if (prev.capitales[cap] && prev.capitales[cap].completa) continue;
  const h = await pedir(B + 'marchas.php', filtro(prov, 0));
  const sel = (h.match(/<select[^>]*id="localidad"[\s\S]*?<\/select>/) || [''])[0];
  const loc = (sel.match(new RegExp(`<option value="(\\d+)"[^>]*>\\s*${nombre}\\s*<`)) || [])[1];
  if (!loc) { console.log(cap, 'sin código de localidad'); continue; }
  let pag = await pedir(B + 'marchas.php', filtro(prov, loc));
  const total = +((dec(pag).match(/([\d.]+) marchas encontradas/) || [])[1] || '0').replace(/\./g, '');
  const out = filas(pag);
  const paginas = Math.ceil(total / 30);
  console.log(cap, 'localidad', loc, '·', total, 'marchas ·', paginas, 'páginas');
  // La paginación reenvía los filtros (campos ocultos del formulario): sin ellos, la página 2 en adelante sale sin filtrar
  for (let p = 2; p <= paginas; p++) { pag = await pedir(B + 'marchas.php', { ...filtro(prov, loc), pagina: String(p) }); const f = filas(pag); if (!f.length) break; out.push(...f); if (p % 10 === 0) console.log(' ', cap, p, '/', paginas); }
  // sin repetidas, y solo las de esa localidad (comprobación de que el filtro se ha aplicado)
  const vistas = new Set(); const unicas = out.filter((m) => m.id && !vistas.has(m.id) && vistas.add(m.id));
  const fuera = unicas.filter((m) => !m.lugar.split(' · ').includes(nombre)).length; // una marcha puede tener varias localidades («Sevilla · Almería»)
  if (fuera) console.log(' ', cap, fuera, 'marchas de otra localidad: el filtro no se aplicó bien');
  prev.capitales[cap] = { localidad: loc, total, completa: unicas.length >= total - 1 && !fuera, marchas: unicas };
  guardar();
  console.log(cap, 'leídas', out.length);
}
guardar();
console.log('hecho:', Object.entries(prev.capitales).map(([c, v]) => `${c} ${v.marchas.length}/${v.total}`).join(' · '));
