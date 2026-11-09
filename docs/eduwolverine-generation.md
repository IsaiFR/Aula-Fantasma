# EduWolverine: preparación pendiente

**Estado: no terminado.** No se ha creado `pets/EduWolverine-Voz.pet` ni se ha modificado el ejecutable en este intento. Imagegen rechazó dos veces la edición con HTTP 400, código `moderation_blocked`, etapa `output`, categoría `other`. No se especificó un elemento concreto de la imagen. IDs de solicitud: `1abbac98-1ed0-4d0b-9739-2cc3d9dc5af6` y `3b807b6f-556f-4193-a6fe-f6246378ca93`.

Alcance previsto: nombre exacto **EduWolverine**, habla con el micrófono y parpadeo únicamente. Sin movimiento de garras ni otras acciones especiales.

## Recursos

Original: ``C:/Users/kikef/Downloads/EduCat`s/EduWolverine.png``. Copia intacta en `docs/eduwolverine/reference.png`. Faltan `blink-source.png` y `talking-source.png`. Poses previstas de 1254 × 1254 px: `open`, `closed`, `talking` y `talkingClosed`.

Preparación guardada en `scripts/create-eduwolverine.cjs`. No puede ejecutarse hasta disponer de las dos expresiones. No se deja la mascota registrada ni se añaden pruebas que requieran un paquete inexistente.

## Prompts intentados, imagegen incorporado

Parpadeo:

```text
Use case: precise-object-edit. Edit target: supplied full body EduWolverine cat in yellow and navy superhero suit, tall pointed navy mask, blue gloves, six silver claws, and red X belt buckle. Create BLINK pose for audio reactive pet. Change ONLY the two eyes inside the mask openings to fully CLOSED gentle dark curved eyelid lines, no pupils or eye highlights. Use the original warm cream color for the closed eyelid areas. Preserve all navy mask borders, pointed eye brows, yellow forehead and cheek shapes exactly. Keep original black nose, CLOSED cat smile, whiskers and cream muzzle unchanged. Exact original 1254x1254 canvas, position, scale and silhouette. Preserve mask points, yellow/navy suit patterns, blue shoulder pieces, gloves, boots, belt and X buckle, all six silver claws, paws and striped tail identically. True transparent background, preserve alpha. No crop, new objects, text, glow, claw movement, transformations or shadow. Only eyes change.
```

Habla:

```text
Use case: precise-object-edit. Edit target: supplied full body EduWolverine cat in yellow and navy superhero suit, tall pointed navy mask, blue gloves, six silver claws, and red X belt buckle. Create SPEAKING pose for audio reactive pet. Change ONLY the small central CLOSED cat smile directly below the black nose into a small friendly OPEN talking mouth with dark interior and little pink tongue, confined to cream muzzle above chin. Preserve original black nose and stem, whiskers, muzzle shading, face outline and all navy/yellow mask details exactly. Both eyes remain fully OPEN with original pupils, warm whites and highlights. Exact original 1254x1254 canvas, position, scale and silhouette. Preserve mask points, yellow/navy suit patterns, blue shoulder pieces, gloves, boots, belt and X buckle, all six silver claws, paws and striped tail identically. True transparent background, preserve alpha. No crop, new objects, text, glow, claw movement, transformations or shadow. Only central mouth changes.
```

## Validación pendiente

Una vez disponibles los recursos: crear el paquete, revisar las cuatro poses, añadir sus pruebas y el smoke específico, pasar pruebas/sintaxis/integridad y comprobar el portable con audio sintético sin modificar AppData. No se ha validado una mascota EduWolverine funcional.

La prueba de Electron no valida el micrófono físico ni una escena real de OBS.
