/* Ocho Capitales · En la calle: plano propio con los recorridos oficiales y la posición estimada de cada cortejo.
   Sin librerías: el plano es SVG en metros (calles de OpenStreetMap simplificadas) y el movimiento usa muelles e inercia. */
(function () {
  'use strict';
  var sec = document.querySelector('[data-calle]'); if (!sec) return;
  var NS = 'http://www.w3.org/2000/svg';
  var $ = function (s, r) { return (r || sec).querySelector(s); }, $$ = function (s, r) { return Array.prototype.slice.call((r || sec).querySelectorAll(s)); };
  var calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var svg = $('.oc-calle-svg'), mapa = $('[data-mapa]'), rango = $('[data-tiempo]'), hora = $('[data-hora]'), lista = $('[data-lista]');
  var fechas = {}; try { fechas = JSON.parse(sec.getAttribute('data-fechas')); } catch (e) { }
  var D = null, dia = null, T = 0, vb = { x: 0, y: 0, w: 1000, h: 1000 }, capas = {}, yo = null, sel = null;
  var el = function (t, a) { var n = document.createElementNS(NS, t); for (var k in a) n.setAttribute(k, a[k]); return n; };
  var hhmm = function (m) { m = ((Math.round(m) % 1440) + 1440) % 1440; return ('0' + Math.floor(m / 60)).slice(-2) + ':' + ('0' + (m % 60)).slice(-2); };
  var ahoraMin = function () { var f = new Intl.DateTimeFormat('es-ES', { timeZone: 'Europe/Madrid', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date()).split(':'); return +f[0] * 60 + +f[1]; };
  var hoyISO = function () { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid' }).format(new Date()); };
  var aLatLon = function (x, y) { return [D.origen[0] - y / D.ky, D.origen[1] + x / D.kx]; };

  // ---------- plano ----------
  function pathDe(lineas) { var d = ''; for (var i = 0; i < lineas.length; i++) { var l = lineas[i]; d += 'M' + l[0] + ' ' + l[1]; for (var j = 2; j < l.length; j += 2) d += 'L' + l[j] + ' ' + l[j + 1]; } return d; }
  function dibujarPlano() {
    svg.textContent = '';
    var defs = el('defs', {});
    var f = el('filter', { id: 'oc-brillo', x: '-50%', y: '-50%', width: '200%', height: '200%' }); f.appendChild(el('feGaussianBlur', { stdDeviation: '6' })); defs.appendChild(f);
    svg.appendChild(defs);
    capas.mundo = el('g', { 'class': 'oc-c-mundo' }); svg.appendChild(capas.mundo);
    // Fondo fiel (si el plano lo trae, tools/itinerarios/fondo-osm.mjs): agua, ríos, costa, playas, parques y plazas debajo de las calles
    var A = D.areas || {}, poli = function (ls) { var d = ''; (ls || []).forEach(function (l) { d += pathDe([l]) + 'Z'; }); return d; };
    [['oc-c-agua', poli(A.agua)], ['oc-c-playa', poli(A.playas)], ['oc-c-parque', poli(A.parques)], ['oc-c-plaza', poli(A.plazas)], ['oc-c-rio', D.rios ? pathDe(D.rios) : ''], ['oc-c-costa', D.costa ? pathDe(D.costa) : '']]
      .forEach(function (c) { if (c[1]) capas.mundo.appendChild(el('path', { 'class': c[0], d: c[1] })); });
    capas.mundo.appendChild(el('path', { 'class': 'oc-c-calles', d: pathDe(D.calles) }));
    capas.mundo.appendChild(el('path', { 'class': 'oc-c-princ', d: pathDe(D.principales) }));
    // templos y casas hermandad, como edificios encima de las calles (sus nombres los rotula el plano)
    if (A.edificios) { capas.mundo.appendChild(el('path', { 'class': 'oc-c-templo', d: poli(A.edificios.filter(function (e) { return e.c === 'templo'; }).map(function (e) { return e.p; })) })); capas.mundo.appendChild(el('path', { 'class': 'oc-c-casa', d: poli(A.edificios.filter(function (e) { return e.c === 'casa'; }).map(function (e) { return e.p; })) })); }
    // nombres de calles e iglesias: se repintan al mover el plano (tamaño fijo en pantalla, sin solaparse)
    capas.nombres = el('g', { 'class': 'oc-c-nombres', 'aria-hidden': 'true' }); capas.mundo.appendChild(capas.nombres);
    capas.rutas = el('g', { 'class': 'oc-c-rutas' }); capas.mundo.appendChild(capas.rutas);
    capas.cortejos = el('g', { 'class': 'oc-c-cortejos' }); capas.mundo.appendChild(capas.cortejos);
    capas.guias = el('g', { 'class': 'oc-c-guias' }); capas.mundo.appendChild(capas.guias);
    capas.marcas = el('g', { 'class': 'oc-c-marcas' }); capas.mundo.appendChild(capas.marcas);
    capas.yo = el('g', { 'class': 'oc-c-yo' }); capas.mundo.appendChild(capas.yo);
  }
  // metros por píxel: las marcas se dibujan a tamaño de pantalla, sea cual sea el zoom
  var Z = 1;
  // límites del plano: el centro de la vista no puede salir de la ciudad dibujada (no se «pierde» el plano)
  var lim = null;
  function calcularLimites() {
    var a = [Infinity, Infinity, -Infinity, -Infinity];
    [D.calles, D.principales].forEach(function (ls) { ls.forEach(function (l) { for (var i = 0; i < l.length; i += 2) { if (l[i] < a[0]) a[0] = l[i]; if (l[i + 1] < a[1]) a[1] = l[i + 1]; if (l[i] > a[2]) a[2] = l[i]; if (l[i + 1] > a[3]) a[3] = l[i + 1]; } }); });
    lim = a;
  }
  function aplicarVista() {
    if (lim) { var cx = Math.min(Math.max(vb.x + vb.w / 2, lim[0]), lim[2]), cy = Math.min(Math.max(vb.y + vb.h / 2, lim[1]), lim[3]); vb.x = cx - vb.w / 2; vb.y = cy - vb.h / 2; }
    svg.setAttribute('viewBox', vb.x + ' ' + vb.y + ' ' + vb.w + ' ' + vb.h); Z = vb.w / Math.max(1, mapa.clientWidth);
    svg.classList.toggle('con-nombres', Z < 2.6);
    if (D && dia) colocarMarcas();
    pedirNombres();
  }
  // ---------- rótulos de calles e iglesias ----------
  // Cada etiqueta [x, y, ángulo, nombre, rango, largo en m] se coloca si cabe en su calle y no pisa a otra ya colocada.
  // Rango 1 (calles del recorrido y arterias) desde lejos; 2 y 3 (calles menores) al acercar. Las iglesias, muy cerca.
  var nombresPend = 0, posMarcas = [];
  function pedirNombres() { if (nombresPend) return; nombresPend = requestAnimationFrame(function () { nombresPend = 0; pintarNombres(); }); }
  function pintarNombres() {
    var g = capas.nombres; if (!g || !D) return;
    g.textContent = '';
    var W = mapa.clientWidth, H = mapa.clientHeight, rMax = Z < 1.9 ? 3 : Z < 4.2 ? 2 : Z < 14 ? 1 : 0;
    var cajas = [], puestas = 0, frag = document.createDocumentFragment();
    // los medallones (con su nombre debajo) y los botones del plano no se tapan con rótulos
    posMarcas.forEach(function (p) { cajas.push([(p[0] - vb.x) / Z, (p[1] - vb.y) / Z + 8, 56, 38]); });
    cajas.push([W - 34, 100, 36, 110]);
    var cabe = function (cx, cy, w, h, ang) {
      var r = ang * Math.PI / 180, hw = (Math.abs(Math.cos(r)) * w + Math.abs(Math.sin(r)) * h) / 2, hh = (Math.abs(Math.sin(r)) * w + Math.abs(Math.cos(r)) * h) / 2;
      for (var i = 0; i < cajas.length; i++) { var c = cajas[i]; if (Math.abs(c[0] - cx) < c[2] + hw && Math.abs(c[1] - cy) < c[3] + hh) return false; }
      cajas.push([cx, cy, hw, hh]); return true;
    };
    var poner = function (clase, x, y, ang, txt) {
      var t = el('text', { 'class': clase, transform: 'translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ') rotate(' + ang + ') scale(' + Z.toFixed(3) + ')' }); t.textContent = txt; frag.appendChild(t);
    };
    // iglesias: cruz de tamaño fijo y, muy cerca, su nombre
    (D.templos || []).forEach(function (t) {
      var sx = (t.x - vb.x) / Z, sy = (t.y - vb.y) / Z; if (sx < -30 || sx > W + 30 || sy < -30 || sy > H + 30 || Z > 14) return;
      var gl = el('path', { 'class': 'oc-c-cruz-templo', d: 'M0 -6V6M-4 -2H4', transform: 'translate(' + t.x + ' ' + t.y + ') scale(' + Z.toFixed(3) + ')' }); frag.appendChild(gl);
      if (Z < 1.7 && t.n && cabe(sx, sy + 14, t.n.length * 5.4 + 8, 12, 0)) poner('oc-c-nombre-templo', t.x, t.y + 14 * Z, 0, t.n);
    });
    var E = D.etiquetas || [];
    for (var i = 0; i < E.length && puestas < 110; i++) {
      var e = E[i]; if (e[4] > rMax) continue;
      var sx = (e[0] - vb.x) / Z, sy = (e[1] - vb.y) / Z; if (sx < -50 || sx > W + 50 || sy < -20 || sy > H + 20) continue;
      var w = e[3].length * 5.5 + 10; if (e[5] / Z < w * 0.85) continue; // la calle, a esta escala, es más corta que su nombre
      if (!cabe(sx, sy, w, 12, e[2])) continue;
      poner('oc-c-nombre-calle r' + e[4], e[0], e[1], e[2], e[3]); puestas++;
    }
    g.appendChild(frag);
  }
  // Huecos de la pantalla tapados por los controles (derecha) y por el reloj (abajo): lo encuadrado queda a la vista
  function margenes() { var ancho = mapa.clientWidth < 600; return { arriba: 20, abajo: ancho ? (sel ? Math.round(window.innerHeight * 0.42) : 120) : 96, izq: 20, der: !ancho && sel ? 400 : 68 }; }
  function encuadrar(xs, ys, animar) {
    var x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs), y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys);
    var m = margenes(), W = Math.max(1, mapa.clientWidth), H = Math.max(1, mapa.clientHeight), iw = Math.max(80, W - m.izq - m.der), ih = Math.max(80, H - m.arriba - m.abajo);
    var esc = Math.max(Math.max(x1 - x0, 300) / iw, Math.max(y1 - y0, 300) / ih) * 1.06; // metros por píxel
    var w = W * esc, h = H * esc, cx = (x0 + x1) / 2 - (m.izq - m.der) / 2 * esc, cy = (y0 + y1) / 2 - (m.arriba - m.abajo) / 2 * esc;
    var obj = { x: cx - w / 2, y: cy - h / 2, w: w, h: h };
    if (!animar || calm) { vb = obj; aplicarVista(); return; }
    var de = { x: vb.x, y: vb.y, w: vb.w, h: vb.h }, t0 = performance.now();
    (function paso(t) { var k = Math.max(0, Math.min(1, (t - t0) / 520)), e = 1 - Math.pow(1 - k, 3); for (var p in obj) vb[p] = de[p] + (obj[p] - de[p]) * e; aplicarVista(); if (k < 1) requestAnimationFrame(paso); })(t0);
  }

  // ---------- gestos: arrastrar con inercia, rueda y pellizco anclados al dedo ----------
  var punteros = {}, vel = { x: 0, y: 0 }, ultimo = null, inercia = 0, inicio = null, movido = false, finArrastre = 0, toque = null;
  function aMundo(cx, cy) { var r = svg.getBoundingClientRect(); return { x: vb.x + (cx - r.left) / r.width * vb.w, y: vb.y + (cy - r.top) / r.height * vb.h }; }
  function zoomEn(px, py, f) { var w = Math.min(Math.max(vb.w * f, 150), 30000), k = w / vb.w; vb.x = px - (px - vb.x) * k; vb.y = py - (py - vb.y) * k; vb.w = w; vb.h = vb.h * k; aplicarVista(); }
  function zoomAnimado(px, py, f) {
    if (calm) return zoomEn(px, py, f);
    var de = vb.w, t0 = performance.now();
    (function p(t) { var k = Math.max(0, Math.min(1, (t - t0) / 260)), e = 1 - Math.pow(1 - k, 3), w = de * (1 + (f - 1) * e); zoomEn(px, py, w / vb.w); if (k < 1) requestAnimationFrame(p); })(t0);
  }
  // El plano no se captura al tocar: hasta que el dedo se mueve 6 px es un toque (y llega a la marca que haya debajo).
  svg.addEventListener('pointerdown', function (e) {
    cancelAnimationFrame(inercia); punteros[e.pointerId] = { x: e.clientX, y: e.clientY };
    if (Object.keys(punteros).length === 1) { inicio = { x: e.clientX, y: e.clientY }; movido = false; }
    else { movido = true; Object.keys(punteros).forEach(function (id) { try { svg.setPointerCapture(+id); } catch (er) { } }); }
    ultimo = { t: performance.now(), x: e.clientX, y: e.clientY }; vel = { x: 0, y: 0 };
  });
  svg.addEventListener('pointermove', function (e) {
    if (!punteros[e.pointerId]) return;
    var ids = Object.keys(punteros), r = svg.getBoundingClientRect(), s = vb.w / r.width;
    if (ids.length === 1) {
      if (!movido) { if (Math.hypot(e.clientX - inicio.x, e.clientY - inicio.y) < 6) return; movido = true; try { svg.setPointerCapture(e.pointerId); } catch (er) { } svg.classList.add('is-arrastrando'); }
      var p = punteros[e.pointerId], dx = e.clientX - p.x, dy = e.clientY - p.y;
      vb.x -= dx * s; vb.y -= dy * s; aplicarVista();
      var now = performance.now(), dt = Math.max(1, now - ultimo.t); vel = { x: dx / dt, y: dy / dt }; ultimo = { t: now, x: e.clientX, y: e.clientY };
    } else if (ids.length === 2) {
      var o = punteros[ids[0] == e.pointerId ? ids[1] : ids[0]], a = punteros[e.pointerId];
      var d0 = Math.hypot(a.x - o.x, a.y - o.y), d1 = Math.hypot(e.clientX - o.x, e.clientY - o.y);
      if (d0 > 0) { var c = aMundo((e.clientX + o.x) / 2, (e.clientY + o.y) / 2); zoomEn(c.x, c.y, d0 / d1); }
    }
    punteros[e.pointerId] = { x: e.clientX, y: e.clientY };
  });
  function soltar(e) {
    delete punteros[e.pointerId];
    svg.classList.remove('is-arrastrando');
    if (movido) finArrastre = performance.now();
    else if (e.type === 'pointerup' && !e.target.closest('.oc-c-marca')) {
      // doble toque en el plano: acercar ahí (como en Mapas)
      var ahora = performance.now();
      if (toque && ahora - toque.t < 320 && Math.hypot(e.clientX - toque.x, e.clientY - toque.y) < 30) { var c = aMundo(e.clientX, e.clientY); zoomAnimado(c.x, c.y, 0.5); toque = null; }
      else toque = { t: ahora, x: e.clientX, y: e.clientY };
    }
    if (Object.keys(punteros).length || calm || !movido) return;
    var r = svg.getBoundingClientRect(), s = vb.w / r.width, vx = vel.x * 16, vy = vel.y * 16;
    if (Math.hypot(vx, vy) < 2) return;
    (function des() { vx *= 0.92; vy *= 0.92; vb.x -= vx * s; vb.y -= vy * s; aplicarVista(); if (Math.hypot(vx, vy) > 0.3) inercia = requestAnimationFrame(des); })();
  }
  svg.addEventListener('pointerup', soltar); svg.addEventListener('pointercancel', soltar);
  svg.addEventListener('wheel', function (e) { e.preventDefault(); var c = aMundo(e.clientX, e.clientY); zoomEn(c.x, c.y, Math.exp(e.deltaY * 0.0016)); }, { passive: false });
  svg.addEventListener('dblclick', function (e) { e.preventDefault(); });
  $$('[data-zoom]').forEach(function (b) { b.addEventListener('click', function () { var f = b.getAttribute('data-zoom') === '1' ? 0.6 : 1.6; zoomAnimado(vb.x + vb.w / 2, vb.y + vb.h / 2, f); }); });
  // botón «encuadrar»: vuelve a ver todos los recorridos de la jornada
  var bEnc = $('[data-encuadrar]'); if (bEnc) bEnc.addEventListener('click', function () { capas.yaEncuadrado = true; encuadrarDia(true); });

  // ---------- tiempo y posiciones ----------
  function enTramo(pts, t) {
    if (!pts || !pts.length) return null;
    if (t < pts[0][2]) return { x: pts[0][0], y: pts[0][1], i: 0, estado: 'antes' };
    var n = pts.length - 1;
    if (t >= pts[n][2]) return { x: pts[n][0], y: pts[n][1], i: n, estado: 'despues' };
    for (var i = 0; i < n; i++) {
      var a = pts[i], b = pts[i + 1];
      if (t >= a[2] && t <= b[2]) { var k = b[2] === a[2] ? 0 : (t - a[2]) / (b[2] - a[2]); return { x: a[0] + (b[0] - a[0]) * k, y: a[1] + (b[1] - a[1]) * k, i: i, estado: 'calle' }; }
    }
    return null;
  }
  var delDia = function () { return D.hermandades.filter(function (h) { return h.d === dia; }).sort(function (a, b) { return (a.o || 0) - (b.o || 0); }); };
  function limites() { var a = Infinity, b = -Infinity; delDia().forEach(function (h) { for (var k in h.t) { var p = h.t[k]; a = Math.min(a, p[0][2]); b = Math.max(b, p[p.length - 1][2]); } }); return [a - 30, b + 30]; }

  // Mismo tono en la misma jornada (hay muchos morados y negros): las siguientes se separan en luz y un poco de tono
  function variar(hex, k) {
    var r = parseInt(hex.slice(1, 3), 16) / 255, g = parseInt(hex.slice(3, 5), 16) / 255, b = parseInt(hex.slice(5, 7), 16) / 255;
    var mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn, s = d ? d / (1 - Math.abs(2 * l - 1)) : 0, h = 0;
    if (d) h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60;
    var paso = [[0, 0], [0.13, 10], [-0.13, -10], [0.22, -18], [-0.2, 18]][k % 5]; l = Math.min(0.88, Math.max(0.42, l + paso[0])); h = (h + paso[1] + 360) % 360;
    var c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2, q = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
    return '#' + q.map(function (v) { return ('0' + Math.round((v + m) * 255).toString(16)).slice(-2); }).join('');
  }
  function dibujarRutas() {
    capas.rutas.textContent = ''; capas.marcas.textContent = '';
    var xs = [], ys = [];
    var PAL = ['#e0b84f', '#e8735a', '#5fb3d9', '#9c7ce0', '#6cc58a', '#e86fa6', '#f09a3e', '#4fc7c0', '#c9d36a', '#d98bd9', '#7fa2f0', '#e5c07b'], usados = {};
    delDia().forEach(function (h, i) {
      var pts = h.t.paso || h.t.cruz, base = h.col || PAL[i % PAL.length], k = usados[base] = (usados[base] || 0) + 1; h.hc = k > 1 ? variar(base, k - 1) : base; // el color de su hábito; sin dato, la paleta
      // tramos por calle, continuos; los que no se pudieron enrutar (recta de más de 150 m entre dos puntos oficiales), discontinuos
      // salidas extraordinarias: el regreso (posición 7) va aparte, con trazo discontinuo
      var d = '', da = '', dr = '', de = '', enR = false, enE = false;
      pts.forEach(function (p, j) {
        if (!j) { d = 'M' + p[0] + ' ' + p[1]; return; }
        var q = pts[j - 1], recta = !p[6] && !q[6] && Math.hypot(p[0] - q[0], p[1] - q[1]) > 150;
        if (recta) { da += 'M' + q[0] + ' ' + q[1] + 'L' + p[0] + ' ' + p[1]; d += 'M' + p[0] + ' ' + p[1]; enR = enE = false; }
        else if (p[7] && q[7]) { dr += (enR ? '' : 'M' + q[0] + ' ' + q[1]) + 'L' + p[0] + ' ' + p[1]; d += 'M' + p[0] + ' ' + p[1]; enR = true; enE = false; }
        // tramo estimado: el itinerario no da sus calles; se dibuja en discontinuo fino (leyenda «Tramo estimado»)
        else if (q[5]) { de += (enE ? '' : 'M' + q[0] + ' ' + q[1]) + 'L' + p[0] + ' ' + p[1]; d += 'M' + p[0] + ' ' + p[1]; enE = true; enR = false; }
        else { d += 'L' + p[0] + ' ' + p[1]; enR = enE = false; }
      });
      var st = '--hc:' + h.hc;
      var r = el('path', { 'class': 'oc-c-ruta', d: d, 'data-s': h.s, style: st }); capas.rutas.appendChild(r);
      if (dr) capas.rutas.appendChild(el('path', { 'class': 'oc-c-ruta is-regreso', d: dr, 'data-s': h.s, style: st }));
      if (da) capas.rutas.appendChild(el('path', { 'class': 'oc-c-ruta is-aprox', d: da, 'data-s': h.s, style: st }));
      if (de) { capas.rutas.appendChild(el('path', { 'class': 'oc-c-ruta is-estimado', d: de, 'data-s': h.s, style: st })); h.est = true; }
      // marca de la hermandad: su titular (o su inicial bordada) en un medallón con galón de oro
      var g = el('g', { 'class': 'oc-c-marca', 'data-s': h.s, tabindex: '0', role: 'button', 'aria-label': h.n, style: '--hc:' + h.hc });
      g.appendChild(el('circle', { 'class': 'oc-c-halo', r: '30' }));
      g.appendChild(el('circle', { 'class': 'oc-c-galon', r: '22' }));
      if (h.img) { var cp = el('clipPath', { id: 'cp-' + h.s }); cp.appendChild(el('circle', { r: '19' })); g.appendChild(cp); g.appendChild(el('image', { href: h.img, x: '-19', y: '-19', width: '38', height: '38', 'clip-path': 'url(#cp-' + h.s + ')', preserveAspectRatio: 'xMidYMid slice' })); }
      else { g.appendChild(el('circle', { 'class': 'oc-c-fondo', r: '19' })); var tx = el('text', { 'class': 'oc-c-ini', y: '7' }); tx.textContent = h.ini; g.appendChild(tx); }
      // nombre corto bajo el medallón (se ve al acercar el plano o al elegirla)
      var nom = el('text', { 'class': 'oc-c-nombre', y: '40' }); nom.textContent = h.n.length > 24 ? h.n.slice(0, 23).replace(/\s+\S*$/, '') + '…' : h.n; g.appendChild(nom);
      var cz = el('circle', { 'class': 'oc-c-cruz', r: '6', 'data-cruz': h.s });
      capas.marcas.appendChild(cz); capas.marcas.appendChild(g);
      g.addEventListener('click', function () { if (performance.now() - finArrastre < 250) return; abrir(h); }); g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrir(h); } });
    });
    encuadrarDia(!!capas.yaEncuadrado); capas.yaEncuadrado = true;
  }
  // Encuadre de la jornada: las cofradías que están en la calle (y su recorrido); si no hay ninguna, toda la jornada
  function encuadrarDia(animar) {
    var xs = [], ys = [], hs = delDia();
    var enCalle = hs.filter(function (h) { var p = enTramo(h.t.paso || h.t.cruz, T); return p && p.estado === 'calle'; });
    (enCalle.length ? enCalle : hs).forEach(function (h) { (h.t.paso || h.t.cruz).forEach(function (p) { xs.push(p[0]); ys.push(p[1]); }); });
    if (xs.length) encuadrar(xs, ys, animar);
  }
  // posición de las marcas (se llama al cambiar la hora y al mover o ampliar el plano)
  function colocarMarcas() {
    // posiciones reales y, si dos medallones se pisan en pantalla, se separan (como las chinchetas de Mapas) con una guía
    var ms = [];
    delDia().forEach(function (h) {
      var paso = enTramo(h.t.paso || h.t.cruz, T), cruz = enTramo(h.t.cruz || h.t.paso, T);
      var g = capas.marcas.querySelector('.oc-c-marca[data-s="' + h.s + '"]'), cz = capas.marcas.querySelector('[data-cruz="' + h.s + '"]');
      if (g && paso) ms.push({ g: g, x: paso.x, y: paso.y, px: paso.x, py: paso.y, sel: g.classList.contains('is-sel') });
      if (cz && cruz) { cz.setAttribute('cx', cruz.x.toFixed(1)); cz.setAttribute('cy', cruz.y.toFixed(1)); cz.setAttribute('r', (6 * Z).toFixed(2)); }
    });
    var R = 46 * Z; // diámetro del medallón con su galón, en metros a este zoom
    for (var it = 0; it < 8; it++) for (var a = 0; a < ms.length; a++) for (var b = a + 1; b < ms.length; b++) {
      var A = ms[a], B = ms[b], dx = B.px - A.px, dy = B.py - A.py, d = Math.hypot(dx, dy);
      if (d >= R) continue;
      if (d < 0.01) { dx = Math.cos(a + b); dy = Math.sin(a + b); d = 1; }
      var emp = (R - d) / 2, ux = dx / d, uy = dy / d;
      A.px -= ux * emp; A.py -= uy * emp; B.px += ux * emp; B.py += uy * emp;
    }
    posMarcas = ms.map(function (m) { return [m.px, m.py]; });
    var guias = capas.guias; if (guias) guias.textContent = '';
    ms.forEach(function (m) {
      m.g.setAttribute('transform', 'translate(' + m.px.toFixed(1) + ' ' + m.py.toFixed(1) + ') scale(' + Z.toFixed(3) + ')');
      if (guias && Math.hypot(m.px - m.x, m.py - m.y) > 4 * Z) { guias.appendChild(el('path', { 'class': 'oc-c-guia', d: 'M' + m.x.toFixed(1) + ' ' + m.y.toFixed(1) + 'L' + m.px.toFixed(1) + ' ' + m.py.toFixed(1) })); guias.appendChild(el('circle', { 'class': 'oc-c-guia-punto', cx: m.x.toFixed(1), cy: m.y.toFixed(1), r: (3.5 * Z).toFixed(2) })); }
    });
    capas.mundo && capas.mundo.querySelectorAll('.oc-c-parada').forEach(function (m) { m.setAttribute('transform', m.getAttribute('transform').replace(/scale\([^)]*\)/, 'scale(' + Z.toFixed(3) + ')')); });
  }
  function actualizar() {
    hora.textContent = hhmm(T); rango.setAttribute('aria-valuetext', hhmm(T));
    capas.cortejos.textContent = '';
    var filas = [];
    colocarMarcas();
    delDia().forEach(function (h) {
      var paso = enTramo(h.t.paso || h.t.cruz, T), cruz = enTramo(h.t.cruz || h.t.paso, T);
      var g = capas.marcas.querySelector('.oc-c-marca[data-s="' + h.s + '"]'), cz = capas.marcas.querySelector('[data-cruz="' + h.s + '"]');
      var est = !paso ? 'fuera' : (cruz && cruz.estado === 'calle') || paso.estado === 'calle' ? 'calle' : paso.estado === 'antes' && (!cruz || cruz.estado === 'antes') ? 'antes' : 'despues';
      if (g) g.setAttribute('data-estado', est);
      if (cz) cz.setAttribute('data-estado', est);
      // el recorrido de la que está en la calle ahora se ve; los demás, de fondo
      capas.rutas.querySelectorAll('.oc-c-ruta[data-s="' + h.s + '"]').forEach(function (r) { r.setAttribute('data-estado', est); });
      // el cortejo ocupa la calle desde el paso hasta la cruz de guía
      if (est === 'calle' && h.t.paso && cruz) {
        var pts = h.t.paso, i0 = paso.i, d = 'M' + paso.x + ' ' + paso.y, best = i0, bd = Infinity;
        for (var j = i0; j < Math.min(pts.length, i0 + 600); j++) { var dd = Math.hypot(pts[j][0] - cruz.x, pts[j][1] - cruz.y); if (dd < bd) { bd = dd; best = j; } }
        // por los tramos sin calle conocida (recta de más de 150 m entre puntos oficiales) el cortejo no se dibuja
        for (var k = i0 + 1; k <= best; k++) { var pa = pts[k - 1], pb = pts[k], salto = !pa[6] && !pb[6] && Math.hypot(pb[0] - pa[0], pb[1] - pa[1]) > 150; d += (salto ? 'M' : 'L') + pb[0] + ' ' + pb[1]; }
        // la cruz de guía solo se une si está junto al recorrido (si no, sería una recta inventada a través de la ciudad)
        if (bd < 80) d += 'L' + cruz.x + ' ' + cruz.y;
        capas.cortejos.appendChild(el('path', { 'class': 'oc-c-cortejo', d: d }));
      }
      var pts2 = h.t.paso || h.t.cruz, sal = pts2[0][2], fin = pts2[pts2.length - 1][2];
      var donde = est === 'calle' ? pts2[Math.min(paso.i + 1, pts2.length - 1)][3] : '';
      var por = pts2[paso ? paso.i : 0][3] || donde;
      filas.push({ h: h, est: est, t: est === 'despues' ? fin : sal, txt: est === 'calle' ? (/^salida$/i.test(por) ? 'Saliendo de su templo' : /^(entrada|recogida)$/i.test(por) ? 'Entrando en su templo' : 'Por ' + por) : est === 'antes' ? 'Sale a las ' + hhmm(sal) : 'Recogida a las ' + hhmm(fin) });
    });
    // lista: primero las que están en la calle, luego las que van a salir y al final las recogidas; dentro de cada grupo, por hora
    var orden = { calle: 0, antes: 1, despues: 2, fuera: 3 };
    filas.sort(function (a, b) { return orden[a.est] - orden[b.est] || a.t - b.t; });
    lista.textContent = '';
    filas.forEach(function (f) {
      var li = document.createElement('li'); li.className = 'oc-calle-item'; li.setAttribute('data-estado', f.est);
      var b = document.createElement('button'); b.type = 'button';
      var thumb = document.createElement('span'); thumb.className = 'oc-calle-thumb';
      if (f.h.img) { var im = document.createElement('img'); im.src = f.h.img; im.alt = ''; im.loading = 'lazy'; thumb.appendChild(im); } else thumb.textContent = f.h.ini;
      var t = document.createElement('span'); t.className = 'oc-calle-txt';
      var n = document.createElement('strong'); n.textContent = f.h.n; var s = document.createElement('span'); s.textContent = f.txt;
      t.appendChild(n); t.appendChild(s); b.appendChild(thumb); b.appendChild(t);
      var dot = document.createElement('i'); dot.className = 'oc-calle-dot'; dot.setAttribute('aria-hidden', 'true'); b.appendChild(dot);
      b.addEventListener('click', function () { abrir(f.h); });
      li.appendChild(b); lista.appendChild(li);
    });
    if (sel) pintarFicha(sel);
  }

  // ---------- ficha de una hermandad: dónde va, por dónde pasará y cómo llegar ----------
  var ficha = $('[data-ficha]'), abridor = null;
  function abrir(h) {
    sel = h; pintarFicha(h);
    if (ficha.hidden) abridor = document.activeElement;
    ficha.hidden = false; sec.classList.add('has-ficha'); requestAnimationFrame(function () { ficha.classList.add('is-open'); var pn = ficha.querySelector('.oc-sheet-panel'); if (pn) sec.style.setProperty('--ficha-h', pn.offsetHeight + 'px'); });
    // el foco entra en la ficha (antes se quedaba detrás del diálogo)
    var x = $('[data-ficha-cerrar]'); if (x) setTimeout(function () { x.focus({ preventScroll: true }); }, calm ? 0 : 40);
    var rp = h.t.paso || h.t.cruz; if (rp && rp.length) encuadrar(rp.map(function (q) { return q[0]; }), rp.map(function (q) { return q[1]; }), !calm);
    $$('.oc-c-marca, .oc-c-ruta').forEach(function (n) { n.classList.toggle('is-sel', n.getAttribute('data-s') === h.s); });
    // la elegida, por encima de las demás (marca y recorrido), y el resto atenuado
    var gm = capas.marcas.querySelector('.oc-c-marca[data-s="' + h.s + '"]'); if (gm) capas.marcas.appendChild(gm);
    var rr = capas.rutas.querySelector('.oc-c-ruta[data-s="' + h.s + '"]'); if (rr) capas.rutas.appendChild(rr);
    svg.classList.add('has-sel');
  }
  function cerrar() { sel = null; svg.classList.remove('has-sel'); sec.classList.remove('has-ficha'); ficha.classList.remove('is-open'); setTimeout(function () { ficha.hidden = true; }, calm ? 0 : 200); $$('.is-sel').forEach(function (n) { n.classList.remove('is-sel'); }); if (abridor && abridor.focus && document.contains(abridor)) abridor.focus({ preventScroll: true }); abridor = null; }
  $('[data-ficha-cerrar]').addEventListener('click', cerrar);
  ficha.addEventListener('click', function (e) { if (e.target === ficha) cerrar(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !ficha.hidden) cerrar(); });
  function enlaceMapa(x, y, apple) { var ll = aLatLon(x, y); return apple ? 'https://maps.apple.com/?daddr=' + ll[0].toFixed(6) + ',' + ll[1].toFixed(6) + '&dirflg=w' : 'https://www.google.com/maps/dir/?api=1&destination=' + ll[0].toFixed(6) + ',' + ll[1].toFixed(6) + '&travelmode=walking'; }
  function pintarFicha(h) {
    $('[data-ficha-titulo]').textContent = h.n;
    var c = $('[data-ficha-cuerpo]'); c.textContent = '';
    var pts = h.t.paso || h.t.cruz, p = enTramo(pts, T);
    var est = document.createElement('p'); est.className = 'oc-calle-estado';
    est.textContent = !p ? '' : p.estado === 'antes' ? 'Sale a las ' + hhmm(pts[0][2]) + ' de ' + pts[0][3].toLowerCase().replace(/^salida$/, 'su templo') : p.estado === 'despues' ? 'Ya se ha recogido (' + hhmm(pts[pts.length - 1][2]) + ')' : 'Ahora, aproximadamente, por ' + pts[p.i][3];
    c.appendChild(est);
    if (h.coln) {
      var hb = document.createElement('p'); hb.className = 'oc-calle-habito';
      var mu = document.createElement('i'); mu.setAttribute('aria-hidden', 'true'); mu.style.background = h.hc; hb.appendChild(mu);
      hb.appendChild(document.createTextNode('Color del recorrido: su hábito, ' + h.coln));
      if (h.colf) { hb.appendChild(document.createTextNode(' (')); var fa = document.createElement('a'); fa.href = h.colf; fa.target = '_blank'; fa.rel = 'noopener'; fa.textContent = 'fuente'; hb.appendChild(fa); hb.appendChild(document.createTextNode(')')); }
      c.appendChild(hb);
    }
    var x = h.x;
    if (x) {
      // salida extraordinaria: fecha y, entre la ida y el regreso, el acto en el templo de destino
      var fIda = -1; for (var a = 0; a < pts.length; a++) if (!pts[a][7]) fIda = a;
      var rIni = pts[fIda + 1];
      if (p && x.acto && rIni && T >= pts[fIda][2] && T < rIni[2]) est.textContent = x.acto + ' (' + hhmm(pts[fIda][2]) + '–' + hhmm(rIni[2]) + ')';
      var fe = document.createElement('p'); fe.className = 'oc-calle-extra';
      var fl = new Date(x.fecha + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      fe.textContent = (x.fecha < hoyISO() ? 'Celebrada el ' : '') + fl + ' · ' + x.titulo;
      c.insertBefore(fe, est);
    }
    // próximo punto alcanzable: el siguiente del recorrido (o la salida si aún no ha salido)
    var i0 = p ? (p.estado === 'antes' ? 0 : Math.min(p.i + 1, pts.length - 1)) : 0;
    var ol = document.createElement('ol'); ol.className = 'oc-calle-proximos';
    var oficiales = pts.slice(i0).filter(function (q) { return !q[6]; });
    oficiales.slice(0, 5).forEach(function (q) { var li = document.createElement('li'); var hh = document.createElement('b'); hh.textContent = (h.x && !q[4] ? '≈' : '') + hhmm(q[2]); var l = document.createElement('span'); l.textContent = q[3] + (q[5] ? ' (aprox.)' : ''); li.appendChild(hh); li.appendChild(l); ol.appendChild(li); });
    c.appendChild(ol);
    var dest = oficiales[Math.min(1, oficiales.length - 1)] || pts[pts.length - 1];
    var acc = document.createElement('div'); acc.className = 'oc-calle-acc';
    [['Cómo llegar · Google Maps', enlaceMapa(dest[0], dest[1], false)], ['Apple Maps', enlaceMapa(dest[0], dest[1], true)]].forEach(function (x, i) { var a = document.createElement('a'); a.className = 'oc-btn' + (i ? ' is-quiet' : ''); a.href = x[1]; a.target = '_blank'; a.rel = 'noopener'; a.textContent = x[0]; acc.appendChild(a); });
    var f = document.createElement('a'); f.className = 'oc-btn is-quiet'; f.href = (window.OC_BASE || '/') + 'hermandad/' + h.s + '/'; f.textContent = 'Ver la hermandad'; acc.appendChild(f);
    c.appendChild(acc);
    if (x) {
      // itinerario completo, tal cual el cartel: solo las horas oficiales
      var it = document.createElement('details'); it.className = 'oc-calle-iti';
      var su = document.createElement('summary'); su.textContent = 'Itinerario completo'; it.appendChild(su);
      var tramo = function (tit, lista, cls) {
        var hh3 = document.createElement('p'); hh3.className = 'oc-calle-iti-t ' + cls; hh3.textContent = tit; it.appendChild(hh3);
        var ul = document.createElement('ol');
        lista.forEach(function (q) { var li = document.createElement('li'); if (q[1]) { var bb = document.createElement('b'); bb.textContent = q[1]; li.appendChild(bb); } li.appendChild(document.createTextNode(q[0])); ul.appendChild(li); });
        it.appendChild(ul);
      };
      if (x.iti.ida) tramo('Ida', x.iti.ida, 'is-ida');
      if (x.acto) { var ac = document.createElement('p'); ac.className = 'oc-calle-iti-acto'; ac.textContent = x.acto; it.appendChild(ac); }
      if (x.iti.regreso) tramo('Regreso', x.iti.regreso, 'is-regreso');
      var fu = document.createElement('p'); fu.className = 'oc-calle-iti-fuente'; fu.appendChild(document.createTextNode('Fuente: '));
      if (x.url) { var fa = document.createElement('a'); fa.href = x.url; fa.target = '_blank'; fa.rel = 'noopener'; fa.textContent = x.fuente; fu.appendChild(fa); } else fu.appendChild(document.createTextNode(x.fuente));
      fu.appendChild(document.createTextNode('. Las horas sin marcar en el plano son una estimación.')); it.appendChild(fu);
      c.appendChild(it);
    }
    if (yo) {
      // el punto del recorrido más cercano a ti que aún no ha pasado
      var mejor = null; for (var k = i0; k < pts.length; k++) { if (pts[k][6]) continue; var d = Math.hypot(pts[k][0] - yo.x, pts[k][1] - yo.y); if (!mejor || d < mejor.d) mejor = { d: d, q: pts[k] }; }
      if (mejor) { var n = document.createElement('p'); n.className = 'oc-calle-cerca'; n.textContent = 'Cerca de ti: pasará por ' + mejor.q[3] + ' hacia las ' + hhmm(mejor.q[2]) + ' (a unos ' + (mejor.d < 1000 ? Math.round(mejor.d / 10) * 10 + ' m' : (mejor.d / 1000).toFixed(1) + ' km') + ').'; c.appendChild(n); }
    }
  }

  // ---------- mi ubicación ----------
  $('[data-yo]').addEventListener('click', function () {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(function (pos) {
      var la = pos.coords.latitude, lo = pos.coords.longitude;
      yo = { x: (lo - D.origen[1]) * D.kx, y: (D.origen[0] - la) * D.ky };
      capas.yo.textContent = ''; capas.yo.appendChild(el('circle', { 'class': 'oc-c-yo-halo', cx: yo.x, cy: yo.y, r: '40' })); capas.yo.appendChild(el('circle', { 'class': 'oc-c-yo-punto', cx: yo.x, cy: yo.y, r: '9' }));
      if (Math.abs(yo.x) < 20000 && Math.abs(yo.y) < 20000) encuadrar([yo.x - 600, yo.x + 600], [yo.y - 600, yo.y + 600], true);
      if (sel) pintarFicha(sel);
    }, function () { }, { enableHighAccuracy: true, timeout: 10000 });
  });

  // ---------- jornada, reloj y reproducción ----------
  var playing = false, raf = 0;
  function ponerDia(d) {
    dia = d; $$('[data-dia]').forEach(function (b) {
      var si = b.getAttribute('data-dia') === d; b.setAttribute('aria-selected', si ? 'true' : 'false');
      // la pestaña elegida, a la vista en la tira deslizable (sin mover la página)
      if (si) { var tira = b.parentNode, x = b.offsetLeft - (tira.clientWidth - b.offsetWidth) / 2; if (tira.scrollWidth > tira.clientWidth) tira.scrollLeft = Math.max(0, x); }
    });
    var ley = $('[data-leyenda]');
    if (ley) {
      // ida y regreso, en las salidas extraordinarias; «tramo estimado», si alguna cofradía de la jornada lo tiene
      var hay = delDia(), extra = hay.some(function (h) { return h.x; }), est = hay.some(function (h) { return (h.t.paso || h.t.cruz || []).some(function (p) { return p[5]; }); });
      ley.hidden = !extra && !est;
      $$('.is-ida, .is-regreso', ley).forEach(function (s) { s.hidden = !extra; }); var se = $('.is-estimado', ley); if (se) se.hidden = !est;
    }
    var L = limites(); rango.min = L[0]; rango.max = L[1];
    var hoy = fechas[d] === hoyISO(), ah = ahoraMin();
    $('[data-ahora]').hidden = !hoy;
    T = hoy && ah >= L[0] - 180 ? Math.max(L[0], Math.min(L[1], ah < L[0] - 180 ? ah + 1440 : ah)) : L[0] + 60;
    rango.value = T; dibujarRutas(); actualizar(); opcionesInicio(); rParadas.textContent = '';
  }
  $$('[data-dia]').forEach(function (b) { b.addEventListener('click', function () { parar(); ponerDia(b.getAttribute('data-dia')); }); });
  rango.addEventListener('input', function () { parar(); T = +rango.value; actualizar(); });
  $('[data-ahora]').addEventListener('click', function () { parar(); var a = ahoraMin(); T = a < +rango.min - 180 ? a + 1440 : a; rango.value = T; actualizar(); });
  function parar() { playing = false; cancelAnimationFrame(raf); sec.classList.remove('is-playing'); }
  $('[data-play]').addEventListener('click', function () {
    if (playing) return parar();
    playing = true; sec.classList.add('is-playing');
    if (+rango.value >= +rango.max - 1) T = +rango.min;
    var t0 = performance.now(), base = T;
    (function paso(t) { if (!playing) return; T = base + (t - t0) / 1000 * 12; if (T >= +rango.max) { T = +rango.max; parar(); } rango.value = T; actualizar(); if (playing) raf = requestAnimationFrame(paso); })(t0);
  });

  // ---------- ruta de penitencia del día ----------
  // Rejilla de «sitios para verlas»: los puntos de todos los recorridos de la jornada agrupados cada ~120 m.
  // Desde donde estés, elige la siguiente parada a la que llegas andando (70 m/min) antes de que pase una cofradía que
  // aún no has visto, con la menor espera; en modo «evitar la bulla» penaliza las zonas donde coinciden muchas.
  var rForm = $('[data-ruta-form]'), rParadas = $('[data-ruta-paradas]'), rInicio = $('[data-ruta-inicio]');
  var TIPOS = { bar: 'Bar o cafetería', comer: 'Para comer', tienda: 'Tienda de alimentación', panaderia: 'Panadería', agua: 'Fuente de agua', aseo: 'Aseos', farmacia: 'Farmacia' };
  function opcionesInicio() {
    var L = limites(); rInicio.textContent = '';
    for (var m = Math.ceil(L[0] / 30) * 30; m <= L[1] - 60; m += 30) { var o = document.createElement('option'); o.value = m; o.textContent = hhmm(m); rInicio.appendChild(o); }
    var cerca = Math.max(+rInicio.options[0].value, Math.round(T / 30) * 30); rInicio.value = Math.min(cerca, +rInicio.options[rInicio.options.length - 1].value);
  }
  function planificar(t0, horas, modo) {
    var ev = [], celdas = {};
    delDia().forEach(function (h) { var pts = h.t.paso || h.t.cruz; pts.forEach(function (p) { if (p[6]) return; var k = Math.round(p[0] / 120) + ':' + Math.round(p[1] / 120); var c = celdas[k] || (celdas[k] = { x: 0, y: 0, n: 0, ev: [], lugar: p[3] }); c.x += p[0]; c.y += p[1]; c.n++; c.ev.push({ t: p[2], h: h, lugar: p[3] }); }); });
    var lista = Object.keys(celdas).map(function (k) { var c = celdas[k]; c.x /= c.n; c.y /= c.n; return c; });
    var bulla = function (c, t) { var n = 0, vistas = {}; lista.forEach(function (o) { if (Math.hypot(o.x - c.x, o.y - c.y) > 300) return; o.ev.forEach(function (e) { if (Math.abs(e.t - t) <= 45 && !vistas[e.h.s]) { vistas[e.h.s] = 1; n++; } }); }); return n + (c.ev.some(function (e) { return /carrera oficial|campana|catedral/i.test(e.lugar); }) ? 4 : 0); };
    var pos = yo && Math.hypot(yo.x, yo.y) < 15000 ? { x: yo.x, y: yo.y } : null, t = t0, fin = t0 + horas * 60, vistas = {}, paradas = [];
    while (t < fin && paradas.length < 10) {
      var mejor = null;
      lista.forEach(function (c) {
        var andar = pos ? Math.hypot(c.x - pos.x, c.y - pos.y) / 70 : 0, llega = t + andar + (pos ? 4 : 0);
        if (andar > 30) return; // más de media hora andando entre bullas no es realista
        c.ev.forEach(function (e) {
          if (vistas[e.h.s] || e.t < llega + 2 || e.t > llega + 60 || e.t > fin) return;
          // cuántas cofradías aún no vistas pasan por aquí en la hora siguiente (esperarlas en el mismo sitio)
          var nuevas = {}; c.ev.forEach(function (o) { if (!vistas[o.h.s] && o.t >= e.t && o.t <= Math.min(fin, e.t + 60)) { if (!nuevas[o.h.s] || o.t < nuevas[o.h.s].t) nuevas[o.h.s] = o; } });
          var nn = Object.keys(nuevas).length, b = bulla(c, e.t);
          var valor = nn / ((e.t - t) + andar + 10);
          if (modo === 'tranquilo') valor /= (1 + b * 0.3) * (/carrera|catedral|tribuna|oficial|campana/i.test(e.lugar) ? 3 : 1);
          if (!mejor || valor > mejor.valor) mejor = { valor: valor, c: c, t: e.t, andar: andar, nuevas: nuevas, bulla: b };
        });
      });
      if (!mejor) { t += 30; continue; } // hueco sin cofradías a mano: se espera media hora y se vuelve a mirar
      var vistasAqui = Object.keys(mejor.nuevas).map(function (s) { return mejor.nuevas[s]; }).sort(function (a, b) { return a.t - b.t; });
      vistasAqui.forEach(function (e) { vistas[e.h.s] = 1; });
      var sit = (D.sitios || []).map(function (s) { return [s, Math.hypot(s[0] - mejor.c.x, s[1] - mejor.c.y)]; }).filter(function (s) { return s[1] < 160; }).sort(function (a, b) { return a[1] - b[1]; });
      paradas.push({ c: mejor.c, t: mejor.t, andar: mejor.andar, ven: vistasAqui, bulla: mejor.bulla, sitios: sit });
      pos = { x: mejor.c.x, y: mejor.c.y };
      t = vistasAqui[vistasAqui.length - 1].t + 10;
    }
    return paradas;
  }
  // ---------- tramos a pie por las calles del propio plano ----------
  // Grafo ligero con las líneas de calles ya cargadas (nodos de coordenada idéntica = cruces). Las calles que acaban a pocos metros
  // de otra (cruces que la simplificación quitó del trazado) se unen a ella. Si no hay camino verosímil, se deja la recta.
  var grafo = null;
  function crearGrafo() {
    var id = {}, nx = [], ny = [], ady = [], segs = [], puntas = [];
    function nodo(x, y) { var k = x + ',' + y, i = id[k]; if (i === undefined) { i = nx.length; id[k] = i; nx.push(x); ny.push(y); ady.push([]); } return i; }
    function arista(a, b) { if (a === b) return; var d = Math.hypot(nx[a] - nx[b], ny[a] - ny[b]); ady[a].push([b, d]); ady[b].push([a, d]); }
    [D.calles, D.principales].forEach(function (ls) {
      ls.forEach(function (l) {
        var prev = -1, primero = -1;
        for (var i = 0; i < l.length; i += 2) { var n = nodo(l[i], l[i + 1]); if (primero < 0) primero = n; if (prev >= 0 && prev !== n) { arista(prev, n); segs.push([prev, n]); } prev = n; }
        if (primero >= 0 && prev >= 0) { puntas.push(primero); if (prev !== primero) puntas.push(prev); }
      });
    });
    var C = 25, cel = {};
    function celdas(a, b, f) { var L = Math.hypot(nx[b] - nx[a], ny[b] - ny[a]), n = Math.max(1, Math.ceil(L / 12)); for (var s = 0; s <= n; s++) { f(Math.floor((nx[a] + (nx[b] - nx[a]) * s / n) / C) + ':' + Math.floor((ny[a] + (ny[b] - ny[a]) * s / n) / C)); } }
    segs.forEach(function (s, i) { var vistos = {}; celdas(s[0], s[1], function (k) { if (vistos[k]) return; vistos[k] = 1; (cel[k] || (cel[k] = [])).push(i); }); });
    var hechas = {};
    puntas.forEach(function (p) {
      if (hechas[p] || ady[p].length > 1) return; hechas[p] = 1;
      var cx = Math.floor(nx[p] / C), cy = Math.floor(ny[p] / C), mejor = null;
      for (var a = -1; a <= 1; a++) for (var b = -1; b <= 1; b++) (cel[(cx + a) + ':' + (cy + b)] || []).forEach(function (si) {
        var A = segs[si][0], B = segs[si][1]; if (A === p || B === p) return;
        var dx = nx[B] - nx[A], dy = ny[B] - ny[A], L2 = dx * dx + dy * dy || 1, t = Math.max(0, Math.min(1, ((nx[p] - nx[A]) * dx + (ny[p] - ny[A]) * dy) / L2));
        var px = nx[A] + dx * t, py = ny[A] + dy * t, d = Math.hypot(nx[p] - px, ny[p] - py);
        if (d <= 7 && (!mejor || d < mejor.d)) mejor = { d: d, A: A, B: B, t: t, px: px, py: py };
      });
      if (!mejor) return;
      if (mejor.t <= 0.02) arista(p, mejor.A); else if (mejor.t >= 0.98) arista(p, mejor.B);
      else { var q = nx.length; nx.push(mejor.px); ny.push(mejor.py); ady.push([]); arista(q, mejor.A); arista(q, mejor.B); arista(p, q); }
    });
    // Componentes conexas: las paradas se atan siempre a la red grande, no a un trozo de calle suelto.
    var comp = new Array(nx.length), tam = [];
    for (var s0 = 0; s0 < nx.length; s0++) {
      if (comp[s0] !== undefined) continue;
      var pila = [s0], c = tam.length, n = 0; comp[s0] = c;
      while (pila.length) { var u0 = pila.pop(); n++; ady[u0].forEach(function (e) { if (comp[e[0]] === undefined) { comp[e[0]] = c; pila.push(e[0]); } }); }
      tam.push(n);
    }
    var G = 60, rej = {};
    nx.forEach(function (x, i) { if (!ady[i].length) return; var k = Math.floor(x / G) + ':' + Math.floor(ny[i] / G); (rej[k] || (rej[k] = [])).push(i); });
    return { nx: nx, ny: ny, ady: ady, rej: rej, G: G, comp: comp, tam: tam };
  }
  function nodoCerca(g, x, y) {
    var cx = Math.floor(x / g.G), cy = Math.floor(y / g.G), best = -1, bd = 1e9;
    for (var a = -2; a <= 2; a++) for (var b = -2; b <= 2; b++) (g.rej[(cx + a) + ':' + (cy + b)] || []).forEach(function (i) { if (g.tam[g.comp[i]] < 300) return; var d = Math.hypot(g.nx[i] - x, g.ny[i] - y); if (d < bd) { bd = d; best = i; } });
    return bd <= 120 ? best : -1;
  }
  // Camino por calles entre dos puntos del plano: [[x,y],…] o null si no hay uno verosímil (entonces se dibuja la recta).
  function caminoPorCalles(a, b) {
    if (!D.calles) return null;
    if (!grafo) grafo = crearGrafo();
    var g = grafo, recta = Math.hypot(b.x - a.x, b.y - a.y), s = nodoCerca(g, a.x, a.y), t = nodoCerca(g, b.x, b.y);
    if (s < 0 || t < 0) return null;
    var tope = recta * 2.6 + 500, dist = {}, de = {}, cola = [[0, s]]; dist[s] = 0;
    while (cola.length) {
      var mi = 0; for (var i = 1; i < cola.length; i++) if (cola[i][0] < cola[mi][0]) mi = i; // cola pequeña: basta el mínimo lineal
      var cur = cola.splice(mi, 1)[0], d = cur[0], u = cur[1];
      if (u === t) break; if (d > dist[u] || d > tope) continue;
      g.ady[u].forEach(function (e) { var nd = d + e[1]; if (nd < (dist[e[0]] === undefined ? 1e9 : dist[e[0]])) { dist[e[0]] = nd; de[e[0]] = u; cola.push([nd, e[0]]); } });
    }
    if (dist[t] === undefined || dist[t] > tope) return null;
    var ruta = [[b.x, b.y]], u2 = t; ruta.push([g.nx[t], g.ny[t]]);
    while (u2 !== s) { u2 = de[u2]; ruta.push([g.nx[u2], g.ny[u2]]); }
    ruta.push([a.x, a.y]); return ruta.reverse();
  }
  function pintarRuta(paradas) {
    rParadas.textContent = '';
    var vieja = capas.mundo.querySelector('.oc-c-ruta-mia'); if (vieja) vieja.remove();
    if (!paradas.length) { var li0 = document.createElement('li'); li0.className = 'oc-ruta-vacia'; li0.textContent = 'A esas horas no queda ninguna cofradía por ver. Prueba a empezar antes.'; rParadas.appendChild(li0); return; }
    var g = el('g', { 'class': 'oc-c-ruta-mia' }); capas.mundo.insertBefore(g, capas.marcas);
    g.appendChild(el('path', { 'class': 'oc-c-camino', d: paradas.map(function (p, i) {
      if (!i) return 'M' + p.c.x.toFixed(0) + ' ' + p.c.y.toFixed(0);
      var ruta = null; try { ruta = caminoPorCalles(paradas[i - 1].c, p.c); } catch (e) { ruta = null; }
      if (!ruta) return 'L' + p.c.x.toFixed(0) + ' ' + p.c.y.toFixed(0);
      return ruta.slice(1).map(function (q) { return 'L' + q[0].toFixed(0) + ' ' + q[1].toFixed(0); }).join('');
    }).join('') }));
    var xs = [], ys = [];
    paradas.forEach(function (p, i) {
      xs.push(p.c.x); ys.push(p.c.y);
      var m = el('g', { 'class': 'oc-c-parada', transform: 'translate(' + p.c.x.toFixed(0) + ' ' + p.c.y.toFixed(0) + ') scale(' + Z.toFixed(3) + ')' });
      m.appendChild(el('circle', { r: '14' })); var tx = el('text', { y: '5' }); tx.textContent = i + 1; m.appendChild(tx); g.appendChild(m);
      var li = document.createElement('li'); li.className = 'oc-ruta-parada';
      var cab = document.createElement('div'); cab.className = 'oc-ruta-cab';
      var n = document.createElement('span'); n.className = 'oc-ruta-n'; n.textContent = i + 1;
      var h = document.createElement('div');
      var lug = document.createElement('strong'); lug.textContent = hhmm(p.ven[0].t - 5) + ' · ' + (!p.ven[0].lugar || /^salida$/i.test(p.ven[0].lugar) ? 'A la salida de ' + p.ven[0].h.n : p.ven[0].lugar);
      var meta = document.createElement('span'); meta.textContent = (i ? 'Andando unos ' + Math.max(1, Math.round(p.andar)) + ' min desde la parada anterior · ' : '') + 'Afluencia ' + (p.bulla > 5 ? 'alta' : p.bulla > 2 ? 'media' : 'baja');
      h.appendChild(lug); h.appendChild(meta); cab.appendChild(n); cab.appendChild(h); li.appendChild(cab);
      var ul = document.createElement('ul'); ul.className = 'oc-ruta-ven';
      p.ven.forEach(function (e) { var x = document.createElement('li'); var b = document.createElement('b'); b.textContent = hhmm(e.t); var s = document.createElement('span'); s.textContent = e.h.n; x.appendChild(b); x.appendChild(s); ul.appendChild(x); });
      li.appendChild(ul);
      var cerca = {}; p.sitios.forEach(function (s) { var t2 = s[0][2]; if (!cerca[t2]) cerca[t2] = s; });
      var sit = document.createElement('div'); sit.className = 'oc-ruta-sitios';
      ['bar', 'comer', 'tienda', 'panaderia', 'agua', 'aseo', 'farmacia'].forEach(function (t2) { var s = cerca[t2]; if (!s) return; var ll = aLatLon(s[0][0], s[0][1]); var a = document.createElement('a'); a.href = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent((s[0][3] || TIPOS[t2]) + ' ' + ll[0].toFixed(5) + ',' + ll[1].toFixed(5)); a.target = '_blank'; a.rel = 'noopener'; a.textContent = TIPOS[t2] + (s[0][3] ? ': ' + s[0][3] : '') + ' (' + Math.round(s[1] / 10) * 10 + ' m)'; sit.appendChild(a); });
      if (sit.childNodes.length) li.appendChild(sit);
      var ll2 = aLatLon(p.c.x, p.c.y), ir = document.createElement('a'); ir.className = 'oc-btn is-quiet'; ir.href = 'https://www.google.com/maps/dir/?api=1&destination=' + ll2[0].toFixed(6) + ',' + ll2[1].toFixed(6) + '&travelmode=walking'; ir.target = '_blank'; ir.rel = 'noopener'; ir.textContent = 'Cómo llegar';
      li.appendChild(ir);
      rParadas.appendChild(li);
    });
    encuadrar(xs.concat(xs.map(function (x) { return x + 200; })), ys.concat(ys.map(function (y) { return y + 200; })), true);
    mapa.scrollIntoView({ behavior: calm ? 'auto' : 'smooth', block: 'start' });
  }
  rForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var modo = (rForm.querySelector('input[name="modo"]:checked') || {}).value || 'maximo';
    pintarRuta(planificar(+rInicio.value, +$('[data-ruta-horas]').value, modo));
  });

  fetch(sec.getAttribute('data-calle')).then(function (r) { return r.json(); }).then(function (j) {
    D = j; calcularLimites(); dibujarPlano();
    var hoy = hoyISO(), dHoy = null; for (var k in fechas) if (fechas[k] === hoy) dHoy = k;
    var botones = $$('[data-dia]').map(function (b) { return b.getAttribute('data-dia'); });
    // salidas extraordinarias: la próxima se destaca; las ya celebradas se apagan (se comprueba aquí, no al compilar)
    var proxima = null;
    $$('[data-fecha]').forEach(function (b) {
      var f = b.getAttribute('data-fecha'), pasada = f < hoy;
      b.classList.toggle('is-pasada', pasada);
      if (!pasada && !proxima) { proxima = b.getAttribute('data-dia'); b.classList.add('is-proxima'); b.setAttribute('aria-label', b.textContent + ' (próxima salida)'); }
      if (pasada) b.setAttribute('aria-label', b.textContent + ' (ya celebrada)');
    });
    // ?dia=<jornada> (desde la portada o desde «Hoy») manda; si no, la jornada de hoy; si no, la próxima salida extraordinaria;
    // si no, la jornada con más cofradías (la primera, Viernes de Dolores, suele tener muy pocas)
    var q = new URLSearchParams(location.search), pedido = q.get('dia');
    var masLlena = botones.filter(function (d) { return !document.querySelector('[data-dia="' + d.replace(/"/g, '\\"') + '"][data-fecha]'); }).sort(function (a, b) { return D.hermandades.filter(function (h) { return h.d === b; }).length - D.hermandades.filter(function (h) { return h.d === a; }).length; })[0];
    ponerDia(pedido && botones.indexOf(pedido) >= 0 ? pedido : dHoy && botones.indexOf(dHoy) >= 0 ? dHoy : proxima || masLlena || botones[0]);
    // ?t=<minutos> y ?h=<hermandad>: se llega desde la portada a la misma hora y, si se tocó un medallón, con su ficha abierta
    var tq = +q.get('t'); if (q.get('t') && isFinite(tq)) { T = Math.max(+rango.min, Math.min(+rango.max, tq)); rango.value = T; capas.yaEncuadrado = false; dibujarRutas(); actualizar(); }
    var hq = q.get('h'), hh = hq && delDia().filter(function (x) { return x.s === hq; })[0]; if (hh) abrir(hh);
    window.addEventListener('resize', function () { capas.yaEncuadrado = false; dibujarRutas(); actualizar(); });
  }).catch(function () { mapa.classList.add('is-error'); });
})();
