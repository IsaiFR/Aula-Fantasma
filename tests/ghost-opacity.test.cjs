'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {ghostOpacityFrame}=require('../src/ghost-opacity.cjs');
const {DEFAULTS,sanitizeSettings}=require('../src/settings.cjs');
const {parsePet,serializePet,petId}=require('../src/pet-package.cjs');
const {bundledUpdate}=require('../src/pet-updates.cjs');
const pet=name=>parsePet(fs.readFileSync(path.join(__dirname,'..','pets',name)));
test('El ciclo conserva las duraciones completas al 100 y 75, transiciones suaves y repite sin deriva',()=>{
  const effects=pet('EduGhost-Voz.pet').effects;
  for(const [time,opacity,phase] of [[0,1,'solid'],[19.99,1,'solid'],[20.4,.875,'fading-out'],[20.8,.75,'faded'],[28.79,.75,'faded'],[29.2,.875,'fading-in'],[29.6,1,'solid']]) {
    const frame=ghostOpacityFrame(time,DEFAULTS,effects);
    assert.ok(Math.abs(frame.opacity-opacity)<1e-10); assert.equal(frame.phase,phase);
  }
  for(let t=0;t<200;t+=.01) {
    const a=ghostOpacityFrame(t,DEFAULTS,effects),b=ghostOpacityFrame(t+29.6*1000,DEFAULTS,effects);
    assert.ok(a.opacity>=.75 && a.opacity<=1); assert.ok(Math.abs(a.opacity-b.opacity)<1e-9);
  }
});
test('Solo EduGhost de voz declara el efecto; los paquetes anteriores conservan identidad y opacidad manual',()=>{
  for(const name of ['EduWitch-Voz.pet','EduDracula-Voz.pet','EduMomia-Voz.pet','EduGhost.aulapet']) assert.equal(ghostOpacityFrame(21,DEFAULTS,pet(name).effects),null);
  const current=pet('EduGhost-Voz.pet');
  assert.deepEqual(parsePet(serializePet(current)),current);
  assert.equal(bundledUpdate('b973e7dec5c75377b1895613f9be1916699ef231b809dcd3d5b172d370d08c39'),'EduGhost-Voz.pet');
  const old=structuredClone(current); delete old.effects;
  // Usar Buffers originales: structuredClone convierte Buffer en Uint8Array.
  old.images=current.images;
  assert.equal(petId(old),'b973e7dec5c75377b1895613f9be1916699ef231b809dcd3d5b172d370d08c39');
  assert.equal(JSON.parse(serializePet(old)).version,7);
  const invalid=JSON.parse(serializePet(current)); invalid.effects.ghostOpacity.fadeSeconds=0;
  assert.throws(()=>parsePet(Buffer.from(JSON.stringify(invalid))),/fuera del rango/);
  invalid.version=7; assert.throws(()=>parsePet(Buffer.from(JSON.stringify(invalid))),/campos no admitidos/);
});
test('Los dos tiempos aceptan segundos enteros entre 1 y 600 y rechazan valores inválidos',()=>{
  assert.deepEqual([sanitizeSettings({ghostSolidSeconds:0,ghostFadedSeconds:999}).ghostSolidSeconds,sanitizeSettings({ghostSolidSeconds:0,ghostFadedSeconds:999}).ghostFadedSeconds],[1,600]);
  const invalid=sanitizeSettings({ghostSolidSeconds:NaN,ghostFadedSeconds:'10'});
  assert.equal(invalid.ghostSolidSeconds,20);assert.equal(invalid.ghostFadedSeconds,8);
  const custom=sanitizeSettings({ghostSolidSeconds:3,ghostFadedSeconds:2});
  assert.equal(ghostOpacityFrame(4,custom,{ghostOpacity:{fadeSeconds:.8}}).opacity,.75);
});
