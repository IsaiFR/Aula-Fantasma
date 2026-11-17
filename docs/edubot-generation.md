# EduBot

Nombre visible exacto solicitado: **EduBot**. Paquete de voz autocontenido v6: `pets/EduBot-Voz.pet`. Solo habla según el nivel del micrófono y parpadea, en silencio y al hablar. El parpadeo reduce los ojos LED arqueados a líneas estrechas de puntos cian. Antena, luces del cuerpo y capa permanecen fijas; sin acciones especiales.

## Recursos

Original: ``C:/Users/kikef/Downloads/EduCat`s/EduBot.png``. Copia intacta en `web/edubot/reference.png`; `open.png` conserva sus bytes y transparencia.

Ediciones con imagegen incorporado: `blink-source.png` y `talking-source.png`. Poses finales de 1254 × 1254 px: `open`, `closed`, `talking` y `talkingClosed`.

Regenerar: `node scripts/create-edubot.cjs`, con `@napi-rs/canvas` del runtime de Codex o `AULA_CANVAS_MODULE`. El generador combina únicamente las regiones faciales de `regions.json`, conserva el alfa original y utiliza fundido elíptico sobre las lentes oscuras para evitar bordes rectangulares. Protege el brazo lateral derecho de los lentes. Antena y esfera, visor, orejas, casco, luces fuera de los ojos, logo del pecho, capa y sus cuatro símbolos, armadura, articulaciones, patas y cola permanecen tomados del original. El paquete terminado no depende de Downloads ni del generador.

## Prompts, imagegen incorporado

Parpadeo LED:

```text
Use case: precise-object-edit. Edit target: supplied full-body white/blue robot cat EduBot, black visor behind black rectangular eyeglasses, happy cyan DOT-MATRIX LED eyes, white cat muzzle, antenna with cyan orb, blue cape with four white controller symbols, white chest logo and cyan body lights. Expression pose for microphone-reactive desktop pet. Exact original 1254x1254 canvas, original position, scale, margins, silhouette and transparent alpha. Preserve glasses frames and right diagonal arm, visor reflections, ears, white/blue helmet, antenna and orb, ALL other cyan lights, white chest logo, blue cape and all four symbols, white armor, paws, joints and tail stripe IDENTICAL. No crop, zoom, recentering, new text, accessories, objects, motion, transformations, flashing lights or special effects. Change ONLY specified facial expression. BLINK pose: close BOTH cyan dot-matrix eyes behind glasses by changing each existing tall happy arched LED eye into a short thin horizontal row / gently curved narrow line of cyan LED dots at the same centers, as a robotic blink. Keep dot-matrix style and dark lens backgrounds; no tall arched glyphs remain, no flesh eyelids. Preserve original CLOSED black cat smile and nose. All lights outside the eyes unchanged.
```

Habla:

```text
Use case: precise-object-edit. Edit target: supplied full-body white/blue robot cat EduBot, black visor behind black rectangular eyeglasses, happy cyan DOT-MATRIX LED eyes, white cat muzzle, antenna with cyan orb, blue cape with four white controller symbols, white chest logo and cyan body lights. Expression pose for microphone-reactive desktop pet. Exact original 1254x1254 canvas, original position, scale, margins, silhouette and transparent alpha. Preserve glasses frames and right diagonal arm, visor reflections, ears, white/blue helmet, antenna and orb, ALL other cyan lights, white chest logo, blue cape and all four symbols, white armor, paws, joints and tail stripe IDENTICAL. No crop, zoom, recentering, new text, accessories, objects, motion, transformations, flashing lights or special effects. Change ONLY specified facial expression. Keep BOTH happy cyan arched dot-matrix LED eyes fully OPEN exactly as original. Change ONLY the small CLOSED black cat smile directly BELOW nose into a small cheerful OPEN speaking mouth with dark interior and tiny pink tongue, centered near x815,y548 within x758..871,y513..580. Preserve nose and its stem, whiskers, white muzzle shading and outline. No jaw, head or helmet movement.
```

## Validación

`tests/edubot.test.cjs`: importación/exportación, transparencia, cuatro poses distintas, original intacto fuera de ojos y boca y combinación independiente de párpados y boca.

`npm.cmd run smoke -- --packaged --edubot`: catálogo, audio sintético, cuatro poses exactas en escritorio/panel/salida de navegador, parpadeo automático, cierre al apagar el micro, persistencia, exportación y lienzo vertical. Usa `.smoke-data`, sin modificar preferencias diarias.

La prueba de Electron no valida el micrófono físico ni una escena real de OBS.
