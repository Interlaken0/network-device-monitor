import React, { useState, useEffect, useCallback } from 'react'
import PropTypes from 'prop-types'
import {
  SEVERITY_CONFIG,
  ALERT_TYPE_LABELS,
  STATUS_LABELS,
  formatAlertTime
} from './alert-utils'

/**
 * Individual history alert item component.
 *
 * @param {Object} props
 * @param {Object} props.alert - Alert data object
 */
function HistoryAlertItem({ alert }) {
  const config = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.warning
  const typeLabel = ALERT_TYPE_LABELS[alert.alertType] || alert.alertType
  const statusLabel = STATUS_LABELS[alert.status] || alert.status

  return (
    <div
      className={`alert-item history ${config.className}`}
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
        <span className="alert-status">{statusLabel}</span>
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
        {alert.acknowledgedAt && (
          <span className="alert-meta">
            Acknowledged: {formatAlertTime(alert.acknowledgedAt)}
          </span>
        )}
        {alert.resolvedAt && (
          <span className="alert-meta">
            Resolved: {formatAlertTime(alert.resolvedAt)}
          </span>
        )}
      </div>
    </div>
  )
}

HistoryAlertItem.propTypes = {
  alert: PropTypes.shape({
    id: PropTypes.number.isRequired,
    deviceId: PropTypes.number.isRequired,
    deviceName: PropTypes.string.isRequired,
    ipAddress: PropTypes.string.isRequired,
    alertType: PropTypes.string.isRequired,
    severity: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired,
    thresholdValue: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    actualValue: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    createdAt: PropTypes.string.isRequired,
    acknowledgedAt: PropTypes.string,
    resolvedAt: PropTypes.string
  }).isRequired
}

/**
 * AlertHistory displays historical alert events including
 * acknowledged and resolved alerts.
 *
 * @component
 */
function AlertHistory() {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')

  /**
   * Fetch alert history from the main process.
   */
  const loadHistory = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const status = statusFilter === 'all' ? null : statusFilter
      const result = await window.electronAPI?.getAllAlerts(status, 100)
      if (result?.success) {
        setAlerts(result.data || [])
      } else {
        setError(result?.error || 'Failed to load alert history')
        setAlerts([])
      }
    } catch (err) {
      setError(err.message || 'Error fetching alert history')
      setAlerts([])
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  // Load history on mount and when filter changes
  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  return (
    <section className="card alert-history" aria-label="Alert History">
      <div className="alert-history-header">
        <h2>Alert History</h2>
        <div className="alert-history-controls">
          <label htmlFor="status-filter">Filter:</label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All</option>
            <option value="triggered">Triggered</option>
            <option value="unacknowledged">Unacknowledged</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="resolved">Resolved</option>
          </select>
          <button
            type="button"
            className="refresh-alerts-btn"
            onClick={loadHistory}
            disabled={loading}
            aria-label="Refresh alert history"
            title="Refresh alert history"
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
        <p className="loading-text">Loading alert history...</p>
      )}

      {!loading && alerts.length === 0 && !error && (
        <div className="empty-state">
          <p>No alerts in history.</p>
          <p className="empty-hint">Alerts will appear here once they are triggered, acknowledged, or resolved.</p>
        </div>
      )}

      {alerts.length > 0 && (
        <div className="alert-list" role="list" aria-label="Alert history list">
          {alerts.map((alert) => (
            <HistoryAlertItem key={alert.id} alert={alert} />
          ))}
        </div>
      )}
    </section>
  )
}

export default AlertHistory
