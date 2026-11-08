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
  const NS = 'http://www.w3.org/2000/svg';
  const svgEl = (tag, at) => { const x = document.createElementNS(NS, tag); for (const k in at) x.setAttribute(k, at[k]); return x; };
  const rutasPedidas = {};
  const rutas = (c) => rutasPedidas[c] || (rutasPedidas[c] = fetch(url.replace(/cunao\.json.*$/, 'cunao/g/' + c + '.json' + version)).then((r) => { if (!r.ok) throw 0; return r.json(); }).catch((e) => { delete rutasPedidas[c]; throw e; }));
  // El recorrido en miniatura: la ida en oro, el regreso discontinuo y, de fondo, las calles principales y el río (como el plano).
  function miniMapa(m) {
    const fig = el('figure', 'oc-cunao-mini'); fig.setAttribute('role', 'img'); fig.setAttribute('aria-label', m.et || 'Recorrido en miniatura');
    rutas(m.c).then((g) => {
      const h = g.h && g.h[m.s]; if (!h) { fig.remove(); return; }
      const xs = [], ys = []; [h.i || [], h.r || []].forEach((l) => { for (let i = 0; i + 1 < l.length; i += 2) { xs.push(l[i]); ys.push(l[i + 1]); } });
      let x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
      const W = Math.max(x1 - x0, 60), H_ = Math.max(y1 - y0, 60), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
      // caja 16:10 alrededor del recorrido, con margen
      let w = W * 1.18, hh = H_ * 1.18; if (w / hh < 1.6) w = hh * 1.6; else hh = w / 1.6;
      const pb = hh * .2; hh += pb; w = hh * 1.6;
      const box = [cx - w / 2, cy - (hh - pb) / 2, w, hh], dentro = (l) => { for (let i = 0; i + 1 < l.length; i += 2) if (l[i] >= box[0] && l[i] <= box[0] + w && l[i + 1] >= box[1] && l[i + 1] <= box[1] + hh) return true; return false; };
      const d = (l) => { let s = ''; for (let i = 0; i + 1 < l.length; i += 2) s += (i ? 'L' : 'M') + l[i] + ' ' + l[i + 1]; return s; };
      const svg = svgEl('svg', { viewBox: box.map((v) => Math.round(v)).join(' '), preserveAspectRatio: 'xMidYMid slice', 'aria-hidden': 'true', focusable: 'false' });
      const rio = (g.rio || []).filter(dentro).map(d).join(''); if (rio) svg.appendChild(svgEl('path', { d: rio, class: 'is-rio' }));
      const fondo = (g.f || []).filter(dentro).map(d).join(''); if (fondo) svg.appendChild(svgEl('path', { d: fondo, class: 'is-calle' }));
      if (h.r && h.r.length >= 4) svg.appendChild(svgEl('path', { d: d(h.r), class: 'is-regreso' }));
      if (h.i && h.i.length >= 4) { svg.appendChild(svgEl('path', { d: d(h.i), class: 'is-ida-borde' })); svg.appendChild(svgEl('path', { d: d(h.i), class: 'is-ida' })); }
      const s0 = (h.i && h.i.length >= 2 ? h.i : h.r); svg.appendChild(svgEl('circle', { cx: s0[0], cy: s0[1], r: Math.max(w, hh) / 48, class: 'is-salida' }));
      fig.appendChild(svg);
      const ley = el('figcaption', 'oc-cunao-mini-ley'); ley.append(el('span', 'is-ida', 'Ida')); if (h.r && h.r.length >= 4) ley.append(el('span', 'is-regreso', 'Regreso')); ley.append(el('span', 'is-salida', 'Salida'));
      fig.appendChild(ley); fig.classList.add('is-lista');
    }).catch(() => fig.remove());
    return fig;
  }
  // La salida en una línea de tiempo (salida, carrera oficial, Catedral, entrada), con la hora en Geist Mono
  function lineaTiempo(p) {
    const ol = el('ol', 'oc-cunao-tl'); ol.setAttribute('aria-label', 'La salida, hora a hora'); ol.style.setProperty('--n', p.l.length);
    p.l.forEach((x) => { const li = el('li'); li.append(el('span', 'oc-cunao-tl-h', (x.ex ? '' : '≈ ') + x.t), el('b', null, x.e)); if (x.l) li.appendChild(el('small', null, x.l)); ol.appendChild(li); });
    return ol;
  }
  // «Compartir»: una tarjeta con la marca (la estrella, «ochocapitales», la pregunta y la respuesta corta), hecha aquí mismo en
  // un canvas, y el enlace a la ficha. En el móvil, con el menú de compartir del sistema; si no lo hay, el enlace de WhatsApp.
  const abs = (h) => { try { return new URL(h, location.href).href; } catch (e) { return location.href; } };
  const recorta = (t, n) => (t.length > n ? t.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : t);
  function lineas(ctx, t, ancho, max) {
    const ws = String(t).split(/\s+/), out = []; let l = '';
    for (const w of ws) { const p = l ? l + ' ' + w : w; if (ctx.measureText(p).width > ancho && l) { out.push(l); l = w; } else l = p; if (out.length === max) break; }
    if (out.length < max && l) out.push(l);
    if (out.length === max && ws.join(' ').length > out.join(' ').length + 1) { let u = out[max - 1]; while (u && ctx.measureText(u + '…').width > ancho) u = u.replace(/\s*\S+$/, ''); out[max - 1] = u + '…'; }
    return out;
  }
  const imagen = (src) => new Promise((ok, mal) => { const i = new Image(); i.decoding = 'async'; i.onload = () => ok(i); i.onerror = mal; i.src = src; });
  async function tarjeta(preg, corta, foto, conCara) {
    try { await Promise.race([Promise.all(['700 64px Karantina', '400 40px Heebo', '600 40px Heebo', '500 30px "Geist Mono"'].map((f) => document.fonts.load(f))), new Promise((r) => setTimeout(r, 1200))]); } catch (e) { }
    const S = 1080, cv = document.createElement('canvas'); cv.width = S; cv.height = S; const x = cv.getContext('2d');
    const fondo = x.createLinearGradient(0, 0, 0, S); fondo.addColorStop(0, '#3a1857'); fondo.addColorStop(.45, '#2b1140'); fondo.addColorStop(1, '#1d0a2c'); x.fillStyle = fondo; x.fillRect(0, 0, S, S);
    const luz = x.createRadialGradient(S * .85, -60, 10, S * .85, -60, S * .8); luz.addColorStop(0, 'rgba(90,42,134,.85)'); luz.addColorStop(1, 'rgba(90,42,134,0)'); x.fillStyle = luz; x.fillRect(0, 0, S, S);
    // la estrella de ocho puntas y «ochocapitales»
    x.save(); x.translate(96, 96); x.strokeStyle = '#d6b263'; x.lineWidth = 4; x.strokeRect(-22, -22, 44, 44); x.rotate(Math.PI / 4); x.strokeRect(-22, -22, 44, 44); x.restore();
    x.fillStyle = '#d6b263'; x.beginPath(); x.arc(96, 96, 6, 0, 7); x.fill();
    x.fillStyle = '#f0d79c'; x.font = '500 30px "Geist Mono", ui-monospace, monospace'; x.textBaseline = 'middle'; x.fillText('O C H O C A P I T A L E S', 150, 98);
    // el galón
    x.fillStyle = '#f0d79c'; x.fillRect(0, 168, S, 2); x.fillStyle = '#c9a14a'; x.fillRect(0, 170, S, 4); for (let i = 0; i < S; i += 12) x.fillRect(i, 174, 4, 8);
    // la pregunta, en oro, y la respuesta, en blanco, con erCuñao al lado; el conjunto, centrado en el hueco
    x.font = '600 40px Heebo, system-ui, sans-serif'; const lq = lineas(x, preg, 760, 3), hq = 40 + lq.length * 52;
    x.font = '400 38px Heebo, system-ui, sans-serif'; let la = lineas(x, corta, 700, 9);
    let alto = 52 + la.length * 52 + (foto ? 152 : 0);
    if (230 + hq + 44 + alto > 900) { la = lineas(x, corta, 700, Math.max(2, Math.floor((900 - 230 - hq - 44 - 52 - (foto ? 152 : 0)) / 52))); alto = 52 + la.length * 52 + (foto ? 152 : 0); }
    const off = Math.max(0, Math.floor((930 - (230 + hq + 44 + alto)) / 2)), y0 = 230 + off;
    x.font = '600 40px Heebo, system-ui, sans-serif'; x.fillStyle = '#d9b867'; x.beginPath(); x.roundRect(1000 - 820, y0, 820, hq, [36, 36, 10, 36]); x.fill();
    x.fillStyle = '#1d0a2c'; x.textBaseline = 'top'; lq.forEach((l, i) => x.fillText(l, 1000 - 790, y0 + 22 + i * 52));
    const y = y0 + hq + 44, caraY = y;
    x.fillStyle = '#fff'; x.beginPath(); x.roundRect(220, y, 780, alto, [10, 36, 36, 36]); x.fill();
    let ty = y + 30;
    if (foto) {
      try { const im = await imagen(foto.src); const s = Math.min(im.width / 120, im.height / 120); x.save(); x.beginPath(); x.roundRect(250, ty, 120, 120, 18); x.clip(); x.drawImage(im, (im.width - 120 * s) / 2, (im.height - 120 * s) / 2, 120 * s, 120 * s, 250, ty, 120, 120); x.restore(); } catch (e) { }
      x.fillStyle = '#2b1140'; x.font = '700 40px Heebo, system-ui, sans-serif'; lineas(x, foto.nombre, 580, 2).forEach((l, i) => x.fillText(l, 394, ty + 14 + i * 46));
      x.fillStyle = '#654a80'; x.font = '400 28px Heebo, system-ui, sans-serif'; x.fillText(recorta(foto.sub, 40), 394, ty + 92);
      ty += 152;
    }
    x.fillStyle = '#2b1140'; x.font = '400 38px Heebo, system-ui, sans-serif'; la.forEach((l, i) => x.fillText(l, 250, ty + i * 52));
    if (conCara) { try { const svg = hoja.querySelector('.oc-cunao-head .oc-cunao-cara'); const cl = svg.cloneNode(true); cl.setAttribute('xmlns', NS); cl.setAttribute('width', '160'); cl.setAttribute('height', '160'); const g = cl.querySelector('.cu-gafas'); if (g) g.setAttribute('transform', 'translate(0 10)'); const mano = cl.querySelector('.cu-mano'); if (mano) mano.remove(); const im = await imagen('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(cl))); x.save(); x.beginPath(); x.arc(130, caraY + 56, 70, 0, 7); x.clip(); x.drawImage(im, 60, caraY - 14, 140, 140); x.restore(); x.strokeStyle = '#c9a14a'; x.lineWidth = 4; x.beginPath(); x.arc(130, caraY + 56, 70, 0, 7); x.stroke(); } catch (e) { } }
    // el pie: erCuñao y la web
    x.fillStyle = '#f0d79c'; x.textBaseline = 'alphabetic'; x.font = '400 64px Karantina, Impact, sans-serif'; x.fillText('Pregúntale a erCuñao', 80, 1000);
    x.fillStyle = '#dcc7f4'; x.font = '500 28px "Geist Mono", ui-monospace, monospace'; const dom = 'ochocapitales.com'; x.fillText(dom, 1000 - x.measureText(dom).width, 996);
    return new Promise((ok, mal) => { try { cv.toBlob((b) => (b ? ok(b) : mal(new Error('sin imagen'))), 'image/jpeg', .9); } catch (e) { mal(e); } });
  }
  function botonCompartir(r, preg) {
    const lis = (r.partes.find((p) => p.t === 'lista') || { items: [] }).items, p0 = ((r.partes.find((p) => p.t === 'p') || {}).x || '').replace(/^(Apunta, cuñao|Esa me la sé|Facilito): /, '').replace(/\s*\((itinerario|posición estimada)[^)]*\)/g, ''),
      // en la tarjeta, los lugares cortos y la hora tras un punto medio: «San Agustín · 09:50», «Catedral · 14:10»
      corto = (t) => String(t || '').split(';')[0].replace(/\s*\([^)]*\)/g, '').replace(/^estaci[oó]n de penitencia( en)? (la )?(s\.? ?i\.? ?c\.? ?b\.?|santa iglesia catedral|catedral)\b.*$/i, 'Catedral').trim(),
      c0 = /:$/.test(p0) && lis.length ? p0.replace(/:$/, ': ') + lis.slice(0, 4).map((i) => corto(i.x) + (i.sub ? (/^(≈ )?\d{1,2}:\d{2}/.test(i.sub) ? ' · ' + i.sub : ' (' + corto(i.sub) + ')') : '')).join(', ') + (lis.length > 4 ? '…' : '.') : p0, corta = recorta(c0.charAt(0).toUpperCase() + c0.slice(1), 260);
    const acc = r.partes.filter((p) => p.t === 'acc').map((p) => p.l).flat();
    const ficha = (r.foto && r.foto.href) || (acc.find((x) => x && /^\//.test(x[1]) && !/colabora|buscar/.test(x[1])) || [])[1] || BASE;
    const texto = '«' + recorta(preg, 120) + '»\nerCuñao: ' + corta + '\n', enlaceFicha = abs(ficha);
    const a = el('a', 'oc-cunao-link is-compartir'); a.href = 'https://wa.me/?text=' + encodeURIComponent(texto + enlaceFicha); a.target = '_blank'; a.rel = 'noopener';
    a.innerText = ''; const ic = svgEl('svg', { viewBox: '0 0 24 24', 'aria-hidden': 'true', focusable: 'false' }); ic.appendChild(svgEl('path', { d: 'M12 3v12M7 8l5-5 5 5M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' })); a.append(ic, document.createTextNode('Compartir'));
    let hecha = null;
    const prepara = () => { if (!hecha && navigator.share) hecha = tarjeta(preg, corta, r.foto, true).catch(() => tarjeta(preg, corta, r.foto, false)).catch(() => null); return hecha; };
    ['pointerenter', 'touchstart', 'focus'].forEach((ev) => a.addEventListener(ev, prepara, { once: true, passive: true }));
    if (navigator.share) { if (window.requestIdleCallback) requestIdleCallback(prepara, { timeout: 2500 }); else setTimeout(prepara, 900); }
    a.addEventListener('click', (e) => {
      if (!navigator.share) return; // sin menú de compartir: el enlace de WhatsApp tal cual
      e.preventDefault();
      prepara().then((b) => {
        const datos = { text: texto, url: enlaceFicha };
        if (b) { const fi = new File([b], 'ercunao.jpg', { type: 'image/jpeg' }); if (navigator.canShare && navigator.canShare({ files: [fi] })) datos.files = [fi]; }
        return navigator.share(datos);
      }).catch((er) => { if (!er || er.name !== 'AbortError') { const v = window.open(a.href, '_blank'); if (v) v.opener = null; else location.href = a.href; } });
    });
    return a;
  }
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
      } else if (p.t === 'tl') { f.appendChild(lineaTiempo(p)); if (p.nota) f.appendChild(el('p', 'oc-cunao-nota', p.nota)); }
      else if (p.t === 'acc') { if (r.mapa && !f.querySelector('.oc-cunao-mini')) f.appendChild(miniMapa(r.mapa)); const d = el('div', 'oc-cunao-acc'); p.l.forEach((x) => d.appendChild(enlace(x[0], x[1], 'oc-cunao-link'))); f.appendChild(d); }
    });
    if (r.mapa && !f.querySelector('.oc-cunao-mini')) f.appendChild(miniMapa(r.mapa));
    // se puede compartir lo que sabe (no las dudas ni los «no lo sé»)
    if (preg && !r.flojo && !r.nose && r.partes.some((p) => p.t === 'p')) { let d = f.querySelector('.oc-cunao-acc'); if (!d) { d = el('div', 'oc-cunao-acc'); f.appendChild(d); } d.appendChild(botonCompartir(r, preg)); }
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
  function abrir() {
    ultimoFoco = document.activeElement;
    hoja.hidden = false; btn.setAttribute('aria-expanded', 'true');
    if (vv) { vv.addEventListener('resize', ajusta); vv.addEventListener('scroll', ajusta); ajusta(); }
    requestAnimationFrame(() => hoja.classList.add('is-open'));
    document.body.style.overflow = 'hidden';
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
    if (vv) { vv.removeEventListener('resize', ajusta); vv.removeEventListener('scroll', ajusta); } suelta_();
    setTimeout(() => { hoja.hidden = true; }, calm ? 0 : 200);
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
