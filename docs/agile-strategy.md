# AMF Network Device Monitor - Agile SDLC Strategy

## 1. Executive Summary

**Project:** AMF Network Device Monitor  
**Organisation:** JJ Confederation Ltd  
**Duration:** 12 Weeks (6 Sprints)  
**Methodology:** Agile (Scrum)  
**Apprenticeship Level:** 4 Software Developer  

This document outlines the complete software development lifecycle for building a real-time network infrastructure monitoring application. The project demonstrates advanced enterprise architecture patterns, relational database design, and modern build tooling while delivering immediate business value through proactive network visibility.

---

## 2. Business Case & Value Proposition

### Current Problem
Network troubleshooting at JJ Confederation Ltd is reactive. Infrastructure failures (routers, servers, wireless printers) are often discovered after operational impact occurs, leading to:
- Unplanned downtime
- Reduced productivity
- Emergency response costs
- Lack of historical outage data

### Proposed Solution
A desktop application providing real-time network monitoring with:
- Continuous ICMP pinging of critical infrastructure
- Colour-coded live status dashboard
- Historical latency trend analysis
- Automated outage detection and alerting

### Expected Benefits
- Proactive identification of network congestion
- Historical data for capacity planning
- Reduced mean time to detection (MTTD)
- Improved infrastructure reliability

---

## 3. Agile Framework & Governance

### 3.1 Sprint Structure
- **Duration:** 2 weeks per Sprint
- **Total Sprints:** 6 (12 weeks total)
- **Sprint Ceremonies:**
  - Sprint Planning (Day 1): 2 hours
  - Daily Standups: 15 minutes
  - Sprint Review (Day 10): 1 hour
  - Sprint Retrospective (Day 10): 1 hour

### 3.2 Roles & Responsibilities

| Role | Responsibility |
|------|----------------|
| **Product Owner** (Line Manager) | Prioritises backlog, accepts deliverables, provides business context |
| **Scrum Master** (Self) | Facilitates ceremonies, removes blockers, maintains velocity tracking |
| **Developer** (Self) | Implements features, writes tests, documents code |
| **QA** (Self + Peer Review) | Tests functionality, validates security, verifies KSB evidence |

### 3.3 Definition of Ready
A User Story is Ready when it has:
- Clear acceptance criteria (Given/When/Then format)
- Technical feasibility assessment
- Estimated story points (1, 2, 3, 5, 8)
- No external dependencies blocking start
- KSB mapping identified

### 3.4 Definition of Done
A feature is Done only when:
- Code is written and self-reviewed
- Unit tests written and passing (minimum 80% coverage)
- Integration tests passing
- Security review completed (input validation, sanitisation)
- Code committed with British English commit messages
- Feature tested in packaged .exe
- Documentation updated
- Product Owner acceptance received

---

## 4. Technical Architecture

### 4.1 Core Stack

| Layer | Technology | Justification |
|-------|------------|---------------|
| **Framework** | Electron + Node.js | Native desktop capabilities, proven in Temperature Plotter |
| **Build Tool** | Vite | Fast HMR, native module support, modern toolchain |
| **Packaging** | Electron Forge | Reliable .exe generation with native dependencies |
| **Network** | ping (npm) | Cross-platform ICMP standardisation |
| **Database** | better-sqlite3 | Synchronous SQLite, relational storage, KSB compliance |
| **UI** | React + Recharts | Component reusability, proven charting library |
| **State** | Zustand | Lightweight, performant state management |
| **Testing** | Jest | Industry standard, mocking capabilities |

### 4.2 Security Architecture (Inherited from Temperature Plotter)

```javascript
// Main Process Security
{
  nodeIntegration: false,    // No direct Node.js access
  sandbox: true,             // Process isolation
  contextIsolation: true,    // Secure IPC bridge
  preload: path.join(__dirname, 'preload.js')
}

// Preload.js - Secure Context Bridge
contextBridge.exposeInMainWorld('networkAPI', {
  startMonitoring: (ip) => ipcRenderer.invoke('network:start', ip),
  stopMonitoring: () => ipcRenderer.invoke('network:stop'),
  onPingResult: (callback) => ipcRenderer.on('network:result', callback)
});
```

### 4.3 Database Schema Design

