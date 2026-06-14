/**
 * Alert Engine Tests
 *
 * Covers threshold evaluation, deduplication, alert creation,
 * and state tracking for Sprint 5 alerting infrastructure.
 *
 * @module tests/unit/alert-engine.test
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals'

// Build a fresh mock DB for each test
function createMockDb(overrides = {}) {
  return {
    getAlertConfiguration: jest.fn(() => overrides.config || null),
    hasActiveAlertOfType: jest.fn(() => overrides.hasActive || false),
    createAlert: jest.fn(() => ({ id: 1 })),
    resolveDeviceAlertsByType: jest.fn(() => ({ resolvedCount: 1 })),
    ...overrides.extraMethods
  }
}

jest.unstable_mockModule('electron', () => ({
  BrowserWindow: {
    getAllWindows: jest.fn(() => [])
  }
}))

jest.unstable_mockModule('../../../src/main/db/database.js', () => ({
  getDatabase: jest.fn()
}))

const { getDatabase } = await import('../../../src/main/db/database.js')
const { AlertEngine } = await import('../../../src/main/services/alert-engine.js')

describe('AlertEngine', () => {
  let engine
  let mockDb
  const deviceId = 42

  beforeEach(() => {
    engine = new AlertEngine()
    jest.clearAllMocks()
  })

  describe('Configuration handling', () => {
    it('does nothing when no alert configuration exists', async () => {
      mockDb = createMockDb()
      getDatabase.mockResolvedValue(mockDb)

      await engine.processPingResult(deviceId, { success: true, latencyMs: 500 })

      expect(getDatabase).toHaveBeenCalled()
      expect(mockDb.getAlertConfiguration).toHaveBeenCalledWith(deviceId)
      expect(mockDb.createAlert).not.toHaveBeenCalled()
    })

    it('does nothing when alerts are disabled for the device', async () => {
      mockDb = createMockDb({
        config: {
          enabled: false,
          latencyThresholdMs: 150,
          consecutiveFailuresThreshold: 3,
          latencySeverity: 'warning',
          failuresSeverity: 'critical'
        }
      })
      getDatabase.mockResolvedValue(mockDb)

      await engine.processPingResult(deviceId, { success: false, latencyMs: null })

      expect(mockDb.createAlert).not.toHaveBeenCalled()
    })
  })

  describe('Latency threshold checking', () => {
    const enabledConfig = {
      enabled: true,
      latencyThresholdMs: 150,
      consecutiveFailuresThreshold: 3,
      packetLossThresholdPct: 10,
      latencySeverity: 'warning',
      failuresSeverity: 'critical',
      packetLossSeverity: 'warning'
    }

    it('creates a latency alert when threshold is breached', async () => {
      mockDb = createMockDb({ config: enabledConfig })
      getDatabase.mockResolvedValue(mockDb)

      await engine.processPingResult(deviceId, { success: true, latencyMs: 200 })

      expect(mockDb.createAlert).toHaveBeenCalledTimes(1)
      expect(mockDb.createAlert).toHaveBeenCalledWith(expect.objectContaining({
        deviceId,
        alertType: 'latency',
        severity: 'warning',
        message: 'Latency 200ms exceeds threshold 150ms',
        thresholdValue: 150,
        actualValue: 200
      }))
    })

    it('resolves latency alerts when metric returns to normal and an active alert exists', async () => {
      mockDb = createMockDb({ config: enabledConfig, hasActive: true })
      getDatabase.mockResolvedValue(mockDb)

      await engine.processPingResult(deviceId, { success: true, latencyMs: 100 })

      expect(mockDb.hasActiveAlertOfType).toHaveBeenCalledWith(deviceId, 'latency')
      expect(mockDb.resolveDeviceAlertsByType).toHaveBeenCalledWith(deviceId, 'latency')
      expect(mockDb.createAlert).not.toHaveBeenCalled()
    })

    it('skips resolution when no active latency alert exists', async () => {
      mockDb = createMockDb({ config: enabledConfig, hasActive: false })
      getDatabase.mockResolvedValue(mockDb)

      await engine.processPingResult(deviceId, { success: true, latencyMs: 100 })

      expect(mockDb.hasActiveAlertOfType).toHaveBeenCalledWith(deviceId, 'latency')
      expect(mockDb.resolveDeviceAlertsByType).not.toHaveBeenCalled()
      expect(mockDb.createAlert).not.toHaveBeenCalled()
    })

    it('uses critical severity when configured for latency', async () => {
      const criticalConfig = { ...enabledConfig, latencySeverity: 'critical' }
      mockDb = createMockDb({ config: criticalConfig })
      getDatabase.mockResolvedValue(mockDb)

      await engine.processPingResult(deviceId, { success: true, latencyMs: 200 })

      expect(mockDb.createAlert).toHaveBeenCalledWith(expect.objectContaining({
        severity: 'critical'
      }))
    })
  })

  describe('Consecutive failures threshold checking', () => {
    const enabledConfig = {
      enabled: true,
      latencyThresholdMs: 150,
      consecutiveFailuresThreshold: 3,
      packetLossThresholdPct: 10,
      latencySeverity: 'warning',
      failuresSeverity: 'critical',
      packetLossSeverity: 'warning'
    }

    it('creates an alert after consecutive failures exceed threshold', async () => {
      mockDb = createMockDb({ config: enabledConfig })
      getDatabase.mockResolvedValue(mockDb)

      await engine.processPingResult(deviceId, { success: false, latencyMs: null })
      await engine.processPingResult(deviceId, { success: false, latencyMs: null })
      expect(mockDb.createAlert).not.toHaveBeenCalled()

      await engine.processPingResult(deviceId, { success: false, latencyMs: null })
      expect(mockDb.createAlert).toHaveBeenCalledTimes(1)
      expect(mockDb.createAlert).toHaveBeenCalledWith(expect.objectContaining({
        deviceId,
        alertType: 'consecutive_failures',
        severity: 'critical',
        thresholdValue: 3,
        actualValue: 3
      }))
    })

    it('resets failure counter on a successful ping', async () => {
      mockDb = createMockDb({ config: enabledConfig })
      getDatabase.mockResolvedValue(mockDb)

      await engine.processPingResult(deviceId, { success: false, latencyMs: null })
      await engine.processPingResult(deviceId, { success: false, latencyMs: null })
      await engine.processPingResult(deviceId, { success: true, latencyMs: 50 })

      // Fourth ping — counter reset, should not trigger
      await engine.processPingResult(deviceId, { success: false, latencyMs: null })
      expect(mockDb.createAlert).not.toHaveBeenCalled()
    })
  })

  describe('Deduplication', () => {
    const enabledConfig = {
      enabled: true,
      latencyThresholdMs: 150,
      consecutiveFailuresThreshold: 3,
      packetLossThresholdPct: 10,
      latencySeverity: 'warning',
      failuresSeverity: 'critical',
      packetLossSeverity: 'warning'
    }

    it('does not create duplicate latency alerts', async () => {
      mockDb = createMockDb({ config: enabledConfig, hasActive: true })
      getDatabase.mockResolvedValue(mockDb)

      await engine.processPingResult(deviceId, { success: true, latencyMs: 200 })
      await engine.processPingResult(deviceId, { success: true, latencyMs: 220 })

      expect(mockDb.createAlert).not.toHaveBeenCalled()
    })

    it('does not create duplicate failure alerts', async () => {
      mockDb = createMockDb({ config: enabledConfig, hasActive: true })
      getDatabase.mockResolvedValue(mockDb)

      await engine.processPingResult(deviceId, { success: false, latencyMs: null })
      await engine.processPingResult(deviceId, { success: false, latencyMs: null })
      await engine.processPingResult(deviceId, { success: false, latencyMs: null })

      expect(mockDb.createAlert).not.toHaveBeenCalled()
    })
  })

  describe('Packet loss threshold checking', () => {
    const enabledConfig = {
      enabled: true,
      latencyThresholdMs: 150,
      consecutiveFailuresThreshold: 3,
      packetLossThresholdPct: 10,
      latencySeverity: 'warning',
      failuresSeverity: 'critical',
      packetLossSeverity: 'warning'
    }

    it('does not evaluate packet loss until 5 pings collected', async () => {
      const packetLossOnlyConfig = { ...enabledConfig, consecutiveFailuresThreshold: 100 }
      mockDb = createMockDb({ config: packetLossOnlyConfig })
      getDatabase.mockResolvedValue(mockDb)

      // 4 pings — window too small
      await engine.processPingResult(deviceId, { success: false, latencyMs: null })
      await engine.processPingResult(deviceId, { success: false, latencyMs: null })
      await engine.processPingResult(deviceId, { success: false, latencyMs: null })
      await engine.processPingResult(deviceId, { success: false, latencyMs: null })
      expect(mockDb.createAlert).not.toHaveBeenCalled()

      // 5th ping — 100% loss, exceeds 10% threshold
      await engine.processPingResult(deviceId, { success: false, latencyMs: null })
      expect(mockDb.createAlert).toHaveBeenCalledTimes(1)
      expect(mockDb.createAlert).toHaveBeenCalledWith(expect.objectContaining({
        deviceId,
        alertType: 'packet_loss',
        severity: 'warning',
        thresholdValue: 10,
        actualValue: 100
      }))
    })

    it('resolves packet_loss alert when percentage drops below threshold', async () => {
      mockDb = createMockDb({ config: enabledConfig, hasActive: true })
      getDatabase.mockResolvedValue(mockDb)

      // Seed 5 successful pings so packet loss = 0%
      for (let i = 0; i < 5; i++) {
        await engine.processPingResult(deviceId, { success: true, latencyMs: 50 })
      }

      expect(mockDb.hasActiveAlertOfType).toHaveBeenCalledWith(deviceId, 'packet_loss')
      expect(mockDb.resolveDeviceAlertsByType).toHaveBeenCalledWith(deviceId, 'packet_loss')
      expect(mockDb.createAlert).not.toHaveBeenCalled()
    })

    it('does not create duplicate packet_loss alerts', async () => {
      const packetLossOnlyConfig = { ...enabledConfig, consecutiveFailuresThreshold: 100 }
      mockDb = createMockDb({ config: packetLossOnlyConfig, hasActive: true })
      getDatabase.mockResolvedValue(mockDb)

      // Seed enough failures
      for (let i = 0; i < 6; i++) {
        await engine.processPingResult(deviceId, { success: false, latencyMs: null })
      }

      expect(mockDb.createAlert).not.toHaveBeenCalled()
    })
  })

  describe('_calculatePacketLoss helper', () => {
    it('returns null for fewer than 5 entries', () => {
      expect(engine._calculatePacketLoss([true, false, true])).toBeNull()
      expect(engine._calculatePacketLoss([true, false, true, false])).toBeNull()
    })

    it('returns 0% for all successes', () => {
      expect(engine._calculatePacketLoss([true, true, true, true, true])).toBe(0)
    })

    it('returns 100% for all failures', () => {
      expect(engine._calculatePacketLoss([false, false, false, false, false])).toBe(100)
    })

    it('returns 40% for 2 failures out of 5', () => {
      expect(engine._calculatePacketLoss([false, true, false, true, true])).toBe(40)
    })

    it('rounds to nearest integer', () => {
      expect(engine._calculatePacketLoss([false, true, true])).toBeNull() // <5
      expect(engine._calculatePacketLoss([false, false, true, true])).toBeNull() // <5
      expect(engine._calculatePacketLoss([false, false, true, true, true])).toBe(40)
    })
  })

  describe('State management', () => {
    const stateConfig = {
      enabled: true,
      latencyThresholdMs: 150,
      consecutiveFailuresThreshold: 3,
      packetLossThresholdPct: 10,
      latencySeverity: 'warning',
      failuresSeverity: 'critical',
      packetLossSeverity: 'warning'
    }

    it('tracks consecutive failures per device', async () => {
      mockDb = createMockDb({ config: stateConfig })
      getDatabase.mockResolvedValue(mockDb)

      await engine.processPingResult(1, { success: false, latencyMs: null })
      await engine.processPingResult(2, { success: false, latencyMs: null })
      await engine.processPingResult(2, { success: false, latencyMs: null })

      expect(engine.getDeviceState(1).consecutiveFailures).toBe(1)
      expect(engine.getDeviceState(2).consecutiveFailures).toBe(2)
    })

    it('clears device state on request', async () => {
      mockDb = createMockDb({ config: stateConfig })
      getDatabase.mockResolvedValue(mockDb)

      await engine.processPingResult(deviceId, { success: false, latencyMs: null })
      expect(engine.getDeviceState(deviceId)).not.toBeNull()

      engine.clearDeviceState(deviceId)
      expect(engine.getDeviceState(deviceId)).toBeNull()
    })
  })
})
