import PingService from './ping-service.js'
import AlertEngine from './alert-engine.js'
import { getDatabase } from '../db/database.js'
import { BrowserWindow } from 'electron'

/**
 * NetworkMonitor - Multi-device ping monitoring coordinator
 * 
 * Manages multiple PingService instances for concurrent device monitoring.
 * Provides aggregate status and control over all monitored devices.
 * 
 * @see Technical-Deep-Dive.md Section 2.4 for architecture patterns
 */

class NetworkMonitor {
  constructor() {
    /** @type {Map<number, PingService>} */
    this.services = new Map()
    this.alertEngine = new AlertEngine()
  }

  /**
   * Start monitoring a device
   * @param {number} deviceId - Device ID from database
   * @param {string} ipAddress - IP address to monitor
   * @param {number} [intervalMs=5000] - Ping interval
   * @returns {boolean} True if started, false if already monitoring
   */
  async startMonitoring(deviceId, ipAddress, intervalMs = 5000) {
    // Check if already monitoring this device
    if (this.services.has(deviceId)) {
      console.log(`Device ${deviceId} already being monitored`)
      return false
    }

    // Validate device exists
    const db = await getDatabase()
    const device = db.getDevice(deviceId)
    if (!device) {
      throw new Error(`Device ${deviceId} not found in database`)
    }

    // Create and start ping service
    const service = new PingService()
    
    const onResult = (pingData) => {
      this._handlePingResult(deviceId, pingData)
    }

    await service.start(deviceId, ipAddress, intervalMs, onResult)
    this.services.set(deviceId, service)

    console.log(`Started monitoring device ${deviceId} (${ipAddress})`)

    return true
  }

  /**
   * Stop monitoring a device
   * @param {number} deviceId - Device ID to stop monitoring
   * @returns {boolean} True if stopped, false if not monitoring
   */
  stopMonitoring(deviceId) {
    const service = this.services.get(deviceId)
    if (!service) {
      console.log(`Device ${deviceId} not currently monitored`)
      return false
    }

    service.stop()
    this.services.delete(deviceId)
    this.alertEngine.clearDeviceState(deviceId)

    console.log(`Stopped monitoring device ${deviceId}`)
    
    return true
  }

  /**
   * Stop monitoring all devices
   */
  stopAll() {
    console.log(`Stopping all monitoring (${this.services.size} devices)`)

    for (const [deviceId, service] of this.services) {
      service.stop()
      this.alertEngine.clearDeviceState(deviceId)
    }

    this.services.clear()
  }

  /**
   * Get monitoring status for a device
   * @param {number} deviceId - Device ID
   * @returns {Object|null} Status object or null if not monitored
   */
  getDeviceStatus(deviceId) {
    const service = this.services.get(deviceId)
    if (!service) {
      return null
    }

    return service.getStatus()
  }

  /**
   * Get status of all monitored devices
   * @returns {Array} Array of status objects
   */
  getAllStatuses() {
    const statuses = []
    for (const [deviceId, service] of this.services) {
      statuses.push({
        deviceId,
        ...service.getStatus()
      })
    }
    return statuses
  }

  /**
   * Get count of monitored devices
   * @returns {number}
   */
  getMonitoredCount() {
    return this.services.size
  }

  /**
   * Check if a device is being monitored
   * @param {number} deviceId - Device ID
   * @returns {boolean}
   */
  isMonitoring(deviceId) {
    return this.services.has(deviceId)
  }

  /**
   * Get the PingService instance for a monitored device
   * @param {number} deviceId - Device ID
   * @returns {PingService|undefined} PingService instance or undefined if not monitored
   */
  getService(deviceId) {
    return this.services.get(deviceId)
  }

  /**
   * Handle ping result from a device
   * @private
   * @param {number} deviceId - Device ID
   * @param {Object} pingData - Ping result data
   */
  async _handlePingResult(deviceId, pingData) {
    // Sprint 5: Evaluate alert thresholds against live metrics
    try {
      await this.alertEngine.processPingResult(deviceId, pingData)
    } catch (alertErr) {
      console.error(`AlertEngine error for device ${deviceId}:`, alertErr.message)
    }

    // Broadcast to renderer process
    const windows = BrowserWindow.getAllWindows()
    windows.forEach(win => {
      try {
        win.webContents.send('ping:result', {
          deviceId,
          ...pingData
        })
      } catch (broadcastErr) {
        // Window closed during iteration — safe to ignore
      }
    })
  }

  /**
   * Start monitoring all active devices from database
   * @param {number} [intervalMs=5000] - Ping interval
   * @returns {Promise<number>} Number of devices started
   */
  async monitorAllDevices(intervalMs = 5000) {
    const db = await getDatabase()
    const devices = db.getAllDevices(true) // Only active devices
    
    let started = 0
    for (const device of devices) {
      try {
        const success = await this.startMonitoring(device.id, device.ip_address, intervalMs)
        if (success) started++
      } catch (error) {
        console.error(`Failed to start monitoring device ${device.id}:`, error.message)
      }
    }

    console.log(`Started monitoring ${started}/${devices.length} devices`)
    return started
  }

}

// Export singleton instance
const networkMonitor = new NetworkMonitor()

export { NetworkMonitor }
export default networkMonitor
