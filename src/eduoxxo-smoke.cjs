'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {nativeImage}=require('electron');
module.exports=async function(c){
  const {panel,obs,views,wait,motion,notify,microphoneWindow,voiceGate,getFrame,snapshot,smokeRoot,root,dialog,savePreferences,loadPreferences}=c,checks={};
  const js=code=>panel.webContents.executeJavaScript(code);
  const library=await js('window.aula.getPetLibrary()'),choice=library.pets.find(p=>p.name==='EduOxxo');assert.ok(choice?.kind==='voice');
  const companionBeforeSelection=snapshot().companions.companion.id;
  const chosen=await js(`window.aula.selectPet(${JSON.stringify(choice.id)})`);assert.ok(!chosen.error);checks.eduoxxoInVoiceCatalog=true;
  checks.eduoxxoIsCompanionIndependent=companionBeforeSelection===snapshot().companions.companion.id;
  await js('window.aula.setSettings({micEnabled:true,micDeviceId:"default",micRelease:0,paused:true,corner:"bottom-left"},"voice")');
  await wait(()=>snapshot().microphone.status==='active'&&voiceGate.sampleTime>0,'Micrófono activo');checks.eduoxxoCapturesAudio=true;
  await microphoneWindow.webContents.executeJavaScript('window.dispatchEvent(new Event("pagehide"));window.eduoxxoLevel=0;window.eduoxxoTimer=setInterval(()=>window.microphone.level(window.eduoxxoLevel),30);void 0');
  const doc="document.getElementById('voice-layer').contentDocument",canvas=doc+".getElementById('pet-voice')";
  const inspect=`(()=>{const d=${doc},el=d?.getElementById('pet-voice');return {active:d?.getElementById('pet-body').classList.contains('voice-active'),pose:el?.dataset.pose,asset:el?.dataset.asset,mirrored:el?.dataset.mirrored};})()`;
  const pet=c.parsePet(fs.readFileSync(path.join(root,'pets','EduOxxo-Voz.pet')));
  for(const [kind,speaking,blinking] of [['open',false,false],['talking',true,false],['talkingClosed',true,true],['closed',false,true]]){
    await microphoneWindow.webContents.executeJavaScript(`window.eduoxxoLevel=${speaking ? .4 : 0};void 0`);
    motion.blinkRemaining=blinking ? .1 : 0;notify();
    await wait(async()=>(await Promise.all(views.map(v=>v.webContents.executeJavaScript(inspect)))).every(v=>v.active&&v.pose===kind&&v.asset===getFrame().voice.urls.open&&v.mirrored==='false'),'EduOxxo '+kind);
    const expected=nativeImage.createFromBuffer(pet.images[kind].bytes).toBitmap();
    for(const win of views){
      const url=await win.webContents.executeJavaScript(canvas+'.toDataURL()'),bytes=Buffer.from(url.split(',')[1],'base64');
      assert.ok(nativeImage.createFromBuffer(bytes).toBitmap().equals(expected),'Píxeles de EduOxxo '+kind);
      if(win===obs)fs.writeFileSync(path.join(smokeRoot,'eduoxxo-'+kind+'.png'),bytes);
    }
  }
  checks.eduoxxoFourPosesExactAndSynchronized=true;
  // Además de las poses forzadas, comprobar un parpadeo del reloj mientras habla.
  await microphoneWindow.webContents.executeJavaScript('window.eduoxxoLevel=.4;void 0');
  motion.blinkRemaining=0;motion.blinkIn=.02;await js('window.aula.setSettings({paused:false},"voice")');
  await wait(()=>getFrame().voice.speaking&&getFrame().voice.blinking,'Parpadeo automático hablando');checks.eduoxxoAutomaticBlinkWhileSpeaking=true;
  await js('window.aula.setSettings({paused:true},"voice")');
  await microphoneWindow.webContents.executeJavaScript('window.eduoxxoLevel=0;void 0');
  motion.blinkRemaining=0;motion.blinkIn=.02;await js('window.aula.setSettings({paused:false},"voice")');
  await wait(()=>!getFrame().voice.speaking&&getFrame().voice.blinking,'Parpadeo automático en silencio');checks.eduoxxoAutomaticBlinkInSilence=true;
  await js('window.aula.setSettings({paused:true},"voice")');
  await microphoneWindow.webContents.executeJavaScript('window.eduoxxoLevel=.4;void 0');await wait(()=>getFrame().voice.speaking,'Hablar');
  await js('window.aula.setSettings({micEnabled:false},"voice")');
  await wait(()=>!getFrame().voice.speaking&&snapshot().microphone.status==='off','Apagar el micro');checks.eduoxxoOffClosesMouth=true;
  await microphoneWindow.webContents.executeJavaScript('clearInterval(window.eduoxxoTimer);void 0');
  savePreferences();const before=snapshot();loadPreferences();notify();
  checks.eduoxxoRestoresSelection=snapshot().companions.voice.id===choice.id&&snapshot().companions.companion.id===before.companions.companion.id;
  const savedSave=dialog.showSaveDialog,target=path.join(smokeRoot,'exported-eduoxxo.pet');
  try{dialog.showSaveDialog=async()=>({canceled:false,filePath:target});await js('window.aula.editType("voice")');const result=await js('window.aula.exportPet()');assert.ok(result.saved);assert.deepEqual(c.parsePet(fs.readFileSync(target)),pet);checks.eduoxxoExportsSelfContained=true;}finally{dialog.showSaveDialog=savedSave;}
  await js('(async()=>{await window.aula.setCanvasFormat("9:16");await window.aula.editType("voice");})()');
  await js(`window.aula.selectPet(${JSON.stringify(choice.id)})`);await js('window.aula.setSettings({paused:true,micEnabled:false,voiceEnabled:true,desktopEnabled:true,obsEnabled:true},"voice")');notify();
  await wait(async()=>(await obs.webContents.executeJavaScript(inspect)).asset===getFrame().voice.urls.open,'EduOxxo vertical');checks.eduoxxoVerticalCanvas=snapshot().canvas.format==='9:16';
  fs.writeFileSync(path.join(smokeRoot,'eduoxxo-panel.png'),(await panel.webContents.capturePage()).toPNG());
  return checks;
};
