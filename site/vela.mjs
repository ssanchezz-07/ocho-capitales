// Ocho Capitales · «Enciende la vela» y la calle camino de la próxima Semana Santa.
// Diseño aprobado por Pablo el 13-nov-2026 («eso es perfecto»): EQUIPO/prototipos/vela-camino-2027.html y su encargo.
// Va en la portada fuera de temporada (empieza con la vela apagada) y en «Próxima Semana Santa» (empieza ya en la calle).
//
// La escena se escribe en capas SVG (calle, estrella, nazareno y vela). Sin JavaScript o con «reducir movimiento» son la
// escena final, quieta y con todo el texto. Con JavaScript, assets/vela.js lee estas mismas capas y las pinta en un <canvas>:
// Safari vuelve a pintar un SVG entero cada vez que cambia su escala, y aquí hay un zoom de 30 aumentos y una calle sin fin.
// Unidades: las del prototipo (una casa mide unos 84 de ancho y el suelo empieza en y = 240). portada.css coloca cada capa
// con --u, los píxeles que mide una unidad, así que las capas encajan entre sí a cualquier tamaño.

// Frases que van rotando arriba (Pablo: «dale más sentido el camino al 2027, más metafórico, nostálgico»).
export const FRASES_VELA = [
  'Desde el último Domingo de Resurrección…',
  'pasan el otoño, la Navidad y la Cuaresma…',
  'vuelve a oler a azahar y a cera…',
  'y otra vez, camino de la Semana Santa.',
];

