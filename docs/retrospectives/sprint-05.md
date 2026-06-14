# Sprint 5 Retrospective: Alerting & Notifications

**Sprint Dates:** 28th May – 10th June 2026  
**Week 1:** 28th May – 3rd June 2026 — Alerting Foundation  
**Week 2:** 4th June – 10th June 2026 — Alerting UI & Testing  
**Sprint Goal:** Move from reactive monitoring to proactive alerting  
**Status:** Complete

---

## What We Built This Sprint

Sprint 5 turned the application from a passive monitoring dashboard into something that actively tells Jeff when things go wrong. Rather than Jeff having to spot a red status card, the system now generates alerts, displays toast notifications, and keeps a full history of every threshold breach.

---

## Key Deliverables

### 1. Alert Configuration (`AlertConfiguration.jsx`)

- `src/renderer/components/alerts/AlertConfiguration.jsx` gives Jeff per-device control over what constitutes a problem.
- Each device can have its own latency threshold, consecutive failure count, and packet-loss threshold.
- Severity levels (critical, warning) let Jeff decide which devices warrant an immediate response and which can wait.
- An enable/disable toggle means Jeff can silence alerts for maintenance windows without deleting the configuration.

### 2. Alert Engine (`alert-engine.js`)

- `src/main/services/alert-engine.js` runs in the main process and evaluates every ping result against the stored thresholds.
- The engine maintains an in-memory state machine per device: `triggered` → `unacknowledged` → `acknowledged` → `resolved`.
- Deduplication prevents alert spam. The engine checks `hasActiveAlertOfType` before creating a duplicate, so one latency spike does not generate ten alerts.
- Auto-resolution happens automatically when a metric returns to normal. If latency drops back below the threshold, the engine resolves the alert without Jeff needing to intervene.
- Alert broadcast sends notifications to the renderer via IPC so the UI updates in real time.

### 3. Alert Database Layer (`database.js`)

- `src/main/db/database.js` was extended with an `alerts` table that tracks every alert with its type, severity, message, status, and timestamps.
- Prepared statements handle alert creation, querying by device, status updates, and resolution.
- Indexes on `device_id` and `status` keep lookups fast even as the alert log grows.

### 4. Active Alerts Panel (`ActiveAlerts.jsx`)

- `src/renderer/components/alerts/ActiveAlerts.jsx` shows the current set of unresolved alerts in a clean, scannable list.
- Each alert card displays the device name, alert type, severity badge, and the exact message.
- Jeff can acknowledge an alert (marks it as reviewed) or resolve it (manually closes it).
- A loading state on each action prevents double-clicks and gives immediate visual feedback.

### 5. Toast Notifications (`ToastNotifications.jsx`)

- `src/renderer/components/alerts/ToastNotifications.jsx` provides the real-time notification layer.
- Critical alerts persist until acknowledged — they do not auto-dismiss, so Jeff cannot miss an outage.
- Warning alerts auto-dismiss after a configured duration.
- The toast store (`useToastStore`) is global via Zustand, so any part of the app can trigger a notification without prop drilling.

### 6. Alert History (`AlertHistory.jsx`)

- `src/renderer/components/alerts/AlertHistory.jsx` gives Jeff a full chronological log of every alert the system has ever generated.
- Status filtering lets Jeff view all alerts, only unresolved ones, or only acknowledged ones.
- Sorting is by creation date descending, so the most recent problems appear first.
- Severity badges and colour coding match the dashboard status system Jeff already knows.

### 7. Alert Utilities (`alert-utils.js`)

- `src/renderer/components/alerts/alert-utils.js` centralises formatting and configuration for all alert components.
- Severity config maps `critical` and `warning` to labels, colours, and CSS class names.
- Status labels and alert-type labels keep the UI consistent across ActiveAlerts, AlertHistory, and ToastNotifications.

### 8. IPC & Preload Integration

- `src/main/ipc/handlers.js` gained `alert:create`, `alert:get`, `alert:getByDevice`, `alert:getActive`, `alert:getAll`, `alert:acknowledge`, `alert:resolve`, and `alert:resolveDevice` handlers.
- `src/preload/index.js` exposes these through the secure context bridge so the renderer never talks directly to the database.

---

## Testing & Quality

- **43 alert-specific tests passing** across 2 test suites.
- `tests/unit/main/alert-engine.test.js` covers threshold evaluation, deduplication, state transitions, and auto-resolution.
- `tests/unit/renderer/sprint5-alert-components.test.js` covers ActiveAlerts logic, ToastNotifications queue behaviour, AlertConfiguration validation, and AlertHistory filtering.
- Alert engine coverage sits at **91.66%** statement coverage.
- Lint and typecheck remain clean.

---

## Technical Decisions

### In-memory state machine in the main process

The alert engine keeps per-device state in memory rather than querying the database on every ping. This avoids SQLite contention during high-frequency monitoring and keeps the ping loop responsive. State is cleared when a device stops monitoring, so there is no stale data between sessions.

