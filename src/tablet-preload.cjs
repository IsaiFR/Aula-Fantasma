'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('tablet', {
  onComposition: callback => { ipcRenderer.on('tablet:composition', (_event, enabled) => callback(enabled)); },
  onScene: callback => { ipcRenderer.on('tablet:scene', (_event, scene) => callback(scene)); },
  onSession: callback => { ipcRenderer.on('tablet:session', (_event, id) => callback(id)); },
  onPacket: callback => { ipcRenderer.on('tablet:packet', (_event, id, packet) => callback(id, packet)); },
  report: (id, playback, width, height) => ipcRenderer.send('tablet:playback', id, playback, width, height)
});
