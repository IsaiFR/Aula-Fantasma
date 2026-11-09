# EduElfo

Nombre visible exacto: **EduElfo**. Paquete de voz autocontenido v6: `pets/EduElfo-Voz.pet`. Usa la captura local del micrófono y los controles actuales de entrada, sensibilidad y espera de cierre. Solo habla y parpadea, en silencio y al hablar. Sin flotación, movimiento de ropa ni acciones especiales.

## Recursos

Original: ``C:/Users/kikef/Downloads/EduCat`s/EduElfo.png``. Copia intacta en `web/eduelfo/reference.png`; `open.png` conserva sus bytes. Ediciones con imagegen incorporado: `blink-source.png` y `talking-source.png`. Poses finales de 1254 × 1254 px: `open`, `closed`, `talking` y `talkingClosed`.

Regenerar: `node scripts/create-eduelfo.cjs`, con `@napi-rs/canvas` del runtime de Codex o `AULA_CANVAS_MODULE`. El generador combina solo las regiones faciales de `regions.json`, mantiene el alfa y los píxeles opacos fuera de ellas, y protege el brazo diagonal de los lentes. El paquete terminado no depende de Downloads ni del generador.

## Prompts finales, imagegen incorporado

Parpadeo:

```text
Use case: precise-object-edit. Edit target: supplied full body EduElfo black and white cat dressed as Christmas elf with green hat, red gold collar, bells, striped leggings and black glasses. Create BLINK pose. Change ONLY both eyes inside the spectacles into fully CLOSED gentle dark curved eyelids; no pupils, white eye areas or highlights. Preserve purple tint of left lens and white right lens. Keep spectacles rims and diagonal black spectacle arm inside the right lens exactly unchanged; it must remain visible over the closed eye. Preserve nose, CLOSED mouth, whiskers and face markings. Exact original 1254x1254 canvas, scale, alignment and silhouette. Hat, ears, gold bells, red collar, green tunic, brown belt with gold buckle, striped leggings, cuffs, paws and tail identical. True transparent background, preserve alpha. No text, crop, new objects, glow or shadow. Only eyes change.
```

Habla:

```text
Use case: precise-object-edit. Edit target: supplied full body EduElfo black and white cat dressed as Christmas elf with green hat, red gold collar, bells, striped leggings and black glasses. Create SPEAKING pose. Change ONLY the small central CLOSED mouth below the original nose into a small friendly OPEN talking mouth with dark interior and little pink tongue, contained within white muzzle and above chin. Keep original nose and its stem, whiskers, cheek markings and face outline unchanged. Both eyes remain fully OPEN with original pupils, whites, highlights and purple left lens tint. Keep glasses and diagonal black spectacle arm inside right lens exactly. Exact original 1254x1254 canvas, scale, alignment and silhouette. Hat, ears, gold bells, red collar, green tunic, brown belt with gold buckle, striped leggings, cuffs, paws and tail identical. True transparent background, preserve alpha. No text, crop, new objects, glow or shadow. Only mouth changes.
```

## Validación

`tests/eduelfo.test.cjs`: importación/exportación, transparencia, cuatro poses distintas, original intacto y combinación independiente de párpados y boca. `npm.cmd run smoke -- --packaged --eduelfo`: catálogo, audio sintético, cuatro poses exactas en escritorio/panel/salida de navegador, parpadeo automático, cierre al apagar el micro, persistencia, exportación y lienzo vertical. Usa `.smoke-data`, sin modificar preferencias diarias.

La prueba de Electron no valida el micrófono físico ni una escena real de OBS.
