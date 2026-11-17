'use strict';
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
module.exports = async function({ BrowserWindow, smokeRoot, panel, desktop, countdown, notify, server, secureWindow, savePreferences, loadPreferences }) {
  const checks = {}, js = code => panel.webContents.executeJavaScript(code);
  const wait = async (predicate, label) => {
    const until = Date.now() + 6000;
    do { if (await predicate()) return; await new Promise(resolve => setTimeout(resolve, 35)); } while (Date.now() < until);
    throw new Error(label);
  };
  const observer = (width, height) => {
    const window = new BrowserWindow({ width, height, show: false, frame: false, transparent: true, backgroundColor: '#00000000',
      webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true, backgroundThrottling: false, offscreen: true, autoplayPolicy: 'no-user-gesture-required' } });
    secureWindow(window); return window;
  };
  let obs = observer(960, 540);
  const view = window => window.webContents.executeJavaScript(`(() => {
    const el = document.getElementById('class-countdown'); if (!el) return null;
    const rect=el.getBoundingClientRect();
    return { hidden:el.hidden, phase:el.dataset.phase, remaining:Number(el.dataset.remaining), digits:el.querySelector('.timer-digits').textContent, caption:el.querySelector('.timer-caption').textContent, left:rect.left, bottom:innerHeight-rect.bottom, right:rect.right, top:rect.top, audio:el.dataset.audio, bells:Number(el.dataset.bellCount||0) };
  })()`);
  const capture = async (window, name) => {
    const image = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('No se pudo capturar el temporizador.')), 3000);
      window.webContents.once('paint', (_event, _rect, image) => { clearTimeout(timeout); resolve(image); });
      window.webContents.invalidate();
    });
    fs.writeFileSync(path.join(smokeRoot, name), image.toPNG());
    return image;
  };
  const originalClock = countdown.clock;
  let now = 0;
  countdown.clock = () => now;
  const at = async (time, predicate) => {
    now = time * 1000; notify();
    await wait(async () => predicate(await view(obs)) && predicate(await view(panel)) && predicate(await view(desktop)), `Secuencia a ${time} s`);
  };
  try {
    await js('window.aula.setCanvasFormat("16:9")');
    await js('window.aula.editType("companion")');
    await js('window.aula.setSettings({voiceEnabled:false,companionEnabled:false,paused:true},"companion")');
    await obs.loadURL(`${server.url}/overlay`);
    countdown.stop(); countdown.configure({ seconds: 120, x: 48, y: 48, desktopEnabled: false }); notify();
    await wait(async () => (await view(obs))?.hidden && await js('document.getElementById("timer-duration").value === "2:00"'), 'Controles listos');
    await wait(async () => (await view(desktop))?.hidden, 'Monitor oculto por defecto');
    await js('document.getElementById("edit-timer").click()');
    assert.equal(await js('document.getElementById("timer-settings").hidden'), false);
    checks.defaultDesktopOff = true;
    await js(`document.querySelector('[data-timer-seconds="300"]').click()`);
    await wait(() => countdown.config.seconds === 300, 'Duración rápida');
    assert.equal(await js(`document.querySelector('[data-timer-seconds="300"]').getAttribute('aria-pressed')`), 'true');
    await js(`document.querySelector('[data-timer-seconds="120"]').click()`);
    await wait(() => countdown.config.seconds === 120, 'Restaurar duración de dos minutos');
    checks.durationPresets = true;
    await js('window.aula.setSettings({desktopEnabled:false},"companion")');
    await js('document.getElementById("timer-desktop").click()');
    await wait(() => countdown.config.desktopEnabled, 'Activar monitor');
    await js('document.getElementById("timer-plus").click()');
    await wait(() => countdown.config.seconds === 130, 'Sumar diez');
    await js('document.getElementById("timer-minus").click()');
    await wait(() => countdown.config.seconds === 120, 'Restar diez');
    await js('document.getElementById("timer-duration").value="2:30";document.getElementById("timer-duration").dispatchEvent(new Event("change"))');
    await wait(() => countdown.config.seconds === 150, 'Teclado minutos');
    await js('document.getElementById("timer-duration").value="120";document.getElementById("timer-duration").dispatchEvent(new Event("change"))');
    await wait(() => countdown.config.seconds === 120, 'Teclado segundos');
    checks.tenSecondAndKeyboardControls = true;
    for (const [key, value] of [['x', 240], ['y', 180]]) {
      await js(`document.getElementById('timer-${key}').value='${value}';document.getElementById('timer-${key}').dispatchEvent(new Event('change'))`);
      await wait(() => countdown.config[key] === value, 'Coordenada ' + key);
    }
    await js('document.getElementById("timer-position").click()');
    await wait(async () => (await view(obs))?.phase === 'position', 'Previsualizar posición');
    const position = await view(obs); assert.equal(position.left, 120); assert.equal(position.bottom, 90);
    await wait(async () => !(await view(desktop)).hidden, 'Posición visible en monitor sin mascotas');
    checks.bottomLeftOrigin = true;
    checks.desktopIndependentFromPets = true;
    await js('document.getElementById("timer-start").click()');
    await at(0, v => v?.phase === 'ready' && v.digits === '3' && !v.hidden);
    assert.equal(await js('document.getElementById("timer-duration").disabled'), true);
    assert.equal(await js('document.getElementById("timer-display").textContent'), '3');
    await capture(panel, 'countdown-panel.png');
    await at(1, v => v?.digits === '2'); await at(2, v => v?.digits === '1');
    await at(3, v => v?.phase === 'running' && v.digits === '2:00' && !v.hidden);
    const run = countdown.frame().runId;
    await js('document.getElementById("timer-desktop").click()');
    await wait(async () => (await view(desktop)).hidden && !(await view(obs)).hidden, 'Ocultar solo monitor');
    assert.equal(countdown.frame().runId, run);
    await js('document.getElementById("timer-desktop").click()');
    await wait(async () => !(await view(desktop)).hidden, 'Restaurar monitor sin reiniciar');
    checks.desktopToggleDoesNotResetOrHideObs = true;
    const blackText = window => window.webContents.executeJavaScript(`['.timer-caption','.timer-digits','.timer-detail'].every(selector=>getComputedStyle(document.querySelector('#class-countdown '+selector)).color==='rgb(0, 0, 0)')`);
    assert.ok(await blackText(obs)); assert.ok(await blackText(desktop));
    checks.blackTextOnBothSurfaces = true;
    await at(7.99, v => !v?.hidden && v.remaining === 116);
    await js('document.getElementById("edit-outputs").click()');
    await at(8, v => v?.phase === 'running' && v.hidden && v.remaining === 115);
    assert.equal(await js('document.getElementById("timer-layer-state").textContent'), '1:55');
    assert.equal(countdown.frame().runId, run);
    await js('document.getElementById("edit-timer").click()');
    checks.remainingVisibleAcrossPanels = true;
    checks.preparationAndFiveVisibleSeconds = true;
    await at(113, v => v?.hidden && v.remaining === 10);
    await wait(async () => (await view(obs)).audio === 'played', 'Reproducción de campana');
    await new Promise(resolve => setTimeout(resolve, 250));
    assert.equal((await view(obs)).bells, 1); assert.equal((await view(panel)).bells, 0); assert.equal((await view(desktop)).bells, 0);
    checks.bellPlaysOnceOnlyInObs = true;
    await at(120, v => v?.remaining === 3 && !v.hidden);
    const image = await capture(obs, 'countdown-last-three.png');
    // Píxel superior izquierdo: la fuente conserva transparencia fuera del contador.
    assert.equal(image.toBitmap()[3], 0);
    await at(121, v => v?.remaining === 2 && !v.hidden);
    await at(122, v => v?.remaining === 1 && !v.hidden);
    await at(123, v => v?.phase === 'finished' && !v.hidden);
    await new Promise(resolve => setTimeout(resolve, 850));
    assert.ok(await blackText(obs)); assert.ok(await blackText(desktop));
    await capture(obs, 'countdown-finished.png');
    await at(125.99, v => v?.phase === 'finished' && !v.hidden);
    await at(126, v => v?.phase === 'done' && v.hidden);
    checks.lastThreeCompletionAndTransparency = true;
    assert.equal(countdown.frame().remaining, 0);
    assert.equal(await js('window.aula.getState().then(state => state.settings.paused)'), true);
    checks.independentFromPetPauseAndVisibility = true;
    await js('window.aula.countdown("configure",{seconds:180})');
    assert.equal(countdown.frame().phase, 'idle');
    await js('window.aula.countdown("start")');
    await wait(async () => (await view(obs)).phase === 'ready', 'Reiniciar');
    await js('document.getElementById("timer-stop").click()');
    await wait(async () => (await view(obs)).hidden, 'Cancelar');
    checks.restartAndCancel = !countdown.frame().active;
    await js('window.aula.setCanvasFormat("9:16")');
    await js('window.aula.countdown("configure",{x:10000,y:10000})');
    await js('window.aula.countdown("position")');
    obs.destroy(); obs = observer(360, 640);
    await obs.loadURL(`${server.url}/overlay`);
    await wait(async () => {
      const v = await view(obs);
      return v && !v.hidden && Math.abs(v.left - 760 / 3) < 1 && Math.abs(v.bottom - 588) < 1 && v.right <= 361 && v.top >= -1;
    }, 'Contención vertical');
    await capture(obs, 'countdown-portrait.png'); checks.portraitContainment = true;
    savePreferences(); loadPreferences();
    assert.equal(countdown.config.seconds, 180); assert.equal(countdown.config.x, 10000);
    assert.equal(countdown.config.desktopEnabled, true);
    assert.equal(countdown.frame().active, false); assert.equal(countdown.frame().visible, false);
    checks.savedConfigurationDoesNotAutostart = true;
    await js('window.aula.setCanvasFormat("16:9")');
    // Una actividad completa con el reloj real comprueba el avance autónomo del proceso.
    countdown.clock = originalClock;
    await js('window.aula.countdown("configure",{seconds:10,x:48,y:48})');
    await js('window.aula.countdown("start")');
    await wait(async () => (await view(obs)).phase === 'running', 'Inicio con reloj real');
    await wait(async () => (await view(obs)).hidden && (await view(obs)).phase === 'running', 'Ocultamiento con reloj real');
    await wait(async () => (await view(obs)).remaining === 3 && !(await view(obs)).hidden, 'Últimos segundos con reloj real');
    await wait(async () => (await view(obs)).phase === 'finished', 'Final con reloj real');
    await wait(async () => (await view(obs)).phase === 'done' && (await view(obs)).hidden, 'Cierre con reloj real');
    checks.realClockCompletesWithoutPetMotion = true;
    await js('window.aula.countdown("configure",{seconds:120,x:48,y:48})');
  } finally { countdown.stop(); countdown.clock = originalClock; obs.destroy(); }
  return checks;
};
