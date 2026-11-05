'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const { parsePet, serializePet, petId } = require('../src/pet-package.cjs');
const { gifInfo } = require('../src/gif.cjs');
const { cycleFrame } = require('../src/cycle.cjs');
const { Motion } = require('../src/motion.cjs');
const { DEFAULTS } = require('../src/settings.cjs');
const { bundledUpdate } = require('../src/pet-updates.cjs');
const bytes = fs.readFileSync(path.join(__dirname, '..', 'pets', 'EduPiramyd.aulapet'));
const pet = parsePet(bytes), profile = pet.behavior.cycle;
const settings = { ...DEFAULTS, mode: 'edges', speed: 18, size: 256, presenceEnabled: false, booEnabled: false };
const motion = () => new Motion({ animation: pet.animation, behavior: pet.behavior });
const advance = (m, seconds, config = settings) => { for (let i = 0; i < Math.round(seconds * 100); i++) m.advance(.01, config); return m.frame(config); };
const atlas = require('./png-rgba.cjs')(pet.images.frames.bytes);
function region(frame, left, top, width, height) {
  const rows = [], originX = frame % 3 * 256, originY = Math.floor(frame / 3) * 256;
  for (let y = top; y < top + height; y++) {
    const start = ((originY + y) * atlas.width + originX + left) * 4;
    rows.push(atlas.pixels.subarray(start, start + width * 4));
  }
  return Buffer.concat(rows);
}

test('La hoja, empuñadura y pata de agarre son idénticas píxel por píxel en las nueve poses', () => {
  const sword = region(0, 0, 0, 175, 256), upper = region(0, 175, 0, 81, 220);
  assert.ok(sword.some((value, offset) => offset % 4 === 3 && value > 200));
  for (let frame = 1; frame < 9; frame++) {
    assert.ok(region(frame, 0, 0, 175, 256).equals(sword), `Espada variable en pose ${frame}`);
    assert.ok(region(frame, 175, 0, 81, 220).equals(upper), `Agarre variable en pose ${frame}`);
  }
});

test('Ambas patas traseras y la delantera de apoyo cambian de posición durante la caminata', () => {
  for (const [name, left, width] of [['trasera lejana', 176, 23], ['trasera cercana', 199, 19], ['delantera', 218, 33]]) {
    const poses = Array.from({ length: 8 }, (_, frame) => region(frame, left, 236, width, 13));
    assert.ok(poses.every(pose => pose.some((value, offset) => offset % 4 === 3 && value > 200)), `${name} ausente`);
    assert.ok(new Set(poses.map(pose => pose.toString('base64'))).size >= 6, `${name} inmóvil`);
  }
});

test('EduPiramyd conserva su GIF, hoja y ciclo declarativo al importar y exportar', () => {
  assert.ok(serializePet(pet).equals(bytes));
  assert.deepEqual(gifInfo(pet.images.cycle.bytes), { width: 256, height: 256, frames: 76, duration: 40 });
  assert.equal(pet.images.frames.bytes.readUInt32BE(16), 768); assert.equal(pet.images.frames.bytes.readUInt32BE(20), 768);
  assert.equal(profile.mirror, true); assert.equal(profile.reverseAfterRest, true);
});

test('El paquete anterior de EduPiramyd se actualiza y las variantes personalizadas se conservan', () => {
  assert.equal(bundledUpdate('57119ed015f0906fcafda28674af58bb8f2e076fe35ca7669a1e71d31d54c4f3'), 'EduPiramyd.aulapet');
  assert.equal(bundledUpdate('25cd8d4e39c9e8cdd1ff329010a79e95746db1b2028e751712d0b472fc0f8ee3'), 'EduPiramyd.aulapet');
  assert.equal(bundledUpdate(petId(pet)), null);
  const custom = parsePet(bytes); custom.name = 'Mi Piramyd';
  assert.equal(bundledUpdate(petId(custom)), null);
});

test('Los pasos duran exactamente 30 segundos y la pose de descanso permanece 10 segundos', () => {
  assert.ok(Math.abs(profile.sequence.filter(entry => entry.stage === 'walk').reduce((sum, entry) => sum + entry.seconds, 0) - 30) < 1e-9);
  assert.equal(profile.sequence.at(-1).seconds, 10);
  assert.equal(cycleFrame(29.999, profile).stage, 'walk');
  assert.equal(cycleFrame(30, profile).stage, 'idle'); assert.equal(cycleFrame(39.999, profile).sheetIndex, 8);
  assert.equal(cycleFrame(40, profile).stage, 'walk');
});

test('Arrastra la espada despacio por la base, se detiene y cambia de dirección al finalizar el descanso', () => {
  const m = motion(); m.advance(0, settings); const start = m.x;
  advance(m, 30); const stopped = m.x;
  assert.ok(Math.abs((start - stopped) * (1920 - 256 - 48) - 540) < 1e-6); assert.equal(m.y, 1);
  assert.equal(m.directionX, -1); assert.equal(m.frame(settings).cycle.stage, 'idle');
  advance(m, 9.99); assert.equal(m.x, stopped); assert.equal(m.directionX, -1);
  m.advance(.01, settings); assert.equal(m.x, stopped); assert.equal(m.directionX, 1); assert.equal(m.frame(settings).cycle.stage, 'walk');
  advance(m, 30); assert.ok(Math.abs(m.x - start) < 1e-9); assert.equal(m.y, 1);
  advance(m, 10); assert.equal(m.directionX, -1);
});

test('Un fotograma que cruza el inicio del descanso o el giro reparte correctamente el movimiento', () => {
  const m = motion(); m.advance(0, settings); m.x = .5; m.cycleTime = 29.95;
  m.advance(.15, settings); assert.ok(Math.abs(m.x - (.5 - 18 * .05 / 1616)) < 1e-9);
  m.x = .5; m.cycleTime = 39.95; m.directionX = -1;
  m.advance(.15, settings); assert.equal(m.directionX, 1); assert.ok(Math.abs(m.x - (.5 + 18 * .1 / 1616)) < 1e-9);
});

test('Pausa congela posición, pose y dirección durante la caminata y el descanso', () => {
  for (const time of [15, 35]) {
    const m = motion(); advance(m, time); const before = m.frame(settings);
    advance(m, 20, { ...settings, paused: true }); assert.deepEqual(m.frame(settings), before);
    advance(m, .1); assert.ok(m.cycleTime > time);
  }
});

test('Cambiar a EduPiramyd reinicia su recorrido y rechaza perfiles de giro incompletos', () => {
  const m = motion(); advance(m, 50); m.setBehavior(pet.behavior);
  assert.equal(m.cycleTime, 0); assert.equal(m.directionX, -1);
  for (const modify of [raw => { raw.behavior.cycle.reverseAfterRest = 'yes'; }, raw => { raw.behavior.cycle.sequence[0].stage = 'idle'; }, raw => { raw.behavior.cycle.sequence.at(-1).stage = 'dead'; }]) {
    const raw = JSON.parse(bytes); modify(raw); assert.throws(() => parsePet(JSON.stringify(raw)));
  }
});
