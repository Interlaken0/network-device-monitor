import ping from 'ping'
import { getDatabase } from './database.js'
import os from 'os'

/**
 * PingService - ICMP ping implementation with cancellation support
 * 
 * Wraps the 'ping' library with AbortController for graceful shutdown.
 * Records results to database automatically.
 * 
 * @see Technical-Deep-Dive.md Section 2.4 for library comparison
 */

class PingService {
  constructor() {
    this.abortController = null
    this.isRunning = false
    this.deviceId = null
    this.ipAddress = null
    this.intervalMs = 5000 // 5 second default interval
    
    // Statistics tracking
    this.stats = {
      totalPings: 0,
      successfulPings: 0,
      failedPings: 0,
      latencies: [], // Last 10 successful latencies for running stats
      startTime: null
    }
  }

  /**
   * Start pinging a device
   * @param {number} deviceId - Device ID from database
   * @param {string} ipAddress - IP address to ping
   * @param {number} [intervalMs=5000] - Ping interval in milliseconds
   * @param {Function} [onResult] - Callback for each ping result
   * @returns {Promise<void>}
   */
  async start(deviceId, ipAddress, intervalMs = 5000, onResult = null) {
    if (this.isRunning) {
      throw new Error('PingService already running. Stop it first.')
    }

    this.deviceId = deviceId
    this.ipAddress = ipAddress
    this.intervalMs = intervalMs
    this.isRunning = true
    this.abortController = new AbortController()
    
    // Reset statistics
    this.stats = {
      totalPings: 0,
      successfulPings: 0,
      failedPings: 0,
      latencies: [],
      startTime: Date.now()
    }

    console.log(`Starting ping monitoring for ${ipAddress} (device ${deviceId})`)

    // Immediate first ping
    await this._pingOnce(onResult)

    // Schedule subsequent pings
    this._schedulePings(onResult)
  }

  /**
   * Stop pinging
   */
  stop() {
    if (!this.isRunning) {
      return
    }

    console.log(`Stopping ping monitoring for ${this.ipAddress}`)
    this.isRunning = false
    
    if (this.abortController) {
      this.abortController.abort()
      this.abortController = null
    }

    this.deviceId = null
    this.ipAddress = null
  }

  /**
   * Execute a single ping
   * @private
   */
  async _pingOnce(onResult) {
    try {
      // Check if aborted before starting
      if (this.abortController?.signal.aborted) {
        return
      }

      // Use Windows-compatible ping flags
      const isWindows = os.platform() === 'win32'
      
      const result = await ping.promise.probe(this.ipAddress, {
        timeout: 3,
        extra: isWindows ? ['-n', '1', '-w', '3000'] : ['-c', '1']
      })

      // Update statistics
      this.stats.totalPings++
      if (result.alive) {
        this.stats.successfulPings++
        this.stats.latencies.push(result.time)
        // Keep only last 10 latencies for running average
        if (this.stats.latencies.length > 10) {
          this.stats.latencies.shift()
        }
      } else {
        this.stats.failedPings++
      }

      // Log ping result with stats summary
      const status = result.alive ? `SUCCESS ${result.time}ms` : 'TIMEOUT'
      const stats = this._getStatsSummary()
      console.log(`[Ping] ${this.ipAddress}: ${status} | ${stats}`)

      const pingData = {
        deviceId: this.deviceId,
        latencyMs: result.alive ? result.time : null,
        success: result.alive,
        packetLoss: !result.alive,
        timestamp: new Date().toISOString()
      }

      // Record to database
      const db = await getDatabase()
      db.recordPing(pingData)

      // Call callback if provided
      if (onResult) {
        onResult(pingData)
      }

      // Check for outage conditions
      if (!result.alive) {
        await this._handleOutage()
      }

      return pingData

    } catch (error) {
      console.error(`Ping error for ${this.ipAddress}:`, error.message)

      // Update statistics
      this.stats.totalPings++
      this.stats.failedPings++

      const pingData = {
        deviceId: this.deviceId,
        latencyMs: null,
        success: false,
        packetLoss: true,
        timestamp: new Date().toISOString()
      }

      // Record failure to database
      const db = await getDatabase()
      db.recordPing(pingData)

      if (onResult) {
        onResult(pingData)
      }

      await this._handleOutage()

      return pingData
    }
  }

  /**
   * Schedule recurring pings
   * @private
   */
  _schedulePings(onResult) {
    const scheduleNext = async () => {
      if (!this.isRunning || this.abortController?.signal.aborted) {
        return
      }

      await this._pingOnce(onResult)

      // Schedule next ping if still running
      if (this.isRunning) {
        setTimeout(scheduleNext, this.intervalMs)
      }
    }

    setTimeout(scheduleNext, this.intervalMs)
  }

  /**
   * Handle outage detection and recording
   * @private
   */
  async _handleOutage() {
    const db = await getDatabase()
    
    // Check if there's already an active outage
    const activeOutage = db.getActiveOutage(this.deviceId)
    
    if (!activeOutage) {
      // Start new outage
      db.startOutage(this.deviceId, 'critical')
      console.warn(`Outage started for device ${this.deviceId} (${this.ipAddress})`)
    }
  }

  /**
   * Resolve an active outage (called when ping succeeds)
   * @private
   */
  async _resolveOutage() {
    const db = await getDatabase()
    const activeOutage = db.getActiveOutage(this.deviceId)
    
    if (activeOutage) {
      db.endOutage(activeOutage.id)
      console.log(`Outage resolved for device ${this.deviceId} (${this.ipAddress})`)
    }
  }

  /**
   * Calculate and format running statistics summary
   * @private
   * @returns {string} Formatted stats string
   */
  _getStatsSummary() {
    const { totalPings, successfulPings, failedPings, latencies } = this.stats
    
    if (totalPings === 0) return 'No data'
    
    const successRate = ((successfulPings / totalPings) * 100).toFixed(1)
    
    let latencyStats = 'N/A'
    if (latencies.length > 0) {
      const avg = (latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(1)
      const min = Math.min(...latencies)
      const max = Math.max(...latencies)
      latencyStats = `avg:${avg}ms min:${min}ms max:${max}ms`
    }
    
    return `Total:${totalPings} Success:${successRate}%${failedPings > 0 ? ' Failed:' + failedPings : ''} | ${latencyStats}`
  }

  /**
   * Get service status
   * @returns {Object} Current status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      deviceId: this.deviceId,
      ipAddress: this.ipAddress,
      intervalMs: this.intervalMs
    }
  }
}

export default PingService
