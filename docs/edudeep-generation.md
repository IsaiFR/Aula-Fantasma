# EduDeep

`pets/EduDeep-Voz.pet` contiene cuatro poses PNG de 1254 × 1254 píxeles. EduDeep parpadea detrás de los lentes y abre la boca al detectar audio del micrófono.

`node scripts/create-edudeep.cjs` usa la ilustración original en reposo y aplica las expresiones dentro de los lentes y en el hocico. Las cuatro poses conservan el canal alfa de `web/edudeep/reference.png`.

`npm.cmd run smoke -- --edudeep` verifica el catálogo y las cuatro poses en Electron con audio simulado.

## Prompts de ImageGen

Parpadeo

```text
Make a precise localized edit to this user-provided EduDeep cartoon cat PNG. Preserve exact alignment on the original 1254 × 1254 canvas, true transparency, dark glasses frame, markings, dark hair, mouth-to-chin stubble, whiskers, gold trim and teal armor. Keep all details outside the requested facial feature. Replace both dark pupils and bright white catchlights with one gently curved dark closed eyelid in each lens, around x667 y337 and x861 y326. Keep the viewer-left lens violet with its white fur patch and the viewer-right lens cream-white with its dark diagonal bar near the right edge. Keep the original mouth closed.
```

Habla

```text
Make a precise localized edit to this user-provided EduDeep cartoon cat PNG. Preserve exact alignment on the original 1254 × 1254 canvas, true transparency, dark glasses frame, markings, dark hair, mouth-to-chin stubble, whiskers, gold trim and teal armor. Keep all details outside the requested facial feature. Open the small cat smile under the nose (x734–838, y414–475) with a rounded deep navy opening and a small muted rose tongue. Use the original mouth corners and attach to the existing nose stem. Keep the beard as stubble, including the small central tuft below the mouth, gently below the new opening. The eyebrows, eyes, lenses and whiskers remain unchanged.
```
