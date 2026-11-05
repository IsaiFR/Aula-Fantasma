'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {parsePet,serializePet}=require('../src/pet-package.cjs'),{Motion}=require('../src/motion.cjs'),{DEFAULTS}=require('../src/settings.cjs');
const bytes=fs.readFileSync(path.join(__dirname,'..','pets','EduF1.aulapet')),pet=parsePet(bytes);
const settings={...DEFAULTS,mode:'free',size:300,speed:130,presenceEnabled:false,booEnabled:false};
const simulation=()=>new Motion({animation:pet.animation,behavior:pet.behavior});
test('EduF1 conserva sus dos vistas y tres ruedas en un paquete v11 autocontenido',()=>{
  assert.equal(JSON.parse(bytes).version,11);assert.deepEqual(parsePet(serializePet(pet)),pet);
  assert.equal(pet.name,'EduF1');assert.equal(pet.images.atlas.bytes.readUInt32BE(16),1024);
  for(const side of ['left','right'])assert.equal(pet.behavior.vehicle.views[side].wheels.length,3);
  assert.notDeepEqual(pet.behavior.vehicle.views.left.crop,pet.behavior.vehicle.views.right.crop);
});
test('Recorre ambos ejes, gira de forma gradual y permanece dentro de los límites',()=>{
  const m=simulation(),headings=new Set();let previous=m.vehicle.heading,turned=false,minX=1,maxX=0,minY=1,maxY=0;
  for(let i=0;i<60*120;i++){
    const f=m.advance(1/60,settings),delta=Math.atan2(Math.sin(f.vehicle.heading-previous),Math.cos(f.vehicle.heading-previous));
    assert.ok(Math.abs(delta)<=pet.behavior.vehicle.turnRate/60+1e-8);
    assert.ok(f.x>=0&&f.x<=1&&f.y>=0&&f.y<=1);
    minX=Math.min(minX,f.x);maxX=Math.max(maxX,f.x);minY=Math.min(minY,f.y);maxY=Math.max(maxY,f.y);
    headings.add(f.facing);turned ||= Math.abs(f.vehicle.steering)>.01;previous=f.vehicle.heading;
  }
  assert.ok(maxX-minX>.7&&maxY-minY>.7);assert.deepEqual([...headings].sort(),[-1,1]);assert.ok(turned);
});
test('Las ruedas dependen de la distancia: velocidad, pausa y esquina se respetan',()=>{
  const m=simulation(),fast=simulation();m.advance(.1,settings);fast.advance(.1,{...settings,speed:65});
  assert.ok(Math.abs(m.vehicle.wheelAngle-2*fast.vehicle.wheelAngle)<1e-9);
  const before={...m.vehicle},position={x:m.x,y:m.y};
  for(let i=0;i<100;i++)m.advance(.1,{...settings,paused:true});
  assert.deepEqual(m.vehicle,before);assert.deepEqual({x:m.x,y:m.y},position);
  for(let i=0;i<100;i++)m.advance(.1,{...settings,mode:'still'});
  assert.equal(m.vehicle.wheelAngle,before.wheelAngle);assert.equal(m.vehicle.moving,false);assert.equal(m.x,1);assert.equal(m.y,1);
  m.advance(.1,settings);assert.notEqual(m.vehicle.wheelAngle,before.wheelAngle);
});
test('El vehículo admite bordes y rechaza ruedas externas, motores mezclados y versiones falsas',()=>{
  const m=simulation();for(let i=0;i<500;i++){const f=m.advance(.1,{...settings,mode:'edges'});assert.ok(f.x===0||f.x===1||f.y===0||f.y===1);}
  const invalid=mutate=>{const manifest=JSON.parse(bytes);mutate(manifest);assert.throws(()=>parsePet(Buffer.from(JSON.stringify(manifest))));};
  invalid(p=>p.behavior.vehicle.views.left.wheels[0].cx=2);
  invalid(p=>p.behavior.vehicle.views.left.wheels[0].rx=NaN);
  invalid(p=>p.behavior.walk.enabled=true);
  invalid(p=>p.version=2);
  invalid(p=>p.kind='voice');
  invalid(p=>p.behavior.vehicle.turnRate=50);
  invalid(p=>p.animation.float.enabled=true);
});
