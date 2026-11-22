'use strict';
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createCanvas, loadImage, Path2D } = require(process.env.AULA_CANVAS_MODULE || path.join(os.homedir(), '.cache', 'codex-runtimes', 'codex-primary-runtime', 'dependencies', 'node', 'node_modules', '@napi-rs', 'canvas'));
const { serializePet } = require('../src/pet-package.cjs');
const { hairAnimation } = require('./animate-voice-hair.cjs');
const { behaviorProfile } = require('../src/behavior.cjs');

const root = path.join(__dirname, '..');
const assets = path.join(root, 'web', 'edusoldier');
const size = 1254;
const mime = 'image/png';
// Las expresiones quedan dentro de las lentes y el hocico.
const lenses = new Path2D('M535 318 C543 295 578 286 618 284 C656 283 689 290 705 302 C724 315 718 347 708 371 C696 397 673 417 639 420 C605 424 572 419 555 393 C540 369 529 337 535 318 Z M791 302 C807 281 854 271 894 272 C904 291 915 322 923 345 L935 377 C919 393 900 405 870 406 C845 407 820 394 806 373 C791 351 782 320 791 302 Z');
const muzzle = new Path2D('M712 456 Q744 453 768 446 L780 447 Q794 451 804 460 L800 509 Q768 519 725 510 Z');

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
  const animation = hairAnimation('EduSoldier', {
    float: { enabled: false },
    blink: { enabled: true, intervalMin: .75, intervalMax: 4, duration: .15 }
  });
  const pet = serializePet({ name: 'EduSoldier', kind: 'voice', images, animation, behavior: behaviorProfile() });
  fs.writeFileSync(path.join(root, 'pets', 'EduSoldier-Voz.pet'), pet);
  console.log(`EduSoldier-Voz.pet · ${pet.length} bytes`);
}

createPet().catch(error => { console.error(error); process.exitCode = 1; });
