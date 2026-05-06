import React, { useState, useMemo } from 'react'
import PropTypes from 'prop-types'
import { shallow } from 'zustand/shallow'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import { useDeviceStore } from '../stores/deviceStore'
import { useThemeStore } from '../stores/themeStore'

/**
 * Time range options for chart filtering.
 * @constant {Object}
 */
const TIME_RANGES = {
  '5min': { label: '5 Minutes', ms: 5 * 60 * 1000 },
  '1hr': { label: '1 Hour', ms: 60 * 60 * 1000 },
  '24hr': { label: '24 Hours', ms: 24 * 60 * 60 * 1000 }
}

/**
 * Formats timestamp for chart display based on time range.
 *
 * @param {number} timestamp - Unix timestamp in milliseconds
 * @param {string} timeRange - Selected time range key
 * @returns {string} Formatted time string
 */
const formatChartTime = (timestamp, timeRange) => {
  const date = new Date(timestamp)
  if (timeRange === '24hr') {
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  }
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

/**
 * Determines line colour based on average latency and theme.
 * Colours match the warning badge colours exactly.
 *
 * @param {Array} data - Chart data points
 * @param {string} theme - Current theme ('light' or 'dark')
 * @returns {string} Colour hex code
 */
const getLineColour = (data, theme) => {
  if (data.length === 0) return '#6c757d'
  const avg = data.reduce((sum, d) => sum + d.latency, 0) / data.length
  if (theme === 'dark') {
    if (avg < 10) return '#5dd879'
    if (avg < 50) return '#ffd54f'
    if (avg < 150) return '#fd7e14'
    return '#ff6b6b'
  }
  if (avg < 10) return '#28a745'
  if (avg < 50) return '#ffc107'
  if (avg < 150) return '#fd7e14'
  return '#dc3545'
}

/**
 * Custom tooltip component for chart hover state.
 *
 * @param {Object} props - Recharts tooltip props
 * @param {boolean} props.active - Whether tooltip is active
 * @param {Array} props.payload - Data points
 * @param {string} props.label - X-axis label
 * @returns {JSX.Element|null} Tooltip content
 */
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const latency = payload[0].value
    let statusClass = 'latency-excellent'
    if (latency >= 10 && latency < 50) statusClass = 'latency-good'
    if (latency >= 50 && latency < 150) statusClass = 'latency-fair'
    if (latency >= 150) statusClass = 'latency-poor'

    return (
      <div className="chart-tooltip">
        <p className="tooltip-time">{label}</p>
        <p className={`tooltip-latency ${statusClass}`}>
          {latency}ms
        </p>
      </div>
    )
  }
  return null
}

CustomTooltip.propTypes = {
  active: PropTypes.bool,
  payload: PropTypes.array,
  label: PropTypes.string
}

/**
 * LatencyChart displays historical latency data for a device.
 * Features time-range selection and responsive line chart.
 *
 * @component
 * @param {Object} props
 * @param {number} props.deviceId - Device identifier
 * @param {string} props.deviceName - Device name for header
 */
function LatencyChart({ deviceId, deviceName }) {
  const [timeRange, setTimeRange] = useState('5min')

  // Get current theme for colour matching
  const theme = useThemeStore((state) => state.theme)

  // Subscribe only to this device's raw ping history (stable selector)
  const rawHistory = useDeviceStore(
    (state) => state.pingHistory[deviceId] || [],
    shallow
  )

  // Filter and format data based on time range
  const chartData = useMemo(() => {
    const now = Date.now()
    const cutoff = now - (TIME_RANGES[timeRange]?.ms || TIME_RANGES['5min'].ms)
    const filtered = rawHistory.filter((entry) => new Date(entry.timestamp).getTime() > cutoff)

    return filtered.map((entry) => ({
      time: formatChartTime(entry.timestamp, timeRange),
      latency: entry.latencyMs || 0,
      timestamp: entry.timestamp
    }))
  }, [rawHistory, timeRange])

  const lineColour = getLineColour(chartData, theme)
  const hasData = chartData.length > 0

  return (
    <article className="latency-chart-container" aria-label={`Latency chart for ${deviceName}`}>
      <header className="chart-header">
        <h3 className="chart-title">Latency History: {deviceName}</h3>
        <div className="time-range-selector" role="group" aria-label="Time range selection">
          {Object.entries(TIME_RANGES).map(([key, { label }]) => (
            <button
              key={key}
              type="button"
              className={`time-range-btn ${timeRange === key ? 'active' : ''}`}
              onClick={() => setTimeRange(key)}
              aria-pressed={timeRange === key}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      <div className="chart-body">
        {hasData ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 30, left: 0, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
              <XAxis
                dataKey="time"
                stroke="#6c757d"
                fontSize={12}
                tickLine={false}
                interval="preserveStartEnd"
                minTickGap={30}
              />
              <YAxis
                stroke="#6c757d"
                fontSize={12}
                tickLine={false}
                label={{ value: 'Latency (ms)', angle: -90, position: 'insideLeft', fill: '#6c757d' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="latency"
                stroke={lineColour}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6, strokeWidth: 0 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="chart-empty-state">
            <p>No latency data available.</p>
            <p className="empty-hint">Start monitoring to collect data.</p>
          </div>
        )}
      </div>

      {hasData && (
        <footer className="chart-footer">
          <span className="data-points">{chartData.length} data points</span>
          <span className="avg-latency">
            Avg: {Math.round(chartData.reduce((s, d) => s + d.latency, 0) / chartData.length)}ms
          </span>
        </footer>
      )}
    </article>
  )
}

LatencyChart.propTypes = {
  deviceId: PropTypes.number.isRequired,
  deviceName: PropTypes.string.isRequired
}

export default LatencyChart
