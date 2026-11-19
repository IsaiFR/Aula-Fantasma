'use strict';

const path = require('node:path');
const { BrowserWindow, WebContentsView, ipcMain, screen } = require('electron');
const { streamTablet, tabletError } = require('./tablet.cjs');
const { createPresentationStinger } = require('./presentation-stinger.cjs');

const SCENES = ['inicio', 'apuntes', 'receso', 'despedida'];
const RECESS_URL = 'https://edunetmx.online/obs/receso';
const WIDESCREEN = { width: 1920, height: 1080 };
const TABLET_PORTRAIT = { width: 1752, height: 2800 };

function createTabletPresentation({ root, runtime, url, compositionEnabled, secureWindow, changed, smoke }) {
  let window, ready, session, aspectRatio, videoSize, recess, stinger, requestedScene, switching;
  let scene = null, recessStatus = 'idle';
  let status = 'idle', message = '';
  const snapshot = () => ({ status, message, scene, recessStatus, canShow: Boolean(window?.isVisible()) });
  const update = (next, detail = '') => { status = next; message = detail; changed(); };
  const syncComposition = () => {
    if (window?.isVisible()) window.webContents.send('tablet:composition', compositionEnabled());
  };

  function closeRecess() {
    if (!recess) return;
    const { view, timeout } = recess;
    recess = undefined;
    clearTimeout(timeout);
    if (window && !window.isDestroyed()) window.contentView.removeChildView(view);
    if (!view.webContents.isDestroyed()) view.webContents.close();
  }

  function stop() {
    const current = window;
    requestedScene = null;
    stinger?.dispose();
    stinger = undefined;
    closeRecess();
    window = ready = aspectRatio = videoSize = undefined;
    scene = null;
    recessStatus = 'idle';
    if (current && !current.isDestroyed()) current.destroy();
    if (!session) { update('idle'); return; }
    update('stopping');
    session.abort.abort();
    return session.done;
  }

  function show() {
    if (!window) return;
    if (smoke) window.showInactive();
    else {
      if (window.isMinimized()) window.restore();
      window.show();
      window.focus();
    }
    syncComposition();
  }

  function fitScene({ width, height }) {
    const ratio = width / height;
    if (aspectRatio === ratio) return;
    const bounds = window.getBounds();
    const [contentWidth, contentHeight] = window.getContentSize();
    const work = screen.getDisplayMatching(bounds).workArea;
    const availableWidth = work.width - (bounds.width - contentWidth) - 24;
    const availableHeight = work.height - (bounds.height - contentHeight) - 24;
    const longEdge = height > width ? height : 1060;
    const scale = Math.min(1, availableWidth / width, availableHeight / height, longEdge / Math.max(width, height));
    aspectRatio = ratio;
    window.setAspectRatio(ratio);
    window.setContentSize(Math.round(width * scale), Math.round(height * scale));
    const resized = window.getBounds();
    const x = Math.round(bounds.x + (bounds.width - resized.width) / 2);
    const y = Math.round(bounds.y + (bounds.height - resized.height) / 2);
    window.setPosition(
      Math.max(work.x, Math.min(x, work.x + work.width - resized.width)),
      Math.max(work.y, Math.min(y, work.y + work.height - resized.height))
    );
  }

  function syncScene() {
    window.webContents.send('tablet:scene', { scene, recessStatus });
  }

  function resizeRecess() {
    if (!recess || !window || window.isDestroyed()) return;
    const [width, height] = window.getContentSize();
    recess.view.setBounds({ x: 0, y: 0, width, height });
  }

  function loadRecess() {
    const view = new WebContentsView({ webPreferences: {
      partition: 'aula-presentation-recess', sandbox: true, contextIsolation: true, nodeIntegration: false, autoplayPolicy: 'no-user-gesture-required'
    } });
    const contents = view.webContents;
    contents.session.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
    contents.session.setPermissionCheckHandler(() => false);
    contents.setWindowOpenHandler(() => ({ action: 'deny' }));
    contents.on('will-navigate', event => event.preventDefault());
    contents.on('will-redirect', event => { if (event.url !== RECESS_URL) event.preventDefault(); });
    if (smoke) contents.setAudioMuted(true);

    function fail() {
      if (recess?.view !== view) return;
      closeRecess();
      recessStatus = 'error';
      syncScene();
      changed();
    }

    recess = { view, timeout: setTimeout(fail, 20000) };
    recessStatus = 'loading';
    syncScene();
    changed();
    view.setVisible(false);
    window.contentView.addChildView(view);
    stinger.raise();
    resizeRecess();
    contents.on('render-process-gone', fail);
    contents.on('did-navigate', (_event, _url, statusCode) => { if (statusCode >= 400) fail(); });
    contents.loadURL(RECESS_URL).then(() => {
      if (recess?.view !== view) return;
      clearTimeout(recess.timeout);
      recessStatus = 'ready';
      syncScene();
      view.setVisible(true);
      changed();
    }).catch(fail);
  }

  function createWindow() {
    const presentation = new BrowserWindow({
      width: 1060, height: 720, minWidth: 260, minHeight: 240, show: false, maximizable: false, fullscreenable: false,
      frame: false,
      title: 'Aula Fantasma · Tablet', backgroundColor: '#000000',
      icon: path.join(root, 'assets', 'app-icon.png'),
      webPreferences: { preload: path.join(__dirname, 'tablet-preload.cjs'), contextIsolation: true, nodeIntegration: false, sandbox: true, backgroundThrottling: false, autoplayPolicy: 'no-user-gesture-required' }
    });
    presentation.setMenu(null);
    secureWindow(presentation);
    presentation.on('resize', resizeRecess);
    presentation.on('closed', () => {
      if (window === presentation) stop();
    });
    presentation.webContents.on('render-process-gone', () => {
      if (window !== presentation) return;
      stop();
      update('error', 'La ventana compartida se cerró. Selecciona una escena para abrirla de nuevo.');
    });
    return presentation;
  }

  const dimensions = next => next === 'apuntes' ? videoSize || TABLET_PORTRAIT : WIDESCREEN;

  async function replaceScene(next) {
    if (!window) {
      const presentation = window = createWindow();
      stinger = createPresentationStinger(presentation, url, secureWindow);
      ready = presentation.loadURL(url).catch(error => {
        if (window === presentation) stop();
        throw error;
      });
    }
    const presentation = window;
    scene = next;
    if (next !== 'receso') {
      closeRecess();
      recessStatus = 'idle';
    }
    changed();
    await ready;
    if (window !== presentation || scene !== next) return;
    if (window.isMinimized()) window.restore();
    fitScene(dimensions(next));
    syncScene();
    if (!window.isVisible()) show();
    changed();
    if (next === 'receso' && !recess) loadRecess();
    if (next !== 'apuntes') return;
    if (session?.abort.signal.aborted) await session.done;
    if (!session && window === presentation && scene === next) startTablet(presentation);
  }

  async function changeScenes() {
    while (requestedScene) {
      const next = requestedScene;
      requestedScene = null;
      if (!scene || scene === next) {
        await replaceScene(next);
        continue;
      }
      const presentation = window;
      const { width, height } = dimensions(next);
      await stinger.play(width < height ? 'vertical' : 'horizontal', () => {
        if (window === presentation) return replaceScene(next);
      });
    }
  }

  function selectScene(next) {
    if (!SCENES.includes(next)) throw new Error('Escena no válida.');
    requestedScene = next;
    switching ||= changeScenes().finally(() => { switching = undefined; });
    return switching;
  }

  function startTablet(presentation) {
    const id = Date.now();
    const abort = new AbortController();
    const current = { abort, id, done: null, timeout: null };
    session = current;
    update('starting');
    current.done = (async () => {
      let detail = '';
      try {
        presentation.webContents.send('tablet:session', id);
        current.timeout = setTimeout(() => abort.abort(new Error('No llegó imagen. Desbloquea la tablet, acepta la depuración USB y vuelve a conectar.')), 28000);
        await streamTablet({ runtime, signal: abort.signal, onPacket: packet => {
          if (!abort.signal.aborted && !presentation.isDestroyed()) presentation.webContents.send('tablet:packet', id, packet);
        } });
      } catch (error) {
        detail = tabletError(error);
      } finally {
        clearTimeout(current.timeout);
        session = null;
        if (status === 'stopping') { update('idle'); return; }
        if (presentation.isDestroyed()) return;
        presentation.webContents.send('tablet:session', null);
        update('error', abort.signal.reason?.message || detail || 'Se perdió la señal de la tablet. Vuelve a conectar.');
      }
    })();
  }

  ipcMain.on('tablet:playback', (event, id, playback, width, height) => {
    if (!window || event.sender !== window.webContents || event.senderFrame !== window.webContents.mainFrame || event.senderFrame.url !== url || !session || id !== session.id || session.abort.signal.aborted) return;
    if (playback === 'frame' && [width, height].every(size => Number.isInteger(size) && size > 0 && size <= 4096)) {
      videoSize = { width, height };
      if (scene === 'apuntes') fitScene(videoSize);
      if (status === 'starting') {
        clearTimeout(session.timeout);
        update('live');
      }
    } else if (playback === 'error') {
      session.abort.abort(new Error('No se pudo reproducir el video H.264. Vuelve a conectar la tablet.'));
    }
  });

  return { snapshot, start: () => selectScene('apuntes'), stop, show, selectScene, syncComposition, isRunning: () => Boolean(session) };
}

module.exports = { createTabletPresentation, SCENES };
