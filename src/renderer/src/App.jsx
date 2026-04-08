import React, { useState, useEffect } from 'react'

function App() {
  const [count, setCount] = useState(0)
  const [pingResult, setPingResult] = useState(null)

  useEffect(() => {
    // Test IPC communication
    const cleanup = window.electronAPI?.onPingResult((result) => {
      setPingResult(result)
    })

    // Cleanup on unmount
    return () => {
      if (cleanup) cleanup()
    }
  }, [])

  const handleCreateDevice = async () => {
    try {
      const result = await window.electronAPI?.createDevice({
        name: 'Test Device',
        ipAddress: '192.168.1.1'
      })
      console.log('Device created:', result)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  return (
    <div className="app">
      <header>
        <h1>AMF Network Device Monitor</h1>
        <p className="subtitle">Real-time network infrastructure monitoring</p>
      </header>

      <main>
        <section className="card">
          <h2>Electron + React Setup Complete</h2>
          <p>
            <button onClick={() => setCount((count) => count + 1)}>
              Count is {count}
            </button>
          </p>
          
          <div className="api-test">
            <h3>IPC API Test</h3>
            <button onClick={handleCreateDevice}>
              Test Create Device API
            </button>
            {pingResult && (
              <p className="ping-result">
                Last ping: {JSON.stringify(pingResult)}
              </p>
            )}
          </div>

          <div className="versions">
            <p>
              Running with: Electron <span>{window.versions?.electron?.()}</span>,
              Chrome <span>{window.versions?.chrome?.()}</span>,
              Node.js <span>{window.versions?.node?.()}</span>
            </p>
          </div>
        </section>

        <section className="card">
          <h2>Security Configuration</h2>
          <ul>
            <li>✅ nodeIntegration: false</li>
            <li>✅ contextIsolation: true</li>
            <li>✅ sandbox: true</li>
            <li>✅ Content Security Policy applied</li>
            <li>✅ IPC channel whitelisting</li>
          </ul>
        </section>
      </main>
    </div>
  )
}

export default App
