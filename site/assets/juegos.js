/* Ocho Capitales · Juegos de erCuñao «mientras esperas».
   Todas las preguntas salen de data/juegos.json, que se genera en cada publicación con los mismos datos de la web
   (fichas con fuente): no hay ninguna pregunta escrita a mano. El motor (crearJuegos) es puro y con semilla, para que
   el reto diario y «Reta a un amigo» den las mismas preguntas en cualquier móvil, sin cuentas ni servidor.
   En Node se expone con module.exports para la batería (scripts/probar-juegos.mjs). */
(function () {
  'use strict';

  // ================= azar con semilla =================
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const hash = (s) => { let h = 2166136261; for (const ch of String(s)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const sinArt = (s) => norm(s).replace(/\(.*$/, '').replace(/^(el|la|los|las) /, '').trim();
  const cap1 = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const minutos = (t) => { const m = /^(\d{1,2}):(\d{2})/.exec(t || ''); if (!m) return null; const v = +m[1] * 60 + +m[2]; return v < 360 ? v + 1440 : v; };
  const DIAS = ['Viernes de Dolores', 'Vísperas', 'Sábado de Pasión', 'Domingo de Ramos', 'Lunes Santo', 'Martes Santo', 'Miércoles Santo', 'Jueves Santo', 'Jueves Santo y Madrugada', 'Madrugá', 'Viernes Santo', 'Sábado Santo', 'Domingo de Resurrección'];
  const artDia = (d) => (d === 'Madrugá' ? 'la Madrugá' : d === 'Vísperas' ? 'en las Vísperas' : 'el ' + d);

  function crearJuegos(J, op) {
    op = op || {};
    const BASE = op.base || '/';
    const CAP = new Map(J.caps.map((c) => [c[0], { s: c[0], n: c[1], color: c[2] }]));
    const I = J.I || [];
    const H = J.h.map((r) => ({ s: r[0], n: r[1], c: r[2], d: r[3], hora: r[4], se: r[5], f: r[6], t: r[7] || [], b: r[8] || [], fo: r[9], nz: r[10], ru: r[11], o: r[12], x: r[13] }));
    const POR = new Map(H.map((h) => [h.s, h]));
    // nombres que se repiten entre capitales («Cautivo», «Esperanza»): en esas preguntas va siempre la capital
    const veces = new Map(); H.forEach((h) => { const k = sinArt(h.n); veces.set(k, (veces.get(k) || 0) + 1); });
    const unico = (h) => veces.get(sinArt(h.n)) === 1;
    // el nombre con su artículo y su preposición, como en erCuñao: «del Cautivo», «de la O», «al Cachorro», «de San Bernardo»
    const SIN_ART = /^(san |santa (?!cena)|jesus|maria|nuestr[oa] |padre |montesion|montserrat|bellavista|pino montano|medinaceli|mena\b|lagrimas|ecce mater|pasion y muerte|bendicion y esperanza)/;
    const FEM = new Set('sangre merced paz fe luz cruz salud mar vera'.split(' ')), MASC_A = new Set(['via', 'dia']);
    function articulo(h) {
      const m = /^(El|La|Los|Las) /.exec(h.n); if (m) return [m[1].toLowerCase(), h.n.slice(m[0].length)];
      const k = norm(h.n); if (SIN_ART.test(k) || h.s === 'pasion-sevilla') return ['', h.n];
      const w = k.split(' '), p = /^(dos|tres|cuatro|cinco|siete)$/.test(w[0]) && w[1] ? w[1] : w[0];
      if (/s$/.test(p) && p !== 'jesus') return [/as$/.test(p) && p !== 'servitas' ? 'las' : 'los', h.n];
      return [(/(a|ion|dad|tud|umbre)$/.test(p) || FEM.has(p)) && !MASC_A.has(p) ? 'la' : 'el', h.n];
    }
    function nom(h, prep) { const [a, n] = articulo(h); return prep === 'de' && a === 'el' ? 'del ' + n : prep === 'a' && a === 'el' ? 'al ' + n : (prep ? prep + ' ' : '') + (a ? a + ' ' : '') + n; }
    const Nom = (h) => cap1(nom(h));
    const V = (h, sing, plur) => (/^l[oa]s$/.test(articulo(h)[0]) ? plur : sing);
    const conCap = (h, prep) => nom(h, prep) + ' (' + CAP.get(h.c).n + ')';
    const ficha = (h) => ['Ver la ficha ' + nom(h, 'de'), BASE + 'hermandad/' + h.s + '/'];
    const M = (J.m || []).map((r) => ({ t: r[0], a: r[1], y: r[2], h: POR.get(r[3]) || null, s: r[4] })).filter((m) => m.h && m.a);
    M.forEach((m) => { m.k = norm(m.t); m.ka = norm(m.a); });
    // todos los títulos dedicados a cada hermandad (huella de 5 letras, data/juegos.json «dt»), no solo los de la muestra
    const h5 = (t) => { let x = 2166136261; for (const ch of norm(t)) { x ^= ch.charCodeAt(0); x = Math.imul(x, 16777619); } return ((x >>> 0) % 60466176).toString(36).padStart(5, '0'); };
    const DT = Object.fromEntries(Object.entries(J.dt || {}).map(([s, v]) => [s, new Set(v.match(/.{5}/g) || [])]));
    const dedicadaA = (slug, t) => !!(DT[slug] && DT[slug].has(h5(t)));
    const DEDIC = new Set(M.map((m) => m.k + '|' + m.h.s)), POR_TIT = new Map(); M.forEach((m) => { if (!POR_TIT.has(m.k)) POR_TIT.set(m.k, []); POR_TIT.get(m.k).push(m); });

    // ---- utilidades sobre el azar ----
    const R = (seed) => { const r = rng(seed); return { r, int: (n) => Math.floor(r() * n), pick: (l) => l[Math.floor(r() * l.length)], mezcla: (l) => { l = l.slice(); for (let i = l.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [l[i], l[j]] = [l[j], l[i]]; } return l; } }; };
    // pregunta de opción única: la buena y tres distintas que no lo son
    function opciones(z, buena, malas, n) {
      const vistas = new Set([norm(buena)]), l = [];
      for (const m of z.mezcla(malas)) { const k = norm(m); if (!k || vistas.has(k)) continue; vistas.add(k); l.push(m); if (l.length >= (n || 3)) break; }
      if (l.length < (n || 3)) return null;
      const op = z.mezcla([buena].concat(l));
      return { op, ok: op.indexOf(buena) };
    }
    const deCap = (c) => H.filter((h) => h.c === c);
    // las palabras que distinguen el nombre de una cofradía (sin artículos ni advocaciones comunes)
    const VAC_NOM = new Set('de del la las los el y e en con san santa santo nuestra nuestro senor senora jesus maria cristo virgen santisimo santisima hermandad cofradia cofradias real reales'.split(' '));
    const palabrasNombre = (n) => sinArt(n).split(' ').filter((w) => w.length >= 3 && !VAC_NOM.has(w));
    // jornadas que se solapan: la Madrugá es la noche del jueves al viernes; Córdoba y Cádiz juntan el Jueves Santo y la Madrugada
    const SOLAPA = { 'Jueves Santo y Madrugada': ['Jueves Santo', 'Madrugá', 'Viernes Santo'], 'Madrugá': ['Viernes Santo', 'Jueves Santo', 'Jueves Santo y Madrugada'], 'Viernes Santo': ['Madrugá', 'Jueves Santo y Madrugada'], 'Jueves Santo': ['Madrugá', 'Jueves Santo y Madrugada'], 'Viernes de Dolores': ['Sábado de Pasión', 'Vísperas'], 'Sábado de Pasión': ['Viernes de Dolores', 'Vísperas'], 'Vísperas': ['Viernes de Dolores', 'Sábado de Pasión'] };
    const solapan = (a, b) => a === b || (SOLAPA[a] || []).indexOf(b) >= 0 || (SOLAPA[b] || []).indexOf(a) >= 0;
    // ¿sale este imaginero en la autoría de esas imágenes? (nombre entero, o su nombre y su último apellido: «ángel de León Ortega» cuenta)
    const VAC_N = new Set(['de', 'del', 'la', 'las', 'los', 'el', 'y']);
    const enAutoria = (autoria, nombre) => { const a = ' ' + norm(autoria) + ' ', n = norm(nombre).split(' ').filter((w) => w.length > 2 && !VAC_N.has(w)); if (a.indexOf(' ' + norm(nombre) + ' ') >= 0) return true; if (n.length < 2) return false; return a.indexOf(' ' + n[n.length - 1] + ' ') >= 0 && (a.indexOf(' ' + n[0] + ' ') >= 0 || a.indexOf(' ' + n[n.length - 2] + ' ') >= 0); };
    // dos templos que son el mismo nombrado de otra forma («Iglesia» y «Parroquia de San Antonio de Padua»; «Santa Isabel la Real / Santo Domingo»)
    const VAC_T = new Set('iglesia parroquia parroquial capilla basilica real santa santo san de del la las el los y templo convento monasterio ermita'.split(' '));
    const tkT = (s) => new Set(norm(s).split(' ').filter((w) => w && !VAC_T.has(w)));
    const mismoTemplo = (a, b) => { const x = tkT(a), y = tkT(b); if (!x.size || !y.size) return norm(a) === norm(b); let n = 0; x.forEach((w) => { if (y.has(w)) n++; }); return n === x.size || n === y.size; };
    // dos nombres que son el mismo (o comparten persona): «Perfecto Artola» y «Perfecto Artola Prats»; «Banda de Música del Maestro Tejera»
    // y «Banda de Música Maestro Tejera»; «A y B» y «B»
    const VACIAS = new Set('de del la las el los y banda bandas musica municipal agrupacion asociacion cultural musico sociedad filarmonica juvenil cornetas tambores'.split(' '));
    const tk = (s) => new Set(norm(s).split(' ').filter((w) => w && !VACIAS.has(w)));
    const contiene = (a, b) => { for (const w of b) if (!a.has(w)) return false; return true; };
    const mismo = (a, b) => { const x = tk(a), y = tk(b); if (!x.size || !y.size) return false; if (contiene(x, y) || contiene(y, x)) return true; const pa = norm(a).split(/ y |,/).map((s) => s.trim()).filter(Boolean), pb = norm(b).split(/ y |,/).map((s) => s.trim()).filter(Boolean); return pa.some((p) => pb.some((q) => { const u = tk(p), v = tk(q); return u.size && v.size && (contiene(u, v) || contiene(v, u)); })); };

    // ================= preguntas del Trivial =================
    // Cada generador devuelve { cat, q, op, ok, explica, enlace, media? } o null si con esa semilla no sale una buena.
    const G = {
      capital(z, f) {
        const l = H.filter((h) => unico(h) && (!f.c || h.c === f.c)); if (!l.length) return null;
        const h = z.pick(l), o = opciones(z, CAP.get(h.c).n, J.caps.map((c) => c[1]).filter((n) => n !== CAP.get(h.c).n)); if (!o) return null;
        return { cat: 'Capitales', q: '¿De qué capital es la cofradía «' + h.n + '»?', ...o, explica: Nom(h) + ' es de ' + CAP.get(h.c).n + ' y sale ' + artDia(h.d) + '.', enlace: ficha(h), h: h.s };
      },
      dia(z, f) {
        const l = H.filter((h) => !h.x && DIAS.indexOf(h.d) >= 0 && (!f.c || h.c === f.c)); if (!l.length) return null;
        const h = z.pick(l), o = opciones(z, h.d, DIAS.filter((d) => d !== h.d && d !== 'Jueves Santo y Madrugada' && d !== 'Vísperas' && (SOLAPA[h.d] || []).indexOf(d) < 0)); if (!o) return null;
        return { cat: 'Jornadas', q: '¿Qué día ' + V(h, 'sale ', 'salen ') + conCap(h) + '?', ...o, explica: Nom(h) + V(h, ' sale ', ' salen ') + artDia(h.d) + (h.hora ? ' a las ' + h.hora : '') + '.', enlace: ficha(h), h: h.s };
      },
      hora(z, f) {
        const l = H.filter((h) => h.hora && (!f.c || h.c === f.c)); if (!l.length) return null;
        const h = z.pick(l), v = minutos(h.hora);
        // horas de otras cofradías de esa jornada, a más de 25 minutos de la buena (que no se confundan)
        const malas = H.filter((x) => x !== h && x.c === h.c && x.d === h.d && x.hora && Math.abs(minutos(x.hora) - v) >= 25).map((x) => x.hora);
        const o = opciones(z, h.hora, malas); if (!o) return null;
        return { cat: 'Horarios', q: '¿A qué hora ' + V(h, 'sale ', 'salen ') + conCap(h) + ' ' + artDia(h.d) + '?', ...o, explica: V(h, 'Sale', 'Salen') + ' a las ' + h.hora + ', según el último programa publicado.', enlace: ficha(h), h: h.s };
      },
      sede(z, f) {
        const l = H.filter((h) => h.se && (!f.c || h.c === f.c)); if (!l.length) return null;
        const h = z.pick(l), malas = deCap(h.c).filter((x) => x.se && norm(x.se) !== norm(h.se) && !mismoTemplo(x.se, h.se)).map((x) => x.se);
        const o = opciones(z, h.se, malas); if (!o) return null;
        return { cat: 'Templos', q: '¿En qué templo tiene su sede ' + conCap(h) + '?', ...o, explica: 'Su sede es ' + h.se + '.', enlace: ficha(h), h: h.s };
      },
      imaginero(z, f) {
        const l = []; H.forEach((h) => { if (!f.c || h.c === f.c) h.t.forEach((t) => { if (t[2] >= 0 && I[t[2]] && !t[3]) l.push([h, t]); }); }); if (!l.length) return null;
        const [h, t] = z.pick(l), suyos = new Set(h.t.filter((x) => x[2] >= 0).map((x) => x[2])), autoria = norm(h.t.map((x) => x[1]).join(' '));
        const malas = I.map((x, i) => [x, i]).filter(([x, i]) => !suyos.has(i) && !enAutoria(autoria, x[0])).map(([x]) => x[0]);
        const o = opciones(z, I[t[2]][0], malas); if (!o) return null;
        return { cat: 'Imagineros', q: '¿Quién talló a ' + t[0] + ', ' + conCap(h, 'de') + '?', ...o, explica: t[0] + ': ' + (t[1] || I[t[2]][0]) + '.', enlace: ['Ver a ' + I[t[2]][0], BASE + 'imaginero/' + I[t[2]][1] + '/'], h: h.s };
      },
      antigua(z, f) {
        const c = f.c || z.pick(J.caps)[0], l = z.mezcla(deCap(c).filter((h) => h.f > 1000)), sel = [];
        for (const h of l) { if (sel.every((x) => Math.abs(x.f - h.f) >= 10)) sel.push(h); if (sel.length === 4) break; }
        if (sel.length < 4) return null;
        const vieja = sel.slice().sort((a, b) => a.f - b.f)[0], op = z.mezcla(sel);
        return { cat: 'Historia', q: '¿Cuál de estas cofradías de ' + CAP.get(c).n + ' se fundó antes?', op: op.map((h) => h.n), ok: op.indexOf(vieja), explica: sel.slice().sort((a, b) => a.f - b.f).map((h) => h.n + ': ' + h.f).join(' · ') + ' (año de fundación que da su ficha).', enlace: ficha(vieja), h: vieja.s };
      },
      banda(z, f) {
        const l = H.filter((h) => h.b.length && (!f.c || h.c === f.c)); if (!l.length) return null;
        const h = z.pick(l), suyas = new Set(h.b.map(norm));
        const malas = []; H.forEach((x) => x.b.forEach((b) => { if (!suyas.has(norm(b))) malas.push(b); }));
        const o = opciones(z, z.pick(h.b), malas.filter((b) => !h.b.some((x) => mismo(x, b)))); if (!o) return null;
        return { cat: 'Bandas', q: '¿Cuál de estas bandas acompaña ' + conCap(h, 'a') + '?', ...o, explica: 'Con ' + nom(h) + ' van: ' + h.b.join(' · ') + '.', enlace: ficha(h), h: h.s };
      },
      compositor(z, f) {
        const l = M.filter((m) => !f.c || m.h.c === f.c); if (!l.length) return null;
        const m = z.pick(l), mismos = new Set(POR_TIT.get(m.k).map((x) => x.ka));
        const malas = [...new Set(M.map((x) => x.a))].filter((a) => !mismos.has(norm(a)) && ![...POR_TIT.get(m.k)].some((x) => mismo(x.a, a)));
        const o = opciones(z, m.a, malas); if (!o) return null;
        return { cat: 'Marchas', q: '¿Quién compuso «' + m.t + '», dedicada ' + conCap(m.h, 'a') + '?', ...o, explica: '«' + m.t + '» es de ' + m.a + (m.y ? ' (' + m.y + ')' : '') + '.', enlace: m.s ? ['Ver la marcha', BASE + 'marcha/' + m.s + '/'] : ficha(m.h), h: m.h.s };
      },
      dedicada(z, f) {
        const l = M.filter((m) => !f.c || m.h.c === f.c); if (!l.length) return null;
        const m = z.pick(l), conEse = new Set(POR_TIT.get(m.k).map((x) => x.h.s));
        const malas = deCap(m.h.c).filter((h) => !conEse.has(h.s) && !dedicadaA(h.s, m.t)).map((h) => h.n);
        const o = opciones(z, m.h.n, malas); if (!o) return null;
        return { cat: 'Marchas', q: '«' + m.t + '», de ' + m.a + ', está dedicada a una cofradía de ' + CAP.get(m.h.c).n + '. ¿A cuál?', ...o, explica: 'Está dedicada ' + conCap(m.h, 'a') + '.', enlace: m.s ? ['Ver la marcha', BASE + 'marcha/' + m.s + '/'] : ficha(m.h), h: m.h.s };
      },
      cifra(z, f) {
        const cs = J.caps.filter((c) => J.ci && J.ci[c[0]] && (!f.c || c[0] === f.c)); if (!cs.length) return null;
        const c = z.pick(cs), ci = J.ci[c[0]], n = ci[0];
        const malas = [n - 9, n - 6, n - 4, n + 3, n + 5, n + 8, n + 12].filter((x) => x > 5).map(String);
        const o = opciones(z, String(n), malas); if (!o) return null;
        return { cat: 'Cifras', q: '¿Cuántas ' + ci[1] + ' tiene ' + c[1] + '?', ...o, explica: c[1] + ' tiene ' + (ci[2] || n + ' ' + ci[1]) + '.', enlace: ['Semana Santa de ' + c[1], BASE + 'semana-santa/' + c[0] + '/'] };
      },
    };
    const NIVEL = { facil: ['capital', 'dia', 'cifra', 'capital', 'dia'], media: ['hora', 'sede', 'antigua', 'dedicada', 'dia'], cofrade: ['imaginero', 'banda', 'compositor', 'dedicada', 'hora', 'antigua'] };
    NIVEL.mezcla = ['capital', 'dia', 'hora', 'sede', 'imaginero', 'antigua', 'banda', 'compositor', 'dedicada', 'cifra'];

    // ================= ¿Qué hermandad es? (por su nazareno, su titular o la forma de su recorrido) =================
    // dos nazarenos que se ven casi iguales (mismas prendas y colores a menos de 60 de distancia en RGB): no van juntos en la misma pregunta
    const colores = (i) => (J.naz[i].match(/#[0-9a-f]{6}/gi) || []).map((c) => [1, 3, 5].map((k) => parseInt(c.substr(k, 2), 16)));
    const distintos = (l) => l.filter((c, k) => l.findIndex((d) => Math.hypot(c[0] - d[0], c[1] - d[1], c[2] - d[2]) < 30) === k);
    const cerca = (c, l) => l.some((d) => Math.hypot(c[0] - d[0], c[1] - d[1], c[2] - d[2]) < 60);
    const nazParecidos = (a, b) => { const x = distintos(colores(a)), y = distintos(colores(b)); return x.every((c) => cerca(c, y)) && y.every((c) => cerca(c, x)); };
    function adivina(z, f, modo) {
      const campo = { naz: 'nz', foto: 'fo', ruta: 'ru' }[modo];
      const l = H.filter((h) => h[campo] >= 0 && h[campo] != null && (!f.c || h.c === f.c)); if (!l.length) return null;
      const h = z.pick(l);
      // las otras tres, de la misma capital (y de la misma jornada si se puede, que se parezcan); con su propio dibujo distinto
      // por el nazareno, solo otras con su hábito conocido y distinto: si no, podría valer más de una
      let cand = deCap(h.c).filter((x) => x !== h && sinArt(x.n) !== sinArt(h.n) && !(modo === 'naz' && !(x.nz >= 0 && x.nz !== h.nz && !nazParecidos(x.nz, h.nz))));
      const mismoDia = cand.filter((x) => x.d === h.d); if (mismoDia.length >= 3 && modo !== 'naz') cand = mismoDia;
      const o = opciones(z, h.n, cand.map((x) => x.n)); if (!o) return null;
      const QT = { naz: '¿De qué cofradía de ' + CAP.get(h.c).n + ' es este nazareno?', foto: '¿De qué cofradía de ' + CAP.get(h.c).n + ' es esta imagen?', ruta: 'Este es el recorrido de una cofradía de ' + CAP.get(h.c).n + (modo === 'ruta' && cand === mismoDia ? ' ' + artDia(h.d) : '') + '. ¿De cuál?' };
      const fo = modo === 'foto' ? J.fo[h.fo] : null;
      const cr = fo ? ' ' + norm(fo[1] + ' ' + (fo[2] || '')) + ' ' : '', enCredito = (x) => palabrasNombre(x.n).some((w) => cr.indexOf(' ' + w + ' ') >= 0);
      const revela = fo && enCredito(h), otra = fo && !revela && deCap(h.c).some((x) => x !== h && enCredito(x));
      const leyenda = fo ? (revela ? 'Foto: de la propia hermandad (el crédito, al responder)' : otra ? 'Foto: el crédito, al responder' : 'Foto: ' + fo[1] + (fo[2] ? ' · ' + fo[2] : '')) : '';
      return { cat: { naz: 'Nazarenos', foto: 'Titulares', ruta: 'Recorridos' }[modo], q: QT[modo], ...o, media: { k: modo, i: h[campo], color: CAP.get(h.c).color, leyenda }, explica: modo === 'naz' ? 'Es el hábito ' + conCap(h, 'de') + ', dibujado con los colores que da su ficha.' : modo === 'ruta' ? 'Es el recorrido ' + conCap(h, 'de') + ' (último itinerario publicado). El punto marca la salida' + (J.ru[h.ru] && J.ru[h.ru].length > 3 ? ' y el rombo, la carrera oficial.' : '.') : 'Es ' + conCap(h) + '.', credito: fo ? { autor: fo[1], licencia: fo[2], url: fo[3] } : null, enlace: ficha(h), h: h.s };
    }

    // ================= ¿De qué capital es? (ocho pistas, de la más difícil a la más fácil) =================
    const CIUDAD_RE = new RegExp('\\b(' + J.caps.map((c) => norm(c[1])).concat(['sevillan', 'malaguen', 'granadin', 'cordobes', 'gaditan', 'onubense', 'almerien', 'jiennense', 'jaener', 'triana', 'macarena', 'alhambra', 'albaicin', 'mezquita']).join('|') + ')');
    const delata = (s) => CIUDAD_RE.test(norm(s));
    function pistas(z, f) {
      const l = H.filter((h) => (!f.c || h.c === f.c)); if (!l.length) return null;
      for (let k = 0; k < 20; k++) {
        const h = z.pick(l), P_ = [];
        if (h.f > 1000) P_.push('Se fundó en ' + h.f + '.');
        h.t.forEach((t) => { if (t[2] >= 0 && I[t[2]] && !delata(t[0])) P_.push('Uno de sus titulares ' + (t[3] ? 'se atribuye a ' : 'es obra de ') + I[t[2]][0] + '.'); });
        if (h.b.length && !delata(h.b[0])) P_.push('La acompaña ' + h.b[0] + '.');
        h.t.forEach((t) => { if (!delata(t[0])) P_.push('Uno de sus titulares: ' + t[0] + '.'); });
        if (h.hora) P_.push('Sale ' + artDia(h.d) + ' a las ' + h.hora + '.'); else P_.push('Sale ' + artDia(h.d) + '.');
        if (h.se && !delata(h.se)) P_.push('Su templo: ' + h.se + '.');
        if (!delata(h.n)) P_.push('Se llama «' + h.n + '».');
        const p = [...new Set(P_)].slice(0, 8);
        if (p.length < 4) continue;
        const op = J.caps.map((c) => c[1]);
        return { cat: 'Pistas', q: '¿De qué capital es esta cofradía?', pistas: p, op, ok: op.indexOf(CAP.get(h.c).n), explica: 'Es ' + conCap(h) + '.', enlace: ficha(h), h: h.s };
      }
      return null;
    }

    // ================= El intruso =================
    function intruso(z, f) {
      const tipo = z.pick(['capital', 'dia', 'imaginero']);
      if (tipo === 'capital') {
        const c = f.c || z.pick(J.caps)[0], dentro = z.mezcla(deCap(c).filter(unico)).slice(0, 3), fuera = z.pick(H.filter((h) => h.c !== c && unico(h)));
        if (dentro.length < 3 || !fuera) return null;
        const op = z.mezcla(dentro.concat([fuera]));
        return { cat: 'El intruso', q: 'Tres son de ' + CAP.get(c).n + ' y una no. ¿Cuál es la intrusa?', op: op.map((h) => h.n), ok: op.indexOf(fuera), explica: Nom(fuera) + ' es de ' + CAP.get(fuera.c).n + '.', enlace: ficha(fuera), h: fuera.s };
      }
      if (tipo === 'dia') {
        const c = f.c || z.pick(J.caps)[0], dias = [...new Set(deCap(c).map((h) => h.d))], d = z.pick(dias);
        const dentro = z.mezcla(deCap(c).filter((h) => h.d === d && !h.x)).slice(0, 3), fuera = z.pick(deCap(c).filter((h) => !solapan(h.d, d) && !h.x && sinArt(h.n) !== '' && !dentro.some((x) => sinArt(x.n) === sinArt(h.n))));
        if (dentro.length < 3 || !fuera) return null;
        const op = z.mezcla(dentro.concat([fuera]));
        return { cat: 'El intruso', q: 'En ' + CAP.get(c).n + ', tres salen ' + artDia(d) + ' y una no. ¿Cuál?', op: op.map((h) => h.n), ok: op.indexOf(fuera), explica: Nom(fuera) + V(fuera, ' sale ', ' salen ') + artDia(fuera.d) + '.', enlace: ficha(fuera), h: fuera.s };
      }
      // tres titulares del mismo imaginero y uno de otro
      const por = new Map(); H.forEach((h) => { if (!f.c || h.c === f.c) h.t.forEach((t) => { if (t[2] >= 0 && !t[3]) { if (!por.has(t[2])) por.set(t[2], []); por.get(t[2]).push([h, t]); } }); });
      const ims = [...por.entries()].filter(([, l]) => new Set(l.map((x) => x[0].s)).size >= 3); if (!ims.length) return null;
      const [i, obras] = z.pick(ims), dentro = []; for (const x of z.mezcla(obras)) if (!dentro.some((y) => y[0] === x[0])) { dentro.push(x); if (dentro.length === 3) break; }
      const fuera = z.pick(H.filter((h) => (!f.c || h.c === f.c) && !dentro.some((y) => y[0] === h) && h.t.some((t) => t[2] >= 0 && t[2] !== i && !t[3]) && !h.t.some((t) => t[2] === i || enAutoria(t[1], I[i][0]))));
      if (!fuera) return null;
      const tf = fuera.t.find((t) => t[2] >= 0 && t[2] !== i && !t[3]), rot = (t, h) => t + ' · ' + (unico(h) ? h.n : h.n + ' (' + CAP.get(h.c).n + ')'), items = dentro.map((x) => [rot(x[1][0], x[0]), x[0]]).concat([[rot(tf[0], fuera), fuera]]), op = z.mezcla(items);
      return { cat: 'El intruso', q: 'Tres son obra de ' + I[i][0] + ' y una no. ¿Cuál?', op: op.map((x) => x[0]), ok: op.findIndex((x) => x[1] === fuera), explica: tf[0] + ' es de ' + I[tf[2]][0] + '.', enlace: ficha(fuera), h: fuera.s };
    }

    // ================= ¿Quién va antes? (ordenar por la hora de salida) =================
    function quienAntes(z, f) {
      const grupos = new Map(); H.forEach((h) => { if (h.hora && (!f.c || h.c === f.c)) { const k = h.c + '|' + h.d; if (!grupos.has(k)) grupos.set(k, []); grupos.get(k).push(h); } });
      const g = [...grupos.values()].filter((l) => l.length >= 4); if (!g.length) return null;
      const l = z.pick(g), sel = [];
      for (const h of z.mezcla(l)) { if (sel.every((x) => Math.abs(minutos(x.hora) - minutos(h.hora)) >= 15 && sinArt(x.n) !== sinArt(h.n))) sel.push(h); if (sel.length === 4) break; }
      if (sel.length < 4) return null;
      const orden = sel.slice().sort((a, b) => minutos(a.hora) - minutos(b.hora));
      return { cat: '¿Quién va antes?', q: 'Ordénalas por su hora de salida ' + artDia(l[0].d) + ' en ' + CAP.get(l[0].c).n + ', de la primera a la última.', ordenar: true, op: sel.map((h) => h.n), solucion: orden.map((h) => sel.indexOf(h)), explica: orden.map((h) => h.hora + ' ' + h.n).join(' · '), enlace: ['Ver el orden de paso', BASE + 'calendario/'] };
    }

    // ================= Adivina la marcha (sin audio: por su dedicatoria y su compositor) =================
    function marcha(z, f) {
      const l = M.filter((m) => !f.c || m.h.c === f.c); if (!l.length) return null;
      const m = z.pick(l);
      // las otras: del mismo compositor (si tiene) o de la misma capital; ninguna dedicada a esa cofradía
      let malas = M.filter((x) => x.a === m.a && x.h !== m.h).map((x) => x.t);
      if (malas.length < 3) malas = malas.concat(M.filter((x) => x.h.c === m.h.c && x.h !== m.h).map((x) => x.t));
      malas = malas.filter((t) => !DEDIC.has(norm(t) + '|' + m.h.s) && !dedicadaA(m.h.s, t));
      const o = opciones(z, m.t, malas); if (!o) return null;
      return { cat: 'Marchas', q: 'La compuso ' + m.a + (m.y ? ' en ' + m.y : '') + ' y está dedicada ' + conCap(m.h, 'a') + '. ¿Cuál es?', ...o, explica: '«' + m.t + '», de ' + m.a + '.', enlace: m.s ? ['Ver la marcha', BASE + 'marcha/' + m.s + '/'] : ficha(m.h), h: m.h.s };
    }

    // ================= partidas =================
    const JUEGOS = {
      trivial: { n: 10, gen: (z, f) => G[z.pick(NIVEL[f.nivel] || NIVEL.mezcla)](z, f) },
      adivina: { n: 8, gen: (z, f) => adivina(z, f, f.modo && f.modo !== 'mezcla' && !(f.modo === 'foto' && f.sinRed) ? f.modo : z.pick(f.sinRed ? ['naz', 'ruta'] : ['naz', 'foto', 'ruta', 'ruta', 'naz'])) },
      pistas: { n: 5, gen: pistas },
      intruso: { n: 8, gen: intruso },
      antes: { n: 5, gen: quienAntes },
      marcha: { n: 8, gen: marcha },
      reto: { n: 5, gen: (z, f, i) => [() => G.capital(z, f), () => adivina(z, f, z.pick(['naz', 'ruta', 'foto'])), () => G[z.pick(['hora', 'sede', 'dedicada', 'antigua'])](z, f), () => intruso(z, f), () => G[z.pick(['imaginero', 'compositor', 'banda'])](z, f)][i % 5]() },
    };
    // una partida: N preguntas sin repetir hermandad, siempre las mismas con la misma semilla
    function partida(juego, seed, f) {
      f = f || {}; const def = JUEGOS[juego]; if (!def) return [];
      const z = R(seed), out = [], usadas = new Set();
      for (let i = 0, tries = 0; out.length < def.n && tries < def.n * 40; tries++) {
        const p = def.gen(z, f, out.length); if (!p) continue;
        const k = p.h || p.q; if (usadas.has(k)) continue; usadas.add(k); out.push(p); i++;
      }
      return out;
    }
    const semillaDia = (iso) => hash('reto-' + iso);

    // ================= Sopa de letras cofrade =================
    // Las palabras son los nombres cortos de las cofradías de una capital («Macarena», «Cachorro», «Estrella»), sin tildes y en mayúsculas.
    const SOPA_DIR = [[0, 1], [1, 0], [1, 1], [-1, 1]];
    function sopa(seed, f) {
      const z = R(seed), N = 10, cs = f && f.c ? [f.c] : J.caps.map((c) => c[0]), c = z.pick(cs);
      const cand = []; const vistas = new Set();
      for (const h of deCap(c)) {
        const w = sinArt(h.n).toUpperCase().replace(/[^A-Z]/g, ''); // una sola palabra, de 4 a 9 letras
        if (/\s/.test(sinArt(h.n)) || w.length < 4 || w.length > 9 || vistas.has(w)) continue;
        vistas.add(w); cand.push({ w, h });
      }
      if (cand.length < 5) return null;
      for (let intento = 0; intento < 30; intento++) {
        const g = Array.from({ length: N }, () => Array(N).fill('')), puestas = [];
        for (const x of z.mezcla(cand)) {
          if (puestas.length >= 7) break;
          for (let t = 0; t < 60; t++) {
            const [dr, dc] = z.pick(SOPA_DIR), r0 = z.int(N), c0 = z.int(N), r1 = r0 + dr * (x.w.length - 1), c1 = c0 + dc * (x.w.length - 1);
            if (r1 < 0 || r1 >= N || c1 < 0 || c1 >= N) continue;
            let ok = true; for (let i = 0; i < x.w.length; i++) { const v = g[r0 + dr * i][c0 + dc * i]; if (v && v !== x.w[i]) { ok = false; break; } }
            if (!ok) continue;
            for (let i = 0; i < x.w.length; i++) g[r0 + dr * i][c0 + dc * i] = x.w[i];
            puestas.push({ w: x.w, h: x.h, r: r0, c: c0, dr, dc }); break;
          }
        }
        if (puestas.length < 5) continue;
        const ABC = 'AAABCCDEEEFGHIIJLLMNNOOOPQRRSSTTUUVZ';
        for (const fila of g) for (let k = 0; k < N; k++) if (!fila[k]) fila[k] = ABC[z.int(ABC.length)];
        // cada palabra tiene que estar una sola vez (en cualquier sentido): si el relleno la repite, otra vez
        if (puestas.every((p) => contarEn(g, p.w) === 1)) return { c, n: CAP.get(c).n, grid: g.map((f_) => f_.join('')), palabras: puestas.map((p) => ({ w: p.w, nombre: p.h.n, s: p.h.s, r: p.r, c: p.c, dr: p.dr, dc: p.dc })) };
      }
      return null;
    }
    function contarEn(g, w) {
      const N = g.length; let n = 0; const rev = w.split('').reverse().join('');
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) for (const [dr, dc] of SOPA_DIR) {
        let s = ''; for (let i = 0; i < w.length; i++) { const rr = r + dr * i, cc = c + dc * i; if (rr < 0 || rr >= N || cc < 0 || cc >= N) { s = ''; break; } s += g[rr][cc]; }
        if (s === w) n++; if (s === rev && rev !== w) n++;
      }
      return n;
    }
    return { partida, semillaDia, sopa, contarEn, JUEGOS, hash, _G: G, _H: H, _M: M, _I: I };
  }

  // ================= Node (pruebas) =================
  if (typeof module === 'object' && module && module.exports) { module.exports = { crearJuegos, rng, hash }; }
  if (typeof document === 'undefined') return;

  // ================= interfaz =================
  const raizEl = document.querySelector('[data-juegos]'); if (!raizEl) return;
  const BASE = window.OC_BASE || '/';
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hoyISO = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid' }).format(new Date());
  const ayerISO = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid' }).format(new Date(Date.now() - 864e5));
  const guarda = { leer() { try { return JSON.parse(localStorage.getItem('oc-juegos') || '{}'); } catch (e) { return {}; } }, poner(x) { try { localStorage.setItem('oc-juegos', JSON.stringify(x)); } catch (e) { } } };
  const el = (tag, cls, txt) => { const x = document.createElement(tag); if (cls) x.className = cls; if (txt != null) x.textContent = txt; return x; };
  const SI = ['¡Olé! Eso es de cofrade de cuna.', 'Toma ya. Ni el capataz lo canta mejor.', 'Bien visto, cuñao.', 'Esa la sabías de sobra, no me engañes.', '¡Arriba! Al cielo con ella.', 'Eso es mirar con ojos de bulla.'];
  const NO = ['Uy, casi. Bueno, casi no: era otra.', 'Esa te la apunto para la próxima, ¿eh?', 'No pasa nada: hasta el mejor costalero mete el pie.', 'Frío, frío. Mira la ficha y aprendes.', 'Te ha pillado la bulla, cuñao.', 'Esa no. Pero tranquilo, que queda Semana Santa.'];
  const FIN = [[1, 'Pleno. Tú no esperas a la cofradía: la cofradía te espera a ti.'], [0.8, 'Muy bien, cuñao. Casi me quitas el puesto.'], [0.5, 'Aprobado justo. Un par de tardes más de bulla y lo bordas.'], [0.25, 'Regulín. Date una vuelta por las fichas y me lo vuelves a intentar.'], [0, 'Tú has venido por el ambiente, ¿verdad? No pasa nada, aquí se aprende.']];
  const al = (l) => l[Math.floor(Math.random() * l.length)];
  // región viva fija (fuera de lo que se repinta): lo que se escribe aquí lo leen los lectores de pantalla
  const vivoEl = el('p', 'oc-sr'); vivoEl.setAttribute('aria-live', 'polite'); raizEl.after(vivoEl);
  const vivo = (t) => { vivoEl.textContent = ''; setTimeout(() => { vivoEl.textContent = t; }, 60); };
  const INFO = {
    reto: ['El reto de hoy', 'Cinco preguntas, las mismas para todo el mundo. Vuelve mañana y no pierdas la racha.'],
    trivial: ['El Trivial de las Ocho', 'Diez preguntas de horarios, templos, imagineros, bandas y marchas. Tú eliges capital y nivel.'],
    adivina: ['¿Qué hermandad es?', 'Por su nazareno, por su titular o por la forma de su recorrido en el plano.'],
    pistas: ['¿De qué capital es?', 'Hasta ocho pistas. Cuantas menos gastes, más puntos.'],
    intruso: ['El intruso', 'De cuatro, una no encaja. A ver si la cazas.'],
    antes: ['¿Quién va antes?', 'Ordena las cofradías por su hora de salida.'],
    sopa: ['Sopa de letras cofrade', 'Busca los nombres de las cofradías de una capital. Toca la primera letra y la última.'],
    marcha: ['Adivina la marcha', 'Te digo su compositor y a quién está dedicada; tú, el título. Sin audio, que la música es de sus bandas.'],
  };
  let J = null, motor = null;
  const url = raizEl.getAttribute('data-datos');
  const cargar = () => (J ? Promise.resolve() : fetch(url).then((r) => { if (!r.ok) throw 0; return r.json(); }).then((j) => { J = j; motor = crearJuegos(j, { base: BASE }); }));
  const CAPS = () => (J ? J.caps : []);

  function cuñao(txt) { const d = el('div', 'oc-jg-cunao'); const i = document.querySelector('.oc-cunao-btn svg'); if (i) d.appendChild(i.cloneNode(true)); d.appendChild(el('p', null, txt)); return d; }
  function pantalla(...hijos) { raizEl.textContent = ''; hijos.forEach((h) => h && raizEl.appendChild(h)); const t = raizEl.querySelector('h2, [data-foco]'); if (t) { t.setAttribute('tabindex', '-1'); t.focus({ preventScroll: true }); } raizEl.scrollIntoView({ block: 'start', behavior: calm ? 'auto' : 'smooth' }); }
  function racha() { const g = guarda.leer(); const r = g.ultimo === hoyISO() || g.ultimo === ayerISO() ? g.racha || 0 : 0; return { r, hecho: g.ultimo === hoyISO(), mejor: g.mejor || 0, nota: (g.notas || {})[hoyISO()] }; }

  // ---------- menú ----------
  function menu() {
    const ra = racha(), wrap = el('div', 'oc-jg-menu');
    wrap.appendChild(cuñao(ra.r > 1 ? 'Llevas ' + ra.r + ' días seguidos, cuñao. ' + (ra.hecho ? 'El de hoy ya está; mañana, más.' : 'No me la rompas hoy.') : '¿Echamos una partida mientras esperas? Todo sale de las fichas de la web, y al final de cada pregunta te digo dónde mirarlo.'));
    const ul = el('ul', 'oc-jg-cards');
    Object.entries(INFO).forEach(([k, [t, d]]) => {
      const li = el('li'), b = el('button', 'oc-jg-card' + (k === 'reto' ? ' is-reto' : '')); b.type = 'button';
      b.appendChild(el('span', 'oc-jg-card-t', t)); b.appendChild(el('span', 'oc-jg-card-d', d));
      if (k === 'reto') b.appendChild(el('span', 'oc-jg-card-x', ra.hecho ? 'Hecho hoy: ' + ra.nota + ' de 5 · racha ' + ra.r : ra.r ? 'Racha: ' + ra.r + (ra.r === 1 ? ' día' : ' días') : 'Empieza tu racha'));
      b.addEventListener('click', () => (k === 'reto' ? jugar('reto', { seed: motorSemilla() }) : opcionesJuego(k)));
      li.appendChild(b); ul.appendChild(li);
    });
    wrap.appendChild(ul);
    pantalla(wrap);
    if (history.state && history.state.jg) history.replaceState(null, '', location.pathname);
  }
  const motorSemilla = () => motor.semillaDia(hoyISO());

  // ---------- elegir capital y nivel ----------
  function opcionesJuego(k, f) {
    f = f || { c: '', nivel: 'mezcla', modo: 'mezcla' };
    const w = el('div', 'oc-jg-opc'), h = el('h2', 'oc-jg-h', INFO[k][0]); w.appendChild(h); w.appendChild(el('p', 'oc-jg-sub', INFO[k][1]));
    const grupo = (titulo, clave, l) => { const fs = el('fieldset', 'oc-jg-seg'); fs.appendChild(el('legend', null, titulo)); l.forEach(([v, t]) => { const b = el('button', null, t); b.type = 'button'; b.setAttribute('aria-pressed', String(f[clave] === v)); b.addEventListener('click', () => { f[clave] = v; fs.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); }); fs.appendChild(b); }); w.appendChild(fs); };
    grupo('Capital', 'c', [['', 'Las ocho']].concat(CAPS().map((c) => [c[0], c[1]])));
    if (k === 'trivial') grupo('Nivel', 'nivel', [['mezcla', 'De todo'], ['facil', 'Fácil'], ['media', 'Media'], ['cofrade', 'Cofrade de cuna']]);
    if (k === 'adivina') grupo('Por', 'modo', [['mezcla', 'De todo'], ['naz', 'Su nazareno'], ['foto', 'Su titular'], ['ruta', 'Su recorrido']]);
    const acc = el('div', 'oc-jg-acc'), go = el('button', 'oc-btn', 'Empezar'); go.type = 'button';
    go.addEventListener('click', () => jugar(k, { seed: (Math.random() * 4294967296) >>> 0, c: f.c, nivel: f.nivel, modo: f.modo }));
    const vol = el('button', 'oc-btn is-quiet', 'Volver'); vol.type = 'button'; vol.addEventListener('click', menu);
    acc.append(go, vol); w.appendChild(acc);
    pantalla(w);
  }

  // ---------- jugar ----------
  function media(m) {
    const fig = el('figure', 'oc-jg-media is-' + m.k);
    if (m.k === 'naz') { fig.style.setProperty('--c', m.color); fig.innerHTML = '<svg viewBox="38 16 164 532" role="img" aria-label="Nazareno con los colores de su hábito">' + J.naz[m.i].replace(/§(\d+)/g, (x, n) => J.nd[+n]) + '</svg>'; }
    else if (m.k === 'foto') { const im = el('img'); im.src = BASE + J.fo[m.i][0]; im.alt = 'Imagen titular de la cofradía que hay que adivinar'; im.decoding = 'async'; fig.appendChild(im); fig.appendChild(el('figcaption', 'oc-jg-leyenda', m.leyenda)); im.addEventListener('error', () => { im.replaceWith(el('p', 'oc-jg-sinfoto', 'La foto no carga (¿sin conexión?). Puedes contestar igual: al responder te digo cuál era.')); }); }
    else if (m.k === 'ruta') { fig.style.setProperty('--c', m.color); fig.innerHTML = '<svg viewBox="-6 -6 112 112" role="img" aria-label="Forma del recorrido de la cofradía"><path class="oc-jg-ruta" d="' + J.ru[m.i][0] + '"/><circle class="oc-jg-salida" cx="' + J.ru[m.i][1] + '" cy="' + J.ru[m.i][2] + '" r="3.2"/>' + (J.ru[m.i].length > 3 ? '<rect class="oc-jg-co" x="' + (J.ru[m.i][3] - 2.6) + '" y="' + (J.ru[m.i][4] - 2.6) + '" width="5.2" height="5.2" transform="rotate(45 ' + J.ru[m.i][3] + ' ' + J.ru[m.i][4] + ')"/>' : '') + '</svg>'; fig.appendChild(el('figcaption', 'oc-jg-leyenda', J.ru[m.i].length > 3 ? '● salida · ◆ carrera oficial' : '● salida')); }
    return fig;
  }
  function jugar(k, f) {
    if (k === 'sopa') return jugarSopa(f);

    cargar().then(() => {
      f.sinRed = !!f.sinRed || navigator.onLine === false;
      const ps = motor.partida(k, f.seed, Object.assign({}, f));
      if (!ps.length) { pantalla(cuñao('Con esa capital no me salen preguntas de este juego todavía. Prueba con otra.'), volver()); return; }
      const est = { k, f, ps, i: 0, ok: 0, res: [], puntos: 0 };
      try { history.pushState({ jg: 1 }, '', location.pathname + '#j=' + k); } catch (e) { }
      pregunta(est);
    }).catch(() => pantalla(cuñao('No me llegan las preguntas, cuñao. ¿Tienes conexión? Si ya habías entrado antes, recarga.'), volver()));
  }
  // ---------- sopa de letras ----------
  function jugarSopa(f) {
    cargar().then(() => {
      const S = motor.sopa(f.seed, f);
      if (!S) { pantalla(cuñao('Con esa capital no me sale la sopa, cuñao. Prueba con otra.'), volver()); return; }
      try { history.pushState({ jg: 1 }, '', location.pathname + '#j=sopa'); } catch (e) { }
      const w = el('div', 'oc-jg-q'), t0 = Date.now();
      const cab = el('p', 'oc-jg-prog'); cab.appendChild(el('span', null, 'Sopa de letras · ' + S.n)); const cuenta = el('span', null, '0 de ' + S.palabras.length); cab.appendChild(cuenta); w.appendChild(cab);
      w.appendChild(el('h2', 'oc-jg-pregunta', 'Encuentra ' + S.palabras.length + ' cofradías de ' + S.n + '. Toca la primera letra y luego la última.'));
      const tabla = el('div', 'oc-jg-sopa'); tabla.setAttribute('role', 'grid'); tabla.setAttribute('aria-label', 'Sopa de letras');
      const celdas = [];
      S.grid.forEach((fila, r) => { const fr = el('div', 'oc-jg-sopa-f'); fr.setAttribute('role', 'row'); fila.split('').forEach((ch, c) => { const b = el('button', 'oc-jg-sopa-c', ch); b.type = 'button'; b.setAttribute('role', 'gridcell'); b.setAttribute('aria-label', ch + ', fila ' + (r + 1) + ', columna ' + (c + 1)); b.addEventListener('click', () => toca(r, c)); fr.appendChild(b); (celdas[r] || (celdas[r] = []))[c] = b; }); tabla.appendChild(fr); });
      w.appendChild(tabla);
      const lista = el('ul', 'oc-jg-sopa-l'); S.palabras.forEach((p) => { const li = el('li', null, p.w); li.dataset.w = p.w; lista.appendChild(li); }); w.appendChild(lista);
      const aviso = el('p', 'oc-jg-sopa-aviso'); aviso.setAttribute('role', 'status'); w.appendChild(aviso);
      const acc = el('div', 'oc-jg-acc'); const rend = el('button', 'oc-btn is-quiet', 'Me rindo: enséñamelas'); rend.type = 'button'; acc.appendChild(rend); acc.appendChild(volver()); w.appendChild(acc);
      let ini = null; const hechas = new Set();
      const marca = (p, cls) => { for (let i = 0; i < p.w.length; i++) celdas[p.r + p.dr * i][p.c + p.dc * i].classList.add(cls); };
      const fin = (rendido) => {
        rend.remove(); tabla.querySelectorAll('button').forEach((b) => { b.disabled = true; });
        S.palabras.forEach((p) => { if (!hechas.has(p.w)) marca(p, 'is-falta'); });
        const fb = el('div', 'oc-jg-fb ' + (rendido ? 'is-mal' : 'is-ok'));
        fb.appendChild(el('p', 'oc-jg-fb-t', rendido ? 'Te has rendido con ' + hechas.size + ' de ' + S.palabras.length + '. Para la próxima, más bulla.' : '¡Todas, en ' + Math.round((Date.now() - t0) / 1000) + ' segundos! Eso es tener ojo de capataz.'));
        const ul = el('ul', 'oc-jg-sopa-fichas'); S.palabras.forEach((p) => { const li = el('li'); const a = el('a', null, p.nombre); a.href = BASE + 'hermandad/' + p.s + '/'; li.appendChild(a); ul.appendChild(li); }); fb.appendChild(ul);
        const otra = el('button', 'oc-btn', 'Otra sopa'); otra.type = 'button'; otra.addEventListener('click', () => jugarSopa(Object.assign({}, f, { seed: (Math.random() * 4294967296) >>> 0 }))); fb.appendChild(otra);
        w.appendChild(fb); setTimeout(() => otra.focus({ preventScroll: true }), 30);
      };
      rend.addEventListener('click', () => fin(true));
      function toca(r, c) {
        if (!ini) { ini = [r, c]; celdas[r][c].classList.add('is-ini'); aviso.textContent = 'Ahora toca la última letra.'; return; }
        const [r0, c0] = ini; celdas[r0][c0].classList.remove('is-ini'); ini = null;
        const p = S.palabras.find((x) => !hechas.has(x.w) && ((x.r === r0 && x.c === c0 && x.r + x.dr * (x.w.length - 1) === r && x.c + x.dc * (x.w.length - 1) === c) || (x.r === r && x.c === c && x.r + x.dr * (x.w.length - 1) === r0 && x.c + x.dc * (x.w.length - 1) === c0)));
        if (!p) { aviso.textContent = 'Ahí no hay ninguna, cuñao. Prueba otra vez.'; return; }
        hechas.add(p.w); marca(p, 'is-hecha'); lista.querySelector('[data-w="' + p.w + '"]').classList.add('is-hecha');
        cuenta.textContent = hechas.size + ' de ' + S.palabras.length; aviso.textContent = '¡' + p.nombre + '! ' + al(SI);
        if (hechas.size === S.palabras.length) fin(false);
      }
      pantalla(w);
    }).catch(() => pantalla(cuñao('No me llegan las palabras, cuñao. ¿Tienes conexión?'), volver()));
  }
  function volver() { const b = el('button', 'oc-btn is-quiet', 'Volver a los juegos'); b.type = 'button'; b.addEventListener('click', menu); return b; }
  function pregunta(est) {
    const p = est.ps[est.i], w = el('div', 'oc-jg-q');
    const cab = el('p', 'oc-jg-prog'); cab.appendChild(el('span', null, INFO[est.k][0])); cab.appendChild(el('span', null, (est.i + 1) + ' de ' + est.ps.length)); w.appendChild(cab);
    const barra = el('div', 'oc-jg-barra'); barra.style.setProperty('--p', (est.i / est.ps.length)); w.appendChild(barra);
    w.appendChild(el('p', 'oc-jg-cat', p.cat));
    const h = el('h2', 'oc-jg-pregunta', p.q); w.appendChild(h);
    if (p.media) w.appendChild(media(p.media));
    let usadas = 1;
    if (p.pistas) {
      const ol = el('ol', 'oc-jg-pistas'); ol.setAttribute('aria-live', 'polite'); w.appendChild(ol);
      const mas = el('button', 'oc-btn is-quiet oc-jg-mas', 'Otra pista'); mas.type = 'button';
      const pon = () => { ol.textContent = ''; p.pistas.slice(0, usadas).forEach((t) => ol.appendChild(el('li', null, t))); mas.hidden = usadas >= p.pistas.length; mas.textContent = 'Otra pista (' + (p.pistas.length - usadas) + ')'; };
      mas.addEventListener('click', () => { usadas++; pon(); }); pon(); w.appendChild(mas);
    }
    const ops = el('div', 'oc-jg-ops' + (p.op.length > 4 ? ' is-8' : '')); ops.setAttribute('role', 'group'); ops.setAttribute('aria-label', 'Respuestas');
    const fin = (acierto, elegido) => {
      ops.querySelectorAll('button').forEach((b, j) => { b.disabled = true; if (!p.ordenar) { if (j === p.ok) b.classList.add('is-ok'); else if (j === elegido) b.classList.add('is-mal'); } });
      if (p.pistas) w.querySelector('.oc-jg-mas').hidden = true;
      const pts = acierto ? (p.pistas ? Math.max(1, 9 - usadas) : 1) : 0;
      est.puntos += pts; if (acierto) est.ok++; est.res.push(acierto);
      const fb = el('div', 'oc-jg-fb ' + (acierto ? 'is-ok' : 'is-mal'));
      fb.appendChild(el('p', 'oc-jg-fb-t', (acierto ? al(SI) : al(NO)) + (p.pistas && acierto ? ' (+' + pts + ')' : '')));
      fb.appendChild(el('p', null, p.explica));
      vivo((acierto ? 'Bien. ' : 'No. ') + p.explica);
      if (p.credito) { const c = el('p', 'oc-jg-cred'); const a = el('a', null, 'Foto: ' + p.credito.autor + (p.credito.licencia ? ' · ' + p.credito.licencia : '')); a.href = p.credito.url; a.target = '_blank'; a.rel = 'noopener'; c.appendChild(a); fb.appendChild(c); }
      const acc = el('div', 'oc-jg-acc');
      if (p.enlace) { const a = el('a', 'oc-jg-link', p.enlace[0]); a.href = p.enlace[1]; acc.appendChild(a); }
      const sig = el('button', 'oc-btn', est.i + 1 < est.ps.length ? 'Siguiente' : 'Ver cómo he quedado'); sig.type = 'button';
      sig.addEventListener('click', () => { est.i++; if (est.i < est.ps.length) pregunta(est); else final(est); });
      acc.appendChild(sig); fb.appendChild(acc); w.appendChild(fb);
      setTimeout(() => sig.focus({ preventScroll: true }), 30);
      if (!calm) fb.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    };
    if (p.ordenar) {
      // tocar en orden: cada toque numera la cofradía; con las cuatro, se corrige
      const elegidas = [];
      p.op.forEach((t, j) => { const b = el('button', 'oc-jg-op'); b.type = 'button'; b.appendChild(el('span', 'oc-jg-num', '')); b.appendChild(el('span', null, t)); b.addEventListener('click', () => {
        const ya = elegidas.indexOf(j); if (ya >= 0) { elegidas.splice(ya, 1); } else elegidas.push(j);
        ops.querySelectorAll('button').forEach((x, n) => { const pos = elegidas.indexOf(n); x.querySelector('.oc-jg-num').textContent = pos >= 0 ? String(pos + 1) : ''; x.setAttribute('aria-pressed', String(pos >= 0)); });
        if (elegidas.length === p.op.length) { const bien = elegidas.every((x, n) => x === p.solucion[n]); ops.querySelectorAll('button').forEach((x, n) => x.classList.add(elegidas.indexOf(n) === p.solucion.indexOf(n) ? 'is-ok' : 'is-mal')); fin(bien, -1); }
      }); ops.appendChild(b); });
    } else p.op.forEach((t, j) => { const b = el('button', 'oc-jg-op', t); b.type = 'button'; b.addEventListener('click', () => fin(j === p.ok, j)); ops.appendChild(b); });
    w.appendChild(ops);
    pantalla(w);
  }
  function final(est) {
    const n = est.ps.length, w = el('div', 'oc-jg-fin'), frac = est.ok / n;
    w.appendChild(el('h2', 'oc-jg-h', est.ok + ' de ' + n));
    w.appendChild(el('p', 'oc-jg-cuadros', est.res.map((x) => (x ? '🟩' : '🟥')).join('')));
    w.appendChild(cuñao(FIN.find(([m]) => frac >= m)[1]));
    if (est.k === 'reto' && !est.f.noCuenta) {
      const g = guarda.leer(), hoy = hoyISO();
      if (g.ultimo !== hoy) { g.racha = g.ultimo === ayerISO() ? (g.racha || 0) + 1 : 1; g.ultimo = hoy; g.mejor = Math.max(g.mejor || 0, g.racha); g.notas = Object.assign({}, g.notas || {}); g.notas[hoy] = est.ok; Object.keys(g.notas).sort().slice(0, -30).forEach((d) => delete g.notas[d]); guarda.poner(g); }
      w.appendChild(el('p', 'oc-jg-racha', 'Racha: ' + g.racha + (g.racha === 1 ? ' día' : ' días') + (g.mejor > 1 ? ' · tu mejor racha: ' + g.mejor : '')));
    }
    if (est.f.rival != null) w.appendChild(el('p', 'oc-jg-rival', +est.f.rival === est.ok ? 'Empate con tu colega: ' + est.ok + ' a ' + est.ok + '.' : +est.f.rival < est.ok ? 'Le has ganado a tu colega, que sacó ' + est.f.rival + '.' : 'Tu colega sacó ' + est.f.rival + '. Esta vez gana él… o ella.'));
    // Reta a un amigo: un enlace con la misma semilla; sin cuentas ni datos personales
    const q = new URLSearchParams({ j: est.k, s: String(est.f.seed), p: String(est.ok) }); if (est.f.c) q.set('c', est.f.c); if (est.f.nivel && est.k === 'trivial') q.set('n', est.f.nivel); if (est.f.modo && est.k === 'adivina') q.set('m', est.f.modo); if (est.f.sinRed) q.set('x', '1');
    if (est.k === 'reto') q.set('d', hoyISO());
    const enlace = location.origin + BASE + 'juegos/#' + q.toString();
    const texto = (est.k === 'reto' ? 'Reto cofrade de hoy en Ocho Capitales: ' : INFO[est.k][0] + ' en Ocho Capitales: ') + est.ok + ' de ' + n + ' ' + est.res.map((x) => (x ? '🟩' : '🟥')).join('') + '. ¿Me superas?';
    const acc = el('div', 'oc-jg-acc');
    const wa = el('a', 'oc-btn oc-jg-wa', 'Reta a un amigo por WhatsApp'); wa.href = 'https://wa.me/?text=' + encodeURIComponent(texto + ' ' + enlace); wa.target = '_blank'; wa.rel = 'noopener'; acc.appendChild(wa);
    if (navigator.share) { const sh = el('button', 'oc-btn is-quiet', 'Compartir'); sh.type = 'button'; sh.addEventListener('click', () => navigator.share({ title: 'Ocho Capitales', text: texto, url: enlace }).catch(() => { })); acc.appendChild(sh); }
    const otra = el('button', 'oc-btn is-quiet', est.k === 'reto' ? 'Jugar a otra cosa' : 'Otra partida'); otra.type = 'button'; otra.addEventListener('click', () => (est.k === 'reto' ? menu() : jugar(est.k, Object.assign({}, est.f, { seed: (Math.random() * 4294967296) >>> 0, rival: null }))));
    acc.appendChild(otra); acc.appendChild(volver());
    w.appendChild(acc);
    pantalla(w);
  }

  // ---------- entrada: menú, juego directo (?j=) o reto de un amigo (?j=…&s=…&p=…) ----------
  addEventListener('popstate', () => { if (!history.state && !/[#&]j=/.test(location.hash)) cargar().then(menu); });
  // un enlace «#j=…» dentro de la propia página (por ejemplo, desde erCuñao) también abre ese juego
  addEventListener('hashchange', () => { if (/[#&]j=/.test(location.hash)) entrar(); });
  entrar();
  function entrar() {
  // los parámetros van tras «#» (y se siguen entendiendo los enlaces antiguos con «?»)
  const qs = new URLSearchParams(location.hash.slice(1) || location.search), j = qs.get('j');
  cargar().then(() => {
    if (j && INFO[j] && qs.get('s')) {
      const reto = j === 'reto', d = qs.get('d');
      // el reto diario de otro día ya no cuenta para la racha: se juega como partida suelta con su semilla
      const f = { seed: reto && d ? motor.semillaDia(d) : +qs.get('s') >>> 0, c: qs.get('c') || '', nivel: qs.get('n') || 'mezcla', modo: qs.get('m') || 'mezcla', rival: /^\d{1,2}$/.test(qs.get('p') || '') && +qs.get('p') <= 10 ? +qs.get('p') : null, sinRed: qs.get('x') === '1' };
      f.noCuenta = reto && d !== hoyISO(); const k = j;
      pantalla(cuñao('Te han retado, cuñao' + (f.rival != null ? ': tu colega sacó ' + f.rival + '. ' : '. ') + 'Mismas preguntas, a ver quién sabe más.'), (() => { const b = el('button', 'oc-btn', 'Acepto el reto'); b.type = 'button'; b.addEventListener('click', () => jugar(k, f)); return b; })(), volver());
    } else if (j && INFO[j]) (j === 'reto' ? jugar('reto', { seed: motorSemilla() }) : opcionesJuego(j));
    else menu();
  }).catch(() => pantalla(cuñao('No me llegan las preguntas, cuñao. ¿Tienes conexión? Si ya habías entrado antes, recarga.')));
  }
})();
