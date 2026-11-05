'use strict';
const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const { parsePet, serializePet, petId } = require('../src/pet-package.cjs');
const { behaviorProfile } = require('../src/behavior.cjs');
const { flipbookFrame } = require('../src/flipbook.cjs');
const { Motion } = require('../src/motion.cjs');
const { petLayout } = require('../web/layout.js');
const { DEFAULTS } = require('../src/settings.cjs');
const { startServer } = require('../src/server.cjs');
const { gifInfo } = require('../src/gif.cjs');
const petFile = fs.readFileSync(path.join(__dirname, '..', 'pets', 'EduScream.aulapet'));
const pet = () => parsePet(petFile);
const settings = { ...DEFAULTS, size: 180, speed: 30, booInterval: 30, presenceEnabled: false };
const create = () => { const p = pet(); return new Motion({ behavior: p.behavior, animation: p.animation, random: () => 0 }); };
const advance = (m, seconds, config = settings) => { for (let i = 0; i < Math.round(seconds * 60); i++) m.advance(1/60, config); return m.frame(config); };
test('El paquete GIF v4 conserva imágenes, perfiles y los bytes de sus dos GIF', () => {
  const p = pet(); assert.equal(JSON.parse(petFile).version, 4);
  assert.deepEqual(parsePet(serializePet(p)), p); assert.ok(serializePet(p).equals(petFile));
  assert.equal(p.behavior.rig, null); assert.equal(p.behavior.flipbook.size, 180);
  for (const [kind, name] of [['walk', 'EduScream.gif'], ['greeting', 'EduScream_Saludo.gif']]) {
    const data = fs.readFileSync(path.join(__dirname, '..', 'web', 'eduscream', name));
    assert.ok(p.images[kind].bytes.equals(data)); assert.equal(data.readUInt16LE(6), 180); assert.equal(data.readUInt16LE(8), 180);
  }
  assert.notEqual(petId(p), petId(parsePet(fs.readFileSync(path.join(__dirname, 'fixtures', 'EduScream-v3.aulapet')))));
});
test('El contenedor GIF tiene 8 pasos, 15 poses, transparencia y duración completa', () => {
  const p=pet();assert.deepEqual(gifInfo(p.images.walk.bytes),{width:180,height:180,frames:8,duration:.8});
  const info=gifInfo(p.images.greeting.bytes);assert.equal(info.frames,15);assert.ok(Math.abs(info.duration-3.4)<1e-8);
  assert.throws(()=>gifInfo(p.images.walk.bytes.subarray(0,30)),/incompleto/);
  const invalid=Buffer.from(p.images.walk.bytes);invalid.writeUInt16LE(1,6);assert.throws(()=>gifInfo(invalid),/válido/);
});
test('El saludo GIF empieza cada 30 segundos, sin variación aleatoria', () => {
  const m = create(); m.advance(0, settings); assert.equal(m.booIn, 30);
  const starts = []; let previous = false;
  for (let i=1;i<=61*60;i++) { const frame=m.advance(1/60,settings); if(frame.boo && !previous) starts.push(i/60); previous=frame.boo; }
  assert.equal(starts.length, 2); assert.ok(Math.abs(starts[0]-30) < .02); assert.ok(Math.abs(starts[1]-60) < .04);
});
test('180 px y 30 px/s en bordes de escritorio y OBS con diferentes resoluciones', () => {
  const m=create(); m.advance(0,settings); const before=m.frame(settings), after=advance(m,1);
  for (const [w,h] of [[2560,1440],[1920,1080],[1280,720],[960,540]]) {
    const a=petLayout(w,h,settings,before), b=petLayout(w,h,settings,after);
    assert.equal(a.size,180); assert.ok(Math.abs(Math.hypot(b.x-a.x,b.y-a.y)-30)<1e-8); assert.equal(b.facing,-1);
  }
});
test('El movimiento libre mantiene magnitud 30 px/s y orienta la imagen tras rebotar', () => {
  const config={...settings,mode:'free'}, m=create(); m.advance(0,config);
  const before=m.frame(config), after=advance(m,1,config);
  for(const [w,h] of [[2560,1440],[1920,1080]]) {
    const a=petLayout(w,h,config,before), b=petLayout(w,h,config,after);
    assert.ok(Math.abs(Math.hypot(b.x-a.x,b.y-a.y)-30)<1e-8); assert.equal(b.facing,-1);
    const bounce=petLayout(w,h,config,{...after,pixelRoute:{...after.pixelRoute,x:0,distance:30}}); assert.equal(bounce.facing,1);
  }
});
test('Pausa y saludo congelan la distancia y los fotogramas; termina bajando y continúa', () => {
  const m=create(); advance(m,1); m.booNow(settings); const distance=m.pixelDistance;
  advance(m,.8); assert.equal(m.frame(settings).greeting.phase,'hold'); assert.equal(m.pixelDistance,distance);
  const before=m.frame(settings); advance(m,10,{...settings,paused:true}); assert.deepEqual(m.frame(settings),before);
  advance(m,3); assert.equal(m.frame(settings).greeting.phase,'idle'); assert.ok(m.pixelDistance>distance);
});
test('El mismo orden de poses GIF y PNG sube y baja sin invertir las patas', () => {
  const config=pet().behavior.flipbook, frame={walk:{phase:0,strength:1},greeting:{phase:'idle',lift:0}};
  for(let i=0;i<8;i++) { frame.walk.phase=i*2*Math.PI/8+.001; assert.equal(flipbookFrame(frame,config).index,i); }
  frame.greeting={phase:'hold',lift:1}; assert.deepEqual(flipbookFrame(frame,config),{clip:'greeting',index:7,sheetIndex:15});
  frame.greeting={phase:'lower',lift:0}; assert.deepEqual(flipbookFrame(frame,config),{clip:'greeting',index:14,sheetIndex:8});
});
test('Rechaza GIF incompleto, hoja insuficiente, mezcla de capas y formato antiguo', () => {
  const raw=JSON.parse(petFile); delete raw.images.greeting; assert.throws(()=>parsePet(JSON.stringify(raw)),/dos GIF/);
  const old=JSON.parse(petFile); old.version=3; delete old.images.walk; delete old.images.greeting; delete old.images.frames; assert.throws(()=>parsePet(JSON.stringify(old)),/v4/);
  const behavior=pet().behavior; behavior.flipbook.rows=1; assert.throws(()=>behaviorProfile(behavior),/faltan fotogramas/);
});
test('Sirve ambos GIF y los fotogramas por recursos autorizados sin caché', async t => {
  const p=pet(), server=await startServer({webRoot:path.join(__dirname,'..','web'),getFrame:()=>({}),getAsset:kind=>p.images[kind],preferredPort:0}); t.after(()=>server.close());
  for(const [route,kind] of [['/asset-walk','walk'],['/asset-greeting','greeting'],['/asset-frames','frames']]) {
    const response=await fetch(server.url+route); assert.equal(response.status,200); assert.equal(response.headers.get('content-type'),p.images[kind].mime); assert.equal(response.headers.get('cache-control'),'no-store'); assert.ok(Buffer.from(await response.arrayBuffer()).equals(p.images[kind].bytes));
  }
});
