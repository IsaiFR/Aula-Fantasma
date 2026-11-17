'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

module.exports = async function ({ panel, obs, views, wait, motion, notify, voiceGate, microphoneWindow, getFrame, snapshot, root, smokeRoot, parsePet, dialog }) {
  const js = code => panel.webContents.executeJavaScript(code);
  const canvas = "document.getElementById('voice-layer').contentDocument?.getElementById('pet-voice')";
  const inspect = `(() => { const canvas = ${canvas}; return canvas ? { ...canvas.dataset } : {}; })()`;
  const execute = (window, code) => window.webContents.executeJavaScript(code);
  const settings = patch => js(`window.aula.setSettings(${JSON.stringify(patch)}, 'voice')`);
  const library = await js('window.aula.getPetLibrary()');
  const choice = library.pets.find(pet => pet.name === 'EduZero');
  assert.equal(choice?.kind, 'voice');
  const selection = await js(`window.aula.selectPet(${JSON.stringify(choice.id)})`);
  assert.ok(!selection.error);
  await settings({ micEnabled: true, micDeviceId: 'default', micRelease: 0, paused: true, corner: 'bottom-left' });
  await wait(() => snapshot().microphone.status === 'active' && voiceGate.sampleTime > 0, 'Audio de EduZero');
  await execute(microphoneWindow, 'window.dispatchEvent(new Event("pagehide")); window.zeroLevel = 0; window.zeroTimer = setInterval(() => window.microphone.level(window.zeroLevel), 30); void 0');

  const waitForFrame = (pose, tick) => wait(async () => {
    const snapshots = await Promise.all(views.map(window => execute(window, inspect)));
    return snapshots.every(frame => frame.pose === pose && frame.mist === String(tick) && frame.asset === getFrame().voice.urls.open);
  }, `EduZero ${pose}, bruma ${tick}`);
  motion.elapsed = 0;
  for (const [pose, speaking, blinking] of [['open', false, false], ['talking', true, false], ['talkingClosed', true, true], ['closed', false, true]]) {
    await execute(microphoneWindow, `window.zeroLevel = ${speaking ? .4 : 0}; void 0`);
    motion.blinkRemaining = blinking ? .1 : 0;
    notify();
    await waitForFrame(pose, 0);
  }
  await settings({ micEnabled: false });
  await execute(microphoneWindow, 'clearInterval(window.zeroTimer); void 0');
  motion.blinkRemaining = 0;
  notify();
  await waitForFrame('open', 0);

  const regions = [[90, 680, 285, 290], [970, 470, 280, 370], [400, 100, 520, 1130]];
  const pixels = `(() => { const canvas = ${canvas}; const context = canvas.getContext('2d'); return ${JSON.stringify(regions)}.map(rect => {
    const crop = canvas.ownerDocument.createElement('canvas');
    crop.width = rect[2]; crop.height = rect[3];
    crop.getContext('2d').putImageData(context.getImageData(...rect), 0, 0);
    return crop.toDataURL();
  }); })()`;
  const first = await execute(obs, pixels);
  motion.elapsed = 1.25;
  notify();
  await waitForFrame('open', 30);
  const second = await execute(obs, pixels);
  assert.notEqual(first[0], second[0], 'Se mueve la voluta izquierda');
  assert.notEqual(first[1], second[1], 'Se mueve la voluta derecha');
  assert.equal(first[2], second[2], 'El centro del personaje queda fijo');

  motion.blinkIn = .02;
  await settings({ paused: false });
  await wait(() => getFrame().elapsed >= 1.35, 'Avance de la bruma sin micrófono');
  await settings({ paused: true });
  const pausedAt = getFrame().elapsed;
  await new Promise(resolve => setTimeout(resolve, 130));
  assert.equal(getFrame().elapsed, pausedAt);

  const savedSave = dialog.showSaveDialog;
  const exported = path.join(smokeRoot, 'exported-eduzero.pet');
  try {
    dialog.showSaveDialog = async () => ({ canceled: false, filePath: exported });
    await js('window.aula.editType("voice")');
    assert.ok((await js('window.aula.exportPet()')).saved);
    assert.deepEqual(parsePet(fs.readFileSync(exported)), parsePet(fs.readFileSync(path.join(root, 'pets', 'EduZero-Voz.pet'))));
  } finally {
    dialog.showSaveDialog = savedSave;
  }
  const url = await execute(obs, `${canvas}.toDataURL()`);
  fs.writeFileSync(path.join(smokeRoot, 'eduzero-animated.png'), Buffer.from(url.split(',')[1], 'base64'));
  return { eduzeroInVoiceCatalog: true, eduzeroCapturesAudio: true, eduzeroFourPosesSynchronized: true, eduzeroBothWispsMove: true, eduzeroBodyStable: true, eduzeroMovesInSilenceAndRespectsPause: true, eduzeroExportsSelfContained: true };
};
