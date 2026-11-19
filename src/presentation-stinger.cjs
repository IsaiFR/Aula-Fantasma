'use strict';

const path = require('node:path');
const { WebContentsView } = require('electron');

function createPresentationStinger(window, url, secureWindow) {
  const stingerUrl = new URL('/stinger', url).href;
  const view = new WebContentsView({ webPreferences: {
    preload: path.join(__dirname, 'stinger-preload.cjs'),
    sandbox: true, contextIsolation: true, nodeIntegration: false, backgroundThrottling: false,
    autoplayPolicy: 'no-user-gesture-required'
  } });
  const contents = view.webContents;
  let playback, disposed = false, sequence = 0;
  secureWindow(view);
  view.setBackgroundColor('#00000000');
  view.setVisible(false);
  window.contentView.addChildView(view);
  const ready = contents.loadURL(stingerUrl).then(() => true, () => false);

  function resize() {
    if (disposed || window.isDestroyed()) return;
    const [width, height] = window.getContentSize();
    view.setBounds({ x: 0, y: 0, width, height });
  }

  function raise() {
    if (playback && !disposed) window.contentView.addChildView(view);
  }

  function cut() {
    if (playback.change) {
      playback.commit = Promise.resolve().then(playback.change);
      playback.commit.catch(() => {});
      playback.change = null;
    }
  }

  function finish(applyChange) {
    if (!playback) return;
    if (applyChange) cut();
    const current = playback;
    playback = undefined;
    clearTimeout(current.timeout);
    if (!window.isDestroyed()) {
      view.setVisible(false);
      if (!contents.isDestroyed() && !contents.isCrashed()) contents.send('stinger:stop', current.id);
    }
    current.resolve(current.commit);
  }

  contents.ipc.on('stinger:signal', (event, id, signal) => {
    if (!playback || id !== playback.id || event.senderFrame !== contents.mainFrame || event.senderFrame.url !== stingerUrl) return;
    if (signal === 'cut') cut();
    if (signal === 'ended') finish(true);
  });
  contents.on('render-process-gone', () => finish(true));
  window.on('resize', resize);
  resize();

  async function play(format, change) {
    const loaded = await ready;
    if (disposed || window.isDestroyed()) return;
    if (!loaded || contents.isDestroyed() || contents.isCrashed()) return change();
    return new Promise(resolve => {
      const id = ++sequence;
      playback = { id, change, resolve, timeout: setTimeout(() => finish(true), 4000) };
      raise();
      resize();
      view.setVisible(true);
      contents.send('stinger:play', { id, format });
    });
  }

  function dispose() {
    disposed = true;
    finish(false);
    window.off('resize', resize);
    if (!window.isDestroyed()) window.contentView.removeChildView(view);
    if (!contents.isDestroyed()) contents.close();
  }

  return { play, raise, dispose };
}

module.exports = { createPresentationStinger };
