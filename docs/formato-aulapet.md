# Mascotas .aulapet · versiones 1 a 5

Las mascotas de voz usan el nuevo formato `.pet` v6; consulta [formato-pet.md](formato-pet.md). Los formatos descritos aquí conservan su compatibilidad.

Un archivo `.aulapet` contiene el nombre del personaje, sus imágenes originales y su perfil de animación. Se puede compartir, mover y cargar sin archivos acompañantes. Es un formato propio de Aula Fantasma; no importa ni exporta el formato de otras apps.

En la app, **Cargar mascota** abre el paquete; **Guardar mascota** exporta la mascota seleccionada. Flotación, ondulación y parpadeo se aplican automáticamente desde el paquete, sin interruptores individuales. BOO, el recorrido, las apariciones y las salidas de escritorio/OBS son preferencias de la app y no se exportan dentro del personaje. Cerrar y volver a abrir conserva la selección.

`pets/EduGhost.aulapet` es el personaje completo listo para usar, tanto en desarrollo como desde el ejecutable de esta raíz. `node scripts/create-edughost.cjs` reconstruye el archivo desde los PNG originales y el perfil de EduGhost; no altera las imágenes.

## Estructura

JSON UTF-8 con los campos `format: "aula-fantasma-pet"`, `version: 1`, `2`, `3`, `4` o `5`, `name`, `images` y `animation`. La versión 2 añade `behavior`; la versión 3 admite una quinta capa, `freeFoot`, con su propio PNG `images.limb`; v4 añade pasos y saludo GIF; v5 añade ciclos narrativos. No permite scripts, rutas o enlaces externos. Los motores de animación se implementan en la app; el archivo contiene parámetros declarativos, no código ejecutable. Los archivos v1–v4 se conservan en su formato al exportar y mantienen su identidad SHA-256 anterior. Aula Fantasma 1.7.1 abre las cinco versiones.

`images.open` es obligatorio y `images.closed` es opcional. Cada imagen contiene `mime` (`image/png`, `image/webp` o `image/gif`) y `dataBase64` con sus bytes completos. Ojos cerrados requiere una imagen alineada de igual tamaño. La imagen abierta se mantiene intacta. El parpadeo superpone la imagen cerrada; las máscaras limitan la superposición a los ojos. Importar solamente una imagen crea una mascota con flotación: preparar parpadeo requiere aportar la imagen cerrada y su perfil.

`animation` admite tres objetos:

- `float`: `enabled`, `amplitude` (0–30 px de referencia), `frequency` (0.1–10 rad/s), `tiltAmplitude` (0–15 grados), `tiltFrequency` (0.1–10), `stretchAmplitude` (0–0.1), `stretchPhase` (-10–10).
- `cloth`: `enabled`, `startY`, `fullY` (0–1; fullY al menos startY + 0.001), `tail` (null o startX/endX/startY/endY con transición creciente), `protectedRegions` (hasta 16 elipses), `amplitudeX`, `amplitudeX2`, `amplitudeY` (0–0.08), `frequencyY`, `frequencyX2`, `frequencyY2`, `frequencyX`, `frequencyY3` (0–50), `speedX`, `speedX2`, `speedY` (0–10). La ondulación usa PNG/WebP estático, atenúa las zonas protegidas y adapta el impulso al movimiento. No requiere imagen de ojos cerrados.
- `blink`: `enabled`, `intervalMin` (0.5–60 s), `intervalMax` (desde intervalMin hasta 120 s), `duration` (0.05–2 s), `closeDuration` y `openDuration` (0.01 hasta la mitad de duration), `regions` (hasta 16 elipses). Una lista vacía superpone la imagen cerrada completa.

Cada elipse tiene `cx`, `cy` (0–1), `rx`, `ry` (0.001–1). Las coordenadas se refieren al lienzo cuadrado con la imagen centrada y conservando su proporción. EduGhost tiene zonas específicas para ojos, cara, patas y cola; otros personajes aportan sus propias zonas. Campos omitidos utilizan valores generales: flotación activa, ondulación y parpadeo desactivados, sin máscaras ni zonas específicas del gato.

