# EduScream GIF · 1.6.0

2 de octubre de 2026. Se usó imagegen integrado, sin CLI/API, con original-knife.png y original-neutral.png como referencias de identidad y anatomía. Los originales y el atlas anterior permanecen intactos. Se dibujaron personajes completos para cada fotograma.

Primera hoja generada: C:/Users/kikef/.codex/generated_images/01a0f45b-fc97-7460-86a6-84fac2f18777/exec-5f9b989c-f2b3-4c16-a2c1-97e3af79e9c4.png. Copia: web/eduscream/gif-source-sheet.png. Se detectó un salto grande entre las primeras poses del cuchillo y se solicitó una edición. Hoja final: C:/Users/kikef/.codex/generated_images/01a0f45b-fc97-7460-86a6-84fac2f18777/exec-abb4935a-d5cd-448b-8809-b2f6815048b7.png; copia: web/eduscream/gif-source-sheet-v2.png. Tiene 1254 × 1254 px y alfa real.

La hoja contiene 4 × 4 celdas: ocho pasos y ocho poses de subida. FFmpeg 8.0.1 recorta cada celda respetando límites redondeados, reduce a 180 × 180 con Lanczos y crea una paleta común de 256 colores reservando transparencia. Alpha threshold 64, dither sierra2_4a. No se extraen ni giran patas o brazos separados. La bajada invierte las mismas poses completas.

Archivos finales: web/eduscream/EduScream.gif (8 fotogramas, ciclo 0.8 s, repetición continua) y web/eduscream/EduScream_Saludo.gif (15 fotogramas, 3.4 s, una reproducción). Ambos miden 180 × 180 px y tienen fondo transparente. La hoja web/eduscream/gif-frames.png contiene los mismos fotogramas en 720 × 720 como alternativa de compatibilidad. El archivo pets/EduScream.aulapet v4 incorpora ambos GIF, la hoja, la miniatura y el perfil. Se inspeccionaron las cuatro patas, máscara, sombras, bordes, poses y sentidos en las imágenes exportadas del renderer.

El temporizador y el globo **Detrás de ti** se mantienen en la app. Los GIF independientes animan al personaje; no incluyen texto ni desplazamiento por la pantalla. scripts/create-eduscream-gifs.cjs reconstruye los GIF desde la hoja final; requiere FFmpeg solo para generación. scripts/create-eduscream.cjs reconstruye la mascota guardada. La app portable no necesita FFmpeg.

## Prompt inicial

```text
Use case: identity-preserve / illustration animation sprites.
Asset type: transparent full-character sprite sheet for a hand-drawn GIF of the exact supplied EduScream Halloween cat.
Image 1 is the original WITH knife, primary identity and style reference. Image 2 is the neutral original, supporting anatomy reference. Preserve the original face mask silhouette, asymmetrical black eye sockets, long mouth, black/navy hood and robe with layered cel shadows, pink cat ears, dark blue cat tail, white cat paws, silver knife and black handle. Do not use or emulate a detached cutout rig: redraw every frame as a clean complete connected character.
Produce ONE square PNG sprite sheet, exactly FOUR equal columns by FOUR equal rows, 16 equal square cells. Each cell contains ONE complete identical-sized cat facing screen RIGHT in three-quarter view. Absolutely transparent alpha background. No grid lines, labels, text, margins between cells, drop shadows, checkerboard, floor or scenery. Keep generous safe transparent padding INSIDE each cell for knife sweep and tail. Same head center and scale in ALL 16 frames; feet rest on the SAME ground baseline in every cell. No clipping or overlapping adjacent cells.
ANATOMY PRIORITY: EXACTLY FOUR LIMBS in every frame. TWO hind legs with broad white paws walk, ONE free front leg with a slender vertical white lower leg and rounded paw rests on the ground, ONE front arm has a white cat paw gripping the knife. THREE lower paws visible under the robe plus ONE gripping paw. Anatomically attached limbs, straight ankles and wrists, matching paw size, correct toes, stable outlines, no duplicated or missing feet. Black sleeve covers shoulder connection. Knife hand never floats or twists. Do NOT mirror any frame.
ROWS 1 AND 2 (frames 0 through 7 in reading order): one coherent eight-frame gentle walk cycle in place, knife held LOW at the right side pointing diagonally downward and away from the body. Alternate weight on the two hind paws; tiny clear lift and forward/back steps, free front grounded paw stable, gentle robe sway and tail sway. Frame 7 seamlessly returns toward frame 0. Face, mask, ear geometry, palette and body proportions remain consistent. Keep the character upright. Small walk changes, NOT eight identical still poses.
ROWS 3 AND 4 (frames 8 through 15 in reading order): one eight-frame progressive knife lift while standing still on all three lower paws. Frame 8 is the same low knife posture as walking frame 0. Frames 9-14 progressively bend the knife arm upward around the same attached shoulder, smoothly raising knife from low/downward to upright. Frame 15 has the same knife raised upright beside the head, like image 1. All three lower paws aligned, flat soles, tail and head stable during this gesture. Keep knife blade size, outline and handle consistent in every pose. This sequence will play forward, hold on the last frame, then reverse to lower the knife.
Clean detailed cel-shaded illustration suitable at 180 pixels. Preserve internal dark robe shadows and pale lavender/gray paw shadows across frames. Crisp dark outlines with real alpha edges, no black/white halos. No external shadow or glow. No speech bubble or writing: the app supplies the exact greeting separately.
```

## Corrección del movimiento del cuchillo

```text
Use case: precise-object-edit / identity-preserve.
Edit target: Image 1, the supplied transparent 4 by 4 full-character sprite sheet. Preserve the same 4x4 equal-cell layout, alpha background, scale, all 16 heads/masks/ears/tails, black robe/cel shading, and THREE lower white paws plus ONE knife gripping white paw in EVERY cell.
CHANGE ONLY THE KNIFE ARM POSES IN THE LOWER TWO ROWS (cells 8-15). Keep upper two rows of eight walking frames visually unchanged. Keep three grounded paws, body, face and head position unchanged in lower two rows.
The eight knife angles relative to horizontal screen-right must be precisely:
cell 8 (row 3 column 1): blade pointing down-right at 45 degrees below horizontal, same lowered knife as walking.
cell 9 (row 3 column 2): blade pointing down-right at 25 degrees below horizontal.
cell 10 (row 3 column 3): blade pointing straight horizontal right.
cell 11 (row 3 column 4): blade pointing up-right at 25 degrees above horizontal.
cell 12 (row 4 column 1): blade pointing up-right at 45 degrees above horizontal.
cell 13 (row 4 column 2): blade pointing up-right at 65 degrees above horizontal.
cell 14 (row 4 column 3): blade pointing almost up at 80 degrees above horizontal.
cell 15 (row 4 column 4): blade pointing straight upright at 90 degrees.
Same knife size, same black handle and clean paw grip in all frames. Lift the wrist along a continuous attached elbow/shoulder arc: hand stays to right of robe and below/right of face, elbow joined to black sleeve. NO abrupt jump from downward blade directly to upright. Rotate knife and paw together naturally while preserving paw anatomy and sleeve connection.
Do not introduce text, labels, grid lines, ground, shadows outside the character, background or extra/missing paws. Real transparent alpha and crisp cel-shaded edges. Keep all content inside its corresponding cell with safe margins.
```
