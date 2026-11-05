# EduKimi

Mascota de voz añadida en Aula Fantasma 1.15.0. Nombre visible: **EduKimi**. Paquete: `pets/EduKimi-Voz.pet`, formato propio v6, autocontenido, compatible con importación/exportación y el micrófono existente. No usa el motor de vehículos de EduF1.

## Recursos

- Base del usuario: `C:/Users/kikef/Downloads/Gato piloto Mercedes con casco y rizos.png`.
- Copia intacta y pose de reposo: `web/edukimi/reference.png` y `web/edukimi/open.png`.
- Herramienta de edición: imagegen integrado, modo incorporado, transparencia conservada.
- Resultados de edición: `web/edukimi/blink-source.png` y `web/edukimi/talking-source.png`.
- Poses finales: `open.png`, `closed.png`, `talking.png`, `talkingClosed.png`, todas de 1254 × 1254 px, en `web/edukimi`.
- Regiones de composición: `web/edukimi/regions.json`.

`scripts/create-edukimi.cjs` combina los párpados y la boca editados sobre la misma imagen base. Las regiones son disjuntas: ojos cerrados y boca abierta se pueden combinar sin alterar el uniforme, los rizos, los logotipos, el casco ni la silueta. La pose `open` conserva exactamente el archivo original. Las poses compuestas mantienen el mismo alfa; el decoder nativo puede redondear una unidad RGB al manejar píxeles con alfa parcial.

Regeneración: `node scripts/create-edukimi.cjs`. Requiere `@napi-rs/canvas`, disponible mediante `AULA_CANVAS_MODULE` o el runtime local de Codex. La app y el paquete terminado no requieren el generador ni el archivo de Downloads.

## Comportamiento

Reutiliza la captura local del micrófono y sus controles de entrada, sensibilidad y espera de cierre. Habla con `voice.speaking`, parpadea con `voice.blinking`, y combina ambos estados. El parpadeo usa el perfil habitual de voz: intervalo .75–4 s, duración .15 s. No incorpora flotación, sábana, transformación ni cambios de preferencias diarias. Mantiene los controles habituales de esquina, tamaño, opacidad y visibilidad.

## Prompts finales

### Parpadeo

```text
Use case: precise-object-edit. Edit target: this full-body cat Mercedes racing driver image. Create the BLINK expression for an audio-reactive desktop pet. Change ONLY the two eyes inside the glasses: close both eyes fully into relaxed curved black eyelid lines, with no visible pupils or open eyeballs. Keep the glasses rims and lens tints exactly. Keep the mouth CLOSED in its current smile. Preserve the exact same 1254x1254 canvas, character size, position, silhouette, black/white fur, brown curly hair, Mercedes cap with 12 and Italian flag, ears, all suit sponsors and typography, paws, tail, helmet at the right, colors and shading. Nothing moves except eyelids. True transparent background, preserve all existing transparency. No labels, grid, new objects, crop or added shadows.
```

### Boca abierta

```text
Use case: precise-object-edit. Edit target: this full-body cat Mercedes racing driver image. Create its SPEAKING expression for an audio-reactive desktop pet. Change ONLY the mouth, opening the small mouth into a clearly visible friendly talking mouth (dark interior and small pink tongue), directly below the original nose. Keep the nose, whiskers and entire face outline unchanged. Both eyes stay OPEN with exactly the original black pupils and white glints, glasses unchanged. Preserve the exact same 1254x1254 canvas, character size, position, silhouette, black/white fur, brown curly hair, Mercedes cap with 12 and Italian flag, ears, all suit sponsors and typography, paws, tail, helmet at the right, colors and shading. Nothing moves except the mouth. True transparent background, preserve existing alpha. No labels, new objects, crop, glow or shadows.
```

## Validación

`tests/edukimi.test.cjs` cubre el paquete, transparencia, cuatro expresiones, conservación de la base y composición independiente de ojos/boca. `npm.cmd run smoke -- --packaged --kimi` prueba el portable con datos aislados en `.smoke-data`: catálogo, captura de micrófono sintético de Electron, niveles inyectados por el puente real, cuatro poses exactas en escritorio/panel/salida de navegador para OBS, parpadeo automático en silencio y hablando, apagar micro, persistencia, exportación y formato vertical. Capturas: `.smoke-data/kimi-*.png`.

La captura sintética y la salida de navegador en Electron no constituyen una prueba con el micrófono físico del usuario ni de una escena real de OBS.
