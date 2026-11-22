'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { nativeImage } = require('electron');
const { VOICE_CYCLES } = require('./voice-cycle.cjs');

const canvas = "document.getElementById('voice-layer').contentDocument?.getElementById('pet-voice')";

function count(bitmap, width, [left, top, right, bottom], predicate) {
  let result = 0;
  for (let y = Math.floor(top * width / 450); y < Math.floor(bottom * width / 450); y++) {
    for (let x = Math.floor(left * width / 450); x < Math.floor(right * width / 450); x++) {
      if (predicate(bitmap, (y * width + x) * 4)) result++;
    }
  }
  return result;
}

const visible = (data, offset) => data[offset + 3] > 24;
const differs = before => (after, offset) => after.readUInt32LE(offset) !== before.readUInt32LE(offset);

module.exports = async function ({ panel, obs, views, wait, getFrame, motion, notify, smokeRoot, root, parsePet, activatePet, snapshot }) {
  const js = script => panel.webContents.executeJavaScript(script);
  await js('window.aula.editType("voice")');
  await js('window.aula.setSettings({ paused: true, micEnabled: false, corner: "bottom-left" }, "voice")');
  const library = await js('window.aula.getPetLibrary()');
  const checks = {};

  async function renderAt(elapsed, action) {
    motion.elapsed = elapsed;
    motion.blinkRemaining = 0;
    notify();
    const frame = getFrame();
    assert.equal(frame.voiceCycle?.action ?? '', action);
    await wait(async () => (await Promise.all(views.map(view => view.webContents.executeJavaScript(`(() => {
      const c = ${canvas};
      return c?.dataset.asset === ${JSON.stringify(frame.voice.urls.open)} && c.dataset.action === ${JSON.stringify(action)} &&
        c.dataset.actionTime === ${JSON.stringify(frame.voiceCycle ? String(frame.voiceCycle.time) : '')};
    })()`)))).every(Boolean), `${action || 'reposo'} ${elapsed}s`);
    const png = Buffer.from((await obs.webContents.executeJavaScript(`${canvas}.toDataURL()`)).split(',')[1], 'base64');
    const image = nativeImage.createFromBuffer(png);
    return { png, pixels: image.toBitmap(), width: image.getSize().width };
  }

  for (const [name, { action, idleSeconds, activeSeconds }] of Object.entries(VOICE_CYCLES)) {
    const choice = library.pets.find(pet => pet.name === name);
    assert.equal(choice?.kind, 'voice', name);
    assert.ok(!(await js(`window.aula.selectPet(${JSON.stringify(choice.id)})`)).error, name);
    await js('window.aula.resetPosition()');
    const idle = await renderAt(idleSeconds - .25, '');
    const early = await renderAt(idleSeconds + activeSeconds * .22, action);
    const peak = await renderAt(idleSeconds + activeSeconds * .57, action);
    const rest = await renderAt(idleSeconds + activeSeconds + .25, '');
    assert.ok(!idle.pixels.equals(peak.pixels), `${name} cambia durante el ciclo`);
    if (action !== 'freeze') assert.ok(rest.pixels.equals(idle.pixels), `${name} recupera su pose completa`);
    const changes = box => count(peak.pixels, peak.width, box, differs(idle.pixels));
    assert.ok(changes([0, 0, 450, 450]) > 1000, `${name} tiene un cambio visible`);

    if (action === 'scan') {
      const open = await renderAt(idleSeconds + activeSeconds * .45, action);
      const folded = await renderAt(idleSeconds + activeSeconds * .73, action);
      for (const tip of [[340,5,363,29], [424,31,441,47], [417,96,438,112], [337,83,354,97]]) {
        const extended = count(open.pixels, open.width, tip, visible);
        const retracted = count(folded.pixels, folded.width, tip, visible);
        assert.ok(extended > 100 && retracted < extended * .3, `El extremo ${tip[0]}, ${tip[1]} se repliega`);
      }
      assert.ok(changes([255, 270, 321, 326]) > 1000, 'Reacciona el bebé');
      fs.writeFileSync(path.join(smokeRoot, 'edustrading-sensor-open.png'), open.png);
      fs.writeFileSync(path.join(smokeRoot, 'edustrading-sensor-folded.png'), folded.png);
    } else if (action === 'melt') {
      assert.equal(count(peak.pixels, peak.width, [0, 0, 450, 385], visible), 0, 'La mascota se derrite completamente');
      assert.ok(count(peak.pixels, peak.width, [60, 391, 410, 450], visible) > 1000, 'Queda el charco');
    } else if (action === 'helmet') {
      assert.equal(count(peak.pixels, peak.width, [303, 275, 422, 410], visible), 0, 'El casco se levanta del suelo');
      assert.ok(changes([157, 35, 340, 193]) > 1500, 'El casco queda puesto sobre la cabeza');
    } else if (action === 'freeze') {
      const frozen = await renderAt(idleSeconds + activeSeconds * .64, action);
      assert.ok(frozen.pixels.equals(peak.pixels), 'La pose y el hielo permanecen inmóviles al congelarse');
      assert.ok(changes([128, 60, 390, 418]) > 1000, 'Escarcha visible sobre toda la pose');
    } else if (action === 'agent') {
      assert.ok(changes([90, 407, 360, 444]) > 1500, 'Aparece el letrero de la entrada');
      assert.ok(!early.pixels.equals(peak.pixels), 'La entrada avanza hasta la revelación');
    } else {
      assert.ok(changes([39, 46, 419, 421]) > 1500, 'Forma incandescente visible');
      assert.ok(!early.pixels.equals(peak.pixels), 'Las llamas cambian con el tiempo');
    }
    await renderAt(idleSeconds * 2 + activeSeconds * 1.57, action);
    await js('window.aula.resetPosition()');
    assert.equal(getFrame().voiceCycle, null, `${name} vuelve a esperar después de reiniciar`);
    fs.writeFileSync(path.join(smokeRoot, `${name.toLowerCase()}-cycle.png`), peak.png);
    checks[`${name}PeriodicAction`] = true;
  }
  const returnal = parsePet(fs.readFileSync(path.join(root, 'pets', 'EduReturnal-Voz.pet')));
  activatePet({ ...returnal, effects: { voiceCycle: { action: 'parasites', idleSeconds: 20, activeSeconds: 6.5 } } }, true);
  await js('window.aula.resetPosition()');
  const before = await renderAt(19.75, '');
  const after = await renderAt(24, '');
  assert.equal(snapshot().assetName, 'EduReturnal');
  assert.equal(snapshot().effects.voiceCycle, undefined, 'La selección anterior se actualiza');
  assert.ok(before.pixels.equals(after.pixels), 'EduReturnal permanece en reposo');
  checks.eduReturnalRetiredCycle = true;
  return checks;
};
