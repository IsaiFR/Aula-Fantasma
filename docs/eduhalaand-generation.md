# EduHalaand

`pets/EduHalaand-Voz.pet` contiene cuatro poses PNG de 1254 × 1254 píxeles. Parpadea detrás de los lentes y abre la boca al detectar audio del micrófono.

`node scripts/create-eduhalaand.cjs` usa el PNG original para el reposo y recorta las variantes al interior de los lentes y al hocico. Las cuatro poses conservan el canal alfa de `web/eduhalaand/reference.png`.

`npm.cmd run smoke -- --eduhalaand` comprueba el catálogo y las cuatro poses en Electron con audio simulado.

## Prompts de ImageGen

Parpadeo

```text
Precisely edit the supplied EduHalaand cartoon cat PNG, aligned to its exact original 1254 × 1254 canvas with true transparency. Preserve the original silhouette, linework, colors, blond tied-back hair, navy and white face, dark glasses frame, nose, whiskers, pose, and Norway jersey. Keep the existing artwork intact outside the requested expression. Only change the eyes behind the lenses for one natural blink. Replace both dark pupils and tiny white highlights with matching gently curved dark closed eyelid lines, centered approximately at x647 y370 and x830 y352. Preserve the purple tint and underlying fur pattern on the left and the clear right lens with its dark diagonal edge. Keep the original small smile.
```

Habla

```text
Precisely edit the supplied EduHalaand cartoon cat PNG, aligned to its exact original 1254 × 1254 canvas with true transparency. Preserve the original silhouette, linework, colors, blond tied-back hair, navy and white face, dark glasses frame, nose, whiskers, pose, and Norway jersey. Keep the existing artwork intact outside the requested expression. Only change the small cat smile under the nose, around x712–798 y442–492. Show a modest open speaking mouth with navy interior, rounded contours and a muted rose tongue. Align the upper curve with the original nose stem and keep the mouth corners near their original positions. Keep both original eyes and all glasses reflections intact.
```
