# Progreso · historias, cifras y templos (sesión «historias», rama `claude/historias`)

Encargo de Coordinación (2-nov-2026). Pablo: «hay que revisar la historia de cada capital y cada hermandad antes de hacer esto, porque hay bastantes cosas incompletas».
Reglas: sin fuente abierta de verdad no se escribe nada; lo que no tenga fuente queda como «pendiente».

## Fase 1 · Cifras oficiales (hecha en local, sin subir)
Tabla `CIFRAS` en `tools/build-data.js` (n, texto, fuente y nota «En esta web»). `site/build.mjs` usa `cifraCap(c)` en la cabecera de capital,
las láminas de /capitales/, las colgaduras y el buscador. La lámina ya no enseña la cifra de bandas.

| Capital | Cifra | Qué cuenta | Fuente |
|---|---|---|---|
| Sevilla | 71 | 60 de Domingo de Ramos a Resurrección + 11 en Vísperas | hermandades-de-sevilla.org/hermandades/penitencia/ (página por día) |
| Málaga | 43 | hermandades agrupadas; 45 cofradías en la calle (Fusionadas ×3) | agrupaciondecofradias.com/hermandades/ (directorio, se carga con JS) |
| Granada | 32 | cofradías; 34 cortejos (texto literal de la portada) | hermandadesdegranada.com |
| Córdoba | 42 | 38 por días en carrera oficial + 4 agrupadas (Lágrimas, Presentación, Dolores de Alcolea, La O) | hermandadesdecordoba.es (páginas por día) |
| Cádiz | 31 | penitencia: 29 + 2 en Vísperas (Servitas, Obediencia) | consejocofradiascadiz.es (menú Penitencia) |
| Huelva | 27 | penitencia: 26 + 1 en Vísperas (Prado) | consejohermandadeshuelva.es (páginas por día, con JS) |
| Almería | 22 | penitencia: 21 + 1 el Sábado de Pasión (Unidad) | cofradiasdealmeria.es/penitencia/ |
| Jaén | 21 | cofradías de Pasión | cofradiasjaen.org (menú Cofradías de Pasión) |

Fichas de la web que no están en la nómina oficial (se explican en «En esta web»): Sevilla La Borriquita (cortejo de El Amor);
Málaga 8 de Vísperas; Granada Los Facundillos (cortejo de La Cañilla); Córdoba Sangre de El Higuerón y pro-hermandad del Traslado;
Cádiz Ecce Mater Tua y Humillación; Huelva La Bendición; Almería Cristo de la Escucha.

**Posible error de día (no es de esta sesión, avisar a rutas/datos):** Almería, la Agrupación pone El Calvario en Lunes Santo; la web lo tiene en Miércoles Santo.

## Fase 2-4 · Recuento de problemas por capital (2-nov)
Templos con varios nombres (posibles; hay falsos positivos, p. ej. la Capilla de San Andrés de Sevilla es otro templo y el Corpus Christi
del Zaidín no es el de la Magdalena): Sevilla San Antonio de Padua; Málaga Santa Cruz y San Felipe Neri, Victoria; Granada Santo Domingo,
San Pedro y San Pablo, San Gil y Santa Ana; Córdoba San Lorenzo, San José y Espíritu Santo, San Andrés; Cádiz Merced, Santiago;
Huelva San Pedro, Sagrado Corazón; Almería San Ildefonso; Jaén San Ildefonso.

