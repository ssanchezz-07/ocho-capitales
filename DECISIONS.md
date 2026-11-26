# Decisiones de diseño y técnicas

## 2026-11-26 · Sevilla: Las Cigarreras, sede en Los Remedios y salida de 2026 en Los Terceros (Pablo: «Hazme caso [elcorreoweb.es, recorrido de 2025]. Este año ha salido de otro sitio por las obras, pero la sede es la otra»)
- **Sede:** Capilla de la Fábrica de Tabacos, en Los Remedios.
  - Fuente: la web de la hermandad, página «Sede canónica» (Regla 4; calle Juan Sebastián Elcano 7).
  - Mapa: OSM way 222190216, «Capilla de Las Cigarreras».
  - Es la que enseña el plano de fuera de temporada, que pasa de 62 a 63 sedes.
- **Salida de 2026:** Iglesia de Los Terceros (OSM way 180110804, el mismo edificio que la sede de La Cena).
  - Lo dan así el itinerario oficial de la hermandad («Iglesia de Los Terceros (17:00 horas)… e Iglesia de Los Terceros (00:45 horas)») y la Nómina oficial del Consejo de 2026, p. 5.
  - Según Pablo, fue por las obras de su capilla.
- **Cómo:**
  - Campo nuevo «salida» en `rutas/sedes-sevilla-correcciones.json`, con su año. `sedes.mjs` lo pasa a `site/data/sedes/sevilla.json` (descrito en su «_leeme»).
  - La «salida» lleva también un «punto»: el nodo de la calle Sol frente a la iglesia (OSM way 28026682). Por él sale y entra el recorrido, porque su itinerario oficial de 2026 sale por Sol y entra por Sol.
  - `geocodificar.mjs` hace salir y entrar el recorrido por ese punto, pero solo si su año es el de los itinerarios (`ITI.anio`).
- **Provisional:** según Pablo, la salida de 2026 es provisional.
  - Con los itinerarios de 2027, esta «salida» ya no vale (su año no casa), y el recorrido vuelve a salir y entrar en la sede.
  - Si ese año sale de otro sitio, hay que poner otra «salida», con su fuente.
- **Probado y descartado:** salir del centro del edificio, sin «punto» (la primera versión, 852e4711, que no se publicó).
  - El centro se pegaba a la red por el Pasaje Virgen de los Gitanos, a 22 m, y el dibujo daba la vuelta por Escuelas Pías y Juan de Mesa: 481 m la salida y 606 m la entrada, con 36 m por tramo fuera de las calles.
- **Efecto:**
  - Solo cambia Las Cigarreras: la salida y la entrada pasan de estimadas (en Almirante Apodaca) a Los Terceros. La Cena, que sale del mismo edificio, no cambia.
  - **Salida:** va como dice su itinerario oficial, por Sol, plaza de Los Terceros, Capataz Manuel Santiago y Alhóndiga, hasta Almirante Apodaca. Son 165 m, todo por calles.
  - **Entrada:** 290 m, todo por calles, pero por Almirante Apodaca y Alhóndiga, no por Doña María Coronel y Bustos Tavera, como dice el itinerario.
    - En los puntos de la Nómina no está Bustos Tavera, y el de Doña María Coronel cae al principio de la calle, junto a la plaza del Cristo de Burgos. Queda pendiente.
  - El total de metros fuera de las calles en Sevilla no cambia (13.604 m).
- **Sin comprobar:** el motivo y las fechas de las obras. Las páginas de la hermandad no lo dicen, y ABC Sevilla y Diario de Sevilla no se dejan leer de forma automática. En noviembre de 2026 sus cultos son en la capilla del Colegio Santa Ana y en la Parroquia de Los Remedios.

## 2026-11-26 · Sevilla: la sede de San Pablo en su ficha, y por qué no se ponen todavía las sedes en su puerta (Pablo: «A», a «¿Sigo con lo que queda del plano? a) Sí, en otra subida, con su revisión»)
- **Ficha de San Pablo:** la sede pasa de «Parroquia de San Pablo (Polígono)» a «Parroquia de San Ignacio de Loyola (Polígono San Pablo)».
  - Fuente: la web de la hermandad, en su historia: «visita la Parroquia de San Ignacio de Loyola, sede canónica de nuestra Hermandad». La nota de `tools/sources/historias.json` ya avisaba del error.
  - Se cambia en `data-raw.json`, y `portal.json` se regenera con `tools/build-data.js`. No cambia nada más en el portal, salvo el campo «generado».
  - El plano no cambia, porque su sede ya estaba en `tools/itinerarios/rutas/sedes-sevilla-correcciones.json`.
- **Sedes en su puerta (pendiente de la entrada siguiente): no se puede todavía.**
  - Se buscaron en OSM (Overpass) los nodos de entrada (`entrance`) de los templos que lo necesitan: El Cerro (way 42091405), Los Estudiantes (way 120225599), San Pablo (way 117010401), El Museo (node 747809164), Omnium Sanctorum (way 303650356), la Capilla de los Ángeles (way 70012573), Santa Genoveva (way 599062209), el Mayor Dolor (way 495841025) y San José Obrero (relation 1655552).
  - Ninguno tiene puerta en OSM. Ponerla a mano sería inventarla, así que El Cerro, Los Estudiantes, El Carmen Doloroso y Los Negritos siguen sin punto, y San Pablo y El Museo con sus últimos metros fuera de las calles.
  - Hace falta mapear sus puertas en OSM o una fuente que diga por dónde sale cada cofradía. Santa Genoveva, por ejemplo, sale por un portalón a la calle Romero de Torres, según su web.
- **Probado y descartado:** anclar «Parroquia Santa Genoveva», en Bendición y Esperanza, a la esquina de su parroquia (Teatinos con Romero de Torres).
  - Sus vecinos, Avda. Teatinos (22:00) y Almirante Topete (23:00), caen unos 150 m al sur, y el dibujo subiría y volvería a bajar.
  - La causa está en dónde caen esos dos puntos.
- **Las Cigarreras:** no se ha encontrado una fuente oficial sobre de qué templo salió en 2026. Sigue pendiente de decidir.

## 2026-11-26 · Sevilla: plazas sueltas de la red, calles estimadas y cinco sedes más (Pablo: «A», a «¿Sigo con lo que queda del plano? a) Sí, en otra subida, con su revisión»)
Sigue con lo que dejó pendiente la entrada siguiente.
- **Medido contra lo publicado (4a6ea529):**
  - trazado fuera de las calles: de 16.292 m a 13.604 m (`fuera-de-calle.cjs` de la revisión);
  - tramos en recta de más de 60 m: de 219 a 191;
  - calles estimadas: de 73 a 54;
  - salidas y entradas estimadas: de 49 a 29;
  - paradas falsas en los tramos que cambian: de 7 a 4;
  - cambian 22 hermandades.
- **Cómo se ha decidido qué entra:**
  - Cada isla, cada alias y cada sede se probó por separado, en una copia aparte, contra lo publicado (`scratchpad/tanda-plano/variantes.cjs` y `sedes-variantes.cjs`).
  - Se rechazó lo que empeoraba algún tramo:
    - un espolón nuevo de 20 m o más, si no venía con una mejora de al menos 100 m menos fuera de las calles;
    - más trazado fuera de las calles;
    - un rodeo nuevo (camino de más del doble de la recta y de más de 300 m);
    - 300 m más de largo sin mejora.
  - Lo rechazado se queda como estaba, y aquí se dice por qué.
- **Plazas sueltas de la red (islas).**
  - La caché de OSM solo trae vías con nombre. Por eso 13 plazas con puntos de los itinerarios quedaban aisladas, y el dibujo pasaba en recta.
  - **`uniones-osm-sevilla.json`** (nuevo; lo leen `enrutar.mjs` y `geocodificar.mjs` desde `enlaces.mjs`, como aristas, nunca como calles):
    - «vias»: aceras, pasos de peatones y peatonales de OSM sin nombre, bajadas con Overpass. Son los caminos más cortos (≤ 300 m, sin escaleras ni carriles bici) de cada isla a la red principal.
    - «contiguos»: vértices de la plaza a menos de 7 m de un nodo de la red. Es la misma esquina, sin nodo compartido en OSM; pasa en las plazas dibujadas como un área sin ninguna vía.
    - cada unión guarda sus «anclas», los puntos que eran nodos de la caché, y las etiquetas de OSM de la vía (tres vías de la Plaza de España son pasos bajo el edificio, tunnel=building_passage). La comprobación de `enrutar.mjs` va en «Código».
  - **Entran 7:** Plaza de España, la glorieta de Covadonga, la Ronda de Padre Pío, Ramón Rueda, San Juan de la Palma, Doña Teresa Enríquez y San Román.
    - Por ejemplo, La Paz pasa de 1.060 a 532 m fuera de las calles en la cruz y de 1.020 a 636 m en el palio. Las Penas y las Siete Palabras quedan a 0.
  - **No entran 6:**
    - Santa Ana (segunda revisión del arreglo, NO APTO): con ella, en el palio de La Esperanza de Triana quedaba una parada nueva sin mejora del tramo, y la ida y vuelta de la cruz de Pasión y Muerte pasaba de 55 a 165 m. Sin ella, las dos quedan como en lo publicado;
    - el Altozano con San Jacinto. El banco de pruebas lo aceptó, pero la revisión (`wf_cc62e7ef-d1b`, NO APTO) vio que con él El Cachorro y La O iban por el Callejón de la Inquisición, que son escaleras y un túnel por los que no pasa un paso. El banco no lo vio porque esas vías tienen nombre y no cuentan como trazado fuera de las calles. Sin esa isla, El Cachorro, La O y San Gonzalo quedan como en lo publicado;
    - el puente de Isabel II (La O): un rodeo nuevo y más trazado fuera de las calles en La Estrella;
    - San Lorenzo: un espolón de 20 a 30 m;
    - los Terceros (La Cena): un rodeo nuevo;
    - la avenida de Roma (Santa Genoveva): un rodeo nuevo.
  - Quedan tres espolones nuevos, según `rodeos.cjs`:
    - Plaza de España (La Paz, cruz): 30 m, en un tramo que baja 528 m fuera de las calles;
    - Avda. Teatinos (Bendición y Esperanza): 30 m según `rodeos.cjs`, que no mide más allá de 50 m. Medido entero, el paso sube y baja Almirante Topete, unos 90 m, y su ida y vuelta total pasa de 230 a 390 m. Viene del alias «Alfonso Lasso de la Vega», que entra porque el tramo baja 360 m fuera de las calles;
    - Ramón Rueda (Pino Montano, palio): 20 m, con solo 28 m menos fuera de las calles por tramo. El banco lo midió en 10 m.
  - Se probó también a quitar de la red todas las escaleras y túneles. Se descartó: en la Encarnación y Laraña OSM une la plaza por escaleras y pasos bajo las Setas, y salían idas y vueltas de 50 m y rodeos de 500 m en 15 hermandades.
- **Calles estimadas por cómo vienen escritas:** se buscaron en la caché por su nombre completo, y se comprobó que pasan a menos de unos 450 m de sus vecinos en el itinerario.
  - **Entran 17 alias** (`alias-calles-sevilla.json`):
    - «J. L. de la Vega» → Javier Lasso de la Vega;
    - «Alcaicería» → Alcaicería de la Loza;
    - «S. Ángela de la Cruz» → Santa Ángela de la Cruz;
    - «J. de las Tres Caídas» y «Jesús Tres Caídas» → Jesús de las Tres Caídas;
    - «Miguel Mañara» → Miguel de Mañara;
    - «Amorde Dios» → Amor de Dios: el PDF lo imprime así, y es la calle que hay entre Cuna y la Campana, sus vecinos (no hay otra fuente del recorrido calle a calle);
    - «Marqués de Mina» → Marqués de la Mina;
    - «Fray Cefer. Glez.» → Fray Ceferino González;
    - «Puerta Carmona» → Puerta de Carmona;
    - «Fco Carrera Iglesias» → Francisco Carrera Iglesias «Paquili»;
    - «Joaquín Morales y T.» → Joaquín Morales y Torres;
    - «Maestro Góm. Zarzuela» → Maestro Gómez Zarzuela;
    - «Alfonso Lasso de la Vega» → Alfonso Lasso de Vega;
    - «Avda. La Plata» → Avenida de la Plata;
    - «Avda. Cid» → Avenida de El Cid;
    - «Madre María Purísima» → Plaza María Purísima de la Cruz.
  - «Barcelona» → Calle Barcelona se probó y se quitó: no cambiaba ningún punto.
  - «Párroco D. Eugenio» → Párroco Don Eugenio se quitó tras la revisión: en la cruz de La Esperanza de Triana situaba ese punto 333 m más allá y alargaba la cruz 183 m. (La parada del palio, que se escribe con el nombre entero, venía de la isla de Santa Ana.)
  - **No entran 10.** Con ellos, el dibujo empeoraba porque la red de calles está incompleta. Los puntos se quedan estimados entre sus vecinos:
    - «J. del Gran Poder», «Alameda» y «Conde de Barajas»: más trazado fuera de las calles en La Resurrección;
    - «Avda. Greco»: un rodeo de 1,8 km en San Pablo;
    - «Puñonrrostro»: más trazado fuera de las calles en San Roque;
    - «Párroco A. Gómez Villa.» y «Ntra. Sra. Dolores»: en Padre Pío;
    - «Puerta de la Carne»: cambiaba la salida estimada de El Cerro y alargaba el palio 900 m;
    - «Glorieta del Cid»: en OSM, Glorieta de San Diego, la de la estatua; más trazado fuera de las calles en Santa Genoveva;
    - el punto fijo del **Postigo del Aceite** (puerta de la muralla, OSM way 225686967): cambiaba las calles siguientes de San Gonzalo y daba un rodeo.
- **Sedes:** las buscaron cuatro agentes (workflow `wf_83da2300-6f4`), y un revisor comprobó cada fuente y cada edificio de OSM.
  - **Entran 5,** con fuente oficial:
    - Jesús Despojado: Capilla del Mayor Dolor, en la plaza de Molviedro (su web, «Sede canónica»; OSM way 495841025);
    - El Museo: Capilla de la Expiración (ficha del Consejo; OSM node 747809164);
    - San Pablo: Parroquia de San Ignacio de Loyola (su web: «sede canónica de nuestra Hermandad»; OSM way 117010401). **La ficha del portal dice «Parroquia de San Pablo», y está mal;**
    - Santa Genoveva: Parroquia de las Mercedes y Santa Genoveva (su web, «Sede canónica», avenida de los Teatinos 41; OSM way 599062209, sin nombre, en esa esquina);
    - San José Obrero: Parroquia de San José Obrero y San Francisco de Paula (su web; OSM relation 1655552).
    - Los últimos metros hasta el centro del templo quedan fuera de las calles: 52 m en San Pablo y de 12 a 24 m en El Museo.
  - **La Borriquita:** la fuente pasa a ser la ficha del Consejo («Iglesia Colegial del Divino Salvador»), en vez de Wikipedia.
  - **Encontradas, pero sin punto todavía.** Van con `templo: null` y `templo_encontrado` en las correcciones, cada una con su motivo:
    - El Cerro (Parroquia de los Dolores): la entrada sale en una recta de 430 m;
    - Los Estudiantes (Capilla de la Universidad): el centro queda dentro de la Fábrica de Tabacos, a 108 m de la calle;
    - El Carmen Doloroso (Omnium Sanctorum) y Los Negritos (Capilla de los Ángeles): un rodeo nuevo;
    - Bellavista, Torreblanca y el Divino Perdón: fuera del fondo del plano (hace falta `tools/plano/afueras.mjs`);
    - Las Cigarreras: su sede canónica es la capilla de la Fábrica de Tabacos, en Los Remedios, pero en 2026 salió del centro. Hay que decidir qué templo usar.
  - **Sin edificio en OSM:**
    - La Carretería: su web la da en la calle Real de la Carretería 15, que en OSM es un edificio residencial;
    - Pasión y Muerte: el Buen Aire. El Consejo da como sede de salida San Juan Bosco.
  - En el plano de fuera de temporada se pasa de 57 a 62 sedes.
- **Regeneración:**
  - `recorridos/sevilla.json`, con `geocodificar.mjs` y `enrutar.mjs`. Las extraordinarias se quedan como estaban.
  - Regenerado con el código final, sale idéntico. (Del banco de pruebas se quitaron después, tras las revisiones, las islas del Altozano y de Santa Ana y los alias «Barcelona» y «Párroco D. Eugenio».)
  - `informe-geocodificacion.json`: se conserva Jaén y se pone al día Sevilla. Los nombres sin situar bajan de 34 a 19. (La lista del informe se corta en 25.)
- **Otros cambios que trae, vistos en la revisión:**
  - el Pasaje Francisco Molina (un paso bajo un edificio) lo usan dos tramos más: La Borriquita, cruz, de Cuna a «Amorde Dios», y La Bofeta, palio, de Cuna a «J. L. de la Vega». Lo publicado ya pasaba por él en doce;
  - Santa Genoveva, palio: con la sede, Almirante Topete queda a 94 m del templo y el tramo siguiente sale a 30,7 m/min;
  - Los Negritos, palio: la entrada, estimada, se mueve 69 m; La Borriquita, cruz: la Campana se mueve 17 m, al punto que ya usan los demás tramos;
  - en Bendición y Esperanza, «Parroquia Santa Genoveva» sigue estimada, a 165 m de la sede nueva: se podría anclar a ella.
- **Código:**
  - `enrutar.mjs`, antes de usar las uniones, comprueba que sus anclas sigan en la caché y que todas queden en la red principal (la componente mayor del grafo). Si no, dice cuáles (la vía o el contiguo, y su isla) y no escribe la ciudad. Probado quitando de una copia de la caché un vértice de la plaza de Ramón Rueda, un nodo de la red y el extremo de una acera de Padre Pío: en los tres avisa y no escribe. La segunda revisión del arreglo vio que la primera versión de esta comprobación no lo detectaba en el lado de la plaza;
  - `geocodificar.mjs` las carga sin comprobar, porque enrutar no escribiría.
- **Revisiones:**
  - primera (`wf_cc62e7ef-d1b`), sobre 12cd2be1: NO APTO por el Callejón de la Inquisición (isla del Altozano); arreglado en f4893513;
  - segunda (agente auditor del plano), sobre f4893513: NO APTO por la comprobación de uniones, que solo miraba un lado, y por la parada de La Esperanza de Triana; arreglado después (anclas, fuera Santa Ana y el alias «Párroco D. Eugenio»).
- **Sigue pendiente:**
  - anclar las sedes a su puerta (lo piden El Cerro, Los Estudiantes y los últimos metros de las demás);
  - la red de calles completa, con las vías sin nombre (es la causa de lo rechazado);
  - corregir la sede de San Pablo en su ficha;
  - las sedes de fuera del fondo del plano;
  - lo que quedaba de la entrada siguiente.

## 2026-11-26 · Sevilla: calles que caían en un mismo punto, los Jardines de Murillo y tres sedes (Pablo: «A», a «¿Arreglo también lo que queda pendiente en el plano? a) Sí, en otra subida, con su revisión»)
Cierra lo que dejó pendiente del plano la entrada siguiente.
- **Calles en un mismo punto** (`geocodificar.mjs`, `repartir()`).
  - **La causa:** `cercano()` pone cada calle en su vértice más cercano al punto anterior. Así, una calle repetida en franjas seguidas caía siempre en el mismo vértice, y dos calles que se cruzan caían en el vértice que comparten. En el plano, el cortejo se quedaba parado media hora y luego corría.
  - **Grupo de puntos en un mismo vértice:**
    - Se reparten por un tramo que va desde ese vértice hasta el de la última calle más cercano al punto siguiente.
    - El primer punto se queda donde está; los demás van a 1/k, 2/k… del tramo.
    - Ejemplos: Ramón y Cajal en El Cerro, Argote de Molina y Álvarez Quintero en Redención, Luis Montoto en San Pablo y La Sed, Feria y Santa Ángela de la Cruz en La Macarena.
  - **Calle pegada a la anterior** (a menos de 40 m, las dos de franja): va a la mitad de su tramo. Caso: San Fernando, a 35 m de Puerta de Jerez en La Candelaria y Las Cigarreras.
  - **El tramo** va por la red de calles de `enrutar.mjs`, con las mismas vías y ENLACES. Por eso los ENLACES pasan a `enlaces.mjs`, que usan los dos scripts. Con ese cambio, `enrutar.mjs` da byte a byte lo mismo en Sevilla y en Huelva.
  - **Cada punto va al nodo del tramo de su propia calle** (a menos de 5 m de una vía con su nombre) que queda más cerca de su fracción, y solo si cumple todo esto:
    - Avanza: le queda menos camino hasta el punto siguiente que al vértice y que al punto repartido anterior, y lleva más camino andado desde el punto anterior que el vértice.
      - «Camino» se mide por la red. Si por la red no se llega, en recta, que es como lo dibuja `enrutar.mjs`. Pasa en el Altozano, un área suelta de la red, en la cruz de San Gonzalo.
    - Ningún nodo del tramo, hasta el último punto repartido, está más cerca del anterior que el vértice ni más cerca del siguiente que ese último punto.
    - El dibujo, hecho como en `enrutar.mjs`, no tiene espolones nuevos en el vértice, en el punto anterior ni en el siguiente.
  - **Además:**
    - El punto siguiente tiene que estar situado y justo detrás del grupo.
    - Una calle pegada solo se mueve si el trazado desde el punto anterior llega a ella. Caso: la plaza Diputado Ramón Rueda, de Pino Montano, es un área suelta de la red.
    - Si algo falla, el grupo entero se queda como estaba.
    - Solo se mueven puntos con hora de franja (`fila`). Nunca se mueven los de hora oficial exacta (`hora`), así que la carrera oficial no cambia.
  - **Primera revisión (agente auditor del plano, sobre 05cc936e): NO APTO.**
    - En esa versión, cada punto iba a mitad de un lado del tramo y no había condiciones de avance. (El tramo sigue acabando en el vértice de la última calle más cercano en línea recta al punto siguiente; lo que cambió es dónde va cada punto y qué se le exige.) Así, cuatro tramos se dibujaban peor que en lo publicado:
      - **Pl. San Leandro, en Redención:** se enganchaba a un área suelta de la red y el trazado salía en recta, 108 m fuera de las calles.
      - **Feria, en La Macarena:** zigzag.
      - **Castelar, en Jesús Despojado:** ida y vuelta de 34 m.
      - **Manuel Siurot, en La Misión:** ida y vuelta de 45 m.
    - La versión actual pone el punto en un nodo y añade las condiciones de arriba. Con las pruebas de la propia revisión, los cuatro ya no tienen ni recta ni ida y vuelta.
    - Por el camino también se arreglaron estos problemas, que aparecieron en versiones intermedias:
      - un espolón de 50 m en Alfareros (Pino Montano);
      - uno de 10 m en la Campana (Las Aguas);
      - una recta desde Ramón Rueda (Pino Montano);
      - puntos estimados que se salían de la calle: Madre María Purísima (La Macarena) y la Rotonda del Hospital Virgen del Rocío (Bendición y Esperanza).
  - **Medido en Sevilla, contra lo publicado** (scripts de la revisión y de la sesión):
    - **Paradas falsas:** de 73 a 18 en todo Sevilla. Una parada falsa son dos puntos seguidos a menos de 25 m, con media hora o más entre ellos, sin contar sede ni estimados.
    - **Trazado fuera de las calles:** baja de 16.408 a 16.292 m.
      - San Gonzalo baja de 556 a 236 m.
      - Solo empeoran los últimos metros hasta las tres sedes nuevas (el centro del edificio queda dentro de la manzana) y El Sol (32 m).
      - Lo de El Sol es la unión documentada de Carlos V con la glorieta de Don Juan de Austria, ahora que su paseo va junto a los jardines.
    - **Espolones nuevos:** solo uno, en Gerona, a la salida de Cristo de Burgos. Mide unos 17 m (`rodeos.cjs` lo cuenta como 10 porque mide de 10 en 10). Viene de su sede nueva, no del reparto: antes la salida se estimaba a 156 m.
    - **Ritmo máximo:** solo sube en la cruz de Las Cigarreras, de 20 a 25 m/min, entre Puerta de Jerez y los Jardines de Murillo, que ya están en su sitio.
    - **Alcance:** cambian 25 hermandades y 83 puntos cambian de sitio.
  - **Las 18 paradas que quedan:**
    - 2 al final del tramo, sin un punto siguiente situado (la entrada se estima después): Feria en El Carmen Doloroso y San Jacinto en Pasión y Muerte.
    - 3 con un punto estimado detrás: Getsemaní y Almirante Topete en Bendición y Esperanza, y Santa Ángela de la Cruz en La Macarena.
    - 3 junto a áreas sueltas de la red: el Altozano y San Jacinto, en San Gonzalo y La Esperanza de Triana.
    - 7 de grupos que no pasan las condiciones:
      - San Pablo y Rioja en Las Aguas (3);
      - Doña Francisquita en Padre Pío (2);
      - Manuel Siurot en La Misión;
      - Alfareros en Pino Montano.
    - 1 con un tramo de menos de 20 m: Pl. Magdalena y Méndez Núñez, en El Baratillo.
    - 2 donde la Campana lleva hora oficial: Pl. Duque → Campana, en El Valle y La Macarena.
  - **Solo se regenera Sevilla.**
    - La regla está en el código común. Al regenerar otras capitales, podrá mover sus puntos de franja en un mismo vértice (en lo publicado hay 5 en Huelva, 16 en Jaén y 3 en Almería) y sus calles pegadas (según la revisión, 1 en Huelva, 6 en Jaén y 3 en Almería).
    - En Granada, Córdoba, Málaga y Cádiz no cambia nada, porque esos puntos no llevan franja.
    - Huelva y Almería no están regeneradas enteras (ver «Empalmes a mano…»), y la caché de OSM de Jaén no está en esta copia: la caché no va al repositorio. Queda para cuando se regeneren.
- **«Jardines de Murillo»** (Las Cigarreras, cruz y palio):
  - En OSM es un parque (way 22747191), no una calle, y casaba con la calle Murillo, a 1 km.
  - Ahora es un punto fijo nuevo (`LUGARES`, como «calle», no en rojo): el vértice del Paseo de Catalina de Ribera (way 28113943) más cercano al centro del jardín, a 23 m. Ese centro es la media de los vértices del parque; el del recuadro quedaría a 101 m, porque el parque es largo y estrecho.
  - El paseo va por su borde este, y es el que La Candelaria nombra en el mismo tramo.
- **«Paseo Catalina de Ribera»** (alias → «Paseo de Catalina de Ribera»):
  - Antes casaba solo con el trozo corto del norte (way 67377872, «Paseo Catalina de Ribera»), y El Sol y La Candelaria lo ponían en la punta norte.
  - Ahora va por el paseo de los jardines.
- **Sedes con fuente oficial** (`rutas/sedes-sevilla-correcciones.json`; `site/data/sedes/sevilla.json` regenerado con `rutas/sedes.mjs`; de 54 a 57 templos):
  - **Los Panaderos:** Capilla de San Andrés.
    - Fuente: la página «Sede» de su web (la capilla de San Andrés, en la calle Orfila, con las imágenes titulares en su altar). El número, «Calle Orfila Nº 3», está en su página de contacto.
    - Mapa: OSM way 428744717, «Capilla de San Andrés. Hermandad de los Panaderos», con esa dirección. No estaba en la caché porque es `building=chapel` sin `amenity=place_of_worship`.
  - **Cristo de Burgos:** Parroquia de San Pedro.
    - Fuente: su web, en «Sede Canónica».
    - Mapa: OSM way 119432044, «Iglesia de San Pedro», plaza de San Pedro 1. La web da la dirección de la hermandad, plaza del Cristo de Burgos 20, junto a la iglesia. No es la de San Pedro y San Pablo, que está en otro barrio.
  - **La Sed:** Parroquia de la Concepción, en Nervión.
    - Fuente: la historia de la hermandad sacramental, en su web. Cuenta que nació en la «Parroquia de la Concepción Inmaculada», en Nervión, y habla del altar mayor de «nuestra sede canónica», aunque esa frase no nombra el templo.
    - La historia de la cofradía (misma web) cuenta que la cruz de guía sale «en la puerta de la Concepción».
    - Mapa: OSM way 72800137, «Parroquia de la Inmaculada Concepción», a 39 m de la calle Cristo de la Sed.
  - **Efecto en el plano:** la salida y la entrada dejan de ser estimadas, y **Los Panaderos y Cristo de Burgos ya no llevan empalme a mano:** se regeneran como las demás. Su problema del ancla venía de no tener sede.
  - **La Borriquita** se queda como estaba, por una corrección nueva.
    - La ficha del portal cita ahora la página archivada del Señor de la Sagrada Entrada. Esa página da «C/ Villegas 4», pero no nombra el Salvador.
    - Se deja la fuente publicada, que sí lo nombra.
    - Pendiente: una página oficial que lo diga. La web de la Hermandad del Amor no se deja leer sin navegador.
  - **Pendiente, opcional:** la casa hermandad de Los Panaderos («Calle Cervantes s/n», en la misma página de contacto).
- **Segunda revisión** (workflow `wf_bd0fefdb-024`: trazado, código y datos por separado, y un juez que comprueba): **APTO**, sin bloqueantes.
  - Lo regeneró en su copia y le salió idéntico. También comprobó que los cuatro casos del NO APTO están bien, que la carrera oficial y las horas oficiales no cambian y que las cifras de arriba son ciertas.
  - De sus mejorables, entran en esta misma subida:
    - el cierre de `geocodificar.mjs` cuando un tramo acaba en un grupo de franja (`n >= res.length`, como en la primera versión). Hoy no pasa en Sevilla, pero podía pasar al regenerar otras capitales;
    - los comentarios: la red y `trazo()` se parecen a las de `enrutar.mjs`, pero no son idénticas;
    - las fuentes y precisiones de esta entrada.
  - Quedan como pendientes:
    - poner cada sede en su puerta o en la vía más cercana, y no en el centro del edificio (los últimos metros fuera de las calles);
    - `Monticulo`, que está duplicado en `geocodificar.mjs` y `enrutar.mjs`;
    - Huelva: al regenerarla con este código, se mueven 4 puntos de 3 hermandades (La Victoria, Vera Cruz y Santo Entierro), sin más metros fuera de las calles, pero alargando algún dibujo; hay que revisarlo entonces;
    - al regenerar Sevilla desde cero entra la extraordinaria del Amparo (8-nov), que se deja fuera a mano.
