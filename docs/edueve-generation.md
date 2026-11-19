# EduEve

El paquete autocontenido `pets/EduEve-Voz.pet` incluye cuatro poses PNG de 1254 × 1254 píxeles. Todas comparten la misma silueta transparente, con el contorno oscuro del dibujo y sin el borde blanco de calcomanía. La mascota abre la boca al detectar audio y parpadea en silencio y al hablar.

El original se conserva en `web/edueve/reference.png`. `node scripts/create-edueve.cjs` separa el perímetro del dibujo base con una guía de imagegen integrado y recupera el suavizado del contorno. Después toma solo el interior de las gafas y la boca de las variantes de expresión. Los blancos del pelaje, los ojos y el emblema son parte del dibujo.

La prueba `npm.cmd run smoke -- --edueve` comprueba en Electron las cuatro poses con audio simulado. Con `--packaged` se usa el ejecutable actualizado.

## Prompts de imagegen integrado

Silueta

```text
Use case: precise-object-edit. Edit only the designated area of the supplied EduEve mascot PNG. Keep the exact original full-body composition and registration on a 1254 × 1254 transparent canvas. Keep the cat's pink suit and atom emblem, dark blue tail, coral-red hairstyle, black and white fur, dark glasses with tinted lenses, shape, position, and linework. Remove the entire exterior bright white sticker halo around the outside silhouette and inside the negative-space gaps, including stray white marks and flecks by the ears, paws, hair tips, around the whiskers, and between the tail and skirt. Replace it with true transparency up to the existing thin dark ink outline. Preserve every part within the dark outline, including the feline whiskers, white muzzle, eye whites, suit emblem, and white highlights. Keep the original thin dark outline itself. No new halo, no thickening, no shadows, no background.
```

Parpadeo

```text
Use case: precise-object-edit. Edit only the designated area of the supplied EduEve mascot PNG. Keep the exact original full-body composition and registration on a 1254 × 1254 transparent canvas. Keep the cat's pink suit and atom emblem, dark blue tail, coral-red hairstyle, black and white fur, dark glasses with tinted lenses, shape, position, and linework. Change only the two eyes inside the lenses into fully closed eyes for a natural brief blink. Replace both open pupils and eyeballs with thin smooth curved dark eyelids. Preserve the purple left lens, white right lens, diagonal reflections and dark diagonal arm on the right. Keep the nose and original small smile unchanged.
```

Habla

```text
Use case: precise-object-edit. Edit only the designated area of the supplied EduEve mascot PNG. Keep the exact original full-body composition and registration on a 1254 × 1254 transparent canvas. Keep the cat's pink suit and atom emblem, dark blue tail, coral-red hairstyle, black and white fur, dark glasses with tinted lenses, shape, position, and linework. Change only the small closed smile directly below the nose into a modest open speaking mouth, centered around x760 y478. Retain the nose and its connecting line, the ends of the smile, white muzzle shading and whiskers. Give the mouth a dark interior and a small soft pink tongue. Preserve the original open eyes.
```
