# EduRivet

Nombre visible exacto solicitado: **EduRivet**, aunque el archivo fuente se llama `EduKit.png`. Paquete de voz autocontenido v6: `pets/EduRivet-Voz.pet`. Usa la captura local del micrófono y los controles actuales de entrada, sensibilidad y espera de cierre. Solo la gatita habla y parpadea, en silencio y al hablar. El robot conserva su expresión. Sin acciones especiales.

## Recursos

Original: ``C:/Users/kikef/Downloads/EduCat`s/EduKit.png``. Copia intacta en `web/edurivet/reference.png`; `open.png` conserva sus bytes. Ediciones con imagegen incorporado: `blink-source.png` y `talking-source.png`. Poses finales de 1254 × 1254 px: `open`, `closed`, `talking` y `talkingClosed`.

Regenerar: `node scripts/create-edurivet.cjs`, con `@napi-rs/canvas` del runtime de Codex o `AULA_CANVAS_MODULE`. El generador combina solo las regiones faciales de `regions.json`, conserva el alfa y los píxeles opacos fuera de ellas. El robot, las gafas de la frente, la bufanda y el equipo se toman de la base original. El paquete terminado no depende de Downloads ni del generador.

## Prompts finales, imagegen incorporado

Parpadeo:

```text
Use case: precise-object-edit. Edit target: supplied full body white and lavender striped cat with orange scarf, brown tech outfit, cyan-lensed goggles resting on its forehead, and a small yellow robot on its backpack. Name of main cat: EduRivet. Create BLINK pose for audio reactive pet. Change ONLY the MAIN CAT'S TWO FACIAL EYES below its eyebrows to fully CLOSED soft dark curved eyelids with delicate lashes; no blue irises, pupils, eye whites or highlights. Preserve white/lavender fur shading, eyebrows, original pink nose, CLOSED smile, whiskers and face outline. Do NOT alter the cyan goggles on its forehead. Do NOT alter the yellow robot, its happy cyan display eyes or any of its lights. Exact original 1254x1254 canvas, position, scale and silhouette. Preserve ears, hair tuft, goggles, orange scarf and trailing fabric, brown backpack, armor, straps, buckles, cyan lights, gloves, paws and striped tail identical. True transparent background, preserve alpha. No crop, text, new objects, glow, movement or special effects. Only main cat facial eyelids change.
```

Habla:

```text
Use case: precise-object-edit. Edit target: supplied full body white and lavender striped cat with orange scarf, brown tech outfit, cyan-lensed goggles resting on its forehead, and a small yellow robot on its backpack. Name of main cat: EduRivet. Create SPEAKING pose for audio reactive pet. Change ONLY the MAIN CAT'S small central CLOSED smile directly below the pink nose into a small friendly OPEN talking mouth with dark interior and little pink tongue, inside white muzzle and above chin. Preserve original pink nose and stem, whiskers, fur shading, face markings and outline. Main cat eyes remain fully OPEN with original blue irises, dark pupils, highlights, eye whites, eyelashes and eyebrows. Keep goggles and yellow robot including robot's happy cyan display eyes and all lights unchanged. Exact original 1254x1254 canvas, position, scale and silhouette. Preserve ears, hair tuft, goggles, orange scarf and trailing fabric, brown backpack, armor, straps, buckles, cyan lights, gloves, paws and striped tail identical. True transparent background, preserve alpha. No crop, text, new objects, glow, movement or special effects. Only main cat mouth changes.
```

## Validación

`tests/edurivet.test.cjs`: importación/exportación, transparencia, cuatro poses distintas, original intacto y combinación independiente de párpados y boca. `npm.cmd run smoke -- --packaged --edurivet`: catálogo, audio sintético, cuatro poses exactas en escritorio/panel/salida de navegador, parpadeo automático, cierre al apagar el micro, persistencia, exportación y lienzo vertical. Usa `.smoke-data`, sin modificar preferencias diarias.

La prueba de Electron no valida el micrófono físico ni una escena real de OBS.
