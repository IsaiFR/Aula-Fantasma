# EduSimi

`pets/EduSimi-Voz.pet` contiene cuatro poses PNG de 1254 × 1254 píxeles. Parpadea detrás de los lentes y abre la boca debajo del bigote al detectar audio del micrófono.

`node scripts/create-edusimi.cjs` usa la ilustración original en reposo y aplica las expresiones dentro de los lentes y en el hocico. Las cuatro poses conservan el canal alfa de `web/edusimi/reference.png`.

`npm.cmd run smoke -- --edusimi` verifica el catálogo y las cuatro expresiones en Electron con audio simulado.

## Prompts de ImageGen

Parpadeo

```text
Make a precise localized edit to this user-provided EduSimi cartoon cat PNG, preserving exact alignment on its native 1254 × 1254 canvas, true transparency, existing linework, dark glasses frame, white bushy mustache, whiskers, white coat and pocket lettering, blue tie, markings and pose. Change only the open eyes inside the glasses. Replace both pupils and small white highlights with a pair of softly curved dark closed eyelid lines. Preserve the existing violet left lens and its white fur patch, the clear cream-white right lens, and the dark line crossing its right edge. Keep the entire mustache and face below the glasses as in the original.
```

Habla

```text
Make a precise localized edit to this user-provided EduSimi cartoon cat PNG, preserving exact alignment on its native 1254 × 1254 canvas, true transparency, existing linework, dark glasses frame, white bushy mustache, whiskers, white coat and pocket lettering, blue tie, markings and pose. Create a small rounded open speaking mouth directly below the central parting of the white mustache, centered at about x772 y477. It should look tucked partly behind the existing mustache, with a dark navy interior and a small pink tongue. Keep the white mustache as two full curved halves, with the original outline and texture intact. Keep the same nose, whiskers, open eyes and white fur. Only the small area just below the parting of the mustache should change.
```
