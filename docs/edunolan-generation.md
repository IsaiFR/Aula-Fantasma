# EduNolan

`pets/EduNolan-Voz.pet` contiene cuatro poses transparentes de 1254 × 1254 píxeles. Los lentes claros dejan ver los ojos y sus párpados, con reflejos tenues. La boca se abre bajo el bigote al detectar audio. El viento continuo mueve el fleco y la capa con el perfil v13 de `animation.cloth.motionRegions`, incluso con el micrófono apagado.

El original y las ediciones de imagegen integrado están en `web/edunolan`. `node scripts/create-edunolan.cjs` aplica las expresiones y la transparencia visual de los lentes al dibujo base. El canal alfa y el contorno exterior se conservan.

La prueba `npm.cmd run smoke -- --edunolan` comprueba las cuatro poses en Electron con audio simulado.

## Prompts de imagegen integrado

Lentes con ojos abiertos

```text
Use case: precise-object-edit. Image 1 is the EduNolan illustration to edit. Keep the exact 1254 × 1254 transparent framing, position, outline, dark glasses frame, stern eyebrows, white fur, dark mustache, black and white hair, red cape, and costume. Image 2 is an eyes-only style reference for seeing eyes through the glasses. Do not use its hair, markings, clothing or lens shape. Edit only the insides of both lenses of Image 1. Replace the two opaque blue-gray lens fills with mostly clear glass over the original warm white facial fur. Keep a faint diagonal reflection of clear glass with very low contrast so the expression is unmistakable. Remove the two round glare spots on the old opaque lenses. Draw both fully open cat eyes with dark navy irises and small white highlights, at about (682,412) and (949,404). Match the bold clean style of the reference but retain EduNolan's confident and slightly stern expression, white face fur, and original eyebrow shapes. Avoid blue frosted or smoky lens fill. Leave the mouth unchanged.
```

Parpadeo

```text
Use case: precise-object-edit. Image 1 is the EduNolan illustration to edit. Keep the exact 1254 × 1254 transparent framing, position, outline, dark glasses frame, stern eyebrows, white fur, dark mustache, black and white hair, red cape, and costume. Edit only the insides of both lenses. Replace the two opaque blue-gray lens fills with mostly clear glass over the original warm white facial fur. Keep a faint diagonal reflection of clear glass with very low contrast so the expression is unmistakable. Remove the two round glare spots on the old opaque lenses. For this blink frame, draw both eyes fully closed with one dark curved eyelid line in each lens, at about (682,420) and (949,412). No open pupils or round white glare spots. Match the light warm white of the face within the clear glass. The existing eyebrows, bridge and mouth stay in place.
```

Habla

```text
Use case: precise-object-edit. Image 1 is the EduNolan illustration to edit. Keep the exact 1254 × 1254 transparent framing, position, outline, dark glasses frame, stern eyebrows, white fur, dark mustache, black and white hair, red cape, and costume. Edit only below the middle of the dark mustache, roughly x748–890 y526–607. Draw a small open speaking mouth with a charcoal interior and a small muted pink tongue. The mustache sits in front of the top of the mouth. Preserve all of the original mustache tips and the face contour. Leave the lenses as they are in this source frame.
```
