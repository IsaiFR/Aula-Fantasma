'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

module.exports = async function({ panel, smokeRoot }) {
  const contents = panel.webContents;
  const js = code => contents.executeJavaScript(code);
  async function wait(predicate) {
    const deadline = Date.now() + 8000;
    do {
      if (await js(predicate)) return;
      await new Promise(resolve => setTimeout(resolve, 40));
    } while (Date.now() < deadline);
    throw new Error(`No se cumplió: ${predicate}`);
  }
  async function capture(name) {
    await js('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))');
    const image = await contents.capturePage(undefined, { stayHidden: true });
    assert.equal(image.isEmpty(), false);
    fs.writeFileSync(path.join(smokeRoot, `wide-${name}.png`), image.toPNG());
  }

  await wait("document.getElementById('inspector').getAttribute('aria-busy') === 'false'");
  assert.equal(await js('Number(getComputedStyle(document.body).zoom)'), 1);
  panel.setContentSize(2560, 1440);
  await wait('innerWidth === 2560 && innerHeight === 1440 && Number(getComputedStyle(document.body).zoom) === 1.4');
  assert.equal(contents.getZoomFactor(), 1);

  await js('window.aula.setCanvasFormat("16:9")');
  await js('window.aula.setSettings({obsEnabled:true,voiceEnabled:true,companionEnabled:true}, "companion")');
  await js('window.aula.editType("companion")');
  await wait(`(() => {
    const scene = document.getElementById('preview').getBoundingClientRect();
    const inspector = document.getElementById('inspector').getBoundingClientRect();
    return scene.width > 1000 && scene.bottom < innerHeight && inspector.bottom < innerHeight
      && scene.right < inspector.left && document.documentElement.scrollWidth <= innerWidth;
  })()`);
  await capture('recorrido');

  await js('window.aula.editType("voice")');
  await wait('!document.getElementById("voice-card").hidden');
  await capture('voz');

  await js('document.getElementById("edit-timer").click()');
  await wait('!document.getElementById("timer-settings").hidden');
  await capture('cronometro');

  await js('document.getElementById("edit-outputs").click()');
  await js('window.aula.setCanvasFormat("9:16")');
  await wait(`(() => {
    const scene = document.getElementById('preview').getBoundingClientRect();
    return !document.getElementById('output-settings').hidden && Math.abs(scene.width / scene.height - 9 / 16) < .002
      && scene.bottom < innerHeight;
  })()`);
  await capture('salidas-vertical');

  await js('window.aula.openPetSelector()');
  await wait("document.documentElement.dataset.libraryReady === 'true'");
  assert.equal(await js('Number(getComputedStyle(document.body).zoom)'), 1.4);
  assert.equal(await js('document.documentElement.scrollWidth <= innerWidth'), true);
  await wait("document.querySelector('.pet-preview iframe')?.contentDocument?.documentElement.dataset.connected === 'true'");
  await capture('biblioteca-voz');

  await js('window.aula.editType("companion")');
  await js('window.aula.openPetSelector()');
  await wait("document.getElementById('selector-type')?.textContent === '.aulapet'");
  await wait("document.querySelector('.pet-preview iframe')?.contentDocument?.documentElement.dataset.connected === 'true'");
  await capture('biblioteca-recorrido');
  return { compact: true, wideAt100Percent: true, horizontalPreview: true, portraitPreview: true, settingsAndLibraries: true };
};
