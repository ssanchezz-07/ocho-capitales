# Plan · revisión completa de las marchas (sesión `revision-marchas`, 4-nov-2026)

Encargo: `EQUIPO/ORDEN-REVISION-MARCHAS.md`. Rama `revision-marchas`, worktree `.claude/worktrees/revision-marchas`, creada desde `origin/main` (`ce1607a`).
**Estado: preparada, SIN EMPEZAR.** No se abre Chrome, no se lanzan agentes y no se tocan datos hasta que Pablo escriba «empieza» en el chat de esta sesión.

## Punto de partida (medido el 4-nov, solo lectura, sobre `origin/main`)
- 10.098 marchas en `tools/sources/marchas.json`.
  - Por capital: Sevilla 2.433, Málaga 1.162, Granada 623, Huelva 436, Córdoba 389, Jaén 327, Cádiz 323, Almería 194, y 4.211 sin capital.
  - Con vídeo: 6.432.
  - Con URL de fuente: cyh 5.730, Patrimonio Musical 4.090, Marchas de Procesión 7.192 (ficha propia en 6.341), foro 319, Wikipedia 236, BNE 120, fgr 223.
- 7.350 marchas tienen dedicatoria.
  - De ellas, 5.326 están enlazadas a una hermandad.
  - De esas 5.326, **4.444 no tienen la imagen (`titular`) rellena**: por eso la web pone solo «Dulce Nombre» y no la imagen.
- **El caso de Escámez, confirmado:**
  - «La Virgen de la Esperanza» está enlazada a `dulce-nombre-malaga`, que es la Hdad. de la Soledad, Negaciones y Lágrimas de San Pedro y **María Santísima del Dulce Nombre**.
  - Su texto de cyh nombra la «Pontificia y Real Archicofradía del Dulce Nombre de Jesús Nazareno del Paso y María Santísima de la Esperanza», que es `esperanza-malaga`.
  - El enlace se hizo por «Dulce Nombre», que es el nombre corto de otra hermandad de la misma ciudad.
- **Dependencia:** el bloque A de duplicados (`marchas-campana`, commits `135c4e9` y `03aa152`) sigue sin subir y espera el sí de Pablo. Si se revisa sobre `main` sin él, los dos bloques chocarán en `marchas.json`. Ver la fase 0.

## Fases

### Fase 0 · Base limpia (≈ 30 min)
- Si Pablo da el sí, se sube antes el bloque A de duplicados y se rebasa esta rama encima. Si no, esta rama sale de `marchas-campana`.
- Se copia `auditoria/` (las cachés `cyh-marchas.json`, `patrimonio-marchas.json` y `marchas-806.json`) desde `marchas-campana`. No se vuelve a descargar nada que ya esté.
- Se consulta `get_usage`, el tablón y el plan de consumo. **Ojo:** hoy el tablón dice que solo trabajan fotos y marketing, así que el «empieza» de Pablo vale también como excepción a eso.

### Fase 1 · Medir y arreglar el fallo de enlace de las dedicatorias (≈ 1 tarde)
Se hace por programa, con un script nuevo de solo lectura, `tools/medir-dedicatorias.mjs`, sobre las 5.326 enlazadas.

Para cada marcha, el script compara el texto de la fuente (`dedicatoria.texto` y la ficha cyh o pm en caché) con **todas** las hermandades del portal, no solo con la enlazada. Mira cuatro cosas:
1. **Nombre oficial completo:** solapamiento de palabras con `nombre_oficial`, sin «hermandad», «cofradía», «de», «y», etc. No vale que coincida solo el principio ni el nombre corto.
2. **Imagen:** si la advocación que nombra el texto («Esperanza Coronada», «Cristo de la Expiración»…) es titular de la hermandad enlazada (`titulares` del portal).
3. **Ciudad:** la localidad de la fuente frente a la ciudad de la hermandad.
4. **Mejor candidata:** si otra hermandad puntúa más que la enlazada.

Cada marcha sale con uno de estos veredictos:
- **OK:** la enlazada es la mejor y la imagen es suya.
- **MAL ENLAZADA:** otra hermandad gana con claridad, como en el caso de Escámez.
- **DUDOSA:** empate, imagen sin identificar o ciudad distinta.
- **SIN TEXTO:** enlazada sin texto de fuente (315 casos). Se revisa contra la URL.

**Prueba de que el método funciona:** antes de fiarse de la cifra, el caso de Escámez tiene que salir como MAL ENLAZADA con `esperanza-malaga` como candidata. Además se cogen 30 OK al azar y se cotejan a mano.

**Salida:** `auditoria/dedicatorias-medida.json` y un resumen para Pablo: cuántas están mal, por capital, y los 10 primeros ejemplos.

**Arreglo:**
- La regla de enlace de `unificar-marchas.mjs` (`mejorHermandad`/`clasifica`) pasa a basarse en el nombre completo y la imagen. Un nombre corto que es a la vez nombre de otra hermandad de la misma ciudad no basta.
- Se rellena `titular` cuando el texto nombra una imagen que es titular de la hermandad. Así salen las 4.444 sin imagen.
- Las MAL ENLAZADAS se corrigen solo si la fuente nombra la buena sin dudas. Las DUDOSAS van a la lista de Pablo.
- **Mostrar la imagen en la web** («Dedicada a María Santísima de la Esperanza Coronada · Esperanza (Málaga)») es de la plantilla de marchas, que es de `oc-diseno`. Se le pide por orden escrita, o se hace con su visto bueno.

