'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {nativeImage}=require('electron');
module.exports=async function(c){
  const {panel,obs,views,wait,motion,notify,microphoneWindow,voiceGate,getFrame,snapshot,smokeRoot,root,dialog,savePreferences,loadPreferences}=c,checks={};
  const js=code=>panel.webContents.executeJavaScript(code);
  const library=await js('window.aula.getPetLibrary()'),choice=library.pets.find(p=>p.name==='EduReturnal');assert.ok(choice?.kind==='voice');
  const companionBeforeSelection=snapshot().companions.companion.id;
  const chosen=await js(`window.aula.selectPet(${JSON.stringify(choice.id)})`);assert.ok(!chosen.error);checks.edureturnalInVoiceCatalog=true;
  checks.edureturnalIsCompanionIndependent=companionBeforeSelection===snapshot().companions.companion.id;
  await js('window.aula.setSettings({micEnabled:true,micDeviceId:"default",micRelease:0,paused:true,corner:"bottom-left"},"voice")');
  await wait(()=>snapshot().microphone.status==='active'&&voiceGate.sampleTime>0,'Micrófono activo');checks.edureturnalCapturesAudio=true;
  await microphoneWindow.webContents.executeJavaScript('window.dispatchEvent(new Event("pagehide"));window.edureturnalLevel=0;window.edureturnalTimer=setInterval(()=>window.microphone.level(window.edureturnalLevel),30);void 0');
  const doc="document.getElementById('voice-layer').contentDocument",canvas=doc+".getElementById('pet-voice')";
  const inspect=`(()=>{const d=${doc},el=d?.getElementById('pet-voice');return {active:d?.getElementById('pet-body').classList.contains('voice-active'),pose:el?.dataset.pose,asset:el?.dataset.asset,mirrored:el?.dataset.mirrored};})()`;
  const pet=c.parsePet(fs.readFileSync(path.join(root,'pets','EduReturnal-Voz.pet')));
  for(const [kind,speaking,blinking] of [['open',false,false],['talking',true,false],['talkingClosed',true,true],['closed',false,true]]){
    await microphoneWindow.webContents.executeJavaScript(`window.edureturnalLevel=${speaking ? .4 : 0};void 0`);
    motion.blinkRemaining=blinking ? .1 : 0;notify();
    await wait(async()=>(await Promise.all(views.map(v=>v.webContents.executeJavaScript(inspect)))).every(v=>v.active&&v.pose===kind&&v.asset===getFrame().voice.urls.open&&v.mirrored==='false'),'EduReturnal '+kind);
    const expected=nativeImage.createFromBuffer(pet.images[kind].bytes).toBitmap();
    for(const win of views){
      const url=await win.webContents.executeJavaScript(canvas+'.toDataURL()'),bytes=Buffer.from(url.split(',')[1],'base64');
      assert.ok(nativeImage.createFromBuffer(bytes).toBitmap().equals(expected),'Píxeles de EduReturnal '+kind);
      if(win===obs)fs.writeFileSync(path.join(smokeRoot,'edureturnal-'+kind+'.png'),bytes);
    }
  }
  checks.edureturnalFourPosesExactAndSynchronized=true;
  // Además de las poses forzadas, comprobar un parpadeo del reloj mientras habla.
  await microphoneWindow.webContents.executeJavaScript('window.edureturnalLevel=.4;void 0');
  motion.blinkRemaining=0;motion.blinkIn=.02;await js('window.aula.setSettings({paused:false},"voice")');
  await wait(()=>getFrame().voice.speaking&&getFrame().voice.blinking,'Parpadeo automático hablando');checks.edureturnalAutomaticBlinkWhileSpeaking=true;
  await js('window.aula.setSettings({paused:true},"voice")');
  await microphoneWindow.webContents.executeJavaScript('window.edureturnalLevel=0;void 0');
  motion.blinkRemaining=0;motion.blinkIn=.02;await js('window.aula.setSettings({paused:false},"voice")');
  await wait(()=>!getFrame().voice.speaking&&getFrame().voice.blinking,'Parpadeo automático en silencio');checks.edureturnalAutomaticBlinkInSilence=true;
  await js('window.aula.setSettings({paused:true},"voice")');
  await microphoneWindow.webContents.executeJavaScript('window.edureturnalLevel=.4;void 0');await wait(()=>getFrame().voice.speaking,'Hablar');
  await js('window.aula.setSettings({micEnabled:false},"voice")');
  await wait(()=>!getFrame().voice.speaking&&snapshot().microphone.status==='off','Apagar el micro');checks.edureturnalOffClosesMouth=true;
  await microphoneWindow.webContents.executeJavaScript('clearInterval(window.edureturnalTimer);void 0');
  savePreferences();const before=snapshot();loadPreferences();notify();
  checks.edureturnalRestoresSelection=snapshot().companions.voice.id===choice.id&&snapshot().companions.companion.id===before.companions.companion.id;
  const savedSave=dialog.showSaveDialog,target=path.join(smokeRoot,'exported-edureturnal.pet');
  try{dialog.showSaveDialog=async()=>({canceled:false,filePath:target});await js('window.aula.editType("voice")');const result=await js('window.aula.exportPet()');assert.ok(result.saved);assert.deepEqual(c.parsePet(fs.readFileSync(target)),pet);checks.edureturnalExportsSelfContained=true;}finally{dialog.showSaveDialog=savedSave;}
  await js('(async()=>{await window.aula.setCanvasFormat("9:16");await window.aula.editType("voice");})()');
  await js(`window.aula.selectPet(${JSON.stringify(choice.id)})`);await js('window.aula.setSettings({paused:true,micEnabled:false,voiceEnabled:true,desktopEnabled:true,obsEnabled:true},"voice")');notify();
  await wait(async()=>(await obs.webContents.executeJavaScript(inspect)).asset===getFrame().voice.urls.open,'EduReturnal vertical');checks.edureturnalVerticalCanvas=snapshot().canvas.format==='9:16';
  fs.writeFileSync(path.join(smokeRoot,'edureturnal-panel.png'),(await panel.webContents.capturePage()).toPNG());
  return checks;
};