Máximo 32 MB por archivo, 20 MB por imagen y 8192 px por lado. Se validan versión, campos, tipos, rangos, base64, firma, decodificación y alineación de imágenes. Un paquete inválido no sustituye la mascota activa. La app guarda una copia privada identificada por SHA-256; el archivo que importaste puede moverse sin perder la selección. Los futuros cambios incompatibles del motor requieren una nueva versión de formato.

## Preparar otros personajes

Para una mascota nueva, importa su PNG transparente y guárdala como `.aulapet`. Obtendrás flotación y podrás usar BOO con los mismos dos controles. Para añadir ondulación o parpadeo personalizado, prepara la imagen cerrada y ajusta los parámetros/regiones del archivo con las funciones de `src/pet-package.cjs`. La app actual es un reproductor/importador/exportador de estos perfiles; no incluye un editor visual de articulaciones.

## Versión 2: pasos y saludo articulado

`images.atlas` contiene un PNG transparente con las cuatro capas del personaje. No requiere las dimensiones de `open`: el atlas se recorta en tiempo de ejecución. `behavior` contiene:

- `walk`: `enabled`, `frequency` (0.5–20 rad/s), `stepHeight` y `stepWidth` (0–0.08 del lienzo), `footAngle` (0–25 grados), `bob` (0–10 px de referencia), `lean` (0–8 grados). Cada pata alterna con un desfase de π. La velocidad del recorrido adapta la cadencia y los pasos se atenúan al detenerse.
- `greeting`: `text` (1–40 caracteres), `raiseSeconds` y `lowerSeconds` (0–2), `holdSeconds` (0.3–8). El saludo detiene el recorrido durante las tres etapas y muestra el texto durante la postura levantada. El mismo interruptor de saludo y botón manual funcionan con el texto de cada mascota. Repetir el botón durante el gesto no lo reinicia.
- `rig`: null o `{mirror, layers}`. `mirror` es booleano: refleja el personaje al desplazarse hacia la izquierda. `layers` incluye exactamente una capa de cada tipo: `body`, `leftFoot`, `rightFoot`, `arm`. Cada capa tiene `role`, `crop`, `placement`, `pivot`, `restAngle`, `raisedAngle`. Los rectángulos `crop` y `placement` son `{x,y,width,height}` normalizados 0–1; deben quedar dentro del atlas/lienzo. `pivot` es `{x,y}` dentro de la capa y los ángulos admiten -150–150 grados. Las patas se dibujan detrás del cuerpo; el brazo, delante. La misma textura del brazo se interpola entre los ángulos de reposo y levantado.

Una mascota articulada debe desactivar los tres motores v1 (float/cloth/blink) y aportar `atlas`. No se aplican coordenadas específicas de EduScream a otros personajes: cada archivo lleva sus propios recortes y posiciones. Pausar congela pasos, brazo y temporizador; el ciclo de apariciones espera que termine la bajada antes de sacar al personaje. El texto se inserta como texto plano y no como HTML.

Las versiones de Aula Fantasma anteriores a 1.5 no pueden reproducir un paquete v2.

## Versión 3: cuarta pata independiente

Conserva el comportamiento v2 y añade `images.limb`, un PNG transparente que puede tener dimensiones diferentes del atlas. Una capa opcional `freeFoot` utiliza ese PNG: su rectángulo `crop` se refiere a `limb` y su `placement` al lienzo del personaje. Se dibuja detrás del cuerpo, después de las patas alternadas. No recibe el giro ni el desplazamiento de los pasos, ni el giro del cuchillo. El cuerpo tapa la unión superior de la manga. Se mantienen las cuatro funciones obligatorias v2 y se permite exactamente una capa adicional. Una capa `freeFoot` requiere `limb` PNG y versión 3.

`pets/EduScream.aulapet` y `scripts/create-eduscream.cjs` constituyen un ejemplo completo v3: dos patas con pasos alternados, una pata delantera libre que sostiene al personaje y la pata que sujeta el cuchillo. Las tres suelas inferiores comparten la línea de apoyo en reposo; los recortes conservan sus proporciones. El giro de las patas es cero y se conserva la subida 0.65 s, «Detrás de ti» 1.9 s y bajada 0.65 s. El paquete v3 requiere Aula Fantasma 1.5.1.

