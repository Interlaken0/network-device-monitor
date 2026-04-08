/**
 * Update preload script to include database IPC channels
 * Add these to the existing VALID_CHANNELS and exposed APIs
 */

import { contextBridge, ipcRenderer } from 'electron'

// Security: Whitelist of valid IPC channels
const VALID_CHANNELS = [
  // Device management
  'device:create',
  'device:read',
  'device:update',
  'device:delete',
  // Ping operations  
  'ping:start',
  'ping:stop',
  'ping:result',
  'ping:record',
  'ping:getRecent',
  'ping:getStats',
  // Database
  'db:stats'
]

// --------- Expose API to Renderer Process ---------
contextBridge.exposeInMainWorld('electronAPI', {
  // Device management
  createDevice: (deviceData) => ipcRenderer.invoke('device:create', deviceData),
  getDevices: (id) => ipcRenderer.invoke('device:read', id),
  updateDevice: (id, updates) => ipcRenderer.invoke('device:update', id, updates),
  deleteDevice: (id) => ipcRenderer.invoke('device:delete', id),
  
  // Ping monitoring
  startPing: (ipAddress) => ipcRenderer.invoke('ping:start', ipAddress),
  stopPing: () => ipcRenderer.invoke('ping:stop'),
  recordPing: (pingData) => ipcRenderer.invoke('ping:record', pingData),
  getRecentPings: (deviceId, limit) => ipcRenderer.invoke('ping:getRecent', deviceId, limit),
  getPingStats: (deviceId, hours) => ipcRenderer.invoke('ping:getStats', deviceId, hours),
  
  // Database stats
  getDatabaseStats: () => ipcRenderer.invoke('db:stats'),
  
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

// --------- Exposed for Development Only ---------
contextBridge.exposeInMainWorld('versions', {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron
})
