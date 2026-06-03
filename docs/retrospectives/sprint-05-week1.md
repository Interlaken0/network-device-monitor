# Sprint 5 Week 1 - Alerting Foundation

**Dates:** 28th May – 3rd June 2026  
**Goal:** Backend alerting infrastructure  
**Total Story Points:** 11

---

## User Stories

### 1. Alert Configuration (3 pts)
Per-device threshold settings (latency, failures, packet loss) with severity levels and enable/disable toggle.

**Tasks:**
- [x] Create `alerts` database table
- [x] Build `AlertConfiguration.jsx` with threshold inputs
- [x] Add form validation
- [x] Persist settings to SQLite

**Acceptance Criteria:**
- Thresholds configurable per device
- Invalid ranges rejected
- Settings persisted

**KSBs:** S1, S2, S3, S17

---

### 2. Alert Engine (5 pts)
Monitor device metrics against thresholds and generate alerts with deduplication.

**Tasks:**
- [x] Implement threshold checking in `network-monitor.js`
- [x] Add alert state machine (triggered → unacknowledged → acknowledged → resolved)
- [x] Add alert deduplication
- [x] Create alert generation IPC handler

**Acceptance Criteria:**
- Alerts generated on threshold breach
- Duplicate alerts prevented
- IPC handlers secure

**KSBs:** S1, S5, S6, S13, S17

---

### 3. Alert Log (3 pts)
Persist alerts to database with status tracking.

**Tasks:**
- [x] Create `alerts` table with indexes
- [x] Implement alert CRUD in `db/database.js`
- [x] Add alert query IPC handlers

**Acceptance Criteria:**
- Alerts persisted with metadata
- Status updates functional
- Queries parameterised

**KSBs:** S3, S10, S17

---

## Implementation Notes

- **`AlertEngine`** (`src/main/services/alert-engine.js`) centralises threshold evaluation. It loads per-device alert configurations from `alert_configurations`, compares live ping metrics against thresholds, and creates alerts via `db.createAlert`.
- **Deduplication** is handled by `db.hasActiveAlertOfType` — the engine checks whether an unresolved alert of the same type already exists before creating a new one.
- **Auto-resolution** happens when a metric returns to normal (e.g. latency drops below threshold), calling `db.resolveDeviceAlertsByType`.
- **State tracking** is per-device and in-memory; the engine clears state when `NetworkMonitor` stops monitoring a device.
- **Alert generation IPC handlers** (`alert:create`, `alert:get`, `alert:getByDevice`, `alert:acknowledge`, `alert:resolve`) were already in place and required no changes.

---

## Definition of Done
- [x] All stories implemented
- [x] Unit tests passing (≥80% coverage on new code)
- [x] Security review completed
- [x] Code committed
