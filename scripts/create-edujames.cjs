'use strict';
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createCanvas, loadImage, Path2D } = require(process.env.AULA_CANVAS_MODULE || path.join(os.homedir(), '.cache', 'codex-runtimes', 'codex-primary-runtime', 'dependencies', 'node', 'node_modules', '@napi-rs', 'canvas'));
const { serializePet } = require('../src/pet-package.cjs');
const { hairAnimation } = require('./animate-voice-hair.cjs');
const { behaviorProfile } = require('../src/behavior.cjs');

const root = path.join(__dirname, '..');
const assets = path.join(root, 'web', 'edujames');
const size = 1254;
const mime = 'image/png';
// La animación queda dentro de las lentes y el hocico.
const lenses = new Path2D('M535 404 C553 376 584 370 616 366 C653 357 687 357 707 374 C727 392 731 421 720 450 C710 481 687 498 648 501 C600 505 566 494 548 469 C535 449 528 424 535 404 Z M811 378 C822 355 856 347 886 346 C927 343 951 351 958 372 C967 401 961 436 951 453 C935 476 899 484 871 479 C836 476 818 455 811 427 C805 408 805 389 811 378 Z');
const muzzle = new Path2D('M725 518 Q759 519 785 506 Q810 515 831 519 L836 563 Q789 593 727 566 Z');

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
  const animation = hairAnimation('EduJames', { float: { enabled: false }, blink: { enabled: true, intervalMin: .75, intervalMax: 4, duration: .15 } });
  const pet = serializePet({ name: 'EduJames', kind: 'voice', images, animation, behavior: behaviorProfile() });
  fs.writeFileSync(path.join(root, 'pets', 'EduJames-Voz.pet'), pet);
  console.log(`EduJames-Voz.pet · ${pet.length} bytes`);
}

createPet().catch(error => { console.error(error); process.exitCode = 1; });
