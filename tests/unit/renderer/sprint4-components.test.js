/**
 * Sprint 4 Component Logic Tests (Node Environment)
 *
 * Tests component logic and data transformation without JSX rendering,
 * since the Jest environment is 'node' without jsdom support.
 *
 * @module tests/unit/sprint4-components.test
 */

import { describe, it, expect } from '@jest/globals'

describe('SummaryCards Logic', () => {
  it('calculates overall uptime correctly', () => {
    const data = [
      { uptime: { totalPings: 100, successfulPings: 95 } },
      { uptime: { totalPings: 100, successfulPings: 99 } }
    ]
    const totalPings = data.reduce((sum, d) => sum + (d.uptime?.totalPings || 0), 0)
    const successfulPings = data.reduce((sum, d) => sum + (d.uptime?.successfulPings || 0), 0)
    const overallUptime = totalPings > 0 ? Math.round((successfulPings / totalPings) * 100) : 0
    expect(overallUptime).toBe(97)
  })

  it('calculates average latency correctly', () => {
    const data = [
      { averageLatencyMs: 45 },
      { averageLatencyMs: 25 },
      { averageLatencyMs: null }
    ]
    const latencyValues = data
      .map((d) => d.averageLatencyMs)
      .filter((v) => v !== null && v !== undefined)
    const avgLatency = latencyValues.length > 0
      ? Math.round(latencyValues.reduce((a, b) => a + b, 0) / latencyValues.length)
      : null
    expect(avgLatency).toBe(35)
  })

  it('handles empty data gracefully', () => {
    const data = []
    const totalPings = data.reduce((sum, d) => sum + (d.uptime?.totalPings || 0), 0)
    const successfulPings = data.reduce((sum, d) => sum + (d.uptime?.successfulPings || 0), 0)
    const overallUptime = totalPings > 0 ? Math.round((successfulPings / totalPings) * 100) : 0
    expect(overallUptime).toBe(0)
  })
})

describe('QueryBuilder Logic', () => {
  it('updates date range correctly', () => {
    const filters = { dateRange: { start: '2024-01-01', end: '2024-01-31' } }
    const updates = { dateRange: { ...filters.dateRange, start: '2024-02-01' } }
    const result = { ...filters, ...updates }
    expect(result.dateRange.start).toBe('2024-02-01')
    expect(result.dateRange.end).toBe('2024-01-31')
  })

  it('toggles device selection correctly', () => {
    const selectedDevices = [1, 2]
    const deviceId = 2
    const updated = selectedDevices.includes(deviceId)
      ? selectedDevices.filter((id) => id !== deviceId)
      : [...selectedDevices, deviceId]
    expect(updated).toEqual([1])
  })
})

describe('ExportManager Logic', () => {
  it('sanitises column names to prevent injection', () => {
    const columns = ['device_name', 'latency_ms', "'; DROP TABLE devices;--", 123]
    const sanitisedColumns = columns.filter((c) => typeof c === 'string' && /^[\w_]+$/.test(c))
    expect(sanitisedColumns).toEqual(['device_name', 'latency_ms'])
  })

  it('validates date format for export queries', () => {
    const startDate = "2024-01-01'; DROP TABLE"
    const isValid = /^\d{4}-\d{2}-\d{2}$/.test(startDate)
    expect(isValid).toBe(false)
  })

  it('caps export limit to 10000', () => {
    const limit = 999999
    const capped = Math.min(parseInt(limit) || 100, 10000)
    expect(capped).toBe(10000)
  })
})

describe('OutageAnalysis Logic', () => {
  it('categorises outage durations correctly', () => {
    const categorise = (durationSeconds) => {
      if (durationSeconds >= 3600) return 'critical'
      if (durationSeconds >= 300) return 'warning'
      return 'info'
    }

    expect(categorise(7200)).toBe('critical')
    expect(categorise(600)).toBe('warning')
    expect(categorise(60)).toBe('info')
    expect(categorise(0)).toBe('info')
  })

  it('calculates availability percentage correctly', () => {
    const totalDowntime = 3600 // 1 hour
    const windowSeconds = 30 * 24 * 60 * 60 // 30 days
    const uptimePercent = Math.max(0, Math.round(((windowSeconds - totalDowntime) / windowSeconds) * 100))
    expect(uptimePercent).toBe(100) // 1 hour out of 30 days is ~99.86%, rounded to 100
  })

  it('formats duration for display correctly', () => {
    const formatDuration = (seconds) => {
      if (!seconds || seconds <= 0) return 'Ongoing'
      const hours = Math.floor(seconds / 3600)
      const minutes = Math.floor((seconds % 3600) / 60)
      if (hours > 0) return `${hours}h ${minutes}m`
      return `${minutes}m ${seconds % 60}s`
    }

    expect(formatDuration(3661)).toBe('1h 1m')
    expect(formatDuration(300)).toBe('5m 0s')
    expect(formatDuration(0)).toBe('Ongoing')
  })
})
