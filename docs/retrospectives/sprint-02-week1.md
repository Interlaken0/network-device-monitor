# Sprint 2 Week 1 Retrospective

**Dates:** 15th April 2026 - 22nd April 2026  
**Focus:** Device CRUD, Multi-device Monitoring  
**Status:** Complete

## What We Built This Week

This week saw the core functionality of the network monitor come together. We moved from a single hardcoded device to a fully dynamic system where users can add multiple devices, edit their details, delete them when no longer needed, and monitor them all concurrently with real-time latency tracking.

### Key Deliverables

1. **Full Device CRUD via IPC** — Create, read, update, and delete operations all route through secure IPC handlers with comprehensive input validation. The days of hardcoded devices are behind us.

2. **Concurrent Multi-Device Monitoring** — The application now handles multiple devices simultaneously, each with its own ping interval and status tracking. No more one-at-a-time monitoring.

3. **Robust Input Validation** — IP addresses are validated against IPv4 and IPv6 patterns, device names are length-checked, and duplicate IPs are caught before they hit the database.

4. **Real-Time React UI** — The interface shows live ping results with colour-coded latency badges (green for excellent, amber for fair, red for poor), monitoring controls per device, and inline editing.

## Technical Decisions We Made

### Validation at the IPC Boundary

Early in the week, I needed to decide where validation should live. The options were: validate in the React UI, validate in the database layer, or validate at the IPC handler level.

I chose the IPC handler approach. This means every create and update operation runs through a validation layer before touching the database. The validators object in `ipc-handlers.js` handles IP format checking using regex patterns for both IPv4 and IPv6, ensures device names are between 1 and 100 characters, and restricts device types to the allowed enum values (server, router, printer, switch).

This decision centralises our validation logic. Whether a request comes from the main form, a future import feature, or anywhere else, it passes through the same validation gates. The error messages returned are specific enough for the UI to display meaningful feedback to users.

### Map-Based Monitoring Tracking

For the multi-device monitoring, I needed a way to track which devices were currently being pinged and manage their intervals. The NetworkMonitor class uses a JavaScript Map where the key is the device ID and the value is the PingService instance.

This gives us several benefits: O(1) lookup when checking if a device is already monitored, easy iteration when stopping all monitoring, and clean resource cleanup when deleting entries. The Map also prevents duplicate monitoring attempts — if you try to start monitoring an already-active device, it returns false rather than creating a second interval.

### State Structure for Real-Time Updates

The React side presented an interesting challenge: how to store ping results for multiple devices efficiently. I settled on a dictionary pattern where `pingResults` is an object keyed by device ID. When a ping result arrives via IPC, we update only that device's entry using the spread operator.

The `isMonitoring` state follows the same pattern — a dictionary tracking which devices are currently active. This allows the UI to show "Start Monitoring" or "Stop" buttons appropriately for each device independently.

## Challenges We Navigated

| Challenge | How We Solved It | Result |
|-----------|------------------|--------|
| Preventing duplicate IP addresses | Added a database check in the create handler that queries for existing IPs before insert | Clean data with no duplicates |
| Cleaning up monitoring on device delete | Modified the delete handler to check `isMonitoring` state and stop monitoring before removing the device | No orphaned ping intervals running in the background |
| IP validation complexity | Combined IPv4 and IPv6 regex patterns with a logical OR — accepts either format but rejects invalid inputs | Users can use standard IP formats, typos are caught early |
| React re-render optimisation | Used object spread with computed property keys to update only changed device states | UI stays responsive even with many devices |

## What I Learnt This Week

**Validation belongs at the trust boundary.** The IPC layer is where renderer process meets main process — that's where you validate. Doing it here means malicious or buggy renderer code cannot bypass your checks, and you write the validation logic once rather than duplicating it in UI and database layers.

**Maps are ideal for resource tracking.** When you need to associate resources (like ping intervals) with identifiers (like device IDs), JavaScript Maps give you predictable performance and clean semantics for presence checking and deletion.

**React state dictionaries enable efficient partial updates.** Rather than replacing an entire array of results, updating a single key in an object means React only re-renders the affected component. This matters when you're receiving ping results every 5 seconds for multiple devices.

## Where the Code Lives

- `src/main/ipc-handlers.js` — IPC handlers with validation layer (lines 14-29 for validators, lines 95-173 for device operations)
- `src/main/network-monitor.js` — Multi-device monitoring coordinator using Map-based tracking (lines 14-16 for the services Map, lines 28-59 for start monitoring logic)
- `src/main/database.js` — SQLite operations with prepared statements and foreign key constraints
- `src/renderer/App.jsx` — React UI with real-time state management (lines 7-11 for state declarations, lines 19-32 for IPC listeners)

## Looking Ahead

With device management solid and multi-device monitoring working reliably, Sprint 2 Week 2 will focus on polish: query optimisation for the device list, perhaps some batch operations, and preparing the ground for Sprint 3's dashboard and visualisation features. The foundation feels solid.
