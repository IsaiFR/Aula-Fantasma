# EduHellDriver

`pets/EduHellDriver-Voz.pet` contiene cuatro poses PNG de 1254 × 1254 píxeles. Los lentes oscuros conservan sus reflejos durante el parpadeo. Las tres ranuras del respirador se iluminan en ámbar mientras el micrófono detecta audio.

`node scripts/create-eduhelldriver.cjs` recorta las variantes al interior de los lentes y la rejilla. Las cuatro poses conservan la misma silueta, y la pose de reposo conserva el PNG original.

`npm.cmd run smoke -- --eduhelldriver` comprueba en Electron el catálogo y las cuatro poses con audio simulado.

## Prompts de ImageGen

Parpadeo

```text
Precisely edit the supplied 1254 × 1254 transparent EduHellDriver cat art. Keep exact pixel registration, overall pose, outlines, eyeglass frames, black-yellow armor, respirator, cape and transparent silhouette. Only change the subtle eye forms underneath both dark navy sunglass lenses for one closed-eye blink. Preserve the lenses as dark reflective sunglasses, the original navy tint and the strong silver diagonal surface reflections. The two white circular eye catchlights inside the dark lenses disappear and the eye forms turn into two dark subdued curved blue-gray eyelid lines, faintly visible behind the smoked tint. Keep the same overall darkness and avoid pale or clear lenses, white eyes or glowing eyes. Keep the respirator unchanged.
```

Habla

```text
Precisely edit the supplied 1254 × 1254 transparent EduHellDriver cat art. Keep exact pixel registration, overall pose, outlines, eyeglass frames, black-yellow armor, respirator, cape and transparent silhouette. Only edit the three vertical black slots of the central respirator grille, around x797–861 and y517–617. Represent the cat currently talking by giving the interior of those three narrow slots a muted warm amber glow, visibly bright in their centers with dark edges and no spill. Retain each slot's original width, length and vertical arrangement and the chin and mask exterior exactly. Keep the dark sunglasses and their reflections identical. No mouth outside the armor, lettering or other effects.
```
