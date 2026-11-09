'use strict';
// Integración aislada en .smoke-data. El micrófono es sintético salvo --real-microphone.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
function mirrorBitmap(bytes, width) {
  const result = Buffer.alloc(bytes.length), height = bytes.length / (width * 4);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) result.writeUInt32LE(bytes.readUInt32LE((y * width + x) * 4), (y * width + width - 1 - x) * 4);
  return result;
}
module.exports = async function(c) {
  const { BrowserWindow, root, smokeRoot, panel, desktop, microphoneWindow, server, motion, dialog, parsePet, activatePet, changeSettings, getFrame, snapshot, voiceGate, savePreferences, loadPreferences, notify } = c;
  const checks = {};
  const wait = async (predicate, label) => { const until = Date.now() + 5000; do { if (await predicate()) return true; await new Promise(r => setTimeout(r, 50)); } while (Date.now() < until); throw new Error(`${label}: ${JSON.stringify(snapshot().microphone)}`); };
  const obs = new BrowserWindow({ width: 960, height: 540, show: false, frame: false, transparent: true, backgroundColor: '#00000000', webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true, backgroundThrottling: false, offscreen: true } });
  await obs.loadURL(`${server.url}/overlay`);
  await panel.webContents.executeJavaScript('window.aula.setCanvasFormat("16:9")');
  activatePet(parsePet(fs.readFileSync(path.join(root, 'pets', 'EduGhost.aulapet'))), false);
  await panel.webContents.executeJavaScript('window.aula.editType("voice")');
  const savedOpen = dialog.showOpenDialog;
  try {
    dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path.join(root, 'pets', 'EduWitch-Voz.pet')] });
    const imported = await panel.webContents.executeJavaScript('window.aula.importImage()');
    assert.ok(!imported.error, imported.error);
    checks.importPet = imported.state.petKind === 'voice' && imported.state.settings.mode === 'still' && !imported.state.settings.presenceEnabled && !imported.state.settings.booEnabled;
  } finally { dialog.showOpenDialog = savedOpen; }
  changeSettings({ paused: true, size: 256, micEnabled: false, opacity: 100, desktopEnabled: true, obsEnabled: true, voiceEnabled: true, companionEnabled: true });
  const inspect = `(() => {const doc=document.getElementById('voice-layer')?.contentDocument,canvas=doc?.getElementById('pet-voice');if(!canvas)return {};return {active:doc.getElementById('pet-body').classList.contains('voice-active'),pose:canvas.dataset.pose,width:canvas.width,asset:canvas.dataset.asset,mirrored:canvas.dataset.mirrored};})()`;
  const views = [desktop, obs, panel];
  const waitPose = async pose => { try { return await wait(async () => (await Promise.all(views.map(v => v.webContents.executeJavaScript(inspect)))).every(v => v.active && v.pose === pose && (getFrame().animation.cloth.enabled ? v.width >= 32 && v.width <= 600 : v.width === 1254) && v.asset === getFrame().voice.urls.open && v.mirrored === String(getFrame().voice.mirrored)), `Pose ${pose}`); } catch (error) { throw new Error(`${error.message}; frames=${JSON.stringify(await Promise.all(views.map(v => v.webContents.executeJavaScript(inspect))))}; expected=${getFrame().voice.urls.open}`); } };
  await waitPose('open'); checks.loadsOnAllSurfaces = true;
  await panel.webContents.executeJavaScript('window.aula.setSettings({paused:false,mode:"free",presenceEnabled:false,booEnabled:false},"companion")');
  const movingBefore = c.getCompanionFrame(), voiceBefore = getFrame();
  await new Promise(resolve => setTimeout(resolve, 350));
  const movingAfter = c.getCompanionFrame(), voiceAfter = getFrame();
  checks.movesAlongsideFixedVoice = (movingBefore.x !== movingAfter.x || movingBefore.y !== movingAfter.y) && voiceBefore.x === voiceAfter.x && voiceBefore.y === voiceAfter.y;
  checks.bothVisible = (await Promise.all(views.map(v => v.webContents.executeJavaScript(`getComputedStyle(document.getElementById('pet-anchor')).visibility==='visible' && getComputedStyle(document.getElementById('voice-layer').contentDocument.getElementById('pet-anchor')).visibility==='visible'`)))).every(Boolean);
  checks.singleObsConnection = server.stats().obs === 1;
  const previewPoint = await panel.webContents.executeJavaScript(`(() => {const r=document.getElementById('preview').getBoundingClientRect();return {x:Math.round(r.x+20),y:Math.round(r.y+20),width:1,height:1};})()`);
  const paint = () => panel.webContents.executeJavaScript('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))');
  await panel.webContents.executeJavaScript('document.getElementById("voice-layer").style.visibility="hidden";void 0'); await paint();
  const uncovered = (await panel.webContents.capturePage(previewPoint)).toBitmap();
  await panel.webContents.executeJavaScript('document.getElementById("voice-layer").style.visibility="visible";void 0'); await paint();
  checks.transparentVoiceLayer = uncovered.equals((await panel.webContents.capturePage(previewPoint)).toBitmap());
  for (const corner of ['top-left','top-right','bottom-left','bottom-right']) {
    await panel.webContents.executeJavaScript(`window.aula.setSettings({corner:${JSON.stringify(corner)}},"voice")`);
    await wait(async () => (await Promise.all(views.map(v => v.webContents.executeJavaScript(`(() => {const d=document.getElementById('voice-layer').contentDocument,r=d.getElementById('pet-anchor').getBoundingClientRect(),w=d.documentElement.clientWidth,h=d.documentElement.clientHeight;return ${corner.endsWith('left')?'r.x < w/2':'r.x > w/2'} && ${corner.startsWith('top')?'r.y < h/2':'r.y > h/2'};})()`)))).every(Boolean), 'Esquina');
  }
  checks.fourCorners = true;
  checks.noRedundantPetCard = await panel.webContents.executeJavaScript(`!document.querySelector('.pet-card') && !document.getElementById('import-image') && Boolean(document.getElementById('choose-voice') && document.getElementById('choose-companion') && document.getElementById('export-pet'))`);
  if (process.argv.includes('--smoke-kimi')) {
    Object.assign(checks,await require('./edukimi-smoke.cjs')({...c,obs,views,wait}));
    obs.destroy();return checks;
  }
  if (process.argv.includes('--smoke-catrin')) {
    Object.assign(checks,await require('./educatrin-smoke.cjs')({...c,obs,views,wait}));
    obs.destroy();return checks;
  }
  if (process.argv.includes('--smoke-catrina')) {
    Object.assign(checks,await require('./catrina-smoke.cjs')({...c,obs,views,wait}));
    obs.destroy();return checks;
  }
  if (process.argv.includes('--smoke-edunueces')) {
    Object.assign(checks,await require('./edunueces-smoke.cjs')({...c,obs,views,wait}));
    obs.destroy();return checks;
  }
  if (process.argv.includes('--smoke-edugrinch')) {
    Object.assign(checks,await require('./edugrinch-smoke.cjs')({...c,obs,views,wait}));
    obs.destroy();return checks;
  }
  if (process.argv.includes('--smoke-edusnow')) {
    Object.assign(checks,await require('./edusnow-smoke.cjs')({...c,obs,views,wait}));
    obs.destroy();return checks;
  }
  if (process.argv.includes('--smoke-eduelfo')) {
    Object.assign(checks,await require('./eduelfo-smoke.cjs')({...c,obs,views,wait}));
    obs.destroy();return checks;
  }
  if (process.argv.includes('--smoke-edureno')) {
    Object.assign(checks,await require('./edureno-smoke.cjs')({...c,obs,views,wait}));
    obs.destroy();return checks;
  }
  if (process.argv.includes('--smoke-educookie')) {
    Object.assign(checks,await require('./educookie-smoke.cjs')({...c,obs,views,wait}));
    obs.destroy();return checks;
  }
  if (process.argv.includes('--smoke-educlaus')) {
    Object.assign(checks,await require('./educlaus-smoke.cjs')({...c,obs,views,wait}));
    obs.destroy();return checks;
  }
  if (process.argv.includes('--smoke-edudoom')) {
    Object.assign(checks,await require('./edudoom-smoke.cjs')({...c,obs,views,wait}));
    obs.destroy();return checks;
  }
  if (process.argv.includes('--smoke-edumoon')) {
    Object.assign(checks,await require('./edumoon-smoke.cjs')({...c,obs,views,wait}));
    obs.destroy();return checks;
  }
  if (process.argv.includes('--smoke-edustrange')) {
    Object.assign(checks,await require('./edustrange-smoke.cjs')({...c,obs,views,wait}));
    obs.destroy();return checks;
  }
  if (process.argv.includes('--smoke-edurivet')) {
    Object.assign(checks,await require('./edurivet-smoke.cjs')({...c,obs,views,wait}));
    obs.destroy();return checks;
  }
  if (process.argv.includes('--smoke-edueinstein')) {
    Object.assign(checks,await require('./edueinstein-smoke.cjs')({...c,obs,views,wait}));
    obs.destroy();return checks;
  }
  if (process.argv.includes('--smoke-edufast')) {
    Object.assign(checks,await require('./edufast-smoke.cjs')({...c,obs,views,wait}));
    obs.destroy();return checks;
  }
  if (process.argv.includes('--smoke-edudonalds')) {
    Object.assign(checks,await require('./edudonalds-smoke.cjs')({...c,obs,views,wait}));
    obs.destroy();return checks;
  }
  if (process.argv.includes('--smoke-eduoxxo')) {
    Object.assign(checks,await require('./eduoxxo-smoke.cjs')({...c,obs,views,wait}));
    obs.destroy();return checks;
  }
  if (process.argv.includes('--smoke-edudominos')) {
    Object.assign(checks,await require('./edudominos-smoke.cjs')({...c,obs,views,wait}));
    obs.destroy();return checks;
  }
  if (process.argv.includes('--smoke-dracula')) {
    Object.assign(checks,await require('./dracula-bat-smoke.cjs')({...c,obs,views,wait}));
    obs.destroy();return checks;
  }
  if (process.argv.includes('--smoke-opacity')) {
    await panel.webContents.executeJavaScript('window.aula.setCanvasFormat("16:9");window.aula.editType("voice")');
    activatePet(parsePet(fs.readFileSync(path.join(root,'pets','EduGhost-Voz.pet'))),true);
    changeSettings({paused:true,micEnabled:false});motion.blinkRemaining=0;notify();await waitPose('open');
    Object.assign(checks,await require('./ghost-opacity-smoke.cjs')({...c,obs,views,wait}));
    obs.destroy();return checks;
  }
  if (process.argv.includes('--smoke-geometry')) {
    await panel.webContents.executeJavaScript('window.aula.setCanvasFormat("9:16")');
    activatePet(parsePet(fs.readFileSync(path.join(root,'pets','EduGhost-Voz.pet'))),false);
    changeSettings({paused:true,micEnabled:false,size:256}); motion.blinkRemaining=0; notify(); await waitPose('open');
    Object.assign(checks, await require('./canvas-geometry-smoke.cjs')({...c,obs,wait}));
    obs.destroy(); return checks;
  }
  await panel.webContents.executeJavaScript('window.aula.setSettings({micEnabled:true,micDeviceId:"default"})');
  await wait(() => snapshot().microphone.status === 'active' && voiceGate.sampleTime > 0, 'Captura de audio');
  checks.audioCaptureAndRms = true;
  checks.audioDevices = snapshot().microphone.devices.some(d => Boolean(d.label));
  checks.cameraDeniedWhileAudioEnabled = await microphoneWindow.webContents.executeJavaScript(`navigator.mediaDevices.getUserMedia({video:true}).then(s=>{s.getTracks().forEach(t=>t.stop());return false;},()=>true)`);
  checks.panelControls = await panel.webContents.executeJavaScript(`!document.getElementById('voice-card').hidden && document.getElementById('micEnabled').checked && document.getElementById('mic-status').textContent.includes('Escuchando')`);
  // La captura ya se probó; controlar ahora el nivel mediante el puente real para comprobar cada pose.
  await microphoneWindow.webContents.executeJavaScript(`window.dispatchEvent(new Event('pagehide')); window.testLevel=0;window.testTimer=setInterval(()=>window.microphone.level(window.testLevel),30);void 0`);
  await panel.webContents.executeJavaScript('window.aula.setSettings({micRelease:0})');
  const original = parsePet(fs.readFileSync(path.join(root, 'pets', 'EduWitch-Voz.pet')));
  for (const [kind, speaking, blinking] of [['open', false, false], ['talking', true, false], ['talkingClosed', true, true], ['closed', false, true]]) {
    await microphoneWindow.webContents.executeJavaScript(`window.testLevel=${speaking ? .4 : 0};void 0`);
    motion.blinkRemaining = blinking ? .1 : 0; notify(); await waitPose(kind);
    const source = require('electron').nativeImage.createFromBuffer(original.images[kind].bytes);
    const expected = mirrorBitmap(source.toBitmap(), source.getSize().width);
    for (const win of views) {
      const url = await win.webContents.executeJavaScript(`document.getElementById('voice-layer').contentDocument.getElementById('pet-voice').toDataURL('image/png')`);
      const bytes = Buffer.from(url.split(',')[1], 'base64');
      assert.ok(expected.equals(require('electron').nativeImage.createFromBuffer(bytes).toBitmap()), `Píxeles ${kind}`);
      if (win === obs) fs.writeFileSync(path.join(smokeRoot, `voice-${kind}.png`), bytes);
    }
  }
  checks.fourPosesExactAndSynchronized = true;
  await panel.webContents.executeJavaScript('window.aula.setSettings({corner:"bottom-left"},"voice")'); await waitPose('closed');
  const unmirrored = require('electron').nativeImage.createFromBuffer(original.images.closed.bytes).toBitmap();
  for (const win of views) {
    const url = await win.webContents.executeJavaScript(`document.getElementById('voice-layer').contentDocument.getElementById('pet-voice').toDataURL('image/png')`);
    assert.ok(unmirrored.equals(require('electron').nativeImage.createFromBuffer(Buffer.from(url.split(',')[1], 'base64')).toBitmap()), 'La esquina izquierda conserva la orientación original.');
  }
  await panel.webContents.executeJavaScript('window.aula.setSettings({corner:"bottom-right"},"voice")'); await waitPose('closed');
  checks.automaticMirrorBothSides = true;
  // El panel puede cambiar de página; la captura pertenece a su ventana independiente.
  await panel.webContents.executeJavaScript('window.aula.openPetSelector()');
  await wait(() => panel.webContents.executeJavaScript(`document.documentElement?.dataset.libraryReady==='true'`), 'Selector');
  const previewsReady = () => panel.webContents.executeJavaScript(`[...document.querySelectorAll('.pet-preview iframe')].every(f=>f.contentDocument?.documentElement?.dataset.connected==='true' && f.contentDocument?.getElementById('pet')?.naturalWidth>0)`);
  await wait(previewsReady, 'Previsualizaciones de voz');
  checks.voiceCatalog = await panel.webContents.executeJavaScript(`['EduWitch (voz)','EduDracula (voz)','EduGhost (voz)','EduMomia (voz)'].every(name=>[...document.querySelectorAll('.pet-choice h2')].some(el=>el.textContent===name))`);
  checks.voiceCatalogFiltered = await panel.webContents.executeJavaScript(`window.aula.getPetLibrary().then(l=>l.pets.every(p=>p.kind==='voice'))`);
  fs.writeFileSync(path.join(smokeRoot, 'pet-selector-voice.png'), (await panel.webContents.capturePage()).toPNG());
  await microphoneWindow.webContents.executeJavaScript('window.testLevel=.4;void 0');
  await wait(() => getFrame().voice.speaking, 'Voz con selector'); checks.survivesNavigation = true;
  await panel.webContents.executeJavaScript('window.aula.openPanel()');
  await wait(() => panel.webContents.executeJavaScript(`location.pathname==='/panel' && Boolean(document.getElementById('mic-status'))`), 'Panel');
  const voiceId = snapshot().companions.voice.id;
  await panel.webContents.executeJavaScript('window.aula.editType("companion")');
  const companionLibrary = await panel.webContents.executeJavaScript('window.aula.getPetLibrary()');
  checks.companionCatalogFiltered = companionLibrary.pets.length >= 4 && companionLibrary.pets.every(p => p.kind === 'companion');
  await panel.webContents.executeJavaScript('window.aula.openPetSelector()');
  await wait(() => panel.webContents.executeJavaScript(`document.documentElement?.dataset.libraryReady==='true'`), 'Selector de recorrido');
  await wait(previewsReady, 'Previsualizaciones de recorrido');
  fs.writeFileSync(path.join(smokeRoot, 'pet-selector-companion.png'), (await panel.webContents.capturePage()).toPNG());
  await panel.webContents.executeJavaScript('window.aula.openPanel()');
  await wait(() => panel.webContents.executeJavaScript(`location.pathname==='/panel' && Boolean(document.getElementById('mic-status'))`), 'Volver del selector de recorrido');
  checks.crossTypeRejected = Boolean((await panel.webContents.executeJavaScript(`window.aula.selectPet(${JSON.stringify(voiceId)})`)).error);
  const companionChoice = companionLibrary.pets.find(p=>p.name==='EduScream');
  await panel.webContents.executeJavaScript(`window.aula.selectPet(${JSON.stringify(companionChoice.id)})`);
  checks.independentSelections = snapshot().companions.voice.id === voiceId && snapshot().companions.companion.id === companionChoice.id;
  checks.micSurvivesEditingCompanion = snapshot().microphone.status === 'active' && getFrame().voice.speaking;
  await panel.webContents.executeJavaScript('window.aula.booNow()');
  checks.greetingAlongsideVoice = c.getCompanionFrame().boo && getFrame().voice.speaking;
  await panel.webContents.executeJavaScript('window.aula.setSettings({companionEnabled:false})');
  checks.hideCompanionOnly = !c.getCompanionFrame().settings.obsEnabled && getFrame().settings.obsEnabled && getFrame().voice.speaking;
  await panel.webContents.executeJavaScript('window.aula.setSettings({companionEnabled:true});window.aula.editType("voice")');
  await panel.webContents.executeJavaScript('window.aula.setSettings({micEnabled:false})');
  await wait(() => !getFrame().voice.speaking && snapshot().microphone.status === 'off', 'Apagar'); checks.offClosesMouth = true;
  await microphoneWindow.webContents.executeJavaScript('clearInterval(window.testTimer);void 0');
  savePreferences(); const before = snapshot(); loadPreferences(); notify();
  checks.restoresPetAndAudioSettings = snapshot().activePetId === before.activePetId && snapshot().settings.micRelease === 0 && !snapshot().settings.micEnabled;
  checks.restoresBothSelections = JSON.stringify(snapshot().companions) === JSON.stringify(before.companions);
  const preferencesFile = path.join(smokeRoot, 'settings.json'), savedPreferences = fs.readFileSync(preferencesFile), saved = JSON.parse(savedPreferences);
  try {
    fs.writeFileSync(preferencesFile, JSON.stringify({ schemaVersion: 3, petFile: saved.voice.petFile, settings: { ...saved.settings, ...saved.voice.settings, micEnabled: false } }));
    loadPreferences();
    checks.migratesVoiceSelection = snapshot().companions.voice.id === before.companions.voice.id && snapshot().companions.companion.name === 'EduGhost' && snapshot().activeType === 'voice';
    fs.writeFileSync(preferencesFile, JSON.stringify({ schemaVersion: 3, petFile: saved.petFile, settings: saved.settings }));
    loadPreferences();
    checks.migratesCompanionSelection = snapshot().companions.companion.id === before.companions.companion.id && snapshot().companions.voice.name === 'EduWitch (voz)' && !snapshot().settings.micEnabled;
  } finally { fs.writeFileSync(preferencesFile, savedPreferences); loadPreferences(); notify(); }
  const savedSave = dialog.showSaveDialog, exported = path.join(smokeRoot, 'exported-voice.pet');
  try {
    dialog.showSaveDialog = async (_win, options) => { checks.exportsPetExtension = options.filters[0].extensions[0] === 'pet' && options.defaultPath.endsWith('.pet'); return { canceled: false, filePath: exported }; };
    const result = await panel.webContents.executeJavaScript('window.aula.exportPet()'); checks.exportsContent = result.saved && parsePet(fs.readFileSync(exported)).kind === 'voice';
  } finally { dialog.showSaveDialog = savedSave; }
  for (const name of ['EduDracula', 'EduGhost', 'EduMomia']) {
    activatePet(parsePet(fs.readFileSync(path.join(root, 'pets', `${name}-Voz.pet`))), false); motion.blinkRemaining = 0; notify(); await waitPose('open');
  }
  checks.allFourCharactersLoad = true;
  activatePet(parsePet(fs.readFileSync(path.join(root, 'pets', 'EduGhost-Voz.pet'))), true);
  changeSettings({ paused: true, size: 300 }); motion.blinkRemaining = 0; motion.elapsed = 1.1; notify(); await waitPose('open');
  const ghostCanvas = `document.getElementById('voice-layer').contentDocument.getElementById('pet-voice')`;
  const ghostImage = async () => { const url = await obs.webContents.executeJavaScript(`${ghostCanvas}.toDataURL('image/png')`); return require('electron').nativeImage.createFromBuffer(Buffer.from(url.split(',')[1], 'base64')); };
  const ghostA = await ghostImage(), floatA = getFrame().bob;
  motion.elapsed = 2.3; notify();
  await wait(async () => (await Promise.all(views.map(v => v.webContents.executeJavaScript(`${ghostCanvas}.dataset.phase`)))).every(p=>p==='2.3'), 'Reloj de sábana');
  const ghostB = await ghostImage(), bytesA = ghostA.toBitmap(), bytesB = ghostB.toBitmap(), n = ghostA.getSize().width;
  let headStable = true, fabricChanges = 0, pawStable = true;
  for (let y=0;y<n;y++) for (let x=0;x<n;x++) {
    const index=(y*n+x)*4, differs=bytesA.readUInt32LE(index)!==bytesB.readUInt32LE(index);
    if (y<n*.38 && differs) headStable=false;
    if (y>n*.5 && differs) fabricChanges++;
    if (Math.hypot((x/n-.412)/.025,(y/n-.737)/.025)<1 && differs) pawStable=false;
  }
  checks.ghostClothMovesWithoutFaceOrPaw = headStable && pawStable && fabricChanges>100;
  checks.ghostFloats = floatA !== getFrame().bob && Math.abs(getFrame().bob)<=7;
  checks.ghostTransparent = bytesB[3]===0 && bytesB[bytesB.length-1]===0;
  fs.writeFileSync(path.join(smokeRoot,'ghost-voice-wave-a.png'),ghostA.toPNG()); fs.writeFileSync(path.join(smokeRoot,'ghost-voice-wave-b.png'),ghostB.toPNG());
  await panel.webContents.executeJavaScript('window.aula.setSettings({micEnabled:true,micRelease:0},"voice")');
  await wait(()=>snapshot().microphone.status==='active','Audio de EduGhost');
  await microphoneWindow.webContents.executeJavaScript(`window.dispatchEvent(new Event('pagehide'));window.ghostLevel=0;window.ghostTimer=setInterval(()=>window.microphone.level(window.ghostLevel),30);void 0`);
  for (const [kind, speaking, blinking] of [['open',false,false],['talking',true,false],['closed',false,true],['talkingClosed',true,true]]) {
    await microphoneWindow.webContents.executeJavaScript(`window.ghostLevel=${speaking ? 0.4 : 0};void 0`);
    motion.blinkRemaining=blinking ? 0.1 : 0; notify(); await waitPose(kind);
    if (!(await Promise.all(views.map(v=>v.webContents.executeJavaScript(`${ghostCanvas}.dataset.cloth==='true'`)))).every(Boolean)) throw new Error('La sábana no acompaña la pose de voz.');
  }
  checks.ghostSpeaksAndBlinksWithCloth = true;
  const rightGhost = (await ghostImage()).toBitmap();
  await panel.webContents.executeJavaScript('window.aula.setSettings({corner:"bottom-left"},"voice")'); await waitPose('talkingClosed');
  checks.ghostMirrorWithCloth = rightGhost.equals(mirrorBitmap((await ghostImage()).toBitmap(), n));
  await panel.webContents.executeJavaScript('window.aula.setSettings({micEnabled:false,corner:"bottom-right"},"voice")');
  await microphoneWindow.webContents.executeJavaScript('clearInterval(window.ghostTimer);void 0');
  Object.assign(checks,await require('./ghost-opacity-smoke.cjs')({...c,obs,views,wait}));
  Object.assign(checks, await require('./canvas-smoke.cjs')({ ...c, obs, wait, views }));
  activatePet(original, false); notify(); await waitPose('open');
  await panel.webContents.executeJavaScript('document.getElementById("voice-card").scrollIntoView({block:"start"})');
  fs.writeFileSync(path.join(smokeRoot, 'voice-panel.png'), (await panel.webContents.capturePage()).toPNG());
  await panel.webContents.executeJavaScript('window.scrollTo(0,0);void 0');
  await paint();
  fs.writeFileSync(path.join(smokeRoot, 'dual-panel.png'), (await panel.webContents.capturePage()).toPNG());
  const cameraDenied = await microphoneWindow.webContents.executeJavaScript(`navigator.mediaDevices.getUserMedia({video:true}).then(s=>{s.getTracks().forEach(t=>t.stop());return false;},()=>true)`);
  checks.cameraDenied = cameraDenied;
  obs.destroy(); return checks;
};
