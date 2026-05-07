import React, { useState, useMemo } from 'react'
import PropTypes from 'prop-types'
import { shallow } from 'zustand/shallow'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts'
import { useDeviceStore } from '../stores/deviceStore'
import { useThemeStore } from '../stores/themeStore'

/**
 * Time range options for outage timeline filtering.
 * @constant {Object}
 */
const TIME_RANGES = {
  '24hr': { label: '24 Hours', ms: 24 * 60 * 60 * 1000 },
  '7days': { label: '7 Days', ms: 7 * 24 * 60 * 60 * 1000 },
  '30days': { label: '30 Days', ms: 30 * 24 * 60 * 60 * 1000 }
}

/**
 * Severity colour mapping for timeline bars.
 * @constant {Object}
 */
const SEVERITY_COLOURS = {
  critical: '#dc3545',
  warning: '#ffc107',
  info: '#17a2b8'
}

/**
 * Gets theme-aware chart colours for grid and axes.
 *
 * @param {string} theme - Current theme ('light' or 'dark')
 * @returns {Object} Chart colour configuration
 */
const getChartColours = (theme) => {
  if (theme === 'dark') {
    return {
      grid: '#3a3a5c',
      axis: '#8b8ba7',
      tooltip: {
        background: '#252545',
        border: '#4a4a6a',
        text: '#eaeaea'
      }
    }
  }
  return {
    grid: '#e9ecef',
    axis: '#6c757d',
    tooltip: {
      background: '#ffffff',
      border: '#e0e0e0',
      text: '#2c3e50'
    }
  }
}

/**
 * Formats timestamp for timeline display.
 *
 * @param {string} timestamp - ISO timestamp
 * @param {string} timeRange - Selected time range
 * @returns {string} Formatted time string
 */
const formatTimelineTime = (timestamp, timeRange) => {
  const date = new Date(timestamp)
  if (timeRange === '30days') {
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  } else if (timeRange === '7days') {
    return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' })
  } else {
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  }
}

/**
 * Custom tooltip component for outage timeline.
 *
 * @param {Object} props - Recharts tooltip props
 * @param {boolean} props.active - Whether tooltip is active
 * @param {Array} props.payload - Data points
 * @param {string} props.label - X-axis label
 * @returns {JSX.Element|null} Tooltip content
 */
const OutageTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    const duration = data.durationSeconds
      ? `${Math.floor(duration / 60)}m ${duration % 60}s`
      : 'Ongoing'

    return (
      <div className="outage-tooltip">
        <p className="tooltip-time">{label}</p>
        <p className="tooltip-severity" style={{ color: SEVERITY_COLOURS[data.severity] }}>
          {data.severity.toUpperCase()}
        </p>
        <p className="tooltip-duration">Duration: {duration}</p>
        {data.deviceName && (
          <p className="tooltip-device">Device: {data.deviceName}</p>
        )}
      </div>
    )
  }
  return null
}

OutageTooltip.propTypes = {
  active: PropTypes.bool,
  payload: PropTypes.array,
  label: PropTypes.string
}

/**
 * OutageTimeline displays historical outage data with interactive timeline visualisation.
 * Features time range selection, severity filtering, and device grouping.
 *
 * @component
 * @param {Object} props
 * @param {number} props.deviceId - Device identifier (optional, shows all devices if null)
 * @param {string} props.deviceName - Device name for display
 */
