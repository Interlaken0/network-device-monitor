# Sprint 5 Week 1 - Alerting Foundation

**Dates:** 28th May – 3rd June 2026  
**Goal:** Backend alerting infrastructure  
**Total Story Points:** 11

---

## User Stories

### 1. Alert Configuration (3 pts)
Per-device threshold settings (latency, failures, packet loss) with severity levels and enable/disable toggle.

**Tasks:**
- [ ] Create `alerts` database table
- [ ] Build `AlertConfiguration.jsx` with threshold inputs
- [ ] Add form validation
- [ ] Persist settings to SQLite

**Acceptance Criteria:**
- Thresholds configurable per device
- Invalid ranges rejected
- Settings persisted

**KSBs:** S1, S2, S3, S17

---

### 2. Alert Engine (5 pts)
Monitor device metrics against thresholds and generate alerts with deduplication.

**Tasks:**
- [ ] Implement threshold checking in `network-monitor.js`
- [ ] Add alert state machine (triggered → unacknowledged → acknowledged → resolved)
- [ ] Add alert deduplication
- [ ] Create alert generation IPC handler

**Acceptance Criteria:**
- Alerts generated on threshold breach
- Duplicate alerts prevented
- IPC handlers secure

**KSBs:** S1, S5, S6, S13, S17

---

### 3. Alert Log (3 pts)
Persist alerts to database with status tracking.

**Tasks:**
- [ ] Create `alerts` table with indexes
- [ ] Implement alert CRUD in `db/database.js`
- [ ] Add alert query IPC handlers

**Acceptance Criteria:**
- Alerts persisted with metadata
- Status updates functional
- Queries parameterised

**KSBs:** S3, S10, S17

---

## Definition of Done
- [ ] All stories implemented
- [ ] Unit tests passing (≥80% coverage)
- [ ] Security review completed
- [ ] Code committed
