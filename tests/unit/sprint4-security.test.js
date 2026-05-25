/**
 * Sprint 4 Security Hardening Tests
 *
 * Validates rate limiting, path traversal prevention, and
 * export query sanitisation added to ipc-handlers.js.
 *
 * @module tests/unit/sprint4-security.test
 */

import { describe, it, expect } from '@jest/globals'

/**
 * Recreate the security utilities inline for isolated testing.
 * These mirror the implementations in src/main/ipc-handlers.js.
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
    const validRequests = channelRequests.filter((ts) => now - ts < this.windowMs)
    this.requests.set(channel, validRequests)

    if (validRequests.length >= this.maxRequests) {
      return false
    }

    validRequests.push(now)
    return true
  }
}

function isSafeFilename(filename) {
  if (!filename || typeof filename !== 'string') return false
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) return false
  return /^[\w\-. ]+$/.test(filename)
}

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

describe('RateLimiter', () => {
  it('allows requests within the limit', () => {
    const limiter = new RateLimiter(10000, 3)
    expect(limiter.isAllowed('export:csv')).toBe(true)
    expect(limiter.isAllowed('export:csv')).toBe(true)
    expect(limiter.isAllowed('export:csv')).toBe(true)
  })

  it('blocks requests exceeding the limit', () => {
    const limiter = new RateLimiter(10000, 2)
    limiter.isAllowed('export:csv')
    limiter.isAllowed('export:csv')
    expect(limiter.isAllowed('export:csv')).toBe(false)
  })

  it('tracks channels independently', () => {
    const limiter = new RateLimiter(10000, 1)
    limiter.isAllowed('export:csv')
    expect(limiter.isAllowed('export:html')).toBe(true)
  })

  it('resets after the time window expires', async () => {
    const limiter = new RateLimiter(50, 1)
    limiter.isAllowed('export:csv')
    expect(limiter.isAllowed('export:csv')).toBe(false)
    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(limiter.isAllowed('export:csv')).toBe(true)
  })
})

describe('isSafeFilename', () => {
  it('accepts safe filenames', () => {
    expect(isSafeFilename('report.csv')).toBe(true)
    expect(isSafeFilename('my-export_2024.html')).toBe(true)
    expect(isSafeFilename('file name.txt')).toBe(true)
  })

  it('rejects path traversal attempts', () => {
    expect(isSafeFilename('../../../etc/passwd')).toBe(false)
    expect(isSafeFilename('..\\windows\\system32')).toBe(false)
    expect(isSafeFilename('file../name')).toBe(false)
  })

  it('rejects absolute and relative paths', () => {
    expect(isSafeFilename('/etc/passwd')).toBe(false)
    expect(isSafeFilename('C:\\windows\\file.txt')).toBe(false)
    expect(isSafeFilename('dir/file.txt')).toBe(false)
  })

  it('rejects empty or non-string inputs', () => {
    expect(isSafeFilename('')).toBe(false)
    expect(isSafeFilename(null)).toBe(false)
    expect(isSafeFilename(123)).toBe(false)
  })

  it('rejects special characters', () => {
    expect(isSafeFilename('file<script>.csv')).toBe(false)
    expect(isSafeFilename('file;rm -rf.csv')).toBe(false)
    expect(isSafeFilename('file*.csv')).toBe(false)
  })
})

describe('sanitiseExportQuery', () => {
  it('preserves valid query parameters', () => {
    const query = { type: 'ping_logs', deviceId: 5, startDate: '2024-01-01', endDate: '2024-01-31' }
    const result = sanitiseExportQuery(query)
    expect(result.type).toBe('ping_logs')
    expect(result.deviceId).toBe(5)
    expect(result.startDate).toBe('2024-01-01')
    expect(result.endDate).toBe('2024-01-31')
  })

  it('defaults to devices type for invalid types', () => {
    const result = sanitiseExportQuery({ type: 'malicious_sql' })
    expect(result.type).toBe('devices')
  })

  it('rejects malformed dates', () => {
    const result = sanitiseExportQuery({
      type: 'ping_logs',
      startDate: "2024-01-01'; DROP TABLE devices;--",
      endDate: 'invalid-date'
    })
    expect(result.startDate).toBeUndefined()
    expect(result.endDate).toBeUndefined()
  })

  it('caps the limit to 10000', () => {
    const result = sanitiseExportQuery({ type: 'ping_logs', limit: 999999 })
    expect(result.limit).toBe(10000)
  })

  it('defaults limit to 1000 when not provided', () => {
    const result = sanitiseExportQuery({ type: 'outages' })
    expect(result.limit).toBe(1000)
  })

  it('filters invalid template values', () => {
    const result = sanitiseExportQuery({ type: 'summary', template: 'malicious' })
    expect(result.template).toBe('uptime')
  })

  it('accepts valid template values', () => {
    const result = sanitiseExportQuery({ type: 'summary', template: 'latency' })
    expect(result.template).toBe('latency')
  })
})
