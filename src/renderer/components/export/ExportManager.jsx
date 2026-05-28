import React, { useState } from 'react'
import { useDeviceStore } from '../stores/deviceStore'

/**
 * Export data types supported by the export service.
 * @constant {Array}
 */
const EXPORT_TYPES = [
  { value: 'ping_logs', label: 'Ping Logs', defaultColumns: ['device_name', 'ip_address', 'latency_ms', 'success', 'timestamp'] },
  { value: 'outages', label: 'Outages', defaultColumns: ['device_name', 'ip_address', 'start_time', 'end_time', 'duration_seconds', 'severity'] },
  { value: 'devices', label: 'Devices', defaultColumns: ['name', 'ip_address', 'device_type', 'location', 'is_active'] }
]

/**
 * Report templates for HTML generation.
 * @constant {Array}
 */
const REPORT_TEMPLATES = [
  { value: 'uptime', label: 'Uptime Report' },
  { value: 'latency', label: 'Latency Analysis' },
  { value: 'outage', label: 'Outage Summary' }
]

/**
 * All available columns for selection.
 * @constant {Object}
 */
const ALL_COLUMNS = {
  ping_logs: ['device_name', 'ip_address', 'device_type', 'latency_ms', 'success', 'packet_loss', 'timestamp'],
  outages: ['device_name', 'ip_address', 'device_type', 'start_time', 'end_time', 'duration_seconds', 'severity'],
  devices: ['name', 'ip_address', 'device_type', 'location', 'is_active', 'created_at']
}

/**
 * ExportManager provides a UI for exporting historical data to CSV and HTML formats.
 * Supports column selection, date range filtering, device filtering, and progress tracking.
 *
 * @returns {JSX.Element}
 */
