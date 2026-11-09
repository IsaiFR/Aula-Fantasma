'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {parsePet,serializePet}=require('../src/pet-package.cjs'),decodePng=require('./png-rgba.cjs');
const root=path.join(__dirname,'..'),assets=path.join(root,'web','edureno'),bytes=fs.readFileSync(path.join(root,'pets','EduReno-Voz.pet')),pet=parsePet(bytes);
const poses=['open','closed','talking','talkingClosed'];
test('EduReno es una mascota de voz autocontenida con cuatro poses y conserva el original de reposo',()=>{
  assert.equal(pet.name,'EduReno');assert.equal(pet.kind,'voice');assert.equal(JSON.parse(bytes).version,6);
  assert.deepEqual(parsePet(serializePet(pet)),pet);
  assert.ok(pet.images.open.bytes.equals(fs.readFileSync(path.join(assets,'reference.png'))));
  assert.equal(new Set(poses.map(k=>pet.images[k].bytes.toString('base64'))).size,4);
  // Conservar el alfa original, incluido posible ruido de exportación de 1/255.
  for(const kind of poses){const png=decodePng(pet.images[kind].bytes);assert.equal(png.width,1254);assert.equal(png.height,1254);assert.ok(png.pixels[3]<=1);assert.ok(png.pixels.some((v,i)=>i%4===3&&v===0));assert.ok(png.pixels.some((v,i)=>i%4===3&&v===255));}
  assert.ok(pet.animation.blink.enabled);assert.deepEqual(pet.animation.blink.regions,[]);
  assert.equal(pet.animation.float.enabled,false);assert.equal(pet.animation.cloth.enabled,false);
});
test('Las expresiones solo modifican ojos y boca: astas, arnés y silueta se conservan',()=>{
  const base=decodePng(pet.images.open.bytes),regions=JSON.parse(fs.readFileSync(path.join(assets,'regions.json')));
  for(const kind of poses.slice(1)){
    const png=decodePng(pet.images[kind].bytes),allowed=[...(kind!=='talking'?regions.eyes:[]),...(kind!=='closed'?regions.mouth:[])];let changes=0;
    for(let y=0;y<1254;y++)for(let x=0;x<1254;x++){
      const at=(y*1254+x)*4;assert.equal(png.pixels[at+3],base.pixels[at+3]);
      if(base.pixels[at+3]<250)continue;
      // El decoder nativo redondea hasta una unidad RGB al premultiplicar alfa parcial.
      const tolerance=base.pixels[at+3]===255?0:1;
      const changed=[0,1,2].some(k=>Math.abs(png.pixels[at+k]-base.pixels[at+k])>tolerance);
      if(changed){changes++;assert.ok(allowed.some(r=>x>=r.x&&x<r.x+r.width&&y>=r.y&&y<r.y+r.height),`${kind}: cambio fuera del rostro ${x},${y}`);}
    }
    assert.ok(changes>1000);
  }
});
test('La boca abierta y los párpados cerrados se combinan independientemente',()=>{
  const p=Object.fromEntries(poses.map(k=>[k,decodePng(pet.images[k].bytes).pixels]));
  const regions=JSON.parse(fs.readFileSync(path.join(assets,'regions.json')));
  for(const [area,a,b] of [['eyes','closed','talkingClosed'],['mouth','talking','talkingClosed']])for(const r of regions[area])for(let y=r.y;y<r.y+r.height;y++)for(let x=r.x;x<r.x+r.width;x++){
    const at=(y*1254+x)*4;for(let k=0;k<4;k++)assert.equal(p[a][at+k],p[b][at+k]);
  }
});
