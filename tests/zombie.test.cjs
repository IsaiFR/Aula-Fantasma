'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {parsePet,serializePet}=require('../src/pet-package.cjs');
const {cycleFrame}=require('../src/cycle.cjs');
const {Motion}=require('../src/motion.cjs');
const {DEFAULTS}=require('../src/settings.cjs');
const {gifInfo}=require('../src/gif.cjs');
const {bundledUpdate}=require('../src/pet-updates.cjs');
const decode=require('./png-rgba.cjs');
const bytes=fs.readFileSync(path.join(__dirname,'..','pets','EduZombie.aulapet')),pet=parsePet(bytes),profile=pet.behavior.cycle;
const settings={...DEFAULTS,mode:'free',size:256,speed:22,presenceEnabled:false,booEnabled:false};
const motion=()=>new Motion({animation:pet.animation,behavior:pet.behavior,random:()=>.5});
test('Las dos bases del usuario permanecen intactas y solo se migra el EduZombie anterior incluido',()=>{
  const hash=bytes=>require('node:crypto').createHash('sha256').update(bytes).digest('hex');
  for(const [name,expected] of [['character-reference.png','bb7146d19d8e3378d03de00df421ccdcb3089b9a83f68b91150cb9812b0f819c'],['grave-reference.png','83c0f8af24e43cee29855ada63e8a0d8ac16524b9c7cc5ed7c50ee94ce39158d']])assert.equal(hash(fs.readFileSync(path.join(__dirname,'..','web','eduzombie',name))),expected);
  assert.equal(bundledUpdate('bf50d60fd6d5beeb0e00350a7a369a8b04ff5f187ffefd25527831f0c0bb91bc'),'EduZombie.aulapet');
  assert.equal(bundledUpdate('a'.repeat(64)),null);
});
test('EduZombie exporta un paquete autocontenido v5, GIF de 33 segundos y hoja de dieciséis poses',()=>{
  assert.equal(JSON.parse(bytes).version,5);assert.ok(serializePet(pet).equals(bytes));
  assert.deepEqual(gifInfo(pet.images.cycle.bytes),{width:256,height:256,frames:107,duration:33});
  assert.ok(pet.images.cycle.bytes.equals(fs.readFileSync(path.join(__dirname,'..','pets','EduZombie.gif'))));
  const sheet=decode(pet.images.frames.bytes);assert.equal(sheet.width,1024);assert.equal(sheet.height,1024);
});
test('Primero lápida, después una pata, salida completa, 24 segundos de pasos, caída y regreso de lápida',()=>{
  for(const [time,frame,stage] of [[0,0,'dead'],[3.1,1,'rise'],[3.7,2,'rise'],[4.5,3,'rise'],[5.2,4,'rise'],[6.1,5,'rise'],[6.7,6,'rise'],[7,6,'walk'],[30.9,11,'walk'],[31.1,12,'fall'],[31.6,13,'fall'],[32.1,14,'fall'],[32.7,15,'fall'],[33,0,'dead'],[66,0,'dead']]){
    const state=cycleFrame(time,profile);assert.equal(state.sheetIndex,frame);assert.equal(state.stage,stage);
  }
  assert.equal(cycleFrame(0,profile).text,'RIP · EduCat');assert.equal(cycleFrame(32.8,profile).text,'RIP · EduCat');
  assert.equal(cycleFrame(8,profile).text,'');assert.equal(profile.sequence.filter(e=>e.stage==='walk').reduce((n,e)=>n+e.seconds,0),24);
});
test('No se desplaza al emerger ni al morir; deambula en ambos ejes durante los pasos y pausa congela el ciclo',()=>{
  const m=motion();m.advance(0,settings);const start={x:m.x,y:m.y};
  for(let i=0;i<690;i++)m.advance(.01,settings);assert.equal(m.x,start.x);assert.equal(m.y,start.y);
  m.cycleTime=8;for(let i=0;i<100;i++)m.advance(.01,settings);assert.notEqual(m.x,start.x);assert.notEqual(m.y,start.y);
  m.cycleTime=31.1;const stop={x:m.x,y:m.y};for(let i=0;i<100;i++)m.advance(.01,settings);assert.equal(m.x,stop.x);assert.equal(m.y,stop.y);
  const before=m.frame({...settings,paused:true});m.advance(5,{...settings,paused:true});assert.deepEqual(m.frame({...settings,paused:true}),before);
});
test('Resucitar ahora adelanta la primera pata y el modo quieto reproduce el ciclo sin recorrer',()=>{
  const m=motion();m.booNow(settings);assert.equal(m.cycleTime,3);assert.equal(m.frame(settings).cycle.sheetIndex,1);
  m.cycleTime=8;m.advance(0,{...settings,mode:'still'});const pos={x:m.x,y:m.y};
  for(let i=0;i<200;i++)m.advance(.01,{...settings,mode:'still'});assert.equal(m.x,pos.x);assert.equal(m.y,pos.y);assert.equal(m.frame(settings).cycle.stage,'walk');
});
test('Los seis pasos son distintos, los bordes transparentes y la lápida queda contenida en su celda',()=>{
  const sheet=decode(pet.images.frames.bytes),poses=new Set();
  const grave=decode(fs.readFileSync(path.join(__dirname,'..','web','eduzombie','grave.png')));
  for(let index=0;index<16;index++) {
    let opaque=0;const crop=Buffer.alloc(256*256*4);
    for(let y=0;y<256;y++)for(let x=0;x<256;x++){
      const source=((Math.floor(index/4)*256+y)*sheet.width+index%4*256+x)*4,target=(y*256+x)*4;
      sheet.pixels.copy(crop,target,source,source+4);if(crop[target+3]>100)opaque++;
      if(x===0||x===255||y===0||y===255)assert.equal(crop[target+3],0);
    }
    assert.ok(opaque>2000);if(index>=6&&index<=11)poses.add(require('node:crypto').createHash('sha256').update(crop).digest('hex'));
    if(index===0)assert.ok(crop.equals(grave.pixels),'La primera pose usa la lápida original preparada, sin letras superpuestas');
  }
  assert.equal(poses.size,6);
});
