(function () {
	'use strict';
	var logEl = document.getElementById('pcof-log');
	var bar = document.getElementById('pcof-bar');
	var barI = bar ? bar.querySelector('i') : null;
	var btnImport = document.getElementById('pcof-import');
	var btnFetch = document.getElementById('pcof-fetch');
	var busy = false;

	function log(t) {
		logEl.style.display = 'block';
		logEl.appendChild(document.createTextNode(t + '\n'));
		logEl.scrollTop = logEl.scrollHeight;
	}
	function pct(n) {
		bar.style.display = 'block';
		barI.style.width = Math.max(0, Math.min(100, n)) + '%';
	}
	function post(data) {
		var fd = new FormData();
		fd.append('nonce', PCOF.nonce);
		Object.keys(data).forEach(function (k) { fd.append(k, data[k]); });
		return fetch(PCOF.ajax, { method: 'POST', credentials: 'same-origin', body: fd }).then(function (r) {
			return r.text().then(function (t) {
				try { return JSON.parse(t); } catch (e) { throw new Error('Respuesta no válida del servidor (' + r.status + ')'); }
			});
		});
	}
	function lock(v) {
		busy = v;
		if (btnImport) btnImport.disabled = v;
		if (btnFetch) btnFetch.disabled = v;
	}

	function runImport() {
		if (busy) return;
		lock(true);
		logEl.textContent = '';
		log('Importando datos base…');
		var step = function (fase, offset, retries) {
			post({ action: 'pcof_import_step', fase: fase, offset: offset }).then(function (res) {
				if (!res.success) throw new Error((res.data && res.data.msg) || 'Error desconocido');
				var d = res.data;
				log('· ' + d.msg);
				pct(d.pct);
				if (d.done) {
					log('Listo. Recarga la página para ver los contadores.');
					lock(false);
					return;
				}
				step(d.next.fase, d.next.offset, 0);
			}).catch(function (e) {
				if (retries < 2) {
					log('  reintentando (' + e.message + ')…');
					setTimeout(function () { step(fase, offset, retries + 1); }, 1500);
				} else {
					log('ERROR: ' + e.message + ' — puedes volver a pulsar el botón, continúa sin duplicar.');
					lock(false);
				}
			});
		};
		step('terminos', 0, 0);
	}

	function runFetch() {
		if (busy) return;
		lock(true);
		logEl.textContent = '';
		var ids = (PCOF.sources || []).slice();
		var total = ids.length, nuevas = 0;
		if (!total) { log('No hay fuentes activas. Importa los datos base primero.'); lock(false); return; }
		log('Leyendo ' + total + ' fuentes…');
		var next = function () {
			if (!ids.length) {
				post({ action: 'pcof_fetch_source', id: 0 }).finally(function () {
					log('Terminado: ' + nuevas + ' noticias nuevas.');
					pct(100);
					lock(false);
				});
				return;
			}
			var id = ids.shift();
			post({ action: 'pcof_fetch_source', id: id }).then(function (res) {
				if (res.success) {
					var d = res.data;
					nuevas += d.nuevas || 0;
					log((d.ok ? '✓ ' : '✗ ') + d.titulo + ' — ' + d.msg);
				} else {
					log('✗ fuente ' + id + ': ' + ((res.data && res.data.msg) || 'error'));
				}
			}).catch(function (e) {
				log('✗ fuente ' + id + ': ' + e.message);
			}).finally(function () {
				pct(100 * (total - ids.length) / total);
				next();
			});
		};
		next();
	}

	if (btnImport) btnImport.addEventListener('click', runImport);
	if (btnFetch) btnFetch.addEventListener('click', runFetch);
	if (PCOF.auto) runImport();
})();
