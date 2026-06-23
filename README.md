# AMF Network Device Monitor

A desktop application for real-time network infrastructure monitoring, built with Electron, React, and SQLite.

**Status:** Production-ready (v1.0.0) — Real-time monitoring, outage detection, historical analysis, data export, alerting, and Windows installer packaging complete.

---

## Clone & Run

```bash
# Clone the repository
git clone https://github.com/Interlaken0/network-device-monitor.git

# Navigate to project folder
cd network-device-monitor

# Install dependencies
npm install

# Start the application
npm run dev
```

---

## Quick Start

### Prerequisites
- **Node.js** 18.x or higher
- **npm** (comes with Node.js)
- **Windows Build Tools** (for better-sqlite3 on Windows):
  ```powershell
  # Install Visual Studio Build Tools with C++ workload
  npm install --global windows-build-tools
  # OR install via Visual Studio Installer
  ```

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Interlaken0/network-device-monitor.git
   cd network-device-monitor
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

   > **Note:** On Windows, `better-sqlite3` may need to be rebuilt:
   > ```bash
   > npx electron-rebuild
   > ```

---

## Running the Application

### Development Mode

Run the app in development mode with hot-reload:

```bash
npm run dev
```

This will:
- Start the Vite dev server at `http://localhost:5173/`
- Launch the Electron app
- Open the AMF Network Monitor window

**What to expect:**
- Database initialised at: `%APPDATA%/amf-network-monitor/network-monitor.sqlite`
- Console output showing database status
- React DevTools available via `Ctrl+Shift+I`

### Testing the MVP

1. **Add a device:**
   - Enter Name: `Router`
   - Enter IP: `192.168.1.1` (or any IP you want to monitor)
   - Click **"Add Device"**

2. **Start monitoring:**
   - Click the **"Start Monitoring"** button on your device
   - Ping results will appear in real-time

3. **Stop monitoring:**
   - Click **"Stop"** to end ping monitoring

4. **Delete device:**
   - Click **"Delete"** to remove the device from the database

---

## Building for Production

### Build the application:
```bash
npm run build
```

This creates the production bundles in the `app/` directory:
- `app/main/` - Main process code
- `app/preload/` - Preload script
- `app/renderer/` - React frontend (generated on build)

### Package the app:
```bash
npm run package
```

Creates distributable packages in `dist/`.

---

## Testing

### Run all tests:
```bash
npm test
```

Runs Jest tests including:
- Database CRUD operations
- Ping service validation
- Network monitor functionality
- Input validators

### Test coverage:
```bash
npm run test:coverage
```

Generates coverage report in `coverage/` directory.

---

## Project Structure

```
network-device-monitor/
├── docs/                       # Documentation
│   ├── agile-strategy.md       # Sprint planning & SDLC
│   ├── technical-deep-dive.md  # Architecture decisions
│   └── user-stories.md         # User stories and acceptance criteria
├── src/
│   ├── main/                   # Electron main process
│   │   ├── index.js            # App entry point, window creation
│   │   ├── db/
│   │   │   └── database.js     # SQLite database manager
│   │   ├── ipc/
│   │   │   └── handlers.js     # IPC communication handlers
│   │   ├── services/
│   │   │   ├── network-monitor.js  # Multi-device coordinator
│   │   │   ├── ping-service.js     # ICMP ping implementation
│   │   │   └── export-service.js   # CSV/HTML export generation
│   ├── preload/                # Preload scripts
│   │   └── index.js            # Secure API bridge
│   └── renderer/               # React frontend
│       ├── App.jsx             # Main application component
│       ├── App.css             # Styles
│       ├── index.html          # HTML entry point
│       ├── stores/
│       │   ├── deviceStore.js  # Zustand store (devices, outages, historical data)
│       │   └── themeStore.js   # Theme management
│       ├── components/
│       │   ├── Dashboard.jsx           # Real-time device monitoring
│       │   ├── DeviceStatusCard.jsx    # Individual device status display
│       │   ├── LatencyChart.jsx        # Real-time latency line chart
│       │   ├── QueryBuilder.jsx        # Historical data filters
│       │   ├── HistoricalAnalysis.jsx  # Historical dashboard
│       │   ├── SummaryCards.jsx        # Aggregated statistics
│       │   ├── OutageAnalysis.jsx      # Outage reports & drill-down
│       │   ├── OutageTimeline.jsx      # Visual outage timeline
│       │   ├── ExportManager.jsx       # CSV/HTML export UI
│       │   └── ToastNotifications.jsx  # Event notifications
│       └── utils/
│           ├── chart-theme.js  # Theme-aware chart colours
│           └── status.js       # Status colour helpers
├── tests/
│   ├── unit/                   # Unit tests
│   │   ├── database.test.js
│   │   ├── database-aggregations-integration.test.js
│   │   ├── ping-service.test.js
│   │   ├── network-monitor.test.js
│   │   ├── outage-detection.test.js
│   │   ├── sprint4-components.test.js
│   │   ├── sprint4-security.test.js
│   │   └── validators.test.js
│   └── mocks/                  # Test mocks
├── app/                        # Build output (generated on first build)
├── electron.vite.config.js     # Vite configuration
├── jest.config.js              # Jest test configuration
└── package.json                # Dependencies & scripts
```

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot-reload |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run package` | Create packaged app |
| `npm run make` | Create distributables for current platform |
| `npm test` | Run Jest tests |
| `npm run lint` | Run ESLint |

---

## Troubleshooting

### Issue: `better-sqlite3` build fails

**Error:** `gyp ERR! build error` or `MSBuild.exe failed`

**Solution:**
```bash
# Windows: Install build tools
npm install --global windows-build-tools