```sql
-- devices: Static infrastructure configuration
CREATE TABLE devices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    ip_address TEXT UNIQUE NOT NULL,
    device_type TEXT CHECK(device_type IN ('server', 'router', 'printer', 'switch')),
    location TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ping_logs: Time-series latency measurements
CREATE TABLE ping_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id INTEGER NOT NULL,
    latency_ms REAL,
    success BOOLEAN NOT NULL,
    packet_loss BOOLEAN DEFAULT 0,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(device_id) REFERENCES devices(id) ON DELETE CASCADE
);

-- outages: Aggregated downtime events
CREATE TABLE outages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id INTEGER NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME,
    duration_seconds INTEGER,
    severity TEXT CHECK(severity IN ('critical', 'warning', 'info')),
    FOREIGN KEY(device_id) REFERENCES devices(id) ON DELETE CASCADE
);

-- indexes: Query optimisation
CREATE INDEX idx_ping_logs_device_time ON ping_logs(device_id, timestamp);
CREATE INDEX idx_ping_logs_timestamp ON ping_logs(timestamp);
CREATE INDEX idx_outages_device ON outages(device_id);
```

### 4.4 Memory Management Patterns

**Singleton Database Connection:**
```javascript
// database.js - Single persistent connection
const Database = require('better-sqlite3');
let dbInstance = null;

function getDatabase() {
  if (!dbInstance) {
    const dbPath = path.join(app.getPath('userData'), 'network-monitor.sqlite');
    dbInstance = new Database(dbPath);
    initialiseSchema(dbInstance);
  }
  return dbInstance;
}
```

**IPC Cleanup Pattern:**
```javascript
// preload.js - Proper listener management
removeListener: (channel, callback) => {
  ipcRenderer.removeListener(channel, callback);
}
```

---

## 5. Sprint-by-Sprint Breakdown

### Sprint 1: Foundation & MVP (Weeks 1-2)
**Goal:** Working single-IP monitor with database persistence

**User Stories:**
1. **Setup:** Initialise Electron project with Vite build pipeline (3 pts)
   - Configure Electron security settings
   - Setup development environment
   - Create project structure
   
2. **Database:** Design and initialise SQLite schema (3 pts)
   - Create devices table
   - Create ping_logs table
   - Implement connection singleton
   
3. **Network Core:** Implement ICMP ping functionality (5 pts)
   - Integrate ping library
   - Handle cross-platform differences
   - Implement error handling for unreachable hosts
   
4. **MVP UI:** Single IP monitoring display (3 pts)
   - Basic React component
   - Display current latency
   - Simple start/stop controls
   
5. **Testing:** Unit test framework setup (2 pts)
   - Configure Jest
   - Write initial ping tests with mocks

**Sprint 1 Deliverable:** Functional application monitoring one hardcoded IP address with data persistence.

**KSBs Addressed:** S1, S10, K1, K9, K10

---

### Sprint 2: Device Management & Configuration (Weeks 3-4)
**Goal:** Dynamic device configuration with CRUD operations

**User Stories:**
1. **Device CRUD:** Add/edit/delete network devices (5 pts)
   - Form validation with IP address regex
   - Input sanitisation
   - Device type selection
   
2. **Device List:** Display configured devices (3 pts)
   - Table view with status
   - Sort and filter capabilities
   
3. **Monitoring Engine:** Multi-device ping scheduling (5 pts)
   - Interval-based pinging
   - Concurrent monitoring
   - Resource management
   
4. **Database Layer:** Advanced queries (3 pts)
   - Device retrieval with latest status
   - Average latency calculations
   
5. **Testing:** Database unit tests (2 pts)
   - In-memory SQLite testing
   - CRUD operation validation

**Sprint 2 Deliverable:** Users can add multiple devices; application monitors all configured IPs concurrently.

**KSBs Addressed:** S1, S3, S4, S7, K10

---

### Sprint 3: Dashboard & Visualisation (Weeks 5-6)
**Goal:** Real-time dashboard with historical charts

**User Stories:**
1. **Status Dashboard:** Live device status cards (5 pts)
   - Colour-coded status (green/yellow-amber/orange/red)
   - Current latency display
   - Packet loss indicator
   
2. **Latency Charts:** Real-time Recharts integration (5 pts)
   - Line chart of latency over time
   - Time range selection (5min, 1hr, 24hr)
   - Chart performance optimisation
   
