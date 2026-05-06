# ADR-003: React 18 Framework Selection

## Status
Accepted

## Context
The network device monitor required a UI library for building the dashboard interface in the Electron renderer process. The application needed:
- Component-based architecture for device cards, forms, and status indicators
- Real-time state updates for ping results
- Chart integration for latency visualisation (Sprint 3)
- Rapid development within the 12-week apprenticeship timeline

The evaluation occurred during Sprint 1 alongside Electron setup. Both React 18 and Vue 3 were already supported by the project scaffolding, requiring a deliberate choice.

## Decision
Selected **React 18.x** with functional components and hooks for all UI development.

## Consequences

### Positive
- **Familiarity from Temperature Plotter** — Existing project experience reduced learning curve and accelerated Sprint 1 delivery
- **Vast ecosystem and documentation** — Extensive third-party libraries (Recharts for Sprint 3 charts), Stack Overflow resources, and established patterns
- **Concurrent rendering features** — React 18's automatic batching and Suspense improve performance for real-time ping updates
- **JSX readability for complex UIs** — Device dashboard with multiple status indicators and edit forms benefits from inline JavaScript expressions
- **Strong TypeScript support** — Type definitions readily available for all dependencies (though project uses JSDoc)

### Negative
- **Larger bundle size than Vue 3** — ~40KB gzipped additional overhead
- **More complex state management boilerplate** — useState/useEffect patterns more verbose than Vue's reactive syntax
- **JSX compilation step required** — Babel transformation adds build complexity compared to Vue's template compiler
- **Ecosystem fragmentation** — Multiple state management solutions (Redux, Zustand, Context) require explicit selection

## Alternatives Considered

| Framework | Why Rejected |
|-----------|--------------|
| **Vue 3** | Excellent composition API and smaller bundle, but would require learning new patterns mid-apprenticeship. Limited prior experience meant slower initial development. |
| **Svelte** | Smallest bundle and no virtual DOM, but ecosystem less mature for charting libraries (critical for Sprint 3). Steeper learning curve for time-constrained project. |
| **SolidJS** | Fine-grained reactivity with excellent performance, but very new ecosystem. Risk of missing libraries or community support during apprenticeship. |
| **Vanilla JS** | No framework overhead, but would require building custom component system. Not viable within 12-week timeline for complex dashboard. |

## Related Decisions
- ADR-004: Zustand for state management (complements React's component model)
- ADR-006: Vite for build tooling (first-class React support via @vitejs/plugin-react in electron.vite.config.js)
- Recharts library for latency charts (React-native, selected for Sprint 3)

## Implementation Notes

React is used exclusively in the renderer process (`src/renderer/`):
- `App.jsx` — Root component managing device list, forms, and monitoring state
- Functional components with hooks — useState for local state, useEffect for IPC listeners
- Zustand for global state — Device and theme stores eliminate prop drilling (ADR-004)
- Real-time updates — IPC events trigger state updates, React handles efficient re-rendering

Component hierarchy:
```
App
├── Dashboard (device overview with latency charts)
├── Add Device Form (create)
├── Device List
│   └── Device Item (view/edit/delete inline)
│       ├── Device Info (name, IP, type, location)
│       ├── Device Status (latency badge)
│       └── Device Actions (start/stop/edit/delete)
├── Delete Modal (confirmation)
└── Live Ping Results (real-time log section)
```

## References
- `src/renderer/App.jsx` — Root React component with device management UI
- `src/renderer/main.jsx` — React 18 entry point with createRoot API
- `electron.vite.config.js` — @vitejs/plugin-react for renderer process (lines 44)
- `docs/technical-deep-dive.md` — Section 1.2 for UI framework comparison
- `docs/retrospectives/sprint-01.md` — Sprint 1 retrospective covering React setup

---

**Decision Date:** 2nd April 2026  
**Decided By:** Development Team  
**Last Updated:** 6th May 2026  
**Verified:** React ^18.2.0 in package.json; createRoot in main.jsx; @vitejs/plugin-react in electron.vite.config.js
