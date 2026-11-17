# EduFallout

Nombre visible exacto solicitado: **EduFallout**. Paquete de voz autocontenido v6: `pets/EduFallout-Voz.pet`. Solo habla según el nivel del micrófono y parpadea, en silencio y al hablar.

La máscara cubre la boca: el habla se representa con un movimiento sutil de las rejillas interiores del respirador central. La máscara permanece puesta y su aro exterior se conserva. Los ojos se cierran con un parpadeo natural dentro de las lentes. Sin transformaciones ni otras acciones especiales.

## Recursos

Original: ``C:/Users/kikef/Downloads/EduCat`s/EduFallout.png``. Copia intacta en `web/edufallout/reference.png`; `open.png` conserva sus bytes y transparencia.

Ediciones con imagegen incorporado: `blink-source.png` y `talking-source.png`. Poses finales de 1254 × 1254 px: `open`, `closed`, `talking` y `talkingClosed`.

Regenerar: `node scripts/create-edufallout.cjs`, con `@napi-rs/canvas` del runtime de Codex o `AULA_CANVAS_MODULE`. El generador combina únicamente las regiones de ojos y disco interior del respirador de `regions.json`. La región `mouth` representa ese disco, recortado con una máscara elíptica para conservar el aro exterior. Se conserva el alfa original y el brazo diagonal de los lentes. Armadura, óxido, lámpara, emblemas, número 111, tubos, filtros laterales, pantalla verde, patas y cola permanecen tomados del original. El paquete terminado no depende de Downloads ni del generador.

## Prompts, imagegen incorporado

Parpadeo:

```text
Edit the supplied EduFallout reference into one animation frame, with exactly the same 1254x1254 canvas, framing, character position, proportions, transparent background, linework and illustration style. Preserve all armor, silver rust texture, blue and yellow panels, shoulder number 111, headlamp, glasses frame and diagonal right glasses arm, side filters, tubes, yellow/blue helmet emblem, wrist computer and its green figure pixel-for-pixel wherever possible. No added text or effects. Change ONLY the eyes inside the glasses: both eyes fully closed in a natural blink, two gentle dark eyelid arcs, no visible pupils or white eyeballs. Retain the left purple-tinted lens and right light lens, and their original shading and boundaries. Keep the respirator and its inner slotted grille exactly unchanged.
```

Habla con respirador:

```text
Edit the supplied EduFallout reference into one animation frame, with exactly the same 1254x1254 canvas, framing, character position, proportions, transparent background, linework and illustration style. Preserve all armor, silver rust texture, blue and yellow panels, shoulder number 111, headlamp, glasses frame and diagonal right glasses arm, side filters, tubes, yellow/blue helmet emblem, wrist computer and its green figure pixel-for-pixel wherever possible. No added text or effects. Keep both eyes fully open exactly as reference. Change ONLY the inner circular slotted diaphragm inside the central respirator, centered approximately x800 y563, to a slightly open speaking position: subtly separate or flex its existing vertical metal grille slats, with a darker inner gap suggesting speech. Retain the circular outer metal rim and all side filters unchanged. The mask stays fully on; no organic mouth, lips, tongue, teeth or face opening. No glow or motion outside this small inner respirator disc.
```

## Validación

`tests/edufallout.test.cjs`: importación/exportación, transparencia, cuatro poses distintas, original intacto fuera de ojos y respirador y combinación independiente de ojos cerrados y respirador de habla.

`npm.cmd run smoke -- --packaged --edufallout`: catálogo, audio sintético, cuatro poses exactas en escritorio/panel/salida de navegador, parpadeo automático, reposo del respirador al apagar el micro, persistencia, exportación y lienzo vertical. Usa `.smoke-data`, sin modificar preferencias diarias.

La prueba de Electron no valida el micrófono físico ni una escena real de OBS.
