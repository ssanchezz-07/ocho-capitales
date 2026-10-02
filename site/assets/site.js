/* InfoCofrade — interacción: tema, menú, buscador instantáneo, filtros, noticias, favoritos, cuenta atrás */
(function () {
  'use strict';
  var BASE = window.IC_BASE || '/';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var norm = function (s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); };
  var esc = function (s) { return String(s || '').replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };

  // ---------- tema ----------
  $$('[data-theme-toggle]').forEach(function (b) {
    b.addEventListener('click', function () {
      var root = document.documentElement;
      var dark = root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
      root.dataset.theme = dark ? 'light' : 'dark';
      try { localStorage.setItem('ic-theme', root.dataset.theme); } catch (e) {}
    });
  });
  // ---------- menú móvil ----------
  var menuBtn = $('[data-menu]'), nav = $('.ic-nav');
  if (menuBtn && nav) menuBtn.addEventListener('click', function () {
    var open = nav.classList.toggle('is-open'); menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  // ---------- fechas relativas ----------
  var rtf = window.Intl && Intl.RelativeTimeFormat ? new Intl.RelativeTimeFormat('es', { numeric: 'auto' }) : null;
  function ago(iso) {
    var d = (new Date(iso) - Date.now()) / 1000, a = Math.abs(d);
    if (!rtf) return new Date(iso).toLocaleDateString('es-ES');
    if (a < 3600) return rtf.format(Math.round(d / 60), 'minute');
    if (a < 86400) return rtf.format(Math.round(d / 3600), 'hour');
    if (a < 86400 * 30) return rtf.format(Math.round(d / 86400), 'day');
    return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  function paintAgo(root) { $$('time[data-ago]', root).forEach(function (t) { t.textContent = ago(t.getAttribute('datetime')); }); }
  paintAgo();

  // ---------- cuenta atrás a la próxima Semana Santa ----------
  function easter(y) { var a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451), mo = Math.floor((h + l - 7 * m + 114) / 31), da = ((h + l - 7 * m + 114) % 31) + 1; return new Date(y, mo - 1, da); }
  var cd = $('[data-countdown]');
  if (cd) {
    var now = new Date(), y = now.getFullYear(), ramos = new Date(easter(y).getTime() - 7 * 864e5);
    var pascua = easter(y);
    if (now > new Date(pascua.getTime() + 864e5)) { y++; pascua = easter(y); ramos = new Date(pascua.getTime() - 7 * 864e5); }
    var days = Math.ceil((ramos - now) / 864e5);
    cd.innerHTML = days > 0
      ? 'Faltan <strong>' + days + '</strong> días para el Domingo de Ramos de ' + y + ' (' + ramos.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' }) + ')'
      : '<strong>¡Es Semana Santa!</strong> Consulta el calendario de hoy';
    cd.hidden = false;
  }

  // ---------- favoritos ----------
  var favs = store.get('ic-favs', {});
  function paintFavs() {
    $$('[data-fav]').forEach(function (b) {
      var on = !!favs[b.dataset.fav];
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.firstElementChild.textContent = on ? '★' : '☆';
      var t = $('.ic-fav-txt', b); if (t) t.textContent = on ? 'Guardado' : 'Guardar';
    });
  }
  $$('[data-fav]').forEach(function (b) {
    b.addEventListener('click', function () {
      var k = b.dataset.fav;
      if (favs[k]) delete favs[k]; else favs[k] = { n: b.dataset.name, u: location.pathname, t: Date.now() };
      store.set('ic-favs', favs); paintFavs();
    });
  });
  paintFavs();
  var favList = $('[data-fav-list]');
  if (favList) {
    var keys = Object.keys(favs).sort(function (a, b) { return favs[b].t - favs[a].t; });
    var labels = { hermandad: 'Hermandad', banda: 'Banda', imaginero: 'Imaginero', capital: 'Capital' };
    favList.innerHTML = keys.map(function (k) {
      var f = favs[k], type = k.split(':')[0];
      return '<article class="pcof-card pcof-entry"><div class="pcof-card-body"><div class="pcof-meta"><span class="pcof-pill">' + esc(labels[type] || type) + '</span></div><h3><a href="' + esc(f.u) + '">' + esc(f.n) + '</a></h3></div></article>';
    }).join('');
    $('[data-fav-empty]').hidden = keys.length > 0;
  }

  // ---------- compartir ----------
  $$('[data-share]').forEach(function (b) {
    b.addEventListener('click', function () {
      var data = { title: document.title, url: location.href };
      if (navigator.share) navigator.share(data).catch(function () {});
      else if (navigator.clipboard) navigator.clipboard.writeText(location.href).then(function () { b.textContent = 'Enlace copiado'; });
    });
  });

  // ---------- directorios ----------
  $$('[data-dir-filters]').forEach(function (bar) {
    var grid = bar.parentNode.querySelector('[data-dir]');
    var cards = $$('.pcof-entry', grid), empty = bar.parentNode.querySelector('[data-dir-empty]'), count = $('.pcof-count', bar);
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
      fields[k].addEventListener('input', function () { clearTimeout(timer); timer = setTimeout(apply, 90); });
      fields[k].addEventListener('change', apply);
    });
    apply();
  });

  // ---------- calendario (pestañas) ----------
  var calTabs = $('[data-cal-tabs]');
  if (calTabs) {
    function showCal(id) {
      $$('[data-cal]').forEach(function (s) { s.hidden = s.id !== id; });
      $$('a', calTabs).forEach(function (a) { if (a.getAttribute('href') === '#' + id) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
    }
    calTabs.addEventListener('click', function (e) { var a = e.target.closest('a'); if (!a) return; e.preventDefault(); var id = a.getAttribute('href').slice(1); showCal(id); history.replaceState(null, '', '#' + id); });
    if (location.hash && document.getElementById(location.hash.slice(1))) showCal(location.hash.slice(1));
  }

  // ---------- noticias ----------
  var nf = $('[data-news-filters]');
  if (nf) {
    var list = $('[data-news-list]'), more = $('[data-news-more]'), emptyN = $('[data-news-empty]');
    var qIn = $('[data-f="q"]', nf), city = new URLSearchParams(location.search).get('ciudad') || '', all = null, shown = 24;
    var CAPS = {};
    $$('[data-f="ciudad"] button', nf).forEach(function (b) { if (b.dataset.v) CAPS[b.dataset.v] = b.textContent; });
    function card(n) {
      var d = new Date(n.ts).toISOString();
      var badges = n.ciudades.map(function (c) { return '<span class="pcof-badge" data-c="' + c + '">' + esc(CAPS[c] || c) + '</span>'; }).join('');
      return '<article class="pcof-card pcof-news">' + (n.img ? '<a class="pcof-thumb" href="' + esc(n.url) + '" target="_blank" rel="nofollow noopener noreferrer" tabindex="-1" aria-hidden="true"><img src="' + esc(n.img) + '" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.parentNode.remove()"></a>' : '') +
        '<div class="pcof-card-body"><div class="pcof-meta">' + badges + '<span class="pcof-src">' + esc(n.fuente) + '</span><time datetime="' + d + '" data-ago></time></div><h3><a href="' + esc(n.url) + '" target="_blank" rel="nofollow noopener noreferrer">' + esc(n.titulo) + '</a></h3>' + (n.extracto ? '<p>' + esc(n.extracto) + '</p>' : '') + '<span class="pcof-more">Leer en ' + esc(n.fuente) + ' ↗</span></div></article>';
    }
    function render() {
      var q = norm(qIn.value).trim().split(/\s+/).filter(Boolean);
      var r = all.filter(function (n) { var h = norm(n.titulo + ' ' + n.extracto + ' ' + n.fuente); return (!city || n.ciudades.indexOf(city) !== -1) && q.every(function (w) { return h.indexOf(w) !== -1; }); });
      list.innerHTML = r.slice(0, shown).map(card).join('');
      paintAgo(list); colorBadges(list);
      emptyN.hidden = r.length > 0; more.hidden = r.length <= shown;
      $$('[data-f="ciudad"] button', nf).forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.v === city ? 'true' : 'false'); });
    }
    function colorBadges(root) { var colors = window.IC_COLORS || {}; $$('.pcof-badge[data-c]', root).forEach(function (b) { if (colors[b.dataset.c]) b.style.setProperty('--c', colors[b.dataset.c]); }); }
    fetch(BASE + 'news.json').then(function (r) { return r.json(); }).then(function (j) {
      all = j.items; render();
      $$('[data-f="ciudad"] button', nf).forEach(function (b) { b.addEventListener('click', function () { city = b.dataset.v; shown = 24; render(); }); });
      qIn.addEventListener('input', function () { shown = 24; render(); });
      more.addEventListener('click', function () { shown += 24; render(); });
    }).catch(function () {});
  }

  // ---------- buscador instantáneo ----------
  var idx = null, idxPromise = null;
  function loadIdx() { if (!idxPromise) idxPromise = fetch(BASE + 'search-index.json').then(function (r) { return r.json(); }).then(function (j) { idx = j; return j; }); return idxPromise; }
  var TYPES = { c: 'Capitales', h: 'Hermandades', i: 'Imagineros', b: 'Bandas', m: 'Marchas' };
  function search(q) {
    var words = norm(q).trim().split(/\s+/).filter(function (w) { return w.length > 1; });
    if (!words.length) return [];
    var res = [];
    idx.forEach(function (e) {
      var nn = norm(e.n), score = 0;
      for (var i = 0; i < words.length; i++) {
        var w = words[i];
        if (nn.indexOf(w) !== -1) score += nn.indexOf(w) === 0 ? 6 : 4;
        else if (e.k.indexOf(w) !== -1) score += 1;
        else return;
      }
      if (nn === norm(q).trim()) score += 20;
      res.push([score + (e.t === 'c' ? 2 : e.t === 'h' ? 1 : 0), e]);
    });
    return res.sort(function (a, b) { return b[0] - a[0]; }).slice(0, 40).map(function (x) { return x[1]; });
  }
  function hl(text, q) {
    var t = esc(text), words = norm(q).trim().split(/\s+/).filter(function (w) { return w.length > 1; });
    var n = norm(text);
    var marks = [];
    words.forEach(function (w) { var i = n.indexOf(w); if (i !== -1) marks.push([i, i + w.length]); });
    if (!marks.length) return t;
    marks.sort(function (a, b) { return a[0] - b[0]; });
    var out = '', last = 0;
    marks.forEach(function (m) { if (m[0] < last) return; out += esc(text.slice(last, m[0])) + '<mark>' + esc(text.slice(m[0], m[1])) + '</mark>'; last = m[1]; });
    return out + esc(text.slice(last));
  }
  function renderResults(box, q) {
    if (norm(q).trim().length < 2) { box.innerHTML = '<p class="pcof-note">Escribe al menos 2 letras.</p>'; return; }
    var r = search(q);
    if (!r.length) { box.innerHTML = '<p class="pcof-empty">Sin resultados para «' + esc(q) + '».</p>'; return; }
    var g = {};
    r.forEach(function (e) { (g[e.t] = g[e.t] || []).push(e); });
    var order = []; r.forEach(function (e) { if (order.indexOf(e.t) === -1) order.push(e.t); });
    box.innerHTML = order.map(function (t) {
      return '<p class="ic-sr-group">' + TYPES[t] + '</p>' + g[t].slice(0, 12).map(function (e) { return '<a class="ic-sr-item" href="' + BASE + e.u + '">' + hl(e.n, q) + '<small>' + esc(e.s) + '</small></a>'; }).join('');
    }).join('');
  }
  var ov = $('[data-search-overlay]'), input = $('[data-search-input]'), results = $('[data-search-results]');
  function openSearch() { if (!ov) return; ov.hidden = false; input.value = ''; input.focus(); loadIdx(); document.body.style.overflow = 'hidden'; }
  function closeSearch() { if (!ov) return; ov.hidden = true; document.body.style.overflow = ''; }
  $$('[data-open-search]').forEach(function (b) { b.addEventListener('click', openSearch); });
  $$('[data-close-search]').forEach(function (b) { b.addEventListener('click', closeSearch); });
  if (ov) {
    ov.addEventListener('click', function (e) { if (e.target === ov) closeSearch(); });
    input.addEventListener('input', function () { loadIdx().then(function () { renderResults(results, input.value); }); });
    input.addEventListener('keydown', function (e) {
      var items = $$('.ic-sr-item', results); var i = items.indexOf(document.activeElement);
      if (e.key === 'ArrowDown' && items.length) { e.preventDefault(); items[0].focus(); }
      if (e.key === 'Enter' && items.length) { e.preventDefault(); location.href = items[0].href; }
    });
    results.addEventListener('keydown', function (e) {
      var items = $$('.ic-sr-item', results); var i = items.indexOf(document.activeElement);
      if (e.key === 'ArrowDown' && i < items.length - 1) { e.preventDefault(); items[i + 1].focus(); }
      if (e.key === 'ArrowUp') { e.preventDefault(); (i > 0 ? items[i - 1] : input).focus(); }
    });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === '/' && !/input|textarea|select/i.test(document.activeElement.tagName)) { e.preventDefault(); openSearch(); }
    if (e.key === 'Escape') closeSearch();
  });
  var sp = $('[data-search-page]');
  if (sp) {
    var spIn = $('input', sp), spOut = $('[data-search-page-results]');
    var q0 = new URLSearchParams(location.search).get('q') || '';
    spIn.value = q0;
    var run = function () { loadIdx().then(function () { renderResults(spOut, spIn.value); history.replaceState(null, '', location.pathname + (spIn.value ? '?q=' + encodeURIComponent(spIn.value) : '')); }); };
    sp.addEventListener('submit', function (e) { e.preventDefault(); run(); });
    spIn.addEventListener('input', run);
    if (q0) run();
  }
})();
