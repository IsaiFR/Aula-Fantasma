'use strict';
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
module.exports = async function(c) {
  const {panel,views,motion,notify,wait,root,smokeRoot} = c, checks = {};
  const js = code => panel.webContents.executeJavaScript(code);
  const dracula = c.parsePet(fs.readFileSync(path.join(root,'pets','EduDracula-Voz.pet')));
  await js('window.aula.editType("voice")'); c.activatePet(dracula,true);
  await js('window.aula.setSettings({paused:true,micEnabled:false,opacity:81,draculaSeconds:2,draculaBatSeconds:2,draculaBatEnabled:true},"voice")');
  await wait(()=>js(`!document.getElementById('dracula-bat-card').hidden`),'Controles de Drácula');
  checks.controlsExclusiveToDracula = await js(`!document.getElementById('manual-opacity-controls').hidden && document.getElementById('ghost-opacity-card').hidden`);
  checks.cleanedPanelLayout = await js(`(() => {const card=document.getElementById('dracula-bat-card'),obs=document.querySelector('.obs-card');return !document.querySelector('.topbar,.sample-camera,#canvas-stage-label') && card.parentElement===obs.parentElement && card.getBoundingClientRect().top>=obs.getBoundingClientRect().bottom;})()`);
  await js(`(() => {for (const id of ['draculaSeconds-value','draculaBatSeconds-value']) {const el=document.getElementById(id);el.value='1';el.dispatchEvent(new Event('change',{bubbles:true}));}})()`);
  await wait(()=>c.snapshot().settings.draculaSeconds===1 && c.snapshot().settings.draculaBatSeconds===1,'Duraciones');
  checks.durationControls = true;
  motion.blinkRemaining=0;
  const base=motion.elapsed, canvas=`document.getElementById('voice-layer').contentDocument.getElementById('pet-voice')`;
  const pose = async (time,phase) => {
    motion.elapsed=base+time; notify();
    await wait(async()=> (await Promise.all(views.map(v=>v.webContents.executeJavaScript(`${canvas}.dataset.form===${JSON.stringify(phase)} && ${canvas}.dataset.phase===${JSON.stringify(String(motion.elapsed))}`)))).every(Boolean),phase);
    const urls=await Promise.all(views.map(v=>v.webContents.executeJavaScript(`${canvas}.toDataURL('image/png')`)));
    assert.ok(urls.every(url=>url===urls[0]),'Píxeles idénticos en escritorio, panel y salida OBS');
    return Buffer.from(urls[0].split(',')[1],'base64');
  };
  const normal=await pose(0,'dracula');
  const transition=await pose(1.4,'transforming');
  const a=await pose(1.9,'bat'), b=await pose(2.08,'bat');
  assert.ok(!a.equals(b),'El aleteo y humo deben cambiar');
  const {nativeImage}=require('electron'), image=nativeImage.createFromBuffer(a), bitmap=image.toBitmap(), size=image.getSize();
  let red=0;
  for(let i=0;i<bitmap.length;i+=4) if(bitmap[i+2]>bitmap[i+1]*1.5 && bitmap[i+2]>bitmap[i]*1.5 && bitmap[i+3]>8) red++;
  assert.ok(red>1000); assert.equal(bitmap[3],0); assert.equal(bitmap[bitmap.length-1],0);
  for(let x=0;x<size.width;x++) assert.equal(bitmap[(x)*4+3]+bitmap[((size.height-1)*size.width+x)*4+3],0,'Sin recorte superior/inferior');
  for(let y=0;y<size.height;y++) assert.equal(bitmap[(y*size.width)*4+3]+bitmap[(y*size.width+size.width-1)*4+3],0,'Sin recorte lateral');
  fs.writeFileSync(path.join(smokeRoot,'dracula-original.png'),normal);
  fs.writeFileSync(path.join(smokeRoot,'dracula-transition.png'),transition);
  fs.writeFileSync(path.join(smokeRoot,'dracula-bat-a.png'),a); fs.writeFileSync(path.join(smokeRoot,'dracula-bat-b.png'),b);
  await pose(3.2,'returning'); await pose(3.61,'dracula');
  checks.synchronizedCycleAndFlapping = checks.redSmokeAndTransparency = true;
  const setEnabled = async enabled => {
    await js(`(() => {const el=document.getElementById('draculaBatEnabled');el.checked=${enabled};el.dispatchEvent(new Event('change',{bubbles:true}));})()`);
    await wait(()=>c.snapshot().settings.draculaBatEnabled===enabled,'Interruptor');
  };
  await pose(5.5,'bat');
  await js('window.aula.setSettings({micEnabled:true,micRelease:0},"voice")');
  await wait(()=>c.snapshot().microphone.status==='active','Micrófono del murciélago');
  await c.microphoneWindow.webContents.executeJavaScript('window.dispatchEvent(new Event("pagehide"));window.batTestLevel=0;window.batTestTimer=setInterval(()=>window.microphone.level(window.batTestLevel),30);void 0');
  const faces={};
  for(const [kind,batKind,speaking,blinking] of [['open','batOpen',false,false],['talking','bat',true,false],['closed','batClosed',false,true],['talkingClosed','batTalkingClosed',true,true]]) {
    await c.microphoneWindow.webContents.executeJavaScript(`window.batTestLevel=${speaking?.4:0};void 0`);
    motion.blinkRemaining=blinking?.1:0; notify();
    await wait(async()=>c.getFrame().voice.speaking===speaking && (await Promise.all(views.map(v=>v.webContents.executeJavaScript(`${canvas}.dataset.pose===${JSON.stringify(kind)} && ${canvas}.dataset.batPose===${JSON.stringify(batKind)}`)))).every(Boolean),`Pose de murciélago ${kind}`);
    const urls=await Promise.all(views.map(v=>v.webContents.executeJavaScript(`${canvas}.toDataURL('image/png')`)));
    assert.ok(urls.every(url=>url===urls[0]),'Voz y parpadeo sincronizados en todas las salidas');
    const png=Buffer.from(urls[0].split(',')[1],'base64');
    faces[kind]=nativeImage.createFromBuffer(png).toBitmap();
    fs.writeFileSync(path.join(smokeRoot,`dracula-bat-${kind}.png`),png);
  }
  for(const kind of ['talking','closed','talkingClosed']) {
    assert.ok(!faces.open.equals(faces[kind]),`La pose ${kind} cambia el rostro`);
    let differences=0;
    for(let y=0;y<size.height;y++) for(let x=0;x<size.width;x++) {
      const at=(y*size.width+x)*4;
      if(faces.open.readUInt32LE(at)!==faces[kind].readUInt32LE(at)) {
        differences++;
        assert.ok(x>size.width*.27 && x<size.width*.73 && y>size.height*.25 && y<size.height*.65,'Solo cambia el rostro; vuelo y alas permanecen iguales');
      }
    }
    assert.ok(differences>1000);
  }
  assert.ok(!faces.closed.equals(faces.talkingClosed),'La boca reacciona también durante el parpadeo');
  checks.batFourVoiceAndBlinkPoses = checks.batMicrophoneAndAllSurfaces = checks.batKeepsWingsBodyAndSmoke = true;
  await c.microphoneWindow.webContents.executeJavaScript('clearInterval(window.batTestTimer);void 0');
  await js('window.aula.setSettings({micEnabled:false},"voice")'); motion.blinkRemaining=0; notify();
  await setEnabled(false);
  await wait(async()=> (await Promise.all(views.map(v=>v.webContents.executeJavaScript(`${canvas}.dataset.form==='dracula'`)))).every(Boolean),'Desactivar');
  checks.disableRestoresOriginal = await js(`document.getElementById('draculaSeconds').disabled && document.getElementById('draculaSeconds-value').disabled`);
  c.savePreferences(); c.loadPreferences(); notify();
  checks.settingsSurviveReload = !c.snapshot().settings.draculaBatEnabled && c.snapshot().settings.draculaSeconds===1 && c.snapshot().settings.opacity===81;
  const format=c.snapshot().canvas.format, other=format==='16:9'?'9:16':'16:9';
  await js(`window.aula.setCanvasFormat(${JSON.stringify(other)})`); c.activatePet(dracula,true);
  await js('window.aula.setSettings({draculaBatEnabled:true,draculaSeconds:3,draculaBatSeconds:4},"voice")');
  await js(`window.aula.setCanvasFormat(${JSON.stringify(format)})`);
  checks.independentCanvasSettings = !c.snapshot().settings.draculaBatEnabled && c.snapshot().settings.draculaSeconds===1 && c.snapshot().settings.draculaBatSeconds===1;
  await js(`window.aula.setCanvasFormat(${JSON.stringify(other)})`);
  checks.otherCanvasSettings = c.snapshot().settings.draculaBatEnabled && c.snapshot().settings.draculaSeconds===3 && c.snapshot().settings.draculaBatSeconds===4;
  for(const name of ['EduWitch','EduGhost','EduMomia']) {
    c.activatePet(c.parsePet(fs.readFileSync(path.join(root,'pets',`${name}-Voz.pet`))),false); notify();
    await wait(()=>js(`document.getElementById('dracula-bat-card').hidden`),'Otros personajes');
    assert.equal(c.getFrame().draculaBat,null);
  }
  checks.otherPetsUnchanged = true;
  c.activatePet(dracula,true);
  await js('window.aula.setSettings({paused:true,draculaBatEnabled:true,draculaSeconds:1,draculaBatSeconds:1},"voice");window.aula.resetPosition()');
  checks.resetStartsAsDracula = c.getFrame().draculaBat.phase==='dracula';
  await js('document.getElementById("dracula-bat-card").scrollIntoView({block:"center"});new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');
  fs.writeFileSync(path.join(smokeRoot,'dracula-controls.png'),(await panel.webContents.capturePage()).toPNG());
  await js('window.scrollTo(0,0);new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');
  fs.writeFileSync(path.join(smokeRoot,'panel-layout.png'),(await panel.webContents.capturePage()).toPNG());
  return checks;
};
