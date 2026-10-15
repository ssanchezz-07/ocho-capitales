/* Ocho Capitales · erCuñao: asistente sin IA que busca en la base de datos del portal (data/cunao.json).
   Entiende días, capitales, hermandades (por nombre, titular o apodo), bandas, imagineros y avisos de errores. */
(function () {
  'use strict';
  var btn = document.querySelector('[data-cunao]'), hoja = document.querySelector('[data-cunao-hoja]');
  if (!btn || !hoja) return;
  var BASE = window.OC_BASE || '/';
  var chat = hoja.querySelector('[data-cunao-chat]'), form = hoja.querySelector('[data-cunao-form]'), q = hoja.querySelector('[data-cunao-q]');
  var calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var D = null, modo = null, ultimoFoco = null, ultima = null;
  var norm = function (s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9ñ ]/g, ' ').replace(/\s+/g, ' ').trim(); };
  var art = function (d) { return /^Madrug/.test(d) ? 'la Madrugá' : /^Hermandades|^Vísperas/.test(d) ? 'en ' + d.toLowerCase() : 'el ' + d; };
  var azar = function (l) { return l[Math.floor(Math.random() * l.length)]; };
  var STOP = new Set(' la el los las de del y e en a al que donde cuando hora horas sale salen sali salida hoy manana por para con su sus mi me lo le un una unos es esta estan hay va van ver quien como cual cuales hermandad cofradia paso pasos dime decir sabes saber semana santa capital'.split(' '));
  var esStop = function (t) { return STOP.has(t); };
  var HOLA = ['¿Qué pasa, cuñao? Pregúntame lo que quieras, que de esto sé más que nadie.', 'Aquí estoy, como siempre que hace falta. ¿Qué cofradía buscamos?', 'Dime, que llevo cuarenta Semanas Santas en el cuerpo.'];
  var NOSE = ['Eso no lo sé ni yo, y mira que sé de todo. Prueba con el nombre de la hermandad, su titular o el día.', 'Uy, esa no me suena. ¿Me la dices de otra forma? Por ejemplo: «Cautivo de Málaga».', 'Me has pillado. Dímelo con el nombre de la cofradía o del Cristo o la Virgen.'];
  var GRACIAS = ['A mandar. Y llévate agua, que luego to\' son prisas.', 'Para eso estamos, cuñao.', 'Nada, hombre. Y ponte en la sombra, que el sol de abril engaña.'];

  // ---------- conversación ----------
  function burbuja(quien, nodo) {
    var b = document.createElement('div'); b.className = 'oc-cunao-msg is-' + quien;
    if (typeof nodo === 'string') { var p = document.createElement('p'); p.textContent = nodo; b.appendChild(p); } else b.appendChild(nodo);
    chat.appendChild(b); chat.scrollTop = chat.scrollHeight;
    if (!calm) b.animate([{ opacity: 0, transform: 'translateY(8px) scale(.98)' }, { opacity: 1, transform: 'none' }], { duration: 260, easing: 'cubic-bezier(.23,1,.32,1)' });
    return b;
  }
  function frag() { var f = document.createElement('div'); for (var i = 0; i < arguments.length; i++) if (arguments[i]) f.appendChild(typeof arguments[i] === 'string' ? texto(arguments[i]) : arguments[i]); return f; }
  function texto(t, tag) { var p = document.createElement(tag || 'p'); p.textContent = t; return p; }
  function enlace(t, href, cls) { var a = document.createElement('a'); a.href = href; a.textContent = t; if (cls) a.className = cls; return a; }
  function fichas(lista) { var d = document.createElement('div'); d.className = 'oc-cunao-chips'; lista.forEach(function (x) { var b = document.createElement('button'); b.type = 'button'; b.textContent = x; b.addEventListener('click', function () { preguntar(x); }); d.appendChild(b); }); return d; }
  function acciones(l) { var d = document.createElement('div'); d.className = 'oc-cunao-acc'; l.forEach(function (x) { d.appendChild(enlace(x[0], x[1], 'oc-cunao-link')); }); return d; }

  // ---------- comprensión ----------
  var DIAS_ALIAS = [['viernes de dolores', 'Viernes de Dolores'], ['sabado de pasion', 'Sábado de Pasión'], ['domingo de ramos', 'Domingo de Ramos'], ['ramos', 'Domingo de Ramos'], ['lunes', 'Lunes Santo'], ['martes', 'Martes Santo'], ['miercoles', 'Miércoles Santo'], ['jueves', 'Jueves Santo'], ['madrugada', 'Madrugá'], ['madruga', 'Madrugá'], ['viernes santo', 'Viernes Santo'], ['viernes', 'Viernes Santo'], ['sabado santo', 'Sábado Santo'], ['sabado', 'Sábado Santo'], ['resurreccion', 'Domingo de Resurrección'], ['domingo', 'Domingo de Ramos']];
  var hoyISO = function (mas) { var d = new Date(Date.now() + (mas || 0) * 864e5); return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid' }).format(d); };
  function diaDe(n) {
    if (/\bpasado manana\b/.test(n)) return { iso: hoyISO(2) };
    if (/\bmanana\b/.test(n)) return { iso: hoyISO(1) };
    if (/\bhoy\b|\bahora\b|\besta noche\b|\besta tarde\b/.test(n)) return { iso: hoyISO(0) };
    for (var i = 0; i < DIAS_ALIAS.length; i++) if (new RegExp('\\b' + DIAS_ALIAS[i][0] + '\\b').test(n)) return { dia: DIAS_ALIAS[i][1] };
    return null;
  }
  function ciudadDe(n) { for (var i = 0; i < D.capitales.length; i++) if (n.indexOf(norm(D.capitales[i][1])) >= 0) return D.capitales[i][0]; return null; }
  function preferida() { try { return localStorage.getItem('oc-city') || null; } catch (e) { return null; } }
  var nombreCiudad = function (s) { for (var i = 0; i < D.capitales.length; i++) if (D.capitales[i][0] === s) return D.capitales[i][1]; return s; };
  // índice de palabras distintivas por hermandad (nombre, alias del identificador, titulares y sede)
  var IDX = null;
  function indexar() {
    IDX = D.hermandades.map(function (h) {
      var fuerte = norm(h.n + ' ' + h.s.replace(/-/g, ' ')).split(' '), suave = norm(h.t.map(function (t) { return t[0]; }).join(' ') + ' ' + h.se).split(' ');
      return { h: h, f: fuerte.filter(function (t) { return t.length > 2 && !esStop(t) && t !== h.c; }), s: suave.filter(function (t) { return t.length > 3 && !esStop(t); }) };
    });
  }
  function buscarHermandad(n, ciudad) {
    var toks = n.split(' ').filter(function (t) { return t.length > 2 && !esStop(t); });
    if (!toks.length) return [];
    var res = IDX.map(function (x) {
      var s = 0; toks.forEach(function (t) { if (x.f.indexOf(t) >= 0) s += 3; else if (x.s.indexOf(t) >= 0) s += 1.5; });
      if (ciudad && x.h.c === ciudad) s += 1.2; else if (ciudad) s -= 4;
      if (n.indexOf(norm(x.h.n)) >= 0) s += 4;
      return [x.h, s];
    }).filter(function (r) { return r[1] >= 3; }).sort(function (a, b) { return b[1] - a[1]; });
    return res;
  }

  // ---------- respuestas ----------
  function respHermandad(h, n) {
    var c = nombreCiudad(h.c);
    var linea = h.n + ' (' + c + ') sale ' + art(h.d) + (h.h ? ' a las ' + h.h : '') + (h.se ? ', desde ' + h.se : '') + '.';
    var partes = [texto(linea)];
    if (/banda|musica|marcha|acompan/.test(n) && h.b.length) partes.push(texto('Le pone música: ' + h.b.map(function (b) { return b[1]; }).join(', ') + '.'));
    else if (/imaginer|talla|tallo|autor|escult|quien hizo/.test(n)) partes.push(texto(h.t.map(function (t) { return t[0] + (t[1] ? ': ' + t[1] : ': autor sin documentar'); }).join(' · ')));
    else if (h.t.length) partes.push(texto('Titulares: ' + h.t.map(function (t) { return t[0]; }).join(' y ') + '.'));
    var acc = [['Ver la hermandad', BASE + 'hermandad/' + h.s + '/']];
    if (D.mapa.indexOf(h.c) >= 0) acc.push(['Dónde va (mapa)', BASE + 'en-la-calle/' + h.c + '/']);
    if (h.w) acc.push(['Su web', h.w]);
    partes.push(acciones(acc));
    ultima = h;
    return frag.apply(null, partes);
  }
  function respDia(dia, ciudad) {
    var lista = D.hermandades.filter(function (h) { return h.d === dia && (!ciudad || h.c === ciudad); }).sort(function (a, b) { return (a.c > b.c ? 1 : a.c < b.c ? -1 : 0) || (a.o || 0) - (b.o || 0); });
    if (!lista.length) return frag((ciudad ? 'En ' + nombreCiudad(ciudad) : 'Ese día') + ' no sale nadie ' + art(dia) + ', que yo sepa.');
    var ul = document.createElement('ul'); ul.className = 'oc-cunao-lista';
    lista.slice(0, 40).forEach(function (h) { var li = document.createElement('li'); li.appendChild(enlace(h.n, BASE + 'hermandad/' + h.s + '/')); var s = document.createElement('span'); s.textContent = (ciudad ? '' : nombreCiudad(h.c) + ' · ') + (h.h ? h.h : 'hora por confirmar'); li.appendChild(s); ul.appendChild(li); });
    var cab = art(dia).replace(/^./, function (x) { return x.toUpperCase(); }) + (ciudad ? ' en ' + nombreCiudad(ciudad) : '') + ' salen ' + lista.length + (lista.length === 1 ? ' cofradía' : ' cofradías') + ':';
    var acc = ciudad && D.mapa.indexOf(ciudad) >= 0 ? acciones([['Verlas en el mapa', BASE + 'en-la-calle/' + ciudad + '/']]) : null;
    return frag(cab, ul, acc);
  }
  function respSugerencia() {
    modo = 'sugerencia';
    return frag('Venga, cuéntamelo con detalle: qué está mal o qué falta, y de qué hermandad o página. Lo leemos todo y cada semana se debate.', fichas(['Un dato está mal', 'Falta información', 'Tengo una idea']));
  }
  function enviarSugerencia(t) {
    modo = null;
    var datos = { texto: t, pagina: location.pathname, hermandad: ultima ? ultima.s : '' };
    var b = burbuja('cunao', 'Apuntado, cuñao…');
    fetch(BASE + 'api/sugerencias', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(datos) })
      .then(function (r) { if (!r.ok) throw 0; b.firstChild.textContent = 'Recibido. Gracias: el lunes se repasan todas las sugerencias de la semana.'; })
      .catch(function () {
        // sin servidor de sugerencias (alojamiento estático): se ofrece abrir el aviso en GitHub ya rellenado
        b.textContent = '';
        b.appendChild(frag('No he podido guardarla desde aquí. Puedes enviarla en un momento:', acciones([['Enviar la sugerencia', 'https://github.com/ssanchezz-07/ocho-capitales/issues/new?labels=sugerencia&title=' + encodeURIComponent('Sugerencia: ' + t.slice(0, 60)) + '&body=' + encodeURIComponent(t + '\n\nPágina: ' + location.href)]])));
      });
  }
  function responder(raw) {
    var n = norm(raw);
    if (modo === 'sugerencia' && n.length > 3 && !/^(un dato esta mal|falta informacion|tengo una idea)$/.test(n)) return enviarSugerencia(raw);
    if (/^(hola|buenas|que pasa|ey|hey|saludos)\b/.test(n) && n.split(' ').length < 4) return burbuja('cunao', frag(azar(HOLA), fichas(['¿Qué sale hoy?', '¿A qué hora sale la Macarena?', 'Bandas de la Esperanza de Triana'])));
    if (/\b(gracias|grasias|muchas gracias|genial|perfecto|vale)\b/.test(n) && n.split(' ').length < 5) return burbuja('cunao', azar(GRACIAS));
    if (/quien eres|que eres|como te llamas/.test(n)) return burbuja('cunao', 'Soy erCuñao: el que sabe dónde va cada cofradía, a qué hora sale y por dónde se ve mejor. Pregunta sin miedo.');
    if (/\b(error|mal|falta|equivoc|sugerencia|sugerir|idea|corregir|actualiz)\b/.test(n)) return burbuja('cunao', respSugerencia());
    if (modo === 'sugerencia') return burbuja('cunao', 'Cuéntamelo con un poco más de detalle, anda.');
    var ciudad = ciudadDe(n), dia = diaDe(n);
    var hs = buscarHermandad(n, ciudad);
    if (hs.length && (!dia || hs[0][1] >= 6)) {
      if (hs.length > 1 && hs[1][1] >= hs[0][1] - 0.5 && hs[0][0].n !== hs[1][0].n) {
        var b = document.createElement('div'); b.className = 'oc-cunao-chips';
        hs.slice(0, 5).forEach(function (r) { var x = document.createElement('button'); x.type = 'button'; x.textContent = r[0].n + ' (' + nombreCiudad(r[0].c) + ')'; x.addEventListener('click', function () { burbuja('cunao', respHermandad(r[0], n)); }); b.appendChild(x); });
        return burbuja('cunao', frag('Hay varias con ese nombre, cuñao. ¿Cuál?', b));
      }
      return burbuja('cunao', respHermandad(hs[0][0], n));
    }
    if (/\b(banda|bandas|musica|imaginer|talla|autor)\b/.test(n) && ultima) return burbuja('cunao', respHermandad(ultima, n));
    if (dia) {
      var d = dia.dia;
      if (!d) { for (var k in D.fechas) if (D.fechas[k] === dia.iso) d = k; }
      if (!d) {
        var falta = Math.round((new Date(D.fechas['Domingo de Ramos']) - new Date(dia.iso)) / 864e5);
        return burbuja('cunao', frag(falta > 0 ? 'Ese día no sale nadie, cuñao: faltan ' + falta + ' días para el Domingo de Ramos. Te digo qué sale ese día:' : 'Ese día no hay procesiones de Semana Santa. Te digo qué sale el Domingo de Ramos:', respDia('Domingo de Ramos', ciudad || preferida())));
      }
      ciudad = ciudad || preferida();
      if (!ciudad) return burbuja('cunao', frag('¿De qué capital? Que en las ocho sale mucha gente ' + art(d) + '.', fichas(D.capitales.map(function (c) { return d + ' en ' + c[1]; }))));
      return burbuja('cunao', respDia(d, ciudad));
    }
    if (ciudad) return burbuja('cunao', frag('¿Qué quieres saber de ' + nombreCiudad(ciudad) + '?', fichas(['¿Qué sale hoy en ' + nombreCiudad(ciudad) + '?', 'Domingo de Ramos en ' + nombreCiudad(ciudad), 'Madrugá en ' + nombreCiudad(ciudad)])));
    return burbuja('cunao', frag(azar(NOSE), acciones([['Buscarlo en el portal', BASE + 'buscar/?q=' + encodeURIComponent(raw)]])));
  }
  function preguntar(t) {
    if (!t || !t.trim()) return;
    burbuja('yo', t.trim());
    var go = function () { responder(t); };
    if (D) setTimeout(go, calm ? 0 : 280); else cargar().then(function () { setTimeout(go, 200); });
  }
  function cargar() {
    return fetch(hoja.getAttribute('data-datos')).then(function (r) { return r.json(); }).then(function (j) { D = j; indexar(); });
  }

  // ---------- abrir y cerrar (hoja inferior, nace del botón) ----------
  function abrir() {
    ultimoFoco = document.activeElement;
    hoja.hidden = false; btn.setAttribute('aria-expanded', 'true');
    requestAnimationFrame(function () { hoja.classList.add('is-open'); });
    document.body.style.overflow = 'hidden';
    if (!chat.childNodes.length) { burbuja('cunao', frag(azar(HOLA), fichas(['¿Qué sale hoy?', '¿A qué hora sale la Macarena?', 'Jueves Santo en Málaga', 'Quiero avisar de un error']))); }
    if (!D) cargar();
    setTimeout(function () { q.focus(); }, calm ? 0 : 280);
  }
  function cerrar() { hoja.classList.remove('is-open'); btn.setAttribute('aria-expanded', 'false'); document.body.style.overflow = ''; setTimeout(function () { hoja.hidden = true; }, calm ? 0 : 200); if (ultimoFoco && ultimoFoco.focus) ultimoFoco.focus(); }
  btn.addEventListener('click', abrir);
  hoja.querySelector('[data-cunao-cerrar]').addEventListener('click', cerrar);
  hoja.addEventListener('click', function (e) { if (e.target === hoja) cerrar(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !hoja.hidden) cerrar(); });
  form.addEventListener('submit', function (e) { e.preventDefault(); var t = q.value; q.value = ''; preguntar(t); });
  // el bocadillo del botón se presenta una vez por sesión y se retira solo
  try { if (!sessionStorage.getItem('oc-cunao')) { btn.classList.add('is-saludo'); sessionStorage.setItem('oc-cunao', '1'); setTimeout(function () { btn.classList.remove('is-saludo'); }, 5200); } } catch (e) { }
})();
