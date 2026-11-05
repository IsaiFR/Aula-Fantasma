# Aula Fantasma

**Mascotas animadas para acompañar clases, presentaciones y transmisiones en vivo.**

Aula Fantasma es una aplicación portable para **Windows 10/11 x64** que coloca personajes sobre el escritorio y los muestra en **OBS Studio** mediante una fuente de navegador transparente. Puedes tener una mascota que habla con tu micrófono y otra que recorre la pantalla al mismo tiempo, con controles independientes y una composición compartida.

**Versión actual: 1.17.0** · Electron 44.5.1 · JavaScript, HTML, CSS y Canvas 2D.

La aplicación procesa el audio localmente y funciona sin servicios en la nube. El portable incluye su runtime; no necesitas instalar Node.js para usarlo.

**[Descargar el portable para Windows](https://github.com/IsaiFR/Aula-Fantasma/releases/tag/v1.17.0)** · Extrae el ZIP completo y abre `INICIAR-APP.cmd`.

## Funciones principales

- **Escritorio transparente:** la mascota permite hacer clic a través de ella y puede mostrarse en el monitor elegido.
- **Salida para OBS:** escritorio, vista previa y fuente de navegador comparten movimiento, poses y eventos de las mascotas compatibles.
- **Mascotas de voz:** apertura de boca según el volumen del micrófono, parpadeo automático, selección de entrada y ajuste de sensibilidad.
- **Mascotas de recorrido:** movimiento libre, por los bordes o en una esquina; saludos, apariciones y ciclos propios de cada personaje.
- **Dos formatos de clase:** lienzos horizontal 16:9 y vertical 9:16, con preferencias visuales independientes.
- **Personajes intercambiables:** paquetes autocontenidos `.pet` y `.aulapet`, importación de PNG/WebP/GIF y exportación para compartir mascotas.
- **Controles de uso diario:** tamaño, velocidad, opacidad, pausa, visibilidad, bandeja del sistema y atajos de teclado.

## Mascotas incluidas

| Tipo | Personajes | Archivos |
| --- | --- | --- |
| Voz y parpadeo | Catrina, EduCatrin, EduKimi, EduWitch, EduDracula, EduGhost y EduMomia | `pets/*-Voz.pet` |
| Recorrido y animación | EduGhost, EduScream, EduFrankenstein, EduZombie, EduPiramyd y EduF1 | `pets/*.aulapet` |

Cada personaje tiene su propio comportamiento. Por ejemplo, EduZombie resucita desde una lápida, EduFrankenstein despierta con un rayo y EduF1 recorre la pantalla con ruedas animadas. La versión 1.17.0 incorpora a **Catrina** como mascota de voz.

## Inicio rápido en OBS

1. Abre `INICIAR-APP.cmd` desde la carpeta del portable.
2. Elige tus mascotas y activa **En mis escenas de OBS**.
3. Copia la dirección local que muestra el panel.
4. En OBS Studio, añade una fuente **Navegador**, pega la dirección y usa **1920 × 1080** para horizontal o **1080 × 1920** para vertical.
5. Coloca la fuente por encima de la cámara, las diapositivas o la captura, y mantén Aula Fantasma abierta durante la sesión.

Para preparar ambos formatos, crea una fuente de navegador independiente por formato y cambia **Lienzo de la clase** en la aplicación al pasar entre ellos. La app no cambia automáticamente las escenas de OBS.

## Guías y referencias del proyecto

- [Configuración y solución de problemas de OBS](GUIA-OBS.html) — abre este archivo localmente en tu navegador para consultar la guía visual.
- [Instrucciones del portable y atajos](LEEME.txt).
- [Formato de mascotas de voz `.pet`](docs/formato-pet.md).
- [Formato de mascotas animadas `.aulapet`](docs/formato-aulapet.md).
- [Creación de Catrina](docs/catrina-generation.md) y [recursos de los demás personajes](docs/).
- [Registro de validación](VALIDACION.md).

Las siguientes secciones detallan la instalación desde el código fuente, los controles, las mascotas y la arquitectura.

## Abrir la app

Ejecuta `INICIAR-APP.cmd` o `Aula Fantasma.exe` desde esta raíz. Antes de recompilar, usa **Salir de la app** en su panel o bandeja. La carpeta completa se puede copiar a otro equipo Windows x64. Consulta `GUIA-OBS.html`.

Si la fuente de OBS ya estaba cargada, actualiza su caché una vez desde sus propiedades para que cargue los perfiles de mascota. Confirma que la URL coincida con la del panel.

Trabaja y ejecuta la app desde la carpeta del proyecto. La versión actual es 1.17.0. `npm.cmd run build` actualiza el ejecutable y sus recursos en esa misma carpeta, sin crear carpetas de versiones ni respaldos automáticos. Las preferencias de uso diario se conservan en AppData. Los ZIP locales de distribución e historial no forman parte del repositorio.

## Desarrollo desde un clon de Git

En Windows x64 con Git, Node.js 22.12 o posterior y npm:

```powershell
git clone https://github.com/IsaiFR/Aula-Fantasma.git
cd Aula-Fantasma
npm.cmd ci
npm.cmd run check
npm.cmd test
npm.cmd start
```

Para generar el portable en esa misma carpeta, cierra la app y ejecuta `npm.cmd run build`. Para comprobarlo con datos aislados, usa `npm.cmd run smoke -- --packaged --dracula`. El repositorio incluye código, recursos, mascotas y pruebas; el ejecutable, el runtime de Electron y `node_modules` se regeneran localmente y se excluyen de Git. Los generadores opcionales de ilustraciones/GIF pueden necesitar herramientas adicionales; no son necesarios para ejecutar la app con las mascotas incluidas.

La app no requiere claves API ni carga archivos `.env`. `.env.example` documenta las variables de entorno opcionales de las herramientas. Las preferencias, mascotas importadas y credenciales de OBS permanecen en AppData. `.smoke-data` y `.gif-build` contienen datos locales de prueba y generación y están ignorados, al igual que temporales, caches y ZIP de distribución o respaldo.

Antes de preparar una publicación, ejecuta `npm.cmd run repo:check` y revisa `git status --short`. La comprobación revisa los archivos candidatos a Git, incluidos los añadidos al índice, sin mostrar posibles secretos. No hace commits, no configura remotos y no publica archivos.

Autor: **Enrique Isaí Figueroa Rodríguez** · **kikefigueroa5a@gmail.com**. El proyecto conserva su configuración `UNLICENSED`.

Desde 1.9.1 se elimina el bloque redundante **Tu mascota**; los selectores permanecen en las dos tarjetas superiores. **Guardar mascota en un archivo** está junto al título de configuración. La mascota de voz se refleja automáticamente en las esquinas derechas y mantiene su orientación original en las izquierdas, mirando hacia el centro en las cuatro poses. Los archivos .pet originales no cambian.

## Lienzos horizontal y vertical (1.10.0)

En **Lienzo de la clase**, cambia con un clic entre **16:9 Horizontal** y **9:16 Vertical**. Cada uno recuerda sus mascotas, visibilidad, tamaños, esquina, recorrido, velocidad, saludo, apariciones y opacidad. El primer uso del otro formato toma los ajustes actuales como punto de partida; después conserva sus propios cambios. El micrófono y su sensibilidad son comunes, por lo que cambiar de lienzo no reinicia la captura. Ambos perfiles y el último formato se guardan al cerrar.

La vista previa cambia de proporción y la referencia pasa de **1920 × 1080** a **1080 × 1920**. La misma URL local entrega la composición del formato activo. En OBS, crea dos fuentes Navegador independientes: una horizontal de **1920 × 1080** y otra vertical de **1080 × 1920**. Usa **Crear nueva**, con la misma URL, al preparar el otro formato. **Añadir existente** solo sirve entre escenas del mismo formato: comparte el ancho y alto de la fuente. Cambia el lienzo de la app al pasar entre tus escenas. La app no modifica automáticamente las escenas ni el tamaño de lienzo de OBS.

Si la mascota queda hacia el centro en vertical, revisa primero **Propiedades → Ancho y Alto** de la fuente Navegador, además de la resolución del lienzo. Después usa **Transformar → Restablecer transformación** y **Ajustar a la pantalla** para quitar encuadres de resoluciones anteriores. La salida se prueba en Electron con un viewport real de 1080 × 1920 y las cuatro esquinas, también a media resolución; esto no sustituye comprobar la escena de OBS.

`node scripts/fix-obs-pet-canvas.cjs` muestra una reparación puntual de la fuente local EduGhost en la colección Sin_Título. Con OBS cerrado, `--apply` establece su fuente horizontal, crea/reutiliza **EduGhost Vertical** y corrige únicamente sus elementos en escenas cuyo nombre termina en Vertical. Conserva las otras fuentes y los ajustes diarios de Aula Fantasma. El script valida la colección antes de escribir y no se ejecuta automáticamente al abrir la app.

Con OBS abierto y su servidor WebSocket local habilitado, `node scripts/fix-obs-pet-live.cjs` prepara el cambio y `--apply` lo aplica mediante la API de OBS. Valida las dimensiones reales de la nueva fuente antes de sustituir el elemento vertical anterior. Las credenciales se leen localmente y no se imprimen. `smoke -- --geometry` comprueba las cuatro esquinas en vertical sin activar el micrófono. Las pruebas usan un puerto aleatorio para que las fuentes reales de OBS no se conecten a la sesión de prueba.

**EduGhost (voz)** incorpora flotación suave, balanceo y ondas en la sábana sobre sus cuatro poses. La cara y las patas quedan protegidas; conserva transparencia, voz, parpadeo y espejo automático. Sus cuatro PNG originales son idénticos al adjunto. Se actualiza automáticamente únicamente la versión incluida conocida, sin sustituir personajes personalizados. El paquete es .pet v8; los otros .pet v6/v7 siguen siendo compatibles. Para regenerarlo después de convertir el adjunto, ejecuta node scripts/animate-edughost-voice.cjs.

## EduGhost de voz: transparencia automática (1.11.0)

Solo **EduGhost .pet** alterna entre 100 % y 75 % de opacidad. En **Transparencia de EduGhost**, dos controles sustituyen a su opacidad manual: **Tiempo al 100 %** y **Tiempo al 75 %**, de 1 a 600 segundos. Por defecto mantiene 20 y 8 segundos, con una transición suave de 0.8 segundos entre estados; las transiciones se suman a los tiempos completos. Los ajustes se guardan por formato y se recuperan al abrir. Cambiar los tiempos o el lienzo reinicia el ciclo al 100 %.

El reloj de voz sincroniza el efecto entre escritorio, panel y OBS. Continúa al pausar el recorrido o minimizar el panel. Conserva hablar, parpadear, espejo, flotación y sábana. Las demás mascotas, incluido EduGhost .aulapet, conservan su opacidad manual. Solo se actualizan los paquetes incluidos conocidos; se respetan personajes personalizados. El efecto se incluye al exportar .pet v8 y los cuatro PNG no cambian. `npm.cmd run smoke -- --packaged --opacity` verifica controles, estados, sincronización, repetición, persistencia y separación por formato con datos aislados.

## Dos mascotas al mismo tiempo

El panel tiene dos tarjetas independientes: **Voz en una esquina (.pet)** y **Recorrido y saludo (.aulapet)**. Cada tarjeta permite mostrar u ocultar esa mascota y abrir su propio selector; sus catálogos no se mezclan. Pulsa el nombre de la opción para configurar sus ajustes. Cambiar de opción en el panel solo cambia qué ajustes editas: ambas mascotas siguen funcionando.

La mascota de voz mantiene una esquina fija (puedes elegir las cuatro) y tiene su propio tamaño, opacidad y micrófono. La de recorrido mantiene sus ajustes de movimiento, apariciones y saludo. Las salidas **En mi escritorio**, **En mis escenas de OBS** y el monitor son comunes. Una sola fuente Navegador de OBS muestra ambas; no hace falta añadir otra dirección. Cada salida comparte una conexión y retransmite el fotograma de voz a su capa transparente interna.

Se recuerdan las dos selecciones y sus ajustes por separado. Las preferencias v3 se migran a v4 al guardar: si la selección anterior era de voz, se conserva en su opción y se añade EduGhost como compañero de recorrido; si era de recorrido, se conserva y se añade EduWitch como opción de voz, con el micrófono inicialmente apagado. Los archivos de las mascotas no cambian de formato.

## Mascotas que hablan y parpadean (.pet)

En **Elegir mascota de voz**, elige **EduWitch (voz)**, **EduDracula (voz)**, **EduGhost (voz)** o **EduMomia (voz)**. Se convirtieron los cuatro personajes de `MascotaHalloween.veado` a `pets/*-Voz.pet`, con sus cuatro imágenes completas de 1254 × 1254 y sus tiempos originales de parpadeo (0.15 s, intervalo 0.75–4 s). El archivo original y la instalación de veadotube no se modifican. Las demostraciones del selector alternan boca y ojos sin acceder al micrófono.

La mascota de voz permanece quieta en la esquina elegida y siempre visible mientras su opción esté activada, sin el saludo del recorrido. En **Voz y parpadeo**, activa **Usar mi micrófono** y selecciona la entrada. El micrófono está apagado inicialmente. Ajusta **Umbral para hablar** (por defecto −38 dB) y **Cerrar la boca tras** (180 ms). La detección mide volumen, con supresión de ruido e histéresis; no reconoce palabras ni distingue automáticamente voz de otros sonidos fuertes. Su parpadeo es independiente del recorrido y de su pausa.

La captura funciona aunque minimices el panel, abras un selector o configures la mascota de recorrido. Se detiene al apagar el micrófono, ocultar la opción de voz o salir de la app. La app recuerda la entrada, sensibilidad y activación para el siguiente inicio. Se analiza audio localmente, sin grabarlo, reproducirlo ni enviarlo al servidor de OBS; solo se comparte el nivel y la pose. Si Windows deniega el acceso, permite el micrófono para aplicaciones de escritorio en sus ajustes de privacidad y pulsa **Reintentar micrófono**.

**Guardar mascota en un archivo** exporta una mascota de voz como `.pet`, con todas sus imágenes. Se conserva la compatibilidad de las mascotas `.aulapet` v1–v5. Es un formato propio de Aula Fantasma; cambiar la extensión de un `.veado` no lo convierte. Contrato y referencias oficiales: `docs/formato-pet.md`.

## EduZombie: lápida y resurrección

En **Recorrido y saludo → Elegir mascota de recorrido**, selecciona **EduZombie**. Usa el gato verde con gafas y costuras y la lápida original con lirio y musgo proporcionados por el usuario. Su lápida dice **RIP** y, debajo, **EduCat**. Espera 3 segundos, aparece una pata y después sale el gato zombi completo. Tras 4 segundos de salida, deambula 24 segundos con pasos arrastrados, se desploma, se hunde y reaparece la lápida. El ciclo dura 33 segundos y se repite.

Al elegir la versión incluida, comienza con tamaño 256, velocidad 22 y movimiento libre; las apariciones se desactivan para que el ciclo pueda verse completo. Conserva los controles de tamaño, velocidad, recorrido y pausa. **Resucitar ahora** adelanta la primera pata. La lápida permanece quieta durante la salida y la caída, reaparece en el lugar donde termina el recorrido y su texto nunca se refleja. La mascota de voz funciona al mismo tiempo.

`pets/EduZombie.aulapet` contiene todas las imágenes, el GIF y la secuencia. `pets/EduZombie.gif` es una versión independiente de 256 × 256, 107 fotogramas y fondo transparente. La hoja original, los prompts y la construcción están documentados en `docs/eduzombie-generation.md`. `npm.cmd run smoke -- --packaged --zombie` comprueba el ciclo sincronizado, el desplazamiento, la pausa, el botón de resurrección y la alternativa PNG en datos aislados. La prueba de navegador de Electron no sustituye una escena real de OBS.

## EduFrankenstein

En **Cargar mascota**, selecciona `pets/EduFrankenstein.aulapet`. Duerme 10 segundos, recibe un rayo con el globo **¡Está vivo!** y despierta durante 5 segundos, camina 30 segundos, se desploma en 0.75 segundos y repite el ciclo. El globo tiene el borde inferior limpio. El GIF transparente independiente está en `pets/EduFrankenstein.gif`: 256 × 256 px, 111 fotogramas y 45.75 segundos por ciclo.

La app pausa tanto los fotogramas como el desplazamiento; solo se desplaza durante la caminata. Mira hacia el sentido del recorrido y gira al cambiar de dirección; los fotogramas con «¡Está vivo!» conservan el texto legible. **Por toda la pantalla** avanza en ambos ejes con pequeñas variaciones de rumbo y rebotes; **Por los bordes** sigue el perímetro; **Quieto en una esquina** conserva la posición. Al cargar el personaje incluido aplica tamaño 256 px, velocidad 55 px/s y modo libre; desactiva inicialmente las apariciones para completar el ciclo. El botón **Resucitar ahora** adelanta el rayo. La frecuencia del saludo independiente se oculta porque la resurrección pertenece al ciclo.

El paquete v5 contiene el GIF, su hoja PNG de compatibilidad y el perfil temporal. Necesita Aula Fantasma 1.7.1 para reproducir los 30 segundos de pasos; se conservan los formatos v1–v4. La selección anterior del personaje incluido se actualiza al reiniciar, conservando tamaño, velocidad, recorrido, pausa y salidas. Los perfiles personalizados se conservan. Referencia, prompts y construcción: `docs/edufrankenstein-generation.md`.

## Mascotas con animación guardada

`pets/EduGhost.aulapet` guarda ambos PNG y las animaciones de flotación suave, sábana ondeando y parpadeo. Las mascotas disponibles están en `pets`. Se pueden mover y compartir sin imágenes externas. **Cargar mascota** abre un `.aulapet`; **Guardar mascota** exporta el personaje seleccionado. La app recuerda cuál cargaste aunque después muevas el archivo original.

Cada personaje aporta su perfil; la app aplica las animaciones automáticamente. Los tres antiguos interruptores de flotación, sábana y parpadeo se han retirado. **Detenerse y decir BOO!!** y **BOO!! ahora** siguen en el panel; el intervalo está dentro de **Frecuencia del saludo**. Recorrido, salidas y apariciones conservan sus controles y no forman parte del archivo de mascota.

También se pueden cargar PNG, WebP o GIF. Una imagen sola se convierte en una mascota con flotación; el parpadeo personalizado necesita su imagen de ojos cerrados y la ondulación necesita su perfil de regiones. No aplica las zonas de EduGhost a otro personaje. Consulta `docs/formato-aulapet.md` para preparar nuevos perfiles; la app no incluye un editor visual de articulaciones.

## EduScream: GIF y saludo

Carga EduScream.aulapet. El perfil contiene GIF transparentes de caminata y saludo, de 180 × 180 px. Al cargar la versión incluida se aplican tamaño 180 px, velocidad 30 px/s e intervalo fijo 30 s. El saludo se activa y las apariciones quedan inicialmente desactivadas para completar cada intervalo; se pueden volver a activar desde su control habitual. Los perfiles personalizados conservan sus ajustes.

Camina con cuatro patas completas: tres inferiores y la que sostiene el cuchillo. Los fotogramas conservan las sombras, las conexiones de las extremidades y la orientación. Cada 30 segundos de actividad se detiene, sube el cuchillo durante 0.7 s, muestra **Detrás de ti** durante 2 s, lo baja en 0.7 s y continúa. El intervalo se mide entre inicios de los saludos. Pausa congela también el fotograma del GIF. El globo se dibuja desde la app para que el texto siempre se lea correctamente al cambiar de dirección.

El renderer decodifica ambos GIF una sola vez y comparte el reloj del gesto. Para navegadores sin ImageDecoder usa los mismos fotogramas en una hoja PNG. Tamaño y velocidad son píxeles del lienzo de cada salida; la vista previa los reduce para caber en el panel. Las salidas de resoluciones distintas recorren sus propios bordes a la misma velocidad y comparten la animación y el saludo. Los dos GIF independientes están en `web/eduscream`. Para conservar recorrido y saludo, carga el archivo .aulapet v4; un GIF aislado no incluye el temporizador ni el globo.

La versión incluida de EduScream v2/v3 se actualiza al abrir la app; se mantiene compatibilidad con mascotas v1/v2/v3. Los controles de saludo existentes adaptan su texto. Consulta docs/eduscream-gif-generation.md para archivos, prompts y proceso.

## Apariciones por intervalos

En **Apariciones**, el control **Salir y regresar** activa el ciclo para escritorio, vista previa y OBS. Por defecto permanece visible 35 segundos, sale suavemente por el lateral más cercano en 2 segundos, permanece fuera 60 segundos y vuelve en 2 segundos. El tiempo visible se ajusta entre 5 y 300 segundos; la ausencia entre 5 y 600 segundos. El panel muestra el tiempo restante.

Al terminar la espera continúa su recorrido desde donde salió. Si estaba diciendo BOO, termina el saludo antes de salir. Mientras está fuera no inicia saludos; tampoco aparece su globo. **Pausar recorrido** congela la salida, ausencia o regreso donde esté. Desactivar **Salir y regresar** permite mantenerlo siempre visible; **Volver al inicio** reinicia el recorrido y el ciclo. Funciona también en una esquina y con imágenes importadas.

## Desarrollo

```powershell
npm.cmd ci
npm.cmd start
npm.cmd run check
npm.cmd test
npm.cmd run smoke
npm.cmd run build
npm.cmd run smoke -- --packaged
npm.cmd run smoke -- --packaged --voice
```

`smoke` usa preferencias aisladas en `.smoke-data`. Comprueba el arranque, IPC, SSE, las dos salidas, pausa, parpadeo, saludo y globo en las esquinas. El panel y el consumidor de prueba se renderizan fuera de pantalla para capturar los fotogramas actuales. No verifica una escena real de OBS ni el comportamiento del escritorio sobre otras aplicaciones.

`smoke -- --voice` prueba captura con un dispositivo sintético, nivel RMS, importación/exportación `.pet`, persistencia y coincidencia de las cuatro poses en las tres salidas. `--real-microphone` usa brevemente la entrada física en lugar del dispositivo sintético. Todos esos datos y capturas se guardan solo en `.smoke-data`.

## Arquitectura

- `src/main.cjs`: ciclo de vida de Electron, ventana transparente, bandeja, atajos, monitores, importación y preferencias.
- `src/settings.cjs`: contrato y validación de preferencias.
- `src/pet-package.cjs`: formato .aulapet, validación, imágenes incluidas, perfiles y exportación.
- `src/motion.cjs`: simulación compartida a 30 Hz. Coordenadas normalizadas para adaptar escritorio y OBS a tamaños distintos.
- `src/presence.cjs`: ciclo compartido de aparición, salida, ausencia y regreso; no altera los interruptores de las salidas.
- `src/server.cjs`: HTTP solo en `127.0.0.1`, lista cerrada de recursos y eventos SSE. No ofrece endpoints de escritura.
- `src/preload.cjs`: puente IPC limitado al panel, con aislamiento y sandbox.
- `web/panel.*`: controles y vista previa sobre una escena de ejemplo.
- `web/overlay.*`: renderer transparente compartido entre escritorio, vista previa y OBS.
- `web/pet.css`: cuerpo flotante, superposición del parpadeo y globo de BOO.
- `web/layout.js`: posición de la mascota y colocación del globo dentro del lienzo.
- `web/cloth.js`: deformación de la textura de la sábana en Canvas 2D, con transparencia y protección de cara, cola y patas.
- `web/edughost/open.png`: copia intacta del PNG proporcionado.
- `web/edughost/closed.png`: fotograma de ojos cerrados preparado con imagegen; solo se superponen las regiones de los ojos para conservar el resto del original.

El servidor intenta usar el puerto 18747; si está ocupado, busca hasta 18757. La dirección real aparece en el panel. OBS debe apuntar a esa dirección. No se expone al resto de la red y funciona sin internet tras instalar/empaquetar.

Preferencias y mascotas importadas se guardan en `%APPDATA%/Aula Fantasma`. No se modifica el archivo original importado. Los paquetes .aulapet admiten hasta 32 MB; las imágenes PNG/WebP/GIF, hasta 20 MB y 8192 píxeles por lado. La selección y las preferencias de uso anteriores se migran. No se ejecutan scripts de imágenes ni contenido remoto.

La ventana de escritorio usa `setContentProtection(true)` para reducir duplicados al capturar el monitor. La compatibilidad depende de Windows y del método de captura; ante un duplicado, desactiva escritorio y conserva la fuente OBS. La ventana cubre un monitor seleccionado; no cruza automáticamente entre monitores. El motor sigue activo al cerrar el panel. No se inicia con Windows por defecto.

La pausa congela recorrido, flotación, ondulación, parpadeo y tiempo del globo de EduGhost. Las animaciones internas de GIF/WebP importados siguen reproduciéndose; sus fotogramas internos no se sincronizan. EduGhost sí comparte su fase de parpadeo y saludo entre escritorio, OBS y vista previa.

## EduGhost animado

- Flotación: oscilación vertical, inclinación y estiramiento sutil, también cuando se queda en una esquina.
- Sábana: ondas horizontales en los pliegues y verticales en el dobladillo, más marcadas al recorrer y suaves al detenerse. Cara y gafas mantienen su textura; cola y patas atenúan la deformación. Las zonas y ondas se conservan dentro de `EduGhost.aulapet`.
- Parpadeo: cada 3–6 segundos; cierre de aproximadamente 200 ms. Las imágenes se precargan y no se descargan en cada parpadeo.
- BOO: cada 25 segundos de actividad, con variación de ±15 % para que resulte natural. El personaje detiene el recorrido 3.2 segundos, muestra `BOO!!`, mantiene la flotación y continúa después.
- El intervalo se ajusta de 10 a 120 segundos. Puede desactivarse el saludo o probarlo con **BOO!! ahora**. El globo cambia de lado para quedar dentro del lienzo.
- Flotación, ondulación y parpadeo pertenecen al personaje; los antiguos valores de esos tres interruptores dejan de controlar la animación. Se conservan monitor, tamaño, velocidad, apariciones, BOO y salidas.
- Para volver al personaje animado después de cargar otra imagen, pulsa **Volver a EduGhost**. Importar el mismo PNG original también selecciona el personaje animado.

El diseño original no se sobrescribe. El prompt y los archivos utilizados están registrados en `docs/edughost-generation.md`.

## Documentación consultada

- [Electron: ventanas que permiten hacer clic a través](https://www.electronjs.org/docs/latest/tutorial/custom-window-interactions)
- [Electron: aislamiento y seguridad](https://www.electronjs.org/docs/latest/tutorial/security)
- [OBS: fuente de navegador](https://obsproject.com/kb/browser-source)
- [OBS: cámara virtual](https://obsproject.com/kb/virtual-camera-guide)

## EduF1

Mascota de recorrido basada en el gatito al volante del Mercedes F1. Incluye dos vistas con letras legibles, tres ruedas animadas por vista y curvas suaves al cambiar de dirección. Se elige en el catálogo de movimiento; comienza en movimiento libre, tamaño 300 y velocidad 130. Los controles de recorrido, velocidad, tamaño, pausa y visibilidad siguen disponibles. En modo esquina las ruedas se detienen. Pausa congela también el giro del auto.

`pets/EduF1.aulapet` es autocontenido (v11); se puede importar y exportar. Recursos, método y prompts: `docs/eduf1-generation.md`. Regeneración opcional: `node scripts/create-eduf1.cjs`. Prueba aislada del portable: `npm.cmd run smoke -- --packaged --vehicle`.

## EduKimi

Mascota de voz basada en el gato piloto Mercedes con casco y rizos. Disponible como **EduKimi** en **Elegir mascota de voz**. Abre la boca al detectar el micrófono y parpadea tanto en silencio como hablando, con los controles actuales de entrada, sensibilidad y espera de cierre. Archivo autocontenido: `pets/EduKimi-Voz.pet`. La pose en reposo conserva el PNG original.

Recursos y prompts de imagegen: `docs/edukimi-generation.md`. Prueba del portable con datos aislados: `npm.cmd run smoke -- --packaged --kimi`.

## EduCatrin

Mascota de voz basada en el gato mariachi de Día de Muertos. Disponible como **EduCatrin** en **Elegir mascota de voz**. Abre la boca con el micrófono y parpadea en silencio y al hablar. Conserva sombrero, flores, traje, maquillaje y transparencia, con los controles actuales de audio. Archivo autocontenido: `pets/EduCatrin-Voz.pet`. La pose en reposo conserva el PNG original.

Recursos y prompts de imagegen: `docs/educatrin-generation.md`. Prueba del portable con datos aislados: `npm.cmd run smoke -- --packaged --catrin`.

## Catrina

Mascota de voz basada en la gatita Catrina de magenta. Disponible como **Catrina** en **Elegir mascota de voz**. Abre la boca con el micrófono y parpadea en silencio y hablando. Conserva sombrero, flores, velo, vestido, joyas, maquillaje y transparencia, con los controles de audio actuales. Archivo autocontenido: `pets/Catrina-Voz.pet`. La pose de reposo conserva el PNG original.

Recursos y prompts de imagegen: `docs/catrina-generation.md`. Prueba aislada del portable: `npm.cmd run smoke -- --packaged --catrina`.
