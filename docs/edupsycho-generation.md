# EduPsycho

Nombre visible exacto solicitado: **EduPsycho**. Paquete de voz autocontenido v6: `pets/EduPsycho-Voz.pet`. Solo habla según el nivel del micrófono y parpadea, en silencio y al hablar.

La máscara cubre la boca: el habla se representa con una apertura sutil del diafragma y las rejillas interiores del respirador central. La máscara permanece puesta y su aro exterior se conserva. El parpadeo convierte los círculos cian de los ojos en líneas luminosas cerradas dentro de las lentes. Sin transformaciones ni otras acciones especiales.

## Recursos

Original: ``C:/Users/kikef/Downloads/EduCat`s/EduPsycho.png``. Copia intacta en `web/edupsycho/reference.png`; `open.png` conserva sus bytes y transparencia.

Ediciones con imagegen incorporado: `blink-source.png` y `talking-source.png`. Poses finales de 1254 × 1254 px: `open`, `closed`, `talking` y `talkingClosed`.

Regenerar: `node scripts/create-edupsycho.cjs`, con `@napi-rs/canvas` del runtime de Codex o `AULA_CANVAS_MODULE`. El generador combina únicamente las regiones de ojos y disco interior del respirador de `regions.json`. La región `mouth` representa ese disco, recortado con una máscara elíptica para conservar el aro exterior. Se conserva el alfa original y el brazo diagonal de los lentes. Grietas, filtros laterales, correas, hebillas, símbolo pintado, pantalón, vendas, patas y cola permanecen tomados del original. El paquete terminado no depende de Downloads ni del generador.

## Prompts, imagegen incorporado

Parpadeo:

```text
Use case: precise-object-edit. Edit target: supplied full-body cartoon cat EduPsycho with dark purple ears and tail, cracked cream/orange face mask, black rectangular eyeglasses over dark cyan glowing round eyes, central circular mechanical respirator, leather straps/pouches, orange trousers and wrapped wrists. Expression asset for microphone-reactive desktop pet. Exact original 1254x1254 canvas, position, scale, margins, silhouette and transparent alpha. Preserve the entire mask and all cracks, orange stripes, side filters, black eyeglass rims and diagonal arm in right lens, straps/buckles, white chest with red painted symbol, clothing texture, wraps, paws and tail identical. No removing mask, revealing face or adding a visible flesh mouth/tongue, no new objects, text, effects, movement, new costume or transformation. Change ONLY the specified expression component. BLINK pose: make BOTH existing glowing cyan eye circles close into narrow softly curved CYAN CLOSED-EYELID LIGHT SLITS in the same positions on the dark eye lenses. No round cyan pupils remain. Keep the eye lenses dark with subtle cyan glow around the thin eyelid slits. Preserve glasses and mask, and keep original respirator completely unchanged.
```

Habla con respirador:

```text
Use case: precise-object-edit. Edit target: supplied full-body cartoon cat EduPsycho with dark purple ears and tail, cracked cream/orange face mask, black rectangular eyeglasses over dark cyan glowing round eyes, central circular mechanical respirator, leather straps/pouches, orange trousers and wrapped wrists. Expression asset for microphone-reactive desktop pet. Exact original 1254x1254 canvas, position, scale, margins, silhouette and transparent alpha. Preserve the entire mask and all cracks, orange stripes, side filters, black eyeglass rims and diagonal arm in right lens, straps/buckles, white chest with red painted symbol, clothing texture, wraps, paws and tail identical. No removing mask, revealing face or adding a visible flesh mouth/tongue, no new objects, text, effects, movement, new costume or transformation. Change ONLY the specified expression component. SPEAKING pose with mask ON: keep both glowing cyan eyes fully OPEN and unchanged. Change ONLY the INNER circular mouth RESPIRATOR GRILLE centered x828,y551, inside its fixed outer metal ring. Make the central diaphragm flex subtly open into a small dark vertical oval/slit, with radial grille vanes drawn slightly apart, suggesting speech transmitted through the respirator. Keep the circular OUTER respirator ring, side filters and surrounding mask unchanged. This is a subtle mechanical speaking expression, not a new effect; do not add a flesh mouth or tongue, do not remove any part of the mask. Keep changes confined approximately x765..888,y490..613.
```

## Validación

`tests/edupsycho.test.cjs`: importación/exportación, transparencia, cuatro poses distintas, original intacto fuera de ojos y respirador y combinación independiente de ojos cerrados y respirador de habla.

`npm.cmd run smoke -- --packaged --edupsycho`: catálogo, audio sintético, cuatro poses exactas en escritorio/panel/salida de navegador, parpadeo automático, reposo del respirador al apagar el micro, persistencia, exportación y lienzo vertical. Usa `.smoke-data`, sin modificar preferencias diarias.

La prueba de Electron no valida el micrófono físico ni una escena real de OBS.
