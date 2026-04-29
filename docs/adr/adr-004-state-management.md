# ADR-004: State Management Selection

## Status
Accepted (Pending Implementation - Sprint 3)

## Context
The network device monitor requires state management for:
- Device list (CRUD operations, 10-50 devices)
- Real-time ping results per device (5-second intervals)
- Monitoring status (which devices are actively being pinged)
- UI state (editing modes, modal visibility, form data)

The application runs in Electron with React in the renderer process. State must synchronise between:
- Main process (database, ping service)
- Renderer process (React UI)
- IPC layer (async communication)

**Current State (Sprint 2):** Using React `useState` hooks in `App.jsx` — sufficient for MVP with limited device count.

**Future Need (Sprint 3):** As dashboard complexity grows with latency charts and cross-component state sharing, a dedicated store becomes necessary.

## Decision
Selected **Zustand 4.x** for client-side state management with selective persistence.

**Implementation Timeline:** Sprint 3 (Dashboard & Visualisation phase)

## Consequences

### Positive
- **Minimal boilerplate** — No providers, reducers, or action creators required. Stores are simple functions.
- **Excellent TypeScript support** — Type inference without explicit type definitions (though project uses JSDoc)
- **Small bundle size** — ~1KB compared to Redux's ~10KB with middleware
- **Middleware ecosystem** — persist, subscribe, and devtools middleware available if needed
- **React integration** — useStore hook follows React patterns, familiar to developers
- **No prop drilling** — Access store from any component without context providers

### Negative
- **Less structured than Redux** — No enforced action/reducer pattern. Discipline required to maintain conventions.
- **Smaller ecosystem** — Fewer third-party middleware compared to Redux
- **No time-travel debugging** — No built-in undo/redo (not required for this application)
- **Newer library** — Less community knowledge than Redux, though rapidly growing

## Alternatives Considered

| Solution | Why Rejected |
|----------|--------------|
| **Redux Toolkit** | Industry standard with excellent devtools, but significant boilerplate for simple device state. Overkill for CRUD + ping results pattern. |
| **React Context + useReducer** | Built-in React solution, but causes unnecessary re-renders when state changes. Context not optimised for high-frequency updates (ping results every 5s). |
| **Jotai** | Atomic approach interesting for fine-grained updates, but Zustand more familiar and better documented at evaluation time. |
| **MobX** | Powerful reactivity, but decorators and observables add learning curve. Bundle size larger than Zustand. |
| **No state library (props only)** | Unmanageable for multi-device dashboard with real-time updates. Would require significant prop drilling and callback passing. |

## Related Decisions
- ADR-003: React 18 framework (Zustand designed for React)
- Database as source of truth — Zustand holds ephemeral UI state, persistent data in SQLite
- IPC layer for main/renderer communication — Zustand does not replace IPC, complements it

## Implementation Notes

**Current Implementation (Sprint 2):**
React `useState` hooks in `App.jsx` manage all UI state:
- `devices` — Device list from database
- `pingResults` — Real-time ping data keyed by device ID
- `isMonitoring` — Monitoring status per device
- `editingDevice`, `deleteModal` — UI modal states
- `newDevice`, `editForm` — Form input states

This pattern is sufficient for Sprint 2's device management features. Props are passed to child components; no global store required.

**Planned Implementation (Sprint 3):**
Zustand will be installed (`npm install zustand`) and store modules created in `src/renderer/stores/`:
- `deviceStore.js` — Device list, CRUD operations
- `monitoringStore.js` — Ping results, monitoring status
- `uiStore.js` — Modal states, form data

Persistent state (devices, ping history) remains in better-sqlite3 (ADR-002). Zustand will provide:
- Cross-component state access without prop drilling
- Optimised re-rendering for real-time ping updates
- DevTools integration for debugging
- Foundation for Recharts integration with shared data

**Migration Path:**
Sprint 3 will refactor `App.jsx` state to Zustand stores incrementally:
1. Install Zustand dependency
2. Create store modules alongside existing useState
3. Migrate components one-by-one
4. Remove useState once all components migrated

## References
- `src/renderer/App.jsx` — React state management (useState pattern, Zustand prepared for Sprint 3)
- `src/renderer/stores/` — Directory prepared for Zustand store modules
- `docs/technical-deep-dive.md` — Section 2.5 for state management comparison
- Zustand documentation: https://docs.pmnd.rs/zustand

---

**Decision Date:** 15th April 2026  
**Decided By:** Development Team  
**Last Updated:** 29th April 2026  
**Verified:** Zustand NOT in package.json (pending Sprint 3 installation); `src/renderer/stores/` directory exists but empty; current state uses React useState in App.jsx
