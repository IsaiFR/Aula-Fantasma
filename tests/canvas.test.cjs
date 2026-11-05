'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const { canvasInfo, isCanvasFormat } = require('../src/canvas.cjs');
const { petLayout } = require('../web/layout.js');
const { DEFAULTS } = require('../src/settings.cjs');
const { parsePet, serializePet, petId } = require('../src/pet-package.cjs');
const { bundledUpdate } = require('../src/pet-updates.cjs');
test('Los formatos tienen dimensiones válidas y el lienzo vertical conserva tamaño y límites', () => {
  assert.deepEqual(canvasInfo('9:16'), { format:'9:16',width:1080,height:1920 });
  assert.equal(isCanvasFormat('4:3'),false); assert.equal(isCanvasFormat('__proto__'),false);
  assert.equal(canvasInfo('incorrecto').width,1920);
  for(const format of ['16:9','9:16']) {
    const canvas=canvasInfo(format);
    for(const [x,y] of [[0,0],[0,1],[1,0],[1,1]]) {
      const full=petLayout(canvas.width,canvas.height,{...DEFAULTS,size:256},{x,y,bob:0,canvas});
      const preview=petLayout(canvas.width/4,canvas.height/4,{...DEFAULTS,size:256},{x,y,bob:0,canvas},'preview');
      assert.equal(full.size,256); assert.equal(preview.size,64);
      assert.ok(full.x>=0 && full.y>=0 && full.x+full.size<=canvas.width && full.y+full.size<=canvas.height);
      assert.equal(full.x/4,preview.x); assert.equal(full.y/4,preview.y);
    }
  }
});
test('EduGhost de voz anima la sábana en v8 sin alterar ninguno de los cuatro PNG originales', () => {
  const bytes=fs.readFileSync(path.join(__dirname,'..','pets','EduGhost-Voz.pet')),pet=parsePet(bytes);
  assert.equal(JSON.parse(bytes).version,8); assert.equal(pet.animation.float.enabled,true); assert.equal(pet.animation.cloth.enabled,true);
  assert.ok(pet.animation.cloth.protectedRegions.length>=3);
  const hashes={open:'68826d504df8b4441c8b3912ffc8b136298f5e02eff31797843021a27b153da5',talking:'2d5c3e7218af257e140798e2893759624f696be31b07d0d088f0b2298cb19b5f',closed:'c5d2486b2179f9ced4c8aee5644713553bcf9fc312d0d10557607751e7e20f7b',talkingClosed:'97e603a3bb0a8c8e8f6291d03022d34d14a73825c4d6628790435e8ec1409e20'};
  for(const [kind,hash] of Object.entries(hashes)) assert.equal(crypto.createHash('sha256').update(pet.images[kind].bytes).digest('hex'),hash);
  assert.deepEqual(parsePet(serializePet(pet)),pet);
  assert.equal(bundledUpdate('2e96b22ab2ca3449974b0560ae41efe1beee205ea5a685aeb444c2406aa35f6f'),'EduGhost-Voz.pet');
  assert.notEqual(petId(pet),'2e96b22ab2ca3449974b0560ae41efe1beee205ea5a685aeb444c2406aa35f6f');
  const old=JSON.parse(bytes); old.version=6; delete old.effects; assert.throws(()=>parsePet(Buffer.from(JSON.stringify(old))),/v7/);
});
