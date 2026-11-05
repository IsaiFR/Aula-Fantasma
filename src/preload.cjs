'use strict';
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('aula', {
  getState: () => ipcRenderer.invoke('aula:state'),
  setCanvasFormat: format => ipcRenderer.invoke('aula:canvas', format),
  editType: type => ipcRenderer.invoke('aula:edit-type', type),
  setSettings: (patch, type) => ipcRenderer.invoke('aula:settings', patch, type),
  importImage: () => ipcRenderer.invoke('aula:import'),
  openPetSelector: () => ipcRenderer.invoke('aula:open-pets'),
  openPanel: () => ipcRenderer.invoke('aula:open-panel'),
  getPetLibrary: () => ipcRenderer.invoke('aula:pet-library'),
  selectPet: id => ipcRenderer.invoke('aula:select-pet', id),
  exportPet: () => ipcRenderer.invoke('aula:export-pet'),
  resetImage: () => ipcRenderer.invoke('aula:reset-image'),
  resetPosition: () => ipcRenderer.invoke('aula:reset-position'),
  booNow: () => ipcRenderer.invoke('aula:boo-now'),
  copyUrl: () => ipcRenderer.invoke('aula:copy-url'),
  openGuide: () => ipcRenderer.invoke('aula:guide'),
  hidePanel: () => ipcRenderer.invoke('aula:hide-panel'),
  quit: () => ipcRenderer.invoke('aula:quit'),
  onState: callback => {
    const listener = (_event, state) => callback(state);
    ipcRenderer.on('aula:changed', listener);
    return () => ipcRenderer.removeListener('aula:changed', listener);
  }
});
