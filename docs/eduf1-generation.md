# EduF1

Nueva mascota de recorrido, Aula Fantasma 1.14.0. Se activa desde el catálogo de movimiento. El paquete `pets/EduF1.aulapet` contiene el PNG de reposo, el atlas de dos vistas y el perfil declarativo de ruedas; funciona sin los archivos de Downloads ni los generadores.

## Base y recursos

- Entrada original: `C:/Users/kikef/Downloads/Gatito al volante del Mercedes F1.png`.
- Copia intacta: `web/eduf1/reference.png`.
- Herramienta: imagegen integrado, modo incorporado, salida transparente.
- Resultados seleccionados: `web/eduf1/right-source.png` y `web/eduf1/left-source.png`.
- Derivados: `right.png`, `left.png` y `atlas.png`, en la misma carpeta.
- Generador reproducible del atlas y paquete: `node scripts/create-eduf1.cjs`. Requiere `@napi-rs/canvas`, disponible mediante `AULA_CANVAS_MODULE` o el runtime local de Codex.

La vista derecha mantiene la composición de la base. La izquierda se dibujó por separado para conservar letras legibles. No se usa un reflejo horizontal de los logotipos. El giro se representa en 2D mediante cambio de vista, compresión de perspectiva e inclinación progresiva, sin modelo 3D.

Cada vista declara tres ruedas: las caras de las dos ruedas cercanas y el arco superior visible de la rueda lejana. El renderer extrae cada textura del atlas, la normaliza a círculo, la rota y la proyecta en su elipse original. Una máscara conserva la carrocería que tapa la rueda lejana. El ángulo depende de la distancia recorrida y se detiene en pausa o en modo esquina.

La posición, rumbo, dirección de giro y ángulo de ruedas proceden de la simulación central, compartida entre escritorio, panel y salida OBS. En movimiento libre anticipa los bordes para realizar curvas suaves. Se mantienen los controles existentes; preset inicial: 300 px, velocidad 130, movimiento libre, siempre visible y saludo apagado.

## Prompts finales

### Fondo transparente y vista derecha

```text
Use case: background-extraction. Edit target: attached image of bespectacled cat driving black/turquoise Mercedes F1 #12, nose pointing RIGHT. Remove ONLY the solid black background to produce a clean true transparent PNG cutout. Preserve the entire car and cat, all three visible tires, original proportions, perspective, labels, turquoise trim, rear wing and front wing exactly. Do not remove black car panels or tires; black inside the silhouette belongs to the car. Single intact complete car, no new shadows, no glow, no ground, no cropping. Wide landscape canvas, tightly fitted with a small transparent margin, the same right-facing view. This will be animated as a desktop pet.
```

### Vista izquierda

```text
Use case: stylized-concept. Asset: opposite-facing view for animated desktop car pet. Input is identity and artwork reference: the same bespectacled helmeted cat driving the black and turquoise Mercedes PETRONAS Formula 1 car number 12. Draw exactly this car and character, same illustrated shading, but now nose points to the LEFT. Three-quarter front view from the opposite side: large front near tire towards left center, rear near tire at far right, far front tire towards far left. All lettering reads normally, including PETRONAS, IWC, INEOS, AMG and 12; do NOT simply mirror the lettering. Entire vehicle intact, retain long wide proportions, small transparent margin, same eye-level camera, three visible tires. True transparent background; no ground, smoke, glow, extra objects. Wide landscape cutout of one car.
```

## Validación

`tests/vehicle.test.cjs` verifica importación/exportación, formato, curvas, límites, velocidad de ruedas, pausa, esquina y bordes. `npm.cmd run smoke -- --packaged --vehicle` comprueba el ejecutable con datos en `.smoke-data`: selección, preset, cambios de píxeles limitados a ruedas, transparencia, vistas, sincronización de tres superficies, pausa, formato vertical y cambio de mascota. Las capturas quedan en `.smoke-data/f1-*.png`. Esta prueba de Electron no sustituye una revisión de una escena real de OBS.
