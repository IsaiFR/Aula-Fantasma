'use strict';
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
module.exports = async function(c) {
  const { panel, desktop, BrowserWindow, motion, notify, smokeRoot, server } = c, checks = {};
  const js = code => panel.webContents.executeJavaScript(code);
  const wait = async (predicate, label) => {
    const until = Date.now() + 7000;
    do { if (await predicate()) return; await new Promise(resolve => setTimeout(resolve,50)); } while (Date.now() < until);
    throw new Error(label);
  };
  await js('window.aula.editType("companion")');
  const library = await js('window.aula.getPetLibrary()'), entry = library.pets.find(pet => pet.name === 'Cuellilargo');
  assert.ok(entry); assert.ok(!(await js(`window.aula.selectPet(${JSON.stringify(entry.id)})`)).error);
  checks.selectableInCompanionLibrary = true;
  await js('window.aula.setSettings({paused:true,voiceEnabled:false,companionEnabled:true,desktopEnabled:true,obsEnabled:true,presenceEnabled:false,mode:"free",size:300,speed:35},"companion")');
  const obs = new BrowserWindow({width:960,height:540,show:false,frame:false,transparent:true,backgroundColor:'#00000000',webPreferences:{contextIsolation:true,nodeIntegration:false,sandbox:true,backgroundThrottling:false,offscreen:true}});
  const inspect = `(() => {const el=document.getElementById('pet-flipbook');return el?{active:document.getElementById('pet-body').classList.contains('flipbook-active'),frame:Number(el.dataset.frame),facing:Number(el.dataset.facing),decoder:el.dataset.decoder}:{};})()`;
  const views = [panel,desktop,obs];
  const pose = async (time, decoder = 'gif') => {
    motion.cycleTime = time; notify();
    const expected = c.getFrame().cycle.index;
    await wait(async () => (await Promise.all(views.map(view => view.webContents.executeJavaScript(inspect)))).every(view => view.active && view.frame === expected && view.facing === motion.directionX) && (await obs.webContents.executeJavaScript(inspect)).decoder === decoder, 'Fotogramas compartidos');
    return obs.webContents.executeJavaScript("document.getElementById('pet-flipbook').toDataURL('image/png')");
  };
  try {
    await obs.loadURL(`${server.url}/overlay`);
    motion.directionX = 1;
    const first = await pose(.01), next = await pose(.65); assert.notEqual(first,next);
    checks.gifStepsAndSharedClock = true;
    fs.writeFileSync(path.join(smokeRoot,'cuellilargo-step.png'),Buffer.from(next.split(',')[1],'base64'));
    assert.equal(first,await pose(1.93)); checks.seamlessLoop = true;
    motion.directionX = -1; assert.notEqual(first,await pose(.01)); checks.mirrorsOnDirectionChange = true;
    const transparent = await obs.webContents.executeJavaScript(`(() => {const c=document.getElementById('pet-flipbook'),d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;for(let i=0;i<c.width;i++)for(const p of [i,(c.height-1)*c.width+i,i*c.width,i*c.width+c.width-1])if(d[p*4+3])return false;return true;})()`);
    assert.ok(transparent); checks.transparentUnclippedBorder = true;
    const before = {x:motion.x,y:motion.y}; c.changeSettings({paused:false});
    await wait(() => motion.x !== before.x || motion.y !== before.y,'Recorrido'); c.changeSettings({paused:true});
    const frozen = motion.cycleTime; await new Promise(resolve=>setTimeout(resolve,180)); assert.equal(motion.cycleTime,frozen); checks.travelsAndPauses = true;
    const label = await js(`({label:document.getElementById('boo-now').textContent,section:document.querySelector('.character-card .eyebrow').textContent})`);
    assert.equal(label.label,'Reiniciar ciclo'); assert.equal(label.section,'CAMINATA'); checks.walkingControls = true;
    await obs.webContents.executeJavaScript('window.ImageDecoder=undefined;void 0');
    c.activatePet(c.parsePet(fs.readFileSync(path.join(c.root,'pets','Cuellilargo.aulapet'))),false); notify();
    const pngFirst = await pose(.01,'png'), pngNext = await pose(.65,'png'); assert.notEqual(pngFirst,pngNext); checks.pngFallbackAnimates = true;
    await js(`(async()=>{await window.aula.setCanvasFormat('9:16');await window.aula.editType('companion');await window.aula.selectPet(${JSON.stringify(entry.id)});await window.aula.setSettings({paused:true},'companion');})()`);
    await pose(.65,'png'); assert.equal(c.snapshot().canvas.format,'9:16'); checks.portraitCanvas = true;
  } finally { obs.destroy(); }
  return checks;
};
