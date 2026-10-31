# Cajas a medida

Generador de cajas organizadoras para impresión 3D. Un único `index.html` sin build: HTML + CSS + JS, three@r128 y earcut@2.2.4 desde CDN.
Se publicó como artifact de claude.ai con la capacidad `downloads` (el visor solo deja guardar ciertas extensiones, por eso la descarga es un .zip con los STL).
Si se abre como archivo suelto, la descarga es directa de cada .stl.

## Estructura
- Todo el bloque de geometría está entre `// ==CORE-START==` y `// ==CORE-END==` (sin DOM, en mm, Z hacia arriba). Los tests lo extraen de ahí.
- Caja: contorno redondeado + huecos (agujeros) -> una sola malla cerrada. Tapa encajada (`skirt`) o con bisagra (`hinge`) o ninguna.
- Bisagra de pasador: nudillos alternos como prismas cerrados que se solapan 0,5 mm con la pared o el plato (el laminador los funde).
- Cierres (`latch`, `latchOf` descarta los que no encajan con la tapa): clic con cordones a 45° en la caja y dentro del borde de la tapa (`Soup.loft` entre contornos desplazados con los mismos vértices), imanes en columnas de esquina con el hueco gemelo en la tapa (si el plato es fino, el imán de la tapa sobresale y entra en el hueco de la caja) y pestillo con lengüeta flexible delante (sustituye a la pestaña de la tapa con bisagra).
- Texto/emojis en la tapa: la parte DOM lo dibuja en un lienzo (blanco; lo casi negro de los emojis cuenta como hueco), `traceMask` saca contornos sin cruces, `labelGeom` los centra/reduce y `addRelief` hace relieve o grabado. La tapa encajada va boca abajo: grabado en la cara de la cama, en espejo, construido con `Soup.m` en espejo + `Soup.flip`.
- `Soup.cap` triangula con earcut y parte las aristas que pasan por vértices alineados (si no, quedan uniones en T con las paredes).

## Pruebas (Node 18+)
    cd tests && npm i earcut@2.2.4 && node test.mjs && node hinge-test.mjs
`test.mjs` genera STL de varias configuraciones y comprueba volumen y que sean sólidos cerrados (con `check-stl.mjs`). Usa `unzip` para probar el zip.
`hinge-test.mjs` comprueba en 2D que la tapa gira de 0 a 125° sin chocar con la caja.

## Ideas pendientes
Muesca para el dedo, separadores más bajos.