### Sevilla (72 fichas · cifra oficial 71)
- Historia de la capital: 3 párrafos, sin fuente enlazada.
- Historias vacías (0): —
- Historias de menos de 200 caracteres (62): la-borriquita-sevilla, el-amor-sevilla, jesus-despojado-sevilla, la-paz-sevilla, la-cena-sevilla, la-hiniesta-sevilla, san-roque-sevilla, la-estrella-sevilla, la-amargura-sevilla, san-pablo-sevilla, santa-genoveva-sevilla, santa-marta-sevilla, san-gonzalo-sevilla, vera-cruz-sevilla, las-aguas-sevilla, el-museo-sevilla, el-cerro-sevilla, san-esteban-sevilla, los-estudiantes-sevilla, san-benito-sevilla, la-candelaria-sevilla, dulce-nombre-la-bofeta-sevilla, santa-cruz-sevilla, la-sed-sevilla, san-bernardo-sevilla, el-buen-fin-sevilla, el-baratillo-sevilla, cristo-de-burgos-sevilla, los-panaderos-sevilla, los-negritos-sevilla, la-exaltacion-los-caballos-sevilla, las-cigarreras-sevilla, la-quinta-angustia-sevilla, el-valle-sevilla, pasion-sevilla, el-silencio-sevilla, el-gran-poder-sevilla, la-macarena-sevilla, el-calvario-sevilla, la-esperanza-de-triana-sevilla, los-gitanos-sevilla, la-carreteria-sevilla, la-o-sevilla, san-buenaventura-sevilla, montserrat-sevilla, el-cachorro-sevilla, los-servitas-sevilla, el-santo-entierro-sevilla, la-soledad-de-san-lorenzo-sevilla, la-resurreccion-sevilla, bellavista-sevilla, bendicion-y-esperanza-sevilla, pasion-y-muerte-sevilla, pino-montano-sevilla, la-mision-sevilla, cristo-de-la-corona-sevilla, padre-pio-sevilla, san-jose-obrero-sevilla, la-milagrosa-sevilla, dolores-de-torreblanca-sevilla, divino-perdon-sevilla, el-sol-sevilla

### Málaga (53 fichas · cifra oficial 43)
- Historia de la capital: 3 párrafos, sin fuente enlazada.
- Historias vacías (0): —
- Historias de menos de 200 caracteres (2): luz-y-mar-malaga, buen-camino-gamarra-malaga

### Granada (33 fichas · cifra oficial 32)
- Historia de la capital: 2 párrafos, sin fuente enlazada.
- Historias vacías (0): —
- Historias de menos de 200 caracteres (0): —

### Córdoba (44 fichas · cifra oficial 42)
- Historia de la capital: 2 párrafos, sin fuente enlazada.
- Historias vacías (0): —
- Historias de menos de 200 caracteres (2): la-sangre-de-el-higueron-cordoba, traslado-al-sepulcro-pro-hermandad-cordoba

### Cádiz (33 fichas · cifra oficial 31)
- Historia de la capital: 2 párrafos, sin fuente enlazada.
- Historias vacías (1): humillacion-piedad-cadiz
- Historias de menos de 200 caracteres (24): el-despojado-cadiz, sagrada-cena-cadiz, humildad-y-paciencia-cadiz, la-palma-cadiz, nazareno-del-amor-cadiz, vera-cruz-cadiz, la-sanidad-cadiz, la-piedad-cadiz, jesus-caido-el-senor-del-parque-cadiz, ecce-homo-cadiz, la-columna-cadiz, la-sentencia-cadiz, las-aguas-cadiz, el-caminito-cadiz, los-afligidos-cadiz, oracion-en-el-huerto-cadiz, nazareno-de-santa-maria-cadiz, el-descendimiento-cadiz, la-expiracion-cadiz, siete-palabras-cadiz, la-buena-muerte-cadiz, ecce-mater-tua-cadiz, santo-entierro-cadiz, la-resurreccion-cadiz

### Huelva (28 fichas · cifra oficial 27)
- Historia de la capital: 2 párrafos, sin fuente enlazada.
- Historias vacías (0): —
- Historias de menos de 200 caracteres (22): la-borriquita-huelva, la-sagrada-cena-huelva, la-redencion-huelva, los-mutilados-huelva, el-perdon-huelva, el-cautivo-huelva, las-tres-caidas-huelva, la-lanzada-huelva, los-estudiantes-huelva, pasion-huelva, el-prendimiento-huelva, la-victoria-huelva, la-esperanza-huelva, vera-cruz-y-oracion-huelva, la-misericordia-huelva, los-judios-la-merced-huelva, el-nazareno-huelva, la-fe-huelva, el-descendimiento-huelva, el-santo-entierro-huelva, el-silencio-la-soledad-huelva, el-resucitado-huelva

