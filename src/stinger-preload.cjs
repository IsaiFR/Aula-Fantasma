'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('stinger', {
  onPlay: callback => { ipcRenderer.on('stinger:play', (_event, playback) => callback(playback)); },
  onStop: callback => { ipcRenderer.on('stinger:stop', (_event, id) => callback(id)); },
  signal: (id, signal) => ipcRenderer.send('stinger:signal', id, signal)
});
