/* Ocho Capitales · erCuñao: lo que se pinta al responder (el recorrido en miniatura, la línea de tiempo y la tarjeta
   para compartir). Se pide junto al motor, al acercarse al botón: así no pesa en cada página. */
window.OC_CUNAO_PINTA = function (ctx) {
  'use strict';
  const el = ctx.el, hoja = ctx.hoja, url = ctx.url, BASE = ctx.BASE;
  const version = (url.match(/\?.*$/) || [''])[0];
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
  return { miniMapa, lineaTiempo, botonCompartir };
};
