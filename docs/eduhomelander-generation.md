# EduHomelander

`pets/EduHomelander-Voz.pet` contiene cuatro poses PNG de 1254 × 1254 píxeles. Parpadea detrás de los lentes y abre la boca al detectar audio del micrófono.

`node scripts/create-eduhomelander.cjs` toma la ilustración original para la pose de reposo y combina las variantes dentro de los lentes y el hocico. Las cuatro poses conservan la silueta transparente de `web/eduhomelander/reference.png`.

`npm.cmd run smoke -- --eduhomelander` comprueba el catálogo y las cuatro poses en Electron con audio simulado.

## Prompts de ImageGen

Parpadeo

```text
Precisely edit the supplied EduHomelander cat PNG on its exact original 1254 × 1254 canvas. Preserve real transparency, exact registration, silhouette, and pose. Keep the blond hair, navy and white face, glasses frame, nose, whiskers, textured navy suit, gold trim and sweeping red cape intact. Limit the edit to the requested facial feature. Draw a short natural blink by replacing the two visible dark pupils and white highlights with gently curved closed dark eyelid lines. Left lens around x655 y343 is violet, right lens around x878 y339 is clear white and crossed by a dark narrow diagonal bar along its right edge. Keep each tint, the right diagonal bar, the asymmetric dark fur pattern underneath the left lens, and the cat's self-assured expression. Keep the smile unchanged.
```

Habla

```text
Precisely edit the supplied EduHomelander cat PNG on its exact original 1254 × 1254 canvas. Preserve real transparency, exact registration, silhouette, and pose. Keep the blond hair, navy and white face, glasses frame, nose, whiskers, textured navy suit, gold trim and sweeping red cape intact. Limit the edit to the requested facial feature. Change only the small smile underneath the nose at x741–839 and y408–473 to a modest open talking mouth with a rounded dark interior and a small muted rosy tongue. Preserve the original tiny cat smile corners, join the new upper contour to the existing nose stem, and keep the same eyes and head shape. Match the original linework and shading.
```
