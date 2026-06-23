# Technical Guide: IPC Patterns

**Scope:** This document describes the secure Inter-Process Communication (IPC) patterns implemented in the Network Device Monitor Electron application, including validation strategies, error handling approaches, and security configurations.

---

## Overview

The Network Device Monitor uses Electron's IPC system to enable communication between the main process (Node.js backend) and renderer process (Chromium frontend). The implementation follows security best practices including context isolation, channel whitelisting, and input validation.

## Architecture

### Process Separation

```
┌─────────────────────────────────────────────────────────────┐
│                         Main Process                        │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                 IPC Handlers (main)                 │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌───────────┐  │    │
│  │  │ Device CRUD  │  │ Ping Control │  │ Database  │  │    │
│  │  │  Handlers    │  │   Handlers   │  │  Queries  │  │    │
│  │  └──────────────┘  └──────────────┘  └───────────┘  │    │
│  └─────────────────────────────────────────────────────┘    │
│                          ↑↓ ipcMain                         │
│                    Secure IPC Bridge                        │
│                          ↑↓ contextBridge                   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │               Preload Script Bridge                 │    │
│  │         (src/preload/index.js)                      │    │
│  │                                                     │    │
│  │   ┌─────────────────────────────────────────────┐   │    │
│  │   │         VALID_CHANNELS Whitelist            │   │    │
│  │   │  ['device:create', 'device:read', ...]      │   │    │
│  │   └─────────────────────────────────────────────┘   │    │
│  └─────────────────────────────────────────────────────┘    │
│                          ↑↓ ipcRenderer                     │
│  ┌─────────────────────────────────────────────────────┐    │
│  │               Renderer Process                      │    │
│  │         (Frontend UI - React/Vue)                   │    │
│  │                                                     │    │
│  │   window.electronAPI.createDevice(data)             │    │
│  │   window.electronAPI.getPingStatus(deviceId)        │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## Security Configuration

### Context Isolation

Context isolation is enforced in `@c:\Users\Greg\Desktop\Projects\network-device-monitor\src\main\index.js:66-73`:

```javascript
webPreferences: {
  nodeIntegration: false,    // Prevents renderer from accessing Node.js APIs directly
  contextIsolation: true,      // Isolates preload from renderer context
  sandbox: true,              // Enables Chromium sandbox
  preload: path.join(__dirname, '../preload/index.cjs'),
  allowRunningInsecureContent: false,
  experimentalFeatures: false
}
```

**Rationale:** Context isolation prevents renderer compromise from affecting the main process. The preload script acts as a controlled bridge, exposing only explicitly defined APIs.

### Channel Whitelisting

All valid IPC channels are defined in `@c:\Users\Greg\Desktop\Projects\network-device-monitor\src\preload\index.js:9-63`:

```javascript
const VALID_CHANNELS = [
  // Device management
  'device:create',
  'device:read',
  'device:update',
  'device:delete',
  'device:getWithStatus',
  'device:getStatusSummary',
  // Ping operations
  'ping:start',
  'ping:stop',
  'ping:startAll',
  'ping:stopAll',
  'ping:status',
  'ping:result',
  'ping:record',
  'ping:getRecent',
  'ping:getStats',
  // Outage operations
  'outage:getActive',
  'outage:getHistory',
  'outage:configureThresholds',
  // Historical aggregation (Sprint 4)
  'history:uptime',
  'history:latency',
  'history:outages',
  'history:summary',
  'history:allSummaries',
  // Database
  'db:stats',
  // Export
  'export:csv',
  'export:html',
  'export:saveFile',
  // Retention
  'retention:getStats',
  'retention:applyPolicy',
  // Alert configuration
  'alertConfig:get',
  'alertConfig:getAll',
  'alertConfig:create',
  'alertConfig:update',
  'alertConfig:delete',
  // Alert events
  'alert:create',
  'alert:get',
  'alert:getByDevice',
  'alert:getActive',
  'alert:acknowledge',
  'alert:resolve',
  'alert:resolveDevice'
]
```

**Rationale:** Whitelisting prevents arbitrary channel access. Only registered handlers can receive messages, reducing attack surface.

## IPC Communication Patterns

### Pattern 1: Request-Response (invoke/handle)

Used for database operations and control commands. The renderer invokes a method; the main process handles it and returns a promise.

**Preload Bridge:** `@c:\Users\Greg\Desktop\Projects\network-device-monitor\src\preload\index.js:65-150`

```javascript
contextBridge.exposeInMainWorld('electronAPI', {
  // Device management
  createDevice: (deviceData) => ipcRenderer.invoke('device:create', deviceData),
  getDevices: (id) => ipcRenderer.invoke('device:read', id),
  updateDevice: (id, updates) => ipcRenderer.invoke('device:update', id, updates),
  deleteDevice: (id) => ipcRenderer.invoke('device:delete', id),
  // ...
})
```

**Main Handler:** `@c:\Users\Greg\Desktop\Projects\network-device-monitor\src\main\ipc\handlers.js:245-274`

```javascript
ipcMain.handle('device:create', async (event, data) => {
  try {
    // Validate input
    if (!validators.deviceName(data.name)) {
      throw new Error('Invalid device name: must be 1-100 characters')
    }
    
    if (!validators.ipAddress(data.ipAddress)) {
      throw new Error('Invalid IP address format')
    }
    
    // Business logic: Check for duplicate IP
    const existing = db.getDeviceByIp(data.ipAddress)
    if (existing) {
      throw new Error('IP address already exists')
    }
    
    const result = db.createDevice(data)
    return { success: true, data: result }
    
  } catch (error) {
    console.error('Error creating device:', error)
    return { success: false, error: error.message }
  }
})
```

**Key Characteristics:**
- Synchronous request-response semantics via Promises
- Automatic error propagation to renderer
- Supports multiple arguments
- Returns structured response objects with `success`, `data`, and `error` fields

### Pattern 2: Event-Based (on/send) — Active for Real-Time Ping Results

Real-time ping results are broadcast from the main process to all renderer windows. The renderer subscribes via the preload bridge.

**Preload Bridge:** `@c:\Users\Greg\Desktop\Projects\network-device-monitor\src\preload\index.js:127-149`

```javascript
contextBridge.exposeInMainWorld('electronAPI', {
  // Event listeners with cleanup
  onPingResult: (callback) => {
    const wrappedCallback = (event, ...args) => callback(...args)
    ipcRenderer.on('ping:result', wrappedCallback)
    
    // Return cleanup function
    return () => {
      ipcRenderer.removeListener('ping:result', wrappedCallback)
    }
  },
  
  // Remove listener helper
  removeListener: (channel, callback) => {
    if (VALID_CHANNELS.includes(channel)) {
      ipcRenderer.removeListener(channel, callback)
    }
  }
})
```

**Broadcast from Main Process:** `@c:\Users\Greg\Desktop\Projects\network-device-monitor\src\main\services\network-monitor.js:181-189`

```javascript
_handlePingResult(deviceId, pingData) {
  // Broadcast to renderer process
  const windows = BrowserWindow.getAllWindows()
  windows.forEach(win => {
    win.webContents.send('ping:result', {
      deviceId,
      ...pingData
    })
  })
}
```

**Renderer Subscription:** `@c:\Users\Greg\Desktop\Projects\network-device-monitor\src\renderer\App.jsx:55-66`

```javascript
useEffect(() => {
  const cleanup = window.electronAPI?.onPingResult((result) => {
    if (result && result.deviceId) {
      useDeviceStore.getState().setPingResult(result.deviceId, result)
    }
  })

  return () => {
    if (cleanup) cleanup()
  }
}, [])
```

**Key Characteristics:**
- One-to-many communication (one main, multiple renderers)
- Requires explicit cleanup to prevent memory leaks
- Wrapped callbacks strip the event object before reaching renderer code

## Validation Strategies

### Input Validation Layer

All user-facing inputs are validated in `@c:\Users\Greg\Desktop\Projects\network-device-monitor\src\main\ipc\handlers.js:15-29`:

```javascript
const validators = {
  ipAddress: (value) => {
    const ipv4 = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
    const ipv6 = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/
    return ipv4.test(value) || ipv6.test(value)
  },
  
  deviceName: (value) => {
    return value && value.length >= 1 && value.length <= 100
  },
  
  deviceType: (value) => {
    return ['server', 'router', 'printer', 'switch'].includes(value)
  }
}
```

### Validation Rules

| Field | Validation | Failure Behaviour |
|-------|-----------|-------------------|
| IP Address | IPv4 or IPv6 regex match | Throws Error with descriptive message |
| Device Name | 1-100 characters | Throws Error with length constraints |
| Device Type | Enum check against allowed values | Throws Error with allowed values list |
| Duplicate IP | Database lookup | Throws Error if IP already exists |

**Rationale:** Validation occurs in the main process (trusted) rather than preload or renderer (untrusted). This prevents validation bypass attacks.

## Error Handling Approaches

### Structured Error Responses

All handlers return consistent response objects `@c:\Users\Greg\Desktop\Projects\network-device-monitor\src\main\ipc\handlers.js:121-124`:

```javascript
return { 
  success: false, 
  error: error.message  // Sanitised error message
}
```

Successful responses follow the same pattern:

```javascript
return { 
  success: true, 
  data: result  // Database record or query results
}
```

### Error Handling Strategy

1. **Synchronous Validation Errors:** Thrown immediately, caught by try-catch, returned as `error` field
2. **Database Errors:** Caught by outer try-catch, logged to console, sanitised message returned
3. **Async Operation Failures:** Network timeouts, ping failures - recorded but do not crash handler

### Console Logging

All errors are logged on the main process for debugging:

```javascript
catch (error) {
  console.error('Error creating device:', error)  // Full stack trace in main process
  return { success: false, error: error.message }  // Sanitised message to renderer
}
```

**Rationale:** Full error details remain in the trusted main process; only sanitised messages reach the renderer.

## Memory Management

### Listener Cleanup

Event listeners must be cleaned up to prevent memory leaks. The preload API returns cleanup functions for any event-based channels:

```javascript
// Example usage (when ping:result is implemented)
const cleanup = window.electronAPI.onPingResult((data) => {
  console.log('Ping result:', data)
})

