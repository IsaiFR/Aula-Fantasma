# EduLuchador

`pets/EduLuchador-Voz.pet` contiene cuatro poses PNG de 1254 × 1254 píxeles. Parpadea dentro de la máscara y abre la boca al detectar audio del micrófono.

`node scripts/create-eduluchador.cjs` usa la ilustración original en reposo y aplica las variantes en las aberturas de la máscara y en el hocico. Las cuatro poses conservan el canal alfa de `web/eduluchador/reference.png`.

`npm.cmd run smoke -- --eduluchador` comprueba el catálogo y las cuatro poses en Electron con audio simulado.

## Prompts de ImageGen

Parpadeo

```text
Precisely edit the supplied EduLuchador cartoon cat on the same real-transparent 1254 x 1254 canvas. Preserve exact placement, mask, blue glitter, metallic gold and silver detail, red and blue cape, ears, whiskers, nose, belt, and relaxed seated pose. Edit only the indicated facial feature. Replace the two dark pupils and catchlights inside the mask with one gently curved dark closed eyelid each. Keep the large purple viewer-left opening and the pale fur patch toward its lower right, and the white viewer-right opening. Match the exact size and shape of the original eye openings and their gold trim. Keep the original mouth closed.
```

Habla

```text
Precisely edit the supplied EduLuchador cartoon cat on the same real-transparent 1254 x 1254 canvas. Preserve exact placement, mask, blue glitter, metallic gold and silver detail, red and blue cape, ears, whiskers, nose, belt, and relaxed seated pose. Edit only the indicated facial feature. Only open the small cat smile directly under the nose, around x714-828 and y444-506. Use a modest rounded deep navy opening with a small muted rose tongue. Connect the upper shape to the original nose stem and preserve the small smile corners. Keep the original open eyes and every part of the mask.
```
