# EduWarhammer

`pets/EduWarhammer-Voz.pet` contiene cuatro poses PNG de 1254 × 1254 píxeles. Los lentes claros muestran pupilas redondas y párpados curvos, con **EduNolan** como referencia. La boca se abre sobre la mentonera al detectar audio del micrófono.

El original y las tres ediciones de imagegen integrado están en `web/eduwarhammer`. `node scripts/create-eduwarhammer.cjs` compone solo el interior de los lentes y la boca. Las cuatro poses conservan el canal alfa original y la armadura.

La prueba `npm.cmd run smoke -- --eduwarhammer` comprueba las cuatro poses con audio simulado.

## Prompts de imagegen integrado

Lentes con ojos abiertos

```text
Use case: precise-object-edit. Image 1 is the supplied EduWarhammer custom cat mascot and is the only edit target. Deliver a single sprite registered to Image 1 on the same transparent 1254 × 1254 canvas. Preserve the dark eyeglass frame, helmet and chin guard, every blue and gold armor panel, scratches, insignia, white muzzle, nose, whiskers, ears, and tail. Image 2 (EduNolan) is a style reference solely for the eyes and very clear lenses. Only edit the interiors of EduWarhammer's two lenses. Replace the opaque dark blue with very pale warm-white or pale neutral-lilac fur behind clear glass. Keep only a faint diagonal glass reflection and discard the original circular floating glare. The exact glasses frame and body remain from Image 1. Match the eyes of Image 2: two simple round charcoal-navy pupils of comparable apparent size, roughly centered at (681,366) and (921,359), looking in the same direction with a small round white highlight in the upper right of each pupil. No drawn eye sockets, no upper arch, no lashes, no angular wedges, no diverging gaze. Keep the original closed cat smile unchanged.
```

Parpadeo

```text
Use case: precise-object-edit. Image 1 is the supplied EduWarhammer custom cat mascot and is the only edit target. Deliver a single sprite registered to Image 1 on the same transparent 1254 × 1254 canvas. Preserve the dark eyeglass frame, helmet and chin guard, every blue and gold armor panel, scratches, insignia, white muzzle, nose, whiskers, ears, and tail. Image 2 (EduNolan) is a style reference solely for the eyes and very clear lenses. Only edit the interiors of EduWarhammer's two lenses. Replace the opaque dark blue with very pale warm-white or pale neutral-lilac fur behind clear glass. Keep only a faint diagonal glass reflection and discard the original circular floating glare. The exact glasses frame and body remain from Image 1. Both eyes are fully closed for the blink. Match the simple shallow U-shaped eyeliner-free eyelid curves of Image 2, one balanced dark line in each lens, rounded ends, no lashes or pupils. Keep the pale glass tone and alignment of the existing lenses. Keep the original closed cat smile.
```

Habla

```text
Use case: precise-object-edit. Image 1 is the supplied EduWarhammer custom cat mascot and is the only edit target. Deliver a single sprite registered to Image 1 on the same transparent 1254 × 1254 canvas. Preserve the dark eyeglass frame, helmet and chin guard, every blue and gold armor panel, scratches, insignia, white muzzle, nose, whiskers, ears, and tail. Only edit the little cat smile just beneath the nose (approximately x761–868, y450–510). Make a modest, clearly open speaking mouth below the original smile, with a small muted pink tongue and a dark interior. Keep the nose and its center stem, preserve the side smile curves and whiskers. Fit the opening above y505 so that the blue chin guard and its black outline are untouched. Keep the eyes and lenses as supplied in this source frame.
```
