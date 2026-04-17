# User Persona

**Project:** AMF Network Device Monitor  
**Purpose:** Capture the actual user context for this apprenticeship project  
**Date:** 18/04/2026  
**Last Updated:** 18/04/2026  

---

## The Reality Check

This application is being developed by **Greg** (Software Development Apprentice) for **Jeff** at JJ Confederation Ltd. There are no fictional "Alex Thompsons" or "Sarah Chens" — there's just Jeff, the solo IT developer/administrator who needs to monitor network devices.

This document captures the actual usage context rather than invented personas.

---

## Project Context

| Role | Who | Context |
|------|-----|---------|
| **Developer** | Greg (Apprentice) | Building the application as part of Level 4 Software Developer apprenticeship |
| **User** | Jeff (Employer/Mentor) | Solo IT Developer/Administrator at JJ Confederation Ltd |
| **Organisation** | JJ Confederation Ltd | Small company where Jeff handles all IT infrastructure |

---

## The Actual User: Jeff at JJ Confederation Ltd

### Who

| Attribute | Detail |
|-----------|--------|
| **Name** | Jeff |
| **Organisation** | JJ Confederation Ltd |
| **Role** | Solo IT Developer/Administrator |
| **Responsibilities** | Everything — development, deployment, maintenance, support for company infrastructure |
| **Relationship to Project** | Employer and mentor to Greg; will use this application in daily work |

### What They Need

Since Jeff handles all IT at JJ Confederation Ltd solo, this application needs to:

1. **Work reliably** — Jeff cannot debug monitoring issues while debugging network issues
2. **Be simple to operate** — One person handling everything has no time for complex workflows
3. **Store data locally** — No reliance on external services that might complicate deployment
4. **Start quickly** — No lengthy configuration; devices added in seconds
5. **Show status at a glance** — Visual indicators, not logs to parse

### Current Workflow (Before This App)

```
User reports issue
        ↓
Jeff opens terminal
        ↓
Manual ping to suspected device
        ↓
Repeat for other devices if first isn't the problem
        ↓
Fix the issue
        ↓
No record of what happened or when
```

### Target Workflow (With This App)

```
Dashboard shows amber/red indicator
        ↓
Jeff investigates before users notice
        ↓
Fix the issue
        ↓
Historical data available if patterns emerge
```

### Technical Context

- **Development:** Greg (apprentice) building for Jeff (employer) — requirement clarity and maintainability matter
- **Deployment:** Electron app on Windows (JJ Confederation Ltd environment)
- **Network Size:** Small to medium — enough devices that manual pinging is tedious, not so many that enterprise tooling is justified
- **Jeff's Technical Level:** Developer-level; comfortable with databases, can write SQL if needed, but prefers a GUI

### Constraints Informing Design

| Constraint | Implication |
|------------|-------------|
| Solo operation at JJ Confederation Ltd | No complex multi-user workflows or permission systems needed |
| Apprenticeship timeline | Features must be deliverable within sprint boundaries |
| No dedicated infrastructure | Local SQLite database, not external services |
| Windows environment | Primary platform support, cross-platform nice-to-have |

---

## Feature Priority (Jeff's Perspective)

**Must Have:**
- Add/remove devices quickly
- Real-time ping status with visual indicators
- Persistent storage of devices and ping history
- Desktop notifications for failures

**Should Have:**
- Basic historical data view
- CSV export for reporting
- Configurable ping intervals

**Nice to Have:**
- Fancy visualisations
- Alert threshold customisation
- Multi-platform packages

**Won't Have (Yet):**
- Multi-user support
- Cloud sync
- Complex role-based permissions

---

## How to Use This Document

When deciding whether to build a feature, ask:

> *"Does this make Jeff's life easier, or does it add complexity without value?"*

When writing user stories, use first-person:

> *"As the network admin, I want to see device status at a glance so I don't waste time on manual checks."*

---

## Related Documentation

- `user-stories.md` — Requirements written from Jeff's perspective
- `agile-strategy.md` — Sprint planning based on actual capacity
- `architecture-decisions.md` — Technical choices driven by solo-dev context

---

*This document reflects reality: Greg building for Jeff at JJ Confederation Ltd. Update if the team structure or project scope changes.*
