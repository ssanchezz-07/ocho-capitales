/* Ocho Capitales · plano ligero para la portada: la misma ciudad de «En la calle» (calles de OpenStreetMap en metros,
   recorridos oficiales y posición estimada de cada cortejo), solo para mirar. Se carga al tocar una bandera.
   La interacción completa (ficha, ruta, ubicación) sigue en assets/calle.js. */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var el = function (t, a, padre) { var n = document.createElementNS(NS, t); for (var k in a || {}) n.setAttribute(k, a[k]); if (padre) padre.appendChild(n); return n; };
  // Encuadre de la foto en el punto redondo: el mismo foco (object-position) que su miniatura en el resto de la web
  var encuadre = function (h, r) {
    var d = 2 * r; if (!h.f || !h.ar) return { x: -r, y: -r, width: d, height: d };
    var f = String(h.f).split(' '), px = parseFloat(f[0]) / 100, py = parseFloat(f[1]) / 100, w = h.ar < 1 ? d : d * h.ar, hh = h.ar < 1 ? d / h.ar : d;
    return { x: +(-r - px * (w - d)).toFixed(2), y: +(-r - py * (hh - d)).toFixed(2), width: +w.toFixed(2), height: +hh.toFixed(2) };
  };
  var hhmm = function (m) { m = ((Math.round(m) % 1440) + 1440) % 1440; return ('0' + Math.floor(m / 60)).slice(-2) + ':' + ('0' + (m % 60)).slice(-2); };
  var ruta = function (h) { return h.t.paso || h.t.cruz; };
  function enTramo(pts, t) {
    if (!pts || !pts.length) return null;
    if (t < pts[0][2]) return { x: pts[0][0], y: pts[0][1], i: 0, estado: 'antes' };
    var n = pts.length - 1;
    if (t >= pts[n][2]) return { x: pts[n][0], y: pts[n][1], i: n, estado: 'despues' };
    for (var i = 0; i < n; i++) { var a = pts[i], b = pts[i + 1]; if (t >= a[2] && t <= b[2]) { var k = b[2] === a[2] ? 0 : (t - a[2]) / (b[2] - a[2]); return { x: a[0] + (b[0] - a[0]) * k, y: a[1] + (b[1] - a[1]) * k, i: i, estado: 'calle' }; } }
    return null;
  }
  function estado(h, T) { var p = enTramo(ruta(h), T), c = h.t.cruz ? enTramo(h.t.cruz, T) : null; if (!p) return 'fuera'; return (c && c.estado === 'calle') || p.estado === 'calle' ? 'calle' : p.estado; }
  function limites(hs) { var a = Infinity, b = -Infinity; hs.forEach(function (h) { var p = ruta(h); a = Math.min(a, p[0][2]); b = Math.max(b, p[p.length - 1][2]); }); return [a, b]; }
  // La hora con más cofradías en la calle: es la que mejor enseña una jornada que aún no ha llegado
  function horaPico(hs) {
    var L = limites(hs), mejor = L[0], n0 = -1;
    for (var t = L[0]; t <= L[1]; t += 10) { var n = 0; hs.forEach(function (h) { if (estado(h, t) === 'calle') n++; }); if (n > n0) { n0 = n; mejor = t; } }
    return mejor;
  }
  // Cielo según la hora: tarde dorada, noche de terciopelo, Madrugá azul y amanecer. Cambia solo cuando cambia la hora.
  var CIELO = [[0, [26, 14, 44]], [17 * 60, [74, 46, 72]], [19 * 60, [58, 30, 70]], [21 * 60, [31, 15, 47]], [24 * 60, [22, 12, 40]], [27 * 60, [14, 16, 44]], [30 * 60, [40, 30, 66]], [31.5 * 60, [92, 66, 86]]];
  function cielo(T) {
    var t = T < 12 * 60 ? T + 1440 : T, a = CIELO[0], b = CIELO[CIELO.length - 1];
    if (t < CIELO[1][0]) { a = b = CIELO[1]; }
    for (var i = 1; i < CIELO.length - 1; i++) if (t >= CIELO[i][0] && t <= CIELO[i + 1][0]) { a = CIELO[i]; b = CIELO[i + 1]; break; }
    var k = b[0] === a[0] ? 0 : Math.min(1, Math.max(0, (t - a[0]) / (b[0] - a[0])));
    var c = a[1].map(function (v, j) { return Math.round(v + (b[1][j] - v) * k); });
    return { fondo: 'rgb(' + c.join(' ') + ')', noche: t >= 21 * 60 && t <= 30 * 60 ? 1 : t > 19 * 60 && t < 21 * 60 ? (t - 19 * 60) / 120 : 0 };
  }
  function pathDe(ls) { var d = ''; for (var i = 0; i < ls.length; i++) { var l = ls[i]; d += 'M' + l[0] + ' ' + l[1]; for (var j = 2; j < l.length; j += 2) d += 'L' + l[j] + ' ' + l[j + 1]; } return d; }
  var PAL = ['#e0b84f', '#e8735a', '#5fb3d9', '#9c7ce0', '#6cc58a', '#e86fa6', '#f09a3e', '#4fc7c0', '#c9d36a', '#d98bd9', '#7fa2f0', '#e5c07b'];

  // Mismo tono en la misma jornada (hay muchos morados y negros): las siguientes se separan en luz y un poco de tono
  function variar(hex, k) {
    var r = parseInt(hex.slice(1, 3), 16) / 255, g = parseInt(hex.slice(3, 5), 16) / 255, b = parseInt(hex.slice(5, 7), 16) / 255;
    var mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn, s = d ? d / (1 - Math.abs(2 * l - 1)) : 0, h = 0;
    if (d) h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60;
    var paso = [[0, 0], [0.13, 10], [-0.13, -10], [0.22, -18], [-0.2, 18]][k % 5]; l = Math.min(0.88, Math.max(0.42, l + paso[0])); h = (h + paso[1] + 360) % 360;
    var c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2, q = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
    return '#' + q.map(function (v) { return ('0' + Math.round((v + m) * 255).toString(16)).slice(-2); }).join('');
  }
  // recuadro de un trazado (solo M, m, L, l, como los genera build.mjs), para no pintar en el canvas lo que cae fuera de la vista
  function cajaDe(d) {
    var t = d.match(/[MmLl]|-?\d*\.?\d+(?:e-?\d+)?/g) || [], c = 'M', x = 0, y = 0, b = [Infinity, Infinity, -Infinity, -Infinity];
    for (var i = 0; i < t.length; i++) {
      if (/[MmLl]/.test(t[i])) { c = t[i]; continue; }
      var a = +t[i], o = +t[++i]; if (c === 'M' || c === 'L') { x = a; y = o; } else { x += a; y += o; }
      if (c === 'M') c = 'L'; else if (c === 'm') c = 'l';
      if (x < b[0]) b[0] = x; if (y < b[1]) b[1] = y; if (x > b[2]) b[2] = x; if (y > b[3]) b[3] = y;
    }
    return b;
  }
  var mascara = null; // lienzo auxiliar del desvanecido de las calles: uno para todos los planos
  function Plano(host, D, o) {
    o = o || {};
    // Dos capas con la misma vista: abajo lo fijo (calles y recorridos) y arriba lo que se mueve (cortejos y medallones).
    // Al cambiar la hora solo se repinta la de arriba; repintar miles de calles en cada paso daba tirones.
    // Las dos van dentro de una capa HTML un 50 % mayor que el plano (margen ya pintado), con el origen de su transform en la esquina
    // del plano: al pellizcar, arrastrar, girar la rueda o en las animaciones de zoom, la capa se desplaza y escala (lo hace la GPU)
    // y el plano se vuelve a pintar una sola vez al parar. Antes se repintaba en cada fotograma (calles con máscaras incluidas).
    var mueve = document.createElement('div'); mueve.className = 'oc-pl-mueve'; host.appendChild(mueve);
    var base = el('svg', { 'class': 'oc-pl-svg oc-pl-base', 'aria-hidden': 'true', focusable: 'false' }, mueve);
    var svg = el('svg', { 'class': 'oc-pl-svg oc-pl-capa', role: 'img', 'aria-label': 'Plano de ' + D.nombre + ' con los recorridos de la jornada' }, mueve);
    var mundo = el('g', {}, base);
    // crédito de OpenStreetMap a la vista (lo pide su licencia, ODbL), arriba a la derecha: como en «En la calle»
    var cred = document.createElement('p'); cred.className = 'oc-pl-osm'; cred.innerHTML = 'Plano: <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">© colaboradores de OpenStreetMap</a>'; host.appendChild(cred);
    // Fondo fiel (si el plano lo trae, tools/itinerarios/fondo-osm.mjs): agua, ríos, costa, playas, parques y plazas debajo de las calles
    var A = D.areas || {}, poli = function (ls) { var d = ''; (ls || []).forEach(function (l) { d += pathDe([l]) + 'Z'; }); return d; };
    [['oc-c-agua', poli(A.agua)], ['oc-c-playa', poli(A.playas)], ['oc-c-parque', poli(A.parques)], ['oc-c-plaza', poli(A.plazas)], ['oc-c-rio', D.rios ? pathDe(D.rios) : ''], ['oc-c-costa', D.costa ? pathDe(D.costa) : '']]
      .forEach(function (c) { if (c[1]) mundo.appendChild(el('path', { 'class': c[0], d: c[1] })); });
    // calles menores: ya vienen como trazado por celdas de 1 km (build.mjs, celdasCalles); el navegador solo pinta las que se ven
    var gFuera = null, gCalles = el('g', {}, mundo); (D.calles || []).forEach(function (d) { el('path', { 'class': 'oc-pl-calles', d: typeof d === 'string' ? d : pathDe([d]) }, gCalles); });
    // Con fondo de afueras (solo carreteras), las calles menores del centro se desvanecen en su borde (el 15 % del lado, 700 m como poco): si no, su recuadro
    // se veía con bordes rectos sobre la red de carreteras. Dos máscaras de degradado (ancho y alto), sin desenfoque: baratas.
    if (D.limCentro) {
      var L = D.limCentro, idm = 'oc-pl-c-' + (D.ciudad || 'x'), defs = el('defs', {}, base), fx = Math.min(0.45, Math.max(0.15, 700 / Math.max(1, L[2] - L[0]))), fy = Math.min(0.45, Math.max(0.15, 700 / Math.max(1, L[3] - L[1])));
      // alrededor de cada sede su barrio se ve entero, aunque caiga en el desvanecido (un círculo suave de 700 m)
      // (solo las que están en la banda del desvanecido o a menos de 700 m de ella: cada círculo cuesta al pintar)
      var bx = fx * (L[2] - L[0]) + 700, by = fy * (L[3] - L[1]) + 700, circulos = [];
      (D.sedes || []).forEach(function (h) { [h.tp, h.cs].forEach(function (q) { if (q && q[0] > L[0] - 700 && q[0] < L[2] + 700 && q[1] > L[1] - 700 && q[1] < L[3] + 700 && (q[0] - L[0] < bx || L[2] - q[0] < bx || q[1] - L[1] < by || L[3] - q[1] < by)) circulos.push(q); }); });
      [['x', L[0], 0, L[2], 0, fx], ['y', 0, L[1], 0, L[3], fy]].forEach(function (g) {
        var lg = el('linearGradient', { id: idm + g[0] + 'g', gradientUnits: 'userSpaceOnUse', x1: g[1], y1: g[2], x2: g[3], y2: g[4] }, defs);
        [[0, 0], [g[5], 1], [1 - g[5], 1], [1, 0]].forEach(function (st) { el('stop', { offset: st[0], 'stop-color': '#fff', 'stop-opacity': st[1] }, lg); });
        var mk = el('mask', { id: idm + g[0], maskUnits: 'userSpaceOnUse', x: L[0], y: L[1], width: L[2] - L[0], height: L[3] - L[1] }, defs);
        el('rect', { x: L[0], y: L[1], width: L[2] - L[0], height: L[3] - L[1], fill: 'url(#' + idm + g[0] + 'g)' }, mk);
        circulos.forEach(function (q) { el('circle', { cx: q[0], cy: q[1], r: 700, fill: 'url(#' + idm + 'r)' }, mk); });
      });
      var rg = el('radialGradient', { id: idm + 'r' }, defs); [[0, 1], [0.55, 1], [1, 0]].forEach(function (st) { el('stop', { offset: st[0], 'stop-color': '#fff', 'stop-opacity': st[1] }, rg); });
      var gMx = el('g', { mask: 'url(#' + idm + 'x)' }), gMy = el('g', { mask: 'url(#' + idm + 'y)' }, gMx);
      mundo.insertBefore(gMx, gCalles); gMy.appendChild(gCalles);
      // las calles de barrio de las sedes apartadas, fuera del centro: sin máscara
      gFuera = el('g', {}); mundo.insertBefore(gFuera, gMx.nextSibling); (D.callesFuera || []).forEach(function (d) { el('path', { 'class': 'oc-pl-calles', d: d }, gFuera); });
    }
    el('path', { 'class': 'oc-pl-princ', d: pathDe(D.principales) }, mundo);
    // templos y casas hermandad, como edificios encima de las calles (sus nombres los rotula el plano)
    if (A.edificios) { mundo.appendChild(el('path', { 'class': 'oc-c-templo', d: poli(A.edificios.filter(function (e) { return e.c === 'templo'; }).map(function (e) { return e.p; })) })); mundo.appendChild(el('path', { 'class': 'oc-c-casa', d: poli(A.edificios.filter(function (e) { return e.c === 'casa'; }).map(function (e) { return e.p; })) })); }
    // ---- Fondo en <canvas>: calles, agua, parques, arterias y edificios ----
    // Safari (iPhone) vuelve a pintar un SVG entero cada vez que cambia su escala (para que se vea nítido): con miles de calles,
    // pellizcar daba tirones aunque la capa se moviera con transform. Un canvas es una imagen: se escala sin repintarse. Se pinta
    // al fijar la vista, con los colores del CSS (leídos de los mismos elementos SVG, que siguen ahí para el vuelo de la portada:
    // durante el vuelo se ve el SVG, como antes; fuera de él, el canvas).
    var fondoSvg = el('g', { 'class': 'oc-pl-fondo-svg' }); while (mundo.firstChild) fondoSvg.appendChild(mundo.firstChild); mundo.appendChild(fondoSvg);
    var cvs = [0, 1, 2].map(function (i) { var n = document.createElement('canvas'); n.className = 'oc-pl-cv' + (i === 1 ? ' oc-pl-cv-calles' : ''); n.setAttribute('aria-hidden', 'true'); mueve.insertBefore(n, base); return n; });
    var trazos = [[], [], []], conPath2D = typeof Path2D === 'function';
    if (conPath2D) {
      Array.prototype.forEach.call(fondoSvg.querySelectorAll('path'), function (p) {
        var c = p.getAttribute('class') || '', i = c === 'oc-pl-calles' ? 1 : /oc-pl-princ|oc-c-templo|oc-c-casa/.test(c) ? 2 : 0;
        trazos[i].push({ el: p, p: null, b: null, fuera: !!(gFuera && p.parentNode === gFuera) }); // el trazado y su recuadro, al pintar por primera vez (crear el plano retrasaba el vuelo)
      });
    }
    var gR = el('g', {}, mundo), capa = el('g', {}, svg), gE = el('g', { 'class': 'oc-pl-etq', 'aria-hidden': 'true' }, capa), gC = el('g', {}, capa), gM = el('g', {}, capa), estados = {};
    var lim = [Infinity, Infinity, -Infinity, -Infinity];
    D.principales.forEach(function (l) { for (var i = 0; i < l.length; i += 2) { lim[0] = Math.min(lim[0], l[i]); lim[1] = Math.min(lim[1], l[i + 1]); lim[2] = Math.max(lim[2], l[i]); lim[3] = Math.max(lim[3], l[i + 1]); } });
    var vb = { x: lim[0], y: lim[1], w: lim[2] - lim[0], h: lim[3] - lim[1] }, Z = 1, T = 0, hs = [], marcas = {}, anim = 0;
    var api = { svg: svg };
    var W = function () { return Math.max(1, host.clientWidth); }, H = function () { return Math.max(1, host.clientHeight); };
    // Lo que tiene fondo dibujado (calles y arterias; build.mjs lo manda en «lim»): la cámara nunca enseña más allá,
    // ni al alejar ni al arrastrar, para que no asome morado vacío alrededor del plano (Pablo, 8-nov).
    // Durante el vuelo desde el mapa de Andalucía (con la provincia debajo) la cámara va libre.
    var F = D.lim && D.lim.length === 4 ? D.lim : lim;
    // Con las sedes a la vista, alejar como mucho 1,6 veces lo que ocupan todas (alejar más solo enseñaba campo). Se guarda su
    // recuadro y los márgenes, y el tope se calcula con el tamaño de ahora (si se gira el móvil, cambia con él)
    var cajaSedes = null;
    function tope() {
      if (!cajaSedes || gS.style.display === 'none') return Infinity;
      var c = cajaSedes, iw = Math.max(60, W() - c.m.izq - c.m.der), ih = Math.max(60, H() - c.m.arriba - c.m.abajo);
      return 1.6 * W() * Math.max(Math.max(c.w, 300) / iw, Math.max(c.h, 300) / ih) * 1.04;
    }
    function maxAncho() { return Math.max(250, Math.min(F[2] - F[0], (F[3] - F[1]) * W() / H(), tope())); }
    function limitar(c) {
      var w = Math.min(c.w, maxAncho()), h = w * H() / W(), cx = c.x + c.w / 2, cy = c.y + c.w * H() / W() / 2;
      cx = Math.min(Math.max(cx, F[0] + w / 2), F[2] - w / 2); cy = Math.min(Math.max(cy, F[1] + h / 2), F[3] - h / 2);
      return { x: cx - w / 2, y: cy - h / 2, w: w };
    }
    // libre: durante el vuelo de la portada (ida y vuelta a Andalucía) la cámara la lleva site.js con fijar(c, true)
    var enVuelo = false, libre = function () { return enVuelo || !!(provEl && provEl.getAttribute('d')); };
    function aplicar(centro) {
      var cy = vb.y + vb.h / 2; vb.h = vb.w * H() / W(); if (centro) vb.y = cy - vb.h / 2;
      if (!libre()) { var c = limitar(vb); vb.x = c.x; vb.y = c.y; vb.w = c.w; vb.h = vb.w * H() / W(); }
      if (lejanas) pista();
      Z = vb.w / W(); fijarVista();
    }
    // pinta la vista (con su margen del 25 % por cada lado) y la deja sin transform
    var vbC = null, tVista = 0;
    function fijarVista() {
      clearTimeout(tVista); vbC = { x: vb.x, y: vb.y, w: vb.w, h: vb.h };
      var v = (vb.x - vb.w / 4).toFixed(1) + ' ' + (vb.y - vb.h / 4).toFixed(1) + ' ' + (vb.w * 1.5).toFixed(1) + ' ' + (vb.h * 1.5).toFixed(1);
      base.setAttribute('viewBox', v); svg.setAttribute('viewBox', v); mueve.style.transform = ''; colocar();
      if (enCanvas) pintarCanvas();
    }
    // modo canvas (normal) o modo SVG (durante el vuelo de la portada, que necesita ver la ciudad entera al alejarse)
    var enCanvas = false, colorPrinc = '', tNoche = 0;
    function modoCanvas(si) {
      si = !!si && conPath2D; if (si === enCanvas) return;
      enCanvas = si; mueve.classList.toggle('is-cv', si);
      if (si) { pintarCanvas(); if (!calm) { cvs[1].style.transition = 'none'; cvs[1].style.opacity = '0'; cvs[1].getBoundingClientRect(); cvs[1].style.transition = ''; cvs[1].style.opacity = ''; } }
    }
    function pintarCanvas(soloArriba) {
      var dpr = Math.min(2, window.devicePixelRatio || 1), pw = Math.round(W() * 1.5 * dpr), ph = Math.round(H() * 1.5 * dpr);
      var ax = vb.x - vb.w / 4, ay = vb.y - vb.h / 4, k = pw / (vb.w * 1.5), px = dpr / k; // k: píxeles del canvas por metro; px: un píxel de pantalla, en metros
      if (soloArriba && (cvs[2].width !== pw || cvs[2].height !== ph)) soloArriba = false;
      var ctxs = cvs.map(function (c, i) {
        if (soloArriba && i < 2) return null;
        if (c.width !== pw || c.height !== ph) { c.width = pw; c.height = ph; }
        var x = c.getContext('2d'); x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, pw, ph); x.setTransform(k, 0, 0, k, -ax * k, -ay * k); return x;
      });
      var estilos = {}; // uno por clase: hay cientos de celdas de calles con la misma
      var bx0 = ax - 12 * px, by0 = ay - 12 * px, bx1 = ax + vb.w * 1.5 + 12 * px, by1 = ay + vb.h * 1.5 + 12 * px;
      var pintar = function (x, t) {
        if (!t.p) { var d = t.el.getAttribute('d') || ''; t.p = new Path2D(d); t.b = cajaDe(d); }
        if (t.b[0] > bx1 || t.b[2] < bx0 || t.b[1] > by1 || t.b[3] < by0) return false;
        var cl = t.el.getAttribute('class') + (t.fuera ? ' f' : ''), cs = estilos[cl] || (estilos[cl] = getComputedStyle(t.el)); if (cs.display === 'none') return false;
        var op = parseFloat(cs.opacity); if (isNaN(op)) op = 1;
        if (cs.fill && cs.fill !== 'none') { x.globalAlpha = op * parseFloat(cs.fillOpacity || 1); x.fillStyle = cs.fill; x.fill(t.p, 'evenodd'); }
        if (cs.stroke && cs.stroke !== 'none') {
          var da = cs.strokeDasharray && cs.strokeDasharray !== 'none' ? cs.strokeDasharray.split(/[\s,]+/).map(function (v) { return parseFloat(v) * px; }) : [];
          x.globalAlpha = op * parseFloat(cs.strokeOpacity || 1); x.strokeStyle = cs.stroke; x.lineWidth = parseFloat(cs.strokeWidth) * px; x.setLineDash(da);
          x.lineCap = cs.strokeLinecap || 'butt'; x.lineJoin = cs.strokeLinejoin || 'miter'; x.stroke(t.p);
        }
        x.globalAlpha = 1; return true;
      };
      if (!soloArriba) pintarAbajo();
      trazos[2].forEach(function (t) { pintar(ctxs[2], t); });
      var pr = trazos[2][0]; colorPrinc = pr ? getComputedStyle(pr.el).stroke : '';
      function pintarAbajo() {
      trazos[0].forEach(function (t) { pintar(ctxs[0], t); });
      // calles del centro con su desvanecido (las dos máscaras: degradado y círculos de cada eje, multiplicadas) y luego las de fuera
      var x1 = ctxs[1], hay = false;
      trazos[1].forEach(function (t) { if (!t.fuera && pintar(x1, t)) hay = true; });
      if (hay && D.limCentro) {
        if (!mascara) mascara = document.createElement('canvas');
        if (mascara.width !== pw || mascara.height !== ph) { mascara.width = pw; mascara.height = ph; }
        var m = mascara.getContext('2d');
        [['x', L[0], 0, L[2], 0, fx], ['y', 0, L[1], 0, L[3], fy]].forEach(function (g) {
          m.setTransform(1, 0, 0, 1, 0, 0); m.clearRect(0, 0, pw, ph); m.setTransform(k, 0, 0, k, -ax * k, -ay * k);
          m.save(); m.beginPath(); m.rect(L[0], L[1], L[2] - L[0], L[3] - L[1]); m.clip();
          var lg = m.createLinearGradient(g[1], g[2], g[3], g[4]); [[0, 0], [g[5], 1], [1 - g[5], 1], [1, 0]].forEach(function (st) { lg.addColorStop(st[0], 'rgba(255,255,255,' + st[1] + ')'); });
          m.fillStyle = lg; m.fillRect(L[0], L[1], L[2] - L[0], L[3] - L[1]);
          circulos.forEach(function (q) { var r = m.createRadialGradient(q[0], q[1], 0, q[0], q[1], 700); [[0, 1], [0.55, 1], [1, 0]].forEach(function (st) { r.addColorStop(st[0], 'rgba(255,255,255,' + st[1] + ')'); }); m.fillStyle = r; m.beginPath(); m.arc(q[0], q[1], 700, 0, 2 * Math.PI); m.fill(); });
          m.restore();
          x1.save(); x1.setTransform(1, 0, 0, 1, 0, 0); x1.globalCompositeOperation = 'destination-in'; x1.drawImage(mascara, 0, 0); x1.restore();
        });
      }
      trazos[1].forEach(function (t) { if (t.fuera) pintar(x1, t); });
      }
    }
    // en caliente: la capa ya pintada se desplaza y escala hasta la vista de ahora; si no la cubre o se ha escalado mucho, se pinta ya.
    // Lo que va encima (medallones, sedes, rótulos) se escala con ella hasta que se pinta al parar (140 ms).
    function mover() {
      vb.h = vb.w * H() / W();
      if (!libre()) { var c = limitar(vb); vb.x = c.x; vb.y = c.y; vb.w = c.w; vb.h = vb.w * H() / W(); }
      if (!vbC || calm) return aplicar();
      var w = W(), h = H(), k = vbC.w / vb.w, tx = (vbC.x - vb.x) * w / vb.w, ty = (vbC.y - vb.y) * w / vb.w;
      var x0 = tx - k * w / 4, y0 = ty - k * h / 4, x1 = tx + k * w * 1.25, y1 = ty + k * h * 1.25;
      if (k < 0.5 || k > 2.5 || x0 > 0 || y0 > 0 || x1 < w || y1 < h) return aplicar();
      Z = vb.w / w; if (lejanas) pista();
      mueve.style.transform = 'translate(' + tx.toFixed(1) + 'px,' + ty.toFixed(1) + 'px) scale(' + k.toFixed(4) + ')';
      reescalar();
      clearTimeout(tVista); tVista = setTimeout(aplicar, 140);
    }
    // en caliente: sedes y medallones a su tamaño de pantalla (sin reagrupar); los rótulos de calles, ocultos hasta repintar
    function reescalar() {
      var f = Z <= 1.6 ? 1 : Math.max(0.6, 1 - (Z - 1.6) * 0.07), Zs = Z * f;
      simbolos.forEach(function (s) { if (s.g.style.visibility !== 'hidden' && s.g.hasAttribute('transform')) s.g.setAttribute('transform', 'translate(' + s.x.toFixed(1) + ' ' + s.y.toFixed(1) + ') scale(' + Zs.toFixed(3) + ')'); });
      for (var k in marcas) { var t = marcas[k].getAttribute('transform'); if (t) marcas[k].setAttribute('transform', t.replace(/scale\([^)]*\)/, 'scale(' + Z.toFixed(3) + ')')); }
      gE.style.display = 'none';
    }
    api.vista = function () { return { x: vb.x, y: vb.y, w: vb.w, h: vb.h }; };
    api.caja = function (xs, ys, m) {
      var x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs), y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys);
      var iw = Math.max(60, W() - m.izq - m.der), ih = Math.max(60, H() - m.arriba - m.abajo), e = Math.max(Math.max(x1 - x0, 300) / iw, Math.max(y1 - y0, 300) / ih) * 1.04;
      var w = W() * e, cx = (x0 + x1) / 2 - (m.izq - m.der) / 2 * e, cy = (y0 + y1) / 2 - (m.arriba - m.abajo) / 2 * e;
      return limitar({ x: cx - w / 2, y: cy - w * H() / W() / 2, w: w });
    };
    // Vuelo de cámara: parte de lo que se ve ahora (se puede interrumpir), el centro avanza en línea y la escala en exponencial
    api.volar = function (c, ms) {
      cancelAnimationFrame(anim);
      if (!libre()) c = limitar(c);
      if (calm || !ms) { vb.x = c.x; vb.y = c.y; vb.w = c.w; aplicar(); base.classList.remove('is-volando'); return; }
      var de = { cx: vb.x + vb.w / 2, cy: vb.y + vb.h / 2, w: vb.w }, a = { cx: c.x + c.w / 2, cy: c.y + c.w * H() / W() / 2, w: c.w }, t0 = performance.now();
      // (las calles menores ya no se apagan durante la animación: no se repintan, solo se escala la capa)
      // al alejar, se pinta ya el destino (más amplio) y la animación lo escala desde la vista de ahora: nunca asoma su borde
      if (c.w > vb.w * 1.15) { var ahora = { x: vb.x, y: vb.y, w: vb.w }; vb.x = c.x; vb.y = c.y; vb.w = c.w; aplicar(); vb.x = ahora.x; vb.y = ahora.y; vb.w = ahora.w; mover(); }
      (function paso(t) {
        var k = Math.min(1, (t - t0) / ms), e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2, w = de.w * Math.pow(a.w / de.w, e);
        vb.w = w; vb.x = de.cx + (a.cx - de.cx) * e - w / 2; vb.y = de.cy + (a.cy - de.cy) * e - w * H() / W() / 2;
        if (k >= 1) { base.classList.remove('is-volando'); aplicar(); } else mover();
        if (k < 1) anim = requestAnimationFrame(paso);
      })(t0);
    };
    // con «soloCaja», devuelven el encuadre sin mover la cámara (la portada lo usa como destino de su vuelo)
    api.encuadrar = function (ms, m, soloCaja) {
      var xs = [], ys = [], vivos = hs.filter(function (h) { return estado(h, T) === 'calle'; });
      (vivos.length ? vivos : hs).forEach(function (h) { ruta(h).forEach(function (p) { xs.push(p[0]); ys.push(p[1]); }); });
      if (!xs.length) return null; if (soloCaja) return api.caja(xs, ys, m); api.volar(api.caja(xs, ys, m), ms);
    };
    api.ponerDia = function (lista) {
      hs = lista; gR.textContent = ''; gM.textContent = ''; marcas = {}; estados = {}; var usados = {};
      hs.forEach(function (h, i) {
        var base = h.col || h.coln0 || PAL[i % PAL.length], k = usados[base] = (usados[base] || 0) + 1, hc = k > 1 ? variar(base, k - 1) : base, d = '', pts = ruta(h);
        pts.forEach(function (p, j) { var q = pts[j - 1]; d += (!j || (!p[6] && !q[6] && Math.hypot(p[0] - q[0], p[1] - q[1]) > 150)) ? 'M' + p[0] + ' ' + p[1] : 'L' + p[0] + ' ' + p[1]; });
        el('path', { 'class': 'oc-pl-ruta-filo', d: d }, gR); // filo oscuro debajo: el recorrido se separa de las calles
        el('path', { 'class': 'oc-pl-ruta', d: d, 'data-s': h.s, style: '--hc:' + hc }, gR);
        // Cada medallón lleva a la ficha completa en «En la calle» (enlace real, también con teclado)
        var a = el('a', { 'class': 'oc-pl-marca', href: o.enlace ? o.enlace(h) : '#', 'aria-label': h.n, 'data-s': h.s }, gM);
        el('circle', { 'class': 'oc-pl-sombra', r: '22', cy: '2' }, a);
        el('circle', { 'class': 'oc-pl-galon', r: '21' }, a);
        if (h.img) { var cp = el('clipPath', { id: 'oc-pl-' + h.s }, a); el('circle', { r: '18' }, cp); el('image', Object.assign({ href: h.img, 'clip-path': 'url(#oc-pl-' + h.s + ')', preserveAspectRatio: 'xMidYMid slice' }, encuadre(h, 18)), a); }
        else { el('circle', { 'class': 'oc-pl-fondo', r: '18' }, a); el('text', { 'class': 'oc-pl-ini', y: '7' }, a).textContent = h.ini; }
        el('text', { 'class': 'oc-pl-nombre', y: '38' }, a).textContent = h.n.length > 22 ? h.n.slice(0, 21).replace(/\s+\S*$/, '') + '…' : h.n;
        marcas[h.s] = a;
      });
      api.ponerHora(T);
    };
    // ---- Sedes (fuera de temporada): un símbolo por hermandad en su templo (una espadaña) y otro en su casa hermandad (una fachada),
    // en el color de su hábito y con el hilo de oro de las catedrales de la portada. Si se pisan en pantalla, se juntan con su número.
    var gHilo = el('g', { 'class': 'oc-pl-hilos' }, mundo), gS = el('g', { 'class': 'oc-pl-sedes' }, capa), simbolos = [], alTocar = null, sel = '';
    var ESPADANA = 'M-10 0V-17Q-10 -25 0 -29Q10 -25 10 -17V0Z', CAMPANA = 'M-3.6 -11V-16.5a3.6 3.6 0 0 1 7.2 0V-11Z', CRUZ = 'M0 -29V-36M-3 -33.2H3';
    var FACHADA = 'M-9 0V-14L0 -21L9 -14V0Z', PUERTA = 'M-2.6 0V-5.6a2.6 2.6 0 0 1 5.2 0V0', BALCON = 'M-6 -10.5H6';
    api.ponerSedes = function (lista, fn) {
      gS.textContent = ''; gHilo.textContent = ''; simbolos = []; alTocar = fn; sel = '';
      (lista || []).forEach(function (h) {
        [['tp', h.tp], ['cs', h.cs]].forEach(function (k) {
          if (!k[1]) return;
          var templo = k[0] === 'tp', c = h.col || o.color || '#6b2fa3';
          var etq = h.n + (templo ? ', templo: ' : ', casa hermandad: ') + (k[1][2] || '');
          var g = el('g', { 'class': 'oc-pl-sede' + (templo ? '' : ' is-casa'), role: 'button', tabindex: '0', 'aria-label': etq, style: '--i:' + simbolos.length }, gS);
          el('ellipse', { 'class': 'oc-pl-sede-sombra', rx: '11', ry: '3', cy: '1' }, g);
          el('rect', { 'class': 'oc-pl-sede-toque', x: '-22', y: '-40', width: '44', height: '46' }, g);
          if (templo) { el('path', { 'class': 'oc-pl-sede-cuerpo', d: ESPADANA, style: '--hc:' + c }, g); el('path', { 'class': 'oc-pl-sede-hueco', d: CAMPANA }, g); el('path', { 'class': 'oc-pl-sede-hilo', d: CRUZ }, g); }
          else { el('path', { 'class': 'oc-pl-sede-cuerpo', d: FACHADA, style: '--hc:' + c }, g); el('path', { 'class': 'oc-pl-sede-hilo', d: PUERTA + BALCON }, g); }
          // agrupadas: un medallón de oro con el número de hermandades (al tocarlo, la cámara se acerca y se separan)
          var cnt = el('g', { 'class': 'oc-pl-sede-n' }, g); el('circle', { cy: '-14', r: '14' }, cnt); var tn = el('text', { y: '-9.6' }, cnt);
          var nom = el('text', { 'class': 'oc-pl-sede-nom', y: '15' }, g); nom.textContent = h.n.length > 24 ? h.n.slice(0, 23).replace(/\s+\S*$/, '') + '…' : h.n;
          var s = { h: h, tipo: k[0], x: k[1][0], y: k[1][1], g: g, tn: tn, etq: etq, miembros: null };
          g.addEventListener('click', function () { tocar(s); });
          g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tocar(s); } });
          simbolos.push(s);
        });
      });
      // los de más al sur, delante
      simbolos.sort(function (a, b) { return a.y - b.y; }).forEach(function (s) { gS.appendChild(s.g); });
      colocar();
    };
    function tocar(s) {
      var m = s.miembros || [s], xs = m.map(function (q) { return q.x; }), ys = m.map(function (q) { return q.y; });
      // un grupo repartido por la ciudad: la cámara se acerca hasta separarlos; uno solo o todos en el mismo edificio: su hoja
      if (Math.max.apply(null, xs) - Math.min.apply(null, xs) > 40 || Math.max.apply(null, ys) - Math.min.apply(null, ys) > 40) { var c = api.caja(xs, ys, { arriba: 70, abajo: 70, izq: 50, der: 50 }); c.w = Math.min(c.w, vb.w / 2.2); c.x = (Math.min.apply(null, xs) + Math.max.apply(null, xs)) / 2 - c.w / 2; c.y = (Math.min.apply(null, ys) + Math.max.apply(null, ys)) / 2 - c.w * H() / W() / 2; api.volar(c, 620); return; }
      var vistos = {}, hs2 = m.map(function (q) { return q.h; }).filter(function (h) { return vistos[h.s] ? false : (vistos[h.s] = 1); });
      if (alTocar) alTocar(hs2, s);
    }
    // marca la hermandad elegida: sus símbolos resaltados y un hilo de oro entre su templo y su casa hermandad
    api.marcarSede = function (slug) {
      sel = slug || ''; gHilo.textContent = '';
      simbolos.forEach(function (s) { s.g.classList.toggle('is-sel', s.h.s === sel); });
      var h = simbolos.filter(function (s) { return s.h.s === sel; })[0]; h = h && h.h;
      if (h && h.tp && h.cs) el('path', { 'class': 'oc-pl-hilo-sede', d: 'M' + h.tp[0] + ' ' + h.tp[1] + 'L' + h.cs[0] + ' ' + h.cs[1] }, gHilo);
    };
    // Para el vuelo de la portada (site.js lleva la cámara fotograma a fotograma): fija el encuadre sin animación; con «volando»,
    // solo las calles principales y sin rótulos, como en el vuelo propio
    api.fijar = function (c, volando) { cancelAnimationFrame(anim); enVuelo = !!volando; if (volando) modoCanvas(false); vb.x = c.x; vb.y = c.y; vb.w = c.w; base.classList.toggle('is-volando', !!volando); aplicar(); if (!volando) modoCanvas(true); };
    api.ancho = function () { return lim[2] - lim[0]; };
    // el vuelo de la portada (site.js) mueve «las capas» con transform desde la esquina del plano: es la capa que envuelve a las dos
    // (su origen ya está en esa esquina, por eso se ignora transformOrigin); «overflow» va a las dos SVG, como antes
    var capaVuelo = { style: {} };
    Object.defineProperty(capaVuelo.style, 'transform', { set: function (v) { clearTimeout(tVista); mueve.style.transform = v; }, get: function () { return mueve.style.transform; } });
    Object.defineProperty(capaVuelo.style, 'willChange', { set: function () { }, get: function () { return 'transform'; } });
    Object.defineProperty(capaVuelo.style, 'transformOrigin', { set: function () { }, get: function () { return ''; } });
    Object.defineProperty(capaVuelo.style, 'overflow', { set: function (v) { base.style.overflow = v; svg.style.overflow = v; if (v === 'visible') modoCanvas(false); }, get: function () { return base.style.overflow; } });
    api.capas = function () { return [capaVuelo]; };
    // la provincia de la ciudad, debajo de todo: es el mapa de Andalucía que se convierte en el plano
    var provEl = null;
    api.provincia = function (d, color) { if (!arguments.length) return provEl; if (!provEl) { provEl = el('path', { 'class': 'oc-pl-provincia' }); mundo.insertBefore(provEl, mundo.firstChild); } provEl.setAttribute('d', d || ''); provEl.style.fill = color || ''; return provEl; };
    api.verSedes = function (si) { gS.style.display = si ? '' : 'none'; gHilo.style.display = si ? '' : 'none'; };
    // encuadre en la zona con más sedes: sin las más alejadas (una parroquia de las afueras dejaba media pantalla de mar o de campo)
    api.encuadrarSedes = function (ms, m, soloCaja) {
      // sin sedes todavía (capitales cuyo archivo de sedes está en camino): toda la ciudad del plano
      if (!simbolos.length) { if (soloCaja) return api.caja([lim[0], lim[2]], [lim[1], lim[3]], m); api.volar(api.caja([lim[0], lim[2]], [lim[1], lim[3]], m), ms); return; }
      // todas las sedes a la vista (Pablo, 8-nov: «tienen que estar todas»): el fondo ya llega hasta las de los barrios
      // (tools/plano/afueras.mjs) y la cámara no se sale de él; las que quedan juntas se agrupan con su número
      var xs = simbolos.map(function (s) { return s.x; }), ys = simbolos.map(function (s) { return s.y; });
      cajaSedes = { w: Math.max.apply(null, xs) - Math.min.apply(null, xs), h: Math.max.apply(null, ys) - Math.min.apply(null, ys), m: m };
      // Si las sedes ocupan más de 8 km (Córdoba, por Alcolea y El Higuerón), el centro se quedaba en números; se encuadra el
      // núcleo (Pablo, 8-nov: «que se vea en el centro Córdoba») y una pista discreta enseña las demás. Alejando se llega a ellas.
      lejanas = []; var sel2 = simbolos;
      if (Math.max(cajaSedes.w, cajaSedes.h) > 8000 && !todas) {
        var med = function (v) { v = v.slice().sort(function (a, b) { return a - b; }); return v[Math.floor(v.length / 2)]; };
        var cx = med(xs), cy = med(ys), ds = simbolos.map(function (s) { return Math.hypot(s.x - cx, s.y - cy); }), l2 = Math.max(800, 2.5 * med(ds));
        sel2 = simbolos.filter(function (s, i) { return ds[i] <= l2; }); lejanas = simbolos.filter(function (s, i) { return ds[i] > l2; });
      }
      todas = false;
      var cj = api.caja(sel2.map(function (s) { return s.x; }), sel2.map(function (s) { return s.y; }), m); if (soloCaja) return cj; api.volar(cj, ms);
    };
    // la pista: «+N más lejos», arriba a la izquierda; al tocarla, todas las sedes a la vista
    var lejanas = [], todas = false, mas = document.createElement('button'); mas.type = 'button'; mas.className = 'oc-pl-mas'; mas.hidden = true; host.appendChild(mas);
    mas.addEventListener('click', function () { todas = true; api.encuadrarSedes(calm ? 0 : 520, cajaSedes.m); });
    function pista() {
      if (!lejanas.length || gS.style.display === 'none') { mas.hidden = true; return; }
      var n = 0, vistas = {}; lejanas.forEach(function (s) { if ((s.x < vb.x || s.x > vb.x + vb.w || s.y < vb.y || s.y > vb.y + vb.h) && !vistas[s.h.s]) { vistas[s.h.s] = 1; n++; } });
      mas.hidden = !n; if (n) { var t = '+' + n + ' más lejos'; if (mas.textContent !== t) { mas.textContent = t; mas.setAttribute('aria-label', 'Ver también ' + (n === 1 ? 'la sede más alejada' : 'las ' + n + ' sedes más alejadas')); } }
    }
    api.zoom = function (f, ms) { var w = Math.max(250, Math.min(vb.w * f, maxAncho())), cx = vb.x + vb.w / 2, cy = vb.y + vb.h / 2; api.volar({ x: cx - w / 2, y: cy - w * H() / W() / 2, w: w }, ms == null ? 320 : ms); };
    function colocarSedes() {
      if (!simbolos.length) return;
      // más pequeños al alejar (hasta un 60 %), para que la ciudad entera no quede tapada
      var f = Z <= 1.6 ? 1 : Math.max(0.6, 1 - (Z - 1.6) * 0.07), Zs = Z * f, R = 30 * Zs, grupos = [];
      simbolos.forEach(function (s) {
        var g = null; for (var i = 0; i < grupos.length; i++) if (Math.abs(grupos[i][0].x - s.x) < R && Math.abs(grupos[i][0].y - s.y) < R) { g = grupos[i]; break; }
        if (g) g.push(s); else grupos.push([s]);
      });
      grupos.forEach(function (gr) {
        var r = gr[0], n = 0, v = {}, nombres = []; gr.forEach(function (q) { if (!v[q.h.s]) { v[q.h.s] = 1; n++; nombres.push(q.h.n); } });
        gr.forEach(function (q, i) { q.miembros = gr; q.g.style.visibility = i ? 'hidden' : ''; });
        r.g.setAttribute('transform', 'translate(' + r.x.toFixed(1) + ' ' + r.y.toFixed(1) + ') scale(' + Zs.toFixed(3) + ')');
        r.g.classList.toggle('is-grupo', n > 1); r.tn.textContent = n > 1 ? n : '';
        r.g.setAttribute('aria-label', n > 1 ? n + ' hermandades: ' + nombres.join(', ') : r.etq);
      });
      gS.classList.toggle('con-nombres', Z < 2.4);
    }
    // nombres de las calles (del plano, OpenStreetMap): los que caben en su tramo a esta escala, sin pisarse; durante el vuelo, ninguno
    var ETQ = (D.etiquetas || []).slice().sort(function (a, b) { return (b[5] || 0) - (a[5] || 0); }).slice(0, 240).map(function (e) { var t = el('text', { 'class': 'oc-pl-calle-n' + (e[4] ? ' is-princ' : ''), dy: '.35em' }, gE); t.textContent = e[3]; t.style.display = 'none'; return { e: e, t: t, w: e[3].length * 5.8 + 10 }; });
    function colocarEtiquetas() {
      if (!ETQ.length) return;
      var volando = base.classList.contains('is-volando'), puestos = [], x0 = vb.x, y0 = vb.y, x1 = vb.x + vb.w, y1 = vb.y + vb.h;
      gE.style.display = volando ? 'none' : ''; if (volando) return;
      ETQ.forEach(function (q) {
        var e = q.e, vis = Z < 7 && e[0] > x0 && e[0] < x1 && e[1] > y0 && e[1] < y1 && (e[5] || 0) / Z > q.w * 1.15;
        if (vis) {
          var a = e[2] * Math.PI / 180, hw = (q.w * Math.abs(Math.cos(a)) + 14 * Math.abs(Math.sin(a))) / 2 * Z, hh = (q.w * Math.abs(Math.sin(a)) + 14 * Math.abs(Math.cos(a))) / 2 * Z;
          for (var i = 0; i < puestos.length; i++) { var p = puestos[i]; if (Math.abs(p[0] - e[0]) < p[2] + hw && Math.abs(p[1] - e[1]) < p[3] + hh) { vis = false; break; } }
          if (vis) puestos.push([e[0], e[1], hw, hh]);
        }
        q.t.style.display = vis ? '' : 'none';
        if (vis) q.t.setAttribute('transform', 'translate(' + e[0] + ' ' + e[1] + ') rotate(' + e[2] + ') scale(' + Z.toFixed(3) + ')');
      });
    }
    function colocar() {
      colocarEtiquetas(); colocarSedes();
      var ms = [];
      hs.forEach(function (h) { var p = enTramo(ruta(h), T), g = marcas[h.s]; if (g && p) ms.push({ g: g, x: p.x, y: p.y }); });
      var R = 44 * Z; // si dos medallones se pisan en pantalla, se separan
      for (var it = 0; it < 6; it++) for (var a = 0; a < ms.length; a++) for (var b = a + 1; b < ms.length; b++) {
        var A = ms[a], B = ms[b], dx = B.x - A.x, dy = B.y - A.y, d = Math.hypot(dx, dy); if (d >= R) continue;
        if (d < 0.01) { dx = Math.cos(a + b); dy = Math.sin(a + b); d = 1; }
        var e = (R - d) / 2; A.x -= dx / d * e; A.y -= dy / d * e; B.x += dx / d * e; B.y += dy / d * e;
      }
      ms.forEach(function (m) { m.g.setAttribute('transform', 'translate(' + m.x.toFixed(1) + ' ' + m.y.toFixed(1) + ') scale(' + Z.toFixed(3) + ')'); });
      svg.classList.toggle('con-nombres', Z < 3.2);
    }
    api.ponerHora = function (t) {
      T = t; gC.textContent = '';
      if (enCanvas && trazos[2][0] && !tNoche) tNoche = requestAnimationFrame(function () { tNoche = 0; if (enCanvas && !mueve.style.transform && getComputedStyle(trazos[2][0].el).stroke !== colorPrinc) pintarCanvas(true); }); // en pleno gesto no: al soltar se pinta todo
      hs.forEach(function (h) {
        var pts = ruta(h), paso = enTramo(pts, T), cruz = h.t.cruz ? enTramo(h.t.cruz, T) : null, est = estado(h, T);
        if (marcas[h.s]) marcas[h.s].setAttribute('data-estado', est);
        if (estados[h.s] !== est) { estados[h.s] = est; Array.prototype.forEach.call(gR.querySelectorAll('[data-s="' + h.s + '"]'), function (r) { r.setAttribute('data-estado', est); }); }
        // el cortejo ocupa la calle desde el paso hasta la cruz de guía (solo si la cruz va por el recorrido conocido)
        if (est === 'calle' && h.t.paso && cruz && paso) {
          var d = 'M' + paso.x + ' ' + paso.y, best = paso.i, bd = Infinity;
          for (var j = paso.i; j < Math.min(pts.length, paso.i + 600); j++) { var dd = Math.hypot(pts[j][0] - cruz.x, pts[j][1] - cruz.y); if (dd < bd) { bd = dd; best = j; } }
          for (var k = paso.i + 1; k <= best; k++) d += 'L' + pts[k][0] + ' ' + pts[k][1];
          if (bd < 80) d += 'L' + cruz.x + ' ' + cruz.y;
          el('path', { 'class': 'oc-pl-cortejo-halo', d: d }, gC);
          el('path', { 'class': 'oc-pl-cortejo', d: d }, gC);
        }
      });
      colocar();
    };
    api.cuantas = function () { var n = { calle: 0, antes: 0, despues: 0 }; hs.forEach(function (h) { var e = estado(h, T); if (n[e] != null) n[e]++; }); return n; };
    // Con ratón se puede mover el plano arrastrando; con el dedo, la página sigue desplazándose (el plano completo está en «En la calle»)
    var arr = null, finArr = 0;
    svg.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse' || e.button) return; cancelAnimationFrame(anim); base.classList.remove('is-volando'); arr = { x: e.clientX, y: e.clientY, m: false }; });
    svg.addEventListener('pointermove', function (e) {
      if (!arr) return; var dx = e.clientX - arr.x, dy = e.clientY - arr.y;
      if (!arr.m && Math.hypot(dx, dy) < 6) return; if (!arr.m) { arr.m = true; try { svg.setPointerCapture(e.pointerId); } catch (er) { } svg.classList.add('is-arrastrando'); }
      vb.x -= dx * Z; vb.y -= dy * Z; arr.x = e.clientX; arr.y = e.clientY; mover();
    });
    var soltar = function () { if (arr && arr.m) { finArr = performance.now(); svg.classList.remove('is-arrastrando'); } arr = null; };
    svg.addEventListener('pointerup', soltar); svg.addEventListener('pointercancel', soltar);
    // un arrastre no abre el medallón que quedó debajo al soltar
    svg.addEventListener('click', function (e) { if (performance.now() - finArr < 250) { e.preventDefault(); e.stopPropagation(); } }, true);
    // ---- Gestos en el móvil: un dedo sigue bajando por la página; dos dedos mueven y amplían el plano; doble toque acerca ----
    var maxW = maxAncho, wLim = function (w) { return Math.max(250, Math.min(maxW(), w)); };
    // amplía (f < 1) o aleja alrededor de un punto de la pantalla (px, py, relativos al plano)
    function zoomEn(f, px, py, ms) {
      var w = wLim(vb.w * f), wx = vb.x + px * Z, wy = vb.y + py * Z, k = w / vb.w;
      api.volar({ x: wx - (wx - vb.x) * k, y: wy - (wy - vb.y) * k, w: w }, ms);
    }
    var aviso = document.createElement('div'); host.appendChild(aviso); aviso.className = 'oc-pl-aviso'; aviso.setAttribute('role', 'status'); aviso.textContent = 'Usa dos dedos para mover y ampliar el plano';
    var gesto = null, toque = null, ultimo = null, tAviso = 0;
    svg.addEventListener('touchstart', function (e) {
      if (e.touches.length === 2) {
        e.preventDefault(); cancelAnimationFrame(anim); base.classList.remove('is-volando'); toque = null;
        var a = e.touches[0], b = e.touches[1], r = host.getBoundingClientRect();
        gesto = { d: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY) || 1, mx: (a.clientX + b.clientX) / 2 - r.left, my: (a.clientY + b.clientY) / 2 - r.top, x: vb.x, y: vb.y, w: vb.w, Z: Z, r: r };
      } else if (e.touches.length === 1) toque = { x: e.touches[0].clientX, y: e.touches[0].clientY, t: performance.now(), movido: false };
    }, { passive: false });
    svg.addEventListener('touchmove', function (e) {
      if (gesto && e.touches.length === 2) {
        e.preventDefault();
        var a = e.touches[0], b = e.touches[1], d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY) || 1;
        var mx = (a.clientX + b.clientX) / 2 - gesto.r.left, my = (a.clientY + b.clientY) / 2 - gesto.r.top, w = wLim(gesto.w * gesto.d / d), z = w / W();
        // el punto del plano que estaba entre los dedos sigue entre los dedos
        vb.x = gesto.x + gesto.mx * gesto.Z - mx * z; vb.y = gesto.y + gesto.my * gesto.Z - my * z; vb.w = w; mover();
        return;
      }
      if (toque && e.touches.length === 1) {
        var dx = e.touches[0].clientX - toque.x, dy = e.touches[0].clientY - toque.y;
        if (Math.hypot(dx, dy) > 10) toque.movido = true;
        // un dedo que intenta mover el plano de lado: se avisa de que son dos dedos (la página sigue bajando con uno)
        if (Math.abs(dx) > 24 && Math.abs(dx) > Math.abs(dy) * 1.4 && performance.now() - tAviso > 4000) { tAviso = performance.now(); aviso.classList.add('is-on'); setTimeout(function () { aviso.classList.remove('is-on'); }, 1800); }
      }
    }, { passive: false });
    svg.addEventListener('touchend', function (e) {
      if (gesto && e.touches.length < 2) { gesto = null; finArr = performance.now(); return; }
      if (!toque || e.touches.length) return;
      var p = e.changedTouches[0], ahora = performance.now(), tap = !toque.movido && ahora - toque.t < 300; toque = null;
      if (!tap) { ultimo = null; return; }
      // doble toque: acerca alrededor del dedo (y no abre lo que haya debajo)
      if (ultimo && ahora - ultimo.t < 320 && Math.hypot(p.clientX - ultimo.x, p.clientY - ultimo.y) < 30) {
        e.preventDefault(); ultimo = null; finArr = ahora; var r = host.getBoundingClientRect(); zoomEn(0.5, p.clientX - r.left, p.clientY - r.top, 320); return;
      }
      ultimo = { t: ahora, x: p.clientX, y: p.clientY };
    }, { passive: false });
    svg.addEventListener('touchcancel', function () { gesto = null; toque = null; });
    // en el ordenador: pellizco del panel táctil (llega como rueda con Ctrl) y Ctrl + rueda amplían donde está el puntero
    svg.addEventListener('wheel', function (e) {
      if (!e.ctrlKey) return; e.preventDefault(); cancelAnimationFrame(anim); var r = host.getBoundingClientRect();
      var w = wLim(vb.w * Math.exp(Math.max(-1, Math.min(1, e.deltaY * 0.01)))), wx = vb.x + (e.clientX - r.left) * Z, wy = vb.y + (e.clientY - r.top) * Z, k = w / vb.w;
      vb.x = wx - (wx - vb.x) * k; vb.y = wy - (wy - vb.y) * k; vb.w = w; mover();
    }, { passive: false });
    svg.addEventListener('dblclick', function (e) { var r = host.getBoundingClientRect(); zoomEn(e.shiftKey ? 2 : 0.5, e.clientX - r.left, e.clientY - r.top, 320); });
    // el canvas, en el fotograma siguiente y solo si no ha empezado un vuelo (la portada llama a fijar(…, true) nada más crearlo,
    // y pintar aquí la ciudad entera retrasaba el vuelo al tocar una bandera); al llegar, fijar(…, false) lo pone
    aplicar(); requestAnimationFrame(function () { if (!enVuelo) modoCanvas(true); });
    if (window.ResizeObserver) new ResizeObserver(function () { aplicar(true); }).observe(host);
    return api;
  }

  window.OCPlano = { Plano: Plano, enTramo: enTramo, estado: estado, limites: limites, horaPico: horaPico, cielo: cielo, hhmm: hhmm };
  document.dispatchEvent(new CustomEvent('oc-plano-listo'));
})();
