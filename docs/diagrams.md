# AMF Network Device Monitor — Key Diagrams

## 1. Flowchart: Device Monitoring Lifecycle

```mermaid
flowchart TD
    A[User Clicks Start Monitoring] --> B{Already Monitoring?}
    B -->|Yes| C[Return already-running]
    B -->|No| D{Device Exists in DB?}
    D -->|No| E[Throw not found error]
    D -->|Yes| F[Create PingService Instance]
    F --> G[Send ICMP Ping]
    G --> H{Response Received?}
    H -->|Yes| I[Log latency_ms to ping_logs]
    I --> J{Latency > Threshold?}
    J -->|Yes| K[Create/End Outage for High Latency]
    J -->|No| L[Reset Consecutive Failures]
    L --> M[Resolve Any Active Outage]
    H -->|No| N[Log Failed Ping]
    N --> O[Increment Consecutive Failures]
    O --> P{Failures >= Threshold?}
    P -->|Yes| Q[Create Outage Record]
    P -->|No| R[Continue Monitoring]
    K --> S[Broadcast ping:result to UI]
    M --> S
    R --> T[Schedule Next Ping via setTimeout]
    S --> T
    T --> G
    Q --> S
    T --> U{User Clicks Stop?}
    U -->|Yes| V[AbortController.stop]
    U -->|No| G
```

---

## 2. Sequence Diagram: Add Device and Start Monitoring

```mermaid
sequenceDiagram
    actor User
    participant React as React Component
    participant Preload as Preload Script
    participant IPC as IPC Main Handler
    participant NM as NetworkMonitor
    participant Ping as PingService
    participant DB as Database
    participant BW as BrowserWindow

    User->>React: Enter name & IP, click Add Device
    React->>Preload: window.electronAPI.createDevice({name, ipAddress})
    Preload->>IPC: ipcRenderer.invoke('device:create', data)
    IPC->>IPC: Validate name, IP, deviceType
    IPC->>DB: INSERT INTO devices
    DB-->>IPC: deviceId
    IPC->>DB: createAlertConfiguration(deviceId)
    IPC-->>Preload: {success, data}
    Preload-->>React: Update device list

    User->>React: Click Start Monitoring
    React->>Preload: window.electronAPI.startPing(deviceId, ipAddress, 5000)
    Preload->>IPC: ipcRenderer.invoke('ping:start', ...)
    IPC->>NM: networkMonitor.startMonitoring(id, ip, interval)
    NM->>DB: getDevice(deviceId)
    NM->>Ping: new PingService().start(deviceId, ip, interval, onResult)
    loop Every 5 seconds
        Ping->>Ping: ping.promise.probe(ipAddress)
        Ping->>DB: db.recordPing(pingData)
        Ping->>Ping: _handleOutage() / _resolveOutage()
        Ping-->>NM: onResult(pingData)
        NM->>NM: _handlePingResult(deviceId, pingData)
        NM->>BW: win.webContents.send('ping:result', data)
        BW->>Preload: ipcRenderer.on('ping:result')
        Preload->>React: setPingResult(deviceId, result)
    end
```

---

## 3. Entity Relationship Diagram: Database Schema

```mermaid
erDiagram
    DEVICES ||--o{ PING_LOGS : generates
    DEVICES ||--o{ OUTAGES : experiences
    DEVICES ||--o| ALERT_CONFIGURATIONS : configures
    DEVICES ||--o{ ALERTS : triggers

    DEVICES {
        int id PK
        string name
        string ip_address
        string device_type
        string location
        boolean is_active
        datetime created_at
    }

    PING_LOGS {
        int id PK
        int device_id FK
        float latency_ms
        boolean success
        boolean packet_loss
        datetime timestamp
    }

    OUTAGES {
        int id PK
        int device_id FK
        datetime start_time
        datetime end_time
        int duration_seconds
        string severity
    }

    ALERT_CONFIGURATIONS {
        int id PK
        int device_id FK
        boolean enabled
        int latency_threshold_ms
        int consecutive_failures_threshold
        int packet_loss_threshold_pct
        string latency_severity
        string failures_severity
        string packet_loss_severity
        datetime updated_at
    }

    ALERTS {
        int id PK
        int device_id FK
        string alert_type
        string severity
        string status
        string message
        string threshold_value
        string actual_value
        datetime created_at
        datetime acknowledged_at
        datetime resolved_at
    }
```