### Fase 2 · Revisión una a una de las 10.098 (≈ 8-10 tardes)
Se trabaja en dos pasos por lote.
- **a) Cotejo automático:** cada campo de cada marcha se compara con su fuente en caché (cyh, pm, mdp). Salen las coincidencias y una lista de diferencias.
- **b) Revisión con subagentes:** revisan contra la fuente abierta solo las fichas con alguna diferencia o con una única fuente débil (foro o Wikipedia), más un 5 % al azar de las que coinciden.
  - Como mucho 2 subagentes a la vez, en Sonnet y con la plantilla de abajo.
  - Chrome solo cuando la fuente no esté en caché.

### Fase 3 · Marchas que faltan, desde los canales oficiales de YouTube (≈ 5-7 tardes)
- Se empieza por las 5 bandas ya extraídas en `marchas-campana`: Cigarreras, Rosario de Cádiz, Pasión de Linares, El Carmen y Paso y Esperanza.
  - Lo ligado son 213 marchas: se revisan a mano y se cargan.
  - Lo que queda «para revisar» son 701 vídeos: solo entra lo que tenga título y compositor claros.
- Después, el resto de bandas de `portal.json`, de una en una:
  - Se confirma en Chrome que el canal es oficial (enlazado desde la web o las redes de la banda). La prueba va a `canales-bandas.json`.
  - Se sacan los metadatos con `yt-dlp`, sin descargar vídeos.
  - Se cruzan los títulos con la base. Si la marcha existe, se añade la banda a «La toca» con el vídeo como fuente. Si no existe, es una alta nueva con fuente. Lo dudoso va a la lista.
  - Fuera los ensayos, los conciertos enteros y las procesiones sin título.
- Chrome se abre solo en esta fase y en la 2b. Si hace falta iniciar sesión, se espera a Pablo; la sesión no escribe contraseñas.
- Se vigila el límite de 20.000 archivos (hoy hay unos 14.000). Se avisa antes de pasar de 18.000.

### Fase 4 · Que no vuelva a pasar (≈ 1 tarde)
`tools/comprobar-marchas.mjs` gana estas comprobaciones:
- dedicatoria con imagen y hermandad coherentes, y la mejor candidata igual a la enlazada;
- compositor escrito de varias formas (lev ≤ 2 tras normalizar);
- año fuera de rango (antes de 1850 o después del año en curso);
- formación incoherente con la banda que la toca;
- bandas con dos fichas en la misma localidad (lo pendiente de `marchas-campana`).

Todas las anteriores tienen que salir sin errores.

## Plantilla de revisión de cada marcha (la misma para todos los subagentes)
```
slug: <slug>                    lote: <id>         fuente abierta: <URL cyh / pm / mdp / vídeo>
| campo       | en la base            | en la fuente           | veredicto                     |
| título      | …                     | …                      | OK / CORREGIR / DUDA          |  (tildes, ¡!, mayúsculas)
| compositor  | …                     | …                      | OK / CORREGIR / DUDA          |  (nombre completo)
| año         | …                     | …                      | OK / CORREGIR / DUDA / FALTA  |
| formación   | …                     | …                      | OK / CORREGIR / DUDA          |  (adaptación = versión, no ficha nueva)
| dedicatoria | imagen · hermandad · ciudad | texto literal de la fuente | OK / MAL ENLAZADA / DUDA / FALTA |
| grabación   | vídeo actual          | ¿abre? ¿es esa marcha? ¿canal oficial? | OK / QUITAR / FALTA   |
cambio propuesto: <campo → valor nuevo, con URL>   ·   lista de Pablo: <solo si las fuentes se contradicen>
```

Reglas:
- Sin URL no hay cambio. Si dos fuentes se contradicen, la ficha no se toca y el caso va a `LISTA-PABLO-MARCHAS.md`.
- Los subagentes devuelven JSON con este esquema. Solo esta sesión escribe en `marchas.json`, a través del unificador, nunca a mano.

## Lotes (unos 500 por lote; cada uno se cierra con `auditor-datos`, que coteja 50 al azar)

| Lote | Contenido | Marchas |
|---|---|---|
| L1 | Málaga (empieza por aquí, por el caso de Escámez) | 1.162 (2 sublotes) |
| L2-L6 | Sevilla | 2.433 (5 sublotes) |
| L7 | Granada | 623 |
| L8 | Huelva | 436 |
| L9 | Córdoba | 389 |
| L10 | Jaén | 327 |
| L11 | Cádiz | 323 |
| L12 | Almería | 194 |
| L13-L21 | Sin capital, por orden alfabético del título | 4.211 (9 sublotes) |

Al cerrar cada lote:
- commit;
- el «RETOMAR AQUÍ» de `PROGRESO-REVISION-MARCHAS.md` al día;
- aviso a coordinación;
- y, si Pablo da el sí, subida: rebase, unificador, build, `comprobar-marchas` y `comprobar-origen` con 0 errores, el buscador en verde, la red de seguridad en verde y `git push origin HEAD:main`.

## Duración y consumo estimados
| Fase | Tiempo | Consumo |
|---|---|---|
| 0 · Base limpia | 30 min | mínimo |
| 1 · Enlace de dedicatorias | 1 tarde | ~1-2 % semanal |
| 2 · Revisión de 10.098 | 8-10 tardes (2-3 lotes por tarde) | ~1-1,5 % por lote |
| 3 · YouTube | 5-7 tardes, según cuántas bandas tengan canal oficial | ~1 % por tarde |
| 4 · Comprobaciones | 1 tarde | ~1 % |

**Total: unas 3 semanas de tardes**, dentro del plan de consumo.
- Como mucho 2 subagentes a la vez.
- Se para si el límite de 5 horas pasa del 85 %.
- Cuando la sesión pase del 40 % de contexto, se escribe el «RETOMAR AQUÍ» y se sigue en una sesión nueva.
- Las fases 1 y 4 son lo urgente, porque cortan el fallo de raíz. La 2 y la 3 pueden seguir después del lanzamiento del 14-nov.
