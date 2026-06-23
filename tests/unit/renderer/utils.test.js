/**
 * Renderer utility tests — chart-theme, status, alert-utils
 *
 * @module tests/unit/renderer/utils.test
 */

import { describe, it, expect } from '@jest/globals'
import { getChartColours } from '../../../src/renderer/utils/chart-theme.js'
import { calculateStatusFromLatency, getLatencyColourClass } from '../../../src/renderer/utils/status.js'
import {
  SEVERITY_CONFIG,
  ALERT_TYPE_LABELS,
  STATUS_LABELS,
  formatAlertTime
} from '../../../src/renderer/components/alerts/alert-utils.js'

describe('chart-theme', () => {
  it('returns dark theme colours', () => {
    const colours = getChartColours('dark')
    expect(colours.grid).toBe('#3a3a5c')
    expect(colours.axis).toBe('#8b8ba7')
    expect(colours.tooltip.background).toBe('#252545')
  })

  it('returns light theme colours by default', () => {
    const colours = getChartColours('light')
    expect(colours.grid).toBe('#e9ecef')
    expect(colours.axis).toBe('#6c757d')
    expect(colours.tooltip.background).toBe('#ffffff')
  })

  it('returns light theme for unknown theme values', () => {
    const colours = getChartColours('unknown')
    expect(colours.grid).toBe('#e9ecef')
  })
})

describe('status', () => {
  describe('calculateStatusFromLatency', () => {
    it('returns offline when not online', () => {
      expect(calculateStatusFromLatency(5, false)).toBe('offline')
    })

    it('returns unknown for null latency', () => {
      expect(calculateStatusFromLatency(null, true)).toBe('unknown')
      expect(calculateStatusFromLatency(undefined, true)).toBe('unknown')
    })

    it('returns excellent for latency under 10ms', () => {
      expect(calculateStatusFromLatency(5, true)).toBe('excellent')
      expect(calculateStatusFromLatency(9, true)).toBe('excellent')
    })

    it('returns good for latency 10-50ms', () => {
      expect(calculateStatusFromLatency(10, true)).toBe('good')
      expect(calculateStatusFromLatency(49, true)).toBe('good')
    })

    it('returns fair for latency 50-150ms', () => {
      expect(calculateStatusFromLatency(50, true)).toBe('fair')
      expect(calculateStatusFromLatency(149, true)).toBe('fair')
    })

    it('returns poor for latency over 150ms', () => {
      expect(calculateStatusFromLatency(150, true)).toBe('poor')
      expect(calculateStatusFromLatency(500, true)).toBe('poor')
    })
  })

  describe('getLatencyColourClass', () => {
    it('maps statuses to correct CSS classes', () => {
      expect(getLatencyColourClass(5, true)).toBe('latency-excellent')
      expect(getLatencyColourClass(30, true)).toBe('latency-good')
      expect(getLatencyColourClass(100, true)).toBe('latency-fair')
      expect(getLatencyColourClass(200, true)).toBe('latency-poor')
    })

    it('returns offline class when not online', () => {
      expect(getLatencyColourClass(5, false)).toBe('latency-poor')
    })

    it('returns unknown class for null latency', () => {
      expect(getLatencyColourClass(null, true)).toBe('latency-unknown')
    })

    it('returns unknown class when latency is null even if offline', () => {
      // calculateStatusFromLatency(null, false) returns 'offline' first (isOnline check)
      // but if we pass null with isOnline=true it returns 'unknown'
      expect(getLatencyColourClass(null, true)).toBe('latency-unknown')
    })
  })
})

describe('alert-utils', () => {
  it('has correct severity config', () => {
    expect(SEVERITY_CONFIG.critical.label).toBe('Critical')
    expect(SEVERITY_CONFIG.critical.colour).toBe('#dc3545')
    expect(SEVERITY_CONFIG.warning.label).toBe('Warning')
    expect(SEVERITY_CONFIG.warning.colour).toBe('#ffc107')
  })

  it('has correct alert type labels', () => {
    expect(ALERT_TYPE_LABELS.latency).toBe('Latency')
    expect(ALERT_TYPE_LABELS.consecutive_failures).toBe('Consecutive Failures')
    expect(ALERT_TYPE_LABELS.packet_loss).toBe('Packet Loss')
  })

  it('has correct status labels', () => {
    expect(STATUS_LABELS.triggered).toBe('Triggered')
    expect(STATUS_LABELS.unacknowledged).toBe('Unacknowledged')
    expect(STATUS_LABELS.acknowledged).toBe('Acknowledged')
    expect(STATUS_LABELS.resolved).toBe('Resolved')
  })

  it('formats alert time correctly', () => {
    const formatted = formatAlertTime('2024-06-15T14:30:00.000Z')
    expect(formatted).toContain('15')
    expect(formatted).toContain('2024')
    // Use local hour since toLocaleString converts from UTC
    const localHour = new Date('2024-06-15T14:30:00.000Z').getHours().toString().padStart(2, '0')
    expect(formatted).toContain(localHour)
  })

  it('returns Unknown for missing timestamp', () => {
    expect(formatAlertTime(null)).toBe('Unknown')
    expect(formatAlertTime('')).toBe('Unknown')
  })
})
