/* Ocho Capitales · erCuñao: la interfaz (botón, hoja y chat). Va en todas las páginas y pesa poco.
   El motor (assets/cunao.js, con todo el entendimiento) y sus datos se piden solo cuando hace falta: al acercar el dedo
   o el ratón al botón, o al abrir la hoja. Así el bot no frena ninguna página. */
(function () {
  'use strict';
  // ================= interfaz =================
  const btn = document.querySelector('[data-cunao]'), hoja = document.querySelector('[data-cunao-hoja]');
  if (!btn || !hoja) return;
  const BASE = window.OC_BASE || '/';
  const chat = hoja.querySelector('[data-cunao-chat]'), form = hoja.querySelector('[data-cunao-form]'), q = hoja.querySelector('[data-cunao-q]');
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches, tactil = matchMedia('(pointer: coarse)').matches;
  let motor = null, cargando = null, ultimoFoco = null;
  // El botón se esconde al bajar y vuelve al subir, para no tapar el texto.
  let ultimoY = window.scrollY;
  addEventListener('scroll', () => {
    const y = window.scrollY, d = y - ultimoY;
    if (Math.abs(d) < 8) return;
    btn.classList.toggle('is-oculto', d > 0 && y > 120 && hoja.hidden && !btn.classList.contains('is-control')); // como control del plano, va con el plano
    ultimoY = y;
  }, { passive: true });
  const url = hoja.getAttribute('data-datos');
  chat.setAttribute('role', 'log'); chat.setAttribute('aria-live', 'polite'); chat.setAttribute('aria-relevant', 'additions'); chat.setAttribute('tabindex', '-1');
  const preferida = () => { try { return localStorage.getItem('oc-city') || null; } catch (e) { return null; } };
  // la capital de la página que se está viendo (su Semana Santa, su plano o una de sus hermandades) desempata antes que la preferida
  function paginaCiudad(j) {
    const p = location.pathname.slice(BASE.length - 1), caps = (j.capitales || []).map((c) => c[0]);
    const m = /^\/(?:semana-santa|en-la-calle)\/([a-z]+)\//.exec(p); if (m && caps.indexOf(m[1]) >= 0) return m[1];
    const h = /^\/hermandad\/([^/]+)\//.exec(p); if (h) { const c = caps.find((x) => h[1].endsWith('-' + x)); if (c) return c; }
    return null;
  }

  function infoPagina() {
    const p = location.pathname.slice(BASE.length - 1); let m;
    if ((m = /^\/hermandad\/([^/]+)\//.exec(p))) return { tipo: 'herm', slug: m[1] };
    if ((m = /^\/en-la-calle\/([a-z]+)\//.exec(p))) return { tipo: 'calle', c: m[1] };
    if ((m = /^\/semana-santa\/([a-z]+)\//.exec(p))) return { tipo: 'capital', c: m[1] };
    if (/^\/noticias\//.test(p)) return { tipo: 'noticias', c: new URLSearchParams(location.search).get('ciudad') || '' };
    if ((m = /^\/banda\/([^/]+)\//.exec(p))) return { tipo: 'banda', slug: m[1] };
    if ((m = /^\/marcha\/([^/]+)\//.exec(p))) { const h1 = document.querySelector('main h1') || document.querySelector('h1'); return { tipo: 'marcha', slug: m[1], titulo: h1 ? h1.textContent.trim() : '' }; }
    return {};
  }
  // ---------- erCuñao con gestos: se baja las gafas cuando lo sabe y se rasca la cabeza cuando no (una vez, sin bucles) ----------
  const cabeza = hoja.querySelector('.oc-cunao-head');
  function gesto(k) { if (!cabeza) return; cabeza.classList.remove('is-sabe', 'is-duda'); if (k) { void cabeza.offsetWidth; cabeza.classList.add('is-' + k); } }
  let porUsuario = false;
  function burbuja(quien, nodo) {
    porUsuario = false;
    const b = document.createElement('div'); b.className = 'oc-cunao-msg is-' + quien;
    if (typeof nodo === 'string') { const p = document.createElement('p'); p.textContent = nodo; b.appendChild(p); } else b.appendChild(nodo);
    chat.appendChild(b);
    // la respuesta se ve desde su principio; la pregunta, al final
    if (quien === 'cunao' && !b.classList.contains('is-pensando') && b.offsetHeight > chat.clientHeight * .7) { const prev = b.previousElementSibling; chat.scrollTo({ top: (prev || b).getBoundingClientRect().top - chat.getBoundingClientRect().top + chat.scrollTop - 8, behavior: calm ? 'auto' : 'smooth' }); } else chat.scrollTo({ top: chat.scrollHeight, behavior: calm ? 'auto' : 'smooth' });
    if (!calm) b.animate([{ opacity: 0, transform: 'translateY(8px) scale(.98)' }, { opacity: 1, transform: 'none' }], { duration: 260, easing: 'cubic-bezier(.23,1,.32,1)' });
    return b;
  }
  function el(tag, cls, txt) { const x = document.createElement(tag); if (cls) x.className = cls; if (txt != null) x.textContent = txt; return x; }
  function enlace(t, href, cls) { const a = el('a', cls, t); a.href = href; if (/^https?:/.test(href) && href.indexOf(location.host) < 0) { a.target = '_blank'; a.rel = 'noopener'; } return a; }
  function chips(l) {
    const d = el('div', 'oc-cunao-chips'); d.setAttribute('role', 'group'); d.setAttribute('aria-label', 'Sugerencias');
    l.forEach((x) => { const b = el('button', /partida|jugar|juego/i.test(x[0]) ? 'is-juego' : null, x[0]); b.type = 'button'; b.addEventListener('click', () => { d.querySelectorAll('button').forEach((y) => { y.disabled = true; }); preguntar(x[1], x[0]); }); d.appendChild(b); });
    return d;
  }
  const anios = (t) => String(t).replace(/\b(\d{4})-(\d{2,4})\b/g, '$1\u2011$2');
  // la miniatura, la línea de tiempo y «Compartir» van en assets/cunao-pinta.js, que se pide con el motor (data-pinta)
  let PINTA = null;
  function pintar(r, preg) {
    const f = document.createElement('div');
    if (r.foto) {
      const t = enlace('', r.foto.href, 'oc-cunao-tarjeta'); t.textContent = '';
      const im = el('img'); im.src = r.foto.src; im.alt = ''; im.width = 52; im.height = 52; im.loading = 'lazy'; im.decoding = 'async'; if (r.foto.dip) { im.className = 'is-dip'; im.width = 78; } if (r.foto.foco) im.style.objectPosition = r.foto.foco;
      im.addEventListener('error', () => im.remove());
      const d = el('div'); d.appendChild(el('b', null, r.foto.nombre)); d.appendChild(el('small', null, r.foto.sub + ' · ver su ficha'));
      t.append(im, d); f.appendChild(t);
    }
    r.partes.forEach((p) => {
      if (p.t === 'p') f.appendChild(el('p', null, anios(p.x)));
      else if (p.t === 'lista') {
        const ul = el('ul', 'oc-cunao-lista');
        p.items.forEach((i) => { const li = el('li'); li.appendChild(i.href ? enlace(i.x, i.href) : el('b', null, i.x)); if (i.sub) { const corto = /^(≈ )?\d{1,2}:\d{2}$|^\d{4}$/.test(i.sub.trim()); li.appendChild(el('span', corto ? 'is-hora' : null, anios(i.sub))); if (!corto && i.sub.length > 18) li.classList.add('is-largo'); } ul.appendChild(li); });
        f.appendChild(ul);
      } else if (p.t === 'tl') { if (PINTA) f.appendChild(PINTA.lineaTiempo(p)); if (p.nota) f.appendChild(el('p', 'oc-cunao-nota', p.nota)); }
      else if (p.t === 'acc') { if (PINTA && r.mapa && !f.querySelector('.oc-cunao-mini')) f.appendChild(PINTA.miniMapa(r.mapa)); const d = el('div', 'oc-cunao-acc'); p.l.forEach((x) => d.appendChild(enlace(x[0], x[1], 'oc-cunao-link'))); f.appendChild(d); }
    });
    if (PINTA && r.mapa && !f.querySelector('.oc-cunao-mini')) f.appendChild(PINTA.miniMapa(r.mapa));
    // se puede compartir lo que sabe (no las dudas ni los «no lo sé»)
    if (PINTA && preg && !r.flojo && !r.nose && r.partes.some((p) => p.t === 'p')) { let d = f.querySelector('.oc-cunao-acc'); if (!d) { d = el('div', 'oc-cunao-acc'); f.appendChild(d); } d.appendChild(PINTA.botonCompartir(r, preg)); }
    if (r.chips.length) f.appendChild(chips(r.chips));
    return f;
  }
  function enviarSugerencia(a) {
    // todo lo que se sugiere llega al correo del portal: se abre el formulario de Colabora con el texto ya puesto
    const b = burbuja('cunao', '');
    const f = document.createElement('div'); f.appendChild(el('p', null, 'Apuntado, cuñao. Envíala desde aquí y la revisamos con su fuente:'));
    const q = new URLSearchParams({ texto: a.texto, pagina: location.pathname }); if (a.hermandad) q.set('nombre', a.hermandad);
    const d = el('div', 'oc-cunao-acc'); d.appendChild(enlace('Enviar la sugerencia', BASE + 'colabora/?' + q, 'oc-cunao-link')); f.appendChild(d);
    b.textContent = ''; b.appendChild(f);
  }
  // el motor (assets/cunao.js) se pide una sola vez, con su huella de versión (data-motor)
  let pideMotor = null;
  function motorListo() {
    if (window.OC_CUNAO_MOTOR) return Promise.resolve(window.OC_CUNAO_MOTOR);
    if (!pideMotor) pideMotor = new Promise((ok, mal) => {
      const s = document.createElement('script'); s.src = hoja.getAttribute('data-motor'); s.async = true;
      s.onload = () => (window.OC_CUNAO_MOTOR ? ok(window.OC_CUNAO_MOTOR) : mal(0)); s.onerror = () => { pideMotor = null; s.remove(); mal(0); };
      document.head.appendChild(s);
    });
    return pideMotor;
  }
  let pidePinta = null;
  function pintaLista() {
    if (PINTA) return Promise.resolve(PINTA);
    const src = hoja.getAttribute('data-pinta'); if (!src) return Promise.resolve(null);
    if (!pidePinta) pidePinta = new Promise((ok) => {
      const s = document.createElement('script'); s.src = src; s.async = true;
      // si la fábrica falla, se avisa en la consola (la prueba de humo lo ve) y se reintenta en la pregunta siguiente
      s.onload = () => { try { PINTA = window.OC_CUNAO_PINTA({ el, hoja, url, BASE }); } catch (e) { PINTA = null; console.error('erCuñao: cunao-pinta.js', e); } if (!PINTA) { pidePinta = null; s.remove(); } ok(PINTA); };
      s.onerror = () => { pidePinta = null; s.remove(); ok(null); };
      document.head.appendChild(s);
    });
    return pidePinta;
  }
  function cargar() {
    if (motor) { if (!PINTA) pintaLista(); return Promise.resolve(); }
    if (!cargando) cargando = Promise.all([motorListo(), fetch(url).then((r) => { if (!r.ok) throw 0; return r.json(); }), Promise.race([pintaLista(), new Promise((ok) => setTimeout(ok, 1500))])]).then(([M, j]) => { motor = M.crearMotor(j, { base: BASE, preferida, pagina: () => paginaCiudad(j), paginaHerm: () => { const m = /\/hermandad\/([^/]+)\//.exec(location.pathname); return m ? m[1] : null; } }); }).catch((e) => { cargando = null; throw e; });
    return cargando;
  }
  // en cuanto el dedo o el ratón se acercan al botón, se adelanta la carga: al abrir ya está
  const adelanta = () => { cargar().catch(() => { }); };
  btn.addEventListener('pointerenter', adelanta, { once: true, passive: true });
  btn.addEventListener('touchstart', adelanta, { once: true, passive: true });
  btn.addEventListener('focus', adelanta, { once: true });
  // trozos a demanda: una capital (cunao/sevilla.json) o una parte del catálogo de marchas (cunao/m/a.json)
  const pedidos = {};
  const version = (url.match(/\?.*$/) || [''])[0];
  const datosCiudad = (c) => pedidos[c] || (pedidos[c] = fetch(url.replace(/cunao\.json.*$/, 'cunao/' + c + '.json' + version)).then((r) => { if (!r.ok) throw 0; return r.json(); }).then((j) => motor.cargarDatos(c, j)).catch((e) => { delete pedidos[c]; throw e; }));
  function pensando() { const d = document.createElement('div'); d.className = 'oc-cunao-msg is-cunao is-pensando'; d.setAttribute('aria-hidden', 'true'); d.append(el('i'), el('i'), el('i')); chat.appendChild(d); chat.scrollTo({ top: chat.scrollHeight, behavior: calm ? 'auto' : 'smooth' }); return d; }
  function preguntar(valor, etiqueta) {
    if (!valor || !String(valor).trim()) return;
    burbuja('yo', (etiqueta || valor).trim());
    const p = pensando(); gesto('');
    const fin = (nodo) => { p.remove(); if (nodo) burbuja('cunao', nodo); if (!tactil) q.focus(); };
    const vuelta = (n) => {
      let r = motor.responder(valor);
      if (r.necesita && n < 4) return Promise.all(r.necesita.map(datosCiudad)).then(() => vuelta(n + 1));
      if (r.necesita) return fin('No he podido traer esos datos. ¿Tienes conexión?');
      if (r.accion && r.accion.tipo === 'sugerencia') { fin(null); return enviarSugerencia(r.accion); }
      setTimeout(() => { fin(pintar(r, (etiqueta || valor).trim())); gesto(r.flojo || r.nose ? 'duda' : r.foto || r.partes.some((x) => x.t === 'lista' || x.t === 'tl') ? 'sabe' : ''); }, calm ? 0 : 240);
    };
    cargar().then(() => vuelta(0)).catch(() => fin('Ahora mismo no me llegan los datos, cuñao. Prueba en un momento.'));
  }

  // ---------- abrir y cerrar (hoja inferior, nace del botón) ----------
  // Teclado del móvil: en el iPhone el teclado tapa la página en vez de encogerla. Mientras la hoja está abierta, se ajusta
  // al alto que queda a la vista (visualViewport), para que el campo de texto y la última respuesta no queden debajo del teclado.
  const vv = window.visualViewport;
  const ajusta = () => { if (!vv || hoja.hidden) return; const alFinal = chat.scrollHeight - chat.scrollTop - chat.clientHeight < 48; hoja.style.height = vv.height + 'px'; hoja.style.top = vv.offsetTop + 'px'; hoja.style.bottom = 'auto'; if (alFinal) chat.scrollTop = chat.scrollHeight; };
  const suelta_ = () => { hoja.style.height = ''; hoja.style.top = ''; hoja.style.bottom = ''; };
  let lado = false, tCierre = 0, tLado = 0;
  const panelDlg = hoja.querySelector('[role="dialog"]') || hoja;
  const anchaMQ = matchMedia('(min-width: 1440px)'); // por debajo, el hueco de 452 px deja la página más estrecha que el menú
  // acoplado no es modal: la página sigue usable con teclado y lector de pantalla (auditoría del 10-nov); flotante, sí
  // Al apartarse la página (o volver), el texto cambia de alto: se guarda lo primero que se ve bajo la cabecera y, tras el cambio,
  // se corrige el scroll para que siga en el mismo sitio. El navegador no lo hace solo porque cambia el padding del body
  // (en la ficha, «Música» bajaba 274 px al abrir; auditoría de diseño del 10-nov).
  const ancla = () => {
    if (scrollY < 1) return null;
    const cab = document.querySelector('.oc-header'), y = cab ? cab.getBoundingClientRect().bottom + 4 : 0;
    const el_ = [...document.querySelectorAll('main h1, main h2, main h3, main p, main li, main img')].find((x) => x.getBoundingClientRect().bottom > y);
    return el_ ? { el: el_, top: el_.getBoundingClientRect().top } : null;
  };
  const sujeta = (a) => { if (!a || !a.el.isConnected) return; const d = a.el.getBoundingClientRect().top - a.top; if (Math.abs(d) > 1) scrollBy({ top: d, behavior: 'instant' }); };
  function ponLado(v) {
    const a = v !== document.documentElement.classList.contains('oc-cunao-lado') ? ancla() : null;
    lado = v; panelDlg.setAttribute('aria-modal', v ? 'false' : 'true');
    const de = document.documentElement; de.classList.toggle('oc-cunao-lado', v); document.body.style.overflow = v ? '' : 'hidden';
    if (v) de.style.setProperty('--oc-sb', Math.max(0, innerWidth - document.body.getBoundingClientRect().width) + 'px'); // barra de scroll (con scrollbar-gutter, clientWidth no la descuenta), para lo de borde a borde
    dispatchEvent(new Event('resize'));
    sujeta(a);
  }
  // si se estrecha o se ensancha la ventana con erCuñao abierto, cambia de modo
  const alCambiar = () => { if (!hoja.hidden && hoja.classList.contains('is-open') && anchaMQ.matches !== lado) ponLado(anchaMQ.matches); };
  if (anchaMQ.addEventListener) anchaMQ.addEventListener('change', alCambiar); else if (anchaMQ.addListener) anchaMQ.addListener(alCambiar);
  function abrir() {
    clearTimeout(tCierre); clearTimeout(tLado); // cerrar y reabrir enseguida: que no se cuele el final del cierre
    ultimoFoco = document.activeElement;
    hoja.hidden = false; btn.setAttribute('aria-expanded', 'true');
    if (vv) { vv.addEventListener('resize', ajusta); vv.addEventListener('scroll', ajusta); ajusta(); }
    requestAnimationFrame(() => hoja.classList.add('is-open'));
    // En pantallas anchas, erCuñao se acopla a la derecha y la página se aparta: no tapa el mapa, la foto de la ficha ni el plano
    // (barrido del 9-nov). Los planos se recolocan con el «resize». En las estrechas, hoja modal como siempre.
    ponLado(anchaMQ.matches);
    cargar().catch(() => {});
    if (!chat.childNodes.length) {
      const f = document.createElement('div');
      f.appendChild(el('p', null, '¿Qué pasa, cuñao? Pregúntame qué sale, a qué hora, por dónde pasa, quién talló una imagen o qué banda lleva. Si no lo sé, te lo digo.'));
      const sug = () => { const l = motor && motor.chipsPagina ? motor.chipsPagina(infoPagina()) : null; return chips((l && l.length ? l.slice(0, 4) : ['¿Qué sale hoy?', '¿A qué hora sale la Macarena de Sevilla?', hoja.hasAttribute('data-juegos') ? '¿Echamos una partida?' : 'Jueves Santo en Málaga'].map((x) => [x, x])).concat([['Quiero avisar de un error', 'Quiero avisar de un error']])); };
      let ch = sug(); f.appendChild(ch);
      burbuja('cunao', f);
      // si el motor aún no estaba, en cuanto llega se ponen las sugerencias de esta página (si no se ha tocado ninguna)
      if (!motor) cargar().then(() => { if (ch.isConnected && !ch.querySelector(':disabled')) { const n = sug(); ch.replaceWith(n); ch = n; } }).catch(() => { });
    }
    setTimeout(() => q.focus(), calm ? 0 : 280);
  }
  function cerrar() {
    hoja.classList.remove('is-open'); btn.setAttribute('aria-expanded', 'false'); document.body.style.overflow = '';
    if (lado) { lado = false; tLado = setTimeout(() => { const a = ancla(); document.documentElement.classList.remove('oc-cunao-lado'); dispatchEvent(new Event('resize')); sujeta(a); }, calm ? 0 : 200); }
    if (vv) { vv.removeEventListener('resize', ajusta); vv.removeEventListener('scroll', ajusta); } suelta_();
    tCierre = setTimeout(() => { hoja.hidden = true; }, calm ? 0 : 200);
    (ultimoFoco && ultimoFoco.focus ? ultimoFoco : btn).focus();
  }
  let compacta = false, yAnt = 0, acum = 0;
  ['wheel', 'touchmove', 'keydown', 'pointerdown'].forEach((ev) => chat.addEventListener(ev, () => { porUsuario = true; }, { passive: true }));
  chat.addEventListener('scroll', () => {
    const y = chat.scrollTop, dy = y - yAnt; yAnt = y;
    acum = (dy > 0) === (acum > 0) ? acum + dy : dy;
    let c = compacta;
    if (y <= 8) c = false;
    else if (porUsuario && !compacta && acum > 24 && y > 48 && chat.scrollHeight - chat.clientHeight > 180) c = true;
    else if (porUsuario && compacta && acum < -32) c = false;
    if (c !== compacta) { compacta = c; acum = 0; hoja.classList.toggle('is-compacta', c); }
  }, { passive: true });
  btn.addEventListener('click', abrir);
  hoja.querySelector('[data-cunao-cerrar]').addEventListener('click', cerrar);
  // un enlace del chat a esta misma página (p. ej. «El reto de hoy» estando ya en Juegos: solo cambia el #) cierra la hoja; si no,
  // el juego arrancaba debajo y en el móvil parecía que el botón no hacía nada (punto 8 del 9-nov)
  chat.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('a[href]'); if (!a || a.target === '_blank') return;
    try { const u = new URL(a.href, location.href); if (u.origin === location.origin && u.pathname === location.pathname && u.hash) cerrar(); } catch (er) { }
  });
  hoja.addEventListener('click', (e) => { if (e.target === hoja) cerrar(); });
  hoja.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { e.stopPropagation(); cerrar(); return; }
    if (e.key !== 'Tab' || lado) return;
    // el foco no se escapa del diálogo mientras está abierto (flotante; acoplado, la página sigue al alcance del teclado)
    const f = [...hoja.querySelectorAll('a[href], button:not([disabled]), input')].filter((x) => x.offsetParent !== null);
    if (!f.length) return;
    if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
  });
  // acoplado, Escape lo cierra aunque el foco esté en la página (si no está en un campo o en otro diálogo abierto)
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || !lado || e.defaultPrevented || hoja.contains(e.target)) return;
    if (e.target.closest && e.target.closest('input, textarea, select, [contenteditable], dialog[open], [role="dialog"]:not([hidden])')) return;
    cerrar();
  });
  form.addEventListener('submit', (e) => { e.preventDefault(); const t = q.value; q.value = ''; preguntar(t); });
  // En el plano «En la calle» el botón se aparta: sube lo justo para no tapar el crédito de OpenStreetMap (obligatorio por la
  // licencia) ni los controles del plano; si no hay hueco, se esconde hasta que lo haya. Usa «translate», que no pisa sus transform.
  const plano = document.querySelector('.oc-calle-mapa');
  if (plano) {
    let pend = false, sube = 0;
    if (!calm) btn.style.transition = 'transform 160ms cubic-bezier(.23,1,.32,1), translate 160ms cubic-bezier(.23,1,.32,1), opacity 160ms';
    const choca = (a, b) => a.left < b.right + 4 && a.right > b.left - 4 && a.top < b.bottom + 4 && a.bottom > b.top - 4;
    // Con el plano a la vista, erCuñao es un control más: en la columna de controles del plano (+, −, ubicación, pantalla
    // completa), justo debajo del último y del mismo tamaño. Así no tapa el plano, la leyenda, el crédito ni la barra de la hora.
    // Se ancla por posición al último control (si cambian de sitio, los sigue). Sin la columna a la vista, vuelve a su sitio de siempre.
    const columna = () => { const bs = [...plano.querySelectorAll('.oc-calle-btn')].filter((b) => b.offsetParent !== null); if (!bs.length) return null; const x = Math.max(...bs.map((b) => b.getBoundingClientRect().left)); return bs.filter((b) => Math.abs(b.getBoundingClientRect().left - x) < 2).sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top); };
    const enColumna = () => {
      const col = columna(); if (!col) return false;
      const u = col[col.length - 1].getBoundingClientRect(), mp = plano.getBoundingClientRect(), tam = Math.round(u.width), top = u.bottom + 8;
      const libreAbajo = (document.querySelector('.oc-tabbar') && getComputedStyle(document.querySelector('.oc-tabbar')).display !== 'none' ? document.querySelector('.oc-tabbar').getBoundingClientRect().top : innerHeight) - 8;
      // tiene que caber dentro del plano y de la pantalla, por encima de la barra de abajo y de la barra de la hora
      const rel = document.querySelector('.oc-calle-reloj'), rr = rel && rel.offsetParent !== null ? rel.getBoundingClientRect() : null;
      const barra = rr && rr.height && rr.left < u.right + 4 && rr.right > u.left - 4 ? rr : [...plano.querySelectorAll('[role="slider"], input[type="range"]')].map((x) => x.closest('div') || x).map((x) => x.getBoundingClientRect()).filter((r) => r.height)[0];
      const suelo = Math.min(libreAbajo, mp.bottom - 8, barra ? barra.top - 8 : Infinity);
      if (u.top < 0 || top + tam > suelo) return false;
      Object.assign(btn.style, { top: top + 'px', left: u.left + 'px', right: 'auto', bottom: 'auto', width: tam + 'px', height: tam + 'px', translate: '', opacity: '', pointerEvents: '' });
      btn.classList.add('is-control'); return true;
    };
    const suelta = () => { if (!btn.classList.contains('is-control')) return; btn.classList.remove('is-control'); ['top', 'left', 'right', 'bottom', 'width', 'height'].forEach((k) => { btn.style[k] = ''; }); };
    const aparta = () => {
      pend = false;
      if (enColumna()) return;
      suelta();
      const r0 = btn.getBoundingClientRect(), base = { left: r0.left, right: r0.right, top: r0.top + sube, bottom: r0.bottom + sube };
      const obs = [...document.querySelectorAll('.oc-calle-osm a, .oc-calle-osm')].concat([...plano.querySelectorAll('button, a[href], input, select, [role="slider"]')])
        .map((x) => x.getBoundingClientRect()).filter((q) => q.width && q.height && q.bottom > 0 && q.top < innerHeight);
      let s = 0;
      while (s <= 240 && obs.some((q) => choca({ left: base.left, right: base.right, top: base.top - s, bottom: base.bottom - s }, q))) s += 4;
      const hueco = s <= 240; sube = hueco ? s : 0;
      btn.style.translate = sube ? '0 ' + -sube + 'px' : '';
      btn.style.opacity = hueco ? '' : '0'; btn.style.pointerEvents = hueco ? '' : 'none';
    };
    const pide = () => { if (!pend) { pend = true; requestAnimationFrame(aparta); } };
    addEventListener('scroll', pide, { passive: true }); addEventListener('resize', pide); addEventListener('pointerup', pide, { passive: true });
    addEventListener('load', pide); pide();
    const ficha = document.querySelector('[data-ficha]'), reloj = document.querySelector('.oc-calle-reloj'), calle = document.querySelector('.oc-calle');
    if (window.MutationObserver) { const mo = new MutationObserver(pide); if (ficha) mo.observe(ficha, { attributes: true, attributeFilter: ['hidden', 'class'] }); if (calle) mo.observe(calle, { attributes: true, attributeFilter: ['class'] }); }
    if (reloj) reloj.addEventListener('transitionend', pide);
    if (ficha) ficha.addEventListener('transitionend', pide);
  }
  // el bocadillo del botón se presenta una vez por sesión y se retira solo
  try { if (!sessionStorage.getItem('oc-cunao')) { btn.classList.add('is-saludo'); sessionStorage.setItem('oc-cunao', '1'); setTimeout(() => btn.classList.remove('is-saludo'), 5200); } } catch (e) { }
  // en cuanto se baja o se toca la página, el bocadillo se retira: no tapa el texto de la primera pantalla
  const retira = () => { btn.classList.remove('is-saludo'); removeEventListener('scroll', alBajar); };
  const alBajar = () => { if (scrollY > 40) retira(); };
  addEventListener('scroll', alBajar, { passive: true }); addEventListener('pointerdown', (e) => { if (!btn.contains(e.target)) retira(); }, { once: true, passive: true });
})();
