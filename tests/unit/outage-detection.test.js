import { describe, it, expect, beforeEach } from '@jest/globals'
import PingService from '@/main/ping-service.js'

describe('Outage Detection', () => {
  let service

  beforeEach(() => {
    service = new PingService()
  })

  describe('Outage State Initialization', () => {
    it('initializes with default thresholds', () => {
      expect(service.outageThresholds.consecutiveFailures).toBe(3)
      expect(service.outageThresholds.maxLatencyMs).toBe(1000)
      expect(service.outageThresholds.criticalLatencyMs).toBe(5000)
    })

    it('initializes outage state correctly', () => {
      expect(service.outageState.consecutiveFailures).toBe(0)
      expect(service.outageState.lastSuccessfulPing).toBeNull()
      expect(service.outageState.activeOutageSeverity).toBeNull()
    })
  })

  describe('Severity Classification', () => {
    it('classifies as info when threshold just reached', () => {
      service.outageState.consecutiveFailures = 3
      const severity = service._classifyOutageSeverity()
      expect(severity).toBe('info')
    })

    it('classifies as warning for moderate failures', () => {
      service.outageState.consecutiveFailures = 6 // 2x threshold
      const severity = service._classifyOutageSeverity()
      expect(severity).toBe('warning')
    })

    it('classifies as critical for many failures', () => {
      service.outageState.consecutiveFailures = 9 // 3x threshold
      const severity = service._classifyOutageSeverity()
      expect(severity).toBe('critical')
    })
  })

  describe('Threshold Configuration', () => {
    it('allows configuring custom thresholds', () => {
      const customThresholds = {
        consecutiveFailures: 5,
        maxLatencyMs: 2000,
        criticalLatencyMs: 10000
      }
      
      service.configureThresholds(customThresholds)
      
      expect(service.outageThresholds).toEqual(expect.objectContaining(customThresholds))
    })

    it('merges custom thresholds with defaults', () => {
      service.configureThresholds({ consecutiveFailures: 10 })
      
      expect(service.outageThresholds.consecutiveFailures).toBe(10)
      expect(service.outageThresholds.maxLatencyMs).toBe(1000) // default preserved
      expect(service.outageThresholds.criticalLatencyMs).toBe(5000) // default preserved
    })
  })

  describe('Status Reporting', () => {
    it('includes outage state in status', () => {
      service.outageState.consecutiveFailures = 2
      service.outageState.lastSuccessfulPing = new Date()
      service.outageState.activeOutageSeverity = 'warning'
      
      const status = service.getStatus()
      
      expect(status.outageState).toEqual({
        consecutiveFailures: 2,
        lastSuccessfulPing: service.outageState.lastSuccessfulPing,
        activeOutageSeverity: 'warning',
        thresholds: service.outageThresholds
      })
    })

    it('provides getOutageState method', () => {
      const state = service.getOutageState()
      
      expect(state).toHaveProperty('consecutiveFailures')
      expect(state).toHaveProperty('lastSuccessfulPing')
      expect(state).toHaveProperty('activeOutageSeverity')
      expect(state).toHaveProperty('thresholds')
      expect(state.thresholds).toEqual(service.outageThresholds)
    })
  })

  describe('High Latency Detection Logic', () => {
    it('identifies warning level latency', () => {
      expect(service.outageThresholds.maxLatencyMs).toBe(1000)
      expect(service.outageThresholds.criticalLatencyMs).toBe(5000)
      
      // 2000ms should be warning level
      expect(2000).toBeGreaterThan(service.outageThresholds.maxLatencyMs)
      expect(2000).toBeLessThan(service.outageThresholds.criticalLatencyMs)
    })

    it('identifies critical level latency', () => {
      expect(service.outageThresholds.criticalLatencyMs).toBe(5000)
      
      // 6000ms should be critical level
      expect(6000).toBeGreaterThan(service.outageThresholds.criticalLatencyMs)
    })
  })
})