3. **Outage Detection:** Automatic outage identification (3 pts)
   - Threshold-based detection
   - Outage logging to database
   - Severity classification
   
4. **Zustand Integration:** State management (3 pts)
   - Store design
   - Action creators
   - Selector optimisation
   
5. **Accessibility:** WCAG compliance (2 pts)
   - ARIA labels on status indicators
   - Screen reader announcements
   - Keyboard navigation
   
6. **UI Polish:** Theme system and visual refinements (2 pts)
   - Dark/light mode toggle with CSS custom properties
   - Chart colour coding matching warning badge system
   - Header styling and branding updates

**Sprint 3 Deliverable:** Visual dashboard showing real-time status and historical trends for all monitored devices.

**KSBs Addressed:** S2, S8, S16, K4, B7

---

### Sprint 4: Historical Analysis & Reporting (Weeks 7-8)
**Goal:** Data analysis capabilities and outage reporting

**User Stories:**
1. **Query Builder:** Historical data filtering (5 pts)
   - Date range selection
   - Device filtering
   - Aggregation options
   
2. **Outage Report:** Downtime analysis view (5 pts)
   - Outage timeline visualisation
   - Duration calculations
   - Availability percentage
   
3. **Export Functionality:** Data export to CSV (3 pts)
   - Query result export
   - Report generation
   
4. **Performance Optimisation:** Query performance (3 pts)
   - Database indexing
   - Pagination implementation
   - Lazy loading strategies

**Sprint 4 Deliverable:** Users can query historical data, view outage reports, and export data for external analysis.

**KSBs Addressed:** S3, S6, S16, K10, K12

---

### Sprint 5: Alerting & Notifications (Weeks 9-10)
**Goal:** Proactive alerting for network issues

**User Stories:**
1. **Alert Configuration:** Customisable thresholds (3 pts)
   - Latency threshold per device
   - Consecutive failure count
   - Alert severity levels
   
2. **Alert Engine:** Real-time alert generation (5 pts)
   - Threshold monitoring
   - Alert state management
   - Alert deduplication
   
3. **Visual Alerts:** UI notification system (3 pts)
   - Toast notifications
   - Alert history log
   - Unacknowledged alert counter
   
4. **Alert Log:** Persistent alert storage (3 pts)
   - Alert database table
   - Alert correlation with outages
   
5. **Testing:** Alert system tests (3 pts)
   - Threshold trigger tests
   - Alert state machine tests

**Sprint 5 Deliverable:** Application generates alerts when devices exceed thresholds; users can configure custom alert rules.

**KSBs Addressed:** S5, S6, S13, B6, B8

---

### Sprint 6: Polish, Packaging & Documentation (Weeks 11-12)
**Goal:** Production-ready application with comprehensive documentation

**User Stories:**
1. **Production Build:** Electron Forge packaging (5 pts)
   - Native module rebuilding
   - SQLite database initialisation
   - Auto-updater configuration
   
2. **Installer:** Windows installer creation (3 pts)
   - MSI/EXE installer
   - Desktop shortcut
   - Start menu entry
   
3. **Documentation:** User and technical docs (5 pts)
   - User guide with screenshots
   - Technical architecture documentation
   - Database schema documentation
   - Deployment guide
   
4. **KSB Evidence:** Portfolio compilation (3 pts)
   - Evidence mapping
   - Screenshot compilation
   - Code snippet selection
   
5. **Final QA:** End-to-end testing (3 pts)
   - System testing
   - Performance testing
   - Security review

**Sprint 6 Deliverable:** Packaged, installable application with complete documentation and KSB evidence portfolio.

**KSBs Addressed:** S10, S12, S15, K3, K11, B1, B3, B9

---

## 6. KSB Mapping & Evidence Strategy

### 6.1 Skills Evidence