- **Regeneración:**
  - `recorridos/sevilla.json`, con `geocodificar.mjs` y `enrutar.mjs`: cambian 25 hermandades, todas por lo de arriba. Las extraordinarias se quedan como estaban.
  - Regenerado con el código final, sale idéntico.
  - `informe-geocodificacion.json`: se conserva Jaén y se pone al día Sevilla. Las «Salida»/«Entrada» sin situar bajan de 30/31 a 24/25.
- **Sigue pendiente** (de la entrada siguiente):
  - Las franjas que empujan horas oficiales.
  - erCuñao solo mira un tramo.
  - «J. L.dela Vega» en `limpiaLugar`.
  - Calles abreviadas estimadas en La Resurrección y Los Gitanos.
  - Los rodeos de Santa Genoveva y Gallinato → Campamento.
  - La caché de OSM sin vías sin nombre: es la causa de las áreas sueltas que dejan tres de las 18 paradas.
  - Los puntos estimados se colocan en recta entre sus vecinos, no por la calle.

## 2026-11-26 · Sevilla: columnas del Consejo mal leídas, la «Plaza», la Puerta de San Miguel y los rodeos del plano (Pablo: «A», a «¿Arreglo también estos fallos antiguos? a) Sí, en otra subida, con su revisión»)
Cierra casi todo lo pendiente de la entrada siguiente.
- **Seis hermandades, copiadas a mano de la rejilla del Consejo** (`A_MANO` en `unir.mjs`; `wf_813fd550-e96`).
  - Cada columna se copió dos veces por separado, celda a celda:
    - una sobre la imagen a 400 ppp;
    - otra sobre la capa de texto, comprobada en recortes a 600 ppp.
  - Las dos copias coinciden en todas las celdas.
  - Las seis hermandades:
    - **Redención (p. 6).** El palio llevaba trozos de las celdas vecinas y le faltaba la Plaza de las 18:26. La cruz se tomaba de Canal Sur (p. 31), que va a la Campana por Encarnación, Aponte y Jesús del Gran Poder; el Consejo pone Pl. San Pedro, Orfila y Trajano. Se sigue al Consejo, la fuente oficial, en los dos tramos.
    - **Los Gitanos (p. 14).** La cruz traía pegotes, franjas que no existen y dos calles después de la Entrada. El palio de Canal Sur, que era el que se usaba, coincide calle a calle con el del Consejo.
    - **El Dulce Nombre y Los Javieres (p. 8).**
      - A los dos les faltaba la Plaza.
      - El Dulce Nombre llevaba texto pegado: «Argote de MolinaP.», «Cardenal» suelto.
      - El palio de Los Javieres tomaba como hora de salida la de la Campana de su cruz (20:44). Su «Salida» no tiene hora impresa.
      - Que la cruz de El Dulce Nombre pase a la misma hora que el palio de Los Javieres (21:09, 21:46, 22:11, 22:29) es lo impreso. En la carrera oficial, la cruz de una hermandad va detrás del último paso de la anterior.
    - **La Quinta Angustia (p. 12).** El paso perdía «Plaza 21:34». La cruz es igual que la de Canal Sur (p. 60).
    - **La Resurrección (p. 18).** El bloque tiene su propia escala (de 8:30 a 17:30), y el lector usó la de la izquierda. Solo se leía la cruz, y rota; ahora van la cruz y el palio.
  - **Errata en el PDF:** el palio de El Dulce Nombre pone «Plaza 20:26», entre Campana 21:49 y S. Miguel 22:51. La cruz de Los Estudiantes, que va detrás, pone «Plaza 22:26». No se corrige a mano: la Plaza va sin hora exacta, solo con su franja (22:00).
- **«Plaza» con hora en el Consejo** (`limpiarLugar`). En la rejilla del Consejo va en minúscula y con su hora en la celda. Ahora se conserva:
  - si la hora va en la celda;
  - si la columna está copiada a mano.

  Un «Plaza» suelto sin hora del lector se sigue tirando, porque es el primer renglón de un nombre partido. Hoy solo afecta a las columnas copiadas a mano: regenerando, ninguna otra hermandad cambia.
- **El Cerro (Canal Sur, p. 40, `CORREGIR`).** En la franja de las 22:30, las dos celdas dicen «Avda. Ramón y Cajal». El texto de la cruz desborda su celda, y el lector pegaba su «Cajal» a la del palio («Avda. Ramón y» / «CajalAvda. Ramón y Cajal»).
- **La Borriquita (Canal Sur, p. 22, `CORREGIR`).** En la franja de las 16:30 de la cruz, «P. SAN MIGUEL / (16,41)» va en dos renglones. El lector perdía el paréntesis y la hora se quedaba pegada al nombre: «P. SAN MIGUEL 16,41», sin hora y estimado a 235 m de la Puerta. Lo vio la revisión.
- **Puerta de San Miguel** (`geocodificar.mjs`).
  - «SAN MIGUEL» y «S. Miguel» sin la «P.» caían en la calle San Miguel, junto a la Campana. El cortejo volvía de la Plaza a la Campana y luego bajaba a Palos: unos 900 m de más en el plano, en 29 tramos de 17 hermandades.
  - Con su hora en la celda (en rojo, tras la Plaza), van a la Puerta de San Miguel de la Catedral.
  - Sin hora siguen en la calle. Es por donde pasan La Borriquita, Cristo de Burgos, El Valle, Pasión y La Sagrada Mortaja antes de la Campana.
- **Alias** (`alias-calles-sevilla.json`). Cada uno está comprobado en la caché de OSM:
  - «Páez de Ribera» → «Calle Páez de Rivera» (La Misión). Ya no arrastra hacia el norte el punto de Manuel Siurot: el tramo hasta Torcuato Luca de Tena pasa de 1 km a 400 m.
  - «Galinnato» (errata del PDF en el palio de El Cerro) → «Calle Gallinato».
  - «Card. Cervantes» y «J. Lasso Vega» (Redención, Consejo) → «Calle Cardenal Cervantes» y «Calle Javier Lasso de la Vega».
  - «Puerta de Jerez» → «Puerta Jerez», el nombre en OSM. Afecta a 6 puntos de El Cerro, La Candelaria, Las Cigarreras y El Sol, que estaban estimados hasta a 650 m.
  - «Cuesta Rosario» (Redención, Consejo) → «Calle Cuesta del Rosario».
    - `nucleo()` quita «Cuesta», y lo que queda, «rosario», casaba con la calle Rosario, junto a Tetuán, a 249 m.
    - Con la cruz copiada del Consejo, la de Redención pasaba a dar un rodeo por allí. Lo vio la revisión (`wf_678871d4-30d`), y por eso no se subió el primer commit.
    - El palio ya estaba así antes.
    - Las dos quedan en el mismo punto de la Cuesta del Rosario que otras 15 hermandades.
  - «Glorieta D. Juan de Austria» (cruz de El Sol) → «Plaza Don Juan de Austria», el nombre en OSM. En lo publicado estaba estimada a unos 550 m.
- **Torres de la Plaza de España** (palio de La Paz). `norm()` quita el paréntesis, y las dos caían en el mismo punto.
  - Ahora se buscan con el paréntesis (`FIJOS_PARENTESIS`).
  - Coordenadas: centro de los edificios «Torre Norte» (way 442264001) y «Torre Sur» (way 873304735) de OSM, según Overpass del 26-nov.
  - Van como «calle», no como carrera oficial.
- **Rodeo de El Cerro** (`ENLACES` en `enrutar.mjs`).
  - La causa: la caché de OSM solo trae vías con nombre. Faltan los tramos sin nombre que las unen, como las bocas de una glorieta, y las áreas peatonales solo se unen a la red por algunos vértices.
  - Cuatro uniones en Puerta de Jerez y el Prado, de 9 a 54 m, entre nodos de la caché: la avenida de la Constitución, San Fernando y Carlos V con Puerta Jerez y la glorieta de Don Juan de Austria.
  - De la avenida de Carlos V a la de la Constitución, El Cerro pasa de 1.731 m a 1.006 m en el plano (en recta, 959 m).
  - El arreglo de fondo es bajar la caché con las vías sin nombre. Cambiaría todos los trazados de todas las capitales.
  - Si al volver a bajar la caché falta alguno de esos nodos, `enrutar.mjs` lo avisa, no escribe el recorrido de esa ciudad y sale con error, para que la unión no se pierda sin ruido.
- **Regeneración, sin pisar lo hecho a mano:**
  - `itinerarios-2026.json`: solo las 7 hermandades y La Borriquita. `unir.mjs` cambia también las 4 de siempre, que se dejan como estaban.
  - `recorridos/sevilla.json`: cambian 25 hermandades.
    - Las 7 de las columnas, más La Borriquita.
    - Las de la Puerta de San Miguel y las de Puerta de Jerez.
    - La Misión y La Paz.
    - Santa Genoveva, solo en el trazado, por las uniones.
    - Los Panaderos y Cristo de Burgos conservan su empalme a mano. Al regenerar vuelve el problema de su ancla. Cristo de Burgos recibe solo su Puerta de San Miguel.
    - Las extraordinarias quedan como estaban (al regenerar entraba la del Amparo, del 8-nov).
  - `portal.json`: no cambia ninguna ficha.
- **Sigue pendiente:**
  - Sedes con fuente de Los Panaderos, Cristo de Burgos y La Sed.
  - Las franjas que empujan horas oficiales en el plano.
  - erCuñao solo mira un tramo.
  - `limpiaLugar` de `build.mjs` junta «J. L. de la Vega» en «J. L.dela Vega»: ya pasaba antes, en el palio de El Dulce Nombre.
  - La Resurrección y Los Gitanos tienen estimadas algunas calles abreviadas: «J. del Gran Poder», «S. Ángela de la Cruz», «Conde de Barajas», «Alameda».
  - Otros rodeos del plano por la misma causa de la caché: Santa Genoveva y Gallinato → Campamento en El Cerro.
  - Vistos en la revisión; todos ya pasaban antes o son como funciona `cercano()`:
    - Una calle repetida en franjas seguidas cae siempre en el mismo vértice: el más cercano al punto anterior. El cortejo se queda parado y luego corre. Pasa en las tres «Avda. Ramón y Cajal» de la cruz de El Cerro, de 21:30 a 22:30; antes, la de las 22:30 era un punto estimado a mitad de la avenida.
    - Una calle larga cae en el extremo más cercano al punto anterior: «San Fernando» de La Candelaria y Las Cigarreras, junto a Puerta Jerez. Habría que repartir esas apariciones a lo largo de la vía.
    - «Jardines de Murillo» en el palio de Las Cigarreras casa con la calle Murillo, a 1 km. En la cruz ya queda estimado junto a los jardines.
    - «Amorde Dios», en la cruz de La Borriquita, está así impreso (Canal Sur, p. 22) y queda estimado.
    - Redención, palio: «Argote de Molina» y «Álvarez Quintero» caen en el vértice que comparten (media hora parado). En lo publicado eran dos puntos estimados.
    - «Jardines de Murillo» en la cruz de Las Cigarreras queda estimado en la Judería, a unos 150 m de los jardines: mejor que antes (calle Murillo, a 1 km), pero no por Menéndez Pelayo.
  - Todo esto lo confirmó la segunda revisión (`wf_1e073094-bd5`, juez: «APTO»): ningún dato falso y ningún plano peor que en lo publicado.

## 2026-11-26 · Sevilla: los demás nombres partidos y la fuente de cada tramo (Pablo: «a) Sí, en otra subida, con su revisión»; rama `arreglo-huelva-sevilla-25nov`)
Son los pendientes que dejó la entrada siguiente.
- **Cotejo** (`wf_ecffa853-ba0`): se miró en la página renderizada y en la capa de texto cada uno de los 33 pares de puntos seguidos de la misma franja de Sevilla.
  - 32 son un solo nombre en dos renglones de una celda: Canal Sur, pp. 23, 31, 32, 49, 50, 51 y 81; Consejo, p. 2.
  - El otro, «J. M. S. Román» + «Entrada» (Torreblanca, palio, 1:30), son dos cosas: la calle y «- Entra 2:15». Se queda como está.
- **`UNIR` en `unir.mjs`**: con los dos renglones en mayúscula, el texto solo no distingue un nombre partido de dos calles seguidas. Por eso hay una lista de pares mirados en el PDF, que solo se unen si van seguidos y en la misma franja:
  - «Jesús del Gran Poder», 8 veces;
  - «Doña María Coronel», «Cardenal Carlos Amigo», «Cardenal Ilundain», «Avda. Manuel Siurot» y «Glorieta Covadonga»;
  - «Avda. Isabel la Católica», «Santa María la Blanca», «Paseo Cristóbal Colón», «Fray Ceferino González», «Adolfo Rodríguez Jurado», «Francisco Carrión Mejías», «Cristo de las Cinco Llagas» y «Almirante Argandoña»;
  - «Pl. España (Torre Norte)» y «(Torre Sur)», con el paréntesis impreso, que el lector perdía.
- **`CORREGIR`**: renglones que el lector perdía, mirados en la página:
  - «Avda. / Constitución» en La Paz (Canal Sur, p. 23), en la cruz a las 15:00 y en el palio a las 16:00;
  - «Jesús de la Vera / Cruz» en Siete Palabras (p. 51, palio, 22:00);
  - la hora «1:45» de la «Entrada» de Bellavista (Consejo, p. 2, en la misma celda);
  - «Santa / Margarita» en la cruz de Bellavista (Consejo, p. 2, franja 20:30). Ahí `SUELTAS` tiraba el «Santa» como rótulo; lo vio la revisión de 38bfaf38.
- **Pino Montano, a mano (`A_MANO`, Consejo, p. 2).** Lo que hacía mal el lector:
  - la rotulaba Sábado de Pasión y le daba como «paso» la columna de Bendición y Esperanza;
  - pegaba el texto espaciado («Caminodelos Toros», «Corraldel Agua»);
  - partía «Travesía Ntra. Sra. / Consolación»;
  - perdía la «Entrada 1:20» de la cruz.
  - Dos copias independientes, celda a celda, coinciden.
- **Fuente de cada tramo**: `unir.mjs` guarda de qué lectura sale cada columna (`ORIGEN`).
  - La hermandad lleva la fuente y el PDF de su tramo principal: el paso o, si no hay, el palio. Es el tramo que usa erCuñao, y su fuente es la que cita. En `fuentes` va la de cada tramo que salga de otra lectura.
  - El plano dibuja la cruz de guía y el último paso del cortejo (`site/build.mjs`, 2283-2286).
  - Pino Montano y La Misión citan ya la rejilla del Consejo.
  - Redención y La Quinta Angustia también, con la cruz de Canal Sur en `fuentes`.
  - Los Gitanos siguen con Canal Sur, con la cruz del Consejo en `fuentes`.
  - `build-data.js` toma para la hora de salida la fuente de su propio tramo. Hoy no cambia ninguna ficha, porque las cinco tienen la hora de la Nómina del Consejo.
- **Alias** (`alias-calles-sevilla.json`):
  - «Avda. Constitución» → «Avenida de la Constitución». Sin él casaba con una «Avenida Constitución» a 5 km, en el Aljarafe, y se quedaba estimada. Arregla también El Cerro, que ya estaba así.
  - «Travesía Ntra. Sra. Consolación» → «Travesía de Nuestra Señora de la Consolación».
- **Regeneración, sin pisar los empalmes a mano:**
  - `itinerarios-2026.json`: `unir.mjs` cambia 23 hermandades, estas 19 y las 4 de siempre. Se toman solo las 19.
  - `recorridos/sevilla.json`: con `geocodificar.mjs` y `enrutar.mjs` cambian 18 de estas 19 y El Cerro, por el alias. Los Gitanos no cambia, porque `fuentes` no pasa al plano. Las extraordinarias quedan como estaban.
  - Unos 30 puntos pasan de «estimado» a su calle.
  - **Dos hermandades se empalman a mano.** Al volver a ejecutar `geocodificar.mjs` reaparece el problema en las dos.
    - El problema es el mismo: el palio no tiene sede, y con el nombre unido el primer nombre reconocido es una calle larga. El ancla de `situar()` toma su primer tramo de OSM.
    - **Los Panaderos:** «Jesús del Gran» y «Poder» ya caían en el mismo punto de la calle. Al regenerar, el palio tomaba el tramo más lejano de la calle, a 953 m de la Campana, salía «dudoso» y se quedaba estimado a 107 m.
    - **Cristo de Burgos:** «Doña María» y «Coronel» caían en el cruce con Dueñas. Al regenerar pasaban dos cosas. Lo vio la revisión de 38bfaf38.
      - El punto se iba unos 90 m más allá del giro, hacia Bustos Tavera, y el cortejo daba un rodeo.
      - Feria subía 57 m, y el trazado iba y volvía.
      - El empalme deja los dos como en 9f1d563c.
    - En las dos se unen las dos mitades en su punto, con el trazado de la segunda. El arreglo de fondo es darles sede con fuente en `site/data/sedes/sevilla.json`: Capilla de San Andrés para Los Panaderos y Parroquia de San Pedro para Cristo de Burgos.
- Sigue igual: lo que ya estaba pendiente del plano (franjas que empujan horas oficiales) y de erCuñao (solo mira un tramo: el paso o, si no hay, el palio).
- **Pendiente, visto en la revisión de 38bfaf38 (`wf_d19d4d22-fe0`) y en la de 15af05de.** Todo ya estaba en 9f1d563c, salvo el rodeo de El Cerro, que trae el alias (ver abajo).
  - **Columnas del Consejo mal leídas.** Ya citan al Consejo, que es de donde salen, pero su contenido no casa con la página:
    - **Redención, palio (p. 6)**, el tramo que usa erCuñao:
      - lee «17:05 Lasso Vega» donde la página pone «17:00 J. Lasso Vega»;
      - lee «17:31 Campana»;
      - falta «Plaza 18:26»;
      - lleva pegados «Argote de MolinaPl.» y «Álvarez QuinteroSan».
    - **Los Gitanos, cruz (p. 14):**
      - siete nombres llevan trozos del palio pegados;
      - las franjas 2:25 y 5:25 no existen;
      - tiene «12:00 Juan» y «13:00 Valle» después de la Entrada.
      - La columna de Canal Sur, p. 67, está limpia.
    - Arreglo: copiarlas a mano o elegir la de Canal Sur.
  - **«Plaza» con hora en el Consejo.** `limpiarLugar` solo salva «PLAZA» en mayúsculas, así que en el Consejo se pierde la carrera oficial («Plaza 21:34»). Afecta a:
    - La Quinta Angustia, paso;
    - Los Javieres y Dulce Nombre, cruz y palio.
  - **Texto pegado de la celda vecina:**
    - Dulce Nombre: «Argote de MolinaP.» y «Argote de MolinaMig.»;
    - El Cerro: «CajalAvda. Ramón y Cajal»;
    - La Resurrección, cruz (Consejo), mucho más rota que eso:
      - horas de 9:00 a 15:00 en franjas de 13:00 a 21:30;
      - nombres como «Palos S.», «Campana J. del», «S. Miguel Plaza», «Francos Palos» o «Entrada Pl.».
  - **Otros:**
    - La Misión: «Páez de Ribera» casa con una calle «Ribera» a unos 5-6 km. Se descarta y el punto queda estimado, pero arrastra hacia el norte el punto de Manuel Siurot. Falta el alias «Calle Páez de Rivera», que existe en OSM.
    - La Paz: las dos torres de la Plaza de España caen en el mismo punto, porque `norm()` quita el paréntesis.
    - El Cerro: hasta la avenida de la Constitución, `enrutar.mjs` dibuja un rodeo de 1.730 m por la Glorieta de San Diego.
      - Lo trae el alias de esta tanda. Antes el punto era estimado y ese tramo medía 1.187 m.
      - En conjunto, de Carlos V a Arfe, pasa de 2.348 a 2.080 m.
      - Falta ver por qué el grafo no pasa por la calle San Fernando.
    - `auditar.mjs` cuenta las rectas con el `via` del punto de llegada. Debería usar el del de salida, y por eso da avisos falsos.
    - En `A_MANO`, una entrada sin `fuente` hereda la de `ORIGEN` aunque su `pdf` sea otro. Hoy solo le afecta a El Santo Entierro, y cuadra.

## 2026-11-25 · Huelva (Oración en el Huerto y Los Judíos), nombres partidos de Sevilla y foto de las Angustias de la Alhambra (Pablo: «Ya» y «La 1»; rama `arreglo-huelva-sevilla-25nov`)
Son los tres pendientes que dejó la entrada «Recorridos rotos, 2.ª tanda».
- **Huelva, «El Llamador» (`HUELVA 26.pdf`), p. 26, mirada a 500 ppp y con la capa de texto del PDF.** Las dos columnas de cada hermandad se copian celda a celda en `A_MANO` (`unir.mjs`):
  - **Vera Cruz y Oración** (cabecera «ORACIÓN EN EL HUERTO», Parroquia de la Concepción): antes salía en una sola columna, con la cruz y el palio mezclados («Mora Claros Salida», «Méndez Hernán Cortés Núñez»). Su hora era la del palio. La cruz de guía sale a las **19.10** y entra a las 23.15; el palio sale a las 19.55, pasa por la carrera oficial a las 20.45 y entra a las 00.10.
  - **Los Judíos** (Parroquia de la Merced): no tenían itinerario ni hora. La cruz de guía sale a las **20.30**, pasa por la carrera oficial a las 21.40 y entra a la 01.30; el palio sale a las 21.20, pasa por la carrera a las 22.35 y entra a las 02.30.
    - La «Salida (20.30)» de la cruz está en la fila de las 19:30 y las dos celdas siguientes van una franja por delante.
    - La hora es la buena porque cuadra con el palio: sale 50 min después, pasa por la carrera 55 min después y entra 60 min después.
    - Se copia tal cual; `build.mjs` no deja que el tiempo retroceda. Efecto en el plano: Paseo Independencia (fila 20:00) sube a las 20:30, la misma hora que San José, y la cruz salta unos 400 m de la Merced a San José al salir.
  - Con fuente de la ciudad cuando la hermandad no tenía entrada: `A_MANO` toma la de `FUENTES`.
  - En `portal.json` cambian solo esas dos horas: Vera Cruz y Oración pasa de 19:55 a 19:10; Los Judíos, de «por confirmar» a 20:30.
- **Nombres en dos renglones con el segundo en minúscula (Sevilla; Canal Sur y, en Pino Montano, la rejilla del Consejo, p. 2)**: `limpiar()` une también, en la misma fila:
  - «… de» + «la/el/los/las Mayúscula». Son 8 puntos en 7 tramos de 5 hermandades:
    - «Javier Lasso de la Vega»: Vera Cruz, San Bernardo y Soledad de San Lorenzo;
    - «Santa Ángela de la Cruz»: Carmen Doloroso, dos en el palio;
    - «Camino de los Toros»: Pino Montano.
    - Cada punto queda en la calle donde ya caía la segunda mitad, a 0 m de su calle en OSM. Desaparece el punto «estimado» de la primera mitad, que estaba a entre 31 y 185 m.
  - «…» + «de/del Mayúscula», con el corte antes del «de». Lo encontró la revisión independiente:
    - «Parque Sierra de Aroche»: Pino Montano, palio, 21:00. Antes «Parque Sierra» era un punto estimado; ahora va a la calle Parque Sierra de Aroche.
    - «Hospital San Juan de Dios»: La Sed, en la cruz (12:30) y en el palio (13:30).
      - Antes, «Hospital San Juan» casaba con la calle San Juan del centro, a 872 m de Eduardo Dato. Su salida era dudosa y no se situaba (ver «La Sed queda pendiente» más abajo).
      - Ahora casa con la calle San Juan de Dios de Nervión, junto al hospital de la avenida Eduardo Dato. La salida, estimada, va ahí, y `auditar.mjs` deja de avisar de que «acaba a 1315 m de donde sale».
      - Queda un tramo rápido: las dos filas de Eduardo Dato (13:00 y 13:30) caen en su extremo este. Hasta Jiménez Aranda, a las 14:00, hay 1073 m, porque el geocodificador pone un solo punto por calle.
  - Medido con `unir.mjs` en las 8 capitales, comparando la regla nueva con la anterior: no cambia nada más.
- **Cómo se regenera sin pisar los empalmes a mano** (ver «Empalmes a mano…» en la entrada «Recorridos rotos, 2.ª tanda»):
  - `itinerarios-2026.json`: `unir.mjs` cambia 12 hermandades, estas 8 y las 4 de siempre. Esas 4 son El Resucitado de Jaén, El Perdón de Cádiz, La Lanzada de Huelva y Humillación y Piedad de Cádiz. Se toman solo las 8 y el resto queda como estaba, también el orden.
  - `recorridos/sevilla.json`: con `geocodificar.mjs` y `enrutar.mjs`, en Sevilla cambian solo las 6 hermandades. Las extraordinarias se quedan como estaban.
  - `portal.json` no cambia por Sevilla: los nombres de calle no entran en la ficha.
  - `recorridos/huelva.json`: al regenerar cambian 12. Se toman solo las 2 de esta tanda.
  - `informe-geocodificacion.json`: Jaén se conserva y Sevilla se pone al día.
- **Foto de N.ª S.ª de las Angustias de la Alhambra (Granada)**: es la de la portada de la web oficial de la hermandad (`_DSC3667`, 1707×2560 px).
  - Sin fotógrafo citado, crédito ni firma, ni en la página ni en los datos de la foto. Crédito a la hermandad, con la regla de Pablo del 5-nov.
  - Pablo la eligió el 25-nov («La 1») frente a la de Commons (Jl FilpoC).
  - Sustituye a la de 1489acci, que estaba tomada desde arriba.
- Siguen pendientes, vistos en la revisión y que ya pasaban antes:
  - **Plano, una franja empuja una hora oficial.** Para que el tiempo no retroceda, `build.mjs` (en `datosCalle`) sube la hora oficial hasta la franja anterior.
    - En Vera Cruz y Oración sale «00:30 Templo» en lugar de 00:10, y la cruz entra a las 23:30 en lugar de las 23:15.
    - Son 34 horas oficiales empujadas en total: 4 en Huelva (dos de Vera Cruz y Oración) y 30 en el resto (Jaén 25, Sevilla 4 y Córdoba 1).
    - Arreglo propuesto: que una franja que choca con la hora oficial de un punto vecino se anule y se reparta por distancia. Eso quitaría también el salto de Los Judíos.
  - **erCuñao mira solo el tramo del paso o del palio.** «¿Pasan los Judíos por Puerto?» dice que no, porque Puerto, Vázquez Limón y José Nogales solo están en la columna de la cruz.
  - **erCuñao llama «palio» al segundo paso de La Buena Muerte de Huelva**, que va sin palio (columna «PASO VIRGEN»).
  - *(Los tres puntos siguientes, resueltos el 26-nov: ver la entrada de arriba.)*
  - **Fuente mal atribuida en 7 tramos de 5 hermandades de Sevilla.** `unir.mjs` guarda la fuente de la primera columna que lee, no la de la que elige.
    - Afecta a Pino Montano (cruz y palio), La Misión (2), Redención (palio), La Quinta Angustia (paso) y Los Gitanos (cruz).
    - Esas columnas salen de la rejilla del Consejo, pero la ficha y erCuñao citan Canal Sur.
    - Arreglo: guardar la fuente y el PDF de la columna elegida (`FUENTE_A_MANO.cgh` cuando viene de `sevilla-cgh-2026.json`).
  - **Quedan unos 30 puntos partidos en dos renglones en 15 hermandades de Sevilla.** La regla no los une porque:
    - el primer renglón acaba en «la»: «Avda. Isabel la / Católica» (Santa Genoveva) y «Santa María la / Blanca» (San Bernardo);
    - o los dos renglones van en mayúscula:
      - «Jesús del Gran / Poder», 8 veces;
      - «Travesía Ntra. Sra. / Consolación» (Pino Montano), que erCuñao enseña como dos sitios;
      - «Avda. Manuel / Siurot», «Cardenal / Ilundain» y «Adolfo Rodríguez / Jurado», entre otros.
    - Con los dos en mayúscula, el texto no basta, porque una fila puede traer dos calles. Hay que decidirlo con la geometría del PDF en el lector (renglones seguidos de la misma celda) o con alias.
    - La rama «cola» debería exigir que el renglón anterior no sea un rótulo (Salida, Entrada, C. OFICIAL) y que la columna no esté mezclada. Hoy solo une los 3 puntos buenos, comprobado en las 527 columnas leídas.
  - **Pino Montano, cruz de guía:**
    - «Caminodelos Toros» y «Corraldel Agua» salen pegados, porque el texto del Consejo viene espaciado letra a letra.
    - La entrada pierde su hora oficial, la 1:20.
  - **La Sed:** su templo está en OSM (Parroquia de la Inmaculada Concepción, vía 72800137), aunque `sedes/sevilla.json` dice que no. Falta añadirlo con su fuente, para que la salida y la entrada dejen de ser estimadas (ahora están a unos 340-357 m).

## 2026-11-25 · Agenda sin titulares de prensa también al compilar en un push (rama `arreglo-agenda-25nov`)
- Lo que el bot guardó en `agenda-externa.json` sacado de una noticia (origen «noticia») se vuelve a titular con las reglas de hoy en `site/build.mjs` (`eventosExternos`) y en lo que arrastra `tools/agenda-externa.mjs`, con `tituloGuardado` (`site/eventos.mjs`): desde la frase y el titular de `agenda-cuerpos.json` como en `eventosNoticias()`, o, si ya no están, el título guardado solo si nombra el acto y no es una oración; sin nombre limpio del acto, fuera (antes solo pasaba al correr el bot: con los datos del 25-nov salían 16 titulares, 13 frases y 3 sin verbo, como «José Manuel Carmona Meléndez, pregonero…» de vía crucis). Además, un cabildo es «Acto», no «Cultos», y la capital de InfoCofrade la dice la sede del título, no la banda que acompaña («(Sevilla-Este)» salía en Cádiz por una agrupación de Jerez; en `agenda-externa.mjs` gana también el pueblo más largo: «Sanlúcar la Mayor» es Sevilla, no Cádiz). Actos futuros: 253 → 237; sacados de noticias, 16 → 0; ninguno de agenda cofrade ni verificado se pierde.

