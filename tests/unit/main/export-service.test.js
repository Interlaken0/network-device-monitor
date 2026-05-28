/**
 * Export Service Tests
 *
 * Verifies CSV generation, HTML report generation, and file saving.
 *
 * @module tests/unit/export-service.test
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals'

// Mock database module before importing the service
const mockDb = {
  getAllDevices: jest.fn(() => [
    { id: 1, name: 'Router-1', ip_address: '192.168.1.1', device_type: 'router', location: 'Office', is_active: 1 },
    { id: 2, name: 'Server-1', ip_address: '192.168.1.2', device_type: 'server', location: 'DC', is_active: 1 }
  ]),
  getStats: jest.fn(() => ({ deviceCount: 2, pingCount: 100, outageCount: 1 })),
  getRecentPings: jest.fn(() => [
    { device_id: 1, latency_ms: 4, success: 1, timestamp: '2024-01-01 12:00:00' }
  ]),
  getPingLogsForExport: jest.fn(() => [
    { device_name: 'Router-1', ip_address: '192.168.1.1', latency_ms: 4, success: 1, packet_loss: 0, timestamp: '2024-01-01 12:00:00' }
  ]),
  getOutagesForExport: jest.fn(() => [
    { device_name: 'Router-1', ip_address: '192.168.1.1', start_time: '2024-01-01 10:00:00', end_time: '2024-01-01 10:05:00', duration_seconds: 300, severity: 'warning' }
  ])
}

jest.unstable_mockModule('../../../src/main/db/database.js', () => ({
  getDatabase: jest.fn(() => Promise.resolve(mockDb))
}))

// Dynamic import after mock is registered
const { ExportService, BasicHtmlSanitiser } = await import('../../../src/main/services/export-service.js')

let exportService

beforeEach(() => {
  exportService = new ExportService()
  jest.clearAllMocks()
})

describe('BasicHtmlSanitiser', () => {
  it('removes script tags from HTML', () => {
    const input = '<p>Hello</p><script>alert("xss")</script>'
    const result = BasicHtmlSanitiser.sanitise(input)
    expect(result).not.toContain('<script')
    expect(result).toContain('<p>Hello</p>')
  })

  it('escapes HTML entities', () => {
    const input = '<div>test & "quote"</div>'
    const result = BasicHtmlSanitiser.escapeHtml(input)
    expect(result).toContain('&lt;div&gt;')
    expect(result).toContain('&amp;')
    expect(result).toContain('&quot;')
  })
})

describe('generateCSV', () => {
  it('generates CSV for devices', async () => {
    const result = await exportService.generateCSV(
      { type: 'devices' },
      ['name', 'ip_address', 'device_type']
    )
    expect(result).toContain('name,ip_address,device_type')
    expect(result).toContain('Router-1,192.168.1.1,router')
  })

  it('sanitises string values in CSV output', async () => {
    mockDb.getAllDevices.mockReturnValueOnce([
      { name: '<script>alert(1)</script>', ip_address: '10.0.0.1', device_type: 'server', location: '', is_active: 1 }
    ])
    const result = await exportService.generateCSV(
      { type: 'devices' },
      ['name', 'ip_address']
    )
    expect(result).not.toContain('<script>')
    expect(result).toContain('&lt;script&gt;')
  })
})

describe('generateHTMLReport', () => {
  it('generates summary report with stats and devices', async () => {
    const html = await exportService.generateHTMLReport(
      { type: 'summary' },
      { template: 'uptime' }
    )
    expect(html).toContain('Uptime Report')
    expect(html).toContain('Total Devices')
    expect(html).toContain('Router-1')
    expect(html).toContain('Server-1')
  })

  it('generates devices report without stats', async () => {
    const html = await exportService.generateHTMLReport(
      { type: 'devices' },
      { template: 'uptime' }
    )
    expect(html).toContain('Router-1')
    expect(html).not.toContain('Total Devices') // no stats block
  })

  it('generates ping_logs report with ping data table', async () => {
    const html = await exportService.generateHTMLReport(
      { type: 'ping_logs', deviceId: 1, startDate: '2024-01-01', endDate: '2024-01-31' },
      { template: 'latency' }
    )
    expect(html).toContain('Latency Analysis')
    expect(html).toContain('Ping Logs')
    expect(html).toContain('Router-1')
    expect(html).toContain('4')
  })

  it('generates outages report with outage data table', async () => {
    const html = await exportService.generateHTMLReport(
      { type: 'outages' },
      { template: 'outage' }
    )
    expect(html).toContain('Outage Summary')
    expect(html).toContain('Outages')
    expect(html).toContain('Router-1')
    expect(html).toContain('300')
    expect(html).toContain('warning')
  })

  it('sanitises device names in HTML output', async () => {
    mockDb.getAllDevices.mockReturnValueOnce([
      { id: 1, name: '<script>evil</script>', ip_address: '10.0.0.1', device_type: 'server', location: '', is_active: 1 }
    ])
    const html = await exportService.generateHTMLReport(
      { type: 'devices' },
      { template: 'uptime' }
    )
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;evil&lt;&#x2F;script&gt;')
  })

  it('defaults title when template is unrecognised', async () => {
    const html = await exportService.generateHTMLReport(
      { type: 'summary' },
      { template: 'unknown' }
    )
    expect(html).toContain('Network Monitor Report')
  })
})
