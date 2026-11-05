'use strict';
const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), crypto = require('node:crypto');
const { draculaBatFrame } = require('../src/dracula-bat.cjs');
const { DEFAULTS, sanitizeSettings } = require('../src/settings.cjs');
const { parsePet, serializePet, petId } = require('../src/pet-package.cjs');
const { bundledUpdate } = require('../src/pet-updates.cjs');
const read = name => parsePet(fs.readFileSync(require('node:path').join(__dirname, '..', 'pets', name)));
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
test('EduDracula conserva exactamente sus cuatro poses, animación e identidad original al retirar la adición', () => {
  const p = read('EduDracula-Voz.pet');
  for (const [kind, expected] of Object.entries({open:'60daab5c1912e4cb10908fd2d59d8c4b51fd3549c406e1da787f75029162e5c7',closed:'2090843e5c9b86bd849151c80eeb444b3ada6ad7b4170414a8f8cb8ac43fed30',talking:'07fba6ce4be6ddf215423ea5be9f85756d8b9c05245dcfede963e384a426f80a',talkingClosed:'a8e278ae9cefdfe4ca294daff4c93992d9bf162e2006df715b8b48ec73e01479'})) assert.equal(hash(p.images[kind].bytes), expected);
  assert.equal(hash(JSON.stringify(p.animation)), 'ebfb2b791ae0a64835485e10bbba01e2bd5bbf570ad44cab4652b93217fca4aa');
  assert.deepEqual(parsePet(serializePet(p)), p);
  const original = {...p, images:{...p.images}}; for (const kind of ['bat','batOpen','batClosed','batTalkingClosed']) delete original.images[kind]; delete original.effects;
  assert.equal(petId(original), 'dc0c953fd5c22bd51873720c6468474983ac6dd99f5ca64e5fa6ce71227c9914');
  assert.equal(bundledUpdate(petId(original)), 'EduDracula-Voz.pet');
});
test('El ciclo conserva tiempos completos, transforma suavemente y se repite sin deriva', () => {
  const effects = read('EduDracula-Voz.pet').effects;
  for (const [time, mix, phase] of [[0,0,'dracula'],[19.99,0,'dracula'],[20.4,.5,'transforming'],[20.81,1,'bat'],[28.79,1,'bat'],[29.2,.5,'returning'],[29.6,0,'dracula']]) {
    const a = draculaBatFrame(time, DEFAULTS, effects), b = draculaBatFrame(time + 29.6 * 1000, DEFAULTS, effects);
    assert.ok(Math.abs(a.mix - mix) < 1e-9); assert.equal(a.phase, phase); assert.ok(Math.abs(a.mix - b.mix) < 1e-9);
  }
  assert.equal(draculaBatFrame(NaN, DEFAULTS, effects).phase,'dracula');
  assert.equal(draculaBatFrame(-50, DEFAULTS, effects).phase,'dracula');
});
test('Desactivar vuelve a Drácula y el efecto queda limitado al paquete que lo declara', () => {
  const effect = read('EduDracula-Voz.pet').effects;
  const state = draculaBatFrame(23, {...DEFAULTS,draculaBatEnabled:false},effect);
  assert.equal(state.phase,'dracula'); assert.equal(state.mix,0); assert.equal(state.smoke,0);
  for (const name of ['EduGhost-Voz.pet','EduWitch-Voz.pet','EduMomia-Voz.pet','EduGhost.aulapet']) assert.equal(draculaBatFrame(23,DEFAULTS,read(name).effects),null);
});
test('Los controles admiten segundos de 1 a 600 y el interruptor solo acepta booleanos', () => {
  const a = sanitizeSettings({draculaSeconds:0,draculaBatSeconds:999,draculaBatEnabled:false});
  assert.equal(a.draculaSeconds,1); assert.equal(a.draculaBatSeconds,600); assert.equal(a.draculaBatEnabled,false);
  const b = sanitizeSettings({draculaSeconds:NaN,draculaBatSeconds:'4',draculaBatEnabled:'false'});
  assert.equal(b.draculaSeconds,20); assert.equal(b.draculaBatSeconds,8); assert.equal(b.draculaBatEnabled,true);
});
test('El importador exige recurso PNG, parámetros válidos y formato v9 para la transformación', () => {
  const original = JSON.parse(serializePet(read('EduDracula-Voz.pet')));
  for (const mutate of [p=>delete p.images.bat,p=>p.version=8,p=>p.effects.draculaBat.wingLeft=.6,p=>p.effects.draculaBat.transitionSeconds=0,p=>delete p.effects]) {
    const p = structuredClone(original); mutate(p); assert.throws(()=>parsePet(Buffer.from(JSON.stringify(p))));
  }
  assert.equal(JSON.parse(serializePet(read('EduGhost-Voz.pet'))).version,8);
});
test('El murciélago conserva las cuatro poses en v10 y sigue importando la primera versión v9', () => {
  const current=read('EduDracula-Voz.pet'), manifest=JSON.parse(serializePet(current));
  assert.equal(manifest.version,10);
  const poses=['batOpen','bat','batClosed','batTalkingClosed'].map(kind=>current.images[kind]);
  assert.ok(poses.every(image=>image.mime==='image/png'));
  assert.equal(new Set(poses.map(image=>hash(image.bytes))).size,4);
  for(const kind of ['batOpen','batClosed','batTalkingClosed']) {
    const invalid=structuredClone(manifest); delete invalid.images[kind];
    assert.throws(()=>parsePet(Buffer.from(JSON.stringify(invalid))),/cuatro poses/);
  }
  const old={...current,images:{...current.images}};
  for(const kind of ['batOpen','batClosed','batTalkingClosed']) delete old.images[kind];
  assert.equal(JSON.parse(serializePet(old)).version,9);
  assert.equal(petId(old),'293983cf3fccd0c570afc47d51a08f28bb034708532f5df01f04adc2632f761f');
  assert.equal(bundledUpdate(petId(old)),'EduDracula-Voz.pet');
});
