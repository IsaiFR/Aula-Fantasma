# Catrina

Mascota de voz añadida en Aula Fantasma 1.17.0. Nombre visible exacto: **Catrina**. Paquete autocontenido v6: `pets/Catrina-Voz.pet`. Reutiliza la captura local del micrófono y sus controles actuales.

## Recursos y composición

- Entrada del usuario: `C:/Users/kikef/Downloads/Gatita Catrina de Magenta.png`.
- Copia intacta y reposo: `web/catrina/reference.png` y `web/catrina/open.png`.
- Ediciones con imagegen integrado, modo incorporado, transparencia conservada.
- Resultados de edición: `web/catrina/blink-source.png` y `web/catrina/talking-source.png`.
- Poses finales en `web/catrina`: `open.png`, `closed.png`, `talking.png` y `talkingClosed.png`, todas de 1254 × 1254 px.
- Máscaras faciales: `web/catrina/regions.json`.

`scripts/create-catrina.cjs` compone las regiones de ojos y boca sobre la imagen original; son disjuntas y se combinan independientemente. Sombrero, rosas, velo, vestido magenta, encajes, joyas, patas, cola y silueta conservan la base original. La boca abierta mantiene las marcas pintadas de las mejillas. El PNG de reposo conserva los bytes originales. El alfa es igual en las cuatro poses; al procesar alfa parcial, el decoder nativo puede redondear una unidad RGB.

Regeneración opcional: `node scripts/create-catrina.cjs`, con `@napi-rs/canvas` mediante `AULA_CANVAS_MODULE` o el runtime local de Codex. El `.pet` terminado contiene todas las imágenes y funciona sin el generador ni Downloads.

## Estados y controles

Cuatro combinaciones de boca cerrada/abierta y ojos abiertos/cerrados. Habla con `voice.speaking` y parpadea con `voice.blinking`; intervalo de parpadeo .75–4 s y duración .15 s. Sin flotación ni transformación. Mantiene entrada, sensibilidad, espera de cierre, esquina, tamaño, opacidad y visibilidad. Las preferencias diarias de AppData no se utilizan para las pruebas.

## Prompts finales

### Parpadeo

```text
Use case: precise-object-edit. Edit target: the provided full-body Catrina cat in magenta pink lace dress, flower hat, veil, glasses and gold earrings. Make the BLINK expression for an audio-reactive desktop pet. Change ONLY the two eyes INSIDE the glasses: close both eyes fully into gentle black curved eyelid lines, no visible open pupils or eyeballs. Preserve the purple lens tint, white skin and magenta petal patterns around the eyes. Keep all glasses rims, face makeup, stitched smile, nose, whiskers and CLOSED mouth exactly as before. Preserve exact original canvas dimensions, position, scale, alignment and silhouette. Keep the magenta hat with pink lace, roses, leaves, veil, ears, gold-and-pink earrings and necklace, dress with floral embroidery and lace, paws and tail identical. True transparent background; preserve alpha. No crop, new objects, labels, shadows or glow. Only eyelids change.
```

### Boca abierta

```text
Use case: precise-object-edit. Edit target: the provided full-body Catrina cat in magenta pink lace dress, flower hat, veil, glasses and gold earrings. Make the SPEAKING expression for an audio-reactive desktop pet. Change ONLY the central mouth directly below the original nose into a small friendly OPEN talking mouth, dark interior and small pink tongue. Keep it within the muzzle and above the magenta ornament on the chin. Preserve the decorative stitched-smile paint continuing onto both cheeks; those are makeup markings, not teeth. Keep original nose, whiskers, face contour and all chin ornaments unchanged. Both eyes stay fully OPEN with original black pupils, highlights, purple lens tint, glasses rims and magenta petal patterns. Preserve exact original canvas dimensions, character position, scale, alignment and silhouette. Keep magenta lace hat, roses, leaves, veil, ears, gold-and-pink earrings and necklace, floral dress, lace, paws and tail identical. Transparent background, preserve alpha. No new objects, crop, text, glow or shadows. Only central mouth changes.
```

## Validación

`tests/catrina.test.cjs` cubre importación/exportación, poses distintas, transparencia, conservación de la base y combinación independiente de párpados y boca. `npm.cmd run smoke -- --packaged --catrina` comprueba catálogo, audio sintético de Electron, niveles por el puente real de micrófono, cuatro poses exactas en escritorio/panel/salida de navegador para OBS, parpadeo automático hablando y en silencio, apagar micro, persistencia, exportación y formato vertical. Capturas en `.smoke-data/catrina-*.png`.

La captura sintética y la salida de navegador en Electron no verifican el micrófono físico del usuario ni una escena real de OBS.
