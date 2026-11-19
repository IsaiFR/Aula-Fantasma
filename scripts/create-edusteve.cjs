'use strict';
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createCanvas, loadImage, Path2D } = require(process.env.AULA_CANVAS_MODULE || path.join(os.homedir(), '.cache', 'codex-runtimes', 'codex-primary-runtime', 'dependencies', 'node', 'node_modules', '@napi-rs', 'canvas'));
const { serializePet, animationProfile } = require('../src/pet-package.cjs');
const { removeSticker } = require('./sticker-silhouette.cjs');
const { behaviorProfile } = require('../src/behavior.cjs');

const root = path.join(__dirname, '..');
const assets = path.join(root, 'web', 'edusteve');
const size = 1254;
const mime = 'image/png';
const lenses = new Path2D('M541 393 C546 374 571 365 604 363 C648 359 684 364 703 376 C717 388 713 414 703 438 C690 475 671 488 641 494 C600 501 574 497 557 479 C542 460 535 416 541 393 Z M803 371 C824 351 868 346 905 349 C937 348 953 357 952 383 C950 420 937 458 916 474 C895 489 857 487 836 472 C808 454 788 395 803 371 Z');
const mouth = new Path2D('M710 510 Q742 505 762 503 L774 503 Q798 503 823 505 L822 572 Q767 595 712 572 Z');

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
  removeSticker(context, guide, { size, seedX: 600, seedY: 775, whiskerBounds: [914, 454, 1029, 572] });
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
  const animation = animationProfile({ float: { enabled: false }, blink: { enabled: true, intervalMin: .75, intervalMax: 4, duration: .15 } });
  const pet = serializePet({ name: 'EduSteve', kind: 'voice', images, animation, behavior: behaviorProfile() });
  fs.writeFileSync(path.join(root, 'pets', 'EduSteve-Voz.pet'), pet);
  console.log(`EduSteve-Voz.pet · ${pet.length} bytes`);
}

createPet().catch(error => { console.error(error); process.exitCode = 1; });
