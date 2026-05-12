import React from 'react'
import PropTypes from 'prop-types'

/**
 * DeviceStatusCard displays a single device's current status.
 * Shows device info, latency, colour-coded status indicator, and outage information.
 *
 * @component
 * @param {Object} props
 * @param {Object} props.device - Device object with id, name, ip_address, device_type, location
 * @param {number|null} props.latency - Current latency in milliseconds
 * @param {string} props.status - Status category: 'excellent', 'good', 'fair', 'poor', 'unknown', 'offline'
 * @param {boolean} props.isOnline - Whether device is responding to pings
 * @param {boolean} props.isMonitoring - Whether monitoring is active
 * @param {Object|null} props.activeOutage - Current active outage information
 * @param {number} props.activeOutage.id - Outage ID
 * @param {string} props.activeOutage.severity - Outage severity: 'critical', 'warning', 'info'
 * @param {string} props.activeOutage.startTime - Outage start timestamp
 */

/**
 * Maps status category to display configuration.
 *
 * @param {string} status - Status category
 * @param {boolean} isOnline - Online state
 * @param {boolean} isMonitoring - Monitoring state
 * @returns {Object} Display configuration with colour, label, and icon
 */
const getStatusConfig = (status, isOnline, isMonitoring) => {
  if (!isMonitoring) {
    return {
      colourClass: 'status-inactive',
      badgeClass: 'latency-unknown',
      label: 'Not Monitoring',
      showLatency: false
    }
  }

  if (!isOnline) {
    return {
      colourClass: 'status-offline',
      badgeClass: 'latency-poor',
      label: 'Offline',
      showLatency: false
    }
  }

  const configs = {
    excellent: {
      colourClass: 'status-online',
      badgeClass: 'latency-excellent',
      label: 'Excellent',
      showLatency: true
    },
    good: {
      colourClass: 'status-good',
      badgeClass: 'latency-good',
      label: 'Good',
      showLatency: true
    },
    fair: {
      colourClass: 'status-warning',
      badgeClass: 'latency-fair',
      label: 'Fair',
      showLatency: true
    },
    poor: {
      colourClass: 'status-offline',
      badgeClass: 'latency-poor',
      label: 'Poor',
      showLatency: true
    },
    unknown: {
      colourClass: 'status-unknown',
      badgeClass: 'latency-unknown',
      label: 'Unknown',
      showLatency: false
    }
  }

  return configs[status] || configs.unknown
}

/**
 * Formats device type for display.
 *
 * @param {string} deviceType - Raw device type
 * @returns {string} Formatted device type label
 */
const formatDeviceType = (deviceType) => {
  if (!deviceType) return 'Device'

  const types = {
    server: 'Server',
    router: 'Router',
    printer: 'Printer',
    switch: 'Switch'
  }

  return types[deviceType.toLowerCase()] || deviceType
}

/**
 * Gets device network address from device object.
 *
 * @param {Object} device - Device object
 * @returns {string} Network address or 'Unknown'
 */
const getDeviceIp = (device) => {
  return device.ipAddress || 'Unknown'
}

/**
 * Calculates outage duration from start time to now.
 *
 * @param {string} startTime - ISO timestamp of outage start
 * @returns {string} Formatted duration string
 */
