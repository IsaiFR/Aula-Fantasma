# EduZombie: bases proporcionadas por el usuario

Mascota de recorrido `pets/EduZombie.aulapet` (v5) y GIF `pets/EduZombie.gif`. Actualización visual en Aula Fantasma 1.13.1. Conserva el ciclo de 33 segundos, sus 107 fotogramas, los controles y el perfil de movimiento.

## Fuentes conservadas

- `web/eduzombie/character-reference.png`: copia intacta de **Gato zombi verde con gafas.png**. SHA-256: `bb7146d19d8e3378d03de00df421ccdcb3089b9a83f68b91150cb9812b0f819c`.
- `web/eduzombie/grave-reference.png`: copia intacta de **Lápida EduCat con lirio y musgo.png**. SHA-256: `83c0f8af24e43cee29855ada63e8a0d8ac16524b9c7cc5ed7c50ee94ce39158d`.

El personaje animado conserva gafas oscuras, ojos verde amarillento, costuras, manchas y cola azul oscuro, sin ropa. La lápida se compone directamente con la imagen original, incluidas las letras RIP/EduCat, lirio, musgo y piedras; no se redibuja ni se añaden letras por encima.

## Construcción

`node scripts/create-eduzombie.cjs` usa FFmpeg y `@napi-rs/canvas` (configurable mediante `AULA_CANVAS_MODULE`, como el generador de EduPiramyd). No se requieren esas herramientas para usar las mascotas ya incluidas.

`web/eduzombie/source-sheet.png` se generó mediante la herramienta integrada `image_gen` referenciando el gato original. Contiene 4 × 4 poses del gato, sin lápida. La celda final es una referencia de identidad y no forma parte del ciclo.

El generador compone una lápida original aislada en el fotograma 0; después combina las poses 0–14 del gato con la piedra cuando corresponde. Los primeros acercamientos se registran para conservar el tamaño de la cabeza. Todas las poses apoyan en el mismo suelo. La lápida baja al salir el cuerpo y regresa tras la caída. El PNG preparado y el GIF comparten el umbral de transparencia 64 para evitar restos de mate. El original de cada base permanece intacto.

| Parte | Duración | Fotogramas de la hoja final |
| --- | --- | --- |
| Lápida | 3 s | 0 |
| Pata, brazo, cabeza, torso y salida | 4 s | 1–6 |
| Seis pasos, repetidos 16 veces | 24 s | 6–11 |
| Tambaleo, caída, hundimiento y lápida | 2 s | 12–15 |

Los recursos finales `open.png`, `grave.png` y `frames.png` están en `web/eduzombie`. Los temporales quedan en `.gif-build`. Las entradas que incluyen piedra conservan `text: 'RIP · EduCat'` para impedir que se refleje su inscripción; no muestran un globo adicional.

Se migra solo el hash exacto del primer EduZombie incluido (`bf50d60fd6d5beeb0e00350a7a369a8b04ff5f187ffefd25527831f0c0bb91bc`). Al restaurar esa selección se conservan sus ajustes; las variantes personalizadas no se sustituyen.

## Verificación

`npm.cmd test`, `npm.cmd run check` y `npm.cmd run smoke -- --packaged --zombie`. Las pruebas usan `.smoke-data`, verifican el ciclo y sus alternativas GIF/PNG en Electron y no sustituyen la comprobación de una escena real de OBS.

## Prompt usado con image_gen

> Use case: identity-preserve / animation sprite sheet. Input image 1 is the EXACT zombie cat character to animate, NOT a loose style suggestion. Create a transparent 4 by 4 animation sprite sheet with sixteen equally sized square cells, no grid lines, no labels. Preserve this cat's distinctive identity in ALL poses: large thick dark eyeglasses with purple tinted lenses, yellow-green sleepy eyes, asymmetric navy and light green face, stitched forehead, two small fangs, green fur with darker green stains, dark navy flank patches with pink stitched tears, long navy tail with a pink tear, pink damaged ears, green cat paws. NO clothes, NO shirt, NO waistcoat, NO tie, NO hair wig, NO new accessories. Keep polished shaded 2D illustration, crisp dark outlines and the reference palette. NOT the prior generic zombie cat. Body may change posture to shamble; face, glasses, fur patterns and stitched wounds stay recognizably the same. Exactly FOUR limbs: two forepaws and two hind paws. He is a feline zombie, hunched and stumbling/dragging feet with front paws reaching forward, anatomically connected, not a human or biped in clothes. Body oriented toward screen RIGHT in three-quarter view, face and glasses clearly visible. Walk in place with stable head size, body scale and floor baseline. Entire contents stay inside each exact equal cell with 10 percent alpha padding. NO scenery, NO stone, NO grave, NO soil, NO text, NO external shadows. Alpha-transparent background. Grave will be composited separately from supplied artwork. STRICT sixteen separate cells as follows:
> ROW 1: cell 0 ONE green forepaw only, breaking up out of ground that is not drawn; paw raised near x=65%, tips around y=63%, bottom y=89%, no head or torso. Cell 1 same forepaw with complete foreleg reaching upward, tips y=43%, bottom y=89%, no face. Cell 2 head with eyeglasses and shoulders just emerging, upper head around y=40%, torso cut off at y=89%. Cell 3 half-body rising, both forepaws pushing up, full head and glasses, abdomen clipped at y=89%.
> ROW 2: cell 4 complete cat stepping out in low crouch, all four paws and tail visible. Cells 5,6,7 are FIRST THREE KEYFRAMES of SIX-frame zombie shuffle cycle in place toward screen RIGHT. Full cat body with exactly four limbs, awkward reaching forepaws, dragging hind paw, hunched back. Distinct step positions, neck and shoulders bob subtly. Ground baseline y=89%, consistent head size and placement.
> ROW 3: cells 8,9,10 are NEXT THREE KEYFRAMES of SAME seamless SIX-frame zombie shuffle cycle started at cell 5, alternate which paws lead and trail; frame 10 must loop seamlessly back to 5. Keep glasses, face, ears, stitched patches and tail consistent. Cell 11 same full cat staggering and buckling in preparation to collapse, front legs bend and head droops.
> ROW 4: cell 12 cat lying entirely on its side on the ground, horizontal body, head and glasses intact, eyes closed, paws slack. Cell 13 same collapsed cat partly sinking below unseen ground line y=89%, head and one paw visible. Cell 14 only the same one green paw disappearing down near lower part of cell, no head or body. Cell 15 exact reference seated cat pose for identity reference, full tail and four paws visible.
> Do not draw any ground or crop horizontally. Genuine transparent background. Preserve the attached cat identity aggressively. Strict 4x4 equal-cell layout.
