# EduReturnal

Nombre visible exacto solicitado: **EduReturnal**. Paquete de voz autocontenido v6: `pets/EduReturnal-Voz.pet`. Habla según el nivel del micrófono y parpadea en silencio y al hablar. Sin acciones especiales: visor, grietas, luces, pantalla y equipo permanecen fijos.

## Recursos

Original: ``C:/Users/kikef/Downloads/EduCat`s/EduReturnal.png``. Copia intacta en `web/edureturnal/reference.png`; `open.png` conserva sus bytes. SHA-256 original/referencia: `4632C7853A234254E4F637CE6E1311B0DF16EF56443B8CB5C34B03BF286C4224`. El original ya incluye transparencia.

Ediciones con imagegen incorporado: `blink-source.png` y `talking-source.png`. Poses finales de 1254 × 1254 px: `open`, `closed`, `talking` y `talkingClosed`.

Regenerar: `node scripts/create-edureturnal.cjs`, con `@napi-rs/canvas` del runtime de Codex o `AULA_CANVAS_MODULE`. El generador combina únicamente las regiones faciales de `regions.json`, conserva el alfa original y protege el brazo diagonal derecho de los lentes y los reflejos superiores izquierdos de la lente. Grietas y borde roto del visor, luces, pantalla del pecho, cables, mochila, bolsillos, textura del traje, cola y patas permanecen tomados del original. El paquete terminado no depende de Downloads ni del generador.

## Prompts, imagegen incorporado

Parpadeo:

```text
Use case: precise-object-edit. Edit target: supplied full-body black/white cat EduReturnal wearing worn white/gray space suit with orange panels and lights, large transparent cracked glass helmet, black eyeglasses and backpack. Expression pose for microphone reactive desktop pet. Preserve exact original 1254x1254 canvas, position, scale, empty margins, full silhouette and transparent alpha. Preserve helmet and ALL cracks, scratches, broken glass edges, orange lights, reflections, cables, backpack, pouches, chest screen and target symbol, fabric/metal weathering, orange markings, paws and fur tail IDENTICAL. Preserve black glasses rims, purple left lens tint, lens reflections/highlights and diagonal glasses arm in right lens, nose and whiskers. No crop, zoom, recenter, extra text, new objects, effects, motion, transformations, glow animation or repairs to broken helmet. Change ONLY requested facial feature BEHIND the glasses and helmet glass. Close BOTH facial eyes naturally behind the existing glasses, replacing dark pupils, eye highlights and visible eye whites with softly curved dark closed eyelid lines and matching white fur/tinted lens colors. Keep existing lens reflections visible as highlights ON THE LENS, distinct from eye highlights. Left lens remains purple. Glasses frames, right diagonal arm and helmet cracks stay intact. Keep the original CLOSED smile and nose unchanged.
```

Habla:

```text
Use case: precise-object-edit. Edit target: supplied full-body black/white cat EduReturnal wearing worn white/gray space suit with orange panels and lights, large transparent cracked glass helmet, black eyeglasses and backpack. Expression pose for microphone reactive desktop pet. Preserve exact original 1254x1254 canvas, position, scale, empty margins, full silhouette and transparent alpha. Preserve helmet and ALL cracks, scratches, broken glass edges, orange lights, reflections, cables, backpack, pouches, chest screen and target symbol, fabric/metal weathering, orange markings, paws and fur tail IDENTICAL. Preserve black glasses rims, purple left lens tint, lens reflections/highlights and diagonal glasses arm in right lens, nose and whiskers. No crop, zoom, recenter, extra text, new objects, effects, motion, transformations, glow animation or repairs to broken helmet. Change ONLY requested facial feature BEHIND the glasses and helmet glass. Keep BOTH eyes fully OPEN with original pupils and eyeglass lens reflections. Replace ONLY the small central closed cat smile BELOW nose with a small friendly OPEN speaking mouth, dark interior and tiny pink tongue. Center near x783,y445, within x739..831,y414..476. Preserve original nose and its stem, whiskers, muzzle fur texture and face outline. No jaw or head movement.
```

## Validación

`tests/edureturnal.test.cjs`: importación/exportación, transparencia, cuatro poses distintas, original intacto fuera de ojos y boca y combinación independiente de párpados y boca.

`npm.cmd run smoke -- --packaged --edureturnal`: catálogo, audio sintético, cuatro poses exactas en escritorio/panel/salida de navegador, parpadeo automático, cierre al apagar el micro, persistencia, exportación y lienzo vertical. Usa `.smoke-data`, sin modificar preferencias diarias.

La prueba de Electron no valida el micrófono físico ni una escena real de OBS.
