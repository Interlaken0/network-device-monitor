import React, { useState, useEffect, useCallback } from 'react'
import PropTypes from 'prop-types'
import {
  SEVERITY_CONFIG,
  ALERT_TYPE_LABELS,
  STATUS_LABELS,
  formatAlertTime
} from './alert-utils'


/**
 * Individual alert item component.
 *
 * @param {Object} props
 * @param {Object} props.alert - Alert data object
 * @param {Function} props.onAcknowledge - Callback to acknowledge alert
 * @param {Function} props.onResolve - Callback to resolve alert
 * @param {string|null} props.actionLoading - Current action loading state
 */
function AlertItem({ alert, onAcknowledge, onResolve, actionLoading }) {
  const config = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.warning
  const typeLabel = ALERT_TYPE_LABELS[alert.alertType] || alert.alertType
  const statusLabel = STATUS_LABELS[alert.status] || alert.status
  const isAckLoading = actionLoading === `ack-${alert.id}`
  const isResLoading = actionLoading === `res-${alert.id}`
  const isAcknowledged = alert.status === 'acknowledged'

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
      </div>
      <div className="alert-item-actions">
        {!isAcknowledged && (
          <button
            type="button"
            className="btn-acknowledge"
            onClick={() => onAcknowledge(alert.id)}
            disabled={isAckLoading || isResLoading}
            aria-label={`Acknowledge alert for ${alert.deviceName}`}
          >
            {isAckLoading ? 'Acknowledging...' : 'Acknowledge'}
          </button>
        )}
        <button
          type="button"
          className="btn-resolve"
          onClick={() => onResolve(alert.id)}
          disabled={isAckLoading || isResLoading}
          aria-label={`Resolve alert for ${alert.deviceName}`}
        >
          {isResLoading ? 'Resolving...' : 'Resolve'}
        </button>
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
    status: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired,
    thresholdValue: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    actualValue: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    createdAt: PropTypes.string.isRequired
  }).isRequired,
  onAcknowledge: PropTypes.func.isRequired,
  onResolve: PropTypes.func.isRequired,
  actionLoading: PropTypes.string
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
  const [actionLoading, setActionLoading] = useState(null)

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

  /**
   * Acknowledge a single alert.
   */
  const handleAcknowledge = useCallback(async (alertId) => {
    setActionLoading(`ack-${alertId}`)
    try {
      const result = await window.electronAPI?.acknowledgeAlert(alertId)
      if (result?.success) {
        await loadAlerts()
      } else {
        setError(result?.error || 'Failed to acknowledge alert')
      }
    } catch (err) {
      setError(err.message || 'Error acknowledging alert')
    } finally {
      setActionLoading(null)
    }
  }, [loadAlerts])

  /**
   * Resolve a single alert.
   */
  const handleResolve = useCallback(async (alertId) => {
    setActionLoading(`res-${alertId}`)
    try {
      const result = await window.electronAPI?.resolveAlert(alertId)
      if (result?.success) {
        await loadAlerts()
      } else {
        setError(result?.error || 'Failed to resolve alert')
      }
    } catch (err) {
      setError(err.message || 'Error resolving alert')
    } finally {
      setActionLoading(null)
    }
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
            <AlertItem
              key={alert.id}
              alert={alert}
              onAcknowledge={handleAcknowledge}
              onResolve={handleResolve}
              actionLoading={actionLoading}
            />
          ))}
        </div>
      )}
    </section>
  )
}

export default ActiveAlerts
