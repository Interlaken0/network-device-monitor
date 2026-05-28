import React, { useState, useEffect, useCallback } from 'react'
import { useDeviceStore } from '../stores/deviceStore'

/**
 * Validation rules for alert threshold inputs.
 * @constant {Object}
 */
const VALIDATION_RULES = {
  latency: { min: 50, max: 500, label: 'Latency threshold' },
  failures: { min: 1, max: 10, label: 'Consecutive failures' },
  packetLoss: { min: 1, max: 50, label: 'Packet loss threshold' }
}

/**
 * Validates a numeric threshold value against min/max bounds.
 *
 * @param {string} type - Threshold type key
 * @param {number} value - Raw input value
 * @returns {string|null} Error message or null if valid
 */
function validateThreshold(type, value) {
  const rule = VALIDATION_RULES[type]
  if (value === '' || value === null || value === undefined) {
    return `${rule.label} is required`
  }
  const num = Number(value)
  if (Number.isNaN(num)) {
    return `${rule.label} must be a number`
  }
  if (num < rule.min || num > rule.max) {
    return `${rule.label} must be between ${rule.min} and ${rule.max}`
  }
  return null
}

/**
 * AlertConfiguration provides per-device threshold editing.
 * Includes enable/disable toggle, severity selection, and range validation.
 *
 * @returns {JSX.Element}
 */
