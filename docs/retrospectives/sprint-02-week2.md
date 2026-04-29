# Sprint 2 Week 2 Retrospective

**Dates:** 23rd April 2026 - 29th April 2026  
**Focus:** Security Hardening, Architecture Documentation, Test Improvements  
**Status:** Complete

---

## What We Built This Week

This week focused on completing Sprint 2 deliverables through security audit remediation, test improvements, and formal documentation of architectural decisions made during Sprints 1 and 2.

### Key Deliverables

1. **Security Audit Remediation** — Addressed findings from the 18th April security audit:
   - **SEC-001**: Sanitised error messages in IPC handlers to prevent information disclosure
   - **SEC-005**: Removed duplicate `setWindowOpenHandler` registration
   - Updated integration tests to match new generic error messages

2. **Architecture Decision Records (ADRs)** — Documented three key technical decisions:
   - **ADR-003**: React 18 framework selection over Vue 3
   - **ADR-004**: Zustand for state management (pending Sprint 3 implementation)
   - **ADR-006**: Vite build tool over Webpack

3. **Test Updates** — Updated integration tests to match sanitised error messages
   - Fixed coverage report timezone display
   - Added runtime behavior verification tests

---

## Technical Decisions We Made

### Error Message Sanitisation Strategy

Following the security audit, I faced a choice: keep detailed error messages for debugging convenience, or sanitise them to prevent information leakage.

**Decision:** Generic error messages for users, detailed logs for developers.

```javascript
// Before (SEC-001 violation)
throw new Error('Invalid device name: must be 1-100 characters')

// After (SEC-001 compliant)
throw new Error('Invalid device name')
```

The detailed validation logic remains in the code and appears in server-side logs, but users see only generic messages. This follows defence-in-depth principles — even if an attacker probes the API, they receive minimal information about internal validation rules.

### ADR Scope Boundaries

When documenting ADR-004 (Zustand), I needed to clarify the difference between "decision made" and "implementation complete."

**Decision:** Separate architectural decision from implementation timeline.

The decision to use Zustand was made in Sprint 2 Week 2 based on projected Sprint 3 needs (latency charts requiring shared state). However, the actual installation and integration is scheduled for Sprint 3. This distinction is clearly documented in ADR-004's "Pending Implementation" status, preventing confusion about current versus future state.

---

## Challenges We Navigated

| Challenge | How We Solved It | Result |
|-----------|------------------|--------|
| Security fixes breaking existing tests | Updated `ipc-device-lifecycle.test.js` assertions to match new generic error messages | All 353 tests passing |
| ADR-004 confusion about current state | Added explicit "Pending Implementation - Sprint 3" status and detailed current vs. planned sections | Clear documentation of decision vs. implementation timeline |
| Electron Forge vs Vite documentation | Cross-referenced `package.json` versions with actual `electron.vite.config.js` content | Accurate ADR-006 reflecting actual multi-process configuration |
| Git branch management for ADRs | Committed security fixes and ADRs to `feature/sprint2-week2-multi-monitor` before switching to `evidence/reflections` for retrospective | Clean separation of code and documentation commits |

---

## What I Learnt This Week

**Security is iterative.** The 18th April audit identified five findings; this week I addressed the two highest-priority items (SEC-001 and SEC-005). The remaining three (SEC-002 hostname support, SEC-003 HTML sanitisation, INFO-001 data retention) are documented for future sprints. Security isn't a one-time checkbox — it's ongoing refinement as the threat model evolves.

**Documentation captures intent, not just implementation.** ADRs document *why* decisions were made (React for familiarity, Vite for HMR speed) not just *what* was implemented. This context becomes invaluable during future refactoring or when onboarding new developers. The "Alternatives Considered" sections prevent circular decision-making.

**Test maintenance is production work.** When I sanitised error messages, 2 integration tests failed immediately. Updating test assertions alongside code changes is essential — tests that don't reflect current behaviour become false positives. The 15-minute fix prevented future confusion about whether the security changes broke functionality.

---

## Where the Code Lives

- `src/main/index.js:45-48` — Consolidated `setWindowOpenHandler` (SEC-005 fix)
- `src/main/ipc-handlers.js:120,124,128` — Sanitised error messages (SEC-001 fix)
- `docs/adr/adr-003-react-framework.md` — React 18 framework decision
- `docs/adr/adr-004-state-management.md` — Zustand selection (Sprint 3 preparation)
- `docs/adr/adr-006-build-tool.md` — Vite build tool decision
- `tests/integration/ipc-device-lifecycle.test.js` — Updated error message assertions
- `scripts/fix-coverage-timezone.js` — Coverage report timezone fix
- `tests/unit/database-runtime.test.js` — Runtime behavior verification tests

---

## Commits This Week

| Commit | Message | Scope |
|--------|---------|-------|
| `f49853e` | `security(ipc): SEC-001/SEC-005 fixes` | Error sanitisation, handler cleanup |
| `29e7d70` | `docs(adr): Sprint 2 architecture decision records` | ADR-003, ADR-004, ADR-006 |
| `c8af518` | `Fix coverage report timezone display and improve test mocks` | Coverage fix, test mocks |
| `2f8730d` | `test(database): add runtime behavior verification tests` | Runtime verification tests |

---

## Sprint 2 Completion Summary

**Original Goal:** Dynamic device configuration with CRUD operations  
**Deliverable Achieved:** Users can add multiple devices; application monitors all configured IPs concurrently

**Week 1 Focus:** Core functionality (CRUD, multi-device monitoring, validation, query optimisation)  
**Week 2 Focus:** Polish (security, documentation, test improvements)

**KSBs Addressed:**
- **S1** — Logical code (validation, query logic)
- **S3** — Database integration (advanced queries, aggregation)
- **S4** — Testing (security tests, query tests)
- **S7** — Debugging (security review, error handling)
- **K10** — Database principles (indexing, query optimisation)

---

## Looking Ahead

Sprint 3 begins tomorrow (30th April 2026) with focus on Dashboard & Visualisation:

- **Status Dashboard** — Live device cards with colour-coded indicators
- **Latency Charts** — Recharts integration with time-range selection
- **Zustand Implementation** — Migrate from useState to global store for shared chart data
- **Outage Detection** — Threshold-based alerting and severity classification

The foundation from Sprint 2 (device management, monitoring engine, database queries) provides the data layer needed for visualisation. The ADRs documented this week ensure architectural consistency as dashboard complexity increases.

---

**Document Version:** 1.0  
**Last Updated:** 29th April 2026  
**Branch:** `evidence/reflections`
