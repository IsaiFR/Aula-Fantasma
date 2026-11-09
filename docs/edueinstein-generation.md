# EduEinstein

Nombre visible solicitado: **EduEinstein**, a partir de `EduAlbert.png`. Paquete de voz autocontenido v6: `pets/EduEinstein-Voz.pet`. Solo habla según el nivel del micrófono y parpadea, tanto en silencio como al hablar. Sin acciones especiales.

## Recursos

Original: ``C:/Users/kikef/Downloads/EduCat`s/EduAlbert.png``. Copia intacta en `web/edueinstein/reference-source.png`. El original tenía fondo negro opaco (PNG RGB); imagegen incorporado produjo `reference.png` con transparencia. `open.png` conserva los bytes de esa base recortada, no los del original opaco.

Ediciones derivadas con imagegen incorporado: `blink-source.png` y `talking-source.png`. Poses finales de 1254 × 1254 px: `open`, `closed`, `talking` y `talkingClosed`. El generador limita las expresiones a las regiones faciales de `regions.json`, protege el brazo diagonal derecho de los lentes y conserva el alfa de la base. Cabello, cejas, bigotes, traje, corbata, cola y silueta quedan tomados de la base transparente.

Regenerar: `node scripts/create-edueinstein.cjs`, con `@napi-rs/canvas` del runtime de Codex o `AULA_CANVAS_MODULE`. El paquete no depende de Downloads ni del generador.

## Prompts, imagegen incorporado

Recorte transparente:

```text
Use case: background-extraction. Edit target: supplied full body black and white professor cat with wild white hair, white eyebrows, black rectangular spectacles, brown tweed jacket, beige sweater vest, white shirt and brown tie. Name for this desktop pet: EduEinstein. Remove ONLY the opaque BLACK BACKGROUND and replace it with true transparent alpha. Keep the complete character exactly unchanged, including navy black fur and tail, dark glasses, clothing outlines, subtle shadows, every white hair strand, ears, face, OPEN eyes, CLOSED smile, whiskers, tweed texture, sweater, tie, cuffs and paws. Do not remove dark parts INSIDE the cat. Preserve exact original 1254x1254 canvas, original character position, original scale and silhouette; keep all current empty margins. No crop, zoom, recentering, new objects, text, added shadow or glow. This is only clean background removal for a transparent desktop pet.
```

Parpadeo:

```text
Edit supplied transparent professor cat EduEinstein for a microphone-reactive desktop pet. Preserve exact 1254x1254 canvas, alignment, scale, silhouette and transparent alpha. Preserve wild white hair, white eyebrows, black rectangular spectacles and rims including diagonal right arm, purple left lens, white right lens, nose, whiskers, brown tweed jacket, sweater vest, tie, tail, cuffs and paws. Only make the specified expression change; no text or new elements. Close BOTH eyes naturally for a blink BEHIND the glasses. Replace pupils and open eyes with matching eyelids and simple curved dark closed-eye lines within the lens interiors. Keep glasses frames unchanged and retain purple tint on left lens. Keep original CLOSED smile unchanged. Everything outside the lens interiors exactly unchanged.
```

Habla:

```text
Edit supplied transparent professor cat EduEinstein for a microphone-reactive desktop pet. Preserve exact 1254x1254 canvas, alignment, scale, silhouette and transparent alpha. Preserve wild white hair, white eyebrows, black rectangular spectacles and rims including diagonal right arm, purple left lens, white right lens, nose, whiskers, brown tweed jacket, sweater vest, tie, tail, cuffs and paws. Only make the specified expression change; no text or new elements. Keep BOTH eyes OPEN and original glasses unchanged. Change ONLY the little closed smile BELOW the nose into a small cheerful OPEN speaking mouth with dark interior and small pink tongue, centered around x723 y497, maximum bounds x681..765 y473..531. Preserve nose and whiskers. No large jaw or head motion. Everything outside the mouth unchanged.
```

## Validación

`tests/edueinstein.test.cjs`: importación/exportación, transparencia, cuatro poses distintas, base recortada intacta fuera de ojos/boca y combinación independiente de párpados y boca. `npm.cmd run smoke -- --packaged --edueinstein`: catálogo, audio sintético, cuatro poses exactas en escritorio/panel/salida de navegador, parpadeo automático, cierre al apagar el micro, persistencia, exportación y lienzo vertical. Usa `.smoke-data`, sin modificar preferencias diarias.

La prueba de Electron no valida el micrófono físico ni una escena real de OBS.
