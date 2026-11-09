# EduGrinch

Nombre visible exacto: **EduGrinch**. Paquete de voz autocontenido v6: `pets/EduGrinch-Voz.pet`. Usa la detección local de micrófono y los controles existentes de entrada, sensibilidad y espera de cierre. Solo habla y parpadea, en silencio y mientras habla, sin movimiento de ropa, flotación ni efectos especiales.

## Recursos y regeneración

Original: ``C:/Users/kikef/Downloads/EduCat`s/EduGrinch.png``. Copia intacta y pose de reposo en `web/edugrinch/reference.png` y `open.png`. Ediciones mediante imagegen incorporado: `blink-source.png` y `talking-source.png`. Poses finales: `open.png`, `closed.png`, `talking.png` y `talkingClosed.png`, de 1254 × 1254 px.

`node scripts/create-edugrinch.cjs` compone las regiones de ojos y boca declaradas en `regions.json` sobre la imagen original. Conserva alfa, silueta y los píxeles opacos fuera de esas regiones. El generador usa `@napi-rs/canvas` mediante el runtime local de Codex o `AULA_CANVAS_MODULE`. El paquete terminado funciona sin ese módulo y sin Downloads.

## Prompts finales, imagegen incorporado

Parpadeo:

```text
Use case: precise-object-edit. Edit target: provided full body EduGrinch green cat in Santa hat and suit with black spectacles. Make a BLINK pose for an audio reactive pet. Change ONLY the two eyes inside the spectacles: both eyes fully closed into smooth dark eyelid curves; no pupils, white eye areas or highlights. Preserve the tinted left lens, right lens, spectacles rims, raised mischievous eyebrows, green fur patterns, nose and CLOSED smirking mouth exactly. Preserve exact original 1254x1254 canvas, placement, scale, pose and silhouette. Keep Santa hat, white trim, red suit, belt, gold buckle, paws and tail identical. True transparent background, preserve alpha. No new objects, text, shadows or crop. Only eyes change.
```

Habla:

```text
Use case: precise-object-edit. Edit target: provided full body EduGrinch green cat in Santa hat and suit with black spectacles. Make a SPEAKING pose for an audio reactive pet. Change ONLY the small central closed mouth beneath the nose into a friendly OPEN talking mouth, dark interior and small pink tongue, preserving a mischievous smile. Keep mouth compact, within green muzzle, below original nose and above pointed chin fur. Preserve nose, whiskers, cheek fur, face outline, original sleepy OPEN eyes and pupils/highlights, raised eyebrows, spectacles and lens tints exactly. Preserve exact original 1254x1254 canvas, placement, scale, pose and silhouette. Keep Santa hat, white trim, red suit, belt, gold buckle, paws and tail identical. True transparent background, preserve alpha. No new objects, text, shadows or crop. Only mouth changes.
```

## Validación

`tests/edugrinch.test.cjs`: importación/exportación, poses distintas, transparencia, base original intacta y combinación independiente de ojos y boca. `npm.cmd run smoke -- --packaged --edugrinch`: catálogo, captura de audio sintético, cuatro poses exactas en escritorio/panel/salida de navegador, parpadeo automático, cierre de boca al desactivar el micro, persistencia, exportación y lienzo vertical. Pruebas aisladas en `.smoke-data`; no modifican preferencias diarias.

La prueba de Electron no valida el micrófono físico ni una escena real de OBS.
