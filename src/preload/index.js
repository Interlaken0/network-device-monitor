import { contextBridge, ipcRenderer } from 'electron'

// Security: Whitelist of valid IPC channels
const VALID_CHANNELS = [
  'device:create',
  'device:read',
  'device:update',
  'device:delete',
  'ping:start',
  'ping:stop',
  'ping:result'
]

// --------- Expose API to Renderer Process ---------
contextBridge.exposeInMainWorld('electronAPI', {
  // Device management
  createDevice: (deviceData) => ipcRenderer.invoke('device:create', deviceData),
  
  // Ping monitoring
  startPing: (ipAddress) => ipcRenderer.invoke('ping:start', ipAddress),
  stopPing: () => ipcRenderer.invoke('ping:stop'),
  
  // Event listeners with cleanup
  onPingResult: (callback) => {
    const wrappedCallback = (event, ...args) => callback(...args)
    ipcRenderer.on('ping:result', wrappedCallback)
    
    // Return cleanup function
    return () => {
      ipcRenderer.removeListener('ping:result', wrappedCallback)
    }
  },
  
  // Remove listener helper
  removeListener: (channel, callback) => {
    if (VALID_CHANNELS.includes(channel)) {
      ipcRenderer.removeListener(channel, callback)
    }
  }
})

// --------- Preload APIs ---------

/** @type {any} */
const ipcRendererOn = ipcRenderer.on
/** @type {any} */
const ipcRendererOnce = ipcRenderer.once

// --------- Exposed for Development Only ---------
// These are safe to expose as they don't provide Node.js access
contextBridge.exposeInMainWorld('versions', {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron
})
