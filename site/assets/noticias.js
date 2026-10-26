// Ocho Capitales · página de Noticias: un solo dibujante para la página compilada (build.mjs, en Node) y el navegador (site.js).
// Jerarquía: la destacada (la más reciente con foto) y «Lo último» al lado; «En cada capital», la última de cada una;
// después, el archivo por días. Cada foto sale una sola vez; sin foto, el sello del medio sobre el terciopelo de su capital.
// No se inventa nada: titular, medio, hora, capital y extracto son los de news.json, y todo enlaza al medio original.
(function (root) {
  'use strict';
  var TZ = 'Europe/Madrid';
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var norm = function (s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); };
  var ext = ' target="_blank" rel="nofollow noopener noreferrer"';
  // Temas (los pone filtro-noticias.mjs al compilar) y los que mandan en la destacada
  var TEMAS = [['salidas', 'Salidas'], ['cultos', 'Cultos y traslados'], ['coronaciones', 'Coronaciones'], ['musica', 'Música'], ['patrimonio', 'Patrimonio y estrenos'], ['cabildos', 'Cabildos y cargos'], ['pregones', 'Pregones y carteles'], ['agenda', 'Agenda']];
  var NOMBRE_TEMA = {}; TEMAS.forEach(function (t) { NOMBRE_TEMA[t[0]] = t[1]; });
  var IMPORTANTES = ['coronaciones', 'salidas', 'pregones', 'patrimonio', 'cultos'];
  var fDia = function (ts, o) { return new Intl.DateTimeFormat('es-ES', Object.assign({ timeZone: TZ }, o)).format(new Date(ts)); };
  var claveDia = function (ts) { return fDia(ts, { year: 'numeric', month: '2-digit', day: '2-digit' }); };
  var hora = function (ts) { return fDia(ts, { hour: '2-digit', minute: '2-digit', hour12: false }); };
  // Sello del medio: sus iniciales (dos como mucho), para la noticia que no trae foto
  var iniciales = function (f) {
    var p = String(f || '').replace(/^(el|la|los|las|diario)\s+/i, '').split(/[\s\-·.]+/).filter(function (w) { return w && !/^(de|del|la|las|los|el|y|en)$/i.test(w); });
    if (!p.length) return '·';
    var s = p.length === 1 ? p[0].slice(0, 3) : p[0][0] + p[1][0];
    return /^\d/.test(s) ? p[0].slice(0, 3) : s.toUpperCase();
  };

  function vista(items, o) {
    o = o || {};
    var names = o.names || {}, colors = o.colors || {}, city = o.city || '', q = norm(o.q || '').trim().split(/\s+/).filter(Boolean);
    var shown = o.shown || 24, ahora = o.now || Date.now();
    var colorDe = function (n) { return colors[(n.ciudades || [])[0]] || ''; };
    var tag = function (c) { return names[c] ? '<span class="oc-city" style="--c:' + (colors[c] || 'var(--primary)') + '">' + esc(names[c]) + '</span>' : ''; };
    var r = items.filter(function (n) {
      if (city && (n.ciudades || []).indexOf(city) === -1) return false;
      if (o.oficiales && n.tipo !== 'oficial') return false;
      if (o.tema && (n.temas || []).indexOf(o.tema) === -1) return false;
      if (!q.length) return true;
      var h = norm(n.titulo + ' ' + (n.extracto || '') + ' ' + n.fuente);
      return q.every(function (w) { return h.indexOf(w) !== -1; });
    });
    var vistas = {}; // cada foto, una sola vez en la página
    var foto = function (n) { if (!n.img || vistas[n.img]) return ''; vistas[n.img] = 1; return n.img; };
    var otros = function (n) { var x = n.otros || []; return x.length ? '<p class="nx-otros">También en ' + x.slice(0, 2).map(function (y) { return '<a href="' + esc(y.u) + '"' + ext + '>' + esc(y.f) + '</a>'; }).join(x.length === 2 ? ' y ' : ', ') + (x.length > 2 ? ' y ' + (x.length - 2) + ' más' : '') + '</p>' : ''; };
    var enlace = function (n, cls) { return '<a class="' + cls + '" href="' + esc(n.url) + '"' + ext + '>' + esc(n.titulo) + '<span class="oc-sr"> (abre ' + esc(n.fuente) + ' en otra pestaña)</span></a>'; };
    // tema principal: el que se filtra, si hay filtro; si no, el primero de la noticia
    var temaDe = function (n) { var t = n.temas || []; var k = o.tema && t.indexOf(o.tema) !== -1 ? o.tema : t[0]; return k && NOMBRE_TEMA[k] ? '<span class="nx-tema">' + esc(NOMBRE_TEMA[k]) + '</span>' : ''; };
    var meta = function (n, conCiudad) { return '<p class="nx-meta">' + temaDe(n) + '<span class="nx-src">' + esc(n.fuente) + '</span><time datetime="' + new Date(n.ts).toISOString() + '" data-ago>' + hora(n.ts) + '</time>' + (n.tipo === 'oficial' ? '<span class="nx-oficial">Oficial</span>' : '') + (conCiudad ? (n.ciudades || []).map(tag).join('') : '') + '</p>'; };
    var conCiudad = !city;
    var tarjeta = function (n, i) {
      var f = foto(n), c = colorDe(n);
      var vis = f ? '<div class="nx-foto" aria-hidden="true"><img src="' + esc(f) + '" alt="" width="320" height="240" loading="lazy" decoding="async" referrerpolicy="no-referrer" data-hide-broken></div>'
        : '<div class="nx-sello" aria-hidden="true"' + (c ? ' style="--c:' + c + '"' : '') + '><span>' + esc(iniciales(n.fuente)) + '</span></div>';
      return '<article class="nx-card vida-entra' + (f ? ' has-foto' : '') + '" style="--i:' + (i % 6) + '">' + vis + '<div class="nx-body"><h3 class="nx-tit">' + enlace(n, 'nx-a') + '</h3>' + meta(n, conCiudad) + otros(n) + (n.extracto ? '<p class="nx-ext">' + esc(n.extracto) + '</p>' : '') + '</div></article>';
    };

    var html = '', resto = r.slice(), portada = !q.length && !o.oficiales && !o.tema;
    // 1) destacada + «Lo último»
    if (portada && resto.length) {
      // destacada: la más reciente con foto de entre las 24 primeras, y mejor si es de un tema importante (coronación, salida, pregón…)
      var k = -1, k2 = -1;
      for (var i = 0; i < Math.min(24, resto.length); i++) if (resto[i].img) { if (k2 < 0) k2 = i; if ((resto[i].temas || []).some(function (t) { return IMPORTANTES.indexOf(t) !== -1; })) { k = i; break; } }
      if (k < 0) k = k2;
      var d = k >= 0 ? resto.splice(k, 1)[0] : null;
      var ultimas = resto.splice(0, d ? 5 : 6);
      if (d) {
        var fd = foto(d), cd = colorDe(d);
        html += '<div class="nx-portada"><article class="nx-destacada"' + (cd ? ' style="--c:' + cd + '"' : '') + '><div class="nx-destacada-foto" aria-hidden="true"><img src="' + esc(fd) + '" alt="" width="960" height="600" fetchpriority="high" decoding="async" referrerpolicy="no-referrer" data-hide-broken></div><div class="nx-destacada-txt"><h2 class="nx-destacada-tit">' + enlace(d, 'nx-a') + '</h2>' + meta(d, conCiudad) + (d.extracto ? '<p class="nx-ext">' + esc(d.extracto) + '</p>' : '') + otros(d) + '</div></article>';
      } else html += '<div class="nx-portada is-sin-foto">';
      html += '<section class="nx-ultimo" aria-labelledby="nx-ultimo-t"><h2 class="nx-h" id="nx-ultimo-t">Lo último</h2><ol>' + ultimas.map(function (n) {
        return '<li><time class="nx-hora" datetime="' + new Date(n.ts).toISOString() + '">' + hora(n.ts) + '</time><div><h3 class="nx-ultimo-tit">' + enlace(n, 'nx-a') + '</h3><p class="nx-meta"><span class="nx-src">' + esc(n.fuente) + '</span>' + (conCiudad ? (n.ciudades || []).map(tag).join('') : '') + '</p></div></li>';
      }).join('') + '</ol></section></div>';
      // 2) la última de cada capital (solo con las ocho a la vista)
      var enCaps = [];
      if (!city && o.capitales) {
        var usadas = {}; [d].concat(ultimas).forEach(function (n) { if (n) usadas[n.url] = 1; });
        var cel = o.capitales.map(function (c) {
          var mias = items.filter(function (n) { return (n.ciudades || []).indexOf(c) !== -1; });
          var n = mias.filter(function (x) { return !usadas[x.url]; })[0] || mias[0];
          if (!n) return '';
          usadas[n.url] = 1; enCaps.push(n.url);
          return '<li class="nx-cap vida-entra" style="--c:' + (colors[c] || 'var(--primary)') + '"><button type="button" class="nx-cap-nombre" data-ver-ciudad="' + c + '"><span>' + esc(names[c]) + '</span><b>' + mias.length + '</b></button><h3 class="nx-cap-tit">' + enlace(n, 'nx-a') + '</h3><p class="nx-meta"><span class="nx-src">' + esc(n.fuente) + '</span><time datetime="' + new Date(n.ts).toISOString() + '" data-ago>' + hora(n.ts) + '</time></p></li>';
        }).join('');
        if (cel) html += '<section class="nx-caps" aria-labelledby="nx-caps-t"><h2 class="nx-h" id="nx-caps-t">En cada capital</h2><ul>' + cel + '</ul></section>';
      }
      // lo que ya está arriba no se repite en el archivo
      if (enCaps.length) resto = resto.filter(function (n) { return enCaps.indexOf(n.url) === -1; });
    }
    // 3) el archivo, por días
    var lista = resto.slice(0, shown), dias = [], porDia = {};
    lista.forEach(function (n) { var kd = claveDia(n.ts); if (!porDia[kd]) { porDia[kd] = []; dias.push(kd); } porDia[kd].push(n); });
    var hoy = claveDia(ahora), ayer = claveDia(ahora - 864e5);
    var nombreDia = function (kd, ts) { var base = fDia(ts, { weekday: 'long', day: 'numeric', month: 'long' }); return kd === hoy ? 'Hoy<small>' + base + '</small>' : kd === ayer ? 'Ayer<small>' + base + '</small>' : base; };
    if (lista.length) html += '<h2 class="oc-sr">Todas las noticias</h2>' + dias.map(function (kd) {
      var L = porDia[kd];
      return '<section class="nx-dia"><h3 class="nx-dia-t">' + nombreDia(kd, L[0].ts) + '<span class="nx-dia-n">' + L.length + '</span></h3><div class="nx-grid">' + L.map(tarjeta).join('') + '</div></section>';
    }).join('');
    return { html: html, total: r.length, quedan: Math.max(0, resto.length - shown) };
  }
  root.OCNoticias = { vista: vista, iniciales: iniciales, TEMAS: TEMAS };
})(typeof window !== 'undefined' ? window : globalThis);
