# Box Generator

(Antes «Cajas a medida»: las claves internas `cajas-a-medida` de `localStorage` y de los diseños se mantienen por compatibilidad.)

Generador de cajas organizadoras para impresión 3D. Un único `index.html` sin build: HTML + CSS + JS, three@r128 y earcut@2.2.4 desde CDN.
Se publicó como artifact de claude.ai con la capacidad `downloads` (el visor solo deja guardar ciertas extensiones, por eso la descarga es un .zip con los STL).
Si se abre como archivo suelto, la descarga es directa de cada .stl.

## Estructura
- Todo el bloque de geometría está entre `// ==CORE-START==` y `// ==CORE-END==` (sin DOM, en mm, Z hacia arriba). Los tests lo extraen de ahí.
- Caja: contorno redondeado + huecos (agujeros) -> una sola malla cerrada. Tapa encajada (`skirt`) o con bisagra (`hinge`) o ninguna.
- Bisagra de pasador: nudillos alternos como prismas cerrados que se solapan 0,5 mm con la pared o el plato (el laminador los funde).
- Cierres (`latch`, `latchOf` descarta los que no encajan con la tapa): clic con cordones a 45° en la caja y dentro del borde de la tapa (`Soup.loft` entre contornos desplazados con los mismos vértices), imanes en columnas de esquina con el hueco gemelo en la tapa (si el plato es fino, el imán de la tapa sobresale y entra en el hueco de la caja) y pestillo con lengüeta flexible delante (sustituye a la pestaña de la tapa con bisagra).
- Texto/emojis en la tapa y en los laterales (`sideLabels`: cada lateral plano se sustituye por una cara con el texto, en coordenadas locales u, v, w con `Soup.m`; `wall`/`loft` aceptan `skip` para no generar ese tramo): la parte DOM lo dibuja en un lienzo (blanco; lo casi negro de los emojis cuenta como hueco), `traceMask` saca contornos sin cruces, `labelGeom` los centra/reduce y `addRelief` hace relieve o grabado. La tapa encajada va boca abajo: grabado en la cara de la cama, en espejo, construido con `Soup.m` en espejo + `Soup.flip`.
- Compartimentos, tapa, texto e impresora son apartados opcionales (`useCells`, `useLid`, `useText`, `usePrinter`, apagados por defecto; `.opt.off` oculta todo menos la cabecera). Apagados, `params()` usa un solo hueco, sin tapa (`lidOf()` da `'none'`; `S.lidType` solo es `skirt` o `hinge`), sin texto, y la cama y boquilla por defecto, pero los valores se conservan. Los diseños sin esos campos los deducen de lo que usaban (`designApply`).
- Diseños guardados: `designOf`/`designApply` (con versión `v`; lo que falte o no tenga el tipo esperado sale de los valores por defecto, para que los diseños viejos sigan abriéndose) y `designCode`/`designParse` (base64url para `#d=…`; también aceptan el JSON exportado). «Mis diseños» es un panel desplegable de la barra superior (junto al título y al idioma). La parte DOM los guarda en `localStorage` (`cajas-a-medida:diseños`), copia el enlace (el código dentro del visor, porque ahí la URL de la página no sirve), exporta/importa `.json` y mete el `.json` en el zip.
- Tema: colores como variables en `:root`, redefinidas en `prefers-color-scheme: dark` y en `[data-theme]`. Sin elección guardada sigue al sistema; el botón de la barra fija `data-theme` (`cajas-a-medida:tema` en `localStorage`) y la vista 3D se rehace al cambiar.
- Idiomas (castellano e inglés): el texto castellano es la clave y `EN` guarda la traducción (`tr(lang, texto, {vars})`, `{x}` se sustituye; `texto|contexto` separa usos con distinta traducción). En el core están los mensajes de `validate` (según `p.lang`); la parte DOM añade a `EN` los de la interfaz, apunta los textos fijos del HTML al arrancar (`localizeFixed`) y rehace los que pone el código en `applyLang`. Al añadir un texto nuevo, añade su traducción: `test.mjs` comprueba que los mensajes en inglés no salgan en castellano.
- `Soup.cap` triangula con earcut y parte las aristas que pasan por vértices alineados (si no, quedan uniones en T con las paredes).

## Pruebas (Node 18+)
    cd tests && npm i earcut@2.2.4 && node test.mjs && node hinge-test.mjs
`test.mjs` genera STL de varias configuraciones y comprueba volumen y que sean sólidos cerrados (con `check-stl.mjs`). Usa `unzip` para probar el zip.
`hinge-test.mjs` comprueba en 2D que la tapa gira de 0 a 125° sin chocar con la caja.

## Ideas pendientes
Muesca para el dedo, separadores más bajos.
