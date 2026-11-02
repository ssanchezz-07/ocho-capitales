// Ocho Capitales · red de seguridad: batería de búsquedas reales en el filtro de Marchas (la usa tools/prueba-humo.mjs).
// Pablo, 2-nov: «el filtro no filtra bien las marchas». Cada caso escribe en el filtro (y elige capital o tipo si toca),
// espera el recuento y comprueba lo que se ve. Devuelve la lista de fallos (vacía si todo va bien).
// Las comprobaciones son sobre lo que dicen los datos hoy; si una marcha cambia de nombre, se cambia aquí.

const sinTildes = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const tiene = (texto, w) => (' ' + sinTildes(texto) + ' ').includes(' ' + w + ' ');
const empiezaPalabra = (texto, w) => (' ' + sinTildes(texto)).includes(' ' + w);

// q: lo que se escribe · ciudad / tipo: desplegables · primero: título del primer resultado (sin tildes ni signos)
// primeros: títulos que tienen que salir los primeros (en cualquier orden) · palabras: cada resultado visible las lleva completas
// prefijo: cada resultado tiene una palabra que empieza así · min / max: recuento · ciudadVisible: la capital sale en cada fila
const CASOS = [
  { q: 'El día del Señor', primero: 'el dia del senor', palabras: ['dia', 'senor'] },
  { q: 'el dia del senor', primero: 'el dia del senor', palabras: ['dia', 'senor'] },
  { q: '¡EL DÍA DEL SEÑOR!', primero: 'el dia del senor', palabras: ['dia', 'senor'] },
  { q: 'El día del Señor', ciudad: 'malaga', tipo: 'banda-de-cornetas-y-tambores', palabras: ['dia', 'senor'], max: 5 },
  { q: 'señor', palabras: ['senor'], min: 5 },
  { q: 'A esta es', primeros: ['a esta es', 'a esta es'], palabras: ['esta', 'es'], min: 3 },
  { q: 'Amarguras', primero: 'amarguras', palabras: ['amarguras'], min: 5 },
  { q: 'amarguras', ciudad: 'sevilla', palabras: ['amarguras'], ciudadVisible: 'Sevilla', min: 1 },
  { q: 'la madrugá', palabras: ['madruga'], min: 6 },
  { q: 'Cristo de la Sangre', primero: 'cristo de la sangre', palabras: ['cristo', 'sangre'], min: 5 },
  { q: 'Tres Caídas', palabras: ['tres', 'caidas'], min: 5 },
  { q: 'Cigarreras', primero: 'cigarreras', palabras: ['cigarreras'], min: 4 },
  { q: 'Cebrián', palabras: ['cebrian'], min: 7 },
  { q: 'farfan', palabras: ['farfan'], min: 21 },
  { q: 'esperanza', tipo: 'banda-de-musica', palabras: ['esperanza'], min: 5 },
  { q: 'esperanza macarena', palabras: ['esperanza', 'macarena'], min: 2 },
  { q: 'amarg', prefijo: 'amarg', min: 5 },
  { q: 'amarguas', palabras: [], min: 1, algunaPalabra: 'amarguras' },
  { q: 'cigareras', palabras: [], min: 1, algunaPalabra: 'cigarreras' },
  { q: 'a', min: 100 },
  { q: '', ciudad: 'malaga', min: 1000, ciudadVisible: 'Málaga' },
  { q: 'zzzqqqxx', max: 0, vacio: true },
];

export async function pruebaBuscador(p, base) {
  const fallos = [];
  const leer = async () => {
    // espera a que el recuento sea un número y no cambie en dos lecturas seguidas (mientras se prepara la lista dice «Buscando…»)
    let antes = '', t = Date.now();
    while (Date.now() - t < 20000) {
      await p.waitForTimeout(250);
      const x = (await p.locator('[data-dir-count]').first().textContent().catch(() => '')) || '';
      if (/^\d+ resultados?$/.test(x) && x === antes) return +x.split(' ')[0];
      antes = x;
    }
    return null;
  };
  const filas = () => p.$$eval('[data-dir] .oc-entry:not([hidden])', (ls) => ls.map((l) => ({ t: l.querySelector('.vx-tit')?.textContent || '', todo: [...l.querySelectorAll('*')].filter((e) => !e.children.length).map((e) => e.textContent).join(' ') })));
  for (const c of CASOS) {
    const nombre = `«${c.q}»${c.ciudad ? ' + ' + c.ciudad : ''}${c.tipo ? ' + ' + c.tipo : ''}`;
    const mal = (m) => fallos.push(`buscador ${nombre}: ${m}`);
    await p.selectOption('[data-dir-filters] [data-f="ciudad"]', c.ciudad || '').catch(() => {});
    await p.selectOption('[data-dir-filters] [data-f="tipo"]', c.tipo || '').catch(() => {});
    await p.locator('[data-dir-filters] [data-f="q"]').fill(c.q);
    const n = await leer();
    if (n === null) { mal('el recuento no se asienta en 20 s'); continue; }
    const fs = await filas();
    if (c.min != null && n < c.min) mal(`${n} resultados (se esperaban al menos ${c.min})`);
    if (c.max != null && n > c.max) mal(`${n} resultados (se esperaban como mucho ${c.max})`);
    if (n !== 0 && !fs.length) mal(`dice ${n} resultados pero no se ve ninguno`);
    if (n > 0 && n <= 50 && fs.length !== n) mal(`dice ${n} resultados y se ven ${fs.length}`);
    if (c.primero && sinTildes(fs[0]?.t) !== c.primero) mal(`el primero es «${fs[0]?.t}» (se esperaba «${c.primero}»)`);
    if (c.primeros) { const top = fs.slice(0, c.primeros.length).map((f) => sinTildes(f.t)).sort().join('|'); if (top !== [...c.primeros].sort().join('|')) mal(`los primeros son «${fs.slice(0, c.primeros.length).map((f) => f.t).join('», «')}»`); }
    for (const w of c.palabras || []) { const sin = fs.find((f) => !tiene(f.todo, w)); if (sin) mal(`sale «${sin.t}», que no lleva la palabra «${w}»`); }
    if (c.prefijo) { const sin = fs.find((f) => !empiezaPalabra(f.todo, c.prefijo)); if (sin) mal(`sale «${sin.t}», sin ninguna palabra que empiece por «${c.prefijo}»`); }
    if (c.algunaPalabra && !fs.some((f) => tiene(f.todo, c.algunaPalabra))) mal(`con una letra mal no encuentra «${c.algunaPalabra}»`);
    if (c.ciudadVisible) { const sin = fs.find((f) => !f.todo.includes(c.ciudadVisible)); if (sin) mal(`sale «${sin.t}», que no es de ${c.ciudadVisible}`); }
    if (c.vacio && !(await p.locator('[data-dir-empty]').first().isVisible().catch(() => false))) mal('no avisa de que no hay resultados');
  }
  // volver a la página con los filtros en la dirección (compartir un enlace o volver atrás) da lo mismo que escribirlos
  await p.goto(base + 'marchas/?q=amarguras&ciudad=sevilla', { waitUntil: 'load' });
  const n = await leer(), fs = await filas();
  if (!n || fs.some((f) => !tiene(f.todo, 'amarguras') || !f.todo.includes('Sevilla'))) fallos.push(`buscador con filtros en la dirección: ${n} resultados que no cuadran`);
  return fallos;
}
