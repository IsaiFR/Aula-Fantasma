# EduSnow

Nombre visible exacto: **EduSnow**. Paquete de voz autocontenido v6: `pets/EduSnow-Voz.pet`. Usa la captura local del micrófono y sus controles existentes. Solo habla y parpadea, en silencio y al hablar; sin flotación, movimiento de ropa ni efectos especiales.

## Recursos

Original: ``C:/Users/kikef/Downloads/EduCat`s/EduSnow.png``. Copia intacta en `web/edusnow/reference.png`; `open.png` conserva sus bytes. Ediciones con imagegen incorporado: `blink-source.png` y `talking-source.png`. Cuatro poses finales de 1254 × 1254 px: `open`, `closed`, `talking` y `talkingClosed`.

Regeneración: `node scripts/create-edusnow.cjs`, con `@napi-rs/canvas` del runtime de Codex o `AULA_CANVAS_MODULE`. El generador compone solo las regiones faciales de `regions.json`, conserva el alfa y los píxeles opacos fuera de ellas. El paquete terminado funciona sin Downloads ni el generador.

## Prompts finales, imagegen incorporado

Parpadeo:

```text
Use case: precise-object-edit. Edit target: provided full body EduSnow snowman cat, snow covered top hat, glasses, orange carrot nose, red patterned scarf. Make the BLINK pose for an audio reactive pet. Change ONLY the two eyes INSIDE the spectacles to fully CLOSED gentle dark curved eyelid lines, no pupils, eye whites or highlights. Keep the left lens purple tinted and the right lens white; preserve all spectacles rims exactly. The original orange carrot nose partially overlaps the right lens: preserve the carrot shape, position, stripes and outlines exactly. Keep CLOSED mouth, whiskers and face identical. Exact original 1254x1254 canvas, placement, scale and silhouette. Keep snow covered hat with holly and berries, red scarf with white snowflakes, snow body, black buttons, paws and tail identical. True transparent background, preserve alpha. No text, shadows, new objects or crop. Only eyes change.
```

Habla:

```text
Use case: precise-object-edit. Edit target: provided full body EduSnow snowman cat, snow covered top hat, glasses, orange carrot nose, red patterned scarf. Make the SPEAKING pose for an audio reactive pet. Change ONLY the small central closed mouth BELOW the carrot nose into a small friendly OPEN talking mouth with a dark interior and little pink tongue. Keep mouth within white muzzle and above scarf. Preserve the orange carrot nose exactly including stripes, position, shape and outline. Both eyes stay fully OPEN with original pupils, highlights and whites, purple left lens tint and original glasses rims. Keep face outline and whiskers exactly unchanged. Exact original 1254x1254 canvas, placement, scale and silhouette. Keep snow covered hat with holly and berries, red scarf with white snowflakes, snow body, black buttons, paws and tail identical. True transparent background, preserve alpha. No text, shadows, new objects or crop. Only mouth changes.
```

## Validación

`tests/edusnow.test.cjs` comprueba importación/exportación, poses distintas, transparencia, reposo original y combinación independiente de ojos y boca. `npm.cmd run smoke -- --packaged --edusnow` verifica catálogo, captura de audio sintético, cuatro poses exactas y sincronizadas en escritorio/panel/salida de navegador, parpadeo automático, apagar el micrófono, persistencia, exportación y lienzo vertical. Usa `.smoke-data`, sin alterar las preferencias diarias.

La prueba de Electron no valida el micrófono físico ni una escena real de OBS.
