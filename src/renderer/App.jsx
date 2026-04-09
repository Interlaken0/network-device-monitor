import React, { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [devices, setDevices] = useState([])
  const [newDevice, setNewDevice] = useState({ name: '', ipAddress: '' })
  const [pingResults, setPingResults] = useState({})
  const [isMonitoring, setIsMonitoring] = useState({})
  const [error, setError] = useState(null)

  // Load devices on mount
  useEffect(() => {
    loadDevices()
  }, [])

  // Listen for ping results
  useEffect(() => {
    const cleanup = window.electronAPI?.onPingResult((result) => {
      if (result && result.deviceId) {
        setPingResults(prev => ({
          ...prev,
          [result.deviceId]: result
        }))
      }
    })

    return () => {
      if (cleanup) cleanup()
    }
  }, [])

  const loadDevices = async () => {
    try {
      const result = await window.electronAPI?.getDevices()
      if (result?.success) {
        setDevices(result.data || [])
      }
    } catch (err) {
      setError('Failed to load devices: ' + err.message)
    }
  }

  const handleCreateDevice = async (e) => {
    e.preventDefault()
    if (!newDevice.name || !newDevice.ipAddress) {
      setError('Please enter both name and IP address')
      return
    }

    try {
      const result = await window.electronAPI?.createDevice({
        name: newDevice.name,
        ipAddress: newDevice.ipAddress,
        deviceType: 'server',
        isActive: true
      })

      if (result?.success) {
        setNewDevice({ name: '', ipAddress: '' })
        setError(null)
        await loadDevices()
      } else {
        setError(result?.error || 'Failed to create device')
      }
    } catch (err) {
      setError('Error creating device: ' + err.message)
    }
  }

  const handleDeleteDevice = async (id) => {
    try {
      // Stop monitoring if active
      if (isMonitoring[id]) {
        await handleStopMonitoring(id)
      }

      const result = await window.electronAPI?.deleteDevice(id)
      if (result?.success) {
        await loadDevices()
      } else {
        setError(result?.error || 'Failed to delete device')
      }
    } catch (err) {
      setError('Error deleting device: ' + err.message)
    }
  }

  const handleStartMonitoring = async (device) => {
    try {
      const result = await window.electronAPI?.startPing?.(
        device.id,
        device.ip_address || device.ipAddress,
        5000
      )

      if (result?.success) {
        setIsMonitoring(prev => ({ ...prev, [device.id]: true }))
        setError(null)
      } else {
        setError(result?.error || 'Failed to start monitoring')
      }
    } catch (err) {
      // Fallback: just mark as monitoring for UI demo
      setIsMonitoring(prev => ({ ...prev, [device.id]: true }))
      setError('Monitoring started (demo mode)')
    }
  }

  const handleStopMonitoring = async (deviceId) => {
    try {
      const result = await window.electronAPI?.stopPing?.(deviceId)
      setIsMonitoring(prev => ({ ...prev, [deviceId]: false }))
      setPingResults(prev => {
        const updated = { ...prev }
        delete updated[deviceId]
        return updated
      })
    } catch (err) {
      setIsMonitoring(prev => ({ ...prev, [deviceId]: false }))
    }
  }

  const getLatencyColor = (latencyMs) => {
    if (!latencyMs) return 'latency-unknown'
    if (latencyMs < 50) return 'latency-excellent'
    if (latencyMs < 100) return 'latency-good'
    if (latencyMs < 200) return 'latency-fair'
    return 'latency-poor'
  }

  return (
    <div className="app">
      <header>
        <h1>AMF Network Monitor</h1>
        <p className="subtitle">Sprint 1 MVP - Single Device Monitoring</p>
      </header>

      <main>
        {error && (
          <div className="error-banner" onClick={() => setError(null)}>
            {error}
          </div>
        )}

        {/* Add Device Form */}
        <section className="card">
          <h2>Add Device</h2>
          <form onSubmit={handleCreateDevice} className="device-form">
            <input
              type="text"
              placeholder="Device Name (e.g., Router-1)"
              value={newDevice.name}
              onChange={(e) => setNewDevice(prev => ({ ...prev, name: e.target.value }))}
            />
            <input
              type="text"
              placeholder="IP Address (e.g., 192.168.1.1)"
              value={newDevice.ipAddress}
              onChange={(e) => setNewDevice(prev => ({ ...prev, ipAddress: e.target.value }))}
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
                  <div key={device.id} className={`device-item ${monitoring ? 'monitoring' : ''}`}>
                    <div className="device-info">
                      <h3>{device.name}</h3>
                      <p className="ip-address">{device.ip_address || device.ipAddress}</p>
                      <p className="device-type">{device.device_type || device.deviceType}</p>
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
                          onClick={() => handleStartMonitoring(device)}
                          className="btn-start"
                        >
                          Start Monitoring
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleStopMonitoring(device.id)}
                          className="btn-stop"
                        >
                          Stop
                        </button>
                      )}
                      <button 
                        onClick={() => handleDeleteDevice(device.id)}
                        className="btn-delete"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Live Ping Results */}
        {Object.keys(pingResults).length > 0 && (
          <section className="card">
            <h2>Live Ping Results</h2>
            <div className="ping-log">
              {Object.entries(pingResults).map(([deviceId, result]) => {
                const device = devices.find(d => d.id === parseInt(deviceId))
                return (
                  <div key={deviceId} className={`ping-entry ${result.success ? 'success' : 'failure'}`}>
                    <span className="device-name">{device?.name || 'Unknown'}</span>
                    <span className="timestamp">{new Date(result.timestamp).toLocaleTimeString()}</span>
                    <span className="result">
                      {result.success ? `${result.latencyMs}ms` : 'Failed'}
                    </span>
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
