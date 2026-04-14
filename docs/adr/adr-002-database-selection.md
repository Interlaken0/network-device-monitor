# ADR-002: Database Selection

## Status
Accepted

## Context
The network device monitor required persistent storage for:
- Device configuration (names, IP addresses, types, locations)
- Time-series ping results (timestamp, latency, success/failure)
- Outage tracking (start time, end time, duration, device ID)

Requirements included high-frequency writes (every 5 seconds per monitored device), fast queries for recent data, and zero external dependencies for standalone deployment.

## Decision
Selected **better-sqlite3 12.x** with synchronous API for all database operations.

## Consequences

### Positive
- **Synchronous API simplifies IPC architecture** — No async/await complexity in IPC handlers, eliminating race condition bugs
- **Fastest SQLite performance for desktop** — better-sqlite3 is 2-3x faster than node-sqlite3 for typical workloads
- **Prepared statement caching** — Repeated queries (device lookups, ping inserts) benefit from compiled statement reuse
- **Single-file database** — Zero configuration, easy backup/restore, portable across platforms
- **Native compilation handled** — electron-rebuild integrates cleanly with Electron's build pipeline

### Negative
- **Synchronous operations block the main thread** — Long-running queries could freeze the UI (mitigated by keeping queries fast and dataset moderate)
- **Native module compilation required** — windows-build-tools needed on development machines, adds setup friction
- **No built-in replication** — Single-node only, no clustering or horizontal scaling

## Alternatives Considered

| Database | Why Rejected |
|----------|--------------|
| **node-sqlite3** | Asynchronous API adds complexity. Slower performance (2-3x). Callback-based API less ergonomic for modern code. |
| **PostgreSQL** | Requires separate server process, complex for end-user deployment. Overkill for local desktop application. |
| **IndexedDB (in browser)** | No Node.js access, IPC serialization overhead, poor performance for high-frequency writes. |
| **JSON file storage** | No ACID guarantees, corruption risk, poor query performance as dataset grows. |
| **LowDB** | Pure JSON, no SQL capabilities, limited indexing, performance concerns at scale. |

## Related Decisions
- ADR-001: Electron framework selection (better-sqlite3 runs in Electron main process)
- Singleton DatabaseManager pattern for prepared statement caching
- Separate sqlite3 (prebuilt) for test databases vs better-sqlite3 for production

## Implementation Notes

DatabaseManager implemented as singleton with:
- **Lazy initialisation** — Database created on first access, not import
- **Prepared statement cache** — Common queries compiled once, executed many times
- **Schema versioning** — Migrations handled via `PRAGMA user_version`
- **Foreign key constraints** — `PRAGMA foreign_keys = ON` for referential integrity

Schema design:
- `devices` table — Primary device configuration
- `ping_logs` table — Time-series data with device_id foreign key
- `outages` table — Aggregated downtime events

## References
- `src/main/database.js` — DatabaseManager singleton with prepared statement caching
- `src/main/ipc-handlers.js` — IPC handlers using synchronous database operations
- `tests/unit/database.test.js` — Unit tests with in-memory sqlite3
- `docs/technical-deep-dive.md` — Section 2.3 for detailed database comparison

---

**Decision Date:** 3rd April 2026  
**Decided By:** Development Team  
**Last Updated:** 14th April 2026
