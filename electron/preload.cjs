const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openVideoDialog: () => ipcRenderer.invoke('dialog:openVideo'),
  saveFileDialog: (options) => ipcRenderer.invoke('dialog:saveFile', options),
  readFileAsBase64: (filePath) => ipcRenderer.invoke('file:readAsBase64', filePath),
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window:maximize'),
  closeWindow: () => ipcRenderer.invoke('window:close'),
  
  // Local Database API
  dbSaveProject: (project) => ipcRenderer.invoke('db:saveProject', project),
  dbGetProjects: () => ipcRenderer.invoke('db:getProjects'),
  dbGetProject: (id) => ipcRenderer.invoke('db:getProject', id),
  dbDeleteProject: (id) => ipcRenderer.invoke('db:deleteProject', id),

  // Hardware-Accelerated Native Video Burning
  hasFfmpeg: () => ipcRenderer.invoke('video:hasFfmpeg'),
  burnWithFfmpeg: (options) => ipcRenderer.invoke('video:burnWithFfmpeg', options),

  isElectron: true,
});
