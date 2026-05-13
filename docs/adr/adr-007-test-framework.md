# ADR-007: Jest over Vitest for Testing

## Status
Accepted (Provisional)

## Context
The project required a test runner for unit and integration tests that could support Electron, React, and the existing JavaScript toolchain.

Key requirements:
- Stable support for Jest-style test suites already used in earlier sprints
- Compatibility with the current Electron renderer/main/preload structure
- Existing integration with Babel and JSDOM for component tests
- Predictable command-line scripts for CI and local development
- Flexible enough to support future iteration on test strategy

During Sprint 1 the team reviewed Jest vs Vitest. Vitest offered a modern, faster developer experience, but the existing codebase and current test setup were already aligned with Jest. By Sprint 3 the testing infrastructure had matured enough to make a provisional decision while leaving a future switch path open.

## Decision
Selected **Jest** as the test runner for the current project.

## Consequences

### Positive
- **Existing repo alignment** — `package.json` and `jest.config.js` already support the current test suites.
- **Mature Electron support** — Jest works with Electron/renderer integration and the `--experimental-vm-modules` execution path.
- **Wide ecosystem** — Jest is compatible with `@testing-library/jest-dom`, mocks, snapshots, and existing test utilities.
- **Stable CI behaviour** — Existing CI/test command expectations match Jest outputs and coverage tooling.
- **Low switching cost for now** — No immediate migration required, which keeps Sprint 3 delivery focused on dashboard and outage features.

### Negative
- **Slower test startup than Vitest** — Jest is generally slower for repeated developer feedback loops.
- **More configuration overhead** — Requires explicit Babel/JSX handling and module interop compared to Vitest's modern defaults.
- **Potential future migration** — If the project later prioritises faster iteration, a switch to Vitest may still be desirable.

## Alternatives Considered

| Tool | Why Rejected |
|------|--------------|
| **Vitest** | Faster startup and native Vite integration, but not yet aligned with the current repository's Jest-based setup and Electron testing path. Best deferred until the testing architecture stabilises. |
| **Mocha** | Flexible and familiar, but would require additional assertion/DOM libraries and more setup than Jest. |
| **Jasmine** | Older ecosystem and less modern integration with React/Electron than Jest. |
| **Cypress** | Excellent for end-to-end testing, but not a replacement for unit/integration test runner choice. |

## Related Decisions
- ADR-003: React 18 Framework Selection (the renderer uses React components that need a compatible test runner)
- ADR-006: Build Tool Selection (Vite build tool supports React and Electron, but Jest remains the current test runner)

## Implementation Notes

Current repository test setup:
- `package.json` scripts:
  - `npm test` — runs Jest
  - `npm run test:unit` — runs Jest on `tests/unit`
  - `npm run test:integration` — runs Jest on `tests/integration`
  - `npm run test:coverage` — runs Jest coverage and fixes timezone output
- `jest.config.js` — Jest configuration for the project
- `.eslintrc.json` — includes `jest: true` environment
- `tests/` — existing unit, integration, and mock suites

The decision is intentionally provisional, with the intention to review Vitest again after the current testing approach solidifies.

## References
- `package.json` — Jest scripts and dependencies
- `jest.config.js` — Jest configuration
- `README.md` — test usage documentation
- `tests/` — current Jest test suites

---

**Decision Date:** 13th May 2026  
**Decided By:** Development Team  
**Last Updated:** 13th May 2026  
**Verified:** `jest` is installed in package.json; `jest.config.js` exists; `npm test` uses Jest.