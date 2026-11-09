# EduMoon

Nombre visible exacto: **EduMoon**. Paquete de voz autocontenido v6: `pets/EduMoon-Voz.pet`. Usa la captura local del micrófono y los controles actuales de entrada, sensibilidad y espera de cierre. Solo habla y parpadea, en silencio y al hablar. Sin flotación, movimiento de ropa ni acciones especiales.

## Recursos

Original: ``C:/Users/kikef/Downloads/EduCat`s/EduMoon.png``. Copia intacta en `web/edumoon/reference.png`; `open.png` conserva sus bytes. Ediciones con imagegen incorporado: `blink-source.png` y `talking-source.png`. Poses finales de 1254 × 1254 px: `open`, `closed`, `talking` y `talkingClosed`.

Regenerar: `node scripts/create-edumoon.cjs`, con `@napi-rs/canvas` del runtime de Codex o `AULA_CANVAS_MODULE`. El generador combina solo las regiones faciales de `regions.json`, conserva el alfa y los píxeles opacos fuera de ellas, y protege el brazo diagonal de los lentes. El paquete terminado no depende de Downloads ni del generador.

## Prompts finales, imagegen incorporado

Parpadeo:

```text
Use case: precise-object-edit. Edit target: supplied full body EduMoon black and white cat in white moon-themed hood, wrapped white bandages, white cape and gold crescent details, with black spectacles. Create BLINK pose for audio reactive desktop pet. Change ONLY both eyes INSIDE the spectacles to fully CLOSED gentle curved dark eyelid lines; no pupils, eye whites or highlights. Preserve purple left lens tint and white right lens. Keep all spectacle rims and diagonal black spectacle arm inside the right lens identical. Preserve nose, CLOSED mouth, whiskers and face markings. Exact original 1254x1254 canvas, position, scale and silhouette. Keep white hood with crescent ornament, ears and pink interiors, all white bandage wraps, gold bands, chest crescent medallion, cape folds, paws and tail identical. True transparent background, preserve alpha. No crop, new objects, text, glow, transformation or shadow. Only eyes change.
```

Habla:

```text
Use case: precise-object-edit. Edit target: supplied full body EduMoon black and white cat in white moon-themed hood, wrapped white bandages, white cape and gold crescent details, with black spectacles. Create SPEAKING pose for audio reactive desktop pet. Change ONLY the small central CLOSED cat smile directly below the black nose into a small friendly OPEN talking mouth, dark interior and little pink tongue, confined to white muzzle above chin. Preserve original nose and stem, whiskers, face markings and contour. Both eyes remain fully OPEN with original pupils, whites, highlights, purple left lens tint, black spectacle rims and diagonal spectacle arm inside right lens. Exact original 1254x1254 canvas, position, scale and silhouette. Keep white hood with crescent ornament, ears and pink interiors, all white bandage wraps, gold bands, chest crescent medallion, cape folds, paws and tail identical. True transparent background, preserve alpha. No crop, new objects, text, glow, transformation or shadow. Only central mouth changes.
```

## Validación

`tests/edumoon.test.cjs`: importación/exportación, transparencia, cuatro poses distintas, original intacto y combinación independiente de párpados y boca. `npm.cmd run smoke -- --packaged --edumoon`: catálogo, audio sintético, cuatro poses exactas en escritorio/panel/salida de navegador, parpadeo automático, cierre al apagar el micro, persistencia, exportación y lienzo vertical. Usa `.smoke-data`, sin modificar preferencias diarias.

La prueba de Electron no valida el micrófono físico ni una escena real de OBS.
