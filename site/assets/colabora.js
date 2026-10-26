// Ocho Capitales · formulario de Colabora: envía la aportación al correo del portal sin que la dirección aparezca en la página.
// Destinos (atributo data-destino del formulario, lo pone build.mjs):
//   web3forms → https://api.web3forms.com/submit con la clave pública (data-clave), que hace de alias del correo;
//   api       → /api/sugerencias (Cloudflare Pages Functions + D1), cuando la web esté en Cloudflare;
//   vacío     → el formulario aún no está activo.
(function () {
  'use strict';
  var f = document.querySelector('[data-colabora]');
  if (!f) return;
  var estado = f.querySelector('[data-estado]'), boton = f.querySelector('button[type="submit"]');
  var destino = f.dataset.destino || '', abierto = Date.now();
  var LIMITE = 5, CLAVE_LIM = 'oc-colabora-envios';

  // Datos que llegan en la dirección: ?pagina=…&nombre=…&capital=…&texto=… (desde las fichas y erCuñao)
  var q = new URLSearchParams(location.search);
  if (q.get('pagina')) f.pagina.value = q.get('pagina').slice(0, 300);
  if (q.get('nombre')) { f.hermandad.value = q.get('nombre').slice(0, 120); f.tipo.value = 'Corrección'; }
  if (q.get('capital') && f.capital.querySelector('option[value="' + CSS.escape(q.get('capital')) + '"]')) f.capital.value = q.get('capital');
  if (q.get('texto')) f.mensaje.value = q.get('texto').slice(0, 2000);
  if (q.get('pagina')) { var aviso = f.querySelector('[data-pagina-aviso]'); if (aviso) { aviso.hidden = false; aviso.querySelector('span').textContent = q.get('pagina'); } }

  function di(texto, tipo) { estado.hidden = false; estado.className = 'oc-colabora-estado is-' + tipo; estado.textContent = texto; }
  function envios() { try { var a = JSON.parse(localStorage.getItem(CLAVE_LIM) || '[]'); return a.filter(function (t) { return Date.now() - t < 864e5; }); } catch (e) { return []; } }
  function apunta() { try { var a = envios(); a.push(Date.now()); localStorage.setItem(CLAVE_LIM, JSON.stringify(a)); } catch (e) { } }
  function nombreCapital() { var o = f.capital.selectedOptions[0]; return f.capital.value ? o.textContent : 'General'; }

  f.addEventListener('submit', function (ev) {
    ev.preventDefault();
    if (!destino) return di('El envío desde aquí estará disponible en unos días. Gracias por tu paciencia.', 'error');
    // campo trampa (los robots lo rellenan) y tiempo mínimo en la página
    if (f.botcheck.checked || f.web.value) return di('Gracias. Hemos recibido tu aportación.', 'ok');
    if (envios().length >= LIMITE) return di('Has enviado ya varias aportaciones hoy. Gracias: vuelve a intentarlo mañana.', 'error');
    var mensaje = f.mensaje.value.trim();
    if (mensaje.length < 10) { f.mensaje.focus(); return di('Cuéntanos un poco más (al menos 10 caracteres).', 'error'); }
    if (Date.now() - abierto < 3000) return di('Un momento: revisa el texto antes de enviarlo.', 'error');
    var fuente = f.fuente.value.trim(), correo = f.correo.value.trim();
    if (fuente && !/^https?:\/\/\S+\.\S+/.test(fuente)) { f.fuente.focus(); return di('El enlace a la fuente debe empezar por https://', 'error'); }
    if (correo && !f.correo.checkValidity()) { f.correo.focus(); return di('Revisa el correo de respuesta.', 'error'); }

    var tipo = f.tipo.value, herm = f.hermandad.value.trim();
    var asunto = '[Ocho Capitales] ' + tipo + ' · ' + nombreCapital() + ' · ' + (herm || 'Sin hermandad');
    var datos = { tipo: tipo, capital: nombreCapital(), hermandad: herm, mensaje: mensaje, fuente: fuente, pagina: f.pagina.value, enviado_desde: location.href.split('?')[0] };
    var peticion;
    if (destino === 'web3forms') {
      var cuerpo = Object.assign({ access_key: f.dataset.clave, subject: asunto, from_name: 'Ocho Capitales', botcheck: false }, datos);
      if (correo) cuerpo.email = correo;
      peticion = fetch('https://api.web3forms.com/submit', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(cuerpo) });
    } else {
      var texto = asunto + '\n\n' + mensaje + (fuente ? '\n\nFuente: ' + fuente : '') + (correo ? '\nResponder a: ' + correo : '');
      peticion = fetch(location.pathname.replace(/colabora\/?$/, '') + 'api/sugerencias', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ texto: texto, pagina: datos.pagina || location.pathname, hermandad: herm }) });
    }
    boton.disabled = true; f.setAttribute('aria-busy', 'true'); di('Enviando…', 'enviando');
    peticion.then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok || j.success === false) throw new Error(j.message || r.status); }); })
      .then(function () {
        apunta();
        f.reset(); f.pagina.value = '';
        di('¡Recibido, gracias! Lo revisaremos con su fuente antes de publicarlo en la web.', 'ok');
        estado.focus();
      })
      .catch(function () { di('No se ha podido enviar ahora mismo. Tu texto sigue aquí: inténtalo de nuevo en unos minutos.', 'error'); })
      .then(function () { boton.disabled = false; f.removeAttribute('aria-busy'); });
  });
})();
