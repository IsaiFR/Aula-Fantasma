# EduFast

Nombre visible exacto solicitado: **EduFast**. Paquete de voz autocontenido v6: `pets/EduFast-Voz.pet`. Usa el micrófono y los controles actuales de entrada, sensibilidad y espera de cierre. Solo habla y parpadea, tanto en silencio como al hablar. Sin acciones especiales.

## Recursos

Original: ``C:/Users/kikef/Downloads/EduCat`s/EduFast.png``. Copia intacta en `web/edufast/reference.png`; `open.png` conserva sus bytes. El original es PNG indexado de 8 bits con transparencia: el verde del fondo corresponde a un color de paleta con alfa cero. No se retiró ni se reconstruyó el fondo.

Ediciones con imagegen incorporado: `blink-source.png` y `talking-source.png`. Poses finales de 1254 × 1254 px: `open`, `closed`, `talking` y `talkingClosed`.

Regenerar: `node scripts/create-edufast.cjs`, con `@napi-rs/canvas` del runtime de Codex o `AULA_CANVAS_MODULE`. El generador combina únicamente las regiones faciales de `regions.json`, conserva el alfa original y protege el brazo diagonal de los lentes. Traje, logos, número 16, bandera, casco, bigotes, cola, orejas y patas permanecen tomados del original. El paquete terminado no depende de Downloads ni del generador.

## Prompts, imagegen incorporado

Parpadeo:

```text
Use case: precise-object-edit. Edit target: supplied full-body black and white cat EduFast in a red racing suit, wearing black rectangular eyeglasses, with a red racing helmet sitting next to it on the lower right. Create an expression pose for a microphone-reactive desktop pet. Exact original 1254x1254 canvas, original position, scale and silhouette. Preserve cat ears, fur, black glasses frames, purple left lens tint, white right lens, nose, whiskers, complete red racing suit, EVERY existing logo, text, number 16, stripes and flag, tail, paws, and complete helmet with all its markings IDENTICAL. Do not change, redraw or remove any logos or lettering. Background must be truly transparent alpha, preserve input transparency (the green preview background is not part of the character). No crop, zoom, text additions, new objects, shadows, movement or effects. Change ONLY the requested facial feature. Close BOTH facial eyes BEHIND the eyeglasses, with natural smooth curved dark closed eyelid lines. Remove visible pupils, eye whites and highlights inside lenses and replace with eyelids matching fur and lens tint. Keep the original CLOSED smile unchanged. Keep both glasses rims and the diagonal dark arm in right lens intact.
```

Habla:

```text
Use case: precise-object-edit. Edit target: supplied full-body black and white cat EduFast in a red racing suit, wearing black rectangular eyeglasses, with a red racing helmet sitting next to it on the lower right. Create an expression pose for a microphone-reactive desktop pet. Exact original 1254x1254 canvas, original position, scale and silhouette. Preserve cat ears, fur, black glasses frames, purple left lens tint, white right lens, nose, whiskers, complete red racing suit, EVERY existing logo, text, number 16, stripes and flag, tail, paws, and complete helmet with all its markings IDENTICAL. Do not change, redraw or remove any logos or lettering. Background must be truly transparent alpha, preserve input transparency (the green preview background is not part of the character). No crop, zoom, text additions, new objects, shadows, movement or effects. Change ONLY the requested facial feature. Keep BOTH facial eyes fully OPEN as in original. Replace ONLY the small closed smile BELOW the nose with a small friendly OPEN speaking mouth, dark interior and tiny pink tongue, centered near x730 y427 within x682..774 y401..463. Preserve nose and its stem, whiskers and face outline. No head or jaw movement.
```

## Validación

`tests/edufast.test.cjs`: importación/exportación, transparencia del PNG indexado original, cuatro poses distintas, original intacto fuera de ojos y boca y combinación independiente de párpados y boca. El decodificador independiente de pruebas admite PNG indexados de 8 bits y RGBA para conservar el original sin transcodificación.

`npm.cmd run smoke -- --packaged --edufast`: catálogo, audio sintético, cuatro poses exactas en escritorio/panel/salida de navegador, parpadeo automático, cierre al apagar el micro, persistencia, exportación y lienzo vertical. Usa `.smoke-data`, sin modificar preferencias diarias.

La prueba de Electron no valida el micrófono físico ni una escena real de OBS.
