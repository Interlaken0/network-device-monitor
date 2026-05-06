# Sprint 1 Retrospective

**Dates:** 1st April 2026 - 15th April 2026  
**Focus:** Foundation, Database Schema, MVP UI  
**Status:** Complete

## Goals Achieved

1. **Electron + Vite Foundation Established** - Desktop application shell running with hot-reload development environment, secure IPC bridge, and production build pipeline
2. **SQLite Database Schema Implemented** - Three-table relational schema (devices, ping_logs, outages) with foreign key constraints, indexes for query optimisation, and prepared statement caching via singleton pattern
3. **MVP Single-Device Monitoring Delivered** - Full CRUD operations for devices, real-time ICMP ping monitoring with 5-second intervals, colour-coded latency display (green/yellow-amber/orange/red thresholds), and live ping result logging to database
4. **Testing Infrastructure Configured** - Jest framework with 80%+ coverage target, unit tests for database operations, ping service validation, and in-memory database mocks for isolated testing

## Technical Decisions Made

### Decision 1: Electron over Tauri for Desktop Framework

**Context:** The application required a cross-platform desktop solution with native Node.js module support, proven security patterns, and rapid development within the 12-week apprenticeship timeline. Options considered included Electron, Tauri, WPF, and Flutter Desktop.

**Decision:** Selected Electron 28.x with Vite integration.

**Rationale:** Electron provides mature ecosystem documentation, native Node.js module support without FFI complexity, and builds upon existing project knowledge from the Temperature Plotter application. The larger bundle size (~150MB) is acceptable for internal tooling, and security is managed through strict context isolation configuration.

**Files affected:**
- `src/main/index.js` - Main process entry point with secure window configuration
- `src/preload/index.js` - Context-isolated API bridge exposing only required functions
- `electron.vite.config.js` - Build configuration for main, preload, and renderer processes

### Decision 2: better-sqlite3 over node-sqlite3 for Database Access

**Context:** SQLite access required for synchronous operations in the main process, including device CRUD operations, time-series ping data logging, and historical query analysis. The library needed to support prepared statements and handle high-frequency writes (every 5 seconds per device).

**Decision:** Selected better-sqlite3 12.x with synchronous API.

**Rationale:** Synchronous API simplifies IPC architecture and eliminates callback complexity. better-sqlite3 offers the fastest SQLite performance for desktop applications and supports prepared statement caching. The native compilation requirement is mitigated through electron-rebuild configuration.

**Files affected:**
- `src/main/database.js` - Singleton DatabaseManager with prepared statement caching
- `package.json` - Native module dependencies and rebuild scripts

### Decision 3: Jest over Vitest for Testing Framework (Provisional)

**Context:** Testing framework required for unit tests (80% coverage target), integration tests covering database and IPC layers, React component testing, and coverage reporting. The framework needed to support Electron's unique environment.

**Decision:** Selected Jest 29.x with experimental VM modules for ES module support.

**Rationale:** Jest provides proven Electron testing patterns and extensive mocking capabilities required for testing native modules. While Vitest offers Vite-native integration and faster execution, Jest's maturity and React Testing Library integration were prioritised for Sprint 1 stability.

**Files affected:**
- `jest.config.js` - Test configuration with ES module support and coverage settings
- `tests/unit/database.test.js` - Database CRUD operation tests
- `tests/unit/ping-service.test.js` - ICMP ping validation tests

## Challenges Encountered

| Challenge | Solution | Outcome |
|-----------|----------|---------|
| better-sqlite3 native compilation failures on Windows | Installed windows-build-tools and configured electron-rebuild in build pipeline | Successful native module compilation across development machines |
| Preload script ESM/CJS interoperability issues | Configured Vite to output preload as CommonJS (.cjs extension) | Secure IPC bridge loads reliably in production builds |
| Jest ES module import errors with native modules | Added --experimental-vm-modules flag and configured transformIgnorePatterns | Tests run successfully with ES module syntax |
| React state loss during device editing | Implemented controlled form components with local edit state | Device editing now preserves form data correctly |
| Ping library timeout handling inconsistencies | Added AbortController for graceful cancellation and explicit error handling | Monitoring stops cleanly without orphaned ping processes |

## Lessons Learnt

- **Native module testing requires isolated strategies.** Attempting to test better-sqlite3 directly in Jest caused compilation errors. Using sqlite3 (prebuilt, no compilation) for test databases while keeping better-sqlite3 for production provided a clean separation without sacrificing test reliability.

- **IPC security boundaries are worth the initial complexity.** Enforcing context isolation from day one added setup overhead, but prevented security debt accumulation. The preload script pattern forces explicit API design that improved overall architecture clarity.

- **Synchronous database access simplifies debugging.** While asynchronous patterns are generally preferred in Node.js, the synchronous better-sqlite3 API eliminated an entire class of race condition bugs during Sprint 1 development. This choice will be revisited if multi-threaded performance becomes a bottleneck.

- **ESM and CommonJS interoperability remains painful.** The Node.js ecosystem transition to ES modules created friction with Electron's expectations. Documenting the specific configuration (type: module in package.json, .cjs for preload, experimental flags for Jest) will save time during environment setup for future developers.

## Code References

- `src/main/database.js:1-498` - DatabaseManager singleton with prepared statement caching, schema initialisation, and CRUD operations for devices, ping logs, and outages
- `src/main/ipc-handlers.js:1-228` - IPC bridge with input validation for IP addresses, device names, and device types; handles ping monitoring lifecycle
- `src/main/ping-service.js:1-203` - PingService class wrapping the ping library with AbortController cancellation, automatic database logging, and outage detection
- `src/renderer/App.jsx:1-356` - React frontend with device CRUD forms, real-time latency display with colour-coded badges, and live ping result logging
- `src/preload/index.js` - Secure context bridge exposing only validated IPC channels to renderer process
- `tests/unit/database.test.js` - Unit tests for database CRUD operations using in-memory sqlite3
- `electron.vite.config.js` - Vite configuration for Electron with separate build targets for main, preload, and renderer processes

---

**Document Version:** 1.0  
**Sprint Velocity:** 4 stories completed  
**Test Coverage:** 82%  
**Next Sprint Focus:** Device editing improvements, IPv6 validation, multi-device dashboard enhancements
