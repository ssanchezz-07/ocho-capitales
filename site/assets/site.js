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
    set: function (k, v) { try { if (v == null || v === '') localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} },
    json: function (k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  };
  var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var CITY_NAMES = {};
  $$('[data-city-select] option').forEach(function (o) { if (o.value) CITY_NAMES[o.value] = o.textContent; });

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
  function openLayer(el, focusEl) {
    lastFocus = document.activeElement;
    el.hidden = false;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(function () { requestAnimationFrame(function () { el.classList.add('is-open'); }); });
    if (focusEl) setTimeout(function () { focusEl.focus(); }, reduced ? 0 : 30);
  }
  function closeLayer(el) {
    if (!el || el.hidden) return;
    el.classList.remove('is-open');
    document.body.style.overflow = '';
    setTimeout(function () { el.hidden = true; }, reduced ? 0 : 200);
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

  var sheet = $('[data-more-sheet]'), moreBtn = $('[data-more]');
  if (sheet && moreBtn) {
    moreBtn.addEventListener('click', function () { moreBtn.setAttribute('aria-expanded', 'true'); openLayer(sheet, $('[data-more-close]', sheet)); });
    var closeSheet = function () { moreBtn.setAttribute('aria-expanded', 'false'); closeLayer(sheet); };
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

  // Imágenes de noticias que no cargan: se quita el hueco en vez de dejar un recuadro vacío.
  function dropImg(img) { var box = img.closest('.oc-news-img'); if (!box) return; var card = box.closest('.oc-news'); box.remove(); if (card) card.classList.remove('has-img'); }
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
        if (on) { if (focus) t.focus(); t.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: reduced ? 'auto' : 'smooth' }); }
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
        e.preventDefault(); j = (j + tabs.length) % tabs.length; selectSlot(tabs[j].dataset.slot, true, true);
      });
    });
    // La página se genera cada dos horas: el navegador corrige la jornada si la copia en caché se ha quedado atrás.
    var pick = pickSlot(new Date());
    if (pick.hoy) {
      var mark = $('[data-slot="' + pick.id + '"]', today); if (mark) mark.setAttribute('data-today-mark', '');
      $('[data-today-title]', today).textContent = 'Hoy en la calle';
    }
    if (String(pick.year) === today.dataset.year) {
      var lead = $('[data-today-lead]', today);
      if (!pick.hoy && lead) {
        var ramos = new Date(easter(pick.year) - 7 * 864e5);
        lead.innerHTML = 'Faltan <strong>' + pick.days + '</strong> ' + (pick.days === 1 ? 'día' : 'días') + ' para el Domingo de Ramos (' + ramos.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', timeZone: 'UTC' }) + '). Así sale cada jornada.';
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
      if (favs[k]) delete favs[k]; else { favs[k] = { n: b.dataset.name, u: location.pathname, t: Date.now() }; if (!reduced) { b.classList.add('is-pop'); setTimeout(function () { b.classList.remove('is-pop'); }, 300); } }
      try { localStorage.setItem('oc-favs', JSON.stringify(favs)); } catch (e) {}
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
  }

  // ---------- compartir ----------
  $$('[data-share]').forEach(function (b) {
    b.addEventListener('click', function () {
      var data = { title: document.title, url: location.href };
      var label = $('span', b);
      if (navigator.share) navigator.share(data).catch(function () {});
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
    var timer;
    function apply() {
      var q = norm(fields.q && fields.q.value).trim().split(/\s+/).filter(Boolean);
      var c = fields.ciudad ? fields.ciudad.value : '', d = fields.dia ? fields.dia.value : '', t = fields.tipo ? fields.tipo.value : '';
      var n = 0;
      cards.forEach(function (el) {
        var hay = el.dataset.q || norm(el.textContent);
        var ok = q.every(function (w) { return hay.indexOf(w) !== -1; })
          && (!c || (' ' + el.dataset.ciudad + ' ').indexOf(' ' + c + ' ') !== -1)
          && (!d || el.dataset.dia === d) && (!t || el.dataset.tipo === t);
        el.hidden = !ok; if (ok) n++;
      });
      if (count) count.textContent = n + (n === 1 ? ' resultado' : ' resultados');
      if (empty) empty.hidden = n !== 0;
      var p = new URLSearchParams();
      Object.keys(fields).forEach(function (k) { if (fields[k].value) p.set(k, fields[k].value); });
      history.replaceState(null, '', location.pathname + (p.toString() ? '?' + p : ''));
    }
    Object.keys(fields).forEach(function (k) {
      fields[k].addEventListener('input', function () { clearTimeout(timer); timer = setTimeout(apply, 80); });
      fields[k].addEventListener('change', apply);
    });
    var reset = $('[data-dir-reset]', scope);
    if (reset) reset.addEventListener('click', function () { Object.keys(fields).forEach(function (k) { fields[k].value = ''; }); apply(); fields.q && fields.q.focus(); });
    apply();
  });

  // ---------- calendario (pestañas por capital) ----------
  var calTabs = $('[data-cal-tabs]');
  if (calTabs) {
    var ctabs = $$('[role="tab"]', calTabs);
    var showCal = function (id, focus) {
      if (!document.getElementById(id)) return;
      $$('[data-cal]').forEach(function (s) { s.hidden = s.id !== id; });
      ctabs.forEach(function (a) { var on = a.getAttribute('href') === '#' + id; a.setAttribute('aria-selected', on ? 'true' : 'false'); a.tabIndex = on ? 0 : -1; if (on) { if (focus) a.focus(); a.scrollIntoView({ block: 'nearest', inline: 'nearest' }); } });
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

  // ---------- capital: jornada visible resaltada en la barra de días ----------
  var daynav = $('.oc-daynav');
  if (daynav && 'IntersectionObserver' in window) {
    var links = $$('a', daynav), byId = {};
    links.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (a) { a.classList.remove('is-current'); });
        var a = byId[en.target.id]; if (a) { a.classList.add('is-current'); a.scrollIntoView({ block: 'nearest', inline: 'center' }); }
      });
    }, { rootMargin: '-35% 0px -60% 0px' });
    $$('.oc-day').forEach(function (s) { io.observe(s); });
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
    var card = function (n) {
      var d = new Date(n.ts).toISOString();
      return '<article class="oc-news' + (n.img ? ' has-img' : '') + '">' + (n.img ? '<div class="oc-news-img"><img src="' + esc(n.img) + '" alt="" width="400" height="225" loading="lazy" decoding="async" referrerpolicy="no-referrer" data-hide-broken></div>' : '') +
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
  function renderResults(box, q, limit) {
    if (norm(q).trim().length < 2) { box.innerHTML = '<p class="oc-hint">Escribe al menos dos letras. Da igual con o sin tildes.</p>'; return; }
    var r = search(q);
    if (!r.length) { box.innerHTML = '<p class="oc-hint">Sin resultados para «' + esc(q) + '». Prueba con el nombre popular de la hermandad, el de una imagen o el de su barrio.</p>'; return; }
    var g = {};
    r.forEach(function (e) { (g[e.t] = g[e.t] || []).push(e); });
    var present = ORDER.filter(function (t) { return g[t]; });
    box.innerHTML = present.map(function (t) {
      return '<p class="oc-sr-group">' + TYPES[t] + ' <span class="oc-muted">(' + g[t].length + ')</span></p>' + g[t].slice(0, limit).map(function (e) {
        var ext = /^https?:/.test(e.u);
        return '<a class="oc-sr-item" href="' + esc(ext ? e.u : BASE + e.u) + '"' + (ext ? ' target="_blank" rel="nofollow noopener noreferrer"' : '') + '><strong>' + hl(e.n, q) + '</strong><small>' + esc(e.s) + (ext ? ' (abre el medio)' : '') + '</small></a>';
      }).join('');
    }).join('');
  }
  var failMsg = '<p class="oc-hint">No se pudo cargar el buscador. Comprueba la conexión y vuelve a intentarlo.</p>';
  var ov = $('[data-search-overlay]'), input = $('[data-search-input]'), results = $('[data-search-results]');
  function openSearch(e) { if (!ov) return; if (e) e.preventDefault(); input.value = ''; results.innerHTML = '<p class="oc-hint">Escribe al menos dos letras. Da igual con o sin tildes.</p>'; openLayer(ov, input); loadIdx().catch(function () {}); }
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
    if (e.key === '/' && !/input|textarea|select/i.test(tag) && !e.ctrlKey && !e.metaKey) { e.preventDefault(); openSearch(); }
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
})();
