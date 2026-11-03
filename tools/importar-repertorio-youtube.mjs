// Ocho Capitales: repertorio de cada banda a partir de su canal OFICIAL de YouTube (Pablo, 3-nov: «revisar el canal de YouTube
// de todas las bandas posibles y extraer la información de sus marchas, ninguna repetida»).
// Lee la lista de vídeos del canal (solo metadatos públicos, sin clave ni descargas: yt-dlp --flat-playlist -J) y la cruza con
// tools/sources/marchas.json. Solo liga un vídeo a una marcha cuando no hay duda; lo demás queda en una lista para revisar a mano.
// Escribe tools/sources/repertorio-yt-<clave>.json (lo lee unificar-marchas.mjs: «La toca», con el vídeo como fuente) y
// auditoria/youtube-<clave>.json (local: todo lo leído y por qué se descartó cada vídeo).
// Uso: node tools/importar-repertorio-youtube.mjs [clave …]   (sin claves, todas las de tools/sources/canales-bandas.json)
// Necesita yt-dlp (C:\Users\pablo\Herramientas-IA\bin\yt-dlp.exe o YTDLP=<ruta>). Con CACHE=<carpeta> reutiliza las listas ya leídas.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.join(DIR, '..');
const YTDLP = process.env.YTDLP || 'C:\\Users\\pablo\\Herramientas-IA\\bin\\yt-dlp.exe';
const CANALES = JSON.parse(fs.readFileSync(path.join(DIR, 'sources/canales-bandas.json'), 'utf8')).canales;
const U = JSON.parse(fs.readFileSync(path.join(DIR, 'sources/marchas.json'), 'utf8'));
const P = JSON.parse(fs.readFileSync(path.join(RAIZ, 'portal-cofrade/data/portal.json'), 'utf8'));

// NFKC: los títulos con letras «negritas» de Unicode (𝐋𝐋𝐄𝐕𝐀 𝐒𝐔 𝐍𝐎𝐌𝐁𝐑𝐄) pasan a letras normales
const norm = (s) => String(s || '').normalize('NFKC').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
const clave = (t) => norm(t).replace(/^(el|la|los|las)\s+/, '');
const formaciones = (m) => [m.formacion, ...(m.versiones || []).map((v) => v.formacion)].filter(Boolean).map(norm);

// marchas por título (sin artículo inicial)
const porTitulo = new Map();
for (const m of U.marchas) { const k = clave(m.titulo); if (k) (porTitulo.get(k) || porTitulo.set(k, []).get(k)).push(m); }
// nombres que no son de marcha: hermandades y bandas (un vídeo «LA SED CUESTA DEL BACALAO» es la hermandad de la Sed, no la marcha «Sed»)
const NOMBRES = new Set([...P.hermandades.flatMap((h) => [h.nombre, h.nombre.replace(/^(la|el|los|las)\s+/i, '')]), ...P.bandas.map((b) => b.nombre)].map(clave));
// lo que no es una marcha
const NO_MARCHA = /\b(concierto completo|ensayo|podcast|episodio|entrevista|report|reportaje|presentacion del cartel|cartel|mix|popurri|medley|villancico|beatles|queen|trailer|directo completo|recorrido completo|salida procesional completa)\b/;
const OTRA_BANDA = /\bbanda de cornetas y tambores\b|\bbanda de musica\b|\bagrupacion musical\b|\bbct\b|\bam\b|\bbm\b/;

// el trozo del título que hace de nombre de la marcha
function candidatos(titulo) {
  const t = String(titulo).normalize('NFKC').replace(/\[[^\]]*\]/g, ' ').replace(/[🎼🎶📍🟣🎥🎙️!]+/gu, ' ');
  const citas = [...t.matchAll(/[«"“'‘]([^«»"“”'’]{3,80})[»"”'’]/g)].map((x) => ({ s: x[1], citada: true }));
  const trozos = t.split(/\s[|·]\s|\s[-–—]\s|\|/).map((s) => s.replace(/^\s*\d{1,2}\.\s*/, '').replace(/^\s*(estreno|marcha)\s*[:|-]?\s*/i, '').trim()).filter(Boolean);
  return [...citas, ...trozos.map((s, i) => ({ s, citada: false, primero: i === 0 }))];
}

