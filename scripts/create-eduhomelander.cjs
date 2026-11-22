'use strict';
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createCanvas, loadImage, Path2D } = require(process.env.AULA_CANVAS_MODULE || path.join(os.homedir(), '.cache', 'codex-runtimes', 'codex-primary-runtime', 'dependencies', 'node', 'node_modules', '@napi-rs', 'canvas'));
const { serializePet, animationProfile } = require('../src/pet-package.cjs');
const { behaviorProfile } = require('../src/behavior.cjs');

const root = path.join(__dirname, '..');
const assets = path.join(root, 'web', 'eduhomelander');
const size = 1254;
const mime = 'image/png';
// Las expresiones quedan dentro de las lentes y el hocico.
const lenses = new Path2D('M585 307 C592 280 620 272 654 273 C694 273 722 279 738 296 C751 311 744 341 734 360 C721 385 707 396 678 401 C649 407 618 400 604 386 C588 370 578 330 585 307 Z M828 308 C840 282 884 273 925 271 C932 280 942 311 947 337 L954 374 C945 387 922 394 893 394 C869 394 851 384 839 366 C831 354 818 325 828 308 Z');
const muzzle = new Path2D('M735 414 Q768 408 789 408 L805 408 Q825 411 843 410 L846 457 Q791 484 735 460 Z');
const motionRegions = [
  // Faldón izquierdo por debajo de la cola y la hombrera.
  { feather: .047, strength: 1, points: [[391, 714], [419, 706], [474, 740], [482, 823], [416, 901], [360, 968], [344, 1040], [365, 1114], [396, 1174], [111, 1180], [12, 1090], [10, 938], [90, 851], [215, 840], [295, 818], [332, 785]] },
  // Faldón derecho junto al costado y detrás de la pata.
  { feather: .045, strength: 1, points: [[923, 727], [966, 744], [1040, 811], [1100, 867], [1237, 962], [1244, 1109], [1052, 1163], [888, 1153], [904, 1090], [900, 1060], [914, 992], [908, 917], [875, 864], [898, 790]] },
  // El fleco tiene menos recorrido y conserva su raíz y las orejas.
  { feather: .022, strength: .42, points: [[612, 142], [606, 104], [659, 76], [716, 47], [817, 45], [844, 78], [848, 117], [846, 151], [820, 174], [766, 206], [747, 181], [690, 166], [641, 177]] }
].map(region => ({ ...region, points: region.points.map(([x, y]) => [x / size, y / size]) }));

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
    if (speaking) paintExpression(context, talking, muzzle);
    const expression = context.getImageData(0, 0, size, size);
    for (let index = 3; index < expression.data.length; index += 4) expression.data[index] = original.data[index];
    context.putImageData(expression, 0, 0);
    images[name] = { mime, bytes: canvas.toBuffer(mime) };
  }
  for (const [name, resource] of Object.entries(images)) fs.writeFileSync(path.join(assets, name + '.png'), resource.bytes);
  const animation = animationProfile({
    float: { enabled: false },
    cloth: {
      enabled: true, motionRegions,
      amplitudeX: .022, amplitudeX2: .008, amplitudeY: .016,
      frequencyY: 18, speedX: 2.1, frequencyX2: 13, frequencyY2: 7, speedX2: 2.8,
      frequencyX: 10, frequencyY3: 8, speedY: 2.3
    },
    blink: { enabled: true, intervalMin: .75, intervalMax: 4, duration: .15 }
  });
  const pet = serializePet({ name: 'EduHomelander', kind: 'voice', images, animation, behavior: behaviorProfile() });
  fs.writeFileSync(path.join(root, 'pets', 'EduHomelander-Voz.pet'), pet);
  console.log(`EduHomelander-Voz.pet · ${pet.length} bytes`);
}

createPet().catch(error => { console.error(error); process.exitCode = 1; });
