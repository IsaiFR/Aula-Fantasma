# Validación de Aula Fantasma 1.7.2

7 de octubre de 2026. Windows x64, Electron 44.5.1.

## Correcciones

- EduFrankenstein gira hacia el sentido del recorrido. Se activó el reflejo horizontal del paquete y se protegieron los fotogramas con texto para conservar «¡Está vivo!» legible.
- Se retiraron los dos glifos triangulares del globo. El borde inferior ya no tiene la marca en V.
- EduFrankenstein permanece tumbado 10 segundos, despierta durante 5, camina 30 y cae en 0.75. El GIF tiene 111 imágenes, fondo transparente, tamaño 256 × 256 px y bucle infinito de 45.75 segundos.
- Modo libre: avanza en X e Y con variaciones suaves de rumbo y rebotes. Se eliminó la inversión casi constante que lo hacía oscilar sobre el mismo sitio. Modo bordes: sigue el perímetro. Modo esquina: conserva su posición.
- Solo camina durante la etapa walk; pausa congela el reloj y el desplazamiento.
- La selección anterior incluida se actualiza al reiniciar por su SHA-256 conocido. Los ajustes guardados se conservan y los perfiles personalizados no se sustituyen.

## Verificación

- Sintaxis correcta y 71 pruebas aprobadas, incluidos los tiempos exactos, recorrido en ambos ejes, orientación en ambos sentidos y lienzos, perímetro, esquina, pausa, exportación y compatibilidad.
- Prueba gráfica del portable: 18 grupos aprobados con Electron real, sandbox y GPU habilitados; sin errores de renderer.
- Comparación de todos los píxeles en las dos salidas: caminar a la izquierda refleja horizontalmente la pose derecha, tanto con GIF como con PNG; el fotograma con texto coincide sin reflejarse. Evidencias: .smoke-data/edufrankenstein-gif-left.png, edufrankenstein-gif-right.png y edufrankenstein-alive.png.
- Las dos salidas mostraron todas las etapas sincronizadas, el GIF de 111 imágenes, la pausa, el bucle y la alternativa PNG.
- En los píxeles del canvas se comprobó que la zona bajo el globo queda transparente. Las posiciones de ambas salidas avanzaron más de 150 px en X y 75 px en Y tras 20 segundos simulados de caminata.
- Se cargaron el paquete original de prueba y el paquete incluido de 1.7.1 reconstruido con su SHA-256 exacto; se comprobó la actualización automática y la conservación de los ajustes en ambos casos.
- El portable se recompiló en la misma raíz; los 48 archivos de ejecución y recursos coinciden por SHA-256 con el ASAR.

## Sesión habitual

El portable se actualizó en esta misma raíz. Las pruebas gráficas usaron preferencias aisladas en .smoke-data. Se compararon los ajustes diarios de AppData antes y después de las pruebas: permanecieron iguales.

La sesión diaria tenía seleccionado EduScream. Al abrirla para comprobar el arranque, su migración aplicó el preset anterior; se restauraron exactamente los ajustes capturados antes de la apertura y se cerró la app, que inicialmente no estaba abierta. OBS no estaba en ejecución durante esta corrección; la orientación se validó en Electron y no en una escena real de OBS.

## Entrega y alcance

Código, ejecutable y mascotas permanecen en C:\Users\kikef\Desktop\Aula Fantasma, sin crear carpetas de versiones. Los entregables actualizados son pets/EduFrankenstein.aulapet y pets/EduFrankenstein.gif. Evidencias: .smoke-data/result.json, edufrankenstein-alive.png, edufrankenstein-travel-start.png y edufrankenstein-travel.png.

La comprobación gráfica usa ventanas fuera de pantalla y un consumidor de navegador. No confirma una escena real de OBS, cámara virtual ni la superposición visible sobre otras aplicaciones.

## Dos lienzos y EduGhost animado — 1.10.0 (15 de octubre de 2026)

