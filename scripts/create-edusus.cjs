'use strict';
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createCanvas, loadImage, Path2D } = require(process.env.AULA_CANVAS_MODULE || path.join(os.homedir(), '.cache', 'codex-runtimes', 'codex-primary-runtime', 'dependencies', 'node', 'node_modules', '@napi-rs', 'canvas'));
const { serializePet, animationProfile } = require('../src/pet-package.cjs');
const { behaviorProfile } = require('../src/behavior.cjs');

const root = path.join(__dirname, '..');
const assets = path.join(root, 'web', 'edusus');
const size = 1254;
const mime = 'image/png';
const lenses = new Path2D('M555 600 C565 579 601 568 647 564 C696 559 739 562 755 581 C770 598 771 627 762 652 C754 679 740 696 713 706 C685 716 637 716 613 707 C590 699 573 678 564 654 C557 636 549 613 555 600 Z M867 576 C876 555 914 548 951 546 C986 542 1001 546 1010 558 C1022 575 1032 621 1033 644 C1034 666 1014 685 986 690 C959 698 929 694 906 679 C881 663 861 617 867 576 Z');
const mouth = new Path2D('M750 725 Q789 717 817 714 L839 714 Q867 717 899 721 L899 786 Q826 820 753 786 Z');

function overlay(context, image, clip) {
  context.save();
  context.clip(clip);
  context.drawImage(image, 0, 0);
  context.restore();
}

async function createPet() {
  const [reference, open, closed, speaking] = await Promise.all(['reference', 'open-source', 'blink-source', 'talking-source'].map(async name => {
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
  const pet = serializePet({ name: 'EduSus', kind: 'voice', images, animation, behavior: behaviorProfile() });
  fs.writeFileSync(path.join(root, 'pets', 'EduSus-Voz.pet'), pet);
  console.log(`EduSus-Voz.pet · ${pet.length} bytes`);
}

createPet().catch(error => { console.error(error); process.exitCode = 1; });
