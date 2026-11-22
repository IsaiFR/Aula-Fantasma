'use strict';
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createCanvas, loadImage, Path2D } = require(process.env.AULA_CANVAS_MODULE || path.join(os.homedir(), '.cache', 'codex-runtimes', 'codex-primary-runtime', 'dependencies', 'node', 'node_modules', '@napi-rs', 'canvas'));
const { serializePet, animationProfile } = require('../src/pet-package.cjs');
const { VOICE_CYCLES } = require('../src/voice-cycle.cjs');
const { behaviorProfile } = require('../src/behavior.cjs');

const root = path.join(__dirname, '..');
const assets = path.join(root, 'web', 'edustrading');
const size = 1254;
const mime = 'image/png';
// Las expresiones quedan dentro de las lentes y el hocico.
const lenses = new Path2D('M547 311 C553 289 578 279 611 278 C647 276 684 284 698 301 C713 319 705 349 694 371 C680 399 658 408 626 410 C599 412 576 405 563 388 C551 371 541 335 547 311 Z M783 291 C795 272 832 265 881 264 C889 277 900 307 906 327 L911 367 C898 387 873 396 845 395 C820 394 801 381 791 364 C781 347 773 310 783 291 Z');
const muzzle = new Path2D('M703 421 Q732 418 749 416 L764 416 Q784 419 807 418 L808 479 Q757 505 704 479 Z');

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
  const animation = animationProfile({
    float: { enabled: false },
    cloth: { enabled: false },
    blink: { enabled: true, intervalMin: .75, intervalMax: 4, duration: .15 }
  });
  const pet = serializePet({ name: 'EduStrading', kind: 'voice', images, animation, behavior: behaviorProfile(), effects: { voiceCycle: VOICE_CYCLES.EduStrading } });
  fs.writeFileSync(path.join(root, 'pets', 'EduStrading-Voz.pet'), pet);
  console.log(`EduStrading-Voz.pet · ${pet.length} bytes`);
}

createPet().catch(error => { console.error(error); process.exitCode = 1; });