### Zustand for toast notifications

A separate `useToastStore` (living inside `ToastNotifications.jsx`) manages the notification queue. It is independent from the device store, which means dashboard rendering is not blocked by toast animations or queue management.

### Acknowledge vs Resolve

Two distinct actions were needed. "Acknowledge" means "I have seen this alert" — the alert stays in the log but is no longer urgent. "Resolve" means "this problem is fixed" — the alert is closed. This distinction matters for Jeff's workflow: he might acknowledge a warning during the day but only resolve it after the network team confirms the fix.

---

## Challenges We Navigated

| Challenge | How We Solved It | Result |
|-----------|------------------|--------|
| Preventing alert spam on flaky devices | Deduplication via `hasActiveAlertOfType` before every new alert creation | One latency spike = one alert, not ten |
| Keeping the UI responsive during high alert volume | Toast queue capped at 10 items; old toasts are silently dropped | No memory leaks from unbounded notification growth |
| Critical alerts must not be missed | Critical toasts get `duration: 0`, meaning no auto-dismiss | Jeff must explicitly acknowledge a critical alert |
| Bridging main-process alerts to renderer UI | IPC broadcast on alert creation, plus renderer polling on mount | UI stays in sync even if a toast is missed |

---

## What I Learnt This Sprint

- **Proactive alerting changes how users interact with monitoring tools.** A dashboard Jeff has to watch becomes a dashboard that watches itself.
- **State machines reduce complexity.** Modelling alerts as `triggered → unacknowledged → acknowledged → resolved` made every UI decision straightforward.
- **Separate stores for separate concerns.** The toast store and device store do not need to know about each other. The IPC layer is the only bridge, and that keeps the architecture clean.
- **Acknowledge/resolve semantics matter.** Users do not always want the same thing as a system administrator. Giving Jeff two actions instead of one makes the tool feel respectful of his workflow.

---

## Where the Code Lives

- `src/main/services/alert-engine.js` — Threshold evaluation, deduplication, state machine, auto-resolution
- `src/main/db/database.js` — Alert table schema, CRUD, queries (`createAlert`, `getAlert`, `getAlertsByDevice`, `getActiveAlerts`, `getAllAlerts`, `acknowledgeAlert`, `resolveAlert`, `resolveDeviceAlerts`, `resolveDeviceAlertsByType`, `hasActiveAlertOfType`)
- `src/main/ipc/handlers.js` — Alert IPC handlers (`alert:create`, `alert:get`, `alert:getByDevice`, `alert:acknowledge`, `alert:resolve`)
- `src/preload/index.js` — Secure context bridge for alert API
- `src/renderer/components/alerts/AlertConfiguration.jsx` — Per-device threshold settings UI
- `src/renderer/components/alerts/ActiveAlerts.jsx` — Live unresolved alert panel
- `src/renderer/components/alerts/ToastNotifications.jsx` — Real-time toast notification system
- `src/renderer/components/alerts/AlertHistory.jsx` — Historical alert log with filtering
- `src/renderer/components/alerts/alert-utils.js` — Shared severity config, labels, and formatting
- `src/renderer/App.jsx` — Toast container and active-alerts panel integration
- `tests/unit/main/alert-engine.test.js` — Engine logic tests
- `tests/unit/renderer/sprint5-alert-components.test.js` — Component logic tests

---

## Metrics

| Metric | Value |
|---|---|
| Sprint duration | 2 weeks (28th May – 10th June) |
| User stories completed | 5/5 |
| Tests passing | 43 |
| Test suites | 2 |
| New components | 4 (AlertConfiguration, ActiveAlerts, AlertHistory, ToastNotifications) |
| New utility modules | 1 (alert-utils.js) |
| Lines of code added | ~900 |
| Pull requests | 1 merged (Week 1), 1 open (Week 2) |
| Alert engine statement coverage | 91.66% |

---

## Commits This Sprint

| Commit | Message |
|--------|---------|
| `15164c5` | `feat(alerts): Sprint 5 Week 1 — Alerting Foundation (#18)` |
| `0f9fc38` | `feat(renderer): Add ActiveAlerts panel for live alert display` |
| `1f51bee` | `feat(alerts): Complete Sprint 5 Week 2 — alert UI, history, and tests` |

---

## Sprint 5 Completion Summary

**Original Goal:** Build proactive alerting so Jeff knows about network problems without watching the dashboard.  
**Deliverable Achieved:** Per-device thresholds, real-time alert generation, deduplication, toast notifications, alert history, acknowledgement and resolution workflows, and comprehensive test coverage.

**Sprint 5 Takeaway:** The application is no longer just a monitoring dashboard — it is a monitoring system that communicates. Jeff configures what matters, the engine watches continuously, and the UI surface the right information at the right urgency level.

---

**Document Version:** 1.0  
**Last Updated:** 10th June 2026  
**Branch:** `feature/sprint-5-week-2`
