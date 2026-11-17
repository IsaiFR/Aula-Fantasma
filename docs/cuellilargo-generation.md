# Cuellilargo

Mascota de fondo con caminata continua. El archivo `pets/Cuellilargo.aulapet`
es autocontenido y aparece en **Recorrido y saludo** en el selector.

La referencia original de 941 × 1672 está en `web/cuellilargo/reference.png`.
El generador conserva sus texturas, colores, disco, cuello, placas y transparencia.
Separa las cuatro patas bajo el torso y anima apoyos desfasados, con uniones
continuas en cadera, rodilla y tobillo. Un balanceo pequeño acompaña los pasos.

El ciclo v5 contiene 24 imágenes de 512 × 512 a 12.5 fps (1.92 segundos),
una hoja PNG de 6 × 4 y un GIF transparente. El motor compartido reproduce
los pasos, refleja el personaje al cambiar de dirección y congela la pose
al pausar. Solo contiene etapas `walk`: no incluye voz, saludos ni resurrección.

Reconstrucción: `node scripts/create-cuellilargo.cjs`.
Para importar otra vez el adjunto original se puede pasar su ruta como argumento.
Requiere el mismo Canvas local y FFmpeg que los generadores de recorrido existentes.
Los temporales de este generador se eliminan al terminar.

Validación específica: `npm.cmd run smoke -- --packaged --cuellilargo`.
Usa `.smoke-data`, sin cambiar las preferencias diarias de AppData. Comprueba
selección, GIF, reloj compartido, bucle, espejo, bordes transparentes, recorrido,
pausa, etiquetas, alternativa PNG y formato vertical. Esta prueba de Electron
no representa una validación en una escena real de OBS.
