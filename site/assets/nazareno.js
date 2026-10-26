// Ocho Capitales · «Próxima Semana Santa»: un nazareno que se dibuja a trazos al bajar, se viste del color de su hábito y enciende
// su cirio (elegido por Pablo, 26-oct). Dibujo propio. Sin JavaScript o con «reducir movimiento» se ve terminado.
(function () {
  'use strict';
  var rail = document.querySelector('[data-nazareno]'); if (!rail) return;
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var q = function (s) { return rail.querySelector(s); }, cl = function (x) { return Math.max(0, Math.min(1, x)); };
  var traz = [].slice.call(rail.querySelectorAll('.oc-naz-traz path')), n = traz.length;
  traz.forEach(function (p) { var L = p.getTotalLength(); p.style.strokeDasharray = L + ' ' + L; p._L = L; });
  var rel = q('.oc-naz-rel'), llama = q('.oc-naz-llama'), luz = q('.oc-naz-luz'), c1 = q('[data-naz="1"]'), c2 = q('[data-naz="2"]'), c3 = q('[data-naz="3"]'), pista = q('.oc-naz-pista');
  rail.classList.add('is-vivo');
  function pon(p) {
    // 0-0.55: trazo a trazo; 0.55-0.72: se viste; 0.72-0.86: se enciende la cera; desde 0.8: Semana Santa
    traz.forEach(function (t, i) { var a = i / n * 0.5; t.style.strokeDashoffset = t._L * (1 - cl((p - a) / 0.09)); });
    rel.style.opacity = cl((p - 0.55) / 0.17);
    var l = cl((p - 0.72) / 0.14); llama.style.opacity = l; llama.style.transform = 'scale(' + (0.4 + 0.6 * l) + ')'; luz.style.opacity = l;
    var o1 = cl((p - 0.06) / 0.1) * (1 - cl((p - 0.42) / 0.1)), o2 = cl((p - 0.36) / 0.1) * (1 - cl((p - 0.7) / 0.08)), o3 = cl((p - 0.8) / 0.12);
    c1.style.opacity = o1; c1.style.transform = 'translateY(' + 10 * (1 - o1) + 'px)';
    c2.style.opacity = o2; c2.style.transform = 'translateY(' + 10 * (1 - o2) + 'px)';
    c3.style.opacity = o3; c3.style.transform = 'translateY(' + 14 * (1 - o3) + 'px)';
    if (pista) pista.style.opacity = 1 - cl(p / 0.08);
  }
  var pend = false;
  function scroll() { pend = false; var r = rail.getBoundingClientRect(); pon(cl(-r.top / Math.max(1, r.height - innerHeight))); }
  addEventListener('scroll', function () { if (!pend) { pend = true; requestAnimationFrame(scroll); } }, { passive: true });
  addEventListener('resize', scroll);
  scroll();
})();
