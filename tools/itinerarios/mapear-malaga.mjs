// Asigna cada entrada del PDF oficial (cabecera) a su hermandad del portal por solapamiento de palabras distintivas.
import fs from 'node:fs';
const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z ]/g, ' ');
const STOP = new Set('real muy ilustre venerable antigua hermandad cofradia fervorosa pontificia nuestro nuestra padre senor santisimo santisima santo cristo maria de del la el los las y en su a con por que parroquia iglesia capilla barrio centro nazarenos nazareno culto procesion sacramental archicofradia stmo stma jesus virgen sagrada cena orden'.split(' '));
const A = JSON.parse(fs.readFileSync('site/dist/search-index.json', 'utf8')).filter((x) => x.t === 'h' && x.c === 'malaga');
const P = JSON.parse(fs.readFileSync('tools/itinerarios/cache/malaga-itinerarios-texto.json', 'utf8'));
const H = Object.keys(JSON.parse(fs.readFileSync('site/data/recorridos/malaga.json', 'utf8')).hermandades);
const w = (s) => new Set(norm(s).split(/\s+/).filter((x) => x.length > 3 && !STOP.has(x)));
const res = {};
P.forEach((e, i) => {
  const hw = w(e.cabecera.replace(/\d\d:\d\dh/g, ''));
  const sc = H.map((id) => { const a = A.find((x) => x.u.endsWith('/' + id + '/')); if (!a) return [id, 0]; const kw = w(a.k); let n = 0; for (const t of hw) if (kw.has(t)) n++; return [id, n]; }).sort((x, y) => y[1] - x[1]);
  res[i] = sc.slice(0, 2);
});
for (const [i, s] of Object.entries(res)) console.log(i, s.map((x) => x.join(':')).join(' '));