## 2026-11-25 · «Enciende la vela» y el nazareno camino de 2027 (diseño de Pablo del 13-nov: «eso es perfecto»; rama `vela-camino-2027`)
- **Qué:** en la portada, fuera de temporada, la sección del nazareno que se dibujaba al bajar pasa a ser el prototipo aprobado (`EQUIPO/prototipos/vela-camino-2027.html`): vela apagada → «Enciende la vela» → llama → zoom a la llama → destello y paso a la llama del cirio → la cámara se aleja y el nazareno anda sin fin por una calle encalada con las colgaduras de las ocho capitales, hacia la estrella de 2027. Al echar a andar entran los textos de siempre. «Próxima Semana Santa» abre ya en la calle, sin la vela.
- **Cómo se pinta (elegido):** `site/vela.mjs` escribe la escena en capas SVG (calle, estrella, nazareno y vela) y `assets/vela.js` las lee y las pinta en un `<canvas>`. Las capas SVG son, a la vez, la escena final sin JS o con «reducir movimiento» y los datos del lienzo (un solo dibujo). Al echar a andar, cada pieza que se mueve (calle, suelo, cuerpo, zapatos, llama y estrella) pasa a su propio lienzo pintado una vez y la mueve el navegador con Web Animations (solo transform y opacidad, con los fotogramas clave del prototipo): ningún JavaScript por fotograma en el bucle sin fin.
- **Descartado:**
  - el SVG del prototipo tal cual (zoom por `viewBox` y la calle con animaciones CSS dentro del SVG): Safari repinta un SVG entero cada vez que cambia su escala (memoria «probar en Safari del iPhone»), y con la calle sin fin lo repintaría siempre;
  - andar con el lienzo grande repintado en cada fotograma: en Chromium obligaba a recolocar las capas de toda la portada en cada fotograma («Layerize» ~600 ms cada 3 s con la CPU frenada ×6);
  - mover las piezas escribiendo su `transform` desde JavaScript en cada fotograma: mismo problema en Chromium;
  - el zoom con `transform: scale` de CSS sobre capas: el encargo ya lo descartó (a 24× se quedaba pequeño en una esquina) y escalado se ve borroso.
- **Tiempos:** los del prototipo, con dos cambios para que no se note el paso de la vela al nazareno: las dos llamas se funden quietas, a la vez y del mismo tamaño, bajo el destello (0,3 s) antes de que la cámara se aleje; y el nazareno arranca poco a poco (0,9 s) en lugar de echar a andar de golpe, con la llama ya inclinada.
- **Composición:** la calle ocupa media escena (algo menos en el móvil); el nazareno, a un quinto, como pidió Pablo; los textos arriba a la izquierda, sin fondo (solo sombra del color del cielo); la estrella a la derecha (en el móvil, junto al título). La escena mide la pantalla (entre 560 y 920 px) y tiene ese alto desde el principio: CLS 0.
- **Sin la línea de fechas** («Del Viernes de Dolores… al Domingo de Resurrección…»): el encargo la cita, pero Pablo la quitó el mismo 13-nov, media hora después de escribirlo (bb260708: «Fuera las fechas junto al nazareno, están en Las jornadas»). Se queda lo que había: «Próxima Semana Santa», «Semana Santa 2027», la cuenta atrás y el botón. Si la quiere, es una línea en `escenaVela`.
- **Arreglos de la revisión (25-nov):**
  - *En el móvil la escena cabe entre la cabecera y la barra de pestañas* (antes medía la pantalla entera y, a 360×740, el suelo y los pies del nazareno quedaban detrás de la barra). En pantallas bajas (375×667) la calle mengua en lugar de subir detrás de los textos: lo más alto de su dibujo, la cruz de la espadaña, queda bajo el botón. Descartado subir el suelo con la escena del mismo alto: la calle se metía detrás del botón igual. En el ordenador no cambia nada.
  - *Por debajo de unos 400 px la estrella sube* a la altura de la frase, en el cielo de la derecha, y la frase se estrecha para dejarle hueco: a la derecha del título no cabía (a 360×740 lo pisaba 31 px). Descartado achicarla para que cupiera: a 360 px quedaba en unos 70 px y el «2027» casi no se leía.
  - *«volver arriba» no sale encima de la escena*, como ya no sale encima de un plano: en el móvil la calle llena la pantalla y lo tapaba.
  - *En «Próxima Semana Santa», `blocking="render"` solo si la escena se va a mover.* Con «reducir movimiento» ya no se pide `vela.js` ni se espera a nada. La etiqueta la escribe el script del `<head>` con `document.write`, que es lo único que la deja igual que antes (del analizador, con `defer` y `blocking`). Descartado crearla con `createElement`: no puede ser `defer`, correría antes de que exista la escena y dejaría pintar sin ella. También descartado quitar `blocking`: un fotograma de la calle quieta en su sitio de partida antes de la que llega de la portada. Medido en Chromium con red lenta simulada (150 ms, 1,6 Mb/s): primer pintado 2,43 s frente a 2,57 s antes; con «reducir movimiento», 2,25 s frente a 2,58 s. `document.write` sale en los diagnósticos de Lighthouse (peso 0, no cuenta en la nota).
  - *VoiceOver:* si el botón de la vela tenía el foco al tocarlo, el foco pasa al título (con VoiceOver el toque puede llegar como un clic de ratón y el botón, al esconderse, dejaba al lector sin sitio).
- **Arreglos de la comprobación antes de publicar (25-nov, con agenda y recorridos ya unidos):**
  - *«Próxima Semana Santa» se ve entera al llegar.* Allí la escena va debajo de la cabecera y de las migas (empieza a 85 px en el móvil y a 91 en el ordenador, lo que medía el antiguo `--naz-t`) y no las descontaba: a 390×844, 39 px del suelo quedaban detrás de la barra de pestañas, y a 1440×900 los zapatos del nazareno a 19 px del borde de la ventana, con el suelo fuera. Ahora descuenta las migas (40 px en el móvil, 46 desde 760 px) y, en el ordenador, también la cabecera; el mínimo baja lo mismo (a 375×667 la escena mide 521 px y cabe). Desde 701 px de ancho (ordenador y tableta), con la escena más baja y los textos igual de grandes (van con el alto de la ventana), la calle subía detrás del botón (a 1440×900, lo alto de la espadaña 28 px por encima de su borde de abajo): allí lo alto de la calle se queda donde en la portada con esa ventana y la calle mengua lo que haga falta. En el móvil ya lo hacía su regla (la calle no pasa de 388 px de lo alto de la escena). Por eso la calle y el nazareno de «Próxima» son más pequeños que en la portada. Cuánto, medido: un 5 % a 390×844 y 393×852, un 16 % a 360×740 y un 23 % a 375×667 y 320×568; en la tableta, un 10 % a 768×1024 y 959×1000, un 12 % a 701×800, un 14 % a 959×800 y un 16-17 % a 800×700, 900×700 y 800×600; en el ordenador, un 21 % a 1440×900, un 22 % a 1536×864, un 24,5 % a 1366×768 y, en ventanas bajas, un 29 % a 1366×657 y un 31 % a 1280×600. Mide lo mismo con la escena a su máximo (920 px): 820×1180, 1920×1080 y ventanas de más de 1011 px de alto. Descartado dejar la calle del tamaño de la portada: no cabe entre el botón y el borde (subiría detrás del botón 60 px a 1440×900 y 90 a 1366×768). Con esto, desde 701 px la holgura entre el botón y lo alto de la calle es la de la portada con la misma ventana, de 2,5 px menos a 6 más (a 1366×657 y 1280×600 la calle sube 35 y 50 px detrás del botón, y en la portada 33 y 47). En el móvil queda algo menos que en la portada (17 px frente a 37 a 390×844), nunca menos de 16.
    La primera versión de este arreglo solo corregía la calle desde 960 px: entre 701 y 959 px subía unos 24 px más detrás del botón que en la portada (959×800: 34 px, frente a 10 en la portada, tapando la cruz y lo alto de la espadaña; 701×800: 3 px, frente a 18 de holgura). Corregido con el `--vh` que tiene la portada en esa franja (sin cabecera ni barra).
    Medido en Chromium y WebKit, con las mismas cifras en los dos, a 390×844, 393×852, 375×667, 360×740, 768×1024, 820×1180, 701×800, 800×700, 900×700, 959×800, 959×1000, 1280×600, 1366×657, 1366×768, 1536×864, 1440×900 y 1920×1080: suelo entero y pies por encima de la barra o del borde (0-1 px de holgura en el suelo), también con «reducir movimiento» en los cuatro tamaños del encargo. No cabe con el mínimo de la escena (560 px menos las migas), y ya no cabía antes: a 320×568 quedan 97 px del suelo y 62 de los pies detrás de la barra (antes, 137 y 92), y a 800×600 faltan 65 px de suelo y 8 de los pies (antes, 111 y 42; con la primera versión, 1 px de los pies). La portada no cambia: las reglas solo tocan `[data-vela="proxima"]`; mismas medidas con la vela encendida y con «reducir movimiento», a 360×740, 375×667, 393×852 y 1440×900, y la escena idéntica píxel a píxel con «reducir movimiento», en los dos navegadores.
  - *La transición desde la portada lleva la calle de un tamaño al otro.* Como en «Próxima» la calle es más pequeña, la View Transition de la escena (que solo fundía la foto de la portada con la de «Próxima») enseñaba durante 0,3-0,4 s dos calles de distinto tamaño, dos nazarenos y dos estrellas con su «2027»; antes de este arreglo las dos medían igual y la calle solo se deslizaba. Ahora: el nazareno (cuerpo, zapatos y llama) y la estrella van aparte, cada pieza con su nombre, y pasan de su sitio y tamaño en la portada a los de «Próxima»; las dos fotos de la escena (cielo, calle y suelo) se encajan por abajo a la izquierda, donde empieza la calle, y la cámara se aleja: la de la portada encoge hasta el tamaño de la otra mientras se va, y la de «Próxima», debajo y entera, llega desde el tamaño de la portada. Calle, suelo y nazareno coinciden en cada fotograma; el primero es la portada tal cual y el último, «Próxima». `vela.js` guarda al salir de la portada lo que mide allí una unidad de la calle, y en «Próxima» pone las escalas y la clase `oc-vela-vt` solo durante esa transición (en `pagereveal`, que llega después de `vela.js` en Chromium y en WebKit), si viene de la portada andando y las calles no miden lo mismo; si no, la transición es la de siempre. Queda una estela de unos 13 px a los 0,2 s porque la foto de la portada está quieta y la calle nueva ya anda: también pasaba en la versión aprobada, por lo mismo. Volver atrás no cambia: la portada se carga de nuevo con la vela apagada y la calle se funde con la vela, como antes. Descartados: la calle del tamaño de la portada en «Próxima» (ver arriba) y esconder la foto de la portada (la calle saltaría de tamaño en el primer fotograma). Grabado a cámara lenta en Chromium a 1440×900, 1366×768, 959×800, 390×844 (claro y oscuro) y 375×667, y montado también a velocidad real. En el WebKit de Playwright para Windows las capturas no enseñan la página nueva mientras dura la transición, tampoco con la versión de antes: allí solo se comprobó que la transición empieza con la clase y las escalas puestas. Falta verla en un iPhone de verdad.
  - *El foco pasa al título también en Safari.* Al tocar la vela, WebKit no da el foco al botón y lo deja en `main#contenido` (`tabindex="-1"`), y la salvaguarda solo miraba `<body>`: el foco se quedaba en `main`. Ahora vale también cualquier antecesor de la sección; lo que se haya enfocado a propósito fuera de ella (probado con el logo de la cabecera) no se toca. Probado en Chromium y WebKit: toque a 390×844 y clic a 1440×900, al título; con el teclado (Intro) el foco espera en el botón y pasa al título cuando salen los textos, como antes.
- **Pendiente de Pablo:** la segunda visita (recordar en el navegador que ya encendió la vela y empezar andando). El encargo pide proponérsela antes de hacerla. Y si cubrir el iPhone SE de primera generación (320×568), donde ni la portada ni «Próxima» caben con el mínimo de la escena: habría que bajar ese mínimo o encoger más la calle.
- **Medido** (banco de pruebas con la portada y «Próxima Semana Santa» de una compilación previa, porque aquí no se pudo ejecutar `build.mjs`): Chromium sin errores, CLS 0 y a la cadencia máxima en todas las fases; con la CPU ×6, la escena sola hace el zoom a 44 fps y anda a 51 (prototipo: 22 y 32). En el WebKit de Playwright para Windows, que compone por software, la portada quieta ya va a 15-22 fps: a 390 px, andando, va igual (18-21 fps); a 1440 px baja a unos 8. Por píxel rinde 1,2 (390 px) y 2,5 veces (1440 px) lo que el prototipo, que es una caja de 560 px. Falta verla en un iPhone de verdad.

## 2026-11-25 · Recorridos rotos, 2.ª tanda: arreglos de la revisión (rama `recorridos-rotos`)
Cinco avisos de la revisión de la tanda anterior (entrada siguiente). Cada hora y cada calle sale del PDF, mirado a página renderizada.
- **Antes de publicar (25-nov, rama `arreglo-recorridos-25nov`)**: con la agenda y la vela encima, la red de seguridad paraba en dos pasos que en `origin/main` daban 0.
  - *`comprobar-origen`: `portal.json` no se había regenerado* tras cambiar `itinerarios-2026.json` (2 diferencias, las dos de Huelva). Mirado en «El Llamador» (`HUELVA 26.pdf`), p. 26: La Misericordia, cruz de guía «Salida (19.40)» y paso de Cristo «Salida» sin hora; La Buena Muerte, cruz de guía «Salida (19.20)» y paso de Virgen «Salida (19.50)». El campo `hora` es la salida oficial, la de la cruz de guía, así que 19:40 y 19:20 son las buenas: el 19:50 que había era la del paso de Virgen, y La Misericordia no tenía hora. La fuente (`A_MANO` en `unir.mjs`) ya estaba bien; solo se ejecuta `build-data.js` y cambian esas dos y nada más.
  - *erCuñao (`probar-cunao.mjs`)*: seis casos daban por buenos los datos rotos que arregló la tanda 1. Cada respuesta nueva, mirada en Canal Sur (`SEVILLA 26.pdf`): **el Cachorro**, p. 75, palio «Salida» en la franja de las 17:00 (sin hora exacta) y «Entrada (2:35)»: «El palio sale hacia las 17:00» y «unas 11 h» desde la cruz de las 15:35 (el «paso» de las 18:10 era el de otra cofradía); **la Vera Cruz**, p. 32, palio «Salida (20:25)», Campana 21:06, Plaza 21:46 (antes llevaba el palio de San Gonzalo, que sale en la franja de las 16:30); **Santa Marta**, p. 32, un solo paso, «Salida (18:42)» y entrada 22:20 (antes, la cruz y el palio de Santa Genoveva). Las tres segundas salidas cuadran con la regla del bloque 7 (después de la cruz, antes de que la cruz llegue a la Campana y al menos 10 min detrás de ella en la carrera). Se actualizan B7-7, B7-9, B7-13, B7-18 y B8-6.
  - *«Avión Cuatro Vientos» no es de los Servitas*: p. 80, es de El Sol (cruz 21:00, palio 21:30). Los Servitas la tenían porque se les había leído el palio de El Sol (de ahí los 198 caracteres menos en `itinerarios-2026.json`). Su palio de la p. 80 («Salida (16:05)», Dueñas, Santa Ángela de la Cruz… «Entrada (22:40)») coincide celda a celda con el que hay: no se perdió nada. B6-27 pregunta ahora por El Sol (sigue probando que «avión» no es fuera de tema) y B6-27b, que los Servitas no pasan por ahí. Batería: 304 de 304.
  - `comprobar-marchas` pasa de 114 a 115 avisos (no errores): en Huelva, el Jueves Santo va en el orden de la carrera oficial, y con sus horas de salida La Misericordia (19:40) y La Buena Muerte (19:20) quedan «desordenadas» tras Vera Cruz y Oración (19:55). Es esperable.
  - Vistos y sin tocar: (1) el lector parte en dos un nombre de dos renglones si el segundo empieza en minúscula («Javier Lasso de» + «la Vega»): 8 tramos de 5 hermandades de Sevilla (Vera Cruz, San Bernardo, Soledad de San Lorenzo, Carmen Doloroso con «Santa Ángela de / la Cruz» y Pino Montano con «Camino de / los Toros»); `limpiar()` de `unir.mjs` exige mayúscula para unirlos, y erCuñao ya lo enseña en el recorrido de la Vera Cruz. Arreglarlo pide volver a pasar `unir.mjs` y geocodificar Sevilla. (2) Vera Cruz y Oración de Huelva tiene la hora 19:55, que es la del paso de palio: en la p. 26 su cruz de guía sale a las 19.10, y su columna está mezclada como lo estaban La Misericordia y La Buena Muerte. (3) Los Judíos de Huelva no tienen itinerario ni hora; la p. 26 trae su cruz (20.30) y su palio (21.20).
- **Salida y entrada sin sede (`geocodificar.mjs`, `sedeEstimada`)**: sustituye a la regla de la tanda anterior («en la primera y en la última calle»). Esa regla se aplicaba tramo a tramo, y la cruz y el paso de una misma hermandad salían de sitios distintos: Santa Genoveva a 353 m, El Museo a 301 m, El Cerro recogía a 402 m, Pasión y Muerte y La Misericordia de Huelva a unos 230 m. Ahora todos los tramos de una hermandad sin sede usan un mismo punto estimado.
  - La salida va en la primera calle del tramo que sale antes (la cruz de guía) y la entrada, en la última del que entra después (el paso o el palio). Se eligió así midiendo las 51 hermandades con sede y dos tramos de Sevilla, Huelva y Almería. Para la salida, la primera calle de la cruz queda igual o más cerca del templo que la del paso en 40 de 51 (media de 174 m frente a 198 m). Para la entrada, la última calle del paso queda a 166 m de mediana y la de la cruz, a 241 m. Se descartó usar el mismo punto para salida y entrada: sería suponer que salen y entran por el mismo sitio.
  - Si esa calle cae lejos de la siguiente, es dudosa y no se sitúa ni ella ni la salida (o la entrada). «Lejos» es más de 600 m a más de 20 m/min. Ese ritmo solo lo supera el 5 % de los pasos entre dos calles seguidas de esas tres capitales; la mediana es 6,6 m/min. Solo salta en **La Sed**: «Hospital San Juan / de Dios» casaba con una calle de San Juan del centro, a 872 m de Eduardo Dato en media hora, y su salida quedaba a 2 km de su entrada. **La Sed queda pendiente**: sale sin situar hasta tener un alias para esa calle en `alias-calles-sevilla.json` o su sede («Parroquia de la Concepción») con fuente en `site/data/sedes/sevilla.json`. *(Resuelto el 25-nov, entrada de arriba: con «Hospital San Juan de Dios» unido, casa con la calle San Juan de Dios de Nervión y la salida se sitúa como estimada. Sigue faltando su templo con fuente.)*
  - Cambian 11 hermandades de Sevilla (Santa Genoveva, El Museo, El Cerro, Los Estudiantes, El Carmen Doloroso, La Sed, Los Panaderos, Cristo de Burgos, Los Negritos, La Carretería y Pasión y Muerte) y La Misericordia de Huelva. En Almería no cambia ninguna. Ya no hay ninguna hermandad de las tres capitales con la salida o la entrada de sus tramos a más de 120 m entre sí.
  - Huelva: Las Tres Caídas y Los Estudiantes tampoco tienen sede en `site/data/sedes/huelva.json`. Se dejan como estaban: en el archivo publicado vienen de una geocodificación anterior a la tanda pasada, con una sede adivinada (común a sus tramos) y columnas mal leídas. Al regenerarlas cambian más cosas que la salida, y eso hay que revisarlo aparte.
- **Sábado de Pasión de Sevilla, rejilla del Consejo, p. 2 (`A_MANO` en `unir.mjs`)**: la página tiene dos escalas de horas. La del Viernes de Dolores va a la izquierda, de 17:30 a 2:00, en 18 filas. La del Sábado de Pasión va a la derecha, de 15:00 a 1:30, en 22 filas más estrechas. El lector usó la de la izquierda para las dos jornadas: las franjas del Sábado de Pasión iban de 2 h 30 min a 30 min tarde, y había nombres partidos entre dos filas. Padre Pío, Torreblanca, Divino Perdón y San José Obrero se copian a mano, celda a celda, con la escala de la derecha. Las columnas de Canal Sur (p. 14) coinciden calle a calle con las cruces de guía del Consejo.
  - **Divino Perdón** (Alcosa en el Consejo): el «paso» era la columna de Canal Sur, que es la de la cruz de guía (con la recogida del palio en rojo), mal leída. Se quita. La cruz sale en la franja de las 17:30 y el palio a las 18:15. **Pendiente**: la hora exacta de salida de la cruz. Ningún PDF la da y no se pone la de la franja (queda en `pendiente` de su entrada en `itinerarios-2026.json`).
  - **Dolores de Torreblanca**: la «Salida 16:45» que rescataba el lector es de su cruz de guía. Está en la columna «CRUZ DE GUÍA» de Torreblanca, fila de las 16:30, y en Canal Sur es «Salida (16:45)» en su columna. Se queda.
  - **Padre Pío**: la cruz de las 15:10 es suya (columna «CRUZ DE GUÍA» de Padre Pío, fila de las 15:00; en Canal Sur, «Salida (15:10)»). Se adelantaba más de tres horas al palio porque al palio se le había leído la franja de las 18:30, y es la de las 16:00. **Pendiente**: la hora exacta de salida del palio, que no la da ningún PDF.
  - **San José Obrero**: no estaba en la revisión, pero es la misma página y el mismo fallo. Su cruz iba dos horas tarde y su «paso» era la columna de Canal Sur mal leída. Se copia igual.
- **El Santo Entierro (Sevilla)**: el lector juntó la cruz de guía y el duelo en una columna: dos «Salida», horas que retrocedían, y el plano la usaba como paso. Se copia a mano de Canal Sur, p. 81 («CRUZ DE GUÍA» y «DUELO»; el duelo va como `paso`). La rejilla del Consejo, p. 18, da las mismas calles y horas.
- **`unir.mjs`**: `A_MANO` admite `fuente` (`cgh`: la rejilla del Consejo, cuando no es el PDF de la primera lectura) y `pendiente` (lo que la fuente no da), que pasan a la hermandad en `itinerarios-2026.json`.
- **Empalmes a mano que NO se reproducen al volver a ejecutar `unir.mjs` o `geocodificar.mjs`** (los hizo esta rama con scripts sueltos de `.claude/tmp` y del directorio temporal de la sesión, que no están en el repositorio):
  - `tools/sources/itinerarios-2026.json`: tras `unir.mjs`, El Perdón de Cádiz, La Lanzada de Huelva, Humillación y Piedad de Cádiz y El Resucitado de Jaén se devolvieron a como estaban, y las hermandades, a su orden anterior (`.claude/tmp/iti-fuera-de-alcance.mjs` en la tanda 1; la misma operación en la 2). Cambian solo porque `portal-cofrade/data/portal.json` ha cambiado desde la última unión y no están revisadas. Al volver a ejecutar `unir.mjs` reaparecen: El Resucitado de Jaén desaparece, La Lanzada de Huelva y Humillación y Piedad de Cádiz se añaden y El Perdón de Cádiz cambia.
  - `site/data/recorridos/huelva.json`: solo están regeneradas La Misericordia y La Buena Muerte (tanda 1) y La Misericordia otra vez (tanda 2); el resto viene de geocodificaciones anteriores (`.claude/tmp/empalmar-rec.mjs`). Regenerar Huelva entera cambia, además, La Sagrada Cena, La Redención, El Perdón, Las Tres Caídas, La Salud, Los Estudiantes, Pasión, La Victoria, La Esperanza, Vera Cruz y Oración y El Descendimiento.
  - `site/data/recorridos/almeria.json`: solo está regenerada la del Rosario del Mar (tanda 1, por «General Castaños»). Regenerar Almería entera cambia otras diez hermandades (La Estrella, La Santa Cena, Gran Poder, La Coronación, El Calvario, El Prendimiento, La Macarena, Los Estudiantes, Las Angustias y El Santo Sepulcro) y la extraordinaria del Rosario del Mar del 14-nov.
  - `site/data/recorridos/sevilla.json`: todas las hermandades están regeneradas con el código de esta rama (regenerada en HEAD sale idéntica). Las extraordinarias se quedan como estaban: `geocodificar.mjs` las retrazaría con el método viejo y añadiría la del Amparo del 8-nov, ya celebrada.
  - En las tres ciudades, las extraordinarias se quedan como estaban por la misma razón.
  - `tools/itinerarios/informe-geocodificacion.json`: `geocodificar.mjs <ciudad>` lo reescribe solo con esa ciudad. Se conserva Jaén y se pone al día Sevilla.
- Pendientes vistos en esta tanda, sin tocar:
  - En la carrera oficial de Sevilla, «SAN MIGUEL» y «S. Miguel» (sin «P.») casan con la calle San Miguel, a unos 600 m de la Puerta de San Miguel. Pasa en unos 28 tramos (La Sed, Las Cigarreras, El Buen Fin, Los Javieres…). Hace falta un punto fijo que distinga la puerta (entre «Plaza» y «Palos») de la calle (antes de «Campana»).
  - La Milagrosa (Sevilla, Sábado de Pasión) usa la columna única de Canal Sur, cruz de guía con la recogida del palio. El Consejo, p. 2, trae sus dos columnas.
  - El lector (`leer-rejillas.py`) sigue sin saber de páginas con dos escalas de horas: si se vuelve a leer el Consejo, las hermandades de arriba siguen bien por `A_MANO`, pero cualquier otra columna de la p. 2 saldría desplazada.

## 2026-11-25 · Recorridos de Semana Santa rotos en «En la calle» (rama `recorridos-rotos`)
Lista de la sobremesa (13-nov), pendiente «Recorridos de Semana Santa rotos en la web». Cada caso se miró en los datos y, si hacía falta, en el PDF.
- **Cortejo (`calle.js`)**: va del paso al punto por el que el paso pasará cuando lleve los minutos de ventaja de la cruz, **contados por hora**: la diferencia de horas en la salida, en la entrada y en cada sitio por el que pasan los dos con hora oficial (en Sevilla, Campana, Plaza, San Miguel y Palos), repartida entre ellos. Se descartó buscar el punto más cercano a la cruz (lo que había): en las idas y vueltas caía en la vuelta. Con los datos de antes, eso pasaba en 5106 de 33 540 minutos con cortejo en Sevilla; ahora, en ninguno. Se descartó también calcular la ventaja solo con las salidas y las recogidas: en La Hiniesta daba 90 minutos y en la Campana son 46, y el cortejo pasaba por delante de la cruz.
- **Paso de otra cofradía (Sevilla)**: era la lectura de la rejilla del Consejo. El nombre va alineado a la izquierda de cada bloque y el palio salía con el nombre de la hermandad siguiente o con los dos (`unir.mjs`, `bloquesConsejo`). Ahora cada paso o palio es de la cruz de guía que tiene delante en la página. Una cruz con dos nombres es la del que no es la hermandad anterior. Dos bloques con el mismo rótulo pegado se reparten por el orden de los nombres. La primera columna de la página, si no tiene cruz delante, se descarta. Además: una columna mezclada con la vecina (segunda salida, dos entradas) pierde ante una limpia, y un paso que sale antes que su cruz de guía pierde ante otro que no. Una columna ya no salta más de una jornada ni con el nombre completo («Paz y Misericordia», del Viernes de Dolores, era el «paso» de La Paz).
- **Huelva, p. 26 del PDF de «El Llamador»**: la cabecera «CRUZ DE / GUÍA» va en dos renglones y el lector pega columnas. La Misericordia y La Buena Muerte se copian a mano, celda a celda (`A_MANO` en `unir.mjs`). Arreglar el lector y volver a leer Huelva queda pendiente. Faltaba regenerar `portal.json`: lo arregla la entrada anterior («Antes de publicar»), con sus horas de salida miradas en esta misma p. 26 (La Misericordia 19:40, La Buena Muerte 19:20).
- Con los pasos de cada cofradía en su sitio, erCuñao da ya segunda salida al Cachorro (Canal Sur, p. 75), a la Vera Cruz y a Santa Marta (p. 32), y los Servitas dejan de pasar por «Avión Cuatro Vientos», que es de El Sol (p. 80). Los casos de la batería que esperaban lo contrario se cambiaron antes de publicar (entrada anterior).
- **Geocodificación (`geocodificar.mjs`)**:
  - Usa `alias-calles-<ciudad>.json`: Almería, «General Castaños» es la calle Bailén.
  - Corregido el núcleo «de la»: «Encarnación» casaba con la calle Virgen de la Encarnación, a 1 km.
  - La sede sale de `site/data/sedes/<ciudad>.json`, con su fuente. Si ahí no consta, no se adivina: la salida y la entrada quedan como «estimado» en la primera y en la última calle, para conservar su hora.
  - Bellavista, Divino Perdón (Parque Alcosa) y Dolores de Torreblanca no se sitúan: su barrio se sale del callejero descargado y sus calles casaban con homónimas de otro sitio. Se guarda su itinerario y no salen en el plano hasta tener ese callejero.
- **`build.mjs`**: las horas de los puntos van a décimas, como las de los vértices. Antes, un vértice redondeado hacia arriba quedaba por detrás del punto siguiente (El Rescatado, La Sentencia, Zamarrilla). Con varios pasos, el del plano es el que sale más tarde (la cola del cortejo), no el último que se leyó.
- **Regeneración**: Sevilla entera (avisos de `auditar.mjs`: de 100 a 27). En Huelva y en Almería solo las hermandades arregladas: al regenerarlas enteras cambiaban otras sin revisar (sedes nuevas de `site/data/sedes` que destapan calles homónimas, como Las Angustias de Almería). Las extraordinarias se quedan como estaban, porque están trazadas con el método nuevo. Cuatro hermandades que cambiaban solo por `portal.json` se dejan como en HEAD: El Perdón de Cádiz, La Lanzada de Huelva, Humillación y Piedad de Cádiz y El Resucitado de Jaén.
- `plano.mjs` no se ejecutó: falta la caché `cache/fondo-<ciudad>.json` y los planos perderían el fondo fiel.

