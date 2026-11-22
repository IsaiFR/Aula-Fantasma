'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { loadLibrary } = require('../src/pet-library.cjs');
const { parsePet, petId, serializePet } = require('../src/pet-package.cjs');
const root = path.join(__dirname, '..');

test('El selector incluye los personajes empaquetados sin duplicar el GIF independiente de Frankenstein', async () => {
  const { entries, unavailable } = await loadLibrary([path.join(root, 'pets'), path.join(root, 'pets')]);
  assert.deepEqual([...entries.values()].map(entry => entry.pet.name), ['Catrina', 'Cuellilargo', 'Edu007', 'EduAlloy', 'EduATrain', 'EduBad', 'EduBot', 'EduCage', 'EduCatrin', 'EduClaus', 'EduConquest', 'EduCookie', 'EduDeep', 'EduDominos', 'EduDonalds', 'EduDoom', 'EduDracula (voz)', 'EduEinstein', 'EduElegante', 'EduElfo', 'EduEve', 'EduF1', 'EduFallout', 'EduFast', 'EduFrankenstein', 'EduGhost', 'EduGhost (voz)', 'EduGrinch', 'EduHalaand', 'EduHellDiver', 'EduHomelander', 'EduJames', 'EduKimi', 'EduLeon', 'EduLuchador', 'EduMark', 'EduMomia (voz)', 'EduMoon', 'EduNoir', 'EduNolan', 'EduNueces', 'EduOxxo', 'EduPiramyd', 'EduPsycho', 'EduReno', 'EduReturnal', 'EduRivet', 'EduScorpion', 'EduScream', 'EduSimi', 'EduSlayer', 'EduSnow', 'EduSoldier', 'EduStarlight', 'EduSteve', 'EduStrading', 'EduStrange', 'EduSus', 'EduWarhammer', 'EduWitch (voz)', 'EduZero', 'EduZombie']);
  assert.equal(unavailable, 0);
  assert.ok([...entries.keys()].every(id => /^[a-f0-9]{64}$/.test(id)));
});

test('Incluye las mascotas importadas y la activa; deduplica por contenido y omite archivos inválidos', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'aula-library-test-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const original = parsePet(fs.readFileSync(path.join(root, 'pets', 'EduGhost.aulapet')));
  const custom = { ...original, name: 'Mi personaje' };
  fs.writeFileSync(path.join(directory, 'custom.aulapet'), serializePet(custom));
  fs.writeFileSync(path.join(directory, 'invalid.aulapet'), 'archivo inválido');
  fs.writeFileSync(path.join(directory, 'duplicated.png'), original.images.open.bytes);
  const { entries, unavailable } = await loadLibrary([path.join(root, 'pets'), directory], custom);
  assert.equal(entries.size, 63); assert.equal(unavailable, 1);
  assert.equal(entries.get(petId(custom)).pet.name, 'Mi personaje');
  assert.ok(![...entries.values()].some(entry => entry.pet.name === 'duplicated'));
});

test('La caché conserva los paquetes iguales y refleja archivos sustituidos y eliminados', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'aula-library-test-'));
  t.after(() => {
    for (const name of fs.readdirSync(directory)) fs.unlinkSync(path.join(directory, name));
    fs.rmdirSync(directory);
  });
  const packageBytes = fs.readFileSync(path.join(root, 'pets', 'EduGhost.aulapet'));
  const first = path.join(directory, 'first.aulapet'), duplicate = path.join(directory, 'duplicate.aulapet');
  fs.writeFileSync(first, packageBytes);
  fs.writeFileSync(duplicate, packageBytes);
  const cache = new Map();
  const read = () => loadLibrary([directory], undefined, { cache });
  const initial = await read();
  assert.equal(initial.entries.size, 1);
  assert.equal(cache.get(first).record, cache.get(duplicate).record);
  assert.equal((await read()).entries.values().next().value, initial.entries.values().next().value);

  fs.unlinkSync(duplicate);
  fs.writeFileSync(first, serializePet({ ...parsePet(packageBytes), name: 'Personaje actualizado' }));
  const updated = await read();
  assert.deepEqual([...updated.entries.values()].map(entry => entry.pet.name), ['Personaje actualizado']);
  assert.equal(cache.has(duplicate), false);
});
