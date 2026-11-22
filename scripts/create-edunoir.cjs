'use strict';
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createCanvas, loadImage, Path2D } = require(process.env.AULA_CANVAS_MODULE || path.join(os.homedir(), '.cache', 'codex-runtimes', 'codex-primary-runtime', 'dependencies', 'node', 'node_modules', '@napi-rs', 'canvas'));
const { serializePet, animationProfile } = require('../src/pet-package.cjs');
const { behaviorProfile } = require('../src/behavior.cjs');

const root = path.join(__dirname, '..');
const assets = path.join(root, 'web', 'edunoir');
const size = 1254;
const mime = 'image/png';
// Las expresiones quedan dentro de las lentes y el hocico.
const lenses = new Path2D('M545 328 C553 302 584 291 624 289 C668 289 696 296 713 310 C729 324 722 351 712 374 C698 403 674 423 642 426 C602 431 575 420 558 393 C548 376 538 350 545 328 Z M800 309 C813 287 857 278 906 277 C918 297 926 326 933 348 L944 381 C930 404 900 415 871 413 C844 414 822 398 809 375 C797 352 790 327 800 309 Z');
const muzzle = new Path2D('M716 432 Q744 428 771 428 Q795 427 827 431 L827 478 Q804 473 789 470 Q774 466 758 471 L717 479 Z');

function paintExpression(context, image, clip, offsetY = 0) {
  context.save();
  context.clip(clip);
  context.drawImage(image, 0, offsetY);
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
    if (speaking) paintExpression(context, talking, muzzle, -3);
    const expression = context.getImageData(0, 0, size, size);
    for (let index = 3; index < expression.data.length; index += 4) expression.data[index] = original.data[index];
    context.putImageData(expression, 0, 0);
    images[name] = { mime, bytes: canvas.toBuffer(mime) };
  }
  for (const [name, resource] of Object.entries(images)) fs.writeFileSync(path.join(assets, name + '.png'), resource.bytes);
  const animation = animationProfile({
    float: { enabled: false },
    cloth: { enabled: false },
    blink: { enabled: true, intervalMin: .75, intervalMax: 4, duration: .15 }
  });
  const pet = serializePet({ name: 'EduNoir', kind: 'voice', images, animation, behavior: behaviorProfile() });
  fs.writeFileSync(path.join(root, 'pets', 'EduNoir-Voz.pet'), pet);
  console.log(`EduNoir-Voz.pet · ${pet.length} bytes`);
}

createPet().catch(error => { console.error(error); process.exitCode = 1; });
