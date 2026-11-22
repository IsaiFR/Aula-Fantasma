'use strict';
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createCanvas, loadImage, Path2D } = require(process.env.AULA_CANVAS_MODULE || path.join(os.homedir(), '.cache', 'codex-runtimes', 'codex-primary-runtime', 'dependencies', 'node', 'node_modules', '@napi-rs', 'canvas'));
const { serializePet, animationProfile } = require('../src/pet-package.cjs');
const { VOICE_CYCLES } = require('../src/voice-cycle.cjs');
const { behaviorProfile } = require('../src/behavior.cjs');

const root = path.join(__dirname, '..');
const assets = path.join(root, 'web', 'eduzero');
const size = 1254;
const format = 'image/png';
const lenses = new Path2D('M559 389 C570 349 698 344 739 369 C768 385 773 410 753 452 C737 490 703 503 650 501 C597 501 556 459 559 389 Z M862 392 C880 361 983 351 1016 368 C1042 381 1039 440 1016 476 C996 504 956 504 934 500 C893 496 866 466 860 435 C857 422 857 403 862 392 Z');
const vents = new Path2D('M746 557 L815 514 L802 687 L776 694 Z M852 525 L893 560 L858 687 L843 693 Z');
const air = new Path2D('M87 884 L95 855 L123 825 L178 804 L225 797 L238 806 L256 792 L270 805 L281 839 L271 894 L247 927 L252 936 L229 944 L210 961 L183 965 L89 922 Z M204 784 L227 769 L270 752 L298 724 L351 711 L352 727 L329 747 L284 771 L250 782 L249 793 L229 797 L205 797 Z M1102 476 L1178 478 L1225 612 L1205 662 L1137 699 L1090 701 L1085 747 L992 782 L1001 746 L1025 721 L998 720 L956 708 L968 691 L1001 686 L997 644 L1040 616 L1104 550 Z M988 819 L1020 816 L1024 843 L985 845 Z');
const clamp = value => Math.max(0, Math.min(1, value));

function extractAir(original, clean) {
  const base = createCanvas(size, size);
  const mist = createCanvas(size, size);
  const mask = createCanvas(size, size).getContext('2d');
  mask.fill(air);
  const coverage = mask.getImageData(0, 0, size, size).data;
  const baseContext = base.getContext('2d');
  const mistContext = mist.getContext('2d');
  baseContext.drawImage(original, 0, 0);
  mask.clearRect(0, 0, size, size);
  mask.drawImage(clean, 0, 0);
  const foreground = baseContext.getImageData(0, 0, size, size);
  const restored = mask.getImageData(0, 0, size, size);
  const layer = mistContext.createImageData(size, size);
  for (let i = 0; i < coverage.length; i += 4) {
    const x = i / 4 % size;
    const y = Math.floor(i / 4 / size);
    const left = x >= 82 && x <= 355 && y >= 697 && y <= 977;
    if (!left && !coverage[i + 3]) continue;
    const opacity = foreground.data[i + 3] / 255;
    const blue = foreground.data[i + 2];
    // Ajustar la reconstrucción a ambos bordes de la cola original antes de separarlos.
    const alignedX = left ? x + Math.round(Math.max(-4, Math.min(3, (x - 150) / 23 - 4))) : x;
    const background = i + (alignedX - x) * 4;
    const under = restored.data[background + 3] / 255;
    const predictedBlue = restored.data[background + 2] * under;
    const delta = opacity * blue - predictedBlue;
    if (left) {
      // Fundir la cola restaurada con la original por fuera de la zona de la bruma.
      const limit = Math.min(357, 353 - (y - 717) * .46, 276 - (y - 894) * .74);
      const weight = Math.min(clamp((y - 697) / 15), clamp((977 - y) / 15), clamp((limit - x) / 13));
      const tint = clamp((blue - 86) / 20);
      if (coverage[i + 3] && tint && opacity) {
        const alpha = opacity * clamp((blue - 65) / 160) * tint * coverage[i + 3] / 255;
        layer.data[i + 3] = alpha * 255;
        for (let channel = 0; channel < 3; channel++) {
          const original = foreground.data[i + channel];
          layer.data[i + channel] = Math.min(255, original + (255 - original) * .22 * under);
        }
      }
      const blended = opacity * (1 - weight) + under * weight;
      if (weight && blended) for (let channel = 0; channel < 3; channel++) {
        const original = foreground.data[i + channel] * opacity;
        const clean = restored.data[background + channel] * under;
        foreground.data[i + channel] = (original * (1 - weight) + clean * weight) / blended;
      }
      foreground.data[i + 3] = blended * 255;
      continue;
    }
    if (!opacity || blue < 76 || blue - foreground.data[i] < -4 || delta < 4) continue;
    const visibleAlpha = under === 1 ? 0 : Math.max(0, (opacity - under) / (1 - under));
    const alpha = Math.min(opacity, Math.max(visibleAlpha, delta / Math.max(1, 242 - predictedBlue)));
    layer.data[i + 3] = alpha * 255;
    // Recuperar el color de la bruma a partir del original y el fondo restaurado.
    for (let channel = 0; channel < 3; channel++) {
      const index = i + channel;
      layer.data[index] = (foreground.data[index] * opacity - restored.data[background + channel] * under * (1 - alpha)) / alpha;
    }
    foreground.data.set(restored.data.subarray(background, background + 4), i);
  }
  baseContext.putImageData(foreground, 0, 0);
  mistContext.putImageData(layer, 0, 0);
  return { base, mist };
}

function overlay(context, frame, clip, offsetX = 0) {
  context.save();
  context.clip(clip);
  context.drawImage(frame, offsetX, 0);
  context.restore();
}

async function createPet() {
  const [reference, clean, blink, talking] = await Promise.all(['reference', 'clean-source', 'blink-source', 'talking-source'].map(async name => {
    const frame = await loadImage(path.join(assets, name + '.png'));
    if (frame.width !== size || frame.height !== size) throw new Error(`El lienzo de ${name} debe medir ${size} × ${size}.`);
    return frame;
  }));
  const { base, mist } = extractAir(reference, clean);
  const images = {};
  for (const [name, eyes, speech] of [['open', false, false], ['closed', true, false], ['talking', false, true], ['talkingClosed', true, true]]) {
    const frame = createCanvas(size, size);
    const context = frame.getContext('2d');
    context.drawImage(base, 0, 0);
    if (eyes) overlay(context, blink, lenses, 14);
    if (speech) overlay(context, talking, vents);
    images[name] = { mime: format, bytes: frame.toBuffer(format) };
  }
  images.mist = { mime: format, bytes: mist.toBuffer(format) };
  for (const [name, resource] of Object.entries(images)) fs.writeFileSync(path.join(assets, name + '.png'), resource.bytes);
  const animation = animationProfile({ float: { enabled: false }, blink: { enabled: true, intervalMin: .75, intervalMax: 4, duration: .15, closeDuration: .04, openDuration: .06 } });
  const bytes = serializePet({ name: 'EduZero', kind: 'voice', images, animation, behavior: behaviorProfile(), effects: { voiceCycle: VOICE_CYCLES.EduZero } });
  fs.writeFileSync(path.join(root, 'pets', 'EduZero-Voz.pet'), bytes);
  console.log(`EduZero-Voz.pet · ${bytes.length} bytes`);
}

createPet().catch(error => { console.error(error); process.exitCode = 1; });
