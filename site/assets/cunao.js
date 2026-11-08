/* Ocho Capitales · erCuñao: asistente SIN IA que contesta con la base de datos del portal.
   - data/cunao.json (se carga al abrir la hoja): jornadas, hermandades, titulares y autores, bandas, imagineros y resumen de recorridos.
   - data/cunao/<ciudad>.json (a demanda): itinerario completo, historia, pasos, marchas dedicadas y últimas noticias.
   El motor (crearMotor) es puro: recibe texto y devuelve una respuesta estructurada. La interfaz la pinta.
   En Node se expone con module.exports para las pruebas (scripts/probar-cunao.mjs). */
(function (raiz) {
  'use strict';

  // ================= utilidades de texto =================
  const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
  const stem = (t) => (t.length > 5 && /[nrld]es$/.test(t) ? t.slice(0, -2) : t.length > 5 && /ces$/.test(t) ? t.slice(0, -3) + 'z' : t.length > 4 && /s$/.test(t) ? t.slice(0, -1) : t);
  const toks = (s) => norm(s).split(' ').filter(Boolean);
  const set = (s) => new Set(s.split(/\s+/).filter(Boolean));
  function distancia(a, b, max) {
    // Damerau-Levenshtein (transposiciones incluidas) con corte temprano
    if (Math.abs(a.length - b.length) > max) return max + 1;
    let prev2 = null, prev = Array.from({ length: b.length + 1 }, (_, j) => j);
    for (let i = 1; i <= a.length; i++) {
      const cur = [i]; let min = i;
      for (let j = 1; j <= b.length; j++) {
        let v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
        if (prev2 && i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, prev2[j - 2] + 1);
        cur.push(v); if (v < min) min = v;
      }
      if (min > max) return max + 1;
      prev2 = prev; prev = cur;
    }
    return prev[b.length];
  }
  const cap1 = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  // lugares que vienen en mayúsculas del PDF del itinerario («CAMPANA» → «Campana»)
  const bonito = (s) => (s && s === s.toUpperCase() && /[A-ZÁÉÍÓÚÑ]{3}/.test(s) ? s.toLowerCase().replace(/(^|[\s(«-])([a-záéíóúñ])/g, (m, a, b) => a + b.toUpperCase()).replace(/\b(De|Del|La|Las|Los|El|Y)\b/g, (m) => m.toLowerCase()) : s);
  const lista = (l, y) => (l.length < 2 ? l.join('') : l.slice(0, -1).join(', ') + ' ' + (y || 'y') + ' ' + l[l.length - 1]);

  // ================= vocabulario =================
  const STOP = set('a al algo alguna alguno ahi alli aqui ante antes asi aun bueno cada como con contra cual cuales cualquier cuando cuanto cuanta cuantos cuantas de del desde dime dimelo donde dos el ella ellos en entre era es esa ese eso esta estan este esto estos estas fue ha han hasta hay la las le les lo los me mi mis mucho muy mas ni no nos o os otra otro otras otros para pero poco por porque pues que q quien quienes se sea segun ser si sin sobre son su sus tambien tan te tiene tienen toda todas todo todos tu tus u un una unas uno unos usted vale y ya yo oye oiga cunao ercunao hola buenas gracias favor porfa sabes sabe saber decir dices dice puedes puede podrias quiero quisiera necesito busco buscar conocer contar cuentame cuenta mira vamos venga hermandad hermandades cofradia cofradias procesion procesiones procesiona semana santa santo santos ciudad capital capitales ano anos proxima proximo ultimo ultimas ver veo verla verlo verlas verlos ir voy van va hacer hace hacen tengo tienes algun ningun saldra saldran sabeis va mejor');
  const GENERICO = set('nuestro nuestra padre senor senora santisimo santisima stmo sma ntro ntra nstra maria jesus cristo virgen dios hijo madre san real ilustre venerable fervorosa pontificia hdad sacramental nazareno nazarenos archicofradia primitiva');
  const CLAVE = set('hora horas ora horario horarios sale salen salir salida salidas sali entra entran entrada entrar recoge recogida recogen encierro vuelve regresa termina acaba pasa pasan pasar paso pasos trono tronos recorrido recorridos itinerario itinerarios ruta calle calles carrera oficial catedral campana tribuna sede templo iglesia parroquia capilla banda bandas musica toca tocan acompana acompanan acompanamiento cornetas tambores agrupacion musical marcha marchas suena suenan dedicada dedicadas imaginero imagineros talla tallo tallaron autor autora escultor esculpio hizo hicieron historia fundacion fundada fundo origen web pagina noticias noticia novedades cerca mapa ubicacion misterio palio costaleros costalero portadores titulares titular imagen imagenes dia dias jornada fecha falta faltan queda quedan obras obra hoy manana pasado ayer noche tarde ahora llega llegan cuantas cuantos siguiente habito habitos tunica tunicas capirote capirotes antifaz cingulo cinturon esparto capa visten vestidos color colores compuso compusieron compuesto compositor compositora compositores repertorio telefono movil whatsapp correo email interpreta interpretan primera primero primeras ultima ultimo ultimas temprano pronto antes despues partir orden nombre oficial completo agenda calendario extraordinaria extraordinarias besamanos besapies culto cultos triduo quinario septenario novena traslado concierto pregon');
  const DIA_FRASES = [
    ['viernes de dolores', 'Viernes de Dolores'], ['sabado de pasion', 'Sábado de Pasión'], ['visperas', 'Viernes de Dolores'],
    ['domingo de ramos', 'Domingo de Ramos'], ['ramos', 'Domingo de Ramos'], ['lunes santo', 'Lunes Santo'], ['lunes', 'Lunes Santo'],
    ['martes santo', 'Martes Santo'], ['martes', 'Martes Santo'], ['miercoles santo', 'Miércoles Santo'], ['miercoles', 'Miércoles Santo'],
    ['jueves santo', 'Jueves Santo'], ['jueves', 'Jueves Santo'], ['madrugada', 'Madrugá'], ['madruga', 'Madrugá'],
    ['viernes santo', 'Viernes Santo'], ['domingo de resurreccion', 'Domingo de Resurrección'], ['domingo de pascua', 'Domingo de Resurrección'], ['pascua', 'Domingo de Resurrección'],
    ['viernes', 'Viernes Santo'], ['sabado santo', 'Sábado Santo'], ['sabado', 'Sábado Santo'], ['domingo', 'Domingo de Ramos'],
  ];
  const DIA_PAL = set('viernes dolores sabado pasion visperas domingo ramos lunes martes miercoles jueves madrugada madruga resurreccion pascua');
  // grupos: una jornada «canónica» incluye las variantes que usan algunas ciudades
  const GRUPO = { 'Jueves Santo': ['Jueves Santo', 'Jueves Santo y Madrugada'], 'Madrugá': ['Madrugá', 'Jueves Santo y Madrugada'], 'Viernes de Dolores': ['Viernes de Dolores', 'Vísperas'] };
  const grupo = (d) => GRUPO[d] || [d];
  const GENTILICIO = [['sevillan', 'sevilla'], ['malaguen', 'malaga'], ['granadin', 'granada'], ['cordobes', 'cordoba'], ['gaditan', 'cadiz'], ['onubense', 'huelva'], ['almeriense', 'almeria'], ['jiennense', 'jaen'], ['jaenero', 'jaen']];
  // sinónimos y jerga cofrade: se aplican sobre el texto normalizado antes de buscar
  const SINONIMOS = [
    [/\bhombres? de trono\b|\bportadores\b/g, 'costaleros'], [/\btronos?\b/g, 'paso'], [/\bla madruga(da)?\b/g, 'madruga'],
    [/\bque (hora|ora) es la salida\b/g, 'a que hora sale'], [/\b(hora|ora) de salida\b/g, 'a que hora sale'], [/\bora\b/g, 'hora'],
    [/\bcofrade?ria\b/g, 'cofradia'], [/\bprocesiona(n)?\b/g, 'sale$1'], [/\bq\b/g, 'que'], [/\bxq\b|\bpq\b/g, 'porque'],
    [/\bbcyt\b|\bbct\b|\bcctt\b|\bcc tt\b|\bbcct\b/g, 'banda cornetas tambores'], [/\bam\b(?= )/g, 'agrupacion musical'], [/\bbm\b|\bbb mm\b/g, 'banda de musica'], [/\bsemana mayor\b/g, 'semana santa'],
    [/\bcruz de guia\b/g, 'salida'], [/\bmadrugada del viernes\b/g, 'madruga'], [/\bnazarenitos?\b/g, 'nazarenos'], [/\bmusicas\b/g, 'musica'],
    [/\bque (marchas|marcha) (suena|suenan|lleva|llevan)\b/g, 'que marchas toca'],
  ];
  // Andaluz escrito y abreviaturas: solo palabras cortas que no admiten otra lectura (las largas las arregla «corrige» con variantes)
  const ANDALUZ = { izo: 'hizo', iso: 'hizo', oy: 'hoy', ay: 'hay', ai: 'hay', ar: 'al', er: 'el', ande: 'donde', aonde: 'donde', onde: 'donde', ond: 'donde', dnd: 'donde', dond: 'donde', pa: 'para', pal: 'para el', quie: 'quien', kien: 'quien', qien: 'quien', ke: 'que', k: 'que', kual: 'cual', ql: 'cual', tb: 'tambien', tmb: 'tambien', tbn: 'tambien', aki: 'aqui', cdo: 'cuando', qdo: 'cuando', kndo: 'cuando', hra: 'hora', hr: 'hora', ola: 'hola', mu: 'muy', na: 'nada', toa: 'toda', aque: 'a que', enque: 'en que', porque: 'porque', xa: 'para', ehta: 'esta', ehte: 'este', cuantah: 'cuantas', ma: 'mas', nah: 'nada', d: 'de', dl: 'del', x: 'por', ntra: 'nuestra', ntro: 'nuestro', sra: 'senora', sr: 'senor', stmo: 'santisimo', sma: 'santisima', hdad: 'hermandad', cofr: 'cofradia', sto: 'santo', sta: 'santa', ss: 'semana santa', madruga: 'madruga', madrugao: 'madrugada', manana: 'manana', mañana: 'manana' };
  // Variantes de pronunciación: seseo y ceceo, yeísmo, b/v, h muda, «-ao» por «-ado», la «d» final que se come
  const VARIANTES = [[/y/g, 'll'], [/ll/g, 'y'], [/s/g, 'z'], [/z/g, 's'], [/s(?=[ei])/g, 'c'], [/c(?=[ei])/g, 's'], [/j/g, 'g'], [/g(?=[ei])/g, 'j'], [/b/g, 'v'], [/v/g, 'b'], [/h/g, ''], [/^(?=[aeiou])/g, 'h'], [/ao$/g, 'ado'], [/ia$/g, 'ida'], [/io$/g, 'ido'], [/a$/g, 'ada'], [/(?<=[aeiu])$/g, 'd'], [/r$/g, 'l'], [/l$/g, 'r'], [/s$/g, ''], [/(?<=[aeiou])$/g, 's'], [/k/g, 'c'], [/k/g, 'qu'], [/x/g, 'ch'], [/i/g, 'y'], [/rr/g, 'r'], [/(?<=[aeiou])r(?=[aeiou])/g, 'rr']];
  // Formación musical nombrada en la pregunta («marchas de cornetas») → código del índice de marchas
  const FORMACION = [[/\bcornetas?\b|\btambores\b/, 'CT', 'de cornetas y tambores'], [/\bagrupacion(es)? musical(es)?\b|\bagrupacion\b/, 'AM', 'de agrupación musical'], [/\bbandas? de musica\b/, 'BM', 'de banda de música'], [/\bcapillas? musical(es)?\b|\bcapilla\b/, 'CM', 'de capilla musical']];
  const NOMBRE_FORM = { BM: 'banda de música', CT: 'cornetas y tambores', AM: 'agrupación musical', CM: 'capilla musical' };
  const ARTIC = set('el la los las un una al a del de y en o');
  // apodos que no están en el nombre de la ficha (solo los que no admiten duda)
  const APODOS = [['senor de sevilla', 'el-gran-poder-sevilla'], ['los armaos', 'la-macarena-sevilla'], ['la esperanza macarena', 'la-macarena-sevilla']];
  // artículo de los nombres cortos de hermandad que no lo llevan escrito
  const SIN_ART = /^(san |santa (?!cena)|jesus|maria|nuestr[oa] |padre |montesion|montserrat|bellavista|pino montano|medinaceli|mena\b|lagrimas|ecce mater|pasion y muerte|bendicion y esperanza)/;
  const FEM = set('sangre merced paz fe luz cruz salud mar vera');
  const MASC_A = set('via dia');
  const MASC_AS = set('servitas');
  const RE_MARIANA = /^(maria|nuestra senora|ntra|virgen|santa maria|madre de dios|la virgen|dolorosa)|dolorosa|^(la )?(soledad|esperanza|amargura|angustias|dolores|piedad|estrella|paz)\b/;

  // ================= motor =================
  function crearMotor(D, op) {
    op = op || {};
    const BASE = op.base || '/';
    const azar = op.azar || ((l) => l[Math.floor(Math.random() * l.length)]);
    const hoyISO = op.hoy || ((mas) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid' }).format(new Date(Date.now() + (mas || 0) * 864e5)));
    const horaAhora = op.horaAhora || (() => +new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Madrid', hour: 'numeric', hourCycle: 'h23' }).format(new Date()));
    const preferida = op.preferida || (() => null), pagina = op.pagina || (() => null);
    const CIUDADES = {}; // datos por capital cargados a demanda
    const H = D.hermandades, N = H.length, POR_SLUG = new Map(H.map((h) => [h.s, h]));
    const CAPN = new Map(D.capitales.map((c) => [c[0], c[1]]));
    const nombreCiudad = (s) => CAPN.get(s) || s;
    const ctx = { herm: null, ciudad: null, dia: null, intent: null, pend: null, modo: null, imag: null, banda: null };

    // ---- índice de hermandades (IDF) ----
    const df = new Map(), IDX = [];
    const limpiaTok = (l) => l.filter((t) => t.length > 1 && !STOP.has(t) && !GENERICO.has(t)).map(stem);
    for (const h of H) {
      const sinApodo = h.n.replace(/\(.*?\)|«.*?»/g, ' ');
      const apodos = (h.n.match(/\((.*?)\)|«(.*?)»/g) || []).map((x) => norm(x)).filter((x) => x.length > 3);
      const F = new Set(limpiaTok(toks(h.n + ' ' + h.s.replace(/-/g, ' ')).filter((t) => t !== h.c)));
      const M = new Set(limpiaTok(toks(h.t.map((t) => t[0]).join(' '))));
      const W = new Set(limpiaTok(toks(h.se)));
      const full = norm(sinApodo), core = full.replace(/^(la|el|los|las) /, '');
      const frases = [full, core].concat(apodos, apodos.map((a) => a.replace(/^(la|el|los|las) /, ''))).filter((f, i, a) => f.length >= 4 && a.indexOf(f) === i);
      IDX.push({ h, F, M, W, frases });
      for (const t of new Set([...F, ...M, ...W])) df.set(t, (df.get(t) || 0) + 1);
    }
    const idf = (t) => Math.log(N / (df.get(t) || N));
    for (const a of APODOS) { const x = IDX.find((i) => i.h.s === a[1]); if (x) x.frases.push(a[0]); }
    // ---- imagineros y bandas ----
    const I = D.I || [], B = D.B || [];
    const PAL_BANDA = set('banda bandas cornetas tambores musica agrupacion musical asociacion sociedad filarmonica juvenil cultural nuestra senora santisimo santisima cristo padre jesus maria san santa ntra sra de del la las los y municipal');
    const mkIdx = (lista, f, quitar) => { const d = new Map(); const ix = lista.map((x) => { const s = new Set(toks(f(x)).filter((t) => t.length > 2 && !STOP.has(t) && !(quitar && quitar.has(t))).map(stem)); s.forEach((t) => d.set(t, (d.get(t) || 0) + 1)); return s; }); return { ix, d, n: lista.length }; };
    const IIX = mkIdx(I, (x) => x[1]), BIX = mkIdx(B, (x) => x[1], PAL_BANDA);
    // ---- vocabulario para corregir erratas ----
    const VOCAB = new Map(); // palabra normalizada → frecuencia
    const anota = (s) => toks(s).forEach((t) => { if (t.length >= 4) VOCAB.set(t, (VOCAB.get(t) || 0) + 1); });
    H.forEach((h) => { anota(h.n); anota(h.t.map((t) => t[0]).join(' ')); anota(h.se); });
    I.forEach((x) => anota(x[1])); B.forEach((x) => anota(x[1])); D.capitales.forEach((c) => anota(c[1]));
    [...CLAVE, ...DIA_PAL].forEach((t) => { if (t.length >= 4) VOCAB.set(t, (VOCAB.get(t) || 0) + 50); });
    const VOC = [...VOCAB.keys()];
    const conocida = (t) => t.length < 4 || /\d/.test(t) || STOP.has(t) || GENERICO.has(t) || VOCAB.has(t) || VOCAB.has(stem(t)) || STOP.has(stem(t));
    // una o dos variantes de pronunciación que den una palabra conocida («tayo» → «tallo», «esperansa» → «esperanza», «sebiya» → «sevilla»)
    const exacta = (v) => VOCAB.has(v) || STOP.has(v) || VOCAB.has(stem(v));
    function variantes(t) {
      const out = [];
      for (const [re, x] of VARIANTES) { re.lastIndex = 0; let m; const rr = new RegExp(re.source, 'g'); while ((m = rr.exec(t))) { out.push(t.slice(0, m.index) + x + t.slice(m.index + m[0].length)); if (!m[0].length) rr.lastIndex++; } }
      return out.filter((v, i) => v !== t && out.indexOf(v) === i);
    }
    function porVariante(t) {
      if (t.length < 3 || /\d/.test(t)) return null;
      const v1 = variantes(t), peso = (v) => (VOCAB.get(v) || VOCAB.get(stem(v)) || 1);
      let ok = v1.filter(exacta);
      if (!ok.length && t.length >= 5) { const v2 = []; v1.forEach((v) => variantes(v).forEach((w) => { if (w !== t && exacta(w)) v2.push(w); })); ok = v2; }
      return ok.length ? ok.sort((a, b) => peso(b) - peso(a))[0] : null;
    }
    function corrige(t) {
      if (conocida(t)) return t;
      const pv = porVariante(t); if (pv) return pv;
      const max = t.length >= 8 ? 2 : 1; let mejor = null, md = max + 1, mf = 0;
      for (const v of VOC) {
        if (v[0] !== t[0] || Math.abs(v.length - t.length) > max) continue;
        const d = distancia(t, v, max);
        if (d < md || (d === md && VOCAB.get(v) > mf)) { md = d; mejor = v; mf = VOCAB.get(v); }
      }
      return md <= max ? mejor : t;
    }

    // ---- fechas y jornadas ----
    const ORDEN = D.dias || [];
    const masDias = (iso, n) => new Date(Date.parse(iso + 'T00:00:00Z') + n * 864e5).toISOString().slice(0, 10);
    const fechaLarga = (iso) => new Intl.DateTimeFormat('es-ES', { timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso + 'T00:00:00Z'));
    const fechaCorta = (iso) => new Intl.DateTimeFormat('es-ES', { timeZone: 'UTC', day: 'numeric', month: 'long' }).format(new Date(iso + 'T00:00:00Z'));
    // «desde Basílica de…» → «desde la Basílica de…»
    const conArt = (s) => (/^(iglesia|bas[ií]lica|parroquia|capilla|ermita|catedral|casa|colegiata|real parroquia|santa iglesia|insigne)/i.test(s) ? 'la ' : /^(convento|santuario|oratorio|templo|monasterio|colegio|real santuario|antiguo)/i.test(s) ? 'el ' : '') + s;
    const diasHasta = (iso) => Math.round((Date.parse(iso) - Date.parse(hoyISO(0))) / 864e5);
    const CANON = ['Viernes de Dolores', 'Sábado de Pasión', 'Domingo de Ramos', 'Lunes Santo', 'Martes Santo', 'Miércoles Santo', 'Jueves Santo', 'Madrugá', 'Viernes Santo', 'Sábado Santo', 'Domingo de Resurrección'];
    function jornadaDeFecha(iso) {
      const l = CANON.filter((d) => D.fechas[d] === iso);
      if (l.length > 1) return horaAhora() < 7 && l.indexOf('Madrugá') >= 0 ? 'Madrugá' : l.filter((d) => d !== 'Madrugá')[0];
      return l[0] || null;
    }
    // fecha de una jornada dicha como se dice: la Madrugá es «la noche del 25 al 26 de marzo»
    const diaDe = (iso) => +iso.slice(8, 10);
    function cuandoCae(d, larga) {
      const f = D.fechas[d]; if (!f) return '';
      if (d === 'Madrugá' || d === 'Jueves Santo y Madrugada') { const v = masDias(f, -1); return 'la noche del ' + diaDe(v) + (v.slice(5, 7) === f.slice(5, 7) ? '' : ' de ' + fechaCorta(v).replace(/^\d+ de /, '')) + ' al ' + (larga ? fechaLarga(f) : fechaCorta(f)); }
      return 'el ' + (larga ? fechaLarga(f) : fechaCorta(f));
    }
    const delDia = (d) => (d === 'Madrugá' ? 'de la Madrugá' : 'del ' + d);
    const art = (d) => (d === 'Madrugá' ? 'la Madrugá' : d === 'Vísperas' ? 'en las Vísperas' : d === 'Jueves Santo y Madrugada' ? 'el Jueves Santo (y la Madrugada)' : /^Hermandades/.test(d) ? 'en ' + d.toLowerCase() : 'el ' + d);
    const minutos = (t) => { const m = /^(\d{1,2}):(\d{2})/.exec(t || ''); if (!m) return null; const v = +m[1] * 60 + +m[2]; return v < 360 ? v + 1440 : v; };

    // ---- enlaces ----
    const L = {
      herm: (h) => BASE + 'hermandad/' + h.s + '/', banda: (s) => BASE + 'banda/' + s + '/', imag: (s) => BASE + 'imaginero/' + s + '/', marcha: (s) => BASE + 'marcha/' + s + '/',
      capital: (c) => BASE + 'semana-santa/' + c + '/', noticias: (c) => BASE + 'noticias/?ciudad=' + c, buscar: (q) => BASE + 'buscar/?q=' + encodeURIComponent(q),
      calle: (c, d) => BASE + 'en-la-calle/' + c + '/' + (d ? '?dia=' + encodeURIComponent(diaEnCiudad(c, d)) : ''),
      compositor: (s) => BASE + 'compositor/' + s + '/', marchas: () => BASE + 'marchas/',
      // «Sugerir»: el formulario de Colabora con la pregunta ya escrita (y la hermandad, si la hay)
      sugerir: (q, h) => BASE + 'colabora/?texto=' + encodeURIComponent(('Pregunta a erCuñao: ' + String(q || '')).slice(0, 400)) + (h ? '&nombre=' + encodeURIComponent(h.n + ' (' + nombreCiudad(h.c) + ')') + '&capital=' + h.c : ''),
    };
    // nombre exacto de la jornada tal como lo usa esa ciudad (p. ej. «Jueves Santo y Madrugada»)
    function diaEnCiudad(c, d) { const g = grupo(d); if (H.some((h) => h.c === c && h.d === d)) return d; const o = H.find((h) => h.c === c && g.indexOf(h.d) >= 0); return o ? o.d : d; }

    // ---- respuesta ----
    function Resp() { return { partes: [], texto: '', enlaces: [], chips: [], necesita: null, accion: null }; }
    const P = (r, x) => { r.partes.push({ t: 'p', x }); return r; };
    const LI = (r, items) => { r.partes.push({ t: 'lista', items }); return r; };
    const A = (r, l) => { l = l.filter(Boolean); if (l.length) r.partes.push({ t: 'acc', l }); return r; };
    const C = (r, l) => { r.chips = l.filter(Boolean).map((x) => (Array.isArray(x) ? x : [x, x])); return r; };
    function cerrar(r) {
      r.partes.forEach((p) => { if (p.t === 'p') p.x = p.x.replace(/de El /g, 'del ').replace(/a El /g, 'al '); });
      r.texto = r.partes.map((p) => (p.t === 'p' ? p.x : p.t === 'lista' ? p.items.map((i) => i.x + (i.sub ? ' · ' + i.sub : '')).join('\n') : '')).join('\n');
      r.enlaces = [].concat(...r.partes.filter((p) => p.t === 'acc').map((p) => p.l), ...r.partes.filter((p) => p.t === 'lista').map((p) => p.items.filter((i) => i.href).map((i) => [i.x, i.href])));
      return r;
    }
    const necesita = (c) => { const r = Resp(); r.necesita = [c]; return r; };
    const necesitaVarios = (l) => { const r = Resp(); r.necesita = l; return r; };
    // palabras de la propia pregunta que no cuentan como título de marcha
    const PAL_PREG = set('marcha marchas compuso compusieron compositor compositora autor autora quien hizo escribio escribieron toca tocan banda dedicada dedicadas cornetas tambores agrupacion musical musica capilla procesional');
    const tengoCiudad = (c) => !!CIUDADES[c];

    // ================= comprensión =================
    function entender(raw) {
      let n = norm(raw);
      // habla andaluza y abreviaturas de móvil, palabra a palabra («ande», «ar», «er», «q», «pa»)
      n = n.split(' ').map((t) => (Object.prototype.hasOwnProperty.call(ANDALUZ, t) ? ANDALUZ[t] : t)).join(' ');
      for (const [re, x] of SINONIMOS) n = n.replace(re, x);
      // erratas: palabra a palabra contra el vocabulario del portal
      n = n.split(' ').map(corrige).join(' ');
      const e = { raw, t: n, usadas: new Set() };
      // ciudad (nombre o gentilicio)
      for (const [s, nom] of D.capitales) { const k = norm(nom); if (new RegExp('\\b' + k + '\\b').test(n)) { e.ciudad = s; e.usadas.add(k); } }
      if (!e.ciudad) for (const [g, s] of GENTILICIO) { const m = new RegExp('\\b(' + g + '\\w*)').exec(n); if (m) { e.ciudad = s; e.usadas.add(m[1]); } }
      // jornada (frase o relativa)
      let m;
      const sinFranja = n.replace(/\b(por|de) la manana\b|\besta manana\b/g, ' ');
      if (/\bpasado manana\b/.test(n)) e.diaRel = 2; else if (/\bmanana\b/.test(sinFranja)) e.diaRel = 1; else if (/\b(hoy|ahora|esta noche|esta tarde|esta manana|ahora mismo)\b/.test(n)) e.diaRel = 0; else if (/\bayer\b/.test(n)) e.diaRel = -1;
      // fecha con día y mes («el domingo 8 de noviembre»): manda sobre el nombre del día
      const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
      if ((m = /\b(\d{1,2}) de (enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)\b/.exec(n))) {
        const hoy = hoyISO(0), mes = Math.max(MESES.indexOf(m[2]), m[2] === 'setiembre' ? 8 : -1) + 1, d = +m[1];
        let y = +hoy.slice(0, 4); const iso = (yy) => yy + '-' + String(mes).padStart(2, '0') + '-' + String(d).padStart(2, '0');
        if (iso(y) < hoy) y++;
        if (d >= 1 && d <= 31) { e.fechaISO = iso(y); delete e.diaRel; }
      }
      if (/\b(el|al) dia siguiente\b|\bel siguiente\b|\bdespues\b/.test(n)) e.diaSig = true;
      // sin la jornada, el texto no casa con una hermandad del mismo nombre («el Sábado de Pasión» no es la hermandad de Pasión)
      for (const [f, d] of DIA_FRASES) if ((m = new RegExp('\\b' + f + '\\b').exec(n))) { if (e.fechaISO && f.indexOf(' ') < 0) { e.usadas.add(f); break; } e.dia = d; f.split(' ').forEach((w) => e.usadas.add(w)); if (f.indexOf(' ') > 0) e.tSinDia = n.replace(m[0], ' ').replace(/\s+/g, ' ').trim(); break; }
      // el «domingo» a secas, con resurrección delante, es el de Pascua
      if (e.dia === 'Domingo de Ramos' && /\bresurreccion\b/.test(n) && !/\bramos\b/.test(n)) e.dia = 'Domingo de Resurrección';
      e.intent = intencion(n);
      // franja horaria: «antes de las 19:00», «después de las 8 de la tarde», «entre las 17 y las 19», «por la mañana»
      const hm = (h, mi, fr) => { let x = +h; if (x > 24 || (mi && +mi > 59)) return null; if (fr && /tarde|noche/.test(fr) && x < 12) x += 12; return x * 60 + (+mi || 0); };
      if ((m = /\bentre las? (\d{1,2})(?: (\d{2}))?(?: (?:h|horas))? y las? (\d{1,2})(?: (\d{2}))?(?: (?:h|horas))?(?: de la (manana|tarde|noche))?/.exec(n))) { e.desde = hm(m[1], m[2], m[5]); e.hasta = hm(m[3], m[4], m[5]); }
      else {
        if ((m = /\b(?:antes de|hasta) las? (\d{1,2})(?: (\d{2}))?(?: (?:h|horas))?(?: de la (manana|tarde|noche))?/.exec(n))) e.hasta = hm(m[1], m[2], m[3]);
        if ((m = /\b(?:despues de|a partir de|desde) las? (\d{1,2})(?: (\d{2}))?(?: (?:h|horas))?(?: de la (manana|tarde|noche))?/.exec(n))) e.desde = hm(m[1], m[2], m[3]);
      }
      if (e.desde == null && e.hasta == null && (m = /\b(por la|esta) (manana|tarde|noche)\b/.exec(n))) { if (m[2] === 'manana') { e.desde = 360; e.hasta = 14 * 60; } else if (m[2] === 'tarde') { e.desde = 14 * 60; e.hasta = 21 * 60; } else e.desde = 21 * 60; e.franja = m[1] + ' ' + (m[2] === 'manana' ? 'mañana' : m[2]); }
      if (e.desde != null || e.hasta != null) e.tFiltro = true;
      for (const [re, k, txt] of FORMACION) if (re.test(n)) { e.form = k; e.formTxt = txt; break; }
      e.toks = n.split(' ').filter((t) => t && !e.usadas.has(t) && !CLAVE.has(t));
      e.toksB = n.split(' ').filter((t) => t && !e.usadas.has(t));
      // segmento de lugar: «pasa por X», «llega a X»
      const pm = /\b(?:pasa|pasan|pasara|llega|llegan|esta|estara)\s+(?:por|a|en)\s+(?!donde\b)(.+)$/.exec(n) || /\b(?:ver(?:la|lo|las|los)?|veo)\s+(?:por|en)\s+(?!donde\b)(.+)$/.exec(n) || /\bpor\s+(?!donde\b)((?:la |el |los |las )?(?:calle |plaza |avenida |avda )?\w+(?: \w+){0,5})$/.exec(n);
      if (pm && (e.intent === 'pasapor' || e.intent === 'hora' || e.intent === 'cerca')) { e.lugar = pm[1]; if (e.intent !== 'pasapor') e.intent = 'pasapor'; }
      return e;
    }
    function intencion(n) {
      const T = (re) => re.test(n);
      if (T(/^(hola|buenas|buenos dias|buenas tardes|buenas noches|que pasa|que tal|ey|hey|saludos|ole)\b/) && n.split(' ').length < 5) return 'hola';
      if (T(/\b(gracias|grasias|genial|perfecto|estupendo|ole tu|muy bien)\b/) && n.split(' ').length < 6) return 'gracias';
      if (T(/\b(quien eres|que eres|como te llamas|eres una? (ia|robot|bot|maquina))\b/)) return 'quien';
      if (T(/\b(que sabes( hacer)?|que puedes hacer|ayuda|ayudame|como funciona|que te puedo preguntar)\b/) || (T(/\binstrucciones\b/) && n.split(' ').length <= 3)) return 'ayuda';
      if (T(/\b(error|errores|equivocad\w*|sugerencia|sugerir|corregir|avisar de|aviso|un dato (esta )?mal|esta mal|falta (un|una|informacion|algo|el|la)\b|tengo una idea|enviar una sugerencia)/) && !T(/cuanto falta/)) return 'sugerencia';
      if (T(/\b(carrera oficial|tribuna)\b/) && T(/\b(llega|llegan|pasa|pasan|entra|entran|hora|cuando)\b/)) return 'carrera';
      if (T(/\b(extraordinari\w*|besamanos|besapies|via ?crucis|triduo|quinario|septenario|novena|traslados?|conciertos?|pregon|cartel|agenda|esta semana|este mes|proxim[oa]s? (dias|semanas|actos|cultos|salidas|procesiones)|cultos?)\b/) && !T(/\b(fin de semana|finde)\b/)) return 'agenda';
      if (T(/\b(cuanto|cuantos dias|cuantas semanas) (falta|faltan|queda|quedan)\b|\bcuenta atras\b|\bcuando (es|empieza|cae|sera|son|llega)\b(?!.*\b(sale|salen|pasa|entra)\b)|\bque (fecha|dia) (es|cae|empieza)\b|\ben que fecha\b/)) return 'falta';
      if (T(/\b(fin de semana|finde)\b/)) return 'finde';
      if (T(/\b(una|otra|alguna) curiosidad\b|\bdato curioso\b|\bsorprendeme\b|\bcuentame algo\b/)) return 'curiosidad';
      if (T(/\bmas (antigua|antiguas|antiguo|vieja|viejas)\b|\bla primera (en fundarse|fundada)\b/)) return 'antigua';
      if (T(/\bcuant[oa]s (nazarenos|costaleros|hermanos|penitentes|musicos|cirios|personas|kilos|metros|varales)\b|\b(numero|cantidad) de (nazarenos|costaleros|hermanos|penitentes)\b|\bcuanto (pesa|mide|cuesta)\b|\b(telefono|telefonos|movil|whatsapp|correo|email|e mail)\b/)) return 'sinDato';
      if (T(/\bcuant[oa] (dura|tarda|esta en la calle)\b|\bcuantas horas\b|\bcuanto tiempo\b|\bduracion\b/)) return 'duracion';
      if (T(/\b(noticias?|novedad(es)?|actualidad|ultima hora|que se sabe)\b/)) return 'noticias';
      if (T(/\bnombre (oficial|completo|entero|largo)\b|\bcomo se llama (oficialmente|entera|completa|de verdad)\b|\btitulo (oficial|completo)\b/)) return 'oficial';
      if (T(/\b(compuso|compusieron|ha compuesto|han compuesto|compositor\w*|escribio la marcha)\b|\bmarcha\b.*\b(autor|quien (la |lo )?(hizo|escribio))\b|\b(autor|quien (la |lo )?(hizo|escribio)) de la marcha\b|\bde quien es la marcha\b/)) return 'compositor';
      if (T(/\bmarchas?\b.*\b(toca|tocan|tocaba|tocara|interpreta\w*)\b|\brepertorio\b|^(y )?que (toca|tocan)\b/)) return 'repertorio';
      if (T(/\b(habito|habitos|tunica|tunicas|capirote|capirotes|antifaz|antifaces|cingulo|cinturon|esparto|como (visten|van vestidos|se visten|van los nazarenos)|nazarenos? (visten|llevan|van)|de que color|color(es)? de (la|las|los|el|su|sus)? ?(tunica|habito|nazareno|capirote))\b/)) return 'habito';
      if (T(/\b(orden de (paso|salida)|en que orden|en que (lugar|puesto|posicion) (sale|va)|(la |el |cual es la |cual es el |quien es la |quien sale )?(primera|primero|ultima|ultimo) (cofradia|hermandad|procesion|que sale|en salir|en entrar|en recogerse|de la semana|del dia)|cual sale (antes|primero|despues|ultima|ultimo|mas tarde|mas temprano)|sale (mas tarde|mas temprano|mas pronto)|quien (abre|cierra) la semana)\b/)) return 'orden';
      if (T(/\b(cuant[ao]s) (hermandades|hermandad|cofradias|salen|hay|tiene|procesiones|pasos salen)\b|\bnumero de (hermandades|cofradias)\b/)) return 'cuantas';
      if (T(/\b(quien es|quien era|quien fue|biografia|obras de|que obras|obra de|que (ha )?(tallado|hecho)|que hizo|que tallo)\b/) && !T(/\bquien (lo |la |le )?(tallo|hizo|esculpio)\b/)) return 'imaginero';
      if (T(/\b(quien (lo |la |los |las |le )?(tallo|hizo|talla|esculpio|realizo|labro)|autor|autora|imaginer\w*|escultor\w*|tallad\w*|talla de|tallo|de quien es)\b/)) return 'autor';
      if (T(/\bmarchas?\b|\bdedicad\w*\b|\bque (suena|suenan)\b/)) return 'marchas';
      if (T(/\b(banda|bandas|musica|acompan\w*|toca|tocan|cornetas|tambores|agrupacion musical|capilla musical|banda de musica)\b/)) return 'banda';
      if (T(/^(y )?(por )?donde (pasa|pasan|pasara|pasaran|va a pasar|discurre)\b(?!.*\b(por|ahora)\b)/)) return 'recorrido';
      if (T(/\b(cerca de mi|cerca|donde (la |lo |las |los )?(puedo )?(ver|veo|verla|verlo|pillo|pillarla)|por donde va|donde va|donde esta ahora|mapa|en la calle|ubicacion|localiza\w*|en directo|en vivo)\b/)) return 'cerca';
      if (T(/\b(recorrido|recorridos|itinerario|itinerarios|ruta|por donde (pasa|pasara|discurre|transcurre|va a pasar|pasan)|que calles|por que calles)\b/)) return 'recorrido';
      if (T(/\b(carrera oficial|catedral|estacion de penitencia|tribuna)\b/)) return 'carrera';
      if (T(/\b(pasa|pasan|pasara|llega|llegan)\b.*\b(por|a)\b(?! donde)|\bcuando (pasa|llega|esta) (por|en)\b/)) return 'pasapor';
      if (T(/\bla campana\b/)) return 'carrera';
      if (T(/\b(entra|entran|entrada|recogida|se recoge|recoge|encierro|vuelve|regresa|termina|acaba)\b/)) return 'entrada';
      if (T(/\b(que dia sale|que dia salen|que jornada|cuando sale|cuando salen|que dia procesiona)\b/)) return 'cuando';
      if (T(/\b(a que hora|que hora|hora|horario|horas)\b/)) return 'hora';
      if (T(/\b(sede|donde (esta|tiene|se encuentra|reside|para)|templo|iglesia|parroquia|capilla|basilica|de donde sale|desde donde sale|donde sale)\b/)) return 'sede';
      if (T(/\b(historia|fundad\w*|fundacion|se fundo|antigu\w*|origen|curiosidad\w*|anecdota)\b/)) return 'historia';
      if (T(/\b(cuantos pasos|que pasos|misterio|palio|paso|pasos|costaler\w*|varal\w*)\b/)) return 'pasos';
      if (T(/\b(web|pagina|internet|contacto)\b/)) return 'web';
      if (T(/\b(titulares|titular|que imagenes|imagenes|que (cristo|virgen|cristos|virgenes)|quien sale)\b/)) return 'titulares';
      if (T(/\b(que (sale|salen|hay|procesiona)|quienes salen|quien sale|salen|cofradias|hermandades|procesiones|programa)\b/)) return 'lista';
      return null;
    }
    // hermandades candidatas con su puntuación
    function buscarHerm(e, opts) {
      opts = opts || {};
      const q = (opts.toks || e.toks).filter((t) => t.length > 1 && !STOP.has(t) && !GENERICO.has(t)).map(stem);
      const dias = e.dia ? grupo(e.dia) : null;
      const puntua = (filtroCiudad) => {
        const out = [];
        for (const x of IDX) {
          if (filtroCiudad && x.h.c !== filtroCiudad) continue;
          let s = 0, frase = null; const usadas = [];
          for (const t of new Set(q)) { const w = x.F.has(t) ? 1 : x.M.has(t) ? 0.7 : x.W.has(t) ? 0.35 : 0; if (w) { s += w * idf(t); usadas.push(t); } }
          for (const f of x.frases) if (new RegExp('(^| )' + f + '( |$)').test(e.tSinDia != null ? e.tSinDia : e.t)) { s += f.indexOf(' ') > 0 && APODOS.some((a) => a[0] === f) ? 8 : 4; frase = f; break; }
          if (s <= 0) continue;
          if (dias && (dias.indexOf(x.h.d) >= 0 || (x.h.x || []).some((v) => dias.indexOf(v[0]) >= 0))) s += 1;
          if (!filtroCiudad && ctx.ciudad === x.h.c) s += 0.4;
          else if (!filtroCiudad && pagina() === x.h.c) s += 0.3;
          out.push({ h: x.h, s, usadas, frase });
        }
        return out.filter((r) => r.s >= 2.2).sort((a, b) => b.s - a.s);
      };
      let res = e.ciudad ? puntua(e.ciudad) : puntua(null);
      if (!res.length && e.ciudad) { const f = puntua(null); return { lista: [], fuera: f.length ? f.filter((x) => x.s >= f[0].s - 0.9).slice(0, 4) : null }; }
      if (!res.length) return { lista: [] };
      const top = res[0].s, cerca = res.filter((r) => r.s >= top - 0.9);
      if (cerca.length > 1 && !e.ciudad) {
        // empate entre ciudades: manda la del contexto o la preferida del visitante
        for (const c of [ctx.ciudad, pagina(), preferida()]) { const en = cerca.filter((r) => r.h.c === c); if (c && en.length === 1) return { lista: res, elegida: en[0] }; }
      }
      return { lista: res, elegida: cerca.length === 1 ? res[0] : null, dudas: cerca.length > 1 ? cerca.slice(0, 8) : null };
    }
    function buscarEn(ix, e, minimo) {
      const q = (ix === BIX && e.toksB ? e.toksB : e.toks).filter((t) => t.length > 2 && !STOP.has(t)).map(stem);
      const res = ix.ix.map((s, i) => { let p = 0, k = 0; for (const t of new Set(q)) if (s.has(t)) { p += Math.log(ix.n / ix.d.get(t)) + 1; k++; } return { i, p, k }; }).filter((r) => r.k && r.p >= minimo).sort((a, b) => b.p - a.p || b.k - a.k || ix.ix[a.i].size - ix.ix[b.i].size);
      return res;
    }

    // ================= respuestas =================
    const PREF = ['', '', 'Apunta, cuñao: ', 'Esa me la sé: ', 'Facilito: '];
    const horaTxt = (t, exacta) => (exacta ? 'a las ' : 'hacia las ') + t;
    function salidaTxt(h) {
      if (h.h) return horaTxt(h.h, true);
      if (h.r) return horaTxt(h.r[0], h.r[1]);
      return '';
    }
    function chipsHerm(h, actual) {
      const c = [['¿Por dónde pasa?', 'recorrido'], ['¿Qué banda lleva?', 'banda'], ['¿Quién talló sus imágenes?', 'autor'], ['¿Dónde la veo?', 'cerca'], ['¿A qué hora sale?', 'hora'], ['¿Y su historia?', 'historia']]
        .filter((x) => x[1] !== actual && !(x[1] === 'banda' && !h.b && !h.mu) && !((x[1] === 'recorrido' || x[1] === 'cerca') && !h.r)).slice(0, 3).map((x) => x[0]);
      return c;
    }
    // Nombre con su artículo y su preposición: «del Cautivo», «de la Esperanza de Triana», «al Cachorro», «de San Bernardo»
    function articulo(h) {
      const m = /^(El|La|Los|Las) /.exec(h.n); if (m) return [m[1].toLowerCase(), h.n.slice(m[0].length)];
      const k = norm(h.n); if (SIN_ART.test(k) || h.s === 'pasion-sevilla') return ['', h.n];
      const w = k.split(' '), p = /^(dos|tres|cuatro|cinco|siete)$/.test(w[0]) && w[1] ? w[1] : w[0];
      if (/s$/.test(p) && !/^(jesus|cristus)$/.test(p)) return [/as$/.test(p) && !MASC_AS.has(p) ? 'las' : 'los', h.n];
      return [(/(a|ion|dad|tud|umbre)$/.test(p) || FEM.has(p)) && !MASC_A.has(p) ? 'la' : 'el', h.n];
    }
    function nom(h, prep) {
      const [a, n] = articulo(h), P_ = (prep || '').toLowerCase();
      const t = P_ === 'de' && a === 'el' ? 'del ' + n : P_ === 'a' && a === 'el' ? 'al ' + n : (P_ ? P_ + ' ' : '') + (a ? a + ' ' : '') + n;
      return prep && prep[0] !== prep[0].toLowerCase() ? cap1(t) : t;
    }
    function cabecera(h, prep) { return nom(h, prep) + ' (' + nombreCiudad(h.c) + ')'; }
    const Cab = (h) => cap1(cabecera(h));
    // «Apunta, cuñao: el Cautivo…» (tras los dos puntos, en minúscula)
    const conPref = (h) => { const p = azar(PREF); return p ? p + cabecera(h) : Cab(h); };
    function enlacesHerm(h, conMapa) {
      return [['Ver la ficha', L.herm(h)], conMapa && D.mapa.indexOf(h.c) >= 0 && h.r ? ['Verla en el mapa', L.calle(h.c, h.d)] : null];
    }
    function respHerm(h, intent, e) {
      const r = Resp(), c = nombreCiudad(h.c);
      const req = ['recorrido', 'pasapor', 'historia', 'pasos', 'marchas', 'habito', 'oficial', 'agenda'].indexOf(intent) >= 0;
      if (req && !tengoCiudad(h.c)) return necesita(h.c);
      const CD = CIUDADES[h.c];
      ctx.herm = h.s; ctx.ciudad = h.c; ctx.intent = intent; ctx.pend = null;
      r.ia = { h: [h.s] };
      const sal = salidaTxt(h);
      const mismoDia = () => H.filter((x) => x.c === h.c && x.d === h.d).sort((a, b) => (a.o || 99) - (b.o || 99));
      switch (intent) {
        case 'habito': {
          const ha = (CD.ha || {})[h.s] || ['', ''], fu = ha[1] ? ['Fuente oficial', ha[1]] : null;
          if (ha[0]) { P(r, 'Hábito de los nazarenos ' + cabecera(h, 'de') + ':'); P(r, ha[0]); }
          else { P(r, 'Del hábito ' + cabecera(h, 'de') + ' no tengo la descripción oficial, y no me la voy a inventar.' + (fu ? ' Viene en la fuente oficial de la hermandad, que te dejo aquí.' : '') + ' Si la conoces, mándamela con su fuente.'); r.flojo = true; A(r, [fu, ['Ver la ficha', L.herm(h)], ['Sugerir', L.sugerir(e.raw || '', h)]]); break; }
          A(r, [['Ver la ficha', L.herm(h)], fu]); break;
        }
        case 'oficial': {
          const on = (CD.on || {})[h.s];
          P(r, on ? 'El nombre oficial ' + cabecera(h, 'de') + ' es: ' + on + '.' : '' + cabecera(h, 'De') + ' no tengo el nombre oficial completo.');
          A(r, [['Ver la ficha', L.herm(h)]]); break;
        }
        case 'duracion': {
          if (h.r) {
            const ini = minutos(h.r[0]); let fin = minutos(h.r[2]); if (fin < ini) fin += 1440; const d = fin - ini;
            if (d > 0) P(r, Cab(h) + ' está unas ' + Math.floor(d / 60) + ' h' + (d % 60 ? ' y ' + (d % 60) + ' min' : '') + ' en la calle: sale ' + horaTxt(h.r[0], h.r[1]) + ' y se recoge ' + horaTxt(h.r[2], h.r[3]) + ' (itinerario ' + (D.anio - 1) + ').');
            else P(r, 'Con el itinerario que tengo no me salen las cuentas de cuánto está en la calle ' + cabecera(h) + '.');
          } else { P(r, 'No tengo la hora de recogida ' + cabecera(h, 'de') + ', así que no sé cuánto está en la calle.' + (sal ? ' Sale ' + art(h.d) + ' ' + sal + '.' : '')); r.flojo = true; }
          A(r, enlacesHerm(h, true)); break;
        }
        case 'orden': {
          const l = mismoDia(), i = l.indexOf(h);
          P(r, Cab(h) + ' es la ' + (i + 1) + '.ª de las ' + l.length + ' cofradías ' + delDia(h.d) + ' en ' + c + ', en el orden de paso de la jornada' + (sal ? '. Sale ' + sal : '') + '.');
          if (i > 0) P(r, 'Antes sale ' + l[i - 1].n + (l[i - 1].h ? ' (' + l[i - 1].h + ')' : '') + '.');
          if (i < l.length - 1) P(r, 'Después sale ' + l[i + 1].n + (l[i + 1].h ? ' (' + l[i + 1].h + ')' : '') + '.');
          A(r, enlacesHerm(h, true)); break;
        }
        case 'sinDato': {
          if (/\b(telefono|telefonos|movil|whatsapp|correo|email|e mail)\b/.test(e.t || '')) { P(r, 'El teléfono y el correo ' + cabecera(h, 'de') + ' no los tengo, cuñao.' + (h.w ? ' Lo que sí tengo es su web oficial, donde suelen venir:' : '')); A(r, [h.w ? [h.w.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, ''), h.w] : null, ['Ver la ficha', L.herm(h)]]); break; }
          P(r, 'Ese dato ' + cabecera(h, 'de') + ' no lo tengo, cuñao, y no me lo voy a inventar. Si lo sabes con su fuente, mándamelo y lo añadimos.');
          r.flojo = true; A(r, [['Ver la ficha', L.herm(h)], ['Sugerir', L.sugerir(e.raw || '', h)]]); break;
        }
        case 'agenda': {
          const ag = (CD.ag || []).filter((x) => x[4] === h.s);
          if (ag.length) { P(r, 'Lo próximo que tengo ' + cabecera(h, 'de') + ':'); LI(r, ag.slice(0, 8).map((x) => ({ x: x[3], sub: fechaCorta(x[0]) + (x[1] ? ' · ' + x[1] : '') }))); }
          else { P(r, 'No tengo actos próximos ' + cabecera(h, 'de') + ' en la agenda.'); r.flojo = true; }
          A(r, [['Ver el calendario', BASE + 'calendario/'], ['Ver la ficha', L.herm(h)]]); break;
        }
        case 'hora': case 'cuando': {
          P(r, conPref(h) + ' sale ' + art(h.d) + (sal ? ' ' + sal : '') + (h.se ? ' desde ' + conArt(h.se) : '') + '.');
          if (!sal) P(r, 'La hora de salida aún no la tengo, y no me la voy a inventar.');
          else if (!h.h && h.r) P(r, 'La hora sale del itinerario de ' + (D.anio - 1) + '; cuando se publique el de ' + D.anio + ' se actualiza.');
          (h.x || []).forEach((x) => P(r, 'Además, ' + art(x[0]) + ' sale ' + (x[3] || 'una imagen') + (x[1] ? ' a las ' + x[1] : '') + (x[2] ? ' desde ' + conArt(x[2]) : '') + '.'));
          if (D.fechas[h.d]) P(r, cap1(art(h.d)) + ' de ' + D.anio + (h.d === 'Madrugá' ? ' es ' : ' cae ') + cuandoCae(h.d) + '.');
          A(r, enlacesHerm(h, true)); break;
        }
        case 'sede': {
          P(r, h.se ? 'La sede ' + cabecera(h, 'de') + ' es ' + conArt(h.se) + '. De allí sale ' + art(h.d) + (sal ? ' ' + sal : '') + '.' : 'No tengo apuntada la sede ' + cabecera(h, 'de') + '.');
          A(r, enlacesHerm(h, false)); break;
        }
        case 'autor': {
          const sel = /\b(virgen|dolorosa|palio|maria|senora|ella)\b/.test(e.t) ? 'v' : /\b(cristo|senor|jesus|nazareno|crucificado|misterio|el)\b/.test(e.t) && /\b(cristo|senor|jesus|nazareno|crucificado|misterio)\b/.test(e.t) ? 'c' : null;
          let ts = h.t.filter((t) => !sel || (sel === 'v') === RE_MARIANA.test(norm(t[0])));
          if (!ts.length) ts = h.t;
          if (!ts.length) { P(r, 'No tengo apuntados los titulares ' + cabecera(h, 'de') + '.'); break; }
          P(r, (ts.length === 1 ? 'La imagen ' : 'Las imágenes ') + cabecera(h, 'de') + ':');
          LI(r, ts.map((t) => ({ x: t[0], sub: t[1] || 'autor sin documentar en mis datos', href: t[2] >= 0 && I[t[2]] ? L.imag(I[t[2]][0]) : '' })));
          const im = ts.find((t) => t[2] >= 0); if (im) ctx.imag = im[2];
          A(r, [['Ver la ficha', L.herm(h)], im ? ['Más de ' + I[im[2]][1], L.imag(I[im[2]][0])] : null]); break;
        }
        case 'banda': {
          if (h.b && h.b.length) {
            const pasos = h.b.filter((p) => p[1].length);
            if (pasos.length === 1 && !pasos[0][0]) P(r, cap1(cabecera(h, 'a')) + ' le pone música: ' + lista(pasos[0][1].map((i) => B[i][1])) + '.');
            else { P(r, 'La música ' + cabecera(h, 'de') + (h.ba ? ', acompañamientos de ' + h.ba : '') + ':'); LI(r, pasos.map((p) => ({ x: p[0] || 'Acompañamiento', sub: p[1].map((i) => B[i][1]).join(' · ') }))); }
            const con = [].concat(...pasos.map((p) => p[1])).filter((i) => B[i][0]);
            if (con.length) ctx.banda = con[0];
            A(r, [['Ver la ficha', L.herm(h)], con.length ? ['Ver ' + (B[con[0]][1].length > 34 ? 'la banda' : B[con[0]][1]), L.banda(B[con[0]][0])] : null]);
          } else if (h.mu) { P(r, '' + cabecera(h, 'De') + ' tengo apuntado esto: ' + h.mu); A(r, [['Ver la ficha', L.herm(h)]]); }
          else { P(r, 'No tengo el acompañamiento musical ' + cabecera(h, 'de') + '. Si lo sabes, cuéntamelo y lo añadimos.'); r.flojo = true; A(r, [['Ver la ficha', L.herm(h)], ['Sugerir', L.sugerir(e.raw || '', h)]]); C(r, chipsHerm(h, intent)); return cerrar(r); }
          break;
        }
        case 'marchas': {
          const todas = (CD.m || {})[h.s] || [], m = e.form ? todas.filter((x) => x[4] === e.form) : todas;
          if (e.form && todas.length && !m.length) P(r, 'De ' + e.formTxt.replace(/^de /, '') + ' no tengo ninguna dedicada ' + cabecera(h, 'a') + '; de otras formaciones, ' + todas.length + '.');
          if (m.length) {
            P(r, 'Marchas ' + (e.form ? e.formTxt + ' ' : '') + 'dedicadas ' + cabecera(h, 'a') + ' (' + m.length + '):');
            LI(r, m.slice(0, 8).map((x) => ({ x: '«' + x[0] + '»', sub: [x[1], x[2]].filter(Boolean).join(', '), href: x[3] ? L.marcha(x[3]) : '' })));
            if (m.length > 8) P(r, 'Y ' + (m.length - 8) + ' más en su ficha.');
          } else if (todas.length) { /* ya dicho: hay, pero de otra formación */ }
          else if (h.mu && /«/.test(h.mu)) P(r, 'Marchas dedicadas no tengo, pero de su música sé esto: ' + h.mu);
          else { P(r, 'No tengo marchas dedicadas ' + cabecera(h, 'a') + ' en mis datos. Si conoces alguna, mándamela.'); r.flojo = true; A(r, [['Ver la ficha', L.herm(h)], ['Sugerir', L.sugerir(e.raw || '', h)]]); break; }
          A(r, [['Ver la ficha', L.herm(h)]]); break;
        }
        case 'recorrido': {
          const R = CD.r[h.s];
          if (!R) { P(r, 'El itinerario ' + cabecera(h, 'de') + ' no lo tengo todavía. Sale ' + art(h.d) + (sal ? ' ' + sal : '') + (h.se ? ' desde ' + conArt(h.se) : '') + '.'); A(r, [['Ver la ficha', L.herm(h)]]); break; }
          P(r, 'Recorrido ' + cabecera(h, 'de') + ', ' + art(h.d) + ' (itinerario ' + (CD.anio || '') + ', horas del ' + R.k + '):');
          LI(r, resumirRuta(R.p).map((p) => ({ x: bonito(p[1]) || '—', sub: (p[2] ? '' : '≈ ') + p[0] })));
          P(r, '«≈» es hora aproximada (franja de media hora). Puede ir adelantada o retrasada.');
          A(r, [['Verla en el mapa', L.calle(h.c, h.d)], ['Ver la ficha', L.herm(h)]]); break;
        }
        case 'pasapor': {
          const R = CD.r[h.s];
          if (!R) { P(r, 'No tengo el itinerario ' + cabecera(h, 'de') + ', así que no sé decirte por dónde pasa.'); break; }
          const hits = buscarLugar(R.p, e.lugar || '', h), sinHora = hits.length ? [] : buscarLugar((R.c || []).map((l) => ['', l, 0, 0]), e.lugar || '', h);
          if (sinHora.length) {
            P(r, 'Según el itinerario de ' + (CD.anio || '') + ', ' + nom(h) + ' pasa por ' + bonito(sinHora[0][1]) + ' (' + art(h.d) + '). La hora de ese punto no está publicada.');
          } else if (hits.length) {
            P(r, 'Según el itinerario de ' + (CD.anio || '') + ', ' + nom(h) + ' pasa por ' + bonito(hits[0][1]) + ' ' + horaTxt(hits[0][0], hits[0][2]) + (hits.length > 1 ? ' y vuelve a pasar ' + hits.slice(1, 3).map((x) => horaTxt(x[0], x[2])).join(' y ') : '') + ' (' + art(h.d) + ').');
          } else {
            P(r, 'No veo «' + (e.lugar || 'ese sitio') + '» en el itinerario ' + cabecera(h, 'de') + '. Pasa por: ' + lista(resumirRuta(R.p).map((p) => bonito(p[1])).filter(Boolean).slice(0, 8)) + '.');
          }
          A(r, [['Verla en el mapa', L.calle(h.c, h.d)]]); break;
        }
        case 'carrera': {
          if (h.hc) P(r, Cab(h) + ' llega a la carrera oficial' + (h.lc ? ' (' + bonito(h.lc) + ')' : '') + ' a las ' + h.hc + ', ' + art(h.d) + ', según el horario oficial de ' + (D.anio - 1) + '.');
          else if (h.r && h.r[4]) P(r, cap1(nom(h)) + ' llega a ' + bonito(h.r[4]) + ' ' + horaTxt(h.r[5], h.r[6]) + ' (' + art(h.d) + ', itinerario ' + (D.anio - 1) + ').');
          else if (h.r) P(r, 'En el itinerario ' + cabecera(h, 'de') + ' no tengo marcado el paso por carrera oficial. Sale ' + (sal || horaTxt(h.r[0], h.r[1])) + ' y se recoge ' + horaTxt(h.r[2], h.r[3]) + '.');
          else P(r, 'No tengo el itinerario ' + cabecera(h, 'de') + ', así que no sé a qué hora llega a la carrera oficial.');
          A(r, enlacesHerm(h, true)); break;
        }
        case 'entrada': {
          if (h.r) P(r, Cab(h) + ' se recoge ' + horaTxt(h.r[2], h.r[3]) + ', ' + art(h.d) + (minutos(h.r[2]) > 1440 ? ' (ya de madrugada)' : '') + '. Sale ' + (sal || horaTxt(h.r[0], h.r[1])) + '.');
          else P(r, 'La hora de entrada ' + cabecera(h, 'de') + ' no la tengo. Sale ' + art(h.d) + (sal ? ' ' + sal : '') + '.');
          A(r, enlacesHerm(h, true)); break;
        }
        case 'cerca': {
          if (D.mapa.indexOf(h.c) >= 0 && h.r) { P(r, Cab(h) + ' sale ' + art(h.d) + (sal ? ' ' + sal : '') + (h.se ? ' desde ' + conArt(h.se) : '') + '.'); P(r, 'En «En la calle» de ' + c + ' te marco dónde va a cada hora (es una estimación por el horario) y cómo llegar.'); A(r, [['Abrir el mapa', L.calle(h.c, h.d)], ['Ver la ficha', L.herm(h)]]); }
          else { P(r, '' + cabecera(h, 'De') + ' no tengo el recorrido en el mapa. Sale ' + art(h.d) + (sal ? ' ' + sal : '') + (h.se ? ' desde ' + conArt(h.se) : '') + '.'); A(r, [['Ver la ficha', L.herm(h)]]); }
          break;
        }
        case 'historia': {
          const hi = (CD.hi || {})[h.s];
          if (h.f) P(r, Cab(h) + '. Fundación: ' + h.f + '.');
          if (hi) { const c1 = resumen(hi, 520); P(r, c1); if (c1.length < hi.length) P(r, 'Lo demás, en su ficha.'); }
          if (!h.f && !hi) P(r, 'De la historia ' + cabecera(h, 'de') + ' no tengo nada apuntado todavía.');
          A(r, [['Ver la ficha', L.herm(h)], h.w ? ['Su web', h.w] : null]); break;
        }
        case 'pasos': {
          const pa = (CD.pa || {})[h.s];
          P(r, pa ? Cab(h) + ': ' + pa : 'De los pasos ' + cabecera(h, 'de') + ' no tengo descripción.');
          A(r, [['Ver la ficha', L.herm(h)]]); break;
        }
        case 'web': {
          if (h.w) { P(r, 'La web ' + cabecera(h, 'de') + ':'); A(r, [[h.w.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, ''), h.w], ['Ver la ficha', L.herm(h)]]); }
          else { P(r, 'No tengo la web ' + cabecera(h, 'de') + '.'); A(r, [['Ver la ficha', L.herm(h)]]); }
          break;
        }
        case 'titulares': {
          P(r, h.t.length ? 'Titulares ' + cabecera(h, 'de') + ': ' + lista(h.t.map((t) => t[0])) + '.' : 'No tengo los titulares ' + cabecera(h, 'de') + '.');
          A(r, [['Ver la ficha', L.herm(h)]]); break;
        }
        default: {
          ctx.intent = 'info';
          // pregunta que no he entendido sobre una hermandad que sí conozco («¿por qué le llaman el Abuelo?»): respuesta floja
          if (e && e.intent == null && e.toks) { const x = IDX.find((i) => i.h.s === h.s), nom = new Set([...x.F, ...x.M, ...x.W]); if (e.toks.filter((t) => t.length > 3 && !STOP.has(t) && !GENERICO.has(t) && !nom.has(stem(t)) && t !== h.c).length >= 2) r.flojo = true; }
          P(r, conPref(h) + ' sale ' + art(h.d) + (sal ? ' ' + sal : '') + (h.se ? ', desde ' + conArt(h.se) : '') + '.');
          if (h.t.length) P(r, 'Titulares: ' + lista(h.t.map((t) => t[0])) + '.');
          A(r, enlacesHerm(h, true).concat([h.w ? ['Su web', h.w] : null]));
        }
      }
      C(r, chipsHerm(h, intent));
      return cerrar(r);
    }
    // un texto largo se corta en el primer párrafo o en una frase entera, nunca a media palabra
    function resumen(t, max) {
      t = String(t || '').trim(); const par = t.split(/\n\s*\n/)[0];
      if (par.length <= max) return par;
      const fr = par.match(/[^.!?]+[.!?]+(\s|$)/g) || [par]; let o = '';
      for (const f of fr) { if ((o + f).length > max && o) break; o += f; }
      return o.trim();
    }
    // ruta resumida: salida, puntos intermedios repartidos, carrera oficial y entrada (máx. 12)
    function resumirRuta(p) {
      const ok = p.filter((x, i) => x[1] || i === 0 || i === p.length - 1);
      if (ok.length <= 12) return ok;
      const keep = new Set([0, ok.length - 1]); ok.forEach((x, i) => { if (x[3]) keep.add(i); });
      const paso = (ok.length - 1) / (12 - keep.size + 1);
      for (let k = paso; keep.size < 12 && k < ok.length - 1; k += paso) keep.add(Math.round(k));
      return [...keep].sort((a, b) => a - b).map((i) => ok[i]);
    }
    function buscarLugar(p, lugar, h) {
      const nombreH = new Set(toks(h ? h.n + ' ' + h.t.map((t) => t[0]).join(' ') : ''));
      const q = toks(lugar).filter((t) => t.length > 2 && !STOP.has(t) && !CLAVE.has(t) || t === 'campana' || t === 'catedral' || t === 'tribuna').filter((t) => !nombreH.has(t) || /^(campana|catedral|tribuna)$/.test(t)).map(stem);
      if (!q.length) return [];
      let best = 0; const res = [];
      p.forEach((x) => {
        const lt = toks(x[1]).map(stem); let s = 0;
        q.forEach((t) => { if (lt.indexOf(t) >= 0) s += 1; else if (t.length >= 5 && lt.some((w) => w.length >= 4 && distancia(t, w, 1) <= 1)) s += 0.8; });
        if (s > best) { best = s; res.length = 0; }
        if (s && s === best) res.push(x);
      });
      return best >= Math.min(1, q.length * 0.5) ? res : [];
    }
    function respDia(dia, ciudad) {
      const r = Resp(), g = grupo(dia);
      const lista_ = [];
      H.forEach((h) => {
        if (ciudad && h.c !== ciudad) return;
        if (g.indexOf(h.d) >= 0) lista_.push({ h, hora: h.h || (h.r ? h.r[0] : ''), exacta: !!h.h || (h.r && h.r[1]) });
        (h.x || []).forEach((x) => { if (g.indexOf(x[0]) >= 0) lista_.push({ h, hora: x[1], exacta: true, extra: x[3] }); });
      });
      ctx.dia = dia; if (ciudad) ctx.ciudad = ciudad; ctx.intent = 'lista'; ctx.herm = null;
      if (!lista_.length) { P(r, (ciudad ? 'En ' + nombreCiudad(ciudad) : 'Ese día') + ' no sale ninguna cofradía ' + art(dia) + ', que yo tenga apuntada.'); C(r, chipsDia(dia, ciudad)); return cerrar(r); }
      lista_.sort((a, b) => (a.h.c > b.h.c ? 1 : a.h.c < b.h.c ? -1 : 0) || (minutos(a.hora) || 9999) - (minutos(b.hora) || 9999) || (a.h.o || 0) - (b.h.o || 0));
      P(r, cap1(art(dia)) + (ciudad ? ' en ' + nombreCiudad(ciudad) : '') + ' sale' + (lista_.length === 1 ? ' 1 cofradía' : 'n ' + lista_.length + ' cofradías') + (D.fechas[dia] ? ' (' + cuandoCae(dia, true).replace(/^el /, '') + ')' : '') + ':');
      LI(r, lista_.slice(0, 40).map((x) => ({ x: x.h.n + (x.extra ? ' (' + x.extra + ')' : ''), href: L.herm(x.h), sub: (ciudad ? '' : nombreCiudad(x.h.c) + ' · ') + (x.hora ? (x.exacta ? '' : '≈ ') + x.hora : 'hora por confirmar') })));
      if (lista_.some((x) => x.hora)) P(r, 'Horas del último programa publicado (' + (D.anio - 1) + ').');
      if (ciudad && D.mapa.indexOf(ciudad) >= 0) A(r, [['Verlas en el mapa', L.calle(ciudad, dia)]]);
      C(r, chipsDia(dia, ciudad));
      return cerrar(r);
    }
    function chipsDia(dia, ciudad) {
      const i = CANON.indexOf(dia), sig = CANON[i + 1];
      return [sig ? '¿Y ' + art(sig).replace(/^en las /, 'las ') + '?' : null, ciudad ? '¿Cuántas hermandades tiene ' + nombreCiudad(ciudad) + '?' : null, ciudad ? 'Noticias de ' + nombreCiudad(ciudad) : '¿Cuánto falta para la Semana Santa?'];
    }
    function preguntaCiudad(r, dia, intent) {
      ctx.dia = dia || ctx.dia; ctx.intent = intent || ctx.intent;
      const cuenta = (c) => (dia ? H.filter((h) => h.c === c && grupo(dia).indexOf(h.d) >= 0).length : null);
      C(r, D.capitales.map((c) => [c[1] + (dia ? ' (' + cuenta(c[0]) + ')' : ''), '@c:' + c[0]]));
      return cerrar(r);
    }
    // Domingo de Resurrección de un año (calendario gregoriano, algoritmo de Meeus/Butcher)
    function pascuaDe(y) {
      const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
      const h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
      return new Date(Date.UTC(y, Math.floor((h + l - 7 * m + 114) / 31) - 1, ((h + l - 7 * m + 114) % 31) + 1)).toISOString().slice(0, 10);
    }
    function respFalta(e) {
      const r = Resp(), ramos = D.fechas['Domingo de Ramos'], pascua = D.fechas['Domingo de Resurrección'];
      // otro año («¿Cuándo es la Semana Santa de 2028?»): se calcula su Pascua
      const y = /\b(1[6-9]\d\d|2\d\d\d)\b/.exec(e.t);
      if (y && +y[1] !== D.anio) {
        const pa = pascuaDe(+y[1]), ra = masDias(pa, -7), pasada = Date.parse(pa) < Date.parse(hoyISO(0));
        P(r, 'En ' + y[1] + ' el Domingo de Ramos ' + (pasada ? 'cayó' : 'cae') + ' el ' + fechaLarga(ra) + ' y el Domingo de Resurrección el ' + fechaLarga(pa) + '. Lo saco de la fecha de la Pascua de ese año.');
        C(r, ['¿Cuánto falta para la Semana Santa?']);
        return cerrar(r);
      }
      if (e.dia && e.dia !== 'Domingo de Ramos') {
        const f = D.fechas[e.dia], n = diasHasta(f);
        P(r, cap1(art(e.dia)) + ' de ' + D.anio + (e.dia === 'Madrugá' ? ' es ' : ' cae ') + cuandoCae(e.dia) + (n > 0 ? '. Quedan ' + n + (n === 1 ? ' día.' : ' días.') : n === 0 ? '. ¡Es hoy!' : '.'));
      } else {
        const n = diasHasta(ramos), fin = diasHasta(pascua);
        if (n > 0) P(r, 'Faltan ' + n + (n === 1 ? ' día' : ' días') + ' para el Domingo de Ramos: el ' + fechaLarga(ramos) + '. La Semana Santa de ' + D.anio + ' acaba el Domingo de Resurrección, ' + fechaLarga(pascua) + '. Ve planchando la túnica.');
        else if (fin >= 0) P(r, '¡Que estamos en plena Semana Santa, cuñao! Hoy es ' + (jornadaDeFecha(hoyISO(0)) || 'día de vísperas') + '.');
        else P(r, 'La próxima Semana Santa empieza el ' + fechaLarga(ramos) + '.');
      }
      C(r, ['¿Qué sale el Domingo de Ramos?', '¿Qué sale hoy?']);
      return cerrar(r);
    }
    // ---- actos fuera de Semana Santa: extraordinarias con itinerario (D.ex) y la agenda de 21 días (cunao/agenda.json) ----
    const TIPO_TXT = { magna: 'magna', extraordinaria: 'extraordinaria', procesion: 'procesión', traslado: 'traslado', coronacion: 'coronación', 'via-crucis': 'vía crucis', culto: 'culto', acto: 'acto', besamanos: 'besamanos' };
    const SALIDA = set('magna extraordinaria procesion traslado coronacion via-crucis');
    function actosDe(isos, ciudad) {
      const ag = CIUDADES.agenda || [], out = [];
      (D.ex || []).forEach((x) => { if (isos.indexOf(x[0]) >= 0 && (!ciudad || x[2] === ciudad)) out.push({ f: x[0], h: x[1], c: x[2], t: x[3], herm: POR_SLUG.get(x[4]) || null, sal: true, mapa: x[7], fu: x[6], sede: x[5] }); });
      ag.forEach((x) => {
        if (isos.indexOf(x[0]) < 0 || (ciudad && x[5] !== ciudad)) return;
        const herm = POR_SLUG.get(x[4]) || null, sal = SALIDA.has(x[2]);
        // la misma salida que ya está con su itinerario no se repite
        if (sal && out.some((o) => o.mapa && o.f === x[0] && o.c === x[5] && (!herm || !o.herm || o.herm === herm))) return;
        out.push({ f: x[0], h: x[1], c: x[5], t: x[3], herm, sal, tipo: x[2], fu: x[6] });
      });
      return out.sort((a, b) => a.f.localeCompare(b.f) || (b.sal ? 1 : 0) - (a.sal ? 1 : 0) || (a.h || '99').localeCompare(b.h || '99'));
    }
    const itemActo = (a, conFecha, ciudad) => ({ x: a.h ? a.t.replace(/,? a las \d{1,2}[:.]\d{2}( horas| h)?/i, '') : a.t, href: a.mapa ? L.calle(a.c) : a.herm ? L.herm(a.herm) : a.fu || '', ext: !a.mapa && !a.herm && !!a.fu, sub: [conFecha ? fechaCorta(a.f) : '', ciudad ? '' : nombreCiudad(a.c), a.h ? a.h : '', a.mapa ? 'en el plano' : a.tipo && !a.sal ? TIPO_TXT[a.tipo] || '' : ''].filter(Boolean).join(' · ') });
    function respActos(iso, ciudad, e) {
      if (!CIUDADES.agenda) return necesitaVarios(['agenda']);
      const r = Resp(), hoy = iso === hoyISO(0), n = diasHasta(D.fechas['Domingo de Ramos']);
      const quando = hoy ? 'Hoy' : iso === hoyISO(1) ? 'Mañana' : 'El ' + fechaLarga(iso), donde = ciudad ? ' en ' + nombreCiudad(ciudad) : '';
      const l = actosDe([iso], ciudad), sal = l.filter((a) => a.sal), cul = l.filter((a) => !a.sal);
      ctx.intent = 'lista'; ctx.dia = null; if (ciudad) ctx.ciudad = ciudad;
      if (sal.length) { P(r, quando + donde + ' no es Semana Santa, pero hay ' + (sal.length === 1 ? 'una salida' : sal.length + ' salidas') + ', cuñao:'); LI(r, sal.slice(0, 8).map((a) => itemActo(a, false, ciudad))); }
      else P(r, quando + donde + ' no sale ninguna cofradía, que yo tenga apuntada.');
      if (cul.length) { P(r, (sal.length ? 'Y de cultos' : 'Cultos') + (hoy ? ' de hoy' : ' de ese día') + ':'); LI(r, cul.slice(0, 6).map((a) => itemActo(a, false, ciudad))); if (cul.length > 6) P(r, 'Y ' + (cul.length - 6) + ' más en el calendario.'); }
      if (!sal.length) {
        // lo próximo: la primera salida de los próximos días
        const prox = actosDe(Array.from({ length: 21 }, (_, i) => masDias(iso, i + 1)), ciudad).filter((a) => a.sal)[0];
        if (prox) P(r, 'Lo próximo' + donde + ': ' + prox.t + (ciudad ? '' : ' (' + nombreCiudad(prox.c) + ')') + ', el ' + fechaCorta(prox.f) + (prox.h ? ' a las ' + prox.h : '') + '.');
      }
      if (n > 0) P(r, 'Para el Domingo de Ramos faltan ' + n + ' días: es el ' + fechaLarga(D.fechas['Domingo de Ramos']) + '.');
      A(r, [['Ver el calendario', BASE + 'calendario/']]);
      C(r, [hoy ? '¿Y mañana?' : null, '¿Qué hay este fin de semana?', '¿Cuánto falta para la Semana Santa?']);
      return cerrar(r);
    }
    // «este fin de semana»: el sábado y el domingo que vienen (o este, si ya es fin de semana)
    function respFinde(e) {
      const r = Resp(), hoy = hoyISO(0), wd = new Date(hoy + 'T12:00:00Z').getUTCDay();
      const dias = wd === 0 ? [hoy] : wd === 6 ? [hoy, masDias(hoy, 1)] : [masDias(hoy, 6 - wd), masDias(hoy, 7 - wd)];
      const jornadas = dias.map((iso) => jornadaDeFecha(iso)).filter(Boolean);
      const c = e.ciudad || ctx.ciudad || pagina() || preferida();
      if (jornadas.length) {
        P(r, 'Este fin de semana es ' + jornadas.map((d) => art(d)).join(' y ') + '.');
        if (c) return respDia(jornadas[0], c);
        return preguntaCiudad(r, jornadas[0], 'lista');
      }
      if (!CIUDADES.agenda) return necesitaVarios(['agenda']);
      const cd = e.ciudad || null, l = actosDe(dias, cd), sal = l.filter((a) => a.sal), cul = l.filter((a) => !a.sal);
      P(r, 'Este fin de semana (' + dias.map((iso) => fechaCorta(iso)).join(' y ') + ') no es Semana Santa: empieza el ' + fechaLarga(D.fechas['Domingo de Ramos']) + '.' + (sal.length ? ' Pero salir, salen:' : cul.length ? '' : ' Y salidas extraordinarias' + (cd ? ' en ' + nombreCiudad(cd) : '') + ' no tengo apuntada ninguna.'));
      if (sal.length) LI(r, sal.slice(0, 10).map((a) => itemActo(a, dias.length > 1, cd)));
      if (cul.length) { P(r, 'Cultos que tengo apuntados:'); LI(r, cul.slice(0, 8).map((a) => itemActo(a, dias.length > 1, cd))); if (cul.length > 8) P(r, 'Y ' + (cul.length - 8) + ' más en el calendario.'); }
      A(r, [['Ver el calendario', BASE + 'calendario/']]);
      C(r, ['¿Cuánto falta para la Semana Santa?', 'Dime una curiosidad']);
      return cerrar(r);
    }
    // la curiosidad del día (la misma de la página «Hoy»); si se pide otra, la siguiente
    function respCuriosidad() {
      const r = Resp(), L_ = D.cu || [];
      if (!L_.length) { P(r, 'Ahora mismo no tengo curiosidades a mano.'); return cerrar(r); }
      const dia = Math.floor(Date.parse(hoyISO(0) + 'T00:00:00Z') / 864e5);
      ctx.cur = ctx.cur == null ? (dia * 7919) % L_.length : (ctx.cur + 1) % L_.length;
      const k = L_[ctx.cur]; ctx.intent = 'curiosidad';
      P(r, k[0]); A(r, [[k[2], k[1]]]); C(r, ['Otra curiosidad']);
      return cerrar(r);
    }
    // la más antigua de una capital, por el año de fundación que dan las fichas (solo las que traen año)
    function respAntigua(c) {
      const r = Resp(); ctx.ciudad = c; ctx.intent = 'antigua';
      const l = H.filter((h) => h.c === c && /\b\d{4}\b/.test(h.f || '')).map((h) => ({ h, y: +/\b(\d{4})\b/.exec(h.f)[1] })).sort((a, b) => a.y - b.y);
      if (!l.length) { P(r, 'De ' + nombreCiudad(c) + ' no tengo años de fundación con los que compararlas.'); return cerrar(r); }
      P(r, 'Por el año de fundación que dan sus fichas, la más antigua de ' + nombreCiudad(c) + ' es ' + nom(l[0].h) + ' (' + l[0].y + '). Las siguientes:');
      LI(r, l.slice(1, 5).map((x) => ({ x: x.h.n, href: L.herm(x.h), sub: String(x.y) })));
      const total = H.filter((h) => h.c === c).length;
      if (l.length < total) P(r, 'Cuento ' + l.length + ' de ' + total + ': las demás no traen año en su ficha.');
      A(r, [['Ver ' + nom(l[0].h), L.herm(l[0].h)]]);
      return cerrar(r);
    }
    function respImag(i) {
      const r = Resp(), x = I[i];
      const obras = []; H.forEach((h) => h.t.forEach((t) => { if (t[2] === i) obras.push({ h, t }); }));
      ctx.imag = i; ctx.intent = 'imaginero';
      const cab = x[1] + (x[2] ? ' (' + x[2] + ')' : '') + (x[3] ? ', escuela ' + x[3] : '') + '.';
      if (x[4]) { P(r, cab); P(r, x[4]); }
      P(r, (x[4] ? '' : cab + ' ') + 'En el portal tengo ' + obras.length + (obras.length === 1 ? ' obra suya' : ' obras suyas') + ' que procesionan' + (obras.length ? ':' : '.'));
      if (obras.length) LI(r, obras.slice(0, 8).map((o) => ({ x: o.t[0], href: L.herm(o.h), sub: o.h.n + ' · ' + nombreCiudad(o.h.c) + (o.t[1] && /\d{4}/.test(o.t[1]) ? ' · ' + /\d{4}/.exec(o.t[1])[0] : '') })));
      if (obras.length > 8) P(r, 'Y ' + (obras.length - 8) + ' más en su ficha.');
      A(r, [['Ver su ficha', L.imag(x[0])]]);
      C(r, ['¿Qué sale hoy?', '¿Quién talló el Cachorro?']);
      return cerrar(r);
    }
    function respBanda(i) {
      const r = Resp(), x = B[i], acomp = [];
      H.forEach((h) => (h.b || []).forEach((p) => { if (p[1].indexOf(i) >= 0) acomp.push({ h, paso: p[0] }); }));
      ctx.banda = i; ctx.intent = 'bandaInv';
      P(r, x[1] + (x[3] ? ' (' + x[3] + ')' : '') + (acomp.length ? ' acompaña a:' : ': no tengo a quién acompaña.'));
      if (acomp.length) LI(r, acomp.slice(0, 12).map((a) => ({ x: a.h.n, href: L.herm(a.h), sub: [nombreCiudad(a.h.c), a.paso, a.h.d].filter(Boolean).join(' · ') })));
      if (x[0]) A(r, [['Ver la banda', L.banda(x[0])]]);
      return cerrar(r);
    }
    function respDudas(dudas, intent, e) {
      const r = Resp();
      ctx.pend = { intent, lugar: e.lugar || null };
      const mismas = dudas.every((d) => norm(d.h.n).replace(/^(el|la|los|las) /, '') === norm(dudas[0].h.n).replace(/^(el|la|los|las) /, ''));
      // «cofradías» siempre en femenino: «¿Cuál de ellas?» vale para el Cautivo y para la Esperanza
      P(r, mismas ? 'Tengo ' + dudas.length + ' cofradías que se llaman «' + dudas[0].h.n.replace(/^(El|La|Los|Las) /, '') + '», cuñao. ¿De qué capital?' : 'Tengo ' + dudas.length + ' cofradías que encajan, cuñao. ¿Cuál de ellas?');
      C(r, dudas.map((d) => [mismas ? nombreCiudad(d.h.c) + ' · ' + d.h.d : d.h.n + ' (' + nombreCiudad(d.h.c) + ' · ' + d.h.d + ')', '@h:' + d.h.s]));
      return cerrar(r);
    }
    function respNoticias(c) {
      if (!tengoCiudad(c)) return necesita(c);
      const r = Resp(), no = CIUDADES[c].no || [];
      ctx.ciudad = c; ctx.intent = 'noticias';
      if (!no.length) P(r, 'No tengo noticias recientes de ' + nombreCiudad(c) + '.');
      else {
        P(r, 'Lo último de ' + nombreCiudad(c) + ':');
        LI(r, no.map((n) => ({ x: n[0], href: n[1], ext: true, sub: n[2] + (n[3] ? ' · ' + new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', timeZone: 'Europe/Madrid' }).format(new Date(n[3])) : '') })));
      }
      A(r, [['Todas las noticias de ' + nombreCiudad(c), L.noticias(c)]]);
      return cerrar(r);
    }
    function respCuantas(c, dia) {
      const r = Resp();
      const CI = D.ci || {};
      if (!c) {
        const tot = D.capitales.reduce((a, x) => a + (CI[x[0]] ? CI[x[0]][0] : 0), 0);
        P(r, tot ? 'Según el organismo oficial de cada una, las ocho capitales suman ' + tot + ' hermandades y cofradías. ¿De cuál quieres el detalle?' : 'Tengo las ' + N + ' fichas de las ocho capitales. ¿De cuál quieres el detalle?');
        return preguntaCiudad(r, null, 'cuantas');
      }
      const hs = H.filter((h) => h.c === c);
      ctx.ciudad = c; ctx.intent = 'cuantas';
      if (dia) { const n = hs.filter((h) => grupo(dia).indexOf(h.d) >= 0).length; P(r, cap1(art(dia)) + ' en ' + nombreCiudad(c) + ' salen ' + n + (n === 1 ? ' cofradía.' : ' cofradías.')); C(r, [cap1(art(dia).replace(/^en las /, 'las ')) + ' en ' + nombreCiudad(c)]); return cerrar(r); }
      // la cifra oficial de la capital (Consejo, Agrupación, Federación…), no el número de fichas: hay cortejos que tienen ficha propia
      const ci = (D.ci || {})[c];
      if (ci) { P(r, nombreCiudad(c) + ' tiene ' + (ci[2] || ci[0] + ' ' + ci[1]) + (ci[4] ? ', según ' + (/^(Agrupaci|Real Federaci|Federaci|Junta|Uni|Asociaci)/.test(ci[4]) ? 'la ' : /^(Consejo|Cabildo|Obispado)/.test(ci[4]) ? 'el ' : '') + ci[4] : '') + '.'); if (ci[3] && ci[3].length > 70) P(r, cap1(ci[3]) + '.'); }
      else P(r, 'De ' + nombreCiudad(c) + ' no tengo la cifra oficial; en el portal hay ' + hs.length + ' fichas.');
      const por = ORDEN.map((d) => [d, hs.filter((h) => h.d === d).length]).filter((x) => x[1]);
      P(r, 'Cortejos por jornada, según las fichas del portal:');
      LI(r, por.map((x) => ({ x: x[0], sub: String(x[1]) })));
      A(r, [['Semana Santa de ' + nombreCiudad(c), L.capital(c)], ci && ci[5] ? ['Fuente oficial', ci[5]] : null]);
      C(r, ['¿Qué sale el Domingo de Ramos en ' + nombreCiudad(c) + '?', 'Noticias de ' + nombreCiudad(c)]);
      return cerrar(r);
    }
    function respPasanPor(c, e) {
      if (!tengoCiudad(c)) return necesita(c);
      const r = Resp(), CD = CIUDADES[c], g = e.dia ? grupo(e.dia) : null, hits = [];
      for (const [s, R] of Object.entries(CD.r || {})) {
        const h = POR_SLUG.get(s); if (!h || (g && g.indexOf(h.d) < 0)) continue;
        const l = buscarLugar(R.p, e.lugar || '', null); if (l.length) { hits.push({ h, p: l[0] }); continue; }
        // calle sin hora publicada: pasa, pero sin hora
        const c_ = buscarLugar((R.c || []).map((x) => ['', x, 0, 0]), e.lugar || '', null); if (c_.length) hits.push({ h, p: c_[0] });
      }
      ctx.ciudad = c; ctx.intent = 'pasapor';
      if (!hits.length) { P(r, 'No encuentro «' + (e.lugar || '') + '» en los itinerarios de ' + nombreCiudad(c) + (e.dia ? ' ' + art(e.dia) : '') + ' que tengo.'); return cerrar(r); }
      hits.sort((a, b) => CANON.indexOf(a.h.d) - CANON.indexOf(b.h.d) || (minutos(a.p[0]) || 9999) - (minutos(b.p[0]) || 9999));
      P(r, 'Por ' + bonito(hits[0].p[1]) + (e.dia ? ' ' + art(e.dia) : '') + ' pasan (itinerarios ' + (CD.anio || '') + '):');
      LI(r, hits.slice(0, 20).map((x) => ({ x: x.h.n, href: L.herm(x.h), sub: (e.dia ? '' : x.h.d + ' · ') + (x.p[0] ? (x.p[2] ? '' : '≈ ') + x.p[0] : 'hora sin publicar') })));
      if (D.mapa.indexOf(c) >= 0) A(r, [['Verlo en el mapa', L.calle(c, e.dia || hits[0].h.d)]]);
      return cerrar(r);
    }
    function respCerca(c, dia) {
      const r = Resp();
      if (D.mapa.indexOf(c) < 0) { P(r, 'De ' + nombreCiudad(c) + ' todavía no tengo el mapa de recorridos.'); A(r, [['Semana Santa de ' + nombreCiudad(c), L.capital(c)]]); return cerrar(r); }
      ctx.ciudad = c; ctx.intent = 'cerca';
      P(r, 'En «En la calle» de ' + nombreCiudad(c) + ' ves dónde va cada cofradía' + (dia ? ' ' + art(dia) : '') + ' a cada hora (posición estimada) y cuál te pilla más cerca. El permiso de ubicación lo pide el mapa, no yo.');
      A(r, [['Abrir el mapa', L.calle(c, dia)]]);
      return cerrar(r);
    }
    // ---- listas con filtros: capital, jornada, franja horaria y orden («¿qué sale en Málaga el Jueves Santo antes de las 19:00?», «¿cuál es la primera de Jaén?») ----
    const enFranja = (t, e) => { let v = minutos(t); if (v == null) return false; const a = e.desde == null ? null : (e.desde < 360 ? e.desde + 1440 : e.desde), b = e.hasta == null ? null : (e.hasta < 360 ? e.hasta + 1440 : e.hasta); return (a == null || v >= a) && (b == null || v < b || (e.hasta === b && v === b && false)); };
    const franjaTxt = (e) => { const f = (x) => { const v = x % 1440; return String(Math.floor(v / 60)).padStart(2, '0') + ':' + String(v % 60).padStart(2, '0'); }; return e.franja || (e.desde != null && e.hasta != null ? 'entre las ' + f(e.desde) + ' y las ' + f(e.hasta) : e.hasta != null ? 'antes de las ' + f(e.hasta) : 'desde las ' + f(e.desde)); };
    function salidasDe(ciudad, dia) {
      const g = dia ? grupo(dia) : null, l = [];
      H.forEach((h) => {
        if (ciudad && h.c !== ciudad) return;
        if (!g || g.indexOf(h.d) >= 0) l.push({ h, d: h.d, hora: h.h || (h.r ? h.r[0] : ''), exacta: !!h.h || !!(h.r && h.r[1]) });
        (h.x || []).forEach((x) => { if (!g || g.indexOf(x[0]) >= 0) l.push({ h, d: x[0], hora: x[1], exacta: true, extra: x[3] }); });
      });
      return l;
    }
    const ordDia = (d) => { const i = CANON.indexOf(GRUPO_INV[d] || d); return i < 0 ? 99 : i; };
    const GRUPO_INV = { 'Jueves Santo y Madrugada': 'Jueves Santo', 'Vísperas': 'Viernes de Dolores' };
    function respFiltro(e, ciudad, dia) {
      const r = Resp(); let l = salidasDe(ciudad, dia).filter((x) => enFranja(x.hora, e));
      const sinHora = salidasDe(ciudad, dia).filter((x) => !x.hora).length;
      ctx.dia = dia || ctx.dia; if (ciudad) ctx.ciudad = ciudad; ctx.intent = 'lista'; ctx.herm = null;
      const donde = (dia ? art(dia) : 'en toda la Semana Santa') + (ciudad ? ' en ' + nombreCiudad(ciudad) : ' en las ocho capitales');
      l.sort((a, b) => ordDia(a.d) - ordDia(b.d) || (minutos(a.hora) || 9999) - (minutos(b.hora) || 9999));
      if (!l.length) P(r, cap1(donde) + ' no sale ninguna cofradía ' + franjaTxt(e) + ', que yo tenga apuntada.');
      else {
        P(r, cap1(donde) + ', ' + franjaTxt(e) + ', sale' + (l.length === 1 ? ' 1 cofradía' : 'n ' + l.length + ' cofradías') + ' (hora de salida):');
        LI(r, l.slice(0, 40).map((x) => ({ x: x.h.n + (x.extra ? ' (' + x.extra + ')' : ''), href: L.herm(x.h), sub: (ciudad ? '' : nombreCiudad(x.h.c) + ' · ') + (dia ? '' : x.d + ' · ') + (x.exacta ? '' : '≈ ') + x.hora })));
      }
      if (sinHora) P(r, sinHora === 1 ? 'Hay 1 más sin hora publicada que no entra en la cuenta.' : 'Hay ' + sinHora + ' más sin hora publicada que no entran en la cuenta.');
      P(r, 'Horas del último programa publicado (' + (D.anio - 1) + ').');
      if (ciudad && dia && D.mapa.indexOf(ciudad) >= 0) A(r, [['Verlas en el mapa', L.calle(ciudad, dia)]]);
      C(r, dia ? chipsDia(dia, ciudad) : []);
      return cerrar(r);
    }
    function respOrden(e, ciudad, dia) {
      const r = Resp(), ultima = /\b(ultima|ultimo|mas tarde|cierra)\b/.test(e.t), porOrden = /\borden\b/.test(e.t), entrada = /\b(recoge\w*|entra\w*|encierro|recogida)\b/.test(e.t);
      if (entrada && !porOrden) {
        const l = H.filter((h) => h.c === ciudad && (!dia || grupo(dia).indexOf(h.d) >= 0) && h.r && h.r[2]).map((h) => ({ h, t: h.r[2], ex: h.r[3], v: minutos(h.r[2]) + (minutos(h.r[2]) < minutos(h.r[0]) ? 1440 : 0) }));
        if (!l.length) { P(r, 'No tengo horas de recogida ' + (dia ? art(dia) + ' ' : '') + 'en ' + nombreCiudad(ciudad) + ' para compararlas.'); return cerrar(r); }
        if (!dia) { const ds = l.map((x) => ordDia(x.h.d)); const obj = ultima ? Math.max(...ds) : Math.min(...ds); for (let i = l.length - 1; i >= 0; i--) if (ordDia(l[i].h.d) !== obj) l.splice(i, 1); }
        l.sort((a, b) => a.v - b.v);
        const x = ultima ? l[l.length - 1] : l[0];
        P(r, (ultima ? 'La última en recogerse ' : 'La primera en recogerse ') + (dia ? art(dia) : 'en la Semana Santa') + ' de ' + nombreCiudad(ciudad) + ' es ' + nom(x.h) + ', ' + (dia ? '' : art(x.h.d) + ' ') + horaTxt(x.t, x.ex) + (minutos(x.t) > 1440 ? ' (ya de madrugada)' : '') + ', según los itinerarios de ' + (D.anio - 1) + '.');
        P(r, 'Cuento solo las que tienen itinerario con hora de entrada (' + l.length + ').');
        A(r, [['Ver ' + nom(x.h), L.herm(x.h)]]); ctx.herm = x.h.s;
        return cerrar(r);
      }
      ctx.ciudad = ciudad; ctx.dia = dia || ctx.dia; ctx.intent = 'orden'; ctx.herm = null;
      if (porOrden && dia) {
        const l = H.filter((h) => h.c === ciudad && grupo(dia).indexOf(h.d) >= 0).sort((a, b) => (a.o || 99) - (b.o || 99));
        if (!l.length) { P(r, 'En ' + nombreCiudad(ciudad) + ' no sale ninguna cofradía ' + art(dia) + ', que yo tenga apuntada.'); return cerrar(r); }
        P(r, 'Orden de paso ' + delDia(dia) + ' en ' + nombreCiudad(ciudad) + ', con su hora de salida:');
        LI(r, l.map((h, i) => ({ x: (i + 1) + '. ' + h.n, href: L.herm(h), sub: h.h || (h.r ? (h.r[1] ? '' : '≈ ') + h.r[0] : 'hora por confirmar') })));
        C(r, chipsDia(dia, ciudad)); return cerrar(r);
      }
      // primera o última: por hora de salida dentro de la jornada; sin jornada, la primera jornada (o la última) con salidas
      let l = salidasDe(ciudad, dia).filter((x) => x.hora && !x.extra);
      if (!dia && l.length) { const ds = l.map((x) => ordDia(x.d)); const objetivo = ultima ? Math.max(...ds) : Math.min(...ds); l = l.filter((x) => ordDia(x.d) === objetivo); }
      l.sort((a, b) => (minutos(a.hora) || 9999) - (minutos(b.hora) || 9999));
      if (!l.length) { P(r, 'No tengo horas de salida ' + (dia ? art(dia) + ' ' : '') + 'en ' + nombreCiudad(ciudad) + ' para compararlas.'); return cerrar(r); }
      const x = ultima ? l[l.length - 1] : l[0];
      P(r, (ultima ? 'La última en salir ' : 'La primera en salir ') + (dia ? art(dia) : 'en la Semana Santa') + ' de ' + nombreCiudad(ciudad) + ' es ' + nom(x.h) + ', ' + (dia ? '' : art(x.d) + ' ') + (x.exacta ? 'a las ' : 'hacia las ') + x.hora + (x.h.se ? ' desde ' + conArt(x.h.se) : '') + '.');
      if (ultima && x.h.r && x.h.r[2]) P(r, 'Ojo: la cofradía que más tarde se recoge puede ser otra; esto es por la hora de salida.');
      A(r, [['Ver ' + nom(x.h), L.herm(x.h)]]);
      ctx.herm = x.h.s;
      C(r, [dia ? 'Orden de paso ' + delDia(dia) + ' en ' + nombreCiudad(ciudad) : '¿Qué sale el ' + (x.d === 'Madrugá' ? 'Domingo de Ramos' : x.d) + ' en ' + nombreCiudad(ciudad) + '?']);
      return cerrar(r);
    }
    // ---- agenda de los próximos 90 días de una capital ----
    function respAgenda(e, c) {
      if (!tengoCiudad(c)) return necesita(c);
      const r = Resp(), ag = CIUDADES[c].ag || [], n = e.t;
      ctx.ciudad = c; ctx.intent = 'agenda';
      const TIPO = [[/extraordinari|salida|procesion/, ['extraordinaria', 'magna', 'procesion', 'coronacion', 'traslado']], [/besamanos|besapies/, ['besamanos']], [/via ?crucis/, ['via-crucis']], [/cultos?|triduo|quinario|septenario|novena/, ['culto', 'acto', 'besamanos']], [/concierto/, ['concierto']], [/pregon|cartel/, ['pregon', 'cartel']], [/traslado/, ['traslado']]];
      const t = TIPO.find((x) => x[0].test(n)), l = t ? ag.filter((x) => t[1].indexOf(x[2]) >= 0) : ag;
      if (!l.length) { P(r, 'En la agenda de ' + nombreCiudad(c) + ' no tengo ' + (t ? 'nada de eso' : 'actos') + ' en los próximos tres meses.'); A(r, [['Ver el calendario', BASE + 'calendario/']]); r.flojo = true; return cerrar(r); }
      P(r, 'Lo próximo en ' + nombreCiudad(c) + (t ? '' : ' (cultos, salidas y actos)') + ':');
      LI(r, l.slice(0, 10).map((x) => { const h = x[4] && POR_SLUG.get(x[4]); return { x: x[3], href: h ? L.herm(h) : '', sub: fechaCorta(x[0]) + (x[1] ? ' · ' + x[1] : '') }; }));
      if (l.length > 10) P(r, 'Y ' + (l.length - 10) + ' más en el calendario.');
      A(r, [['Ver el calendario', BASE + 'calendario/']]);
      return cerrar(r);
    }
    // ---- marchas: catálogo completo en trozos (m/autores y m/<inicial>) ----
    const MD = {};
    const tokM = (s) => toks(s).filter((t) => !ARTIC.has(t));
    let AUIX = null;
    function autoresIdx() {
      if (AUIX) return AUIX;
      const A_ = MD['m/autores'], df_ = new Map();
      const ix = A_.map((a) => { const s = new Set(toks(a[0]).filter((t) => t.length > 2 && !ARTIC.has(t))); s.forEach((t) => df_.set(t, (df_.get(t) || 0) + 1)); return s; });
      AUIX = { ix, d: df_, n: A_.length }; return AUIX;
    }
    // autores nombrados en la pregunta (apellidos poco comunes pesan más; hace falta casi el nombre entero o un apellido raro)
    function buscarAutor(e) {
      const cn = e.ciudad ? norm(nombreCiudad(e.ciudad)) : '';
      const q = [...new Set(toks(e.raw || '').concat(toks(e.t)))].filter((t) => t.length > 2 && !STOP.has(t) && !CLAVE.has(t) && !PAL_PREG.has(t) && t !== cn);
      if (!q.length) return [];
      const X = autoresIdx(), A_ = MD['m/autores'];
      return X.ix.map((s, i) => { let p = 0, k = 0; for (const t of q) if (s.has(t)) { p += Math.log(X.n / X.d.get(t)); k++; } return { i, p, k, cubre: k / s.size, qcov: k / q.length }; })
        .filter((x) => x.k && x.qcov >= 0.5 && (x.cubre >= 0.66 || (x.k >= 2 && x.p >= 9) || (x.k === 1 && x.p >= 6.5 && A_[x.i][1])))
        .sort((a, b) => b.qcov - a.qcov || b.k - a.k || (A_[b.i][3] || 0) - (A_[a.i][3] || 0) || b.cubre - a.cubre);
    }
    const TROZOS_FALTAN = (ks) => ks.filter((k) => !MD['m/' + k]);
    // trozos que pueden tener el título: la inicial de cada palabra de la pregunta (sin las de la propia pregunta)
    function trozosPregunta(e) {
      const ws = tokM(e.raw || e.t).filter((t) => !CLAVE.has(t) && !STOP.has(t) || /^\d/.test(t));
      return [...new Set(ws.map((w) => (/[a-z]/.test(w[0]) ? w[0] : '0')))].slice(0, 8);
    }
    function buscarTitulo(e) {
      const qt = new Set(tokM(e.raw || e.t)), qs = ' ' + tokM(e.raw || e.t).join(' ') + ' ';
      const sig = [...qt].filter((t) => !PAL_PREG.has(t) && !STOP.has(t) && !CLAVE.has(t) && !(e.ciudad && t === norm(nombreCiudad(e.ciudad))));
      const res = [];
      for (const k of trozosPregunta(e)) for (const m of MD['m/' + k] || []) {
        const tt = tokM(m[0].replace(/\(.*?\)/g, ' ')); if (!tt.length) continue;
        const dentro = qs.indexOf(' ' + tt.join(' ') + ' ') >= 0;
        const k_ = tt.filter((t) => qt.has(t)).length;
        if (!dentro && k_ < tt.length) continue;
        const cubre = sig.length ? sig.filter((t) => tt.indexOf(t) >= 0).length / sig.length : 1;
        if (cubre < 0.6) continue;
        res.push({ m, p: (dentro ? 10 : 0) + tt.length + cubre, exacto: cubre === 1 && k_ === tt.length });
      }
      res.sort((a, b) => b.p - a.p);
      const top = res.length ? res[0].p : 0;
      return res.filter((x) => x.p === top);
    }
    const autorDe = (m) => (MD['m/autores'][m[1]] || [''])[0];
    const formDe = (m) => (m[3] ? NOMBRE_FORM[m[3]] : '');
    const dedicadaTxt = (m) => { if (!m[4]) return ''; const h = POR_SLUG.get(m[4]); return h ? 'dedicada ' + cabecera(h, 'a') : 'dedicada a ' + m[4].replace(/^a\s+/i, ''); };
    function respMarchaTitulo(l) {
      const r = Resp(); ctx.intent = 'compositor';
      if (l.length === 1) {
        const m = l[0].m, a = autorDe(m);
        P(r, '«' + m[0] + '» es de ' + (a || 'autor desconocido en mis datos') + (m[2] ? ', de ' + m[2] : '') + (formDe(m) ? ', para ' + formDe(m) : '') + '.' + (dedicadaTxt(m) ? ' Está ' + dedicadaTxt(m) + '.' : ''));
        const au = MD['m/autores'][m[1]];
        A(r, [['Ver la marcha', L.marcha(m[5])], au && au[1] ? ['Más de ' + au[0], L.compositor(au[1])] : null]);
        return cerrar(r);
      }
      P(r, 'Tengo ' + l.length + ' marchas que se llaman así:');
      LI(r, l.slice(0, 8).map((x) => ({ x: '«' + x.m[0] + '»', href: L.marcha(x.m[5]), sub: [autorDe(x.m), x.m[2], formDe(x.m)].filter(Boolean).join(' · ') })));
      if (l.length > 8) P(r, 'Y ' + (l.length - 8) + ' más en el buscador de marchas.');
      A(r, [['Buscar en Marchas', L.marchas()]]);
      return cerrar(r);
    }
    function respMarchasAutor(i, e) {
      const r = Resp(), au = MD['m/autores'][i];
      let l = []; for (const k of au[2]) (MD['m/' + k] || []).forEach((m) => { if (m[1] === i) l.push(m); });
      const total = l.length; if (e.form) l = l.filter((m) => m[3] === e.form);
      l.sort((a, b) => (+b[2] || 0) - (+a[2] || 0) || a[0].localeCompare(b[0], 'es'));
      ctx.intent = 'marchasAutor';
      if (!l.length) P(r, 'De ' + au[0] + ' tengo ' + total + (total === 1 ? ' marcha' : ' marchas') + ', pero ninguna ' + e.formTxt + '.');
      else {
        P(r, 'De ' + au[0] + ' tengo ' + l.length + (l.length === 1 ? ' marcha' : ' marchas') + (e.form ? ' ' + e.formTxt : '') + (l.length > 10 ? '. Las más recientes:' : ':'));
        LI(r, l.slice(0, 10).map((m) => ({ x: '«' + m[0] + '»', href: L.marcha(m[5]), sub: [m[2], formDe(m), dedicadaTxt(m)].filter(Boolean).join(' · ') })));
      }
      A(r, [au[1] ? ['Ver todas en su ficha', L.compositor(au[1])] : ['Buscar en Marchas', L.marchas()]]);
      return cerrar(r);
    }
    function respRepertorio(i, e) {
      const r = Resp(), b = B[i], rp = (D.rp || {})[i] || [];
      ctx.banda = i; ctx.intent = 'repertorio';
      const tipo = b[2] ? ' (' + b[2].toLowerCase() + (b[3] ? ', ' + b[3] : '') + ')' : b[3] ? ' (' + b[3] + ')' : '';
      if (rp.length) {
        P(r, 'Del repertorio de ' + b[1] + tipo + ' tengo ' + rp.length + (rp.length === 1 ? ' marcha publicada:' : ' marchas publicadas:'));
        LI(r, rp.slice(0, 12).map((x) => ({ x: '«' + x[0] + '»', href: L.marcha(x[3]), sub: [x[1], x[2]].filter(Boolean).join(', ') })));
        if (rp.length > 12) P(r, 'Y ' + (rp.length - 12) + ' más en su ficha.');
        if (e.form && b[2] && !new RegExp(NOMBRE_FORM[e.form].split(' ')[0], 'i').test(b[2])) P(r, 'Ojo: es ' + b[2].toLowerCase() + ', no ' + NOMBRE_FORM[e.form] + '.');
      } else {
        const acomp = []; H.forEach((h) => (h.b || []).forEach((p) => { if (p[1].indexOf(i) >= 0) acomp.push(h); }));
        P(r, 'El repertorio completo de ' + b[1] + tipo + ' no lo tengo publicado, y no me lo voy a inventar.' + (acomp.length ? ' Lo que sí sé es a quién acompaña: ' + lista(acomp.slice(0, 6).map((h) => cabecera(h))) + (acomp.length > 6 ? ' y ' + (acomp.length - 6) + ' más' : '') + '.' : ''));
        r.flojo = true;
      }
      A(r, [b[0] ? ['Ver la banda', L.banda(b[0])] : null, rp.length ? null : ['Sugerir', L.sugerir(e.raw || '')]]);
      return cerrar(r);
    }
    // F1: con la ciudad dicha y sin esa hermandad en ella, se dice y se ofrecen las de otras capitales
    function respFuera(l, e, intent) {
      const r = Resp(), c = nombreCiudad(e.ciudad);
      ctx.pend = { intent: intent && intent !== 'lista' ? intent : 'info', lugar: e.lugar || null };
      P(r, 'En ' + c + ' no tengo ninguna cofradía que se llame así, cuñao. ' + (l.length === 1 ? 'La que conozco con ese nombre es ' + cabecera(l[0].h) + '. ¿Es esa?' : 'Las que conozco con ese nombre son de otras capitales. ¿Es alguna de estas?'));
      C(r, l.map((x) => [cabecera(x.h), '@h:' + x.h.s]));
      A(r, [['Semana Santa de ' + c, L.capital(e.ciudad)]]); r.flojo = true;
      return cerrar(r);
    }
    const RE_FORM = { CT: /cornetas/i, AM: /agrupaci/i, BM: /banda de m[uú]sica|^banda municipal|filarm/i, CM: /capilla/i };
    // F5: cofradías que llevan una formación (por su acompañamiento musical publicado)
    function respConForm(c, form, dia) {
      const r = Resp(), g = dia ? grupo(dia) : null;
      const base = H.filter((h) => (!c || h.c === c) && (!g || g.indexOf(h.d) >= 0)), conMusica = base.filter((h) => h.b && h.b.length);
      const l = conMusica.map((h) => ({ h, bs: [...new Set([].concat(...h.b.map((p) => p[1])))].filter((i) => RE_FORM[form].test(B[i][2] || B[i][1])) })).filter((x) => x.bs.length);
      const donde = (c ? ' de ' + nombreCiudad(c) : '') + (dia ? ' ' + art(dia) : '');
      ctx.intent = 'banda'; if (c) ctx.ciudad = c;
      if (!l.length) P(r, 'No tengo ninguna cofradía' + donde + ' con ' + NOMBRE_FORM[form] + ' en el acompañamiento musical que tengo publicado' + (base.length ? ' (tengo la música de ' + conMusica.length + ' de ' + base.length + ').' : '.'));
      else { P(r, 'Cofradías' + donde + ' con ' + NOMBRE_FORM[form] + ' (según su acompañamiento publicado):'); LI(r, l.slice(0, 30).map((x) => ({ x: x.h.n, href: L.herm(x.h), sub: (c ? '' : nombreCiudad(x.h.c) + ' · ') + B[x.bs[0]][1] }))); if (l.length > 30) P(r, 'Y ' + (l.length - 30) + ' más.'); }
      if (!l.length) { A(r, [['Sugerir', L.sugerir('Música de las cofradías' + donde)]]); r.flojo = true; }
      return cerrar(r);
    }
    // F5: «¿qué marchas tocan en Jaén el Viernes Santo?»: no hay repertorio por día; sí quién acompaña a cada cofradía
    function respMusica(c, dia) {
      const r = Resp(), g = dia ? grupo(dia) : null;
      if (!c && !dia) { P(r, '¿De qué capital?'); ctx.intent = 'cuantas'; return preguntaCiudad(r, null, 'lista'); }
      const l = H.filter((h) => (!c || h.c === c) && (!g || g.indexOf(h.d) >= 0)).sort((a, b) => CANON.indexOf(a.d) - CANON.indexOf(b.d) || (a.o || 99) - (b.o || 99));
      const donde = (c ? 'en ' + nombreCiudad(c) : 'en las ocho capitales') + (dia ? ' ' + art(dia) : '');
      P(r, 'Qué marchas suenan ' + donde + ' no lo sé, cuñao: eso lo decide cada banda sobre la marcha. Lo que tengo es quién acompaña a cada cofradía:');
      LI(r, l.slice(0, 30).map((h) => { const bs = h.b ? [...new Set([].concat(...h.b.map((p) => p[1])))].map((i) => B[i][1]) : []; return { x: h.n, href: L.herm(h), sub: (c ? '' : nombreCiudad(h.c) + ' · ') + (dia ? '' : h.d + ' · ') + (bs.length ? bs.slice(0, 2).join(' · ') : 'sin música en mis datos') }; }));
      P(r, 'Y en la ficha de cada una, las marchas que tiene dedicadas.');
      ctx.intent = 'banda'; if (c) ctx.ciudad = c; if (dia) ctx.dia = dia;
      return cerrar(r);
    }
    const HOLA = ['¿Qué pasa, cuñao? Pregúntame lo que quieras, que de esto sé más que nadie.', 'Aquí estoy, como siempre que hace falta. ¿Qué cofradía buscamos?', 'Dime, que llevo cuarenta Semanas Santas en el cuerpo.'];
    const NOSE = ['Eso no lo sé ni yo, y mira que sé de todo. Prueba con el nombre de la hermandad, su titular, el día o la ciudad.', 'Uy, esa no me suena. ¿Me la dices de otra forma? Por ejemplo: «¿A qué hora sale el Cautivo de Málaga?».', 'Me has pillado. Y antes de inventarme nada, prefiero decírtelo.'];
    const GRACIAS = ['A mandar. Y llévate agua, que luego to\' son prisas.', 'Para eso estamos, cuñao.', 'Nada, hombre. Y ponte en la sombra, que el sol engaña.'];
    const SUGS_INICIO = ['¿Qué sale hoy?', '¿A qué hora sale la Macarena de Sevilla?', 'Jueves Santo en Málaga', '¿Cuánto falta para la Semana Santa?'];

    // ================= decisión =================
    function responder(raw) {
      raw = String(raw || '').trim();
      // botones de desambiguación
      let m;
      if ((m = /^@h:(.+)$/.exec(raw))) { const h = POR_SLUG.get(m[1]); if (h) { const p = ctx.pend || {}; return respHerm(h, p.intent || 'info', { t: '', lugar: p.lugar, toks: [] }); } }
      if ((m = /^@c:(.+)$/.exec(raw))) {
        const c = m[1]; const it = ctx.intent;
        if (it === 'cuantas') return respCuantas(c, ctx.dia);
        if (it === 'antigua') return respAntigua(c);
        if (it === 'noticias') return respNoticias(c);
        if (it === 'cerca') return respCerca(c, ctx.dia);
        if (it === 'pasapor' && ctx.pend && ctx.pend.lugar) return respPasanPor(c, { lugar: ctx.pend.lugar, dia: ctx.dia });
        if (it === 'filtro' && ctx.pend && ctx.pend.filtro) return respFiltro(ctx.pend.filtro, c, ctx.dia);
        if (it === 'orden' && ctx.pend && ctx.pend.orden) return respOrden(ctx.pend.orden, c, ctx.dia);
        if (it === 'agenda') return respAgenda(ctx.pend && ctx.pend.agenda || { t: '' }, c);
        return respDia(ctx.dia || 'Domingo de Ramos', c);
      }
      const r0 = Resp();
      if (ctx.modo === 'sugerencia') {
        const n0 = norm(raw);
        if (/^(un dato esta mal|falta informacion|tengo una idea|enviar una sugerencia)$/.test(n0)) { P(r0, 'Venga, cuéntamelo: qué está mal o qué falta, y de qué hermandad o página.'); return cerrar(r0); }
        if (n0.length > 3) { ctx.modo = null; r0.accion = { tipo: 'sugerencia', texto: raw, hermandad: ctx.herm || '' }; return cerrar(r0); }
      }
      const e = entender(raw);
      let intent = e.intent;
      switch (intent) {
        case 'hola': P(r0, azar(HOLA)); C(r0, SUGS_INICIO.slice(0, 3)); return cerrar(r0);
        case 'gracias': P(r0, azar(GRACIAS)); return cerrar(r0);
        case 'quien': P(r0, 'Soy erCuñao: el que sabe dónde va cada cofradía, a qué hora sale, quién talló sus imágenes y qué banda lleva detrás. No soy una inteligencia artificial: contesto con los datos del portal, y si algo no lo sé, te lo digo.'); C(r0, SUGS_INICIO.slice(0, 3)); return cerrar(r0);
        case 'ayuda':
          P(r0, 'Pregúntame cosas como:');
          LI(r0, ['¿Qué sale hoy en Sevilla? / ¿Y el martes?', '¿A qué hora sale la Esperanza de Triana?', '¿Por dónde pasa el Cautivo de Málaga?', '¿Cuándo pasa la Macarena por la Campana?', '¿Quién talló el Cristo del Cachorro?', '¿Qué banda lleva la Paloma?', '¿Quién es Juan de Mesa?', '¿Cuántas hermandades tiene Jaén?', '¿Cuánto falta para la Semana Santa?', 'Noticias de Granada'].map((x) => ({ x })));
          C(r0, ['¿Qué sale hoy?', 'Noticias de Sevilla']); return cerrar(r0);
        case 'sugerencia':
          ctx.modo = 'sugerencia';
          P(r0, 'Venga, cuéntamelo con detalle: qué está mal o qué falta, y de qué hermandad o página. Lo leemos todo y lo revisamos con su fuente.');
          C(r0, ['Un dato está mal', 'Falta información', 'Tengo una idea']); return cerrar(r0);
      }
      // «¿y …?» sin pregunta propia hereda la anterior
      const sigue = /^y\b/.test(e.t) || e.t.split(' ').length <= 3;
      if (!intent && sigue && ctx.intent && ctx.intent !== 'info') intent = ctx.intent;
      // jornada a partir de «hoy», «mañana», «el día siguiente»
      let dia = e.dia || null;
      if (!dia && e.diaRel != null) { dia = jornadaDeFecha(hoyISO(e.diaRel)); e.fueraDeFecha = !dia; }
      if (!dia && e.fechaISO) { dia = jornadaDeFecha(e.fechaISO); e.fueraDeFecha = !dia; }
      if (!dia && e.diaSig && ctx.dia) dia = CANON[CANON.indexOf(ctx.dia) + 1] || null;
      if (!dia && e.tFiltro && sigue && ctx.dia && ctx.intent === 'lista') dia = ctx.dia;
      e.dia = dia;

      if (intent === 'falta' && e.toks.every((t) => /^\d{4}$/.test(t))) return respFalta(e);
      // imaginero con nombre y apellidos antes que las palabras sueltas de los titulares («¿De dónde era Antonio León Ortega?»)
      if (intent !== 'autor') {
        const im = I.map((x, i) => [i, norm(x[1])]).filter((x) => x[1].indexOf(' ') > 0 && new RegExp('(^| )' + x[1] + '( |$)').test(e.t)).sort((a, b) => b[1].length - a[1].length)[0];
        if (im) return respImag(im[0]);
      }
      if (intent === 'finde') return respFinde(e);
      if (intent === 'curiosidad') return respCuriosidad();
      if (intent === 'antigua') {
        const c = e.ciudad || ctx.ciudad || pagina() || preferida();
        if (c) return respAntigua(c);
        const r = Resp(); P(r, '¿De qué capital?'); ctx.intent = 'antigua'; return preguntaCiudad(r, null, 'antigua');
      }
      // hermandad
      const bh = buscarHerm(e);
      // si el nombre que casa ya lleva una palabra de intención («El Vía Crucis», «La Cena»), la intención sale del resto de la pregunta
      if (bh.elegida && bh.elegida.frase && intencion(bh.elegida.frase)) intent = intencion((' ' + e.t + ' ').replace(' ' + bh.elegida.frase + ' ', ' ').trim());
      // «pasa por X»: si la hermandad solo sale de las palabras del lugar, es una búsqueda de lugar
      if (intent === 'pasapor' && e.lugar && /\b(carrera|catedral|tribuna|estacion de penitencia)\b/.test(e.lugar)) { intent = 'carrera'; e.lugar = null; }
      // «¿cuándo pasa la Macarena por la Campana?»: con varias Macarenas, manda la que tiene esa calle en su itinerario
      if (intent === 'pasapor' && bh.dudas && e.lugar) {
        const cs = [...new Set(bh.dudas.map((d) => d.h.c))].filter((c) => !tengoCiudad(c));
        if (cs.length) return necesitaVarios(cs);
        const con = bh.dudas.filter((d) => { const R = CIUDADES[d.h.c].r[d.h.s]; if (!R) return false; const lu = toks(e.lugar).filter((t) => !d.usadas.includes(stem(t))).join(' '); return lu && (buscarLugar(R.p, lu, d.h).length || buscarLugar((R.c || []).map((l) => ['', l, 0, 0]), lu, d.h).length); });
        if (con.length === 1) { bh.elegida = con[0]; bh.dudas = null; }
      }
      if (intent === 'pasapor' && bh.lista.length && e.lugar) {
        // el lugar es lo que queda tras quitar el nombre de la hermandad («por la Campana la Macarena» → «Campana»)
        const x = bh.elegida || bh.lista[0];
        const quitar = new Set(x.usadas);
        IDX.find((i) => i.h.s === x.h.s).frases.forEach((f) => f.split(' ').forEach((w) => quitar.add(stem(w))));
        const resto = toks(e.lugar).filter((t) => !quitar.has(stem(t)) && !STOP.has(t) && !(e.ciudad && t === norm(nombreCiudad(e.ciudad))) && !e.usadas.has(t));
        // las hermandades van antes que las calles: si el «lugar» es justo el nombre de una cofradía («pasa por la Esperanza de Triana»), se habla de ella
        if (!resto.length && x.frase) { intent = 'recorrido'; e.lugar = null; }
        else if (!resto.length) { bh.lista = []; bh.elegida = null; bh.dudas = null; }
        else e.lugar = resto.join(' ');
      }
      // repertorio de una banda («¿qué marchas de cornetas toca Tres Caídas?»)
      if (intent === 'repertorio' || (intent === 'marchas' && /\b(toca|tocan|tocaba|interpreta\w*)\b/.test(e.t))) {
        const bb = buscarEn(BIX, e, 3);
        if (bb.length) return respRepertorio(bb[0].i, e);
        if (ctx.banda != null && !bh.elegida && !e.toks.filter((t) => t.length > 2).length) return respRepertorio(ctx.banda, e);
        if (intent === 'repertorio' && !bh.elegida && (e.ciudad || e.dia) && !/\b(banda|agrupacion|capilla|filarmonica)\b/.test(e.t)) return respMusica(e.ciudad || ctx.ciudad, e.dia);
        if (intent === 'repertorio' && !bh.elegida) {
          const r = Resp(); ctx.intent = 'repertorio';
          P(r, 'Esa banda no la encuentro entre las que tengo, cuñao. Dímela con su nombre completo (por ejemplo, «Tres Caídas de Triana»); y si falta, mándamela con su fuente.');
          A(r, [['Ver las bandas', BASE + 'bandas/'], ['Sugerir', L.sugerir(raw)]]); r.flojo = true;
          return cerrar(r);
        }
      }
      // un título de marcha entero («Soberana y Jaenera») manda sobre una hermandad que solo casa con parte de la pregunta
      if ((intent == null || intent === 'marchas') && !e.dia) {
        const top = bh.elegida || bh.lista[0], cn = e.ciudad ? norm(nombreCiudad(e.ciudad)) : '';
        const sig = [...new Set(tokM(e.raw || e.t))].filter((t) => t.length > 2 && !PAL_PREG.has(t) && !STOP.has(t) && !CLAVE.has(t) && t !== cn);
        if (sig.length >= 2 && (!top || (!top.frase && sig.some((t) => top.usadas.indexOf(stem(t)) < 0)))) {
          const falta = TROZOS_FALTAN(trozosPregunta(e).slice(0, 4));
          if (!MD['m/autores'] || falta.length) return necesitaVarios((MD['m/autores'] ? [] : ['m/autores']).concat(falta.map((k) => 'm/' + k)));
          const t = buscarTitulo(e).filter((x) => x.exacto);
          if (t.length) return respMarchaTitulo(t);
        }
      }
      // marchas del catálogo entero: título («¿quién compuso Amarguras?») o compositor («marchas de Abel Moreno»)
      const marchaGlobal = intent === 'compositor' || (intent === 'marchas' && !bh.elegida && !bh.dudas && !(ctx.herm && sigue && !e.toks.filter((t) => t.length > 2).length));
      if (marchaGlobal) {
        if (!MD['m/autores']) return necesitaVarios(['m/autores']);
        const falta = TROZOS_FALTAN(trozosPregunta(e));
        const au = buscarAutor(e);
        if (intent === 'compositor' || !au.length) {
          if (falta.length) return necesitaVarios(falta.map((k) => 'm/' + k));
          const t = buscarTitulo(e).filter((x) => tokM(x.m[0]).some((w) => !PAL_PREG.has(w) && !STOP.has(w)));
          if (t.length) return respMarchaTitulo(t);
        }
        if (au.length) {
          const f2 = TROZOS_FALTAN(MD['m/autores'][au[0].i][2].split(''));
          if (f2.length) return necesitaVarios(f2.map((k) => 'm/' + k));
          return respMarchasAutor(au[0].i, e);
        }
        // «¿quién compuso las marchas de la Estrella?»: si hay hermandad, sus marchas dedicadas
        if (!bh.elegida) {
          const r = Resp(); ctx.intent = 'compositor';
          P(r, 'Esa marcha no la encuentro en el catálogo de Marchas, cuñao. Prueba con el título exacto o con el nombre del compositor; y si falta, mándamela con su fuente.');
          A(r, [['Buscar en Marchas', L.marchas()], ['Sugerir', L.sugerir(raw)]]); r.flojo = true;
          return cerrar(r);
        }
        intent = 'marchas';
      }
      // «¿qué cofradías de Jaén llevan cornetas y tambores?»
      if ((intent === 'banda' || intent === 'repertorio' || intent === 'lista') && e.form && /\b(que|cuales|quienes) (cofradias|hermandades|procesiones|pasos)\b|\bquien(es)? (lleva|llevan)\b|\b(cofradias|hermandades) (que|con) (lleva|llevan)\b/.test(e.t)) return respConForm(e.ciudad || ctx.ciudad || null, e.form, e.dia);
      // banda «¿a quién acompaña…?»
      const inversa = /\b(a quien|a quienes|a que (hermandad|cofradia)\w*|con quien|que hermandades|que cofradias|donde toca|a cuales)\b/.test(e.t) && (intent === 'banda' || /\b(banda|agrupacion|cornetas|tambores|musica)\b/.test(e.t));
      if (inversa) {
        const bb = buscarEn(BIX, e, 3);
        if (bb.length) return respBanda(bb[0].i);
      }
      // imaginero
      const imagTxt = intent === 'imaginero' || (intent === 'autor' && !bh.lista.length);
      if (imagTxt || !bh.lista.length) {
        const ii = buscarEn(IIX, e, imagTxt ? 2.5 : 5);
        if (ii.length && (imagTxt || ii[0].k >= 2)) {
          const top = ii[0].p, dudas = ii.filter((x) => x.p >= top - 0.5);
          if (dudas.length > 1 && dudas[0].k === dudas[1].k) { const r = Resp(); P(r, '¿Qué imaginero, cuñao?'); C(r, dudas.slice(0, 6).map((d) => [I[d.i][1], 'Quién es ' + I[d.i][1]])); return cerrar(r); }
          return respImag(ii[0].i);
        }
        if (intent === 'imaginero' && ctx.imag != null && !e.toks.length) return respImag(ctx.imag);
      }
      const necesitaHerm = ['hora', 'cuando', 'sede', 'autor', 'banda', 'marchas', 'recorrido', 'pasapor', 'carrera', 'entrada', 'historia', 'pasos', 'web', 'titulares', 'habito', 'oficial', 'duracion', 'orden', 'sinDato', 'agenda'];
      // «¿cuál es la primera de Jaén?» o «¿qué sale el jueves antes de las 19:00?»: lista, no una hermandad suelta
      if (bh.fuera && (intent == null || intent === 'info' || necesitaHerm.indexOf(intent) >= 0)) return respFuera(bh.fuera, e, intent);
      const listaFiltrada = (intent === 'orden' || e.tFiltro) && !e.fueraDeFecha && !(bh.elegida && bh.elegida.s >= 4);
      if (bh.elegida && !listaFiltrada) return respHerm(bh.elegida.h, intent && intent !== 'lista' && intent !== 'cuantas' && intent !== 'falta' ? intent : (intent === 'lista' && !dia ? 'hora' : 'info'), e);
      if (listaFiltrada) {
        const c = e.ciudad || ctx.ciudad || pagina() || preferida();
        if (intent === 'orden') {
          if (c) return respOrden(e, c, dia);
          const r = Resp(); P(r, '¿De qué capital?'); ctx.pend = { orden: { t: e.t } }; ctx.dia = dia; return preguntaCiudad(r, dia, 'orden');
        }
        if (c || dia) return respFiltro(e, c, dia);
        const r = Resp(); P(r, '¿De qué capital?'); ctx.pend = { filtro: { desde: e.desde, hasta: e.hasta, franja: e.franja } }; ctx.dia = dia; return preguntaCiudad(r, dia, 'filtro');
      }
      if (bh.dudas) return respDudas(bh.dudas, intent && necesitaHerm.indexOf(intent) >= 0 || intent === 'cerca' ? intent : 'info', e);
      if (intent === 'falta') return respFalta(e);
      if (intent === 'agenda' && !(ctx.herm && sigue)) {
        const c = e.ciudad || ctx.ciudad || pagina() || preferida();
        if (c) return respAgenda(e, c);
        const r = Resp(); P(r, '¿De qué capital quieres la agenda?'); ctx.pend = { agenda: { t: e.t } }; return preguntaCiudad(r, null, 'agenda');
      }
      if (intent === 'sinDato' && !ctx.herm) { const r = Resp(); P(r, 'Ese dato no lo tengo, cuñao, y no me lo voy a inventar. Si lo sabes con su fuente, mándamelo.'); A(r, [['Sugerir', L.sugerir(raw)]]); r.flojo = true; return cerrar(r); }
      if (intent === 'noticias') {
        const c = e.ciudad || ctx.ciudad || pagina() || preferida();
        if (c) return respNoticias(c);
        const r = Resp(); P(r, '¿Noticias de qué capital?'); ctx.intent = 'noticias'; return preguntaCiudad(r, null, 'noticias');
      }
      // banda nombrada sin hermandad: a quién acompaña
      if (intent === 'banda' && !ctx.herm || (intent === 'banda' && e.toks.length >= 2)) { const bb = buscarEn(BIX, e, 4); if (bb.length) return respBanda(bb[0].i); }
      // pregunta sobre «ella» (la última hermandad)
      if (intent && necesitaHerm.indexOf(intent) >= 0 && ctx.herm && !e.ciudad && !(dia && intent === 'hora')) {
        if (intent === 'pasapor' && !e.lugar) e.lugar = e.toks.join(' ');
        return respHerm(POR_SLUG.get(ctx.herm), intent, e);
      }
      if (intent === 'cerca' && ctx.herm && !e.ciudad && !dia) return respHerm(POR_SLUG.get(ctx.herm), 'cerca', e);
      const ciudad = e.ciudad || (sigue || dia || intent ? ctx.ciudad : null);
      if (intent === 'cuantas') return respCuantas(e.ciudad || ctx.ciudad, dia);
      if (intent === 'pasapor' && e.lugar) {
        const c = ciudad || pagina() || preferida();
        if (c) return respPasanPor(c, e);
        const r = Resp(); P(r, '¿En qué ciudad está ese sitio?'); ctx.pend = { lugar: e.lugar }; ctx.dia = dia; return preguntaCiudad(r, null, 'pasapor');
      }
      if (intent === 'cerca') {
        const c = ciudad || pagina() || preferida(), d = dia || jornadaDeFecha(hoyISO(0));
        if (c) return respCerca(c, d);
        const r = Resp(); P(r, '¿En qué ciudad estás?'); return preguntaCiudad(r, d, 'cerca');
      }
      if (dia || e.fueraDeFecha) {
        // fuera de Semana Santa: salidas extraordinarias, vía crucis y cultos de ese día (o lo próximo que haya)
        if (!dia) return respActos(e.fechaISO || hoyISO(e.diaRel || 0), e.ciudad || null, e);
        const c = ciudad || pagina() || preferida();
        if (!c) { const r = Resp(); P(r, '¿De qué capital? Que ' + art(dia) + ' sale mucha gente en las ocho.'); return preguntaCiudad(r, dia, 'lista'); }
        return respDia(dia, c);
      }
      if (e.ciudad) {
        if (ctx.dia && sigue && (ctx.intent === 'lista')) return respDia(ctx.dia, e.ciudad);
        const r = Resp(), c = e.ciudad; ctx.ciudad = c; ctx.intent = null;
        const ci = (D.ci || {})[c];
        P(r, nombreCiudad(c) + (ci ? ': ' + (ci[2] || ci[0] + ' ' + ci[1]) + ', y de todas tengo ficha' : ': tengo ' + H.filter((h) => h.c === c).length + ' fichas') + '. ¿Qué quieres saber?');
        A(r, [['Semana Santa de ' + nombreCiudad(c), L.capital(c)]]);
        C(r, ['¿Qué sale hoy en ' + nombreCiudad(c) + '?', 'Domingo de Ramos en ' + nombreCiudad(c), 'Noticias de ' + nombreCiudad(c)]);
        return cerrar(r);
      }
      if (intent && necesitaHerm.indexOf(intent) >= 0) { const r = Resp(); P(r, '¿De qué cofradía me hablas? Dime su nombre, su titular o su apodo.'); r.flojo = true; return cerrar(r); }
      const r = Resp();
      P(r, azar(NOSE));
      A(r, [['Buscarlo en el portal', L.buscar(raw)], ['Sugerir', L.sugerir(raw)]]);
      C(r, ['¿Qué sabes hacer?']);
      r.flojo = true; r.nose = true;
      return cerrar(r);
    }
    return {
      responder, ctx, SUGS_INICIO, HOLA: () => azar(HOLA),
      cargarCiudad: (c, datos) => { if (/^m\//.test(c)) MD[c] = datos; else CIUDADES[c] = datos; },
      cargarDatos: (c, datos) => { if (/^m\//.test(c)) MD[c] = datos; else CIUDADES[c] = datos; },
      tieneCiudad: tengoCiudad,
      _interno: { norm, stem, distancia, entender, buscarHerm, corrige },
    };
  }

  // ================= Node (pruebas) =================
  if (typeof module === 'object' && module && module.exports) { module.exports = { crearMotor, norm }; }
  if (typeof document === 'undefined') return;

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
  function cargar() {
    if (motor) return Promise.resolve();
    if (!cargando) cargando = fetch(url).then((r) => { if (!r.ok) throw 0; return r.json(); }).then((j) => { motor = crearMotor(j, { base: BASE, preferida, pagina: () => paginaCiudad(j) }); }).catch((e) => { cargando = null; throw e; });
    return cargando;
  }
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
      f.appendChild(chips(['¿Qué sale hoy?', '¿A qué hora sale la Macarena de Sevilla?', 'Jueves Santo en Málaga', 'Quiero avisar de un error'].map((x) => [x, x])));
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
})(this);
