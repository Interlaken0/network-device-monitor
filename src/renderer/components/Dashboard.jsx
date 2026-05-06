import React, { useState, useCallback } from 'react'
import PropTypes from 'prop-types'
import { shallow } from 'zustand/shallow'
import DeviceStatusCard from './DeviceStatusCard'
import LatencyChart from './LatencyChart'
import { useDeviceStore, selectDevices, selectIsMonitoring } from '../stores/deviceStore'
import { calculateStatusFromLatency } from '../utils/status'

/**
 * Dashboard displays a grid of device status cards.
 * Uses CSS Grid for responsive layout.
 *
 * @component
 */

/**
 * Dashboard component displaying device status cards in a grid.
 */
/**
 * Individual device card wrapper that subscribes to its own status.
 * Isolates re-renders to individual cards rather than entire dashboard.
 */
function DeviceCardWrapper({ device, isMonitoring, isSelected, onSelect }) {
  // Subscribe only to this device's ping result using stable selector with shallow comparison
  // This prevents re-renders when other devices' ping results update
  const pingResult = useDeviceStore(
    (state) => state.pingResults[device.id],
    shallow
  )

  // Calculate status from ping result
  const isOnline = pingResult?.success || false
  const latencyMs = pingResult?.latencyMs || null
  const status = isMonitoring ? calculateStatusFromLatency(latencyMs, isOnline) : 'unknown'

  const handleClick = useCallback(() => {
    if (isMonitoring && onSelect) {
      onSelect(device.id)
    }
  }, [device.id, isMonitoring, onSelect])

  const handleKeyDown = useCallback((e) => {
    if (isMonitoring && onSelect && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault()
      onSelect(device.id)
    }
  }, [device.id, isMonitoring, onSelect])

  return (
    <div
      role="listitem"
      className={`device-card-wrapper ${isSelected ? 'selected' : ''} ${isMonitoring ? 'clickable' : ''}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-pressed={isSelected}
      tabIndex={isMonitoring ? 0 : -1}
      aria-describedby={isMonitoring ? 'card-hint-instructions' : undefined}
    >
      <DeviceStatusCard
        device={device}
        latency={latencyMs}
        status={status}
        isOnline={isOnline}
        isMonitoring={isMonitoring}
      />
      {isMonitoring && (
        <div className="card-hint">
          {isSelected ? 'Click to close chart' : 'Click to view chart'}
        </div>
      )}
    </div>
  )
}

/**
 * Dashboard component displaying device status cards in a grid.
 * Features click-to-expand charts for monitored devices.
 */
function Dashboard() {
  const [selectedDeviceId, setSelectedDeviceId] = useState(null)
  const devices = useDeviceStore(selectDevices)
  const isMonitoring = useDeviceStore(selectIsMonitoring)

  const handleDeviceSelect = useCallback((deviceId) => {
    setSelectedDeviceId((current) => (current === deviceId ? null : deviceId))
  }, [])

  const handleCloseChart = useCallback(() => {
    setSelectedDeviceId(null)
  }, [])

  const monitoredCount = devices.filter((d) => isMonitoring[d.id]).length

  if (devices.length === 0) {
    return (
      <section className="dashboard empty" aria-label="Device Dashboard">
        <div className="empty-state">
          <div className="empty-icon" aria-hidden="true">📡</div>
          <p>No devices configured.</p>
          <p className="empty-hint">Add a device to start monitoring.</p>
        </div>
      </section>
    )
  }

  const selectedDevice = devices.find((d) => d.id === selectedDeviceId)

  return (
    <section className="dashboard" aria-label="Device Dashboard">
      {/* Screen reader instructions for keyboard navigation */}
      <div id="card-hint-instructions" className="sr-only">
        Press Enter or Space to toggle the latency chart for this device.
      </div>

      <header className="dashboard-header">
        <h2>Device Status Overview</h2>
        <div className="device-stats">
          <span className="stat-item">
            {devices.length} device{devices.length !== 1 ? 's' : ''}
          </span>
          {monitoredCount > 0 && (
            <span className="stat-item monitoring">
              {monitoredCount} monitoring
            </span>
          )}
        </div>
      </header>

      <div
        className="device-grid"
        role="list"
        aria-label="Device status cards. Click a monitored device to view its latency chart."
      >
        {devices.map((device) => (
          <DeviceCardWrapper
            key={device.id}
            device={device}
            isMonitoring={isMonitoring[device.id] || false}
            isSelected={selectedDeviceId === device.id}
            onSelect={handleDeviceSelect}
          />
        ))}
      </div>

      {/* Single Latency Chart for selected device */}
      {selectedDevice && isMonitoring[selectedDevice.id] && (
        <div className="chart-container">
          <div className="chart-header-bar">
            <h3>Latency History</h3>
            <button
              type="button"
              className="close-chart-btn"
              onClick={handleCloseChart}
              aria-label="Close chart"
            >
              Close Chart
            </button>
          </div>
          <LatencyChart
            deviceId={selectedDevice.id}
            deviceName={selectedDevice.name}
          />
        </div>
      )}

      {/* Hint when no device selected but some are monitored */}
      {!selectedDevice && monitoredCount > 0 && (
        <div className="chart-hint">
          <p>Click a monitored device card to view its latency chart.</p>
        </div>
      )}
    </section>
  )
}

DeviceCardWrapper.propTypes = {
  device: PropTypes.shape({
    id: PropTypes.number.isRequired
  }).isRequired,
  isMonitoring: PropTypes.bool.isRequired,
  isSelected: PropTypes.bool.isRequired,
  onSelect: PropTypes.func.isRequired
}

export default Dashboard
