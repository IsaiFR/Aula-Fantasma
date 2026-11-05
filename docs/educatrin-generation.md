# EduCatrin

Mascota de voz añadida en Aula Fantasma 1.16.0. Nombre visible: **EduCatrin**. Paquete autocontenido: `pets/EduCatrin-Voz.pet`, formato v6. Reutiliza la captura del micrófono y los controles de las otras mascotas de voz.

## Recursos y composición

- Imagen del usuario: `C:/Users/kikef/Downloads/Gato mariachi de Día de Muertos.png`.
- Copia intacta y pose de reposo: `web/educatrin/reference.png` y `web/educatrin/open.png`.
- Edición con imagegen integrado, modo incorporado, transparencia conservada.
- Fuentes editadas: `web/educatrin/blink-source.png` y `web/educatrin/talking-source.png`.
- Poses finales: `open.png`, `closed.png`, `talking.png`, `talkingClosed.png`, de 1254 × 1254 px, en `web/educatrin`.
- Máscaras de composición: `web/educatrin/regions.json`.

El generador `scripts/create-educatrin.cjs` combina las regiones faciales editadas sobre la imagen original. Las zonas de ojos y boca son disjuntas. La apertura de boca conserva la sonrisa pintada de las mejillas y el adorno rojo de la barbilla. El sombrero, flores de cempasúchil, traje de charro, moño, patas, cola y silueta mantienen la base original.

La pose `open` conserva los bytes exactos del PNG del usuario. El alfa es idéntico en todas las poses. Al componer PNG con alfa parcial, el decoder nativo puede redondear una unidad RGB. Regeneración opcional: `node scripts/create-educatrin.cjs`, con `@napi-rs/canvas` mediante `AULA_CANVAS_MODULE` o el runtime local de Codex. El paquete y la app no dependen del generador ni de Downloads.

## Comportamiento

Cuatro estados: boca cerrada/ojos abiertos, boca cerrada/ojos cerrados, boca abierta/ojos abiertos y boca abierta/ojos cerrados. La boca sigue `voice.speaking`; los párpados siguen `voice.blinking`. Parpadeo de .15 s con intervalo .75–4 s, como EduKimi. No añade flotación ni efectos especiales. Se mantienen entrada de audio, sensibilidad, espera de cierre, esquina, tamaño, opacidad y visibilidad existentes. Las pruebas usan `.smoke-data`, sin modificar preferencias diarias.

## Prompts finales

### Párpados cerrados

```text
Use case: precise-object-edit. Edit target: the provided full-body black-and-white cat mariachi with Día de Muertos face paint and glasses. Make its BLINK expression for an audio-reactive desktop pet. Change ONLY the two eyes INSIDE the glasses: fully close both eyes into relaxed curved black eyelid lines, no visible pupils. Preserve the purple lens tint and the white skin tones. Preserve ALL red petal motifs surrounding the eyes, the glasses frames, face makeup, stitched-smile paint, nose, whiskers and mouth closed in its original smile. Keep exact original canvas dimensions, scale, alignment and silhouette. Keep sombrero with gold embroidery, orange marigolds, leaves, ears, black-and-gold charro outfit, red bow, buttons, paws and tail identical. Transparent background with original transparency. No new objects, cropping, lettering, glow or shadows. Only eyelids change.
```

### Boca abierta

```text
Use case: precise-object-edit. Edit target: the provided full-body black-and-white cat mariachi with Día de Muertos face paint and glasses. Make its SPEAKING expression for an audio-reactive desktop pet. Change ONLY the mouth: directly below the nose open a small friendly talking mouth with dark interior and small pink tongue. Keep the mouth inside the original muzzle area, above the red ornament on the chin. Retain the black decorative stitched-smile makeup extending onto both cheeks around the sides of the mouth; this is face paint. Keep nose, whiskers, chin ornament, facial contour and all face makeup unchanged. Both eyes remain fully OPEN with original pupils, highlights, purple-tinted glasses and red petal motifs. Preserve original canvas dimensions, character alignment, scale and silhouette exactly. Preserve sombrero with gold embroidery, orange marigolds, leaves, ears, black-and-gold charro suit, red bow, buttons, paws and tail. True transparent background; preserve original alpha. No new objects, crop, text, glow or shadows. Only the central mouth changes.
```

## Validación

`tests/educatrin.test.cjs`: importación/exportación, cuatro imágenes transparentes distintas, conservación de la base, máscaras faciales y combinación independiente de boca/párpados. `npm.cmd run smoke -- --packaged --catrin`: catálogo, captura de audio sintético de Electron, niveles por el puente real, poses exactas en escritorio/panel/salida de navegador para OBS, parpadeo automático hablando y en silencio, apagado de micrófono, persistencia, exportación y formato vertical. Capturas: `.smoke-data/catrin-*.png`.

La prueba con audio sintético y salida de navegador en Electron no verifica el micrófono físico del usuario ni una escena real de OBS.
