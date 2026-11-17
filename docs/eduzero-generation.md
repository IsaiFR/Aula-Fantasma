# EduZero

`pets/EduZero-Voz.pet` incluye cuatro poses PNG y una capa transparente con las dos volutas de aire helado. La bruma se mece y cambia suavemente de opacidad en un ciclo continuo de cinco segundos, independiente del audio. La animación respeta la pausa de la mascota y acompaña el reflejo al cambiar de esquina.

El original se conserva en `web/eduzero/reference.png`. El script `node scripts/create-eduzero.cjs` usa las ediciones de imagegen integrado para las lentes, las rejillas y el fondo restaurado tras la bruma. Solo aplica las expresiones dentro de las gafas y de los respiraderos. Los cristales de las patas y los carámbanos de la máscara forman parte de la base fija.

La prueba `npm.cmd run smoke -- --packaged --eduzero` comprueba las cuatro poses con audio simulado, el movimiento de ambas volutas, el reposo del cuerpo, la pausa y la exportación.

## Prompts de imagegen integrado

`blink`

```text
Use case: precise-object-edit. Supplied EduZero illustration is the edit target for a localized sprite edit. Keep a truly transparent 1254x1254 canvas and the exact original positions, scale, line art, shading, black and blue costume, ice crystals, emblems, and hood. Change only both eyes inside the glasses. Close both narrowed eyes fully in a natural brief blink, using naturally tapered dark eyelids against the original icy blue glass. Remove the open eye shapes and highlights of the pupils, retaining reflections on the glass and the eyewear frame. Preserve the character's focused expression, nose, whiskers, mask, and all other details.
```

`talking`

```text
Use case: precise-object-edit. Supplied EduZero illustration is the edit target for a localized sprite edit. Keep a truly transparent 1254x1254 canvas and the exact original positions, scale, line art, shading, black and blue costume, ice crystals, emblems, and hood. Change only the interior slats of the blue mask vent centered on the mouth (roughly x745–893, y518–690). Make the dark gaps between the diagonal slats wider, as if the vent flexes open slightly in the speaking pose. Keep the blue center ridge and silver outer frame exactly where they are. Keep the mask fully covering the mouth, with the same overall shape and frost. No exposed flesh mouth or added lights. Keep both eyes open and unchanged.
```

`clean`

```text
Use case: precise-object-edit. Supplied EduZero illustration is the edit target for a localized sprite edit. Keep a truly transparent 1254x1254 canvas and the exact original positions, scale, line art, shading, black and blue costume, ice crystals, emblems, and hood. Remove the curving pale translucent icy air ribbons and nearby floating tiny frost specks from both sides, including the pale ribbon crossing in front of the dark tail at approximately x100–350, y720–965 and the S-shaped ribbon to the right of the face and shoulder at approximately x975–1205, y480–780. Restore the dark purple tail surface and contour smoothly behind the removed ribbon. Keep the large solid ice crystals at the paws, all solid icicles on the mask and the icy blue armor unchanged. This will be the static layer behind the animated original air ribbons.
```
