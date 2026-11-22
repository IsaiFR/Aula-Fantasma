# EduNoir

`pets/EduNoir-Voz.pet` contiene cuatro poses PNG de 1254 × 1254 píxeles. Parpadea detrás de los lentes y abre la boca al detectar audio del micrófono.

`node scripts/create-edunoir.cjs` usa la ilustración original en reposo. Aplica las variantes dentro de los lentes y en el hocico, por encima del cubrebocas. Las cuatro poses conservan el canal alfa de `web/edunoir/reference.png`.

`npm.cmd run smoke -- --edunoir` verifica el catálogo y las cuatro poses en Electron con audio simulado.

## Prompts de ImageGen

Parpadeo

```text
Make a localized edit to the supplied EduNoir cartoon cat PNG. Preserve its exact alignment on the original 1254 × 1254 canvas, true transparency, silhouette, armor and hood, dark glasses frame, navy and white fur, nose, whiskers, and the charcoal face covering below the mouth. Preserve every feature outside the requested facial area. Replace the two dark pupil shapes and their tiny white catchlights with one gently curved dark closed eyelid per lens, around x643 y351 and x861 y343. Preserve the violet viewer-left lens and its angled light fur patch, the cream-white viewer-right lens and its diagonal charcoal edge, and the original closed smile.
```

Habla

```text
Make a localized edit to the supplied EduNoir cartoon cat PNG. Preserve its exact alignment on the original 1254 × 1254 canvas, true transparency, silhouette, armor and hood, dark glasses frame, navy and white fur, nose, whiskers, and the charcoal face covering below the mouth. Preserve every feature outside the requested facial area. Open only the small original cat smile between the nose and the top of the charcoal face covering, around x720–827 and y431–466. Give it a compact shallow oval dark opening with a tiny muted rose tongue. Reuse the nose stem and the ends of the smile. Fit the entire mouth above the peak of the existing face covering at y470. Preserve the fabric edge exactly and keep both eyes open.
```
