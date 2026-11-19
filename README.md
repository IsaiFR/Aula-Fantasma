# Aula Fantasma

Aula Fantasma es una aplicación portable para **Windows 10 y 11 de 64 bits**. Reúne tus escenas de clase, los apuntes de una tablet Android, mascotas animadas y un cronómetro. Puedes compartir una sola ventana en tu videollamada o añadir las mascotas y el cronómetro como capas transparentes en OBS Studio.

## Qué incluye

- **Escenas de clase.** Cambia entre Inicio, Apuntes, Receso y Despedida desde el panel o con atajos configurables. La ventana compartida se ajusta a cada escena y reproduce una transición animada.
- **Tablet por USB.** Comparte los apuntes de tu tablet Android desde una ventana sin barra de título. La imagen conserva la proporción de la tablet y admite hasta 2800 píxeles en el lado largo y 30 fps.
- **Mascotas animadas.** Usa una mascota que reacciona al micrófono y otra que recorre la pantalla. Puedes elegirlas desde la biblioteca y ajustar cada capa.
- **Cronómetro de actividades.** Configura una cuenta regresiva con avisos breves y una campana. Puedes mostrarla durante una videollamada, en OBS o sobre el escritorio.
- **Salidas para escritorio y OBS.** Controla la visibilidad de las mascotas desde el panel y elige un lienzo horizontal o vertical para OBS.

## Primeros pasos

Si recibiste el **portable**, conserva la carpeta completa y ejecuta `INICIAR-APP.cmd`. El ejecutable `Aula Fantasma.exe` también abre la aplicación. El portable ya incluye el entorno que necesita para ejecutarse.

Si descargaste el **código fuente** desde GitHub, sigue los pasos para [compilar el portable](#compilar-el-portable).

## Compartir una clase en Zoho u otra videollamada

1. En **Escenas de la ventana compartida**, pulsa **Inicio** para abrir la ventana de presentación. Puedes hacerlo antes de conectar la tablet.
2. En la videollamada, elige compartir una ventana y selecciona **Aula Fantasma · Tablet**.
3. Cambia de escena desde el panel de Aula Fantasma. Puedes mantener seleccionada la misma ventana durante toda la clase.

| Escena | Qué muestra |
| --- | --- |
| **Inicio** | La imagen de bienvenida en 16:9. |
| **Apuntes** | Tu tablet en su proporción original, con las mascotas activas y el cronómetro si habilitaste esas capas. |
| **Receso** | La cuenta regresiva de EduNet en 16:9. Requiere conexión a internet. [Escena de Receso](https://edunetmx.online/obs/receso) |
| **Despedida** | La imagen de cierre en 16:9. |

Para usar **Apuntes**, activa **Depuración USB** en las opciones de desarrollador de Android. Conecta la tablet con un cable USB de datos, desbloquéala y acepta la autorización si aparece. Pulsa **Apuntes** o **Tablet por USB → Conectar tablet**. Al terminar, usa **Tablet por USB → Cerrar ventana**.

En **Atajos de escenas**, selecciona un campo, pulsa la combinación y elige **Guardar**. Los atajos funcionan desde otras ventanas mientras Aula Fantasma está abierta. Para usar números del teclado numérico, activa **Bloq Num**.

## Usar Aula Fantasma en OBS

1. Abre **Salidas**, activa **En mis escenas de OBS** y pulsa **Copiar URL**.
2. En OBS Studio, añade una fuente **Navegador** y pega la URL. Usa **1920 × 1080** para un lienzo horizontal o **1080 × 1920** para uno vertical. Selecciona el formato correspondiente en el panel de Aula Fantasma.
3. Coloca la fuente encima de la cámara, las diapositivas o la captura. Mantén Aula Fantasma abierta durante la transmisión.

Para usar ambas orientaciones, crea una fuente Navegador por tamaño. Si ya colocaste esa fuente encima de la captura de la tablet, desactiva **Incluir mascotas y cronómetro** en **Tablet por USB** para mostrar las capas una sola vez. [Guía de configuración de OBS](GUIA-OBS.html)

## Configurar las mascotas y el cronómetro

### Mascotas

Selecciona **Mascota de voz** o **Mascota de recorrido** y pulsa **Cambiar mascota** para abrir la biblioteca. Cada capa tiene su propio interruptor. Usa **Salidas → En mi escritorio** para mostrar las mascotas sobre tus aplicaciones y **Monitor del escritorio** para elegir la pantalla.

- En **Mascota de voz**, activa **Usar mi micrófono**, selecciona tu entrada y ajusta la sensibilidad. El audio se analiza en tu equipo para animar a la mascota.
- En **Mascota de recorrido**, ajusta el tamaño, la velocidad y el modo de movimiento. Desde la biblioteca puedes importar una mascota compatible o crear una de recorrido con una imagen PNG, WebP o GIF.

### Cronómetro

En **Cronómetro**, elige una duración de 10 segundos a 99 minutos y 59 segundos. Pulsa **Iniciar cronómetro** o usa `Ctrl+Shift+C`. La cuenta muestra una preparación de tres segundos, se ve al inicio y al final de la actividad, y suena cuando quedan diez segundos.

Usa **Posición del cronómetro** para ubicarlo en el lienzo y **También en mi escritorio** para verlo en tu monitor. Para que tus alumnos oigan la campana, comparte el audio de la ventana si tu plataforma lo permite. En OBS, activa **Controlar audio vía OBS** en la fuente Navegador.

## Compilar el portable

Desde la carpeta del código fuente, en **Windows x64** con **Node.js 22.12 o posterior**, ejecuta:

```powershell
npm.cmd ci
npm.cmd run build
```

La compilación deja `Aula Fantasma.exe`, `resources` y los archivos necesarios en la misma carpeta. Cierra Aula Fantasma desde la bandeja antes de recompilar. El primer empaquetado puede descargar Electron y el motor USB de [scrcpy 4.1](https://github.com/Genymobile/scrcpy/releases/tag/v4.1).

Para desarrollar y verificar el proyecto, usa `npm.cmd start`, `npm.cmd run check` y `npm.cmd test`. La prueba del portable con tablet conectada es `npm.cmd run smoke -- --packaged --tablet`.

## Ayuda y documentación

- [Guía de OBS y solución de problemas](GUIA-OBS.html).
- [Instrucciones del portable y atajos](LEEME.txt).
- [Formatos `.pet`](docs/formato-pet.md) y [`.aulapet`](docs/formato-aulapet.md) para crear o compartir mascotas.
- [Registro de validación](VALIDACION.md).

**Autor** · Enrique Isaí Figueroa Rodríguez.