La selección privada del EduScream incluido en 1.5.0 se actualiza al nuevo paquete al abrir 1.5.1, exclusivamente si su SHA-256 coincide con el original conocido. Los perfiles personalizados y las selecciones de otros personajes se conservan. El archivo original importado y la copia privada anterior no se borran.

## Versión 4: reproducción de GIF por fotogramas

images.walk y images.greeting contienen GIF completos; images.frames contiene un PNG con los mismos fotogramas y images.open la miniatura. El perfil behavior.flipbook usa mirror, size (32–512 px), columns/rows (1–8), walkFrames/raiseFrames (2–32). La hoja debe tener size × columns de ancho y size × rows de alto. Sus primeras walkFrames celdas son pasos; las siguientes raiseFrames son poses de subida. El GIF de saludo contiene la subida y su inversión, sin duplicar el último fotograma levantado: raiseFrames × 2 − 1 imágenes. Se validan firma, dimensiones, estructura y cantidad de imágenes GIF. No puede combinar flipbook con rig o los motores float/cloth/blink.

El renderer usa ImageDecoder para dibujar el fotograma correspondiente al reloj común; la pausa funciona aunque el formato GIF tenga un bucle. La hoja PNG permite reproducir las mismas poses si el navegador no dispone de ese decodificador. El texto queda en el globo de la app y no se refleja con la imagen. El intervalo del saludo es fijo, sin la variación aleatoria usada por EduGhost. El tamaño y el recorrido se calculan en píxeles de cada salida; los fotogramas y las etapas del saludo siguen sincronizados.

El preset EduScream incluido aplica 180 px, 30 px/s, saludo activado cada 30 s y apariciones inicialmente desactivadas para completar el ciclo. Estos son ajustes de la app al importar/actualizar la versión incluida; no forman parte de los archivos de personajes personalizados. Al reiniciar una selección v4 ya guardada se conservan los ajustes que el usuario haya cambiado.

## Versión 5: ciclo narrativo

`images.cycle` contiene el GIF transparente del ciclo completo; `images.frames` contiene su hoja PNG y `images.open` la miniatura. `behavior.cycle` define `size` (32–512), `columns` y `rows` (1–8), `mirror` y `sequence` (2–128 entradas en Aula Fantasma 1.7.1). Cada entrada tiene `frame` (celda de la hoja), `seconds` (.02–10), `stage` (`dead`, `lightning`, `rise`, `walk` o `fall`) y, opcionalmente, `text` (hasta 40 caracteres). La duración total no supera 120 segundos. El GIF debe tener una imagen por entrada y coincidir en dimensiones y duración; la hoja debe coincidir con la cuadrícula declarada.

No se combina con rig, flipbook, pasos articulados, flotación, sábana ni parpadeo. El texto de este perfil se dibuja dentro de los fotogramas al construir el recurso: no es HTML ni código ejecutable. Desde Aula Fantasma 1.7.2, `mirror:true` refleja los cuadros al mirar hacia la izquierda, excepto las entradas con `text`, que conservan su lectura. Declarar `text` en cada entrada que contenga letras integradas. El renderer reproduce las imágenes según el reloj común, pausa el ciclo y usa las celdas indicadas cuando ImageDecoder no está disponible.

Solo la etapa `walk` permite desplazamiento. En modo libre varía suavemente el rumbo y rebota al llegar al borde, sin invertirlo constantemente sobre la misma zona; el modo bordes sigue el perímetro y el modo esquina conserva la posición. Las otras etapas permanecen quietas. El ciclo se repite independientemente del temporizador BOO. `pets/EduFrankenstein.aulapet` y `scripts/create-edufrankenstein.cjs` son el ejemplo completo. El preset del personaje incluido aplica 256 px, 55 px/s, modo libre y apariciones desactivadas; no se aplica a ciclos personalizados. Al actualizar una selección anterior del personaje incluido se preservan todos los ajustes guardados.
