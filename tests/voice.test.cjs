'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { VoiceGate } = require('../src/voice.cjs');
const { DEFAULTS, sanitizeSettings } = require('../src/settings.cjs');
const { parsePet, serializePet, petId } = require('../src/pet-package.cjs');
const { loadLibrary } = require('../src/pet-library.cjs');
const { decodeTexture } = require('../scripts/convert-veado.cjs');
const decodePng = require('./png-rgba.cjs');
const root = path.join(__dirname, '..');

test('La voz ignora ruido, usa histéresis y respeta la espera al cerrar la boca', () => {
  const gate = new VoiceGate(), settings = { ...DEFAULTS, micEnabled: true, micThreshold: -30, micRelease: 200 };
  gate.sample(.01, 0, settings); assert.equal(gate.frame(0, settings).speaking, false);
  gate.sample(.04, 20, settings); assert.equal(gate.frame(20, settings).speaking, true);
  gate.sample(.02, 100, settings); assert.equal(gate.frame(100, settings).speaking, true);
  gate.sample(0, 250, settings); assert.equal(gate.frame(299, settings).speaking, true);
  assert.equal(gate.frame(301, settings).speaking, false);
  gate.sample(.02, 302, settings); assert.equal(gate.frame(302, settings).speaking, false);
});
test('Apagar o perder muestras cierra la boca; niveles inválidos no cambian el estado', () => {
  const gate = new VoiceGate(), settings = { ...DEFAULTS, micEnabled: true };
  for (const value of [NaN, Infinity, -1, 1.1, {}, '1']) assert.equal(gate.sample(value, 0, settings), false);
  gate.sample(.8, 0, settings); assert.equal(gate.frame(100, settings).speaking, true);
  assert.deepEqual(gate.frame(501, settings), { speaking: false, level: 0 });
  gate.sample(.8, 600, settings); assert.deepEqual(gate.frame(601, { ...settings, micEnabled: false }), { speaking: false, level: 0 });
  assert.equal(gate.frame(602, settings).speaking, false);
});
test('Con espera cero mantiene la boca abierta entre muestras fuertes y cierra al llegar silencio', () => {
  const gate = new VoiceGate(), settings = { ...DEFAULTS, micEnabled: true, micRelease: 0 };
  gate.sample(.5, 0, settings); assert.equal(gate.frame(25, settings).speaking, true);
  gate.sample(0, 30, settings); assert.equal(gate.frame(31, settings).speaking, false);
});
test('Preferencias de audio acotadas, apagadas por defecto e independientes del recorrido', () => {
  assert.equal(DEFAULTS.micEnabled, false);
  const s = sanitizeSettings({ micEnabled: true, micThreshold: -100, micRelease: 9000, micDeviceId: 'usb-device', size: 240 });
  assert.equal(s.micThreshold, -70); assert.equal(s.micRelease, 1000); assert.equal(s.micDeviceId, 'usb-device'); assert.equal(s.size, 240);
  assert.equal(sanitizeSettings({ micDeviceId: '\n' }, s).micDeviceId, 'usb-device');
});
test('Los cuatro .pet de Halloween conservan cuatro poses transparentes distintas al exportar', () => {
  for (const name of ['EduWitch', 'EduDracula', 'EduGhost', 'EduMomia']) {
    const bytes = fs.readFileSync(path.join(root, 'pets', `${name}-Voz.pet`)), p = parsePet(bytes);
    assert.equal(p.kind, 'voice'); assert.equal(p.name, `${name} (voz)`);
    assert.equal(p.animation.blink.enabled, true); assert.equal(p.animation.blink.duration, .15);
    assert.deepEqual(parsePet(serializePet(p)), p);
    const poses = ['open','talking','closed','talkingClosed'].map(kind => { const image=p.images[kind]; const png = decodePng(image.bytes); assert.equal(png.width, 1254); assert.equal(png.height, 1254); assert.equal(png.pixels[3], 0); assert.ok(png.pixels.some((v, i) => i % 4 === 3 && v === 255)); return image.bytes.toString('base64'); });
    assert.equal(new Set(poses).size, 4);
    const broken = JSON.parse(bytes); delete broken.images.talkingClosed;
    assert.throws(() => parsePet(Buffer.from(JSON.stringify(broken))), /parpadeo/);
  }
});
test('La biblioteca importa .pet y .aulapet sin duplicar ni interpretar .pet como imagen', t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'aula-voice-test-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const bytes = fs.readFileSync(path.join(root, 'pets', 'EduWitch-Voz.pet'));
  fs.writeFileSync(path.join(directory, 'witch.pet'), bytes); fs.writeFileSync(path.join(directory, 'duplicate.aulapet'), bytes);
  fs.writeFileSync(path.join(directory, 'broken.pet'), 'not JSON');
  const library = loadLibrary([directory]); assert.equal(library.entries.size, 1); assert.equal(library.unavailable, 1);
  assert.ok(library.entries.has(petId(parsePet(bytes))));
});
test('VDD decodifica canales constantes, deltas, transparencia y rechaza truncados', () => {
  // Dos píxeles: alpha 0,255; el RGB omite el primer píxel transparente.
  const header = Buffer.alloc(12); header.writeUInt32LE(2); header.writeUInt32LE(1, 4); header.write('VDD.', 8);
  const lengths = Buffer.alloc(16); lengths.writeUInt32LE(1); lengths.writeUInt32LE(1, 4); lengths.writeUInt32LE(0xffffff80, 8); lengths.writeUInt32LE(0xffffff20, 12);
  const word = bits => { const b = Buffer.alloc(4); let n = 0; [...bits].forEach((bit, i) => { n |= Number(bit) << i; }); b.writeUInt32LE(n >>> 0); return b; };
  // alpha: +1, -1 (255 -> 0 -> 255); R: +2. Low-order bit first.
  const decoded = decodeTexture(Buffer.concat([header, lengths, word('11011100'), word('1111')]));
  assert.deepEqual([...decoded.rgba], [0, 128, 32, 0, 2, 128, 32, 255]);
  assert.throws(() => decodeTexture(Buffer.concat([header, lengths])), /incompleto/);
});
