# EduElegante

`pets/EduElegante-Voz.pet` contiene cuatro poses PNG de 1254 × 1254 píxeles. Parpadea detrás del antifaz y abre la boca al detectar audio del micrófono.

`node scripts/create-eduelegante.cjs` usa la ilustración original en reposo y aplica las variantes en las aberturas del antifaz y en el hocico. Las cuatro poses conservan el canal alfa de `web/eduelegante/reference.png`.

`npm.cmd run smoke -- --eduelegante` verifica el catálogo y las cuatro expresiones en Electron con audio simulado.

## Prompts de ImageGen

Parpadeo

```text
Precisely edit the supplied EduElegante cartoon cat PNG on its exact original 1254 × 1254 canvas with true transparency. Keep the reference alignment, original silhouette, metallic gold masquerade mask, navy and white fur, white suit, gold tie, pose, whiskers and linework. Edit only the indicated facial feature. Make both eyes blink within their original mask openings. Replace both pupils and catchlights with one gently curved dark closed eyelid per eye. Preserve the golden inner lip and all metallic shading as well as the dark lavender fur under the left aperture and the cream-white fur in the right aperture. Keep the small closed mouth unchanged.
```

Habla

```text
Precisely edit the supplied EduElegante cartoon cat PNG on its exact original 1254 × 1254 canvas with true transparency. Keep the reference alignment, original silhouette, metallic gold masquerade mask, navy and white fur, white suit, gold tie, pose, whiskers and linework. Edit only the indicated facial feature. Open the original little mouth under the nose around x730–838 y439–500. Show a small dark rounded opening with muted rose tongue. Align it to the existing nose stem, with similar smile corners. Keep both eyes open and the full golden mask untouched.
```
