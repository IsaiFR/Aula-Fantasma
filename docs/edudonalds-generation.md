# EduDonalds

Nombre visible exacto solicitado: **EduDonalds**. Paquete de voz autocontenido v6: `pets/EduDonalds-Voz.pet`. Usa el micrófono y los controles actuales de entrada, sensibilidad y espera de cierre. Solo habla y parpadea, en silencio y al hablar. Sin acciones especiales.

## Recursos

Original: ``C:/Users/kikef/Downloads/EduCat`s/EduDonalds.png``. Copia intacta en `web/edudonalds/reference-source.png`. El original RGB de 1293 × 1217 px contiene un cuadriculado opaco. Imagegen incorporado lo retiró y entregó `reference.png`, base transparente de 1293 × 1216 px. `open.png` conserva los bytes de esa base, no los del original opaco.

Ediciones derivadas con imagegen incorporado: `blink-source.png` y `talking-source.png`. El generador admite y normaliza diferencias de hasta dos píxeles en el tamaño de estas referencias; todas las poses finales son de 1293 × 1216 px: `open`, `closed`, `talking` y `talkingClosed`.

Regenerar: `node scripts/create-edudonalds.cjs`, con `@napi-rs/canvas` del runtime de Codex o `AULA_CANVAS_MODULE`. Se combinan únicamente las regiones faciales de `regions.json`, conservando el alfa de la base y protegiendo el brazo diagonal derecho de los lentes. Gorra, logos, gafete EduCat, diadema y micrófono, uniforme, bigotes, cola y patas permanecen tomados de la base recortada. El paquete terminado no depende de Downloads ni del generador.

## Prompts, imagegen incorporado

Recorte transparente:

```text
Use case: background-extraction. Edit target: supplied full-body black and white cat in red fast-food uniform, black cap with yellow arches, black rectangular glasses and black headset with boom microphone. Desktop pet name EduDonalds. Remove ONLY the drawn gray-white CHECKERBOARD BACKGROUND and replace with TRUE TRANSPARENT ALPHA, including spaces around whiskers, tail, legs and headset. The checkerboard is baked into the supplied RGB image, not transparency. Preserve entire cat IDENTICAL: cap and yellow logos, ears, black glasses rims and diagonal arm in right lens, purple left lens, OPEN eyes, CLOSED smile, nose, whiskers, black headset and full boom microphone in front of cheek, red/yellow uniform and all logos, badge text EduCat, buttons, white paws and dark tail. Preserve the exact original canvas 1293 pixels wide x1217 high, cat scale, position, and all margins. No crop, resize, zoom, recenter, new objects, text edits, added shadows, blur or glow. Only clean removal of checkerboard to transparent background. Do not erase white fur or black clothing/accessories.
```

Parpadeo:

```text
Use case: precise-object-edit. Edit target: supplied transparent full-body black and white cat EduDonalds, red/yellow fast-food uniform, black cap, black glasses and headset. Desktop pet expression. Preserve exact 1293x1217 canvas, original scale, position, silhouette and true transparent alpha. Preserve cap and all yellow logos, ears, lens tint (purple on left), both glasses frames and diagonal arm in right lens, nose, whiskers, full headset and entire boom microphone in front of cheek, uniform and badge text EduCat, buttons, paws and tail IDENTICAL. No text edits, crop, zoom, recentering, new objects, added shadows or effects. Change ONLY the requested facial expression. Close BOTH eyes naturally BEHIND glasses, replacing open pupils, highlights and whites with matching fur/lens eyelids and soft dark curved closed-eye lines. Left lens stays purple and right white. Keep glasses frames and diagonal arm intact. Keep original CLOSED smile, nose and headset unchanged.
```

Habla:

```text
Use case: precise-object-edit. Edit target: supplied transparent full-body black and white cat EduDonalds, red/yellow fast-food uniform, black cap, black glasses and headset. Desktop pet expression. Preserve exact 1293x1217 canvas, original scale, position, silhouette and true transparent alpha. Preserve cap and all yellow logos, ears, lens tint (purple on left), both glasses frames and diagonal arm in right lens, nose, whiskers, full headset and entire boom microphone in front of cheek, uniform and badge text EduCat, buttons, paws and tail IDENTICAL. No text edits, crop, zoom, recentering, new objects, added shadows or effects. Change ONLY the requested facial expression. Keep BOTH eyes fully OPEN and glasses unchanged. Change ONLY the little closed smile BELOW nose to a small friendly OPEN talking mouth with dark interior and tiny pink tongue. Center near x798 y485, entirely within x748..846 y449..520. Preserve the nose and its stem, whiskers and headset microphone near left cheek. No head or jaw movement.
```

## Validación

`tests/edudonalds.test.cjs`: importación/exportación, transparencia, cuatro poses distintas, conservación de la base fuera de ojos y boca y combinación independiente de párpados y boca.

`npm.cmd run smoke -- --packaged --edudonalds`: catálogo, audio sintético, cuatro poses exactas en escritorio/panel/salida de navegador, parpadeo automático, cierre al apagar el micro, persistencia, exportación y lienzo vertical. Usa `.smoke-data`, sin modificar preferencias diarias.

La prueba de Electron no valida el micrófono físico ni una escena real de OBS.
