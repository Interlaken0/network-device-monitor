import React from 'react'
import PropTypes from 'prop-types'

/**
 * Predefined date range options for quick selection.
 * @constant {Array}
 */
const PRESET_RANGES = [
  { label: 'Last 24 Hours', days: 1 },
  { label: 'Last 7 Days', days: 7 },
  { label: 'Last 30 Days', days: 30 }
]

/**
 * Aggregation type options.
 * @constant {Array}
 */
const AGGREGATION_TYPES = [
  { value: 'avg', label: 'Average' },
  { value: 'min', label: 'Minimum' },
  { value: 'max', label: 'Maximum' }
]

/**
 * QueryBuilder provides historical data filtering controls.
 * Includes date range selection, device multi-select, and aggregation type.
 *
 * @param {Object} props
 * @param {Object} props.filters - Current filter state
 * @param {Array} props.devices - Available devices for selection
 * @param {Function} props.onChange - Callback when filters change
 * @param {Function} props.onSubmit - Callback when user clicks Apply
 * @param {boolean} props.isLoading - Whether query is in progress
 * @returns {JSX.Element}
 */
function QueryBuilder({ filters, devices, onChange, onSubmit, isLoading = false }) {
  const { dateRange, selectedDevices, aggregationType } = filters

  const handleDateChange = (field, value) => {
    onChange({
      dateRange: { ...dateRange, [field]: value }
    })
  }

  const handlePresetClick = (days) => {
    const end = new Date()
    const start = new Date()
    start.setDate(end.getDate() - days)

    onChange({
      dateRange: {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0]
      }
    })
  }

  const handleDeviceToggle = (deviceId) => {
    const updated = selectedDevices.includes(deviceId)
      ? selectedDevices.filter((id) => id !== deviceId)
      : [...selectedDevices, deviceId]
    onChange({ selectedDevices: updated })
  }

  const handleSelectAllDevices = () => {
    const allIds = devices.map((d) => d.id)
    const allSelected = selectedDevices.length === devices.length
    onChange({ selectedDevices: allSelected ? [] : allIds })
  }

  const handleAggregationChange = (value) => {
    onChange({ aggregationType: value })
  }

  const handleReset = () => {
    onChange({
      dateRange: { start: '', end: '' },
      selectedDevices: [],
      aggregationType: 'avg'
    })
  }

  return (
    <div className="query-builder card">
      <h3 className="query-builder-title">Historical Query Builder</h3>

      <div className="query-builder-section">
        <label className="query-label">Date Range</label>
        <div className="preset-buttons">
          {PRESET_RANGES.map((preset) => (
            <button
              key={preset.days}
              type="button"
              className="preset-btn"
              onClick={() => handlePresetClick(preset.days)}
            >
              {preset.label}
            </button>
          ))}
        </div>
        <div className="date-inputs">
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => handleDateChange('start', e.target.value)}
            aria-label="Start date"
          />
          <span className="date-separator">to</span>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => handleDateChange('end', e.target.value)}
            aria-label="End date"
          />
        </div>
      </div>

      <div className="query-builder-section">
        <label className="query-label">
          Devices
          <button type="button" className="select-all-btn" onClick={handleSelectAllDevices}>
            {selectedDevices.length === devices.length ? 'Deselect All' : 'Select All'}
          </button>
        </label>
        <div className="device-multi-select">
          {devices.length === 0 ? (
            <p className="empty-hint">No devices available.</p>
          ) : (
            devices.map((device) => (
              <label key={device.id} className="device-checkbox">
                <input
                  type="checkbox"
                  checked={selectedDevices.includes(device.id)}
                  onChange={() => handleDeviceToggle(device.id)}
                />
                <span className="device-checkbox-label">{device.name}</span>
              </label>
            ))
          )}
        </div>
      </div>

      <div className="query-builder-section">
        <label className="query-label">Aggregation</label>
        <select
          value={aggregationType}
          onChange={(e) => handleAggregationChange(e.target.value)}
          className="aggregation-select"
        >
          {AGGREGATION_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      <div className="query-builder-actions">
        <button
          type="button"
          className="btn-primary"
          onClick={onSubmit}
          disabled={isLoading || !dateRange.start || !dateRange.end}
        >
          {isLoading ? 'Loading...' : 'Apply Filters'}
        </button>
        <button type="button" className="btn-secondary" onClick={handleReset}>
          Reset
        </button>
      </div>
    </div>
  )
}

QueryBuilder.propTypes = {
  filters: PropTypes.shape({
    dateRange: PropTypes.shape({
      start: PropTypes.string,
      end: PropTypes.string
    }),
    selectedDevices: PropTypes.arrayOf(PropTypes.number),
    aggregationType: PropTypes.string
  }).isRequired,
  devices: PropTypes.array.isRequired,
  onChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  isLoading: PropTypes.bool
}

export default QueryBuilder
