'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const { parsePet, serializePet, petId } = require('../src/pet-package.cjs');
const { cycleFrame } = require('../src/cycle.cjs');
const { Motion } = require('../src/motion.cjs');
const { DEFAULTS } = require('../src/settings.cjs');
const { gifInfo } = require('../src/gif.cjs');
const { startServer } = require('../src/server.cjs');
const { petLayout } = require('../web/layout.js');
const { bundledUpdate } = require('../src/pet-updates.cjs');
const bytes = fs.readFileSync(path.join(__dirname,'..','pets','EduFrankenstein.aulapet'));
const pet = parsePet(bytes), profile=pet.behavior.cycle;
const settings={...DEFAULTS,mode:'free',size:256,speed:55,presenceEnabled:false,booEnabled:false};
const motion=()=>new Motion({animation:pet.animation,behavior:pet.behavior,random:()=>0});
function advance(m,seconds,config=settings){for(let i=0;i<Math.round(seconds*100);i++)m.advance(.01,config);return m.frame(config);}
test('EduFrankenstein v5 conserva GIF, hoja y perfil al importar/exportar',()=>{
  assert.equal(JSON.parse(bytes).version,5);assert.ok(serializePet(pet).equals(bytes));
  assert.ok(pet.images.cycle.bytes.equals(fs.readFileSync(path.join(__dirname,'..','pets','EduFrankenstein.gif'))));
  assert.deepEqual(gifInfo(pet.images.cycle.bytes),{width:256,height:256,frames:111,duration:45.75});
});
test('Ciclo: tumbado, rayo con texto exacto, incorporación, pasos, caída y repetición',()=>{
  const stages=[];let time=0;
  for(const entry of profile.sequence){const frame=cycleFrame(time+.001,profile);stages.push(frame.stage);assert.equal(frame.sheetIndex,entry.frame);time+=entry.seconds;}
  assert.deepEqual([...new Set(stages)],['dead','lightning','rise','walk','fall']);
  assert.equal(cycleFrame(10.1,profile).text,'¡Está vivo!');
  assert.equal(cycleFrame(14.9,profile).text,'¡Está vivo!');
  assert.equal(cycleFrame(45.75,profile).index,0);
  assert.equal(cycleFrame(91.5,profile).index,0);
});
test('Duerme exactamente 10 segundos, despierta en 5 y camina durante 30',()=>{
  const duration=stage=>profile.sequence.filter(entry=>stage.includes(entry.stage)).reduce((sum,entry)=>sum+entry.seconds,0);
  assert.equal(duration(['dead']),10);assert.equal(duration(['lightning','rise']),5);
  assert.ok(Math.abs(duration(['walk'])-30)<1e-9);
  assert.equal(cycleFrame(9.999,profile).stage,'dead');assert.equal(cycleFrame(10,profile).stage,'lightning');
  assert.equal(cycleFrame(14.999,profile).stage,'rise');assert.equal(cycleFrame(15,profile).stage,'walk');
  assert.equal(cycleFrame(44.999,profile).stage,'walk');assert.equal(cycleFrame(45,profile).stage,'fall');
});
test('No se desplaza tumbado, durante el rayo, al incorporarse ni al caer',()=>{
  const m=motion();m.advance(0,settings);const initial=m.x;advance(m,14.9);assert.equal(m.x,initial);
  const walk=advance(m,.5);assert.equal(walk.cycle.stage,'walk');assert.notEqual(m.x,initial);
  advance(m,29.8);const fallen=m.x;assert.equal(m.frame(settings).cycle.stage,'fall');advance(m,5);assert.equal(m.x,fallen);
});
test('Recorrer toda la pantalla avanza en X e Y, sin oscilar sobre el mismo sitio',()=>{
  const m=motion();advance(m,15);const before=m.frame(settings);let minX=1,maxX=0,minY=1,maxY=0;
  for(let i=0;i<2990;i++){const f=m.advance(.01,settings);assert.ok(f.x>=0&&f.x<=1&&f.y>=0&&f.y<=1);minX=Math.min(minX,f.x);maxX=Math.max(maxX,f.x);minY=Math.min(minY,f.y);maxY=Math.max(maxY,f.y);}
  assert.ok(maxX-minX>.65);assert.ok(maxY-minY>.65);
  for(const [width,height] of [[2560,1440],[1920,1080],[960,540]]){
    const a=petLayout(width,height,settings,before),b=petLayout(width,height,settings,m.frame(settings));
    assert.ok(Math.abs(b.x-a.x)>(width-256)*.5);assert.ok(Math.abs(b.y-a.y)>(height-256)*.5);
  }
});
test('El recorrido por bordes sigue el perímetro y el modo esquina no se desplaza',()=>{
  const config={...settings,mode:'edges',speed:180},m=motion();advance(m,15,config);const directions=new Set();
  for(let i=0;i<2990;i++){const f=m.advance(.01,config);assert.ok(f.x===0||f.x===1||f.y===0||f.y===1);directions.add(f.facing);}
  assert.equal(directions.size,2);
  const still=motion(),corner={...settings,mode:'still'};still.advance(0,corner);const before=still.frame(corner);advance(still,40,corner);const after=still.frame(corner);assert.equal(after.x,before.x);assert.equal(after.y,before.y);assert.equal(after.cycle.stage,'walk');
});

