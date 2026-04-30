import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

/**
 * Device state store using Zustand for Sprint 3 dashboard visualisation.
 * Provides global state for devices, ping results, and monitoring status.
 *
 * @module deviceStore
 */

/**
 * Calculates status colour based on latency threshold.
 *
 * @param {number} latencyMs - Latency in milliseconds
 * @returns {string} Status colour class: 'excellent', 'good', 'fair', or 'poor'
 */
const calculateStatusFromLatency = (latencyMs) => {
  if (!latencyMs) return 'unknown'
  if (latencyMs < 50) return 'excellent'
  if (latencyMs < 100) return 'good'
  if (latencyMs < 200) return 'fair'
  return 'poor'
}

/**
 * Zustand store for device management and monitoring state.
 * Includes selectors for optimised component re-rendering.
 */
export const useDeviceStore = create(
  devtools(
    (set, get) => ({
      // Device list state
      devices: [],
      isLoading: false,
      error: null,

      // Ping monitoring state
      pingResults: {},
      isMonitoring: {},
      pingHistory: {},

      // Form states
      newDeviceForm: { name: '', ipAddress: '' },
      editingDevice: null,
      editForm: { name: '', ipAddress: '', deviceType: 'server', location: '' },
      deleteModal: { show: false, deviceId: null, deviceName: '' },

      /**
       * Actions: Device list management
       */
      setDevices: (devices) => set({ devices, isLoading: false, error: null }, false, 'setDevices'),

      addDevice: (device) =>
        set(
          (state) => ({ devices: [...state.devices, device] }),
          false,
          'addDevice'
        ),

      updateDeviceInList: (deviceId, updates) =>
        set(
          (state) => ({
            devices: state.devices.map((d) =>
              d.id === deviceId ? { ...d, ...updates } : d
            )
          }),
          false,
          'updateDeviceInList'
        ),

      removeDevice: (deviceId) =>
        set(
          (state) => ({
            devices: state.devices.filter((d) => d.id !== deviceId),
            pingResults: Object.fromEntries(
              Object.entries(state.pingResults).filter(([id]) => parseInt(id) !== deviceId)
            ),
            isMonitoring: Object.fromEntries(
              Object.entries(state.isMonitoring).filter(([id]) => parseInt(id) !== deviceId)
            )
          }),
          false,
          'removeDevice'
        ),

      setLoading: (isLoading) => set({ isLoading }, false, 'setLoading'),

      setError: (error) => set({ error }, false, 'setError'),

      clearError: () => set({ error: null }, false, 'clearError'),

      /**
       * Actions: Ping monitoring
       */
      setPingResult: (deviceId, result) =>
        set(
          (state) => ({
            pingResults: {
              ...state.pingResults,
              [deviceId]: result
            },
            pingHistory: {
              ...state.pingHistory,
              [deviceId]: [
                ...(state.pingHistory[deviceId] || []),
                {
                  timestamp: result.timestamp,
                  latencyMs: result.latencyMs,
                  success: result.success
                }
              ].slice(-1000)
            }
          }),
          false,
          'setPingResult'
        ),

      startMonitoringDevice: (deviceId) =>
        set(
          (state) => ({ isMonitoring: { ...state.isMonitoring, [deviceId]: true } }),
          false,
          'startMonitoringDevice'
        ),

      stopMonitoringDevice: (deviceId) =>
        set(
          (state) => ({
            isMonitoring: { ...state.isMonitoring, [deviceId]: false },
            pingResults: Object.fromEntries(
              Object.entries(state.pingResults).filter(([id]) => parseInt(id) !== deviceId)
            )
          }),
          false,
          'stopMonitoringDevice'
        ),

      /**
       * Actions: Form management
       */
      setNewDeviceForm: (updates) =>
        set(
          (state) => ({ newDeviceForm: { ...state.newDeviceForm, ...updates } }),
          false,
          'setNewDeviceForm'
        ),

      resetNewDeviceForm: () =>
        set({ newDeviceForm: { name: '', ipAddress: '' } }, false, 'resetNewDeviceForm'),

      setEditingDevice: (device) =>
        set(
          {
            editingDevice: device?.id || null,
            editForm: device
              ? {
                  name: device.name || '',
                  ipAddress: device.ip_address || device.ipAddress || '',
                  deviceType: device.device_type || device.deviceType || 'server',
                  location: device.location || ''
                }
              : { name: '', ipAddress: '', deviceType: 'server', location: '' }
          },
          false,
          'setEditingDevice'
        ),

      setEditForm: (updates) =>
        set(
          (state) => ({ editForm: { ...state.editForm, ...updates } }),
          false,
          'setEditForm'
        ),

      resetEditForm: () =>
        set(
          {
            editingDevice: null,
            editForm: { name: '', ipAddress: '', deviceType: 'server', location: '' }
          },
          false,
          'resetEditForm'
        ),

      /**
       * Actions: Delete modal
       */
      showDeleteModal: (deviceId, deviceName) =>
        set({ deleteModal: { show: true, deviceId, deviceName } }, false, 'showDeleteModal'),

      hideDeleteModal: () =>
        set({ deleteModal: { show: false, deviceId: null, deviceName: '' } }, false, 'hideDeleteModal'),

      /**
       * Async actions: API integration
       */
      loadDevices: async () => {
        const { setLoading, setDevices, setError } = get()
        setLoading(true)

        try {
          const result = await window.electronAPI?.getDevices()
          if (result?.success) {
            setDevices(result.data || [])
          } else {
            setError(result?.error || 'Failed to load devices')
          }
        } catch (err) {
          setError('Failed to load devices: ' + err.message)
        }
      },

      createDevice: async () => {
        const { newDeviceForm, resetNewDeviceForm, loadDevices, setError } = get()

        if (!newDeviceForm.name || !newDeviceForm.ipAddress) {
          setError('Please enter both name and IP address')
          return false
        }

        try {
          const result = await window.electronAPI?.createDevice({
            name: newDeviceForm.name,
            ipAddress: newDeviceForm.ipAddress,
            deviceType: 'server',
            isActive: true
          })

          if (result?.success) {
            resetNewDeviceForm()
            await loadDevices()
            return true
          } else {
            setError(result?.error || 'Failed to create device')
            return false
          }
        } catch (err) {
          setError('Error creating device: ' + err.message)
          return false
        }
      },

      updateDevice: async (deviceId) => {
        const { editForm, resetEditForm, loadDevices, setError } = get()

        if (!editForm.name || !editForm.ipAddress) {
          setError('Please enter both name and IP address')
          return false
        }

        try {
          const result = await window.electronAPI?.updateDevice(deviceId, {
            name: editForm.name,
            ipAddress: editForm.ipAddress,
            deviceType: editForm.deviceType,
            location: editForm.location
          })

          if (result?.success) {
            resetEditForm()
            await loadDevices()
            return true
          } else {
            setError(result?.error || 'Failed to update device')
            return false
          }
        } catch (err) {
          setError('Error updating device: ' + err.message)
          return false
        }
      },

      deleteDevice: async () => {
        const { deleteModal, hideDeleteModal, loadDevices, stopMonitoringDevice, setError } = get()
        const { deviceId } = deleteModal

        hideDeleteModal()

        try {
          await stopMonitoringDevice(deviceId)

          const result = await window.electronAPI?.deleteDevice(deviceId)
          if (result?.success) {
            await loadDevices()
            return true
          } else {
            setError(result?.error || 'Failed to delete device')
            return false
          }
        } catch (err) {
          setError('Error deleting device: ' + err.message)
          return false
        }
      },

      startMonitoring: async (device) => {
        const { startMonitoringDevice, setError } = get()

        try {
          const result = await window.electronAPI?.startPing?.(
            device.id,
            device.ip_address || device.ipAddress,
            5000
          )

          if (result?.success) {
            startMonitoringDevice(device.id)
            setError(null)
            return true
          } else {
            setError(result?.error || 'Failed to start monitoring')
            return false
          }
        } catch (err) {
          startMonitoringDevice(device.id)
          setError('Monitoring started (demo mode)')
          return true
        }
      },

      stopMonitoring: async (deviceId) => {
        const { stopMonitoringDevice } = get()

        try {
          await window.electronAPI?.stopPing?.(deviceId)
          stopMonitoringDevice(deviceId)
          return true
        } catch (err) {
          stopMonitoringDevice(deviceId)
          return false
        }
      }
    }),
    { name: 'DeviceStore' }
  )
)

