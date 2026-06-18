# Sprint 6 Week 2 Tasks: Installer, Documentation & Evidence

**Dates:** 17th June 2026 – 24th June 2026  
**Sprint Goal:** Production-ready application with comprehensive documentation  
**Week Focus:** Windows installer creation, user and technical documentation, KSB evidence compilation, and final sign-off  
**Status:** In Progress

---

## Sprint Context

Week 2 completes the apprenticeship deliverable. With the application packaging verified in Week 1, this iteration focuses on distribution (installer), communication (documentation), and assessment readiness (KSB evidence portfolio).

---

## Week 2 Tasks

### Day 1–3: Installer & Distribution

| Task | Story Points | Acceptance Criteria | KSBs |
|------|-------------|---------------------|------|
| ~~Create Windows installer via Electron Forge~~ | 2 | ~~Running the generated installer installs the app to `%LocalAppData%`, creates a desktop shortcut, and adds a start menu entry~~ | S10 |
| ~~Test installer on clean environment~~ | 1 | ~~Installer tested on a machine/VM without Node.js or development dependencies; app launches and database initialises correctly~~ | S5, S12 |
| ~~Uninstall verification~~ | 1 | ~~Uninstall removes application files, shortcuts, and start menu entry; does not delete user database without warning~~ | S12, B3 |
| ~~Code signing setup (if certificate available)~~ | 1 | ~~`.exe` and installer show valid publisher; SmartScreen warning suppressed (or documented if certificate unavailable)~~ | S17, S10 |

**Day 1–3 Subtotal:** 5 points — Completed 18th June 2026. See `sprint-06-week2-verification.md` for full results.

---

### Day 3–5: Documentation

| Task | Story Points | Acceptance Criteria | KSBs |
|------|-------------|---------------------|------|
| Write user guide (`docs/user-guide.md`) | 2 | Covers: installation, adding a device, starting monitoring, reading the dashboard, viewing history, exporting data, configuring alerts; includes annotated screenshots | S15, B7 |
| Update technical architecture documentation | 1 | `docs/technical-deep-dive.md` reflects final state: accurate file paths, current dependency versions, final database schema, and IPC channel list | S8, K11 |
| Write deployment guide | 1 | Step-by-step installation instructions, system requirements (Windows 10+, Node.js not required), and first-run setup | S15, S10 |
| Update README with final project summary | 1 | README includes: project overview, tech stack, install instructions, development setup, test commands, and screenshot | S15, B7 |

**Day 3–5 Subtotal:** 5 points

---

### Day 5–6: KSB Evidence Portfolio

| Task | Story Points | Acceptance Criteria | KSBs |
|------|-------------|---------------------|------|
| Evidence mapping matrix | 1 | Spreadsheet or markdown table mapping every S1–S17, K1–K12, B1–B9 to a specific file, commit, or document with line numbers where possible | S15, B1 |
| Screenshot compilation | 1 | Minimum 10 annotated screenshots covering: dashboard, device CRUD, latency chart, outage analysis, export manager, alert configuration, alert history, dark mode, query builder, installer | S15, S2 |
| Code snippet selection | 1 | 8–12 snippets demonstrating complexity (e.g., database singleton, IPC validation, alert state machine, Recharts integration) with explanatory captions | S15, S1, S8 |
| Evidence narrative write-up | 1 | 500-word summary linking apprenticeship journey to KSBs: challenges faced, decisions made, and skills demonstrated | S15, B7, B9 |

**Day 5–6 Subtotal:** 4 points

---

### Day 7: Final Review & Sprint Closure

| Task | Story Points | Acceptance Criteria | KSBs |
|------|-------------|---------------------|------|
| Product Owner review with line manager | 1 | Demo of installed app, walkthrough of documentation, and evidence folder; written sign-off or email confirmation captured | S15, B4 |
| Sprint 6 retrospective write-up | 1 | Document completed in `docs/retrospectives/sprint-06-retrospective.md` covering what went well, what could improve, and final metrics | S11, B7 |
| Repository cleanup and final merge | 1 | All feature branches merged to `main`; temporary planning files removed; final commit tagged `v1.0.0` | S14, B3 |
| Backup evidence and project archive | 1 | Evidence folder, final `.exe` installer, and repo ZIP copied to apprenticeship portfolio location | B1, B5 |

**Day 7 Subtotal:** 4 points

---

## Week 2 Summary

| Metric | Value |
|--------|-------|
| Total story points | 18 |
| Focus areas | Distribution, documentation, evidence, sign-off |
| Deliverable by 24th June | Installable Windows application, complete documentation set, and KSB evidence portfolio ready for EPA review |

---

## Sprint 6 Overall Completion Criteria

All items below must be true before the sprint is considered complete:

- [x] Packaged `.exe` installs and runs on a clean Windows machine (proxy test; VM test deferred)
- [x] All 450+ tests passing with 80%+ coverage (478 tests passing)
- [x] Lint and typecheck report zero issues
- [ ] Security checklist completed with no open findings
- [ ] User guide, technical documentation, and deployment guide written and reviewed
- [ ] KSB evidence mapped and compiled
- [ ] Line manager sign-off obtained
- [ ] Final release tagged in Git

---

## KSBs Addressed This Sprint

**Skills:** S1, S3, S4, S5, S7, S8, S10, S12, S13, S15, S16, S17  
**Knowledge:** K7, K10, K11, K12  
**Behaviours:** B1, B3, B4, B5, B6, B7, B9

---

**Document Version:** 1.0  
**Last Updated:** 14th June 2026  
**Branch:** `feature/sprint-6-week-2`
