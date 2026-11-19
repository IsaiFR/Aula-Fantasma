# EduSteve

`pets/EduSteve-Voz.pet` contiene cuatro poses PNG de 1254 × 1254 píxeles. EduSteve parpadea detrás de los lentes y abre la boca al detectar audio del micrófono.

`node scripts/create-edusteve.cjs` toma la ilustración en `web/edusteve/reference.png` y separa el borde blanco y las motas exteriores con el recorte usado para EduEve. La guía ayuda a limpiar los huecos entre los bigotes. Las variantes de expresión aportan los píxeles del interior de los lentes y de la boca. Las cuatro poses usan la misma silueta.

`npm.cmd run smoke -- --edusteve` comprueba en Electron el catálogo y las cuatro poses con audio simulado.

## Prompts de ImageGen

Guía de recorte

```text
Precisely edit the supplied 1254 by 1254 pixel EduSteve cat PNG. Use the exact canvas alignment, placement, shape and orientation. Preserve the dark outline, original pixelated brown hair, teal pixelated shirt, purple pants, original glasses frame and original whiskers. Leave everything else pixel-identical. Remove the white sticker border along the entire exterior and remove detached white specks. Make those areas transparent right up to the existing thin dark outline around the character and the whiskers. Preserve the white fur inside the original outline, the narrow whiskers on the right, and the exact original open eyes and closed mouth.
```

Parpadeo

```text
Precisely edit the supplied 1254 by 1254 pixel EduSteve cat PNG. Use the exact canvas alignment, placement, shape and orientation. Preserve the dark outline, original pixelated brown hair, teal pixelated shirt, purple pants, original glasses frame and original whiskers. Leave everything else pixel-identical. Change only the eyes behind the glasses for a natural blink. Replace both dark pupils and white highlights with a single gently curved dark closed eyelid inside each lens. Preserve the violet tint and diagonal reflection in the left lens, the white right lens and the narrow dark line crossing it diagonally, and the original closed smile. Return a PNG with transparent background.
```

Habla

```text
Precisely edit the supplied 1254 by 1254 pixel EduSteve cat PNG. Use the exact canvas alignment, placement, shape and orientation. Preserve the dark outline, original pixelated brown hair, teal pixelated shirt, purple pants, original glasses frame and original whiskers. Leave everything else pixel-identical. Change only the small closed smile under the nose around x718–818, y505–573. Make a modest open talking mouth with dark interior and a muted pink tongue, preserving the nose, stem, smile corners and whiskers. Retain both open eyes exactly as supplied. Return a PNG with transparent background.
```
