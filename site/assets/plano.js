/* Ocho Capitales · plano ligero para la portada: la misma ciudad de «En la calle» (calles de OpenStreetMap en metros,
   recorridos oficiales y posición estimada de cada cortejo), solo para mirar. Se carga al tocar una bandera.
   La interacción completa (ficha, ruta, ubicación) sigue en assets/calle.js. */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var el = function (t, a, padre) { var n = document.createElementNS(NS, t); for (var k in a || {}) n.setAttribute(k, a[k]); if (padre) padre.appendChild(n); return n; };
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

  function Plano(host, D, o) {
    o = o || {};
    // Dos capas con la misma vista: abajo lo fijo (calles y recorridos) y arriba lo que se mueve (cortejos y medallones).
    // Al cambiar la hora solo se repinta la de arriba; repintar miles de calles en cada paso daba tirones.
    var base = el('svg', { 'class': 'oc-pl-svg oc-pl-base', 'aria-hidden': 'true', focusable: 'false' }, host);
    var svg = el('svg', { 'class': 'oc-pl-svg oc-pl-capa', role: 'img', 'aria-label': 'Plano de ' + D.nombre + ' con los recorridos de la jornada' }, host);
    var mundo = el('g', {}, base);
    el('path', { 'class': 'oc-pl-calles', d: pathDe(D.calles) }, mundo);
    el('path', { 'class': 'oc-pl-princ', d: pathDe(D.principales) }, mundo);
    var gR = el('g', {}, mundo), capa = el('g', {}, svg), gC = el('g', {}, capa), gM = el('g', {}, capa), estados = {};
    var lim = [Infinity, Infinity, -Infinity, -Infinity];
    D.principales.forEach(function (l) { for (var i = 0; i < l.length; i += 2) { lim[0] = Math.min(lim[0], l[i]); lim[1] = Math.min(lim[1], l[i + 1]); lim[2] = Math.max(lim[2], l[i]); lim[3] = Math.max(lim[3], l[i + 1]); } });
    var vb = { x: lim[0], y: lim[1], w: lim[2] - lim[0], h: lim[3] - lim[1] }, Z = 1, T = 0, hs = [], marcas = {}, anim = 0;
    var api = { svg: svg };
    var W = function () { return Math.max(1, host.clientWidth); }, H = function () { return Math.max(1, host.clientHeight); };
    function aplicar(centro) {
      var cy = vb.y + vb.h / 2; vb.h = vb.w * H() / W(); if (centro) vb.y = cy - vb.h / 2;
      var v = vb.x.toFixed(1) + ' ' + vb.y.toFixed(1) + ' ' + vb.w.toFixed(1) + ' ' + vb.h.toFixed(1); base.setAttribute('viewBox', v); svg.setAttribute('viewBox', v); Z = vb.w / W(); colocar();
    }
    api.vista = function () { return { x: vb.x, y: vb.y, w: vb.w, h: vb.h }; };
    api.caja = function (xs, ys, m) {
      var x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs), y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys);
      var iw = Math.max(60, W() - m.izq - m.der), ih = Math.max(60, H() - m.arriba - m.abajo), e = Math.max(Math.max(x1 - x0, 300) / iw, Math.max(y1 - y0, 300) / ih) * 1.04;
      var w = W() * e, cx = (x0 + x1) / 2 - (m.izq - m.der) / 2 * e, cy = (y0 + y1) / 2 - (m.arriba - m.abajo) / 2 * e;
      return { x: cx - w / 2, y: cy - w * H() / W() / 2, w: w };
    };
    // Vuelo de cámara: parte de lo que se ve ahora (se puede interrumpir), el centro avanza en línea y la escala en exponencial
    api.volar = function (c, ms) {
      cancelAnimationFrame(anim);
      if (calm || !ms) { vb.x = c.x; vb.y = c.y; vb.w = c.w; aplicar(); base.classList.remove('is-volando'); return; }
      var de = { cx: vb.x + vb.w / 2, cy: vb.y + vb.h / 2, w: vb.w }, a = { cx: c.x + c.w / 2, cy: c.y + c.w * H() / W() / 2, w: c.w }, t0 = performance.now();
      base.classList.add('is-volando');
      (function paso(t) {
        var k = Math.min(1, (t - t0) / ms), e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2, w = de.w * Math.pow(a.w / de.w, e);
        vb.w = w; vb.x = de.cx + (a.cx - de.cx) * e - w / 2; vb.y = de.cy + (a.cy - de.cy) * e - w * H() / W() / 2; aplicar();
        if (k < 1) anim = requestAnimationFrame(paso); else base.classList.remove('is-volando');
      })(t0);
    };
    api.encuadrar = function (ms, m) {
      var xs = [], ys = [], vivos = hs.filter(function (h) { return estado(h, T) === 'calle'; });
      (vivos.length ? vivos : hs).forEach(function (h) { ruta(h).forEach(function (p) { xs.push(p[0]); ys.push(p[1]); }); });
      if (xs.length) api.volar(api.caja(xs, ys, m), ms);
    };
    api.ponerDia = function (lista) {
      hs = lista; gR.textContent = ''; gM.textContent = ''; marcas = {}; estados = {};
      hs.forEach(function (h, i) {
        var hc = PAL[i % PAL.length], d = '', pts = ruta(h);
        pts.forEach(function (p, j) { var q = pts[j - 1]; d += (!j || (!p[6] && !q[6] && Math.hypot(p[0] - q[0], p[1] - q[1]) > 150)) ? 'M' + p[0] + ' ' + p[1] : 'L' + p[0] + ' ' + p[1]; });
        el('path', { 'class': 'oc-pl-ruta', d: d, 'data-s': h.s, style: '--hc:' + hc }, gR);
        // Cada medallón lleva a la ficha completa en «En la calle» (enlace real, también con teclado)
        var a = el('a', { 'class': 'oc-pl-marca', href: o.enlace ? o.enlace(h) : '#', 'aria-label': h.n, 'data-s': h.s }, gM);
        el('circle', { 'class': 'oc-pl-sombra', r: '22', cy: '2' }, a);
        el('circle', { 'class': 'oc-pl-galon', r: '21' }, a);
        if (h.img) { var cp = el('clipPath', { id: 'oc-pl-' + h.s }, a); el('circle', { r: '18' }, cp); el('image', { href: h.img, x: '-18', y: '-18', width: '36', height: '36', 'clip-path': 'url(#oc-pl-' + h.s + ')', preserveAspectRatio: 'xMidYMid slice' }, a); }
        else { el('circle', { 'class': 'oc-pl-fondo', r: '18' }, a); el('text', { 'class': 'oc-pl-ini', y: '7' }, a).textContent = h.ini; }
        el('text', { 'class': 'oc-pl-nombre', y: '38' }, a).textContent = h.n.length > 22 ? h.n.slice(0, 21).replace(/\s+\S*$/, '') + '…' : h.n;
        marcas[h.s] = a;
      });
      api.ponerHora(T);
    };
    function colocar() {
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
      vb.x -= dx * Z; vb.y -= dy * Z; arr.x = e.clientX; arr.y = e.clientY; aplicar();
    });
    var soltar = function () { if (arr && arr.m) { finArr = performance.now(); svg.classList.remove('is-arrastrando'); } arr = null; };
    svg.addEventListener('pointerup', soltar); svg.addEventListener('pointercancel', soltar);
    // un arrastre no abre el medallón que quedó debajo al soltar
    svg.addEventListener('click', function (e) { if (performance.now() - finArr < 250) { e.preventDefault(); e.stopPropagation(); } }, true);
    aplicar();
    if (window.ResizeObserver) new ResizeObserver(function () { aplicar(true); }).observe(host);
    return api;
  }

  window.OCPlano = { Plano: Plano, enTramo: enTramo, estado: estado, limites: limites, horaPico: horaPico, cielo: cielo, hhmm: hhmm };
  document.dispatchEvent(new CustomEvent('oc-plano-listo'));
})();
