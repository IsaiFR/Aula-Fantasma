# EduSoldier

`pets/EduSoldier-Voz.pet` contiene cuatro poses PNG de 1254 × 1254 píxeles. Parpadea detrás de los lentes y abre la boca al detectar audio del micrófono.

`node scripts/create-edusoldier.cjs` usa la ilustración original en reposo y recorta las variantes al interior de los lentes y al hocico, junto al puro. Las cuatro poses conservan el canal alfa de `web/edusoldier/reference.png`.

`npm.cmd run smoke -- --edusoldier` comprueba el catálogo y las cuatro poses en Electron con audio simulado.

## Prompts de ImageGen

Parpadeo

```text
Make a precise localized edit to the supplied EduSoldier cartoon cat PNG. Retain exact registration on its 1254 × 1254 canvas, true transparency, pose, black eyeglass frames, purple left lens and white right lens, hair, beard and mustache, whiskers, green outfit, shield, and exact placement and silhouette of the held prop and smoke. Only edit the specified feature. Replace both dark pupils and their bright catchlights with one gently curved dark closed eyelid per lens around x642 y352 and x853 y350. Preserve the asymmetric light fur patch in the left lens and the existing shading and edges in both lenses. Keep the original closed mouth.
```

Habla

```text
Make a precise localized edit to the supplied EduSoldier cartoon cat PNG. Retain exact registration on its 1254 × 1254 canvas, true transparency, pose, black eyeglass frames, purple left lens and white right lens, hair, beard and mustache, whiskers, green outfit, shield, and exact placement and silhouette of the held prop and smoke. Only edit the specified feature. Open a small speaking mouth under the nose around x720–817, y448–508, with a deep navy rounded interior and a small muted tongue. Place it to the viewer's left of the original cigar so it reads as speaking around it. Keep the original black nose stem, beard, mustache, and every pixel of the cigar and smoke as close as possible to the same position. Keep both original eyes open.
```
