/* Ocho Capitales: interacción. Tema, ciudad, jornada de hoy, hoja «Más», buscador, filtros, noticias y favoritos. */
(function () {
  'use strict';
  var BASE = window.OC_BASE || '/';
  var root = document.documentElement;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var norm = function (s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } },
    set: function (k, v) { try { if (v == null || v === '') localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { } },
    json: function (k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  };
  var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var CITY_NAMES = {};
  $$('[data-city-select] option').forEach(function (o) { if (o.value) CITY_NAMES[o.value] = o.textContent; });

  // Desplaza solo la tira horizontal que contiene el elemento (nunca la página): evita tirones al hacer scroll.
  function hscroll(el, center) {
    var p = el.parentNode;
    while (p && p !== document.body && p.scrollWidth <= p.clientWidth) p = p.parentNode;
    if (!p || p === document.body) return;
    var r = el.getBoundingClientRect(), q = p.getBoundingClientRect();
    var d = center ? (r.left - q.left) - (q.width - r.width) / 2 : r.left < q.left ? r.left - q.left - 16 : r.right > q.right ? r.right - q.right + 16 : 0;
    if (d) p.scrollLeft += d;
  }

  // ---------- tema ----------
  var themeSel = $('[data-theme-select]');
  if (themeSel) {
    themeSel.value = root.dataset.theme || '';
    themeSel.addEventListener('change', function () {
      if (themeSel.value) root.dataset.theme = themeSel.value; else delete root.dataset.theme;
      store.set('oc-theme', themeSel.value);
    });
  }

  // ---------- capas (hoja «Más» y buscador) con entrada/salida animadas ----------
  var lastFocus = null;
  function openLayer(el, focusEl, instant) {
    lastFocus = document.activeElement;
    el.classList.toggle('is-instant', !!instant);
    el.hidden = false;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(function () { requestAnimationFrame(function () { el.classList.add('is-open'); }); });
    if (focusEl) setTimeout(function () { focusEl.focus(); }, reduced ? 0 : 30);
  }
  function closeLayer(el) {
    if (!el || el.hidden) return;
    el.classList.remove('is-open');
    document.body.style.overflow = '';
    setTimeout(function () { el.hidden = true; }, reduced || el.classList.contains('is-instant') ? 0 : 150);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function trapFocus(el, e) {
    if (e.key !== 'Tab') return;
    var f = $$('a[href], button, input, select, [tabindex]:not([tabindex="-1"])', el).filter(function (x) { return x.offsetParent !== null; });
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  var sheet = $('[data-more-sheet]'), moreBtns = $$('[data-more]');
  if (sheet && moreBtns.length) {
    moreBtns.forEach(function (b) { b.addEventListener('click', function () { moreBtns.forEach(function (x) { x.setAttribute('aria-expanded', 'true'); }); openLayer(sheet, $('[data-more-close]', sheet)); }); });
    var closeSheet = function () { moreBtns.forEach(function (x) { x.setAttribute('aria-expanded', 'false'); }); closeLayer(sheet); };
    $('[data-more-close]', sheet).addEventListener('click', closeSheet);
    sheet.addEventListener('click', function (e) { if (e.target === sheet) closeSheet(); });
    sheet.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeSheet(); trapFocus(sheet, e); });
  }

  // ---------- fechas relativas ----------
  var rtf = window.Intl && Intl.RelativeTimeFormat ? new Intl.RelativeTimeFormat('es', { numeric: 'auto' }) : null;
  function ago(iso) {
    var d = (new Date(iso) - Date.now()) / 1000, a = Math.abs(d);
    if (!rtf) return new Date(iso).toLocaleDateString('es-ES');
    if (a < 60) return 'ahora';
    if (a < 3600) return rtf.format(Math.round(d / 60), 'minute');
    if (a < 86400) return rtf.format(Math.round(d / 3600), 'hour');
    if (a < 86400 * 7) return rtf.format(Math.round(d / 86400), 'day');
    return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  }
  function paintAgo(r) { $$('time[data-ago]', r).forEach(function (t) { t.textContent = ago(t.getAttribute('datetime')); }); }
  paintAgo();

  // Imágenes de noticias que no cargan: se conserva el hueco con la marca para que la página no salte.
  // Sin foto del medio (o rota), la miniatura es la colgadura de su capital: nunca un hueco.
  function colgTile(city) {
    var col = window.OC_COLORS && window.OC_COLORS[city];
    if (!col) return '';
    return '<div class="oc-news-img is-colg" aria-hidden="true" style="--c:' + col + '"><img src="' + BASE + 'assets/plates/colgadura-' + city + '.webp" alt="" width="265" height="971" loading="lazy" decoding="async"></div>';
  }
  function dropImg(img) {
    var box = img.closest('.oc-news-img'); if (!box) return; var card = box.closest('.oc-news');
    var t = card && colgTile((card.getAttribute('data-cities') || '').split(' ')[0]);
    if (t) { box.outerHTML = t; return; }
    box.remove(); if (card) card.classList.remove('has-img');
  }
  document.addEventListener('error', function (e) { if (e.target && e.target.matches && e.target.matches('img[data-hide-broken]')) dropImg(e.target); }, true);
  $$('img[data-hide-broken]').forEach(function (img) { if (img.complete && !img.naturalWidth) dropImg(img); });

  // ---------- ciudad persistente ----------
  var cityListeners = [];
  function getCity() { return root.dataset.city || ''; }
  function setCity(c) {
    if (c && !CITY_NAMES[c]) c = '';
    if (c) root.dataset.city = c; else delete root.dataset.city;
    store.set('oc-city', c);
    $$('[data-city-select]').forEach(function (s) { s.value = c; });
    cityListeners.forEach(function (fn) { fn(c); });
  }
  if (getCity() && !CITY_NAMES[getCity()]) delete root.dataset.city;
  $$('[data-city-select]').forEach(function (s) {
    s.value = getCity();
    s.addEventListener('change', function () { setCity(s.value); });
  });
  // Chip de la cabecera con el punto de color de tu capital; abre una hoja con las ocho colgaduras.
  var cityChip = $('[data-city-open]'), citySheet = $('[data-city-sheet]');
  var paintChip = function (c) {
    if (!cityChip) return;
    $('[data-city-label]', cityChip).textContent = c ? CITY_NAMES[c] : '8 capitales';
    cityChip.style.setProperty('--c', c && window.OC_COLORS ? window.OC_COLORS[c] : '');
    cityChip.classList.toggle('has-city', !!c);
    $$('[data-set-city]', citySheet || undefined).forEach(function (b) { if (citySheet && citySheet.contains(b)) b.setAttribute('aria-pressed', b.dataset.setCity === c ? 'true' : 'false'); });
  };
  var closeCity = function () { if (cityChip) cityChip.setAttribute('aria-expanded', 'false'); closeLayer(citySheet); };
  if (cityChip && citySheet) {
    cityChip.addEventListener('click', function () { cityChip.setAttribute('aria-expanded', 'true'); openLayer(citySheet, $('[aria-pressed="true"]', citySheet) || $('[data-city-close]', citySheet)); });
    $('[data-city-close]', citySheet).addEventListener('click', closeCity);
    citySheet.addEventListener('click', function (e) { if (e.target === citySheet) closeCity(); });
    citySheet.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeCity(); trapFocus(citySheet, e); });
  }
  paintChip(getCity()); cityListeners.push(paintChip);
  // «Mostrando solo <ciudad>» en Hoy, con la salida a las ocho capitales (la elección se hace en las colgaduras o en el selector).
  $$('[data-set-city]').forEach(function (b) {
    b.addEventListener('click', function () {
      setCity(b.dataset.setCity);
      // en la hoja, se ve la elección un instante antes de cerrarse (como al elegir en un menú de iOS)
      if (citySheet && citySheet.contains(b)) setTimeout(closeCity, reduced ? 0 : 160);
    });
  });

  // ---------- hojas: asa y cierre arrastrando hacia abajo ----------
  // El panel sigue al dedo 1:1; se cierra si se arrastra más de un tercio o con un gesto rápido (velocidad), si no vuelve
  // a su sitio. Solo desde el asa y la cabecera, para no pelearse con el scroll del contenido.
  function arrastrable(sh) {
    var panel = $('.oc-sheet-panel', sh), head = $('.oc-sheet-head', sh); if (!panel || !head) return;
    var asa = document.createElement('div'); asa.className = 'oc-grabber'; asa.setAttribute('aria-hidden', 'true');
    panel.insertBefore(asa, panel.firstChild);
    var y0 = 0, dy = 0, yA = 0, tA = 0, v = 0, id = null;
    function down(e) {
      if (id !== null || e.button > 0 || e.target.closest('button, a, input, select, textarea')) return;
      id = e.pointerId; y0 = yA = e.clientY; tA = performance.now(); dy = v = 0;
      try { e.currentTarget.setPointerCapture(id); } catch (err) { }
      panel.style.transition = 'none';
    }
    function move(e) {
      if (e.pointerId !== id) return;
      var d = e.clientY - y0, now = performance.now();
      dy = d > 0 ? d : -Math.sqrt(-d) * 2; // hacia arriba, resistencia creciente
      panel.style.transform = 'translateY(' + dy + 'px)';
      if (now > tA) { v = (e.clientY - yA) / (now - tA); yA = e.clientY; tA = now; }
    }
    function up(e) {
      if (e.pointerId !== id) return; id = null;
      if (dy > panel.offsetHeight / 3 || (dy > 12 && v > 0.45)) {
        panel.style.transition = 'transform 220ms cubic-bezier(.32,.72,0,1)';
        panel.style.transform = 'translateY(100%)';
        var x = $('.oc-sheet-head .oc-iconbtn', sh); if (x) x.click();
        setTimeout(function () { panel.style.transition = ''; panel.style.transform = ''; }, 260);
      } else {
        panel.style.transition = 'transform 320ms cubic-bezier(.32,.72,0,1)';
        panel.style.transform = '';
        setTimeout(function () { panel.style.transition = ''; }, 340);
      }
    }
    [asa, head].forEach(function (el) {
      el.addEventListener('pointerdown', down); el.addEventListener('pointermove', move);
      el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    });
  }
  $$('.oc-sheet').forEach(arrastrable);
  var paintCityPick = function (c) {
    var box = $('[data-today-showing]'); if (!box) return;
    box.hidden = !c; var n = $('[data-today-city]', box); if (n) n.textContent = c ? CITY_NAMES[c] : '';
  };
  paintCityPick(getCity()); cityListeners.push(paintCityPick);

  // ---------- jornada de hoy (portada) ----------
  var SLOTS = [['visperas', -9], ['ramos', -7], ['lunes', -6], ['martes', -5], ['miercoles', -4], ['jueves', -3], ['madruga', -2], ['viernes', -2], ['sabado', -1], ['resurreccion', 0]];
  function easter(y) { var a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451), mo = Math.floor((h + l - 7 * m + 114) / 31), da = ((h + l - 7 * m + 114) % 31) + 1; return Date.UTC(y, mo - 1, da); }
  function pickSlot(now) {
    var y = now.getFullYear(), today = Date.UTC(y, now.getMonth(), now.getDate());
    var off = Math.round((today - easter(y)) / 864e5);
    if (off >= -9 && off <= 0) {
      var id = off <= -8 ? 'visperas' : off === -2 ? (now.getHours() < 7 ? 'madruga' : 'viernes') : SLOTS.filter(function (s) { return s[1] === off; })[0][0];
      return { id: id, hoy: true, year: y, days: 0 };
    }
    var yy = off > 0 ? y + 1 : y;
    return { id: 'ramos', hoy: false, year: yy, days: Math.round((easter(yy) - 7 * 864e5 - today) / 864e5) };
  }
  var today = $('[data-today]');
  if (today) {
    var tabs = $$('[role="tab"]', today);
    var selectSlot = function (id, focus, animate) {
      tabs.forEach(function (t) {
        var on = t.dataset.slot === id;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        if (on) { if (focus) t.focus(); hscroll(t); }
      });
      $$('[data-panel]', today).forEach(function (p) {
        var on = p.dataset.panel === id;
        p.hidden = !on;
        if (on && animate && !reduced) { p.classList.remove('is-entering'); void p.offsetWidth; p.classList.add('is-entering'); }
      });
      checkTodayEmpty();
    };
    var checkTodayEmpty = function () {
      var c = getCity();
      $$('[data-panel]', today).forEach(function (p) {
        var has = !c || !!$('.oc-group[data-city="' + c + '"]', p);
        var em = $('[data-today-empty]', p);
        if (em) { em.hidden = has; if (!has) em.textContent = (CITY_NAMES[c] || 'Tu ciudad') + ' no tiene salidas documentadas en esta jornada. Prueba otro día o elige «8 capitales».'; }
      });
    };
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { selectSlot(t.dataset.slot, false, true); });
      t.addEventListener('keydown', function (e) {
        var j = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : -1;
        if (j < 0) return;
        e.preventDefault(); j = (j + tabs.length) % tabs.length; selectSlot(tabs[j].dataset.slot, true, false);
      });
    });
    // La página se genera cada dos horas: el navegador corrige la jornada si la copia en caché se ha quedado atrás.
    var pick = pickSlot(new Date());
    var home = $('[data-home]');
    if (pick.hoy) {
      var mark = $('[data-slot="' + pick.id + '"]', today); if (mark) mark.setAttribute('data-today-mark', '');
      $('[data-today-title]', today).textContent = 'Hoy en la calle';
      if (home) home.dataset.season = 'hoy';
    }
    if (String(pick.year) === today.dataset.year) {
      var lead = $('[data-today-lead]');
      if (lead) {
        if (pick.hoy) {
          var tab = $('[data-slot="' + pick.id + '"]', today);
          lead.innerHTML = 'Hoy en la calle: <strong>' + esc(tab ? tab.firstChild.textContent : '') + '</strong>';
        } else {
          var ramos = new Date(easter(pick.year) - 7 * 864e5);
          lead.innerHTML = 'Faltan <strong>' + pick.days + '</strong> ' + (pick.days === 1 ? 'día' : 'días') + ' para el Domingo de Ramos <span>(' + ramos.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', timeZone: 'UTC' }) + ')</span>';
        }
      }
      if (pick.id !== today.dataset.buildSlot) selectSlot(pick.id, false, false);
    }
    checkTodayEmpty();
    cityListeners.push(checkTodayEmpty);
  }

  // ---------- últimas noticias de la portada: seis de la ciudad elegida ----------
  var latest = $('[data-latest-list]');
  if (latest) {
    var items = $$('.oc-news', latest), allLink = $('[data-latest-all]'), emptyL = $('[data-latest-empty]');
    var filterLatest = function (c) {
      latest.classList.add('is-filtered');
      var n = 0;
      items.forEach(function (it) { var ok = !c || (' ' + it.dataset.cities + ' ').indexOf(' ' + c + ' ') !== -1; it.hidden = !(ok && n < 6); if (ok) n++; });
      if (emptyL) emptyL.hidden = n > 0;
      var first = items.filter(function (it) { return !it.hidden; })[0], bl = $('[data-breaking-link]');
      if (first && bl) { var a = $('.oc-news-title a', first); bl.href = a.href; bl.textContent = a.firstChild.textContent; }
      if (allLink) { allLink.href = BASE + 'noticias/' + (c ? '?ciudad=' + c : ''); allLink.firstChild.textContent = c ? 'Noticias de ' + CITY_NAMES[c] : 'Todas las noticias'; }
    };
    filterLatest(getCity());
    cityListeners.push(filterLatest);
  }

  // ---------- colgaduras: el selector de capital como un objeto que cuelga ----------
  // Movimiento solo aquí: muelles que parten de donde está el elemento y heredan la velocidad del gesto
  // (response = segundos hasta llegar; damping 1 = sin rebote, <1 = se balancea). Con «reducir movimiento», todo cambia al instante.
  var colg = $('[data-colgaduras]');
  if (colg) (function () {
    // El mapa y los hilos se dibujan aquí a partir de los datos de la página (provincias, capitales y su colgadura)
    var NS = 'http://www.w3.org/2000/svg', mapa = $('[data-colg-map]', colg), datos = {};
    try { datos = JSON.parse($('#oc-mapa').textContent); } catch (err) { }
    function el(tag, attrs) { var n = document.createElementNS(NS, tag); Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); }); return n; }
    if (mapa && datos.prov) {
      var svg = el('svg', { 'class': 'oc-colg-svg', viewBox: datos.vb, preserveAspectRatio: 'none', 'aria-hidden': 'true', focusable: 'false' });
      datos.prov.forEach(function (p) { var n = el('path', { 'class': 'oc-prov2', 'data-prov': p.s, d: p.d }); n.style.setProperty('--c', p.c); svg.appendChild(n); });
      var hs = el('svg', { 'class': 'oc-colg-hilos', viewBox: '0 0 100 100', preserveAspectRatio: 'none', 'aria-hidden': 'true', focusable: 'false' });
      datos.caps.forEach(function (c) { hs.appendChild(el('path', { 'class': 'oc-hilo', 'data-hilo': c.s, d:'M' + c.b + ' 0 V' + c.l + ' H' + c.x + ' V' + c.y })); });
      mapa.insertBefore(svg, mapa.firstChild); mapa.insertBefore(hs, svg.nextSibling);
      datos.caps.forEach(function (c) { var d = document.createElement('span'); d.className = 'oc-punto'; d.setAttribute('data-punto', c.s); d.style.cssText = '--c:' + c.c + ';left:' + c.x + '%;top:' + c.y + '%'; mapa.insertBefore(d, $('[data-colg-pie]', mapa)); });
    }
    var items = $$('.oc-colg', colg), provs = $$('.oc-prov2', colg), hilos = $$('.oc-hilo', colg), puntos = $$('.oc-punto', colg), irs = $$('.oc-colg-ir', colg);
    var row = $('.oc-colg-row', colg), pie = $('[data-colg-pie]', colg);
    var calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
    var EASE = 'cubic-bezier(0.23, 1, 0.32, 1)', DRAWER = 'cubic-bezier(0.32, 0.72, 0, 1)';

    function Spring(response, damping) { var w = 2 * Math.PI / response; this.k = w * w; this.c = 2 * damping * w; this.x = 0; this.v = 0; this.t = 0; }
    Spring.prototype.step = function (dt) { this.v += (-this.k * (this.x - this.t) - this.c * this.v) * dt; this.x += this.v * dt; };
    Spring.prototype.still = function () { return Math.abs(this.x - this.t) < 0.01 && Math.abs(this.v) < 0.05; };

    var S = items.map(function (el) { return { el: el, rot: new Spring(0.5, 0.5), dy: new Spring(0.38, 1), sc: new Spring(0.2, 1), vivo: false }; });
    var raf = 0, last = 0;
    function paint(s) { s.el.style.transform = 'translate3d(0,' + s.dy.x.toFixed(2) + 'px,0) rotate(' + s.rot.x.toFixed(2) + 'deg) scale(' + s.sc.x.toFixed(4) + ')'; }
    function tick(now) {
      var dt = Math.min(0.032, (now - last) / 1000 || 0.016); last = now; var moving = false;
      S.forEach(function (s) {
        [s.rot, s.dy, s.sc].forEach(function (p) { p.step(dt); });
        if (s.rot.still() && s.dy.still() && s.sc.still()) { s.rot.x = s.rot.t; s.dy.x = s.dy.t; s.sc.x = s.sc.t; s.rot.v = s.dy.v = s.sc.v = 0; } else moving = true;
        paint(s);
      });
      raf = moving ? requestAnimationFrame(tick) : 0;
    }
    function wake() { if (!raf && !calm) { last = performance.now(); raf = requestAnimationFrame(tick); } }
    function setTarget(s, rot, dy, sc) {
      s.rot.t = rot; s.dy.t = dy; s.sc.t = sc;
      if (calm) { s.rot.x = rot; s.dy.x = dy; s.sc.x = sc; s.rot.v = s.dy.v = s.sc.v = 0; paint(s); } else wake();
    }

    // Hilo que se dibuja, botón que nace del punto de la capital y vuelve por el mismo camino
    var pillAnim = null;
    function hidePill(el, instant) {
      if (pillAnim) { pillAnim.cancel(); pillAnim = null; }
      if (!el || el.hidden) return;
      if (instant || calm || !el.animate) { el.hidden = true; return; }
      var a = el.animate([{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(0.94)' }], { duration: 160, easing: EASE });
      a.onfinish = function () { el.hidden = true; }; pillAnim = a;
    }
    function showPill(el, dot) {
      if (pillAnim) { pillAnim.cancel(); pillAnim = null; }
      el.hidden = false;
      if (calm || !el.animate) return;
      var p = el.getBoundingClientRect(), d = dot.getBoundingClientRect();
      el.style.setProperty('--ox', (d.left + d.width / 2 - p.left).toFixed(1) + 'px'); el.style.setProperty('--oy', (d.top + d.height / 2 - p.top).toFixed(1) + 'px');
      pillAnim = el.animate([{ opacity: 0, transform: 'scale(0.9)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 300, easing: EASE });
    }

    var current = '';
    function paintColg(city, animar) {
      var prev = current; current = city || '';
      if (current) colg.setAttribute('data-sel', current); else colg.removeAttribute('data-sel');
      S.forEach(function (s, i) {
        var on = s.el.dataset.colg === current;
        if (on) s.el.setAttribute('aria-current', 'true'); else s.el.removeAttribute('aria-current');
        // la elegida cuelga un poco más; las demás se recogen apenas
        setTarget(s, 0, on ? s.el.offsetHeight * 0.075 : (current ? -2 : 0), 1);
        if (on && animar && !calm && prev !== current) { s.rot.v += 70; var vecino = S[i + (i % 2 ? -1 : 1)]; if (vecino) vecino.rot.v -= 22; wake(); }
      });
      provs.forEach(function (p) { p.classList.toggle('is-on', p.dataset.prov === current); });
      hilos.forEach(function (h) {
        var on = h.dataset.hilo === current; h.classList.toggle('is-on', on);
        // Con trazo de grosor fijo, Chrome mide los guiones en píxeles de pantalla: se calcula la longitud real en pantalla
        // (tramos verticales con el alto, horizontales con el ancho) y el guion solo existe mientras se dibuja.
        if (on && animar && !calm && h.animate && prev !== current) {
          var c = (datos.caps || []).filter(function (k) { return k.s === current; })[0], box = h.ownerSVGElement.getBoundingClientRect();
          var len = c ? Math.ceil((c.l + Math.abs(c.y - c.l)) * box.height / 100 + Math.abs(c.x - c.b) * box.width / 100) + 2 : 0;
          if (len) h.animate([{ strokeDasharray: len + ' ' + len, strokeDashoffset: len }, { strokeDasharray: len + ' ' + len, strokeDashoffset: 0 }], { duration: 560, easing: EASE });
        }
      });
      puntos.forEach(function (p) { p.classList.toggle('is-on', p.dataset.punto === current); });
      var activo = current ? irs.filter(function (a) { return a.dataset.ir === current; })[0] : null;
      irs.forEach(function (a) { if (a !== activo) hidePill(a, true); });
      if (activo) { var dot = puntos.filter(function (p) { return p.dataset.punto === current; })[0]; pie.dataset.lado = parseFloat(dot.style.left) < 50 ? 'der' : 'izq'; if (activo.hidden) showPill(activo, dot); }
    }

    // Toque: se hunde al pulsar (no al soltar) y elige al soltar; otro toque sobre la elegida la suelta
    items.forEach(function (el, i) {
      var s = S[i];
      el.addEventListener('pointerdown', function () { setTarget(s, s.rot.t, s.dy.t + 2, 0.965); });
      var suelta = function () { setTarget(s, s.rot.t, s.dy.t - (s.sc.t < 1 ? 2 : 0), 1); };
      el.addEventListener('pointerup', suelta); el.addEventListener('pointercancel', suelta); el.addEventListener('pointerleave', function () { if (s.sc.t < 1) suelta(); });
      // Con JS el enlace elige la ciudad (otro toque la suelta); con Ctrl/Cmd/botón central sigue siendo un enlace normal
      el.addEventListener('click', function (e) { if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button) return; e.preventDefault(); setCity(el.getAttribute('aria-current') === 'true' ? '' : el.dataset.colg); });
    });

    // Rozarlas: el movimiento del puntero empuja las colgaduras cercanas y siguen balanceándose con su inercia
    var px = null, pt = 0, vx = 0, down = false;
    function roza(e) {
      if (calm) return;
      var fino = e.pointerType === 'mouse'; if (!fino && !down) return;
      var now = e.timeStamp, x = e.clientX;
      if (px !== null && now > pt) { var inst = (x - px) / ((now - pt) / 1000); vx = vx * 0.6 + Math.max(-1800, Math.min(1800, inst)) * 0.4; }
      px = x; pt = now;
      var w = items[0] ? items[0].parentNode.getBoundingClientRect().width : 50;
      S.forEach(function (s) {
        var r = s.el.getBoundingClientRect(), cx = r.left + r.width / 2, d = (x - cx) / w, inf = Math.exp(-d * d / 1.1);
        if (inf > 0.05) { s.rot.v += (vx / 1800) * 26 * inf; wake(); }
      });
    }
    row.addEventListener('pointermove', roza);
    row.addEventListener('pointerdown', function (e) { down = true; px = e.clientX; pt = e.timeStamp; vx = 0; });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (n) { row.addEventListener(n, function () { down = false; px = null; vx = 0; }); });

    // Teclado: flechas entre colgaduras
    row.addEventListener('keydown', function (e) {
      var k = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; if (!k) return;
      var i = items.indexOf(document.activeElement); if (i < 0) return; e.preventDefault(); items[(i + k + items.length) % items.length].focus();
    });

    cityListeners.push(function (c) { paintColg(c, true); });
    paintColg(getCity(), false);

    // Primera visita de la sesión: se despliegan de golpe, escalonadas, como al colgarlas en el balcón
    var visto = false; try { visto = sessionStorage.getItem('oc-colg') === '1'; sessionStorage.setItem('oc-colg', '1'); } catch (err) { }
    if (!visto && !calm && items[0].animate) items.forEach(function (el, i) { el.animate([{ transform: 'scaleY(0.5)', opacity: 0 }, { transform: 'scaleY(1)', opacity: 1 }], { duration: 560, delay: 60 * i, easing: DRAWER, fill: 'backwards' }); });
  })();

  // ---------- favoritos ----------
  var favs = store.json('oc-favs', {});
  function paintFavs() {
    $$('[data-fav]').forEach(function (b) {
      var on = !!favs[b.dataset.fav];
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      var t = $('.oc-fav-txt', b); if (t) t.textContent = on ? 'Guardado' : 'Guardar';
    });
  }
  $$('[data-fav]').forEach(function (b) {
    b.addEventListener('click', function () {
      var k = b.dataset.fav;
      if (favs[k]) delete favs[k]; else { favs[k] = { n: b.dataset.name, u: location.pathname, t: Date.now() }; if (!reduced) { b.classList.add('is-pop'); setTimeout(function () { b.classList.remove('is-pop'); }, 200); } }
      try { localStorage.setItem('oc-favs', JSON.stringify(favs)); } catch (e) { }
      paintFavs();
    });
  });
  paintFavs();
  var favList = $('[data-fav-list]');
  if (favList) {
    var keys = Object.keys(favs).sort(function (a, b) { return favs[b].t - favs[a].t; });
    var labels = { hermandad: 'Hermandad', banda: 'Banda', imaginero: 'Imaginero', capital: 'Capital' };
    favList.innerHTML = keys.map(function (k) {
      var f = favs[k], type = k.split(':')[0];
      return '<li class="oc-entry is-text"><div class="oc-entry-body"><h3 class="oc-entry-title"><a href="' + esc(f.u) + '">' + esc(f.n) + '</a></h3><p class="oc-entry-meta">' + esc(labels[type] || type) + '</p></div></li>';
    }).join('');
    $('[data-fav-empty]').hidden = keys.length > 0;
    // Mi Semana Santa: las hermandades guardadas ordenadas por jornada, con sus fechas del próximo año
    var miss = $('[data-mi-ss]');
    if (miss) {
      var SS = {}; try { SS = JSON.parse($('#oc-ss').textContent); } catch (e) { }
      var mine = keys.filter(function (k) { return k.indexOf('hermandad:') === 0 && SS.herms && SS.herms[k.split(':')[1]]; }).map(function (k) { var s = k.split(':')[1], h = SS.herms[s]; return { slug: s, n: favs[k].n, u: favs[k].u, d: h.d, o: h.o || 99, c: h.c, f: SS.dias[h.d] || '' }; })
        .filter(function (x) { return x.f; }).sort(function (a, b) { return a.f.localeCompare(b.f) || a.o - b.o; });
      if (mine.length) {
        miss.hidden = false;
        var MES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
        $('[data-mi-ss-list]').innerHTML = mine.map(function (x) { var d = new Date(x.f + 'T12:00:00Z'); return '<li class="oc-ev"><time class="oc-ev-date" datetime="' + x.f + '"><span>' + d.getUTCDate() + '</span>' + MES[d.getUTCMonth()].slice(0, 3) + '</time><div class="oc-ev-body"><p class="oc-ev-meta"><span class="oc-ev-tipo is-salidas">' + esc(x.d) + '</span><span>' + esc(SS.ciudades[x.c] || '') + '</span></p><p class="oc-ev-title"><a href="' + esc(x.u) + '">' + esc(x.n) + '</a></p></div></li>'; }).join('');
        $('[data-mi-ss-ics]').addEventListener('click', function () { window.ocIcs(mine.map(function (x) { return { f: x.f, n: 'Salida de ' + x.n + ' (' + x.d + ')', c: x.c, u: location.origin + x.u, m: 'Ocho Capitales' }; }), 'mi-semana-santa-' + SS.anio); });
      }
    }
  }

  // ---------- compartir ----------
  $$('[data-share]').forEach(function (b) {
    b.addEventListener('click', function () {
      var data = { title: document.title, url: location.href };
      var label = $('span', b);
      if (navigator.share) navigator.share(data).catch(function () { });
      else if (navigator.clipboard) navigator.clipboard.writeText(location.href).then(function () { label.textContent = 'Enlace copiado'; setTimeout(function () { label.textContent = 'Compartir'; }, 2200); });
    });
  });

  // ---------- directorios ----------
  $$('[data-dir-filters]').forEach(function (bar) {
    var scope = bar.parentNode;
    var grid = $('[data-dir]', scope);
    var cards = $$('.oc-entry', grid), empty = $('[data-dir-empty]', scope), count = $('[data-dir-count]', scope);
    var fields = {}; $$('[data-f]', bar).forEach(function (el) { fields[el.dataset.f] = el; });
    var params = new URLSearchParams(location.search);
    Object.keys(fields).forEach(function (k) { if (params.get(k)) fields[k].value = params.get(k); });
    var timer, PAGE = 50, limit = PAGE;
    var more = $('[data-dir-more]', scope), moreBtn = more && $('button', more);
    // En móvil los desplegables empiezan plegados; la búsqueda queda siempre a la vista
    var mf = $('[data-morefilters]', bar);
    if (mf && window.matchMedia('(max-width: 640px)').matches && !Object.keys(fields).some(function (k) { return k !== 'q' && fields[k].value; })) mf.open = false;
    function apply() {
      var q = norm(fields.q && fields.q.value).trim().split(/\s+/).filter(Boolean);
      var c = fields.ciudad ? fields.ciudad.value : '', d = fields.dia ? fields.dia.value : '', t = fields.tipo ? fields.tipo.value : '', o = fields.origen ? fields.origen.value : '';
      var n = 0;
      cards.forEach(function (el) {
        var hay = el.dataset.q || norm(el.textContent);
        var ok = q.every(function (w) { return hay.indexOf(w) !== -1; })
          && (!c || (' ' + el.dataset.ciudad + ' ').indexOf(' ' + c + ' ') !== -1)
          && (!d || el.dataset.dia === d) && (!t || el.dataset.tipo === t) && (!o || el.dataset.origen === o);
        if (ok) n++;
        el.hidden = !ok || n > limit;
      });
      if (more) { more.hidden = n <= limit; if (moreBtn) moreBtn.textContent = 'Mostrar ' + Math.min(PAGE, n - limit) + ' más (quedan ' + (n - limit) + ')'; }
      if (count) count.textContent = n + (n === 1 ? ' resultado' : ' resultados');
      if (empty) empty.hidden = n !== 0;
      var p = new URLSearchParams();
      Object.keys(fields).forEach(function (k) { if (fields[k].value) p.set(k, fields[k].value); });
      history.replaceState(null, '', location.pathname + (p.toString() ? '?' + p : ''));
    }
    Object.keys(fields).forEach(function (k) {
      fields[k].addEventListener('input', function () { clearTimeout(timer); timer = setTimeout(function () { limit = PAGE; apply(); }, 80); });
      fields[k].addEventListener('change', function () { limit = PAGE; apply(); });
    });
    if (moreBtn) moreBtn.addEventListener('click', function () {
      // el foco pasa al primer resultado nuevo para seguir leyendo con teclado o lector de pantalla
      var first = limit; limit += PAGE; apply();
      var vis = cards.filter(function (el) { return !el.hidden; }); var a = vis[first] && $('a', vis[first]); if (a) a.focus({ preventScroll: false });
    });
    var reset = $('[data-dir-reset]', scope);
    if (reset) reset.addEventListener('click', function () { Object.keys(fields).forEach(function (k) { fields[k].value = ''; }); limit = PAGE; apply(); fields.q && fields.q.focus(); });
    apply();
  });

  // ---------- calendario (pestañas por capital) ----------
  var calTabs = $('[data-cal-tabs]');
  if (calTabs) {
    var ctabs = $$('[role="tab"]', calTabs);
    var showCal = function (id, focus) {
      if (!document.getElementById(id)) return;
      $$('[data-cal]').forEach(function (s) { s.hidden = s.id !== id; });
      ctabs.forEach(function (a) { var on = a.getAttribute('href') === '#' + id; a.setAttribute('aria-selected', on ? 'true' : 'false'); a.tabIndex = on ? 0 : -1; if (on) { if (focus) a.focus(); hscroll(a); } });
    };
    ctabs.forEach(function (a, i) {
      a.addEventListener('click', function (e) { e.preventDefault(); var id = a.getAttribute('href').slice(1); showCal(id); history.replaceState(null, '', '#' + id); });
      a.addEventListener('keydown', function (e) {
        var j = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : -1;
        if (j < 0) return; e.preventDefault(); j = (j + ctabs.length) % ctabs.length; showCal(ctabs[j].getAttribute('href').slice(1), true);
      });
    });
    if (location.hash && /^#cal-/.test(location.hash)) showCal(location.hash.slice(1));
    else if (getCity()) showCal('cal-' + getCity());
    cityListeners.push(function (c) { if (c) showCal('cal-' + c); });
  }

  // ---------- agenda cofrade: mes interactivo, filtros por tipo y capital ----------
  var ag = $('[data-agenda]');
  if (ag) {
    var EVS = []; try { EVS = JSON.parse($('#oc-eventos').textContent); } catch (e) { }
    var TIPOS_AG = {}; try { TIPOS_AG = JSON.parse($('#oc-tipos').textContent); } catch (e) { }
    var COLS = window.OC_COLORS || {};
    var hoy = ag.dataset.hoy;
    var st = { g: '', c: getCity(), sel: '', y: +hoy.slice(0, 4), m: +hoy.slice(5, 7) - 1 };
    var monthBox = $('[data-month]', ag), daysBox = $('[data-month-days]', ag), titleBox = $('[data-month-title]', ag);
    var listBox = $('[data-agenda-list]', ag), listTitle = $('[data-agenda-list-title]', ag), emptyBox = $('[data-agenda-empty]', ag), resetBtn = $('[data-agenda-reset]', ag);
    var citySel = $('[data-agenda-ciudad]', ag);
    var MESES_L = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    var key = function (y, m, d) { return y + '-' + pad(m + 1) + '-' + pad(d); };
    var dotClass = function (g) { return g === 'liturgico' || g === 'salidas' || g === 'cultos' ? g : 'otros'; };
    // los eventos litúrgicos valen para todas las capitales
    var match = function (e) { return (!st.g || e.g === st.g) && (!st.c || !e.c || e.c === st.c); };
    var item = function (e) {
      var d = new Date(e.f + 'T12:00:00Z');
      var city = e.c ? '<span class="oc-city" style="--c:' + (COLS[e.c] || 'var(--primary)') + '">' + esc(CITY_NAMES[e.c] || e.c) + '</span>' : '<span>Todas las capitales</span>';
      var title = e.u ? '<a href="' + esc(e.u) + '" target="_blank" rel="nofollow noopener noreferrer">' + esc(e.n) + '<span class="oc-sr"> (abre ' + esc(e.m) + ')</span></a>' : esc(e.n);
      var hora = e.hr ? '<span class="oc-ev-hora">' + esc(e.hr) + ' h</span>' : '';
      var herm = e.hn ? '<p class="oc-ev-note">Hermandad: <a href="' + esc(e.hu) + '">' + esc(e.hn) + '</a></p>' : '';
      return '<li class="oc-ev"><time class="oc-ev-date" datetime="' + e.f + '"><span>' + d.getUTCDate() + '</span>' + MESES_L[d.getUTCMonth()].slice(0, 3) + '</time><div class="oc-ev-body"><p class="oc-ev-meta"><span class="oc-ev-tipo is-' + e.g + '">' + esc(TIPOS_AG[e.t] || e.t) + '</span>' + city + (e.v ? '<span class="oc-ev-ok">Confirmado</span>' : '') + hora + '</p><p class="oc-ev-title">' + title + '</p>' + herm + (e.o ? '<p class="oc-ev-note">' + esc(e.o) + '</p>' : '') + (e.m ? '<p class="oc-ev-note">Fuente: ' + esc(e.m) + '</p>' : '') + '<p class="oc-ev-note"><button class="oc-textbtn" type="button" data-ics="' + EVS.indexOf(e) + '">Añadir al calendario</button></p></div></li>';
    };
    var renderList = function () {
      var r;
      if (st.sel) {
        r = EVS.filter(function (e) { return e.f === st.sel && match(e); });
        var d = new Date(st.sel + 'T12:00:00Z');
        listTitle.textContent = 'Eventos del ' + d.getUTCDate() + ' de ' + MESES_L[d.getUTCMonth()];
      } else {
        r = EVS.filter(function (e) { return e.f >= hoy && match(e); }).slice(0, 14);
        listTitle.textContent = 'Próximos eventos';
      }
      listBox.innerHTML = r.map(item).join('');
      emptyBox.hidden = r.length > 0;
      resetBtn.hidden = !st.sel;
    };
    var renderMonth = function () {
      titleBox.textContent = MESES_L[st.m].charAt(0).toUpperCase() + MESES_L[st.m].slice(1) + ' ' + st.y;
      var first = new Date(Date.UTC(st.y, st.m, 1));
      var lead = (first.getUTCDay() + 6) % 7; // lunes primero
      var days = new Date(Date.UTC(st.y, st.m + 1, 0)).getUTCDate();
      var byDay = {};
      EVS.forEach(function (e) { if (match(e)) (byDay[e.f] = byDay[e.f] || []).push(e); });
      var html = '';
      for (var i = 0; i < lead; i++) html += '<span class="oc-mday is-blank" aria-hidden="true"></span>';
      for (var d = 1; d <= days; d++) {
        var k = key(st.y, st.m, d), evs = byDay[k] || [];
        var groups = []; evs.forEach(function (e) { var c = dotClass(e.g); if (groups.indexOf(c) === -1) groups.push(c); });
        var label = d + ' de ' + MESES_L[st.m] + (evs.length ? ', ' + evs.length + (evs.length === 1 ? ' evento' : ' eventos') : ', sin eventos');
        html += '<button type="button" class="oc-mday' + (k === hoy ? ' is-today' : '') + (k === st.sel ? ' is-selected' : '') + (evs.length ? ' has-ev' : '') + '" data-day="' + k + '" aria-label="' + label + '" aria-pressed="' + (k === st.sel) + '"' + (evs.length ? '' : ' disabled') + '><span>' + d + '</span><i class="oc-dots">' + groups.slice(0, 3).map(function (g) { return '<b class="oc-dot is-' + g + '"></b>'; }).join('') + '</i></button>';
      }
      daysBox.innerHTML = html;
    };
    // «Añadir al calendario»: se genera un .ics con ese acto en el propio navegador
    var icsEsc = function (t) { return String(t || '').replace(/\r\n|\r|\n/g, '\\n').replace(/[\x00-\x08\x0b-\x1f\x7f]/g, '').replace(/\\(?!n)/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,'); };
    window.ocIcs = function (evs, nombre) {
      var L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Ocho Capitales//ES', 'CALSCALE:GREGORIAN', 'BEGIN:VTIMEZONE', 'TZID:Europe/Madrid', 'BEGIN:STANDARD', 'DTSTART:19701025T030000', 'TZOFFSETFROM:+0200', 'TZOFFSETTO:+0100', 'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU', 'END:STANDARD', 'BEGIN:DAYLIGHT', 'DTSTART:19700329T020000', 'TZOFFSETFROM:+0100', 'TZOFFSETTO:+0200', 'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU', 'END:DAYLIGHT', 'END:VTIMEZONE'];
      evs.forEach(function (e) {
        var dia = e.f.replace(/-/g, ''), hh = e.hr ? e.hr.split(':') : null;
        L.push('BEGIN:VEVENT', 'UID:' + dia + '-' + (e.n || '').length + (e.c || '') + Math.abs(String(e.n).split('').reduce(function (a, c) { return a * 31 + c.charCodeAt(0) | 0; }, 7)) + '@ocho-capitales', 'DTSTAMP:' + new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, ''));
        if (hh) { L.push('DTSTART;TZID=Europe/Madrid:' + dia + 'T' + hh[0].padStart(2, '0') + hh[1] + '00', 'DTEND;TZID=Europe/Madrid:' + dia + 'T' + String(Math.min(23, +hh[0] + 1)).padStart(2, '0') + hh[1] + '00'); }
        else { var sig = new Date(Date.parse(e.f + 'T12:00:00Z') + 864e5).toISOString().slice(0, 10).replace(/-/g, ''); L.push('DTSTART;VALUE=DATE:' + dia, 'DTEND;VALUE=DATE:' + sig); }
        L.push('SUMMARY:' + icsEsc(e.n), 'LOCATION:' + icsEsc(CITY_NAMES[e.c] || ''));
        if (e.u) L.push('DESCRIPTION:' + icsEsc('Fuente: ' + e.m + ' ' + e.u));
        L.push('END:VEVENT');
      });
      L.push('END:VCALENDAR');
      var blob = new Blob([L.join('\r\n') + '\r\n'], { type: 'text/calendar;charset=utf-8' });
      var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = (nombre || 'acto') + '.ics'; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    };
    listBox.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-ics]'); if (!b) return;
      var e = EVS[+b.dataset.ics]; if (e) window.ocIcs([e], 'ocho-capitales-' + e.f);
    });
    var render = function () { renderMonth(); renderList(); };
    daysBox.addEventListener('click', function (e) {
      var b = e.target.closest('[data-day]'); if (!b || b.disabled) return;
      st.sel = st.sel === b.dataset.day ? '' : b.dataset.day; render();
      if (st.sel && window.matchMedia('(max-width: 959px)').matches) listTitle.scrollIntoView({ block: 'start', behavior: reduced ? 'auto' : 'smooth' });
    });
    $('[data-month-prev]', ag).addEventListener('click', function () { st.m--; if (st.m < 0) { st.m = 11; st.y--; } st.sel = ''; render(); });
    $('[data-month-next]', ag).addEventListener('click', function () { st.m++; if (st.m > 11) { st.m = 0; st.y++; } st.sel = ''; render(); });
    resetBtn.addEventListener('click', function () { st.sel = ''; render(); });
    $$('[data-agenda-tipo] button', ag).forEach(function (b) {
      b.addEventListener('click', function () {
        st.g = b.dataset.v;
        $$('[data-agenda-tipo] button', ag).forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        render();
      });
    });
    citySel.value = st.c;
    citySel.addEventListener('change', function () { st.c = citySel.value; render(); });
    cityListeners.push(function (c) { st.c = c; citySel.value = c; render(); });
    monthBox.hidden = false;
    render();
  }

  // ---------- capital: jornada visible resaltada en la barra de días ----------
  var daynav = $('.oc-daynav');
  if (daynav && 'IntersectionObserver' in window) {
    var links = $$('a', daynav), byId = {};
    links.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });
    // Píldora que se desliza de una jornada a otra (como un control segmentado); sin animación con «reducir movimiento».
    var dnUl = $('ul', daynav), ind = document.createElement('span');
    ind.className = 'oc-daynav-ind'; ind.setAttribute('aria-hidden', 'true'); dnUl.appendChild(ind);
    var moveInd = function (a) {
      if (!a) { ind.style.opacity = '0'; return; }
      ind.style.width = a.offsetWidth + 'px';
      ind.style.transform = 'translateX(' + a.offsetLeft + 'px)';
      ind.style.opacity = '1';
    };
    window.addEventListener('resize', function () { moveInd($('.is-current', daynav)); });
    var marcar = function (a) { links.forEach(function (x) { x.classList.toggle('is-current', x === a); }); moveInd(a); if (a) hscroll(a, true); };
    // En el móvil, las jornadas son un carrusel: se desliza de una a otra con el dedo (scroll-snap nativo, sin librerías).
    // La altura sigue a la jornada visible para que no quede hueco debajo de las cortas.
    var carr = $('.oc-split-main'), dias = $$('.oc-day');
    if (carr && dias.length > 1 && matchMedia('(max-width: 759px)').matches) {
      carr.classList.add('is-carrusel');
      var actual = -1;
      var ajustar = function (i) {
        i = Math.max(0, Math.min(dias.length - 1, i));
        carr.style.height = dias[i].offsetHeight + 'px';
        if (i === actual) return; var primera = actual < 0; actual = i;
        dias.forEach(function (d, j) { d.setAttribute('aria-hidden', j === i ? 'false' : 'true'); d.inert = j !== i; });
        marcar(byId[dias[i].id]);
        if (!primera && history.replaceState) history.replaceState(null, '', '#' + dias[i].id);
      };
      var idx0 = Math.max(0, dias.findIndex(function (d) { return '#' + d.id === location.hash; }));
      carr.scrollLeft = idx0 * carr.clientWidth; ajustar(idx0);
      var fin;
      carr.addEventListener('scroll', function () { clearTimeout(fin); fin = setTimeout(function () { ajustar(Math.round(carr.scrollLeft / carr.clientWidth)); }, 60); }, { passive: true });
      if ('ResizeObserver' in window) { var ro = new ResizeObserver(function () { if (actual >= 0) carr.style.height = dias[actual].offsetHeight + 'px'; }); dias.forEach(function (d) { ro.observe(d); }); }
      window.addEventListener('resize', function () { carr.scrollLeft = actual * carr.clientWidth; ajustar(actual); });
      links.forEach(function (a) {
        a.addEventListener('click', function (e) {
          var i = dias.findIndex(function (d) { return '#' + d.id === a.getAttribute('href'); }); if (i < 0) return;
          e.preventDefault();
          carr.scrollTo({ left: i * carr.clientWidth, behavior: reduced ? 'auto' : 'smooth' });
          var top = carr.getBoundingClientRect().top - daynav.offsetHeight - 70;
          if (top < 0) window.scrollBy({ top: top, behavior: reduced ? 'auto' : 'smooth' });
        });
      });
    }
    if (!carr || !carr.classList.contains('is-carrusel')) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (a) { a.classList.remove('is-current'); });
        var a = byId[en.target.id]; if (a) { a.classList.add('is-current'); moveInd(a); hscroll(a, true); }
      });
    }, { rootMargin: '-35% 0px -60% 0px' });
    $$('.oc-day').forEach(function (s) { io.observe(s); });
    }
  }

  // ---------- página de noticias ----------
  var nf = $('[data-news-filters]');
  if (nf) {
    var list = $('[data-news-list]'), more = $('[data-news-more]'), emptyN = $('[data-news-empty]'), countN = $('[data-news-count]');
    var qIn = $('[data-f="q"]', nf), all = null, shown = 24;
    var city = new URLSearchParams(location.search).get('ciudad') || getCity();
    if (city && !CITY_NAMES[city]) city = '';
    var COLORS = window.OC_COLORS || {};
    var cityTag = function (c) { return CITY_NAMES[c] ? '<span class="oc-city" style="--c:' + (COLORS[c] || 'var(--primary)') + '">' + esc(CITY_NAMES[c]) + '</span>' : ''; };
    var STOPW = { el: 1, la: 1, los: 1, las: 1, de: 1, del: 1, y: 1, en: 1 };
    var mono = function (f) {
      var w = String(f || '').replace(/[^\p{L}\p{N} ]/gu, ' ').split(/\s+/).filter(function (x) { return x && !STOPW[x.toLowerCase()]; });
      if (!w.length) return '·';
      if (w.length === 1) return /\d|^[A-ZÁÉÍÓÚÑ]{2,5}$/.test(w[0]) ? w[0].slice(0, 5) : w[0].slice(0, 2).toUpperCase();
      return (w[0][0] + w[1][0]).toUpperCase();
    };
    var card = function (n) {
      var d = new Date(n.ts).toISOString();
      var tile = n.img ? '<div class="oc-news-img" aria-hidden="true"><img src="' + esc(n.img) + '" alt="" width="160" height="120" loading="lazy" decoding="async" referrerpolicy="no-referrer" data-hide-broken></div>' : colgTile((n.ciudades || [])[0]);
      return '<article class="oc-news' + (tile ? ' has-img' : '') + '">' + tile +
        '<div class="oc-news-body"><p class="oc-news-meta">' + n.ciudades.map(cityTag).join('') + '<span class="oc-news-src">' + esc(n.fuente) + '</span><time datetime="' + d + '" data-ago></time></p><h3 class="oc-news-title"><a href="' + esc(n.url) + '" target="_blank" rel="nofollow noopener noreferrer">' + esc(n.titulo) + '<span class="oc-sr"> (abre ' + esc(n.fuente) + ' en otra pestaña)</span></a></h3>' + (n.extracto ? '<p class="oc-news-text">' + esc(n.extracto) + '</p>' : '') + '</div></article>';
    };
    var paintChips = function () { $$('[data-f="ciudad"] button', nf).forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.v === city ? 'true' : 'false'); }); };
    var render = function () {
      var q = norm(qIn.value).trim().split(/\s+/).filter(Boolean);
      var r = all.filter(function (n) { var h = norm(n.titulo + ' ' + (n.extracto || '') + ' ' + n.fuente); return (!city || n.ciudades.indexOf(city) !== -1) && q.every(function (w) { return h.indexOf(w) !== -1; }); });
      list.innerHTML = r.slice(0, shown).map(card).join('');
      paintAgo(list);
      emptyN.hidden = r.length > 0; more.hidden = r.length <= shown;
      countN.textContent = r.length + (r.length === 1 ? ' noticia' : ' noticias') + (city ? ' de ' + CITY_NAMES[city] : '');
      paintChips();
      var p = new URLSearchParams(); if (city) p.set('ciudad', city); if (qIn.value) p.set('q', qIn.value);
      history.replaceState(null, '', location.pathname + (p.toString() ? '?' + p : ''));
    };
    paintChips();
    var q0 = new URLSearchParams(location.search).get('q'); if (q0) qIn.value = q0;
    fetch(BASE + 'news.json').then(function (r) { return r.json(); }).then(function (j) {
      all = j.items; render();
      $$('[data-f="ciudad"] button', nf).forEach(function (b) { b.addEventListener('click', function () { city = b.dataset.v; shown = 24; render(); }); });
      var t; qIn.addEventListener('input', function () { clearTimeout(t); t = setTimeout(function () { shown = 24; render(); }, 120); });
      more.addEventListener('click', function () { shown += 24; render(); });
    }).catch(function () { if (countN) countN.textContent = 'No se pudo cargar el archivo completo; se muestran las últimas noticias.'; more.hidden = true; });
  }

  // ---------- buscador instantáneo ----------
  var idx = null, idxPromise = null;
  function loadIdx() {
    if (!idxPromise) idxPromise = fetch(BASE + 'search-index.json').then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }).then(function (j) { idx = j.map(function (e) { e.nn = norm(e.n); return e; }); return idx; }).catch(function (err) { idxPromise = null; throw err; });
    return idxPromise;
  }
  var TYPES = { c: 'Capitales', h: 'Hermandades', b: 'Bandas', i: 'Imagineros', m: 'Marchas', n: 'Noticias' };
  var ORDER = ['c', 'h', 'b', 'i', 'm', 'n'];
  function words(q) { return norm(q).trim().split(/\s+/).filter(function (w) { return w.length > 1; }); }
  function search(q) {
    var ws = words(q), full = norm(q).trim();
    if (!ws.length) return [];
    var res = [];
    idx.forEach(function (e) {
      var score = 0;
      for (var i = 0; i < ws.length; i++) {
        var w = ws[i], at = e.nn.indexOf(w);
        if (at !== -1) score += (at === 0 || e.nn.charAt(at - 1) === ' ') ? 6 : 3;
        else if (e.k.indexOf(w) !== -1) score += 1;
        else return;
      }
      if (e.nn === full) score += 20;
      if (e.t === 'c') score += 3;
      res.push([score, e]);
    });
    return res.sort(function (a, b) { return b[0] - a[0] || (b[1].d || 0) - (a[1].d || 0); }).map(function (x) { return x[1]; });
  }
  function hl(text, q) {
    var n = norm(text), marks = [];
    words(q).forEach(function (w) { var i = n.indexOf(w); if (i !== -1) marks.push([i, i + w.length]); });
    if (!marks.length) return esc(text);
    marks.sort(function (a, b) { return a[0] - b[0]; });
    var out = '', last = 0;
    marks.forEach(function (m) { if (m[0] < last) return; out += esc(text.slice(last, m[0])) + '<mark>' + esc(text.slice(m[0], m[1])) + '</mark>'; last = m[1]; });
    return out + esc(text.slice(last));
  }
  // Miniatura de cada resultado: foto del titular, colgadura de la capital o monograma en el color de su capital.
  var ICONO_T = { b: '♪', i: '✦', m: '♫', n: '¶' };
  function miniatura(e) {
    var col = (window.OC_COLORS && e.c && window.OC_COLORS[e.c]) || 'var(--primary)';
    if (e.i) return '<span class="oc-sr-thumb' + (e.t === 'c' ? ' is-colg' : '') + '" aria-hidden="true" style="--c:' + col + '"><img src="' + esc(e.i) + '" alt="" loading="lazy" decoding="async"></span>';
    var ini = e.t === 'h' ? esc(String(e.n).replace(/^(La|El|Los|Las)\s+/i, '').charAt(0)) : (ICONO_T[e.t] || '·');
    return '<span class="oc-sr-thumb is-mono" aria-hidden="true" style="--c:' + col + '">' + ini + '</span>';
  }
  // Recientes: lo último que abriste desde el buscador (solo en este navegador).
  function recientes() { return store.json('oc-recientes', []); }
  function guardarReciente(a) {
    var r = recientes().filter(function (x) { return x.u !== a.getAttribute('href'); });
    r.unshift({ u: a.getAttribute('href'), n: a.getAttribute('data-sr-n') || a.textContent, h: a.innerHTML });
    store.set('oc-recientes', JSON.stringify(r.slice(0, 6)));
  }
  function inicioBuscador(box) {
    var r = recientes(), c = getCity(), html = '';
    if (r.length) html += '<p class="oc-sr-group">Recientes <button type="button" class="oc-textbtn" data-sr-borrar>Borrar</button></p>' + r.map(function (x) { return '<a class="oc-sr-item" href="' + esc(x.u) + '" data-sr-n="' + esc(x.n) + '">' + x.h.replace(/<mark>|<\/mark>/g, '') + '</a>'; }).join('');
    html += '<p class="oc-sr-group">Sugerencias</p><div class="oc-sr-sug">' +
      (c ? '<a href="' + BASE + 'semana-santa/' + c + '/">Semana Santa de ' + esc(CITY_NAMES[c]) + '</a><a href="' + BASE + 'en-la-calle/' + c + '/">En la calle: ' + esc(CITY_NAMES[c]) + '</a>' : '') +
      '<a href="' + BASE + 'calendario/">Calendario</a><a href="' + BASE + 'hermandades/">Todas las hermandades</a><a href="' + BASE + 'marchas/">Marchas</a></div>';
    box.innerHTML = html;
    var b = $('[data-sr-borrar]', box); if (b) b.addEventListener('click', function () { store.set('oc-recientes', ''); inicioBuscador(box); });
  }
  document.addEventListener('click', function (e) { var a = e.target.closest && e.target.closest('.oc-sr-item'); if (a && a.closest('[data-search-results], [data-search-page-results]')) guardarReciente(a); });
  function renderResults(box, q, limit) {
    if (norm(q).trim().length < 2) { if (box === results) inicioBuscador(box); else box.innerHTML = '<p class="oc-hint">Escribe al menos dos letras. Da igual con o sin tildes.</p>'; return; }
    var r = search(q);
    if (!r.length) { box.innerHTML = '<p class="oc-hint">Sin resultados para «' + esc(q) + '». Prueba con el nombre popular de la hermandad, el de una imagen o el de su barrio.</p>'; return; }
    var g = {};
    r.forEach(function (e) { (g[e.t] = g[e.t] || []).push(e); });
    var present = ORDER.filter(function (t) { return g[t]; });
    box.innerHTML = present.map(function (t) {
      return '<p class="oc-sr-group">' + TYPES[t] + ' <span class="oc-muted">(' + g[t].length + ')</span></p>' + g[t].slice(0, limit).map(function (e) {
        var ext = /^https?:/.test(e.u);
        return '<a class="oc-sr-item" href="' + esc(ext ? e.u : BASE + e.u) + '"' + (ext ? ' target="_blank" rel="nofollow noopener noreferrer"' : '') + ' data-sr-n="' + esc(e.n) + '">' + miniatura(e) + '<span class="oc-sr-txt"><strong>' + hl(e.n, q) + '</strong><small>' + esc(e.s) + (ext ? ' (abre el medio)' : '') + '</small></span></a>';
      }).join('');
    }).join('');
  }
  var failMsg = '<p class="oc-hint">No se pudo cargar el buscador. Comprueba la conexión y vuelve a intentarlo.</p>';
  var ov = $('[data-search-overlay]'), input = $('[data-search-input]'), results = $('[data-search-results]');
  function openSearch(e, fromKey) { if (!ov) return; if (e && e.preventDefault) e.preventDefault(); input.value = ''; inicioBuscador(results); openLayer(ov, input, fromKey); loadIdx().catch(function () { }); }
  function closeSearch() { closeLayer(ov); }
  $$('[data-open-search]').forEach(function (b) { b.addEventListener('click', openSearch); });
  $$('[data-close-search]').forEach(function (b) { b.addEventListener('click', closeSearch); });
  if (ov) {
    ov.addEventListener('click', function (e) { if (e.target === ov) closeSearch(); });
    var st;
    input.addEventListener('input', function () { clearTimeout(st); st = setTimeout(function () { loadIdx().then(function () { renderResults(results, input.value, 8); }, function () { results.innerHTML = failMsg; }); }, 60); });
    ov.addEventListener('keydown', function (e) {
      var items = $$('.oc-sr-item', results), i = items.indexOf(document.activeElement);
      if (e.key === 'Escape') { closeSearch(); return; }
      if (e.key === 'ArrowDown' && items.length) { e.preventDefault(); (items[i + 1] || items[0]).focus(); }
      else if (e.key === 'ArrowUp' && document.activeElement !== input) { e.preventDefault(); (i > 0 ? items[i - 1] : input).focus(); }
      else if (e.key === 'Enter' && document.activeElement === input) { e.preventDefault(); if (items.length) items[0].click(); else if (input.value) location.href = BASE + 'buscar/?q=' + encodeURIComponent(input.value); }
      trapFocus(ov, e);
    });
  }
  document.addEventListener('keydown', function (e) {
    var tag = document.activeElement && document.activeElement.tagName;
    if (e.key === '/' && !/input|textarea|select/i.test(tag) && !e.ctrlKey && !e.metaKey) { e.preventDefault(); openSearch(null, true); }
  });
  var sp = $('[data-search-page]');
  if (sp) {
    var spIn = $('input', sp), spOut = $('[data-search-page-results]');
    var q0s = new URLSearchParams(location.search).get('q') || '';
    spIn.value = q0s;
    var run = function () { loadIdx().then(function () { renderResults(spOut, spIn.value, 30); history.replaceState(null, '', location.pathname + (spIn.value ? '?q=' + encodeURIComponent(spIn.value) : '')); }, function () { spOut.innerHTML = failMsg; }); };
    sp.addEventListener('submit', function (e) { e.preventDefault(); run(); });
    var spt; spIn.addEventListener('input', function () { clearTimeout(spt); spt = setTimeout(run, 80); });
    if (q0s) run(); else spIn.focus({ preventScroll: true });
  }
  // modo sin cobertura: copia de las páginas visitadas (service worker)
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    window.addEventListener('load', function () { navigator.serviceWorker.register(BASE + 'sw.js', { scope: BASE }).catch(function () { }); });
  }
})();
