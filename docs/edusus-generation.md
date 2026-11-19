# EduSus

`pets/EduSus-Voz.pet` contiene cuatro poses PNG de 1254 × 1254 píxeles. Los ojos incorporados detrás del visor azul permiten ver el parpadeo. La boca se abre cuando el micrófono detecta audio.

`node scripts/create-edusus.cjs` aplica las variantes dentro de los lentes y alrededor de la boca. Las cuatro poses conservan la silueta transparente de `web/edusus/reference.png`.

`npm.cmd run smoke -- --edusus` comprueba el catálogo y las expresiones en Electron con audio simulado.

## Prompts de ImageGen

Ojos abiertos

```text
Precisely edit the supplied EduSus cartoon cat PNG on its exact registered 1254 × 1254 canvas. Retain real transparency and the original pose, proportions, illustration, geometry, opaque dark glasses frames, red spacesuit, blue face visor, cheese hat, tail and whiskers. Limit your changes to the specified face feature and leave the rest pixel-identical. Only add one simple cute eye inside each lens, around x672 y633 and x947 y614. Use rounded dark navy pupils with one small ice-blue white highlight each, and at most a soft ice-blue rim. Match the shape language of the original cartoon and scale the pupils naturally to their respective lenses. Eyes look forward with the same gaze. Show them through the existing blue tint and beneath the diagonal highlights which should remain continuous across the glass, so the original blue reflective glasses stay clearly identifiable. Keep the original closed smile.
```

Parpadeo

```text
Precisely edit the supplied EduSus cartoon cat PNG on its exact registered 1254 × 1254 canvas. Retain real transparency and the original pose, proportions, illustration, geometry, opaque dark glasses frames, red spacesuit, blue face visor, cheese hat, tail and whiskers. Limit your changes to the specified face feature and leave the rest pixel-identical. Inside the same blue lenses only, show a brief blink with one dark navy simple closed eyelid curve centered around x670 y642 and x950 y622. Ensure both eyelids are visible through the original blue tint, and that the reflection bands still run continuously across the lenses. No pupils and no extra motifs. Keep the original closed smile.
```

Habla

```text
Precisely edit the supplied EduSus cartoon cat PNG on its exact registered 1254 × 1254 canvas. Retain real transparency and the original pose, proportions, illustration, geometry, opaque dark glasses frames, red spacesuit, blue face visor, cheese hat, tail and whiskers. Limit your changes to the specified face feature and leave the rest pixel-identical. Change only the little closed cat smile beneath the nose around x760–894 y718–795. Give it a small open speaking mouth, dark navy interior, muted rose tongue shaded by the blue visor, rounded lower edge. Connect to the original nose stem and keep the smile corners at their original location. Keep the original lenses and all reflections identical.
```