test('La orientación acompaña el desplazamiento en ambos sentidos y lienzos',()=>{
  assert.equal(profile.mirror,true);
  for(const mode of ['free','edges'])for(const direction of [-1,1]){
    const m=motion(),config={...settings,mode};m.advance(0,config);m.cycleTime=16;
    m.x=.5;m.y=.5;m.directionX=direction;
    if(mode==='edges')m.edgeDistance=direction===1 ? (1920-config.size-2*config.margin)*.5 : (1920-config.size-2*config.margin)*1.5+(1080-config.size-2*config.margin);
    const before=m.frame(config),after=m.advance(.1,config);
    for(const [width,height] of [[1920,1080],[1080,1920]]){
      const a=petLayout(width,height,config,before),b=petLayout(width,height,config,after);
      assert.equal(Math.sign(b.x-a.x),direction);assert.equal(b.facing,direction);
    }
  }
});
test('Pausa congela el fotograma y la posición; el botón resucita y cambiar mascota reinicia',()=>{
  const m=motion();advance(m,20);const before=m.frame(settings);advance(m,20,{...settings,paused:true});assert.deepEqual(m.frame(settings),before);
  m.booNow(settings);assert.equal(m.frame(settings).cycle.stage,'lightning');
  m.setBehavior(pet.behavior);assert.equal(m.frame(settings).cycle.index,0);
});
test('Rechaza tiempos inválidos, celdas inexistentes, texto activo y GIF que no coincide',()=>{
  const invalid=change=>{const raw=JSON.parse(bytes);change(raw);assert.throws(()=>parsePet(JSON.stringify(raw)));};
  invalid(p=>p.behavior.cycle.sequence[0].seconds=-1);
  invalid(p=>p.behavior.cycle.sequence[0].frame=16);
  invalid(p=>p.behavior.cycle.sequence[0].stage='script');
  invalid(p=>p.behavior.cycle.sequence[0].text='\u0000');
  invalid(p=>p.behavior.cycle.sequence[0].seconds=9);
  invalid(p=>p.version=4);
});
test('Solo la versión anterior incluida de Frank se actualiza automáticamente',()=>{
  assert.equal(bundledUpdate('95badc944b15e327f9477851dda35f2774439bb600c9a51a03e67ee951893c31'),'EduFrankenstein.aulapet');
  const previous=parsePet(serializePet({...pet,behavior:{...pet.behavior,cycle:{...profile,mirror:false}}}));
  assert.equal(petId(previous),'6d9f5b9d42c9f242396ee6be82b35444e37906294591da6640d9dbe427cb4514');
  assert.equal(bundledUpdate(petId(previous)),'EduFrankenstein.aulapet');
  assert.equal(bundledUpdate('0'.repeat(64)),null);
});
test('HTTP entrega el GIF completo del ciclo sin caché y sin exponer el paquete',async t=>{
  const server=await startServer({webRoot:path.join(__dirname,'..','web'),getFrame:()=>({}),getAsset:kind=>pet.images[kind],preferredPort:0});t.after(()=>server.close());
  const response=await fetch(server.url+'/asset-cycle');assert.equal(response.status,200);assert.equal(response.headers.get('content-type'),'image/gif');assert.equal(response.headers.get('cache-control'),'no-store');assert.ok(Buffer.from(await response.arrayBuffer()).equals(pet.images.cycle.bytes));
  assert.equal((await fetch(server.url+'/pets/EduFrankenstein.aulapet')).status,404);
});
