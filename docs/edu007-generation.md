# Edu007

`pets/Edu007-Voz.pet` contiene cuatro poses PNG de 1254 × 1254 píxeles. Edu007 parpadea detrás de los lentes y abre la boca al detectar audio del micrófono.

`node scripts/create-edu007.cjs` usa el recorte de ImageGen para quitar el damero incrustado y conservar el suavizado del contorno. Los colores interiores vienen de `web/edu007/reference.png`. Las variantes se aplican dentro de los lentes y el hocico y comparten el mismo canal alfa.

`npm.cmd run smoke -- --edu007` comprueba el catálogo y las cuatro poses en Electron con audio simulado.

## Prompts de ImageGen

Recorte

```text
Precisely edit only the face or background of this user-supplied Edu007 cartoon cat PNG. Preserve exact alignment to the original 1254 × 1254 source canvas, black and white markings, tuxedo, bow tie, pose, original silhouette, and all other parts of the illustration. Only remove the baked-in gray and white checkerboard from the exterior and small exterior-connected openings, preserving the original dark linework, thin whiskers, and the character's white fur and shirt. Make the removed areas truly transparent. No stroke, halo, shadow, sticker margin, or replacement background.
```

Parpadeo

```text
Precisely edit only the face or background of this user-supplied Edu007 cartoon cat PNG. Preserve exact alignment to the original 1254 × 1254 source canvas, black and white markings, tuxedo, bow tie, pose, original silhouette, and all other parts of the illustration. Only create a quick natural closed-eye blink behind the existing eyeglasses. Replace the two visible black pupils and white catchlights with one matching curved dark closed eyelid per lens, around x620 y343 and x844 y323. Preserve the violet viewer-left lens, the cream-white viewer-right lens, the original diagonal reflections and the frame. Keep the original mouth closed.
```

Habla

```text
Precisely edit only the face or background of this user-supplied Edu007 cartoon cat PNG. Preserve exact alignment to the original 1254 × 1254 source canvas, black and white markings, tuxedo, bow tie, pose, original silhouette, and all other parts of the illustration. Only change the small closed cat smile underneath the nose, around x706–812 y423–481, to a modest open talking mouth with dark interior and a small dusty rose tongue. Keep the corners of the smile, original facial lines, eye shapes, eyeglasses and nose stem aligned.
```
