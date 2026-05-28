import React from 'react'
import PropTypes from 'prop-types'

/**
 * Severity colour mapping for outage badges.
 * @constant {Object}
 */
const SEVERITY_COLOURS = {
  critical: '#dc3545',
  warning: '#ffc107',
  info: '#17a2b8'
}

/**
 * Renders a single summary statistic card with an icon, value, and label.
 *
 * @param {Object} props
 * @param {string} props.label - Card label
 * @param {string|number} props.value - Display value
 * @param {string} [props.colour] - Optional accent colour
 * @param {string} [props.icon] - Optional icon character
 * @returns {JSX.Element}
 */
function StatCard({ label, value, colour, icon }) {
  return (
    <div className="summary-card" style={colour ? { borderLeftColor: colour } : undefined}>
      {icon && <span className="summary-icon">{icon}</span>}
      <div className="summary-value">{value}</div>
      <div className="summary-label">{label}</div>
    </div>
  )
}

StatCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  colour: PropTypes.string,
  icon: PropTypes.string
}

/**
 * SummaryCards renders a grid of analytics cards from historical device data.
 * Calculates overall uptime, average latency, total outages, and identifies
 * the most and least reliable devices in the current filtered dataset.
 *
 * @param {Object} props
 * @param {Array} props.data - Array of device historical summaries
 * @returns {JSX.Element}
 */
function SummaryCards({ data = [] }) {
  if (!data || data.length === 0) {
    return (
      <div className="summary-cards-empty">
        <p>No historical data available for the selected range.</p>
      </div>
    )
  }

  // Overall uptime across all devices
  const totalPings = data.reduce((sum, d) => sum + (d.uptime?.totalPings || 0), 0)
  const successfulPings = data.reduce((sum, d) => sum + (d.uptime?.successfulPings || 0), 0)
  const overallUptime = totalPings > 0
    ? Math.round((successfulPings / totalPings) * 100)
    : 0

  // Average latency across devices with data
  const latencyValues = data
    .map((d) => d.averageLatencyMs)
    .filter((v) => v !== null && v !== undefined)
  const avgLatency = latencyValues.length > 0
    ? Math.round(latencyValues.reduce((a, b) => a + b, 0) / latencyValues.length)
    : null

  // Total outages
  const totalOutages = data.reduce((sum, d) => sum + (d.outages?.outageCount || 0), 0)
  const totalDowntime = data.reduce((sum, d) => sum + (d.outages?.totalDowntimeSeconds || 0), 0)

  // Most/least reliable by uptime percentage
  const devicesWithUptime = data
    .map((d) => ({ name: d.name, uptime: d.uptime?.uptimePercent || 0 }))
    .filter((d) => d.uptime !== null)

  const mostReliable = devicesWithUptime.length > 0
    ? devicesWithUptime.reduce((best, current) => (current.uptime > best.uptime ? current : best))
    : null

  const leastReliable = devicesWithUptime.length > 0
    ? devicesWithUptime.reduce((worst, current) => (current.uptime < worst.uptime ? current : worst))
    : null

  // Severity breakdown
  const criticalCount = data.reduce((sum, d) => sum + (d.outages?.criticalOutages || 0), 0)
  const warningCount = data.reduce((sum, d) => sum + (d.outages?.warningOutages || 0), 0)
  const infoCount = data.reduce((sum, d) => sum + (d.outages?.infoOutages || 0), 0)

  return (
    <div className="summary-cards-grid">
      <StatCard
        label="Overall Uptime"
        value={`${overallUptime}%`}
        colour={overallUptime >= 99 ? '#28a745' : overallUptime >= 95 ? '#ffc107' : '#dc3545'}
        icon="&#9851;"
      />
      <StatCard
        label="Avg Latency"
        value={avgLatency !== null ? `${avgLatency}ms` : 'N/A'}
        colour="#007bff"
        icon="&#9203;"
      />
      <StatCard
        label="Total Outages"
        value={totalOutages}
        colour={totalOutages === 0 ? '#28a745' : '#dc3545'}
        icon="&#9888;"
      />
      <StatCard
        label="Total Downtime"
        value={formatDuration(totalDowntime)}
        colour="#6c757d"
        icon="&#9200;"
      />
      {mostReliable && (
        <StatCard
          label="Most Reliable"
          value={`${mostReliable.name} (${mostReliable.uptime}%)`}
          colour="#28a745"
          icon="&#9733;"
        />
      )}
      {leastReliable && leastReliable.uptime < 100 && (
        <StatCard
          label="Least Reliable"
          value={`${leastReliable.name} (${leastReliable.uptime}%)`}
          colour="#dc3545"
          icon="&#9888;"
        />
      )}
      {criticalCount > 0 && (
        <StatCard
          label="Critical Outages"
          value={criticalCount}
          colour={SEVERITY_COLOURS.critical}
          icon="&#128308;"
        />
      )}
      {warningCount > 0 && (
        <StatCard
          label="Warning Outages"
          value={warningCount}
          colour={SEVERITY_COLOURS.warning}
          icon="&#9888;"
        />
      )}
      {infoCount > 0 && (
        <StatCard
          label="Info Outages"
          value={infoCount}
          colour={SEVERITY_COLOURS.info}
          icon="&#128712;"
        />
      )}
    </div>
  )
}

/**
 * Formats duration in seconds to a human-readable string.
 *
 * @param {number} seconds - Duration in seconds
 * @returns {string}
 */
function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return '0s'
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  if (minutes > 0) {
    return `${minutes}m ${secs}s`
  }
  return `${secs}s`
}

SummaryCards.propTypes = {
  data: PropTypes.array
}

export default SummaryCards
