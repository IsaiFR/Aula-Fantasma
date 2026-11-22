'use strict';
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createCanvas, loadImage, Path2D } = require(process.env.AULA_CANVAS_MODULE || path.join(os.homedir(), '.cache', 'codex-runtimes', 'codex-primary-runtime', 'dependencies', 'node', 'node_modules', '@napi-rs', 'canvas'));
const { serializePet } = require('../src/pet-package.cjs');
const { hairAnimation } = require('./animate-voice-hair.cjs');
const { behaviorProfile } = require('../src/behavior.cjs');

const root = path.join(__dirname, '..');
const assets = path.join(root, 'web', 'edumark');
const size = 1254;
const mime = 'image/png';
const lenses = new Path2D('M550 388 C554 363 587 352 624 348 C668 343 711 343 738 354 C760 365 765 382 761 406 C757 435 743 458 718 472 C694 486 652 491 618 488 C579 486 562 461 554 434 C550 420 547 401 550 388 Z M845 376 C849 352 882 339 923 334 C957 330 1001 331 1018 347 C1033 361 1031 393 1027 422 C1023 453 1007 476 975 481 C934 486 901 480 876 460 C853 442 839 401 845 376 Z');
const mouth = new Path2D('M742 497 Q786 499 818 491 Q849 499 886 497 L883 568 Q819 613 746 565 Z');

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
  const animation = hairAnimation('EduMark', { float: { enabled: false }, blink: { enabled: true, intervalMin: .75, intervalMax: 4, duration: .15 } });
  const pet = serializePet({ name: 'EduMark', kind: 'voice', images, animation, behavior: behaviorProfile() });
  fs.writeFileSync(path.join(root, 'pets', 'EduMark-Voz.pet'), pet);
  console.log(`EduMark-Voz.pet · ${pet.length} bytes`);
}

createPet().catch(error => { console.error(error); process.exitCode = 1; });
