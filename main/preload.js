const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('audioAPI', {
    getDevices: () => ipcRenderer.invoke('get-devices'),
    setDefaultDevice: (deviceId) => ipcRenderer.invoke('set-default-device', deviceId),
    getPeakLevels: () => ipcRenderer.invoke('get-peak-levels'),
    openDeviceProperties: (deviceId) => ipcRenderer.invoke('open-device-properties', deviceId),
    getDeviceProperties: (deviceId) => ipcRenderer.invoke('get-device-properties', deviceId),
    setDeviceVolume: (deviceId, volume) => ipcRenderer.invoke('set-device-volume', deviceId, volume),
    setDeviceMute: (deviceId, muted) => ipcRenderer.invoke('set-device-mute', deviceId, muted),
    setChannelVolume: (deviceId, channel, volume) => ipcRenderer.invoke('set-channel-volume', deviceId, channel, volume),
    getAudioSessions: () => ipcRenderer.invoke('get-audio-sessions'),
    setSessionVolume: (sessionId, volume) => ipcRenderer.invoke('set-session-volume', sessionId, volume),
    setSessionMute: (sessionId, muted) => ipcRenderer.invoke('set-session-mute', sessionId, muted),
});

contextBridge.exposeInMainWorld('windowAPI', {
    minimize: () => ipcRenderer.send('window-minimize'),
    maximize: () => ipcRenderer.send('window-maximize'),
    close: () => ipcRenderer.send('window-close'),
    isMaximized: () => ipcRenderer.invoke('window-is-maximized'),
});
