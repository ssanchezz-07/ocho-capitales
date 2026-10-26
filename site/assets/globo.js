// Ocho Capitales · entrada de la primera visita (elegida por Pablo, 26-oct): la cámara baja del globo a Andalucía y se funde con el
// mapa «Bordado» de la portada, en su sitio exacto. Se carga solo la primera vez (site.js), se salta tocando o con Escape y no sale
// con «reducir movimiento». Continentes: Natural Earth 1:110m (dominio público, tools/generar-mundo.mjs).
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg', R0 = Math.PI / 180;
  function el(t, a, p) { var n = document.createElementNS(NS, t); for (var k in a) n.setAttribute(k, a[k]); if (p) p.appendChild(n); return n; }
  var ease = function (k) { return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; };
  var cl = function (x) { return Math.max(0, Math.min(1, x)); };
  // proyección ortográfica centrada en c = [lon, lat]
  function proy(lon, lat, c, R, cx, cy) {
    var f = lat * R0, l = (lon - c[0]) * R0, f0 = c[1] * R0, cf = Math.cos(f), cl0 = Math.cos(l);
    return [cx + R * cf * Math.sin(l), cy - R * (Math.cos(f0) * Math.sin(f) - Math.sin(f0) * cf * cl0), Math.sin(f0) * Math.sin(f) + Math.cos(f0) * cf * cl0];
  }
  function linea(pts, c, R, cx, cy, cerrar) {
    var d = '', dentro = false, todos = true;
    for (var i = 0; i < pts.length; i++) { var q = proy(pts[i][0], pts[i][1], c, R, cx, cy); if (q[2] < 0) { dentro = false; todos = false; continue; } d += (dentro ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1); dentro = true; }
    return cerrar && todos && d ? d + 'Z' : d;
  }
  // anillos del mapa de la portada (en sus píxeles) → [lon, lat]
  function anillosDe(d, P) {
    return d.split(/(?=M)/).map(function (s) { return s.replace(/^M/, '').replace(/Z$/i, '').split('L').map(function (q) { var v = q.trim().split(/[ ,]+/).map(Number); return [P.lon0 + (v[0] - P.pad) / P.sx, P.lat1 - (v[1] - P.pad) / P.sy]; }); }).filter(function (r) { return r.length > 2; });
  }

  window.OCGlobo = function (o) {
    var datos = o.datos, P = datos.proy, mapaSvg = o.svg, fin = o.alAcabar || function () { };
    var capa = document.createElement('div'); capa.className = 'oc-globo'; capa.setAttribute('aria-hidden', 'true');
    var S = el('svg', { 'class': 'oc-globo-svg' }, capa);
    var saltar = document.createElement('button'); saltar.type = 'button'; saltar.className = 'oc-globo-saltar'; saltar.textContent = 'Saltar'; saltar.setAttribute('aria-label', 'Saltar la entrada');
    document.body.appendChild(capa); document.body.appendChild(saltar);
    var esf = el('circle', { 'class': 'oc-globo-esfera' }, S), ret = el('path', { 'class': 'oc-globo-reticula' }, S), tierra = el('path', { 'class': 'oc-globo-tierra' }, S);
    var gP = el('g', {}, S), bor = el('circle', { 'class': 'oc-globo-borde' }, S);
    var provs = datos.prov.map(function (p) { var n = el('path', { 'class': 'oc-globo-prov' }, gP); n.style.fill = p.c; return { r: anillosDe(p.d, P), n: n }; });
    var RET = [], lo, la, l;
    for (lo = -180; lo < 180; lo += 15) { l = []; for (la = -90; la <= 90; la += 3) l.push([lo, la]); RET.push(l); }
    for (la = -75; la <= 75; la += 15) { l = []; for (lo = -180; lo <= 180; lo += 3) l.push([lo, la]); RET.push(l); }
    var MUNDO = [], W, H, destino;
    function medir() {
      W = innerWidth; H = innerHeight; S.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      // dónde está el mapa de la portada: la última imagen de la cámara coincide con él
      var r = mapaSvg.getBoundingClientRect();
      var lonc = P.lon0 + (P.ancho / 2 - P.pad) / P.sx, latc = P.lat1 - (P.alto / 2 - P.pad) / P.sy;
      destino = { c: [lonc, latc], cx: r.left + r.width / 2, cy: r.top + r.height / 2, R: (P.sy * r.height / P.alto) / R0 };
    }
    medir();
    var INI = [-40, 12], DUR = 3500;
    function cuadro(t) {
      var m = Math.min(W, H), k1 = ease(cl(t / 1700)), c = [INI[0] + (destino.c[0] - INI[0]) * k1, INI[1] + (destino.c[1] - INI[1]) * k1];
      var k2 = ease(cl((t - 1300) / 1900)), Ri = m * 0.36, R = Ri * Math.pow(destino.R / Ri, k2);
      var cx = W / 2 + (destino.cx - W / 2) * k2, cy = H * 0.47 + (destino.cy - H * 0.47) * k2;
      [esf, bor].forEach(function (n) { n.setAttribute('cx', cx); n.setAttribute('cy', cy); n.setAttribute('r', R); });
      ret.setAttribute('d', RET.map(function (q) { return linea(q, c, R, cx, cy, false); }).join('')); ret.style.opacity = 1 - k2;
      tierra.setAttribute('d', MUNDO.map(function (q) { return linea(q, c, R, cx, cy, true); }).join('')); tierra.style.opacity = 1 - cl(k2 * 1.8); // la costa de 1:110m es basta de cerca: se va antes que Andalucía
      provs.forEach(function (p) { p.n.setAttribute('d', p.r.map(function (q) { return linea(q, c, R, cx, cy, true); }).join('')); });
      gP.style.opacity = cl(t / 700);
      // al final se funde con el mapa de verdad, que está debajo en el mismo sitio
      capa.style.opacity = 1 - cl((t - 3000) / 500);
    }
    var t0 = 0, raf = 0, hecho = false;
    function acabar() {
      if (hecho) return; hecho = true; cancelAnimationFrame(raf);
      capa.style.transition = 'opacity .28s ease'; capa.style.opacity = '0'; saltar.remove();
      document.removeEventListener('keydown', tecla);
      setTimeout(function () { capa.remove(); fin(); }, 300);
    }
    function tecla(e) { if (e.key === 'Escape') acabar(); }
    capa.addEventListener('pointerdown', acabar); saltar.addEventListener('click', acabar); document.addEventListener('keydown', tecla);
    addEventListener('resize', function () { if (!hecho) medir(); });
    function anim(ts) { if (!t0) t0 = ts; var t = ts - t0; cuadro(t); if (t < DUR) raf = requestAnimationFrame(anim); else acabar(); }
    cuadro(0);
    fetch(o.mundo).then(function (r) { return r.json(); }).then(function (j) { MUNDO = j.anillos || []; }).catch(function () { }).then(function () { if (!hecho) raf = requestAnimationFrame(anim); });
  };
})();