## 2026-11-10 · erCuñao avisa de la próxima salida extraordinaria (Pablo, vía Marketing: «el bot podría indicarlo sobre la salida extraordinaria del sábado»)
- En «¿A qué hora sale?» y «¿Cuándo sale?», después de la Semana Santa, erCuñao añade la próxima extraordinaria de esa cofradía. Lo hace con cualquiera de `itinerarios-extraordinarios.json` (a través de `data/recorridos/<capital>.json`), no solo con la Pasión. Ejemplo: «Y no hace falta esperar: este sábado 14 de noviembre tiene salida extraordinaria, a las 17:30 desde la Parroquia de los Santos Mártires, con la entrada a las 23:35, según la web oficial de la Archicofradía de la Pasión.»
- Va con un botón «Verla en la calle», que abre el plano en la pestaña de esa salida (`?dia=14 nov · Pasión`). Las listas de actos («¿Qué sale el 14 de noviembre en Málaga?») también enlazan esa pestaña, y no solo el plano de la ciudad.
- Las filas de `D.ex` (cunao.json) suman tres campos:
  - la hora de entrada, solo si la fuente la da (si no, la habría repartido el plano por la distancia y no se dice);
  - la etiqueta de la pestaña, igual que en `En la calle`;
  - la fuente en corto.
- Pasada la fecha ya no se dice. El motor lo comprueba con su fecha de hoy, porque la web compilada guarda las de ayer en adelante.
- Casos B9-1 a B9-3 en `probar-cunao`: los tres se generan con la primera extraordinaria que haya y se omiten si no queda ninguna.
- Auditoría (auditor-web APTO, con un fallo latente que ya está arreglado):
  - Con una fuente de prensa salía «según la diario Sur». Ahora «según la web oficial…» solo va con las webs oficiales, y los medios van entre comillas y con su mayúscula («según «Diario Sur»»).
  - La respuesta lleva también el botón «Fuente de la salida».
  - Caso B9-4, con una fila simulada.
- Queda para otro día: «¿Qué sale este sábado?» fuera de temporada contesta con el Sábado Santo y no con las salidas de ese sábado. Ya pasaba antes.

## 2026-11-10 · Fluidez de toda la página (noche del 9-nov, erCuñao, punto 1 del plan; no se toca el plano)
Medido con Playwright en móvil 390 con la CPU 4 veces más lenta y en PC 1440, mediana de 3 pasadas, contra la versión publicada (6f3635d). Lo que más frenaba eran las imágenes (el navegador bajaba fotos de 3x para huecos pequeños) y el salto del calendario.
- **`sizes` de las imágenes** (`build.mjs`): las miniaturas de 64 px piden 160 en vez de 480 en pantallas de 3x (`SIZES_MINI`). Al principio también se bajaron la cabecera de las capitales y las fotos de la portada (Sevilla, de 1339 a 274 KB; LCP de 1328 a 540 ms), pero el auditor-web midió que, al ir recortadas con `object-fit: cover`, se ablandaban el bordado y las fachadas (0,48 píxeles de imagen por píxel de pantalla). Se dejan como estaban: primero la nitidez. Si se quiere el ahorro sin perderla, haría falta un ancho intermedio (por ejemplo 1440) en `ANCHOS_CABECERA`, y eso supone generar más archivos de imagen (queda propuesto).
- **Calendario sin saltos**: el servidor pinta los próximos actos y el mes con el mismo marcado que `site.js`, y `.cx-mes` ya no nace oculto con JS (la regla global `[hidden]` obligó a poner `!important`). CLS de 0,149 a 0.
- **`site.js`**: los formateadores `Intl` se crean una sola vez (antes, uno por fecha) y el botón de volver arriba no hace cálculos mientras no hace falta.
- **Noticias**:
  - En el móvil, la destacada lleva un degradado más opaco detrás del texto, que ya no se transparenta.
  - En PC los filtros siguen en carrusel de una fila. Primero se pasaron a varias líneas, pero el auditor-diseno dio NO APTO: la barra fija ocupaba del 31 al 43 % de la pantalla. Ahora, por el lado que siguen, el borde se desvanece y, con ratón, sale una flecha que avanza el carrusel (`site.js`, clases `is-mas-d` e `is-mas-i`). Los temas van algo más juntos y a 1440 caben enteros. La barra mide lo mismo que antes.
  - Un solo corte entre móvil y PC, en 760 px.
- **erCuñao en PC (desde 1440 px)**: se acopla a la derecha, 452 px, y la página se aparta en vez de quedar tapada. Lo de borde a borde de la portada cuenta con el ancho que queda, y la cabecera usa los escalones de pantallas medias para que el menú no pise el buscador. Volver arriba se corre a la izquierda del panel. Por debajo de 1440 sigue siendo la ventana flotante: con 1280, la página quedaría en 828 px, más estrecha que el menú. Se cierra con su botón o con Escape.
- **Juegos en PC** (punto 8): a partir de 960 px tiene un ancho de 1040, las tarjetas van en 3 columnas y las opciones en 2.
- **Botones de juegos del bot en el móvil** (punto 8): un enlace del chat a la misma página (p. ej. «El reto de hoy» estando en Juegos) cierra la hoja y el juego arranca a la vista.
- **Nazareno de la portada**: empieza a dibujarse cuando su tramo entra por la mitad de la pantalla. Al bajar rápido ya no aparece un bloque oscuro vacío.
- **Auditoría de diseño (auditor-diseno, NO APTO; arreglado)**:
  - La barra fija de Noticias (ver arriba).
  - Al abrir o cerrar erCuñao acoplado a media página, el texto saltaba (274 px en la ficha). Ahora se guarda lo primero que se ve entero bajo la barra fija más baja (la cabecera o, en Noticias, sus filtros; se mira por debajo de la propia hoja) y se corrige el scroll tras el cambio.
    - Durante el cambio se apaga el anclado de scroll del navegador (`overflow-anchor`).
    - Al cerrar, se fija lo mismo que al abrir, porque la rejilla de Noticias cambia de columnas.
    - Comprobado en la ficha y en Noticias bajando 900, 1800 y 3000 px: 0 px de salto.
  - Las flechas del carrusel miden 44 px, y el texto de las tarjetas de Juegos va arriba.
  - Con el teclado, el chip que recibe el foco se desplaza hasta verse entero, fuera del borde desvanecido y de la flecha; en PC el carrusel va sin imán (`scroll-snap`). El desvanecido es solo de PC y el móvil queda como estaba (auditor-web, NO APTO; arreglado).
  - Volver arriba queda en el hueco entre el contenido y el panel.
  - En Juegos, las tarjetas de una fila tienen el mismo alto, y la que queda sola en la última fila la ocupa entera, también en tablet.
- **Auditoría (auditor-web, NO APTO; arreglado)**:
  - erCuñao acoplado ya no es modal: `aria-modal="false"` y el Tab sale a la página.
  - Escape lo cierra aunque el foco esté en la página.
  - Cerrar y reabrir enseguida ya no deja la página bloqueada sin panel: se cancelan los temporizadores.
  - Si se estrecha la ventana con el panel abierto, pasa a flotante, y vuelve a acoplarse al ensanchar.
  - La portada ya no sobresale 8 px de la cabecera: se descuenta la barra de scroll, porque con `scrollbar-gutter` `clientWidth` no la descuenta.
  - Sin JS, los botones «Añadir al calendario» quedan ocultos sin perder su sitio (los activa `site.js` con `is-vivo`).
  - De 6f3635d, en erCuñao:
    - «¿Cuánto dura…?» contaba desde la hora del palio como si fuera la salida. Ahora cuenta desde la cruz de guía (oficial) hasta que se recoge el palio (estimación, con su fuente).
    - Si las horas del palio o del paso no cuadran con la cruz de guía (10 cofradías: el Cachorro, el Gran Poder, La Paz…), no saca duración de ellas: dice la salida oficial y que la recogida que tiene no cuadra (reauditoría; casos B8-6 y B8-7; K7 pasa a la Macarena).
    - Una fuente que no es un programa va entre comillas («según "Horarios e itinerarios…"», no «según el Horarios»).
    - Casos B8-1 a B8-5 en `probar-cunao`; el B8-5 comprueba que toda cofradía con horas del palio lleva su fuente.
- **Descartado**: `text-wrap` (no mejora lo medido) y `content-visibility` (sigue fuera por Safari).
- **Propuesto, sin hacer**: (1) partir el CSS por tipo de página, porque site.css (180 KB) y vida.css (83 KB) bloquean el pintado y cada página usa entre el 10 y el 17 %, y es lo que más pesa en el TBT que queda; (2) un «ver más» en bandas e imaginerías de las páginas de capital (menos DOM y menos miniaturas).

## 2026-11-10 · Fichas: «Pasos y cortejo» con una sola idea y hábitos con fuente oficial (punto 5 de Pablo)
Pablo, literal: «el apartado pasos y cortejo en algunas hermandades queda raro, no se sigue la misma idea y queda pobre». Muchas fichas decían solo «Trono de Cristo y trono de Virgen.».
- **La idea común:**
  - Una línea por paso (en Málaga, trono), en el orden en que salen, con una etiqueta fija: «Paso/Trono de misterio» (escena con varias figuras), «de Cristo» (un solo Cristo), «de palio» (solo si la fuente nombra el palio) o «de la Virgen».
  - En cada línea: lo que lleva el paso (el titular y las figuras que lo acompañan, con autor y año de esas figuras) y su dato propio (autor y año del trono o paso, palio, manto, portadores), según la fuente oficial.
  - Una línea «Cortejo» solo si la fuente da algo propio de la procesión.
  - Sin superlativos ni tópicos. Lo que la fuente cuenta en futuro y ya está desfasado se cuenta en pasado o no va.
- **Fuente nueva:** `tools/sources/pasos-cortejo.json`.
  - `build-data.js` la aplica sobre «paso», que se queda como texto seguido porque lo leen erCuñao y la base de datos, y guarda `paso_fuentes`.
  - `build.mjs` pinta la lista dentro de `.oc-prose`, que ya tenía estilo de lista, así que no hace falta CSS nuevo.
  - En «Fuentes y metodología», si la fuente es la misma ficha oficial se añade «; pasos y cortejo» a su línea; si no, va en una línea propia.
  - Las fichas que no están en el archivo siguen con su texto de antes.
- **Fuentes por capital:**
  - Málaga: «Sagradas Imágenes» y «Singularidad» de cada ficha de la Agrupación.
  - Sevilla: número de pasos de la nómina oficial 2026 del Consejo y detalle de la web de cada hermandad; para las Vísperas, La Voz de Sevilla 2026.
  - Cádiz, Huelva, Almería y Jaén: la ficha de cada hermandad en su Consejo o Agrupación.
  - Córdoba: el librito oficial 2026 de la Agrupación.
  - Granada: la guía oficial 2026 de la Federación.
- **Etiquetas propias:** se admiten cuando el paso no es de un titular de la lista: «Paso de la urna» (Cristo yacente en urna, solo si la fuente habla de urna), «Paso de San Juan», «Paso de la Verónica», «Paso alegórico» (la Trinidad de Sevilla) y «Cristo a hombros» (el Vía Crucis de Córdoba, que sale sin paso).
- **Excepciones con Wikipedia como fuente del detalle** (el número de pasos sale siempre de la nómina): el Amor, la Borriquita y Santa Marta de Sevilla, porque sus webs no responden; el Divino Perdón, porque no se encontró su web; y parte de las Vísperas de Sevilla. Ahí sale el aviso «Texto basado en Wikipedia».
- **Auditoría (NO APTO, 10-nov), corregido:**
  - Descendimiento de Huelva: paso de Ángel de la Feria comprado en 2000; palio desde 1976.
  - Pino Montano: palio rojo, orfebrería plateada.
  - Fuera un superlativo en el Prendimiento de Huelva.
  - Paloma y Mediadora sin dar por hecho lo que la Agrupación cuenta en futuro.
  - Dolores del Puerto con los datos de sus tronos.
  - Luz y Mar en un solo trono.
  - «Paso», no «trono», en Jaén.
  - Las líneas que solo daban el nombre del titular en Córdoba, Granada, Almería y Huelva se completan con su ficha oficial.
  - En «Fuentes y metodología» los PDF salen como «(documento PDF)», para distinguir el programa oficial de la web de la misma entidad.
- **Descartado:**
  - Repetir en «Pasos y cortejo» la música de cada paso: ya va justo debajo, en «Música», con su fuente del año. Duplicarla era justo lo que «queda raro».
  - Citar los programas de Canal Sur 2026: sus PDF dan 404 y no están archivados. Se usaron solo como pista para saber qué buscar.
  - Deducir «a costal» o «a hombros» de la capital: solo se dice si la ficha de la hermandad lo dice.
- **Cifras (barrido del 9-nov):** Hermandades enseñaba las fichas (72 en Sevilla) y Capitales la cifra oficial (71). Ahora las dos dicen lo mismo: la cifra oficial y, si no coincide, «· N fichas» (`cifraFichas` en `build.mjs`).
- **Bandas:** la línea de la ficha original sin año ni fuente sobra cuando el acompañamiento del año ya trae esa cofradía. Era el «Jueves Santo» repetido en la banda de las Cigarreras, y había otros 4 casos. La marca de banda propia pasa a la línea que se queda.

## 2026-11-09 · Esperanza de Triana: nombres de sus titulares según la hermandad
Para el vídeo de Marketing. Los titulares pasan a llamarse «Santísimo Cristo de las Tres Caídas» (antes «Nuestro Padre Jesús de las Tres Caídas») y «Nuestra Señora de la Esperanza» (antes «María Santísima de la Esperanza de Triana»), como en la web de la hermandad (esperanzadetriana.es) y en la nómina 2026 del Consejo.
- Se corrigen con `titulares_renombrar` en `fichas-correcciones.json`, con la fuente de cada uno, y en el campo «titular» de las fotos (`imagenes.json` e `imagenes-titulares.json`), que da los pies de foto y el texto alternativo del díptico. Las autorías no cambian.
- **Autoría del Cristo, según la hermandad (fuente oficial primero):** su web dice que no se sabe a ciencia cierta la autoría «por ausencia de documentación». La atribución a Marcos Cabrera viene de 1818 y otros historiadores la tienen por anónima; la hermandad la fecha entre 1608 y 1616. Se cambia el «Atribuido a Marcos Cabrera» que venía de Wikipedia por «Anónimo, entre 1608 y 1616 (atribuido tradicionalmente a Marcos Cabrera, sin base documental según la hermandad)», con la web de la hermandad como fuente.
  - En `complementos.json` hay dos campos nuevos: `texto` (la autoría tal como la da la fuente) y `vinculo` (la obra sigue en la ficha de su imaginero, como atribución y con la nota).
  - La página del imaginero ya no quita su nombre de esa nota, y erCuñao dice «obras suyas o que se le atribuyen».
  - Los juegos no preguntan por ella como obra de Marcos Cabrera.
  - La historia de la ficha (`historias.json`) sigue diciendo «entre 1608 y 1630», que es la fecha de García de la Concha, citada también por la hermandad. Es cosa de Historias.
- Auditoría (NO APTO): la página del imaginero Marcos Cabrera seguía con el nombre viejo, porque `build-data.js` arma el índice de imagineros antes de aplicar `titulares_renombrar`. Ahora el renombrado llega también a las obras del imaginero, y con eso se arregla de paso «María Santísima titular» de la Lanzada de Huelva en la ficha de Manuel Domínguez Rodríguez. También se cambia el titular en `titulares-candidatas.json`, para que no vuelva el nombre viejo si se rehacen las fotos.
- No se tocan el Nuestro Padre Jesús de las Tres Caídas de Granada (otra hermandad) ni los textos de dedicatoria de las marchas, que citan su fuente.

## 2026-11-09 · Juegos: una pista, una respuesta (aviso de Marketing en «Adivina la marcha»)
Marketing vio que la pista «Felipe Trujillo Lira, 2013» aparecía con dos dedicatorias. Las dos son correctas, según la Federación de Granada (hermandadesdegranada.com):
- «De San Matías… al cielo» está dedicada a la Paciencia y Penas, cuya sede es San Matías;
- «Rescatado en la Magdalena» está dedicada a Jesús del Rescate, en la parroquia de la Magdalena.

Al revisarlo con una prueba nueva salieron otros casos del mismo tipo.

**Elegido**
- **«Adivina la marcha» no pregunta por una pista (compositor, año y dedicatoria) que comparten dos títulos.** Había 10: Pedro Morales Muñoz en 2000 para la Misión, las dos «Lágrimas» de Bendición y Esperanza, los dos motetes de la Santa Cruz…
- **«¿Qué hermandad es?» no pregunta por una imagen que comparten dos cofradías de la misma capital.** En Sevilla, 20 dibujos de nazareno se repiten (las túnicas negras o moradas lisas). Siguen quedando 27 distinguibles en Sevilla y 16 o más en cada capital.
- **`probar-juegos.mjs` comprueba que la misma pista no lleve a dos respuestas buenas.** Se mira el enunciado con su imagen o sus pistas. En los juegos de «¿Cuál de estas…?» cuentan también las opciones.
- **«José Luís de la Torre Castellano» pasa a «José Luis»,** porque la fuente de Granada traía a la misma persona de las dos formas y salía como dos compositores. Se ha corregido en `granada-marchas.json` y en `marchas.json`, y en `unificar-marchas.mjs` (AUTOR_GRAFIA) para que no vuelva. Los otros «Luís» del catálogo no se tocan: en gallego o portugués es correcto y no sabemos cómo firma cada uno.
- **Cruz de guía y palio (Marketing, con la Esperanza de Triana):** las horas oficiales (salida y carrera) son de la cruz de guía, y las del itinerario, de su paso o de su palio. En «¿Por dónde pasa?» salía «Salida 03:07» (el palio) y en la línea de tiempo «Salida 01:19» (la cruz de guía). Ahora cada vista lo dice: el recorrido pone «Son las horas del palio: la cruz de guía sale a las 01:19 y el palio, a las 03:07», con «Salida del palio» y «Entrada del palio»; la hora añade «Esa es la hora de la cruz de guía; el palio sale a las 03:07», y la nota de la línea de tiempo dice de qué es cada hora. Tras la auditoría (que dio NO APTO a la primera versión), con dos reglas:
  1. **`rk` (de qué son las horas del itinerario) solo cuando la fuente lo distingue.**
     - En Córdoba, «cruz de guía» (la columna CRUZ DE GUÍA del PDF oficial de la Agrupación).
     - En Sevilla, Huelva y Jaén, «palio» o «paso», si la fuente trae además un tramo de la cruz de guía y ningún tramo sale antes que la cruz de guía oficial; si sale antes, la ficha está mal leída, como Santa Marta, San Buenaventura o Pasión y Muerte.
     - En Málaga, Granada, Almería y Cádiz no hay `rk`, porque su fuente no dice de qué parte del cortejo es cada hora, y la nota queda neutra.
  2. **La segunda salida (del palio o del paso) solo si cuadra:** después de la de la cruz de guía, antes de que la cruz llegue a la carrera oficial, y con su paso por la carrera al menos 10 minutos después que el de la cruz. Así se descartan los tramos del programa de Canal Sur que son de otra hermandad: el «paso» del Cachorro es el de San Buenaventura, y el de La Paz sale después de que su cruz llegue a la Campana. Cuadra en 47 cofradías, entre ellas la Esperanza de Triana y la Macarena (49 antes de que el filtro mirase también las horas «≈»: San Pablo y San Benito salen por prudencia).
- Tras la reauditoría (APTO), dos arreglos que proponía el auditor: el filtro de tramos mal leídos mira también las horas aproximadas («≈»), y con eso salen también la Vera Cruz, la Amargura, San Isidoro, Montserrat, San Pablo y San Benito; y en erCuñao, la hermandad que casa con todas las palabras de la pregunta gana a la que solo casa con parte, aunque sea por su nombre. Así, «el Cristo de las Tres Caídas de Triana» es la Esperanza de Triana y no las Tres Caídas de Huelva. Con la batería del experto (6.828 preguntas) y las 300 preguntas «de la calle», ninguna respuesta cambia de hermandad.
- **Campana 06:32 del palio de la Esperanza de Triana (aviso de Coordinación):** no es una fila corrida. En la carrera oficial la cofradía siguiente recibe la venia en cuanto pasa el último paso de la anterior, así que el palio de Triana y la cruz de guía de los Gitanos pasan por la Campana a la misma hora: las 6:32 de la nómina 2026 del Consejo, «Venia en Campana» de los Gitanos. Lo mismo pasa con el Gran Poder y la Macarena. Para que no se confunda, el recorrido dice también cuándo llega la cruz de guía a la carrera oficial (05:06).
- **erCuñao: un compositor nombrado casi entero manda sobre una hermandad que solo casa con una palabra.** Por ejemplo, «marchas de José Luis de la Torre Castellano» ya no lleva al Puerto de la Torre.

## 2026-11-09 · Hábito de la Crucifixión (Málaga), según la propia hermandad
La hermandad escribió a Pablo (captura en las notas de Coordinación) que el hábito publicado, tomado de agrupaciondecofradias.com, estaba mal. Lo correcto, en sus palabras: en las dos secciones, túnica morada, capa negra con el escudo, capirote negro y guantes negros; los hombres de trono, túnica negra con cuello y bocamangas morados y guantes negros.
**Elegido**
- Su texto literal en `habitos.json`, con fuente «la propia hermandad (comunicación a Ocho Capitales, 9-nov-2026)» y enlace a crucifixion.es. Para esto se añade a `habitos.json` un campo opcional, `fuente_nombre`, que la ficha enseña antes del dominio.
- Una sola figura, «Ambas secciones», con túnica, capa y capirote.
- Los guantes y la ropa de los hombres de trono van solo en el texto, porque la figura no tiene esas prendas.
- `colores-habito.json`: solo cambia la fuente de esta hermandad; el color sigue siendo morado y negro.

**Descartado**
- Regenerar `colores-habito.json` entero con `tools/colores-habito.mjs`: el archivo estaba atrasado y habría metido de paso unas 30 hermandades de otras capitales que no son de esta corrección.

## 2026-11-09 · erCuñao, bloque 6: preguntas con erratas o en andaluz, y menos peso en cada página
**Elegido**
- **Fonética andaluza al comparar** (seseo y ceceo, yeísmo, la h muda): «plasa paliyero» casa con Plaza Palillero y «no me yores» con «No me llores, Soledad». Se compara la escritura tal cual **y** la fonética, y vale la más parecida: una errata como «traicóin» no se parece a «traisión» en fonética, pero sí a «traición» escrita.
- **El título de una marcha va tras la última palabra clave** («de quién es la marcha X» → X). Antes se tomaba la primera («quién es») y el título incluía «marcha», así que fallaban las erratas y hasta el título bien escrito decía «la más parecida».
- **Un lugar repetido en el itinerario con otra grafía** («San Miguel» y «P. SAN MIGUEL») da las dos horas.
- **«Por la tarde» no es un lugar**, y con una hermandad en la conversación «¿y por dónde pasa por la tarde?» es su recorrido, no la lista de la tarde.
- **Pasada de 300 preguntas «de la calle»** (escritas por un agente aparte, sin ver el código: móvil, andaluz, erratas, charla y fuera de tema). Las respuestas flojas bajaron de 40 a 27 y los «no lo sé», de 16 a 4. Lo que se añadió:
  - un **vocabulario cofrade** de 30 términos (levantá, costalero, capataz, saeta, palio, trono, carrera oficial, Madrugá, mantilla, agrupación musical…). Se mira el texto tal como lo escribe la persona, porque el corrector de erratas cambiaba «saeta» por «santa» y «tren» por «tres»;
  - respuestas para **lo que no es de cofradías** (comer, dormir, llegar, fútbol, chistes), para «¿de dónde eres?», las quejas y los consejos;
  - **las hermandades de un barrio**, por el barrio que apunta su sede o por su nombre (Triana, El Perchel, el Albaicín);
  - **la más antigua de las ocho capitales**;
  - el **total de una jornada** repartido por capitales;
  - **imagineros sin ficha** (Martínez Montañés, la Roldana), con la autoría de los titulares tal como viene;
  - **«marcha X de quién es»**, con el título delante;
  - y dos confusiones: «x q hora» se tomaba por un lugar y «Santo Domingo» por el Domingo de Ramos.
- **Juegos, «¿Qué hermandad es?»: ninguna opción mala de la misma cofradía.** La Humillación es de la Piedad (Cádiz); el Dulce Nombre, la Cañilla y la Soledad (Humildad) son una sola cofradía (Granada); también Amor y Borriquita, las Fusionadas, Columna y Resurrección (Cádiz) y la Vera Cruz de Jaén. Se agrupan en el build por el nombre oficial sin el paréntesis final, la web propia, un titular igual en la misma sede o una «(sección de …)»; `probar-juegos.mjs` lo comprueba por su cuenta y con el código anterior encontraba 7 preguntas con dos respuestas buenas.
- **La miniatura, la línea de tiempo y «Compartir» van en `assets/cunao-pinta.js`**, que se pide con el motor al acercarse al botón. `cunao-ui.js`, que va en todas las páginas, baja de 11,5 a 7,5 KB comprimido. Si el archivo nuevo no llega, erCuñao contesta igual, sin esos tres extras.

**Descartado**
- **Perseguir las 10 dudosas de Huelva de la batería del experto:** vienen de itinerarios con columnas mezcladas («Templo Plaza San Cristo de la Pedro Sangre»). Se arreglan en los datos, que ya están pendientes en el equipo de rutas.
- **Meter el código de pintar en `cunao.js`:** el motor se prueba en Node sin navegador y debe seguir siendo puro.

## 2026-11-08 · Plano: reproducir/pausar en el iPhone y fondo hasta todas las sedes (sesión «En la calle»)
**Reproducir y pausar.** Pablo: «el botón de play solo inicia pero no pausa». En el iPhone, Safari no envía el «click» si la página cambia bajo el dedo, y el plano reconstruía la lista (con fotos) en cada fotograma. **Elegido:** el botón responde a `pointerup` (el click de detrás se ignora, salvo el de teclado) y en cada fotograma solo se toca lo que cambia (lista con una fila por hermandad, ficha con firma, cortejo reutilizado). **Descartado:** `touchend` con `preventDefault` (rompe el desplazamiento y la accesibilidad) y bajar la frecuencia de repintado (el cortejo daría tirones).
**Recorrido de la extraordinaria siempre visible:** se probó y se quitó. Pablo dice que la línea dorada «va bien» al reproducir.
**Fondo del plano de sedes.** Pablo: «hay hermandades fuera del mapa… al quitar el zoom se ven zonas vacías en morado». **Elegido:** `tools/plano/afueras.mjs` amplía el fondo desde el mismo pbf hasta cubrir lo que enseña la cámara al encuadrar todas las sedes en el móvil y en el ordenador; fuera del centro, solo carreteras principales y costa (de 16 a 138 KB por capital). La cámara no sale del fondo y al abrir se ven todas las sedes. Las calles menores del centro se desvanecen en el borde de su recuadro (el 15 % del lado, 700 m como poco) para que no se vea con bordes rectos, y alejar tiene tope: 1,6 veces el encuadre de todas las sedes. **Descartado:** volver a generar el fondo completo con todas las calles hasta las afueras (pesaría varias veces más y es el terreno de las herramientas de rutas) y un degradado sin más, sin fondo de afueras (se vería morado vacío alrededor). Cuando lleguen sedes nuevas fuera del fondo, `build.mjs` avisa y se vuelve a ejecutar `node tools/plano/afueras.mjs <ciudad>`.

## 2026-11-08 · erCuñao, bloque 5: las seis mejoras que eligió Pablo («Me gusta la 1 2 4 6 7 8»)
**Elegido**
- **El recorrido en miniatura** (`data/cunao/g/<capital>.json`, que se pide solo al preguntar por un recorrido): la ida y el regreso simplificados (Douglas-Peucker), con las mismas coordenadas que el plano, y de fondo las calles principales y el río de esa zona. Se pinta en SVG, sin cargar el plano. «Síguela en el plano» abre `/en-la-calle/<capital>/?dia=…&h=<hermandad>`.
- **La salida en una línea de tiempo:** salida, carrera oficial, Catedral (si el itinerario la trae aparte) y entrada, con horas del mismo programa. Si un momento falta, no se pinta. Si las horas no van en orden, no se pinta la línea.
- **Gestos de erCuñao:** su mismo dibujo con dos variantes fijas. Cuando lo sabe, se baja las gafas; cuando no, levanta las cejas y se rasca la cabeza, una sola vez. Sin bucles, y con movimiento reducido no se mueve.
- **Compartir:** una tarjeta de 1080×1080 hecha en el navegador (canvas) con la estrella, «ochocapitales», la pregunta, la respuesta corta y su miniatura, más el enlace a la ficha. En el móvil se comparte con el menú del sistema; si no lo hay, con el enlace de WhatsApp. No lleva datos personales ni pasa por ningún servidor.
- **Preguntas según la página:** en la ficha, sobre su hermandad. En el plano y en la capital, «¿Dónde van ahora?» (solo en plena jornada) y «¿Qué sale hoy?». En Noticias, «¿Qué ha pasado hoy?» con lo último de las ocho capitales. En una banda, a quién acompaña. En una marcha, quién la compuso.
- **«¿Dónde van ahora?»** sale del itinerario: dice entre qué dos puntos va cada cofradía a esa hora y avisa de que la posición es estimada.
- **La cabecera se encoge** al bajar por una respuesta larga y vuelve al subir. Tiene histéresis para no rebotar.
- **Datos que no tiene, dichos:** el capataz (y cargos parecidos) y el tiempo. Para el tiempo remite a la AEMET.

**Descartado**
- **Cargar el plano entero (`data/calle`) para la miniatura:** pesa hasta 600 KB por capital.
- **Una imagen generada en un servidor para compartir:** el sitio es estático y la tarjeta se puede hacer en el propio móvil.

