# EduCookie

Nombre visible exacto: **EduCookie**. Paquete de voz autocontenido v6: `pets/EduCookie-Voz.pet`. Usa la captura local del micrófono y los controles actuales de entrada, sensibilidad y espera de cierre. Solo habla y parpadea, en silencio y al hablar. Sin flotación, movimiento de ropa ni acciones especiales.

## Recursos

Original: ``C:/Users/kikef/Downloads/EduCat`s/EduCookie.png``. Copia intacta en `web/educookie/reference.png`; `open.png` conserva sus bytes. Ediciones con imagegen incorporado: `blink-source.png` y `talking-source.png`. Poses finales de 1254 × 1254 px: `open`, `closed`, `talking` y `talkingClosed`.

Regenerar: `node scripts/create-educookie.cjs`, con `@napi-rs/canvas` del runtime de Codex o `AULA_CANVAS_MODULE`. El generador combina solo las regiones faciales de `regions.json`, conserva el alfa y los píxeles opacos fuera de ellas, y protege el borde diagonal de galleta dentro del lente derecho. El paquete terminado no depende de Downloads ni del generador.

## Prompts finales, imagegen incorporado

Parpadeo:

```text
Use case: precise-object-edit. Edit target: provided full body EduCookie gingerbread cookie cat with cream icing, navy glasses, red icing bow, candy buttons and decorated tail. Create BLINK pose for audio reactive pet. Change ONLY both eyes INSIDE the spectacles into fully CLOSED gentle dark brown curved eyelid lines, no pupils, eye whites or highlights. Preserve warm brown tint and gingerbread texture of left lens and cream icing inside right lens. Keep spectacle rims and diagonal brown cookie edge visible inside right lens identical. Preserve chocolate nose, CLOSED chocolate smile, piped white whiskers and face icing. Exact original 1254x1254 canvas, placement, scale and silhouette. Keep gingerbread baked texture, icing borders, pink inner ears, red bow, red and green candy decorations, paws and tail identical. True transparent background, preserve alpha. No text, added objects, crop, glow or shadow. Only eyes change.
```

Habla:

```text
Use case: precise-object-edit. Edit target: provided full body EduCookie gingerbread cookie cat with cream icing, navy glasses, red icing bow, candy buttons and decorated tail. Create SPEAKING pose for audio reactive pet. Change ONLY the small central CLOSED chocolate smile below the chocolate nose into a small friendly OPEN talking mouth with dark chocolate interior and a little pink candy tongue. Mouth stays inside cream icing muzzle above red bow, keeping chocolate nose and stem unchanged. Both eyes stay fully OPEN with original pupils, whites, highlights, warm brown left lens tint and original navy glasses. Preserve diagonal brown cookie edge inside right lens. Preserve piped white whiskers and all face icing boundaries. Exact original 1254x1254 canvas, placement, scale and silhouette. Keep gingerbread baked texture, icing borders, pink inner ears, red bow, red and green candy decorations, paws and tail identical. True transparent background, preserve alpha. No text, added objects, crop, glow or shadow. Only mouth changes.
```

## Validación

`tests/educookie.test.cjs`: importación/exportación, transparencia, cuatro poses distintas, original intacto y combinación independiente de párpados y boca. `npm.cmd run smoke -- --packaged --educookie`: catálogo, audio sintético, cuatro poses exactas en escritorio/panel/salida de navegador, parpadeo automático, cierre al apagar el micro, persistencia, exportación y lienzo vertical. Usa `.smoke-data`, sin modificar preferencias diarias.

La prueba de Electron no valida el micrófono físico ni una escena real de OBS.
