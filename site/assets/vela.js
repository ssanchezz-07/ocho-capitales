// Ocho Capitales · «Enciende la vela» (portada fuera de temporada) y la calle camino de la próxima Semana Santa (también en
// «Próxima Semana Santa»). Diseño aprobado por Pablo el 13-nov-2026: EQUIPO/prototipos/vela-camino-2027.html y su encargo.
//
// La escena la escribe site/vela.mjs en capas SVG, que sin JavaScript o con «reducir movimiento» son la escena final. Aquí se
// leen esas mismas capas (formas, colores del tema y degradados) y se pintan en un <canvas>: Safari vuelve a pintar un SVG
// entero cada vez que cambia su escala, y aquí hay un zoom de unos 30 aumentos y una calle que no se para. La calle, ya pintada,
// se guarda en un mapa de bits y solo se desplaza. Solo se anima con la escena a la vista y la pestaña delante.
//
// Portada: vela apagada → al tocarla salta la llama → zoom a la llama → destello y paso a la llama del cirio (misma forma,
// mismo degradado, mismo parpadeo, mismo sitio y tamaño) → la cámara se aleja → el nazareno echa a andar y entran los textos.
// «Próxima Semana Santa»: empieza ya en la calle; si viene de la portada, sigue por donde iba.
(function () {
  'use strict';
  var raiz = document.documentElement, sec = document.querySelector('[data-vela]');
  if (!sec || !raiz.classList.contains('oc-vela-js')) return;
  var lienzo = sec.querySelector('.oc-vela-lienzo'), c = lienzo && lienzo.getContext && lienzo.getContext('2d');
  if (!c) { raiz.classList.remove('oc-vela-js'); return; }
  window.ocVelaVivo = true;

  var esc = sec.querySelector('.oc-vela-escena'), brillo = sec.querySelector('.oc-vela-brillo'), boton = sec.querySelector('.oc-vela-boton');
  var frase = sec.querySelector('.oc-vela-frase'), FR = (frase && frase.getAttribute('data-frases') || '').split('|').filter(Boolean);
  var portada = sec.getAttribute('data-vela') === 'portada';
  var CAPAS = { estrella: '.oc-vela-estrella', calle: '.oc-vela-calle', naz: '.oc-vela-naz', vela: '.oc-vela-vela' };
  for (var k in CAPAS) CAPAS[k] = sec.querySelector(CAPAS[k]);

  // Tiempos en ms desde que se enciende (los del prototipo; el paso de una llama a otra, quieto bajo el destello).
  // Echa a andar al acabar el zoom, como en el prototipo; los textos entran un poco antes, con el último tramo de la cámara.
  var T = { zoom1: 1300, dz1: 1500, brillo: 2450, dbr: 1100, cruce: 2800, dcr: 300, zoom2: 3100, dz2: 2600, anda: 5700, texto: 5450, rampa: 900, frase: 3600 };
  var FIN_ZOOM = T.zoom2 + T.dz2;
  var LLAMA_PANT = 0.62; // alto de la llama en pantalla, en el momento del cambio, respecto al alto de la escena

  // ---------- curvas ----------
  var cl = function (x) { return x < 0 ? 0 : x > 1 ? 1 : x; }, lerp = function (a, b, t) { return a + (b - a) * t; };
  function bz(x1, y1, x2, y2) {
    var cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx, cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    return function (x) {
      if (x <= 0) return 0; if (x >= 1) return 1;
      var lo = 0, hi = 1, t = x;
      for (var i = 0; i < 20; i++) { var v = ((ax * t + bx) * t + cx) * t; if (Math.abs(v - x) < 1e-5) break; if (v < x) lo = t; else hi = t; t = (lo + hi) / 2; }
      return ((ay * t + by) * t + cy) * t;
    };
  }
  var enOut = bz(.42, 0, .58, 1), suave = bz(.25, .1, .25, 1), salta = bz(.2, 1.5, .4, 1);
  var entra = function (k) { return k * k * (3 - 2 * k) * k; }, sale = function (k) { return 1 - Math.pow(1 - k, 3); };
  var paso = function (x) { x = cl(x); return x * x * (3 - 2 * x); };
  // fotogramas clave con ease-in-out en cada tramo, como en CSS: [[desplazamiento, valores…], …]
  function kf(F, p) {
    for (var i = 1; i < F.length; i++) if (p <= F[i][0]) {
      var a = F[i - 1], b = F[i], t = enOut((p - a[0]) / (b[0] - a[0])), r = [];
      for (var j = 1; j < a.length; j++) r.push(lerp(a[j], b[j], t));
      return r;
    }
    return F[F.length - 1].slice(1);
  }
  // parpadeo irregular de las dos llamas (2,8 s) y la llama inclinada al andar (1,6 s): [escala x, escala y, sesgo en grados]
  var TB = [[0, 1, 1, 0], [.2, .93, 1.07, 2.5], [.45, 1.04, .95, -2], [.7, .97, 1.05, 1.5], [1, 1, 1, 0]];
  var LN = [[0, 1, 1, -10], [.5, 1, 1.08, -4], [1, 1, 1, -10]];
  // t: reloj del parpadeo; inclina: de 0 (parpadea) a 1 (inclinada); tl: ms andados (el vaivén de la llama inclinada)
  function llamaV(t, inclina, tl) { var a = kf(TB, (t % 2800) / 2800), b = kf(LN, (tl % 1600) / 1600); return [lerp(a[0], b[0], inclina), lerp(a[1], b[1], inclina), lerp(a[2], b[2], inclina)]; }
  // alrededor de la base de la llama, (0, 4) en sus unidades
  function llamaM(t, inclina, tl) { var v = llamaV(t, inclina, tl); return new DOMMatrix().translate(0, 4).scale(v[0], v[1]).skewX(v[2]).translate(0, -4); }

  // ---------- leer las capas SVG ----------
  function matriz(el, prop) {
    var l = el[prop || 'transform']; l = l && l.baseVal; if (!l || !l.numberOfItems) return null;
    var m = new DOMMatrix();
    for (var i = 0; i < l.numberOfItems; i++) { var x = l.getItem(i).matrix; m = m.multiply(new DOMMatrix([x.a, x.b, x.c, x.d, x.e, x.f])); }
    return m;
  }
  function rgba(col, a) {
    var m = /rgba?\(([^)]+)\)/.exec(col || ''); if (!m) return col;
    var p = m[1].split(/[\s,\/]+/).filter(Boolean), al = p[3] != null ? parseFloat(p[3]) : 1;
    return 'rgba(' + p[0] + ',' + p[1] + ',' + p[2] + ',' + al * a + ')';
  }
  function pintura(v) { if (!v || v === 'none') return null; var g = /url\([^#]*#([^"')\s]+)/.exec(v); return g ? { id: g[1] } : v; }
  var grads = {}, usos = {};
  function degradado(id) {
    if (grads[id] !== undefined) return grads[id];
    var e = document.getElementById(id), g = null;
    if (e) {
      var n = function (x, d) { var v = e.getAttribute(x); return v == null ? d : parseFloat(v); };
      var cx = n('cx', 0), cy = n('cy', 0);
      var cg = e.localName === 'radialGradient' ? c.createRadialGradient(n('fx', cx), n('fy', cy), 0, cx, cy, n('r', 1)) : c.createLinearGradient(n('x1', 0), n('y1', 0), n('x2', 1), n('y2', 0));
      [].forEach.call(e.querySelectorAll('stop'), function (s) { var cs = getComputedStyle(s); cg.addColorStop(cl(parseFloat(s.getAttribute('offset')) || 0), rgba(cs.stopColor, +cs.stopOpacity)); });
      g = { g: cg, t: matriz(e, 'gradientTransform') || new DOMMatrix() };
    }
    return (grads[id] = g);
  }
  function hoja(el) {
    var t = el.localName, a = function (x) { return parseFloat(el.getAttribute(x)) || 0; }, p0;
    if (t === 'path') p0 = new Path2D(el.getAttribute('d') || '');
    else { p0 = new Path2D(); if (t === 'rect') p0.rect(a('x'), a('y'), a('width'), a('height')); else if (t === 'circle') p0.arc(a('cx'), a('cy'), a('r'), 0, 2 * Math.PI); else if (t === 'ellipse') p0.ellipse(a('cx'), a('cy'), a('rx'), a('ry'), 0, 0, 2 * Math.PI); else return null; }
    var m = matriz(el), s = getComputedStyle(el), f = pintura(s.fill), st = pintura(s.stroke);
    var h = { o: +s.opacity, fo: +s.fillOpacity, so: +s.strokeOpacity, lw: parseFloat(s.strokeWidth) || 1, lc: s.strokeLinecap, lj: s.strokeLinejoin, f: f, s: st && !st.id ? st : null, p: new Path2D() };
    if (f && f.id) { // degradado: se pinta en sus propias coordenadas, con la forma pasada a ellas
      var g = degradado(f.id); if (!g) return null;
      h.gr = g.g; h.mg = (m || new DOMMatrix()).multiply(g.t); h.p.addPath(p0, g.t.inverse()); h.f = null;
    } else if (m) h.p.addPath(p0, m); else h.p.addPath(p0);
    h.clave = h.gr ? '' : [f, h.s, h.lw, h.o, h.fo, h.so, h.lc, h.lj].join('|');
    return h;
  }
  function texto(el) {
    var s = getComputedStyle(el);
    return { txt: el.textContent, x: parseFloat(el.getAttribute('x')) || 0, y: parseFloat(el.getAttribute('y')) || 0, f: pintura(s.fill), o: +s.opacity * +s.fillOpacity, font: s.fontStyle + ' ' + s.fontWeight + ' ' + s.fontSize + ' ' + s.fontFamily, al: s.textAnchor === 'middle' ? 'center' : s.textAnchor === 'end' ? 'right' : 'left' };
  }
  function hijos(el, n) {
    var ult = null;
    for (var i = 0; i < el.children.length; i++) {
      var k = el.children[i], t = k.localName;
      if (t === 'defs' || t === 'title' || t === 'desc') continue;
      if (t === 'g') { n.hijos.push(grupo(k)); ult = null; }
      else if (t === 'use') { // los tramos de calle repetidos comparten su dibujo
        var id = (k.getAttribute('href') || k.getAttribute('xlink:href') || '').slice(1), ref = document.getElementById(id); if (!ref) continue;
        if (!usos[id]) { usos[id] = { hijos: [], o: 1 }; hijos(ref, usos[id]); }
        var ux = parseFloat(k.getAttribute('x')) || 0;
        // bx: de dónde a dónde llega este tramo (360 de ancho y las cornisas que asoman), para no pintarlo si no se ve
        n.hijos.push({ hijos: usos[id].hijos, o: 1, m: new DOMMatrix().translate(ux, parseFloat(k.getAttribute('y')) || 0), bx: [ux - 4, ux + 364] }); ult = null;
      } else if (t === 'text') { n.hijos.push(texto(k)); ult = null; }
      else {
        var h = hoja(k); if (!h) continue;
        // las formas seguidas con el mismo estilo van en un solo trazado: menos órdenes de pintura en cada fotograma
        if (ult && h.clave && h.clave === ult.clave) ult.p.addPath(h.p); else { n.hijos.push(h); ult = h.clave ? h : null; }
      }
    }
  }
  function grupo(el, raizSvg) {
    var capa = el.getAttribute('data-capa'), n = { hijos: [], m: raizSvg ? null : matriz(el), capa: capa, o: 1 };
    // la opacidad de las capas animadas la pone el fotograma (en el SVG quieto puede estar a 0: la vela apagada)
    if (!raizSvg && !capa) n.o = +getComputedStyle(el).opacity;
    if (capa) { n.vuelta = +el.getAttribute('data-vuelta') || 0; n.vel = +el.getAttribute('data-vel') || 0; n.retraso = +el.getAttribute('data-retraso') || 0; }
    hijos(el, n);
    return n;
  }
  var arbol = {}, col = {};
  function prepara() {
    grads = {}; usos = {};
    for (var k in CAPAS) if (CAPAS[k]) arbol[k] = grupo(CAPAS[k], true);
    var s = getComputedStyle(sec), v = function (x) { return s.getPropertyValue(x).trim(); };
    col = { bg: v('--v-bg'), c1: v('--v-cielo1'), c2: v('--v-cielo2'), c3: v('--v-cielo3') };
    calle = busca(arbol.calle, 'calle'); suelo = busca(arbol.calle, 'suelo');
  }
  function busca(n, capa) { if (!n) return null; if (n.capa === capa) return n; for (var i = 0; i < n.hijos.length; i++) if (n.hijos[i].hijos) { var r = busca(n.hijos[i], capa); if (r) return r; } return null; }

  // ---------- medidas: dónde cae cada capa en la escena ----------
  var W = 0, H = 0, dpr = 1, L = {}, calle = null, suelo = null;
  function mide() {
    var r = esc.getBoundingClientRect();
    W = r.width; H = r.height; dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (andar) lienzo.width = lienzo.height = 1; else { lienzo.width = Math.max(1, Math.round(W * dpr)); lienzo.height = Math.max(1, Math.round(H * dpr)); }
    for (var k in CAPAS) {
      var e = CAPAS[k]; if (!e) continue;
      var b = e.getBoundingClientRect(), vb = e.viewBox.baseVal, s = b.width / vb.width, x = b.left - r.left, y = b.top - r.top;
      L[k] = { s: s, x: x, y: y, m: new DOMMatrix([s, 0, 0, s, x - vb.x * s, y - vb.y * s]), vb: vb };
    }
  }
  // en coordenadas de la escena (px), el centro de la llama del cirio y de la vela, y lo que miden de alto
  var punto = function (l, x, y) { return { x: l.m.a * x + l.m.e, y: l.m.d * y + l.m.f }; };

  // La calle ya pintada: una vuelta (720 unidades, con las ocho colgaduras) en un mapa de bits de píxeles enteros.
  var cache = null, cacheS = 0;
  function haceCache() {
    cache = null; if (!calle || !L.calle) return;
    var V = calle.vuelta, ancho = Math.round(V * L.calle.s * dpr); if (ancho < 2 || ancho > 8192) return;
    var su = ancho / V, vb = L.calle.vb, cv = document.createElement('canvas'); cv.width = ancho; cv.height = Math.ceil(vb.height * su);
    var x = cv.getContext('2d'); if (!x) return;
    x.setTransform(su, 0, 0, su, -V * su, -vb.y * su);
    pintaHijos(x, calle, 1);
    cache = cv; cacheS = su;
  }

  // ---------- andando: piezas ya pintadas que mueve el propio navegador ----------
  // Andando no se repinta nada ni corre JavaScript en cada fotograma: la calle, el suelo, el cuerpo del nazareno, sus zapatos,
  // la llama de su cirio y la estrella van cada uno en su lienzo, pintados una vez, y los mueven animaciones del navegador
  // (Web Animations) solo con transform y opacidad, con los mismos fotogramas clave que el prototipo. Así lo lleva la tarjeta
  // gráfica y aguanta un bucle sin fin. El lienzo grande solo se usa para la vela y el zoom, y luego se suelta.
  var AND = null, ANIM = null, ESTA = null, PIEZAS = ['tira', 'suelo', 'estFondo', 'estrella', 'pieD', 'pieI', 'cuerpo', 'llamaW'];
  // todas en una caja fija (.oc-vela-andando, con contain) para que lo que se mueve dentro no afecte al resto de la página
  var caja = null;
  function lienzoAndar(k, dentro) {
    if (!caja) { caja = document.createElement('div'); caja.className = 'oc-vela-andando'; caja.setAttribute('aria-hidden', 'true'); esc.insertBefore(caja, lienzo); }
    var e = document.createElement(k === 'llamaW' ? 'div' : 'canvas'); e.className = 'oc-vela-andar is-' + k; (dentro || caja).appendChild(e); return e;
  }
  // coloca un lienzo en la escena, en píxeles enteros del dispositivo; dx y dy: lo que queda de desfase (en px del dispositivo)
  function coloca(e, x, y, w, h) {
    var X = Math.round(x * dpr), Y = Math.round(y * dpr), Wd = Math.max(1, Math.ceil(w * dpr)), Hd = Math.max(1, Math.ceil(h * dpr)), st = e.style;
    e.width = Wd; e.height = Hd; st.left = X / dpr + 'px'; st.top = Y / dpr + 'px'; st.width = Wd / dpr + 'px'; st.height = Hd / dpr + 'px';
    var cx = e.getContext('2d');
    return { c: cx, dx: x * dpr - X, dy: y * dpr - Y, x: X / dpr, y: Y / dpr };
  }
  // pinta en su lienzo un trozo de una capa, quieto: caja en unidades de la capa; fuera: partes que no van; solo: la que va sola
  var QUIETO = { bote: 0, pieI: [0, 0], pieD: [0, 0], llamaNaz: new DOMMatrix(), estrella: new DOMMatrix(), estrellaA: 1 };
  function trozo(e, k, caja, fuera, solo) {
    var l = L[k], d = coloca(e, l.x + (caja.x - l.vb.x) * l.s, l.y + (caja.y - l.vb.y) * l.s, caja.width * l.s, caja.height * l.s);
    var m = new DOMMatrix([dpr, 0, 0, dpr, d.dx, d.dy]).multiply(new DOMMatrix([l.s, 0, 0, l.s, -caja.x * l.s, -caja.y * l.s]));
    var antes = {}; for (var q in QUIETO) { antes[q] = F[q]; F[q] = QUIETO[q]; }
    F.fuera = fuera || null; F.solo = solo || null;
    d.c.setTransform(m.a, m.b, m.c, m.d, m.e, m.f); pinta(d.c, arbol[k], 1, false);
    for (q in antes) F[q] = antes[q]; F.fuera = F.solo = null;
    return d;
  }
  function quitaAndar() { if (ANIM) { twJS = tiempoAndar(); ANIM.forEach(function (a) { a.cancel(); }); } if (ESTA) ESTA.cancel(); ANIM = ESTA = null; if (caja) caja.remove(); caja = AND = null; }
  function preparaAndar() {
    if (!cache || !suelo || !L.naz || !L.estrella || !Element.prototype.animate) { quitaAndar(); return; }
    if (!AND) { AND = {}; PIEZAS.forEach(function (k) { AND[k] = lienzoAndar(k); }); AND.llama = lienzoAndar('llama', AND.llamaW); }
    var u = L.calle.s, vb = L.calle.vb, sn = L.naz.s;
    // la calle: la vuelta ya pintada, repetida hasta cubrir la escena y una vuelta más (la que se va desplazando)
    var t = coloca(AND.tira, L.calle.x, L.calle.y, W - L.calle.x + cache.width / dpr + 2, cache.height / dpr);
    for (var px = 0; px < AND.tira.width; px += cache.width) t.c.drawImage(cache, px, 0);
    // el suelo, que se repite cada 80 unidades
    var y0 = L.calle.y + (240 - vb.y) * u, s = coloca(AND.suelo, L.calle.x, y0, W - L.calle.x + suelo.vuelta * u + 2, H - y0);
    s.c.setTransform(dpr * u, 0, 0, dpr * u, s.dx, s.dy - 240 * dpr * u);
    F.soloSuelo = true; pinta(s.c, arbol.calle, 1, false); F.soloSuelo = false;
    // la estrella: el resplandor y el año quietos; la estrella, que late, aparte (alrededor de su centro)
    trozo(AND.estFondo, 'estrella', L.estrella.vb, { estrella: 1 });
    var le = L.estrella, es = trozo(AND.estrella, 'estrella', { x: -22, y: -22, width: 44, height: 44 }, null, 'estrella');
    AND.estrella.style.transformOrigin = (le.x - le.vb.x * le.s - es.x) + 'px ' + (le.y - le.vb.y * le.s - es.y) + 'px';
    // el nazareno (unidades de su dibujo): zapatos, cuerpo con la luz del cirio, y la llama (en una caja que sube y baja con él)
    trozo(AND.pieD, 'naz', { x: 80, y: 534, width: 38, height: 18 }, { 'pie-i': 1, cuerpo: 1 });
    trozo(AND.pieI, 'naz', { x: 122, y: 534, width: 38, height: 18 }, { 'pie-d': 1, cuerpo: 1 });
    trozo(AND.cuerpo, 'naz', { x: -150, y: -140, width: 440, height: 710 }, { 'pie-i': 1, 'pie-d': 1, 'llama-naz': 1 });
    var ll = trozo(AND.llama, 'naz', { x: 38, y: 46, width: 48, height: 64 }, { 'pie-i': 1, 'pie-d': 1 }, 'llama-naz');
    // su caja, justo de su tamaño (la llama dentro, en 0, 0); la llama se mueve alrededor de su base: (62, 100 + 4 × 0,778)
    var w = AND.llamaW.style, ls = AND.llama.style;
    w.left = ls.left; w.top = ls.top; w.width = ls.width; w.height = ls.height; ls.left = ls.top = '0px';
    AND.llama.style.transformOrigin = (L.naz.x + 62 * sn - ll.x) + 'px ' + (L.naz.y + 103.1 * sn - ll.y) + 'px';
    if (andando) animaAndar(tiempoAndar(), rampa);
  }
  // las animaciones del paso, en el punto t (ms andados) y a la velocidad r (0 parado, 1 andando)
  function animaAndar(t, r) {
    if (ANIM) ANIM.forEach(function (a) { a.cancel(); });
    if (ESTA) ESTA.cancel();
    var sn = L.naz.s, io = 'ease-in-out', inf = Infinity;
    var px = function (x, y) { return 'translate3d(' + (x * sn).toFixed(3) + 'px,' + (y * sn).toFixed(3) + 'px,0)'; };
    var desliza = function (d) { return [{ transform: 'translate3d(0,0,0)' }, { transform: 'translate3d(' + (-d).toFixed(3) + 'px,0,0)' }]; };
    var bote = [{ transform: px(0, 0), easing: io }, { transform: px(0, -10) }]; // el cuerpo sube con cada pisada (0,42 s)
    var pie = [{ transform: px(-14, 0), easing: io }, { transform: px(14, -8), offset: .5, easing: io }, { transform: px(-14, 0) }]; // 0,84 s
    var lean = [{ transform: 'scale(1,1) skewX(-10deg)', easing: io }, { transform: 'scale(1,1.08) skewX(-4deg)', offset: .5, easing: io }, { transform: 'scale(1,1) skewX(-10deg)' }];
    ANIM = [
      [AND.tira, desliza(cache.width / dpr), calle.vuelta / .036, 0], // 36 unidades por segundo
      [AND.suelo, desliza(suelo.vuelta * L.calle.s), suelo.vuelta / .016, 0], // 16 unidades por segundo
      [AND.cuerpo, bote, 420, 0, 'alternate'], [AND.llamaW, bote, 420, 0, 'alternate'], [AND.llama, lean, 1600, 0],
      [AND.pieI, pie, 840, 0], [AND.pieD, pie, 840, 420]
    ].map(function (d) { var a = d[0].animate(d[1], { duration: d[2], iterations: inf, direction: d[4] || 'normal' }); a.currentTime = t + d[3]; a.playbackRate = r; return a; });
    // la estrella late a su ritmo (4 s), siga o no el nazareno
    ESTA = AND.estrella.animate([{ transform: 'scale(1)', opacity: .85, easing: io }, { transform: 'scale(1.08)', opacity: 1, offset: .5, easing: io }, { transform: 'scale(1)', opacity: .85 }], { duration: 4000, iterations: inf });
    ESTA.currentTime = reloj % 4000;
    if (!corre()) { ANIM.forEach(function (a) { a.pause(); }); ESTA.pause(); }
  }
  // lo andado (ms): lo lleva la animación de la calle; sin ella, el reloj de aquí
  function tiempoAndar() { var t = ANIM && ANIM[0].currentTime; return t != null ? +t : twJS; }
  var andar = false;
  function ponAndar(v) {
    if (v === andar) return;
    andar = v; sec.classList.toggle('is-andar', v);
    if (v) { lienzo.width = lienzo.height = 1; } else mide(); // andando, el lienzo grande no se usa: se suelta su memoria
  }

  // ---------- pintar ----------
  var F = {}; // lo que se mueve en este fotograma
  var mx = function (x, m) { x.transform(m.a, m.b, m.c, m.d, m.e, m.f); };
  function capaAhora(n) {
    switch (n.capa) {
      case 'calle': return { m: new DOMMatrix().translate(-(F.calle % n.vuelta), 0) };
      case 'suelo': return F.soloSuelo ? null : { m: new DOMMatrix().translate(-(F.suelo % n.vuelta), 0) };
      case 'cuerpo': return { m: new DOMMatrix().translate(0, F.bote) };
      case 'pie-i': return { m: new DOMMatrix().translate(F.pieI[0], F.pieI[1]) };
      case 'pie-d': return { m: new DOMMatrix().translate(F.pieD[0], F.pieD[1]) };
      case 'llama-naz': return { m: F.llamaNaz };
      case 'llama-vela': return F.llamaVela ? { m: F.llamaVela, a: F.llamaVelaA } : false;
      case 'estrella': return { m: F.estrella, a: F.estrellaA };
      case 'halo': return { a: F.halo };
      case 'mota': { var tt = ((F.tv + n.retraso) % 6000) / 6000; return { m: new DOMMatrix().translate(0, -120 * tt), a: F.halo * (tt < .2 ? tt * 4 : 1 - tt) }; }
    }
    return null;
  }
  // dentro: ya se está dentro de la parte que se pinta sola (F.solo); F.fuera: partes que no se pintan (para las piezas sueltas)
  function pinta(x, n, a, dentro) {
    if (n.capa && ((n.capa === 'calle' && F.soloSuelo) || (F.fuera && F.fuera[n.capa]))) return;
    if (n.bx && F.vista && (n.bx[1] < F.vista[0] || n.bx[0] > F.vista[1])) return; // tramo de calle fuera de cámara
    var r = n.capa ? capaAhora(n) : null; if (r === false) return;
    var al = a * n.o * (r && r.a != null ? r.a : 1); if (al < .002) return;
    x.save();
    if (n.m) mx(x, n.m);
    if (n.capa === 'calle' && F.cache && cache) { x.restore(); calleCache(x); return; }
    if (r && r.m) mx(x, r.m);
    // la calle en vivo (durante el zoom): qué trozo cae dentro del lienzo, en unidades de la calle
    if (n.capa === 'calle' && x.getTransform) { var iv = x.getTransform().inverse(), a0 = iv.transformPoint(new DOMPoint(0, 0)), a1 = iv.transformPoint(new DOMPoint(x.canvas.width, x.canvas.height)); F.vista = [Math.min(a0.x, a1.x), Math.max(a0.x, a1.x)]; }
    pintaHijos(x, n, al, dentro || (!!F.solo && n.capa === F.solo));
    if (n.capa === 'calle') F.vista = null;
    x.restore();
  }
  function pintaHijos(x, n, al, dentro) {
    for (var i = 0; i < n.hijos.length; i++) {
      var h = n.hijos[i];
      if (h.hijos) pinta(x, h, al, dentro);
      else if (F.solo && !dentro) continue;
      else if (h.txt != null) letra(x, h, al); else forma(x, h, al);
    }
  }
  function forma(x, h, a) {
    if (h.gr) { x.save(); mx(x, h.mg); x.globalAlpha = a * h.o * h.fo; x.fillStyle = h.gr; x.fill(h.p); x.restore(); return; }
    if (h.f) { x.globalAlpha = a * h.o * h.fo; x.fillStyle = h.f; x.fill(h.p); }
    if (h.s) { x.globalAlpha = a * h.o * h.so; x.strokeStyle = h.s; x.lineWidth = h.lw; x.lineCap = h.lc; x.lineJoin = h.lj; x.stroke(h.p); }
  }
  function letra(x, h, a) { if (!h.f || h.f.id) return; x.globalAlpha = a * h.o; x.fillStyle = h.f; x.font = h.font; x.textAlign = h.al; x.textBaseline = 'alphabetic'; x.fillText(h.txt, h.x, h.y); }
  function calleCache(x) { // en píxeles del dispositivo: la calle cae siempre en píxeles enteros, nítida y sin costuras
    x.save(); x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1;
    var x0 = Math.round(L.calle.x * dpr) - Math.round((F.calle % calle.vuelta) * cacheS), y0 = Math.round(L.calle.y * dpr);
    while (x0 > 0) x0 -= cache.width;
    for (var px = x0; px < lienzo.width; px += cache.width) x.drawImage(cache, px, y0);
    x.restore();
  }
  function enEscena(x, cam) { x.setTransform(dpr, 0, 0, dpr, 0, 0); if (cam) mx(x, cam); }
  function capa(k, cam, a) { if (!arbol[k]) return; enEscena(c, cam); mx(c, L[k].m); pinta(c, arbol[k], a); }
  // cámara: mira el punto f de la escena con k aumentos, centrado en la pantalla. q = 0, sin zoom; q = 1, en la llama.
  // Como en el prototipo, el ancho de lo que se ve cambia en línea (el viewBox), y el centro también.
  function camara(f, K, q) {
    var w = lerp(1, 1 / K, q), k = 1 / w, cx = lerp(W / 2, f.x, q), cy = lerp(H / 2, f.y, q);
    return new DOMMatrix().translate(W / 2, H / 2).scale(k).translate(-cx, -cy);
  }
  function cielo(cam) {
    enEscena(c, cam); var g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, col.c1); g.addColorStop(.55, col.c2); g.addColorStop(1, col.c3);
    c.globalAlpha = 1; c.fillStyle = g; c.fillRect(-W, -H, 3 * W, 3 * H);
  }

  // ---------- estado ----------
  // tv: ms desde que se encendió la vela; tw: ms andados. El nazareno echa a andar al acabar el zoom (como en el prototipo) y
  // arranca poco a poco: la velocidad sube de 0 a 1 en 0,9 s (rampa). Hasta entonces está quieto en el primer paso.
  var reloj = 0, tEnc = 0, tAnda = 0, twJS = 0, rampa = 0, arrastre = 0, encendida = !portada, andando = false;
  var claseCielo = false, claseTexto = !portada, fraseI = -1, fraseO = -1, brilloO = 0;
  function echaAndar(t0) {
    andando = true; tAnda = reloj; twJS = t0; rampa = t0 > 0 ? 1 : 0;
    if (AND) animaAndar(t0, rampa);
    ritmo();
  }
  function avanza(dt) {
    var tv = portada ? (encendida ? reloj - tEnc : -1) : 1e9;
    if (portada && !andando && tv >= T.anda) echaAndar(0);
    if (andando && rampa < 1) {
      rampa = paso((reloj - tAnda) / T.rampa);
      if (ANIM) ANIM.forEach(function (a) { if (a.updatePlaybackRate) a.updatePlaybackRate(rampa); else a.playbackRate = rampa; });
    }
    if (andando) twJS += (dt || 0) * rampa;
    var tw = andando ? tiempoAndar() : 0;
    F.tv = tv; F.tw = tw;
    // lo que se ve en el lienzo grande (el zoom y, si no hay piezas sueltas, también al andar), con los mismos tiempos
    F.calle = tw * .036; F.suelo = tw * .016;
    var pb = (tw % 840) / 420; F.bote = -10 * enOut(pb < 1 ? pb : 2 - pb);
    var pie = function (fase) { var p = ((tw + fase) % 840) / 840, q = p < .5 ? enOut(p / .5) : 1 - enOut((p - .5) / .5); return [lerp(-14, 14, q), -8 * q]; };
    F.pieI = pie(0); F.pieD = pie(420);
    // la llama del cirio parpadea como la de la vela y, justo antes de andar, se inclina hasta el primer paso
    F.llamaNaz = llamaM(reloj, andando ? 1 : portada ? paso((tv - T.anda + 400) / 400) : 1, tw);
    var pe = (reloj % 4000) / 4000, es = enOut(pe < .5 ? pe * 2 : 2 - pe * 2);
    F.estrellaK = 1 + .08 * es; F.estrella = new DOMMatrix().scale(F.estrellaK); F.estrellaA = .85 + .15 * es;
    if (portada) {
      F.halo = tv < 0 ? 0 : suave(cl(tv / 1200));
      F.llamaVela = tv < 0 ? null : new DOMMatrix().translate(0, 4).scale(Math.max(0, salta(cl(tv / 900)))).translate(0, -4).multiply(llamaM(reloj, 0, 0));
      F.llamaVelaA = cl(tv / 250);
      // destello (1,1 s, en su punto al 45 %) que tapa el cambio de llama
      var pbr = (tv - T.brillo) / T.dbr, ob = 0;
      if (pbr > 0 && pbr < 1) { var ee = enOut(pbr); ob = ee < .45 ? ee / .45 : (1 - ee) / .55; }
      ob = Math.round(ob * 100) / 100;
      if (ob !== brilloO) { brillo.style.opacity = ob; brilloO = ob; }
      if (!claseTexto && tv >= T.texto) {
        claseTexto = true; sec.classList.add('is-texto');
        // quien la encendió con el teclado sigue en el título, que ya se ve
        if (boton && !boton.hidden) { if (document.activeElement === boton) { var tit = sec.querySelector('#vela-t'); if (tit) tit.focus({ preventScroll: true }); } boton.hidden = true; }
      }
    }
    F.cache = !portada || tv >= FIN_ZOOM;
    if (portada && F.cache && !claseCielo) { claseCielo = true; sec.classList.add('is-cielo'); }
  }
  // frases: cada 3,6 s se va una y entra la siguiente (0,8 s de fundido); se miran cinco veces por segundo, no en cada fotograma
  function frases() {
    if (!andando || !frase || !FR.length) return;
    var tw = tiempoAndar(), i = Math.floor(tw / T.frase), dentro = tw - i * T.frase >= 800, idx = i % FR.length;
    if (dentro && fraseI !== idx) { frase.textContent = FR[idx]; fraseI = idx; }
    var o = dentro ? 1 : 0; if (o !== fraseO) { frase.style.opacity = o; fraseO = o; }
  }
  function dibuja() {
    if (!W || !H) return;
    var tv = F.tv;
    ponAndar(F.cache && !!ANIM);
    if (andar) return; // andando, las piezas se mueven solas
    c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.clearRect(0, 0, lienzo.width, lienzo.height);
    if (portada && tv < T.cruce + T.dcr) { // aún se ve la vela
      if (tv >= T.cruce) escena2(0);
      var q1 = tv < T.zoom1 ? 0 : entra(cl((tv - T.zoom1) / T.dz1));
      escena1(q1, tv < T.cruce ? 1 : 1 - (tv - T.cruce) / T.dcr);
      return;
    }
    escena2(portada && tv < FIN_ZOOM ? (tv < T.zoom2 ? 0 : sale(cl((tv - T.zoom2) / T.dz2))) : 1);
  }
  function escena1(q, a) {
    var l = L.vela; if (!l) return;
    enEscena(c, null); c.globalAlpha = a; c.fillStyle = col.bg; c.fillRect(0, 0, W, H);
    var f = punto(l, 180, 79), K = LLAMA_PANT * H / (54 * l.s), cam = q > 0 ? camara(f, K, q) : null;
    capa('vela', cam, a);
  }
  function escena2(q) { // q: 0, pegada a la llama del cirio; 1, la calle entera
    var cam = null;
    if (q < 1) {
      var l = L.naz, f = punto(l, 62, 82.1), K = LLAMA_PANT * H / (54 * .778 * l.s);
      cam = camara(f, K, 1 - q); cielo(cam);
    }
    capa('estrella', cam, 1); capa('calle', cam, 1); capa('naz', cam, 1);
  }

  // ---------- bucle: solo mientras hace falta, con la escena a la vista y la pestaña delante ----------
  // Hace falta para la vela y el zoom, para la rampa de arranque y, si no hay piezas sueltas, para andar en el lienzo grande.
  var visible = false, raf = 0, ultimo = 0, tic = 0;
  var corre = function () { return visible && !document.hidden; };
  var falta = function () { return encendida && (!andando || rampa < 1 || !ANIM); };
  function bucle(ahora) {
    raf = 0;
    var dt = ultimo ? Math.min(ahora - ultimo, 64) : 16; ultimo = ahora; reloj += dt;
    avanza(dt); dibuja();
    if (corre() && falta()) raf = requestAnimationFrame(bucle); else ultimo = 0;
  }
  function arranca() { if (!raf && corre() && falta()) { ultimo = 0; raf = requestAnimationFrame(bucle); } }
  function repinta() { avanza(0); dibuja(); }
  // con la escena fuera de la vista o la pestaña oculta, todo se para (y sigue donde estaba al volver)
  function ritmo() {
    var si = corre();
    if (ANIM) ANIM.forEach(function (a) { if (si) a.play(); else a.pause(); });
    if (ESTA) { if (si) ESTA.play(); else ESTA.pause(); }
    if (si && andando && !tic) { frases(); tic = setInterval(frases, 200); } else if ((!si || !andando) && tic) { clearInterval(tic); tic = 0; }
    arranca();
  }

  function enciende(ev) {
    if (encendida) return;
    encendida = true; tEnc = reloj; sec.classList.add('is-encendida');
    // con el ratón o el dedo, el botón se va al apagarse el aviso; con el teclado (Intro o espacio: detail 0) se queda con el
    // foco, sin verse, hasta que aparecen los textos y el foco pasa al título. Con VoiceOver el toque puede llegar con detail 1:
    // si el botón tenía el foco, pasa ya al título (está en la página, aún sin verse) y el lector no se queda sin sitio.
    // Safari no da el foco a un <button> al tocarlo (y el cursor de VoiceOver no es el foco del DOM): lo deja en <body> o en
    // el primer antecesor que admite foco, main#contenido (tabindex="-1"). Si el toque viene del propio botón y el foco está en
    // uno de esos, un antecesor de la sección, también pasa al título; lo que se haya enfocado a propósito fuera de ella se queda
    if (!ev || ev.detail !== 0) {
      var ae = document.activeElement, delBoton = ev && ev.target && boton.contains(ev.target);
      var suelto = !ae || ae === document.body || (ae.contains && ae.contains(sec));
      var tit = (ae === boton || (delBoton && suelto)) && sec.querySelector('#vela-t');
      if (tit) tit.focus({ preventScroll: true }); else boton.blur();
      setTimeout(function () { boton.hidden = true; }, 550);
    }
    arranca();
  }
  // al irse a «Próxima Semana Santa», allí la calle sigue por donde iba (u: lo que mide aquí una unidad de la calle, en px)
  function guarda() { if (!andando) return; try { sessionStorage.setItem('oc-vela', JSON.stringify({ w: tiempoAndar(), t: Date.now(), u: L.calle ? L.calle.s : 0 })); } catch (e) {} }
  // Llegando de la portada a «Próxima», donde la escena es más baja y la calle más pequeña, la transición entre páginas encaja
  // las dos escenas por abajo a la izquierda y lleva la calle de un tamaño al otro (portada.css, .oc-vela-vt). Solo si la
  // transición empieza después de este script (pagereveal), para no cambiarla a medias
  function acerca(uAntes) {
    var k = L.calle && L.calle.s > 0 ? uAntes / L.calle.s : 1;
    if (!(k > 0) || Math.abs(k - 1) < .004) return;
    raiz.style.setProperty('--vela-vt-k', k.toFixed(4)); raiz.style.setProperty('--vela-vt-s', (1 / k).toFixed(4));
    addEventListener('pagereveal', function (e) {
      if (!e.viewTransition) return;
      var fin = function () { raiz.classList.remove('oc-vela-vt'); };
      raiz.classList.add('oc-vela-vt'); e.viewTransition.finished.then(fin, fin);
    }, { once: true });
  }

  // ---------- arranque ----------
  function empieza() {
    prepara(); mide(); haceCache(); preparaAndar();
    if (!portada) {
      var w = 0;
      try { var v = JSON.parse(sessionStorage.getItem('oc-vela') || 'null'); if (v && Date.now() - v.t < 15000 && v.w > 0) { w = v.w; if (v.u > 0) acerca(v.u); } } catch (e) {}
      echaAndar(w);
    }
    repinta(); sec.classList.add('is-lienzo');
    if (boton) {
      boton.addEventListener('click', enciende);
      // como en el prototipo, un toque en cualquier punto de la escena también la enciende (menos en un enlace)
      esc.addEventListener('click', function (ev) { if (!encendida && ev.target !== boton && !boton.contains(ev.target) && !(ev.target.closest && ev.target.closest('a'))) enciende(ev); });
    }
    if (portada) { var b = sec.querySelector('.oc-vela-btn'); if (b) b.addEventListener('click', guarda); addEventListener('pagehide', guarda); }
    if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { visible = e[e.length - 1].isIntersecting; ritmo(); }, { rootMargin: '80px 0px' }).observe(esc);
    else { visible = true; ritmo(); }
    document.addEventListener('visibilitychange', ritmo);
    var pend = 0, rehace = function () { pend = 0; mide(); haceCache(); preparaAndar(); repinta(); };
    if ('ResizeObserver' in window) new ResizeObserver(function () { if (!pend) pend = requestAnimationFrame(rehace); }).observe(esc);
    else addEventListener('resize', function () { if (!pend) pend = requestAnimationFrame(rehace); });
    // de día en el modo claro y de noche en el oscuro, también si se cambia con la escena a la vista
    var retema = function () { prepara(); haceCache(); preparaAndar(); repinta(); };
    if (window.matchMedia) { var mq = matchMedia('(prefers-color-scheme: dark)'); if (mq.addEventListener) mq.addEventListener('change', retema); else if (mq.addListener) mq.addListener(retema); }
    if ('MutationObserver' in window) new MutationObserver(retema).observe(raiz, { attributes: true, attributeFilter: ['data-theme'] });
    // el año de la estrella va con la letra de los titulares: se vuelve a pintar cuando llega
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { preparaAndar(); repinta(); });
    arranca();
  }
  try { empieza(); } catch (e) { quitaAndar(); raiz.classList.remove('oc-vela-js'); sec.classList.remove('is-lienzo', 'is-andar'); if (window.console) console.warn('vela', e); }
})();
