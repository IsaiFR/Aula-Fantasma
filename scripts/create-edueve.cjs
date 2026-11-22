'use strict';
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createCanvas, loadImage, Path2D } = require(process.env.AULA_CANVAS_MODULE || path.join(os.homedir(), '.cache', 'codex-runtimes', 'codex-primary-runtime', 'dependencies', 'node', 'node_modules', '@napi-rs', 'canvas'));
const { serializePet } = require('../src/pet-package.cjs');
const { hairAnimation } = require('./animate-voice-hair.cjs');
const { removeSticker } = require('./sticker-silhouette.cjs');
const { behaviorProfile } = require('../src/behavior.cjs');

const root = path.join(__dirname, '..');
const assets = path.join(root, 'web', 'edueve');
const size = 1254;
const mime = 'image/png';
const lenses = new Path2D('M556 352 C561 330 591 322 627 320 C666 316 699 325 712 344 C717 364 710 393 691 421 C670 443 639 446 616 444 C585 445 569 427 560 402 C554 387 550 368 556 352 Z M790 339 C806 320 843 312 883 311 L913 397 C903 419 875 433 847 431 C822 431 806 416 794 397 C785 377 781 354 790 339 Z');
const mouth = new Path2D('M710 458 L806 455 Q818 478 807 500 Q760 524 711 495 Z');

function overlay(context, frame, clip) {
  context.save();
  context.clip(clip);
  context.drawImage(frame, 0, 0);
  context.restore();
}

async function createPet() {
  const [reference, clean, blink, talking] = await Promise.all(['reference', 'clean-source', 'blink-source', 'talking-source'].map(async name => {
    const image = await loadImage(path.join(assets, name + '.png'));
    if (image.width !== size || image.height !== size) throw new Error(`El lienzo de ${name} debe medir ${size} × ${size}.`);
    return image;
  }));
  const base = createCanvas(size, size);
  const context = base.getContext('2d');
  context.drawImage(clean, 0, 0);
  const guide = context.getImageData(0, 0, size, size).data;
  context.clearRect(0, 0, size, size);
  context.drawImage(reference, 0, 0);
  removeSticker(context, guide, { size, seedX: 700, seedY: 825, whiskerBounds: [938, 464, 1010, 535] });
  const original = context.getImageData(0, 0, size, size).data;
  const images = { open: { mime, bytes: base.toBuffer(mime) } };
  for (const [name, eyesClosed, speaking] of [['closed', true, false], ['talking', false, true], ['talkingClosed', true, true]]) {
    const canvas = createCanvas(size, size);
    const frame = canvas.getContext('2d');
    frame.drawImage(base, 0, 0);
    if (eyesClosed) overlay(frame, blink, lenses);
    if (speaking) overlay(frame, talking, mouth);
    const expression = frame.getImageData(0, 0, size, size);
    for (let index = 3; index < original.length; index += 4) expression.data[index] = original[index];
    frame.putImageData(expression, 0, 0);
    images[name] = { mime, bytes: canvas.toBuffer(mime) };
  }
  for (const [name, resource] of Object.entries(images)) fs.writeFileSync(path.join(assets, name + '.png'), resource.bytes);
  const animation = hairAnimation('EduEve', { float: { enabled: false }, blink: { enabled: true, intervalMin: .75, intervalMax: 4, duration: .15 } });
  const pet = serializePet({ name: 'EduEve', kind: 'voice', images, animation, behavior: behaviorProfile() });
  fs.writeFileSync(path.join(root, 'pets', 'EduEve-Voz.pet'), pet);
  console.log(`EduEve-Voz.pet · ${pet.length} bytes`);
}

createPet().catch(error => { console.error(error); process.exitCode = 1; });
