import { getDatabase } from '../db/database.js'
import { BrowserWindow } from 'electron'

/**
 * AlertEngine - Per-device threshold monitoring and alert generation
 *
 * Loads alert configurations from the database, compares live ping metrics
 * against thresholds, and creates or resolves alerts accordingly.
 * Includes deduplication so repeated breaches do not spam the alert log.
 * Broadcasts alert events to all renderer windows for real-time UI updates.
 *
 * @see docs/retrospectives/sprint-05-week1.md
 */

class AlertEngine {
  constructor() {
    /** @type {Map<number, {consecutiveFailures: number, lastSuccessfulPing: Date|null}>} */
    this.deviceStates = new Map()
  }

  /**
   * Process a single ping result and evaluate thresholds.
   *
   * @param {number} deviceId
   * @param {Object} pingData - { success: boolean, latencyMs: number|null, timestamp: string }
   */
  async processPingResult(deviceId, pingData) {
    const db = await getDatabase()
    const config = db.getAlertConfiguration(deviceId)

    // No config or alerts disabled — nothing to do
    if (!config || !config.enabled) return

    let state = this.deviceStates.get(deviceId)
    if (!state) {
      state = { consecutiveFailures: 0, lastSuccessfulPing: null, recentPings: [] }
      this.deviceStates.set(deviceId, state)
    }

    // Track every ping result for rolling packet loss percentage
    state.recentPings.push(pingData.success)
    if (state.recentPings.length > 10) {
      state.recentPings.shift()
    }

    // Packet loss threshold check (evaluated every cycle once window is warm)
    const packetLossPct = this._calculatePacketLoss(state.recentPings)
    if (packetLossPct !== null && packetLossPct > config.packetLossThresholdPct) {
      const message = `Packet loss ${packetLossPct}% exceeds threshold ${config.packetLossThresholdPct}%`
      this._createAlertIfNeeded(db, deviceId, 'packet_loss', config.packetLossSeverity, message, config.packetLossThresholdPct, packetLossPct)
    } else if (db.hasActiveAlertOfType(deviceId, 'packet_loss')) {
      db.resolveDeviceAlertsByType(deviceId, 'packet_loss')
    }

    if (pingData.success) {
      state.consecutiveFailures = 0
      state.lastSuccessfulPing = new Date()

      // Latency threshold check
      if (pingData.latencyMs !== null && pingData.latencyMs > config.latencyThresholdMs) {
        const message = `Latency ${pingData.latencyMs}ms exceeds threshold ${config.latencyThresholdMs}ms`
        this._createAlertIfNeeded(db, deviceId, 'latency', config.latencySeverity, message, config.latencyThresholdMs, pingData.latencyMs)
      } else if (db.hasActiveAlertOfType(deviceId, 'latency')) {
        // Resolve active latency alerts only when one exists
        db.resolveDeviceAlertsByType(deviceId, 'latency')
      }
    } else {
      state.consecutiveFailures++

      // Consecutive failures threshold check
      if (state.consecutiveFailures >= config.consecutiveFailuresThreshold) {
        const message = `${state.consecutiveFailures} consecutive failures exceed threshold ${config.consecutiveFailuresThreshold}`
        this._createAlertIfNeeded(db, deviceId, 'consecutive_failures', config.failuresSeverity, message, config.consecutiveFailuresThreshold, state.consecutiveFailures)
      }
    }
  }

  /**
   * Create an alert only if no active alert of the same type already exists
   * for this device. Prevents duplicate spam.
   *
   * @private
   * @param {Object} db - Database instance
   * @param {number} deviceId
   * @param {string} alertType - 'latency' | 'consecutive_failures' | 'packet_loss'
   * @param {string} severity - 'critical' | 'warning'
   * @param {string} message
   * @param {number} thresholdValue
   * @param {number} actualValue
   */
  _createAlertIfNeeded(db, deviceId, alertType, severity, message, thresholdValue, actualValue) {
    const hasActive = db.hasActiveAlertOfType(deviceId, alertType)
    if (hasActive) {
      return
    }

    const alert = db.createAlert({
      deviceId,
      alertType,
      severity,
      message,
      thresholdValue,
      actualValue
    })

    this._broadcastAlertEvent('created', alert)
  }

  /**
   * Broadcast an alert event to all renderer windows.
   *
   * @private
   * @param {string} eventType - 'created' | 'acknowledged' | 'resolved'
   * @param {Object} alert - Alert data
   */
  _broadcastAlertEvent(eventType, alert) {
    if (typeof BrowserWindow.getAllWindows !== 'function') return
    const windows = BrowserWindow.getAllWindows()
    windows.forEach((win) => {
      try {
        win.webContents.send('alert:event', { eventType, alert })
      } catch (err) {
        // Window may have been closed during iteration — safe to ignore
      }
    })
  }

  /**
   * Get the internal failure-tracking state for a device.
   * Primarily useful for tests.
   *
   * @param {number} deviceId
   * @returns {Object|null}
   */
  getDeviceState(deviceId) {
    return this.deviceStates.get(deviceId) || null
  }

  /**
   * Calculate packet loss percentage from a rolling window of boolean results.
   * Returns null until the window has at least 5 entries.
   *
   * @private
   * @param {Array<boolean>} recentPings
   * @returns {number|null}
   */
  _calculatePacketLoss(recentPings) {
    if (recentPings.length < 5) return null
    const failures = recentPings.filter((success) => !success).length
    return Math.round((failures / recentPings.length) * 100)
  }

  /**
   * Clear internal state for a device (e.g. when monitoring stops).
   *
   * @param {number} deviceId
   */
  clearDeviceState(deviceId) {
    this.deviceStates.delete(deviceId)
  }
}

export { AlertEngine }
export default AlertEngine
