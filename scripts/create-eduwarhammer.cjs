'use strict';
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createCanvas, loadImage, Path2D } = require(process.env.AULA_CANVAS_MODULE || path.join(os.homedir(), '.cache', 'codex-runtimes', 'codex-primary-runtime', 'dependencies', 'node', 'node_modules', '@napi-rs', 'canvas'));
const { serializePet, animationProfile } = require('../src/pet-package.cjs');
const { behaviorProfile } = require('../src/behavior.cjs');

const root = path.join(__dirname, '..');
const assets = path.join(root, 'web', 'eduwarhammer');
const size = 1254;
const mime = 'image/png';
const lenses = new Path2D('M572 341 C576 321 610 309 649 304 C694 300 727 301 744 317 C764 334 760 362 752 386 C740 414 723 431 684 434 C633 440 599 434 582 406 C570 389 568 362 572 341 Z M849 333 C855 312 890 301 925 299 C955 296 985 301 993 316 C1006 337 1003 363 997 386 C990 417 967 430 933 430 C898 430 880 421 866 402 C851 381 844 355 849 333 Z');
const mouth = new Path2D('M752 455 Q794 453 816 447 Q846 452 873 453 L874 494 Q866 502 862 507 L752 507 Z');
const mouthPlacement = [745, 443, 133, 70, 751, 446, 122, 61];

function overlay(context, image, clip, placement = [0, 0]) {
  context.save();
  context.clip(clip);
  context.drawImage(image, ...placement);
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
    if (speak) overlay(context, speaking, mouth, mouthPlacement);
    const expression = context.getImageData(0, 0, size, size);
    for (let index = 3; index < original.length; index += 4) expression.data[index] = original[index];
    context.putImageData(expression, 0, 0);
    images[name] = { mime, bytes: canvas.toBuffer(mime) };
  }
  for (const [name, resource] of Object.entries(images)) fs.writeFileSync(path.join(assets, name + '.png'), resource.bytes);
  const animation = animationProfile({ float: { enabled: false }, blink: { enabled: true, intervalMin: .75, intervalMax: 4, duration: .15 } });
  const pet = serializePet({ name: 'EduWarhammer', kind: 'voice', images, animation, behavior: behaviorProfile() });
  fs.writeFileSync(path.join(root, 'pets', 'EduWarhammer-Voz.pet'), pet);
  console.log(`EduWarhammer-Voz.pet · ${pet.length} bytes`);
}

createPet().catch(error => { console.error(error); process.exitCode = 1; });
