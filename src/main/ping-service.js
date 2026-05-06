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
    
    // Outage detection thresholds
    this.outageThresholds = {
      consecutiveFailures: 3, // Number of consecutive failures to trigger outage
      maxLatencyMs: 1000,     // Maximum latency before warning
      criticalLatencyMs: 5000  // Maximum latency before critical
    }
    
    // Outage state tracking
    this.outageState = {
      consecutiveFailures: 0,
      lastSuccessfulPing: null,
      activeOutageSeverity: null
    }
    
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

      // Handle outage conditions with threshold-based detection
      if (!result.alive) {
        this.outageState.consecutiveFailures++
        await this._handleOutage()
      } else {
        this.outageState.consecutiveFailures = 0
        this.outageState.lastSuccessfulPing = new Date()
        
        // Check for high latency warnings
        if (result.time > this.outageThresholds.criticalLatencyMs) {
          await this._handleHighLatency('critical', result.time)
        } else if (result.time > this.outageThresholds.maxLatencyMs) {
          await this._handleHighLatency('warning', result.time)
        }
        
        await this._resolveOutage()
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

      // Track consecutive failures for threshold-based detection
      this.outageState.consecutiveFailures++
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
   * Handle outage detection and recording with threshold-based logic
   * @private
   */
  async _handleOutage() {
    const db = await getDatabase()
    
    // Only start outage if threshold is reached
    if (this.outageState.consecutiveFailures < this.outageThresholds.consecutiveFailures) {
      console.log(`Device ${this.deviceId} (${this.ipAddress}): ${this.outageState.consecutiveFailures}/${this.outageThresholds.consecutiveFailures} failures (threshold not reached)`)
      return
    }
    
    // Check if there's already an active outage
    const activeOutage = db.getActiveOutage(this.deviceId)
    
    if (!activeOutage) {
      // Determine severity based on consecutive failures and time since last success
      const severity = this._classifyOutageSeverity()
      
      // Start new outage
      db.startOutage(this.deviceId, severity)
      this.outageState.activeOutageSeverity = severity
      
      console.warn(`Outage started for device ${this.deviceId} (${this.ipAddress}) - Severity: ${severity}, Consecutive failures: ${this.outageState.consecutiveFailures}`)
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
      this.outageState.activeOutageSeverity = null
      const duration = Math.round((Date.now() - new Date(activeOutage.start_time).getTime()) / 1000)
      console.log(`Outage resolved for device ${this.deviceId} (${this.ipAddress}) - Duration: ${duration}s`)
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
   * Classify outage severity based on consecutive failures and other factors
   * @private
   * @returns {string} Severity level: 'critical', 'warning', or 'info'
   */
  _classifyOutageSeverity() {
    const { consecutiveFailures } = this.outageState
    const { consecutiveFailures: threshold } = this.outageThresholds
    
    // Critical: many more failures than threshold
    if (consecutiveFailures >= threshold * 3) {
      return 'critical'
    }
    
    // Warning: moderately above threshold
    if (consecutiveFailures >= threshold * 2) {
      return 'warning'
    }
    
    // Info: just reached threshold
    return 'info'
  }

  /**
   * Handle high latency warnings without full outage
   * @private
   * @param {string} severity - 'warning' or 'critical'
   * @param {number} latencyMs - Actual latency measured
   */
  async _handleHighLatency(severity, latencyMs) {
    const db = await getDatabase()
    
    // Only log high latency if there's no active outage
    const activeOutage = db.getActiveOutage(this.deviceId)
    if (!activeOutage) {
      // Create a short-duration outage for high latency tracking
      const outageResult = db.startOutage(this.deviceId, severity)
      
      // Immediately end it to track as a performance issue
      db.endOutage(outageResult.id)
      
      console.warn(`High latency detected for device ${this.deviceId} (${this.ipAddress}) - ${latencyMs}ms (${severity})`)
    }
  }

  /**
   * Configure outage detection thresholds
   * @param {Object} thresholds - New threshold values
   */
  configureThresholds(thresholds) {
    this.outageThresholds = { ...this.outageThresholds, ...thresholds }
    console.log(`Outage thresholds updated for device ${this.deviceId}:`, this.outageThresholds)
  }

  /**
   * Get current outage state
   * @returns {Object} Current outage detection state
   */
  getOutageState() {
    return {
      ...this.outageState,
      thresholds: this.outageThresholds
    }
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
      intervalMs: this.intervalMs,
      outageState: this.getOutageState()
    }
  }
}

export default PingService
