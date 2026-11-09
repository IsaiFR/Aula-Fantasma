# EduDoom

Nombre visible exacto: **EduDoom**. Paquete de voz autocontenido v6: `pets/EduDoom-Voz.pet`. Usa la captura local del micrófono y los controles actuales de entrada, sensibilidad y espera de cierre. Solo habla y parpadea, en silencio y al hablar. Sin flotación, movimiento de ropa ni acciones especiales.

## Recursos

Original: ``C:/Users/kikef/Downloads/EduCat`s/EduDoom.png``. Copia intacta en `web/edudoom/reference.png`; `open.png` conserva sus bytes. Ediciones con imagegen incorporado: `blink-source.png` y `talking-source.png`. Poses finales de 1254 × 1254 px: `open`, `closed`, `talking` y `talkingClosed`.

Regenerar: `node scripts/create-edudoom.cjs`, con `@napi-rs/canvas` del runtime de Codex o `AULA_CANVAS_MODULE`. El generador combina solo las regiones faciales de `regions.json`, conserva el alfa y los píxeles opacos fuera de ellas. El paquete terminado no depende de Downloads ni del generador.

## Prompts finales, imagegen incorporado

Parpadeo:

```text
Use case: precise-object-edit. Edit target: supplied full body EduDoom cat wearing a silver riveted metal face mask, dark green hood and cape, silver armor, brown belt and gold cape clasps. Create BLINK pose for an audio reactive pet. Change ONLY the two eyes INSIDE the mask's black rectangular eye openings to fully CLOSED gentle dark curved eyelid lines; no visible pupils, eye whites or highlights. Preserve the gray shading inside the left opening and light shading inside right opening, ALL black eye-opening borders, metal nose bridge, mask panels, rivets and reflections exactly. Keep original nose, CLOSED cat smile, cheek vents and chin plate identical. Exact original 1254x1254 canvas, placement, scale and silhouette. Keep green hood, cape folds, ears, pink ear interiors, gold clasps and chain, chainmail, armor, belt, buckle, paws and tail identical. True transparent background, preserve alpha. No crop, added objects, text, glow, transformation or shadow. Only eyes change.
```

Habla:

```text
Use case: precise-object-edit. Edit target: supplied full body EduDoom cat wearing a silver riveted metal face mask, dark green hood and cape, silver armor, brown belt and gold cape clasps. Create SPEAKING pose for an audio reactive pet. Change ONLY the small central CLOSED cat smile directly BELOW the black nose into a small friendly OPEN talking mouth, dark interior and little pink tongue, confined to the central muzzle panel above the chin plate. Keep original black nose and stem, all surrounding silver mask panels, rivets, cheek vents, mask outline and chin plate identical. Both eyes remain fully OPEN with original pupils, whites, highlights, gray shading and black eye-opening borders. Exact original 1254x1254 canvas, placement, scale and silhouette. Keep green hood, cape folds, ears, pink ear interiors, gold clasps and chain, chainmail, armor, belt, buckle, paws and tail identical. True transparent background, preserve alpha. No crop, added objects, text, glow, transformation or shadow. Only central mouth changes.
```

## Validación

`tests/edudoom.test.cjs`: importación/exportación, transparencia, cuatro poses distintas, original intacto y combinación independiente de párpados y boca. `npm.cmd run smoke -- --packaged --edudoom`: catálogo, audio sintético, cuatro poses exactas en escritorio/panel/salida de navegador, parpadeo automático, cierre al apagar el micro, persistencia, exportación y lienzo vertical. Usa `.smoke-data`, sin modificar preferencias diarias.

La prueba de Electron no valida el micrófono físico ni una escena real de OBS.