### Almería (23 fichas · cifra oficial 22)
- Historia de la capital: 2 párrafos, sin fuente enlazada.
- Historias vacías (0): —
- Historias de menos de 200 caracteres (13): la-estrella-almeria, gran-poder-almeria, la-coronacion-almeria, el-amor-almeria, el-perdon-silencio-almeria, el-prendimiento-almeria, los-estudiantes-almeria, rosario-del-mar-almeria, el-encuentro-jesus-nazareno-almeria, el-silencio-descendimiento-almeria, cristo-de-la-escucha-almeria, la-caridad-almeria, el-santo-sepulcro-almeria

### Jaén (21 fichas · cifra oficial 21)
- Historia de la capital: 2 párrafos, sin fuente enlazada.
- Historias vacías (0): —
- Historias de menos de 200 caracteres (8): caridad-y-salud-jaen, la-amargura-jaen, la-buena-muerte-jaen, la-lanzada-jaen, la-expiracion-jaen, nuestro-padre-jesus-el-abuelo-jaen, la-soledad-jaen, el-santo-sepulcro-jaen


## Hecho el 2-nov (rama `claude/historias`, sin subir a main)
- `ec9ec20` Cifras oficiales (auditor-datos: APTO con 5 reparos menores, arreglados en el commit de templos).
- `17fd3d9` Historia de las 8 capitales revisada frase a frase contra Wikipedia (texto plano de la API, buscado frase a frase) y, en Huelva y Almería, la fuente oficial. Fuentes bajo «Historia» en cada capital (`fuentesCap` en `site/build.mjs`, campo `intro_fuentes`).
- Templos: tabla `TEMPLOS` en `tools/build-data.js` (15 grupos unificados con el nombre de la ficha oficial de cada hermandad). Reparos del auditor: Málaga (cómo sale el 43), Huelva (URL con la lista), nota de Córdoba (contador «3» sobre 4 fichas), chips de /hermandades/ etiquetados como «fichas en la web».

## Pendiente para otras sesiones (no son de esta)
- Templos en sedes y planos: hecho. La tabla está en `tools/sources/templos.json`. La usan `build-data.js`, `tools/itinerarios/plano.mjs` (etiquetas de OpenStreetMap) y el campo `nombre` de `site/data/sedes/*.json`; `nombre_osm` no se toca. `sedes.mjs` toma el nombre de `portal.json`, así que al regenerar se mantiene.
- **Almería, El Calvario (Cristo del Mar): sale el Miércoles Santo** (confirmado por Pablo en el chat el 2-nov; Coordinación había decidido lo mismo). Revisar cuando salgan los horarios de 2027:
  - Miércoles Santo: horarios 2026 de la Agrupación en el programa «Pasión» de Canal Sur (PDF «ALMERIA 26», en `tools/sources/itinerarios-2026.json`) y la ficha de la hermandad, https://cofradiasdealmeria.es/calvario/ («El miércoles Santo de 2017, sería la primera ocasión…»).
  - Lunes Santo: el menú de https://cofradiasdealmeria.es/penitencia/ (junto a Gran Poder y Pasión).
  - https://cofradiasdealmeria.es/horarios-e-itinerarios/ no tiene PDF de 2026 para desempatar. No se escribe a la Agrupación por ahora.
- Jaén: la Agrupación enlaza «Oración en el Huerto» y «Vera Cruz» a la misma página; la web tiene dos fichas. Confirmar que son dos cofradías.

## Fase 3 · Historias de hermandad (3-nov-2026, rama `historias-hermandades`)
- **Dónde están:** `tools/sources/historias.json` (slug → texto, fuentes, revisado, estado, nota). `build-data.js` las aplica después de `fichas-correcciones.json`; cada ficha enseña sus fuentes debajo de «Historia» (`historia_fuentes`). Las no revisadas enlazan la ficha de la que salió la reseña.
- **Comprobador:** `node tools/comprobar-historias.mjs [--fuentes <carpeta de textos> --capital <id>]`. Sin `--fuentes` valida la estructura; con los textos bajados (`<slug>.txt`, `<slug>.N.txt`) lista cada año, cifra o nombre propio que no aparece en la fuente.
- **Hechas las 307**, todas `completa`: Granada 33, Huelva 28, Almería 23, Málaga 53, Jaén 21, Córdoba 44, Cádiz 33 y Sevilla 72. Cada lote ha pasado por `auditor-datos` (20 al azar) con los reparos corregidos. En main desde `19c2ed7`: Granada, Huelva, Almería y Málaga.
- **Discrepancias con `portal.json`** (titulares, autores, fechas y sedes que no cuadran con la fuente): están en el campo `nota` de cada historia. Son para el lote de datos.
- **Hábitos** (`tools/sources/habitos.json` y `habitos-colores.json`, comprobador `tools/diseno/comprobar-habitos-colores.mjs`):
  - Granada 32 de 33, desde la guía 2026 de Perdón y Aurora (Facundillos no tiene fuente).
  - Almería 22, Jaén 19 y Córdoba 40, auditados.
  - Pendientes sin fuente: Escucha, Lanzada, Divino Maestro, La O, Traslado, Higuerón y Presentación al Pueblo.
