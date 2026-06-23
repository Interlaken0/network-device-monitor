# Sprint 6 — Remaining Tasks

**Date:** 18th June 2026  
**Sprint Goal:** Production-ready application with comprehensive documentation  
**Branch:** `feature/sprint-6-week-1`  

---

## What Is Done

- **Week 1 (Day 1–7):** Pre-build polish, Electron Forge packaging, and QA verification — complete.
- **Week 2 (Day 1–3):** Installer created, tested, and verified — shortcuts, Start Menu, Desktop all working.
- **478 tests passing** across 20 suites.
- **Lint and typecheck** report zero issues.

---

## What Remains

These tasks must be completed before the sprint can be signed off on 24th June.

### 1. Security Checklist

- [ ] Run `npm audit` and document or fix any findings.
- [ ] Verify Section 1.1 (BrowserWindow security) against `src/main/index.js`.
- [ ] Verify Section 1.2 (preload script security) — channel whitelist, no direct Node API exposure.
- [ ] Verify Section 1.3 (IPC handler validation) — input sanitisation, SQL parameterisation.
- [ ] Verify Section 3.1 (SQL injection prevention) — check all `.prepare()` calls.
- [ ] Verify Section 4.1 (CSP headers) — already configured; confirm no regressions.
- [ ] Verify Section 7.2 (build integrity) — dev tools disabled, source maps excluded, `NODE_ENV=production`.
- [ ] Sign off by developer and Product Owner.

**Owner:** Developer  
**Estimated effort:** 2–3 hours

---

### 2. Documentation (Day 3–5)

| Document | Status | What Is Needed |
|----------|--------|----------------|
| `docs/user-guide.md` | Not started | Step-by-step guide: install, add a device, start monitoring, read the dashboard, view history, export CSV, configure alerts. Include annotated screenshots. |
| `docs/technical-deep-dive.md` | Needs update | Refresh file paths, dependency versions, final database schema, IPC channel list, and architecture diagram. |
| `docs/deployment-guide.md` | Not started | System requirements (Windows 10+, Node.js not required), installation steps, first-run setup. |
| `README.md` | Needs update | Add final project summary: overview, tech stack, install instructions, development setup, test commands, screenshot. |

**Owner:** Developer  
**Estimated effort:** 1–2 days

---

### 3. KSB Evidence Portfolio (Day 5–6)

| Item | Status | What Is Needed |
|------|--------|----------------|
| Evidence mapping matrix | Not started | Table mapping every S1–S17, K1–K12, B1–B9 to a specific file, commit, or document with line numbers. |
| Screenshot compilation | Not started | Minimum 10 annotated screenshots covering: dashboard, device CRUD, latency chart, outage analysis, export manager, alert configuration, alert history, dark mode, query builder, installer. |
| Code snippet selection | Not started | 8–12 snippets with explanatory captions. Target areas: database singleton, IPC validation, alert state machine, Recharts integration. |
| Evidence narrative | Not started | 500-word summary linking apprenticeship journey to KSBs: challenges, decisions, skills demonstrated. |

**Owner:** Developer  
**Estimated effort:** 1–2 days

---

### 4. Sprint Closure (Day 7)

| Task | Status | What Is Needed |
|------|--------|----------------|
| Product Owner / line manager review | Not started | Demo the installed app, walk through documentation and evidence folder. Capture written sign-off or email confirmation. |
| Sprint 6 retrospective | Not started | Write `docs/retrospectives/sprint-06-retrospective.md` covering what went well, what could improve, and final metrics. |
| Repository cleanup and merge | Not started | Merge `feature/sprint-6-week-1` to `main`. Remove temporary planning files. Tag final commit as `v1.0.0`. |
| Backup and archive | Not started | Copy evidence folder, final `.exe` installer, and repo ZIP to the apprenticeship portfolio location. |

**Owner:** Developer + Line Manager  
**Estimated effort:** Half a day

---

### 5. Coverage Verification (Outstanding from Criteria)

- [ ] Run `npm run test:coverage` and confirm **80%+ overall coverage**.
- [ ] If below 80%, identify gaps and add targeted tests before release.

**Owner:** Developer  
**Estimated effort:** 30 minutes

---

## Sprint 6 Completion Criteria

All items below must be true before the sprint is considered complete:

- [x] Packaged `.exe` installs and runs
- [x] All 450+ tests passing (478 passing)
- [ ] Coverage verified at 80%+
- [x] Lint and typecheck report zero issues
- [ ] Security checklist completed with no open findings
- [ ] User guide, technical documentation, and deployment guide written and reviewed
- [ ] KSB evidence mapped and compiled
- [ ] Line manager sign-off obtained
- [ ] Final release tagged in Git (`v1.0.0`)

---

**Document Version:** 1.0  
**Last Updated:** 18th June 2026
