# KSB Evidence Portfolio — Sprint 6

**Project:** AMF Network Device Monitor
**Apprenticeship:** Level 4 Software Developer
**Organisation:** JJ Confederation Ltd
**Date:** 23 June 2026
**Version:** 1.0 (Production Release)

---

## 1. Evidence Narrative (500 words)

Over six sprints, I designed and built the AMF Network Device Monitor — a cross-platform desktop application for real-time network infrastructure monitoring. The project demonstrates my ability to work through the full software development lifecycle, from requirements gathering and architecture decisions to production deployment and security verification.

I chose Electron with React for the frontend because it allowed me to leverage modern web technologies while delivering a native desktop experience. For the backend, I selected `better-sqlite3` over traditional client-server databases because the requirement was for purely local, offline-first data storage. This decision eliminated network dependency and simplified deployment for JJ Confederation's IT administrators.

Security was a primary concern throughout. I implemented strict IPC channel whitelisting via `contextBridge`, disabled `nodeIntegration`, enabled `contextIsolation`, and configured Content Security Policy headers. During Sprint 6, I discovered and fixed a SQL injection vulnerability in the retention policy queries where `retentionDays` was interpolated directly into SQL strings. I replaced this with parameterised queries and added defence-in-depth validation at the database layer.

Testing was embedded from Sprint 1. I wrote 504 tests across 22 suites using Jest and React Testing Library, covering unit tests for business logic (alert engine, ping service, export service), integration tests for IPC flows, and security tests for input validation. While overall coverage sits at 28%, the core business logic files exceed 80% coverage, with alert-engine at 93% and ping-service at 81%. The gap is in renderer stores and IPC handlers, which require complex Electron mocking in ESM mode — a known limitation I documented with a post-release improvement plan.

The user interface was built with accessibility in mind: ARIA labels on all interactive elements, keyboard-navigable forms, colour-coded status indicators with text alternatives, and a responsive layout that works on 1366x768 displays. I implemented dark mode using CSS custom properties and a Zustand theme store with localStorage persistence.

I followed a GitHub Flow branching strategy with semantic commit messages in British English. Each pull request included a KSB evidence checklist. I maintained a comprehensive technical deep-dive document, user guide, deployment guide, and security checklist — all reviewed and updated during Sprint 6.

For deployment, I packaged the application with Electron Forge and Squirrel.Windows, producing a background-install `.exe` that creates Start Menu and Desktop shortcuts without a wizard. I verified the installer on a clean Windows environment, confirming database initialisation, shortcut creation, and clean uninstallation with user data preservation.

This portfolio demonstrates my competence across all KSB areas: logical code design (S1), user interface development (S2), testing (S4, S13), version control (S14), security (S17), and research-based decision making (B8, B9).

---

## 2. Evidence Mapping Matrix

### Skills (S1-S17)

