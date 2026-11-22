'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { animationProfile, parsePet, serializePet } = require('../src/pet-package.cjs');

// Contornos trazados sobre las poses completas a 450 × 450. La atenuación fija las uniones al cuerpo.
const capes = {
  EduBot: { amplitudeY: .020, panels: [
    [[22,345],[39,326],[67,315],[106,303],[134,289],[162,265],[186,248],[197,250],[178,275],[151,307],[131,337],[119,362],[117,391],[87,409],[50,391],[20,379]]
  ] },
  EduDracula: { amplitudeY: .020, panels: [
    [[148,249],[174,230],[211,229],[207,260],[195,294],[179,325],[167,357],[161,380],[161,405],[145,426],[75,430],[47,415],[47,389],[75,382],[101,367],[115,339],[128,305]],
    [[323,252],[352,274],[369,319],[379,355],[408,372],[420,396],[390,413],[323,409],[323,386],[326,365],[326,343],[323,318]]
  ] },
  EduLuchador: { amplitudeY: .019, panels: [
    [[135,232],[163,224],[162,252],[155,283],[142,306],[124,329],[111,355],[107,387],[93,404],[57,390],[39,372],[47,354],[77,327],[100,302],[112,270]],
    [[318,241],[341,251],[363,278],[380,313],[398,347],[422,378],[421,418],[322,430],[300,417],[310,391],[319,359],[323,325],[318,297]]
  ] },
  EduMoon: { amplitudeY: .017, panels: [
    [[166,242],[193,234],[187,267],[176,301],[163,332],[153,363],[155,384],[168,411],[122,433],[74,430],[26,414],[23,387],[55,372],[83,368],[107,354],[122,328],[139,290]],
    [[334,240],[350,250],[356,290],[362,320],[376,352],[394,373],[417,383],[434,406],[408,420],[350,417],[324,401],[330,375],[333,349],[333,319]]
  ] },
  EduStarlight: { amplitudeY: .018, panels: [
    [[151,251],[172,252],[166,277],[152,310],[140,342],[131,366],[127,393],[116,426],[85,446],[22,438],[24,406],[49,375],[79,342],[104,309],[126,279]],
    [[310,266],[330,267],[347,299],[361,338],[373,377],[396,421],[381,447],[315,446],[319,421],[312,397],[309,367],[304,336]]
  ] },
  EduStrange: { amplitudeY: .019, panels: [
    [[146,231],[184,211],[203,223],[180,240],[162,264],[142,284],[137,305],[122,329],[117,353],[129,388],[140,404],[102,415],[56,403],[37,386],[22,333],[27,315],[72,317],[95,304],[101,278],[111,260]],
    [[346,339],[369,339],[399,342],[424,348],[433,381],[428,411],[385,420],[339,405],[331,387],[320,368]]
  ] },
  EduWitch: { amplitudeY: .021, panels: [
    [[169,245],[197,235],[226,246],[191,268],[176,294],[157,315],[139,341],[130,372],[143,399],[126,426],[76,425],[39,410],[40,376],[69,357],[95,338],[115,310],[137,276]]
  ] }
};

function capeAnimation(name, base) {
  const { amplitudeY, panels } = capes[name];
  const motionRegions = panels.map(panel => ({ feather: .05, strength: 1, points: panel.map(([x, y]) => [x / 450, y / 450]) }));
  return animationProfile({ ...base, cloth: {
    enabled: true, motionRegions, amplitudeX: .016, amplitudeX2: .006, amplitudeY,
    frequencyY: 15, speedX: 2, frequencyX2: 12, frequencyY2: 8, speedX2: 2.5,
    frequencyX: 11, frequencyY3: 8, speedY: 2.2
  } });
}

if (require.main === module) {
  for (const name of Object.keys(capes)) {
    const filename = path.join(__dirname, '..', 'pets', `${name}-Voz.pet`);
    const original = parsePet(fs.readFileSync(filename));
    const updated = serializePet({ ...original, animation: capeAnimation(name, original.animation) });
    fs.writeFileSync(filename, updated);
    console.log(`${name} · capa animada`);
  }
}

module.exports = { capeAnimation };
