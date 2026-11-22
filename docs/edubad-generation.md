# EduBad

`pets/EduBad-Voz.pet` contiene cuatro poses PNG de 1254 × 1254 píxeles. Parpadea detrás de los lentes y abre la boca entre el bigote y la barba al detectar audio del micrófono.

`node scripts/create-edubad.cjs` usa la ilustración original en reposo y aplica las variantes dentro de los lentes y en el hocico. Las cuatro poses conservan el canal alfa de `web/edubad/reference.png`.

`npm.cmd run smoke -- --edubad` verifica el catálogo y las cuatro expresiones en Electron con audio simulado.

## Prompts de ImageGen

Parpadeo

```text
Precisely edit the supplied EduBad cartoon cat PNG, aligned to its exact 1254 × 1254 source canvas with true transparency. Preserve the exact pose, silhouette, hat, glasses, whiskers, face markings, dark brown mustache and beard, and all clothing and accessories. Only edit the requested facial feature. Replace the two visible open pupils and white highlights with a natural blink, a gently curved dark closed eyelid in each lens. Keep the lavender left lens with its white fur patch at the base and the clear white right lens with the thin diagonal arm at its right edge. Keep the original small closed smile, mustache and beard.
```

Habla

```text
Precisely edit the supplied EduBad cartoon cat PNG, aligned to its exact 1254 × 1254 source canvas with true transparency. Preserve the exact pose, silhouette, hat, glasses, whiskers, face markings, dark brown mustache and beard, and all clothing and accessories. Only edit the requested facial feature. Open the small cat mouth just below the mustache around x715–809 and y459–512. Use a compact rounded dark opening with a small muted rose tongue. The opening sits between the mustache and goatee. Preserve the outside contour of the beard, the mustache texture, and both open eyes.
```
