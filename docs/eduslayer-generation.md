# EduSlayer

`pets/EduSlayer-Voz.pet` contiene cuatro poses PNG de 1254 × 1254 píxeles. Parpadea detrás de los lentes y abre la boca al detectar audio del micrófono.

`node scripts/create-eduslayer.cjs` usa la ilustración original como pose de reposo. Las variantes se recortan al interior de los lentes y al hocico, por encima del protector del casco. Las cuatro poses conservan la silueta transparente de `web/eduslayer/reference.png`.

`npm.cmd run smoke -- --eduslayer` comprueba el catálogo y las cuatro poses en Electron con audio simulado.

## Prompts de ImageGen

Parpadeo

```text
Precisely edit the supplied EduSlayer cartoon cat PNG, aligned to its native 1254 × 1254 canvas with real transparency. Retain the original silhouette, linework, colors, helmet, navy and white fur, dark glasses frame, face markings, whiskers, armor, pose and all accessories, limiting edits strictly to the requested feature. Make one natural brief blink behind the glasses, replacing both pupils and white highlights with matching gently curved dark closed eyelids around x653 y354 and x866 y348. Keep the left lens violet, the right lens clear, and the exact original diagonal highlights and dark strip at the right lens edge. Keep the original small closed smile.
```

Habla

```text
Precisely edit the supplied EduSlayer cartoon cat PNG, aligned to its native 1254 × 1254 canvas with real transparency. Retain the original silhouette, linework, colors, helmet, navy and white fur, dark glasses frame, face markings, whiskers, armor, pose and all accessories, limiting edits strictly to the requested feature. Alter only the small cat smile directly under the nose around x738–826 y423–465. Open the mouth modestly for speech with a rounded dark interior and a small muted rose tongue. Use the original smile corners and keep the stem under the nose aligned. Keep the opening above the helmet faceguard, and keep both original eyes open.
```
