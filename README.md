# AMF Network Device Monitor

A desktop application for real-time network infrastructure monitoring, built with Electron, React, and SQLite.

**Sprint 1 Status:** MVP Complete - Single/Multi-device monitoring with database persistence

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

This creates the production bundles in the `out/` directory:
- `out/main/` - Main process code
- `out/preload/` - Preload script
- `out/renderer/` - React frontend (generated on build)

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
npm test -- --coverage
```

Generates coverage report in `coverage/` directory.

---

## Project Structure

```
network-device-monitor/
├── docs/                       # Documentation
│   ├── agile-strategy.md       # Sprint planning & SDLC
│   └── technical-deep-dive.md  # Architecture decisions
├── src/
│   ├── main/                   # Electron main process
│   │   ├── index.js            # App entry point, window creation
│   │   ├── database.js         # SQLite database manager
│   │   ├── ipc-handlers.js     # IPC communication handlers
│   │   ├── network-monitor.js  # Multi-device coordinator
│   │   └── ping-service.js     # ICMP ping implementation
│   ├── preload/                # Preload scripts
│   │   └── index.js            # Secure API bridge
│   └── renderer/               # React frontend
│       ├── App.jsx             # Main application component
│       ├── App.css             # Styles
│       └── index.html          # HTML entry point
├── tests/
│   ├── unit/                   # Unit tests
│   │   ├── database.test.js
│   │   ├── ping-service.test.js
│   │   ├── network-monitor.test.js
│   │   └── validators.test.js
│   └── mocks/                  # Test mocks
├── out/                        # Build output (generated on first build)
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

The preload script should output to `out/preload/index.cjs` (not `.mjs`).

### Issue: Database "not available" on startup

**Solution:** Check the terminal output. The app will still run but without persistence. Fix the native module build as above.

---

## Key Features (Sprint 1 MVP)

- **Electron desktop app** with React UI
- **SQLite database** for device and ping data persistence
- **ICMP ping monitoring** with configurable intervals
- **Device CRUD** - Add, list, delete network devices
- **Real-time latency display** with color-coded status
- **Cross-platform** (Windows, macOS, Linux support via Electron)
- **Secure IPC** with context isolation and sandbox
- **Unit testing** with Jest

---

## Next Steps (Sprint 2)

- [ ] Device editing/updating
- [ ] Advanced query dashboard (average latency, uptime stats)
- [ ] Historical data visualisation
- [ ] Alert thresholds and notifications

---

## License

This project is developed as part of a Level 4 Software Developer apprenticeship.

**Organisation:** JJ Confederation Ltd  
**Developer:** Apprentice Software Developer