// Un tramo de calle (360 de ancho): casas encaladas con cornisa, ventanas en arco con rejas, balcones de forja, faroles de
// pared y una iglesia con espadaña, campana, rosetón y portada en arco. Es el del prototipo.
const TRAMO = `<g id="vela-tramo">
<path class="v-fach v-tr" d="M0 240V128H84V240"/><path class="v-l" d="M-2 128H86M0 133H84"/>
<path class="v-luz v-tr" d="M16 156V142a8 8 0 0 1 16 0V156Z"/><path class="v-ven v-tr" d="M52 156V143a7 7 0 0 1 14 0V156Z"/>
<path class="v-l" d="M8 166H40M8 157H40M12 157V166M18 157V166M24 157V166M30 157V166M36 157V166"/>
<path class="v-ven v-tr" d="M14 220V204a7 7 0 0 1 14 0V220Z"/><path class="v-l" d="M14 210H28M21 197V220"/>
<path class="v-puerta v-tr" d="M54 240V214a10 10 0 0 1 20 0V240Z"/>
<path class="v-fach v-tr" d="M90 240V146H172V240"/><path class="v-l" d="M88 146H174M90 151H172"/>
<path class="v-ven v-tr" d="M114 186V167a9 9 0 0 1 18 0V186Z"/>
<path class="v-l" d="M104 186H142M104 177H142M108 177V186M114 177V186M120 177V186M126 177V186M132 177V186M138 177V186"/>
<path class="v-luz v-tr" d="M150 226V211a6 6 0 0 1 12 0V226Z"/><path class="v-puerta v-tr" d="M100 240V218a9 9 0 0 1 18 0V240Z"/>
<path class="v-l" d="M94 172h8v-6"/><path class="v-farol v-tr" d="M98 158h8l-1 10h-6z"/><path class="v-l" d="M97 158h10M102 158v-3"/>
<path class="v-fach v-tr" d="M178 240V130H206V112Q224 92 242 112V130H270V240"/><path class="v-l" d="M176 130H208M240 130H272M224 96V86M220 90H228"/>
<path class="v-ven v-tr" d="M216 127V115a8 8 0 0 1 16 0V127Z"/><path class="v-oro" d="M220 125q4-11 8 0z"/>
<circle class="v-ven v-tr" cx="224" cy="160" r="8"/><path class="v-l" d="M216 160H232M224 152V168"/>
<path class="v-puerta v-tr" d="M206 240V202a18 18 0 0 1 36 0V240Z"/><path class="v-l" d="M200 240V196a24 24 0 0 1 48 0V240"/>
<path class="v-fach v-tr" d="M276 240V134H360V240"/><path class="v-l" d="M274 134H362M276 139H360"/>
<path class="v-ven v-tr" d="M290 170V156a7 7 0 0 1 14 0V170Z"/><path class="v-luz v-tr" d="M330 170V156a7 7 0 0 1 14 0V170Z"/>
<path class="v-l" d="M284 170H350M284 162H350M290 162V170M298 162V170M306 162V170M314 162V170M322 162V170M330 162V170M338 162V170M346 162V170"/>
<path class="v-ven v-tr" d="M298 226V209a7 7 0 0 1 14 0V226Z"/><path class="v-l" d="M298 216H312M305 202V226"/>
<path class="v-puerta v-tr" d="M326 240V216a9 9 0 0 1 18 0V240Z"/>
<path class="v-l" d="M280 192h8v-6"/><path class="v-farol v-tr" d="M284 178h8l-1 10h-6z"/><path class="v-l" d="M283 178h10M288 178v-3"/>
</g>`;
// Bajo cada balcón cuelga una colgadura; en cada tramo, cuatro.
const BALCONES = [[19, 166], [118, 186], [294, 170], [334, 170]];
// La calle que se ve: tres vueltas del dibujo (2.160 de ancho), que llega para el ordenador más ancho. Cada vuelta son dos
// tramos con las colgaduras de las ocho capitales, una tras otra, con el color de su terciopelo (portal.json).
const VUELTA = 720, ANCHO_CALLE = 3 * VUELTA;
function calle(colores) {
  const tramos = [], colg = [];
  for (let x = 0; x < ANCHO_CALLE; x += 360) tramos.push(`<use href="#vela-tramo"${x ? ` x="${x}"` : ''}/>`);
  for (let v = 0; v < ANCHO_CALLE; v += VUELTA) colores.forEach((c, i) => {
    const [x, y] = BALCONES[i % 4], dx = v + (i < 4 ? 0 : 360) + x;
    colg.push(`<path d="M${dx} ${y}h10v24l-5 5-5-5z" fill="${c}"/>`);
  });
  // Suelo: adoquines y un rastro de gotas de cera. Se repite cada 80 (las gotas alternan dos alturas).
  let piedras = 'M-80 262H2240M-80 280H2240';
  for (let x = -70; x <= 2240; x += 40) piedras += `M${x} 240v22`;
  for (let x = -50; x <= 2240; x += 40) piedras += `M${x} 262v18`;
  const gotas = [];
  for (let k = -2; 20 + 40 * k <= 2240; k++) gotas.push(`<circle cx="${20 + 40 * k}" cy="${k % 2 ? 253 : 251}" r="1.8"/>`);
  return `<svg class="oc-vela-capa oc-vela-calle" viewBox="0 80 ${ANCHO_CALLE} 220" aria-hidden="true" focusable="false"><defs>${TRAMO}</defs>
<g data-capa="calle" data-vuelta="${VUELTA}" data-vel="36">${tramos.join('')}<g class="v-lin" stroke-width=".8">${colg.join('')}</g></g>
<rect class="v-suelo" x="-80" y="240" width="${ANCHO_CALLE + 160}" height="60"/>
<g data-capa="suelo" data-vuelta="80" data-vel="16"><path class="v-piedra" fill="none" stroke-width="1" opacity=".55" d="${piedras}"/><g class="v-gota" opacity=".75">${gotas.join('')}</g></g>
</svg>`;
}

// La llama: la misma forma, el mismo degradado y el mismo parpadeo en la vela y en el cirio del nazareno, para que el paso de
// una a otra no se note. El degradado va en unidades de la llama (el del prototipo, de caja, pasado a coordenadas).
const LLAMA = '<path d="M0 4C-12-4-10-24 0-50C10-24 12-4 0 4Z" fill="url(#vela-llama)"/><path d="M0 0C-5-5-4-14 0-24C4-14 5-5 0 0Z" fill="#fffdf2"/>';
const DEG_LLAMA = '<radialGradient id="vela-llama" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(0 -10.04) scale(10.25 33.48)"><stop offset="0" stop-color="#fffbe8"/><stop offset=".42" stop-color="#ffd98a"/><stop offset=".78" stop-color="#ff9a3c"/><stop offset="1" stop-color="#ff6a1c" stop-opacity="0"/></radialGradient>';

