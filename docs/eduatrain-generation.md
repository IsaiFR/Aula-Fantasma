# EduATrain

`pets/EduATrain-Voz.pet` contiene cuatro poses PNG de 1254 × 1254 píxeles. Parpadea detrás de los lentes y abre la boca al detectar audio del micrófono.

`node scripts/create-eduatrain.cjs` usa la ilustración original en reposo y aplica las variantes dentro de los lentes y en el hocico. Las cuatro poses conservan el canal alfa de `web/eduatrain/reference.png`.

`npm.cmd run smoke -- --eduatrain` verifica el catálogo y las cuatro poses en Electron con audio simulado.

## Prompts de ImageGen

Parpadeo

```text
Precisely edit the supplied EduATrain cartoon cat on the same 1254 × 1254 transparent canvas. Preserve exact placement, linework, silhouette, haircut, nose, navy-and-white fur, dark glasses, raised angular brows, whiskers, blue and silver outfit and lightning marks. Change only the requested facial feature. Replace the pupils and white catchlights with two natural dark closed eyelid curves inside the original lenses. Keep the existing angular brows slightly above the closed eyelids, the purple viewer-left lens and white fur along its bottom, and the cream-white viewer-right lens with its diagonal gray strip. Keep the mouth closed.
```

Habla

```text
Precisely edit the supplied EduATrain cartoon cat on the same 1254 × 1254 transparent canvas. Preserve exact placement, linework, silhouette, haircut, nose, navy-and-white fur, dark glasses, raised angular brows, whiskers, blue and silver outfit and lightning marks. Change only the requested facial feature. Open the small closed smile under the nose, around x746–850 and y424–490, with a compact rounded opening, dark navy interior, and muted rose tongue. Align with the original nasal stem and keep the ends of the original smile. Keep both open eyes and the sharp eyebrows exactly as in the original.
```
