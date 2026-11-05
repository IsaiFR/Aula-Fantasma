'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { parsePet, serializePet, fromImage, petId, safeFilename, animationProfile, MAX_FILE } = require('../src/pet-package.cjs');
const { Motion } = require('../src/motion.cjs');
const { DEFAULTS } = require('../src/settings.cjs');
const file = fs.readFileSync(path.join(__dirname, '..', 'pets', 'EduGhost.aulapet'));
const raw = () => JSON.parse(file);
const parse = value => parsePet(Buffer.from(JSON.stringify(value)));

test('EduGhost conserva exactamente los dos PNG y su perfil al guardar y cargar', () => {
  const pet = parsePet(file);
  for (const kind of ['open', 'closed']) assert.ok(pet.images[kind].bytes.equals(fs.readFileSync(path.join(__dirname, '..', 'web', 'edughost', `${kind}.png`))));
  assert.deepEqual(parsePet(serializePet(pet)), pet);
  assert.equal(pet.name, 'EduGhost');
  assert.equal(pet.animation.float.enabled, true);
  assert.equal(pet.animation.cloth.enabled, true);
  assert.equal(pet.animation.blink.enabled, true);
  assert.match(petId(pet), /^[a-f0-9]{64}$/);
});
test('Cada personaje configura su flotación y parpadeo sin cambiar BOO ni el recorrido', () => {
  const pet = parsePet(file);
  const profile = animationProfile({ float: { amplitude: 25, frequency: 4 }, blink: { ...pet.animation.blink, intervalMin: .5, intervalMax: .5 } });
  const motion = new Motion({ animation: profile, random: () => 0 });
  const settings = { ...DEFAULTS, mode: 'free', presenceEnabled: false };
  for (let i = 0; i < 34; i++) motion.advance(1 / 60, settings);
  assert.ok(motion.frame(settings).blink > 0);
  assert.equal(motion.frame(settings).bob, Math.sin(motion.elapsed * 4) * 25);
  motion.booNow(settings);
  const before = motion.frame(settings);
  const neutral = animationProfile({ float: { enabled: false } });
  motion.setAnimation(neutral);
  const after = motion.advance(.1, settings);
  assert.equal(after.blink, 0); assert.equal(after.bob, 0);
  assert.equal(after.x, before.x); assert.equal(after.y, before.y); assert.equal(after.boo, true);
  assert.equal(motion.animation.cloth.enabled, false);
});
test('Importar una imagen conserva sus bytes y no aplica ojos o sábana de EduGhost', () => {
  const bytes = parsePet(file).images.open.bytes;
  const pet = fromImage(bytes, 'Otro personaje');
  assert.ok(pet.images.open.bytes.equals(bytes));
  assert.equal(pet.images.closed, undefined);
  assert.equal(pet.animation.blink.enabled, false);
  assert.equal(pet.animation.cloth.enabled, false);
  assert.equal(pet.animation.cloth.tail, null);
  assert.deepEqual(pet.animation.cloth.protectedRegions, []);
});
test('Rechaza versiones futuras, scripts y referencias externas', () => {
  assert.throws(() => parse({ ...raw(), version: 6 }), /versión/);
  assert.throws(() => parse({ ...raw(), script: 'require("fs")' }), /campos/);
  const value = raw(); value.images.open = { url: 'https://example.com/pet.png' };
  assert.throws(() => parse(value), /campos/);
  const second = raw(); second.animation.float.exec = 'calc';
  assert.throws(() => parse(second), /campos/);
});
test('Rechaza datos, firmas y nombres de imagen incorrectos', () => {
  const value = raw(); value.images.open.mime = 'image/svg+xml';
  assert.throws(() => parse(value), /formato/);
  for (const invalid of ['****', 'AAAA=AAA', 'aA==\n', 'aB==']) {
    const value = raw(); value.images.open.dataBase64 = invalid;
    assert.throws(() => parse(value));
  }
  assert.throws(() => parse({ ...raw(), name: '' }), /nombre/);
  assert.throws(() => parsePet('not json'), /leer/);
  assert.throws(() => parsePet(Buffer.alloc(MAX_FILE + 1)), /32 MB/);
});
test('Rechaza perfiles inválidos, máscaras no acotadas y ojos ausentes', () => {
  assert.throws(() => animationProfile({ float: { amplitude: Infinity } }), /rango/);
  assert.throws(() => animationProfile({ float: { enabled: 'true' } }), /booleano/);
  assert.throws(() => animationProfile({ cloth: { fullY: .3, startY: .4 } }), /rango/);
  assert.throws(() => animationProfile({ blink: { intervalMin: 5, intervalMax: 4 } }), /rango/);
  assert.throws(() => animationProfile({ blink: { regions: [{ cx: 2, cy: .5, rx: .1, ry: .1 }] } }), /rango/);
  const value = raw(); delete value.images.closed;
  assert.throws(() => parse(value), /cerrados/);
});
test('Perfiles independientes no comparten regiones modificables ni coordenadas del gato', () => {
  const a = animationProfile(), b = animationProfile();
  a.cloth.protectedRegions.push({ cx: .1, cy: .2, rx: .03, ry: .04 });
  assert.deepEqual(b.cloth.protectedRegions, []);
  const profile = animationProfile({ cloth: { enabled: true, startY: .2, fullY: .7 }, blink: { regions: [{ cx: .1, cy: .2, rx: .03, ry: .04 }] } });
  assert.equal(profile.cloth.tail, null);
  assert.equal(profile.blink.regions[0].cx, .1);
});
test('La identidad del paquete cambia con imágenes o animación y el nombre sugerido es seguro', () => {
  const a = parsePet(file), b = parsePet(file);
  assert.equal(petId(a), petId(b));
  b.animation.float.amplitude = 12; assert.notEqual(petId(a), petId(b));
  assert.equal(safeFilename('../Nuevo:pet'), '.._Nuevo_pet.aulapet');
  assert.equal(safeFilename('CON'), 'Mascota_CON.aulapet');
  assert.equal(safeFilename(''), 'Mascota.aulapet');
});
