# Ilustración de EduDracula murciélago

Generada con la herramienta integrada `image_gen` a partir de `web/edudracula/reference.png`, extraída de la pose original del paquete. Resultado con alfa: `web/edudracula/bat.png`, también incorporado al `.pet`. El aleteo y humo se componen en la aplicación.

Prompt utilizado:

> Use case: stylized-concept. Asset type: transparent game character sprite for a flying vampire bat, based on the reference EduDracula cat vampire. Create ONE charming cartoon vampire BAT in frontal view, hovering, wings spread wide horizontally. Preserve recognizable black/navy and white split face, thick dark eyeglasses, big friendly eyes, two small vampire fangs, dark pointed ears with pink inside, small red gemstone brooch. Fully transformed compact bat anatomy: small rounded furry body and little dangling feet, NO humanoid costume or legs, NO cat tail. Large dark navy bat wings with deep crimson red inner membranes and elegant scalloped edges. Match reference polished 2D cartoon illustration, clean thick dark outlines, subtle painted shading. Symmetrical front-facing pose. Technical composition: square canvas, entire bat fits with 8 percent transparent padding all around. Wings occupy sides, body and head completely within the middle 26 percent of canvas width, wings attach at x=38 percent and x=62 percent around y=50 percent. Keep both wings broadly open and mostly horizontal, tips near y=36 percent. Body/head from y=26 to y=76 percent. No smoke, no aura, no effects, no text, no ground shadow, no background; real alpha transparency. The smoke and animation will be added in the app.

## Expresiones para voz y parpadeo

Tres ediciones con la herramienta integrada `image_gen`, cada una referenciada al mismo `web/edudracula/bat.png` y con fondo transparente. Archivos: `bat-open.png`, `bat-closed.png` y `bat-talking-closed.png` en esa carpeta. El renderer toma únicamente las regiones del rostro para conservar el resto del dibujo aprobado.

Prompt común (seguido por la instrucción de cada pose):

> Use case: precise-object-edit. Edit target: the attached transparent EduDracula bat sprite. This is a game animation pose variant, NOT a redesign. Preserve exactly the same canvas size, transparent alpha, pixel placement, framing, silhouette, ears, hair, glasses outline, face colors, nose, whiskers, brooch, costume, body, feet, and especially wings. Change ONLY the requested facial expression inside the eyeglass lenses and mouth area. No new objects, no labels, no background. Do not move or resize the character. Preserve original illustration style and line thickness.

`bat-open.png`:

> Close the mouth into a gentle closed smile with two small visible vampire fangs, no open black mouth interior or tongue. Keep both eyes WIDE OPEN exactly as in the input, including pupils and highlights. ONLY mouth changes.

`bat-closed.png`:

> Close BOTH EYES fully for a blink: show natural curved closed eyelids inside both eyeglass lenses, NO pupils, NO white eyeballs; dark/navy eyelid over the dark left-face eye area and white fur over the white right-face eye area. Keep glasses frames unchanged. Also CLOSE the mouth into a gentle closed smile with two visible little vampire fangs, no tongue or open mouth cavity.

`bat-talking-closed.png`:

> Close BOTH EYES fully for a blink: show natural curved closed eyelids inside both eyeglass lenses, NO pupils, NO white eyeballs; dark/navy eyelid over the dark left-face eye area and white fur over the white right-face eye area. Keep glasses frames unchanged. Keep mouth OPEN exactly as in input with its tongue, fangs, outline and position untouched.