// El nazareno de la web (antes NAZ_SVG en build.mjs), a un quinto de tamaño, con zapatos negros de borde dorado que se alternan
// al andar. De noche, la luz de su cirio le alumbra.
const NAZARENO = `<svg class="oc-vela-capa oc-vela-naz" viewBox="0 0 240 560" aria-hidden="true" focusable="false"><defs>${DEG_LLAMA}<radialGradient id="vela-naz-luz" cx="62" cy="96" r="230" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ffd27a" stop-opacity=".5"/><stop offset=".35" stop-color="#e7a43c" stop-opacity=".14"/><stop offset="1" stop-color="#e7a43c" stop-opacity="0"/></radialGradient></defs>
<g data-capa="pie-d"><path class="v-zapato" d="M84 548Q99 534 114 548Z"/></g><g data-capa="pie-i"><path class="v-zapato" d="M126 548Q141 534 156 548Z"/></g>
<g data-capa="cuerpo"><path d="M88 220C62 250 50 330 46 420C44 470 46 510 50 530Q120 548 190 530C194 510 196 470 194 420C190 330 178 250 152 220Z" fill="#1d0b2c"/><path d="M86 228C78 300 72 420 66 528Q120 540 174 528C168 420 162 300 154 228Z" fill="#2b1140"/><path d="M120 24L95 152C88 175 80 205 84 232Q120 252 156 232C160 205 152 175 145 152Z" fill="#4a1f6b"/><path d="M104 150q6-4 12 0q-6 4-12 0ZM124 150q6-4 12 0q-6 4-12 0Z" fill="#0b0511"/><path d="M112 196h16v10q0 10-8 14q-8-4-8-14Z" fill="#c9a14a"/><path d="M58 470V112Q62 106 66 112V470Z" fill="#efe6d2"/>
<rect class="v-noche" x="-200" y="-200" width="640" height="900" fill="url(#vela-naz-luz)"/>
<g class="v-traz"><path d="M120 24L95 152"/><path d="M120 24L145 152"/><path d="M95 152C88 175 80 205 84 232Q120 252 156 232C160 205 152 175 145 152"/><path d="M104 150q6-4 12 0q-6 4-12 0Z"/><path d="M124 150q6-4 12 0q-6 4-12 0Z"/><path d="M112 196h16v10q0 10-8 14q-8-4-8-14Z"/><path d="M88 220C62 250 50 330 46 420C44 470 46 510 50 530"/><path d="M152 220C178 250 190 330 194 420C196 470 194 510 190 530"/><path d="M86 228C78 300 72 420 66 528Q120 540 174 528C168 420 162 300 154 228"/><path d="M100 300C98 380 94 460 92 532"/><path d="M120 300L120 536"/><path d="M140 300C142 380 146 460 148 532"/><path d="M84 300Q120 312 156 300"/><path d="M134 306C136 340 132 380 136 410"/><path d="M138 306C142 335 142 370 146 400"/><path d="M131 410l5 14 5-14"/><path d="M141 400l5 14 5-14"/><path d="M90 236C80 262 72 290 70 318L84 330C88 300 92 276 96 252"/><path d="M150 240C160 280 162 320 158 350"/><path d="M58 470V112Q62 106 66 112V470Z"/><path d="M62 316q8-6 14 0v16q-7 5-14 0Z"/><path d="M62 108V100"/></g>
<g transform="translate(62 100) scale(.778)"><g data-capa="llama-naz">${LLAMA}</g></g></g>
</svg>`;

// La meta: la estrella de ocho puntas con el año, en el cielo, siempre por delante del nazareno.
const estrella = (anio) => `<svg class="oc-vela-capa oc-vela-estrella" viewBox="-50 -50 100 100" aria-hidden="true" focusable="false"><defs><radialGradient id="vela-est-n" cx="0" cy="0" r="40" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ffe2a0" stop-opacity=".6"/><stop offset="1" stop-color="#ffe2a0" stop-opacity="0"/></radialGradient><radialGradient id="vela-est-d" cx="0" cy="0" r="50" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#e9c46a" stop-opacity=".55"/><stop offset=".55" stop-color="#e9c46a" stop-opacity=".18"/><stop offset="1" stop-color="#e9c46a" stop-opacity="0"/></radialGradient></defs>
<circle class="v-noche" r="40" fill="url(#vela-est-n)"/><circle class="v-dia" r="50" fill="url(#vela-est-d)"/>
<g data-capa="estrella"><g class="v-soro" fill="none" stroke-width="2.2"><rect x="-13" y="-13" width="26" height="26"/><rect x="-13" y="-13" width="26" height="26" transform="rotate(45)"/></g></g>
<text class="v-oro v-anio" y="43" text-anchor="middle">${anio}</text></svg>`;

