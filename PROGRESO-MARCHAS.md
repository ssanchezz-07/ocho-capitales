# Progreso · marchas (sesión especializada, desde 2026-10-25)

Orden de Pablo: importar y verificar todas las marchas de las 8 capitales a partir de sus bases de datos, sin inventar nada. Fuentes: las de `ORDENES-CORRECCION.md` §4 (Pablo, 2026-10-25: «esas deberían bastar de momento, pero hay que verificar autores, dedicatorias, etc.»).

## Cómo se trabaja
1. `node tools/importar-base-marchas.mjs` (reanudable; `PAUSA=1500`, 1 hilo): tablas y fichas de YouTube de Marchas de Procesión. Marca `caido` los vídeos borrados.
2. `node tools/unificar-marchas.mjs`: junta todas las bases en `tools/sources/marchas.json` (necesita `auditoria/patrimonio-marchas.json`, local e ignorado; sin él reutiliza la pasada anterior). Deja el informe en `auditoria/marchas-informe.json` (local).
3. Revisión a mano con fuente abierta: `tools/sources/marchas-revision.json` (confirmar, ligar, retirar o corregir; cada entrada con URL).
4. `node tools/comprobar-marchas.mjs [sitemap.xml]`: tiene que dar 0 errores antes de subir.
5. `node site/build.mjs`, comprobar a 390 y 1440 px, subir.

## Estado (2026-10-26, bloque 3)
| Qué | Hecho | Total | Falta |
|---|---|---|---|
| Fichas de YouTube de Marchas de Procesión | 7.224 leídas (869 vídeos borrados) | 7.225 | 1 que falla |
| Registros de la BNE | 1.642 leídos (312 partituras usadas) | 1.643 | — |
| Marchas en el modelo único | 7.529 | — | — |
| Ligadas a hermandades | 1.713 en 230 hermandades | — | — |
| Contrastadas / una fuente fiable / sin verificar | 197 / 1.448 / 68 | — | las 68 ya se buscaron sin fuente |
| Revisiones a mano con fuente | 193 | — | — |
| Dedicatorias del catálogo dudosas revisadas | 93 (Almería, Jaén, Cádiz, Huelva, Córdoba) | 244 | 151 de Sevilla, Málaga y Granada (lote dudas-C.json) |

## Pendientes de la auditoría (M)
- **Cerrados:** M5 (títulos en varias hermandades: cada marcha tiene su compositor y sus fuentes; no hay ninguna con el mismo título y compositor en dos hermandades), M6 (duplicados del catálogo: se unen con alias), M8 («El Amor» es de agrupación musical), M10 (años: regla nueva), M13 (se queda «Patre Nostro»: ninguna fuente da «Padre Nostro»), M14 («La Soledad del Sepulcro», Moreno Ramos 1996, y «Soledad del Santo Sepulcro», Gutiérrez 2001; duplicado unido), M15 (Virgen de la Carretería: 1979, web oficial), M16 («In Cer»: en el patrimonio musical de los Gitanos según la Federación).
- «El Novio de la Muerte» (Costa y Prado): retirada la dedicatoria al Cristo de la Buena Muerte (canción de varietés de 1921). La de Bachiller Aguilar sigue «sin verificar».

## Punto exacto para seguir
- Bloque 2 subido (ver Historial). Siguiente: (1) terminar YouTube; (2) BNE si Pablo lo autoriza; (3) revisar las 308 dedicatorias dudosas del catálogo, empezando por Almería, Jaén, Huelva, Cádiz y Córdoba (las capitales con menos marchas); (4) revisión final por subagente de 20 marchas al azar.

## Historial
- 2026-10-25: modelo único, comprobador, buscador con marchas aparte. Importación de YouTube relanzada en segundo plano.
- 2026-10-26: bloque 2: 142 revisiones a mano con fuente (sin verificar 181 → 69), compositor más estricto, duplicados unidos, BNE como fuente (250 fichas), M5-M16 cerrados.
- 2026-10-26: bloque 3: importaciones de YouTube y BNE terminadas (solo partituras de la BNE), 93 dedicatorias dudosas revisadas (+50 ligadas con fuente en Jaén, Cádiz, Huelva, Córdoba y Almería), correcciones de la sesión de Málaga, redirecciones permanentes de direcciones retiradas.
