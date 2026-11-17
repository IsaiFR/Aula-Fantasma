'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const { parsePet, serializePet } = require('../src/pet-package.cjs');
const { Motion } = require('../src/motion.cjs');
const { DEFAULTS } = require('../src/settings.cjs');
const { gifInfo } = require('../src/gif.cjs');
const decode = require('./png-rgba.cjs');
const root = path.join(__dirname,'..'), bytes = fs.readFileSync(path.join(root,'pets','Cuellilargo.aulapet'));
const pet = parsePet(bytes), sheet = decode(pet.images.frames.bytes), size = 512;
const hash = data => crypto.createHash('sha256').update(data).digest('hex');
function region(frame,x,y,width,height) {
  const rows = [], left = frame % 6 * size + x, top = Math.floor(frame / 6) * size + y;
  for (let row = top; row < top + height; row++) rows.push(sheet.pixels.subarray((row * sheet.width + left)*4,(row * sheet.width + left + width)*4));
  return Buffer.concat(rows);
}
test('Cuellilargo conserva el adjunto y se exporta completo con 24 pasos transparentes', () => {
  assert.equal(hash(fs.readFileSync(path.join(root,'web','cuellilargo','reference.png'))),'3157d6e9626758c6de9641a735d049baaaba867a5dd9262842eda21ffbda729c');
  assert.equal(pet.name,'Cuellilargo'); assert.ok(serializePet(pet).equals(bytes));
  assert.deepEqual(gifInfo(pet.images.cycle.bytes),{width:512,height:512,frames:24,duration:1.92});
  assert.ok(pet.behavior.cycle.sequence.every(frame => frame.stage === 'walk' && !frame.text));
  for (let frame = 0; frame < 24; frame++) {
    for (const border of [region(frame,0,0,size,1),region(frame,0,size-1,size,1),region(frame,0,0,1,size),region(frame,size-1,0,1,size)]) {
      assert.ok(border.every((value,i)=>i%4!==3 || !value),`Borde recortado en ${frame}`);
    }
  }
});
test('Las cuatro patas cambian sus píxeles y permanecen presentes durante el ciclo', () => {
  for (const [name,x,width] of [['trasera cercana',143,50],['trasera lejana',200,36],['delantera cercana',234,48],['delantera lejana',307,61]]) {
    const crops = Array.from({length:24},(_,frame)=>region(frame,x,430,width,72));
    assert.ok(crops.every(data=>data.some((value,i)=>i%4===3 && value>200)),`${name} ausente`);
    assert.ok(new Set(crops.map(hash)).size >= 16,`${name} inmóvil`);
  }
});
test('La caminata se desplaza, repite el ciclo y se congela por completo al pausar', () => {
  const m = new Motion({random:()=>.5,animation:pet.animation,behavior:pet.behavior});
  const settings = {...DEFAULTS,presenceEnabled:false,mode:'free',booEnabled:false};
  const start = m.frame(settings); for (let i=0;i<24;i++) m.advance(.08,settings);
  assert.equal(m.frame(settings).cycle.index,0); assert.notEqual(m.x,start.x);
  const frozen = m.frame(settings); m.advance(.5,{...settings,paused:true}); assert.deepEqual(m.frame(settings),frozen);
});