| Skill | Evidence Location | Sprint |
|-------|------------------|--------|
| **S1** Logical code | Database schema design, IPC patterns, state management | 1-2 |
| **S2** User interfaces | React dashboard, Recharts integration, accessibility | 3 |
| **S3** Link code to data sets | SQLite integration, query building, data export | 2, 4 |
| **S4** Unit testing | Jest test suite, mocking strategy, coverage reports | 1-6 |
| **S5** Testing types | Integration tests, system tests, performance tests | 6 |
| **S6** Test scenarios | Alert threshold tests, outage detection tests | 5 |
| **S7** Debugging | Error handling, logging, issue resolution | 1-6 |
| **S8** Software designs | Architecture documentation, component diagrams | 6 |
| **S9** Analysis artefacts | User stories, acceptance criteria, backlog | All |
| **S10** Build & deploy | Electron Forge, packaging, installer | 6 |
| **S11** Development approach | Agile methodology, iterative delivery | All |
| **S12** Follow specifications | Definition of Done, acceptance criteria | All |
| **S13** Testing frameworks | Jest configuration, test patterns | 1-6 |
| **S14** Version control | Git commits, branching strategy, GitHub | All |
| **S15** Communicate solutions | Documentation, README, user guide | 6 |
| **S16** Algorithms & data structures | Query optimisation, scheduling algorithms | 3-4 |
| **S17** Security & maintainability | Security review, input validation, sanitisation | 1-6 |

### 6.2 Knowledge Evidence

| Knowledge | Evidence | Sprint |
|-----------|----------|--------|
| **K1** SDLC stages | Sprint structure, ceremonies, deliverables | All |
| **K2** Roles & responsibilities | Role definitions, RACI matrix | Governance |
| **K3** Project lifecycle | 12-week plan, phase gates | All |
| **K4** Communication | Standups, reviews, documentation | All |
| **K5** Methodologies | Agile vs Waterfall comparison | Documentation |
| **K6** Team working | Collaboration with line manager | All |
| **K7** Design patterns | Singleton, IPC bridge, state management | 1-3 |
| **K8** Organisational policies | Security policies, data handling | 1 |
| **K9** Algorithms & data structures | Database indexing, query optimisation | 4 |
| **K10** Database principles | Relational schema, SQL queries, normalisation | 1-4 |
| **K11** Specifications | Technical architecture document | 6 |
| **K12** Testing frameworks | Jest implementation, test strategies | 1-6 |

### 6.3 Behaviours Evidence

| Behaviour | Evidence | Sprint |
|-----------|----------|--------|
| **B1** Independent & responsible | Self-directed Sprints, risk management | All |
| **B2** Logical thinking | Algorithm design, problem decomposition | 3-4 |
| **B3** Professional environment | Security standards, code quality | All |
| **B4** Collaborative | Line manager reviews, feedback incorporation | All |
| **B5** Integrity & ethics | Data protection, security compliance | 1 |
| **B6** Initiative | Proactive issue resolution, optimisation | 3-6 |
| **B7** Effective communication | Documentation, presentations | 6 |
| **B8** Curiosity & creativity | Technical research, solution design | 1-6 |
| **B9** CPD | Technology evaluation, skill development | All |

---

## 7. Risk Management

### 7.1 Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Native module packaging issues | Medium | High | Test packaging in Sprint 1; use electron-rebuild |
| better-sqlite3 compilation failures | Low | High | Pre-built binaries; fallback to sqlite3 |
| ICMP restrictions (corporate firewall) | Medium | Medium | Test early; document workaround procedures |
| Memory leaks in monitoring engine | Medium | High | Implement cleanup patterns; profile memory |

### 7.2 Project Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Scope creep beyond 12 weeks | Medium | Medium | Strict backlog management; MVP focus |
| Insufficient KSB coverage | Low | High | Regular mapping reviews; evidence checklist |
| Testing environment unavailable | Low | Medium | Mock network responses; local testing |
| Line manager availability | Medium | Low | Async communication; documented decisions |

---

## 8. Quality Assurance Strategy

### 8.1 Testing Pyramid

```
       /\
      /  \  E2E Tests (System)
     /____\
    /      \  Integration Tests
   /________\
  /          \  Unit Tests (Majority)
 /____________\
```

### 8.2 Test Coverage Requirements

- **Unit Tests:** Minimum 80% code coverage
- **Integration Tests:** Database operations, IPC communication
- **E2E Tests:** Critical user journeys (add device, monitor, view history)

### 8.3 Security Checklist (Per Sprint)

- [ ] Input validation on all user inputs
- [ ] SQL parameterisation (no string concatenation)
- [ ] IPC channel whitelisting
- [ ] No sensitive data in logs
- [ ] Secure Electron configuration verified

---

## 9. Documentation Standards

### 9.1 British English Compliance