/**
 * Selectors for optimised component re-rendering.
 * Use these in components to subscribe only to specific state slices.
 */

/** @returns {Array} List of all devices */
export const selectDevices = (state) => state.devices

/** @returns {boolean} Loading state */
export const selectIsLoading = (state) => state.isLoading

/** @returns {string|null} Current error message */
export const selectError = (state) => state.error

/** @returns {Object} Map of deviceId to ping results */
export const selectPingResults = (state) => state.pingResults

/** @returns {Object} Map of deviceId to monitoring status */
export const selectIsMonitoring = (state) => state.isMonitoring

/** @returns {Object} Map of deviceId to ping history array */
export const selectPingHistory = (state) => state.pingHistory

/**
 * Gets ping history for a specific device with time-range filtering.
 *
 * @param {number} deviceId - Device identifier
 * @param {string} timeRange - Time range: '5min', '1hr', or '24hr'
 * @returns {Array} Filtered ping history entries
 */
export const selectPingHistoryForDevice = (deviceId, timeRange = '5min') => (state) => {
  const history = state.pingHistory[deviceId] || []
  const now = Date.now()
  const ranges = {
    '5min': 5 * 60 * 1000,
    '1hr': 60 * 60 * 1000,
    '24hr': 24 * 60 * 60 * 1000
  }
  const cutoff = now - (ranges[timeRange] || ranges['5min'])

  return history.filter((entry) => new Date(entry.timestamp).getTime() > cutoff)
}

