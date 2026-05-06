import React, { useEffect } from 'react'
import './App.css'
import Dashboard from './components/Dashboard'
import { useDeviceStore, selectDevices, selectError, selectPingResults, selectIsMonitoring, selectEditingDevice, selectEditForm, selectDeleteModal, selectNewDeviceForm } from './stores/deviceStore'
import { useThemeStore, selectTheme, selectToggleTheme } from './stores/themeStore'

function App() {
  // Theme store
  const theme = useThemeStore(selectTheme)
  const toggleTheme = useThemeStore(selectToggleTheme)

  // Initialise theme on mount
  useEffect(() => {
    useThemeStore.getState().initialiseTheme()
  }, [])

  // Zustand store selectors
  const devices = useDeviceStore(selectDevices)
  const error = useDeviceStore(selectError)
  const pingResults = useDeviceStore(selectPingResults)
  const isMonitoring = useDeviceStore(selectIsMonitoring)
  const editingDevice = useDeviceStore(selectEditingDevice)
  const editForm = useDeviceStore(selectEditForm)
  const deleteModal = useDeviceStore(selectDeleteModal)
  const newDeviceForm = useDeviceStore(selectNewDeviceForm)

  // Zustand actions - use getState() for stable references in effects
  const loadDevices = useDeviceStore((state) => state.loadDevices)
  const setNewDeviceForm = useDeviceStore((state) => state.setNewDeviceForm)
  const setEditingDevice = useDeviceStore((state) => state.setEditingDevice)
  const setEditForm = useDeviceStore((state) => state.setEditForm)
  const showDeleteModal = useDeviceStore((state) => state.showDeleteModal)
  const hideDeleteModal = useDeviceStore((state) => state.hideDeleteModal)
  const createDevice = useDeviceStore((state) => state.createDevice)
  const updateDevice = useDeviceStore((state) => state.updateDevice)
  const deleteDevice = useDeviceStore((state) => state.deleteDevice)
  const startMonitoring = useDeviceStore((state) => state.startMonitoring)
  const stopMonitoring = useDeviceStore((state) => state.stopMonitoring)
  const clearError = useDeviceStore((state) => state.clearError)

  // Load devices on mount - loadDevices is stable Zustand action
  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    loadDevices()
  }, [])
  /* eslint-enable react-hooks/exhaustive-deps */

  // Listen for ping results - use getState() to avoid unstable selector dependencies
  useEffect(() => {
    const cleanup = window.electronAPI?.onPingResult((result) => {
      if (result && result.deviceId) {
        // Use getState() for stable action reference (no closure issues)
        useDeviceStore.getState().setPingResult(result.deviceId, result)
      }
    })

    return () => {
      if (cleanup) cleanup()
    }
  }, [])

  // Event handlers using store actions
  const handleCreateDevice = async (e) => {
    e.preventDefault()
    await createDevice()
  }

  const handleDeleteClick = (device) => {
    showDeleteModal(device.id, device.name)
  }

  const handleConfirmDelete = async () => {
    await deleteDevice()
  }

  const handleEditClick = (device) => {
    setEditingDevice(device)
  }

  const handleUpdateDevice = async (e, deviceId) => {
    e.preventDefault()
    await updateDevice(deviceId)
  }

  const resetEditForm = useDeviceStore((state) => state.resetEditForm)

  const getLatencyColor = (latencyMs) => {
    if (!latencyMs) return 'latency-unknown'
    if (latencyMs < 10) return 'latency-excellent'
    if (latencyMs < 50) return 'latency-good'
    if (latencyMs < 150) return 'latency-fair'
    return 'latency-poor'
  }

  return (
    <div className="app">
      <button
        className="theme-toggle"
        onClick={toggleTheme}
        title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
        aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
      >
        {theme === 'light' ? '\u263D' : '\u2600'}
      </button>
      <header>
        <h1>AMF Network Device Monitor</h1>
      </header>

      <main>
        {error && (
          <div className="error-banner" onClick={() => clearError()}>
            {error}
          </div>
        )}

        {/* Dashboard */}
        <Dashboard />

        {/* Add Device Form */}
        <section className="card">
          <h2>Add Device</h2>
          <form onSubmit={handleCreateDevice} className="device-form">
            <input
              type="text"
              placeholder="Device Name (e.g., Router-1)"
              value={newDeviceForm.name}
              onChange={(e) => setNewDeviceForm({ name: e.target.value })}
            />
            <input
              type="text"
              placeholder="IP Address (e.g., 192.168.1.1)"
              value={newDeviceForm.ipAddress}
              onChange={(e) => setNewDeviceForm({ ipAddress: e.target.value })}
            />
            <button type="submit" className="btn-primary">Add Device</button>
          </form>
        </section>

        {/* Device List */}
        <section className="card">
          <h2>Monitored Devices ({devices.length})</h2>
          
          {devices.length === 0 ? (
            <p className="empty-state">No devices added yet. Add one above to start monitoring.</p>
          ) : (
            <div className="device-list">
              {devices.map(device => {
                const pingData = pingResults[device.id]
                const monitoring = isMonitoring[device.id]
                
                return (
                  <div key={device.id} className={`device-item ${monitoring ? 'monitoring' : ''} ${editingDevice === device.id ? 'editing' : ''}`}>
                    {editingDevice === device.id ? (
                      <form onSubmit={(e) => handleUpdateDevice(e, device.id)} className="edit-form">
                        <input
                          type="text"
                          placeholder="Device Name"
                          value={editForm.name}
                          onChange={(e) => setEditForm({ name: e.target.value })}
                        />
                        <input
                          type="text"
                          placeholder="IP Address"
                          value={editForm.ipAddress}
                          onChange={(e) => setEditForm({ ipAddress: e.target.value })}
                        />
                        <select
                          value={editForm.deviceType}
                          onChange={(e) => setEditForm({ deviceType: e.target.value })}
                        >
                          <option value="server">Server</option>
                          <option value="router">Router</option>
                          <option value="printer">Printer</option>
                          <option value="switch">Switch</option>
                        </select>
                        <input
                          type="text"
                          placeholder="Location (optional)"
                          value={editForm.location}
                          onChange={(e) => setEditForm({ location: e.target.value })}
                        />
                        <div className="edit-actions">
                          <button type="submit" className="btn-save">Save</button>
                          <button type="button" onClick={() => { setEditingDevice(null); resetEditForm() }} className="btn-cancel">Cancel</button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <div className="device-info">
                          <h3>{device.name}</h3>
                          <p className="ip-address">{device.ipAddress}</p>
                          <p className="device-type">{device.deviceType}</p>
                          {device.location && <p className="device-location">{device.location}</p>}
                        </div>

                    <div className="device-status">
                      {monitoring && pingData ? (
                        <div className={`latency-badge ${getLatencyColor(pingData.latencyMs)}`}>
                          {pingData.success ? (
                            <>
                              <span className="latency-value">{pingData.latencyMs}ms</span>
                              <span className="status-indicator online"></span>
                            </>
                          ) : (
                            <>
                              <span className="latency-value">OFFLINE</span>
                              <span className="status-indicator offline"></span>
                            </>
                          )}
                        </div>
                      ) : (
                        <span className="status-badge">Not Monitoring</span>
                      )}
                    </div>

                    <div className="device-actions">
                      {!monitoring ? (
                        <button 
                          onClick={() => startMonitoring(device)}
                          className="btn-start"
                          title="Start Monitoring"
                        >
                          Start
                        </button>
                      ) : (
                        <button 
                          onClick={() => stopMonitoring(device.id)}
                          className="btn-stop"
                          title="Stop Monitoring"
                        >
                          Stop
                        </button>
                      )}
                      <button 
                        onClick={() => handleEditClick(device)}
                        className="btn-edit"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteClick(device)}
                        className="btn-delete"
                      >
                        Delete
                      </button>
                    </div>
                    </>
                  )}
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Delete Confirmation Modal */}
        {deleteModal.show && (
          <div className="modal-overlay" onClick={() => hideDeleteModal()}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3>Confirm Delete</h3>
              <p>Are you sure you want to delete <strong>{deleteModal.deviceName}</strong>?</p>
              <div className="modal-actions">
                <button onClick={() => hideDeleteModal()} className="btn-cancel">Cancel</button>
                <button onClick={handleConfirmDelete} className="btn-delete">Delete</button>
              </div>
            </div>
          </div>
        )}

        {/* Live Ping Results */}
        {Object.keys(pingResults).length > 0 && (
          <section className="card">
            <h2>Live Ping Results</h2>
            <div className="ping-log">
              {Object.entries(pingResults).map(([deviceId, result]) => {
                const device = devices.find(d => d.id === parseInt(deviceId))
                const time = new Date(result.timestamp)
                const timeString = time.toLocaleTimeString('en-GB', { hour12: false })
                return (
                  <div key={deviceId} className={`ping-entry ${result.success ? 'success' : 'failure'}`}>
                    <div className="ping-info">
                      <span className="device-name" title={device?.name}>{device?.name || 'Unknown'}</span>
                      <span className="ip-address">{device?.ipAddress || 'Unknown IP'}</span>
                    </div>
                    <div className="ping-details">
                      <span className="timestamp">{timeString}</span>
                      <span className={`status-badge ${result.success ? 'online' : 'offline'}`}>
                        {result.success ? 'Online' : 'Offline'}
                      </span>
                      <span className={`result ${result.success ? 'online' : 'offline'}`}>
                        {result.success ? `${result.latencyMs}ms` : 'Timeout'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

export default App
