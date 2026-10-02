(function () {
	'use strict';
	function norm(s) {
		return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
	}
	document.querySelectorAll('[data-pcof-dir]').forEach(function (root) {
		var q = root.querySelector('[data-f="q"]');
		var ciudad = root.querySelector('[data-f="ciudad"]');
		var dia = root.querySelector('[data-f="dia"]');
		var cards = Array.prototype.slice.call(root.querySelectorAll('.pcof-entry'));
		var count = root.querySelector('.pcof-count');
		var empty = root.querySelector('.pcof-empty');
		var t;
		function apply() {
			var term = norm(q.value.trim());
			var c = ciudad ? ciudad.value : '';
			var d = dia ? dia.value : '';
			var n = 0;
			cards.forEach(function (el) {
				var ok = (!term || norm(el.getAttribute('data-q') + ' ' + el.textContent).indexOf(term) !== -1)
					&& (!c || (' ' + el.getAttribute('data-ciudad') + ' ').indexOf(' ' + c + ' ') !== -1)
					&& (!d || el.getAttribute('data-dia') === d);
				el.hidden = !ok;
				if (ok) n++;
			});
			if (count) count.textContent = n + ' resultado' + (n === 1 ? '' : 's');
			if (empty) empty.hidden = n !== 0;
		}
		[q, ciudad, dia].forEach(function (el) {
			if (!el) return;
			el.addEventListener('input', function () { clearTimeout(t); t = setTimeout(apply, 80); });
			el.addEventListener('change', apply);
		});
		apply();
	});
})();