## 2026-11-08 · erCuñao «experto en todo» y juegos «mientras esperas» (sesión erCuñao, plan del domingo al martes)
Pablo (6 y 8-nov): «tiene que ser el mejor en todo, experto en todo» y «la mejora y perfección del bot, tanto en funciones como en visualización, además de meterle los juegos de espera».

**Elegido**
- **Sigue sin IA (opción 1).** La opción 2 (Workers AI) se deja para después del lanzamiento, porque no estaría terminada y auditada el lunes.
- **El bot se prueba con una batería generada desde los datos** (`site/scripts/bateria-experto.mjs`), no solo con preguntas escritas a mano. Saca miles de preguntas de todos los tipos y escribe cada una de cinco formas: normal, sin tildes, en andaluz, con erratas y como en el móvil. Las que fallan pasan a una revisión independiente. La batería fija (`probar-cunao.mjs`) es la que va en la red de seguridad.
- **Habla andaluza:**
  - un diccionario corto, solo con palabras que no admiten otra lectura: «ande», «ar», «er», «q», «kien», «izo»…;
  - variantes de pronunciación (seseo, ceceo, yeísmo, b/v, h, «-ao») que solo se aplican a las palabras desconocidas;
  - las calles se toman del texto sin corregir, porque no están en el vocabulario.
- **Artículo y concordancia** con cada nombre de hermandad: «del Cautivo», «de San Bernardo», «los Gitanos salen».
- **Cifra de hermandades:** la oficial de cada capital (`capitales[].cifra`), no el número de fichas.
- **«¿Qué sale hoy?» fuera de Semana Santa:**
  - responde con las extraordinarias que tienen itinerario y con 21 días de agenda;
  - la agenda solo admite actos verificados o de agendas cofrades, nunca titulares de prensa;
  - más allá de esos 21 días, dice que aún no tiene la agenda.
- **El bot no frena la web:** en cada página solo va la interfaz (`cunao-ui.js`, unos 11 KB). El motor y los datos se piden al acercar el dedo al botón o al abrirlo.
- **Juegos** (`/juegos/`, `assets/juegos.js`, `data/juegos.json`):
  - todas las preguntas se generan con los datos de las fichas, con semilla: el reto diario es el mismo para todos sin servidor y «Reta a un amigo» comparte la semilla por WhatsApp;
  - la racha se guarda solo en el móvil;
  - `probar-juegos.mjs` comprueba contra portal.json, por su cuenta, que cada pregunta tiene una sola respuesta buena y que es cierta;
  - en «por el nazareno», las otras opciones también tienen su hábito conocido y distinto;
  - en «por el recorrido», la forma del itinerario con la salida y la carrera oficial;
  - las fotos llevan su crédito después de responder.
- **Personaje:** erCuñao es el único protagonista. Presenta los juegos y los propone en plena jornada o cuando hay una salida ese día.

**Descartado**
- **Copiar los juegos de la competencia** (nombres, escudos, «impostor»): ni sus nombres ni sus dibujos, y nada de escudos, que tienen derechos.
- **Ranking en línea, cuentas o duelos con servidor:** piden datos personales y un servidor. Se usan la semilla y el enlace.
- **Adivinar la marcha por el audio:** los derechos son de las bandas.
- **Precargar el motor de erCuñao en todas las páginas:** eran 120 KB de JavaScript sin usar en cada visita.

## 2026-10-27 · Noticias: qué entra y cómo se presenta (oc-diseno, por orden de Pablo)
Pablo: «hay noticias que no son del ecosistema cofrade, hay que perfeccionar qué tipo de info se mete y cómo acogerla».

**Elegido.** Un solo criterio en `site/filtro-noticias.mjs`. Se aplica al leer las noticias (`fetch-news.mjs`) y al compilar (`build.mjs`, también sobre el archivo ya guardado, sin tocar `data/news.json`). Las dudosas, fuera.
1. **Webs oficiales** de hermandades, agrupaciones, consejos y federaciones: siempre dentro, salvo avisos de lotería y entradas vacías.
2. **Medios cofrades** (Mundo Cofrade, Gente de Paz, El Pespunte, ArteSacro, Kerygma…): siempre son cofrades, pero tienen que ser de una de las ocho capitales.
3. **Diócesis:** solo si hablan de cofradías.
4. **Prensa generalista y Google Noticias.** Tienen que cumplir las tres condiciones:
   - **vocabulario cofrade claro:** palabras propias, días de la Semana Santa, una advocación o el nombre de una hermandad;
   - **que sea de una de las ocho capitales:** por su nombre (no cuentan «Vélez-Málaga», «provincia de…» ni «un pueblo de…»), por la hermandad o por el canal de la capital; lo de toda Andalucía también vale;
   - **nunca política, sucesos, deporte, toros, ferias ni comercio**, aunque nombren de pasada a una hermandad.
5. **Otro pueblo o ciudad** (Jerez, Osuna, Antequera, Cartagena…) sin nombrar una capital: fuera.
6. **Temas:** salidas, cultos y traslados, coronaciones, música, patrimonio y estrenos, cabildos y cargos, pregones y carteles, agenda. Hay una fila de filtros por tema, cada noticia lleva su etiqueta y la destacada prefiere un tema importante (coronación, salida, pregón, estreno).

**Medido sobre el archivo del 26-oct (2.396 noticias):** entran 1.682 y salen 714.
- **Por qué salen:**
  - 271 son de otro pueblo o ciudad, y otras 86 lo mismo pero de medios cofrades;
  - 203 no tienen vocabulario cofrade;
  - 91 no son de ninguna capital;
  - 39 tratan de un tema ajeno;
  - 20 son avisos o páginas que no son noticias.
- **Muestras al azar, revisadas a mano:**
  - de 60 que entran, ninguna es ajena al mundo cofrade;
  - de 60 que salen, 2 cofrades de capital se perdían por fallos de las listas, ya corregidos («el Puerto» de la Torre, «archicofradía»).
- **Lo que se queda fuera a sabiendas** (por la regla de «las dudosas, fuera»): noticias cofrades de capital que no dicen de qué ciudad son y cuya hermandad tiene el mismo nombre en varias capitales. Por ejemplo, «El Santo Entierro volverá por el Postigo», o los temas de toda España como la SGAE sin mencionar Andalucía.
- Comprobación: `node site/filtro-noticias.mjs [--fuera|--dentro]`.

**Descartado:**
- «ante la duda, se queda» (el criterio del 26-oct): dejaba dentro el rugby del alcalde de Cádiz, el PP, accidentes y pueblos;
- asignar la capital por el medio (por ejemplo, Diario de Sevilla = Sevilla): metía los pueblos de la provincia.

## 2026-10-26 · Fondo del plano fiel a la ciudad (Málaga, Córdoba y Cádiz)
Pablo: «completar Málaga, Cádiz y Córdoba… con su mapa mejorado y fiel». Los recorridos ya se trazan sobre la red completa de OSM (GraphHopper), pero el fondo eran calles simplificadas: un recorrido por un callejón o una plaza que el fondo no dibujaba parecía cruzar manzanas.
- **Datos: el mismo extracto que los recorridos.** `tools/itinerarios/fondo-pbf.mjs` lee `C:\Users\pablo\Herramientas-IA\graphhopper\andalucia-latest.osm.pbf` (Geofabrik, 26-oct), el mismo con el que GraphHopper traza los recorridos. Así fondo y recorridos coinciden al metro.
  - Lo lee un lector propio, sin dependencias y sin modificar el archivo: lo usa el servidor de GraphHopper.
  - Da el mismo formato que antes en `cache/` (fuera de git).
  - Las descargas de Overpass (`fondo-osm.mjs`, primera versión) quedan como `cache/overpass-*.json`. No se usan: el `.pbf` tiene todas las capas.
- **Primera versión (descartada):** `tools/itinerarios/fondo-osm.mjs <ciudad>` descargaba de Overpass (OSM, ODbL, con permiso de Pablo):
  - en el recuadro de los recorridos: todas las vías (también peatonales, escaleras y callejones), plazas, agua, ríos, costa, playas, parques, templos y casas hermandad;
  - aparte, los edificios a 40 m de algún recorrido.
- **Fondo:** `plano.mjs` suma esas vías (los callejones conservan sus quiebros, con una tolerancia de 1,5 m) y añade las capas.
  - Debajo de las calles: agua y ríos (Guadalquivir y Guadalmedina), costa, playas, parques y plazas como superficie.
  - Encima: templos y casas hermandad como edificios, con galón de oro.
  - Fuera los jardincillos y las plazoletas diminutas (no ayudan a situarse y pesaban).
  - Lo dibujan «En la calle» (`calle.js`) y el plano de la portada (`plano.js`).
- **Peso con gzip:** Málaga 201 KB, Córdoba 277 KB y Cádiz 70 KB. El service worker los guarda tras la primera visita.
- **Comprobación de fidelidad** (`tools/itinerarios/comprobar-fondo.mjs <ciudad>` → `comprobacion-fondo-<ciudad>.json`): recorre cada recorrido cada 3 m y avisa en dos casos:
  - el tramo atraviesa un edificio sin vía por dentro;
  - el tramo pasa a más de 12 m de cualquier vía o plaza.
  - Templos, soportales, arcos con paso (la Puerta de Tierra) y la salida y la entrada no cuentan.
  - **Resultado:**
    - Córdoba: 42 de 42 recorridos limpios.
    - Málaga: 45 de 46 (un aviso en la plaza de Spínola).
    - Cádiz: 4 de 33. **Un mismo tramo de la calle Nueva, compartido por 29 recorridos, cruza en diagonal entre manzanas**: es un fallo del trazado, no del fondo, y se pasa a la sesión de rutas de Cádiz con las coordenadas del informe.

## 2026-10-26 · Recorridos con el color del hábito de su hermandad
Pablo: «que las rutas se asemejaran al color habitual de su hermandad, sin perder la línea de diseño».
- **De dónde sale el color:** `tools/colores-habito.mjs` lee el texto de `tools/sources/habitos.json`, donde cada hermandad tiene su fuente oficial, y escribe `site/data/colores-habito.json` con el color, su nombre y la fuente. Nada se escribe a mano en el código.
  - Manda el color del capirote; si es blanco o negro, el de la túnica; si los dos son neutros, ese neutro. Los botones o el cíngulo no cuentan (antes Salutación salía morada por sus botones).
  - «Color vino» cuenta como burdeos.
