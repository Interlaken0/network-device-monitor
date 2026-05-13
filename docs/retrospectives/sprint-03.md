# Sprint 3 Retrospective

**Dates:** 29th April 2026 - 13th May 2026  
**Week 1:** 29th April 2026 - 6th May 2026  
**Week 2:** 6th May 2026 - 13th May 2026  
**Focus:** Dashboard visualisation, outage detection, theme system, and security remediation  
**Status:** Complete

## What We Built This Sprint

Sprint 3 delivered the first real dashboard experience for the app, adding status cards, device-level latency charts, outage tracking, and a polished theme system. The work spanned two weekly iterations:

- **Sprint 3 Week 1:** 29th April – 6th May — initial dashboard and outage integration, theme polish, and core visualization work.
- **Sprint 3 Week 2:** 6th May – 13th May — follow-up bug fixes, final UI polish, build pipeline support, and security audit remediation.

### Key Deliverables

1. **Device Dashboard with status cards**
   - Implemented `src/renderer/components/Dashboard.jsx` as the central overview.
   - Each device card uses `DeviceCardWrapper` and a `DeviceStatusCard` to show current latency, online state, and outage badges.
   - Cards are keyboard-accessible and click-to-expand a latency chart only for monitored devices.

2. **Latency chart visualisation**
   - Added `src/renderer/components/LatencyChart.jsx` for device-specific latency history.
   - Chart display is triggered from the dashboard and works with monitored devices only.
   - `src/renderer/stores/deviceStore.js` now captures `pingHistory` in addition to latest ping results.

3. **Outage detection UI integration**
   - Added active outage tracking and outage history support via `src/main/ipc-handlers.js` and `src/main/database.js`.
   - Implemented `src/renderer/components/OutageTimeline.jsx` to display historical outage information and severity filtering.
   - The dashboard now includes an outage history panel with 30-day data pulled from the database through the renderer store.

4. **Theme system polish**
   - Added `src/renderer/stores/themeStore.js` using Zustand persist middleware for theme preference.
   - Supports light/dark mode toggle, system preference detection, and immediate root `data-theme` application.
   - UI styling in `src/renderer/App.css` now includes smooth theme transitions and dark mode-specific styles.

5. **Database and IPC improvements**
   - Added `device:getStatusSummary`, `outage:getActive`, `outage:getHistory`, and `outage:configureThresholds` handlers in `src/main/ipc-handlers.js`.
   - Extended `src/main/database.js` with status summary queries, outage aggregation, active outage lookups, and outage history.
   - The renderer store loads outage history on Dashboard mount and keeps it available for the timeline.

6. **Security audit remediation**
   - Completed further audit remediation for `SEC-002`, `SEC-003`, and `INFO-001` in the same sprint.
   - This work landed in commit `68a0509` and is part of the sprint closure.

## Bug Fixes

- Fixed status calculation by passing `isOnline` into `calculateStatusFromLatency` in `src/renderer/utils/status.js` and `src/renderer/stores/deviceStore.js`.
- Added `tsconfig` support for the build pipeline in `b6ddabb`.
- Ensured outage state clears cleanly when devices stop monitoring.

## Technical Decisions

### Zustand for dashboard state

Sprint 3 embraced a shared state store for the first time. `src/renderer/stores/deviceStore.js` now holds:
- `devices`
- `pingResults`
- `pingHistory`
- `isMonitoring`
- `outageHistory`
- `activeOutages`

Using selector functions and `shallow` comparisons in `Dashboard.jsx` kept re-renders narrow and responsive as ping updates arrive.

### Outage event flow

Outage data flows from the database into IPC and then into the renderer store. This keeps the UI decoupled from main process details:
1. Main process query in `src/main/database.js`
2. IPC handler in `src/main/ipc-handlers.js`
3. `loadOutageHistory()` in `src/renderer/stores/deviceStore.js`
4. `OutageTimeline.jsx` renders the history

### Theme persistence with system fallback

The theme store stores the user's selection in local storage and optionally follows system dark mode. This was implemented in `src/renderer/stores/themeStore.js` and applied immediately on mount in `src/renderer/App.jsx`.

## Challenges We Navigated

| Challenge | How We Solved It | Result |
|-----------|------------------|--------|
| Keeping dashboard renders efficient | Used per-device selectors with `shallow` and isolated wrapper components | Smooth updates even when multiple devices ping simultaneously |
| Exposing outage data without over-fetching | Added targeted IPC handlers for active outages and history | Outage timeline loads once on mount and stays in state |
| Theme flash on load | Applied theme to `document.documentElement` immediately from `themeStore` | No white-flash when toggling dark/light mode |
| Mixed sprint scope with security fixes | Bundled audit remediation into the final sprint commits | Closed outstanding audit findings while shipping dashboard features |

## What I Learnt This Sprint

- **Global store state is effective for dashboard/visualisation features.** Zustand makes it easier to share live ping and outage state across components without prop drilling.
- **Separation of concerns matters most for IPC-heavy apps.** The renderer only consumes normalized data from the store; all database and outage logic remains in the main process.
- **Visual polish is a multiplier.** A theme toggle and outage severity badges made the dashboard feel like a product rather than a prototype.

## Where the Code Lives

- `src/renderer/components/Dashboard.jsx` — Dashboard overview and device selection
- `src/renderer/components/DeviceStatusCard.jsx` — Device status cards, latency badges, outage indicator
- `src/renderer/components/LatencyChart.jsx` — Device latency history chart
- `src/renderer/components/OutageTimeline.jsx` — Outage history visualisation and list
- `src/renderer/stores/deviceStore.js` — Shared state for devices, ping results, monitoring, and outages
- `src/renderer/stores/themeStore.js` — Dark/light theme persistence and system fallback
- `src/renderer/utils/status.js` — Latency status classification logic
- `src/main/ipc-handlers.js` — Outage and status summary IPC handlers
- `src/main/database.js` — Outage queries, status summary, and aggregation logic
- `src/renderer/App.jsx` — Theme initialization, dashboard wrapper, and device form integration

## Commits This Sprint

| Commit | Message |
|--------|---------|
| `7a88cab` | `Feature/sprint 3 week 1 (#14)` |
| `0766f00` | `feat: implement outage detection UI integration` |
| `0039538` | `feat: implement theme system polish and visual enhancements` |
| `23b792c` | `Update database operations, IPC handlers, and UI components` |
| `b6ddabb` | `fix(store): pass isOnline to calculateStatusFromLatency and add tsconfig for build pipeline` |
| `68a0509` | `security: Complete audit findings remediation (SEC-002, SEC-003, INFO-001)` |

## Sprint 3 Completion Summary

**Original Goal:** Build the first full dashboard with visual device status and outage awareness.  
**Deliverable Achieved:** Dashboard cards, latency charts, outage history, theme preference, and security fixes shipped.

**Sprint 3 Takeaway:** The project moved from device management to operational visibility. The architecture now supports live status updates, visual charts, and outage analytics without sacrificing responsiveness or maintainability.

---

**Document Version:** 1.0  
**Last Updated:** 13th May 2026  
**Branch:** `feature/sprint-3-week-2`