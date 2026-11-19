const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('omsDesktop', {
  call: (method, ...args) => ipcRenderer.invoke('oms:call', method, args),
  preferences: () => ipcRenderer.sendSync('oms:preferences'),
  setPreference: (key, value) => {
    const result = ipcRenderer.sendSync('oms:preference', key, value);
    if (result?.error) throw new Error(result.error);
  },
  onChanged: callback => {
    const listener = (_event, collection) => callback(collection);
    ipcRenderer.on('oms:changed', listener);
    return () => ipcRenderer.removeListener('oms:changed', listener);
  }
});