- **Cobertura: 99 de 232 hermandades.** Las otras 133 tienen el texto del hábito vacío, y Sevilla no está en el archivo. Esas conservan el color de la paleta: no se inventa. Pendiente: buscar sus hábitos en webs oficiales o en la guía de cada capital, con la fuente, y volver a ejecutar la herramienta.
- **Gama común:** cada color del hábito se traduce a un tono parecido en luz y saturación, que convive con el terciopelo y el oro. Por ejemplo:
  - morado #b78ee3, burdeos #d4677f, rojo #e8735a, azul #6f9de8, verde #62c08a;
  - el negro pasa a pizarra (#a9a3ba) y el blanco a marfil (#efe4c8).
  - Todos los tonos contrastan al menos 5,3:1 con el fondo del plano.
  - Si dos hermandades de la misma jornada caen en el mismo tono (muchas son moradas o negras), las siguientes se separan en luz y en algo de tono (`variar()` en `calle.js` y en `plano.js`).
- **Igual que antes:** ida continua y regreso discontinuo.
- **En la ficha de «En la calle»** hay una muestra del color con su nombre y la fuente, por ejemplo «su hábito, burdeos (fuente)».
- También se usa en el plano de la portada.

## 2026-10-26 · Laboratorio de rutas: continuidad + GraphHopper (propuesta, sin adoptar)
_Detalle y cifras en `LABORATORIO-RUTAS.md`. Pablo decide si se adopta._

**Elegido para el laboratorio**
- **GraphHopper 11.1 en local, sin Docker** (`C:\Users\pablo\Herramientas-IA\graphhopper\`), con un solo grafo de Andalucía (Geofabrik) para las 8 capitales. Sin CH ni LM, porque las rutas son cortas y así funcionan `pass_through` y los ajustes por petición.
- **Perfil «procesión»:** autovías y vías rápidas fuera; escaleras casi prohibidas (un trono no baja escaleras).
- **Emparejamiento por continuidad (Viterbi):** las candidatas por nombre aproximado se agrupan en piezas conexas, y se elige la cadena en la que cada calle toca a la siguiente. Los huecos cuestan caro; una homónima lejana se descarta con aviso.
- **Enlace recto anotado (3-40 m)** donde OSM no une dos calles seguidas de la lista. Es la misma idea que el método actual (≤ 35 m), pero visible en el informe.
- **Nominatim solo como referencia** de plazas sin calle en OSM: es aproximado y no obliga al trazado.
- **Correcciones de Pablo** en `tools/itinerarios/laboratorio/correcciones-malaga.json`, con fuente obligatoria. El proceso las respeta al regenerar.
- **Editor local** con servidor Node y plano SVG propio. No se publica.
- **Evaluador común** que compara nombres de forma exacta, para no favorecer al método nuevo.

**Descartado**
- **Docker:** no hace falta, porque ya hay Java 21.
- **Leaflet o teselas para el editor:** se mantiene la decisión del 17-oct de plano propio también en la herramienta interna.
- **Puntos de Nominatim como paso obligatorio:** producían picos de ida y vuelta.
- **Dejar `pass_through` siempre activo:** en las medias vueltas reales (calle · plaza · misma calle) GraphHopper daba un rodeo. Ahí se parte la petición para dejar girar.

## 2026-10-25 · Marchas: modelo único y verificación de dedicatorias (sesión de marchas)
**Elegido**
- **Un solo modelo** (`tools/sources/marchas.json`, generado por `tools/unificar-marchas.mjs`): cada marcha con título, compositor, año, formación, vídeo, dedicatoria (hermandad, titular, ciudad, texto) y, **por campo**, las fuentes que lo dan con su URL. `build.mjs` y la base SQLite solo leen ese fichero; las marchas de cada hermandad ya no salen de `portal.json`.
- **Estados de la dedicatoria:** «contrastada» (dos fuentes fiables de sitios distintos), «dedicada» (una fiable) y «sin verificar» (solo el foro de 2008 o Wikipedia). Fiables: ficha oficial de la Federación de Granada, Patrimonio Musical (base de datos), la ficha de Marchas de Procesión (campo DEDICATORIA) y la revisión a mano con fuente abierta (`tools/sources/marchas-revision.json`). Wikipedia queda como pista, según `ORDENES-CORRECCION.md`.
- **Se retira el enlace** marcha → hermandad cuando una fuente fiable la dedica a otra hermandad u otra ciudad y nada fiable la confirma (con motivo y enlace en `retiradas`). Si la fuente fiable nombra otra hermandad del portal, la marcha pasa a esa hermandad (p. ej. «Lágrimas y Favores» estaba en Fusionadas por el foro; Patrimonio Musical la dedica a Lágrimas y Favores).
- **Marchas del catálogo ligadas por su dedicatoria** (de 88 a 209 hermandades): solo si la dedicatoria nombra la capital (o Patrimonio Musical la sitúa allí), ningún otro municipio, y una sola hermandad del portal por su nombre («Hdad. de la Carretería») o por una frase de titular específica. Una advocación de una sola palabra corriente (Mercedes, Rosario, Ángeles, Esperanza…) no basta: puede ser una hermandad de gloria que no está en el portal. Una dedicatoria a la Virgen solo casa con un titular mariano (la «Virgen del Buen Fin» es de la Lanzada, no del Cristo del Buen Fin). «En memoria de…» no cuenta como dedicatoria a la hermandad.
- **Mismo compositor:** un apellido poco corriente en común, dos apellidos, o un apellido corriente más el mismo nombre de pila. Con «un apellido cualquiera» «La Soledad» de Eloy García López casaba con siete fichas distintas.
- **Año que no coincide** (respuesta de Pablo: «solo la oficial»): manda la fuente oficial; sin ella, el de las fuentes fiables si coinciden (Wikipedia y el foro no cuentan); si dos fiables discrepan, el año queda en blanco. La discrepancia se guarda en el modelo, no se enseña.
- **Vídeos borrados de YouTube** se marcan al importar (`caido`) y la web no los enlaza. Antes el importador los confundía con el límite 429 y se paraba.
- **Direcciones:** se repite el cálculo antiguo de los slugs para que ninguna URL publicada cambie; las de duplicados que ahora se unen redirigen (las 7.659 del sitemap, comprobadas).
- **Buscador:** las marchas salen de `search-index.json` (2,19 MB → 0,43 MB) a `search-marchas.json`, que se pide al escribir 3 letras.
- **Patrimonio Musical** sigue siendo de uso interno: se guarda solo el enlace a cada ficha, no sus textos.

- **(2026-10-26) Mismo compositor, más estricto:** si cada nombre tiene un apellido que el otro no tiene, o los nombres de pila completos son distintos, son personas distintas («Manuel López Farfán» ≠ «Manuel Miguel López Martínez»; Perfecto Artola Prats ≠ su hijo Desiderio Artola Tena). Una errata de una letra en un apellido largo no separa (Albero/Abero).
- **(2026-10-26) La misma obra en dos fichas** (tras corregir un título con su fuente) se une: título casi literal, mismo compositor, formación compatible y sin dos dedicatorias distintas. La dirección de la que desaparece redirige.
- **(2026-10-26) Revisión a mano** (`tools/sources/marchas-revision.json`): verificadores con cita literal guardada en local y revisión mía de cada veredicto. No se aplicó lo que la fuente no dice expresamente («inspirada en» no es «dedicada a») ni lo que podría ser otra obra con el mismo nombre. Un sitio web cuenta una sola vez: una revisión hecha con la ficha de Patrimonio Musical no convierte en «contrastada» una marcha que ya tenía Patrimonio Musical.
- **(2026-10-26) Años:** además de la fuente oficial, se acepta el año de una fuente fiable cuando una grabación fechada hace imposible el otro (p. ej. 1982 frente a 1985).
- **BNE:** se lee entero el tema «Marchas procesionales» (1.643 registros; Pablo autorizó el 2026-10-26 leerlo imitando a Chrome, a ritmo lento). Solo cuentan las **partituras** (música impresa o manuscrita, 312) y el compositor sale del autor del registro: el resto son discos y recopilaciones, cuyo subtítulo o banda se colaba como compositor.
- **(2026-10-26) Fuente que solo desambigua** (`solo_desambigua` en la revisión): cuando la dedicatoria la da una base fiable («Virgen de la Amargura de Jaén») y un blog cofrade la pone en la lista de una cofradía, el blog solo sirve para elegir la hermandad; no suma como segunda fuente. La ficha lo enseña en «Hermandad».
- **(2026-10-26) Advocaciones marianas de gloria** (Candelaria, Paz, Estrella, Caridad, Merced…): no se ligan solo porque la guía oficial de Semana Santa tenga una sola hermandad con ellas (esas guías no incluyen las de gloria). Sí las de Pasión (Amargura, Angustias, un Cristo).
- **(2026-10-26) Dudosas de Sevilla, Málaga y Granada:** solo se ligan cuando la fuente nombra la hermandad (el campo «Dedicatoria Hdad.» de las fichas de Patrimonio Musical, la web de la hermandad o la Federación). Si solo nombra un titular, aunque sea único entre las candidatas, no se liga: en estas ciudades hay muchas glorias y parroquias con las mismas advocaciones. Excepción razonada: «Esperanza Coronada de Málaga» o el XXV aniversario de su coronación solo puede ser la Esperanza del Perchel.
- **(2026-10-27) Sin duplicados** (Pablo: «No pueden haber marchas ni dedicatorias duplicadas»): una obra = una ficha. Misma obra = mismo título y mismo compositor aunque esté escrito de otra forma («Vicente Micó» = «José Vicente Micó Álvarez»; varios autores en otro orden), con formación igual o sin indicar; dos nombres de pila sin ninguno en común son personas distintas (Perfecto y Desiderio Artola). Las versiones para otra formación quedan en fichas aparte y se distinguen por la formación. El comprobador falla si encuentra una duplicada o una dedicatoria repetida en una hermandad. Las «3 marchas iguales» que vio Pablo en el filtro de /marchas/ eran otra cosa: el resto de la lista se pedía una vez por tecla y se añadía varias veces (arreglado en `site.js`).
- **(2026-10-27) Partituras de la banda** (Pablo: «eso se quita, no se suben partituras a la página ni app»): no se nombran en la web. Como todo dato debe tener una fuente que se pueda abrir, no se publican las marchas cuya única fuente es la partitura (17), ni el año o la dedicatoria que solo da la partitura. Sí se muestra el repertorio (qué marchas toca la banda del Paso y la Esperanza). Los datos completos siguen en `tools/sources/repertorio-paso-esperanza.json`.
- **(2026-11-02) Orden de paso = orden de carrera oficial** (coordinación: en la página Hoy el orden no casaba con las horas): se toma de `tools/sources/orden-paso.json`, de la nómina oficial de cada capital, con hora de salida y hora de carrera. El orden oficial cambia de un año a otro y **no** tiene por qué ir con la hora de salida: en la Madrugá de Sevilla el orden estaba bien y las salidas parecen desordenadas (La Macarena sale antes que El Silencio y pasa después). Por eso el comprobador compara con la hora de carrera (error) y solo avisa con la de salida. En vísperas no hay carrera oficial: por hora de salida. Descartado: ordenar todo por hora de salida, que daría un orden que no es el oficial.
- **(2026-10-27) Correcciones de ficha con fuente** (inventario H1, H6 y fechas en conflicto): van en `tools/sources/fichas-correcciones.json` (slug → campo → valor y fuente), que manda sobre la ficha original y no se pierde al regenerar. Ante dos fechas, la de la web oficial de la hermandad; si no la hay, la de su agrupación o consejo; Wikipedia solo como pista. Un año sin fuente se cambia por el que dé la fuente, o se quita. La ficha enseña la fuente de cada campo corregido o rellenado, no solo la general.
- **(2026-10-27) Imagineros, solo con fuente** (inventario I1-I5): las biografías escritas a mano en `tools/build-data.js` (IMAG_INFO) se rehicieron con sus fuentes (Wikipedia, IAPH, UNIA, EcuRed…; la RAH no se dejó leer) y la ficha las cita todas. Sin fuente no hay biografía: fuera Luisa Roldán y Alonso Cano, que no tenían. Las valoraciones sin fuente («el más influyente», «obra cumbre») se quitan. No es una persona, y no tiene ficha de imaginero: dos autores posibles («X o Y»), un solo nombre suelto o «grupo valenciano». Las direcciones que desaparecen redirigen (`tools/sources/imagineros-redirecciones.json`).
- **(2026-10-27) Marchas recién estrenadas por la banda sin fuente en internet** (Pablo: «Sin enlace»; «para marchas así indicar que pronto aparecerá enlace»): excepción a «toda fuente se puede abrir», solo para las marcadas con `publicar` en `tools/sources/repertorio-*.json`. Su fuente es la banda que la estrenó (`banda`, sin enlace), y la ficha dice «(pronto aparecerá el enlace)». La primera: «El pan de nuestra vida (Fénix)», de Alfonso López Cortés, dedicada a Jesús de la Pasión de Málaga. Las demás marchas que solo están en las partituras siguen sin publicarse.
- **(2026-10-27) Una fuente nueva suma, nunca quita** (orden del bloque 9): las dedicatorias de cofradiasyhermandades.es (campo «Marcha dedicada a» de cada ficha, fiable) se añaden a las que ya había. Un enlace publicado no se pierde al regenerar: si el cruce lo deja sin ligar, se repone con sus fuentes. Si la dedicatoria nueva choca con una que ya tiene fuente, se queda la de la fuente más fiable (oficial antes que el resto) y la otra se anota como discrepancia, sin borrar nada. Solo entran marchas nuevas de esa web si su ficha las dedica a una hermandad del portal; no se copian sus textos, solo los datos con enlace a la ficha. Una marcha que ya existe con el compositor escrito de otra forma se une a la existente (apellido corriente: tienen que compartir también un nombre de pila, «David Álvarez» = «Francisco David Álvarez Barroso»). Descartado: rehacer las dedicatorias solo con la fuente nueva (se perdían 56 enlaces publicados, sobre todo de La Estrella de Sevilla).
- **(2026-10-27) Lugares que no lo son:** «María» (municipio de Almería) no se toma nunca por lugar: es «María Santísima». Si la dedicatoria nombra otro templo o un barrio que no es de la hermandad («de Bellavista», «iglesia de San Buenaventura»), no se liga.
- **(2026-10-26) Direcciones retiradas:** el modelo acumula en `redirecciones` toda dirección publicada que deja de existir; `build.mjs` la redirige a la misma obra o al listado.

**Descartado**
- Ligar por coincidencia de una palabra de titular («Esperanza», «Dolores»): ligaba marchas a la hermandad equivocada de la misma ciudad.
- Contar foro + base de Patrimonio Musical como «contrastada»: son el mismo sitio, así que cuenta como una sola fuente fiable.
- Añadir al portal las marchas que solo están en Patrimonio Musical: se usan para verificar y ligar, no se publican sus fichas.
## 2026-10-26 · Animaciones del mapa de la portada y dos variantes con más detalle
**Animaciones** (revisadas fotograma a fotograma y midiendo cuánto dura cada fotograma con Playwright):
- **Fallo que ya estaba en la web publicada:** el muelle que mece las banderas se volvía inestable con fotogramas lentos (un móvil cargado, menos de 30 por segundo). La escala se disparaba (1,69 → −0,26 → 2,98) y la bandera temblaba sin parar.
  - Ahora el muelle se calcula en pasos fijos de 8 ms y es estable a cualquier velocidad: tras pulsar va de 0,975 a 1 sin rebote.
- **Tirones al bajar a la ciudad y al mover la hora**, porque se repintaban miles de calles en cada fotograma:
  - el plano va en dos capas: la fija (calles y recorridos) y la que se mueve (cortejos y medallones);
  - fuera los filtros SVG: las sombras y el brillo se dibujan con trazos y círculos;
  - durante el vuelo de la cámara solo se dibujan las calles principales.
  - Resultado al mover la hora en Sevilla, en un navegador sin aceleración gráfica: de 29 a 71 fotogramas en el móvil y de 23 a 59 en el escritorio.
- **Orden:** primero el hilo llega a la capital (360 ms), luego Andalucía se acerca (820 ms) y el plano aparece hacia los 700 ms. La altura crece en 420 ms: es la única animación de una propiedad de maquetación, y se queda porque solo ocurre al bajar o subir y oculta el salto de la página.

**Elegido: «Bordado»** (Pablo, 26-oct), con sus tres cambios:
- **El cordón del borde, más fino** (3 px de hilo oscuro y 1,3 px de oro a puntadas): grueso saturaba el mapa.
- **En lugar del emblema, la catedral de cada ciudad bordada a puntadas.** La propuso Pablo. Son dibujos propios y esquemáticos: la Giralda con la nave, la Manquita con su torre sin acabar, la fachada de los tres arcos de Granada, la Mezquita-Catedral con el alminar, la cúpula de Cádiz entre dos torres, la Merced de Huelva, la catedral-fortaleza de Almería con almenas y la fachada renacentista de Jaén.
  - Cada catedral va junto a su punto, en el lado contrario a su nombre: si el nombre va debajo, la catedral va encima, y en Córdoba, que lleva el nombre encima, debajo.
  - En el móvil son algo más grandes.
- **Puntos pequeños**, como un nudo de oro (10 px; 7 px en el móvil). La zona para tocarlos sigue siendo de 44 px.
- Se quitaron el azulejo, los cirios y el interruptor `?mapa=`.

Las tres propuestas que se presentaron (ya retiradas, salvo el Bordado): **Mapa con carácter: tres diseños nuevos para que elija Pablo** (`?mapa=bordado`, `?mapa=azulejo` y `?mapa=cirios`). Pablo descartó «grabado» y «relieve» porque los veía «muy simples, sin gracia». Los nuevos salen del mundo cofrade y andaluz:
- **Bordado:**
  - cada provincia es un repostero de terciopelo, con su pelo;
  - el contorno lleva un cordón de oro torcido;
  - el emblema de su capital va bordado a puntadas en el centro (palio, campana, Alhambra, arcos de la Mezquita, horquilla, cinta, Alcazaba, cruz). Son dibujos propios, sin derechos de terceros;
  - los ríos son hilo de oro.
- **Azulejo:**
  - cada provincia alicatada con estrellas de ocho puntas en el color de su capital (es la estrella del sello del portal), con cuartos de rueda en cobalto y llagas de cal;
  - el nombre de cada capital va en una placa de azulejo, como los rótulos de las calles;
  - los ríos, en cobalto vidriado.
- **Cirios:**
  - Andalucía de noche, con cada capital encendida por un cirio de luz cálida;
  - la luz es fija, sin parpadeo (DESIGN.md: nada se mueve en bucle);
  - los ríos son hilos de plata.

Variantes anteriores (descartadas): **Mapa con más detalle: dos variantes para que elija Pablo.** Se ven en la portada con `?mapa=grabado` o `?mapa=relieve`; sin ese parámetro, el mapa de siempre. El parámetro se quita al elegir.
- **Datos:** ríos (Guadalquivir, Genil, Guadalimar y Guadiana Menor) y sierras (Sierra Morena y Sierra Nevada) de **Natural Earth 1:10m, dominio público** (https://www.naturalearthdata.com/; capas `ne_10m_rivers_lake_centerlines`, `ne_10m_rivers_europe` y `ne_10m_geography_regions_polys`, descargadas con permiso de Pablo).
  - `tools/generar-mapa-detalle.mjs` los proyecta igual que las provincias (`tools/generar-mapa.mjs`) y escribe `site/data/mapa-detalle.json` (3 KB).
  - Los emblemas de las capitales salen de nuestras propias colgaduras (`assets/plates`).
  - Los rótulos «Océano Atlántico» y «Mar Mediterráneo» van en Newsreader cursiva, que ya está en el sitio.
- **A · Grabado:**
  - rayado fino de grabado y montes dibujados como en los mapas antiguos;
  - ríos en tinta clara y fronteras punteadas en oro;
  - un medallón con el emblema de cada colgadura sobre su capital y su nombre al lado.
- **B · Relieve:**
  - luz suave desde el noroeste;
  - sierras como relieve difuminado, con luz y sombra;
  - ríos en oro con su halo, y el nombre de cada capital junto a su punto.
  - Mientras la cámara se acerca, el difuminado se desactiva para no frenar la animación.

## 2026-10-25 (noche) · RETOMAR AQUÍ: encargos nuevos de Pablo para la portada
**Hecho el 26-oct (commit `c78cf21`): los puntos 1 y 2.** Las láminas han vuelto tal cual. La portada mide lo que su contenido en Andalucía y crece a la pantalla al bajar a la ciudad (420 ms). Las banderas, el mapa y la invitación caben en cualquier pantalla. Los hilos solo aparecen al elegir, y la cámara arranca cuando el hilo ha llegado a la capital (360 ms). Capturas de antes y después en `capturas-portada/` (fuera de git). Siguen pendientes los puntos 3 a 5.

## 2026-10-25 · Portada inmersiva «Del mapa a la calle», Noticias con menos ruido y colgaduras sin repetir
Contexto: Pablo quiere que la web sea «vida, inmersión y facilidad de uso», y que no se parezca a Palio App (solo Málaga), que enseña lo mismo que ya teníamos (`MARKETING/analisis-copias.md`). Crítica de impeccable con dos revisiones independientes: 22/40; el detector dio 89 avisos en la portada y 43 en Noticias.

**Elegido (por Pablo, entre tres prototipos con datos reales)**
- **«Del mapa a la calle»:** en la portada solo están las banderas (colgaduras), el mapa de Andalucía y, debajo, la agenda. Al tocar una bandera, las demás se recogen hacia arriba; la elegida queda asomando como pestaña para volver. Su hilo se dibuja hasta la capital, Andalucía se acerca a ella y aparece el plano de su ciudad con los cortejos donde irían a esa hora: una sola cámara, sin cambiar de página.
  - El cielo del lienzo cambia con la hora: tarde dorada, noche de terciopelo, Madrugá azul y amanecer. Solo cambia cuando cambia la hora; nada se mueve en bucle.
  - Jornada con flechas y hora con deslizador. Por defecto: hoy, si es jornada. Si no, la próxima salida extraordinaria de los 45 días siguientes (ahora, la Pasión de Málaga el 14-nov). Si no, la jornada con más cofradías, a la hora con más cofradías en la calle.
  - «Entrar en la calle» y cada medallón llevan a `en-la-calle/<ciudad>/?dia=…&t=…&h=…`, a la misma jornada y hora; el medallón abre además su ficha. El plano viaja entre las dos páginas (`view-transition-name: oc-plano`).
  - `/#malaga` abre la portada ya en Málaga. El botón «atrás» del navegador y Escape vuelven a Andalucía, y el foco vuelve a la bandera.
- **El plano de la portada es `site/assets/plano.js`**: el mismo dibujo propio en SVG que `calle.js` (sin Leaflet ni teselas, decisión del 17-oct), pero solo para mirar. Se carga al tocar la primera bandera, así la portada sigue ligera. Con el dedo, la página sigue desplazándose sobre el plano (con ratón se puede arrastrar); el plano completo con gestos está en «En la calle».
- **Lo que sale de la portada se mueve, no se borra:**
  - «Hoy» (cuenta atrás, jornadas por capital) y la curiosidad del día van a la página nueva `/hoy/`, y la barra inferior pasa a ser Inicio · Hoy · Noticias · Buscar · Más.
  - El calendario va a «Más» y a la cabecera.
  - El archivo (hermandades, bandas, marchas e imagineros) va a «Más», con sus cifras.
  - Las láminas «Las ocho capitales» **se quedan en la portada** entre el mapa y la agenda (Pablo, 26-oct: «ese apartado es precioso»).
  - `/en-la-calle/` deja de redirigir y pasa a ser la página para elegir ciudad.
- **Noticias:** el titular va primero y debajo una sola línea con el medio y la hora. La capital solo aparece si se ven todas. Sin extracto en el móvil y con una noticia destacada (la primera con foto de las seis primeras).
  - **La misma noticia de varios medios se agrupa** (`build.mjs`, al cargar `news.json`): sale la más reciente con «También en…» y sus enlaces. Cuentan como el mismo asunto si comparten al menos el 60 % de las palabras con contenido del titular más corto (tres palabras como mínimo) y tienen 3 días de margen como máximo. Fuera las palabras genéricas (procesión, horario, itinerario, nombres de capital…). Con las noticias de hoy: 2.312 → 1.805, en 226 grupos.
  - **Medios con dos grafías se unifican** con la más usada, prefiriendo la que no es un dominio: «diariosur.es» = «Diario Sur», «lavozdelsur.es» = «La Voz del Sur». La capital del final solo se quita si lo que queda es una palabra («101tv Sevilla» = «101TV»), para no juntar «Diario de Sevilla» con «Diario de Cádiz».
- **Las colgaduras no se repiten:** viven en la portada y en la cabecera de su capital.
  - En las noticias sin foto ya no hay miniatura: solo texto.
  - En las hojas «Más» y «Tu capital», en el buscador y en `/en-la-calle/`, cada capital es un punto de su color con su nombre.
- **Un solo estado de capital:** elegir capital en la portada, en el chip de la cabecera o en los filtros de Noticias es la misma elección. Volver a Andalucía la quita.
- **Arreglos P1/P2 de la crítica (aprobados por Pablo):**
  - Banderas como botones de 44 px con `aria-pressed`. Sin JavaScript siguen siendo enlaces.
  - Los puntos del mapa ya responden.
  - Deslizadores con `aria-valuetext` (dicen la hora, no los minutos).
  - El foco entra en la ficha de «En la calle» y vuelve al cerrarla.
  - En el móvil, el reloj sube por encima de la ficha.
  - Cruces de templos en lila tenue (el oro es del cortejo).
  - Lista por hora dentro de cada estado.
  - «Saliendo/Entrando en su templo» en lugar de «Por Salida».
  - Sin antetítulo, y la ruta de penitencia detrás de la lista.
  - Jornada por defecto: la de más cofradías, en lugar de Viernes de Dolores.
  - Día de la agenda legible (sin tracking negativo).
  - En la agenda, un pregón ya no sale como «Procesión», y el mismo acto detectado en dos capitales se queda en la que nombra su título.

**Descartado**
- **«Tu esquina»** (prototipo 2): «¿Qué pasa cerca de mí?» con minutos hasta que una cofradía pasa a tu lado. Es útil, pero depende de la ubicación. Queda como idea para «En la calle».
- **«La noche entera»** (prototipo 3): una regla para deslizar la noche que enciende Andalucía capital a capital, el «río» de la jornada y la música de cada paso. Obliga a cargar los 8 planos en la portada (unos 3 MB) o a generar un resumen al compilar; queda como idea.
- **Sonido de «la marcha que suena»:** ninguna fuente publica qué marcha suena en cada momento. Inventarlo rompe la regla de no inventar datos. Lo que sí hay, con fuente, es la banda que va tras cada paso y el repertorio dedicado.
- **Gestos completos del plano en la portada** (arrastrar con el dedo y pellizcar): atraparían el desplazamiento de la página en el móvil.
- **Miniatura con las iniciales del medio** en las noticias sin foto: repetía el mismo problema de ruido que la colgadura.


## 2026-10-26 · Filtro de noticias conectado (oc-alojamiento)
Google Noticias (20 de las 60 fuentes) entraba sin filtrar y colaba toros, ferias, Mercadona, PSOE, vacunas u obras.

**Elegido** (`site/filtro-noticias.mjs`, conectado en `site/fetch-news.mjs` para lo nuevo y lo ya guardado): ante la duda, se queda.
1. Los medios cofrades y religiosos pasan siempre (Mundo Cofrade, Gente de Paz, El Pespunte, ArteSacro, Isla Pasión, agrupaciones, federaciones, consejos, diócesis…).
2. Una palabra cofrade fuerte basta (además de las de antes: traslado, Kerygma, prioste, salida extraordinaria, hermano/a mayor, trabajadera, «Primer golpe», SGAE…).
3. Sin palabra fuerte y con un tema claramente ajeno (lista `AJENO`), fuera.
4. El resto pasa si tiene vocabulario cofrade o religioso amplio (también catedral, misa, parroquia, agrupación, cartel…) o el nombre de una hermandad.

**Medido sobre el archivo del 26-oct (1.890 de Google Noticias):** el filtro de la carpeta principal quitaba 248, con muchas cofrades dentro (traslados de Kerygma, el prioste de la Pastora, la SGAE y las marchas, la Catedral de Granada…). El nuevo quita 110, revisadas una a una: todas ajenas salvo 4 dudosas que no se pueden decidir solo por el titular («Siempre nos quedará el Amor», «Otro reconocimiento para Ramón Velázquez», «Creemos que la experiencia con la que contamos es un grado», «El veranillo eterno de San Miguel»). Lectura real: 60/60 fuentes, 121 ajenas descartadas y 9 nuevas.
Comprobación: `node site/filtro-noticias.mjs` lista lo que quitaría del archivo actual sin cambiar nada.

**Descartado:** filtrar también la prensa y las webs oficiales con este criterio (la prensa ya pasa por su propio filtro y las oficiales son cofrades).

## 2026-10-28 · Red de seguridad: ninguna actualización rompe la web (oc-alojamiento)
Pablo: «que todo funcione y compile sin errores garantizando que futuras actualizaciones no den errores».

**Elegido** (`tools/red-seguridad.sh`, en `publicar.yml` antes de cada publicación, en GitHub Pages y en Cloudflare):
- Comprobaciones antes de publicar: `comprobar-marchas` y `comprobar-origen` (0 errores), enlaces internos rotos sobre la web generada (`tools/comprobar-enlaces.mjs`: ~1 millón de enlaces en 12 s, hoy 0 rotos), límites (20.000 archivos, aviso desde 18.000; 25 MiB) y prueba de humo con Chromium (`tools/prueba-humo.mjs`: portada, Hoy, Noticias, una hermandad y una marcha sacadas de sus listados, Buscar y plano de Málaga, a 390 y 1440 px, sin errores de la propia web ni desbordes).
- Si algo falla, el trabajo queda en rojo y no se publica: sigue la versión anterior.
- En Cloudflare: se apunta el despliegue publicado (`tools/cloudflare-volver.mjs`), se sube, se repite la prueba de humo contra la web real y, si falla dos veces, vuelta automática al anterior (API de rollback de Pages). **Sin probar todavía:** necesita las claves de Cloudflare.
- `news.json` se valida antes de subir a R2 (`tools/validar-noticias.mjs`: forma, 50-1.000 noticias, fecha de menos de 3 días, 20 KB-5 MB); si no pasa, se queda el anterior.
- Ramas `prueba-red/…`: pasan todas las comprobaciones sin publicar ni guardar datos. Cada rama tiene su propio grupo de concurrencia, así que no desplaza las publicaciones de main.

**Probado en GitHub Actions** (28-oct): `prueba-red/ok` en verde (navegador 20 s + red 25 s). En `prueba-red/fallo` (un enlace roto y un error de JavaScript provocados), `construir` en rojo con los dos fallos señalados (`Enlace roto /ocho-capitales/colabora-rota/`, `Hoy a 390px y 1440px: JS: fallo provocado…`). GitHub Pages y Cloudflare no se tocaron. Ramas de prueba borradas.

**Pendiente:** Actions avisa de que `actions/checkout`, `setup-node` y las de Pages usan Node 20 (obsoleto); son las actualizaciones de Dependabot por revisar.

## 2026-10-28 · Publicar muchas veces sin esperas: noticias por R2 y web solo cuando cambia (oc-alojamiento)
Pablo: «poder actualizar la página muchas veces, sin esperas». Dominio decidido por él: **ochocapitales.com en Cloudflare Registrar** (sin comprar aún).

**Medido:** desde el 26-oct el bot ya no hace push a main (va a la rama `datos`). Lo que más publica son las sesiones: 49 ejecuciones el 26-oct y 22 el 27-oct, más 5-6 programadas al día. Que `wrangler pages deploy` cuente o no para las 500 «builds» del plan gratuito sigue sin confirmar (documentación y foros no lo aclaran).

**Elegido**
- **Noticias a R2** (depósito `ocho-capitales-datos`, dominio `datos.ochocapitales.com`):
  - cada lectura sube solo `news.json` (`wrangler r2 object put`, caché de 2 min con renovación en segundo plano) y fija el CORS (`tools/r2-cors.json`);
  - la página de Noticias lo pide ahí (`window.OC_NOTICIAS`, solo con la variable `NOTICIAS_URL`);
  - si falla, usa el `news.json` de la compilación, y solo repinta si hay noticias más nuevas que las ya pintadas;
  - probado con Playwright: R2 más nuevo, R2 caído y R2 igual, a 390 y 1440 px.
  - R2 frente a Function+KV/D1: cada petición a una Function cuenta contra las 100.000 diarias de Workers gratis; R2 detrás de la caché casi no se toca.
- **La web entera a Cloudflare solo cuando cambia** (`tools/cloudflare-decidir.mjs`):
  - no se sube si el push solo toca documentos (`.md`, `EQUIPO/`, `MARKETING/`…);
  - con R2 activo, de las ejecuciones programadas solo se sube una al día (portada, «Hoy» y agenda);
  - tope de 450 al mes (`CLOUDFLARE_TOPE_MES`) por si las subidas directas cuentan: al llegar, solo la diaria;
  - sustituye a `CLOUDFLARE_CADA_HORAS`.
- **GitHub Pages de copia;** con la variable `GITHUB_REDIRIGE_A` cada página lleva a la misma del dominio (`<meta refresh>` y canónico allí; probado en compilación).
- **erCuñao** ya no guarda en D1: lleva siempre al formulario de Colabora (todo llega al correo). Así sobran los secretos `RESUMEN_TOKEN` y `SAL` del proyecto de Pages.

**Descartado**
- Pasar ya a Workers con archivos estáticos (`wrangler deploy` con `assets`): solo si el panel muestra que las subidas directas cuentan para las 500 o nos acercamos a 20.000 archivos (hoy ~12.000). Paso 7 de la guía.
- Esperar o agrupar publicaciones (cada 2 h, etc.): contradice «sin esperas».

**Toqué de otras áreas (mínimo, sin diseño):**
- `site/assets/site.js` (bloque de Noticias, de dónde lee el JSON);
- `site/build.mjs` (una variable en el script de cabecera, la CSP y la redirección de GitHub);
- `site/assets/cunao.js` (salida de sugerencias).

## 2026-10-26 · Colabora por correo y GitHub invisible (oc-alojamiento)
Pablo: «que lo que envíen en la página se envíe a mi correo ochocapitales@gmail.com … que el consumidor no vea nada de GitHub».

**Elegido**
- **Web3Forms** como servicio de envío mientras la web esté en GitHub Pages: la clave es pública por diseño y hace de alias del correo (la dirección no aparece nunca en la página), 250 envíos al mes gratis, campo trampa `botcheck`. Pablo la crea con su correo y la pega como variable `FORMULARIO_CLAVE` (`GUIA-ALOJAMIENTO.md`, paso 0).
- **Formulario propio** en `/colabora/` (`site/assets/colabora.js`, solo se carga ahí): tipo, capital, hermandad (con lista), texto, fuente y correo de respuesta opcionales. Asunto fijo `[Ocho Capitales] Tipo · Capital · Hermandad`. Antispam: campo trampa, 3 s mínimos en la página y 5 envíos al día por navegador. Sin clave, el formulario avisa de que el envío llegará en unos días.
- El pie de cada ficha («Sugerir una corrección») y erCuñao (cuando no puede guardar) llevan al formulario con la página, el nombre, la capital o el texto ya puestos.
- **Alternativa Cloudflare** con un ajuste: variable `FORMULARIO_DESTINO=api` → el mismo formulario envía a `/api/sugerencias` (D1). El envío por correo desde Cloudflare (Email Routing) necesita el dominio en Cloudflare: se hará entonces.
- Fuera el flujo semanal `sugerencias-semanales.yml` (publicaba las sugerencias en una incidencia pública).
- User-Agent de los lectores de Nominatim con `ochocapitales@gmail.com`; `site/package.json` pasa a llamarse `ocho-capitales`.

**Descartado**
- FormSubmit: sin cuenta, pero el primer envío tiene que ir a la dirección en claro y recomienda no quitar su reCAPTCHA (otra pantalla para el público).
- `mailto:`: publica la dirección y depende del programa de correo de cada uno.

**Para oc-diseno:** el formulario usa `.oc-field`, `.oc-btn` y `.oc-note`; sus pocos estilos propios (`textarea`, mensajes de éxito y error, campo trampa) van en un `<style>` dentro de la página. Si quieres, pásalos a `site.css` / `vida.css` con el movimiento del resto.

## 2026-10-25 · Alojamiento, dominio y velocidad (sesión de infraestructura)

Medidas en `INFORME-VELOCIDAD.md`; pasos para Pablo en `GUIA-ALOJAMIENTO.md`.


**Elegido: Cloudflare Pages como web principal; GitHub Pages sigue de copia** hasta que Cloudflare lleve una semana sin fallos.

| | GitHub Pages (hoy) | Cloudflare Pages (plan gratis) |
|---|---|---|
| Caché en el navegador | `max-age=600` fijo para todo: cada 10 min se vuelve a preguntar por CSS, JS, fuentes e imágenes | La decidimos nosotros (`_headers`): CSS/JS con huella y fuentes un año `immutable`; imágenes una semana; noticias 5 min |
| Compresión | gzip | Brotli: 10-41 % menos que gzip (índice de búsqueda −29 %, plano de Sevilla −24 %, `marchas/resto.html` −41 %) |
| Cabeceras de seguridad | Solo HSTS; la CSP va en `<meta>` y no admite `frame-ancestors` | `nosniff`, `X-Frame-Options`, `frame-ancestors`, `Referrer-Policy`, `Permissions-Policy`, COOP |
| Funciones | No hay | `/api/sugerencias` (erCuñao) con D1, ya escrito en `functions/` |
| Límites | 1 GB de sitio, 100 GB/mes de tráfico (orientativo), 10 publicaciones/hora | Tráfico ilimitado; 20.000 archivos (hoy 10.795) y 25 MiB por archivo (el mayor, 3 MB); 500 compilaciones/mes **en la integración con Git** |
| Dominio propio | Sí, con HTTPS | Sí, con HTTPS; y si el dominio está en Cloudflare, analítica gratis y redimensionado de imágenes |

- **Despliegue:** subida directa desde Actions (`wrangler pages deploy`, trabajo `cloudflare` de `publicar.yml`), no la integración con Git de Cloudflare: el sitio ya se genera en Actions con las noticias del momento y así no se gastan las 500 compilaciones al mes. La documentación de Cloudflare no dice si las subidas directas cuentan para ese límite; por si acaso, la variable `CLOUDFLARE_CADA_HORAS = 2` reduce a 12 al día (360/mes).
- **Noticias fuera de main (K1):** el bot guarda noticias y agendas en la rama `datos`, que tiene siempre **un solo commit** reescrito en cada lectura (`tools/datos-rama.sh`). main deja de crecer ~100 MB al mes y deja de recibir 24 commits automáticos al día (menos choques al hacer `pull --rebase`). Las copias de `main` se quedan fijas a 2026-10-26 y no se borran: con nueve sesiones trabajando, borrarlas habría dado conflictos a todas (y el protocolo dice que nadie toque `news.json`). En local, las del día: `node tools/traer-datos.mjs`. **Falta, con el sí de Pablo:** limpiar las versiones antiguas del historial con `git filter-repo` (reescribe la historia: todas las sesiones tendrían que volver a clonar).
- **Service worker** (`site/despliegue.mjs`): cachés con nombre fijo (antes se llamaba `oc-<fecha>` y cada publicación horaria borraba todo lo guardado para usar sin conexión); red primero con espera máxima de 2,5 s para páginas y datos (con poca cobertura se enseña la copia y se renueva detrás); recursos con huella y fuentes desde la copia sin preguntar; carcasa con las 8 colgaduras y las 2 fuentes; cachés con tope (120 páginas, 30 datos, 250 recursos); `navigationPreload`.
- **Precarga** de las fuentes Karantina y Heebo (el titular de la portada es el LCP y espera a Karantina).
- **Dominio:** empezar con `ocho-capitales.pages.dev` (gratis y ya reservado). Si se compra uno: `ochocapitales.es` (comprobado sin registrar; ~7 €/año en un registrador español, Cloudflare no vende `.es`) o `ochocapitales.com` (libre; ~10,5 $/año en Cloudflare a precio de coste). Recomendación: `.es`, por el público y el precio, con los DNS en Cloudflare (gratis).

**Descartado**
- Quedarse solo en GitHub Pages: no se puede cambiar la caché de 10 minutos ni añadir cabeceras, y no hay funciones para el buzón.
- Vercel / Netlify gratis: sus planes gratuitos limitan el tráfico mensual (Cloudflare no) y el de Vercel es solo para uso no comercial; además Cloudflare ya tiene la base D1 y el proyecto creados.
- Integración con Git de Cloudflare Pages: compilaría en sus servidores cada push (hasta 500/mes) sin las noticias frescas, que se leen en Actions.
- Guardar `news.json` como artefacto o caché de Actions: caducan (90 días / 7 días sin uso) y se perdería el archivo de noticias.
- Subdominios gratuitos de terceros (`eu.org`, `is-a.dev`, `js.org`): o tardan semanas en aprobarse, o son solo para proyectos de programación; `pages.dev` es igual de gratuito y más fiable.

**Para la sesión de portada (no lo toco: es interfaz)**
- Las miniaturas de noticias de la portada cargan la foto original del medio (300-400 KB, 1200 px) para una caja de 160×120: **~1 MB** de los 1,3 MB de la portada en móvil. Las primeras llevan `fetchpriority="high"`, que compite con el titular (el LCP real). Propuesta: quitar `fetchpriority="high"` (o dejar solo `loading="lazy"`) y, cuando haya dominio en Cloudflare, servirlas redimensionadas con `/cdn-cgi/image/width=320,format=auto/<url>` (5.000 transformaciones únicas al mes gratis).
- La portada pasa ~2,5 s de CPU en móvil lento evaluando el HTML (106 SVG en línea y un script en línea de 11 KB): TBT 700 ms. Dibujar el mapa al entrar en pantalla o simplificar los SVG repetidos lo bajaría.
- `search-index.json` incluye las 200 últimas noticias, así que cambia cada hora y se vuelve a descargar entero (424 KB gzip). Al partirlo (sesión de marchas), conviene dejar las noticias fuera: el buscador puede tomarlas de `news.json`.

## 2026-10-24 · Decisiones de Pablo sobre la auditoría integral
- **Mutilado de Málaga** (`mutilado-clemencia-malaga`): se queda como víspera del Sábado de Pasión. Sustituye a la decisión de octubre de no añadirla (`MALAGA-VERIFICACION.md`).
- **Marchas del foro de Patrimonio Musical (2008):** visibles como «sin verificar»; cada una se intenta confirmar en otra fuente y pasa a «verificada» con su fuente.
- **Fechas contradictorias entre fuentes:** se investigan en fuentes primarias; sin conclusión sólida, se muestra la más fiable con la discrepancia indicada (no se elige en silencio).
- **Portada:** solo el selector de banderas con el mapa y, debajo, la agenda. **Noticias** se rediseña con menos ruido. Las colgaduras se usan con moderación: no se repiten en listas ni tarjetas.
- **Trabajo de otra sesión** (re-lectura de marchas, `filtro-noticias.mjs`): se termina al final, con autoauditoría.

## 2026-10-23 · Marchas: no afirmar lo que no está verificado (auditoría integral, tanda A)
**Elegido**
- Una marcha del catálogo solo se une a una marcha de hermandad si el título coincide y los compositores comparten un **apellido** (se ignoran nombres de pila y partículas). Así se pierden ~16 uniones dudosas a cambio de no pegar el vídeo y el año de otra obra.
- Un artículo de Wikipedia emparejado con varias hermandades solo da marchas a la que tiene todas sus palabras propias en el título del artículo.
- Marchas de la lista del foro de Patrimonio Musical (2008): se muestran como «Asociada a… (sin verificar)» y «Marchas asociadas», con su fuente. Wikipedia y las fichas oficiales siguen como «Dedicada a», con nota de origen.

**Descartado**
- Ocultar las 322 marchas del foro: la segunda opinión confirmó 5 de 6 en otras fuentes; ocultarlas quitaría información casi siempre correcta. Pendiente de que Pablo lo decida (está en «A decidir» de `AUDITORIA-INTEGRAL.md`).
- Unir por nombre completo exacto: perdía variantes legítimas del mismo compositor (tildes, iniciales).

## 2026-10-13 · Rediseño «Colgaduras» (en curso, sin publicar)

**Elegido:** mundo visual «Colgaduras» (reposteros de balcón al paso de las cofradías): morado nazareno, oro de galón, cal blanca de fachada y el color de cada capital como terciopelo. Titulares en Karantina (condensada, versales), texto en Heebo. Composición C de la maqueta: titular + cuenta atrás, ocho colgaduras con su emblema sobre el mapa, hilos dorados a cada capital, noticias con miniatura.
- Emblemas (a petición de Pablo, tomados de `portal.json`): Sevilla palio, Málaga campana, Granada Alhambra, Córdoba arcos de la Mezquita, Cádiz horquilla, Huelva cinta, Almería Alcazaba, Jaén cruz del Nazareno.
- Maquetas y recursos: Canva (`generate-image`, diseño de trabajo DAHXzhKqeGQ). Originales PNG en `assets/plates/` (local, fuera de git); en la web, WebP en `site/assets/plates/`.

**Descartado**
- Cartel anunciador (la favorita de impeccable): muy reconocible pero poco propia y depende de fotos con derechos.
- Colgaduras ordenadas de oeste a este (hilos sin cruces): se usó el orden del portal como la maqueta aprobada; los hilos van en ángulo recto con carriles calculados para minimizar cruces.
- Textura de papel como fondo y acuarela sobre el mapa: dejaban ver las juntas del azulejado; la acuarela además era el LCP (la inyecta JS).
- Marcado SVG incrustado para mapa e hilos: el comprobador de impeccable lo trata como ilustración. Ahora se dibuja con JS desde datos JSON (`#oc-mapa`).

**Técnicas**
- `colgaduras.css` se cargaba después de `site.css` y la sustituía donde se solapaban. El 2026-10-16 se absorbió al final de `site.css` (mismo orden de cascada, una petición menos).
- Colgaduras = enlaces reales a la capital (funcionan sin JS); con JS eligen ciudad (`setCity`), con muelles propios (response/damping al estilo Apple), balanceo al rozarlas, hilo que se dibuja y botón que nace del punto de la capital. `prefers-reduced-motion`: cambios instantáneos.
- Miniaturas de noticias sin foto: la colgadura de su capital (nunca un hueco).
- Despertador: cron de GitHub 3 veces por hora con trabajo `comprobar` que corta si `news.json` tiene menos de 40 min (sin cron-job.org).

## 2026-10-17 · El plano sigue siendo propio (SVG), no Leaflet

**Elegido:** mantener y mejorar el plano propio (`calle.js` + `plano.mjs`). Pablo lo decidió expresamente. Se le añadió lo que más le faltaba: rótulos de calles e iglesias (etiquetas por tramo con su ángulo, tamaño fijo en pantalla, descarte de solapes y esquivando los medallones, con rangos según el zoom), recorridos por las calles (`enrutar.mjs`) y solo brilla el recorrido de las cofradías que están en la calle a esa hora.

**Descartado**
- Leaflet con teselas de OpenStreetMap/CARTO (propuesto por Antigravity, que reescribió `calle.js`): depende de servidores de terceros con sus condiciones de uso, no funciona sin conexión y pierde el aspecto cofrade. Copia del intento guardada fuera del repositorio (scratchpad de la sesión).
- Dos heurísticas del mismo intento que rompen la regla de no inventar datos: adivinar si una foto es del Cristo o de la Virgen por palabras de su descripción, y asignar marchas a hermandades por coincidencia de palabras en la dedicatoria.

**Técnicas**
- Las etiquetas salen de los nombres de OpenStreetMap (`etiquetas` en `site/data/planos/<ciudad>.json`): rango 1 = calles del recorrido y arterias; 2 = terciarias cercanas; 3 = el resto cercano. Una etiqueta por nombre cada 300 m como mínimo.
- El plano de Sevilla pasa de ~270 a ~370 KB; en Cloudflare viaja comprimido.

## 2026-10-15 (noche) · Imágenes, «En la calle», ruta, base de datos y erCuñao

**Elegido**
- **Imagen de cada hermandad:** foto de Commons revisada a ojo. Se prefiere el Cristo y la Virgen en díptico (o una foto con los dos); si no hay, un solo titular; si no, la sede, rotulada «Sede: …» para no hacerla pasar por la imagen. Si tampoco hay sede, una estampa propia (colgadura, monograma y titulares) que invita a compartir una foto. Así se cumple que «todas las hermandades deben tener imagen» sin inventar.
- **Alojamiento:** Cloudflare Pages gratis, sin dominio por ahora (decisión de Pablo). GitHub Pages sigue publicando en paralelo hasta que Pablo lo apague. **WordPress descartado:** el sitio es estático y generado; WordPress añadiría servidor, base de datos y mantenimiento sin aportar nada que hoy falte.
- **erCuñao:** sin IA, gratis (decisión de Pablo). Reconoce intenciones (día, ciudad, hermandad, horario, sugerencia) sobre un JSON reducido. Sugerencias a Cloudflare D1, con límite de 10 al día por IP cifrada; si no hay servidor, abre una incidencia de GitHub ya rellenada. El debate semanal es una incidencia automática cada lunes.
- **Plano:** dibujado por nosotros desde OpenStreetMap (calles simplificadas en SVG, terciopelo morado y oro), sin mosaicos de terceros: es gratis, funciona sin conexión y tiene estética cofrade. Las rutas a pie se delegan a Google Maps o Apple Maps con un enlace.
- **Posición del cortejo:** estimada interpolando entre los puntos con hora del itinerario oficial, y rotulada como estimación. Los puntos sin coordenadas fiables se descartan (a más de 900 m de sus vecinos o a más de 2,5 km de la mediana) o se interpolan marcados «estimado».
- **Ruta de penitencia:** algoritmo voraz. Elige la parada que da más cofradías nuevas por minuto invertido (espera + camino), a 70 m/min y con un máximo de 30 min andando. «Evitar la bulla» penaliza las zonas con muchas cofradías y la carrera oficial. La afluencia es una estimación declarada, no un dato.
- **Base de datos:** SQLite con `node:sqlite` (sin dependencias), regenerada desde `portal.json` en cada publicación, con tabla de procedencia y `auditoria.json`.

**Descartado**
- Mapas con mosaicos (Leaflet + OSM tiles, Mapbox, Google): dependen de terceros, tienen límites de uso y no tienen la estética.
- erCuñao con IA (Workers AI u otra API): Pablo lo quiso solo gratis y sin IA.
- Fotos de Instagram o de webs de hermandades: tienen derechos. Solo Commons con licencia libre y crédito.
- Subir al repositorio los PDF de itinerarios y los textos completos de las fichas: el repo es público y son de terceros. Están en `.gitignore`.

## 2026-10-15 · Movimiento e interiores

**Elegido**
- Transiciones de página nativas del navegador (`@view-transition`), sin librerías. La colgadura comparte nombre de transición entre la portada y su capital, así que viaja de una a otra. Si el navegador no las admite (o con «reducir movimiento»), la navegación es normal.
- Revelado al hacer scroll con `animation-timeline: view()` (CSS puro), en lugar de IntersectionObserver con JS: no cuesta en el hilo principal y, sin soporte, el contenido se ve directamente.
- Capital: foto a sangre con velo nazareno y la colgadura de esa capital colgando. Se descartó mantener la caja morada «Atlas», que era el mismo patrón para todas las capitales.
- Hermandades sin foto: un monograma bordado (inicial en oro sobre el terciopelo de su capital). Se descartó repetir la colgadura de la capital en cada fila, porque en una lista de 70 hermandades sería la misma imagen 70 veces.
- Noticias sin foto: la colgadura de su capital (como en la portada), también cuando la foto del medio falla al cargar.

**Descartado**
- Sello de ocho puntas girando lentamente en las cabeceras de banda: un movimiento constante choca con el tono sobrio y devoto.
- Píldora de jornadas escalada con `scaleX` (más barata): deformaba los extremos redondeados; se anima `transform` + `width` de un solo elemento.

**Comprobador de fidelidad de impeccable (no superado)**
- Primer pantallazo a 1080×1920 (432×768 CSS a 2,5×): 75 % global (hace falta 72 %) pero con vetos en 14 regiones: las partes dinámicas (fotos y titulares reales de noticias frente a los inventados de la maqueta) y las letras de las colgaduras. No es alcanzable sin falsear contenido. Solo se puede saltar con palabras de Pablo (`--force --reason`). Pendiente de decidir con él.
- Cambiar `regions.json` invalida la aceptación de la revisión de recursos: si se vuelve a usar el flujo, hay que repetir `component-review` y que Pablo acepte.

**Salidas extraordinarias y magnas en «En la calle» (2026-10-22)**
- Elegido: misma tubería y formato que los recorridos de Semana Santa. Fuente `tools/sources/itinerarios-extraordinarios.json` (puntos `{lugar, hora}` literales del cartel, tramos `ida`/`regreso`, `acto` entre ambos) → `geocodificar.mjs` las escribe en `recorridos/<ciudad>.json` bajo `extraordinarias` → `enrutar.mjs` → `build.mjs` las añade como una «jornada» más con fecha (pestaña propia tras las de Semana Santa).
- Descartado: un mapa o página aparte (duplicaba plano, reloj, ficha y ruta) y una lista paralela de eventos con coordenadas (el brief pedía no crear otro modelo).
- Regreso con guiones largos (11 7); los tramos «aprox.» siguen siendo de puntos (2 7), para no confundirlos.
- Horas: solo las del cartel son oficiales; el resto se reparte por distancia andada y se muestra con «≈».
- «Pasada»: se decide en el navegador por la fecha (no al compilar), para que no dependa de cuándo corra el bot. La próxima se destaca y se abre por defecto si hoy no hay jornada; las celebradas se apagan.
- Pista `templo` en los puntos: la salida no siempre es la sede de la hermandad (p. ej. llegada a San Juan).

**Málaga: puerta, marchas y fotos (2026-10-25, sesión de corrección)**
- Puerta exacta de salida/entrada: nodos `entrance`/`door` de OSM (Overpass), por este orden: puerta con la dirección de la sede; puerta del edificio del templo cuya dirección o calle es la primera (última) del itinerario; única puerta del edificio. Si nada encaja, se queda el punto del edificio con aviso. Descartado elegir «la puerta más cercana a la calle» sin más (en edificios con varias puertas sería inventar).
- El Rico y Resucitado no citan la Torre Sur en su lista oficial, pero su ficha da la hora de Torre Sur: se sitúa en Molina Lario tras la Plaza de la Marina y ahí empieza el regreso (anotado como derivado). La prensa (El Español) tampoco separa ida y regreso.
- Marchas: correcciones a mano en `tools/sources/marchas-correcciones.json` (retirar / confirmar / añadir), aplicadas en `site/build.mjs`, para que sobrevivan a una regeneración de `portal.json`. Descartado editar `portal.json` a mano.
- Wikipedia pasa a ser pista, no fuente de la dedicatoria: sus marchas salen «sin verificar» hasta confirmarlas en Patrimonio Musical (afecta también a Sevilla).
- Fotos: `tools/sources/fotos-retiradas.json` por nombre de archivo de Commons, aplicado en `site/build.mjs` a la foto principal y al díptico. Descartado borrar las entradas de `site/data/imagenes.json`, porque `procesar-imagenes.mjs` las volvería a crear.

## Modo fuera de temporada (26-oct-2026, orden de Pablo vía coordinadora)
- **Temporada por fecha y configurable:** `site/data/temporada.json` (`modo`: auto / fuera / semana-santa). En «auto», los recorridos solo se ven del Viernes de Dolores al Domingo de Resurrección (2027: 19 al 28 de marzo). El build decide y `site.js` lo vuelve a comprobar con la fecha de Madrid. Los recorridos de 2026 se conservan en los datos.
- **Portada → plano de la ciudad con sedes:** espadaña bordada (templo) y fachada (casa hermandad), en el color del hábito y con el hilo de oro de las catedrales. Las que se pisan se juntan con su número; al tocar un grupo repartido, la cámara se acerca; uno solo (o varios en el mismo edificio) abre una hoja con foto, sede, día de salida de 2026, próximos cultos de la agenda y la ficha. Hay un hilo de oro entre el templo y la casa de la hermandad elegida.
- **Datos de sedes:** si existe `site/data/sedes/<capital>.json` (lo cargan las sesiones de rutas), manda. Si no, de forma provisional y solo en Málaga, Córdoba y Cádiz: el punto de salida del itinerario oficial (casa hermandad si lo dice) más el templo de la ficha si OSM tiene uno con el mismo nombre. En las demás no se pinta nada hasta que llegue su archivo. **Descartado:** emparejar nombres de templo de forma aproximada (daba falsos).
- **Botones fuera de temporada:** «Próxima Semana Santa 2027» (página nueva `/proxima-semana-santa/`: cuenta atrás, fechas de cada jornada y qué tendrá cada capital) y «Extraordinarias» (solo las vigentes, con recorrido y posición estimada; desactivado si no hay). «En la calle» fuera de temporada solo enseña las extraordinarias vigentes, o un aviso si no hay.
- **Estilos nuevos en `site/assets/portada.css`** (no en `site.css`, que es de oc-diseno).
- **Entrada inmersiva:** Pablo eligió las dos (26-oct): A, el globo baja a Andalucía en la primera visita (con continentes de Natural Earth 1:110m, descarga aprobada); B, el nazareno que se dibuja con el scroll en «Próxima Semana Santa». Prototipos en `capturas-portada/entrada/`.
- **Extraordinarias con solo hora de salida** (Santo Traslado, Santa Cena de Granada): la posición se estima con el paso medio (mediana) de las cofradías de esa ciudad en 2026, en metros por minuto, y se dice en la nota. Las hermandades sin ficha (Amparo de Sevilla, de gloria) salen con el nombre de su itinerario.
- **Entradas construidas:** el globo (`site/assets/globo.js` + `mundo.json`, 32 KB, solo se descarga en la primera visita; aterriza en el mapa Bordado en su sitio y se funde con él; se salta tocando, con «Saltar» o Escape) y el nazareno (`site/assets/nazareno.js`, cabecera de «Próxima Semana Santa», 300vh con escena fija). Sin JS o con «reducir movimiento» el nazareno se ve terminado y el globo no sale. La costa de 1:110m se desvanece al acercarse porque de cerca es basta.

## RETOMAR AQUÍ (26-oct, parado al 93 % del límite de 5 horas)
Encargo de Pablo (vía coordinadora), literal: «¿Cuándo se ve el globo terráqueo?? Sólo muéstrale una vez y el nazareno cuando se ve, está escondido ese apartado, ¿no? Revisar».
1. **Globo** (`site/assets/site.js`, bloque «Entrada de la primera visita», tras `mapa.appendChild(svg)`):
   - una vez por visita con `sessionStorage` (no `localStorage` `oc-entrada`), corto y se puede saltar;
   - un control discreto en la portada para volver a verlo (un globo pequeño junto al mapa);
   - con movimiento reducido, una versión estática o un fundido, nunca nada.
2. **Nazareno:** también en la portada, en la zona «Próxima Semana Santa 2027», bajo el mapa o las láminas, y que se dibuje al bajar. Que siga en `/proxima-semana-santa/`. Reutilizar el SVG `NAZ` de `pageProxima()` y `assets/nazareno.js` (ahora busca un solo `[data-nazareno]`).
3. Comprobar en móvil y PC, también en una ventana nueva sin datos guardados, y mandar capturas o un vídeo corto a Pablo.
Pendiente de subir: `bc80c39` (modo de prueba `OC_TEMPORADA`); necesita el sí de Pablo en este chat.
Después, el inventario: la ficha lateral de «En la calle» en PC, la zona táctil de «Ver el máximo / Evitar la bulla», el CPU de la portada en móviles lentos, las miniaturas de noticias y Sevilla en los hábitos.
- **probar-plano.py:** que el aviso de «puntos amontonados» no salte en recorridos que van y vuelven por las mismas calles (El Calvario de Córdoba: ida y regreso por los mismos cruces, 59 %). Contar los puntos de la ida y los del regreso por separado. Lo pidió rutas-cordoba (a459718).
- **Globo con más detalle** (Pablo vía oc-marketing): «El globo terráqueo debe tener dibujado, haz diseños para aplicárselos y que se vaya acercando al continente poco a poco hasta el país y llegar a Andalucía bien detallado, pero para el vídeo y para la página». Para la web: continentes y países con estilo (no un círculo con meridianos), acercamiento lento y continuo Europa → España → Andalucía con provincias detalladas. Proponer 2-3 diseños con captura antes de construir. Hace falta el contorno de España o de los países (Natural Earth 1:50m admin-0): la descarga pide permiso. Componente de referencia de marketing: MARKETING/_src/motions/epico (bloque «globo»).
- **26-oct, tras la renovación (Pablo):** globo solo con siluetas de oro (continentes y provincias), sin rellenos, rayados ni retícula; 5 s, una vez por visita (`sessionStorage`), con un globo pequeño en la esquina del mapa para volver a verlo, y con «reducir movimiento» una imagen quieta y un fundido. Mapa de Andalucía sin ríos y con una sola gramática: la catedral de pie encima de su punto y el nombre a la derecha (en el móvil, debajo; Jaén a la derecha). Nazareno: Pablo eligió el A (oro sobre terciopelo); va también en la portada fuera de temporada, tras las láminas, con botón a «Próxima Semana Santa». Descartados: lentejuelas, carta grabada, bordado de puntadas, tinta sobre papel y cortejo por la calle.
- **Planos de ciudad legibles y manejables en el móvil (26-oct, Pablo: «no se ven claros estos mapas y no se puede mover ni hacer zoom correctamente»), en las 8 capitales:** calles con más contraste y nombres de calles según el zoom (los que caben en su tramo, sin pisarse); agua y parques más visibles; encuadre en la zona de sedes, dejando fuera solo las muy apartadas (más de 2,5 veces la distancia mediana); iconos más pequeños al alejar y los grupos como un medallón con su número; leyenda (templo, casa hermandad, grupos, color del hábito); controles pequeños abajo a la derecha, encima del pie; la colgadura ya no asoma cortada en la ciudad. Gestos: un dedo baja por la página, dos dedos mueven y amplían, doble toque acerca (y aviso «usa dos dedos» si se intenta con uno); en el ordenador, Ctrl + rueda o el pellizco del panel táctil, y doble clic. Fondo fiel desde el .pbf también en Sevilla, Granada, Huelva, Jaén y Almería. Barrios: no hay datos con nombres de barrio en el plano; queda pendiente.
- **Globo «Terciopelo y oro» en la web (Pablo, vía oc-marketing: «el globo no solo para el vídeo sino página y app»):** el mismo diseño que el vídeo: luz de vela con un lado en sombra, tierra fundida sin fronteras con la costa en hilo de oro (1:110m y, al acercarse, 1:50m), España con su galón, aura cálida; gira hasta España y baja sin cortes hasta Andalucía; las provincias se tiñen de oeste a este y se encienden las capitales; se funde con el mapa de la portada. d3-geo 3.1.1 y d3-array 3.2.4 (ISC) en assets/vendor, solo se cargan en la entrada; datos en assets/globo-datos.json (97 KB) con tools/generar-globo.mjs desde los de marketing. Sustituye al globo de siluetas (mundo.json y generar-mundo.mjs retirados).
- **27-oct (Pablo):** globo sin cortes: la costa de 1:110m se funde poco a poco con la de 1:50m y al llegar la tierra deja paso a las provincias del mapa de la portada (las mismas formas: el fundido final no cambia nada). El nazareno solo en «Próxima Semana Santa». Planos: el botón de reproducir cambia a pausa de verdad (el truco CSS «d: path()» no va en Safari) y la hora se lee como hora del día («17:30 h» con sol, tarde o luna). PC: a partir de 1200 px y pantalla apaisada, dos columnas (banderas y cuenta atrás a la izquierda, el mapa grande a la derecha; sin hilos). Banderas: la misma caja las 8 (aspect-ratio) y el nombre más grande según el ancho y las letras, con más contraste y una cartela suave.
- **Corrección de Pablo (27-oct) sobre el nazareno:** al revés: se dibuja al bajar por la portada y en «Próxima Semana Santa» aparece ya hecho, sólido («si no es muy repetitivo»).

## RETOMAR AQUÍ (27-oct, parado al 84 % del límite de 5 horas; se renueva hacia las 02:30)
Encargo de Pablo, literal: «Revisar y rehacer animación al clicar una capital en pantalla, se ve feísimo, nada inmersivo ni transformante; si tocas una bandera, igual».
Plan (no empezado):
1. **Una sola cámara de la provincia al plano** (`site/assets/site.js`, funciones `entrar`, `salir` y `moverAnd`; `site/assets/plano.js`, `volar`). Hoy el mapa de Andalucía se acerca con `viewBox` hasta un 1/22 y el plano de la ciudad aparece con fundido encima, en otra escala: ese es el corte. Plan: calcular el `vb` del plano en metros para que su primer encuadre coincida con la caja de la provincia en pantalla, y hacer un solo vuelo continuo de la provincia al plano. La provincia elegida gana el color de su capital; las demás se apagan y se hunden (`opacity` y `transform`).
2. **La provincia se convierte en el plano:** su contorno pasa a ser el borde del encuadre (máscara que crece); las calles se dibujan a trazo desde el centro (`stroke-dashoffset` sobre las principales, en una sola pasada) y las sedes caen escalonadas (ya tienen `--i`).
3. **La bandera tocada** sube a la cabecera y se queda como emblema (FLIP con `transform`); las demás se recogen. Ahora se ocultan con `opacity` (`portada.css`, «la colgadura no asoma cortada»).
4. **Volver** («← Andalucía») = lo mismo al revés; interrumpible; 1,2-1,8 s; con movimiento reducido, un fundido corto.
5. Grabar vídeo en móvil (390) y PC (1440, 1920) con Playwright, revisar fotograma a fotograma y mandarlo a Pablo **antes de subir**.
Ojo: el puerto 8093 lo usa el servidor de otra sesión; para probar, el 8097.
- **Detalle del fallo** (oc-marketing, notas compartidas fallo-portada-toque-capital.md, fallo-portada-toque-malaga.mp4 y .png; móvil 390×844): (1) durante 0,3 s se ve el pie «Cargando su plano…» con flechas y deslizador, y la página salta (el reloj se ve antes de saber el modo: ocultarlo fuera de temporada desde el principio); (2) el plano aparece diminuto y centrado sobre negro y luego salta a tamaño completo (es el vuelo desde «ancho × 3»: sustituirlo por la cámara continua desde la caja de la provincia); (3) las calles y los rótulos aparecen de golpe (dibujarlos con fundido o trazo).
- **Transición de la portada a la ciudad, hecha (27-oct):** una sola cámara en metros del plano (site.js «volarCamara»). El mapa de Andalucía se pinta con el mismo encuadre convertido a sus píxeles, así que el relevo al plano es un fundido sin cambio de escala. La provincia elegida queda debajo de las calles y se apaga al llegar; las demás se oscurecen al tocar; las calles menores, los rótulos y las sedes llegan al final; la vuelta es la misma cámara al revés. Rendimiento: el plano solo se pinta cuando se ve, durante el vuelo solo con las calles principales, y fuera el cordón discontinuo y el terciopelo del mapa en la ciudad (ampliados miles de veces eran el tirón). **Descartado:** mover el plano con «transform» desde un dibujo previo (en el móvil dejaba huecos sin pintar y calles borrosas). La cámara arranca tras crear el plano; el plano y los datos se piden ya al acercar el dedo o el ratón.
- **Emblema:** la bandera tocada baja (FLIP con transform) hasta el nombre de la ciudad y se queda a su lado como emblema; las demás se recogen.
- **27-oct (Pablo: «El verde ese, ¿por qué sale ahí?»):** el relleno de la provincia que usa la transición se quedaba pintado con su costa simplificada cortando la ciudad. Ahora se apaga del todo durante el vuelo y se borra al llegar. Recorridos del plano de la portada más visibles: con su color, más gruesos y con un filo oscuro debajo.
- **28-oct, LCP (aviso de oc-alojamiento):** el globo de la primera visita cargaba d3 y sus datos y animaba mientras se pintaba la imagen principal; en móviles lentos sumaba hasta 0,9 s al LCP (medido con CPU ×4 y red lenta: Cloudflare y GitHub Pages igual sin globo, unos 3 s). Ahora arranca tras el evento «load»; con el cambio, el LCP con globo es igual que sin él. Las cabeceras de Cloudflare no influyen.

## Hoy y Calendario con el lenguaje de Noticias (1 y 2-nov, oc-diseno, publicado en af31829)
- **Elegido:** cabecera de terciopelo compartida (`.nx-head.vx-head`), que toma el color de la capital con `data-head-capital`; clases propias `.hy-*` y `.cx-*` en `vida.css`, secciones 9 y 10; orden de paso común (`filaPaso`, `.hy-paso`) en las dos páginas.
- **Terciopelo con capital al 60 %, no al 74 % de Noticias:** con Almería, Huelva y Córdoba el oro no llegaba a AA (el auditor lo rechazó dos veces). Medido: oro 4,61:1 o más en las 8 capitales. Las cifras de `.nx-pulso` llevan velo oscuro solo en cabeceras con `data-head-capital`; Noticias sigue pendiente.
- **Descartado:** tocar `.oc-ev*` de forma global, porque también lo usa la agenda de la portada, cuyo plano y portada no son de este equipo. Va acotado con `:is(.cx-lista, .oc-miss)`.
- **Descartado:** corregir el orden de paso de Sevilla en la plantilla; viene de `orden` en los datos y se ha pasado a Coordinación.

## Buscar, Favoritos, Colabora y hora de carrera (2-nov, oc-diseno, auditor-diseno APTO en las cuatro)
- **Hora de carrera en vez de solo la salida:** el orden de paso es el de carrera oficial, así que esa hora va en oro con su etiqueta y la salida debajo. **Descartado** dejar las dos al mismo tamaño: no se veía cuál explica el orden. Sin dato (seis capitales y las vísperas), solo la salida. Las salidas extra no heredan la carrera (`!h.extra`).
- **Buscar sin cifras en la cabecera:** ya están en los accesos; repetirlas no aportaba nada. Al escribir no se anima nada porque se repinta con cada letra.
- **Favoritos:** `window.ocIcs` estaba dentro del bloque del Calendario y en Favoritos no existía, de modo que «Descargar mi Semana Santa» no hacía nada; ahora es global. «Mi Semana Santa» se recalcula al quitar y el foco pasa a la fila vecina.
- **Colabora:** estilos en línea pasados a `vida.css`; `colabora.js` sin tocar. Las pruebas interceptan `api.web3forms.com`: nunca se envía nada de verdad.

- **Aviso «Horarios de 2026» en Hoy y Calendario (2-nov):** solo fuera de temporada, para que no parezcan horas de 2027. **Al cargar los horarios de 2027 hay que subir `ANIO_HORARIOS` en `build.mjs`.** Descartado deducirlo de `hora_fuente`: 19 horas no tienen fuente.

- **Colores del hábito en la ficha (2-nov, publicado en b59486d):** salen de `tools/sources/habitos-colores.json`, los 100 textos de `habitos.json` pasados a mano por sección y prenda. **Descartado** seguir adivinándolos con expresiones regulares: se equivocaba de prenda («Capa roja» era la cruz de la capa) y no conocía colores como guinda, malva o corinto. Si el texto es ambiguo, la prenda no sale. `tools/diseno/comprobar-habitos-colores.mjs` solo comprueba que cada color esté escrito en su texto, no que vaya con esa prenda: **si cambia un texto, hay que repasar la tabla a mano.** `site/data/colores-habito.json` («En la calle», de Portada) aún no cuadra en 10 hermandades; avisado a Coordinación.

- **Ficha de hermandad: pocas bandas y marchas (3-nov, oc-diseno).** Pablo: «la cosa es ver unas cuantas y si quiero ver más me lleve a ese sitio para verlos mejor». En la ficha, 5 marchas y unas 3 bandas: de la guía del año, solo bandas (sin escuadras ni compañías), primero los pasos de los titulares (hasta 4 si son dos pasos de dos) y la Cruz de Guía solo si sobra sitio, sin las novedades de 2027; si no hay guía, 3 fichas de banda. **Descartado** cortar por el orden de la guía: en Mena escondía la banda de la Virgen (auditor). La banda de la propia hermandad sale siempre y no gasta sitio (Pablo: «ponla»): la marcada `propia` en los datos o la que lleva el nombre de la hermandad y es de su ciudad («Agrupación Musical Fusionadas», que los datos dan como no propia). **Descartado** fiarse solo del nombre: «Banda de Música María Santísima de la Esperanza» puede ser de otro pueblo. El resto, en `hermandad/<slug>/musica/`, **que solo se genera si algo no cabe: 223 páginas** (el catálogo une varias bases y hay fichas con hasta 141 marchas). Orden de las marchas, igual en la ficha y en la subpágina: las que toca su propia banda (repertorio), las dedicadas a un titular y las que tienen grabación; a igualdad, el orden de siempre (contrastadas primero), y las «sin verificar» al final. **Descartado** enlazar a Marchas filtrada (`?q=`): sin JS no filtra y el texto «Aurora» trae marchas de otras hermandades. La nota solo nombra los criterios que han contado. Prueba: `tools/diseno/probar-musica.py` (360/390/1440, claro, oscuro y sin JS; mide el desbordamiento con `clientWidth`, porque en móvil `innerWidth` crece con el contenido).

- **Nazareno pequeño y respaldo sin foto (3 y 4-nov, oc-diseno).** El nazareno de la ficha sale de `habitos-colores.json`, uno por sección: túnica, tocado (capirote, antifaz, capillo, caperuz, cubrerrostro: cónico; morrión, capucha o verdugo: redondeado), capa, escapulario, botonadura y cíngulo (con contorno, para que se vea aunque sea del color de la túnica). La prenda sin color va solo con su contorno; sin túnica no hay figura; sin cirio ni escudo, que no constan. **Sin foto de un titular** (86 fichas), el mismo nazareno con el hábito de la primera sección, o en trazo dorado si no está descrito (11): en la ficha, en lugar de la inicial; en el listado, el buscador y el plano, la lámina `assets/naz/<slug>.svg` (3:2, terciopelo de su capital, la escribe el build). **Al compartir:** `assets/og/h-<slug>.jpg`, 1200×630, hechas con `tools/diseno/og-respaldo.py` (Playwright y las letras de la web; ~43 KB cada una). **Descartado** sharp en el build: no está en la publicación y no lee las fuentes woff2. **Hay que volver a ejecutar `og-respaldo.py` cuando cambien hábitos o fotos:** guarda la huella de cada lámina en `assets/og/huellas.json` y el build solo usa la imagen si la huella es la de hoy; si cambió o falta, comparte la genérica y avisa al compilar («Aviso: N fichas sin foto comparten la imagen genérica…»). **Es aviso y no para la publicación** (Coordinación lo dejó a Diseño): lo que sale entonces es correcto, solo menos vistoso, y parar bloquearía a los demás equipos. Cuando Imágenes sube una foto, la ficha deja de usar la og del nazareno sola; la primera tanda salió con el dibujo anterior al arreglo del caperuz y el auditor lo cazó. Las filas de capitales, marchas, compositores e imagineros también llevan la lámina en vez de la inicial. Pruebas: `probar-nazareno.py` y `probar-respaldo.py`.

## RETOMAR AQUÍ (2-nov, sesión oc-diseno del sobremesa)
`EQUIPO/` y la nota del proyecto no se pueden editar desde este worktree, así que el punto de retomar queda aquí. Las cinco páginas están hechas. Sin hacer de P2/P3: 5 transiciones de ancho/alto en `site.css`, pestaña activa en fichas, colores de `vida.css` a tokens, contraste de `.nx-pulso b` en Noticias, enlaces del pie de 36 px, pasada completa final.
- **2-nov (Pablo: «el fondo debe ser el mismo oscuro y estrellado… no puede verse la web antes que la animación»):** el cielo de la landing (estrellas con gradientes CSS) va en línea en el HTML de la portada (`HEAD_ENTRADA`, build.mjs). `html.oc-entrando` lo pinta desde el primer byte y tapa la web; el globo y la portada usan ese mismo cielo, que se apaga en la ciudad. El globo arranca en «load» o a los 1,8 s, y al estar encima quita la capa; si falla, se quita al momento (onerror) y, sin JavaScript de por medio, a los 9 s por animación CSS. Una vez por visita, como antes.
- **Pendiente tras esto: revisión de uso de «En la calle»** (encargo de Pablo: «Añádele una revisión a la página de mapa para facilitar su uso»): encontrar capital, día y hermandad; gestos; legibilidad; botones de 44 px; «Mi ubicación»; accesibilidad; rendimiento. A 390, 768 y 1440 px. Lista priorizada con capturas para Pablo.

## RETOMAR AQUÍ (3-nov, Portada · plano, colores y «En la calle»; todo publicado, con el sí de Pablo)
- **Publicado:** 977f6c9 (plano más ligero y colores del hábito), b4dd664/encuadre (el medallón ya no queda bajo el reloj en pantallas anchas) y 8bc2a8f (díptico de titulares en `data/calle` → `sedes[i].dip`, para la hoja de sede de Diseño). auditor-mapas APTO en los tres.
- **Plano más ligero:** las calles menores van como trazado por celdas de 1 km (`celdasCalles` en `build.mjs`). El fondo de «En la calle» es una capa aparte que se desliza al arrastrar y se repinta al parar (`moverFondo`/`fijarFondo` en `calle.js`). Mediana de 5 pasadas a 390 px, antes → después:
  - Sevilla, arrastre por cuadro: WebKit 160 → 32 ms; Chromium con la CPU 4× más lenta, 320 → 82 ms. Toque, Chromium 4×: 149 → 52 ms.
  - Sevilla, parón en Chromium 4×: 560 → ~430 ms. Lo que queda es el montaje general de la página (349 ms), antes de que lleguen los datos: es de Alojamiento.
  - Málaga, arrastre: WebKit 96 → 33 ms; Chromium 4×, 162 → 95 ms.
  - Scripts de medida (`medir.mjs`, `traza.mjs`) en el scratchpad de la sesión del 3-nov, con Playwright 1.55.
- **Colores del hábito:** `tools/colores-habito.mjs` lee `tools/sources/habitos-colores.json`, usa la primera sección y los nombres tal cual. Servitas de Málaga y La Resurrección de Cádiz llevan solo un tono neutro (`coln0`), sin «Hábito» en la ficha. No se toca `site.js`.
- **Revisión de uso de «En la calle» (Málaga primero):** la Pasión del 14-nov se ve bien. Avisado a coordinación de lo que no es de Portada:
  - Diseño (`site.css:1882`): en tableta con la ficha abierta, el reloj sube y tapa el medallón.
  - Diseño: la barra de la hora mide 28 px y debería tener 44.
  - erCuñao: a 390 px su botón tapa la esquina del plano.
- **Pendiente:**
  - **Decidido por Pablo (3-nov), literal: «No, primero se toca y luego sale el recorrido».** También en las jornadas de una sola cofradía (extraordinarias), el recorrido solo se dibuja al tocarla. No se cambia.
  - Opcional: aligerar los datos de las cofradías (472 KB en Sevilla).

- **Barra de abajo y cabecera de capital en móvil (4-nov, oc-diseno; fallos de la pasada integrada).** La barra marcaba «Hoy» en capitales, fichas y el plano; ahora «Hoy» solo en /hoy/ y lo que está dentro de «Más» (capitales, hermandades, bandas, marchas, calendario, el plano…) marca «Más», con su píldora. Toca el layout común. En la cabecera de capital (y /musica/ y bandas), hasta 859 px el texto deja libre el hueco de la colgadura, con la misma posición y ancho que ella (antes la entradilla y las cifras pasaban por debajo). **Descartado** el degradado bajo la colgadura: tapaba la foto de la capital. Prueba: `tools/diseno/probar-cabecera-barra.py` (360/390/768/1440).

## RETOMAR AQUÍ (5-nov, oc-diseno del sobremesa)
Cola en `EQUIPO/AUDITORIA-DISENO.md` → «Cola para el 4-nov» (carpeta principal). Estado:
- **Publicado con el sí de Pablo:** bandas y marchas (5faea1e), banda propia (3ec5d4b), nazareno, respaldo sin foto, barra y cabecera, imagineros (191a614..9c234d7), miniaturas del díptico y arreglos del auditor (9c234d7..25d4e55; e7c1ba6 ya auditado: NO APTO y luego APTO).
- **Publicado también (5-nov, con el sí de Pablo):** hoja de sede (punto 3), plano y En la calle sin iniciales, medallón neutro y arreglos de los auditores (153430b..8e074a9; APTO de auditor-diseno y auditor-mapas). La prueba de la hoja de sede no cerraba la hoja entre sedes (selector equivocado); corregida, da 400/400 contra pages.dev con los tres casos.
- **Publicado también (5-nov, con el sí de Pablo; última subida de esta tanda):** punto 4. Volver arriba en toda la web, reloj de En la calle de 44 px, crédito de OSM bajo la leyenda, erCuñao que se aparta del reloj, botones fijos al pie de la ficha de cofradía en el móvil y reloj acortado hasta el panel desde 600 px. APTO de auditor-diseno y auditor-mapas tras un NO APTO. Pruebas: `probar-arriba.py` 424/424 y `probar-hoja-sede.py` 400/400. **Orden de Pablo: parar aquí** hasta nuevo encargo.
- **Pendientes:**
  - La ficha nueva de la Soledad (Humildad) no tiene foto ni imagen para compartir propia: pasar `tools/diseno/og-respaldo.py`, solo si Pablo lo pide.
  - El díptico queda unos 11 px más bajo en las filas de capital e imagineros: subirlo al borde de arriba solo ahí.
  - En el 404, la barra marca «Más» (`masAqui` falso en el 404).
  - Observaciones de los auditores: un fondo tenue tras el crédito de OSM (se mezcla con las calles y la ruta); unificar «Ver la hermandad» (ficha de En la calle) y «Ver su ficha» (hoja de sede); con la ficha abierta desde 600 px, los botones de zoom quedan bajo el panel (ya pasaba antes).
- **Amparo (Sevilla, 8 nov):** es de gloria y no tiene ficha a propósito. En En la calle lleva el medallón neutro (`assets/naz/_neutro-<capital>.svg`), sin letra.

## Miniaturas del díptico y hoja de sede (4 y 5-nov, oc-diseno)
- **Díptico 3:2 en las miniaturas:** la caja sigue de 64×64 (40×40 en el buscador) y la foto entera va dentro, en 3:2 y centrada. *Descartado:* ensanchar la caja a 96 px. Se veía mejor la foto, pero el texto de esas tarjetas empezaba más a la derecha (columna desigual) y rompía la regla de Pulido (solo cambia la imagen, no la tarjeta).
- **Hoja de sede:** titulares arriba: díptico Cristo | Virgen; si no, una foto (juntos, Cristo o Virgen); sin ellas, la lámina del nazareno. Nunca la miniatura del punto ni la foto de la sede (es el templo, no la hermandad). En el móvil, a media altura (62dvh) con desplazamiento dentro; se cierra arrastrando la asa, como todas las hojas. *Descartado:* que la asa la estire hacia arriba (toca el código común de todas las hojas; con el desplazamiento dentro basta).
- **Plano y En la calle:** los puntos recortan la foto en un círculo, así que las hermandades sin foto guardada en la web llevan un medallón cuadrado (`assets/naz/<slug>-r.svg`) en vez de la lámina 3:2. Así plano.js y calle.js (de Portada) no cambian. Incluye las que solo tienen foto enlazada a Commons, que el plano no puede usar.
- **Imágenes para compartir:** `assets/naz/og.json` lista las hermandades sin ninguna foto. `og-respaldo.py` solo genera esas, porque ahora hay láminas también para las que tienen escudo o foto de la sede y no necesitan imagen propia.

## Volver arriba y reloj de En la calle (5-nov, oc-diseno)
- **Volver arriba:** botón redondo de 44 px (fondo de la web, flecha en el color principal y borde dorado de 2 px) que aparece pasadas dos pantallas; en las páginas cortas, pasado algo más de la mitad del recorrido. Va encima de erCuñao y, cuando erCuñao se esconde al bajar, ocupa su sitio; al subir, quedan los dos apilados. En «En la calle» (móvil) va a la derecha, sobre el reloj, porque erCuñao está a la izquierda. Nunca encima de un plano: si el plano está a su altura, se esconde. Sube con desplazamiento suave (de golpe con «reducir movimiento») y deja el foco en el contenido. *Descartado:* mostrarlo solo al subir (como erCuñao). Así no estorba al leer, pero quien llega al final tendría que subir un poco para encontrarlo. *Descartado también:* ponerlo abajo a la izquierda. No chocaba con nada, pero quedaba lejos del pulgar y separado de los otros botones flotantes.
- **Reloj de En la calle:** la barra de la hora pasa de 28 a 44 px para tocarla, sin crecer el reloj (márgenes negativos), y «Ahora» pasa de 40 a 44 px. erCuñao sube a 106 px sobre la barra de abajo (a 92 px rozaba el reloj). Como el reloj sube y baja con el final del plano, erCuñao además se aparta (se vuelve invisible) mientras el reloj o el crédito pasan por su sitio, y al bajar se esconde del todo tras la barra. En el móvil en horizontal el reloj deja de acompañar al desplazar (no es sticky), porque en 390 px de alto tapaba el plano, sus botones y la cofradía.
- **Crédito de OpenStreetMap:** va arriba a la izquierda, bajo la leyenda Ida/Regreso (arriba del todo si no hay leyenda). *Descartado:* dejarlo abajo y subirlo 48 px. El reloj es sticky y pasa por encima de cualquier punto del borde de abajo al desplazar, así que solo funcionaba en reposo.
- **Ficha de una cofradía abierta:** en el móvil, los botones (Cómo llegar, Apple Maps, Ver la hermandad) van fijos al pie de la hoja, como «Ver su ficha» en la hoja de sede. Desde 600 px (panel a la derecha), el reloj se acorta hasta el borde del panel; antes, en tableta, se iba fuera de la pantalla. Volver arriba se aparta mientras la ficha está abierta.
- **Volver arriba con «reducir movimiento»:** el desplazamiento y la pulsación usan `translate` y `scale`, no `transform`, porque la regla global `:active { transform: none !important }` lo movía 64 px al pulsarlo y el toque caía en lo de debajo. Prueba: `tools/diseno/probar-arriba.py`, con un toque real recién bajado y un recorrido de En la calle cada 60 px.

## (anterior) RETOMAR AQUÍ (4-nov, oc-diseno del sobremesa)
Cola en `EQUIPO/AUDITORIA-DISENO.md` → «Cola para el 4-nov» (carpeta principal, no este worktree). Estado:
- **Subidos:** bandas y marchas de la ficha (5faea1e) y banda propia (3ec5d4b).
- **Hechos en la rama, sin subir (piden el sí de Pablo; la barra toca el layout común: avisar a Coordinación antes):** nazareno pequeño (ba2f667, 75c82d8, 999bdfa: APTO a la 3.ª), respaldo sin foto (317ab6f + 4d03b00: 2.ª revisión en curso) y barra y cabecera (4bbaefa: en auditoría). Cuando estén los APTO: rebase, compilar, pedir el sí y subir los tres juntos (van en línea).
- **Pendientes, por orden:** 2c) miniaturas 3:2 del díptico `d-<slug>` en el listado y el buscador (también Hoy, Calendario y Favoritos), solo la proporción: las tarjetas son de «Pulido estético»; 3) hoja de sede con díptico desde `D.sedes[i].dip` (subido en 8bc2a8f), respaldo `assets/naz/<slug>.svg` sin foto y fondo opaco; comprobar el medallón en tableta (4ee0b1d), no rehacerlo; 4) Volver arriba (layout común: avisar a Coordinación antes de subir; no tapar el plano ni el crédito de OSM), reloj y barra de la hora de 44 px.
- Compilar sin pisar la web que audita otro: `DIST_DIR=dist-b node build.mjs` y servir con `DIST_DIR=dist-b PORT=8092 node serve.mjs` (dist-b está en `.git/info/exclude`).
- Textos fijos nuevos que afirmen algo: registrarlos en `tools/sources/textos-autor.json` (`node tools/comprobar-fuentes-textos.mjs`).