function AlertConfiguration() {
  const devices = useDeviceStore((state) => state.devices)

  const [selectedDeviceId, setSelectedDeviceId] = useState('')
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})
  const [saveMessage, setSaveMessage] = useState('')

  /**
   * Load alert configuration for the selected device.
   * Creates defaults automatically if none exists.
   */
  const loadConfig = useCallback(async (deviceId) => {
    if (!deviceId) return
    setLoading(true)
    setErrors({})
    setSaveMessage('')

    try {
      const result = await window.electronAPI?.getAlertConfig(Number(deviceId))
      if (result?.success && result.data) {
        setConfig(result.data)
      } else {
        // No config exists — create default
        const createResult = await window.electronAPI?.createAlertConfig(Number(deviceId))
        if (createResult?.success) {
          setConfig(createResult.data)
        } else {
          setConfig(buildDefaultConfig(Number(deviceId)))
        }
      }
    } catch (err) {
      setConfig(buildDefaultConfig(Number(deviceId)))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (selectedDeviceId) {
      loadConfig(selectedDeviceId)
    } else {
      setConfig(null)
    }
  }, [selectedDeviceId, loadConfig])

  /**
   * Build a default configuration object when the database
   * has no record yet.
   *
   * @param {number} deviceId
   * @returns {Object}
   */
  function buildDefaultConfig(deviceId) {
    return {
      deviceId,
      enabled: true,
      latencyThresholdMs: 150,
      consecutiveFailuresThreshold: 3,
      packetLossThresholdPct: 10,
      latencySeverity: 'warning',
      failuresSeverity: 'critical',
      packetLossSeverity: 'warning'
    }
  }

  /**
   * Update a single field in the local config state.
   *
   * @param {string} field
   * @param {any} value
   */
  function updateField(field, value) {
    setConfig((prev) => (prev ? { ...prev, [field]: value } : prev))
    setErrors((prev) => ({ ...prev, [field]: null }))
    setSaveMessage('')
  }

  /**
   * Validate the entire form before saving.
   *
   * @returns {boolean}
   */
  function validateForm() {
    const newErrors = {}
    newErrors.latency = validateThreshold('latency', config.latencyThresholdMs)
    newErrors.failures = validateThreshold('failures', config.consecutiveFailuresThreshold)
    newErrors.packetLoss = validateThreshold('packetLoss', config.packetLossThresholdPct)

    const hasErrors = Object.values(newErrors).some((e) => e !== null)
    setErrors(newErrors)
    return !hasErrors
  }

  /**
   * Persist configuration to the database via IPC.
   */
  async function handleSave() {
    if (!config || !validateForm()) return

    setSaving(true)
    setSaveMessage('')

    try {
      const updates = {
        enabled: config.enabled,
        latencyThresholdMs: Number(config.latencyThresholdMs),
        consecutiveFailuresThreshold: Number(config.consecutiveFailuresThreshold),
        packetLossThresholdPct: Number(config.packetLossThresholdPct),
        latencySeverity: config.latencySeverity,
        failuresSeverity: config.failuresSeverity,
        packetLossSeverity: config.packetLossSeverity
      }

      const result = await window.electronAPI?.updateAlertConfig(config.deviceId, updates)
      if (result?.success) {
        setConfig(result.data)
        setSaveMessage('Alert configuration saved successfully')
      } else {
        setErrors((prev) => ({ ...prev, general: result?.error || 'Failed to save configuration' }))
      }
    } catch (err) {
      setErrors((prev) => ({ ...prev, general: 'Error saving configuration: ' + err.message }))
    } finally {
      setSaving(false)
    }
  }

  /**
   * Reset form to default values.
   */
  function handleReset() {
    if (!selectedDeviceId) return
    setConfig(buildDefaultConfig(Number(selectedDeviceId)))
    setErrors({})
    setSaveMessage('')
  }

  return (
    <section className="card">
      <h2>Alert Configuration</h2>

      <div className="alert-config-layout">
        {/* Device selector */}
        <div className="device-selector-row">
          <label htmlFor="alert-device-select">Select Device</label>
          <select
            id="alert-device-select"
            value={selectedDeviceId}
            onChange={(e) => setSelectedDeviceId(e.target.value)}
          >
            <option value="">-- Choose a device --</option>
            {devices.map((device) => (
              <option key={device.id} value={device.id}>
                {device.name} ({device.ipAddress})
              </option>
            ))}
          </select>
        </div>

        {loading && <p className="loading-text">Loading configuration...</p>}

        {config && !loading && (
          <div className="alert-form">
            {/* Enable/disable toggle */}
            <div className="alert-toggle-row">
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={config.enabled}
                  onChange={(e) => updateField('enabled', e.target.checked)}
                />
                <span>Enable Alerts for this Device</span>
              </label>
            </div>

            {/* Latency threshold */}
            <div className={`alert-field ${errors.latency ? 'has-error' : ''}`}>
              <label htmlFor="latency-threshold">Latency Threshold (ms)</label>
              <div className="alert-input-row">
                <input
                  id="latency-threshold"
                  type="number"
                  min={50}
                  max={500}
                  value={config.latencyThresholdMs}
                  onChange={(e) => updateField('latencyThresholdMs', e.target.value)}
                  disabled={!config.enabled}
                />
                <select
                  value={config.latencySeverity}
                  onChange={(e) => updateField('latencySeverity', e.target.value)}
                  disabled={!config.enabled}
                >
                  <option value="warning">Warning</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              {errors.latency && <span className="error-text">{errors.latency}</span>}
              <span className="hint-text">Range: 50 - 500 ms</span>
            </div>

            {/* Consecutive failures threshold */}
            <div className={`alert-field ${errors.failures ? 'has-error' : ''}`}>
              <label htmlFor="failures-threshold">Consecutive Failures</label>
              <div className="alert-input-row">
                <input
                  id="failures-threshold"
                  type="number"
                  min={1}
                  max={10}
                  value={config.consecutiveFailuresThreshold}
                  onChange={(e) => updateField('consecutiveFailuresThreshold', e.target.value)}
                  disabled={!config.enabled}
                />
                <select
                  value={config.failuresSeverity}
                  onChange={(e) => updateField('failuresSeverity', e.target.value)}
                  disabled={!config.enabled}
                >
                  <option value="warning">Warning</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              {errors.failures && <span className="error-text">{errors.failures}</span>}
              <span className="hint-text">Range: 1 - 10 failures</span>
            </div>

            {/* Packet loss threshold */}
            <div className={`alert-field ${errors.packetLoss ? 'has-error' : ''}`}>
              <label htmlFor="packet-loss-threshold">Packet Loss Threshold (%)</label>
              <div className="alert-input-row">
                <input
                  id="packet-loss-threshold"
                  type="number"
                  min={1}
                  max={50}
                  value={config.packetLossThresholdPct}
                  onChange={(e) => updateField('packetLossThresholdPct', e.target.value)}
                  disabled={!config.enabled}
                />
                <select
                  value={config.packetLossSeverity}
                  onChange={(e) => updateField('packetLossSeverity', e.target.value)}
                  disabled={!config.enabled}
                >
                  <option value="warning">Warning</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              {errors.packetLoss && <span className="error-text">{errors.packetLoss}</span>}
              <span className="hint-text">Range: 1 - 50 %</span>
            </div>

            {/* Action buttons */}
            <div className="alert-actions">
              <button
                type="button"
                className="btn-primary"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Configuration'}
              </button>
              <button
                type="button"
                className="btn-cancel"
                onClick={handleReset}
              >
                Reset to Defaults
              </button>
            </div>

            {errors.general && <p className="error-text general-error">{errors.general}</p>}
            {saveMessage && <p className="success-text">{saveMessage}</p>}
          </div>
        )}

        {!selectedDeviceId && !loading && (
          <p className="empty-state">Select a device above to configure alert thresholds.</p>
        )}
      </div>
    </section>
  )
}

export default AlertConfiguration
