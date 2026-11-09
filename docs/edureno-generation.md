# EduReno

Nombre visible exacto: **EduReno**. Paquete de voz autocontenido v6: `pets/EduReno-Voz.pet`. Usa la captura local del micrófono y los controles actuales de entrada, sensibilidad y espera de cierre. Solo habla y parpadea, en silencio y al hablar. Sin flotación, movimiento de ropa ni acciones especiales.

## Recursos

Original: ``C:/Users/kikef/Downloads/EduCat`s/EduReno.png``. Copia intacta en `web/edureno/reference.png`; `open.png` conserva sus bytes. Ediciones con imagegen incorporado: `blink-source.png` y `talking-source.png`. Poses finales de 1254 × 1254 px: `open`, `closed`, `talking` y `talkingClosed`.

Regenerar: `node scripts/create-edureno.cjs`, con `@napi-rs/canvas` del runtime de Codex o `AULA_CANVAS_MODULE`. El generador combina solo las regiones faciales de `regions.json`, conserva el alfa y los píxeles opacos fuera de ellas, y protege la nariz roja y el brazo diagonal de los lentes. El paquete terminado no depende de Downloads ni del generador.

## Prompts finales, imagegen incorporado

Parpadeo:

```text
Use case: precise-object-edit. Edit target: supplied full body EduReno black and white cat with reindeer antler headband, holly, black spectacles, round red nose, collar with gold bell and brown harness. Create BLINK pose for an audio reactive desktop pet. Change ONLY the two eyes INSIDE the spectacles to fully CLOSED gentle curved dark eyelid lines, no pupils, eye whites or highlights. Keep purple tint of left lens, white right lens, all spectacle rims and the diagonal black spectacle arm inside the right lens exactly unchanged. Preserve round shiny red nose, CLOSED mouth, whiskers and face markings. Exact original 1254x1254 canvas, scale, alignment and silhouette. Preserve antlers, ears, holly and berries, collar studs, gold bell, harness, buckles, paws and tail identically. True transparent background, preserve alpha. No crop, text, added objects, glow or shadow. Only eyes change.
```

Habla:

```text
Use case: precise-object-edit. Edit target: supplied full body EduReno black and white cat with reindeer antler headband, holly, black spectacles, round red nose, collar with gold bell and brown harness. Create SPEAKING pose for an audio reactive desktop pet. Change ONLY the small central closed mouth directly BELOW the round red nose into a small friendly OPEN talking mouth with dark interior and little pink tongue, within white muzzle and above chin. Preserve round shiny red nose exactly: shape, color, highlight, outline, size and position. Keep original whiskers, face markings and silhouette. Both eyes remain fully OPEN with original pupils, whites, highlights and purple left lens tint. Keep all spectacles rims and diagonal black spectacle arm inside right lens unchanged. Exact original 1254x1254 canvas, scale and alignment. Preserve antlers, ears, holly and berries, collar studs, gold bell, harness, buckles, paws and tail identically. True transparent background, preserve alpha. No crop, text, added objects, glow or shadow. Only mouth changes.
```

## Validación

`tests/edureno.test.cjs`: importación/exportación, transparencia, cuatro poses distintas, original intacto y combinación independiente de párpados y boca. `npm.cmd run smoke -- --packaged --edureno`: catálogo, audio sintético, cuatro poses exactas en escritorio/panel/salida de navegador, parpadeo automático, cierre al apagar el micro, persistencia, exportación y lienzo vertical. Usa `.smoke-data`, sin modificar preferencias diarias.

La prueba de Electron no valida el micrófono físico ni una escena real de OBS.
