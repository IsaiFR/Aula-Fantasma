# EduScorpion

El paquete autocontenido `pets/EduScorpion-Voz.pet` incluye cuatro poses PNG de 1254 × 1254 píxeles. Parpadea detrás de las gafas. Al detectar audio, las cinco ranuras de la máscara se abren sutilmente.

El original y las dos ediciones finales de imagegen integrado están en `web/eduscorpion`. `node scripts/create-eduscorpion.cjs` conserva el PNG original en reposo y aplica las ediciones dentro de las lentes y las rejillas. Las cuatro poses se validan en Electron con audio simulado mediante `npm.cmd run smoke -- --packaged --eduscorpion`.

## Prompts de imagegen integrado

Parpadeo

```text
Use case: precise-object-edit. Edit the supplied EduScorpion cat illustration to make one expression frame for a desktop mascot. Keep its exact 1254×1254 framing, transparent background, white sticker outline, original pose, costume, hood, glasses frame and diagonal reflections, cream-and-black face and nose, whiskers, yellow mask, and all details below the head. Change only the eyes inside the two lenses to a fully closed natural blink. Replace each pupil and visible eyeball with one dark curved closed eyelid against the appropriate lens tint. Preserve the purple left lens, off-white right lens, reflections and diagonal arm on the right. Do not change the three dark horizontal mask vents on the left and the two dark vents on the right.
```

Habla

```text
Use case: precise-object-edit. Edit the supplied user-made cat mascot to create a matching speaking sprite. Preserve the 1254×1254 transparent canvas and EXACT registration. Only adjust the depth and narrow opening size of the gold face mask's existing five black vents. At image left there are exactly THREE parallel black slots, separated by TWO visible thin gold bars. At image right there are exactly TWO black slots separated by ONE thin gold bar. Preserve those gold separator bars and all five black slots as five distinct openings. Make the openings only a little taller than in the original, approximately 2 pixels along each edge. This is a subtle louver motion, so the slots never merge. Preserve the rest of the gold mask, hood, sticker outline, glasses, open eyes, and illustration untouched. Return one full transparent PNG with no added effects.
```
