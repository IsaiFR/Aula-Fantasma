# EduFrankenstein

Referencia: EduCat.png suministrado por el usuario. La imagen original no se modifica.

Herramienta: image_gen integrada, con transparencia. La hoja original se conserva en web/edufrankenstein-source.png. Los 16 cuadros se recortan y se codifican con FFmpeg mediante scripts/create-edufrankenstein.cjs; el globo incorpora el texto exacto ¡Está vivo! con Arial Bold, sin depender del texto generado por IA.

Entregables: pets/EduFrankenstein.gif y pets/EduFrankenstein.aulapet. Los fotogramas PNG de compatibilidad están en web/edufrankenstein-frames.png.

El ciclo empieza tumbado durante 10 segundos, recibe el rayo y se incorpora durante 5 segundos, camina 30 segundos, se desploma en 0.75 segundos y vuelve a empezar. El globo aparece durante el rayo y la incorporación; se retiraron los dos glifos triangulares que dejaban una marca en V bajo el borde. La caminata alterna cuatro poses durante 25 repeticiones: el GIF tiene 111 imágenes y dura 45.75 segundos. El renderer comparte el reloj entre escritorio, vista previa y salida de navegador; pausa congela la animación y el desplazamiento. Fuera de la caminata no hay desplazamiento.

## Prompt de generación

La corrección de orientación de Aula Fantasma 1.7.2 activa `cycle.mirror`: el personaje gira según la dirección del recorrido. El renderer protege las entradas con `text` para no invertir «¡Está vivo!». No se modifican los píxeles ni los tiempos del GIF independiente.

Use case: illustration-story / identity-preserve.
Create an animation sprite sheet for EduFrankenstein, a cute Frankenstein version of the exact EduCat character in reference image 1. Preserve the recognizable oversized dark navy glasses, white-and-navy patch pattern, pink cat ears, curved navy cat tail, cat face and clean cel-shaded illustration style. Transform him with pale mint-green fur in the white areas, a small stitched forehead seam, tiny steel neck bolts and a ragged dark plum vest. Keep friendly Halloween mascot tone.
Output ONE square 4 by 4 sprite sheet, EXACTLY 16 equal square cells in reading order. True transparent alpha background. No grid lines, no captions, no writing, no bubbles. Each cell contains ONE COMPLETE connected cat with all four feline limbs, face, glasses, ears and tail. Same character design and scale in ALL cells. Generous padding inside each cell, paws share a floor baseline at 85 percent of cell height. Walking cat faces screen RIGHT in 3/4 view. Dead cat lies horizontally with face visible and eyes shut, glasses retained. No scenery, no floor line, no tombstones, no coffin, no blood, no additional characters.
16 poses in reading order:
0: dead, limp, lying on his side on the floor, eyes closed.
1: same dead body with a very slight twitch.
2: dead body struck by a vivid thin zigzag yellow-white lightning bolt descending from the top of this cell to his chest; clear electrical contact and small sparks; bolt entirely inside cell.
3: electrical jolt, body arches on the floor, eyes begin opening, smaller lightning bolt and sparks.
4: revived, lifting head and shoulders while still lying.
5: pushing up on front paws, hindquarters low.
6: halfway rising, unsteady crouch, wide eyes.
7: fully standing on four paws, astonished happy expression, paws grounded.
8: staggering walk A, one forepaw lifted, body leans slightly forward.
9: staggering walk B, opposite paws step, glasses and head tilt slightly.
10: staggering walk C, awkward wide stance, body leans slightly backward, tail balances.
11: staggering walk D, crossing step and wobble, complete paws visibly attached.
12: suddenly loses strength, knees bend, eyes droop.
13: collapsing, front paws buckle, shoulders and head move toward floor.
14: landing gently on his side, eyes closing.
15: exact same dead lying pose as cell 0, seamless loop.
Maintain the same mint Frankenstein EduCat identity, glasses geometry, navy patches, stitches, neck bolts and vest throughout. Careful whole-character anatomy, never detached limb cutouts. Lightning appears ONLY in cells 2 and 3. Render an attractive production-ready transparent sprite sheet; each cell must be clearly isolated and square. No text: the exact Spanish speech bubble will be composited in software.

## Corrección de márgenes y bordes

Edit target: Image 1, the EduFrankenstein 4x4 sprite sheet. Preserve the exact sixteen poses in the exact same reading order and the character identity (mint green/navy cat, navy glasses, pink ears, stitches, silver neck bolts, ragged plum vest). Image 2 is only the original EduCat identity reference.
Correct ONLY sprite sheet usability and edge quality. Each equal square cell must contain its entire character, tail, paws and any electricity WELL INSIDE its own cell: reserve at least 8 percent transparent padding on the left and right of EVERY cell and 5 percent transparent padding on the top and bottom. Reduce character scale uniformly slightly if necessary; preserve one consistent scale across ALL cells. Align paw baseline uniformly at 90 percent height. No silhouette, tail, sparkle or glow may touch a cell edge or bleed into another cell. This includes the standing tails and the falling characters. Lightning belongs only to cells 2 and 3, entirely within those cells with its top end inset from the cell boundary. Clean all isolated stray pixels, all green/cyan fringes and all artifacts between cells. Crisp clean dark outlined shapes and natural antialiased alpha edges. True transparent alpha backdrop.
Keep the 4 by 4 exact equal-cell topology, no grid lines. Preserve corpse poses in cells 0,1,2,14,15; both eyes peacefully closed without visible open pupils. Cell 15 must exactly match cell 0's lying pose to loop seamlessly. Preserve rise sequence cells 4-7, four erratic walk poses 8-11, collapse 12-15. One connected complete cat per cell, never detached limb parts. No writing or speech bubbles, these are composited separately.

La hoja corregida colocó el primer rayo en la celda 1; el constructor intercambia las celdas 1 y 2 para conservar el orden narrativo. La celda 15 de la hoja se iguala a la primera; el GIF actual termina la caída en la celda 14 y vuelve a la primera, sin añadir otra espera al final.

La hoja generada mide 1254 × 1254 px, pero sus filas pintadas no coinciden exactamente con cuartos iguales. Se midieron bandas de contenido en y=34–345, 400–656, 696–965 y 1032–1215. El constructor recorta cada fila por separado y mantiene un factor de escala común, alineando el suelo en y=248 del GIF. Así no entran las patas de una fila anterior en el siguiente cuadro. La paleta GIF reserva el índice transparente y el bucle usa la extensión de repetición infinita.
