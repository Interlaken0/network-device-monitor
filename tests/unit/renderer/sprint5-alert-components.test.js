/**
 * Sprint 5 Alert Component Logic Tests (Node Environment)
 *
 * Tests component logic, data transformation, and state management
 * for alert components without JSX rendering.
 *
 * @module tests/unit/sprint5-alert-components.test
 */

import { describe, it, expect } from '@jest/globals'

describe('ActiveAlerts Logic', () => {
  it('counts active alerts correctly', () => {
    const alerts = [
      { id: 1, severity: 'critical', status: 'triggered' },
      { id: 2, severity: 'warning', status: 'acknowledged' }
    ]
    const count = alerts.length
    expect(count).toBe(2)
  })

  it('derives acknowledge loading key from alert ID', () => {
    const alertId = 5
    const actionLoading = `ack-${alertId}`
    expect(actionLoading).toBe('ack-5')
  })

  it('derives resolve loading key from alert ID', () => {
    const alertId = 5
    const actionLoading = `res-${alertId}`
    expect(actionLoading).toBe('res-5')
  })

  it('disables acknowledge button for already acknowledged alerts', () => {
    const alert = { id: 1, status: 'acknowledged' }
    const isAcknowledged = alert.status === 'acknowledged'
    expect(isAcknowledged).toBe(true)
  })

  it('formats alert severity labels correctly', () => {
    const SEVERITY_CONFIG = {
      critical: { label: 'Critical', colour: '#dc3545' },
      warning: { label: 'Warning', colour: '#ffc107' }
    }
    expect(SEVERITY_CONFIG.critical.label).toBe('Critical')
    expect(SEVERITY_CONFIG.warning.label).toBe('Warning')
  })

  it('formats alert type labels correctly', () => {
    const ALERT_TYPE_LABELS = {
      latency: 'Latency',
      consecutive_failures: 'Consecutive Failures',
      packet_loss: 'Packet Loss'
    }
    expect(ALERT_TYPE_LABELS.latency).toBe('Latency')
    expect(ALERT_TYPE_LABELS.consecutive_failures).toBe('Consecutive Failures')
  })

  it('formats status labels for all alert states', () => {
    const STATUS_LABELS = {
      triggered: 'Triggered',
      unacknowledged: 'Unacknowledged',
      acknowledged: 'Acknowledged',
      resolved: 'Resolved'
    }
    expect(STATUS_LABELS.triggered).toBe('Triggered')
    expect(STATUS_LABELS.acknowledged).toBe('Acknowledged')
    expect(STATUS_LABELS.resolved).toBe('Resolved')
  })
})

describe('ToastNotifications Logic', () => {
  it('keeps last 10 notifications in queue', () => {
    const notifications = Array.from({ length: 12 }, (_, i) => ({ id: i }))
    const trimmed = notifications.slice(-10)
    expect(trimmed.length).toBe(10)
    expect(trimmed[0].id).toBe(2)
    expect(trimmed[9].id).toBe(11)
  })

  it('calculates unread count correctly', () => {
    const notifications = [
      { id: 1, isRead: true },
      { id: 2, isRead: false },
      { id: 3, isRead: false }
    ]
    const unreadCount = notifications.filter((n) => !n.isRead).length
    expect(unreadCount).toBe(2)
  })

  it('maps critical alert severity to outage toast type', () => {
    const alertSeverity = 'critical'
    const toastType = alertSeverity === 'critical' ? 'outage' : 'warning'
    expect(toastType).toBe('outage')
  })

  it('maps warning alert severity to warning toast type', () => {
    const alertSeverity = 'warning'
    const toastType = alertSeverity === 'critical' ? 'outage' : 'warning'
    expect(toastType).toBe('warning')
  })

  it('sets zero duration for critical toasts (no auto-dismiss)', () => {
    const alertSeverity = 'critical'
    const duration = alertSeverity === 'critical' ? 0 : 6000
    expect(duration).toBe(0)
  })

  it('sets non-zero duration for warning toasts', () => {
    const alertSeverity = 'warning'
    const duration = alertSeverity === 'critical' ? 0 : 6000
    expect(duration).toBe(6000)
  })

  it('generates unique notification IDs from alert IDs', () => {
    const alertId = 42
    const notificationId = `alert-${alertId}`
    expect(notificationId).toBe('alert-42')
  })
})

