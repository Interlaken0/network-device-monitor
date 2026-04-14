# ADR-001: Electron Framework Selection

## Status
Accepted

## Context
The network device monitor required a cross-platform desktop application with native system access for ICMP ping operations. We needed to evaluate desktop frameworks that could:
- Execute native Node.js modules (ping library)
- Provide secure IPC communication between UI and system layer
- Support rapid development within the 12-week apprenticeship timeline
- Build for Windows, macOS, and Linux from a single codebase

The evaluation occurred during Sprint 1 (1st-15th April 2026) alongside initial project setup and database schema design.

## Decision
Selected **Electron 28.x with Vite integration** as the desktop framework.

## Consequences

### Positive
- **Native Node.js module support without FFI complexity** — The ping library works directly in the main process, no Rust bindings or external services required
- **Mature ecosystem with proven patterns** — Extensive documentation, established security practices (context isolation, preload scripts), and community resources for troubleshooting
- **Existing project knowledge** — Prior experience with Electron from the Temperature Plotter application reduced learning curve
- **Secure IPC architecture** — Built-in context isolation forces explicit API design between renderer and main process
- **Single codebase for all platforms** — Windows, macOS, and Linux builds from identical source

### Negative
- **Larger bundle size** — ~150MB compared to ~5MB for Rust-based alternatives like Tauri
- **Higher memory footprint** — Chromium engine overhead for relatively simple UI requirements
- **Slower cold start** — Electron apps take longer to initialise than native equivalents

## Alternatives Considered

| Framework | Why Rejected |
|-----------|--------------|
| **Tauri** | Rust-based with smaller bundle size, but requires FFI complexity for native ping operations. Less mature ecosystem meant longer troubleshooting time when issues arose. |
| **WPF** | Windows-only with .NET dependency. No cross-platform capability, limiting deployment flexibility. |
| **Flutter Desktop** | Dart learning curve would consume sprint time. Limited native module support at evaluation time (April 2026). |
| **Web-only PWA** | No native ICMP ping capability — would require external service or backend, defeating the purpose of a standalone monitoring tool. |

## Related Decisions
- ADR-002: better-sqlite3 for synchronous database access (complements Electron's main process architecture)
- Security hardening via context isolation (see `src/preload/index.js`)
- Vite for build tooling (fast HMR during development, optimised production builds)

## Implementation Notes

The Electron architecture separates concerns across three entry points:
- `src/main/index.js` — Main process with secure window configuration, database initialisation, and IPC handler registration
- `src/preload/index.js` — Context-isolated bridge exposing only whitelisted API methods to renderer
- `src/renderer/` — React frontend running in sandboxed renderer process

This separation prevents renderer code from accessing Node.js APIs directly, mitigating XSS-to-RCE risks even if the UI is compromised.

## References
- `electron.vite.config.js` — Build configuration for main, preload, and renderer processes
- `src/main/index.js` — Main process entry with security-hardened window configuration
- `src/preload/index.js` — Context-isolated API bridge using `contextBridge.exposeInMainWorld`
- `docs/technical-deep-dive.md` — Section 1.1 for detailed framework comparison
- `docs/retrospectives/sprint-01.md` — Sprint 1 retrospective covering Electron setup challenges

---

**Decision Date:** 2nd April 2026  
**Decided By:** Development Team  
**Last Updated:** 13th April 2026
