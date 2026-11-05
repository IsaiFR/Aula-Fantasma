'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
module.exports=async function(c) {
  const {panel,desktop,BrowserWindow,motion,notify,smokeRoot,server}=c,checks={};
  const js=code=>panel.webContents.executeJavaScript(code);
  const wait=async(predicate,label)=>{const until=Date.now()+7000;do{if(await predicate())return;await new Promise(r=>setTimeout(r,50));}while(Date.now()<until);throw new Error(label);};
  await js('window.aula.editType("companion")');
  const library=await js('window.aula.getPetLibrary()'),zombie=library.pets.find(p=>p.name==='EduZombie');
  assert.ok(zombie,'EduZombie disponible en el catálogo de recorrido');
  const result=await js(`window.aula.selectPet(${JSON.stringify(zombie.id)})`); assert.ok(!result.error);
  checks.catalogAndPreset=c.snapshot().settings.speed===22 && c.snapshot().settings.mode==='free' && !c.snapshot().settings.presenceEnabled;
  await js('window.aula.setSettings({paused:true,voiceEnabled:false,companionEnabled:true,desktopEnabled:true,obsEnabled:true},"companion")');
  const obs=new BrowserWindow({width:960,height:540,show:false,frame:false,transparent:true,backgroundColor:'#00000000',webPreferences:{contextIsolation:true,nodeIntegration:false,sandbox:true,backgroundThrottling:false,offscreen:true}});
  await obs.loadURL(`${server.url}/overlay`);
  const views=[panel,desktop,obs];
  const inspect=`(() => {const el=document.getElementById('pet-flipbook');return el?{active:document.getElementById('pet-body').classList.contains('flipbook-active'),phase:el.dataset.phase,frame:Number(el.dataset.frame),facing:Number(el.dataset.facing),decoder:el.dataset.decoder}:{};})()`;
  const pose=async(time,stage)=>{
    motion.cycleTime=time;notify();const expected=c.getFrame().cycle.index;
    await wait(async()=>(await Promise.all(views.map(v=>v.webContents.executeJavaScript(inspect)))).every(v=>v.active && v.phase===stage && v.frame===expected),'Ciclo sincronizado '+stage);
    return obs.webContents.executeJavaScript(`document.getElementById('pet-flipbook').toDataURL('image/png')`);
  };
  const frames=[];
  for(const [time,stage,file] of [[0,'dead','grave'],[3.1,'rise','paw'],[4.5,'rise','emerging'],[7.1,'walk','walk'],[31.6,'fall','fallen'],[32.8,'fall','grave-return'],[33,'dead','loop']]){
    const png=await pose(time,stage);frames.push(png);
    fs.writeFileSync(path.join(smokeRoot,`zombie-${file}.png`),Buffer.from(png.split(',')[1],'base64'));
  }
  assert.equal(frames[0],frames.at(-1));assert.notEqual(frames[0],frames[1]);assert.notEqual(frames[1],frames[2]);
  checks.resurrectionDeathAndLoopSynchronized=true;
  motion.directionX=1;const graveRight=await pose(0,'dead');motion.directionX=-1;const graveLeft=await pose(0,'dead');
  assert.equal(graveRight,graveLeft,'El texto RIP/EduCat nunca se refleja'); checks.graveTextNotMirrored=true;
  const first=await pose(7.1,'walk'),second=await pose(7.4,'walk');assert.notEqual(first,second);checks.walkFramesAnimate=true;
  motion.cycleTime=8;const initial={x:motion.x,y:motion.y};
  c.changeSettings({paused:false});
  await wait(()=>motion.x!==initial.x && motion.y!==initial.y,'Deambular en ambos ejes');
  c.changeSettings({paused:true});const frozen=motion.cycleTime;
  await new Promise(r=>setTimeout(r,120));assert.equal(motion.cycleTime,frozen);checks.deambulatesAndPauses=true;
  await js('window.aula.setSettings({paused:false},"companion");window.aula.booNow();window.aula.setSettings({paused:true},"companion")');
  assert.ok(motion.cycleTime>=3 && motion.cycleTime<3.6);checks.resurrectButtonStartsWithPaw=true;
  // El mismo contrato funciona sin ImageDecoder y en formato vertical.
  await obs.webContents.executeJavaScript('window.ImageDecoder=undefined;void 0');
  c.activatePet(c.parsePet(fs.readFileSync(path.join(c.root,'pets','EduZombie.aulapet'))),false);notify();
  await wait(async()=> (await obs.webContents.executeJavaScript(inspect)).decoder==='png','Alternativa PNG');
  await pose(7.1,'walk');checks.pngFallback=true;
  await js(`(async()=>{await window.aula.setCanvasFormat('9:16');await window.aula.editType('companion');await window.aula.selectPet(${JSON.stringify(zombie.id)});await window.aula.setSettings({paused:true},'companion');})()`);
  await pose(3.1,'rise');checks.verticalCanvas=c.snapshot().canvas.format==='9:16';
  await js('window.scrollTo(0,0);new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');
  fs.writeFileSync(path.join(smokeRoot,'zombie-panel.png'),(await panel.webContents.capturePage()).toPNG());
  obs.destroy();return checks;
};
