const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getData: (key) => ipcRenderer.invoke('db:get', key),
  saveData: (key, value) => ipcRenderer.invoke('db:save', key, value),
  sendEmail: (config, to, subject, html) => ipcRenderer.invoke('email:send', config, to, subject, html),
  testSmtp: (config, testRecipient) => ipcRenderer.invoke('email:test-smtp', config, testRecipient),
  confirmQuit: () => ipcRenderer.send('app:quit-confirmed'),
  onCloseRequest: (callback) => {
    const listener = () => callback();
    ipcRenderer.on('app:close-request', listener);
    return () => ipcRenderer.removeListener('app:close-request', listener);
  }
});