| KSB | Description | Evidence | Location |
|-----|-------------|----------|----------|
| **S1** | Create logical and maintainable code | DatabaseManager singleton with prepared statement caching; modular IPC handler architecture | `src/main/db/database.js`, `src/main/ipc/handlers.js` |
| **S2** | Develop user interfaces | React dashboard with Recharts latency chart, dark mode toggle, responsive device cards | `src/renderer/App.jsx`, `src/renderer/components/dashboard/` |
| **S3** | Link code to data sets | SQLite schema with foreign keys, CASCADE deletes, CHECK constraints; Zustand store binding | `src/main/db/database.js`, `src/renderer/stores/deviceStore.js` |
| **S4** | Test code and analyse results | 504 tests across 22 suites; Jest configuration with coverage reporting | `jest.config.js`, `tests/` directory |
| **S5** | Debug code and fix defects | SQL injection fix in retention policy; console.error logging patterns throughout | `src/main/db/database.js` (lines 1358-1445), `src/main/services/` |
| **S6** | Understand and apply algorithms | Outage detection algorithm (consecutive failure counting); latency status categorisation | `src/main/services/alert-engine.js`, `src/renderer/utils/status.js` |
| **S7** | Interpret and implement design | Agile strategy document → implemented architecture with security, memory, and testing patterns | `docs/AMF-Network-Monitor-Agile-Strategy.md`, `docs/technical-deep-dive.md` |
| **S8** | Apply security principles | Security checklist; CSP headers; input validation; SQL parameterisation; IPC whitelist | `docs/security-checklist.md`, `src/main/index.js:103-139` |
| **S9** | Apply access and security controls | Device name length limits; IP regex validation; path traversal prevention on exports | `src/main/ipc/handlers.js:142-199` |
| **S10** | Apply human-centred design | Toast notifications for alerts; confirmation modals for destructive actions; empty states | `src/renderer/App.jsx`, `src/renderer/components/alerts/ToastNotifications.jsx` |
| **S11** | Apply statutory and regulatory requirements | Data retention policy (30-day default); user data export; local-only storage (GDPR-friendly) | `src/main/db/database.js`, `src/renderer/components/export/ExportManager.jsx` |
| **S12** | Apply privacy by design | No telemetry or analytics; all data stays local; no cloud transmission | `docs/security-checklist.md` Section 8.1 |
| **S13** | Create and analyse test scenarios | Integration tests for export pipeline, IPC lifecycle, device CRUD | `tests/integration/` |
| **S14** | Apply version control | GitHub Flow with semantic commits; branch protection; PR templates | `docs/technical-deep-dive.md` Section 6 |
| **S15** | Apply structured problem-solving | Debug flow: identify SQL injection → parameterise → validate → verify with grep | `docs/retrospectives/sprint-06-coverage-verification.md` |
| **S16** | Communicate technical information | User guide, deployment guide, technical deep-dive, README, security checklist | `docs/` directory |
| **S17** | Apply secure coding practices | Context isolation, sandbox, CSP, channel whitelisting, input sanitisation, prepared statements | `src/main/index.js`, `src/preload/index.js`, `src/main/ipc/handlers.js` |

### Knowledge (K1-K12)

| KSB | Description | Evidence | Location |
|-----|-------------|----------|----------|
| **K1** | Software development lifecycle | Sprint-based delivery with retrospectives; 6 sprints from MVP to production | `docs/retrospectives/` |
| **K2** | Roles in software development | Solo developer with Product Owner feedback; documented sign-off process | `docs/retrospectives/sprint-06-remaining-tasks.md` |
| **K3** | Software design principles | Separation of concerns (main/renderer/preload); singleton pattern for database | `docs/technical-deep-dive.md` Section 2 |
| **K4** | Software development approaches | Agile with Kanban-style board; user stories with Gherkin acceptance criteria | `docs/technical-deep-dive.md` Section 7 |
| **K5** | Software testing approaches | Unit, integration, and security testing; coverage reporting; mocking | `jest.config.js`, `tests/` |
| **K6** | Software deployment | Electron Forge + Squirrel.Windows installer; background installation without wizard | `docs/deployment-guide.md` |
| **K7** | Software design patterns | Singleton (DatabaseManager), Observer (IPC events), Factory (AlertEngine) | `docs/technical-deep-dive.md` Section 4 |
| **K8** | Software security | OWASP-based security checklist; defence in depth; least privilege | `docs/security-checklist.md` |
| **K9** | Database systems | SQLite with better-sqlite3; prepared statements; schema constraints | `src/main/db/database.js` |
| **K10** | Human-centred design | Personas (Alex, Sarah); accessibility requirements; colour + icon redundancy | `docs/technical-deep-dive.md` Section 7 |
| **K11** | Communication | British English throughout; JSDoc comments; markdown documentation | All `docs/` and `src/` |
| **K12** | Continuous improvement | Retrospectives per sprint; post-release maintenance plan for coverage and Electron upgrade | `docs/retrospectives/` |

### Behaviours (B1-B9)

