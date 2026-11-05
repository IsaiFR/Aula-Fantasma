# EduScream: capas y animación

2 de octubre de 2026. Se usó la herramienta integrada **imagegen** (sin CLI) con las dos imágenes proporcionadas como referencias. Los archivos originales permanecen intactos y están copiados en `web/eduscream/original-knife.png` y `original-neutral.png`.

El atlas transparente generado está en `web/eduscream/rig-atlas.png`. Tiene 1254 × 1254 píxeles y alfa real (0–255). Se inspeccionó el resultado; las capas se delimitan mediante rectángulos normalizados en el archivo de mascota, sin recortar ni sobrescribir el atlas. Los originales no se usan para extraer patas mediante máscaras improvisadas: se generaron capas independientes siguiendo su diseño.

`pets/EduScream.aulapet` incluye el PNG original con cuchillo como miniatura/fallback, el atlas completo, la pata adicional `free-foot.png`, las posiciones/pivotes y el comportamiento. El renderer monta cuerpo, dos patas que alternan los pasos, una pata delantera libre y el brazo del cuchillo. La máscara mantiene su textura. El personaje se refleja al cambiar la dirección horizontal.

El saludo usa 0.65 s para subir, 1.9 s con el cuchillo levantado y el texto exacto **Detrás de ti**, y 0.65 s para bajar. Todo el gesto detiene el recorrido; continúa al terminar de bajar. Los pasos se suavizan al detenerse. Pausa, visibilidad y salida/regreso siguen siendo comunes. No incorpora sonido ni voz.

Para regenerar el paquete desde los archivos locales: `node scripts/create-eduscream.cjs`. El atlas se conserva byte por byte; esta operación solo serializa imágenes y parámetros.

## Prompt completo utilizado

```text
Use case: compositing / background-extraction.
Asset type: one transparent 2D cutout animation rig atlas for the EXACT EduScream cat character in the supplied reference images.
Input image 1 (with knife): identity and style reference, especially white Scream mask, hood, navy cat tail, white paws, and silver knife. Input image 2: supporting reference for the neutral standing body.
Create ONE SQUARE PNG atlas with actual transparent background, divided into exactly FOUR equal cells, 2 columns x 2 rows. NO visible dividers, NO labels, NO text, NO shadows or colored background. Put ONLY the requested isolated parts in their respective cells with generous transparent gaps.
TOP LEFT CELL: the complete stationary torso/head/hood/ears/tail/black robe of this very same cat, in its neutral upright posture. Preserve its exact white Scream mask and the original black/navy/gray cel-shaded illustration style. Remove the knife-holding arm entirely, and REMOVE all white feet from this body layer; robe must end naturally above where white paws are attached. No disembodied holes in torso, black robe covers the chest. Body fills ~80% cell height, centered, stays wholly within cell.
TOP RIGHT CELL: ONLY the detached knife-holding forearm assembly: the original white cat paw gripping the black handle, a small black sleeve and a long silver knife pointing upward. Include the entire knife blade and paw. Not a torso or face. Arrange upright, grip low, black sleeve join at its bottom left. Fill ~75% cell height, isolated wholly within cell. The shoulder/sleeve joins the right side of the body when assembled.
BOTTOM LEFT CELL: ONLY one detached white front cat leg/paw for the viewer-left foot; short upright white lower leg with rounded three-toed cat paw, same dark outline and same gentle gray shading as reference. No black robe above it. Centered and wholly within cell.
BOTTOM RIGHT CELL: ONLY the matching detached white front cat leg/paw for the viewer-right foot, mirrored stance and same scale as the other paw. No black robe above it. Centered and wholly within cell.
Keep every part separate: exactly one body, one knife arm, and two white paws. Do not duplicate the knife inside the body, do not draw feet inside the body layer, do not change the character identity. This is for articulated walking and raising/lowering the same knife arm, not a scene. Output genuinely transparent alpha.
```

El generador no respetó la distribución exacta en cuatro cuadrantes iguales; se adaptaron los rectángulos del perfil a las cuatro piezas realmente producidas. No se modificó el archivo raster generado. Las poses montadas se comprobaron en las capturas de `.smoke-data/eduscream-walk-a.png`, `eduscream-walk-b.png`, `eduscream-detras-de-ti.png` y `eduscream-lowering.png`.


## Corrección de anatomía · versión 1.5.1

La revisión añade la cuarta pata sin sustituir el atlas: dos patas traseras alternan los pasos, una pata delantera libre descansa sobre la misma línea y el otro brazo sostiene el cuchillo. La pata libre se preparó con imagegen integrado, modo de edición con referencias y fondo transparente. Archivo generado: C:/Users/kikef/.codex/generated_images/01a0f45b-fc97-7460-86a6-84fac2f18777/exec-a2c92dd4-f696-4c1b-8ab4-f0f78d1568fb.png. Copia para la app: web/eduscream/free-foot.png. Se conserva el raster completo (1312 × 1199, RGBA con alfa 0–255); se usa un recorte de 393 × 800 desde (472,293) mediante Canvas.

Los pasos dejan de girar las patas. Las tres suelas se alinean en y=0.96 del lienzo en reposo y los recortes conservan su proporción. Las patas traseras tienen anchura 0.145, paso lateral 0.004 y elevación 0.022; su parte superior queda bajo la túnica. La pata libre tiene altura 0.244 y se mantiene vertical. El brazo conserva el hombro (0.6745,0.5196), los ángulos 110°/0° y los tiempos del saludo. Su recorte se acorta de 730 a 580 píxeles para quitar la manga sobrante; el dibujo conserva proporción 330/580 sin estirar la mano.

El atlas y los originales permanecen intactos. El archivo EduScream.aulapet pasa a v3 para contener la imagen adicional y su capa. El prompt siguiente describe únicamente la pieza añadida.

### Prompt de la pata adicional

```text
Use case: precise-object-edit / compositing.
Asset type: ONE additional transparent sprite layer for the free fourth cat leg of the provided EduScream illustration.
Image 1 is the original character identity/style reference. Image 2 is the existing cutout atlas, reference for white paws and cel shading. Do not redraw or include the whole character or the knife.
Draw ONLY one straight upright free front cat foreleg with its white rounded three-toed paw at the bottom, suitable for attaching below the black robe. It must be visually aligned, vertical and balanced: upper leg goes directly down to the center of the paw, toes rest on one LEVEL HORIZONTAL ground baseline. No twisted wrist, no diagonal ankle, no shoe or human hand. White fur, pale gray/lavender cel shadows, thick dark navy outlines exactly matching the references. Short black/navy sleeve cuff at the top, then a slender straight white lower leg, then a rounded slightly wider cat paw with three small toe divisions. Overall silhouette width approximately half its height. Center the sprite in the image with generous transparent margins. Front-facing three-quarter view matching the original cat; slight toe volume is fine but the leg axis is vertical and the sole is level. Keep the contour clean with real transparent alpha. Exactly ONE limb and ONE paw. No text, labels, body, face, knife, floor, drop shadow, extra paws or opaque background. The rest of the existing body, knife arm and walking paws will remain their original assets.
```
