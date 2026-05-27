import React, { useState, useMemo } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts'
import { useDeviceStore } from '../stores/deviceStore'
import { useThemeStore } from '../stores/themeStore'
import { getChartColours } from '../utils/chart-theme'

/**
 * Severity colour mapping for outage charts.
 * @constant {Object}
 */
const SEVERITY_COLOURS = {
  critical: '#dc3545',
  warning: '#ffc107',
  info: '#17a2b8',
  total: '#6c757d'
}

/**
 * Formats duration in seconds to human-readable string.
 *
 * @param {number} seconds - Duration in seconds
 * @returns {string}
 */
function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return 'Ongoing'
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m ${seconds % 60}s`
}

/**
 * Determines outage severity category by duration.
 *
 * @param {number} durationSeconds - Outage duration
 * @returns {string} 'critical' | 'warning' | 'info'
 */
function categoriseDuration(durationSeconds) {
  if (durationSeconds === null || durationSeconds === undefined) return 'critical'
  if (durationSeconds >= 3600) return 'critical'
  if (durationSeconds >= 300) return 'warning'
  return 'info'
}

/**
 * OutageAnalysis is a dedicated dashboard for comprehensive outage reporting.
 * Displays severity breakdowns, duration statistics, and device-specific availability.
 *
 * @returns {JSX.Element}
 */
function OutageAnalysis() {
  const theme = useThemeStore((state) => state.theme)
  const chartColours = getChartColours(theme)

  const outageHistory = useDeviceStore((state) => state.outageHistory)
  const devices = useDeviceStore((state) => state.devices)
  const [selectedDevice, setSelectedDevice] = useState('all')
  const [selectedOutage, setSelectedOutage] = useState(null)

  // Filter outages by selected device
  const filteredOutages = useMemo(() => {
    if (selectedDevice === 'all') return outageHistory
    return outageHistory.filter((o) => o.deviceId === parseInt(selectedDevice))
  }, [outageHistory, selectedDevice])

  // Severity breakdown for pie chart
  const severityData = useMemo(() => {
    const counts = { critical: 0, warning: 0, info: 0 }
    filteredOutages.forEach((outage) => {
      const duration = outage.durationSeconds ||
        (outage.endTime
          ? (new Date(outage.endTime) - new Date(outage.startTime)) / 1000
          : null)
      const severity = outage.severity || categoriseDuration(duration)
      counts[severity] = (counts[severity] || 0) + 1
    })
    return Object.entries(counts)
      .filter(([, count]) => count > 0)
      .map(([name, value]) => ({ name, value }))
  }, [filteredOutages])

  // Duration statistics
  const durationStats = useMemo(() => {
    const durations = filteredOutages
      .map((o) => {
        if (o.durationSeconds !== null && o.durationSeconds !== undefined) return o.durationSeconds
        if (o.endTime && o.startTime) {
          return (new Date(o.endTime) - new Date(o.startTime)) / 1000
        }
        return null
      })
      .filter((d) => d !== null)

    if (durations.length === 0) {
      return { avg: 0, max: 0, min: 0, total: 0 }
    }

    const total = durations.reduce((a, b) => a + b, 0)
    return {
      avg: Math.round(total / durations.length),
      max: Math.max(...durations),
      min: Math.min(...durations),
      total
    }
  }, [filteredOutages])

  // Device-specific outage counts for bar chart
  const deviceOutageData = useMemo(() => {
    const counts = {}
    devices.forEach((d) => { counts[d.id] = { name: d.name, critical: 0, warning: 0, info: 0 } })

    outageHistory.forEach((outage) => {
      const duration = outage.durationSeconds ||
        (outage.endTime
          ? (new Date(outage.endTime) - new Date(outage.startTime)) / 1000
          : null)
      const severity = outage.severity || categoriseDuration(duration)
      if (counts[outage.deviceId]) {
        counts[outage.deviceId][severity] = (counts[outage.deviceId][severity] || 0) + 1
      }
    })

    return Object.values(counts)
      .filter((d) => d.critical > 0 || d.warning > 0 || d.info > 0)
      .sort((a, b) => (b.critical + b.warning) - (a.critical + a.warning))
  }, [outageHistory, devices])

  // Availability per device
  const availabilityData = useMemo(() => {
    return devices.map((device) => {
      const deviceOutages = outageHistory.filter((o) => o.deviceId === device.id)
      const totalDowntime = deviceOutages.reduce((sum, o) => {
        if (o.durationSeconds) return sum + o.durationSeconds
        if (o.endTime && o.startTime) {
          return sum + (new Date(o.endTime) - new Date(o.startTime)) / 1000
        }
        return sum
      }, 0)

      // Assume 30-day window (2592000 seconds) for availability calculation
      const windowSeconds = 30 * 24 * 60 * 60
      const uptimePercent = Math.max(0, Math.round(((windowSeconds - totalDowntime) / windowSeconds) * 100))

      return {
        name: device.name,
        uptimePercent,
        outageCount: deviceOutages.length,
        totalDowntime
      }
    }).sort((a, b) => a.uptimePercent - b.uptimePercent)
  }, [devices, outageHistory])

  return (
    <section className="outage-analysis">
      <h2>Outage Analysis</h2>

      <div className="outage-controls card">
        <label className="query-label">Filter by Device</label>
        <select
          className="aggregation-select"
          value={selectedDevice}
          onChange={(e) => setSelectedDevice(e.target.value)}
        >
          <option value="all">All Devices</option>
          {devices.map((device) => (
            <option key={device.id} value={device.id}>
              {device.name}
            </option>
          ))}
        </select>
      </div>

      {filteredOutages.length === 0 ? (
        <div className="empty-state card">
          <p>No outage data available for the selected filter.</p>
        </div>
      ) : (
        <>
          {/* Summary stats */}
          <div className="summary-cards-grid">
            <div className="summary-card" style={{ borderLeftColor: SEVERITY_COLOURS.critical }}>
              <div className="summary-value">{filteredOutages.length}</div>
              <div className="summary-label">Total Outages</div>
            </div>
            <div className="summary-card" style={{ borderLeftColor: '#28a745' }}>
              <div className="summary-value">{formatDuration(durationStats.avg)}</div>
              <div className="summary-label">Avg Duration</div>
            </div>
            <div className="summary-card" style={{ borderLeftColor: '#fd7e14' }}>
              <div className="summary-value">{formatDuration(durationStats.max)}</div>
              <div className="summary-label">Max Duration</div>
            </div>
            <div className="summary-card" style={{ borderLeftColor: SEVERITY_COLOURS.total }}>
              <div className="summary-value">{formatDuration(durationStats.total)}</div>
              <div className="summary-label">Total Downtime</div>
            </div>
          </div>

          {/* Charts row */}
          <div className="chart-grid">
            {severityData.length > 0 && (
              <div className="chart-card card">
                <h3>Severity Breakdown</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={severityData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {severityData.map((entry) => (
                        <Cell key={entry.name} fill={SEVERITY_COLOURS[entry.name]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {deviceOutageData.length > 0 && (
              <div className="chart-card card">
                <h3>Outages by Device</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={deviceOutageData} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartColours.grid} />
                    <XAxis dataKey="name" stroke={chartColours.axis} fontSize={12} tickLine={false} />
                    <YAxis stroke={chartColours.axis} fontSize={12} tickLine={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="critical" stackId="a" fill={SEVERITY_COLOURS.critical} />
                    <Bar dataKey="warning" stackId="a" fill={SEVERITY_COLOURS.warning} />
                    <Bar dataKey="info" stackId="a" fill={SEVERITY_COLOURS.info} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Availability table */}
          {availabilityData.length > 0 && (
            <div className="historical-table-card card">
              <h3>Device Availability (30-Day Window)</h3>
              <table className="historical-table">
                <thead>
                  <tr>
                    <th>Device</th>
                    <th>Uptime %</th>
                    <th>Outages</th>
                    <th>Total Downtime</th>
                  </tr>
                </thead>
                <tbody>
                  {availabilityData.map((device) => (
                    <tr
                      key={device.name}
                      className="outage-row-clickable"
                      onClick={() => {
                        const deviceOutages = outageHistory.filter(
                          (o) => o.deviceId === devices.find((d) => d.name === device.name)?.id
                        )
                        if (deviceOutages.length > 0) {
                          setSelectedOutage({
                            deviceName: device.name,
                            outages: deviceOutages
                          })
                        }
                      }}
                    >
                      <td>{device.name}</td>
                      <td>
                        <span
                          className="availability-badge"
                          style={{
                            backgroundColor: device.uptimePercent >= 99 ? '#28a74520' :
                              device.uptimePercent >= 95 ? '#ffc10720' : '#dc354520',
                            color: device.uptimePercent >= 99 ? '#28a745' :
                              device.uptimePercent >= 95 ? '#856404' : '#dc3545',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            fontWeight: 600
                          }}
                        >
                          {device.uptimePercent}%
                        </span>
                      </td>
                      <td>{device.outageCount}</td>
                      <td>{formatDuration(device.totalDowntime)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Drill-down modal for outage details */}
      {selectedOutage && (
        <div className="modal-overlay" onClick={() => setSelectedOutage(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Outage Details: {selectedOutage.deviceName}</h3>
              <button
                type="button"
                className="modal-close"
                onClick={() => setSelectedOutage(null)}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <table className="historical-table">
                <thead>
                  <tr>
                    <th>Start Time</th>
                    <th>End Time</th>
                    <th>Duration</th>
                    <th>Severity</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOutage.outages.map((outage, index) => {
                    const duration = outage.durationSeconds ||
                      (outage.endTime && outage.startTime
                        ? (new Date(outage.endTime) - new Date(outage.startTime)) / 1000
                        : null)
                    const severity = outage.severity || categoriseDuration(duration)
                    return (
                      <tr key={index}>
                        <td>{outage.startTime ? new Date(outage.startTime).toLocaleString() : 'Unknown'}</td>
                        <td>{outage.endTime ? new Date(outage.endTime).toLocaleString() : 'Ongoing'}</td>
                        <td>{formatDuration(duration)}</td>
                        <td>
                          <span
                            style={{
                              backgroundColor: `${SEVERITY_COLOURS[severity]}20`,
                              color: SEVERITY_COLOURS[severity],
                              padding: '0.2rem 0.5rem',
                              borderRadius: '4px',
                              fontWeight: 600,
                              textTransform: 'capitalize'
                            }}
                          >
                            {severity}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default OutageAnalysis
