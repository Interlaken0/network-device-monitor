# Sprint 5 Week 2 - Alerting UI & Testing

**Dates:** 4th June – 10th June 2026  
**Goal:** Alert visualisation and validation  
**Total Story Points:** 6

---

## User Stories

### 1. Visual Alerts (3 pts)
Toast notifications and alert history with acknowledgement and counter.

**Tasks:**
- [ ] Create `ToastNotification.jsx` with auto-dismiss
- [ ] Create `AlertHistory.jsx` with filtering
- [ ] Add unacknowledged counter badge
- [ ] Implement acknowledge action
- [ ] Integrate with Zustand store

**Acceptance Criteria:**
- Toasts appear on alert trigger
- Critical alerts persist until acknowledged
- Alert history viewable with filters
- Counter updates correctly

**KSBs:** S2, S5, S6, B7

---

### 2. Testing (3 pts)
Unit and integration tests for the alert system.

**Tasks:**
- [ ] Unit tests: AlertConfiguration, ToastNotification, AlertHistory
- [ ] Unit tests: alert engine (thresholds, deduplication, state machine)
- [ ] Unit tests: alert log (CRUD, queries)
- [ ] Integration tests: end-to-end alert flow
- [ ] Achieve ≥80% coverage

**Acceptance Criteria:**
- All components tested
- State machine fully tested
- Integration tests passing
- Coverage ≥80%

**KSBs:** S4, S5, S6, S13

---

## Definition of Done
- [ ] All stories implemented
- [ ] All tests passing (≥80% coverage)
- [ ] Feature tested in packaged .exe
- [ ] Sprint 5 retrospective created
