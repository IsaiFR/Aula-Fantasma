'use strict';
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createCanvas, loadImage, Path2D } = require(process.env.AULA_CANVAS_MODULE || path.join(os.homedir(), '.cache', 'codex-runtimes', 'codex-primary-runtime', 'dependencies', 'node', 'node_modules', '@napi-rs', 'canvas'));
const { serializePet, animationProfile } = require('../src/pet-package.cjs');
const { VOICE_CYCLES } = require('../src/voice-cycle.cjs');
const { behaviorProfile } = require('../src/behavior.cjs');

const root = path.join(__dirname, '..');
const assets = path.join(root, 'web', 'eduscorpion');
const mime = 'image/png';
const size = 1254;
// Mantener el marco de las gafas y el brazo oscuro que cruza la lente derecha.
const lenses = new Path2D('M549 324 C548 301 566 290 596 288 C633 283 673 290 689 304 C700 319 697 348 687 372 C676 398 644 408 613 410 C580 412 563 399 555 377 C550 361 547 339 549 324 Z M774 307 C787 283 827 275 863 274 L894 365 C882 381 863 391 830 394 C805 397 786 383 778 362 C772 344 766 321 774 307 Z');
const vents = new Path2D('M584 451 L653 467 L669 536 L592 516 Z M814 462 L864 437 L846 490 L799 520 Z');

function paintExpression(context, frame, clip) {
  context.save();
  context.clip(clip);
  context.drawImage(frame, 0, 0);
  context.restore();
}

async function createPet() {
  const [reference, blink, talking] = await Promise.all(['reference', 'blink-source', 'talking-source'].map(async name => {
    const image = await loadImage(path.join(assets, name + '.png'));
    if (image.width !== size || image.height !== size) throw new Error(`El lienzo de ${name} debe medir ${size} × ${size}.`);
    return image;
  }));
  const images = { open: { mime, bytes: fs.readFileSync(path.join(assets, 'reference.png')) } };
  const base = createCanvas(size, size).getContext('2d');
  base.drawImage(reference, 0, 0);
  const original = base.getImageData(0, 0, size, size);
  for (const [name, eyesClosed, speaking] of [['closed', true, false], ['talking', false, true], ['talkingClosed', true, true]]) {
    const canvas = createCanvas(size, size);
    const context = canvas.getContext('2d');
    context.drawImage(reference, 0, 0);
    if (eyesClosed) paintExpression(context, blink, lenses);
    if (speaking) paintExpression(context, talking, vents);
    const expression = context.getImageData(0, 0, size, size);
    // Las expresiones cambian el color de la cara, no el alfa del PNG original.
    for (let index = 3; index < expression.data.length; index += 4) expression.data[index] = original.data[index];
    context.putImageData(expression, 0, 0);
    images[name] = { mime, bytes: canvas.toBuffer(mime) };
  }
  for (const [name, resource] of Object.entries(images)) fs.writeFileSync(path.join(assets, name + '.png'), resource.bytes);
  const animation = animationProfile({ float: { enabled: false }, blink: { enabled: true, intervalMin: .75, intervalMax: 4, duration: .15 } });
  const pet = serializePet({ name: 'EduScorpion', kind: 'voice', images, animation, behavior: behaviorProfile(), effects: { voiceCycle: VOICE_CYCLES.EduScorpion } });
  fs.writeFileSync(path.join(root, 'pets', 'EduScorpion-Voz.pet'), pet);
  console.log(`EduScorpion-Voz.pet · ${pet.length} bytes`);
}

createPet().catch(error => { console.error(error); process.exitCode = 1; });
