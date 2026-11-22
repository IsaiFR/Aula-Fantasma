'use strict';
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createCanvas, loadImage, Path2D } = require(process.env.AULA_CANVAS_MODULE || path.join(os.homedir(), '.cache', 'codex-runtimes', 'codex-primary-runtime', 'dependencies', 'node', 'node_modules', '@napi-rs', 'canvas'));
const { serializePet, animationProfile } = require('../src/pet-package.cjs');
const { VOICE_CYCLES } = require('../src/voice-cycle.cjs');
const { behaviorProfile } = require('../src/behavior.cjs');

const root = path.join(__dirname, '..');
const assets = path.join(root, 'web', 'edu007');
const size = 1254;
const mime = 'image/png';
// La animación queda dentro de las lentes y el hocico.
const lenses = new Path2D('M530 310 C539 289 580 279 620 279 C659 278 687 286 701 302 C710 317 707 343 699 362 C686 391 660 405 626 408 C592 412 568 410 548 384 C537 368 524 332 530 310 Z M793 295 C808 273 857 259 899 261 C909 283 917 314 921 337 L924 361 C915 376 886 391 853 389 C827 388 810 374 801 353 C792 334 786 308 793 295 Z');
const muzzle = new Path2D('M704 426 Q733 421 756 419 L771 419 Q790 422 817 423 L814 480 Q761 510 706 482 Z');

function paintExpression(context, image, clip) {
  context.save();
  context.clip(clip);
  context.drawImage(image, 0, 0);
  context.restore();
}

async function createPet() {
  const [reference, clean, blink, talking] = await Promise.all(['reference', 'clean-source', 'blink-source', 'talking-source'].map(async name => {
    const image = await loadImage(path.join(assets, name + '.png'));
    if (image.width !== size || image.height !== size) throw new Error(`El lienzo de ${name} debe medir ${size} × ${size}.`);
    return image;
  }));
  const base = createCanvas(size, size);
  const baseContext = base.getContext('2d');
  baseContext.drawImage(reference, 0, 0);
  const source = baseContext.getImageData(0, 0, size, size).data;
  baseContext.clearRect(0, 0, size, size);
  baseContext.drawImage(clean, 0, 0);
  const matte = baseContext.getImageData(0, 0, size, size);
  const pixels = matte.data;
  const step = 4 * 4;
  const rowStep = step * size;

  // Conservar el color original en el interior y el suavizado en el borde del recorte.
  for (let i = 3; i < pixels.length; i += 4) {
    if (pixels[i] < 8) pixels.fill(0, i - 3, i + 1);
    if (pixels[i] < 245) continue;
    pixels[i] = 255;
    if ([i - step, i + step, i - rowStep, i + rowStep].every(neighbor => pixels[neighbor] >= 245)) {
      pixels.set(source.subarray(i - 3, i), i - 3);
    }
  }
  baseContext.putImageData(matte, 0, 0);
  const images = { open: { mime, bytes: base.toBuffer(mime) } };
  for (const [name, eyesClosed, speaking] of [['closed', true, false], ['talking', false, true], ['talkingClosed', true, true]]) {
    const canvas = createCanvas(size, size);
    const context = canvas.getContext('2d');
    context.drawImage(base, 0, 0);
    if (eyesClosed) paintExpression(context, blink, lenses);
    if (speaking) paintExpression(context, talking, muzzle);
    const expression = context.getImageData(0, 0, size, size);
    for (let index = 3; index < expression.data.length; index += 4) expression.data[index] = pixels[index];
    context.putImageData(expression, 0, 0);
    images[name] = { mime, bytes: canvas.toBuffer(mime) };
  }
  for (const [name, resource] of Object.entries(images)) fs.writeFileSync(path.join(assets, name + '.png'), resource.bytes);
  const animation = animationProfile({ float: { enabled: false }, blink: { enabled: true, intervalMin: .75, intervalMax: 4, duration: .15 } });
  const pet = serializePet({ name: 'Edu007', kind: 'voice', images, animation, behavior: behaviorProfile(), effects: { voiceCycle: VOICE_CYCLES.Edu007 } });
  fs.writeFileSync(path.join(root, 'pets', 'Edu007-Voz.pet'), pet);
  console.log(`Edu007-Voz.pet · ${pet.length} bytes`);
}

createPet().catch(error => { console.error(error); process.exitCode = 1; });
