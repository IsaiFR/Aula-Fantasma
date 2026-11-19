# EduConquest

El paquete autocontenido `pets/EduConquest-Voz.pet` incluye cuatro poses PNG de 1254 × 1254 píxeles. El parpadeo cierra ambos ojos y conserva la continuidad de la cicatriz bajo la lente. La boca se abre debajo del bigote al detectar audio del micrófono.

El PNG original se conserva en `web/educonquest/reference.png`. Las dos ediciones de imagegen integrado se guardan junto al original. `node scripts/create-educonquest.cjs` aplica esos cambios dentro de las gafas y debajo del bigote. La pose en reposo usa el PNG original.

La prueba `npm.cmd run smoke -- --packaged --educonquest` comprueba las cuatro poses en Electron con audio simulado. Quita `--packaged` para probar desde el código fuente.

## Prompts de imagegen integrado

Parpadeo

```text
Use case: precise-object-edit. The supplied fictional cat mascot EduConquest is the edit target. Create a matching expression frame on the same 1254 by 1254 transparent canvas, with exactly the same framing, proportions, colors and registration. Keep the pose, all apparel, face contour, white hair, nose, white mustache, dark glasses frames and glass reflections unchanged. Retain the character's stern expression and existing facial scar placement. Only edit inside the two lenses to make both eyes close naturally for a short blink, with two narrow curved charcoal eyelid lines where the eyes are now. Remove the open eye shapes, dark pupil and white eye. On the right, precisely continue the existing angled scar behind the glasses through the area exposed by the closing eyelid, joining the two visible ends. Do not change the nose, mouth or mustache.
```

Habla

```text
Use case: precise-object-edit. The supplied fictional cat mascot EduConquest is the edit target. Create a matching expression frame on the same 1254 by 1254 transparent canvas, with exactly the same framing, proportions, colors and registration. Keep the pose, all apparel, face contour, white hair, nose, white mustache, dark glasses frames and glass reflections unchanged. Retain the character's stern expression and existing facial scar placement. Only draw a small, visible open speaking mouth in the exposed muzzle immediately beneath the middle of the white mustache, around x805 y566 within x740–869 and y528–602. The body of the mustache is in front of and partly overlaps the top edge of the mouth. Keep both mustache tips and tufts exactly where they are. Use a clean dark mouth interior and a small muted tongue, matching the original outline style and stern demeanor. Keep both eyes exactly as supplied.
```
