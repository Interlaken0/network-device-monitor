import React, { useEffect } from 'react'
import PropTypes from 'prop-types'
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
import QueryBuilder from './QueryBuilder'
import SummaryCards from '../dashboard/SummaryCards'
import { useDeviceStore } from '../../stores/deviceStore'
import { useThemeStore } from '../../stores/themeStore'
import { getChartColours } from '../../utils/chart-theme'

/**
 * Custom tooltip for the latency bar chart.
 *
 * @param {Object} props - Recharts tooltip props
 * @returns {JSX.Element|null}
 */
const LatencyTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="chart-tooltip">
        <p className="tooltip-device">{label}</p>
        <p className="tooltip-value">Latency: {Math.round(data.latency)}ms</p>
        <p className="tooltip-uptime">Uptime: {data.uptime}%</p>
      </div>
    )
  }
  return null
}

LatencyTooltip.propTypes = {
  active: PropTypes.bool,
  payload: PropTypes.array,
  label: PropTypes.string
}

/**
 * HistoricalAnalysis is the main Sprint 4 analytics dashboard.
 * Combines QueryBuilder filtering with SummaryCards and latency/uptime charts.
 *
 * @returns {JSX.Element}
 */
function HistoricalAnalysis() {
  const theme = useThemeStore((state) => state.theme)
  const chartColours = getChartColours(theme)

  const devices = useDeviceStore((state) => state.devices)
  const filters = useDeviceStore((state) => state.historicalFilters)
  const data = useDeviceStore((state) => state.historicalData)
  const isLoading = useDeviceStore((state) => state.isLoadingHistorical)
  const error = useDeviceStore((state) => state.historicalError)

  const setHistoricalFilters = useDeviceStore((state) => state.setHistoricalFilters)
  const loadHistoricalData = useDeviceStore((state) => state.loadHistoricalData)
  const clearHistoricalError = useDeviceStore((state) => state.clearHistoricalError)

  // Auto-load on mount if filters are already set
  useEffect(() => {
    if (filters.dateRange.start && filters.dateRange.end && data.length === 0) {
      loadHistoricalData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleFilterChange = (updates) => {
    setHistoricalFilters(updates)
  }

  const handleApply = () => {
    clearHistoricalError()
    loadHistoricalData()
  }

  // Prepare chart data from historical summaries
  const chartData = data
    .filter((d) => d.averageLatencyMs !== null && d.averageLatencyMs !== undefined)
    .map((d) => ({
      name: d.name || `Device ${d.deviceId}`,
      latency: d.averageLatencyMs,
      uptime: d.uptime?.uptimePercent || 0,
      outages: d.outages?.outageCount || 0
    }))
    .sort((a, b) => b.latency - a.latency)

  const getLatencyColour = (latency) => {
    if (latency < 50) return '#28a745'
    if (latency < 150) return '#ffc107'
    return '#dc3545'
  }

  return (
    <section className="historical-analysis">
      <h2>Historical Analysis</h2>

      <QueryBuilder
        filters={filters}
        devices={devices}
        onChange={handleFilterChange}
        onSubmit={handleApply}
        isLoading={isLoading}
      />

      {error && (
        <div className="error-banner" onClick={clearHistoricalError}>
          {error}
        </div>
      )}

      {isLoading && (
        <div className="loading-container">
          <div className="loading-spinner" />
          <p>Loading historical data...</p>
        </div>
      )}

      {!isLoading && data.length > 0 && (
        <>
          <SummaryCards data={data} />

          {chartData.length > 0 && (
            <div className="chart-card card">
              <h3>Average Latency by Device</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColours.grid} />
                  <XAxis
                    dataKey="name"
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
                    label={{ value: 'Latency (ms)', angle: -90, position: 'insideLeft', fill: chartColours.axis }}
                  />
                  <Tooltip content={<LatencyTooltip />} />
                  <Bar dataKey="latency" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getLatencyColour(entry.latency)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="historical-table-card card">
            <h3>Device Breakdown</h3>
            <div className="virtual-table-container">
              <table className="historical-table">
                <thead>
                  <tr>
                    <th>Device</th>
                    <th>Uptime %</th>
                    <th>Avg Latency</th>
                    <th>Outages</th>
                    <th>Downtime</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((device) => (
                    <tr key={device.deviceId}>
                      <td>{device.name || `Device ${device.deviceId}`}</td>
                      <td>{device.uptime?.uptimePercent !== null ? `${device.uptime.uptimePercent}%` : 'N/A'}</td>
                      <td>{device.averageLatencyMs !== null ? `${Math.round(device.averageLatencyMs)}ms` : 'N/A'}</td>
                      <td>{device.outages?.outageCount || 0}</td>
                      <td>{formatDowntime(device.outages?.totalDowntimeSeconds || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {!isLoading && data.length === 0 && !error && (
        <div className="empty-state card">
          <p>Select a date range and click Apply Filters to view historical analysis.</p>
        </div>
      )}
    </section>
  )
}

/**
 * Formats downtime seconds into a readable string.
 *
 * @param {number} seconds - Downtime in seconds
 * @returns {string}
 */
function formatDowntime(seconds) {
  if (!seconds || seconds <= 0) return '0s'
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) return `${hours}h ${minutes}m`
  if (minutes > 0) return `${minutes}m`
  return `${seconds}s`
}

export default HistoricalAnalysis
