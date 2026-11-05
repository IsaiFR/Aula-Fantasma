'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
module.exports=async function(c){
  const {panel,desktop,BrowserWindow,motion,notify,smokeRoot,server}=c,checks={};
  const js=code=>panel.webContents.executeJavaScript(code);
  const wait=async(predicate,label)=>{const until=Date.now()+7000;do{if(await predicate())return;await new Promise(r=>setTimeout(r,40));}while(Date.now()<until);throw new Error(label);};
  await js('window.aula.setCanvasFormat("16:9");window.aula.editType("companion")');
  const library=await js('window.aula.getPetLibrary()'),car=library.pets.find(p=>p.name==='EduF1');assert.ok(car);
  const selected=await js(`window.aula.selectPet(${JSON.stringify(car.id)})`);assert.ok(!selected.error);
  const s=c.snapshot().settings;checks.catalogAndPreset=s.size===300&&s.speed===130&&s.mode==='free'&&!s.presenceEnabled&&!s.booEnabled;
  await js('window.aula.setSettings({paused:true,voiceEnabled:false,companionEnabled:true,desktopEnabled:true,obsEnabled:true},"companion")');
  const obs=new BrowserWindow({width:1920,height:1080,show:false,frame:false,transparent:true,backgroundColor:'#00000000',webPreferences:{contextIsolation:true,nodeIntegration:false,sandbox:true,backgroundThrottling:false,offscreen:true}});
  await obs.loadURL(`${server.url}/overlay`);
  const views=[panel,desktop,obs],inspect=`(()=>{const el=document.getElementById('pet-vehicle');return {active:document.getElementById('pet-body').classList.contains('vehicle-active'),side:el.dataset.side,heading:Number(el.dataset.heading),wheelAngle:Number(el.dataset.wheelAngle)};})()`;
  const pose=async(heading,wheelAngle,file)=>{
    Object.assign(motion.vehicle,{heading,target:heading,wheelAngle,steering:0});notify();
    await wait(async()=>(await Promise.all(views.map(v=>v.webContents.executeJavaScript(inspect)))).every(v=>v.active&&v.heading===heading&&v.wheelAngle===wheelAngle),'Vehículo sincronizado');
    const png=await obs.webContents.executeJavaScript("document.getElementById('pet-vehicle').toDataURL()");
    if(file)fs.writeFileSync(path.join(smokeRoot,file+'.png'),Buffer.from(png.split(',')[1],'base64'));return png;
  };
  await pose(0,0,'f1-right');
  await obs.webContents.executeJavaScript("(()=>{const c=document.getElementById('pet-vehicle');window.carBefore=c.getContext('2d').getImageData(0,0,c.width,c.height).data;})()");
  await pose(0,1.1,'f1-wheels');
  const pixels=await obs.webContents.executeJavaScript(`(()=>{
    const c=document.getElementById('pet-vehicle'),d=c.getContext('2d').getImageData(0,0,c.width,c.height).data,wheels=${JSON.stringify(c.getFrame().behavior.vehicle.views.right.wheels)};
    let wheelsChanged=0,bodyChanged=0;
    for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++){
      const i=(y*c.width+x)*4,changed=[0,1,2,3].some(k=>d[i+k]!==window.carBefore[i+k]);if(!changed)continue;
      const inWheel=wheels.some(w=>Math.pow((x/c.width-w.cx)/w.rx,2)+Math.pow((y/c.height-w.cy)/w.ry,2)<1.2);
      if(inWheel)wheelsChanged++;else bodyChanged++;
    }
    return {wheelsChanged,bodyChanged,transparent:d[3]===0&&d[d.length-1]===0};
  })()`);
  assert.ok(pixels.wheelsChanged>80);assert.ok(pixels.bodyChanged<20);assert.ok(pixels.transparent);checks.onlyWheelsRotateWithTransparency=true;
  const right=await pose(0,0),left=await pose(Math.PI,0,'f1-left');assert.notEqual(left,right);checks.twoDrawnViews=true;
  const turning=await pose(Math.PI/2,0,'f1-turn');assert.notEqual(turning,right);assert.notEqual(turning,left);checks.turnAndThreeSurfacesSynchronized=true;
  Object.assign(motion.vehicle,{heading:-2.65,target:-2.65});motion.x=.5;motion.y=.5;
  const start={x:motion.x,y:motion.y,wheel:motion.vehicle.wheelAngle};c.changeSettings({paused:false});
  await wait(()=>motion.x!==start.x&&motion.y!==start.y&&motion.vehicle.wheelAngle!==start.wheel,'Desplazamiento y ruedas');
  c.changeSettings({paused:true});notify();await new Promise(r=>setTimeout(r,150));
  const frozen=await obs.webContents.executeJavaScript("document.getElementById('pet-vehicle').toDataURL()");
  await new Promise(r=>setTimeout(r,150));assert.equal(await obs.webContents.executeJavaScript("document.getElementById('pet-vehicle').toDataURL()"),frozen);checks.movesAndPauseFreezesPixels=true;
  c.changeSettings({mode:'still'});notify();await pose(0,0);const angle=motion.vehicle.wheelAngle;
  await new Promise(r=>setTimeout(r,100));assert.equal(motion.vehicle.wheelAngle,angle);checks.stillMode=true;
  await js(`(async()=>{await window.aula.setCanvasFormat('9:16');await window.aula.editType('companion');await window.aula.selectPet(${JSON.stringify(car.id)});await window.aula.setSettings({paused:true},'companion');})()`);
  await pose(0,.5,'f1-vertical');checks.verticalCanvas=c.snapshot().canvas.format==='9:16';
  await js('window.scrollTo(0,0);new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');
  fs.writeFileSync(path.join(smokeRoot,'f1-panel.png'),(await panel.webContents.capturePage()).toPNG());
  const ghost=library.pets.find(p=>p.name==='EduGhost');await js(`window.aula.selectPet(${JSON.stringify(ghost.id)})`);
  await wait(async()=>!(await obs.webContents.executeJavaScript(inspect)).active,'Cambiar mascota');checks.switchRestoresOtherRenderer=true;
  obs.destroy();return checks;
};
