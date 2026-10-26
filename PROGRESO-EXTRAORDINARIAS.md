# PROGRESO-EXTRAORDINARIAS · salidas extraordinarias, magnas y coronaciones (26-oct-2026 → Cuaresma 2027)

_Órdenes: `EQUIPO/ORDEN-rutas.md` (rutas-malaga · 2). Solo con fuente. Con itinerario → `tools/sources/itinerarios-extraordinarios.json` y plano («En la calle»); sin itinerario → agenda verificada (`portal-cofrade/data/eventos.json`)._

**Estado (2026-10-26):**
- Revisadas las 8 capitales. Dos subagentes buscaron en prensa cofrade y local, y yo comprobé en su fuente cada itinerario que se ha cargado.
- 5 salidas con recorrido trazado (método nuevo: `tools/itinerarios/rutas/extraordinarias.mjs <capital>`) y 4 en la agenda sin recorrido.

## Con itinerario (trazadas)
| Fecha | Capital | Salida | Horas de la fuente | Fuente | En el plano |
|---|---|---|---|---|---|
| 1-nov | Granada | Santa Cena, centenario fundacional. Sale de la Catedral y se recoge en Santa Cruz la Real | solo la salida, 17:00 | [Granada es Noticia, 26-oct](https://www.granadaesnoticia.com/provincia/la-santa-cena-recorrera-granada-en-una-salida-extraordinaria-por-su-centenario-fundacional) | **No**: el plano necesita dos horas (pedido a oc-portada) |
| 7-nov | Málaga | Santo Traslado, 75 aniversario. Circuito desde la Casa Hermandad (Trinidad 72) | solo la salida, 17:00 | Cartel oficial, [Instagram @soledaddesanpablo](https://www.instagram.com/soledaddesanpablo/) | **No**: el mismo motivo |
| 8-nov | Sevilla | Coronación canónica de la Virgen del Amparo: procesión de alabanzas desde la Magdalena | salida 17:00 y entrada 22:45 | [101TV, 19-oct](https://www.101tv.es/sevilla-semana-santa/horarios-recorridos-y-bandas-de-la-procesion-de-la-virgen-del-amparo-de-la-magdalena-con-motivo-de-su-coronacion-canonica). Coincide con Viva Sevilla (6-oct) | **No**: la hermandad (de gloria) no tiene ficha en el portal (pedido a oc-portada) |
| 14-nov | Málaga | Pasión, 50 aniversario de la bendición, con acto eucarístico en San Juan | 6 horas | Cartel oficial, Instagram @archipasionmlg | Sí |

**Contradicción resuelta en el Santo Traslado:** 101TV (2-oct) decía 19:00 desde la parroquia de San Pablo. El cartel oficial de la hermandad, posterior, dice 17:00 desde la Casa Hermandad. Manda el cartel, y la agenda ya está corregida.

## Sin itinerario todavía (en la agenda)
| Fecha | Capital | Salida | Fuente | Qué falta |
|---|---|---|---|---|
| 14-nov, 19:30 | Almería | Señor de las Penas (Rosario del Mar), 25 aniversario, desde el Santuario de la Virgen del Mar | [La Voz de Almería](https://www.lavozdealmeria.com/vivir/el-contador-cofrade/641458/procesion-extraordinaria-celebrar-25-aniversario-penas-rosario-mar.html), CofradíasTV | Itinerario |
| 21 y 22-nov | Sevilla | San Esteban, centenario: traslado a la Catedral y regreso procesional | [101TV](https://www.101tv.es/sevilla-semana-santa/estas-son-las-salidas-extraordinarias-que-se-celebraran-en-sevilla-en-lo-que-resta-de-2026/) | Horas e itinerario |
| 28-nov, 9:00 | Granada | Traslados de regreso de la exposición «Kerygma» a sus templos | [Gente de Paz, 22-oct](https://www.gentedepaz.es/granada-fija-el-28-de-noviembre-a-la-9-de-la-manana-los-traslados-de-las-imagenes-que-participan-en-la-exposicion-kerygma) | Fecha (pendiente de la Junta Electoral; si no, el 5-dic) y recorridos |

## Descartadas
- **Córdoba, «María Auxiliadora, 1-dic»:** solo aparece en un agregador, sin hermandad ni fuente.
- **Granada, traslado de la Santa Cena del 29-oct** (de Santa Cruz la Real a la Catedral): solo se conocen el origen y el destino.
- **Cádiz, Huelva y Jaén:** nada en el periodo. Lo de septiembre y octubre ya pasó, y lo de 2027 cae después de la Cuaresma.

## Pendientes
- **oc-portada:**
  - Mostrar en el plano las salidas con una sola hora: recorrido y salida, sin posición del cortejo.
  - Mostrar las de hermandades sin ficha (el Amparo; nombre en `nombre_hermandad`).
- **Volver a mirar en noviembre:** los itinerarios de Rosario del Mar, San Esteban y Kerygma.
- **Con un solo tramo:** el Amparo, la Santa Cena y el Santo Traslado. La fuente no separa ida y regreso.
