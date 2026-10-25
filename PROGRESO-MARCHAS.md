# Progreso · marchas (sesión especializada, desde 2026-10-25)

Orden de Pablo: importar y verificar todas las marchas de las 8 capitales a partir de sus bases de datos, sin inventar nada. Fuentes: las de `ORDENES-CORRECCION.md` §4 (Pablo, 2026-10-25: «esas deberían bastar de momento, pero hay que verificar autores, dedicatorias, etc.»).

## Cómo se trabaja
1. `node tools/importar-base-marchas.mjs` (reanudable; `PAUSA=1500`, 1 hilo): tablas y fichas de YouTube de Marchas de Procesión. Marca `caido` los vídeos borrados.
2. `node tools/unificar-marchas.mjs`: junta todas las bases en `tools/sources/marchas.json` (necesita `auditoria/patrimonio-marchas.json`, local e ignorado; sin él reutiliza la pasada anterior). Deja el informe en `auditoria/marchas-informe.json` (local).
3. Revisión a mano con fuente abierta: `tools/sources/marchas-revision.json` (confirmar, ligar, retirar o corregir; cada entrada con URL).
4. `node tools/comprobar-marchas.mjs [sitemap.xml]`: tiene que dar 0 errores antes de subir.
5. `node site/build.mjs`, comprobar a 390 y 1440 px, subir.

## Estado
| Qué | Hecho | Total | Falta |
|---|---|---|---|
| Fichas de YouTube de Marchas de Procesión leídas | en curso (3.806 → …) | 7.225 | relanzar el importador hasta terminar |
| Marchas en el modelo único | 7.490 | — | — |
| Ligadas a hermandades | 1.572 en 209 hermandades | — | — |
| Dedicatorias contrastadas / con una fuente fiable / sin verificar | 163 / 1.228 / 181 | — | verificar las 181 una a una |
| Enlaces retirados (fuente fiable que la dedica a otra) | 9 | — | — |
| Dedicatorias del catálogo que casan con varias hermandades o son poco específicas | 0 revisadas | 367 | revisar a mano (solo con fuente) |
| Años que no coinciden entre fuentes fiables (en blanco) | — | 13 en ligadas | buscar la fuente oficial |

## Pendientes de la auditoría (M)
- M5 (títulos en varias hermandades), M6 (duplicados del catálogo: ahora se unen solos, con alias), M8 («El Amor», formación), M10 (años: regla nueva), M13 («Padre Nostro»), M14 (Soledad del Sepulcro), M15 (Carretería 1977/1979: oficial 1979), M16 («In Cer»).

## Punto exacto para seguir (pausa por presupuesto, 2026-10-25, límite de 5 h al 83 %)
- Bloque 1 subido (`fd49e4e`). Lo de después está en la rama `claude/marchas-verificadas-188492`, **sin subir**:
  - BNE: el importador lee ahora el tema «Marchas procesionales» (XX536674, 1.633 registros) y guarda los subcampos (título, subtítulo, mención de responsabilidad). Relanzar `PYTHONIOENCODING=utf-8 uvx --with curl_cffi python -I tools/importar-marchas-bne.py` (reanudable) hasta que lea las 1.643 fichas.
  - YouTube: relanzar `PAUSA=1500 node tools/importar-base-marchas.mjs` (reanudable) hasta 3.394.
  - Unificador: la BNE es fuente fiable (título y compositor; dedicatoria si la trae en las notas; la fecha no se usa como año) y las partituras de Semana Santa que no están en el catálogo entran como marchas nuevas. Regla nueva: una advocación corriente vale si la hermandad se llama así y es la única de su ciudad con ella (+67 enlaces revisados a ojo).
  - Ficha de marcha: fila «Partitura» con los registros de la BNE. Texto de /marchas/ actualizado.
- Verificadores (subagentes) lanzados antes de la pausa: sus resultados quedan en `auditoria/lotes/resultado-1..4.json` (las 181 «sin verificar», lotes en `sin-verificar-1..4.json`) y `resultado-casos.json` (M13-M16, M8, «El Novio de la Muerte», 4 conflictos y 13 años). **No están aplicados.**
- Al pausar: YouTube 5.231 de 7.225 fichas leídas (476 vídeos borrados); BNE 250 de 1.643 fichas. Commit `0b5b6e2`.
- Siguiente: (1) terminar las dos importaciones; (2) revisar a mano una muestra de cada resultado y pasar los veredictos con URL a `tools/sources/marchas-revision.json` (confirmar / retirar / corregir; sin-fuente no se apunta); (3) `node tools/unificar-marchas.mjs` y `node tools/comprobar-marchas.mjs <sitemap>` con 0 errores; (4) build, Playwright a 390 y 1440, subir el bloque 2; (5) revisar las 313 dedicatorias del catálogo dudosas (casan con varias hermandades o son poco específicas); (6) revisión final por subagente de 20 marchas al azar.

## Historial
- 2026-10-25: modelo único, comprobador, buscador con marchas aparte. Importación de YouTube relanzada en segundo plano.