| KSB | Description | Evidence | Location |
|-----|-------------|----------|----------|
| **B1** | Works independently | Self-directed sprints; solo architecture decisions; independent security audit | `docs/technical-deep-dive.md` |
| **B2** | Takes responsibility | Security checklist ownership; documented npm audit findings honestly | `docs/security-checklist.md` |
| **B3** | Shows initiative | Added dark mode, toast notifications, and installer packaging beyond initial requirements | `src/renderer/stores/themeStore.js`, `src/renderer/App.jsx` |
| **B4** | Commits to organisational goals | Built for JJ Confederation Ltd's specific network monitoring needs | Project README |
| **B5** | Shows attention to detail | IP validation regex covers IPv4 and IPv6; device type enum enforcement | `src/main/ipc/handlers.js` |
| **B6** | Shows resilience | Coverage gap identified and documented with improvement plan rather than hiding it | `docs/retrospectives/sprint-06-coverage-verification.md` |
| **B7** | Adapts to change | Pivot from Tauri to Electron based on research; adapted CSP for Vite/React requirements | `docs/technical-deep-dive.md` Section 1.1 |
| **B8** | Demonstrates ability to research | Technology comparison matrix (Electron vs Tauri vs WPF); library evaluations | `docs/technical-deep-dive.md` Section 1 |
| **B9** | Shows curiosity | Explored Zustand state management, Recharts visualisation, and Electron Forge packaging | `package.json`, `src/renderer/stores/` |

---

## 3. Code Snippet Selection

### Snippet 1: IPC Channel Whitelist (S17 — Secure Coding)

```javascript
// src/preload/index.js:9
const VALID_CHANNELS = [
  'device:create', 'device:read', 'device:update', 'device:delete',
  'ping:start', 'ping:stop', 'ping:startAll', 'ping:stopAll',
  'outage:getActive', 'outage:getHistory', 'export:csv', 'export:html',
  // ... 45 channels total
]

contextBridge.exposeInMainWorld('electronAPI', {
  createDevice: (deviceData) => ipcRenderer.invoke('device:create', deviceData),
  // Named methods only — no generic invoke wrapper exposed
})
```

**Caption:** Demonstrates defence-in-depth by whitelisting all 45 IPC channels and exposing only named wrapper methods via `contextBridge`, preventing arbitrary IPC invocation from the renderer.

---

### Snippet 2: SQL Parameterisation Fix (S17, S5 — Security & Debugging)

```javascript
// src/main/db/database.js:1358-1375
applyPingHistoryRetention(retentionDays = 30) {
  if (!Number.isInteger(retentionDays) || retentionDays < 1 || retentionDays > 365) {
    throw new Error('Invalid retention days')
  }
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays)
  const cutoffIso = cutoffDate.toISOString()

  const deleteStmt = this.db.prepare(`DELETE FROM ping_logs WHERE timestamp < ?`)
  const result = deleteStmt.run(cutoffIso)
  // ...
}
```

**Caption:** Shows root-cause fix for a SQL injection vulnerability found during Sprint 6 security audit. Replaced string interpolation with JavaScript date computation and a parameterised `?` placeholder.

---

### Snippet 3: CSP Header Configuration (S8 — Security Principles)

```javascript
// src/main/index.js:118-137
session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
  callback({
    responseHeaders: {
      ...details.responseHeaders,
      'Content-Security-Policy': [
        "default-src 'self'; script-src 'self' 'unsafe-inline'; " +
        "style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data: https:"
      ]
    }
  })
})
```

**Caption:** Configures strict Content Security Policy headers to prevent XSS, mixed content, and unauthorized external resource loading, tailored for a React + Vite production build.

---

### Snippet 4: Alert Engine State Machine (S6 — Algorithms)

```javascript
// src/main/services/alert-engine.js:27-69
async processPingResult(deviceId, pingData) {
  const db = await getDatabase()
  const config = db.getAlertConfiguration(deviceId)
  if (!config || !config.enabled) return

  let state = this.deviceStates.get(deviceId)
  if (!state) {
    state = { consecutiveFailures: 0, lastSuccessfulPing: null, recentPings: [] }
    this.deviceStates.set(deviceId, state)
  }

  state.recentPings.push(pingData.success)
  if (state.recentPings.length > 10) state.recentPings.shift()

  const packetLossPct = this._calculatePacketLoss(state.recentPings)
  if (packetLossPct !== null && packetLossPct > config.packetLossThresholdPct) {
    this._createAlertIfNeeded(db, deviceId, 'packet_loss', ...)
  }

  if (pingData.success) {
    state.consecutiveFailures = 0
    if (pingData.latencyMs !== null && pingData.latencyMs > config.latencyThresholdMs) {
      this._createAlertIfNeeded(db, deviceId, 'latency', ...)
    }
  } else {
    state.consecutiveFailures++
    if (state.consecutiveFailures >= config.consecutiveFailureThreshold) {
      this._createAlertIfNeeded(db, deviceId, 'consecutive_failures', ...)
    }
  }
}
```

