// Ocho Capitales · entrada de la portada: el globo «Terciopelo y oro» (elegido por Pablo, 26-oct; el mismo del vídeo de marketing).
// Globo iluminado por la luz de una vela (un lado en sombra), tierra fundida sin fronteras con la costa en hilo de oro, España con
// su galón y un aura cálida. Gira hasta España y baja sin cortes hasta Andalucía; al llegar, cada provincia se tiñe de su color de
// oeste a este, se enciende su capital y el globo se funde con el mapa de la portada, que está debajo en el mismo sitio.
// Se carga solo en la entrada (site.js), se salta tocando, con «Saltar» o con Escape, y con «reducir movimiento» es una imagen quieta.
// Datos: Natural Earth (dominio público) vía world-atlas (tools/generar-globo.mjs); proyección: d3-geo 3.1.1 (ISC, assets/vendor).
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg', R0 = Math.PI / 180;
  function el(t, a, p) { var n = document.createElementNS(NS, t); for (var k in a) n.setAttribute(k, a[k]); if (p) p.appendChild(n); return n; }
  var cl = function (x) { return Math.max(0, Math.min(1, x)); };
  var sine = function (k) { return -(Math.cos(Math.PI * k) - 1) / 2; }, pow2 = function (k) { return k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; };
  function script(src) { return new Promise(function (ok, ko) { var s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = ko; document.head.appendChild(s); }); }
  // provincias del mapa de la portada (en sus píxeles) → GeoJSON en lon/lat, con el giro de anillo que espera d3
  function provinciaGeo(p, P) {
    var anillos = p.d.split('M').filter(Boolean).map(function (t) { return t.replace(/Z/gi, '').trim().split('L').map(function (q) { var v = q.trim().split(/[ ,]+/).map(Number); return [P.lon0 + (v[0] - P.pad) / P.sx, P.lat1 - (v[1] - P.pad) / P.sy]; }); });
    anillos.forEach(function (r) { var a = r[0], b = r[r.length - 1]; if (a[0] !== b[0] || a[1] !== b[1]) r.push(a); });
    var f = { type: 'Feature', properties: { s: p.s, c: p.c }, geometry: { type: 'MultiPolygon', coordinates: anillos.map(function (r) { return [r]; }) } };
    if (window.d3.geoArea(f) > 2 * Math.PI) f.geometry.coordinates = f.geometry.coordinates.map(function (pol) { return pol.map(function (r) { return r.slice().reverse(); }); });
    return f;
  }
  var ORDEN = ['huelva', 'sevilla', 'cadiz', 'cordoba', 'malaga', 'jaen', 'granada', 'almeria'];

  window.OCGlobo = function (o) {
    var datos = o.datos, P = datos.proy, mapaSvg = o.svg, fin = o.alAcabar || function () { };
    var capa = document.createElement('div'); capa.className = 'oc-globo'; capa.setAttribute('aria-hidden', 'true');
    var S = el('svg', { 'class': 'oc-globo-svg' }, capa);
    var saltar = document.createElement('button'); saltar.type = 'button'; saltar.className = 'oc-globo-saltar'; saltar.textContent = 'Saltar'; saltar.setAttribute('aria-label', 'Saltar la entrada');
    document.body.appendChild(capa); document.body.appendChild(saltar);
    var hecho = false, raf = 0;
    function acabar() {
      if (hecho) return; hecho = true; cancelAnimationFrame(raf);
      capa.style.transition = 'opacity .3s ease'; capa.style.opacity = '0'; saltar.remove();
      document.removeEventListener('keydown', tecla);
      setTimeout(function () { capa.remove(); fin(); }, 320);
    }
    function tecla(e) { if (e.key === 'Escape') acabar(); }
    capa.addEventListener('pointerdown', acabar); saltar.addEventListener('click', acabar); document.addEventListener('keydown', tecla);

    var cargas = window.d3 && window.d3.geoOrthographic ? Promise.resolve() : script(o.vendor[0]).then(function () { return script(o.vendor[1]); });
    Promise.all([cargas, fetch(o.mundo).then(function (r) { return r.json(); })]).then(function (r) {
      if (hecho) return;
      var d3 = window.d3, M = r[1];
      var defs = el('defs', {}, S);
      var gm = el('radialGradient', { id: 'oc-gl-mar', cx: '.38', cy: '.34', r: '.78' }, defs);
      [['0', '#3b1d58'], ['.65', '#1d0d2e'], ['1', '#0d0616']].forEach(function (s) { el('stop', { offset: s[0], 'stop-color': s[1] }, gm); });
      // la luz de la vela llega de arriba a la izquierda: el otro lado del globo, en sombra
      var gs = el('radialGradient', { id: 'oc-gl-sombra', cx: '.36', cy: '.32', r: '.82' }, defs);
      [['.45', '#000', '0'], ['1', '#05020a', '.78']].forEach(function (s) { el('stop', { offset: s[0], 'stop-color': s[1], 'stop-opacity': s[2] }, gs); });
      var n = {}; ['aura', 'aura2', 'mar', 'tierra', 'espana', 'sombra', 'galon'].forEach(function (k) { n[k] = el('path', { 'class': 'oc-gl-' + k }, S); });
      n.mar.setAttribute('fill', 'url(#oc-gl-mar)'); n.sombra.setAttribute('fill', 'url(#oc-gl-sombra)');
      var gP = el('g', {}, S), gC = el('g', {}, S);
      var provs = datos.prov.map(function (p) { var f = provinciaGeo(p, P), e = el('path', { 'class': 'oc-gl-prov' }, gP); e.style.fill = p.c; e.style.fillOpacity = 0; return { f: f, e: e, s: p.s }; });
      var caps = (datos.caps || []).map(function (c) {
        var ll = [P.lon0 + (c.x / 100 * P.ancho - P.pad) / P.sx, P.lat1 - (c.y / 100 * P.alto - P.pad) / P.sy];
        var g = el('g', { 'class': 'oc-gl-cap', opacity: '0' }, gC); el('circle', { r: '6', fill: c.c }, g); return { ll: ll, g: g, s: c.s };
      });
      var proy = d3.geoOrthographic().clipAngle(90).precision(0.3), ruta = d3.geoPath(proy), esfera = { type: 'Sphere' };
      var W, H, dest;
      function medir() {
        W = innerWidth; H = innerHeight; S.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
        // la última imagen de la cámara coincide con el mapa de la portada (misma escala vertical y mismo centro)
        var rc = mapaSvg.getBoundingClientRect();
        dest = { lon: P.lon0 + (P.ancho / 2 - P.pad) / P.sx, lat: P.lat1 - (P.alto / 2 - P.pad) / P.sy, x: rc.left + rc.width / 2, y: rc.top + rc.height / 2, k: P.sy * rc.height / P.alto / R0 };
      }
      medir(); addEventListener('resize', function () { if (!hecho) medir(); });
      var DUR = 6400;
      function cuadro(t) {
        var m = Math.min(W, H), k0 = m * 0.36, a = sine(cl(t / 3400)), b = pow2(cl((t - 900) / 3900));
        var lon = 35 + (dest.lon - 35) * a, lat = 22 + (dest.lat - 22) * a, k = k0 * Math.pow(dest.k / k0, b);
        proy.rotate([-lon, -lat]).scale(k).translate([W / 2 + (dest.x - W / 2) * b, H * 0.47 + (dest.y - H * 0.47) * b]);
        var esf = ruta(esfera), cerca = k / m;
        n.aura.setAttribute('d', esf); n.aura2.setAttribute('d', esf); n.mar.setAttribute('d', esf);
        n.tierra.setAttribute('d', ruta(cerca < 3.2 ? M.tierra110 : M.tierra50)); n.espana.setAttribute('d', ruta(M.espana));
        n.sombra.setAttribute('d', cerca < 4.5 ? esf : ''); n.sombra.style.opacity = 1 - cl((cerca - 2.5) / 2);
        n.galon.setAttribute('d', cerca > 5 ? ruta(M.espana) : ''); n.galon.style.opacity = cl((cerca - 5) / 3);
        var vp = cerca > 7; provs.forEach(function (p) { p.e.setAttribute('d', vp ? ruta(p.f) : ''); });
        caps.forEach(function (c) { var q = proy(c.ll); c.g.setAttribute('transform', 'translate(' + q[0].toFixed(1) + ' ' + q[1].toFixed(1) + ')'); });
        // al llegar: las provincias se tiñen una a una de oeste a este y se enciende su capital
        ORDEN.forEach(function (s, i) {
          var k1 = cl((t - 4500 - i * 160) / 450);
          provs.forEach(function (p) { if (p.s === s) p.e.style.fillOpacity = (0.82 * k1).toFixed(3); });
          caps.forEach(function (c) { if (c.s === s) c.g.setAttribute('opacity', cl((t - 4600 - i * 160) / 300).toFixed(3)); });
        });
        S.style.transform = 'scale(' + (0.92 + 0.08 * cl(t / 1000)) + ')'; S.style.opacity = cl(t / 700);
        capa.style.opacity = 1 - cl((t - 5900) / 500);
      }
      // con «reducir movimiento»: España ya de frente, quieta, y un fundido
      if (o.quieto) { cuadro(3600); S.style.transform = 'none'; S.style.opacity = '1'; capa.style.opacity = '1'; setTimeout(acabar, 1600); return; }
      var t0 = 0;
      raf = requestAnimationFrame(function anim(ts) { if (!t0) t0 = ts; var t = ts - t0; cuadro(t); if (t < DUR) raf = requestAnimationFrame(anim); else acabar(); });
    }).catch(acabar);
  };
})();