- Selector de un clic entre 16:9 (1920 × 1080) y 9:16 (1080 × 1920). Las selecciones y ajustes visuales de ambas mascotas se guardan por formato en preferencias v5. El micrófono permanece común. La vista vertical completa cabe en la ventana de prueba sin desbordamiento horizontal.
- EduGhost de voz incorpora flotación, balanceo y ondulación de sábana en .pet v7. Los cuatro PNG coinciden exactamente con los extraídos del adjunto original, verificados por SHA-256. Se protege la cara y ambas patas; se conserva transparencia, voz, parpadeo y espejo automático. La actualización solo sustituye la versión incluida exacta conocida.
- Sintaxis correcta y 92 pruebas de lógica aprobadas. Incluyen límites y tamaños en ambas proporciones, integridad de los cuatro PNG, compatibilidad v6/v7 y actualización conocida de EduGhost.
- `smoke -- --packaged`: 22 grupos de regresión aprobados, sin errores de renderer; se conservan mascotas anteriores, ciclos, saludos, controles, selector, transparencia y persistencia.
- `smoke -- --packaged --voice`: 46 comprobaciones aprobadas, sin errores de renderer. Se midieron cambios reales en los píxeles de la sábana con cara y pata estables, flotación, las cuatro poses animadas y espejo. Se verificaron perfiles independientes de tamaño/esquina/recorrido/personaje, cambios repetidos sin abrir otra captura de micrófono, recarga de preferencias, formato inválido rechazado y vista vertical dentro de la ventana.
- El portable 1.10.0 quedó actualizado en la raíz; 76 archivos de código, recursos y guías coinciden con el ASAR. Las salidas ocultas omiten el procesamiento de sábana.
- Las pruebas usaron .smoke-data. El hash de preferencias diarias de AppData no cambió: `644CD3F80FBFFF38180D7FAE78639BE9CD7BA93B3BE8B9D7833B51A88138FB8E`.
- Evidencias: .smoke-data/voice-result.json, .smoke-data/result.json, .smoke-data/canvas-portrait.png, .smoke-data/ghost-voice-wave-a.png y .smoke-data/ghost-voice-wave-b.png. Las pruebas de salida web se hicieron en Electron; no se modificaron ni validaron escenas reales de OBS.

## Panel y espejo automático — 1.9.1 (15 de octubre de 2026)

- `smoke -- --packaged --panel-only`: cuatro grupos aprobados en el portable final, sin errores de renderer. Se comprobaron controles, selector superior, vistas previas, selección y animación anterior. La navegación cierra la conexión y el dibujo de la vista que se abandona; las comprobaciones toleran el instante en que un documento de iframe aún no tiene raíz.

- Se retiró el bloque redundante Tu mascota y su selector inferior. Las dos tarjetas superiores conservan la selección de voz y recorrido. La exportación permanece junto al título de configuración.
- La mascota de voz se refleja horizontalmente en las dos esquinas derechas y conserva la orientación original en las izquierdas. El espejo se aplica a las cuatro poses sin alterar los PNG ni los paquetes .pet; el cambio de esquina actualiza el canvas aunque la pose sea la misma.
- Sintaxis correcta y 90 pruebas de lógica aprobadas. La prueba `smoke -- --packaged --voice` aprobó 32 comprobaciones, incluidas ausencia del bloque duplicado y comparación de todos los píxeles de las cuatro poses reflejadas en escritorio, vista previa y consumidor web. Se comprobó también la orientación original al cambiar a la izquierda y el retorno automático del espejo al volver a la derecha. Sin errores de renderer.
- El ejecutable y el ASAR se actualizaron en la raíz a 1.9.1. Ante el bloqueo de Windows al eliminar previamente el ejecutable, el empaquetador pasó a sobrescribir los archivos regulares en su sitio. La versión del ejecutable se verificó como 1.9.1 y los 74 archivos del paquete coinciden con la fuente.
- El SHA-256 de las preferencias diarias se conservó en `442B271F25200941F2D4514EC624FDACEB77064B1A8596825DA29B5888C83E0A`. Las pruebas usan .smoke-data; no se realizó una comprobación en una escena real de OBS.
- Evidencias: .smoke-data/voice-result.json, .smoke-data/dual-panel.png y .smoke-data/voice-{open,talking,closed,talkingClosed}.png.

## Dos mascotas simultáneas — 1.9.0 (15 de octubre de 2026)

