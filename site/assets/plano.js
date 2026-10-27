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

  // Mismo tono en la misma jornada (hay muchos morados y negros): las siguientes se separan en luz y un poco de tono
  function variar(hex, k) {
    var r = parseInt(hex.slice(1, 3), 16) / 255, g = parseInt(hex.slice(3, 5), 16) / 255, b = parseInt(hex.slice(5, 7), 16) / 255;
    var mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn, s = d ? d / (1 - Math.abs(2 * l - 1)) : 0, h = 0;
    if (d) h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60;
    var paso = [[0, 0], [0.13, 10], [-0.13, -10], [0.22, -18], [-0.2, 18]][k % 5]; l = Math.min(0.88, Math.max(0.42, l + paso[0])); h = (h + paso[1] + 360) % 360;
    var c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2, q = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
    return '#' + q.map(function (v) { return ('0' + Math.round((v + m) * 255).toString(16)).slice(-2); }).join('');
  }
  function Plano(host, D, o) {
    o = o || {};
    // Dos capas con la misma vista: abajo lo fijo (calles y recorridos) y arriba lo que se mueve (cortejos y medallones).
    // Al cambiar la hora solo se repinta la de arriba; repintar miles de calles en cada paso daba tirones.
    var base = el('svg', { 'class': 'oc-pl-svg oc-pl-base', 'aria-hidden': 'true', focusable: 'false' }, host);
    var svg = el('svg', { 'class': 'oc-pl-svg oc-pl-capa', role: 'img', 'aria-label': 'Plano de ' + D.nombre + ' con los recorridos de la jornada' }, host);
    var mundo = el('g', {}, base);
    // Fondo fiel (si el plano lo trae, tools/itinerarios/fondo-osm.mjs): agua, ríos, costa, playas, parques y plazas debajo de las calles
    var A = D.areas || {}, poli = function (ls) { var d = ''; (ls || []).forEach(function (l) { d += pathDe([l]) + 'Z'; }); return d; };
    [['oc-c-agua', poli(A.agua)], ['oc-c-playa', poli(A.playas)], ['oc-c-parque', poli(A.parques)], ['oc-c-plaza', poli(A.plazas)], ['oc-c-rio', D.rios ? pathDe(D.rios) : ''], ['oc-c-costa', D.costa ? pathDe(D.costa) : '']]
      .forEach(function (c) { if (c[1]) mundo.appendChild(el('path', { 'class': c[0], d: c[1] })); });
    el('path', { 'class': 'oc-pl-calles', d: pathDe(D.calles) }, mundo);
    el('path', { 'class': 'oc-pl-princ', d: pathDe(D.principales) }, mundo);
    // templos y casas hermandad, como edificios encima de las calles (sus nombres los rotula el plano)
    if (A.edificios) { mundo.appendChild(el('path', { 'class': 'oc-c-templo', d: poli(A.edificios.filter(function (e) { return e.c === 'templo'; }).map(function (e) { return e.p; })) })); mundo.appendChild(el('path', { 'class': 'oc-c-casa', d: poli(A.edificios.filter(function (e) { return e.c === 'casa'; }).map(function (e) { return e.p; })) })); }
    var gR = el('g', {}, mundo), capa = el('g', {}, svg), gE = el('g', { 'class': 'oc-pl-etq', 'aria-hidden': 'true' }, capa), gC = el('g', {}, capa), gM = el('g', {}, capa), estados = {};
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
        vb.w = w; vb.x = de.cx + (a.cx - de.cx) * e - w / 2; vb.y = de.cy + (a.cy - de.cy) * e - w * H() / W() / 2;
        if (k >= 1) base.classList.remove('is-volando'); aplicar();
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
        var base = h.col || PAL[i % PAL.length], k = usados[base] = (usados[base] || 0) + 1, hc = k > 1 ? variar(base, k - 1) : base, d = '', pts = ruta(h);
        pts.forEach(function (p, j) { var q = pts[j - 1]; d += (!j || (!p[6] && !q[6] && Math.hypot(p[0] - q[0], p[1] - q[1]) > 150)) ? 'M' + p[0] + ' ' + p[1] : 'L' + p[0] + ' ' + p[1]; });
        el('path', { 'class': 'oc-pl-ruta-filo', d: d }, gR); // filo oscuro debajo: el recorrido se separa de las calles
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
    api.fijar = function (c, volando) { cancelAnimationFrame(anim); vb.x = c.x; vb.y = c.y; vb.w = c.w; base.classList.toggle('is-volando', !!volando); aplicar(); };
    api.ancho = function () { return lim[2] - lim[0]; };
    api.capas = function () { return [base, svg]; };
    // la provincia de la ciudad, debajo de todo: es el mapa de Andalucía que se convierte en el plano
    var provEl = null;
    api.provincia = function (d, color) { if (!arguments.length) return provEl; if (!provEl) { provEl = el('path', { 'class': 'oc-pl-provincia' }); mundo.insertBefore(provEl, mundo.firstChild); } provEl.setAttribute('d', d || ''); provEl.style.fill = color || ''; return provEl; };
    api.verSedes = function (si) { gS.style.display = si ? '' : 'none'; gHilo.style.display = si ? '' : 'none'; };
    // encuadre en la zona con más sedes: sin las más alejadas (una parroquia de las afueras dejaba media pantalla de mar o de campo)
    api.encuadrarSedes = function (ms, m, soloCaja) {
      // sin sedes todavía (capitales cuyo archivo de sedes está en camino): toda la ciudad del plano
      if (!simbolos.length) { if (soloCaja) return api.caja([lim[0], lim[2]], [lim[1], lim[3]], m); api.volar(api.caja([lim[0], lim[2]], [lim[1], lim[3]], m), ms); return; }
      // fuera solo las muy apartadas del centro (más de 2,5 veces la distancia mediana y de 800 m): el resto entra entero
      var med = function (v) { v = v.slice().sort(function (a, b) { return a - b; }); return v[Math.floor(v.length / 2)]; };
      var cx = med(simbolos.map(function (s) { return s.x; })), cy = med(simbolos.map(function (s) { return s.y; }));
      var ds = simbolos.map(function (s) { return Math.hypot(s.x - cx, s.y - cy); }), lim2 = Math.max(800, 2.5 * med(ds));
      var dentro = simbolos.filter(function (s, i) { return ds[i] <= lim2; });
      var cj = api.caja(dentro.map(function (s) { return s.x; }), dentro.map(function (s) { return s.y; }), m); if (soloCaja) return cj; api.volar(cj, ms);
    };
    api.zoom = function (f, ms) { var w = Math.max(250, Math.min(vb.w * f, (lim[2] - lim[0]) * 1.6)), cx = vb.x + vb.w / 2, cy = vb.y + vb.h / 2; api.volar({ x: cx - w / 2, y: cy - w * H() / W() / 2, w: w }, ms == null ? 320 : ms); };
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
    // ---- Gestos en el móvil: un dedo sigue bajando por la página; dos dedos mueven y amplían el plano; doble toque acerca ----
    var maxW = function () { return (lim[2] - lim[0]) * 1.6; }, wLim = function (w) { return Math.max(250, Math.min(maxW(), w)); };
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
        var a = e.touches[0], b = e.touches[1], r = svg.getBoundingClientRect();
        gesto = { d: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY) || 1, mx: (a.clientX + b.clientX) / 2 - r.left, my: (a.clientY + b.clientY) / 2 - r.top, x: vb.x, y: vb.y, w: vb.w, Z: Z, r: r };
      } else if (e.touches.length === 1) toque = { x: e.touches[0].clientX, y: e.touches[0].clientY, t: performance.now(), movido: false };
    }, { passive: false });
    svg.addEventListener('touchmove', function (e) {
      if (gesto && e.touches.length === 2) {
        e.preventDefault();
        var a = e.touches[0], b = e.touches[1], d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY) || 1;
        var mx = (a.clientX + b.clientX) / 2 - gesto.r.left, my = (a.clientY + b.clientY) / 2 - gesto.r.top, w = wLim(gesto.w * gesto.d / d), z = w / W();
        // el punto del plano que estaba entre los dedos sigue entre los dedos
        vb.x = gesto.x + gesto.mx * gesto.Z - mx * z; vb.y = gesto.y + gesto.my * gesto.Z - my * z; vb.w = w; aplicar();
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
        e.preventDefault(); ultimo = null; finArr = ahora; var r = svg.getBoundingClientRect(); zoomEn(0.5, p.clientX - r.left, p.clientY - r.top, 320); return;
      }
      ultimo = { t: ahora, x: p.clientX, y: p.clientY };
    }, { passive: false });
    svg.addEventListener('touchcancel', function () { gesto = null; toque = null; });
    // en el ordenador: pellizco del panel táctil (llega como rueda con Ctrl) y Ctrl + rueda amplían donde está el puntero
    svg.addEventListener('wheel', function (e) {
      if (!e.ctrlKey) return; e.preventDefault(); var r = svg.getBoundingClientRect();
      zoomEn(Math.exp(Math.max(-1, Math.min(1, e.deltaY * 0.01))), e.clientX - r.left, e.clientY - r.top, 0);
    }, { passive: false });
    svg.addEventListener('dblclick', function (e) { var r = svg.getBoundingClientRect(); zoomEn(e.shiftKey ? 2 : 0.5, e.clientX - r.left, e.clientY - r.top, 320); });
    aplicar();
    if (window.ResizeObserver) new ResizeObserver(function () { aplicar(true); }).observe(host);
    return api;
  }

  window.OCPlano = { Plano: Plano, enTramo: enTramo, estado: estado, limites: limites, horaPico: horaPico, cielo: cielo, hhmm: hhmm };
  document.dispatchEvent(new CustomEvent('oc-plano-listo'));
})();
