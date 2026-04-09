/**
 * IPC Handlers for Database Operations
 * 
 * Registers IPC handlers that bridge renderer requests to database operations.
 * All handlers include input validation and error handling.
 * 
 * @see Technical-Deep-Dive.md Section 3.3 for secure IPC patterns
 */

import { ipcMain } from 'electron'
import { getDatabase } from './database.js'
import networkMonitor from './network-monitor.js'

// Validation helpers
const validators = {
  ipAddress: (value) => {
    const ipv4 = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
    const ipv6 = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/
    return ipv4.test(value) || ipv6.test(value)
  },
  
  deviceName: (value) => {
    return value && value.length >= 1 && value.length <= 100
  },
  
  deviceType: (value) => {
    return ['server', 'router', 'printer', 'switch'].includes(value)
  }
}

/**
 * Register all database IPC handlers
 */
export function registerDatabaseHandlers() {
  const db = getDatabase()
  
  // ========== Ping Monitoring Handlers ==========
  
  ipcMain.handle('ping:start', async (event, deviceId, ipAddress, intervalMs) => {
    try {
      const success = await networkMonitor.startMonitoring(deviceId, ipAddress, intervalMs || 5000)
      return { success, data: { deviceId, ipAddress, status: success ? 'started' : 'already-running' } }
    } catch (error) {
      console.error('Error starting ping monitoring:', error)
      return { success: false, error: error.message }
    }
  })
  
  ipcMain.handle('ping:stop', async (event, deviceId) => {
    try {
      const success = networkMonitor.stopMonitoring(deviceId)
      return { success, data: { deviceId, status: success ? 'stopped' : 'not-running' } }
    } catch (error) {
      console.error('Error stopping ping monitoring:', error)
      return { success: false, error: error.message }
    }
  })
  
  ipcMain.handle('ping:startAll', async (event, intervalMs) => {
    try {
      const count = await networkMonitor.monitorAllDevices(intervalMs || 5000)
      return { success: true, data: { started: count } }
    } catch (error) {
      console.error('Error starting all monitoring:', error)
      return { success: false, error: error.message }
    }
  })
  
  ipcMain.handle('ping:stopAll', async () => {
    try {
      networkMonitor.stopAll()
      return { success: true, data: { status: 'all-stopped' } }
    } catch (error) {
      console.error('Error stopping all monitoring:', error)
      return { success: false, error: error.message }
    }
  })
  
  ipcMain.handle('ping:status', async (event, deviceId) => {
    try {
      if (deviceId) {
        const status = networkMonitor.getDeviceStatus(deviceId)
        return { success: true, data: status }
      } else {
        const allStatuses = networkMonitor.getAllStatuses()
        const count = networkMonitor.getMonitoredCount()
        return { success: true, data: { count, devices: allStatuses } }
      }
    } catch (error) {
      console.error('Error getting ping status:', error)
      return { success: false, error: error.message }
    }
  })
  
  // ========== Device Handlers ==========
  
  ipcMain.handle('device:create', async (event, data) => {
    try {
      // Validate input
      if (!validators.deviceName(data.name)) {
        throw new Error('Invalid device name: must be 1-100 characters')
      }
      
      if (!validators.ipAddress(data.ipAddress)) {
        throw new Error('Invalid IP address format')
      }
      
      if (!validators.deviceType(data.deviceType)) {
        throw new Error('Invalid device type: must be server, router, printer, or switch')
      }
      
      // Check for duplicate IP
      const existing = db.getDeviceByIp(data.ipAddress)
      if (existing) {
        throw new Error('IP address already exists')
      }
      
      const result = db.createDevice(data)
      return { success: true, data: result }
      
    } catch (error) {
      console.error('Error creating device:', error)
      return { success: false, error: error.message }
    }
  })
  
  ipcMain.handle('device:read', async (event, id) => {
    try {
      const device = id ? db.getDevice(id) : db.getAllDevices()
      return { success: true, data: device }
    } catch (error) {
      console.error('Error reading device:', error)
      return { success: false, error: error.message }
    }
  })
  
  ipcMain.handle('device:update', async (event, id, updates) => {
    try {
      // Validate IP if provided
      if (updates.ipAddress && !validators.ipAddress(updates.ipAddress)) {
        throw new Error('Invalid IP address format')
      }
      
      // Check for duplicate IP if changed
      if (updates.ipAddress) {
        const existing = db.getDeviceByIp(updates.ipAddress)
        if (existing && existing.id !== id) {
          throw new Error('IP address already exists')
        }
      }
      
      const result = db.updateDevice(id, updates)
      return { success: true, data: result }
      
    } catch (error) {
      console.error('Error updating device:', error)
      return { success: false, error: error.message }
    }
  })
  
  ipcMain.handle('device:delete', async (event, id) => {
    try {
      // Check for active outage
      const activeOutage = db.getActiveOutage(id)
      if (activeOutage) {
        throw new Error('Cannot delete device with active outage. Resolve outage first.')
      }
      
      const result = db.deleteDevice(id)
      return { success: true, data: result }
      
    } catch (error) {
      console.error('Error deleting device:', error)
      return { success: false, error: error.message }
    }
  })
  
  // ========== Ping Handlers ==========
  
  ipcMain.handle('ping:record', async (event, data) => {
    try {
      const result = db.recordPing(data)
      return { success: true, data: result }
    } catch (error) {
      console.error('Error recording ping:', error)
      return { success: false, error: error.message }
    }
  })
  
  ipcMain.handle('ping:getRecent', async (event, deviceId, limit) => {
    try {
      const results = db.getRecentPings(deviceId, limit)
      return { success: true, data: results }
    } catch (error) {
      console.error('Error getting pings:', error)
      return { success: false, error: error.message }
    }
  })
  
  ipcMain.handle('ping:getStats', async (event, deviceId, hours) => {
    try {
      const avgLatency = db.getAverageLatency(deviceId, hours)
      const latest = db.getLatestPing(deviceId)
      return { 
        success: true, 
        data: { 
          averageLatency: avgLatency,
          latestPing: latest
        } 
      }
    } catch (error) {
      console.error('Error getting ping stats:', error)
      return { success: false, error: error.message }
    }
  })
  
  // ========== Stats Handler ==========
  
  ipcMain.handle('db:stats', async () => {
    try {
      const stats = db.getStats()
      return { success: true, data: stats }
    } catch (error) {
      console.error('Error getting stats:', error)
      return { success: false, error: error.message }
    }
  })
}

export default { registerDatabaseHandlers }
