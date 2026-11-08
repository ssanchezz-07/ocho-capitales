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
    btn.classList.toggle('is-oculto', d > 0 && y > 120 && hoja.hidden);
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

  function burbuja(quien, nodo) {
    const b = document.createElement('div'); b.className = 'oc-cunao-msg is-' + quien;
    if (typeof nodo === 'string') { const p = document.createElement('p'); p.textContent = nodo; b.appendChild(p); } else b.appendChild(nodo);
    chat.appendChild(b); chat.scrollTop = chat.scrollHeight;
    if (!calm) b.animate([{ opacity: 0, transform: 'translateY(8px) scale(.98)' }, { opacity: 1, transform: 'none' }], { duration: 260, easing: 'cubic-bezier(.23,1,.32,1)' });
    return b;
  }
  function el(tag, cls, txt) { const x = document.createElement(tag); if (cls) x.className = cls; if (txt != null) x.textContent = txt; return x; }
  function enlace(t, href, cls) { const a = el('a', cls, t); a.href = href; if (/^https?:/.test(href) && href.indexOf(location.host) < 0) { a.target = '_blank'; a.rel = 'noopener'; } return a; }
  function chips(l) {
    const d = el('div', 'oc-cunao-chips'); d.setAttribute('role', 'group'); d.setAttribute('aria-label', 'Sugerencias');
    l.forEach((x) => { const b = el('button', null, x[0]); b.type = 'button'; b.addEventListener('click', () => { d.querySelectorAll('button').forEach((y) => { y.disabled = true; }); preguntar(x[1], x[0]); }); d.appendChild(b); });
    return d;
  }
  function pintar(r) {
    const f = document.createElement('div');
    r.partes.forEach((p) => {
      if (p.t === 'p') f.appendChild(el('p', null, p.x));
      else if (p.t === 'lista') {
        const ul = el('ul', 'oc-cunao-lista');
        p.items.forEach((i) => { const li = el('li'); li.appendChild(i.href ? enlace(i.x, i.href) : el('b', null, i.x)); if (i.sub) li.appendChild(el('span', null, i.sub)); ul.appendChild(li); });
        f.appendChild(ul);
      } else if (p.t === 'acc') { const d = el('div', 'oc-cunao-acc'); p.l.forEach((x) => d.appendChild(enlace(x[0], x[1], 'oc-cunao-link'))); f.appendChild(d); }
    });
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
  function cargar() {
    if (motor) return Promise.resolve();
    if (!cargando) cargando = Promise.all([motorListo(), fetch(url).then((r) => { if (!r.ok) throw 0; return r.json(); })]).then(([M, j]) => { motor = M.crearMotor(j, { base: BASE, preferida, pagina: () => paginaCiudad(j), paginaHerm: () => { const m = /\/hermandad\/([^/]+)\//.exec(location.pathname); return m ? m[1] : null; } }); }).catch((e) => { cargando = null; throw e; });
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
  function pensando() { const b = burbuja('cunao', '…'); b.classList.add('is-pensando'); b.setAttribute('aria-hidden', 'true'); return b; }
  function preguntar(valor, etiqueta) {
    if (!valor || !String(valor).trim()) return;
    burbuja('yo', (etiqueta || valor).trim());
    const p = pensando();
    const fin = (nodo) => { p.remove(); if (nodo) burbuja('cunao', nodo); if (!tactil) q.focus(); };
    const vuelta = (n) => {
      let r = motor.responder(valor);
      if (r.necesita && n < 4) return Promise.all(r.necesita.map(datosCiudad)).then(() => vuelta(n + 1));
      if (r.necesita) return fin('No he podido traer esos datos. ¿Tienes conexión?');
      if (r.accion && r.accion.tipo === 'sugerencia') { fin(null); return enviarSugerencia(r.accion); }
      setTimeout(() => fin(pintar(r)), calm ? 0 : 240);
    };
    cargar().then(() => vuelta(0)).catch(() => fin('Ahora mismo no me llegan los datos, cuñao. Prueba en un momento.'));
  }

  // ---------- abrir y cerrar (hoja inferior, nace del botón) ----------
  function abrir() {
    ultimoFoco = document.activeElement;
    hoja.hidden = false; btn.setAttribute('aria-expanded', 'true');
    requestAnimationFrame(() => hoja.classList.add('is-open'));
    document.body.style.overflow = 'hidden';
    cargar().catch(() => {});
    if (!chat.childNodes.length) {
      const f = document.createElement('div');
      f.appendChild(el('p', null, '¿Qué pasa, cuñao? Pregúntame qué sale, a qué hora, por dónde pasa, quién talló una imagen o qué banda lleva. Si no lo sé, te lo digo.'));
      f.appendChild(chips(['¿Qué sale hoy?', '¿A qué hora sale la Macarena de Sevilla?', hoja.hasAttribute('data-juegos') ? '¿Echamos una partida?' : 'Jueves Santo en Málaga', 'Quiero avisar de un error'].map((x) => [x, x])));
      burbuja('cunao', f);
    }
    setTimeout(() => q.focus(), calm ? 0 : 280);
  }
  function cerrar() {
    hoja.classList.remove('is-open'); btn.setAttribute('aria-expanded', 'false'); document.body.style.overflow = '';
    setTimeout(() => { hoja.hidden = true; }, calm ? 0 : 200);
    (ultimoFoco && ultimoFoco.focus ? ultimoFoco : btn).focus();
  }
  btn.addEventListener('click', abrir);
  hoja.querySelector('[data-cunao-cerrar]').addEventListener('click', cerrar);
  hoja.addEventListener('click', (e) => { if (e.target === hoja) cerrar(); });
  hoja.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { e.stopPropagation(); cerrar(); return; }
    if (e.key !== 'Tab') return;
    // el foco no se escapa del diálogo mientras está abierto
    const f = [...hoja.querySelectorAll('a[href], button:not([disabled]), input')].filter((x) => x.offsetParent !== null);
    if (!f.length) return;
    if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
  });
  form.addEventListener('submit', (e) => { e.preventDefault(); const t = q.value; q.value = ''; preguntar(t); });
  // En el plano «En la calle» el botón se aparta: sube lo justo para no tapar el crédito de OpenStreetMap (obligatorio por la
  // licencia) ni los controles del plano; si no hay hueco, se esconde hasta que lo haya. Usa «translate», que no pisa sus transform.
  const plano = document.querySelector('.oc-calle-mapa');
  if (plano) {
    let pend = false, sube = 0;
    if (!calm) btn.style.transition = 'transform 160ms cubic-bezier(.23,1,.32,1), translate 160ms cubic-bezier(.23,1,.32,1), opacity 160ms';
    const choca = (a, b) => a.left < b.right + 4 && a.right > b.left - 4 && a.top < b.bottom + 4 && a.bottom > b.top - 4;
    const aparta = () => {
      pend = false;
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
  }
  // el bocadillo del botón se presenta una vez por sesión y se retira solo
  try { if (!sessionStorage.getItem('oc-cunao')) { btn.classList.add('is-saludo'); sessionStorage.setItem('oc-cunao', '1'); setTimeout(() => btn.classList.remove('is-saludo'), 5200); } } catch (e) { }
  // en cuanto se baja o se toca la página, el bocadillo se retira: no tapa el texto de la primera pantalla
  const retira = () => { btn.classList.remove('is-saludo'); removeEventListener('scroll', alBajar); };
  const alBajar = () => { if (scrollY > 40) retira(); };
  addEventListener('scroll', alBajar, { passive: true }); addEventListener('pointerdown', (e) => { if (!btn.contains(e.target)) retira(); }, { once: true, passive: true });
})();
