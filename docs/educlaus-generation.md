# EduClaus

Nombre visible exacto: **EduClaus**. Paquete de voz autocontenido v6: `pets/EduClaus-Voz.pet`. Usa la captura local del micrófono y los controles actuales. Solo habla y parpadea, en silencio y al hablar. Sin flotación, movimiento de ropa ni acciones especiales.

## Recursos

Original: ``C:/Users/kikef/Downloads/EduCat`s/EduClaus.png``. Copia intacta en `web/educlaus/reference.png`; `open.png` conserva sus bytes. Ediciones con imagegen incorporado: `blink-source.png` y `talking-source.png`. Poses finales de 1254 × 1254 px: `open`, `closed`, `talking` y `talkingClosed`.

Regenerar: `node scripts/create-educlaus.cjs`, con `@napi-rs/canvas` del runtime de Codex o `AULA_CANVAS_MODULE`. El generador combina solo las regiones faciales de `regions.json`, conserva el alfa y los píxeles opacos fuera de ellas, y protege el brazo diagonal de los lentes. El saco, los juguetes y el resto del personaje conservan la base original. El paquete terminado no depende de Downloads ni del generador.

## Prompts finales, imagegen incorporado

Parpadeo:

```text
Use case: precise-object-edit. Edit target: provided full body EduClaus main black and white Santa cat with spectacles, large white beard, Santa hat and suit, and red gift sack with toys. Create BLINK pose for an audio reactive pet. Change ONLY BOTH EYES OF THE MAIN CAT inside its spectacles to fully CLOSED gentle curved dark eyelid lines, no pupils, whites or highlights. Preserve purple tint of left lens, white right lens, glasses rims and diagonal spectacle arm inside right lens. Preserve main cat nose, CLOSED mouth, mustache, beard and whiskers exactly. Do not change the faces of the bear or toy nutcracker in the sack. Exact original 1254x1254 canvas, main cat position, scale and silhouette. Keep Santa hat, fur trim, suit, belt, buttons, paws, tail, sack, rope, teddy bear, rocket, nutcracker, ball, candy cane and gift box identical. True transparent background, preserve alpha. No text, crop, new objects, glow or shadow. Only main cat eyes change.
```

Habla:

```text
Use case: precise-object-edit. Edit target: provided full body EduClaus main black and white Santa cat with spectacles, large white beard, Santa hat and suit, and red gift sack with toys. Create SPEAKING pose for an audio reactive pet. Change ONLY the small central CLOSED MOUTH OF THE MAIN CAT directly below its nose and between the two mustache lobes into a small friendly OPEN talking mouth with a dark interior and little pink tongue. Keep it compact within the mustache and above the flowing beard. Preserve nose, mustache lobes, beard curls, whiskers and face contour exactly. Both main cat eyes stay fully OPEN with original pupils, whites, highlights, purple left lens tint, glasses rims and diagonal spectacle arm. Do not change the bear or toy nutcracker faces. Exact original 1254x1254 canvas, main cat position, scale and silhouette. Keep Santa hat, fur trim, suit, belt, buttons, paws, tail, sack, rope, teddy bear, rocket, nutcracker, ball, candy cane and gift box identical. True transparent background, preserve alpha. No text, crop, new objects, glow or shadow. Only main cat central mouth changes.
```

## Validación

`tests/educlaus.test.cjs`: importación/exportación, transparencia, poses distintas, original intacto y combinación independiente de párpados y boca. `npm.cmd run smoke -- --packaged --educlaus`: catálogo, audio sintético, cuatro poses exactas en escritorio/panel/salida de navegador, parpadeo automático, cierre al apagar el micro, persistencia, exportación y lienzo vertical. Usa `.smoke-data`, sin modificar preferencias diarias.

La prueba de Electron no valida el micrófono físico ni una escena real de OBS.
