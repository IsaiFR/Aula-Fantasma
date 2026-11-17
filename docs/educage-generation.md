# EduCage

Paquete de voz autocontenido v6: `pets/EduCage-Voz.pet`. Abre la boca según el nivel del micrófono y parpadea en silencio y al hablar.

Original: ``C:/Users/kikef/Downloads/EduCat`s/EduCage.png``. En `web/educage`, `reference.png` y `open.png` conservan los bytes y la transparencia del original. `blink-source.png` y `talking-source.png` son las ediciones del generador integrado. Las cuatro poses finales tienen 1254 × 1254 px.

Regenerar con `node scripts/create-educage.cjs`, usando `@napi-rs/canvas` del runtime de Codex o `AULA_CANVAS_MODULE`. El generador alinea la boca bajo la nariz y aplica las dos expresiones solo dentro de las regiones de `regions.json`. Mantiene el alfa, el marco y los reflejos más claros de las gafas; el gesto, el destello, la chaqueta con las letras JC y la hebilla CAGE provienen del original.

## Prompts del generador de imágenes integrado

Parpadeo:

```text
Use case: precise-object-edit. Animation sprite for EduCage. Input image: supplied EduCage PNG is the edit target. Output one full image on the same 1254 × 1254 transparent canvas at the same position and scale. Preserve hair, purple glasses frame, bright diagonal lens reflections, cream face, nose, whiskers, blue jacket and JC letters, CAGE buckle, paw pose, and gold sparkle. The rest of the illustration must stay fixed. Change only the interiors of the sunglass lenses to portray both eyes closing behind the dark tint. Add two clearly legible but restrained closed eyelid arcs with ends gently pointing upward, muted dark lavender-gray as seen through tinted glass, centered separately at approximately (662,413) and (928,414). The bright diagonal specular highlights stay on top in their original positions. Keep glasses fully on, dark and reflective, with no pupil or eye whites and no light emission. Do not change the mouth.
```

Habla:

```text
Use case: precise-object-edit. Animation sprite for EduCage. Input image: supplied EduCage PNG is the edit target. Output one full image on the same 1254 × 1254 transparent canvas at the same position and scale. Preserve hair, purple glasses frame, bright diagonal lens reflections, cream face, nose, whiskers, blue jacket and JC letters, CAGE buckle, paw pose, and gold sparkle. The rest of the illustration must stay fixed. Change only the small black smile below the nose to a modest open, cheerful speaking mouth. Keep the nose and connecting line still, retain the end points of the smile around x750–855, start opening around y484 and keep the bottom around y534. Draw a dark interior, with a small muted rose tongue at the lower edge. Match line art, muzzle shading and expression. The sunglasses stay completely unchanged.
```

## Validación

`tests/educage.test.cjs` comprueba la exportación autocontenida, la transparencia, el alcance de los cambios de píxel y la combinación independiente de ambas expresiones.

`npm.cmd run smoke -- --packaged --educage` comprueba catálogo, audio simulado, sincronización de las cuatro poses en Electron, parpadeo automático, reposo al apagar el micrófono, selección, exportación y lienzo vertical. Usa preferencias aisladas en `.smoke-data`.