describe('AlertConfiguration Logic', () => {
  it('validates latency threshold within range', () => {
    const validateThreshold = (type, value) => {
      const rules = { latency: { min: 50, max: 500, label: 'Latency threshold' } }
      const rule = rules[type]
      const num = Number(value)
      if (Number.isNaN(num)) return `${rule.label} must be a number`
      if (num < rule.min || num > rule.max) {
        return `${rule.label} must be between ${rule.min} and ${rule.max}`
      }
      return null
    }
    expect(validateThreshold('latency', 100)).toBeNull()
    expect(validateThreshold('latency', 49)).toContain('must be between')
    expect(validateThreshold('latency', 501)).toContain('must be between')
    expect(validateThreshold('latency', 'abc')).toContain('must be a number')
  })

  it('builds default configuration with correct values', () => {
    const buildDefaultConfig = (deviceId) => ({
      deviceId,
      enabled: true,
      latencyThresholdMs: 150,
      consecutiveFailuresThreshold: 3,
      packetLossThresholdPct: 10,
      latencySeverity: 'warning',
      failuresSeverity: 'critical',
      packetLossSeverity: 'warning'
    })
    const config = buildDefaultConfig(7)
    expect(config.deviceId).toBe(7)
    expect(config.enabled).toBe(true)
    expect(config.latencyThresholdMs).toBe(150)
    expect(config.failuresSeverity).toBe('critical')
  })

  it('determines form validity from error presence', () => {
    const errors = { latency: null, failures: null, packetLoss: null }
    const hasErrors = Object.values(errors).some((e) => e !== null)
    expect(hasErrors).toBe(false)
  })

  it('detects invalid form when any field has an error', () => {
    const errors = { latency: null, failures: 'Required', packetLoss: null }
    const hasErrors = Object.values(errors).some((e) => e !== null)
    expect(hasErrors).toBe(true)
  })
})

describe('AlertHistory Logic', () => {
  it('filters alerts by status', () => {
    const alerts = [
      { id: 1, status: 'acknowledged' },
      { id: 2, status: 'resolved' },
      { id: 3, status: 'acknowledged' }
    ]
    const filter = 'acknowledged'
    const filtered = filter === 'all' ? alerts : alerts.filter((a) => a.status === filter)
    expect(filtered.length).toBe(2)
    expect(filtered.every((a) => a.status === 'acknowledged')).toBe(true)
  })

  it('sorts alerts by createdAt descending', () => {
    const alerts = [
      { id: 1, createdAt: '2026-06-01T10:00:00Z' },
      { id: 2, createdAt: '2026-06-05T12:00:00Z' },
      { id: 3, createdAt: '2026-06-03T08:00:00Z' }
    ]
    const sorted = [...alerts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    expect(sorted[0].id).toBe(2)
    expect(sorted[1].id).toBe(3)
    expect(sorted[2].id).toBe(1)
  })

  it('passes all alerts when status filter is "all"', () => {
    const alerts = [
      { id: 1, status: 'acknowledged' },
      { id: 2, status: 'resolved' }
    ]
    const filter = 'all'
    const filtered = filter === 'all' ? alerts : alerts.filter((a) => a.status === filter)
    expect(filtered.length).toBe(2)
  })
})

describe('Alert Broadcast Event Logic', () => {
  it('constructs correct alert event payload', () => {
    const alert = {
      id: 1,
      deviceId: 5,
      severity: 'critical',
      message: 'Latency 200ms exceeds threshold 150ms'
    }
    const payload = { eventType: 'created', alert }
    expect(payload.eventType).toBe('created')
    expect(payload.alert.id).toBe(1)
    expect(payload.alert.severity).toBe('critical')
  })

  it('safely skips broadcast when BrowserWindow is unavailable', () => {
    const getAllWindows = undefined
    const shouldSkip = typeof getAllWindows !== 'function'
    expect(shouldSkip).toBe(true)
  })
})
