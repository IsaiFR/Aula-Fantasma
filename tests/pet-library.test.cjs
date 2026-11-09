'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { loadLibrary } = require('../src/pet-library.cjs');
const { parsePet, petId, serializePet } = require('../src/pet-package.cjs');
const root = path.join(__dirname, '..');

test('El selector incluye los personajes empaquetados sin duplicar el GIF independiente de Frankenstein', () => {
  const { entries, unavailable } = loadLibrary([path.join(root, 'pets'), path.join(root, 'pets')]);
  assert.deepEqual([...entries.values()].map(entry => entry.pet.name), ['Catrina', 'EduCatrin', 'EduClaus', 'EduCookie', 'EduDominos', 'EduDonalds', 'EduDoom', 'EduDracula (voz)', 'EduEinstein', 'EduElfo', 'EduF1', 'EduFast', 'EduFrankenstein', 'EduGhost', 'EduGhost (voz)', 'EduGrinch', 'EduKimi', 'EduMomia (voz)', 'EduMoon', 'EduNueces', 'EduOxxo', 'EduPiramyd', 'EduReno', 'EduRivet', 'EduScream', 'EduSnow', 'EduStrange', 'EduWitch (voz)', 'EduZombie']);
  assert.equal(unavailable, 0);
  assert.ok([...entries.keys()].every(id => /^[a-f0-9]{64}$/.test(id)));
});

test('Incluye las mascotas importadas y la activa; deduplica por contenido y omite archivos inválidos', t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'aula-library-test-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const original = parsePet(fs.readFileSync(path.join(root, 'pets', 'EduGhost.aulapet')));
  const custom = { ...original, name: 'Mi personaje' };
  fs.writeFileSync(path.join(directory, 'custom.aulapet'), serializePet(custom));
  fs.writeFileSync(path.join(directory, 'invalid.aulapet'), 'archivo inválido');
  fs.writeFileSync(path.join(directory, 'duplicated.png'), original.images.open.bytes);
  const { entries, unavailable } = loadLibrary([path.join(root, 'pets'), directory], custom);
  assert.equal(entries.size, 30); assert.equal(unavailable, 1);
  assert.equal(entries.get(petId(custom)).pet.name, 'Mi personaje');
  assert.ok(![...entries.values()].some(entry => entry.pet.name === 'duplicated'));
});
