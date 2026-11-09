# EduDominos

Nombre del personaje y paquete: **EduDominos**, `pets/EduDominos-Voz.pet` (voz autocontenida v6). Texto exacto solicitado para el gafete: **EduCat**. Solo habla según el nivel del micrófono y parpadea, en silencio y al hablar. Sin acciones especiales.

## Gafete y recursos

Se añadió un gafete en el pecho izquierdo del personaje: fondo crema, borde oscuro, logo de Domino’s y texto negro **EduCat**. `web/edudonalds/reference.png` se usó únicamente como referencia del estilo del gafete. Los logos de la gorra y del pecho, los botones y el uniforme permanecen visibles. El nombre del gafete no cambia el nombre de la mascota en el catálogo.

Original: ``C:/Users/kikef/Downloads/EduCat`s/EduDominos.png``. Copia intacta en `web/edudominos/reference-source.png`. El original RGB tenía fondo negro opaco. Imagegen incorporado produjo `reference.png` con gafete y transparencia; `open.png` conserva los bytes de esa nueva base, no los del original sin gafete.

Ediciones derivadas con imagegen incorporado: `blink-source.png` y `talking-source.png`. Poses finales de 1254 × 1254 px: `open`, `closed`, `talking` y `talkingClosed`.

Regenerar: `node scripts/create-edudominos.cjs`, con `@napi-rs/canvas` del runtime de Codex o `AULA_CANVAS_MODULE`. Se combinan únicamente las regiones faciales de `regions.json`, conservando el alfa de la base y protegiendo el brazo diagonal derecho de los lentes. La región izquierda cubre todo el blanco del ojo para evitar restos al cerrar. Gafete y texto EduCat, gorra, logos, uniforme, botones, bigotes, cola y patas permanecen tomados de la base con gafete. El paquete no depende de Downloads ni del generador.

## Prompts, imagegen incorporado

Base transparente con gafete (imagen 1: EduDominos original; imagen 2: EduDonalds como referencia de estilo):

```text
Use case: precise-object-edit and background-extraction. Image 1 is EDIT TARGET: full-body black/white cat in blue/red Domino's cap and uniform. Image 2 is ONLY a style reference for the small employee name badge, NOT a second character to copy. Prepare target for desktop pet named EduDominos. Make exactly TWO changes: (1) remove opaque black background to TRUE TRANSPARENT alpha, preserving dark fur, tail and outlines; (2) add a cream/off-white rounded rectangular employee badge with thick dark navy border on viewer-LEFT chest below collar, roughly x510..678,y678..737. Badge like image 2: small red-and-blue Domino's domino logo on left and bold readable black exact name "EduCat" on right. The badge MUST read EduCat (not EduDominos). Fit naturally to shirt perspective, slightly tilted if needed; do not cover existing viewer-right Domino's chest logo or center buttons. Keep cap and shirt existing logos/text identical. Preserve ears, OPEN eyes, CLOSED smile, face markings, purple left eyeglass lens, black glasses rims and diagonal right arm, nose, whiskers, full uniform with piping and red trims, buttons, paws, tail and silhouette IDENTICAL. No headset or new accessories except the requested badge. Exact original 1254x1254 canvas, original cat position, scale and empty margins. No crop, zoom, recenter, extra text, added shadows or effects. Only add badge and remove background.
```

Parpadeo:

```text
Use case: precise-object-edit. Edit target: supplied transparent full-body black/white cat wearing blue/red Domino's cap and uniform with cream badge reading EduCat. Desktop pet NAME is EduDominos, badge TEXT is EduCat. Expression asset for microphone reactive pet. Exact original 1254x1254 canvas, position, scale, margins, silhouette and true transparent alpha. Preserve cream badge with Domino's logo and exact text "EduCat" IDENTICAL and readable. Preserve cap/chest logos and text, blue shirt with red trims and white piping, buttons, ears, black glasses rims, purple left lens tint, diagonal dark arm in right lens, nose, whiskers, paws and tail identical. No text changes, new objects/accessories, crop, zoom, recenter, motion or effects. Change ONLY requested facial feature. Close BOTH eyes naturally BEHIND the glasses, replacing open pupils, highlights and visible eye whites with matching fur/lens-colored eyelids and soft curved dark closed-eye lines. Left lens remains purple. Keep glasses rims and diagonal right arm intact. Keep original CLOSED smile.
```

Habla:

```text
Use case: precise-object-edit. Edit target: supplied transparent full-body black/white cat wearing blue/red Domino's cap and uniform with cream badge reading EduCat. Desktop pet NAME is EduDominos, badge TEXT is EduCat. Expression asset for microphone reactive pet. Exact original 1254x1254 canvas, position, scale, margins, silhouette and true transparent alpha. Preserve cream badge with Domino's logo and exact text "EduCat" IDENTICAL and readable. Preserve cap/chest logos and text, blue shirt with red trims and white piping, buttons, ears, black glasses rims, purple left lens tint, diagonal dark arm in right lens, nose, whiskers, paws and tail identical. No text changes, new objects/accessories, crop, zoom, recenter, motion or effects. Change ONLY requested facial feature. Keep BOTH eyes fully OPEN and glasses unchanged. Replace ONLY the little closed smile BELOW nose with small friendly OPEN speaking mouth, dark interior and tiny pink tongue. Center near x752,y487 within x709..794,y452..516. Preserve nose and its stem, whiskers and face outline. No jaw or head movement.
```

## Validación

Revisión visual: gafete legible con el texto exacto EduCat. `tests/edudominos.test.cjs`: importación/exportación, transparencia, cuatro poses distintas, conservación de la base fuera de ojos y boca (incluido el gafete) y combinación independiente de párpados y boca.

`npm.cmd run smoke -- --packaged --edudominos`: catálogo, audio sintético, cuatro poses exactas en escritorio/panel/salida de navegador, parpadeo automático, cierre al apagar el micro, persistencia, exportación y lienzo vertical. Usa `.smoke-data`, sin modificar preferencias diarias.

La prueba de Electron no valida el micrófono físico ni una escena real de OBS.
