# Formato de mascotas .pet

En Aula Fantasma 1.10.0 se añade v7 para voces con sábana animada. EduGhost usa las cuatro poses PNG originales, `animation.float` y `animation.cloth` con regiones protegidas de cara y patas. El renderer compone primero la pose, deforma la tela con interpolación de alfa premultiplicado a la resolución visible y finalmente aplica el espejo. El reloj compartido mantiene la animación sincronizada con voz y parpadeo. Solo se migra el hash exacto del antiguo EduGhost incluido; las variantes personalizadas se conservan.

Las preferencias v5 guardan dos perfiles de lienzo, 16:9 y 9:16. Cada uno conserva selecciones y configuración visual; las cuatro preferencias de micrófono son comunes. Consulta `docs/canvas-profiles.md`.

Desde Aula Fantasma 1.9.0, `.pet` ocupa la opción independiente **Voz en una esquina**, simultánea a la opción **Recorrido y saludo (.aulapet)**. Cambiar la selección o configuración de recorrido no altera la mascota de voz. La esquina, tamaño y micrófono se guardan en `voice.settings` del esquema de preferencias v4; las selecciones se guardan como `voice.petFile` y `petFile`. `voiceEnabled` y `companionEnabled` controlan su visibilidad por separado. Ambas comparten el servidor, las salidas y el monitor. La voz tiene un reloj propio de parpadeo, sin recorrido, apariciones ni saludo.

JSON UTF-8 autocontenido: `format: "aula-fantasma-pet"`, `version: 6`, `kind: "voice"`, `name`, `images`, `animation` y `behavior`. Límite de 32 MB por paquete, 20 MB por imagen. Cada imagen contiene `mime` y `dataBase64`; no se admiten scripts, rutas o referencias externas. Validación en `src/pet-package.cjs` y decodificación real en Electron antes de activar. Todas las poses deben tener las mismas dimensiones, hasta 8192 px por lado en la app.

| Imagen | Boca | Ojos |
| --- | --- | --- |
| `images.open` | Cerrada | Abiertos |
| `images.talking` | Abierta | Abiertos |
| `images.closed` | Cerrada | Cerrados |
| `images.talkingClosed` | Abierta | Cerrados |

`talking` y `open` son obligatorias; si se habilita parpadeo también se requieren las otras dos. Las mascotas incluidas usan PNG RGBA sin pérdida. El renderer precarga las cuatro poses y dibuja el cambio de boca/ojos completo, sin recargar recursos por cada muestra de voz. V6 reproduce las poses con flotación opcional; v7 añade `animation.cloth` y exige PNG para las cuatro poses. No se combinan máscaras de ojos ni motores rig/flipbook/cycle con la voz. `animation.blink` aporta intervalo y duración. La voz se mantiene en su esquina y usa su propio reloj, independiente de la pausa de recorrido.

Las preferencias `micEnabled`, `micDeviceId`, `micThreshold` y `micRelease` pertenecen a la app, no al archivo compartido. Por defecto: apagado, dispositivo predeterminado, −38 dB, 180 ms. Una ventana interna aislada captura audio mediante `getUserMedia` y calcula RMS cada 30 ms. Solo esa ventana, en su URL local exacta y con una mascota de voz y el control activo, recibe permiso de audio; cámara y otras páginas quedan denegadas. No hay grabación, monitorización en altavoces ni transferencia de muestras. Una caída o más de 500 ms sin muestras cierra la boca. El motor principal usa histéresis de 6 dB y comparte estado a 30 Hz entre escritorio, vista previa y salida OBS.

## Conversión del adjunto

Origen: `C:\Users\kikef\Desktop\Halloween\MascotaHalloween.veado`, 15,938,915 bytes. Contiene EduWitch, EduDracula, EduGhost y EduMomia. El conversor extrae sus imágenes completas `AIMG`/`ABMP`, decodifica `VDD.`, conserva el lienzo y coloca los recortes con sus offsets; invierte las filas porque Veado almacena desde abajo. Genera PNG y un `.pet` por personaje. No modifica el origen ni necesita ejecutar veadotube.

```powershell
node scripts/convert-veado.cjs 'C:\Users\kikef\Desktop\Halloween\MascotaHalloween.veado' pets
```

El conversor admite el diseño MSTA del adjunto exportado por mini 1.4 (flags uint32 y tres doubles de parpadeo) y texturas `VDD.`/`RAW.`, con imágenes estáticas de hasta 2048 × 2048. Rechaza imágenes animadas para evitar descartar fotogramas. Los tiempos conservados son 0.15 s de parpadeo e intervalo 0.75–4 s. Las miniaturas, efectos, transiciones y atajos de Veado no se trasladan: esta integración reproduce las cuatro poses y el parpadeo, y usa los controles de movimiento de Aula Fantasma. No es un importador universal de todas las versiones de `.veado`.