const getOutageDuration = (startTime) => {
  if (!startTime) return 'Unknown'
  
  const start = new Date(startTime)
  const now = new Date()
  const durationMs = now - start
  
  const seconds = Math.floor(durationMs / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`
  } else {
    return `${seconds}s`
  }
}

/**
 * Gets outage severity configuration.
 *
 * @param {string} severity - Outage severity level
 * @returns {Object} Severity configuration
 */
const getOutageConfig = (severity) => {
  const configs = {
    critical: {
      class: 'outage-critical',
      label: 'Critical',
      colour: '#dc3545'
    },
    warning: {
      class: 'outage-warning', 
      label: 'Warning',
      colour: '#ffc107'
    },
    info: {
      class: 'outage-info',
      label: 'Info',
      colour: '#17a2b8'
    }
  }
  
  return configs[severity] || configs.info
}

/**
 * DeviceStatusCard component.
 */
function DeviceStatusCard({ device, latency, status, isOnline, isMonitoring, activeOutage }) {
  const statusConfig = getStatusConfig(status, isOnline, isMonitoring)
  const deviceType = formatDeviceType(device.deviceType)
  const outageConfig = activeOutage ? getOutageConfig(activeOutage.severity) : null
  const outageDuration = activeOutage ? getOutageDuration(activeOutage.startTime) : null

  // Generate status description for screen readers
  const statusDescription = isMonitoring
    ? `${device.name}: ${statusConfig.label}${latency ? `, latency ${latency} milliseconds` : ''}${activeOutage ? `, active outage: ${outageConfig.label} for ${outageDuration}` : ''}`
    : `${device.name}: Not monitoring`

  return (
    <article
      className={`device-status-card ${statusConfig.colourClass} ${isMonitoring ? 'monitoring' : 'inactive'}`}
      data-device-id={device.id}
      role="region"
      aria-label={`${deviceType} ${device.name}`}
      tabIndex={0}
    >
      {/* Screen reader only status announcement */}
      <div className="sr-only" role="status" aria-live="polite">
        {statusDescription}
      </div>

      <header className="card-header">
        <div className="device-icon" aria-hidden="true">
          {deviceType.charAt(0)}
        </div>
        <div className="device-meta">
          <h3 className="device-name" id={`device-name-${device.id}`}>
            {device.name}
          </h3>
          <span className="device-type" aria-label={`Device type: ${deviceType}`}>
            {deviceType}
          </span>
        </div>
        <div
          className={`status-dot ${isOnline ? 'online' : isMonitoring ? 'offline' : 'inactive'}`}
          aria-label={`Status: ${statusConfig.label}`}
          role="img"
        />
      </header>

      <div className="card-body">
        <div className="ip-address" aria-label={`Network Address: ${getDeviceIp(device)}`}>
          {getDeviceIp(device)}
        </div>

        {device.location && (
          <div className="device-location" aria-label={`Location: ${device.location}`}>
            {device.location}
          </div>
        )}

        <div
          className={`latency-display ${statusConfig.badgeClass}`}
          role="status"
          aria-label={statusConfig.showLatency ? `Latency: ${latency}ms, ${statusConfig.label}` : statusConfig.label}
        >
          {statusConfig.showLatency && latency !== null ? (
            <>
              <span className="latency-value" aria-hidden="true">{latency}ms</span>
              <span className="status-label" aria-hidden="true">{statusConfig.label}</span>
            </>
          ) : (
            <span className="status-label" aria-hidden="true">{statusConfig.label}</span>
          )}
        </div>

        {/* Outage Indicator */}
        {activeOutage && (
          <div 
            className={`outage-indicator ${outageConfig.class}`}
            role="alert"
            aria-live="polite"
            aria-label={`Active outage: ${outageConfig.label}, duration: ${outageDuration}`}
          >
            <div className="outage-header">
              <span className="outage-badge" style={{ backgroundColor: outageConfig.colour }}>
                {outageConfig.label}
              </span>
              <span className="outage-duration">
                {outageDuration}
              </span>
            </div>
            <div className="outage-details">
              <span className="outage-start">
                Started: {new Date(activeOutage.startTime).toLocaleTimeString('en-GB', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </span>
            </div>
          </div>
        )}
      </div>
    </article>
  )
}

DeviceStatusCard.propTypes = {
  device: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    ipAddress: PropTypes.string,
    deviceType: PropTypes.string,
    location: PropTypes.string
  }).isRequired,
  latency: PropTypes.number,
  status: PropTypes.oneOf(['excellent', 'good', 'fair', 'poor', 'unknown', 'offline']).isRequired,
  isOnline: PropTypes.bool.isRequired,
  isMonitoring: PropTypes.bool.isRequired,
  activeOutage: PropTypes.shape({
    id: PropTypes.number.isRequired,
    severity: PropTypes.oneOf(['critical', 'warning', 'info']).isRequired,
    startTime: PropTypes.string.isRequired
  })
}

export default DeviceStatusCard