# Or manually rebuild
npm rebuild better-sqlite3
npx electron-rebuild
```

### Issue: "Cannot find package 'better-sqlite3'"

**Solution:**
```bash
npm install better-sqlite3
npx electron-rebuild -f -w better-sqlite3
```

### Issue: Preload script not loading

**Error:** `Unable to load preload script` or `SyntaxError: Cannot use import statement`

**Solution:** Ensure preload is built as CommonJS:
```bash
npm run build
```

The preload script should output to `app/preload/index.cjs` (not `.mjs`).

### Issue: Database "not available" on startup

**Solution:** Check the terminal output. The app will still run but without persistence. Fix the native module build as above.

---

## Key Features

### Sprint 1 — Real-time Monitoring MVP
- **Electron desktop app** with React UI
- **SQLite database** for device and ping data persistence
- **ICMP ping monitoring** with configurable intervals
- **Device CRUD** — Add, edit, delete network devices
- **Real-time latency display** with colour-coded status
- **Cross-platform** (Windows, macOS, Linux via Electron)
- **Secure IPC** with context isolation and sandbox
- **Unit testing** with Jest

### Sprint 2 — Outage Detection & Device Management
- **Device editing/updating** with inline forms
- **Outage detection engine** — automatic outage creation when pings fail
- **Outage timeline** — visual timeline of downtime events
- **Theme switching** — light and dark mode support
- **Toast notifications** for device events

### Sprint 4 — Historical Analysis & Reporting
- **Query Builder** — Filter historical data by date range, device, and aggregation type
- **Historical Analysis Dashboard** — Summary cards, latency charts, and device breakdown tables
- **Outage Analysis** — Severity breakdown charts, device availability percentages, and drill-down outage details
- **Export Manager** — Export ping logs and outages to CSV or HTML report templates (Uptime, Latency, Outage)
- **Virtual scrolling** on large data tables for performance
- **Security hardening** — Rate limiting on exports, input sanitisation, path traversal prevention
- **504 tests** across 22 test suites covering all components, security utilities, and alert components

---

### Sprint 5 — Alerting & Notifications
- **Per-device alert threshold configuration** — latency, consecutive failures, packet loss
- **Real-time alert engine** — state management (Triggered → Unacknowledged → Acknowledged → Resolved)
- **Toast notifications** — critical alerts persist until dismissed
- **Alert history log** — full audit trail with acknowledgement and resolution timestamps
- **Active alerts panel** — real-time sidebar showing all unacknowledged alerts

### Sprint 6 — Production Readiness
- **Windows installer** — Squirrel.Windows setup.exe with Start Menu and Desktop shortcuts
- **Auto-updater stub** — checks for updates on launch (server not configured)
- **Security checklist** — full pre-release audit with documented findings
- **SQL injection fix** — parameterised retention policy queries
- **Build integrity** — source maps disabled, DevTools blocked in production
- **User guide, deployment guide, and technical documentation** — complete

---

## Post-Release Maintenance

- Upgrade Electron to v40+ to resolve ASAR integrity advisory
- Evaluate removal of unused `sqlite3` and `sqlite` devDependencies
- Obtain code-signing certificate for SmartScreen compatibility

---

## License

This project is developed as part of a Level 4 Software Developer apprenticeship.

**Organisation:** JJ Confederation Ltd  
**Developer:** Apprentice Software Developer
