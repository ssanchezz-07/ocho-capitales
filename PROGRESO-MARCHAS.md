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

## Punto exacto para seguir
- Bloque 1 (modelo único, comprobador, índice partido): ver Historial.

## Historial
- 2026-10-25: modelo único, comprobador, buscador con marchas aparte. Importación de YouTube relanzada en segundo plano.