/** @returns {Object} New device form state */
export const selectNewDeviceForm = (state) => state.newDeviceForm

/** @returns {number|null} Currently editing device ID */
export const selectEditingDevice = (state) => state.editingDevice

/** @returns {Object} Edit form state */
export const selectEditForm = (state) => state.editForm

/** @returns {Object} Delete modal state */
export const selectDeleteModal = (state) => state.deleteModal

/**
 * Gets device status summary with latency and colour classification.
 *
 * @param {number} deviceId - Device identifier
 * @returns {Object} Status summary with latency, status colour, and online state
 */
export const selectDeviceStatus = (deviceId) => (state) => {
  const pingResult = state.pingResults[deviceId]
  const isMonitoring = state.isMonitoring[deviceId]

  if (!isMonitoring || !pingResult) {
    return { status: 'not-monitoring', latencyMs: null, isOnline: false }
  }

  const status = calculateStatusFromLatency(pingResult.latencyMs)
  return {
    status,
    latencyMs: pingResult.latencyMs,
    isOnline: pingResult.success,
    timestamp: pingResult.timestamp
  }
}

/**
 * Gets aggregated statistics for all monitored devices.
 *
 * @returns {Object} Statistics: total, online, offline, averageLatency
 */
export const selectMonitoringStats = (state) => {
  const monitoringDeviceIds = Object.entries(state.isMonitoring)
    .filter(([, isActive]) => isActive)
    .map(([id]) => parseInt(id))

  const total = monitoringDeviceIds.length
  let online = 0
  let totalLatency = 0
  let latencyCount = 0

  monitoringDeviceIds.forEach((id) => {
    const result = state.pingResults[id]
    if (result?.success) {
      online++
      if (result.latencyMs) {
        totalLatency += result.latencyMs
        latencyCount++
      }
    }
  })

  return {
    total,
    online,
    offline: total - online,
    averageLatency: latencyCount > 0 ? Math.round(totalLatency / latencyCount) : null
  }
}
