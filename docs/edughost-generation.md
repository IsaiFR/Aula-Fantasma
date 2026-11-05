# Fotograma de parpadeo de EduGhost

Herramienta: `image_gen.imagegen`, modo integrado de edición. Habilidad utilizada: `imagegen`. Fondo transparente solicitado explícitamente. No se usó una API externa ni la CLI.

Archivo objetivo: el `EduGhost.png` proporcionado por el usuario. El original se mantiene intacto y se copia como `web/edughost/open.png` (1254 × 1254, RGBA). El fotograma generado se guarda como `web/edughost/closed.png` (1254 × 1254, RGBA).

La app superpone solo las regiones de los ojos del fotograma generado mediante máscaras CSS, para mantener el resto de los píxeles del original. El balanceo, inclinación, estiramiento y globo se calculan en la app y no se dibujan sobre el PNG.

## Prompt exacto

Use case: precise-object-edit. Input image 1 is the EDIT TARGET, the exact existing EduGhost desktop mascot. Create exactly one blinking frame of this SAME character, BOTH EYES FULLY CLOSED. Change only the eyes inside the two spectacle lenses: replace the pupils/irises and highlights with relaxed thin dark navy curved closed eyelids, and preserve the lens backgrounds' purple versus white tint. IMPORTANT: keep the ENTIRE original image identical in composition, square canvas, original transparent padding, character size, position, silhouette, pose, exact eyeglasses rims and bridge, ears, mouth/nose, sheet folds, tail and feet, colors and illustration style. Do not reposition, crop, enlarge or redraw the character. This will be rapidly switched against the original image for a 180ms blink so precise alignment is critical. Transparent background with real alpha; no black background, no checkerboard, no text, no speech bubble, no additional characters. Preserve existing transparency. Only make a local eye edit, no new illustration.
