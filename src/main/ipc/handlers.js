/**
 * IPC Handlers for Database Operations
 * 
 * Registers IPC handlers that bridge renderer requests to database operations.
 * All handlers include input validation and error handling.
 * 
 * @see Technical-Deep-Dive.md Section 3.3 for secure IPC patterns
 */

import { ipcMain } from 'electron'
import { getDatabase } from '../db/database.js'
import networkMonitor from '../services/network-monitor.js'
import exportService from '../services/export-service.js'
import dns from 'dns'

// ========== Security Utilities ==========

/**
 * Simple rate limiter to prevent export abuse.
 * Tracks request timestamps per channel and blocks rapid-fire requests.
 */
class RateLimiter {
  constructor(windowMs = 5000, maxRequests = 10) {
    this.windowMs = windowMs
    this.maxRequests = maxRequests
    this.requests = new Map()
  }

  isAllowed(channel) {
    const now = Date.now()
    const channelRequests = this.requests.get(channel) || []

    // Remove requests outside the time window
    const validRequests = channelRequests.filter((ts) => now - ts < this.windowMs)
    this.requests.set(channel, validRequests)

    if (validRequests.length >= this.maxRequests) {
      return false
    }

    validRequests.push(now)
    return true
  }
}

const exportRateLimiter = new RateLimiter(60000, 5) // 5 exports per minute

/**
 * Validates a filename to prevent path traversal attacks.
 *
 * @param {string} filename - The filename to validate
 * @returns {boolean} True if the filename is safe
 */
function isSafeFilename(filename) {
  if (!filename || typeof filename !== 'string') return false
  // Reject paths with directory traversal
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) return false
  // Only allow alphanumeric, dots, dashes, underscores and spaces
  return /^[\w\-. ]+$/.test(filename)
}

/**
 * Sanitises export query parameters to prevent injection.
 *
 * @param {Object} query - Raw query from renderer
 * @returns {Object} Sanitised query
 */
function sanitiseExportQuery(query) {
  const validTypes = new Set(['ping_logs', 'outages', 'devices', 'summary'])
  const validTemplates = new Set(['uptime', 'latency', 'outage'])

  return {
    type: validTypes.has(query?.type) ? query.type : 'devices',
    deviceId: query?.deviceId ? parseInt(query.deviceId) || undefined : undefined,
    startDate: query?.startDate && /^\d{4}-\d{2}-\d{2}$/.test(query.startDate) ? query.startDate : undefined,
    endDate: query?.endDate && /^\d{4}-\d{2}-\d{2}$/.test(query.endDate) ? query.endDate : undefined,
    limit: query?.limit ? Math.min(parseInt(query.limit) || 100, 10000) : 1000,
    template: validTemplates.has(query?.template) ? query.template : 'uptime'
  }
}

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

/**
 * Wraps an IPC handler with standard try/catch, logging, and error formatting.
 * Collapses the repetitive 6-line boilerplate into a single wrapper call.
 *
 * @param {string} name - Handler name for logging (e.g., 'creating device')
 * @param {Function} handler - Async handler function
 * @returns {Function} Wrapped handler
 */
