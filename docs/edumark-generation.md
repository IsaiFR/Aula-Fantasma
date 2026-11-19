# EduMark

`pets/EduMark-Voz.pet` contiene cuatro poses PNG de 1254 × 1254 píxeles. Los lentes claros muestran las pupilas redondas y los párpados curvos de **EduNolan** como referencia visual. La boca se abre al detectar el audio del micrófono.

El original y las ediciones de imagegen integrado están en `web/edumark`. `node scripts/create-edumark.cjs` aplica las expresiones en el interior de los lentes y sobre la boca. Las cuatro poses conservan el canal alfa del original.

La prueba `npm.cmd run smoke -- --edumark` comprueba las poses en Electron con audio simulado.

## Prompts de imagegen integrado

Lentes con ojos abiertos

```text
Use case: precise-object-edit. Image 1 is EduMark and is the only image to edit. Image 2 is EduNolan, which specifies the exact eyes and clear-glasses drawing style to copy into EduMark's existing lenses. Copy only the way the eyes and clear lenses are drawn. Keep EduMark's eyes positioned within EduMark's own frames, fit the eye style to his lens shapes, and preserve his yellow mask outside the frames, white muzzle and little smile, nose, purple-black glasses frame, black hair, outfit, body, and 1254x1254 transparent framing. Do not transplant facial markings, eyebrows or mustache. Both lenses have a warm near-white background and barely visible diagonal glare. Match Image 2's eyes very closely: two simple isolated rounded dark charcoal-navy pupil disks, each with ONE small round white highlight high on the right side. The surrounding pale lens area has NO drawn perimeter around each eye, no thick upper arch, no eyelashes, no almond shape, no hard white sclera boundary, no bottom white wedge. Match both pupils in size and visual direction, with parallel gazes. Change only the lens interiors.
```

Parpadeo

```text
Use case: precise-object-edit. Image 1 is EduMark and is the only image to edit. Image 2 is EduNolan, which specifies the exact eyes and clear-glasses drawing style to copy into EduMark's existing lenses. Copy only the way the eyes and clear lenses are drawn. Keep EduMark's eyes positioned within EduMark's own frames, fit the eye style to his lens shapes, and preserve his yellow mask outside the frames, white muzzle and little smile, nose, purple-black glasses frame, black hair, outfit, body, and 1254x1254 transparent framing. Do not transplant facial markings, eyebrows or mustache. Both lenses have a warm near-white background and barely visible diagonal glare. Match the closed eyes in Image 2 with a simple narrow shallow U-shaped dark line in each lens, rounded at the ends and without eyelashes, one per lens. Match the curve and horizontal placement of Image 2's eyelids. Maintain clear, warm, pale lenses. Change only the lens interiors.
```

Habla

```text
Use case: precise-object-edit. EduMark is the supplied custom cat drawing. Create one expression frame with the exact original position on its 1254 × 1254 transparent canvas. Keep the purple-black frames, face contour, yellow mask outside the glasses, white muzzle, black hairstyle, ears and whiskers, and all of the yellow, blue and charcoal outfit. Change only the small smile below the nose to an open cheerful speaking mouth, around (819,537). Keep both upward corners of the original cat smile and the nose and center stem, with a modest charcoal mouth and small muted pink tongue underneath. Keep the glasses and all the rest of the artwork identical in this source frame.
```
