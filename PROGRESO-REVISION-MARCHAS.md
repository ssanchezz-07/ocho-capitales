# Progreso · revisión de marchas (rama `revision-marchas`)

## RETOMAR AQUÍ (2026-11-04, noche)
**Fase 0 (fichas de bandas desde su web oficial), empezada con el sí de Pablo que pasó coordinación.** Las fases 1-4 del plan (`PLAN-REVISION-MARCHAS.md`) siguen esperando su «empieza».

### Lote 1 · El Carmen de Málaga: hecho, sin commit, auditor en curso
- **Repertorio:** `tools/sources/repertorio-carmen-malaga.json`, con las 68 obras de https://bctcarmenmalaga.es/repertorio/.
  - 23 son propias, con dedicatoria y la marca `propia`; 45 son de otras bandas.
  - Si la marcha ya existía, la ficha mantiene su título y compositor, y la grafía de la web va en `como_en_web`. Así la banda solo se suma a «La toca» y no renombra nada.
- **Resultado en la base:**
  - pasa de 10.021 a 10.033 marchas: 12 altas nuevas, todas comprobadas contra la base;
  - 56 marchas tienen ya la banda en «La toca»;
  - 13 dedicatorias tienen ya la imagen o están contrastadas;
  - ningún título, compositor, año, formación, vídeo ni dirección ha cambiado;
  - `comprobar-marchas` da 0 errores.
- **Ficha de la banda:** `tools/sources/bandas-fichas.json`, archivo nuevo, con una entrada por banda. Lleva logo, datos, historia con nuestras palabras, «Fuera de las capitales» y redes oficiales, cada cosa con su fuente.
- **Logo:** `site/assets/img/logo-<slug>.webp`, a 320 px y con fondo transparente. Se convierte con Pillow desde el PNG de la web.
- **Plantilla:** `site/build.mjs` (`pageBanda`, `REPERTORIO`, `BFICHAS`) y `site/assets/site.css` (bloque `.bx-*`). Es del área de Diseño: hay que avisarles para que lo pulan.
- **Dudas para Pablo:** `LISTA-PABLO-MARCHAS.md`. Son títulos que la banda escribe distinto, «Resilencia/Resiliencia», el orden de los nombres de Guerrero Marín, la formación de «En tu Cruz, Divina Misericordia» y el compositor de «Santa Cruz».

### Cómo se hace cada banda (receta)
1. Leer su web: repertorio, historia y pie con las redes. Si no tiene web, sus redes oficiales.
2. Crear o completar `tools/sources/repertorio-<banda>.json`:
   - `clave` corta y única;
   - `url` de la página del repertorio;
   - `propia: true` en las suyas;
   - dedicatoria literal.
3. **Siempre partir de `marchas.json` limpio:** `git checkout -- tools/sources/marchas.json`, y después `node tools/unificar-marchas.mjs`. Si no, el unificador conserva las altas de la pasada anterior.
4. Comparar con `git show origin/main:tools/sources/marchas.json`. No puede desaparecer ningún slug ni cambiar ningún título o compositor.
   - Si la web escribe distinto una marcha que ya existe, se pone la forma de la base y la de la web va en `como_en_web`. La duda va a la lista de Pablo.
   - Ojo a las coincidencias por apellido: «La Lanzada» de Montoya no es la de Camila Figueroa.
5. `comprobar-marchas`: 0 errores (avisa de las altas parecidas a una que ya estaba).
6. Ficha en `bandas-fichas.json` y logo. Fotos de la banda, todavía no.
7. Compilar, mirar a 375 y 1440 px, auditor-datos y sí de Pablo.

### Antes de subir
- `git fetch`
- `git rebase origin/main`
- volver a pasar el unificador desde limpio
- `node site/build.mjs`
- `comprobar-marchas`, `comprobar-origen`, `prueba-buscador` y `comprobar-fuentes-textos`, con 0 errores
- el sí de Pablo
- `git push origin HEAD:main`

### Siguiente
El resto de bandas de Málaga capital, de `MARKETING/contactos/bandas-malaga.md`:
1. Paso y Esperanza CC. y TT.
2. San Lorenzo Mártir
3. Cruz del Humilladero
4. Eloy García (Expiración)
5. La Paz
6. Zamarrilla
7. Fusionadas
8. Rocío
9. Trinidad Sinfónica
10. Santa Cecilia
11. Cautivo
12. Bomberos
13. Churriana

Después, la provincia.

### Auditor del lote 1: APTO (4-nov)
- Se han aplicado sus observaciones: la frase de 2015, y dos dudas más en la lista de Pablo («Siete Palabras» de Miraut y el enlace de «Reencuentro»).

### Logos: los ORIGINALES (Pablo, 4-nov: «usa los originales, son horrendos los nuestros»)
- Se probó una versión a una tinta, vectorizada, y Pablo la descartó. No se vuelve a proponer.
- Cada banda lleva su escudo original:
  - sacado de su web o de sus redes oficiales;
  - recortado y a 320 px en `site/assets/img/logo-<slug>.webp` (Pillow);
  - con la nota «Logo: <banda>» en `bandas-fichas.json`.
- Zamarrilla: la página de la banda usa el escudo de la hermandad. Hay que buscar en sus redes si tiene uno propio antes de ponerlo.

### Federband: CANCELADO
Pablo lo canceló el 4-nov («cancela lo de esto»). No se usa federband.org como fuente. Las bandas de Málaga se completan solo con sus webs y redes oficiales, con su logo original.
