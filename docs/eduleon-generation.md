# EduLeon

`pets/EduLeon-Voz.pet` contiene cuatro poses PNG de 1254 × 1254 píxeles. EduLeon parpadea detrás del flequillo y los lentes, y abre la boca al detectar audio del micrófono.

`node scripts/create-eduleon.cjs` combina las ediciones de `web/eduleon` con la ilustración original. Las modificaciones se limitan al interior de los lentes y la zona de la boca. Las cuatro poses conservan el canal alfa original y la pose de reposo conserva el PNG original.

`npm.cmd run smoke -- --eduleon` comprueba el catálogo y las poses de EduLeon en Electron con audio simulado.

## Prompts de ImageGen

Parpadeo

```text
Precisely edit the supplied EduLeon cartoon cat raster, maintaining 1254 × 1254 source registration, pose, original silhouette, glasses, blonde hair, facial proportions, colors, texture, and real transparency. Keep all material outside the indicated feature identical, including the original jacket, insignia and accessories. Close both eyes in a brief natural blink. Replace pupils and highlights with matching gently curved dark eyelid lines behind the lenses. Keep the purple left lens and clear pale pink-white right lens, preserve the blonde strands which overlap the two lenses and the exact frame rims. Keep the original small closed smile. No extra effects.
```

Habla

```text
Precisely edit the supplied EduLeon cartoon cat raster, maintaining 1254 × 1254 source registration, pose, original silhouette, glasses, blonde hair, facial proportions, colors, texture, and real transparency. Keep all material outside the indicated feature identical, including the original jacket, insignia and accessories. Change only the tiny smile underneath the nose (approximately x750–880, y474–544). Draw a modest black open speaking mouth with muted pink tongue, keeping the smile corners and nose stem aligned. Keep the eyes open and all whiskers identical. No extra effects.
```
