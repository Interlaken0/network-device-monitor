# Architecture Decision Records (ADRs)

**Project:** AMF Network Device Monitor  
**Organisation:** JJ Confederation Ltd  
**Status:** Active Development  
**Format:** ADR-001 to ADR-XXX

---

## ADR-001: Electron over Tauri for Desktop Framework

**Status:** ✅ Accepted  
**Date:** April 2026  
**Deciders:** Developer, Line Manager (Product Owner)  

### Context

The application requires a cross-platform desktop solution with:
- Native Node.js module support (for better-sqlite3, ping)
- Proven security model (building on Temperature Plotter experience)
- Rapid development within 12-week apprenticeship timeline
- Strong KSB evidence for software development skills

Options considered:
- **Electron** (Node.js + Chromium)
- **Tauri** (Rust + WebView2)
- **WPF** (Windows Presentation Foundation)
- **Flutter Desktop**

### Decision

**Selected: Electron 28.x**

### Consequences

**Positive:**
- Mature ecosystem with extensive documentation
- Native Node.js module support without FFI complexity
- Existing project knowledge from Temperature Plotter
- Clear KSB evidence path (S1, S10, K7)
- Extensive debugging tools (DevTools, React DevTools)

**Negative:**
- Larger bundle size (~150MB vs Tauri's ~5MB)
- Higher memory footprint
- Security requires discipline (contextIsolation, nodeIntegration)

### Mitigations

- Strict security configuration (contextIsolation: true, nodeIntegration: false)
- Code signing for installer distribution
- Regular Electron security updates

### KSB Evidence

- **K7:** Design patterns (security architecture)
- **S10:** Build and deployment (packaging)
- **B8:** Research and evaluation of alternatives

---

## ADR-002: better-sqlite3 over node-sqlite3

**Status:** ✅ Accepted  
**Date:** April 2026  
**Deciders:** Developer

### Context

SQLite database access required for synchronous operations in main process:
- Device CRUD operations
- Time-series ping data logging
- Historical query analysis

Options considered:
- **better-sqlite3** (synchronous, C++ bindings)
- **node-sqlite3** (asynchronous, callback-based)
- **node-sqlite3-wasm** (WASM, no native compilation)
- **Lowdb** (JSON-based, no SQL)

### Decision

**Selected: better-sqlite3 9.x**

### Consequences

**Positive:**
- Synchronous API simplifies IPC architecture
- Fastest SQLite performance for desktop
- Prepared statement support
- No callback hell

**Negative:**
- Requires native compilation (electron-rebuild)
- Single-threaded (main process only)
- Potential packaging complexity

### Mitigations

- Pre-build testing in Sprint 1
- electron-rebuild configuration in build pipeline
- Fallback documentation if compilation fails

### KSB Evidence

- **K10:** Database principles (relational design, normalisation)
- **S1:** Logical code (singleton pattern, prepared statements)
- **S10:** Build and deployment (native module handling)

---

## ADR-003: React 18 over Vue 3 for UI Framework

**Status:** ✅ Accepted  
**Date:** April 2026  
**Deciders:** Developer

### Context

Modern UI framework required for:
- Component-based architecture
- State management integration
- Charting library compatibility
- Transferable job market skills

Options considered:
- **React 18** (Concurrent Features, largest ecosystem)
- **Vue 3** (Composition API, gentle learning curve)
- **Svelte** (compiler-based, smallest bundle)
- **SolidJS** (fine-grained reactivity)

### Decision

**Selected: React 18 with JSX**

### Consequences

**Positive:**
- Largest ecosystem and job market
- Excellent Recharts integration
- Mature testing tools (React Testing Library)
- Extensive documentation

**Negative:**
- Requires separate state management library
- Can lead to over-engineering
- JSX learning curve if unfamiliar

### Mitigations

- Zustand for lightweight state management
- Component composition patterns enforced
- ESLint rules to prevent over-engineering

### KSB Evidence

- **S2:** User interfaces (React component design)
- **K4:** Communication (component documentation)
- **B9:** CPD (modern framework skills)

---

## ADR-004: Zustand over Redux for State Management

**Status:** ✅ Accepted  
**Date:** April 2026  
**Deciders:** Developer

### Context

Global state management required for:
- Device list across components
- Real-time ping results
- Alert states
- UI preferences

Options considered:
- **Zustand** (1KB, hooks-based)
- **Redux Toolkit** (11KB, enterprise standard)
- **Jotai** (atom-based, similar size)
- **Context API** (built-in, prop drilling issues)

### Decision

**Selected: Zustand**

### Consequences

**Positive:**
- Minimal boilerplate
- Excellent TypeScript support
- DevTools middleware available
- No Provider wrapper required

**Negative:**
- Smaller community than Redux
- Fewer enterprise examples

### Mitigations

- Document patterns in Architecture docs
- Slice pattern for scalability
- Persistence middleware for settings

### KSB Evidence

- **K7:** Design patterns (state management)
- **S1:** Logical code (store architecture)
- **B2:** Logical thinking (state flow design)

---

## ADR-005: Recharts over Chart.js for Visualisation

**Status:** ✅ Accepted  
**Date:** April 2026  
**Deciders:** Developer

### Context

Charting library required for:
- Latency trend line charts
- Time-series data visualisation
- Real-time updates (5 second intervals)
- React integration

Options considered:
- **Recharts** (React-native, composable)
- **Chart.js** (Canvas-based, fast)
- **D3.js** (custom, steep learning curve)
- **Victory** (React Native crossover)

### Decision

**Selected: Recharts**

### Consequences

**Positive:**
- Declarative React API
- SVG-based (accessible)
- Good documentation
- Composable components

**Negative:**
- Performance drops with >1000 points
- Larger bundle than Chart.js

### Mitigations

- Data decimation for large datasets
- Time range limits (max 7 days detail)
- Canvas fallback if performance issues arise

### KSB Evidence

- **S2:** User interfaces (chart integration)
- **S16:** Algorithms (data decimation)

---

## ADR-006: Vite over Webpack for Build Tool

**Status:** ✅ Accepted  
**Date:** April 2026  
**Deciders:** Developer

### Context

Modern build tool required for:
- Fast development HMR
- Native ES modules support
- Electron compatibility
- TypeScript support (future migration)

Options considered:
- **Vite** (ESM, fast HMR, ~300ms cold start)
- **Webpack** (mature, slower ~3s cold start)
- **esbuild** (fast, limited Electron tooling)
- **Parcel** (zero-config, less control)

### Decision

**Selected: Vite 5.x**

### Consequences

**Positive:**
- Near-instant HMR
- Native ES modules in development
- Excellent Electron plugin ecosystem
- Fast production builds

**Negative:**
- Less mature than Webpack
- Some plugins may be less stable
- ESM vs CJS issues with native modules

### Mitigations

- Thorough testing with better-sqlite3
- Rollup configuration for production
- External native module handling

### KSB Evidence

- **S10:** Build and deployment (tooling)
- **K7:** Design patterns (build architecture)
- **B8:** Research (tool evaluation)

---

## ADR-007: Jest over Vitest for Testing

**Status:** ⚠️ Provisional  
**Date:** April 2026  
**Deciders:** Developer

### Context

Testing framework required for:
- Unit tests (80% coverage target)
- Integration tests (database, IPC)
- React component testing
- Coverage reporting

Options considered:
- **Jest** (industry standard, Electron support)
- **Vitest** (Vite-native, faster)
- **Node Test Runner** (native, less mature)
- **Mocha** (older, less React integration)

### Decision

**Provisional: Jest 29.x**

**Revisit:** Sprint 1 if Vite integration proves problematic

### Consequences

**Positive:**
- Proven Electron testing patterns
- React Testing Library integration
- Extensive mocking capabilities
- Coverage tools mature

**Negative:**
- Slower than Vitest
- CJS vs ESM configuration complexity
- Separate from Vite ecosystem

### Mitigations

- Vitest investigation in Sprint 1 spike
- Parallel configuration possible
- Focus on test patterns over framework

### KSB Evidence

- **S4:** Unit testing (framework setup)
- **S13:** Testing frameworks (configuration)
- **K12:** Testing frameworks (principles)

---

## ADR-008: GitHub Flow over GitFlow for Branching

**Status:** ✅ Accepted  
**Date:** April 2026  
**Deciders:** Developer

### Context

Git workflow required for:
- Single developer (apprenticeship)
- Line manager review points
- EPA evidence portfolio
- Clear commit history

Options considered:
- **GitHub Flow** (simple, trunk-based)
- **GitFlow** (complex, release branches)
- **Trunk-Based Development** (continuous)
- **Feature Branching** (informal)

### Decision

**Selected: GitHub Flow**

### Consequences

**Positive:**
- Simple for single developer
- PR-based review with line manager
- Clean main branch history
- Suitable for apprenticeship scope

**Negative:**
- No explicit release branches
- Requires discipline with PRs

### Mitigations

- Protected main branch
- PR template with KSB checklist
- Squash merge for clean history

### KSB Evidence

- **S14:** Version control (branching strategy)
- **B1:** Independent working (self-directed workflow)

---

## Rejected Decisions (Documented)

### ADR-R001: TypeScript from Day One (Rejected)

**Status:** ❌ Rejected (Deferred to Sprint 5)  
**Date:** April 2026  
**Reason:** Migration path preferred over initial complexity

**Rationale:**
- Adds setup overhead in critical Sprint 1
- JSDoc provides sufficient documentation for assessment
- Migration plan documented in Technical-Deep-Dive.md
- TypeScript adds significant time to apprenticeship timeline

**Revisit:** Sprint 5 as enhancement

---

### ADR-R002: Raw ICMP Sockets (Rejected)

**Status:** ❌ Rejected  
**Date:** April 2026  
**Reason:** Complexity vs benefit analysis

**Rationale:**
- node-net-ping requires admin on Windows
- ping (npm) provides sufficient accuracy for monitoring
- Raw sockets add security review complexity
- No significant performance benefit for 5-second intervals

---

## Decision Log

| ADR | Decision | Status | Date | KSBs |
|-----|----------|--------|------|------|
| 001 | Electron over Tauri | ✅ Accepted | Apr 2026 | K7, S10, B8 |
| 002 | better-sqlite3 over node-sqlite3 | ✅ Accepted | Apr 2026 | K10, S1, S10 |
| 003 | React 18 over Vue 3 | ✅ Accepted | Apr 2026 | S2, K4, B9 |
| 004 | Zustand over Redux | ✅ Accepted | Apr 2026 | K7, S1, B2 |
| 005 | Recharts over Chart.js | ✅ Accepted | Apr 2026 | S2, S16 |
| 006 | Vite over Webpack | ✅ Accepted | Apr 2026 | S10, K7, B8 |
| 007 | Jest over Vitest | ⚠️ Provisional | Apr 2026 | S4, S13, K12 |
| 008 | GitHub Flow over GitFlow | ✅ Accepted | Apr 2026 | S14, B1 |

---

## Review Schedule

- **Provisional decisions:** Revisited end of Sprint 1
- **All decisions:** Reviewed at Sprint boundaries
- **Rejected decisions:** Reconsidered if blockers arise

---

**Document Version:** 1.0  
**Last Updated:** April 2026  
**Next Review:** End of Sprint 1
