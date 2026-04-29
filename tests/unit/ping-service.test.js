import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals'
import ping from 'ping'
import PingService from '@/main/ping-service.js'

describe('PingService', () => {
  let service

  beforeEach(() => {
    jest.clearAllMocks()
    ping.promise.probe.mockReset()
    ping.promise.probe.mockResolvedValue({ alive: true, time: 10 })
    service = new PingService()
  })

  afterEach(() => {
    if (service.isRunning) {
      service.stop()
    }
  })

  it('creates instance with default values', () => {
    expect(service.isRunning).toBe(false)
    expect(service.deviceId).toBeNull()
    expect(service.ipAddress).toBeNull()
    expect(service.intervalMs).toBe(5000)
    expect(service.abortController).toBeNull()
  })

  it('getStatus returns correct initial state', () => {
    const status = service.getStatus()
    expect(status.isRunning).toBe(false)
    expect(status.deviceId).toBeNull()
    expect(status.ipAddress).toBeNull()
    expect(status.intervalMs).toBe(5000)
  })

  it('throws error when starting already running service', async () => {
    ping.promise.probe.mockResolvedValue({ alive: true, time: 10 })

    await service.start(1, '192.168.1.1', 1000)

    await expect(service.start(1, '192.168.1.1', 1000))
      .rejects.toThrow('PingService already running')

    service.stop()
  })

  it('stops running service gracefully', async () => {
    ping.promise.probe.mockResolvedValue({ alive: true, time: 10 })

    await service.start(1, '192.168.1.1', 1000)
    expect(service.isRunning).toBe(true)

    service.stop()
    expect(service.isRunning).toBe(false)
    expect(service.abortController).toBeNull()
  })

  it('stops without error when not running', () => {
    expect(() => service.stop()).not.toThrow()
  })

  it('updates status after starting', async () => {
    ping.promise.probe.mockResolvedValue({ alive: true, time: 15 })

    await service.start(1, '192.168.1.1', 1000)

    const status = service.getStatus()
    expect(status.isRunning).toBe(true)
    expect(status.deviceId).toBe(1)
    expect(status.ipAddress).toBe('192.168.1.1')
    expect(status.intervalMs).toBe(1000)

    service.stop()
  })

  it('tracks statistics on successful ping', async () => {
    ping.promise.probe.mockResolvedValue({ alive: true, time: 20 })

    await service.start(1, '192.168.1.1', 1000)

    expect(service.stats.totalPings).toBeGreaterThanOrEqual(1)
    expect(service.stats.successfulPings).toBeGreaterThanOrEqual(1)

    service.stop()
  })

  it('tracks statistics on failed ping', async () => {
    ping.promise.probe.mockResolvedValue({ alive: false, time: null })

    await service.start(1, '192.168.1.1', 1000)

    expect(service.stats.totalPings).toBeGreaterThanOrEqual(1)
    expect(service.stats.failedPings).toBeGreaterThanOrEqual(1)

    service.stop()
  })

  it('handles ping errors gracefully', async () => {
    ping.promise.probe.mockRejectedValue(new Error('Network unreachable'))

    await service.start(1, '192.168.1.1', 1000)

    expect(service.stats.totalPings).toBeGreaterThanOrEqual(1)
    expect(service.stats.failedPings).toBeGreaterThanOrEqual(1)

    service.stop()
  })

  it('maintains latency history (max 10 entries)', async () => {
    let pingCount = 0
    ping.promise.probe.mockImplementation(() => {
      pingCount++
      return Promise.resolve({ alive: true, time: pingCount * 10 })
    })

    await service.start(1, '192.168.1.1', 100)

    // Wait for a few pings
    await new Promise(resolve => setTimeout(resolve, 250))

    expect(service.stats.latencies.length).toBeLessThanOrEqual(10)

    service.stop()
  })
})

describe('NetworkMonitor', () => {
  let monitor
  let NetworkMonitor

  beforeEach(async () => {
    const networkModule = await import('@/main/network-monitor.js')
    NetworkMonitor = networkModule.NetworkMonitor
    monitor = new NetworkMonitor()
    jest.clearAllMocks()
  })

  afterEach(() => {
    monitor.stopAll()
  })

  it('creates instance with empty services map', () => {
    expect(monitor.services.size).toBe(0)
    expect(monitor.getMonitoredCount()).toBe(0)
  })

  it('isMonitoring returns false for unmonitored device', () => {
    expect(monitor.isMonitoring(1)).toBe(false)
  })

  it('getDeviceStatus returns null for unmonitored device', () => {
    expect(monitor.getDeviceStatus(1)).toBeNull()
  })

  it('stopMonitoring returns false for unmonitored device', () => {
    expect(monitor.stopMonitoring(1)).toBe(false)
  })

  it('getAllStatuses returns empty array when no devices monitored', () => {
    expect(monitor.getAllStatuses()).toEqual([])
  })

  it('stopAll clears all services', () => {
    monitor.stopAll()
    expect(monitor.services.size).toBe(0)
  })

  it('exports singleton instance', async () => {
    const networkModule = await import('@/main/network-monitor.js')
    expect(networkModule.default).toBeDefined()
  })
})
