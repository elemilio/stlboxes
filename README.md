# Box Generator

Generador de cajas organizadoras para impresión 3D que funciona en el navegador. Pones las medidas, repartes los compartimentos, eliges la tapa y descargas los STL listos para el laminador. Todo se imprime sin soportes.

Es un único `index.html`, sin compilación ni servidor: ábrelo en el navegador y listo.

## Qué puedes hacer

- **Medidas** exteriores o interiores, con esquinas redondeadas, grosor de pared y de suelo.
- **Compartimentos** en filas y columnas, iguales o con anchos y fondos relativos (por ejemplo `1,2,1`).
- **Tapa**
  - *Encajada*: abraza la caja por fuera, como una caja de zapatos, con la holgura que elijas.
  - *Con bisagra*: nudillos alternos en caja y tapa; se monta pasando un trozo de filamento de 1,75 mm, una varilla de 2 mm o un tornillo M3.
  - Sin tapa: deja apagado el apartado.
- **Cierres**
  - *Clic* (tapa encajada): un cordón en la caja y otro dentro del borde de la tapa.
  - *Imanes* (las dos tapas): columnas en las esquinas con huecos para imanes de disco y los huecos gemelos en la tapa.
  - *Pestillo* (tapa con bisagra): una lengüeta flexible delante que engancha la tapa.
- **Texto y emojis** en la tapa y en cualquiera de los cuatro laterales (útil si apilas las cajas), en relieve o grabado. Los emojis salen como silueta y sus partes oscuras quedan huecas.
- **Avisos de impresión**: pared con perímetros incompletos, holguras raras, piezas que no caben en tu cama, etc.
- **Vista 3D** de la caja, la tapa o las dos juntas (con la bisagra abriéndose).
- **Interfaz mínima**: compartimentos, tapa, texto e impresora se encienden con un interruptor; apagados no ocupan sitio.
- **Modo oscuro**: sigue al del sistema, o elígelo con el botón de la barra superior.
- **Castellano e inglés**, con un selector en la barra superior (la primera vez se elige según el idioma del navegador).
- **Mis diseños**: guarda tus cajas con nombre en el navegador y vuelve a abrirlas para editarlas. Para llevarlas a otro dispositivo, copia el enlace (o el código, dentro del visor de claude.ai) o exporta el `.json`.

La descarga es un STL por pieza (caja y tapa). Publicada como artifact de claude.ai, la descarga es un `.zip` con los dos STL y el `.json` del diseño, porque ese visor solo deja guardar ciertas extensiones.

## Uso

Abre `index.html` en un navegador moderno. Necesita conexión para cargar three.js y earcut desde CDN, y las fuentes de Google Fonts.

Para servirlo en local:

```bash
python3 -m http.server 8771
```

y abre <http://localhost:8771>.

## Consejos de impresión

- Con boquilla de 0,4 mm, paredes de 1,2 o 1,6 mm (3 o 4 perímetros) quedan limpias.
- Imprime caja y tapa por separado, cada una con la cara grande sobre la cama.
- La tapa encajada se imprime boca abajo, así que su texto va grabado en la cara de la cama y en espejo: al darle la vuelta se lee bien.
- Para que el texto en relieve de la tapa con bisagra salga de otro color, cambia de filamento a la altura que indica la app.
- Pega los imanes con cianoacrilato y comprueba que se atraen antes de que seque.

## Cómo está hecho

Todo el código de geometría está entre `// ==CORE-START==` y `// ==CORE-END==` en `index.html`: funciones puras sin DOM, en milímetros y con Z hacia arriba. Cada pieza se genera como una sola malla cerrada (contornos redondeados, caras trianguladas con earcut y paredes extruidas). El texto se dibuja en un lienzo, se convierte en una máscara, se trazan sus contornos y se extruyen sobre la cara elegida.

## Pruebas

Requieren Node 18 o posterior:

```bash
cd tests && npm i earcut@2.2.4 && node test.mjs && node hinge-test.mjs
```

- `test.mjs` genera STL de muchas configuraciones (tapas, cierres, texto) y comprueba el volumen y que cada pieza sea un sólido cerrado, usando `check-stl.mjs`.
- `hinge-test.mjs` comprueba en 2D que la tapa con bisagra gira de 0 a 125° sin chocar con la caja.
