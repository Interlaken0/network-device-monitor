# Sprint 6 — Coverage Verification Report

**Date:** 23 June 2026
**Tester:** Developer
**Branch:** feature/sprint-6-week-1

---

## Summary

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Test suites | — | 22 | Pass |
| Total tests | — | 504 | Pass |
| Statement coverage | 80% | 28.04% | **Below target** |
| Branch coverage | 80% | 25.88% | **Below target** |
| Function coverage | 80% | 23.27% | **Below target** |
| Line coverage | 80% | 28.27% | **Below target** |

---

## Coverage Breakdown

### Well-covered files (>= 60%)

| File | Statements | Branch | Functions | Lines |
|------|-----------|--------|-----------|-------|
| `src/main/services/alert-engine.js` | 91.66% | 93.75% | 88.88% | 93.18% |
| `src/main/services/ping-service.js` | 81.25% | 66.07% | 93.33% | 81.74% |
| `src/main/services/export-service.js` | 78.78% | 61.73% | 93.75% | 78.35% |
| `src/renderer/stores/themeStore.js` | 69.04% | 54.54% | 53.84% | 74.35% |

### Partially covered files (1-50%)

| File | Statements | Notes |
|------|-----------|-------|
| `src/main/services/network-monitor.js` | 21.97% | Only basic getters tested; start/stop, broadcast, aggregate logic untested |
| `src/main/db/database.js` | 14.24% | Basic CRUD tested; retention, export, alert queries, aggregations untested |

### Uncovered files (0%)

| File | Lines | Reason |
|------|-------|--------|
| `src/main/ipc/handlers.js` | 693 | ESM mocking difficulties; integration tests inline validators instead of importing module |
| `src/renderer/stores/deviceStore.js` | 535 | Browser-dependent (localStorage, IPC); tests not yet written |

### New tests added in Sprint 6

| Test file | Tests added | Coverage gained |
|-----------|-------------|----------------|
| `tests/unit/renderer/utils.test.js` | 18 | chart-theme, status, alert-utils now 100% |
| `tests/unit/renderer/theme-store.test.js` | 8 | themeStore up from 0% to 69% |

---

## Why coverage is below 80%

### 1. ESM + Electron mocking complexity

The project uses native ES modules (`"type": "module"`). Jest ESM support is experimental (`--experimental-vm-modules`). Mocking Electron's `BrowserWindow`, `ipcMain`, and `dialog` in ESM mode requires `jest.unstable_mockModule` with `await import()` patterns, which is fragile and time-consuming.

**Example:** `handlers.js` imports `electron`, `getDatabase`, `networkMonitor`, `exportService`, and `dns`. Creating a test that imports the real `handlers.js` and mocks all five dependencies in ESM mode is non-trivial.

### 2. Renderer store tests require browser environment

`deviceStore.js` (535 lines) uses Zustand with `persist` middleware, `window.electronAPI`, and React hooks. Testing this in Jest's `node` environment requires extensive mocking of browser globals. The existing renderer tests (`jsdom-evaluation.test.js`, `sprint4-components.test.js`) test logic inline rather than importing the actual store files.

### 3. Database file is very large

`database.js` is 1,600+ lines with 60+ methods. The existing 12 database tests cover only basic CRUD. To reach 80% would require tests for:
- Retention policy methods
- Export functions (CSV, HTML)
- Aggregation queries (average latency, uptime)
- Alert configuration CRUD
- Outage detection queries
- Device statistics

This is approximately 40-50 additional test cases.

---

## Recommended path to 80% coverage (post-release)

| Priority | File | Approach | Estimated tests | Effort |
|----------|------|----------|----------------|--------|
| 1 | `database.js` | Add unit tests for retention, export, aggregations | 40-50 | 1 day |
| 2 | `handlers.js` | Create a dedicated test that imports real handlers with mocked Electron/DB | 15-20 | 0.5 day |
| 3 | `network-monitor.js` | Mock PingService and test start/stop/broadcast logic | 10-15 | 0.5 day |
| 4 | `deviceStore.js` | Mock `window.electronAPI` and test Zustand actions | 15-20 | 0.5 day |
| 5 | `renderer/components` | Add component-level tests with jsdom environment | 20-30 | 1 day |

**Total estimated effort:** ~3-4 days of focused testing work.

---

## Decision

Given the sprint sign-off deadline (24 June 2026), achieving 80% coverage is not feasible within the remaining time without delaying release. The current test suite (504 tests, all passing) provides strong coverage for:

- Core business logic (alert-engine, ping-service, export-service)
- Security validation (validators, CSP, rate limiting)
- Renderer utilities (chart-theme, status, alert-utils)
- Database CRUD operations
- Integration flows (export pipeline, IPC lifecycle)

**Recommendation:** Ship v1.0.0 with documented coverage gap and schedule a "testing sprint" as the first maintenance task post-release.

---

**Verified by:** Developer
**Date:** 23 June 2026