## (anterior) RETOMAR AQUÍ (3-nov, oc-diseno del sobremesa; encargos de hoy, orden de Coordinación)
Empiezan cuando Pablo diga «sigue». Cada bloque se sube por separado: rebase justo antes, auditor-diseno, 390/1440 en claro y oscuro, el sí de Pablo y aviso a Coordinación con el hash.
1. **Ficha de hermandad, bandas y marchas:** pocas (unas 3 bandas y 5 marchas). Primero su propia banda, las dedicadas a sus titulares y las que tienen grabación, solo con lo que digan los datos; si no, el orden actual. Enlace «Ver las N marchas» / «Ver todas las bandas» a una subpágina o a Marchas filtrada (lo que menos pese; si son subpáginas, avisar del total). Sin JS y sin perder nada en el buscador. Probar con la Aurora del Albaicín (Granada): Marketing la graba el 4-nov antes de las 17:00.
2. **Nazareno pequeño en la ficha:** SVG del nazareno de la portada (de Portada; avisar si hay que tocar el compartido), colores de `habitos-colores.json`, figura por sección si cambian, prenda sin color neutra o sin figura, contorno en oscuro, texto alternativo con los colores, movimiento nulo o sutil y apagado con prefers-reduced-motion. Entregar la lista de fichas sin color.
3. **Botón «Volver arriba» en toda la web:** aparece tras unas 2 pantallas, desplazamiento suave (salto directo con movimiento reducido), colores y borde dorado de la web, 44 px o más, aria-label «Volver arriba», foco visible; sin chocar con la barra de abajo ni con erCuñao. Toca la plantilla común: avisar a Coordinación antes de subir.
4. **Hoja de sede del plano «En la calle»** (`site.js`, `fichaHerm`; cuidado con `apply`, que cambió Alojamiento): media altura, arrastrable, datos compactos (hermandad, día, salida, recogida si existe, hábito con muestras, «Ver su ficha», «Cómo llegar»). Qué foto va y su encuadre lo decide la sesión de Imágenes: aquí solo la hoja y el respaldo sin foto (nazareno o escudo). Si hace falta un campo de encuadre, pedírselo a Coordinación.
   - **Campos fijados por Imágenes (3-nov):** cada foto del díptico (`h.diptico.cristo|virgen|juntos`, de `data/imagenes.json → titulares`) trae `foco` (object-position; si falta, `50% 22%`). En el plano (formato final, Portada bdd37da, aún sin subir): `D.sedes[i].dip = {c?, v?, j?}`, cada uno `{src: '/assets/img/t-<slug>-<tipo>-480.webp', foco?, alt, credito, url}` (`url` vacía: crédito sin enlace). Con c y v, díptico; si no, j, c o v a todo el ancho; sin `dip`, el respaldo. **No subir la hoja antes que bdd37da**: tras el rebase, comprobar que `D.sedes[i].dip` existe. Probar antes con datos de ejemplo locales que no se suban. **Nunca `img` ni `diptico.sede` como titular** (pueden ser sayón o templo). En la ficha el `foco` va en línea en el `<img>`: no fijar object-position en CSS que lo pise.

