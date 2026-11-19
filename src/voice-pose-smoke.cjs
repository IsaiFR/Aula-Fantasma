'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { nativeImage } = require('electron');

module.exports = async function ({ panel, obs, views, wait, motion, notify, voiceGate, microphoneWindow, getFrame, snapshot, root, smokeRoot, parsePet }, name) {
  const slug = name.toLowerCase();
  const js = code => panel.webContents.executeJavaScript(code);
  const audio = code => microphoneWindow.webContents.executeJavaScript(code);
  const settings = patch => js(`window.aula.setSettings(${JSON.stringify(patch)}, 'voice')`);
  const library = await js('window.aula.getPetLibrary()');
  const choice = library.pets.find(pet => pet.name === name);
  assert.equal(choice?.kind, 'voice');
  const selection = await js(`window.aula.selectPet(${JSON.stringify(choice.id)})`);
  assert.ok(!selection.error);
  await settings({ micEnabled: true, micDeviceId: 'default', micRelease: 0, paused: true, corner: 'bottom-left' });
  await wait(() => snapshot().microphone.status === 'active' && voiceGate.sampleTime > 0, `Audio de ${name}`);
  await audio('window.dispatchEvent(new Event("pagehide")); window.poseSmokeLevel = 0; window.poseSmokeTimer = setInterval(() => window.microphone.level(window.poseSmokeLevel), 30); void 0');

  const pet = parsePet(fs.readFileSync(path.join(root, 'pets', `${name}-Voz.pet`)));
  const canvas = "document.getElementById('voice-layer').contentDocument?.getElementById('pet-voice')";
  const inspect = `(() => { const canvas = ${canvas}; return canvas ? { ...canvas.dataset } : {}; })()`;
  const waitForPose = pose => wait(async () => {
    const frames = await Promise.all(views.map(view => view.webContents.executeJavaScript(inspect)));
    return frames.every(frame => frame.pose === pose && frame.asset === getFrame().voice.urls.open && frame.mirrored === 'false');
  }, `${name} ${pose}`);

  for (const [pose, speaking, blinking] of [['open', false, false], ['talking', true, false], ['talkingClosed', true, true], ['closed', false, true]]) {
    await audio(`window.poseSmokeLevel = ${speaking ? .4 : 0}; void 0`);
    motion.blinkRemaining = blinking ? .1 : 0;
    notify();
    await waitForPose(pose);
    const url = await obs.webContents.executeJavaScript(`${canvas}.toDataURL()`);
    const bytes = Buffer.from(url.split(',')[1], 'base64');
    const expected = nativeImage.createFromBuffer(pet.images[pose].bytes).toBitmap();
    assert.ok(nativeImage.createFromBuffer(bytes).toBitmap().equals(expected), `Píxeles de ${name} ${pose}`);
    fs.writeFileSync(path.join(smokeRoot, `${slug}-${pose}.png`), bytes);
  }

  motion.blinkRemaining = 0;
  motion.blinkIn = .02;
  await settings({ paused: false });
  await wait(() => getFrame().voice.blinking, `Parpadeo automático de ${name}`);
  await settings({ paused: true });
  await audio('window.poseSmokeLevel = .4; void 0');
  await wait(() => getFrame().voice.speaking, `${name} hablando`);
  await settings({ micEnabled: false });
  await wait(() => !getFrame().voice.speaking && snapshot().microphone.status === 'off', `${name} en reposo`);
  await audio('clearInterval(window.poseSmokeTimer); void 0');
  return {
    [`${slug}InVoiceCatalog`]: true,
    [`${slug}CapturesAudio`]: true,
    [`${slug}FourPosesSynchronized`]: true,
    [`${slug}AutomaticBlink`]: true,
    [`${slug}OffReturnsToRest`]: true
  };
};
