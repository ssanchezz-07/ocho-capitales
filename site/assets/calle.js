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
    capas.mundo.appendChild(el('path', { 'class': 'oc-c-calles', d: pathDe(D.calles) }));
    capas.mundo.appendChild(el('path', { 'class': 'oc-c-princ', d: pathDe(D.principales) }));
    capas.templos = el('g', { 'class': 'oc-c-templos' }); capas.mundo.appendChild(capas.templos);
    D.templos.forEach(function (t) { var g = el('g', { transform: 'translate(' + t.x + ' ' + t.y + ')' }); g.appendChild(el('path', { d: 'M0 -9V9M-6 -3H6' })); var ti = el('title', {}); ti.textContent = t.n; g.appendChild(ti); capas.templos.appendChild(g); });
    capas.rutas = el('g', { 'class': 'oc-c-rutas' }); capas.mundo.appendChild(capas.rutas);
    capas.cortejos = el('g', { 'class': 'oc-c-cortejos' }); capas.mundo.appendChild(capas.cortejos);
    capas.marcas = el('g', { 'class': 'oc-c-marcas' }); capas.mundo.appendChild(capas.marcas);
    capas.yo = el('g', { 'class': 'oc-c-yo' }); capas.mundo.appendChild(capas.yo);
  }
  // metros por píxel: las marcas se dibujan a tamaño de pantalla, sea cual sea el zoom
  var Z = 1;
  function aplicarVista() { svg.setAttribute('viewBox', vb.x + ' ' + vb.y + ' ' + vb.w + ' ' + vb.h); Z = vb.w / Math.max(1, mapa.clientWidth); if (D && dia) colocarMarcas(); }
  function encuadrar(xs, ys, animar) {
    var x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs), y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys);
    var r = mapa.clientWidth / Math.max(1, mapa.clientHeight), w = Math.max(x1 - x0, 400) * 1.15, h = Math.max(y1 - y0, 400) * 1.15;
    if (w / h > r) h = w / r; else w = h * r;
    var obj = { x: (x0 + x1) / 2 - w / 2, y: (y0 + y1) / 2 - h / 2, w: w, h: h };
    if (!animar || calm) { vb = obj; aplicarVista(); return; }
    var de = { x: vb.x, y: vb.y, w: vb.w, h: vb.h }, t0 = performance.now();
    (function paso(t) { var k = Math.min(1, (t - t0) / 520), e = 1 - Math.pow(1 - k, 3); for (var p in obj) vb[p] = de[p] + (obj[p] - de[p]) * e; aplicarVista(); if (k < 1) requestAnimationFrame(paso); })(t0);
  }

  // ---------- gestos: arrastrar con inercia, rueda y pellizco anclados al dedo ----------
  var punteros = {}, vel = { x: 0, y: 0 }, ultimo = null, inercia = 0;
  function aMundo(cx, cy) { var r = svg.getBoundingClientRect(); return { x: vb.x + (cx - r.left) / r.width * vb.w, y: vb.y + (cy - r.top) / r.height * vb.h }; }
  function zoomEn(px, py, f) { var w = Math.min(Math.max(vb.w * f, 150), 30000), k = w / vb.w; vb.x = px - (px - vb.x) * k; vb.y = py - (py - vb.y) * k; vb.w = w; vb.h = vb.h * k; aplicarVista(); }
  svg.addEventListener('pointerdown', function (e) { cancelAnimationFrame(inercia); svg.setPointerCapture(e.pointerId); punteros[e.pointerId] = { x: e.clientX, y: e.clientY }; ultimo = { t: performance.now(), x: e.clientX, y: e.clientY }; vel = { x: 0, y: 0 }; });
  svg.addEventListener('pointermove', function (e) {
    if (!punteros[e.pointerId]) return;
    var ids = Object.keys(punteros), r = svg.getBoundingClientRect(), s = vb.w / r.width;
    if (ids.length === 1) {
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
    if (Object.keys(punteros).length || calm) return;
    var r = svg.getBoundingClientRect(), s = vb.w / r.width, vx = vel.x * 16, vy = vel.y * 16;
    if (Math.hypot(vx, vy) < 2) return;
    (function des() { vx *= 0.92; vy *= 0.92; vb.x -= vx * s; vb.y -= vy * s; aplicarVista(); if (Math.hypot(vx, vy) > 0.3) inercia = requestAnimationFrame(des); })();
  }
  svg.addEventListener('pointerup', soltar); svg.addEventListener('pointercancel', soltar);
  svg.addEventListener('wheel', function (e) { e.preventDefault(); var c = aMundo(e.clientX, e.clientY); zoomEn(c.x, c.y, Math.exp(e.deltaY * 0.0016)); }, { passive: false });
  $$('[data-zoom]').forEach(function (b) { b.addEventListener('click', function () { var f = b.getAttribute('data-zoom') === '1' ? 0.66 : 1.5; var c = { x: vb.x + vb.w / 2, y: vb.y + vb.h / 2 }; if (calm) zoomEn(c.x, c.y, f); else { var de = vb.w, t0 = performance.now(); (function p(t) { var k = Math.min(1, (t - t0) / 260), e = 1 - Math.pow(1 - k, 3), w = de * (1 + (f - 1) * e); zoomEn(c.x, c.y, w / vb.w); if (k < 1) requestAnimationFrame(p); })(t0); } }); });

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

  function dibujarRutas() {
    capas.rutas.textContent = ''; capas.marcas.textContent = '';
    var xs = [], ys = [];
    delDia().forEach(function (h, i) {
      var pts = h.t.paso || h.t.cruz;
      var d = pts.map(function (p, j) { xs.push(p[0]); ys.push(p[1]); return (j ? 'L' : 'M') + p[0] + ' ' + p[1]; }).join('');
      var r = el('path', { 'class': 'oc-c-ruta', d: d, 'data-s': h.s }); capas.rutas.appendChild(r);
      // marca de la hermandad: su titular (o su inicial bordada) en un medallón con galón de oro
      var g = el('g', { 'class': 'oc-c-marca', 'data-s': h.s, tabindex: '0', role: 'button', 'aria-label': h.n });
      g.appendChild(el('circle', { 'class': 'oc-c-halo', r: '30' }));
      g.appendChild(el('circle', { 'class': 'oc-c-galon', r: '22' }));
      if (h.img) { var cp = el('clipPath', { id: 'cp-' + h.s }); cp.appendChild(el('circle', { r: '19' })); g.appendChild(cp); g.appendChild(el('image', { href: h.img, x: '-19', y: '-19', width: '38', height: '38', 'clip-path': 'url(#cp-' + h.s + ')', preserveAspectRatio: 'xMidYMid slice' })); }
      else { g.appendChild(el('circle', { 'class': 'oc-c-fondo', r: '19' })); var tx = el('text', { 'class': 'oc-c-ini', y: '7' }); tx.textContent = h.ini; g.appendChild(tx); }
      var cz = el('circle', { 'class': 'oc-c-cruz', r: '6', 'data-cruz': h.s });
      capas.marcas.appendChild(cz); capas.marcas.appendChild(g);
      g.addEventListener('click', function () { abrir(h); }); g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrir(h); } });
    });
    if (xs.length) encuadrar(xs, ys, !!capas.yaEncuadrado); capas.yaEncuadrado = true;
  }
  // posición de las marcas (se llama al cambiar la hora y al mover o ampliar el plano)
  function colocarMarcas() {
    delDia().forEach(function (h) {
      var paso = enTramo(h.t.paso || h.t.cruz, T), cruz = enTramo(h.t.cruz || h.t.paso, T);
      var g = capas.marcas.querySelector('.oc-c-marca[data-s="' + h.s + '"]'), cz = capas.marcas.querySelector('[data-cruz="' + h.s + '"]');
      if (g && paso) g.setAttribute('transform', 'translate(' + paso.x.toFixed(1) + ' ' + paso.y.toFixed(1) + ') scale(' + Z.toFixed(3) + ')');
      if (cz && cruz) { cz.setAttribute('cx', cruz.x.toFixed(1)); cz.setAttribute('cy', cruz.y.toFixed(1)); cz.setAttribute('r', (6 * Z).toFixed(2)); }
    });
    capas.mundo && capas.mundo.querySelectorAll('.oc-c-parada').forEach(function (m) { m.setAttribute('transform', m.getAttribute('transform').replace(/scale\([^)]*\)/, 'scale(' + Z.toFixed(3) + ')')); });
  }
  function actualizar() {
    hora.textContent = hhmm(T);
    capas.cortejos.textContent = '';
    var filas = [];
    colocarMarcas();
    delDia().forEach(function (h) {
      var paso = enTramo(h.t.paso || h.t.cruz, T), cruz = enTramo(h.t.cruz || h.t.paso, T);
      var g = capas.marcas.querySelector('.oc-c-marca[data-s="' + h.s + '"]'), cz = capas.marcas.querySelector('[data-cruz="' + h.s + '"]');
      var est = !paso ? 'fuera' : (cruz && cruz.estado === 'calle') || paso.estado === 'calle' ? 'calle' : paso.estado === 'antes' && (!cruz || cruz.estado === 'antes') ? 'antes' : 'despues';
      if (g) g.setAttribute('data-estado', est);
      if (cz) cz.setAttribute('data-estado', est);
      // el cortejo ocupa la calle desde el paso hasta la cruz de guía
      if (est === 'calle' && h.t.paso && cruz) {
        var pts = h.t.paso, i0 = paso.i, d = 'M' + paso.x + ' ' + paso.y, best = i0, bd = Infinity;
        for (var j = i0; j < Math.min(pts.length, i0 + 40); j++) { var dd = Math.hypot(pts[j][0] - cruz.x, pts[j][1] - cruz.y); if (dd < bd) { bd = dd; best = j; } }
        for (var k = i0 + 1; k <= best; k++) d += 'L' + pts[k][0] + ' ' + pts[k][1];
        d += 'L' + cruz.x + ' ' + cruz.y;
        capas.cortejos.appendChild(el('path', { 'class': 'oc-c-cortejo', d: d }));
      }
      var pts2 = h.t.paso || h.t.cruz, sal = pts2[0][2], fin = pts2[pts2.length - 1][2];
      var donde = est === 'calle' ? pts2[Math.min(paso.i + 1, pts2.length - 1)][3] : '';
      filas.push({ h: h, est: est, txt: est === 'calle' ? 'Por ' + (pts2[paso.i][3] || donde) : est === 'antes' ? 'Sale a las ' + hhmm(sal) : 'Recogida a las ' + hhmm(fin) });
    });
    // lista: primero las que están en la calle, luego las que van a salir
    var orden = { calle: 0, antes: 1, despues: 2, fuera: 3 };
    filas.sort(function (a, b) { return orden[a.est] - orden[b.est]; });
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
  var ficha = $('[data-ficha]');
  function abrir(h) {
    sel = h; pintarFicha(h);
    ficha.hidden = false; requestAnimationFrame(function () { ficha.classList.add('is-open'); });
    var p = enTramo(h.t.paso || h.t.cruz, T); if (p) { var w = Math.min(vb.w, 1800), r = vb.h / vb.w; var obj = { x: p.x - w / 2, y: p.y - w * r / 2, w: w, h: w * r }; if (calm) { vb = obj; aplicarVista(); } else { var de = { x: vb.x, y: vb.y, w: vb.w, h: vb.h }, t0 = performance.now(); (function s(t) { var k = Math.min(1, (t - t0) / 480), e = 1 - Math.pow(1 - k, 3); for (var q in obj) vb[q] = de[q] + (obj[q] - de[q]) * e; aplicarVista(); if (k < 1) requestAnimationFrame(s); })(t0); } }
    $$('.oc-c-marca, .oc-c-ruta').forEach(function (n) { n.classList.toggle('is-sel', n.getAttribute('data-s') === h.s); });
  }
  function cerrar() { sel = null; ficha.classList.remove('is-open'); setTimeout(function () { ficha.hidden = true; }, calm ? 0 : 200); $$('.is-sel').forEach(function (n) { n.classList.remove('is-sel'); }); }
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
    // próximo punto alcanzable: el siguiente del recorrido (o la salida si aún no ha salido)
    var i0 = p ? (p.estado === 'antes' ? 0 : Math.min(p.i + 1, pts.length - 1)) : 0;
    var ol = document.createElement('ol'); ol.className = 'oc-calle-proximos';
    pts.slice(i0, i0 + 5).forEach(function (q) { var li = document.createElement('li'); var hh = document.createElement('b'); hh.textContent = hhmm(q[2]); var l = document.createElement('span'); l.textContent = q[3] + (q[5] ? ' (aprox.)' : ''); li.appendChild(hh); li.appendChild(l); ol.appendChild(li); });
    c.appendChild(ol);
    var dest = pts[Math.min(i0 + 1, pts.length - 1)];
    var acc = document.createElement('div'); acc.className = 'oc-calle-acc';
    [['Cómo llegar · Google Maps', enlaceMapa(dest[0], dest[1], false)], ['Apple Maps', enlaceMapa(dest[0], dest[1], true)]].forEach(function (x, i) { var a = document.createElement('a'); a.className = 'oc-btn' + (i ? ' is-quiet' : ''); a.href = x[1]; a.target = '_blank'; a.rel = 'noopener'; a.textContent = x[0]; acc.appendChild(a); });
    var f = document.createElement('a'); f.className = 'oc-btn is-quiet'; f.href = (window.OC_BASE || '/') + 'hermandad/' + h.s + '/'; f.textContent = 'Ver la hermandad'; acc.appendChild(f);
    c.appendChild(acc);
    if (yo) {
      // el punto del recorrido más cercano a ti que aún no ha pasado
      var mejor = null; for (var k = i0; k < pts.length; k++) { var d = Math.hypot(pts[k][0] - yo.x, pts[k][1] - yo.y); if (!mejor || d < mejor.d) mejor = { d: d, q: pts[k] }; }
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
    dia = d; $$('[data-dia]').forEach(function (b) { b.setAttribute('aria-selected', b.getAttribute('data-dia') === d ? 'true' : 'false'); });
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
    delDia().forEach(function (h) { var pts = h.t.paso || h.t.cruz; pts.forEach(function (p) { var k = Math.round(p[0] / 120) + ':' + Math.round(p[1] / 120); var c = celdas[k] || (celdas[k] = { x: 0, y: 0, n: 0, ev: [], lugar: p[3] }); c.x += p[0]; c.y += p[1]; c.n++; c.ev.push({ t: p[2], h: h, lugar: p[3] }); }); });
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
  function pintarRuta(paradas) {
    rParadas.textContent = '';
    var vieja = capas.mundo.querySelector('.oc-c-ruta-mia'); if (vieja) vieja.remove();
    if (!paradas.length) { var li0 = document.createElement('li'); li0.className = 'oc-ruta-vacia'; li0.textContent = 'A esas horas no queda ninguna cofradía por ver. Prueba a empezar antes.'; rParadas.appendChild(li0); return; }
    var g = el('g', { 'class': 'oc-c-ruta-mia' }); capas.mundo.insertBefore(g, capas.marcas);
    g.appendChild(el('path', { 'class': 'oc-c-camino', d: paradas.map(function (p, i) { return (i ? 'L' : 'M') + p.c.x.toFixed(0) + ' ' + p.c.y.toFixed(0); }).join('') }));
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
    D = j; dibujarPlano();
    var hoy = hoyISO(), dHoy = null; for (var k in fechas) if (fechas[k] === hoy) dHoy = k;
    var botones = $$('[data-dia]').map(function (b) { return b.getAttribute('data-dia'); });
    // ?dia=<jornada> (desde «Hoy» de la portada) manda; si no, la jornada de hoy; si no, la primera
    var pedido = new URLSearchParams(location.search).get('dia');
    ponerDia(pedido && botones.indexOf(pedido) >= 0 ? pedido : dHoy && botones.indexOf(dHoy) >= 0 ? dHoy : botones[0]);
    window.addEventListener('resize', function () { capas.yaEncuadrado = false; dibujarRutas(); actualizar(); });
  }).catch(function () { mapa.classList.add('is-error'); });
})();