// La vela apagada (la de trazo dorado del primer vídeo). Su llama, su halo y las motas de luz salen al tocarla.
const VELA = `<svg class="oc-vela-capa oc-vela-vela" viewBox="70 -30 220 305" aria-hidden="true" focusable="false"><defs><radialGradient id="vela-halo" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(180 97.2) scale(96 112)"><stop offset="0" stop-color="#ffcf7a" stop-opacity=".55"/><stop offset=".5" stop-color="#c98a3a" stop-opacity=".16"/><stop offset="1" stop-color="#c98a3a" stop-opacity="0"/></radialGradient></defs>
<g data-capa="halo"><ellipse cx="180" cy="86" rx="96" ry="112" fill="url(#vela-halo)"/></g>
<g fill="#ffe7a6"><g data-capa="mota" data-retraso="1000"><circle cx="140" cy="240" r="2"/></g><g data-capa="mota" data-retraso="3000"><circle cx="226" cy="232" r="1.6"/></g><g data-capa="mota" data-retraso="2000"><circle cx="248" cy="262" r="2.2"/></g><g data-capa="mota" data-retraso="4500"><circle cx="160" cy="268" r="1.7"/></g></g>
<g class="v-lin" fill="none" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M152 126L152 250M208 126L208 250"/><path d="M152 126C157 118 166 115 176 117C179 109 184 109 187 117C197 115 204 118 208 126"/><path d="M174 117C168 140 172 154 167 170M203 122C206 136 202 146 205 158"/><path d="M120 252L240 252M130 252C136 270 224 270 230 252"/></g>
<path class="v-mecha" d="M180 115Q178 108 181 102" fill="none" stroke-width="2.4" stroke-linecap="round"/>
<g transform="translate(180 102)"><g data-capa="llama-vela">${LLAMA}</g></g></svg>`;

// La sección entera. modo «portada»: vela apagada, la toca y entra en la calle; los textos aparecen cuando el nazareno echa a
// andar. modo «proxima»: ya en la calle, con los textos puestos (viene de la portada). lead: la cuenta atrás (leadHoy() de
// build.mjs; site.js la recalcula en el navegador). boton: el enlace de abajo, ya montado. colores: los de las ocho capitales.
export function escenaVela({ modo = 'portada', anio, lead, boton, colores }) {
  const portada = modo === 'portada', H = portada ? 'h2' : 'h1';
  return `<section class="oc-vela" data-vela="${portada ? 'portada' : 'proxima'}" aria-labelledby="vela-t"><div class="oc-vela-escena">
${calle(colores)}
${estrella(anio)}
${NAZARENO}
${portada ? VELA : ''}
<canvas class="oc-vela-lienzo" aria-hidden="true"></canvas><div class="oc-vela-brillo" aria-hidden="true"></div>
${portada ? '<button type="button" class="oc-vela-boton" aria-label="Enciende la vela" aria-describedby="vela-pista"><span class="oc-vela-pista"><span aria-hidden="true">Enciende la vela</span><small id="vela-pista">Tócala y empieza el camino hacia la próxima Semana Santa</small></span></button>' : ''}
<div class="oc-vela-txt"><p class="oc-vela-frase" aria-hidden="true" data-frases="${FRASES_VELA.join('|')}">${FRASES_VELA[FRASES_VELA.length - 1]}</p><p class="oc-sr">${FRASES_VELA.join(' ')}</p>
<header class="oc-vela-cab"><p class="oc-kicker">Próxima Semana Santa</p><${H} class="oc-vela-titulo" id="vela-t" tabindex="-1">Semana Santa ${anio}</${H}>${lead}${boton}</header></div>
</div></section>`;
}

// En el <head>: con «reducir movimiento» (o sin lienzo) no se marca nada y se queda la escena final. Si vela.js no llega a
// arrancar en 8 s (red muy lenta), también: mejor la escena quieta que una vela que no se enciende. bloquea: la página no se
// pinta hasta que vela.js ha pintado su primer fotograma (en «Próxima Semana Santa», donde la escena está arriba; Chrome).
export const cabezaVela = (src, bloquea = false) => `<script>(function(){try{if(matchMedia('(prefers-reduced-motion: reduce)').matches||!window.Path2D||!Path2D.prototype.addPath||!window.DOMMatrix)return;var h=document.documentElement;h.classList.add('oc-vela-js');setTimeout(function(){if(!window.ocVelaVivo)h.classList.remove('oc-vela-js')},8000)}catch(e){}})()</script><script src="${src}" defer${bloquea ? ' blocking="render"' : ''}></script>`;