- Dos opciones independientes: voz fija en cualquiera de las cuatro esquinas (`.pet`) y recorrido/saludo (`.aulapet`). Cada una conserva selección, ajustes y visibilidad. Los catálogos se filtran y rechazan selecciones del otro tipo.
- Se revisaron las capturas del panel y de los selectores. La capa de voz conserva la transparencia y comparte el fotograma/conexión de su salida; no abre otra conexión SSE que bloquee las cargas de imágenes del navegador.
- Sintaxis correcta y 90 pruebas unitarias aprobadas. `npm.cmd run smoke -- --packaged`: 22 grupos de regresión aprobados. Se amplió el límite del runner a 120 segundos para completar las comprobaciones gráficas.
- `npm.cmd run smoke -- --packaged --voice`: 30 comprobaciones aprobadas, sin errores de renderer. Incluyen ambas mascotas visibles, desplazamiento junto a voz fija, saludo junto a voz, cuatro esquinas, transparencia compuesta, una conexión OBS, las cuatro poses exactas en las tres salidas, micrófono sintético, cámara denegada, catálogos separados, selecciones independientes, ocultación individual, persistencia y migración desde las selecciones v3 de voz y recorrido.
- El portable 1.9.0 se actualizó en la misma raíz. Los 74 archivos de código, recursos y guías coinciden con `resources/app.asar`. El acceso sigue siendo `INICIAR-APP.cmd`.
- Las pruebas usaron `.smoke-data`. El SHA-256 de las preferencias diarias de AppData se mantuvo en `DFFB8C3A60878FD28FB548D1619F7B1A4991D5F0FAD2C4971A6873436714E484` antes y después de las comprobaciones.
- Evidencias: `.smoke-data/result.json`, `.smoke-data/voice-result.json`, `.smoke-data/dual-panel.png` y `.smoke-data/pet-selector-voice.png`. La salida web de OBS se comprobó en Electron; no se probó una escena real de OBS en esta sesión.

## Mascotas de voz — 1.8.0 (14 de octubre de 2026)

- Se añadieron EduWitch, EduDracula, EduGhost y EduMomia como `.pet` de voz a partir del adjunto `MascotaHalloween.veado`, con cuatro PNG RGBA de 1254 × 1254 por personaje. El origen y la instalación de veadotube se consultaron sin modificarlos. Contrato y fuentes oficiales: `docs/formato-pet.md`.
- `npm.cmd run check`: sintaxis correcta. `npm.cmd test`: 90 pruebas aprobadas, incluidas histéresis, espera cero, pérdida de muestras, formato, transparencia, poses y biblioteca mixta `.pet`/`.aulapet`.
- `npm.cmd run smoke -- --voice --real-microphone`: acceso a la entrada física y cálculo RMS aprobados. Después de comprobar esa captura, la prueba inyecta niveles controlados por el puente real para comparar las cuatro poses; no es una evaluación de reconocimiento de voz ni una calibración acústica del usuario. No graba audio.
- `npm.cmd run smoke -- --packaged`: 22 grupos de regresión aprobados en el ejecutable final. Incluye mascotas anteriores, ciclos, biblioteca, controles, transparencias, migraciones y sincronización.
- `npm.cmd run smoke -- --packaged --voice`: 15 comprobaciones aprobadas con dispositivo sintético: captura, enumeración, cámara denegada aun con audio activo, controles, cuatro poses idénticas píxel por píxel en escritorio/vista previa/consumidor web, navegación, apagado, restauración, importación y exportación. Sin errores de renderer.
- El portable 1.8.0 se actualizó en la raíz. `node scripts/verify-package.cjs`: 74 archivos de código, recursos y guías coinciden con `resources/app.asar`.
- Las pruebas usaron `.smoke-data`. El archivo diario de AppData conserva su fecha anterior a esta sesión; su SHA-256 antes y después de las pruebas del portable es `218701157F8F20AA620810BFA82FCB47694CB496810B217D1E1F785E0407DB4B`. No se dejó abierta una instancia de prueba.
- Evidencias: `.smoke-data/result.json`, `.smoke-data/voice-result.json`, `.smoke-data/voice-panel.png` y `.smoke-data/voice-{open,talking,closed,talkingClosed}.png`. La prueba web de OBS se hizo dentro de Electron; queda pendiente la comprobación en una escena real de OBS.
