# EduStarlight

`pets/EduStarlight-Voz.pet` contiene cuatro poses PNG de 1254 × 1254 píxeles. Parpadea detrás de los lentes y abre la boca al detectar audio del micrófono.

`node scripts/create-edustarlight.cjs` usa la ilustración original en reposo y aplica las variantes dentro de los lentes y en el hocico. Las cuatro poses conservan el canal alfa de `web/edustarlight/reference.png`.

`npm.cmd run smoke -- --edustarlight` comprueba el catálogo y las cuatro poses en Electron con audio simulado.

## Prompts de ImageGen

Parpadeo

```text
Make a tightly localized edit to the supplied EduStarlight cartoon cat PNG. Preserve its exact registration on the original 1254 × 1254 image, genuine alpha transparency, linework, dark glasses, blonde hair, golden stars, costume, cape, pose, nose and whiskers. Keep all details outside the requested facial feature as in the reference. Replace the open black pupils and small white highlights with one smoothly curved closed eyelid per lens, around x671 y352 and x863 y345. Keep the lavender viewer-left lens, the patch of pale fur along its bottom, and the cream-white viewer-right lens, including the original blonde section visible along its far edge. Keep the mouth closed.
```

Habla

```text
Make a tightly localized edit to the supplied EduStarlight cartoon cat PNG. Preserve its exact registration on the original 1254 × 1254 image, genuine alpha transparency, linework, dark glasses, blonde hair, golden stars, costume, cape, pose, nose and whiskers. Keep all details outside the requested facial feature as in the reference. Only open the little cat smile directly under the nose, at x734–840 and y438–494. Use a modest rounded dark opening with a muted rose tongue. Reuse the ends of the smile and attach the opening to the original nose stem. Keep the original open eyes and all glasses, hair and whisker details.
```