La instalación consultada está en `C:\Users\kikef\Downloads\veadotube-mini-win-x64`, con su ejecutable, `lib`, `text` y créditos. No se incorporan binarios ni librerías de esa instalación. `.pet` es el formato propio de Aula Fantasma, no un `.veado` renombrado.

Documentación oficial consultada:

- [Funcionamiento de mini: boca, ojos y micrófono](https://veado.tube/docs/usage/mini/)
- [Contenedor VEADOTUBE](https://veado.tube/docs/tech/file/)
- [Avatares mini](https://veado.tube/docs/tech/file/miniavatar/)
- [Imágenes y compresión VDD](https://veado.tube/docs/tech/file/images/)
- [Permisos de Electron](https://www.electronjs.org/docs/latest/api/session)

Desde 1.9.1 el fotograma compartido incluye voice.mirrored según la esquina: true a la derecha y false a la izquierda. El renderer refleja todas las poses al dibujarlas en el canvas, conserva la transparencia y actualiza la orientación aun cuando no cambie la pose. Los PNG del paquete permanecen intactos.

## EduGhost: transparencia automática (v8, Aula Fantasma 1.11.0)

EduGhost de voz añade `effects: { "ghostOpacity": { "fadeSeconds": 0.8 } }` en `.pet` v8. El efecto pertenece al personaje y se conserva al exportar/importar. Los `.pet` v6/v7 y `.aulapet` v1–v5 conservan su formato e identidad cuando no incorporan este efecto.

El ciclo mantiene 100 % durante `ghostSolidSeconds`, transiciona suavemente a 75 %, mantiene 75 % durante `ghostFadedSeconds` y regresa suavemente al 100 %. Las duraciones son segundos enteros de 1 a 600, con valores iniciales 20 y 8; se guardan en las preferencias de cada formato. Las transiciones de 0.8 s se suman a los tiempos completos de permanencia. El valor manual anterior de opacidad se ignora únicamente cuando el efecto está presente.

El reloj central de voz publica `ghostOpacity.opacity` y `ghostOpacity.phase` en todos sus fotogramas. Cambiar los tiempos, seleccionar el personaje o cambiar de lienzo reinicia el ciclo al 100 %. Pausar el recorrido no pausa el reloj de voz; minimizar o abrir el selector tampoco lo reinicia. La interfaz sustituye el control manual por dos controles de duración solo para el `.pet` con el efecto. Los cuatro PNG originales de EduGhost permanecen intactos. Se migran únicamente los hashes conocidos de las versiones incluidas v6/v7.

## EduDracula: murciélago (v9, Aula Fantasma 1.12.0)

El paquete añade `images.bat` (PNG transparente autocontenido) y `effects.draculaBat`: `transitionSeconds: 0.8`, `wingLeft: 0.31`, `wingRight: 0.68`, `wingRootY: 0.53`. Las poses originales de voz, el perfil de parpadeo y el comportamiento anterior se conservan byte por byte. El recurso de murciélago puede tener otras dimensiones; las cuatro poses de voz siguen compartiendo dimensiones. Los paquetes de EduGhost permanecen en v8, con su misma identidad.

`draculaBatEnabled` activa el ciclo; `draculaSeconds` y `draculaBatSeconds` mantienen las formas durante 20 y 8 segundos por defecto (admiten de 1 a 600). Las transiciones se suman a esas duraciones. Al apagar el interruptor vuelve inmediatamente a la forma original. Los tres controles se conservan por lienzo, independientes de micrófono, tamaño, esquina y opacidad. Cambiar cualquiera de ellos, seleccionar el personaje, reiniciar o cambiar de formato comienza como Drácula.

`src/dracula-bat.cjs` calcula la fase y mezcla desde el reloj de voz. `web/dracula-bat.js` dibuja las alas articuladas, vuelo oscilante y nubes rojas sin usar relojes aleatorios del navegador; las tres salidas reciben los mismos píxeles para un mismo fotograma. La forma original conserva voz y parpadeo; el murciélago tiene su propia pose de vuelo. Solo se actualiza automáticamente el hash exacto del EduDracula original incluido. El archivo exportado lleva su ilustración y efecto, sin referencias externas.

Comprobación: `npm.cmd run smoke -- --packaged --dracula`, aislada en `.smoke-data`, verifica sincronización, ciclo, aleteo, alfa y bordes, interruptor y persistencia por formato. Una salida de navegador usada en la prueba de Electron no constituye validación de una escena real de OBS.

### Voz y parpadeo del murciélago (v10, Aula Fantasma 1.12.1)

Se añaden `images.batOpen` (boca cerrada, ojos abiertos), `images.batClosed` (boca cerrada, ojos cerrados) y `images.batTalkingClosed` (boca abierta, ojos cerrados). `images.bat` conserva exactamente el PNG aprobado y corresponde a boca abierta con ojos abiertos. Las cuatro imágenes deben ser PNG del mismo tamaño; el importador v10 exige las cuatro. Los paquetes v9 permanecen compatibles y exportan como v9 si no tienen poses adicionales.

El renderer elige la expresión con `voice.speaking` y `voice.blinking`, igual que la forma original. Compone únicamente las regiones de ojos y boca sobre el murciélago aprobado, conservando alas, cuerpo, accesorios, humo y movimiento. El mismo micrófono, umbral y espera de cierre gobiernan ambas formas. No hay nuevos controles ni cambios de duración, opacidad o preferencias. La actualización automática reconoce también el hash exacto de la primera versión v9 incluida.

La prueba aislada de Drácula usa la captura de micrófono sintética de Electron y el puente de niveles para verificar las cuatro combinaciones, comparar píxeles en escritorio/panel/salida de navegador y comprobar que solo cambia el rostro.

## Vehículos de recorrido (v11, Aula Fantasma 1.14.0)

El formato v11 usa `kind: "companion"`, `images.open` y `images.atlas` (PNG autocontenidos), y `behavior.vehicle`. No modifica la serialización ni identidad de los paquetes v1–v10. El perfil de vehículo es incompatible con los otros motores y exige desactivar flotación, sábana y parpadeo.

`vehicle` declara `wheelRadius` (radio de rodadura relativo al tamaño), `turnRate` (radianes por segundo), y `views.left/right`. Cada vista contiene un `crop` normalizado del atlas y de dos a cuatro `wheels`: centro `cx/cy`, radios `rx/ry` y un rectángulo `clip` opcional para la zona visible. Se rechazan números no finitos, ruedas externas, claves desconocidas y mezclas de motores. No admite scripts ni rutas.

El reloj central publica `vehicle.heading`, `wheelAngle`, `steering` y `moving`. El renderer rota las texturas elípticas de las ruedas y cambia entre las vistas dibujadas, aplicando perspectiva e inclinación progresivas. Pausa congela el vehículo completo; esquina detiene ruedas y recorrido. Véase `docs/eduf1-generation.md`.

## EduHomelander y el viento localizado (v13)

El paquete de voz conserva las cuatro poses PNG y añade `animation.cloth.motionRegions`. Cada región declara un polígono `points` en coordenadas normalizadas, una distancia `feather` de atenuación hacia el interior y una intensidad `strength`. El perfil admite de 1 a 8 polígonos y de 3 a 24 puntos por polígono. En este modo, los polígonos marcan dónde actúan las ondas de `cloth`.

EduHomelander usa una región por faldón y una más suave para el fleco. Las ondas siguen el reloj de voz mientras la mascota está visible, incluso con el micrófono apagado. El mismo perfil se aplica a todas las poses y se conserva al exportar. Si la selección guardada coincide con el paquete original incluido, se actualiza al abrir la app.

`node scripts/animate-voice-capes.cjs` aplica los contornos de las capas de EduBot, EduDracula, EduLuchador, EduMoon, EduStarlight, EduStrange y EduWitch sobre sus paquetes existentes. Conserva los PNG, el parpadeo, la voz y los efectos del paquete.

`node scripts/animate-voice-hair.cjs` aplica el viento al cabello de EduAlloy, EduCage, EduConquest, EduDeep, EduEve, EduJames, EduLeon, EduMark y EduSoldier. La ondulación es continua y las raíces quedan fijas. `npm.cmd run smoke -- --packaged --hair` verifica movimiento y poses de voz con audio simulado en Electron.

## EduDracula con capa y murciélago (v14)

El formato v14 combina el viento localizado con `effects.draculaBat` y sus cuatro poses de murciélago. La capa se dibuja en la forma original y en su parte visible durante la transición. En la forma de murciélago se conservan el aleteo, el humo y las expresiones del v10.

La prueba `npm.cmd run smoke -- --packaged --capes` comprueba las siete capas y el ciclo de EduDracula con audio simulado en Electron.

## Acciones periódicas de voz (v15)

`effects.voiceCycle` declara una `action` y sus tiempos `idleSeconds` y `activeSeconds`. Las acciones actuales son `scan`, `freeze`, `flame`, `melt`, `helmet` y `agent`. Los paquetes incluidos esperan 20 segundos en reposo y realizan la acción durante 5,5 a 7 segundos. Al seleccionar la mascota, cambiar de lienzo o restablecer la posición, vuelve a contar la espera. El importador reconoce la acción retirada `parasites` en paquetes anteriores y la deja en reposo.

EduStrading pliega y despliega las cuatro aletas de su sensor durante la alerta. La luz del sensor se intensifica al desplegarse y el bebé sigue reaccionando desde la cápsula.

Las acciones se sincronizan en escritorio, panel y salida de navegador para OBS. Funcionan con el micrófono apagado y conservan los PNG de las poses de voz. EduZero mantiene su bruma y fija la pose durante la congelación. EduFast usa el casco de su propia ilustración, que vuelve al suelo al terminar. `npm.cmd run smoke -- --packaged --voice-cycles` verifica cada acción y su regreso a reposo en el portable.
