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
  const CLAVE = set('hora horas ora horario horarios sale salen salir salida salidas sali entra entran entrada entrar recoge recogida recogen encierro vuelve regresa termina acaba pasa pasan pasar paso pasos trono tronos recorrido recorridos itinerario itinerarios ruta calle calles carrera oficial catedral campana tribuna sede templo iglesia parroquia capilla banda bandas musica toca tocan acompana acompanan acompanamiento cornetas tambores agrupacion musical marcha marchas suena suenan dedicada dedicadas imaginero imagineros talla tallo tallaron autor autora escultor esculpio hizo hicieron historia fundacion fundada fundo origen web pagina noticias noticia novedades cerca mapa ubicacion misterio palio costaleros costalero portadores titulares titular imagen imagenes dia dias jornada fecha falta faltan queda quedan obras obra hoy manana pasado ayer noche tarde ahora llega llegan cuantas cuantos siguiente');
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
    [/\bbcyt\b|\bbct\b/g, 'banda cornetas tambores'], [/\bam\b(?= )/g, 'agrupacion musical'], [/\bsemana mayor\b/g, 'semana santa'],
  ];
  // apodos que no están en el nombre de la ficha (solo los que no admiten duda)
  const APODOS = [['senor de sevilla', 'el-gran-poder-sevilla'], ['los armaos', 'la-macarena-sevilla'], ['la esperanza macarena', 'la-macarena-sevilla']];
  const RE_MARIANA = /^(maria|nuestra senora|ntra|virgen|santa maria|madre de dios|la virgen|dolorosa)|dolorosa|^(la )?(soledad|esperanza|amargura|angustias|dolores|piedad|estrella|paz)\b/;

  // ================= motor =================
  function crearMotor(D, op) {
    op = op || {};
    const BASE = op.base || '/';
    const azar = op.azar || ((l) => l[Math.floor(Math.random() * l.length)]);
    const hoyISO = op.hoy || ((mas) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid' }).format(new Date(Date.now() + (mas || 0) * 864e5)));
    const horaAhora = op.horaAhora || (() => +new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Madrid', hour: 'numeric', hourCycle: 'h23' }).format(new Date()));
    const preferida = op.preferida || (() => null);
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
    function corrige(t) {
      if (conocida(t)) return t;
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
    const art = (d) => (d === 'Madrugá' ? 'la Madrugá' : d === 'Vísperas' ? 'en las Vísperas' : d === 'Jueves Santo y Madrugada' ? 'el Jueves Santo (y la Madrugada)' : /^Hermandades/.test(d) ? 'en ' + d.toLowerCase() : 'el ' + d);
    const minutos = (t) => { const m = /^(\d{1,2}):(\d{2})/.exec(t || ''); if (!m) return null; const v = +m[1] * 60 + +m[2]; return v < 360 ? v + 1440 : v; };

    // ---- enlaces ----
    const L = {
      herm: (h) => BASE + 'hermandad/' + h.s + '/', banda: (s) => BASE + 'banda/' + s + '/', imag: (s) => BASE + 'imaginero/' + s + '/', marcha: (s) => BASE + 'marcha/' + s + '/',
      capital: (c) => BASE + 'semana-santa/' + c + '/', noticias: (c) => BASE + 'noticias/?ciudad=' + c, buscar: (q) => BASE + 'buscar/?q=' + encodeURIComponent(q),
      calle: (c, d) => BASE + 'en-la-calle/' + c + '/' + (d ? '?dia=' + encodeURIComponent(diaEnCiudad(c, d)) : ''),
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
      r.partes.forEach((p) => { if (p.t === 'p') p.x = p.x.replace(/de El /g, 'del ').replace(/a El /g, 'al '); });
      r.texto = r.partes.map((p) => (p.t === 'p' ? p.x : p.t === 'lista' ? p.items.map((i) => i.x + (i.sub ? ' · ' + i.sub : '')).join('\n') : '')).join('\n');
      r.enlaces = [].concat(...r.partes.filter((p) => p.t === 'acc').map((p) => p.l), ...r.partes.filter((p) => p.t === 'lista').map((p) => p.items.filter((i) => i.href).map((i) => [i.x, i.href])));
      return r;
    }
    const necesita = (c) => { const r = Resp(); r.necesita = [c]; return r; };
    const tengoCiudad = (c) => !!CIUDADES[c];

    // ================= comprensión =================
    function entender(raw) {
      let n = norm(raw);
      for (const [re, x] of SINONIMOS) n = n.replace(re, x);
      // erratas: palabra a palabra contra el vocabulario del portal
      n = n.split(' ').map(corrige).join(' ');
      const e = { raw, t: n, usadas: new Set() };
      // ciudad (nombre o gentilicio)
      for (const [s, nom] of D.capitales) { const k = norm(nom); if (new RegExp('\\b' + k + '\\b').test(n)) { e.ciudad = s; e.usadas.add(k); } }
      if (!e.ciudad) for (const [g, s] of GENTILICIO) { const m = new RegExp('\\b(' + g + '\\w*)').exec(n); if (m) { e.ciudad = s; e.usadas.add(m[1]); } }
      // jornada (frase o relativa)
      let m;
      if (/\bpasado manana\b/.test(n)) e.diaRel = 2; else if (/\bmanana\b/.test(n)) e.diaRel = 1; else if (/\b(hoy|ahora|esta noche|esta tarde|ahora mismo)\b/.test(n)) e.diaRel = 0; else if (/\bayer\b/.test(n)) e.diaRel = -1;
      if (/\b(el|al) dia siguiente\b|\bel siguiente\b|\bdespues\b/.test(n)) e.diaSig = true;
      for (const [f, d] of DIA_FRASES) if ((m = new RegExp('\\b' + f + '\\b').exec(n))) { e.dia = d; f.split(' ').forEach((w) => e.usadas.add(w)); break; }
      // el «domingo» a secas, con resurrección delante, es el de Pascua
      if (e.dia === 'Domingo de Ramos' && /\bresurreccion\b/.test(n) && !/\bramos\b/.test(n)) e.dia = 'Domingo de Resurrección';
      e.intent = intencion(n);
      e.toks = n.split(' ').filter((t) => t && !e.usadas.has(t) && !CLAVE.has(t));
      // segmento de lugar: «pasa por X», «llega a X»
      const pm = /\b(?:pasa|pasan|pasara|llega|llegan|esta|estara|ver(?:la|lo)?|veo)\s+(?:por|a|en)\s+(?!donde\b)(.+)$/.exec(n) || /\bpor\s+(?!donde\b)((?:la |el |los |las )?(?:calle |plaza |avenida |avda )?\w+(?: \w+){0,5})$/.exec(n);
      if (pm && (e.intent === 'pasapor' || e.intent === 'hora' || e.intent === 'cerca')) { e.lugar = pm[1]; if (e.intent !== 'pasapor') e.intent = 'pasapor'; }
      return e;
    }
    function intencion(n) {
      const T = (re) => re.test(n);
      if (T(/^(hola|buenas|buenos dias|buenas tardes|buenas noches|que pasa|que tal|ey|hey|saludos|ole)\b/) && n.split(' ').length < 5) return 'hola';
      if (T(/\b(gracias|grasias|genial|perfecto|estupendo|ole tu|muy bien)\b/) && n.split(' ').length < 6) return 'gracias';
      if (T(/\b(quien eres|que eres|como te llamas|eres una? (ia|robot|bot|maquina))\b/)) return 'quien';
      if (T(/\b(que sabes( hacer)?|que puedes hacer|ayuda|ayudame|como funciona|que te puedo preguntar|instrucciones)\b/)) return 'ayuda';
      if (T(/\b(error|errores|equivocad\w*|sugerencia|sugerir|corregir|avisar de|aviso|un dato (esta )?mal|esta mal|falta (un|una|informacion|algo|el|la)\b|tengo una idea|enviar una sugerencia)/) && !T(/cuanto falta/)) return 'sugerencia';
      if (T(/\b(cuanto|cuantos dias|cuantas semanas) (falta|faltan|queda|quedan)\b|\bcuenta atras\b|\bcuando (es|empieza|cae|sera|son|llega)\b(?!.*\b(sale|salen|pasa|entra)\b)|\bque (fecha|dia) (es|cae|empieza)\b|\ben que fecha\b/)) return 'falta';
      if (T(/\b(noticias?|novedad(es)?|actualidad|ultima hora|que se sabe)\b/)) return 'noticias';
      if (T(/\b(cuant[ao]s) (hermandades|hermandad|cofradias|salen|hay|tiene|procesiones|pasos salen)\b|\bnumero de (hermandades|cofradias)\b/)) return 'cuantas';
      if (T(/\b(quien es|quien era|quien fue|biografia|obras de|que obras|obra de|que (ha )?(tallado|hecho)|que hizo|que tallo)\b/) && !T(/\bquien (lo |la |le )?(tallo|hizo|esculpio)\b/)) return 'imaginero';
      if (T(/\b(quien (lo |la |los |las |le )?(tallo|hizo|talla|esculpio|realizo|labro)|autor|autora|imaginer\w*|escultor\w*|tallad\w*|talla de|tallo|de quien es)\b/)) return 'autor';
      if (T(/\bmarchas?\b|\bdedicad\w*\b|\bque (suena|suenan)\b/)) return 'marchas';
      if (T(/\b(banda|bandas|musica|acompan\w*|toca|tocan|cornetas|tambores|agrupacion musical|capilla musical|banda de musica)\b/)) return 'banda';
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
          let s = 0; const usadas = [];
          for (const t of new Set(q)) { const w = x.F.has(t) ? 1 : x.M.has(t) ? 0.7 : x.W.has(t) ? 0.35 : 0; if (w) { s += w * idf(t); usadas.push(t); } }
          for (const f of x.frases) if (new RegExp('(^| )' + f + '( |$)').test(e.t)) { s += f.indexOf(' ') > 0 && APODOS.some((a) => a[0] === f) ? 8 : 4; break; }
          if (s <= 0) continue;
          if (dias && (dias.indexOf(x.h.d) >= 0 || (x.h.x || []).some((v) => dias.indexOf(v[0]) >= 0))) s += 1;
          if (!filtroCiudad && ctx.ciudad === x.h.c) s += 0.4;
          out.push({ h: x.h, s, usadas });
        }
        return out.filter((r) => r.s >= 2.2).sort((a, b) => b.s - a.s);
      };
      let res = e.ciudad ? puntua(e.ciudad) : puntua(null);
      if (!res.length && e.ciudad) res = puntua(null).map((r) => Object.assign(r, { otraCiudad: true }));
      if (!res.length) return { lista: [] };
      const top = res[0].s, cerca = res.filter((r) => r.s >= top - 0.9);
      if (cerca.length > 1 && !e.ciudad) {
        // empate entre ciudades: manda la del contexto o la preferida del visitante
        for (const c of [ctx.ciudad, preferida()]) { const en = cerca.filter((r) => r.h.c === c); if (c && en.length === 1) return { lista: res, elegida: en[0] }; }
      }
      return { lista: res, elegida: cerca.length === 1 ? res[0] : null, dudas: cerca.length > 1 ? cerca.slice(0, 8) : null };
    }
    function buscarEn(ix, e, minimo) {
      const q = e.toks.filter((t) => t.length > 2 && !STOP.has(t)).map(stem);
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
    function cabecera(h) { return h.n + ' (' + nombreCiudad(h.c) + ')'; }
    function enlacesHerm(h, conMapa) {
      return [['Ver la ficha', L.herm(h)], conMapa && D.mapa.indexOf(h.c) >= 0 && h.r ? ['Verla en el mapa', L.calle(h.c, h.d)] : null];
    }
    function respHerm(h, intent, e) {
      const r = Resp(), c = nombreCiudad(h.c);
      const req = ['recorrido', 'pasapor', 'historia', 'pasos', 'marchas'].indexOf(intent) >= 0;
      if (req && !tengoCiudad(h.c)) return necesita(h.c);
      const CD = CIUDADES[h.c];
      ctx.herm = h.s; ctx.ciudad = h.c; ctx.intent = intent; ctx.pend = null;
      const sal = salidaTxt(h);
      switch (intent) {
        case 'hora': case 'cuando': {
          P(r, azar(PREF) + h.n + ' (' + c + ') sale ' + art(h.d) + (sal ? ' ' + sal : '') + (h.se ? ' desde ' + conArt(h.se) : '') + '.');
          if (!sal) P(r, 'La hora de salida aún no la tengo, y no me la voy a inventar.');
          else if (!h.h && h.r) P(r, 'La hora sale del itinerario de ' + (D.anio - 1) + '; cuando se publique el de ' + D.anio + ' se actualiza.');
          (h.x || []).forEach((x) => P(r, 'Además, ' + art(x[0]) + ' sale ' + (x[3] || 'una imagen') + (x[1] ? ' a las ' + x[1] : '') + (x[2] ? ' desde ' + conArt(x[2]) : '') + '.'));
          if (D.fechas[h.d]) P(r, cap1(art(h.d)) + ' de ' + D.anio + ' cae el ' + fechaCorta(D.fechas[h.d]) + '.');
          A(r, enlacesHerm(h, true)); break;
        }
        case 'sede': {
          P(r, h.se ? 'La sede de ' + h.n + ' (' + c + ') es ' + conArt(h.se) + '. De allí sale ' + art(h.d) + (sal ? ' ' + sal : '') + '.' : 'De ' + h.n + ' no tengo apuntada la sede.');
          A(r, enlacesHerm(h, false)); break;
        }
        case 'autor': {
          const sel = /\b(virgen|dolorosa|palio|maria|senora|ella)\b/.test(e.t) ? 'v' : /\b(cristo|senor|jesus|nazareno|crucificado|misterio|el)\b/.test(e.t) && /\b(cristo|senor|jesus|nazareno|crucificado|misterio)\b/.test(e.t) ? 'c' : null;
          let ts = h.t.filter((t) => !sel || (sel === 'v') === RE_MARIANA.test(norm(t[0])));
          if (!ts.length) ts = h.t;
          if (!ts.length) { P(r, 'De ' + h.n + ' no tengo los titulares apuntados.'); break; }
          P(r, (ts.length === 1 ? 'La imagen' : 'Las imágenes') + ' de ' + cabecera(h) + ':');
          LI(r, ts.map((t) => ({ x: t[0], sub: t[1] || 'autor sin documentar en mis datos', href: t[2] >= 0 && I[t[2]] ? L.imag(I[t[2]][0]) : '' })));
          const im = ts.find((t) => t[2] >= 0); if (im) ctx.imag = im[2];
          A(r, [['Ver la ficha', L.herm(h)], im ? ['Más de ' + I[im[2]][1], L.imag(I[im[2]][0])] : null]); break;
        }
        case 'banda': {
          if (h.b && h.b.length) {
            const pasos = h.b.filter((p) => p[1].length);
            if (pasos.length === 1 && !pasos[0][0]) P(r, 'A ' + h.n + ' (' + c + ') le pone música: ' + lista(pasos[0][1].map((i) => B[i][1])) + '.');
            else { P(r, 'Música de ' + cabecera(h) + (h.ba ? ' (acompañamientos de ' + h.ba + ')' : '') + ':'); LI(r, pasos.map((p) => ({ x: p[0] || 'Acompañamiento', sub: p[1].map((i) => B[i][1]).join(' · ') }))); }
            const con = [].concat(...pasos.map((p) => p[1])).filter((i) => B[i][0]);
            if (con.length) ctx.banda = con[0];
            A(r, [['Ver la ficha', L.herm(h)], con.length ? ['Ver ' + (B[con[0]][1].length > 34 ? 'la banda' : B[con[0]][1]), L.banda(B[con[0]][0])] : null]);
          } else if (h.mu) { P(r, 'De ' + cabecera(h) + ' tengo apuntado esto: ' + h.mu); A(r, [['Ver la ficha', L.herm(h)]]); }
          else { P(r, 'No tengo el acompañamiento musical de ' + cabecera(h) + '. Si lo sabes, cuéntamelo y lo añadimos.'); C(r, ['Enviar una sugerencia']); return cerrar(r); }
          break;
        }
        case 'marchas': {
          const m = (CD.m || {})[h.s] || [];
          if (m.length) {
            P(r, 'Marchas dedicadas a ' + cabecera(h) + ' (' + m.length + '):');
            LI(r, m.slice(0, 8).map((x) => ({ x: '«' + x[0] + '»', sub: [x[1], x[2]].filter(Boolean).join(', '), href: x[3] ? L.marcha(x[3]) : '' })));
            if (m.length > 8) P(r, 'Y ' + (m.length - 8) + ' más en su ficha.');
          } else if (h.mu && /«/.test(h.mu)) P(r, 'Marchas dedicadas no tengo, pero de su música sé esto: ' + h.mu);
          else P(r, 'No tengo marchas dedicadas a ' + cabecera(h) + ' en mis datos. Si conoces alguna, mándamela.');
          A(r, [['Ver la ficha', L.herm(h)]]); break;
        }
        case 'recorrido': {
          const R = CD.r[h.s];
          if (!R) { P(r, 'El itinerario de ' + cabecera(h) + ' no lo tengo todavía. Sale ' + art(h.d) + (sal ? ' ' + sal : '') + (h.se ? ' desde ' + conArt(h.se) : '') + '.'); A(r, [['Ver la ficha', L.herm(h)]]); break; }
          P(r, 'Recorrido de ' + cabecera(h) + ', ' + art(h.d) + ' (itinerario ' + (CD.anio || '') + ', horas del ' + R.k + '):');
          LI(r, resumirRuta(R.p).map((p) => ({ x: bonito(p[1]) || '—', sub: (p[2] ? '' : '≈ ') + p[0] })));
          P(r, '«≈» es hora aproximada (franja de media hora). Puede ir adelantada o retrasada.');
          A(r, [['Verla en el mapa', L.calle(h.c, h.d)], ['Ver la ficha', L.herm(h)]]); break;
        }
        case 'pasapor': {
          const R = CD.r[h.s];
          if (!R) { P(r, 'No tengo el itinerario de ' + cabecera(h) + ', así que no sé decirte por dónde pasa.'); break; }
          const hits = buscarLugar(R.p, e.lugar || '', h);
          if (hits.length) {
            P(r, 'Según el itinerario de ' + (CD.anio || '') + ', ' + h.n + ' pasa por ' + bonito(hits[0][1]) + ' ' + horaTxt(hits[0][0], hits[0][2]) + (hits.length > 1 ? ' y vuelve a pasar ' + hits.slice(1, 3).map((x) => horaTxt(x[0], x[2])).join(' y ') : '') + ' (' + art(h.d) + ').');
          } else {
            P(r, 'No veo «' + (e.lugar || 'ese sitio') + '» en el itinerario de ' + cabecera(h) + '. Pasa por: ' + lista(resumirRuta(R.p).map((p) => bonito(p[1])).filter(Boolean).slice(0, 8)) + '.');
          }
          A(r, [['Verla en el mapa', L.calle(h.c, h.d)]]); break;
        }
        case 'carrera': {
          if (h.r && h.r[4]) P(r, h.n + ' llega a ' + bonito(h.r[4]) + ' ' + horaTxt(h.r[5], h.r[6]) + ' (' + art(h.d) + ', itinerario ' + (D.anio - 1) + ').');
          else if (h.r) P(r, 'En el itinerario de ' + cabecera(h) + ' no tengo marcado el paso por carrera oficial. Sale ' + horaTxt(h.r[0], h.r[1]) + ' y se recoge ' + horaTxt(h.r[2], h.r[3]) + '.');
          else P(r, 'No tengo el itinerario de ' + cabecera(h) + ', así que no sé a qué hora llega a la carrera oficial.');
          A(r, enlacesHerm(h, true)); break;
        }
        case 'entrada': {
          if (h.r) P(r, h.n + ' (' + c + ') se recoge ' + horaTxt(h.r[2], h.r[3]) + ', ' + art(h.d) + (minutos(h.r[2]) > 1440 ? ' (ya de madrugada)' : '') + '. Sale ' + (sal || horaTxt(h.r[0], h.r[1])) + '.');
          else P(r, 'La hora de entrada de ' + cabecera(h) + ' no la tengo. Sale ' + art(h.d) + (sal ? ' ' + sal : '') + '.');
          A(r, enlacesHerm(h, true)); break;
        }
        case 'cerca': {
          if (D.mapa.indexOf(h.c) >= 0 && h.r) { P(r, 'Abre «En la calle» de ' + c + ': te marca dónde va ' + h.n + ' a cada hora (estimado) y cómo llegar.'); A(r, [['Abrir el mapa', L.calle(h.c, h.d)], ['Ver la ficha', L.herm(h)]]); }
          else { P(r, 'De ' + cabecera(h) + ' no tengo el recorrido en el mapa. Sale ' + art(h.d) + (sal ? ' ' + sal : '') + (h.se ? ' desde ' + conArt(h.se) : '') + '.'); A(r, [['Ver la ficha', L.herm(h)]]); }
          break;
        }
        case 'historia': {
          const hi = (CD.hi || {})[h.s];
          if (h.f) P(r, cabecera(h) + '. Fundación: ' + h.f + '.');
          if (hi) P(r, hi);
          if (!h.f && !hi) P(r, 'De la historia de ' + cabecera(h) + ' no tengo nada apuntado todavía.');
          A(r, [['Ver la ficha', L.herm(h)], h.w ? ['Su web', h.w] : null]); break;
        }
        case 'pasos': {
          const pa = (CD.pa || {})[h.s];
          P(r, pa ? cabecera(h) + ': ' + pa : 'De los pasos de ' + cabecera(h) + ' no tengo descripción.');
          A(r, [['Ver la ficha', L.herm(h)]]); break;
        }
        case 'web': {
          if (h.w) { P(r, 'La web de ' + cabecera(h) + ':'); A(r, [[h.w.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, ''), h.w], ['Ver la ficha', L.herm(h)]]); }
          else { P(r, 'No tengo la web de ' + cabecera(h) + '.'); A(r, [['Ver la ficha', L.herm(h)]]); }
          break;
        }
        case 'titulares': {
          P(r, h.t.length ? 'Titulares de ' + cabecera(h) + ': ' + lista(h.t.map((t) => t[0])) + '.' : 'No tengo los titulares de ' + cabecera(h) + '.');
          A(r, [['Ver la ficha', L.herm(h)]]); break;
        }
        default: {
          ctx.intent = 'info';
          P(r, azar(PREF) + h.n + ' (' + c + ') sale ' + art(h.d) + (sal ? ' ' + sal : '') + (h.se ? ', desde ' + conArt(h.se) : '') + '.');
          if (h.t.length) P(r, 'Titulares: ' + lista(h.t.map((t) => t[0])) + '.');
          A(r, enlacesHerm(h, true).concat([h.w ? ['Su web', h.w] : null]));
        }
      }
      C(r, chipsHerm(h, intent));
      return cerrar(r);
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
      P(r, cap1(art(dia)) + (ciudad ? ' en ' + nombreCiudad(ciudad) : '') + ' sale' + (lista_.length === 1 ? ' 1 cofradía' : 'n ' + lista_.length + ' cofradías') + (D.fechas[dia] ? ' (' + fechaLarga(D.fechas[dia]) + ')' : '') + ':');
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
    function respFalta(e) {
      const r = Resp(), ramos = D.fechas['Domingo de Ramos'], pascua = D.fechas['Domingo de Resurrección'];
      if (e.dia && e.dia !== 'Domingo de Ramos') {
        const f = D.fechas[e.dia], n = diasHasta(f);
        P(r, cap1(art(e.dia)) + ' de ' + D.anio + ' cae el ' + fechaCorta(f) + (n > 0 ? '. Quedan ' + n + (n === 1 ? ' día.' : ' días.') : n === 0 ? '. ¡Es hoy!' : '.'));
      } else {
        const n = diasHasta(ramos), fin = diasHasta(pascua);
        if (n > 0) P(r, 'Faltan ' + n + (n === 1 ? ' día' : ' días') + ' para el Domingo de Ramos: el ' + fechaLarga(ramos) + '. La Semana Santa de ' + D.anio + ' acaba el Domingo de Resurrección, ' + fechaLarga(pascua) + '. Ve planchando la túnica.');
        else if (fin >= 0) P(r, '¡Que estamos en plena Semana Santa, cuñao! Hoy es ' + (jornadaDeFecha(hoyISO(0)) || 'día de vísperas') + '.');
        else P(r, 'La próxima Semana Santa empieza el ' + fechaLarga(ramos) + '.');
      }
      C(r, ['¿Qué sale el Domingo de Ramos?', '¿Qué sale hoy?']);
      return cerrar(r);
    }
    function respImag(i) {
      const r = Resp(), x = I[i];
      const obras = []; H.forEach((h) => h.t.forEach((t) => { if (t[2] === i) obras.push({ h, t }); }));
      ctx.imag = i; ctx.intent = 'imaginero';
      P(r, x[1] + (x[2] ? ' (' + x[2] + ')' : '') + (x[3] ? ', escuela ' + x[3] : '') + '. En el portal tengo ' + obras.length + (obras.length === 1 ? ' obra suya' : ' obras suyas') + ' que procesionan' + (obras.length ? ':' : '.'));
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
      const t = dudas[0].usadas.slice().sort((a, b) => idf(b) - idf(a))[0];
      const mismas = dudas.every((d) => d.h.n === dudas[0].h.n);
      const plural = t && t.length > 3 ? cap1(t) + (/[aeiou]$/.test(t) ? 's' : 'es') : '';
      P(r, mismas ? 'Hay ' + dudas.length + ' que se llaman «' + dudas[0].h.n + '». ¿De qué ciudad?' : plural && !/[aeiou]s$|es$/.test(t) ? '¿Cuál de estas ' + plural + ', cuñao?' : 'Hay varias que encajan, cuñao. ¿Cuál?');
      C(r, dudas.map((d) => [d.h.n + ' (' + nombreCiudad(d.h.c) + (mismas ? '' : ' · ' + d.h.d) + ')', '@h:' + d.h.s]));
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
      if (!c) { P(r, 'En mi base hay ' + N + ' hermandades de las ocho capitales. ¿De cuál quieres el detalle?'); return preguntaCiudad(r, null, 'cuantas'); }
      const hs = H.filter((h) => h.c === c);
      ctx.ciudad = c; ctx.intent = 'cuantas';
      if (dia) { const n = hs.filter((h) => grupo(dia).indexOf(h.d) >= 0).length; P(r, cap1(art(dia)) + ' en ' + nombreCiudad(c) + ' salen ' + n + (n === 1 ? ' cofradía.' : ' cofradías.')); C(r, [cap1(art(dia).replace(/^en las /, 'las ')) + ' en ' + nombreCiudad(c)]); return cerrar(r); }
      const visp = hs.filter((h) => /Dolores|Pasión|Vísperas/.test(h.d)).length;
      P(r, 'En mi base tengo ' + hs.length + ' hermandades de ' + nombreCiudad(c) + (visp ? ': ' + (hs.length - visp) + ' en la Semana Santa y ' + visp + ' en las vísperas.' : '.'));
      const por = ORDEN.map((d) => [d, hs.filter((h) => h.d === d).length]).filter((x) => x[1]);
      LI(r, por.map((x) => ({ x: x[0], sub: String(x[1]) })));
      A(r, [['Semana Santa de ' + nombreCiudad(c), L.capital(c)]]);
      C(r, ['¿Qué sale el Domingo de Ramos en ' + nombreCiudad(c) + '?', 'Noticias de ' + nombreCiudad(c)]);
      return cerrar(r);
    }
    function respPasanPor(c, e) {
      if (!tengoCiudad(c)) return necesita(c);
      const r = Resp(), CD = CIUDADES[c], g = e.dia ? grupo(e.dia) : null, hits = [];
      for (const [s, R] of Object.entries(CD.r || {})) {
        const h = POR_SLUG.get(s); if (!h || (g && g.indexOf(h.d) < 0)) continue;
        const l = buscarLugar(R.p, e.lugar || '', null); if (l.length) hits.push({ h, p: l[0] });
      }
      ctx.ciudad = c; ctx.intent = 'pasapor';
      if (!hits.length) { P(r, 'No encuentro «' + (e.lugar || '') + '» en los itinerarios de ' + nombreCiudad(c) + (e.dia ? ' ' + art(e.dia) : '') + ' que tengo.'); return cerrar(r); }
      hits.sort((a, b) => CANON.indexOf(a.h.d) - CANON.indexOf(b.h.d) || minutos(a.p[0]) - minutos(b.p[0]));
      P(r, 'Por ' + bonito(hits[0].p[1]) + (e.dia ? ' ' + art(e.dia) : '') + ' pasan (itinerarios ' + (CD.anio || '') + '):');
      LI(r, hits.slice(0, 20).map((x) => ({ x: x.h.n, href: L.herm(x.h), sub: (e.dia ? '' : x.h.d + ' · ') + (x.p[2] ? '' : '≈ ') + x.p[0] })));
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
    const HOLA = ['¿Qué pasa, cuñao? Pregúntame lo que quieras, que de esto sé más que nadie.', 'Aquí estoy, como siempre que hace falta. ¿Qué cofradía buscamos?', 'Dime, que llevo cuarenta Semanas Santas en el cuerpo.'];
    const NOSE = ['Eso no lo sé ni yo, y mira que sé de todo. Prueba con el nombre de la hermandad, su titular, el día o la ciudad.', 'Uy, esa no me suena. ¿Me la dices de otra forma? Por ejemplo: «¿A qué hora sale el Cautivo de Málaga?».', 'Me has pillado. Y antes de inventarme nada, prefiero decírtelo.'];
    const GRACIAS = ['A mandar. Y llévate agua, que luego to\' son prisas.', 'Para eso estamos, cuñao.', 'Nada, hombre. Y ponte en la sombra, que el sol de abril engaña.'];
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
        if (it === 'noticias') return respNoticias(c);
        if (it === 'cerca') return respCerca(c, ctx.dia);
        if (it === 'pasapor' && ctx.pend && ctx.pend.lugar) return respPasanPor(c, { lugar: ctx.pend.lugar, dia: ctx.dia });
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
          P(r0, 'Venga, cuéntamelo con detalle: qué está mal o qué falta, y de qué hermandad o página. Lo leemos todo y cada semana se repasa.');
          C(r0, ['Un dato está mal', 'Falta información', 'Tengo una idea']); return cerrar(r0);
      }
      // «¿y …?» sin pregunta propia hereda la anterior
      const sigue = /^y\b/.test(e.t) || e.t.split(' ').length <= 3;
      if (!intent && sigue && ctx.intent && ctx.intent !== 'info') intent = ctx.intent;
      // jornada a partir de «hoy», «mañana», «el día siguiente»
      let dia = e.dia || null;
      if (!dia && e.diaRel != null) { dia = jornadaDeFecha(hoyISO(e.diaRel)); e.fueraDeFecha = !dia; }
      if (!dia && e.diaSig && ctx.dia) dia = CANON[CANON.indexOf(ctx.dia) + 1] || null;
      e.dia = dia;

      if (intent === 'falta' && !e.toks.length) return respFalta(e);
      // hermandad
      const bh = buscarHerm(e);
      // «pasa por X»: si la hermandad solo sale de las palabras del lugar, es una búsqueda de lugar
      if (intent === 'pasapor' && e.lugar && /\b(carrera|catedral|tribuna|estacion de penitencia)\b/.test(e.lugar)) { intent = 'carrera'; e.lugar = null; }
      if (intent === 'pasapor' && bh.lista.length && e.lugar) {
        // el lugar es lo que queda tras quitar el nombre de la hermandad («por la Campana la Macarena» → «Campana»)
        const x = bh.elegida || bh.lista[0];
        const quitar = new Set(x.usadas);
        IDX.find((i) => i.h.s === x.h.s).frases.forEach((f) => f.split(' ').forEach((w) => quitar.add(stem(w))));
        const resto = toks(e.lugar).filter((t) => !quitar.has(stem(t)) && !STOP.has(t) && !(e.ciudad && t === norm(nombreCiudad(e.ciudad))) && !e.usadas.has(t));
        if (!resto.length) { bh.lista = []; bh.elegida = null; bh.dudas = null; }
        else e.lugar = resto.join(' ');
      }
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
      const necesitaHerm = ['hora', 'cuando', 'sede', 'autor', 'banda', 'marchas', 'recorrido', 'pasapor', 'carrera', 'entrada', 'historia', 'pasos', 'web', 'titulares'];
      if (bh.elegida) return respHerm(bh.elegida.h, intent && intent !== 'lista' && intent !== 'cuantas' && intent !== 'falta' ? intent : (intent === 'lista' && !dia ? 'hora' : 'info'), e);
      if (bh.dudas) return respDudas(bh.dudas, intent && necesitaHerm.indexOf(intent) >= 0 || intent === 'cerca' ? intent : 'info', e);
      if (intent === 'falta') return respFalta(e);
      if (intent === 'noticias') {
        const c = e.ciudad || ctx.ciudad || preferida();
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
        const c = ciudad || preferida();
        if (c) return respPasanPor(c, e);
        const r = Resp(); P(r, '¿En qué ciudad está ese sitio?'); ctx.pend = { lugar: e.lugar }; ctx.dia = dia; return preguntaCiudad(r, null, 'pasapor');
      }
      if (intent === 'cerca') {
        const c = ciudad || preferida(), d = dia || jornadaDeFecha(hoyISO(0));
        if (c) return respCerca(c, d);
        const r = Resp(); P(r, '¿En qué ciudad estás?'); return preguntaCiudad(r, d, 'cerca');
      }
      if (dia || e.fueraDeFecha) {
        if (!dia) {
          const r = Resp(), n = diasHasta(D.fechas['Domingo de Ramos']);
          P(r, e.diaRel === 0 ? 'Hoy no sale nadie, cuñao: ' + (n > 0 ? 'faltan ' + n + ' días para el Domingo de Ramos (' + fechaLarga(D.fechas['Domingo de Ramos']) + ').' : 'la Semana Santa ya pasó.') : 'Ese día no hay procesiones de Semana Santa. El Domingo de Ramos es el ' + fechaLarga(D.fechas['Domingo de Ramos']) + '.');
          const c = ciudad || preferida(); ctx.dia = 'Domingo de Ramos';
          C(r, ['¿Qué sale el Domingo de Ramos' + (c ? ' en ' + nombreCiudad(c) : '') + '?', '¿Cuánto falta para la Semana Santa?']);
          return cerrar(r);
        }
        const c = ciudad || preferida();
        if (!c) { const r = Resp(); P(r, '¿De qué capital? Que ' + art(dia) + ' sale mucha gente en las ocho.'); return preguntaCiudad(r, dia, 'lista'); }
        return respDia(dia, c);
      }
      if (e.ciudad) {
        if (ctx.dia && sigue && (ctx.intent === 'lista')) return respDia(ctx.dia, e.ciudad);
        const r = Resp(), c = e.ciudad; ctx.ciudad = c; ctx.intent = null;
        const n = H.filter((h) => h.c === c).length;
        P(r, nombreCiudad(c) + ': tengo ' + n + ' hermandades. ¿Qué quieres saber?');
        A(r, [['Semana Santa de ' + nombreCiudad(c), L.capital(c)]]);
        C(r, ['¿Qué sale hoy en ' + nombreCiudad(c) + '?', 'Domingo de Ramos en ' + nombreCiudad(c), 'Noticias de ' + nombreCiudad(c)]);
        return cerrar(r);
      }
      if (intent && necesitaHerm.indexOf(intent) >= 0) { const r = Resp(); P(r, '¿De qué cofradía me hablas? Dime su nombre, su titular o su apodo.'); return cerrar(r); }
      const r = Resp();
      P(r, azar(NOSE));
      A(r, [['Buscarlo en el portal', L.buscar(raw)]]);
      C(r, ['Enviar una sugerencia', '¿Qué sabes hacer?']);
      return cerrar(r);
    }
    return {
      responder, ctx, SUGS_INICIO, HOLA: () => azar(HOLA),
      cargarCiudad: (c, datos) => { CIUDADES[c] = datos; },
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
  const url = hoja.getAttribute('data-datos');
  chat.setAttribute('role', 'log'); chat.setAttribute('aria-live', 'polite'); chat.setAttribute('aria-relevant', 'additions'); chat.setAttribute('tabindex', '-1');
  const preferida = () => { try { return localStorage.getItem('oc-city') || null; } catch (e) { return null; } };

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
    const b = burbuja('cunao', 'Apuntado, cuñao…');
    fetch(BASE + 'api/sugerencias', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ texto: a.texto, pagina: location.pathname, hermandad: a.hermandad }) })
      .then((r) => { if (!r.ok) throw 0; b.firstChild.textContent = 'Recibido. Gracias: el lunes se repasan todas las sugerencias de la semana.'; })
      .catch(() => {
        // sin servidor de sugerencias (alojamiento estático): se ofrece abrir el aviso en GitHub ya rellenado
        b.textContent = '';
        const f = document.createElement('div'); f.appendChild(el('p', null, 'No he podido guardarla desde aquí. Puedes enviarla en un momento:'));
        const d = el('div', 'oc-cunao-acc'); d.appendChild(enlace('Enviar la sugerencia', 'https://github.com/ssanchezz-07/ocho-capitales/issues/new?labels=sugerencia&title=' + encodeURIComponent('Sugerencia: ' + a.texto.slice(0, 60)) + '&body=' + encodeURIComponent(a.texto + '\n\nPágina: ' + location.href), 'oc-cunao-link')); f.appendChild(d);
        b.appendChild(f);
      });
  }
  function cargar() {
    if (motor) return Promise.resolve();
    if (!cargando) cargando = fetch(url).then((r) => { if (!r.ok) throw 0; return r.json(); }).then((j) => { motor = crearMotor(j, { base: BASE, preferida }); }).catch((e) => { cargando = null; throw e; });
    return cargando;
  }
  const datosCiudad = (c) => fetch(url.replace(/cunao\.json.*$/, 'cunao/' + c + '.json')).then((r) => { if (!r.ok) throw 0; return r.json(); }).then((j) => motor.cargarCiudad(c, j));
  function pensando() { const b = burbuja('cunao', '…'); b.classList.add('is-pensando'); b.setAttribute('aria-hidden', 'true'); return b; }
  function preguntar(valor, etiqueta) {
    if (!valor || !String(valor).trim()) return;
    burbuja('yo', (etiqueta || valor).trim());
    const p = pensando();
    const fin = (nodo) => { p.remove(); if (nodo) burbuja('cunao', nodo); if (!tactil) q.focus(); };
    const vuelta = (n) => {
      let r = motor.responder(valor);
      if (r.necesita && n < 2) return Promise.all(r.necesita.map(datosCiudad)).then(() => vuelta(n + 1));
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
  // el bocadillo del botón se presenta una vez por sesión y se retira solo
  try { if (!sessionStorage.getItem('oc-cunao')) { btn.classList.add('is-saludo'); sessionStorage.setItem('oc-cunao', '1'); setTimeout(() => btn.classList.remove('is-saludo'), 5200); } } catch (e) { }
})(this);
