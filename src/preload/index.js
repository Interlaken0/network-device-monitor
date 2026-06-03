/**
 * Preload script exposing secure IPC bridge to renderer process.
 * Whitelists valid channels and wraps IPC calls for type safety.
 */

import { contextBridge, ipcRenderer } from 'electron'

// Security: Whitelist of valid IPC channels
const VALID_CHANNELS = [
  // Device management
  'device:create',
  'device:read',
  'device:update',
  'device:delete',
  'device:getWithStatus',
  'device:getStatusSummary',
  // Ping operations  
  'ping:start',
  'ping:stop',
  'ping:startAll',
  'ping:stopAll',
  'ping:status',
  'ping:result',
  'ping:record',
  'ping:getRecent',
  'ping:getStats',
  // Outage operations
  'outage:getActive',
  'outage:getHistory',
  'outage:configureThresholds',
  // Historical aggregation (Sprint 4)
  'history:uptime',
  'history:latency',
  'history:outages',
  'history:summary',
  'history:allSummaries',
  // Database
  'db:stats',
  // Export
  'export:csv',
  'export:html',
  'export:saveFile',
  // Retention
  'retention:getStats',
  'retention:applyPolicy',
  // Alert configuration
  'alertConfig:get',
  'alertConfig:getAll',
  'alertConfig:create',
  'alertConfig:update',
  'alertConfig:delete',
  // Alert events
  'alert:create',
  'alert:get',
  'alert:getByDevice',
  'alert:getActive',
  'alert:acknowledge',
  'alert:resolve',
  'alert:resolveDevice'
]

// --------- Expose API to Renderer Process ---------
contextBridge.exposeInMainWorld('electronAPI', {
  // Device management
  createDevice: (deviceData) => ipcRenderer.invoke('device:create', deviceData),
  getDevices: (id) => ipcRenderer.invoke('device:read', id),
  updateDevice: (id, updates) => ipcRenderer.invoke('device:update', id, updates),
  deleteDevice: (id) => ipcRenderer.invoke('device:delete', id),
  getDeviceWithStatus: (id) => ipcRenderer.invoke('device:getWithStatus', id),
  getDeviceStatusSummary: (id, hours) => ipcRenderer.invoke('device:getStatusSummary', id, hours),

  // Ping monitoring
  startPing: (deviceId, ipAddress, intervalMs) => ipcRenderer.invoke('ping:start', deviceId, ipAddress, intervalMs),
  stopPing: (deviceId) => ipcRenderer.invoke('ping:stop', deviceId),
  startAllPings: (intervalMs) => ipcRenderer.invoke('ping:startAll', intervalMs),
  stopAllPings: () => ipcRenderer.invoke('ping:stopAll'),
  getPingStatus: (deviceId) => ipcRenderer.invoke('ping:status', deviceId),
  recordPing: (pingData) => ipcRenderer.invoke('ping:record', pingData),
  getRecentPings: (deviceId, limit) => ipcRenderer.invoke('ping:getRecent', deviceId, limit),
  getPingStats: (deviceId, hours) => ipcRenderer.invoke('ping:getStats', deviceId, hours),
  
  // Historical aggregation (Sprint 4)
  getUptimeByDateRange: (deviceId, startDate, endDate) => ipcRenderer.invoke('history:uptime', deviceId, startDate, endDate),
  getLatencyByDateRange: (deviceId, startDate, endDate) => ipcRenderer.invoke('history:latency', deviceId, startDate, endDate),
  getOutageStatsByDateRange: (deviceId, startDate, endDate) => ipcRenderer.invoke('history:outages', deviceId, startDate, endDate),
  getHistoricalSummary: (deviceId, startDate, endDate) => ipcRenderer.invoke('history:summary', deviceId, startDate, endDate),
  getAllHistoricalSummaries: (startDate, endDate) => ipcRenderer.invoke('history:allSummaries', startDate, endDate),

  // Database stats
  getDatabaseStats: () => ipcRenderer.invoke('db:stats'),

  // Export operations
  exportCSV: (query, columns) => ipcRenderer.invoke('export:csv', query, columns),
  exportHTML: (query, template) => ipcRenderer.invoke('export:html', query, template),
  saveExportFile: (content, filename, filters) => ipcRenderer.invoke('export:saveFile', content, filename, filters),

  // Retention operations
  getRetentionStats: (retentionDays) => ipcRenderer.invoke('retention:getStats', retentionDays),
  applyRetentionPolicy: (retentionDays) => ipcRenderer.invoke('retention:applyPolicy', retentionDays),

  // Outage operations
  getActiveOutage: (deviceId) => ipcRenderer.invoke('outage:getActive', deviceId),
  getOutageHistory: (deviceId, hours) => ipcRenderer.invoke('outage:getHistory', deviceId, hours),
  configureOutageThresholds: (deviceId, thresholds) => ipcRenderer.invoke('outage:configureThresholds', deviceId, thresholds),

  // Alert configuration operations
  getAlertConfig: (deviceId) => ipcRenderer.invoke('alertConfig:get', deviceId),
  getAllAlertConfigs: () => ipcRenderer.invoke('alertConfig:getAll'),
  createAlertConfig: (deviceId) => ipcRenderer.invoke('alertConfig:create', deviceId),
  updateAlertConfig: (deviceId, updates) => ipcRenderer.invoke('alertConfig:update', deviceId, updates),
  deleteAlertConfig: (deviceId) => ipcRenderer.invoke('alertConfig:delete', deviceId),

  // Alert event operations
  createAlert: (alertData) => ipcRenderer.invoke('alert:create', alertData),
  getAlert: (alertId) => ipcRenderer.invoke('alert:get', alertId),
  getAlertsByDevice: (deviceId, status, limit) => ipcRenderer.invoke('alert:getByDevice', deviceId, status, limit),
  getActiveAlerts: () => ipcRenderer.invoke('alert:getActive'),
  acknowledgeAlert: (alertId) => ipcRenderer.invoke('alert:acknowledge', alertId),
  resolveAlert: (alertId) => ipcRenderer.invoke('alert:resolve', alertId),
  resolveDeviceAlerts: (deviceId) => ipcRenderer.invoke('alert:resolveDevice', deviceId),

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
