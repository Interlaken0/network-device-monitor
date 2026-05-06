# ADR-004: State Management Selection

## Status
Accepted

## Context
The network device monitor requires state management for:
- Device list (CRUD operations, 10-50 devices)
- Real-time ping results per device (5-second intervals)
- Monitoring status (which devices are actively being pinged)
- UI state (editing modes, modal visibility, form data)

The application runs in Electron with React in the renderer process. State synchronises between main process (database, ping service), renderer process (React UI), and IPC layer. Zustand replaced React useState as the application grew beyond simple prop drilling.

## Decision
Selected **Zustand 5.0.12** for client-side state management.

**Implementation Status:** Fully implemented in Sprint 3

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

**Implemented Store Architecture:**

Two Zustand stores manage application state in `src/renderer/stores/`:

1. **deviceStore.js** — Device management and monitoring state:
   - `devices` — Device list from database
   - `pingResults` — Real-time ping data keyed by device ID
   - `pingHistory` — Historical latency data for charting
   - `isMonitoring` — Monitoring status per device
   - `editingDevice`, `deleteModal` — UI modal states
   - `newDeviceForm`, `editForm` — Form input states
   - Actions: `loadDevices`, `createDevice`, `updateDevice`, `deleteDevice`, `startMonitoring`, `stopMonitoring`, `setPingResult`

2. **themeStore.js** — UI theme state:
   - `theme` — Current theme ('light' or 'dark')
   - Actions: `toggleTheme`, `initialiseTheme`

**Store Pattern:**
- Selectors exported for optimised re-rendering (e.g., `selectDevices`, `selectPingResults`)
- `devtools` middleware enabled for Redux DevTools integration
- Actions use `getState()` for stable references in effects
- Database remains source of truth; stores hold ephemeral UI state

## References
- `src/renderer/App.jsx` — Uses `useDeviceStore` and `useThemeStore` exclusively
- `src/renderer/stores/deviceStore.js` — Device state with selectors and actions
- `src/renderer/stores/themeStore.js` — Theme management
- `docs/technical-deep-dive.md` — Section 2.5 for state management comparison
- Zustand documentation: https://docs.pmnd.rs/zustand

---

**Decision Date:** 15th April 2026  
**Decided By:** Development Team  
**Last Updated:** 6th May 2026  
**Verified:** Zustand ^5.0.12 in package.json dependencies; stores fully implemented with deviceStore.js and themeStore.js; App.jsx uses Zustand hooks exclusively
