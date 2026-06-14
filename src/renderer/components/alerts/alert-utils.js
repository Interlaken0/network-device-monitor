/**
 * Shared alert formatting utilities and display constants.
 * Used by ActiveAlerts, AlertHistory, and other alert components.
 */

/**
 * Severity colour configuration for alert display.
 * @constant {Object}
 */
export const SEVERITY_CONFIG = {
  critical: {
    className: 'alert-critical',
    label: 'Critical',
    colour: '#dc3545'
  },
  warning: {
    className: 'alert-warning',
    label: 'Warning',
    colour: '#ffc107'
  }
}

/**
 * Alert type display labels.
 * @constant {Object}
 */
export const ALERT_TYPE_LABELS = {
  latency: 'Latency',
  consecutive_failures: 'Consecutive Failures',
  packet_loss: 'Packet Loss'
}

/**
 * Status display labels for alerts.
 * @constant {Object}
 */
export const STATUS_LABELS = {
  triggered: 'Triggered',
  unacknowledged: 'Unacknowledged',
  acknowledged: 'Acknowledged',
  resolved: 'Resolved'
}

/**
 * Formats an ISO timestamp for display.
 *
 * @param {string} timestamp - ISO timestamp
 * @returns {string} Formatted date/time string
 */
export function formatAlertTime(timestamp) {
  if (!timestamp) return 'Unknown'
  const date = new Date(timestamp)
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