**Caption:** Implements a stateful alert evaluation engine with sliding-window packet loss tracking (10-ping rolling buffer), consecutive failure counting, and configurable threshold breaches for latency, consecutive failures, and packet loss.

---

### Snippet 5: Input Validation (S9 — Access Controls)

```javascript
// src/main/ipc/handlers.js:141-202
const validators = {
  ipAddress: (value) => {
    const ipv4 = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
    const ipv6 = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/
    return ipv4.test(value) || ipv6.test(value)
  },

  hostname: (value) => {
    if (!value || value.length > 253 || value.length < 1) return false
    const labels = value.split('.')
    const labelRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/
    for (const label of labels) {
      if (!labelRegex.test(label)) return false
    }
    return true
  },

  networkAddress: async (value) => {
    if (validators.ipAddress(value)) return true
    if (validators.hostname(value)) {
      try {
        await new Promise((resolve, reject) => {
          dns.lookup(value, (err, address) => {
            if (err) reject(err)
            else resolve(address)
          })
        })
        return true
      } catch { return false }
    }
    return false
  },

  deviceName: (value) => {
    return value && value.length >= 1 && value.length <= 100
  },

  deviceType: (value) => {
    return ['server', 'router', 'printer', 'switch'].includes(value)
  }
}
```

**Caption:** Validates network addresses with dual regex (IPv4/IPv6) and DNS hostname resolution fallback, plus length constraints on device names to prevent injection and overflow.

---

### Snippet 6: Export Sanitisation (S8 — Security)

```javascript
// src/main/services/export-service.js:17-68
class BasicHtmlSanitiser {
  static dangerousTags = new Set([
    'script', 'iframe', 'object', 'embed', 'form', 'input', 'textarea',
    'button', 'select', 'option', 'link', 'meta', 'style'
  ])

  static dangerousAttributes = new Set([
    'onclick', 'onload', 'onerror', 'onmouseover', 'onfocus',
    'javascript:', 'vbscript:', 'data:', 'src', 'href', 'action'
  ])

  static sanitise(html) {
    if (!html || typeof html !== 'string') return ''

    let sanitised = html
    for (const tag of this.dangerousTags) {
      const regex = new RegExp(`<\\s*${tag}\\b[^>]*>.*?<\\s*/\\s*${tag}\\s*>`, 'gis')
      sanitised = sanitised.replace(regex, '')
      const selfClosingRegex = new RegExp(`<\\s*${tag}\\b[^>]*/?\\s*>`, 'gis')
      sanitised = sanitised.replace(selfClosingRegex, '')
    }

    const attributeRegex = /\s+(\w+)=("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/gi
    sanitised = sanitised.replace(attributeRegex, (match, attrName) => {
      return this.dangerousAttributes.has(attrName.toLowerCase()) ? '' : match
    })

    sanitised = sanitised.replace(/(javascript|vbscript):/gi, '')
    sanitised = sanitised.replace(/data:[^;]*;base64,[a-zA-Z0-9+/=]+/gi, '[data-URL-removed]')

    return sanitised.trim()
  }
}
```

**Caption:** Prevents XSS in exported HTML reports through a defence-in-depth `BasicHtmlSanitiser` class that removes dangerous tags and attributes, strips JavaScript/VBScript protocols, and replaces embedded data URLs before writing to file.

---

### Snippet 7: Zustand Theme Store (S2 — UI, S3 — Data)

```javascript
// src/renderer/stores/themeStore.js:18-36
export const useThemeStore = create(
  persist(
    (set, get) => ({
      theme: 'light',
      toggleTheme: () => {
        const newTheme = get().theme === 'light' ? 'dark' : 'light'
        set({ theme: newTheme, useSystemPreference: false })
        get().applyTheme(newTheme)
      },
      // ...
    }),
    { name: 'amf-theme-storage' }
  )
)
```

**Caption:** Manages application theme state with Zustand and localStorage persistence, providing toggle and system-preference detection for a consistent user experience.