function ExportManager() {
  const devices = useDeviceStore((state) => state.devices)
  const exportProgress = useDeviceStore((state) => state.exportProgress)
  const setExportProgress = useDeviceStore((state) => state.setExportProgress)

  const [exportType, setExportType] = useState('ping_logs')
  const [format, setFormat] = useState('csv')
  const [template, setTemplate] = useState('uptime')
  const [selectedDevice, setSelectedDevice] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedColumns, setSelectedColumns] = useState(EXPORT_TYPES[0].defaultColumns)
  const [isExporting, setIsExporting] = useState(false)
  const [lastResult, setLastResult] = useState(null)

  const handleExportTypeChange = (type) => {
    setExportType(type)
    const config = EXPORT_TYPES.find((t) => t.value === type)
    setSelectedColumns(config?.defaultColumns || [])
  }

  const toggleColumn = (column) => {
    setSelectedColumns((prev) =>
      prev.includes(column)
        ? prev.filter((c) => c !== column)
        : [...prev, column]
    )
  }

  const handleExport = async () => {
    if (selectedColumns.length === 0) {
      setLastResult({ success: false, error: 'Please select at least one column' })
      return
    }

    setIsExporting(true)
    setExportProgress(10)
    setLastResult(null)

    try {
      let content = ''
      let defaultFilename = ''

      const query = {
        type: exportType,
        deviceId: selectedDevice || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined
      }

      if (format === 'csv') {
        setExportProgress(30)
        const result = await window.electronAPI.exportCSV(query, selectedColumns)
        if (!result.success) {
          throw new Error(result.error || 'Export failed')
        }
        content = result.data
        defaultFilename = `${exportType}_export.csv`
        setExportProgress(70)
      } else {
        setExportProgress(30)
        const result = await window.electronAPI.exportHTML(query, { template })
        if (!result.success) {
          throw new Error(result.error || 'Export failed')
        }
        content = result.data
        defaultFilename = `${template}_report.html`
        setExportProgress(70)
      }

      // Show save dialog
      setExportProgress(80)
      const saveResult = await window.electronAPI.saveExportFile(
        content,
        defaultFilename,
        format === 'csv'
          ? [{ name: 'CSV Files', extensions: ['csv'] }]
          : [{ name: 'HTML Files', extensions: ['html'] }]
      )

      if (saveResult.success) {
        if (saveResult.data?.reason === 'cancelled') {
          setLastResult({ success: false, error: 'Export cancelled by user' })
        } else {
          setLastResult({
            success: true,
            message: `Saved to ${saveResult.data?.filePath || 'selected location'}`
          })
        }
      } else {
        throw new Error(saveResult.error || 'Save failed')
      }

      setExportProgress(100)
    } catch (err) {
      setLastResult({ success: false, error: err.message })
      setExportProgress(0)
    } finally {
      setIsExporting(false)
      // Reset progress after a delay
      setTimeout(() => setExportProgress(0), 3000)
    }
  }

  const availableColumns = ALL_COLUMNS[exportType] || []

  return (
    <section className="export-manager card">
      <h2>Export Manager</h2>

      <div className="export-section">
        <label className="query-label">Export Format</label>
        <div className="format-toggle">
          <button
            type="button"
            className={format === 'csv' ? 'format-btn active' : 'format-btn'}
            onClick={() => setFormat('csv')}
          >
            CSV
          </button>
          <button
            type="button"
            className={format === 'html' ? 'format-btn active' : 'format-btn'}
            onClick={() => setFormat('html')}
          >
            HTML Report
          </button>
        </div>
      </div>

      {format === 'html' && (
        <div className="export-section">
          <label className="query-label">Report Template</label>
          <select
            className="aggregation-select"
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
          >
            {REPORT_TEMPLATES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="export-section">
        <label className="query-label">Data Type</label>
        <select
          className="aggregation-select"
          value={exportType}
          onChange={(e) => handleExportTypeChange(e.target.value)}
        >
          {EXPORT_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      <div className="export-section">
        <label className="query-label">Device Filter (Optional)</label>
        <select
          className="aggregation-select"
          value={selectedDevice}
          onChange={(e) => setSelectedDevice(e.target.value)}
        >
          <option value="">All Devices</option>
          {devices.map((device) => (
            <option key={device.id} value={device.id}>
              {device.name}
            </option>
          ))}
        </select>
      </div>

      <div className="export-section">
        <label className="query-label">Date Range (Optional)</label>
        <div className="date-inputs">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            aria-label="Start date"
          />
          <span className="date-separator">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            aria-label="End date"
          />
        </div>
      </div>

      {format === 'csv' && (
        <div className="export-section">
          <label className="query-label">
            Columns
            <button
              type="button"
              className="select-all-btn"
              onClick={() => {
                const allSelected = selectedColumns.length === availableColumns.length
                setSelectedColumns(allSelected ? [] : [...availableColumns])
              }}
            >
              {selectedColumns.length === availableColumns.length ? 'Deselect All' : 'Select All'}
            </button>
          </label>
          <div className="device-multi-select">
            {availableColumns.map((column) => (
              <label key={column} className="device-checkbox">
                <input
                  type="checkbox"
                  checked={selectedColumns.includes(column)}
                  onChange={() => toggleColumn(column)}
                />
                <span className="device-checkbox-label">{column.replace(/_/g, ' ')}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {exportProgress > 0 && (
        <div className="export-progress">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${exportProgress}%` }}
            />
          </div>
          <span className="progress-text">{exportProgress}%</span>
        </div>
      )}

      {lastResult && (
        <div className={`export-result ${lastResult.success ? 'success' : 'error'}`}>
          {lastResult.message || lastResult.error}
        </div>
      )}

      <div className="query-builder-actions">
        <button
          type="button"
          className="btn-primary"
          onClick={handleExport}
          disabled={isExporting || (format === 'csv' && selectedColumns.length === 0)}
        >
          {isExporting ? 'Exporting...' : `Export ${format.toUpperCase()}`}
        </button>
      </div>
    </section>
  )
}

export default ExportManager
