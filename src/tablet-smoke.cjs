'use strict';

const { setTimeout: delay } = require('node:timers/promises');
const { desktopCapturer } = require('electron');

module.exports = async function tabletSmoke({ panel, BrowserWindow, tablet, server, countdown, notify, secureWindow, savePreferences, loadPreferences }) {
  const run = code => panel.webContents.executeJavaScript(code);
  const wait = async (predicate, timeout = 6000) => {
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
      if (await predicate()) return true;
      await delay(120);
    }
    return false;
  };
  const getPresentation = () => BrowserWindow.getAllWindows().find(window => window.getTitle() === 'Aula Fantasma · Tablet');
  const select = name => run(`document.getElementById('present-${name}').click()`);
  const scene = (window, insideTablet = false) => window.webContents.executeJavaScript(`(() => {
    const root = ${insideTablet ? "document.getElementById('tablet-overlay')?.contentDocument" : 'document'};
    const voice = root?.getElementById('voice-layer')?.contentDocument;
    const timer = root?.getElementById('class-countdown');
    const rect = timer?.getBoundingClientRect();
    return {
      companion: root?.getElementById('pet-anchor')?.style.visibility === 'visible',
      voice: voice?.getElementById('pet-anchor')?.style.visibility === 'visible',
      phase: timer?.dataset.phase,
      digits: timer?.querySelector('.timer-digits').textContent,
      shown: timer?.hidden === false,
      bells: Number(timer?.dataset.bellCount || 0),
      contained: Boolean(rect && rect.width && rect.left >= -1 && rect.top >= -1 && rect.right <= root.defaultView.innerWidth + 1 && rect.bottom <= root.defaultView.innerHeight + 1)
    };
  })()`);
  const clock = countdown.clock;
  let now = 0, obs;
  const checks = {};
  try {
    countdown.clock = () => now;
    countdown.stop();
    await run('window.aula.setCanvasFormat("16:9")');
    await run('window.aula.setSettings({ voiceEnabled: true, companionEnabled: true, obsEnabled: false, desktopEnabled: false, presenceEnabled: false, mode: "still" }, "companion")');
    await run('window.aula.tablet("composition", true)');
    await run('window.aula.countdown("configure", { seconds: 120, x: 48, y: 48, desktopEnabled: false })');
    await run("document.getElementById('edit-tablet').click()");
    checks.panel = await run("!document.getElementById('tablet-settings').hidden && document.getElementById('timer-settings').hidden");
    checks.optIn = tablet.snapshot().status === 'idle' && !getPresentation();
    await select('inicio');
    if (!await wait(() => getPresentation()?.isVisible())) throw new Error('No se abrió la ventana de las escenas.');
    const presentation = getPresentation();
    const handle = presentation.getNativeWindowHandle();
    const present = code => presentation.webContents.executeJavaScript(code);
    const sameWindow = () => getPresentation() === presentation && presentation.getNativeWindowHandle().equals(handle);
    const isHorizontal = () => present('Math.abs(innerWidth - innerHeight * 16 / 9) <= 1');
    const stingerView = () => presentation.contentView.children.find(child => child.webContents?.getURL().endsWith('/stinger'));
    const stingerTime = async format => {
      const layer = stingerView();
      if (!layer?.getVisible()) return 0;
      return layer.webContents.executeJavaScript(`(() => {
        const video = document.getElementById('${format}');
        return video.hidden || video.paused ? 0 : video.currentTime;
      })()`);
    };
    const hasSlide = name => present(`(() => {
      const image = document.getElementById('scene-${name}');
      return document.body.dataset.scene === '${name}' && image.complete && image.naturalWidth > 1600 && !image.hidden
        && document.getElementById('tablet-stage').hidden && !document.getElementById('tablet-overlay');
    })()`);
    checks.openingWithoutTablet = await wait(async () => await hasSlide('inicio') && await isHorizontal()) && !tablet.isRunning() && tablet.snapshot().status === 'idle';
    checks.selectedScene = await run("document.getElementById('present-inicio').getAttribute('aria-pressed') === 'true'");
    await select('apuntes');
    checks.verticalStinger = await wait(async () => {
      const time = await stingerTime('vertical');
      return time > 0 && time < .9 && tablet.snapshot().scene === 'inicio';
    });
    checks.cutsDuringStinger = await wait(async () => tablet.snapshot().scene === 'apuntes' && await stingerTime('vertical') >= .87);
    checks.live = await wait(() => ['live', 'error'].includes(tablet.snapshot().status), 34000) && tablet.snapshot().status === 'live';
    if (!checks.live) throw new Error(tablet.snapshot().message || 'La tablet no produjo imagen.');
    checks.overlayIndependent = await run("fetch('/state').then(response => response.json()).then(frame => !('tablet' in frame))");
    checks.notesInSameWindow = sameWindow();
    presentation.webContents.setAudioMuted(true);
    const geometry = () => present(`(() => {
      const canvas = document.getElementById('tablet-screen');
      const video = canvas.getBoundingClientRect();
      const overlay = document.getElementById('tablet-overlay')?.getBoundingClientRect();
      return { videoWidth: canvas.width, videoHeight: canvas.height, windowWidth: innerWidth, windowHeight: innerHeight,
        fillsWindow: Math.max(Math.abs(video.left), Math.abs(video.top), Math.abs(innerWidth - video.right), Math.abs(innerHeight - video.bottom)) <= 1,
        overlaysAligned: Boolean(overlay && ['left', 'top', 'width', 'height'].every(key => Math.abs(video[key] - overlay[key]) < 1)) };
    })()`);
    const video = await geometry();
    checks.video = video.videoWidth > 300 && video.videoHeight > 150;
    checks.windowMatchesVideo = video.fillsWindow && Math.abs(video.windowWidth - video.windowHeight * video.videoWidth / video.videoHeight) <= 1;
    checks.windowDisallowsStretch = !presentation.isMaximizable() && !presentation.isFullScreenable();
    const bounds = presentation.getBounds();
    const content = presentation.getContentBounds();
    checks.windowHasNoTitleBar = bounds.y === content.y && bounds.height === content.height;
    console.log('TABLET_GEOMETRY=' + JSON.stringify(video));
    const sources = await desktopCapturer.getSources({ types: ['window'], thumbnailSize: { width: 0, height: 0 } });
    checks.shareableWindow = presentation?.isVisible() && sources.some(source => source.name === presentation.getTitle());
    checks.layersWithObsOff = await wait(async () => {
      const v = await scene(presentation, true);
      return v.companion && v.voice && server.stats().obs === 0;
    });
    await run('window.aula.setSettings({ voiceEnabled: false }, "voice")');
    checks.voiceToggle = await wait(async () => { const v = await scene(presentation, true); return v.companion && !v.voice; });
    await run('window.aula.setSettings({ voiceEnabled: true, companionEnabled: false }, "companion")');
    checks.companionToggle = await wait(async () => { const v = await scene(presentation, true); return !v.companion && v.voice; });
    await run('window.aula.setSettings({ companionEnabled: true, obsEnabled: true }, "companion")');
    obs = new BrowserWindow({ width: 960, height: 540, show: false, transparent: true,
      webPreferences: { sandbox: true, offscreen: true, backgroundThrottling: false, autoplayPolicy: 'no-user-gesture-required' } });
    obs.webContents.setAudioMuted(true);
    secureWindow(obs);
    await obs.loadURL(`${server.url}/overlay`);
    checks.obsLayers = await wait(async () => { const v = await scene(obs); return server.stats().obs === 1 && v.companion && v.voice; });

    await run("document.getElementById('edit-timer').click(); document.getElementById('timer-start').click()");
    const at = async (seconds, predicate) => {
      now = seconds * 1000;
      notify();
      return wait(async () => predicate(await scene(presentation, true)) && predicate(await scene(obs)));
    };
    checks.timerInParallel = await at(0, v => v.phase === 'ready' && v.digits === '3' && v.shown);
    const resizedHeight = Math.round(video.windowHeight * .9);
    const resizedWidth = Math.round(resizedHeight * video.videoWidth / video.videoHeight);
    presentation.setContentSize(resizedWidth, resizedHeight);
    checks.videoAlignedAfterResize = await wait(async () => {
      const resized = await geometry();
      return resized.windowWidth === resizedWidth && resized.windowHeight === resizedHeight && resized.fillsWindow && resized.overlaysAligned;
    });
    checks.briefCountdown = await at(8, v => v.digits === '1:55' && !v.shown);
    const notesTimerId = countdown.frame().runId;
    await select('receso');
    checks.horizontalStinger = await wait(async () => {
      const time = await stingerTime('horizontal');
      return time > 0 && time < .9 && tablet.snapshot().scene === 'apuntes';
    });
    checks.stingerAboveRecessOnEntry = await wait(async () => tablet.snapshot().scene === 'receso'
      && await stingerTime('horizontal') > 0 && presentation.contentView.children.at(-1) === stingerView());
    const recessView = () => presentation.contentView.children.find(child => child.webContents?.getURL() === 'https://edunetmx.online/obs/receso');
    checks.recessInSameWindow = await wait(async () => tablet.snapshot().recessStatus === 'ready' && recessView()?.getVisible() && await isHorizontal(), 23000) && sameWindow();
    const recess = recessView();
    if (recess) {
      const [width, height] = presentation.getContentSize();
      const bounds = recess.getBounds();
      checks.recessFillsWindow = bounds.x === 0 && bounds.y === 0 && bounds.width === width && bounds.height === height;
      const readRecessTime = () => recess.webContents.executeJavaScript(`(() => {
        const clock = document.querySelector('.obs-christmas__time, [role="timer"]');
        return clock?.textContent.trim() || '';
      })()`);
      const startTime = await readRecessTime();
      checks.liveRecessCountdown = await wait(async () => { const next = await readRecessTime(); return /\d+:\d{2}/.test(next) && next !== startTime; });
      checks.recessIsolated = await recess.webContents.executeJavaScript("typeof window.tablet === 'undefined' && typeof require === 'undefined'");
    } else checks.liveRecessCountdown = false;
    checks.tabletHiddenDuringRecess = await present("document.getElementById('tablet-stage').hidden && !document.getElementById('tablet-overlay')") && tablet.snapshot().status === 'live';
    const recessContents = recess?.webContents;
    await select('despedida');
    checks.stingerAboveRecessOnExit = await wait(async () => tablet.snapshot().scene === 'receso'
      && await stingerTime('horizontal') > 0 && presentation.contentView.children.at(-1) === stingerView());
    checks.farewell = await wait(async () => await hasSlide('despedida') && await isHorizontal()) && sameWindow();
    checks.recessDisposed = Boolean(recessContents?.isDestroyed());
    await select('apuntes');
    checks.returnToNotes = await wait(async () => {
      const v = await geometry();
      return tablet.snapshot().scene === 'apuntes' && v.videoWidth === video.videoWidth && v.videoHeight === video.videoHeight && v.fillsWindow && v.overlaysAligned;
    }) && sameWindow() && tablet.snapshot().status === 'live' && countdown.frame().runId === notesTimerId;
    checks.bellOncePerOutput = await at(113, v => v.bells === 1);
    checks.finalSeconds = await at(120, v => v.digits === '0:03' && v.shown && v.contained);
    checks.completion = await at(123, v => v.phase === 'finished' && v.shown && v.bells === 1);
    const runId = countdown.frame().runId;
    await run("document.getElementById('edit-tablet').click(); document.getElementById('tablet-composition').click()");
    checks.cleanTablet = await wait(() => present("!document.getElementById('tablet-overlay') && document.getElementById('tablet-screen').width > 300")) && tablet.snapshot().status === 'live';
    checks.obsContinues = (await scene(obs)).shown && countdown.frame().runId === runId && server.stats().obs === 1;
    await run("document.getElementById('tablet-composition').click()");
    checks.compositionRestored = await wait(async () => (await scene(presentation, true)).phase === 'finished') && countdown.frame().runId === runId;
    await run("document.getElementById('edit-tablet').click(); document.getElementById('tablet-stop').click()");
    checks.stop = await wait(() => tablet.snapshot().status === 'idle') && !getPresentation();
    await run(`(() => {
      document.getElementById('open-scene-shortcuts').click();
      const input = document.getElementById('shortcut-inicio');
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'F9', ctrlKey: true, altKey: true, shiftKey: true, cancelable: true }));
      input.form.requestSubmit();
    })()`);
    checks.shortcutInPanel = await wait(() => run("document.querySelector('#present-inicio kbd').textContent === 'Ctrl+Alt+Shift+F9'"));
    checks.duplicateShortcutRejected = await run("window.aula.sceneShortcut('receso','Ctrl+Alt+Shift+F9').then(result => Boolean(result.error))");
    checks.timerShortcutProtected = await run("window.aula.sceneShortcut('apuntes','Ctrl+Shift+C').then(result => Boolean(result.error))");
    await run('window.aula.tablet("composition", false)');
    savePreferences(); loadPreferences(); notify();
    checks.preferenceRestored = await run('window.aula.getState().then(state => state.tablet.compositionEnabled === false)');
    checks.shortcutRestored = await run('window.aula.getState().then(state => state.tablet.shortcuts.inicio.active && state.tablet.shortcuts.inicio.shortcut === "Ctrl+Alt+Shift+F9")');
    await run("document.querySelector('form[data-shortcut=inicio] [data-clear]').click()");
    checks.shortcutRemoved = await wait(() => run("document.querySelector('#present-inicio kbd').hidden"));
    await run("document.getElementById('close-scene-shortcuts').click()");
    await run("document.getElementById('tablet-start').click()");
    checks.reconnect = await wait(() => ['live', 'error'].includes(tablet.snapshot().status), 34000) && tablet.snapshot().status === 'live';
    checks.reconnectWithoutLayers = checks.reconnect && await getPresentation().webContents.executeJavaScript("!document.getElementById('tablet-overlay')");
    getPresentation()?.close();
    checks.closeStops = checks.reconnect && await wait(() => tablet.snapshot().status === 'idle') && !getPresentation();
  } finally {
    countdown.clock = clock;
    countdown.stop();
    obs?.destroy();
    await tablet.stop();
  }
  return checks;
};
