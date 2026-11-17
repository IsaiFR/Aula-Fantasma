# EduAlloy

Nombre visible exacto solicitado: **EduAlloy**. Paquete de voz autocontenido v6: `pets/EduAlloy-Voz.pet`. Solo habla según el nivel del micrófono y parpadea, en silencio y al hablar. Sin acciones especiales: cabello, equipo y luz del dispositivo permanecen fijos.

## Recursos

Original: ``C:/Users/kikef/Downloads/EduCat`s/EduAlloy.png``. Copia intacta en `web/edualloy/reference.png`; `open.png` conserva sus bytes y transparencia.

Ediciones con imagegen incorporado: `blink-source.png` y `talking-source.png`. Poses finales de 1254 × 1254 px: `open`, `closed`, `talking` y `talkingClosed`.

Regenerar: `node scripts/create-edualloy.cjs`, con `@napi-rs/canvas` del runtime de Codex o `AULA_CANVAS_MODULE`. El generador combina únicamente las regiones faciales de `regions.json`, conserva el alfa original y protege el brazo diagonal de los lentes. Las regiones de ojos y boca no se solapan y el fundido izquierdo de la boca es estrecho para retirar la comisura sin invadir la lente. Cabello, trenzas, cuentas, dispositivo cian, bufanda, collares, pieles, ropa, brazalete, arco, flechas, carcaj, patas y cola permanecen tomados del original. El paquete terminado no depende de Downloads ni del generador.

## Prompts, imagegen incorporado

Parpadeo:

```text
Use case: precise-object-edit. Edit target: supplied full-body black and white cat EduAlloy with abundant orange/red hair, braided hair with beads, black rectangular glasses, cyan glowing triangular temple device, blue scarf and necklaces, fur/leather outfit, white bracer, bow and quiver. Expression asset for microphone-reactive desktop pet. Preserve exact original 1254x1254 canvas, position, scale, margins, silhouette and transparent alpha. Preserve all hair strands, braids and beads, ears, temple device and cyan light, glasses frames and diagonal dark arm in right lens, purple left lens tint, nose, whiskers, blue scarf, necklaces, fur trim, leather clothing, bracer patterns, bow, arrows, quiver, paws and dark tail IDENTICAL. No crop, zoom, recentering, text, new objects/accessories, motion, transformations or special effects. Change ONLY specified facial feature. Close BOTH facial eyes naturally BEHIND the glasses, replacing pupils, eye highlights and visible eye whites with matching fur/lens-colored eyelids and soft curved dark closed-eye lines. Left lens stays purple. Keep glasses rims and right diagonal arm intact. Preserve original CLOSED smile and nose.
```

Habla:

```text
Use case: precise-object-edit. Edit target: supplied full-body black and white cat EduAlloy with abundant orange/red hair, braided hair with beads, black rectangular glasses, cyan glowing triangular temple device, blue scarf and necklaces, fur/leather outfit, white bracer, bow and quiver. Expression asset for microphone-reactive desktop pet. Preserve exact original 1254x1254 canvas, position, scale, margins, silhouette and transparent alpha. Preserve all hair strands, braids and beads, ears, temple device and cyan light, glasses frames and diagonal dark arm in right lens, purple left lens tint, nose, whiskers, blue scarf, necklaces, fur trim, leather clothing, bracer patterns, bow, arrows, quiver, paws and dark tail IDENTICAL. No crop, zoom, recentering, text, new objects/accessories, motion, transformations or special effects. Change ONLY specified facial feature. Keep BOTH eyes fully OPEN with original pupils, highlights and glasses. Replace ONLY the little closed smile BELOW nose with a small friendly OPEN speaking mouth, dark interior and tiny pink tongue. Center near x800,y505, inside x748..851,y474..545. Preserve original nose and its stem, whiskers, face outline and fur shading. No jaw or head movement.
```

## Validación

`tests/edualloy.test.cjs`: importación/exportación, transparencia, cuatro poses distintas, original intacto fuera de ojos y boca y combinación independiente de párpados y boca.

`npm.cmd run smoke -- --packaged --edualloy`: catálogo, audio sintético, cuatro poses exactas en escritorio/panel/salida de navegador, parpadeo automático, cierre al apagar el micro, persistencia, exportación y lienzo vertical. Usa `.smoke-data`, sin modificar preferencias diarias.

La prueba de Electron no valida el micrófono físico ni una escena real de OBS.
