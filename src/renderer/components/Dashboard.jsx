import React from 'react'
import PropTypes from 'prop-types'
import DeviceStatusCard from './DeviceStatusCard'
import { useDeviceStore, selectDevices, selectDeviceStatus } from '../stores/deviceStore'

/**
 * Dashboard displays a grid of device status cards.
 * Uses CSS Grid for responsive layout.
 *
 * @component
 */

/**
 * Calculates status category based on latency thresholds.
 * Green < 50ms, Amber 50-200ms, Red > 200ms.
 *
 * @param {number|null} latencyMs - Latency in milliseconds
 * @param {boolean} isOnline - Whether device is responding
 * @returns {string} Status category: 'excellent', 'good', 'fair', 'poor', 'unknown'
 */
const calculateStatusFromLatency = (latencyMs, isOnline) => {
  if (!isOnline) return 'offline'
  if (!latencyMs) return 'unknown'
  if (latencyMs < 50) return 'excellent'
  if (latencyMs < 100) return 'good'
  if (latencyMs < 200) return 'fair'
  return 'poor'
}

/**
 * Dashboard component displaying device status cards in a grid.
 */
/**
 * Individual device card wrapper that subscribes to its own status.
 * Isolates re-renders to individual cards rather than entire dashboard.
 */
function DeviceCardWrapper({ device, isMonitoring }) {
  const deviceStatus = useDeviceStore(selectDeviceStatus(device.id))

  const status = calculateStatusFromLatency(
    deviceStatus.latencyMs,
    deviceStatus.isOnline
  )

  return (
    <div role="listitem">
      <DeviceStatusCard
        device={device}
        latency={deviceStatus.latencyMs}
        status={status}
        isOnline={deviceStatus.isOnline}
        isMonitoring={isMonitoring}
      />
    </div>
  )
}

/**
 * Dashboard component displaying device status cards in a grid.
 */
function Dashboard() {
  const devices = useDeviceStore(selectDevices)
  const isMonitoring = useDeviceStore((state) => state.isMonitoring)

  if (devices.length === 0) {
    return (
      <section className="dashboard empty" aria-label="Device Dashboard">
        <div className="empty-state">
          <p>No devices configured.</p>
          <p className="empty-hint">Add a device to start monitoring.</p>
        </div>
      </section>
    )
  }

  return (
    <section className="dashboard" aria-label="Device Dashboard">
      <header className="dashboard-header">
        <h2>Device Status Overview</h2>
        <div className="device-count">
          {devices.length} device{devices.length !== 1 ? 's' : ''}
        </div>
      </header>

      <div
        className="device-grid"
        role="list"
        aria-label="Device status cards"
      >
        {devices.map((device) => (
          <DeviceCardWrapper
            key={device.id}
            device={device}
            isMonitoring={isMonitoring[device.id] || false}
          />
        ))}
      </div>
    </section>
  )
}

DeviceCardWrapper.propTypes = {
  device: PropTypes.shape({
    id: PropTypes.number.isRequired
  }).isRequired,
  isMonitoring: PropTypes.bool.isRequired
}

export default Dashboard
