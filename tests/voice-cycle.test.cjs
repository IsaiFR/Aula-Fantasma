'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { VOICE_CYCLES, voiceCycleFrame } = require('../src/voice-cycle.cjs');
const { parsePet, serializePet, petId } = require('../src/pet-package.cjs');
const { bundledUpdate } = require('../src/pet-updates.cjs');
const read = name => fs.readFileSync(path.join(__dirname, '..', 'pets', `${name}-Voz.pet`));

test('Cada acción de voz empieza después de la espera, regresa a reposo y se repite', () => {
  for (const cycle of Object.values(VOICE_CYCLES)) {
    const { action, idleSeconds, activeSeconds } = cycle;
    const period = idleSeconds + activeSeconds;
    assert.equal(voiceCycleFrame(idleSeconds - .01, cycle), null);
    assert.equal(voiceCycleFrame(NaN, cycle), null);
    assert.deepEqual(voiceCycleFrame(idleSeconds, cycle), { action, time: 0, progress: 0 });
    assert.deepEqual(voiceCycleFrame(idleSeconds + activeSeconds / 2, cycle), { action, time: activeSeconds / 2, progress: .5 });
    assert.equal(voiceCycleFrame(period, cycle), null);
    assert.deepEqual(voiceCycleFrame(period + idleSeconds, cycle), { action, time: 0, progress: 0 });
  }
  assert.equal(voiceCycleFrame(45, undefined), null);
});

test('Los ciclos vigentes se conservan en la exportación y reconocen el paquete incluido anterior', () => {
  for (const [name, cycle] of Object.entries(VOICE_CYCLES)) {
    const bytes = read(name), pet = parsePet(bytes);
    assert.equal(JSON.parse(bytes).version, 15);
    assert.deepEqual(pet.effects.voiceCycle, cycle);
    assert.deepEqual(parsePet(serializePet(pet)), pet);
    const { effects, ...previous } = pet;
    assert.equal(bundledUpdate(petId(previous)), `${name}-Voz.pet`);
  }
});

test('EduReturnal recupera el paquete de voz y las selecciones del ciclo retirado', () => {
  const pet = parsePet(read('EduReturnal'));
  assert.equal(pet.effects, undefined);
  const legacy = { ...pet, effects: { voiceCycle: { action: 'parasites', idleSeconds: 20, activeSeconds: 6.5 } } };
  const exported = parsePet(serializePet(legacy));
  assert.equal(bundledUpdate(petId(exported)), 'EduReturnal-Voz.pet');
  assert.equal(voiceCycleFrame(23, exported.effects.voiceCycle), null);
});

test('El formato v15 admite solo acciones declaradas, tiempos acotados y cuatro poses', () => {
  for (const mutate of [p => delete p.effects, p => { p.effects.voiceCycle.action = 'unknown'; },
    p => { p.effects.voiceCycle.idleSeconds = 0; }, p => { p.effects.voiceCycle.activeSeconds = 30; },
    p => { p.effects.voiceCycle.script = 'other.js'; }, p => { delete p.images.talkingClosed; }]) {
    const manifest = JSON.parse(read('EduZero'));
    mutate(manifest);
    assert.throws(() => parsePet(JSON.stringify(manifest)));
  }
});