- **Lemas de las 8 capitales:** reescritos solo con su historia o su fuente (`LEMAS` en `build-data.js`, con `lema_fuentes`), auditados. Están en la rama `lemas-capitales` y esperan el sí de Pablo.

## RETOMAR AQUÍ
1. **Subido a main** (3-nov, e8c7bee, con el sí de Pablo): lemas, historias de las 307 hermandades y hábitos de 291 (159 nuevos).
2. **Hábitos sin fuente todavía** (14): Escucha, Lanzada, Divino Maestro, La O, Traslado, Higuerón y Presentación (Almería/Jaén/Córdoba); Resucitado, Desamparados, Verdad y Sagrario, Luz y Mar y Gamarra (Málaga); Humillación y Piedad (Cádiz); Carmen Doloroso (Sevilla); Facundillos (Granada). Macarena y Pasión y Muerte salen de Wikipedia: buscar fuente oficial.
3. **Orden `EQUIPO/ORDEN-VERIFICAR-TEXTOS.md`: hecha y auditada** (3-nov, rama historias-hermandades, a la espera del sí de Pablo para subir): datos clave e imprescindibles en `tools/sources/capitales-textos.json`, textos fijos registrados en `tools/sources/textos-autor.json`, comprobación `tools/comprobar-fuentes-textos.mjs` en la red de seguridad y lista para Pablo en `EQUIPO/LISTA-TEXTOS-VERIFICADOS.md`. Tras subir, avisar a Marketing. Queda sin mostrar el acompañamiento musical de Almería de 2026 hasta encontrar su documento.
4. **Lote de datos** (pedido por coordinación):
   - titulares que no cuadran con su fuente (ver `nota` en historias.json; p. ej. Salud de Huelva de David Valenciano 2000, Angustias de Almería 1943, «atribuido a» en Granada, autores de Sevilla);
   - sede del Silencio de Granada, que según Imágenes no cuadra (pedido por coordinación);
   - marca `propia` de las bandas: Fusionadas, BCT Jesús Nazareno y Expiración (Huelva), BM Esperanza y Estrella (Córdoba).
5. **5-nov, tres arreglos con el sí de Pablo** (153430b subido antes con la ficha de la Soledad de la Humildad; este bloque, a la espera del sí):
   - Imaginero de las dos Soledades (Cañilla y Humildad): se queda «Manuel González de los Santos»; fuente, la página de titulares de la cofradía (copia archivada), en `complementos.json` → `titulares_autor`.
   - Cádiz: el PDF de Canal Sur (404) sustituido por «Cruz de Guía» de Radio Cádiz 2026 con página en los 32 recorridos, la Obediencia y el Perdón; quitadas las horas que esa guía no da; el Perdón sale a las 01:30.
   - Granada: «El Llamador» sustituido por la Guía oficial de horarios 2026 de la Federación (`GUIA_GR` y `PAG_GR` en `tools/itinerarios/unir.mjs`); todas las horas coinciden. Escolapios y Ferroviarios ya tienen horario. La Soledad ya no cita el PDF de 2025.
   - Pendiente de otros: 9 citas al PDF muerto de Canal Sur en `site/data/sedes/cadiz.json` (mapas); mapa de las Tres Caídas de Granada con puntos de otra cofradía (mapas); Huelva sigue citando «El Llamador» sin enlace; Siete Palabras de Cádiz: la Cruz de Guía pone «San Agustín» donde lo normal es San Francisco.
   - Al regenerar `itinerarios-2026.json` con `unir.mjs` salen cambios de Cádiz (Humillación, Perdón) que no están revisados: aplicar solo lo que toque.
