# EduJames

`pets/EduJames-Voz.pet` contiene cuatro poses PNG de 1254 × 1254 píxeles. Abre la boca al detectar audio y parpadea detrás de las gafas y el flequillo.

El original y las ediciones de imagegen integrado están en `web/edujames`. `node scripts/create-edujames.cjs` conserva los bytes del PNG de reposo y aplica las expresiones dentro de las lentes y el hocico. Las poses conservan el canal alfa del original.

La prueba `npm.cmd run smoke -- --edujames` comprueba en Electron las cuatro poses con audio simulado.

## Prompts de imagegen integrado

Parpadeo

```text
Use case: precise-object-edit. The supplied EduJames cat PNG is the only edit target. Keep its exact original registration, pose, linework and transparent 1254 × 1254 canvas. Keep every blond forelock and tip in front of the lenses, and preserve the glasses frame and its two different clear tints, the warm-white muzzle, nose, whiskers, olive jacket, chest flashlight, and sepia photo. Create a natural closed-eye blink inside both lenses only. Replace the dark pupils and small white highlights, around (668,424) and (862,420), with a single gently curved dark eyelid line in each lens. The left eyelid is visibly interrupted by the existing strands of blond hair in front of it. Preserve the violet tint on the left and warm clear lens on the right. Keep all hair edges exactly in their original position. Do not change the little closed mouth or the overall thoughtful expression.
```

Habla

```text
Use case: precise-object-edit. The supplied EduJames cat PNG is the only edit target. Keep its exact original registration, pose, linework and transparent 1254 × 1254 canvas. Keep every blond forelock and tip in front of the lenses, and preserve the glasses frame and its two different clear tints, the warm-white muzzle, nose, whiskers, olive jacket, chest flashlight, and sepia photo. Only edit the small cat mouth under the nose around (783,536), within x731–827 and y507–573. Create a modest open speaking mouth below its corners, with dark interior and a small muted rose tongue. Keep the nose, central stem, whiskers and understated, thoughtful expression. Keep both eyes as in the original, and keep every strand of blond hair unchanged.
```
