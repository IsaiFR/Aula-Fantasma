# EduOxxo

Nombre visible exacto solicitado: **EduOxxo**. Paquete de voz autocontenido v6: `pets/EduOxxo-Voz.pet`. Habla según el nivel del micrófono y parpadea en silencio y al hablar. Sin acciones especiales.

## Gafete y recursos

Se añadió el gafete solicitado en el pecho izquierdo del personaje: fondo crema, borde oscuro, logo de OXXO a la izquierda y texto exacto **EduOxxo** a la derecha. Se usó `web/edudonalds/reference.png` únicamente como referencia del estilo del gafete; no se copiaron sus accesorios. La gorra, el logo del pecho y los botones permanecen visibles.

Original: ``C:/Users/kikef/Downloads/EduCat`s/EduOxxo.png``. Copia intacta en `web/eduoxxo/reference-source.png`. El original RGB tenía fondo negro opaco. Imagegen incorporado produjo `reference.png` con el gafete y transparencia. `open.png` conserva los bytes de esa nueva base, no los del original sin gafete.

Ediciones derivadas con imagegen incorporado: `blink-source.png` y `talking-source.png`. Poses finales de 1254 × 1254 px: `open`, `closed`, `talking` y `talkingClosed`.

Regenerar: `node scripts/create-eduoxxo.cjs`, con `@napi-rs/canvas` del runtime de Codex o `AULA_CANVAS_MODULE`. Se combinan únicamente las regiones faciales de `regions.json`, conservando el alfa de la base y protegiendo el brazo diagonal derecho de los lentes. Gafete y texto, gorra, logos, uniforme, botones, bigotes, cola y patas permanecen tomados de la base con gafete. El paquete terminado no depende de Downloads ni del generador.

## Prompts, imagegen incorporado

Base transparente con gafete (imagen 1: EduOxxo original; imagen 2: EduDonalds como referencia de gafete):

```text
Use case: precise-object-edit and background-extraction. Image 1 is the EDIT TARGET: full-body black/white cat in red/yellow OXXO cap and uniform. Image 2 is ONLY a style reference for its small employee NAME BADGE; do not copy that cat or its clothing/headset. Prepare target as desktop pet EduOxxo. Make exactly TWO changes: (1) remove opaque black background to TRUE transparent alpha, preserving navy/black fur and outlines. (2) Add a small professional employee name badge on viewer-LEFT chest, below collar and above yellow stripe, roughly x510..680,y678..736. Badge like image 2: cream/off-white rounded rectangle, dark navy thick border, small red/yellow OXXO logo on left, bold black readable exact name "EduOxxo" on right. Fit naturally to shirt perspective, slightly tilted if needed. Do not cover existing viewer-right OXXO chest logo, yellow stripe or center buttons. Keep original OXXO cap and chest logos unchanged. Keep original face and OPEN eyes, CLOSED smile, black glasses/purple left lens/diagonal right arm, nose, whiskers, ears, tail, shirt shape and all trims, buttons, paws, full silhouette IDENTICAL. Do NOT add headset, microphone, other clothing or accessories. Exact original 1254x1254 canvas, character position, scale and margins. No crop, zoom, recenter, movement, effects, added shadow or extra text. Only add the badge and remove background.
```

Parpadeo:

```text
Use case: precise-object-edit. Edit target: supplied transparent full-body black/white cat EduOxxo wearing red/yellow OXXO cap and uniform and a cream employee badge reading EduOxxo. Expression asset for microphone reactive desktop pet. Exact original 1254x1254 canvas, position, scale, margins and silhouette. Preserve true transparent alpha. Preserve cream badge with small OXXO logo and EXACT text "EduOxxo" identical and readable, cap and chest OXXO logos, shirt/trims/buttons, ears, black glasses frames, purple left lens tint, diagonal dark arm in right lens, nose, whiskers, paws and tail. No crop, zoom, recentering, extra text, objects, accessories, effects or movement. Change ONLY specified facial expression. Close BOTH eyes naturally BEHIND the glasses. Replace pupils, highlights and visible eye whites with matching lens/fur-colored eyelids and small soft dark curved closed-eye lines. Keep both glasses rims and diagonal right arm intact. Preserve original CLOSED smile.
```

Habla:

```text
Use case: precise-object-edit. Edit target: supplied transparent full-body black/white cat EduOxxo wearing red/yellow OXXO cap and uniform and a cream employee badge reading EduOxxo. Expression asset for microphone reactive desktop pet. Exact original 1254x1254 canvas, position, scale, margins and silhouette. Preserve true transparent alpha. Preserve cream badge with small OXXO logo and EXACT text "EduOxxo" identical and readable, cap and chest OXXO logos, shirt/trims/buttons, ears, black glasses frames, purple left lens tint, diagonal dark arm in right lens, nose, whiskers, paws and tail. No crop, zoom, recentering, extra text, objects, accessories, effects or movement. Change ONLY specified facial expression. Keep BOTH eyes fully OPEN and original glasses unchanged. Replace ONLY the little closed smile BELOW nose with a small friendly OPEN talking mouth, dark interior and tiny pink tongue. Center near x752 y487 within x709..794,y452..516. Preserve original nose and stem, whiskers and face outline. No jaw or head movement.
```

## Validación

Revisión visual: nombre EduOxxo legible en el gafete. `tests/eduoxxo.test.cjs`: importación/exportación, transparencia, cuatro poses distintas, conservación de la base fuera de ojos y boca (incluido el gafete) y combinación independiente de párpados y boca.

`npm.cmd run smoke -- --packaged --eduoxxo`: catálogo, audio sintético, cuatro poses exactas en escritorio/panel/salida de navegador, parpadeo automático, cierre al apagar el micro, persistencia, exportación y lienzo vertical. Usa `.smoke-data`, sin modificar preferencias diarias.

La prueba de Electron no valida el micrófono físico ni una escena real de OBS.