const ahora = new Date().toISOString().slice(0, 10);
const quiero = process.argv.slice(2);
for (const c of CANALES.filter((x) => !quiero.length || quiero.includes(x.clave))) {
  if (!c.oficial_fuente) { console.log(`${c.clave}: sin prueba de que el canal es oficial, se salta`); continue; }
  const cache = process.env.CACHE && path.join(process.env.CACHE, c.canal + '.json');
  const raw = cache && fs.existsSync(cache) ? fs.readFileSync(cache, 'utf8')
    : execFileSync(YTDLP, ['--flat-playlist', '-J', '--no-warnings', `https://www.youtube.com/channel/${c.canal}/videos`], { maxBuffer: 1 << 30, encoding: 'utf8' });
  if (cache && !fs.existsSync(cache)) fs.writeFileSync(cache, raw);
  const videos = (JSON.parse(raw).entries || []).filter((e) => e && e.id && e.title);
  const forms = c.formaciones.map(norm);
  const ligadas = new Map(), revisar = [], fuera = [];
  for (const v of videos) {
    const nt = norm(v.title);
    if (NO_MARCHA.test(nt)) { fuera.push([v.id, v.title, 'no es una marcha']); continue; }
    // vídeos de otra banda subidos al canal: si el título nombra una banda y no es esta, fuera
    if (OTRA_BANDA.test(nt) && !c.nombres.some((n) => nt.includes(norm(n)))) { fuera.push([v.id, v.title, 'nombra otra banda']); continue; }
    let hecho = false, dudas = [];
    for (const k of candidatos(v.title)) {
      const kk = clave(k.s); if (kk.length < 3) continue;
      const ms = porTitulo.get(kk); if (!ms) continue;
      if (NOMBRES.has(kk) && !k.citada) { dudas.push(`«${k.s}» es también el nombre de una hermandad o banda`); continue; }
      if (!k.citada && !k.primero && !c.titulo_en_cualquier_trozo) { dudas.push(`«${k.s}» no va en el sitio del título`); continue; }
      const deForm = ms.filter((m) => formaciones(m).some((f) => forms.includes(f)));
      if (deForm.length === 1) { const m = deForm[0]; if (!ligadas.has(m.slug)) ligadas.set(m.slug, { m, v }); hecho = true; break; }
      dudas.push(deForm.length ? `«${k.s}»: ${deForm.length} marchas con ese título para ${c.formaciones.join('/')}` : `«${k.s}»: en la base solo para otra formación`);
    }
    if (!hecho) (dudas.length ? revisar : fuera).push([v.id, v.title, dudas.join(' · ') || 'ningún trozo del título es una marcha de la base']);
  }
  const marchas = [...ligadas.values()].sort((a, b) => a.m.titulo.localeCompare(b.m.titulo, 'es')).map(({ m, v }) => ({
    titulo: m.titulo, autor: m.autor, ...(norm(m.formacion) && forms.includes(norm(m.formacion)) ? { formacion: m.formacion } : {}),
    video: v.id, url: `https://www.youtube.com/watch?v=${v.id}`, titulo_video: v.title,
  }));
  fs.writeFileSync(path.join(DIR, 'sources', `repertorio-yt-${c.clave}.json`), JSON.stringify({
    banda: c.banda, nombre_banda: c.nombre_banda, clave: 'yt' + c.clave, fuente: `${c.nombre_corto}, canal oficial de YouTube de la banda`,
    url: `https://www.youtube.com/channel/${c.canal}`, revisado: ahora,
    nota: `Marchas que la banda toca según los vídeos de su canal oficial (${c.oficial_fuente}). Cada marcha cita un vídeo suyo. Solo se ligan las que no dejan duda (el título del vídeo nombra una sola marcha de la base para su formación); el resto queda para revisar a mano. tools/importar-repertorio-youtube.mjs`,
    marchas,
  }, null, 1) + '\n');
  fs.mkdirSync(path.join(RAIZ, 'auditoria'), { recursive: true });
  fs.writeFileSync(path.join(RAIZ, 'auditoria', `youtube-${c.clave}.json`), JSON.stringify({ canal: c.canal, videos: videos.length, ligadas: marchas.length, revisar, fuera }, null, 1));
  console.log(`${c.clave}: ${videos.length} vídeos · ${marchas.length} marchas ligadas · ${revisar.length} para revisar · ${fuera.length} fuera`);
}
