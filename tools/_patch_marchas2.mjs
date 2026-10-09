import fs from 'node:fs';
const f = new URL('../site/build.mjs', import.meta.url);
let s = fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
const rep = (a, b) => { if (!s.includes(a)) throw new Error('No encontrado: ' + a.slice(0, 70)); s = s.replace(a, () => b); };

// 1) catálogo de España (listas de «Marchas de Procesión»): se une a las marchas de hermandad si coinciden y, si no, entra con ficha propia
rep("const MARCHAS = []; const MARCHA_SLUG = new Map();", "const MARCHAS = []; const MARCHA_SLUG = new Map();\nconst ESP_FILE = path.join(DIR, '..', 'tools', 'sources', 'marchas-espana.json');\nconst ESP = fs.existsSync(ESP_FILE) ? JSON.parse(fs.readFileSync(ESP_FILE, 'utf8')) : { marchas: [] };");
rep("  MARCHAS.push({ ...m, slug, h }); MARCHA_SLUG.set(h.slug + '|' + m.titulo + '|' + (m.autor || ''), slug);\n}",
`  MARCHAS.push({ ...m, slug, h }); MARCHA_SLUG.set(h.slug + '|' + m.titulo + '|' + (m.autor || ''), slug);
}
{
  const nt = (t) => norm(t).replace(/[^a-z0-9 ]/g, ' ').replace(/\\s+/g, ' ').trim();
  const ta = (t) => new Set(nt(t).split(' ').filter((w) => w.length >= 4));
  const coincide = (a, b) => { const x = ta(a), y = ta(b); for (const w of x) if (y.has(w)) return true; return false; };
  for (const e of ESP.marchas) {
    const hit = MARCHAS.find((m) => !m.video && nt(m.titulo) === nt(e.titulo) && coincide(m.autor, e.autor));
    if (hit) { hit.video = e.video; hit.dedicatoria = hit.dedicatoria || e.dedicatoria; hit.tipo = hit.tipo || e.formacion; hit.estreno = e.estreno; hit.detalles = e.detalles; hit.anio = hit.anio || e.anio; continue; }
    let slug = slugify(e.titulo + ' ' + (e.autor || '')); if (!slug) continue;
    let n = 2; const base = slug; while (MARCHAS.some((x) => x.slug === slug)) slug = base + '-' + n++;
    MARCHAS.push({ titulo: e.titulo, autor: e.autor, anio: e.anio, tipo: e.formacion, video: e.video, dedicatoria: e.dedicatoria, estreno: e.estreno, detalles: e.detalles, lugar: e.lugar, tipoMarcha: e.tipo, slug, h: null, espana: true });
  }
}`);

// 2) ficha de marcha: con o sin hermandad, con enlace directo al vídeo
rep("  const h = m.h; const c = CAP[h.ciudad];\n  const q = encodeURIComponent(m.titulo + ' ' + (m.autor || '') + ' marcha procesional');\n  const enlaces = [['Escuchar en YouTube', `https://www.youtube.com/results?search_query=${q}`], ['Buscar en Spotify', `https://open.spotify.com/search/${q}`]];\n  const otras = MARCHAS.filter((x) => x.slug !== m.slug && ((m.autor && x.autor === m.autor) || x.h.slug === h.slug)).slice(0, 14);",
`  const h = m.h; const c = h ? CAP[h.ciudad] : null;
  const q = encodeURIComponent(m.titulo + ' ' + (m.autor || '') + ' marcha procesional');
  const enlaces = [m.video ? ['Escuchar en YouTube', 'https://www.youtube.com/watch?v=' + m.video] : ['Buscar en YouTube', \`https://www.youtube.com/results?search_query=\${q}\`], ['Buscar en Spotify', \`https://open.spotify.com/search/\${q}\`]];
  const otras = MARCHAS.filter((x) => x.slug !== m.slug && ((m.autor && x.autor === m.autor) || (h && x.h && x.h.slug === h.slug))).slice(0, 14);`);
rep("dedicada a ${h.nombre} (${c.nombre}).${m.tipo", "${h ? 'dedicada a ' + h.nombre + ' (' + c.nombre + ').' : (m.dedicatoria ? 'dedicada a ' + m.dedicatoria + '.' : '')}${m.tipo");
rep("['Dedicada a', `<a href=\"${u('hermandad/' + h.slug + '/')}\">${esc(h.nombre)}</a>`], ['Capital', `<a href=\"${u('semana-santa/' + h.ciudad + '/')}\">${esc(c.nombre)}</a>`]])", "['Dedicada a', h ? `<a href=\"${u('hermandad/' + h.slug + '/')}\">${esc(h.nombre)}</a>` : esc(m.dedicatoria)], ['Capital', h ? `<a href=\"${u('semana-santa/' + h.ciudad + '/')}\">${esc(c.nombre)}</a>` : ''], ['Tipo de marcha', esc(m.tipoMarcha)], ['Banda que la estrenó', esc(m.estreno)], ['Lugar', esc(m.lugar)]])");
rep("Son búsquedas en cada plataforma: la grabación concreta depende de la banda que la interprete.", "${m.video ? 'El enlace lleva a la grabación de «Marchas de Procesión» en YouTube; Spotify es una búsqueda.' : 'Son búsquedas en cada plataforma: la grabación concreta depende de la banda que la interprete.'}");
rep("<p class=\"oc-note\">Datos de composición tomados de la ficha de la hermandad (${esc(h.fuente_url ? 'fuente enlazada en su página' : 'fuentes del portal')}).</p>`;", "<p class=\"oc-note\">${m.espana ? 'Catálogo de marchas de España elaborado a partir de la base de datos de <a href=\"https://www.marchasdeprocesion.com/p/marchas-de-espana.html\" target=\"_blank\" rel=\"noopener nofollow\">Marchas de Procesión</a>; solo se muestran los datos que su ficha tiene rellenos.' : 'Datos de composición tomados de la ficha de la hermandad (' + esc(h.fuente_url ? 'fuente enlazada en su página' : 'fuentes del portal') + ').'}</p>`;");

// 3) directorio
rep("[m.autor, m.anio, m.tipo].filter(Boolean).join(' · ') + ' — ' + m.h.nombre, [m.h.ciudad], ` data-q=\"${esc(norm([m.titulo, m.autor, m.h.nombre, m.tipo].join(' ')))}\" data-ciudad=\"${m.h.ciudad}\"",
    "[m.autor, m.anio, m.tipo].filter(Boolean).join(' · ') + (m.h ? ' — ' + m.h.nombre : m.dedicatoria ? ' — ' + m.dedicatoria : ''), m.h ? [m.h.ciudad] : [], ` data-q=\"${esc(norm([m.titulo, m.autor, m.h ? m.h.nombre : m.dedicatoria, m.tipo].join(' ')))}\" data-ciudad=\"${m.h ? m.h.ciudad : ''}\"");
rep("${MARCHAS.length} marchas dedicadas a hermandades, con compositor, año, formación y enlace para escucharlas. Se irán ampliando con las demás capitales.", "${MARCHAS.length} marchas procesionales: las dedicadas a hermandades y las más escuchadas de España, con compositor, año, formación, a quién van dedicadas cuando se sabe y enlace para escucharlas.");

// 4) buscador: también las marchas de España sin hermandad
rep("searchIndex(); extras();", "searchIndex(); extras();");
fs.writeFileSync(f, s);
console.log('ok');
