'use strict';
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('microphone', {
  config: () => ipcRenderer.invoke('aula:mic-config'),
  level: value => ipcRenderer.send('aula:mic-level', value),
  status: value => ipcRenderer.send('aula:mic-status', value),
  onConfig: callback => ipcRenderer.on('aula:mic-config', (_event, config) => callback(config))
});
