# ADR-009: Ping Library Selection

## Status
Accepted

## Context

The network device monitor requires ICMP ping capability to measure device availability and latency. The application needed a library that could:

- Execute pings across Windows, macOS, and Linux without platform-specific code
- Return Promise-based results for integration with the async monitoring loop
- Provide latency measurements accurate enough for 5-second interval monitoring
- Operate without elevated privileges or administrator access on Windows
- Integrate cleanly with Electron's main process and native module architecture

The evaluation occurred during Sprint 1 (1st-15th April 2026) alongside Electron setup and the initial device monitoring implementation. At this point the team had already rejected raw ICMP sockets (documented as ADR-R002), leaving npm-based wrapper libraries as the practical path forward.

## Decision

Selected **ping 0.4.4** (npm) as the ICMP ping implementation for all device monitoring.

## Consequences

### Positive

- **Cross-platform without platform-specific code** — The library wraps the system's `ping` binary with correct flags for each OS. `src/main/services/ping-service.js:115-119` switches between Windows (`-n 1 -w 3000`) and Unix (`-c 1`) flags automatically via `os.platform()`.
- **No administrator privileges required** — Uses the standard system `ping` binary rather than raw sockets, avoiding the Windows UAC elevation that blocked ADR-R002.
- **Promise-based API** — `ping.promise.probe()` returns a clean result object with `alive`, `time`, and `host` properties, fitting naturally into the async `_pingOnce()` method at `src/main/services/ping-service.js:117-120`.
- **Automatic child process management** — The library handles spawning, timeout control, and stdout parsing internally. The application only needs to pass an IP address and options object.
- **Mature and stable** — Zero-dependency library with consistent behaviour across platforms. The project has not encountered a single ping-library-specific bug across Sprints 1-5.

### Negative

- **Relies on external system binary** — Requires the `ping` executable to exist on the host system. This is a safe assumption for all supported platforms but represents a loose coupling.
- **Slightly higher latency than raw sockets** — System binary invocation adds ~10-20ms overhead per ping. For 5-second interval monitoring this is negligible.
- **Limited packet-level control** — Cannot customise TTL, packet size, or ICMP payload. These were not required for the apprenticeship scope.
- **Output parsing fragility** — Relies on parsing `ping` command stdout, which could theoretically break with OS updates. In practice this has not occurred.

## Alternatives Considered

| Library | Why Rejected |
|---------|--------------|
| **node-net-ping** | Raw ICMP sockets require administrator privileges on Windows (UAC prompt). This blocked the goal of a standalone desktop tool that runs without elevation. Documented rejection in ADR-R002. |
| **Raw child_process.exec of system ping** | Would require manual stdout parsing per operating system, per locale, and per ping version. Fragile and maintenance-heavy compared to a tested wrapper. |
| **net-ping-fix** | Fork of node-net-ping with bug fixes, but inherits the same raw-socket privilege requirement. Smaller community than the main `ping` library. |
| **node-icmp** | Lower-level than required. Would need custom Promise wrapping, timeout handling, and cross-platform flag management — essentially rebuilding what `ping` already provides. |

## Related Decisions

- ADR-001: Electron Framework Selection (native Node.js module support in main process enables ping library execution)
- ADR-R002: Raw ICMP Sockets (Rejected) — the `ping` library was selected as the practical alternative after raw sockets were ruled out
- `src/main/services/network-monitor.js` — coordinates multiple PingService instances for concurrent device monitoring
- `src/main/services/ping-service.js` — wraps the `ping` library with AbortController cancellation, outage detection, and automatic database logging

## Implementation Notes

**PingService Architecture (`src/main/services/ping-service.js`)**

The `PingService` class wraps the `ping` library in an abstraction layer that adds:

- **AbortController-based cancellation** — `stop()` aborts the signal chain, preventing orphaned ping schedules when monitoring stops (`src/main/services/ping-service.js:86-101`)
- **Automatic database logging** — Every ping result is persisted via `getDatabase().recordPing()` regardless of success or failure (`src/main/services/ping-service.js:149-150`, `193-194`)
- **Outage detection with threshold logic** — Consecutive failures tracked against configurable thresholds (`consecutiveFailures: 3` by default). Only creates an outage record once the threshold is breached (`src/main/services/ping-service.js:233-255`)
- **High-latency tracking** — Latency exceeding 1000ms triggers a warning-level outage; exceeding 5000ms triggers critical (`src/main/services/ping-service.js:166-169`, `325-339`)
- **Running statistics** — Maintains a rolling window of the last 10 latencies for real-time average, min, and max (`src/main/services/ping-service.js:278-294`)

**Cross-Platform Invocation**

```javascript
// src/main/services/ping-service.js:115-120
const isWindows = os.platform() === 'win32'

const result = await ping.promise.probe(this.ipAddress, {
  timeout: 3,
  extra: isWindows ? ['-n', '1', '-w', '3000'] : ['-c', '1']
})
```

**NetworkMonitor Coordination**

`NetworkMonitor` (`src/main/services/network-monitor.js`) manages a `Map<number, PingService>` of active monitoring sessions. It creates one `PingService` instance per device, routes ping results through the `AlertEngine` (Sprint 5), and broadcasts results to all renderer windows via `BrowserWindow.webContents.send()` (`src/main/services/network-monitor.js:189-195`).

**Package Reference**

- `package.json:32` — `"ping": "^0.4.4"` in dependencies

## References

- `src/main/services/ping-service.js` — PingService class with outage detection and database integration
- `src/main/services/network-monitor.js` — Multi-device coordination and renderer broadcast
- `package.json` — ping ^0.4.4 dependency
- `docs/technical-deep-dive.md` — Section 2.4 for library comparison and PingService architecture
- `docs/retrospectives/sprint-01.md` — Sprint 1 retrospective covering ping timeout handling and AbortController integration
- `docs/architecture-decisions.md` — ADR-R002: Raw ICMP Sockets (Rejected)

---

**Decision Date:** 3rd April 2026
**Decided By:** Development Team
**Last Updated:** 6th May 2026
**Verified:** ping ^0.4.4 in package.json; PingService implemented with outage detection and cross-platform flags; 451+ tests passing across monitoring pipeline
