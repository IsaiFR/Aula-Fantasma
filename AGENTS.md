# Aula Fantasma: una sola raíz

- Trabajar directamente en esta carpeta; conservar aquí el código y el ejecutable actual.
- No crear carpetas `release-v*`, nuevas copias del proyecto, worktrees ni respaldos por modificación, salvo petición explícita del usuario.
- Mantener la versión funcional actual y modificarla en su sitio. Las subcarpetas de código, recursos y pruebas forman parte de esta misma raíz.
- `npm.cmd run build` actualiza `Aula Fantasma.exe`, `resources` y el runtime en la raíz. Su preparación temporal se elimina al terminar.
- El acceso habitual es `INICIAR-APP.cmd`. Las mascotas están en `pets`; los GIF independientes están en `web/eduscream`.
- No modificar las preferencias diarias de AppData durante las pruebas. `npm.cmd run smoke -- --packaged` usa `.smoke-data`.
- Comprobar sintaxis, pruebas e integridad del portable según el cambio. Distinguir las pruebas de Electron de la validación de una escena real de OBS.