// Later, when component unmounts or monitoring stops
cleanup()  // Removes the listener
```

**Implementation:** `@c:\Users\Greg\Desktop\Projects\network-device-monitor\src\preload\index.js:132-141`

The cleanup function uses `ipcRenderer.removeListener` with the same callback reference. The application uses both request-response patterns (invoke/handle) for device CRUD and control commands, and event-based patterns (on/send) for real-time ping results broadcast from main to renderer.

## Security Best Practices Summary

| Practice | Implementation Location | Purpose |
|----------|---------------------------|---------|
| Context Isolation | `src/main/index.js:68` | Prevents renderer from accessing Node.js APIs |
| Channel Whitelisting | `src/preload/index.js:9-63` | Restricts IPC to defined channels only |
| Input Validation | `src/main/ipc/handlers.js:141-202` | Validates all inputs in trusted main process |
| Error Sanitisation | `src/main/ipc/handlers.js:129-138` | Prevents information leakage to renderer |
| Structured Responses | All handlers return `{success, data/error}` | Consistent error handling across all IPC |
| Cleanup Functions | `src/preload/index.js:132-141` | Prevents memory leaks from listeners |

## References

- **IPC Handlers:** `@c:\Users\Greg\Desktop\Projects\network-device-monitor\src\main\ipc\handlers.js`
- **Preload Bridge:** `@c:\Users\Greg\Desktop\Projects\network-device-monitor\src\preload\index.js`
- **Main Process:** `@c:\Users\Greg\Desktop\Projects\network-device-monitor\src\main\index.js`
- **Network Monitor:** `@c:\Users\Greg\Desktop\Projects\network-device-monitor\src\main\services\network-monitor.js`
- **Ping Service:** `@c:\Users\Greg\Desktop\Projects\network-device-monitor\src\main\services\ping-service.js`

---

**Document Version:** 1.0  
**Created:** 20th April 2026
