# EduStrading

`pets/EduStrading-Voz.pet` contiene cuatro poses PNG de 1254 × 1254 píxeles. El gato principal parpadea detrás de los lentes y abre la boca al detectar audio del micrófono.

`node scripts/create-edustrading.cjs` usa la ilustración original en reposo y aplica las variantes dentro de los lentes y en el hocico. Las cuatro poses conservan el canal alfa de `web/edustrading/reference.png`.

`npm.cmd run smoke -- --edustrading` verifica el catálogo y las cuatro poses en Electron con audio simulado.

## Prompts de ImageGen

Parpadeo

```text
Precisely edit the supplied EduStrading cartoon cat PNG on its exact original 1254 × 1254 canvas with true transparency. Keep reference alignment, transparent silhouette, dark glasses frames, navy and white fur, whiskers, outfit, equipment and the little sleeping cat in the golden pod. Edit only the specified facial feature of the main cat. Within the main cat's existing glasses, replace the two open pupils and catchlights with two gently curved dark closed eyelids. The viewer-left lens is violet with an angled white fur patch at its bottom. The viewer-right lens is white and crossed by a thin dark diagonal line near its right edge. Preserve those colors, markings and linework exactly. The main cat's mouth remains closed.
```

Habla

```text
Precisely edit the supplied EduStrading cartoon cat PNG on its exact original 1254 × 1254 canvas with true transparency. Keep reference alignment, transparent silhouette, dark glasses frames, navy and white fur, whiskers, outfit, equipment and the little sleeping cat in the golden pod. Edit only the specified facial feature of the main cat. Only change the small cat smile just below the nose, at x706–802 and y420–478. Open the mouth for speech, with a modest rounded deep navy interior, small muted rose tongue and the original smile corners. Align with the original nose stem and keep the original open eyes.
```