function OutageTimeline({ deviceId = null, deviceName = null }) {
  const [timeRange, setTimeRange] = useState('24hr')
  const [severityFilter, setSeverityFilter] = useState('all')

  // Get current theme for chart colours
  const theme = useThemeStore((state) => state.theme)
  const chartColours = getChartColours(theme)

  // Subscribe to outage data from device store
  const outageHistory = useDeviceStore(
    (state) => state.outageHistory || [],
    shallow
  )

  // Filter and format outage data for timeline
  const timelineData = useMemo(() => {
    const now = Date.now()
    const cutoff = now - (TIME_RANGES[timeRange]?.ms || TIME_RANGES['24hr'].ms)

    let filtered = outageHistory.filter((outage) => {
      const outageTime = new Date(outage.startTime).getTime()
      return outageTime > cutoff
    })

    // Filter by device if specified
    if (deviceId) {
      filtered = filtered.filter((outage) => outage.deviceId === deviceId)
    }

    // Filter by severity if not 'all'
    if (severityFilter !== 'all') {
      filtered = filtered.filter((outage) => outage.severity === severityFilter)
    }

    // Transform data for Recharts
    return filtered.map((outage) => ({
      id: outage.id,
      deviceId: outage.deviceId,
      deviceName: outage.deviceName || 'Unknown Device',
      severity: outage.severity,
      startTime: outage.startTime,
      endTime: outage.endTime,
      durationSeconds: outage.durationSeconds || Math.floor((Date.now() - new Date(outage.startTime).getTime()) / 1000),
      time: formatTimelineTime(outage.startTime, timeRange),
      timestamp: new Date(outage.startTime).getTime()
    })).sort((a, b) => a.timestamp - b.timestamp)
  }, [outageHistory, deviceId, timeRange, severityFilter])

  // Calculate statistics
  const stats = useMemo(() => {
    const total = timelineData.length
    const bySeverity = timelineData.reduce((acc, outage) => {
      acc[outage.severity] = (acc[outage.severity] || 0) + 1
      return acc
    }, {})

    const totalDuration = timelineData.reduce((sum, outage) => sum + (outage.durationSeconds || 0), 0)
    const avgDuration = total > 0 ? Math.floor(totalDuration / total) : 0

    return {
      total,
      bySeverity,
      avgDuration,
      totalDuration
    }
  }, [timelineData])

  const hasData = timelineData.length > 0

  return (
    <article 
      className="outage-timeline-container" 
      aria-label={`Outage timeline${deviceName ? ` for ${deviceName}` : ''}`}
    >
      <header className="timeline-header">
        <h3 className="timeline-title">
          Outage History{deviceName ? `: ${deviceName}` : ''}
        </h3>
        
        {/* Controls */}
        <div className="timeline-controls">
          {/* Time Range Selector */}
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

          {/* Severity Filter */}
          <div className="severity-filter" role="group" aria-label="Severity filter">
            <button
              type="button"
              className={`severity-btn ${severityFilter === 'all' ? 'active' : ''}`}
              onClick={() => setSeverityFilter('all')}
              aria-pressed={severityFilter === 'all'}
            >
              All
            </button>
            {Object.entries(SEVERITY_COLOURS).map(([severity, colour]) => (
              <button
                key={severity}
                type="button"
                className={`severity-btn ${severityFilter === severity ? 'active' : ''}`}
                onClick={() => setSeverityFilter(severity)}
                aria-pressed={severityFilter === severity}
                style={{ borderBottomColor: colour }}
              >
                {severity.charAt(0).toUpperCase() + severity.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Statistics Summary */}
      {hasData && (
        <div className="timeline-stats">
          <div className="stat-item">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Outages</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{stats.avgDuration}s</span>
            <span className="stat-label">Avg Duration</span>
          </div>
          {Object.entries(stats.bySeverity).map(([severity, count]) => (
            <div key={severity} className="stat-item">
              <span 
                className="stat-value" 
                style={{ color: SEVERITY_COLOURS[severity] }}
              >
                {count}
              </span>
              <span className="stat-label">{severity}</span>
            </div>
          ))}
        </div>
      )}

      {/* Timeline Chart */}
      <div className="timeline-body">
        {hasData ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={timelineData}
              margin={{ top: 10, right: 30, left: 0, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={chartColours.grid} />
              <XAxis
                dataKey="time"
                stroke={chartColours.axis}
                fontSize={12}
                tickLine={false}
                interval="preserveStartEnd"
                minTickGap={30}
              />
              <YAxis
                stroke={chartColours.axis}
                fontSize={12}
                tickLine={false}
                label={{
                  value: 'Duration (seconds)',
                  angle: -90,
                  position: 'insideLeft',
                  fill: chartColours.axis
                }}
              />
              <Tooltip content={<OutageTooltip />} />
              <Bar
                dataKey="durationSeconds"
                radius={[4, 4, 0, 0]}
                isAnimationActive={false}
              >
                {timelineData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={SEVERITY_COLOURS[entry.severity]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="timeline-empty-state">
            <p>No outage data available.</p>
            <p className="empty-hint">
              {deviceId ? 'This device has no recorded outages.' : 'No outages recorded in selected time range.'}
            </p>
          </div>
        )}
      </div>

      {/* Outage List */}
      {hasData && (
        <div className="outage-list">
          <h4 className="list-title">Outage Details</h4>
          <div className="outage-items">
            {timelineData.map((outage) => (
              <div 
                key={outage.id} 
                className={`outage-item outage-${outage.severity}`}
                role="article"
                aria-label={`Outage: ${outage.severity}, ${outage.time}`}
              >
                <div className="outage-item-header">
                  <span 
                    className="outage-severity-badge"
                    style={{ backgroundColor: SEVERITY_COLOURS[outage.severity] }}
                  >
                    {outage.severity.toUpperCase()}
                  </span>
                  <span className="outage-time">{outage.time}</span>
                  <span className="outage-duration">
                    {outage.durationSeconds ? `${Math.floor(outage.durationSeconds / 60)}m ${outage.durationSeconds % 60}s` : 'Ongoing'}
                  </span>
                </div>
                {!deviceId && (
                  <div className="outage-device">
                    Device: {outage.deviceName}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </article>
  )
}

OutageTimeline.propTypes = {
  deviceId: PropTypes.number,
  deviceName: PropTypes.string
}

export default OutageTimeline