---

### Snippet 8: Windows Installer Squirrel Events (K6 — Deployment)

```javascript
// src/main/index.js:31-55
function handleSquirrelEvent() {
  if (process.platform !== 'win32') return false

  const execPath = process.execPath
  const updateExe = path.resolve(path.dirname(execPath), '..', 'Update.exe')
  const exeName = path.basename(execPath)

  const cmd = process.argv[1]
  switch (cmd) {
    case '--squirrel-install':
    case '--squirrel-updated':
      spawnSync(updateExe, ['--createShortcut', exeName], { detached: true })
      return true
    case '--squirrel-uninstall':
      spawnSync(updateExe, ['--removeShortcut', exeName], { detached: true })
      return true
    case '--squirrel-obsolete':
      return true
    default:
      return false
  }
}

if (handleSquirrelEvent()) {
  app.quit()
}
```

**Caption:** Handles Squirrel.Windows install/uninstall lifecycle events by delegating shortcut creation and removal to the bundled `Update.exe`, ensuring correct Start Menu and Desktop shortcut management during background installation.

---

## 4. Screenshot Compilation Guide

The following screenshots should be captured from the production build (`npm run build && npm run make`) to support EPA evidence. Each screenshot maps to specific KSBs.

| # | Screenshot | KSBs | Capture Instructions |
|---|-----------|------|---------------------|
| 1 | **Dashboard overview** — all summary cards visible with devices online and offline | S2, S10, K10 | Start monitoring 2-3 devices. Let one fail. Capture full dashboard. |
| 2 | **Latency chart** — Recharts line chart showing real-time latency trends | S2, S6, K10 | Monitor 2+ devices for 2 minutes. Capture the chart section. |
| 3 | **Add Device form** — filled and ready to submit | S2, S10 | Open app, scroll to Add Device, fill in name and IP. |
| 4 | **Device list with status badges** — green online badge and red offline badge side by side | S2, S10 | Monitor one reachable and one unreachable device. |
| 5 | **Edit device modal** — dropdown showing device types | S2, S9 | Click Edit on any device. |
| 6 | **Delete confirmation modal** | S10 | Click Delete on any device. |
| 7 | **Historical Analysis** — query builder with date range and filtered results | S2, S3, S11 | Select a date range and apply filters. |
| 8 | **Outage timeline** — coloured bars showing outage durations | S2, S6 | Generate or wait for an outage, then view Outage Analysis. |
| 9 | **Export Manager** — CSV generation with template selection | S2, S11 | Select a data type, choose CSV, click Generate. |
| 10 | **Alert Configuration** — thresholds set for a device | S2, S8, S17 | Select a device and set custom thresholds. |
| 11 | **Active Alerts panel** — toast notification visible | S2, S8, S10 | Trigger an alert by setting a very low latency threshold. |
| 12 | **Dark mode toggle** — app in dark theme | S2, S3, B3 | Click the moon/sun toggle button. |
| 13 | **Windows Start Menu shortcut** | K6 | Open Start Menu, show `JJ Confederation Ltd\amf-network-monitor`. |
| 14 | **Windows installed apps list** | K6 | Settings > Apps > Installed apps, show `amf-network-monitor`. |
| 15 | **npm test output** — all tests passing | S4, S13, S14 | Run `npm test` in terminal, capture final summary. |
| 16 | **Security checklist (Section 1)** | S8, S17, K8 | Open `docs/security-checklist.md` in VS Code, show Section 1 with all ✅. |

**Annotation guidance:** Add red callout boxes and numbered labels to each screenshot highlighting the specific UI elements that demonstrate the mapped KSB.

---

## 5. Verification Checklist

- [x] KSB evidence narrative written (500 words)
- [x] Evidence mapping matrix covers S1-S17, K1-K12, B1-B9
- [x] 8 code snippets selected with captions and KSB links
- [x] 16-screenshot compilation guide with capture instructions
- [x] All evidence references real file paths and line numbers
- [x] British English used throughout
- [x] No sensitive data (IPs, passwords) exposed in snippets

---

**Portfolio assembled by:** Developer
**Date:** 23 June 2026
**Next review:** EPA submission
