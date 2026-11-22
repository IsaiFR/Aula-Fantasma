'use strict';
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createCanvas, loadImage, Path2D } = require(process.env.AULA_CANVAS_MODULE || path.join(os.homedir(), '.cache', 'codex-runtimes', 'codex-primary-runtime', 'dependencies', 'node', 'node_modules', '@napi-rs', 'canvas'));
const { serializePet, animationProfile } = require('../src/pet-package.cjs');
const { behaviorProfile } = require('../src/behavior.cjs');

const root = path.join(__dirname, '..');
const assets = path.join(root, 'web', 'eduhelldiver');
const size = 1254;
const mime = 'image/png';
// Las expresiones quedan dentro de los lentes oscuros y la rejilla del respirador.
// La curva exterior del lente derecho conserva el reflejo del borde.
const lenses = new Path2D('M589 350 C594 327 620 318 663 317 C708 315 747 319 760 341 C777 364 761 399 747 417 C730 439 699 446 669 445 C635 446 606 438 595 411 C586 392 582 368 589 350 Z M853 346 C865 323 889 316 923 314 L937 314 C951 331 962 352 966 377 C972 400 971 424 956 441 C920 448 883 436 865 409 C854 392 846 365 853 346 Z');
const grille = new Path2D('M785 621 L794 514 Q804 505 830 506 Q855 507 869 517 L860 619 Q827 626 785 621 Z');
// Deja fijos el anclaje bajo la hombrera y el borde que pasa detrás del equipo.
const cape = [[360, 704], [416, 666], [469, 655], [452, 675], [432, 697], [412, 730], [402, 769], [402, 847], [380, 889], [345, 907], [313, 948], [292, 1010], [292, 1080], [294, 1135], [324, 1199], [288, 1224], [102, 1217], [16, 1131], [0, 1088], [0, 920], [64, 852], [136, 801], [239, 758], [310, 724]];

function paintExpression(context, image, clip) {
  context.save();
  context.clip(clip);
  context.drawImage(image, 0, 0);
  context.restore();
}

async function createPet() {
  const [reference, blink, talking] = await Promise.all(['reference', 'blink-source', 'talking-source'].map(async name => {
    const image = await loadImage(path.join(assets, name + '.png'));
    if (image.width !== size || image.height !== size) throw new Error(`El lienzo de ${name} debe medir ${size} × ${size}.`);
    return image;
  }));
  const images = { open: { mime, bytes: fs.readFileSync(path.join(assets, 'reference.png')) } };
  const originalContext = createCanvas(size, size).getContext('2d');
  originalContext.drawImage(reference, 0, 0);
  const original = originalContext.getImageData(0, 0, size, size);
  for (const [name, eyesClosed, speaking] of [['closed', true, false], ['talking', false, true], ['talkingClosed', true, true]]) {
    const canvas = createCanvas(size, size);
    const context = canvas.getContext('2d');
    context.drawImage(reference, 0, 0);
    if (eyesClosed) paintExpression(context, blink, lenses);
    if (speaking) paintExpression(context, talking, grille);
    const expression = context.getImageData(0, 0, size, size);
    for (let index = 3; index < expression.data.length; index += 4) expression.data[index] = original.data[index];
    context.putImageData(expression, 0, 0);
    images[name] = { mime, bytes: canvas.toBuffer(mime) };
  }
  for (const [name, resource] of Object.entries(images)) fs.writeFileSync(path.join(assets, name + '.png'), resource.bytes);
  const animation = animationProfile({
    float: { enabled: false },
    cloth: {
      enabled: true,
      motionRegions: [{ feather: .056, strength: 1, points: cape.map(([x, y]) => [x / size, y / size]) }],
      amplitudeX: .017, amplitudeX2: .006, amplitudeY: .021,
      frequencyY: 14, speedX: 1.9, frequencyX2: 13, frequencyY2: 8, speedX2: 2.45,
      frequencyX: 11, frequencyY3: 8, speedY: 2.2
    },
    blink: { enabled: true, intervalMin: .75, intervalMax: 4, duration: .15 }
  });
  const pet = serializePet({ name: 'EduHellDiver', kind: 'voice', images, animation, behavior: behaviorProfile() });
  fs.writeFileSync(path.join(root, 'pets', 'EduHellDiver-Voz.pet'), pet);
  console.log(`EduHellDiver-Voz.pet · ${pet.length} bytes`);
}

createPet().catch(error => { console.error(error); process.exitCode = 1; });
