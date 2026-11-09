# EduStrange

Nombre visible exacto: **EduStrange**. Paquete de voz autocontenido v6: `pets/EduStrange-Voz.pet`. Usa la captura local del micrófono y los controles actuales de entrada, sensibilidad y espera de cierre. Solo habla y parpadea, en silencio y al hablar. Sin flotación, movimiento de ropa ni acciones especiales. El círculo mágico es parte de la imagen original y conserva su apariencia.

## Recursos

Original: ``C:/Users/kikef/Downloads/EduCat`s/EduStrange.png``. Copia intacta en `web/edustrange/reference.png`; `open.png` conserva sus bytes. Ediciones con imagegen incorporado: `blink-source.png` y `talking-source.png`. Poses finales de 1254 × 1254 px: `open`, `closed`, `talking` y `talkingClosed`.

Regenerar: `node scripts/create-edustrange.cjs`, con `@napi-rs/canvas` del runtime de Codex o `AULA_CANVAS_MODULE`. El generador combina solo las regiones faciales de `regions.json`, conserva el alfa y los píxeles opacos fuera de ellas, y protege el brazo diagonal de los lentes. El círculo mágico y su halo se toman de la base original. El paquete terminado no depende de Downloads ni del generador.

## Prompts finales, imagegen incorporado

Parpadeo:

```text
Use case: precise-object-edit. Edit target: supplied full body EduStrange black and white cat with navy spectacles, red gold-trimmed sorcerer cape, blue robes, gold green amulet and orange magical circle around a raised paw. Create BLINK pose for an audio reactive pet. Change ONLY both eyes INSIDE the spectacles into fully CLOSED gentle curved dark eyelid lines, no pupils, eye whites or highlights. Preserve purple tint of left lens, white right lens, all spectacle rims and diagonal black spectacle arm inside right lens. Keep original nose, CLOSED mouth, whiskers, face markings and outline identical. Exact original 1254x1254 canvas, position, scale and silhouette. Preserve red cape and lining pattern, gold trim, blue robes, belts, amulet, green gem, wraps, paws and tail. The orange magical circle, glyphs, sparks and translucent glow must remain exactly unchanged in shape, position, color and alpha. True transparent background, preserve alpha. No new objects, text, crop, animation, extra effects or shadow. Only eyes change.
```

Habla:

```text
Use case: precise-object-edit. Edit target: supplied full body EduStrange black and white cat with navy spectacles, red gold-trimmed sorcerer cape, blue robes, gold green amulet and orange magical circle around a raised paw. Create SPEAKING pose for an audio reactive pet. Change ONLY the small central CLOSED cat smile directly below the black nose into a small friendly OPEN talking mouth with dark interior and little pink tongue, contained inside white muzzle above chin. Preserve original black nose and stem, whiskers, face markings and outline. Both eyes stay fully OPEN with original pupils, whites, highlights, purple left lens tint, all spectacle rims and diagonal black spectacle arm inside right lens. Exact original 1254x1254 canvas, position, scale and silhouette. Preserve red cape and lining pattern, gold trim, blue robes, belts, amulet, green gem, wraps, paws and tail. The orange magical circle, glyphs, sparks and translucent glow must remain exactly unchanged in shape, position, color and alpha. True transparent background, preserve alpha. No new objects, text, crop, animation, extra effects or shadow. Only central mouth changes.
```

## Validación

`tests/edustrange.test.cjs`: importación/exportación, transparencia, cuatro poses distintas, original intacto y combinación independiente de párpados y boca. `npm.cmd run smoke -- --packaged --edustrange`: catálogo, audio sintético, cuatro poses exactas en escritorio/panel/salida de navegador, parpadeo automático, cierre al apagar el micro, persistencia, exportación y lienzo vertical. Usa `.smoke-data`, sin modificar preferencias diarias.

La prueba de Electron no valida el micrófono físico ni una escena real de OBS.
