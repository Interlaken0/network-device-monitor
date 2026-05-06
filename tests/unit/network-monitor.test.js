import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals'
import { NetworkMonitor } from '@/main/network-monitor.js'

describe('NetworkMonitor', () => {
  let monitor

  beforeEach(() => {
    monitor = new NetworkMonitor()
    jest.clearAllMocks()
  })

  afterEach(() => {
    monitor.stopAll()
  })

  it('creates instance with empty services map', () => {
    expect(monitor.services.size).toBe(0)
  })

  it('isMonitoring returns false for unmonitored device', () => {
    expect(monitor.isMonitoring(999)).toBe(false)
  })

  it('getDeviceStatus returns null for unmonitored device', () => {
    expect(monitor.getDeviceStatus(999)).toBeNull()
  })

  it('stopMonitoring returns false when device not monitored', () => {
    expect(monitor.stopMonitoring(999)).toBe(false)
  })

  it('stopAll handles empty services map', () => {
    expect(() => monitor.stopAll()).not.toThrow()
    expect(monitor.services.size).toBe(0)
  })

  it('getMonitoredCount returns correct count', () => {
    expect(monitor.getMonitoredCount()).toBe(0)
  })

  it('getAllStatuses returns empty array initially', () => {
    expect(monitor.getAllStatuses()).toEqual([])
  })

  it('has callback hooks for status changes', () => {
    expect(monitor.onDeviceStatusChange).toBeNull()
    expect(monitor.onAggregateStatus).toBeNull()
  })

  it('can set callback hooks', () => {
    const deviceCallback = jest.fn()
    const aggregateCallback = jest.fn()

    monitor.onDeviceStatusChange = deviceCallback
    monitor.onAggregateStatus = aggregateCallback

    expect(monitor.onDeviceStatusChange).toBe(deviceCallback)
    expect(monitor.onAggregateStatus).toBe(aggregateCallback)
  })
})

describe('NetworkMonitor Singleton', () => {
  it('exports singleton instance as default', async () => {
    const networkModule = await import('@/main/network-monitor.js')
    expect(networkModule.default).toBeDefined()
    expect(networkModule.default).toBeInstanceOf(NetworkMonitor)
  })
})
