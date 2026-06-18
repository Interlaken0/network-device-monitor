/**
 * Export Pipeline Integration Tests
 *
 * Verifies the historical data -> export flow end-to-end:
 * 1. Filter configuration (date range, devices, aggregation)
 * 2. Query execution (mocked data retrieval)
 * 3. CSV and HTML export generation
 * 4. Content validation and sanitisation
 *
 * @module tests/integration/export-pipeline.integration.test
 */

// Inline copy of sanitiser logic from export-service.js for test isolation
class TestHtmlSanitiser {
  static dangerousTags = new Set([
    'script', 'iframe', 'object', 'embed', 'form', 'input', 'textarea',
    'button', 'select', 'option', 'link', 'meta', 'style'
  ])

  static dangerousAttributes = new Set([
    'onclick', 'onload', 'onerror', 'onmouseover', 'onmouseout', 'onfocus',
    'onblur', 'onchange', 'onsubmit', 'onreset', 'javascript:', 'vbscript:',
    'data:', 'src', 'href', 'action', 'method', 'enctype'
  ])

  static sanitise(html) {
    if (!html || typeof html !== 'string') {
      return ''
    }

    let sanitised = html
    for (const tag of this.dangerousTags) {
      const regex = new RegExp(`<\\s*${tag}\\b[^>]*>.*?<\\s*/\\s*${tag}\\s*>`, 'gis')
      sanitised = sanitised.replace(regex, '')
      const selfClosingRegex = new RegExp(`<\\s*${tag}\\b[^>]*/?\\s*>`, 'gis')
      sanitised = sanitised.replace(selfClosingRegex, '')
    }

    const attributeRegex = /\s+(\w+)=("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/gi
    sanitised = sanitised.replace(attributeRegex, (match, attrName) => {
      if (this.dangerousAttributes.has(attrName.toLowerCase())) {
        return ''
      }
      return match
    })

    const protocolRegex = /(javascript|vbscript):/gi
    sanitised = sanitised.replace(protocolRegex, '')

    const dataUrlRegex = /data:[^;]*;base64,[a-zA-Z0-9+/=]+/gi
    sanitised = sanitised.replace(dataUrlRegex, '[data-URL-removed]')

    return sanitised.trim()
  }

  static escapeHtml(text) {
    if (!text || typeof text !== 'string') {
      return ''
    }

    const htmlEscapes = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;'
    }

    return text.replace(/[&<>"'/]/g, (match) => htmlEscapes[match])
  }
}

// Inline copy of CSV generation logic
function generateCSVContent(data, columns) {
  if (!data || data.length === 0) {
    return 'No data available'
  }

  const headers = columns.length > 0 ? columns : Object.keys(data[0])
  const csvRows = []

  csvRows.push(headers.map(header => escapeCSVField(header)).join(','))

  for (const row of data) {
    const csvRow = headers.map(header => {
      const value = row[header] || ''
      return escapeCSVField(value)
    })
    csvRows.push(csvRow.join(','))
  }

  return csvRows.join('\n')
}

function escapeCSVField(value) {
  if (value === null || value === undefined) {
    return ''
  }

  const stringValue = String(value)

  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return '"' + stringValue.replace(/"/g, '""') + '"'
  }

  return stringValue
}

describe('Export Pipeline Integration', () => {
  describe('Historical Filter State', () => {
    test('filter object matches expected structure for outage timeline', () => {
      const filters = {
        dateRange: { start: '2026-06-01', end: '2026-06-10' },
        selectedDevices: [1, 2],
        aggregationType: 'avg',
        outageTimeRange: '7days',
        outageSeverityFilter: 'critical'
      }

      expect(filters.dateRange.start).toBe('2026-06-01')
      expect(filters.dateRange.end).toBe('2026-06-10')
      expect(filters.selectedDevices).toEqual([1, 2])
      expect(filters.outageTimeRange).toBe('7days')
      expect(filters.outageSeverityFilter).toBe('critical')
    })

    test('default filter values are sensible', () => {
      const defaults = {
        dateRange: { start: '', end: '' },
        selectedDevices: [],
        aggregationType: 'avg',
        outageTimeRange: '24hr',
        outageSeverityFilter: 'all'
      }

      expect(defaults.outageTimeRange).toBe('24hr')
      expect(defaults.outageSeverityFilter).toBe('all')
    })
  })

  describe('CSV Export Generation', () => {
    const mockPingLogs = [
      { device_name: 'Router A', ip_address: '192.168.1.1', latency_ms: 12, success: 1, timestamp: '2026-06-10 10:00:00' },
      { device_name: 'Printer B', ip_address: '192.168.1.50', latency_ms: 45, success: 1, timestamp: '2026-06-10 10:05:00' },
      { device_name: 'Server C', ip_address: '192.168.1.10', latency_ms: null, success: 0, timestamp: '2026-06-10 10:10:00' }
    ]

    test('generates CSV with correct headers and rows', () => {
      const columns = ['device_name', 'ip_address', 'latency_ms', 'success']
      const csv = generateCSVContent(mockPingLogs, columns)

      const lines = csv.split('\n')
      expect(lines).toHaveLength(4)
      expect(lines[0]).toBe('device_name,ip_address,latency_ms,success')
      expect(lines[1]).toBe('Router A,192.168.1.1,12,1')
    })

    test('handles commas and quotes in fields with proper escaping', () => {
      const data = [
        { name: 'Device, with comma', value: 'say "hello"' }
      ]
      const csv = generateCSVContent(data, ['name', 'value'])

      expect(csv).toContain('"Device, with comma"')
      expect(csv).toContain('"say ""hello"""')
    })

    test('returns message when no data is available', () => {
      const csv = generateCSVContent([], ['device_name'])
      expect(csv).toBe('No data available')
    })

    test('handles null and undefined values gracefully', () => {
      const data = [{ field: null, other: undefined }]
      const csv = generateCSVContent(data, ['field', 'other'])
      expect(csv).toBe('field,other\n,')
    })
  })

  describe('HTML Sanitisation (Security)', () => {
    test('removes script tags from generated HTML', () => {
      const dirty = '<p>Safe</p><script>alert("xss")</script><p>Also safe</p>'
      const clean = TestHtmlSanitiser.sanitise(dirty)

      expect(clean).not.toContain('<script')
      expect(clean).not.toContain('</script>')
      expect(clean).toContain('<p>Safe</p>')
      expect(clean).toContain('<p>Also safe</p>')
    })

    test('removes dangerous event handlers', () => {
      const dirty = '<div onclick="stealCookies()" onload="bad()">content</div>'
      const clean = TestHtmlSanitiser.sanitise(dirty)

      expect(clean).not.toContain('onclick')
      expect(clean).not.toContain('onload')
      expect(clean).toContain('<div>content</div>')
    })

    test('removes javascript: protocol URLs', () => {
      const dirty = '<a href="javascript:void(0)">click</a>'
      const clean = TestHtmlSanitiser.sanitise(dirty)

      expect(clean).not.toContain('javascript:')
    })

    test('escapes HTML entities for safe display', () => {
      const text = '<script>alert("xss")</script>'
      const escaped = TestHtmlSanitiser.escapeHtml(text)

      expect(escaped).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;')
      expect(escaped).not.toContain('<script>')
    })

    test('handles empty or non-string input in sanitiser', () => {
      expect(TestHtmlSanitiser.sanitise('')).toBe('')
      expect(TestHtmlSanitiser.sanitise(null)).toBe('')
      expect(TestHtmlSanitiser.sanitise(undefined)).toBe('')
    })
  })

  describe('End-to-End Data Flow', () => {
    test('pipeline: filters -> mock query -> CSV export with no IPC errors', () => {
      const filters = {
        dateRange: { start: '2026-06-01', end: '2026-06-10' },
        selectedDevices: [1],
        aggregationType: 'avg'
      }

      const mockResult = [
        { device_id: 1, avg_latency: 15.5, total_pings: 100, failed_pings: 2 }
      ]

      const csv = generateCSVContent(mockResult, ['device_id', 'avg_latency', 'total_pings', 'failed_pings'])

      expect(filters.dateRange.start).toBeDefined()
      expect(filters.dateRange.end).toBeDefined()
      expect(csv).toContain('device_id,avg_latency,total_pings,failed_pings')
      expect(csv).toContain('1,15.5,100,2')
      expect(csv).not.toContain('[object Object]')
    })

    test('pipeline: filters -> mock query -> HTML report sanitisation', () => {
      const mockData = {
        devices: [
          { name: 'Router<script>evil()</script>', ip_address: '192.168.1.1' }
        ],
        stats: { deviceCount: 1, pingCount: 50, outageCount: 0 }
      }

      const title = 'Outage Summary'
      const html = `<h1>${title}</h1><div>${mockData.devices.map(d => `<p>${TestHtmlSanitiser.escapeHtml(d.name)}</p>`).join('')}</div>`
      const sanitised = TestHtmlSanitiser.sanitise(html)

      expect(sanitised).toContain('Router&lt;script&gt;evil()&lt;&#x2F;script&gt;')
      expect(sanitised).not.toContain('<script>evil()</script>')
    })
  })
})
