# Lienzos 16:9 y 9:16 — Aula Fantasma 1.10.0

El selector superior cambia la composición activa sin recargar la ventana ni reiniciar el micrófono. Las referencias son 1920 × 1080 y 1080 × 1920. La vista previa conserva la proporción real; los tamaños, márgenes y posiciones se adaptan a la referencia seleccionada. La ventana de escritorio sigue usando el monitor elegido.

Preferencias v5: `canvasFormat` conserva el último formato, y `canvasProfiles` contiene las entradas `16:9` y `9:16`. Cada perfil guarda `settings`, `petFile`, `petKey`, `voice.settings`, `voice.petFile`, `voice.petKey` y `activeType`. Las selecciones se conservan en la biblioteca habitual, sin copiar los PNG al archivo de preferencias. Los campos activos se mantienen también en el nivel superior para migración y diagnóstico.

La primera apertura del otro formato copia la composición actual; después se guardan por separado las mascotas, tamaños, esquina, opacidad, velocidad, recorrido, saludo, apariciones, visibilidad y monitor/salidas. El dispositivo de micrófono, su activación, umbral y espera se comparten. Cambiar de formato mantiene la captura si la opción de voz sigue activada en ambos; ocultar esa opción la libera conforme al comportamiento habitual.

Antes de cambiar se validan ambos personajes. El cambio es síncrono: se captura el perfil anterior, se aplica el siguiente y se publica una revisión de lienzo nueva. Los renderers descartan la interpolación de posición anterior. Si se conserva la misma mascota, se mantienen las imágenes precargadas; si cambia, el control de revisiones evita mostrar una carga antigua. El recorrido empieza en una posición válida del nuevo formato, sin trasladar un saludo a medias.

Las preferencias v2–v4 se conservan como perfil horizontal. El guardado sigue siendo atómico, mediante archivo temporal y renombrado. Las pruebas usan exclusivamente `.smoke-data`.

## OBS

La URL local conserva la composición activa. Prepara en OBS una fuente de navegador horizontal de 1920 × 1080 y otra vertical de 1080 × 1920, con esa misma URL. Al pasar entre clases selecciona el formato correspondiente en la app. La app no cambia la resolución ni las escenas del programa OBS. La prueba automatizada usa consumidores de navegador en Electron y no equivale a una escena real de OBS.