All documentation, comments, and commit messages must use British English:
- **colour** (not color)
- **behaviour** (not behavior)
- **organised** (not organized)
- **dialogue** (not dialog)
- **grey** (not gray)
- **centre** (not center)

### 9.2 Code Documentation

```javascript
/**
 * Calculates average latency for a device over specified time period.
 * 
 * @param {number} deviceId - Device identifier
 * @param {number} hours - Historical window in hours
 * @returns {number|null} Average latency in milliseconds, or null if no data
 * @throws {Error} If database query fails
 */
function calculateAverageLatency(deviceId, hours) {
  // Implementation
}
```

### 9.3 Commit Message Format

```
type(scope): Brief description in British English

Detailed explanation of changes, rationale,
and any breaking changes.

Refs: #123
```

Types: feat, fix, docs, test, refactor, security

---

## 10. Success Criteria

### 10.1 Technical Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Test coverage | 80%+ | Jest coverage report |
| Application startup | <3 seconds | Manual timing |
| Database query time | <100ms | Query profiling |
| Memory usage | <200MB | Process monitoring |
| Zero security vulnerabilities | 0 | Security review |

### 10.2 Business Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Device monitoring | 10+ concurrent | Functional test |
| Alert latency | <5 seconds | Manual test |
| Data retention | 30 days | Database query |
| Export functionality | CSV generation | Functional test |

### 10.3 Apprenticeship Success Metrics

- All 17 Skills demonstrated with evidence
- All 12 Knowledge areas documented
- All 9 Behaviours exhibited
- EPA portfolio complete and reviewed
- Line manager sign-off on deliverables

---

## 11. Appendices

### Appendix A: Project Timeline Gantt

```
Week:       1-2      3-4      5-6      7-8     9-10    11-12
Sprint:  [===1===][===2===][===3===][===4===][===5===][===6===]
         
Foundation [====]
Database            [====]
Dashboard                    [====]
Reporting                             [====]
Alerts                                         [====]
Packaging                                               [====]
```

### Appendix B: Tooling & Versions

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 18.x LTS | Runtime |
| Electron | 28.x | Desktop framework |
| Vite | 5.x | Build tool |
| React | 18.x | UI library |
| better-sqlite3 | 9.x | Database |
| Jest | 29.x | Testing |
| Electron Forge | 7.x | Packaging |

### Appendix C: Directory Structure

```
network-device-monitor/
├── src/
│   ├── main/
│   │   ├── index.js          # Main process entry
│   │   ├── database.js       # SQLite management
│   │   ├── network-monitor.js # Ping engine
│   │   └── ipc-handlers.js   # IPC handlers
│   ├── preload/
│   │   └── index.js          # Secure bridge
│   ├── renderer/
│   │   ├── App.jsx           # Root component
│   │   ├── components/       # UI components
│   │   ├── stores/           # Zustand stores
│   │   └── styles/           # CSS modules
│   └── shared/
│       └── constants.js      # Shared constants
├── tests/
│   ├── unit/                 # Unit tests
│   ├── integration/          # Integration tests
│   └── mocks/                # Test mocks
├── docs/
│   ├── architecture.md       # Technical design
│   ├── database.md           # Schema documentation
│   └── user-guide.md         # User manual
├── forge.config.js           # Packaging config
├── vite.config.js            # Build config
├── package.json
└── README.md
```

---

## 12. Sign-Off

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Product Owner | | | |
| Developer/Scrum Master | | | |
| QA Reviewer | | | |

---

**Document Version:** 1.1  
**Last Updated:** April 2026  
**Review Cycle:** Per Sprint  

---

## Supporting Documents

This document is the primary Agile strategy. Implementation details are in companion documents:

| Document | Purpose | Audience |
|----------|---------|----------|
| `Technical-Deep-Dive.md` | Framework comparisons, code patterns, testing strategies | Developer |
| `docs/Architecture-Decisions.md` | ADRs explaining technology choices | Assessor, Developer |
| `docs/User-Stories.md` | Detailed Gherkin user stories | Developer, Product Owner |
| `docs/Security-Checklist.md` | Runnable security verification checklist | Developer, QA |
| `docs/Git-Workflow.md` | Git conventions, commit standards, PR templates | Developer |

---

**Document Version:** 1.0  
**Last Updated:** April 2026  
**Review Cycle:** Per Sprint