## 4-nov · Orden de las 5 marchas de la ficha de hermandad (Alojamiento, en la zona de Diseño)
- **Qué:**
  - Primero van las marchas «destacadas» a mano en `site/data/marchas-destacadas.json` (elección editorial).
  - Después, las dedicadas a un titular concreto (`titularDed`), las que toca su propia banda y las que tienen grabación.
  - Antes iba primero la banda propia, luego el titular y luego la grabación.
- **Por qué:** en la ficha de la Aurora (Granada) no salía «Y amaneció en tu Albayzín», la marcha del vídeo de Marketing. La hermandad tiene 42 dedicadas y en los datos solo «Lucero del Albayzín» indica titular, así que ninguna regla automática la subía. Pablo: «claro, hay que arreglarlo».
- **Descartado:** deducir el titular del texto de la dedicatoria. Ese texto casi siempre es el nombre completo de la hermandad, que ya incluye a todos sus titulares, así que no distingue nada.
- **Efecto:** cambian 4 de 284 fichas: la Aurora, y Humildad, Pasión y Penas de Málaga, donde suben las dedicadas a un titular.
- **Diseño:** el cambio está en `pageHerm` (`peso`, `criterios`, `destacar`) y en la constante `DESTACADAS`, justo encima. Hay que hacer rebase.

## 5-nov · Fotos de medios que no responden nunca en Noticias (Alojamiento)
- **Problema:** el run 41977361510 falló porque /noticias/ no llegó a «load» en 45 s. La causa: si el servidor de un medio no contesta, la foto destacada (no es perezosa) deja la página «cargando» para siempre. La página se ve y se puede usar (medido: LCP igual, 44 enlaces), pero el navegador no termina nunca.
- **Medido en la web publicada:**

  | | DCL | LCP | load |
  |---|---|---|---|
  | 390 px, 4G lento y CPU 4× | ~4,0 s | 2,6–3,6 s | 4,5–5,1 s |
  | 1440 px | 0,3–0,45 s | 0,46–0,8 s | 0,34–0,47 s |

  Hay 3 peticiones externas, que suman 513 KB. La más lenta es la destacada de s2.ppllstatics.com, con 2,5–2,8 s en 4G lento.
- **Elegido:** en `site.js`, junto a `dropImg`, si a los 20 s la página aún no ha terminado de cargar, se cortan las fotos de medios que siguen a medias y que de verdad frenan la carga: la destacada y las perezosas a menos de 1250 px de la pantalla. La noticia se queda con texto.
- **Resultado en Chrome:**
  - con los medios colgados, «load» llega a los 20 s y solo se quita la destacada;
  - con fotos que tardan 12 s, no se quita nada.
- **Lo que se acepta:** en una conexión lentísima, donde la foto tarda más de 20 s, la destacada se quita y la tarjeta da un salto. Es mejor que dejar la página cargando sin fin.
- **Límite:** en WebKit (Safari), quitar la foto no libera «load»; la petición colgada sigue frenándolo. Allí no es peor que antes.
- **Descartado:**
  - Cortar todas las fotos sin terminar a 2500 px: el auditor vio que se llevaba hasta 6 perezosas que ni se habían pedido.
  - Cambiar la prueba de humo a domcontentloaded: escondería una lentitud propia. Queda como mejora opcional que la prueba aborte al instante las imágenes de otros dominios.

## 5-nov · Ajustes de Cloudflare (Alojamiento, con el sí de Pablo: «Los 4»)
- **Detalle completo y cómo deshacer cada cambio:** `EQUIPO/CLOUDFLARE-AUDITORIA.md`.
- **Aplicado:**
  - Tiered Cache Smart Topology: para deshacerlo, `value: off`.
  - Informes de DMARC de Cloudflare: añaden `rua` y mantienen `p=none`; el correo no cambia.
- **No aplicado** (la caché de datos se queda así por decisión de Pablo, 5-nov: «Déjalo así»):
  - Crawler Hints: la API no deja con este acceso (405). Lo tiene que activar Pablo en el panel.
  - Caché de datos.ochocapitales.com: auditor-web dio NO APTO porque el CORS va por origen y la caché de Cloudflare no separa por origen, así que podría bloquear news.json o dejar noticias atrasadas. Si se hace, antes hay que poner `Access-Control-Allow-Origin: *` con una regla de cabeceras.
- **Descartado:** meter el origen en la clave de caché. Probablemente es de pago y lo complica.
- **Ojo:** nunca activar «ignorar query string» en esa caché. El vigía pide `news.json?c=…` para saltársela.

## 2026-11-11 · Lanzamiento: tanda «antes de abrir» (sesión Lanzamiento)
- **Fotos de las obras en las páginas de imaginero** (`obraCard` en `site/build.mjs`): cada obra lleva la foto de **su** talla, solo cuando el nombre de la obra coincide con el del titular fotografiado en `imagenes.json` (Cristo, Virgen o foto del conjunto con ese mismo nombre, ya sin las fotos retiradas). Si no coincide, la lámina del nazareno con los colores de su hermandad. Resultado: de 482 obras, 331 con foto de su talla y 151 con el nazareno; ninguna con la foto de otra talla.
  - **Descartado:** emparejar por parecido de nombre (p. ej. «Santísimo Cristo de la Sangre» con «Cristo de la Sangre»): daba más fotos pero con riesgo de poner la de otra talla; mandó lo que pidió Pablo, nunca la foto de otra talla.
  - Ojo: el medallón del nazareno (`assets/naz/<hermandad>-r.svg`) solo se escribía para hermandades sin foto; ahora también para las que salen con nazareno en una obra (`NAZ_OBRAS`). Sin eso, las obras de hermandades con foto salían con la imagen rota.
- **erCuñao en «En la calle»:** mientras está en la columna de controles del plano, se mete dentro del plano con `position: absolute` (relativo al plano) y se mueve con él sin JS ni fotograma de retraso. Fuera de la columna vuelve a su sitio fijo de siempre (un marcador `<!--cunao-->` recuerda dónde estaba). Comprobado a 1080 y a 390 px: el hueco con el último control es de 8 px en cada fotograma, y a los 0,9 y 1,9 s de cargar no hay salto.
  - **Descartado:** recolocarlo sin `requestAnimationFrame` y con `position: fixed`: con desplazamiento en el hilo del compositor seguiría un fotograma por detrás.
- **Créditos de imágenes:** el pie, `/acerca/` y el aviso legal dicen ahora que las imágenes son de Wikimedia Commons, de las propias hermandades, de sus agrupaciones y consejos, y de fotógrafos que han cedido su uso; cada foto lleva su autor. Las fichas sin foto dicen «Todavía no tenemos una foto de sus titulares».
- **erCuñao, arreglo del auditor (11-nov):** `site/assets/site.js` medía el botón con `offsetLeft/offsetTop` y lo apartaba del reloj; dentro del plano esos valores son relativos al plano y, en móviles pequeños (360×640, 320×568), el botón quedaba invisible y sin poder pulsarse entre 288 y 360 px de desplazamiento. Ahora, mientras es control del plano (`is-control`), no se aparta (ya lo coloca `cunao-ui.js`). Comprobado a 360 y 320 px con un barrido de 0 a 420 px: 0 fallos.
- **Aparte, no tocado:** la página Colabora aún pide «fotos con licencia libre» (es lo que pedimos a quien colabora, no un crédito); y la foto de la Virgen de la Agonía de Córdoba (`Virgen_Salud_y_Consuelo_Córdoba.jpg`) tiene una ficha de Commons que habla de la hermandad de la Conversión: para auditor-imagenes.

## 2026-11-11 · Portada: salida extraordinaria en lugar de la cuenta atrás (sesión Lanzamiento)
- **Qué hace:** si hay una salida de `tools/sources/itinerarios-extraordinarios.json` en los próximos días, la portada enseña, debajo de «Toca una bandera y baja a su calle» y en lugar de «Faltan N días…», una línea («Mañana» / «Hoy» / «Ahora en la calle» · «Pasión extraordinaria en Málaga» · hora) y un botón fino «Seguirla en el plano ›» que abre `/en-la-calle/<capital>/?dia=<jornada>` con su pestaña. Vale para cualquier salida de ese archivo (no celebrada, con hora de salida y con plano de su ciudad), como mucho de dentro de 8 días.
- **Cómo:** la página sigue siendo estática. `build.mjs` mete la lista (`OCX`) en el `<head>` y un script pequeño calcula con la hora de Madrid en el navegador (`Intl`, `Europe/Madrid`) qué toca: víspera, ese día antes de salir, en la calle (entre la hora de salida y la de entrada; si cruza la medianoche, hasta esa hora del día siguiente) o nada, y al día siguiente desaparece sola. Otro script, justo después del hueco, pinta la línea antes del primer fotograma.
- **La entrada (globo) sale siempre**, también ese día (Pablo, 11-nov: «el globo debe salir siempre»); la línea se ve al acabar. Lo que se hizo primero (saltar el globo ese día) se descartó. **El saludo «¿Qué sale hoy?» de erCuñao** también se queda (Pablo): ahora espera a que acabe el globo (antes se gastaba detrás de él), baja 4 px con la línea a la vista y solo se esconde en pantallas de menos de 341 px de ancho o 601 de alto, donde no cabe sin tapar el botón (a partir de 360×640 no hay choque).
- **Descartado (Pablo, 11-nov: «esto es horrible, lo quitas ya»):** una franja grande de terciopelo con galón y botón dorado grande sobre el mapa. Se maquetaron cuatro opciones más discretas (cinta de una línea, línea sustituyendo la cuenta atrás, píldora sobre las banderas y banda de dos líneas) y Pablo eligió la B.
- **Comprobado con `page.clock`** (13-nov 20:00, 14-nov 10:00 y 18:30, 15-nov 10:00) a 390 y 1440 px (y 320 px): textos y botón correctos, sin globo mientras toca, el 15 vuelve la cuenta atrás y el globo; todo centrado en 320, 390, 768, 1100, 1440 y 1920 px; el botón abre el plano con la pestaña «14 nov · Pasión».

## 2026-11-11 · Cabecera de Sevilla: sin el 71 repetido (sesión Lanzamiento)
- Pablo vio en su iPhone el «71» dos veces en la cabecera de Sevilla (el lema empezaba por «71 hermandades,» y debajo la línea dorada daba «71 hermandades (11 de Vísperas) · 11 jornadas»). Decidió (11-nov, entre dos opciones): **quitar el 71 del lema** y dejar todo lo demás como estaba. El lema de Sevilla empieza ahora por «Pasos a costal y la Madrugá, con la Catedral como estación de penitencia desde el sínodo de 1604.» (cambio en `tools/build-data.js` y `portal-cofrade/data/portal.json`); su fuente (Consejo y Wikipedia) sigue valiendo para lo que queda. Las otras siete capitales no repetían la cifra y no cambian.
- **Descartado (antes de esa decisión):** reorganizar la cabecera de las 8 capitales (lema como primer párrafo del contenido, línea dorada corta sin las vísperas). Pablo prefirió el cambio mínimo.

## 2026-11-16 · Marchas ligadas a una hermandad que no es la suya (Marchas y base de datos)
- **Causa:** la ficha de Cofradías y Hermandades (cyh) da por separado la imagen y el nombre oficial de su hermandad, pero se leían como un solo texto. Las palabras se mezclaban: «Esperanza, Reina de los Mártires» (imagen) + «Cautivo en su Soledad» (Hermandad del Juncal) casaban con «Virgen de la Esperanza en su Soledad», de Bendición y Esperanza; «Dulce Nombre de Jesús Nazareno del Paso» casaba con el Dulce Nombre de Málaga, y no con la Esperanza. Además, solo se guardaba la primera imagen y la ciudad salía del listado, no de la ficha (Soledad de San Pablo: la primera imagen es de Zaragoza).
- **Elegido:** la hermandad sale solo del nombre oficial que da cyh (`hermandadCyh` en `tools/unificar-marchas.mjs`). El orden es este:
  1. La tabla revisada a mano, `tools/sources/cyh-hermandades.json` (120 nombres; 63 son de hermandades que no tenemos y no ligan; Desamparados de Málaga, confirmado por Pablo el 16-nov: el grupo parroquial de Santa María Goretti).
  2. El nombre oficial del portal casi igual (Dice ≥ 0,75).
  3. Los titulares del portal (≥ 75 % de las palabras y una frase específica).
  4. Si nada de eso resuelve, sin ligar y anotada en el informe (`cyh_sin_casar`).
  La imagen solo decide el titular, y entre dos fichas del portal con el mismo nombre oficial: Columna/Resurrección de Cádiz y Cañilla/Soledad/Facundillos de Granada (las tres fichas tienen el mismo nombre oficial; el Dulce Nombre va a los Facundillos) y la Vera Cruz de Jaén (los Civiles / el Huerto). El nombre oficial del portal se compara sin su paréntesis final («(sección del Domingo de Ramos)»). **Si la ficha no trae imagen, va a la primera de la lista de la tabla**, que es la ficha principal: la Humildad de Granada va a la Cañilla. Una ciudad que no es de las ocho nunca liga.
- **Varias imágenes:** `importar-marchas-cyh.mjs --fichas-todas` vuelve a leer las fichas y guarda todas las imágenes, cada una con su hermandad (se emparejan por el número del enlace de la imagen y el del emblema). Si son dos imágenes de dos ciudades, liga la nuestra con su titular. Si son dos de la misma hermandad, se guardan los dos titulares («A y B»), porque la ficha dedica la marcha a los dos.
- **Palabras cortas:** «la O», «la Fe» y «San Juan Evangelista» se apuntan como una sola palabra solo con la frase entera, así que una «o» o una «fe» sueltas no casan. San Juan Evangelista cuenta como advocación corriente.
- **Alcance, para que el bloque solo corrija:**
  - Una marcha no gana un enlace que con la lectura de antes no tenía. Esas se apuntan en el informe (`cyh_ganarian`) para otro bloque. La excepción son las que solo fallaban por «la O» / «la Fe», que es el punto 5 del encargo.
  - Un enlace publicado que solo se apoyaba en cyh no se repone si la misma ficha, leída bien, dice que es de otra hermandad. Es su propia fuente la que lo desmiente, no una fuente nueva que choca con lo publicado (orden del 27-oct).
  - Si esa marcha solo estaba por cyh, su ficha se queda publicada sin ligar, para que su dirección no se pierda.
- **Glorias y patronas que aún no tenemos (Pablo, 16-nov: «indicarlo igualmente y, cuando las metamos, enlazar»):**
  - La marcha muestra igualmente a quién está dedicada: la ficha de la marcha enseña el texto de cyh aunque no esté ligada. Son 120 marchas.
  - Cuando una de esas hermandades entre en el portal, su nombre de cyh pasa de `null` al slug nuevo en `cyh-hermandades.json`. Si no estaba en la tabla, la regla del nombre oficial la casa sola. Después se regenera y sus marchas quedan ligadas.
  - Para encontrarlas: los `null` de la tabla y la lista `cyh_sin_casar` del informe.
- **Casos sueltos:**
  - `esperanza-pedro-morales` se queda sin ligar, como estaba publicada, mediante una revisión «retirar». Dos fuentes la llevan a Córdoba (cyh mm=910897 y Patrimonio Musical) y otras dos a Málaga (cyh mm=910882 y el foro), y las dos fichas de cyh dan años distintos.
  - `comprobar-marchas.mjs` acepta un titular doble «A y B» si los dos son titulares de esa hermandad.
  - Al reponer un enlace publicado (7a2), la ciudad de la marcha es la de la hermandad.
- **Segunda vuelta (auditoría de coordinación a 258e5bf5, 16-nov):**
  - **La regeneración es idempotente.** Las marchas publicadas que ya no salen vuelven en el orden en que estaban publicadas, también las que están sin ligar. Si la misma obra sigue viva con otra dirección, la publicada redirige a ella. Dos pasadas seguidas dan el mismo `marchas.json`. `comprobar-marchas` da error si una ficha publicada en origin/main desaparece sin redirigir a la misma obra (redirigir al listado no vale).
  - **Cuando la ficha de cyh desmiente un enlace publicado**, no se repone aunque también lo apoye Patrimonio Musical, porque PM solo casaba por las palabras de su texto («Hdad. gloriosa de los Desamparados, Cádiz» no es Jesús Caído). Si lo apoya otra fuente (catálogo, revisión u oficial), el enlace se queda y se anota la discrepancia. En un enlace nuevo, la hermandad que cyh desmiente se descarta también cuando casan varias, y queda la de cyh («Jesús orando en el huerto» pasa a la Vera Cruz y Oración).
  - **Titulares por imagen:** la imagen se parte por « y » o «, » delante de otro titular («Santísimo Cristo del Amor y Santísima Virgen de los Dolores»). Si un trozo de tres palabras o más es el principio de un solo titular del portal del mismo género, ese es el titular: «Santísimo Cristo de la Victoria» → «… Victoria Despojado». La anotación entre paréntesis del portal, como «(misterio)», no cuenta para casar. Con tres titulares se escribe «A, B y C», y `comprobar-marchas` lo acepta (cada titular una vez y sin « y » colgando).
  - **Imagen de cyh sin hermandad emparejada:** su ciudad sale del final de su nombre, no del listado. Si no la dice, o no es la capital del listado, no liga.
  - **Sin ligar, el texto de una ficha de cyh nombra todas sus imágenes o hermandades** («En Triana»: la Estrella y el Cachorro).
  - **`unificar-marchas` se para si faltan `auditoria/patrimonio-marchas.json` o `auditoria/cyh-marchas.json`** (no están en git), salvo con `--sin-pm` o `SIN_CYH=1`.
  - **Revisiones a mano:**
    - «Costaleros del Abuelo» se queda con «El Abuelo» (Patrimonio Musical y el título) y la ficha de cyh (los Dolores) queda como discrepancia.
    - «En tu Sentencia (Macarena)» queda ligada a la Macarena con titular «Nuestro Padre Jesús de la Sentencia». Su ficha de cyh (mm=904826) da el nombre oficial del Baratillo, pero la imagen y el título son de la Macarena. Lo decidió Pablo el 16-nov; el nombre del Baratillo queda anotado como discrepancia.
    - «Jesús orando en el huerto» queda confirmada en la Vera Cruz y Oración con Patrimonio Musical.
    - La nota de «Esperanza» de Pedro Morales dice ahora lo que es: dos obras distintas fundidas en un registro (1997, Málaga; 2008, Córdoba). Separarlas va en el bloque siguiente.
- **Descartado:**
  - Una regla solo por cobertura de palabras: los nombres oficiales largos nombran titulares de gloria que el portal no tiene, y fallaba en las dos direcciones.
  - Arreglar caso a caso en `marchas-revision.json`: eran cientos y volverían a salir mal en cada regeneración.
  - Dar de alta ya las marchas que ahora ligarían: son contenido nuevo y van aparte.
