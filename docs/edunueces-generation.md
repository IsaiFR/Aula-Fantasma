# EduNueces

Mascota de voz autocontenida: `pets/EduNueces-Voz.pet`, nombre visible **EduNueces**. Detecta el micrófono con la captura y los controles actuales de Aula Fantasma. Solo habla y parpadea, tanto en silencio como al hablar; sin flotación, movimiento de ropa ni efectos especiales.

## Recursos

Original del usuario: ``C:/Users/kikef/Downloads/EduCat`s/EduNueces.png``. La copia intacta está en `web/edunueces/reference.png`; `open.png` conserva sus bytes. Las ediciones de imagegen integrado están en `blink-source.png` y `talking-source.png`. El generador compone únicamente las regiones faciales de `regions.json` sobre la base original, conservando el alfa y todos los píxeles opacos fuera de ellas. Las cuatro poses de 1254 × 1254 px son `open`, `closed`, `talking` y `talkingClosed`.

Regenerar: `node scripts/create-edunueces.cjs`. El generador usa `@napi-rs/canvas` desde el runtime local o `AULA_CANVAS_MODULE`; el paquete terminado funciona sin ese módulo y sin Downloads.

## Prompts finales, herramienta incorporada imagegen

Parpadeo:

```text
Use case: precise-object-edit. Edit target: the attached full body EduNueces nutcracker cat. Create the BLINK pose. Change ONLY both eyes INSIDE the spectacles to fully closed relaxed curved dark eyelid lines, no pupils or eye highlights visible. Preserve the purple tint of the left lens and white right lens. Keep spectacles frames exactly unchanged. Keep nose, mustache, gritted square nutcracker teeth and white beard unchanged. Keep the whole hat, red plume, navy red gold military nutcracker uniform, paws and tail identical. Exact original 1254x1254 canvas, character placement and scale. True transparent background. No text. Only eyes change.
```

Habla:

```text
Use case: precise-object-edit. Edit target: the attached full body EduNueces nutcracker cat. Create the SPEAKING pose. Change ONLY the small rectangular tooth-mouth directly BELOW the white mustache and ABOVE the pointed white beard into an OPEN friendly talking nutcracker mouth. Show the existing four square white teeth as an upper tooth row, with a clearly visible dark mouth opening below them and a small pink tongue. Retain nutcracker style. Keep nose, white mustache, white pointed beard and whiskers identical. Eyes remain fully open with original pupils and highlights; spectacles and tinted left lens identical. Preserve whole character, hat, red plume, navy red gold uniform, paws and tail unchanged. Exact original 1254x1254 canvas, character placement and scale. True transparent background. No text. Only the small central rectangular mouth changes.
```

## Validación

`tests/edunueces.test.cjs` comprueba importación/exportación, transparencia, conservación del original y combinación independiente de ojos y boca. `npm.cmd run smoke -- --packaged --edunueces` comprueba catálogo, captura de audio sintético, poses exactas y sincronizadas en escritorio/panel/salida de navegador, parpadeo automático, cierre al apagar el micrófono, persistencia, exportación y formato vertical. Usa `.smoke-data`, sin modificar preferencias diarias.

La prueba de Electron usa audio sintético; no valida el micrófono físico ni una escena real de OBS.
