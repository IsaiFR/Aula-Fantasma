'use strict';
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createCanvas, loadImage, Path2D } = require(process.env.AULA_CANVAS_MODULE || path.join(os.homedir(), '.cache', 'codex-runtimes', 'codex-primary-runtime', 'dependencies', 'node', 'node_modules', '@napi-rs', 'canvas'));
const { serializePet } = require('../src/pet-package.cjs');
const { capeAnimation } = require('./animate-voice-capes.cjs');
const { behaviorProfile } = require('../src/behavior.cjs');

const root = path.join(__dirname, '..');
const assets = path.join(root, 'web', 'eduluchador');
const size = 1254;
const mime = 'image/png';
// Las expresiones quedan dentro de las aberturas de la máscara y el hocico.
const openings = new Path2D('M519 290 C548 290 582 284 625 287 C668 289 701 307 713 330 C725 350 719 375 701 392 C682 409 650 419 618 419 C589 421 562 411 544 391 C528 374 518 342 519 290 Z M805 318 C822 295 851 284 912 285 C924 301 934 332 934 352 C933 390 914 412 884 412 C851 413 827 395 812 372 C801 355 798 335 805 318 Z');
const muzzle = new Path2D('M710 443 Q740 439 768 439 L783 439 Q807 438 831 443 L833 499 Q774 532 712 508 Z');

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
    if (eyesClosed) paintExpression(context, blink, openings);
    if (speaking) paintExpression(context, talking, muzzle);
    const expression = context.getImageData(0, 0, size, size);
    for (let index = 3; index < expression.data.length; index += 4) expression.data[index] = original.data[index];
    context.putImageData(expression, 0, 0);
    images[name] = { mime, bytes: canvas.toBuffer(mime) };
  }
  for (const [name, resource] of Object.entries(images)) fs.writeFileSync(path.join(assets, name + '.png'), resource.bytes);
  const animation = capeAnimation('EduLuchador', {
    float: { enabled: false },
    blink: { enabled: true, intervalMin: .75, intervalMax: 4, duration: .15 }
  });
  const pet = serializePet({ name: 'EduLuchador', kind: 'voice', images, animation, behavior: behaviorProfile() });
  fs.writeFileSync(path.join(root, 'pets', 'EduLuchador-Voz.pet'), pet);
  console.log(`EduLuchador-Voz.pet · ${pet.length} bytes`);
}

createPet().catch(error => { console.error(error); process.exitCode = 1; });
