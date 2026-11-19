'use strict';
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createCanvas, loadImage, Path2D } = require(process.env.AULA_CANVAS_MODULE || path.join(os.homedir(), '.cache', 'codex-runtimes', 'codex-primary-runtime', 'dependencies', 'node', 'node_modules', '@napi-rs', 'canvas'));
const { serializePet, animationProfile } = require('../src/pet-package.cjs');
const { behaviorProfile } = require('../src/behavior.cjs');

const root = path.join(__dirname, '..');
const assets = path.join(root, 'web', 'edunolan');
const size = 1254;
const mime = 'image/png';
const lenses = new Path2D('M569 386 C571 363 610 354 651 351 C692 349 740 349 755 365 C777 388 763 423 745 447 C722 473 696 480 644 478 C604 478 582 458 575 431 C570 415 568 399 569 386 Z M853 379 C859 356 901 346 949 344 C993 341 1018 345 1025 370 C1033 395 1029 434 1014 454 C1000 473 984 476 949 475 C915 475 894 465 876 447 C861 430 849 399 853 379 Z');
const mouth = new Path2D('M748 534 Q799 531 827 514 Q850 530 884 540 L903 582 Q844 618 745 601 Z');

function overlay(context, image, clip) {
  context.save();
  context.clip(clip);
  context.drawImage(image, 0, 0);
  context.restore();
}

async function createPet() {
  const [reference, open, closed, speaking] = await Promise.all(['reference', 'clear-source', 'blink-source', 'talking-source'].map(async name => {
    const image = await loadImage(path.join(assets, name + '.png'));
    if (image.width !== size || image.height !== size) throw new Error(`El lienzo de ${name} debe medir ${size} × ${size}.`);
    return image;
  }));
  const baseContext = createCanvas(size, size).getContext('2d');
  baseContext.drawImage(reference, 0, 0);
  const original = baseContext.getImageData(0, 0, size, size).data;
  const images = {};
  for (const [name, eyes, speak] of [['open', open, false], ['closed', closed, false], ['talking', open, true], ['talkingClosed', closed, true]]) {
    const canvas = createCanvas(size, size);
    const context = canvas.getContext('2d');
    context.drawImage(reference, 0, 0);
    overlay(context, eyes, lenses);
    if (speak) overlay(context, speaking, mouth);
    const expression = context.getImageData(0, 0, size, size);
    for (let index = 3; index < original.length; index += 4) expression.data[index] = original[index];
    context.putImageData(expression, 0, 0);
    images[name] = { mime, bytes: canvas.toBuffer(mime) };
  }
  for (const [name, resource] of Object.entries(images)) fs.writeFileSync(path.join(assets, name + '.png'), resource.bytes);
  const animation = animationProfile({ float: { enabled: false }, blink: { enabled: true, intervalMin: .75, intervalMax: 4, duration: .15 } });
  const pet = serializePet({ name: 'EduNolan', kind: 'voice', images, animation, behavior: behaviorProfile() });
  fs.writeFileSync(path.join(root, 'pets', 'EduNolan-Voz.pet'), pet);
  console.log(`EduNolan-Voz.pet · ${pet.length} bytes`);
}

createPet().catch(error => { console.error(error); process.exitCode = 1; });
