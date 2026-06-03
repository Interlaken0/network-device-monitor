import React, { useState, useEffect, useCallback } from 'react'
import PropTypes from 'prop-types'

/**
 * Severity colour configuration for alert display.
 * @constant {Object}
 */
const SEVERITY_CONFIG = {
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
const ALERT_TYPE_LABELS = {
  latency: 'Latency',
  consecutive_failures: 'Consecutive Failures',
  packet_loss: 'Packet Loss'
}

/**
 * Formats an ISO timestamp for display.
 *
 * @param {string} timestamp - ISO timestamp
 * @returns {string} Formatted date/time string
 */
function formatAlertTime(timestamp) {
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

/**
 * Individual alert item component.
 *
 * @param {Object} props
 * @param {Object} props.alert - Alert data object
 */
function AlertItem({ alert }) {
  const config = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.warning
  const typeLabel = ALERT_TYPE_LABELS[alert.alertType] || alert.alertType

  return (
    <div
      className={`alert-item ${config.className}`}
      role="listitem"
      aria-label={`${config.label} alert for ${alert.deviceName}: ${alert.message}`}
    >
      <div className="alert-item-header">
        <span
          className="alert-severity-badge"
          style={{ backgroundColor: config.colour }}
        >
          {config.label}
        </span>
        <span className="alert-type">{typeLabel}</span>
        <span className="alert-time">{formatAlertTime(alert.createdAt)}</span>
      </div>
      <div className="alert-item-body">
        <p className="alert-message">{alert.message}</p>
        <span className="alert-device">{alert.deviceName} ({alert.ipAddress})</span>
      </div>
      <div className="alert-item-footer">
        <span className="alert-threshold">
          Threshold: {alert.thresholdValue}
          {alert.alertType === 'latency' && 'ms'}
          {alert.alertType === 'packet_loss' && '%'}
        </span>
        <span className="alert-actual">
          Actual: {alert.actualValue}
          {alert.alertType === 'latency' && 'ms'}
          {alert.alertType === 'packet_loss' && '%'}
        </span>
      </div>
    </div>
  )
}

AlertItem.propTypes = {
  alert: PropTypes.shape({
    id: PropTypes.number.isRequired,
    deviceId: PropTypes.number.isRequired,
    deviceName: PropTypes.string.isRequired,
    ipAddress: PropTypes.string.isRequired,
    alertType: PropTypes.string.isRequired,
    severity: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired,
    thresholdValue: PropTypes.number.isRequired,
    actualValue: PropTypes.number.isRequired,
    createdAt: PropTypes.string.isRequired
  }).isRequired
}

/**
 * ActiveAlerts displays all currently active (unresolved) alerts
 * fetched from the main process database.
 *
 * @component
 */
function ActiveAlerts() {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  /**
   * Fetch active alerts from the main process.
   */
  const loadAlerts = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await window.electronAPI?.getActiveAlerts()
      if (result?.success) {
        setAlerts(result.data || [])
      } else {
        setError(result?.error || 'Failed to load alerts')
        setAlerts([])
      }
    } catch (err) {
      setError(err.message || 'Error fetching alerts')
      setAlerts([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Load alerts on mount
  useEffect(() => {
    loadAlerts()
  }, [loadAlerts])

  const alertCount = alerts.length

  return (
    <section className="card active-alerts" aria-label="Active Alerts">
      <div className="active-alerts-header">
        <h2>Active Alerts</h2>
        <div className="active-alerts-controls">
          {alertCount > 0 && (
            <span className="alert-count-badge" aria-label={`${alertCount} active alerts`}>
              {alertCount}
            </span>
          )}
          <button
            type="button"
            className="refresh-alerts-btn"
            onClick={loadAlerts}
            disabled={loading}
            aria-label="Refresh alerts"
            title="Refresh alerts"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {error && (
        <div className="alert-error-banner" role="alert">
          {error}
        </div>
      )}

      {loading && alerts.length === 0 && (
        <p className="loading-text">Loading alerts...</p>
      )}

      {!loading && alerts.length === 0 && !error && (
        <div className="empty-state">
          <p>No active alerts.</p>
          <p className="empty-hint">All devices are within configured thresholds.</p>
        </div>
      )}

      {alerts.length > 0 && (
        <div className="alert-list" role="list" aria-label="Active alert list">
          {alerts.map((alert) => (
            <AlertItem key={alert.id} alert={alert} />
          ))}
        </div>
      )}
    </section>
  )
}

export default ActiveAlerts
