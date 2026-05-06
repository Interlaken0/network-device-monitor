# ADR-006: Build Tool Selection

## Status
Accepted

## Context
The network device monitor required a build tool to:
- Bundle React JSX and modern JavaScript for Electron
- Handle Electron's multi-process architecture (main, preload, renderer)
- Provide fast development iteration (HMR) within tight sprint deadlines
- Optimise production builds for distribution
- Support native Node.js modules (better-sqlite3, ping)

The evaluation occurred during Sprint 1 project setup alongside Electron and React selection.

## Decision
Selected **Vite 5.x** with Electron Vite integration for all build processes.

## Consequences

### Positive
- **Instant Hot Module Replacement (HMR)** — Changes visible in <100ms vs 3-5 seconds with Webpack. Critical for rapid UI iteration.
- **Native ES modules** — No bundling in development, direct browser/Node.js module loading. Faster startup.
- **Electron-optimised configuration** — electron-vite handles main/preload/renderer processes with minimal configuration
- **Optimised production builds** — Rollup-based production output with tree-shaking and code splitting
- **TypeScript support** — First-class support without complex loader configuration
- **Modern by default** — Targets modern browsers/Electron versions, no polyfill bloat

### Negative
- **Newer ecosystem** — Some Webpack plugins unavailable, though Electron Vite covers core requirements
- **Different configuration model** — Vite config not directly transferable from Webpack experience
- **Native module handling** — electron-rebuild integration less mature than Webpack's native-loader
- **Smaller community** — Fewer Stack Overflow answers compared to Webpack, though growing rapidly

## Alternatives Considered

| Tool | Why Rejected |
|------|--------------|
| **Webpack 5** | Industry standard with extensive configuration options, but slow development builds. Complex configuration for Electron multi-process setup. |
| **Parcel** | Zero-config appeal, but less control over Electron-specific requirements. Tree-shaking less effective than Vite/Rollup. |
| **esbuild** | Extremely fast, but limited plugin ecosystem. No built-in HMR support at evaluation time. |
| **Rollup directly** | Excellent output, but requires significant configuration for development server and HMR. |
| **Create React App (CRA)** | Electron integration complex, ejection required for customization. Slower than Vite, opinionated defaults not suited for Electron. |

## Related Decisions
- ADR-001: Electron framework (Vite has dedicated Electron plugins)
- ADR-003: React 18 (@vitejs/plugin-react provides JSX transformation and HMR)
- electron-vite vs electron-builder — Selected electron-vite for build tool integration

## Implementation Notes

Vite configuration via electron-vite in single file:
- `electron.vite.config.js` — Configures main, preload, and renderer processes

Multi-process build handled by electron-vite:
```javascript
// electron.vite.config.js
export default defineConfig({
  main: { /* Node.js build with externalizeDepsPlugin */ },
  preload: { /* Preload script build */ },
  renderer: { /* React build with @vitejs/plugin-react */ }
})
```

Development workflow:
1. `npm run dev` — Starts Vite dev server for renderer, Electron main process
2. HMR updates renderer instantly without full Electron restart
3. Main process changes trigger Electron restart (slightly slower)

Production builds:
1. `npm run build` — Vite bundles renderer, electron-vite bundles main/preload
2. `npm run make` — Electron Forge creates distributable from Vite output

Native module handling:
- better-sqlite3 and ping marked as `external` in Vite config (not bundled)
- electron-rebuild compiles native modules for target Electron version

## References
- `electron.vite.config.js` — Vite configuration for main, preload, and renderer processes
- `package.json` — Vite ^5.0.0 and electron-vite ^2.0.0 in devDependencies; scripts: `dev`, `build`, `make`
- `docs/technical-deep-dive.md` — Section 3.1 for build tool comparison
- Vite documentation: https://vitejs.dev/
- Electron Vite documentation: https://electron-vite.org/

---

**Decision Date:** 2nd April 2026  
**Decided By:** Development Team  
**Last Updated:** 6th May 2026  
**Verified:** Vite ^5.0.0 and electron-vite ^2.0.0 in package.json; electron.vite.config.js configures all three processes