function wrapHandler(name, handler) {
  return async (event, ...args) => {
    try {
      return await handler(event, ...args)
    } catch (error) {
      console.error(`Error ${name}:`, error)
      return { success: false, error: error.message }
    }
  }
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
  
  ipcMain.handle('ping:start', wrapHandler('starting ping monitoring', async (event, deviceId, ipAddress, intervalMs) => {
    const success = await networkMonitor.startMonitoring(deviceId, ipAddress, intervalMs || 5000)
    return { success, data: { deviceId, ipAddress, status: success ? 'started' : 'already-running' } }
  }))
  
  ipcMain.handle('ping:stop', wrapHandler('stopping ping monitoring', async (event, deviceId) => {
    const success = networkMonitor.stopMonitoring(deviceId)
    return { success, data: { deviceId, status: success ? 'stopped' : 'not-running' } }
  }))
  
  ipcMain.handle('ping:startAll', wrapHandler('starting all monitoring', async (event, intervalMs) => {
    const count = await networkMonitor.monitorAllDevices(intervalMs || 5000)
    return { success: true, data: { started: count } }
  }))
  
  ipcMain.handle('ping:stopAll', wrapHandler('stopping all monitoring', async () => {
    networkMonitor.stopAll()
    return { success: true, data: { status: 'all-stopped' } }
  }))
  
  ipcMain.handle('ping:status', wrapHandler('getting ping status', async (event, deviceId) => {
    if (deviceId) {
      const status = networkMonitor.getDeviceStatus(deviceId)
      return { success: true, data: status }
    } else {
      const allStatuses = networkMonitor.getAllStatuses()
      const count = networkMonitor.getMonitoredCount()
      return { success: true, data: { count, devices: allStatuses } }
    }
  }))
  
  // ========== Device Handlers ==========
  
  ipcMain.handle('device:create', wrapHandler('creating device', async (event, data) => {
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

    // Sprint 5: Auto-create default alert configuration for the new device
    try {
      db.createAlertConfiguration(result.id)
    } catch (alertConfigError) {
      console.warn('Failed to auto-create alert configuration:', alertConfigError.message)
    }

    return { success: true, data: result }
  }))
  
  ipcMain.handle('device:read', wrapHandler('reading device', async (event, id) => {
    const result = id ? db.getDevice(id) : db.getAllDevices()
    // Transform snake_case to camelCase for frontend
    const data = id ? transformDevice(result) : transformDevices(result)
    return { success: true, data }
  }))

  ipcMain.handle('device:getWithStatus', wrapHandler('getting device with status', async (event, id) => {
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
  }))

  ipcMain.handle('device:update', wrapHandler('updating device', async (event, id, updates) => {
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
  }))
  
  ipcMain.handle('device:delete', wrapHandler('deleting device', async (event, id) => {
    // Note: Outage check removed for MVP simplicity
    // In production, you might want to prevent deletion during active outages
    
    const result = db.deleteDevice(id)
    return { success: true, data: result }
  }))
  
  // ========== Ping Handlers ==========
  
  ipcMain.handle('ping:record', wrapHandler('recording ping', async (event, data) => {
    const result = db.recordPing(data)
    return { success: true, data: result }
  }))
  
  ipcMain.handle('ping:getRecent', wrapHandler('getting recent pings', async (event, deviceId, limit) => {
    const results = db.getRecentPings(deviceId, limit)
    return { success: true, data: results }
  }))
  
  ipcMain.handle('ping:getStats', wrapHandler('getting ping stats', async (event, deviceId, hours) => {
    const avgLatency = db.getAverageLatency(deviceId, hours)
    const latest = db.getLatestPing(deviceId)
    return {
      success: true,
      data: {
        averageLatency: avgLatency,
        latestPing: latest
      }
    }
  }))

  ipcMain.handle('device:getStatusSummary', wrapHandler('getting device status summary', async (event, deviceId, hours) => {
    if (!deviceId) {
      return { success: false, error: 'Device ID is required' }
    }

    const summary = db.getDeviceStatusSummary(deviceId, hours)
    if (!summary) {
      return { success: false, error: 'Device not found' }
    }

    return { success: true, data: summary }
  }))

  // ========== Outage Handlers ==========
  
  ipcMain.handle('outage:getActive', wrapHandler('getting active outages', async (event, deviceId) => {
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
  }))

  ipcMain.handle('outage:getHistory', wrapHandler('getting outage history', async (event, deviceId, hours = 24) => {
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
  }))

  ipcMain.handle('outage:configureThresholds', wrapHandler('configuring outage thresholds', async (event, deviceId, thresholds) => {
    // Get the ping service for this device
    const service = networkMonitor.getService(deviceId)
    if (!service) {
      return { success: false, error: 'Device not currently monitored' }
    }
    
    service.configureThresholds(thresholds)
    return { success: true, data: { deviceId, thresholds } }
  }))

  // ========== Alert Configuration Handlers ==========

  ipcMain.handle('alertConfig:get', wrapHandler('getting alert configuration', async (event, deviceId) => {
    if (!deviceId) {
      return { success: false, error: 'Device ID is required' }
    }
    const config = db.getAlertConfiguration(deviceId)
    if (!config) {
      return { success: false, error: 'Alert configuration not found' }
    }
    return { success: true, data: config }
  }))

  ipcMain.handle('alertConfig:getAll', wrapHandler('getting all alert configurations', async () => {
    const configs = db.getAllAlertConfigurations()
    return { success: true, data: configs }
  }))

  ipcMain.handle('alertConfig:create', wrapHandler('creating alert configuration', async (event, deviceId) => {
    if (!deviceId) {
      return { success: false, error: 'Device ID is required' }
    }
    const result = db.createAlertConfiguration(deviceId)
    return { success: true, data: result }
  }))

  ipcMain.handle('alertConfig:update', wrapHandler('updating alert configuration', async (event, deviceId, updates) => {
    if (!deviceId) {
      return { success: false, error: 'Device ID is required' }
    }
    const result = db.updateAlertConfiguration(deviceId, updates)
    return { success: true, data: result }
  }))

  ipcMain.handle('alertConfig:delete', wrapHandler('deleting alert configuration', async (event, deviceId) => {
    if (!deviceId) {
      return { success: false, error: 'Device ID is required' }
    }
    const result = db.deleteAlertConfiguration(deviceId)
    return { success: true, data: result }
  }))

  // ========== Alert Event Handlers ==========

  ipcMain.handle('alert:create', wrapHandler('creating alert', async (event, alertData) => {
    if (!alertData || !alertData.deviceId || !alertData.message) {
      return { success: false, error: 'Device ID and message are required' }
    }
    const result = db.createAlert(alertData)
    return { success: true, data: result }
  }))

  ipcMain.handle('alert:get', wrapHandler('getting alert', async (event, alertId) => {
    if (!alertId) {
      return { success: false, error: 'Alert ID is required' }
    }
    const alert = db.getAlert(alertId)
    if (!alert) {
      return { success: false, error: 'Alert not found' }
    }
    return { success: true, data: alert }
  }))

  ipcMain.handle('alert:getByDevice', wrapHandler('getting alerts by device', async (event, deviceId, status, limit) => {
    if (!deviceId) {
      return { success: false, error: 'Device ID is required' }
    }
    const alerts = db.getAlertsByDevice(deviceId, status || null, limit || 100)
    return { success: true, data: alerts }
  }))

  ipcMain.handle('alert:getActive', wrapHandler('getting active alerts', async () => {
    const alerts = db.getActiveAlerts()
    return { success: true, data: alerts }
  }))

  ipcMain.handle('alert:acknowledge', wrapHandler('acknowledging alert', async (event, alertId) => {
    if (!alertId) {
      return { success: false, error: 'Alert ID is required' }
    }
    const result = db.acknowledgeAlert(alertId)
    return { success: true, data: result }
  }))

  ipcMain.handle('alert:resolve', wrapHandler('resolving alert', async (event, alertId) => {
    if (!alertId) {
      return { success: false, error: 'Alert ID is required' }
    }
    const result = db.resolveAlert(alertId)
    return { success: true, data: result }
  }))

  ipcMain.handle('alert:resolveDevice', wrapHandler('resolving device alerts', async (event, deviceId) => {
    if (!deviceId) {
      return { success: false, error: 'Device ID is required' }
    }
    const result = db.resolveDeviceAlerts(deviceId)
    return { success: true, data: result }
  }))

  // ========== Historical Aggregation Handlers (Sprint 4) ==========

  ipcMain.handle('history:uptime', wrapHandler('getting uptime by date range', async (event, deviceId, startDate, endDate) => {
    if (!deviceId || !startDate || !endDate) {
      return { success: false, error: 'Device ID, startDate and endDate are required' }
    }
    const stats = db.getUptimePercentageByDateRange(deviceId, startDate, endDate)
    return { success: true, data: stats }
  }))

  ipcMain.handle('history:latency', wrapHandler('getting latency by date range', async (event, deviceId, startDate, endDate) => {
    if (!deviceId || !startDate || !endDate) {
      return { success: false, error: 'Device ID, startDate and endDate are required' }
    }
    const avgLatency = db.getAverageLatencyByDateRange(deviceId, startDate, endDate)
    return { success: true, data: { deviceId, startDate, endDate, averageLatencyMs: avgLatency } }
  }))

  ipcMain.handle('history:outages', wrapHandler('getting outage stats by date range', async (event, deviceId, startDate, endDate) => {
    if (!deviceId || !startDate || !endDate) {
      return { success: false, error: 'Device ID, startDate and endDate are required' }
    }
    const stats = db.getOutageStatisticsByDateRange(deviceId, startDate, endDate)
    return { success: true, data: stats }
  }))

  ipcMain.handle('history:summary', wrapHandler('getting historical summary', async (event, deviceId, startDate, endDate) => {
    if (!deviceId || !startDate || !endDate) {
      return { success: false, error: 'Device ID, startDate and endDate are required' }
    }
    const summary = db.getHistoricalSummaryByDateRange(deviceId, startDate, endDate)
    return { success: true, data: summary }
  }))

  ipcMain.handle('history:allSummaries', wrapHandler('getting all historical summaries', async (event, startDate, endDate) => {
    if (!startDate || !endDate) {
      return { success: false, error: 'startDate and endDate are required' }
    }
    const devices = db.getAllDevices()
    const summaries = devices.map(device => {
      const summary = db.getHistoricalSummaryByDateRange(device.id, startDate, endDate)
      return {
        ...transformDevice(device),
        ...summary
      }
    })
    return { success: true, data: summaries }
  }))

  // ========== Stats Handler ===========

  ipcMain.handle('db:stats', wrapHandler('getting database stats', async () => {
    const stats = db.getStats()
    return { success: true, data: stats }
  }))

  // ========== Export Handlers ==========

  ipcMain.handle('export:csv', wrapHandler('generating CSV export', async (event, query, columns) => {
    // Rate limiting
    if (!exportRateLimiter.isAllowed('export:csv')) {
      return { success: false, error: 'Rate limit exceeded. Please wait before exporting again.' }
    }

    // Sanitise and validate query
    const sanitisedQuery = sanitiseExportQuery(query)
    const sanitisedColumns = Array.isArray(columns)
      ? columns.filter((c) => typeof c === 'string' && /^[\w_]+$/.test(c))
      : []

    if (!sanitisedQuery.type) {
      throw new Error('Export type is required')
    }

    const csvContent = await exportService.generateCSV(sanitisedQuery, sanitisedColumns)
    return { success: true, data: csvContent }
  }))

  ipcMain.handle('export:html', wrapHandler('generating HTML export', async (event, query, template) => {
    // Rate limiting
    if (!exportRateLimiter.isAllowed('export:html')) {
      return { success: false, error: 'Rate limit exceeded. Please wait before exporting again.' }
    }

    // Sanitise and validate query
    const sanitisedQuery = sanitiseExportQuery(query)

    if (!sanitisedQuery.type) {
      throw new Error('Export type is required')
    }

    const htmlContent = await exportService.generateHTMLReport(sanitisedQuery, template || {})
    return { success: true, data: htmlContent }
  }))

  ipcMain.handle('export:saveFile', wrapHandler('saving export file', async (event, content, filename, filters) => {
    // Validate input
    if (!content || !filename) {
      throw new Error('Content and filename are required')
    }

    // Prevent path traversal
    if (!isSafeFilename(filename)) {
      throw new Error('Invalid filename. Path traversal is not allowed.')
    }

    const result = await exportService.saveFile(content, filename, filters)
    return { success: true, data: result }
  }))

  // ========== Retention Policy Handlers ==========
  
  ipcMain.handle('retention:getStats', wrapHandler('getting retention stats', async (event, retentionDays = 30) => {
    // Validate retention days
    if (retentionDays < 1 || retentionDays > 365) {
      throw new Error('Retention days must be between 1 and 365')
    }
    
    const stats = db.getRetentionPolicyStats(retentionDays)
    return { success: true, data: stats }
  }))

  ipcMain.handle('retention:applyPolicy', wrapHandler('applying retention policy', async (event, retentionDays = 30) => {
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
  }))
}

export default { registerDatabaseHandlers }
