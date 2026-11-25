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
  var T = { zoom1: 1300, dz1: 1500, brillo: 2450, dbr: 1100, cruce: 2800, dcr: 300, zoom2: 3100, dz2: 2600, anda: 5200, texto: 5300, rampa: 900, frase: 3600 };
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
  function llamaM(t, inclina) {
    var a = kf(TB, (t % 2800) / 2800), b = kf(LN, (t % 1600) / 1600);
    return new DOMMatrix().translate(0, 4).scale(lerp(a[0], b[0], inclina), lerp(a[1], b[1], inclina)).skewX(lerp(a[2], b[2], inclina)).translate(0, -4);
  }

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
        n.hijos.push({ hijos: usos[id].hijos, o: 1, m: new DOMMatrix().translate(parseFloat(k.getAttribute('x')) || 0, parseFloat(k.getAttribute('y')) || 0) }); ult = null;
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
    calle = busca(arbol.calle, 'calle');
  }
  function busca(n, capa) { if (!n) return null; if (n.capa === capa) return n; for (var i = 0; i < n.hijos.length; i++) if (n.hijos[i].hijos) { var r = busca(n.hijos[i], capa); if (r) return r; } return null; }

  // ---------- medidas: dónde cae cada capa en la escena ----------
  var W = 0, H = 0, dpr = 1, L = {}, calle = null;
  function mide() {
    var r = esc.getBoundingClientRect();
    W = r.width; H = r.height; dpr = Math.min(window.devicePixelRatio || 1, 2);
    lienzo.width = Math.max(1, Math.round(W * dpr)); lienzo.height = Math.max(1, Math.round(H * dpr));
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

  // ---------- pintar ----------
  var F = {}; // lo que se mueve en este fotograma
  var mx = function (x, m) { x.transform(m.a, m.b, m.c, m.d, m.e, m.f); };
  function capaAhora(n) {
    switch (n.capa) {
      case 'calle': return { m: new DOMMatrix().translate(-(F.calle % n.vuelta), 0) };
      case 'suelo': return { m: new DOMMatrix().translate(-(F.suelo % n.vuelta), 0) };
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
  function pinta(x, n, a) {
    var r = n.capa ? capaAhora(n) : null; if (r === false) return;
    var al = a * n.o * (r && r.a != null ? r.a : 1); if (al < .002) return;
    x.save();
    if (n.m) mx(x, n.m);
    if (n.capa === 'calle' && F.cache && cache) { x.restore(); calleCache(x); return; }
    if (r && r.m) mx(x, r.m);
    pintaHijos(x, n, al);
    x.restore();
  }
  function pintaHijos(x, n, al) {
    for (var i = 0; i < n.hijos.length; i++) { var h = n.hijos[i]; if (h.hijos) pinta(x, h, al); else if (h.txt != null) letra(x, h, al); else forma(x, h, al); }
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
  var reloj = 0, tEnc = 0, tAnda = 0, arrastre = 0, encendida = !portada, andando = false;
  var claseCielo = false, claseTexto = !portada, fraseI = -1, fraseO = -1, brilloO = 0;
  function avanza() {
    var tv = portada ? (encendida ? reloj - tEnc : -1) : 1e9;
    if (portada && !andando && tv >= T.anda) { andando = true; tAnda = tEnc + T.anda; }
    var tw = andando ? reloj - tAnda + arrastre : 0, R = T.rampa, xr = cl(tw / R);
    // camino recorrido: arranca poco a poco y sigue a 36 unidades por segundo la calle y a 16 el suelo
    var d = andando ? (tw < R ? R * (xr * xr * xr - xr * xr * xr * xr / 2) : tw - R / 2) : 0;
    F.tv = tv; F.tw = tw; F.andar = andando ? paso(xr) : 0;
    F.calle = d * .036; F.suelo = d * .016;
    // paso: el cuerpo sube y baja con cada pisada y los zapatos se alternan (prototipo: .42 s y .84 s)
    var pb = (tw % 840) / 420, e = enOut(pb < 1 ? pb : 2 - pb); F.bote = -10 * e * F.andar;
    var pie = function (fase) { var p = ((tw + fase) % 840) / 840, q = p < .5 ? enOut(p / .5) : 1 - enOut((p - .5) / .5); return [lerp(-14, 14, q) * F.andar, -8 * q * F.andar]; };
    F.pieI = pie(0); F.pieD = pie(420);
    F.llamaNaz = llamaM(reloj, F.andar);
    var pe = (reloj % 4000) / 4000, es = enOut(pe < .5 ? pe * 2 : 2 - pe * 2);
    F.estrella = new DOMMatrix().scale(1 + .08 * es); F.estrellaA = .85 + .15 * es;
    if (portada) {
      F.halo = tv < 0 ? 0 : suave(cl(tv / 1200));
      F.llamaVela = tv < 0 ? null : new DOMMatrix().translate(0, 4).scale(Math.max(0, salta(cl(tv / 900)))).translate(0, -4).multiply(llamaM(reloj, 0));
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
    // frases: cada 3,6 s se va una y entra la siguiente (0,8 s de fundido)
    if (andando && frase && FR.length) {
      var i = Math.floor(tw / T.frase), dentro = tw - i * T.frase >= 800, idx = i % FR.length;
      if (dentro && fraseI !== idx) { frase.textContent = FR[idx]; fraseI = idx; }
      var o = dentro ? 1 : 0; if (o !== fraseO) { frase.style.opacity = o; fraseO = o; }
    }
  }
  function dibuja() {
    if (!W || !H) return;
    c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.clearRect(0, 0, lienzo.width, lienzo.height);
    var tv = F.tv;
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

  // ---------- bucle: solo con la escena a la vista y la pestaña delante ----------
  var visible = false, raf = 0, ultimo = 0;
  var anima = function () { return encendida && visible && !document.hidden; };
  function bucle(ahora) {
    raf = 0;
    var dt = ultimo ? Math.min(ahora - ultimo, 64) : 16; ultimo = ahora; reloj += dt;
    avanza(); dibuja();
    if (anima()) raf = requestAnimationFrame(bucle); else ultimo = 0;
  }
  function arranca() { if (!raf && anima()) { ultimo = 0; raf = requestAnimationFrame(bucle); } }
  function repinta() { avanza(); dibuja(); }

  function enciende(ev) {
    if (encendida) return;
    encendida = true; tEnc = reloj; sec.classList.add('is-encendida');
    // con el ratón o el dedo, el botón se va al apagarse el aviso; con el teclado (Intro o espacio: detail 0) se queda con el
    // foco, sin verse, hasta que aparecen los textos y el foco pasa al título
    if (!ev || ev.detail !== 0) { boton.blur(); setTimeout(function () { boton.hidden = true; }, 550); }
    arranca();
  }
  // al irse a «Próxima Semana Santa», allí la calle sigue por donde iba
  function guarda() { if (!andando) return; try { sessionStorage.setItem('oc-vela', JSON.stringify({ w: reloj - tAnda + arrastre, t: Date.now() })); } catch (e) {} }

  // ---------- arranque ----------
  function empieza() {
    prepara(); mide(); haceCache();
    if (!portada) {
      try { var v = JSON.parse(sessionStorage.getItem('oc-vela') || 'null'); if (v && Date.now() - v.t < 15000 && v.w > 0) arrastre = v.w; } catch (e) {}
      andando = true; tAnda = 0;
    }
    repinta(); sec.classList.add('is-lienzo');
    if (boton) {
      boton.addEventListener('click', enciende);
      // como en el prototipo, un toque en cualquier punto de la escena también la enciende (menos en un enlace)
      esc.addEventListener('click', function (ev) { if (!encendida && ev.target !== boton && !boton.contains(ev.target) && !(ev.target.closest && ev.target.closest('a'))) enciende(ev); });
    }
    if (portada) { var b = sec.querySelector('.oc-vela-btn'); if (b) b.addEventListener('click', guarda); addEventListener('pagehide', guarda); }
    if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { visible = e[e.length - 1].isIntersecting; arranca(); }, { rootMargin: '80px 0px' }).observe(esc);
    else visible = true;
    document.addEventListener('visibilitychange', arranca);
    var pend = 0, rehace = function () { pend = 0; mide(); haceCache(); repinta(); };
    if ('ResizeObserver' in window) new ResizeObserver(function () { if (!pend) pend = requestAnimationFrame(rehace); }).observe(esc);
    else addEventListener('resize', function () { if (!pend) pend = requestAnimationFrame(rehace); });
    // de día en el modo claro y de noche en el oscuro, también si se cambia con la escena a la vista
    var retema = function () { prepara(); haceCache(); repinta(); };
    if (window.matchMedia) { var mq = matchMedia('(prefers-color-scheme: dark)'); if (mq.addEventListener) mq.addEventListener('change', retema); else if (mq.addListener) mq.addListener(retema); }
    if ('MutationObserver' in window) new MutationObserver(retema).observe(raiz, { attributes: true, attributeFilter: ['data-theme'] });
    // el año de la estrella va con la letra de los titulares: se vuelve a pintar cuando llega
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(repinta);
    arranca();
  }
  try { empieza(); } catch (e) { raiz.classList.remove('oc-vela-js'); sec.classList.remove('is-lienzo'); if (window.console) console.warn('vela', e); }
})();
