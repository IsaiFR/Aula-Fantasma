'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { parsePet, serializePet, petId } = require('../src/pet-package.cjs');
const { behaviorProfile, greetingDuration, greetingFrame } = require('../src/behavior.cjs');
const { Motion } = require('../src/motion.cjs');
const { DEFAULTS } = require('../src/settings.cjs');
const screamFile = fs.readFileSync(path.join(__dirname, 'fixtures', 'EduScream-v3.aulapet'));
const pet = () => parsePet(screamFile);
const settings = { ...DEFAULTS, mode: 'free', presenceEnabled: false, booInterval: 10 };
const create = () => { const p = pet(); return new Motion({ random: () => .5, animation: p.animation, behavior: p.behavior }); };
const advance = (motion, seconds, config = settings) => { for (let i=0; i<Math.round(seconds*60); i++) motion.advance(1/60, config); return motion.frame(config); };

test('EduScream v3 exporta sus cuatro patas, saludo y pasos sin cambiar los bytes', () => {
  const p = pet(), copy = parsePet(serializePet(p));
  assert.equal(JSON.parse(screamFile).version, 3);
  assert.deepEqual(copy, p); assert.equal(petId(p), petId(copy));
  assert.ok(copy.images.atlas.bytes.equals(fs.readFileSync(path.join(__dirname, '..', 'web', 'eduscream', 'rig-atlas.png'))));
  assert.ok(copy.images.open.bytes.equals(fs.readFileSync(path.join(__dirname, '..', 'web', 'eduscream', 'original-knife.png'))));
  assert.ok(copy.images.limb.bytes.equals(fs.readFileSync(path.join(__dirname, '..', 'web', 'eduscream', 'free-foot.png'))));
  assert.equal(copy.behavior.greeting.text, 'Detrás de ti');
  assert.equal(copy.behavior.rig.layers.length, 5);
});
test('Los paquetes v2 conservan sus bytes y no requieren la pata adicional', () => {
  const p = pet(); delete p.images.limb;
  p.behavior.rig.layers = p.behavior.rig.layers.filter(layer => layer.role !== 'freeFoot');
  const bytes = serializePet(p);
  assert.equal(JSON.parse(bytes).version, 2);
  assert.ok(serializePet(parsePet(bytes)).equals(bytes));
  assert.equal(petId(parsePet(bytes)), petId(p));
});
test('Las patas conservan su proporción y sus suelas están alineadas en reposo', () => {
  const p = pet(), byRole = role => p.behavior.rig.layers.find(layer => layer.role === role);
  assert.equal(p.behavior.walk.footAngle, 0);
  for (const [role, sole, sourceWidth, sourceHeight] of [['leftFoot', 254/265, 1254, 1254], ['rightFoot', 253/265, 1254, 1254], ['freeFoot', 790/800, 1312, 1199]]) {
    const { crop, placement: r, restAngle } = byRole(role);
    assert.equal(restAngle, 0);
    assert.ok(Math.abs(r.y + r.height * sole - .96) < 1e-9, role);
    assert.ok(Math.abs(r.width / r.height - crop.width * sourceWidth / (crop.height * sourceHeight)) < 1e-9, role);
  }
});
test('El brazo mantiene el hombro y la curva del saludo sin estirar la textura', () => {
  const arm = pet().behavior.rig.layers.find(layer => layer.role === 'arm'), r = arm.placement;
  assert.ok(Math.abs(r.x + r.width * arm.pivot.x - .6745) < 1e-9);
  assert.ok(Math.abs(r.y + r.height * arm.pivot.y - .5196) < 1e-9);
  assert.ok(Math.abs(r.width / r.height - arm.crop.width / arm.crop.height) < 1e-9);
  assert.equal(arm.restAngle, 110); assert.equal(arm.raisedAngle, 0);
  assert.deepEqual(pet().behavior.greeting, { text: 'Detrás de ti', raiseSeconds: .65, holdSeconds: 1.9, lowerSeconds: .65 });
});
test('Solo se actualiza la versión incluida de EduScream; se conservan mascotas propias', () => {
  const { bundledUpdate } = require('../src/pet-updates.cjs');
  assert.equal(bundledUpdate('12ee229e28b77a7ef6390225047929dbeae5b2274f4bb48df42e3987f9145d45'), 'EduScream.aulapet');
  assert.equal(bundledUpdate(petId(pet())), 'EduScream.aulapet');
  const custom = pet(); custom.behavior.walk.frequency = 8;
  assert.equal(bundledUpdate(petId(custom)), null);
});
test('EduGhost v1 conserva el formato, los bytes exportados y su identidad anterior', () => {
  const file = fs.readFileSync(path.join(__dirname, '..', 'pets', 'EduGhost.aulapet'));
  const p = parsePet(file);
  assert.equal(p.behavior, undefined); assert.equal(JSON.parse(serializePet(p)).version, 1);
  assert.ok(serializePet(p).equals(file));
  assert.equal(petId(p), require('node:crypto').createHash('sha256').update(file).digest('hex'));
});
test('El saludo interpola subida, postura levantada y bajada antes de quedar en reposo', () => {
  const behavior = pet().behavior, total = greetingDuration(behavior);
  const frameAt = age => greetingFrame(total - age, true, behavior);
  assert.equal(frameAt(0).lift, 0);
  const raising = frameAt(.325); assert.equal(raising.phase, 'raise'); assert.ok(Math.abs(raising.lift - .5) < 1e-9); assert.equal(raising.visible, false);
  const hold = frameAt(1); assert.equal(hold.phase, 'hold'); assert.equal(hold.lift, 1); assert.equal(hold.visible, true);
  const lowering = frameAt(2.875); assert.equal(lowering.phase, 'lower'); assert.ok(Math.abs(lowering.lift - .5) < 1e-9); assert.equal(lowering.visible, false);
  assert.deepEqual(frameAt(total), { phase: 'idle', lift: 0, visible: false, text: 'Detrás de ti' });
});
test('Se detiene durante las tres etapas; solo vuelve a caminar con el cuchillo abajo', () => {
  const motion = create(); advance(motion, .8);
  assert.ok(motion.walkPhase > 0 && motion.walkStrength > .95);
  motion.booNow(settings); const x = motion.x, y = motion.y;
  assert.equal(advance(motion, .3).greeting.phase, 'raise');
  const phase = motion.walkPhase;
  assert.equal(advance(motion, .5).greeting.phase, 'hold');
  assert.ok(motion.walkStrength < .001);
  assert.equal(advance(motion, 2).greeting.phase, 'lower');
  assert.equal(motion.x, x); assert.equal(motion.y, y); assert.equal(motion.walkPhase, phase);
  const after = advance(motion, .6);
  assert.equal(after.greeting.phase, 'idle'); assert.equal(after.greeting.lift, 0);
  assert.notEqual(after.x, x); assert.ok(after.walk.strength > .8);
});
test('Pausar congela el brazo y los pasos, y reanudar conserva la etapa', () => {
  const motion = create(); advance(motion, .5); motion.booNow(settings); advance(motion, .2);
  const before = motion.frame(settings);
  advance(motion, 20, { ...settings, paused: true });
  assert.deepEqual(motion.frame(settings), before);
  assert.ok(advance(motion, .1).greeting.lift > before.greeting.lift);
});
test('Saludo manual no reinicia un gesto activo y cambiar mascota recupera la pose neutra', () => {
  const motion = create(); advance(motion, .5); motion.booNow(settings); advance(motion, 1);
  const remaining = motion.booRemaining; motion.booNow(settings); assert.equal(motion.booRemaining, remaining);
  motion.setBehavior(undefined);
  assert.equal(motion.frame(settings).greeting.phase, 'idle'); assert.equal(motion.behavior.greeting.text, 'BOO!!');
  assert.equal(motion.walkStrength, 0); assert.equal(motion.walkPhase, 0);
});
test('El ciclo de apariciones espera hasta que el brazo termine de bajar', () => {
  const motion = create(), config = { ...settings, presenceEnabled: true, visibleSeconds: 5, awaySeconds: 5 };
  motion.advance(0, config); motion.presence.age = 4.95; motion.booNow(config);
  for(let i=0;i<190;i++) { const f=motion.advance(1/60,config); assert.equal(f.presence.phase, 'visible'); }
  assert.equal(motion.frame(config).greeting.phase, 'lower');
  advance(motion,.15,config); assert.equal(motion.frame(config).presence.phase, 'leaving');
});
test('La caminata se detiene en una esquina y el interruptor de saludo sigue siendo común', () => {
  const motion=create(); advance(motion,1,{...settings,mode:'still',booEnabled:false});
  assert.equal(motion.walkStrength,0); assert.equal(motion.walkPhase,0);
  motion.booNow({...settings,booEnabled:false}); assert.equal(motion.booRemaining,0);
  motion.booNow(settings); assert.ok(motion.booRemaining>0);
  const frame=advance(motion,.1,{...settings,booEnabled:false}); assert.equal(frame.greeting.visible,false); assert.equal(frame.greeting.lift,0);
});
test('Rechaza capas duplicadas, recortes externos, pasos sin atlas y tiempos inválidos', () => {
  const p=pet();
  assert.throws(()=>behaviorProfile({walk:{enabled:true}}), /capas/);
  assert.throws(()=>behaviorProfile({greeting:{holdSeconds:0}}), /rango/);
  assert.throws(()=>behaviorProfile({greeting:{text:'x'.repeat(41)}}), /caracteres/);
  const duplicate=structuredClone(p.behavior); duplicate.rig.layers[0].role='arm'; assert.throws(()=>behaviorProfile(duplicate), /distintas/);
  const outside=structuredClone(p.behavior); outside.rig.layers[0].crop.x=.9; assert.throws(()=>behaviorProfile(outside), /sale/);
  const unknown=structuredClone(p.behavior); unknown.rig.layers[0].script='bad'; assert.throws(()=>behaviorProfile(unknown), /campos/);
  const value=JSON.parse(screamFile); delete value.images.atlas; assert.throws(()=>parsePet(JSON.stringify(value)),/atlas/);
  const missing=JSON.parse(screamFile); delete missing.images.limb; assert.throws(()=>parsePet(JSON.stringify(missing)),/cuarta pata/);
  const old=JSON.parse(screamFile); old.version=2; delete old.images.limb; assert.throws(()=>parsePet(JSON.stringify(old)),/cuarta pata/);
  const missingBody=structuredClone(p.behavior); missingBody.rig.layers=missingBody.rig.layers.filter(layer=>layer.role!=='body'); assert.throws(()=>behaviorProfile(missingBody), /obligatorias/);
});
