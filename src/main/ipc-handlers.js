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
import exportService from './export-service.js'
import dns from 'dns'

// Transform database snake_case fields to camelCase for frontend
function transformDevice(device) {
  if (!device) return null
  return {
    id: device.id,
    name: device.name,
    ipAddress: device.ip_address,
    deviceType: device.device_type,
    location: device.location,
    isActive: device.is_active,
    createdAt: device.created_at
  }
}

function transformDevices(devices) {
  if (!devices) return []
  return devices.map(transformDevice)
}

// Transform outage data from snake_case to camelCase
function transformOutage(outage) {
  if (!outage) return null
  return {
    id: outage.id,
    deviceId: outage.device_id,
    deviceName: outage.name,
    ipAddress: outage.ip_address,
    startTime: outage.start_time,
    endTime: outage.end_time,
    durationSeconds: outage.duration_seconds,
    severity: outage.severity
  }
}

function transformOutages(outages) {
  if (!outages) return []
  return outages.map(transformOutage)
}

// Validation helpers
const validators = {
  ipAddress: (value) => {
    const ipv4 = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
    const ipv6 = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/
    return ipv4.test(value) || ipv6.test(value)
  },

  hostname: (value) => {
    // RFC compliant hostname validation
    // - Total length: 1-253 characters
    // - Each label: 1-63 characters
    // - Labels: letters, digits, hyphen (cannot start or end with hyphen)
    // - Entire hostname: letters, digits, hyphen, dots
    if (!value || value.length > 253 || value.length < 1) return false
    
    const labels = value.split('.')
    if (labels.length === 0) return false
    
    const labelRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/
    
    for (const label of labels) {
      if (!labelRegex.test(label)) return false
    }
    
    return true
  },

  networkAddress: async (value) => {
    // Accept either IP address or hostname
    if (validators.ipAddress(value)) {
      return true
    }
    
    if (validators.hostname(value)) {
      // For hostnames, verify they are resolvable
      try {
        await new Promise((resolve, reject) => {
          dns.lookup(value, (err, address) => {
            if (err) {
              reject(err)
            } else {
              resolve(address)
            }
          })
        })
        return true
      } catch (error) {
        return false
      }
    }
    
    return false
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
export async function registerDatabaseHandlers() {
  const db = await getDatabase()
  
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
        throw new Error('Invalid device name')
      }
      
      if (!(await validators.networkAddress(data.ipAddress))) {
        throw new Error('Invalid network address')
      }
      
      if (!validators.deviceType(data.deviceType)) {
        throw new Error('Invalid device type')
      }
      
      // Check for duplicate network address
      const existing = db.getDeviceByIp(data.ipAddress)
      if (existing) {
        throw new Error('Network address already exists')
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
      const result = id ? db.getDevice(id) : db.getAllDevices()
      // Transform snake_case to camelCase for frontend
      const data = id ? transformDevice(result) : transformDevices(result)
      return { success: true, data }
    } catch (error) {
      console.error('Error reading device:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('device:getWithStatus', async (event, id) => {
    try {
      if (id) {
        // Single device with status
        const result = db.getDeviceWithLatestStatus(id)
        if (!result) {
          return { success: false, error: 'Device not found' }
        }
        // Transform device fields to camelCase, preserve nested objects
        const data = {
          ...transformDevice(result),
          latestPing: result.latestPing,
          activeOutage: result.activeOutage,
          status: result.status
        }
        return { success: true, data }
      } else {
        // All devices with status
        const results = db.getAllDevicesWithLatestStatus()
        const data = results.map(device => ({
          ...transformDevice(device),
          latestPing: device.latestPing,
          activeOutage: device.activeOutage,
          status: device.status
        }))
        return { success: true, data }
      }
    } catch (error) {
      console.error('Error getting device with status:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('device:update', async (event, id, updates) => {
    try {
      // Map camelCase field names to snake_case for database
      const fieldMapping = {
        name: 'name',
        ipAddress: 'ip_address',
        deviceType: 'device_type',
        location: 'location',
        isActive: 'is_active'
      }
      
      const dbUpdates = {}
      for (const [key, value] of Object.entries(updates)) {
        const dbField = fieldMapping[key]
        if (dbField) {
          dbUpdates[dbField] = value
        }
      }
      
      // Validate network address if provided
      if (dbUpdates.ip_address && !(await validators.networkAddress(dbUpdates.ip_address))) {
        throw new Error('Invalid network address format')
      }
      
      // Check for duplicate network address if changed
      if (dbUpdates.ip_address) {
        const existing = db.getDeviceByIp(dbUpdates.ip_address)
        if (existing && existing.id !== id) {
          throw new Error('Network address already exists')
        }
      }
      
      const result = db.updateDevice(id, dbUpdates)
      return { success: true, data: result }
      
    } catch (error) {
      console.error('Error updating device:', error)
      return { success: false, error: error.message }
    }
  })
  
  ipcMain.handle('device:delete', async (event, id) => {
    try {
      // Note: Outage check removed for MVP simplicity
      // In production, you might want to prevent deletion during active outages
      
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

  ipcMain.handle('device:getStatusSummary', async (event, deviceId, hours) => {
    try {
      if (!deviceId) {
        return { success: false, error: 'Device ID is required' }
      }

      const summary = db.getDeviceStatusSummary(deviceId, hours)
      if (!summary) {
        return { success: false, error: 'Device not found' }
      }

      return { success: true, data: summary }
    } catch (error) {
      console.error('Error getting device status summary:', error)
      return { success: false, error: error.message }
    }
  })

  // ========== Outage Handlers ==========
  
  ipcMain.handle('outage:getActive', async (event, deviceId) => {
    try {
      if (deviceId) {
        // Get active outage for specific device
        const outage = db.getActiveOutage(deviceId)
        return { success: true, data: transformOutage(outage) }
      } else {
        // Get all active outages
        const stmt = db.getStatement('getAllActiveOutages',
          `SELECT o.*, d.name, d.ip_address
           FROM outages o
           JOIN devices d ON o.device_id = d.id
           WHERE o.end_time IS NULL
           ORDER BY o.start_time DESC`
        )
        const outages = stmt.all()
        return { success: true, data: transformOutages(outages) }
      }
    } catch (error) {
      console.error('Error getting active outages:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('outage:getHistory', async (event, deviceId, hours = 24) => {
    try {
      let outages
      if (deviceId) {
        // Get outage history for specific device
        const stmt = db.getStatement('getOutageHistory',
          `SELECT o.*, d.name, d.ip_address
           FROM outages o
           JOIN devices d ON o.device_id = d.id
           WHERE o.device_id = ?
             AND o.start_time > datetime('now', ?)
           ORDER BY o.start_time DESC`
        )
        outages = stmt.all(deviceId, `-${hours} hours`)
      } else {
        // Get outage history for all devices
        const stmt = db.getStatement('getAllOutageHistory',
          `SELECT o.*, d.name, d.ip_address
           FROM outages o
           JOIN devices d ON o.device_id = d.id
           WHERE o.start_time > datetime('now', ?)
           ORDER BY o.start_time DESC`
        )
        outages = stmt.all(`-${hours} hours`)
      }
      return { success: true, data: transformOutages(outages) }
    } catch (error) {
      console.error('Error getting outage history:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('outage:configureThresholds', async (event, deviceId, thresholds) => {
    try {
      // Get the ping service for this device
      const service = networkMonitor.getService(deviceId)
      if (!service) {
        return { success: false, error: 'Device not currently monitored' }
      }
      
      service.configureThresholds(thresholds)
      return { success: true, data: { deviceId, thresholds } }
    } catch (error) {
      console.error('Error configuring outage thresholds:', error)
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

  // ========== Export Handlers ==========
  
  ipcMain.handle('export:csv', async (event, query, columns) => {
    try {
      // Validate query parameters
      if (!query.type) {
        throw new Error('Export type is required')
      }
      
      const csvContent = await exportService.generateCSV(query, columns || [])
      return { success: true, data: csvContent }
    } catch (error) {
      console.error('Error generating CSV export:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('export:html', async (event, query, template) => {
    try {
      // Validate query parameters
      if (!query.type) {
        throw new Error('Export type is required')
      }
      
      const htmlContent = await exportService.generateHTMLReport(query, template || {})
      return { success: true, data: htmlContent }
    } catch (error) {
      console.error('Error generating HTML export:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('export:saveFile', async (event, content, filename, filters) => {
    try {
      // Validate input
      if (!content || !filename) {
        throw new Error('Content and filename are required')
      }
      
      const result = await exportService.saveFile(content, filename, filters)
      return { success: true, data: result }
    } catch (error) {
      console.error('Error saving export file:', error)
      return { success: false, error: error.message }
    }
  })

  // ========== Retention Policy Handlers ==========
  
  ipcMain.handle('retention:getStats', async (event, retentionDays = 30) => {
    try {
      // Validate retention days
      if (retentionDays < 1 || retentionDays > 365) {
        throw new Error('Retention days must be between 1 and 365')
      }
      
      const stats = db.getRetentionPolicyStats(retentionDays)
      return { success: true, data: stats }
    } catch (error) {
      console.error('Error getting retention stats:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('retention:applyPolicy', async (event, retentionDays = 30) => {
    try {
      // Validate retention days
      if (retentionDays < 1 || retentionDays > 365) {
        throw new Error('Retention days must be between 1 and 365')
      }
      
      // Get stats before purge for reporting
      const beforeStats = db.getRetentionPolicyStats(retentionDays)
      
      // Apply retention policy
      const result = db.applyPingHistoryRetention(retentionDays)
      
      // Get updated database stats
      const afterStats = db.getStats()
      
      return { 
        success: true, 
        data: {
          ...result,
          beforeStats,
          afterStats
        }
      }
    } catch (error) {
      console.error('Error applying retention policy:', error)
      return { success: false, error: error.message }
    }
  })
}

export default { registerDatabaseHandlers }
