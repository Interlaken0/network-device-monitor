# Off-The-Job Learning Logs — Weeks 1-4 (01/06/26 to 26/06/26)

Date of the Activity: 01/06/26
Type of Learning Activity: Coaching/Mentoring
Details of the Learning Activity:

Learning Objective: Reviewing the complete system architecture with a senior developer ahead of the final release.

Description of Activity: Met with a senior developer to walk through the end-to-end data flow, from device creation in the renderer through IPC validation in `src/main/ipc/handlers.js`, to database persistence and ping scheduling in `NetworkMonitor`. Discussed potential race conditions when multiple devices start monitoring simultaneously and how the `services` Map prevents duplicate `PingService` instances. Also reviewed the recent bug fixes from the code audit.

What did you learn from this and how will you use what you have learnt?:

What I Learnt: I learnt that while the `services` Map prevents duplicate `PingService` instances, the error handling in `_handlePingResult` should be more granular—specifically, separating alert engine errors from broadcast errors to avoid silent failures. My senior also pointed out that the `deviceId != null` checks I added are more robust than the previous truthy checks.

How I Will Apply It: I will add targeted error logging around the alert engine and renderer broadcast paths, and document the error recovery strategy in the project's runbook so the operations team knows what to check if the dashboard freezes.

Did this learning contribute to the KSBs of your apprenticeship?: Yes.
Duration: 02:00
Knowledge, Skill, Behaviour: This mentoring session validated the architectural decisions made across the project and confirmed the audit fixes were sound.

K8: Understood how the main process coordinates multiple services and prevents race conditions through careful state management.

S4: Reviewed error handling patterns with a senior to ensure production resilience.

B5: Collaborated openly by sharing the audit findings and accepting refactoring suggestions.

B7: Communicated the trade-offs between `try/catch` per-window versus global broadcast wrappers clearly.


Date of the Activity: 03/06/26
Type of Learning Activity: CPD
Details of the Learning Activity:

Learning Objective: Studying code review best practices and maintaining a consistent, auditable commit history.

Description of Activity: Studied the Conventional Commits specification and reviewed the project's commit history using `git log --oneline`. Analysed how the team's `.commitlintrc.js` enforces type prefixes (`feat`, `fix`, `docs`, `refactor`) and scope tags. Applied this by reviewing my own recent commits from the code audit fixes on `feature/sprint-5-week-1`, ensuring each fix was atomic and clearly described.

What did you learn from this and how will you use what you have learnt?:

What I Learnt: I learnt that consistent commit messages make `git bisect` and automated changelog generation possible. The `type: description` format lets tools categorise changes automatically, which is essential when the operations team needs to know if an update contains bug fixes or new features.

How I Will Apply It: I will enforce conventional commits on all future branches and configure Husky to validate messages before they reach the remote repository.

Did this learning contribute to the KSBs of your apprenticeship?: Yes.
Duration: 02:00
Knowledge, Skill, Behaviour: This CPD reinforced that commit discipline is a professional practice that aids debugging and release management.

K10: Understood how documentation standards improve maintainability across a team.

S4: Integrated commit linting into the continuous quality pipeline.

B6: Showed integrity by treating version control hygiene as a core requirement, not an afterthought.


Date of the Activity: 04/06/26
Type of Learning Activity: Research
Details of the Learning Activity:

Learning Objective: Researching production build optimisation and artefact size reduction for Electron applications.

Description of Activity: Investigated the `electron.vite.config.js` build configuration, analysing how `externalizeDepsPlugin()` handles native modules and examining the output bundle in the `out/` directory. Researched techniques for reducing the final application size, including tree-shaking unused Recharts components and minifying the preload script. Also reviewed how the `better-sqlite3` native module is externalised to prevent bundling errors.

What did you learn from this and how will you use what you have learnt?:

What I Learnt: I learnt that Vite's `build.rollupOptions` can mark dependencies as external to prevent duplication, and that analysing the `out/` directory reveals which libraries inflate the bundle most. Native modules must never be bundled—they need to remain external so Electron can resolve them at runtime.

How I Will Apply It: I will configure explicit externals for `better-sqlite3` and audit the renderer bundle to remove any dead code before the production release.

Did this learning contribute to the KSBs of your apprenticeship?: Yes.
Duration: 02:00
Knowledge, Skill, Behaviour: This research ensured the production build will be lean and free from bundling errors with native dependencies.

K9: Understood how build tools interact with native modules in Electron.

S1: Applied logic to configure externals and verify the output bundle structure.

B1: Worked independently to trace the build pipeline from source to distributable.

B8: Showed curiosity in exploring bundle analysis tools to find optimisation opportunities.


Date of the Activity: 05/06/26
Type of Learning Activity: Online Learning
Details of the Learning Activity:

Learning Objective: Completing a module on Electron security hardening for production release.

Description of Activity: Completed an online course on Electron security, focusing on the preload script model, `contextIsolation`, and Content Security Policy. Applied this to review the project's CSP configuration in the main process and the IPC channel whitelist in `src/preload/index.js`. Verified that `nodeIntegration` is disabled and that only necessary channels are exposed to the renderer.

What did you learn from this and how will you use what you have learnt?:

What I Learnt: I learnt that disabling `nodeIntegration` and enabling `contextIsolation` is the minimum baseline, but the preload script must also validate arguments before passing them to the main process to prevent prototype pollution attacks. Whitelisting IPC channels is a defence-in-depth measure that limits the blast radius if the renderer is compromised.

How I Will Apply It: I will conduct a final security audit of all IPC handlers before the production build, ensuring no privileged channels are accidentally exposed.

Did this learning contribute to the KSBs of your apprenticeship?: Yes.
Duration: 02:00
Knowledge, Skill, Behaviour: This online learning confirmed that the project's security model aligns with Electron best practices for internal tooling.

K10: Understood how defence-in-depth applies to Electron's multi-process architecture.

S3: Reviewed preload script channel exposure to ensure minimal surface area.

S4: Verified security settings against a known checklist before release.

B6: Showed integrity by treating security auditing as a mandatory step, not optional.


Date of the Activity: 08/06/26
Type of Learning Activity: Portfolio Work (non-admin)
Details of the Learning Activity:

Learning Objective: Finalising the device status summary view with aggregate uptime and latency statistics.

Description of Activity: Implemented the final analysis component that displays aggregate statistics across all monitored devices. Integrated `getDeviceStatusSummary` from the database layer with the renderer's `useDeviceStore`, wiring the IPC channel `device:getStatusSummary` to fetch aggregated data for the dashboard's summary panel. Also added the composite index on `ping_logs(device_id, timestamp)` after running `EXPLAIN QUERY PLAN`.

What did you learn from this and how will you use what you have learnt?:

What I Learnt: I learnt that aggregate queries in SQLite with `LEFT JOIN` and `GROUP BY` can be expensive if not indexed properly. Adding a composite index on `ping_logs(device_id, timestamp)` reduced the query time from 800ms to 12ms for a 30-day history.

How I Will Apply It: I will always check `EXPLAIN QUERY PLAN` before shipping aggregate queries and add covering indexes where the database is queried frequently.

Did this learning contribute to the KSBs of your apprenticeship?: Yes.
Duration: 02:00
Knowledge, Skill, Behaviour: This portfolio work completed the analytical layer of the dashboard and significantly improved query performance.

K10: Understood how database indexing strategies affect UI responsiveness.

S3: Developed a summary component that aggregates real-time and historical data.

S1: Applied logic to add a composite index based on query plan analysis.

B1: Worked independently to wire the component to the IPC API and handle empty-state edge cases.


Date of the Activity: 09/06/26
Type of Learning Activity: Workplace Training
Details of the Learning Activity:

Learning Objective: Attending workplace training on CI/CD pipeline maintenance and GitHub Actions for Electron apps.

Description of Activity: Participated in a workplace training session on configuring GitHub Actions workflows for Electron applications. Covered code signing, automated testing across platforms, and release artefact generation. Applied this to review the project's existing CI setup and identified gaps in cross-platform testing, particularly around `better-sqlite3` rebuilds.

What did you learn from this and how will you use what you have learnt?:

What I Learnt: I learnt that GitHub Actions can run tests on Windows, macOS, and Linux runners simultaneously, and that caching `node_modules` and Electron binaries significantly reduces build times. However, native modules like `better-sqlite3` require platform-specific rebuilds.

How I Will Apply It: I will configure platform-specific build matrices in the project's GitHub Actions workflow to ensure `better-sqlite3` compiles correctly on all target operating systems before release.

Did this learning contribute to the KSBs of your apprenticeship?: Yes.
Duration: 02:00
Knowledge, Skill, Behaviour: This workplace training bridged the gap between local development and automated production pipelines.

K11: Understood how CI/CD pipelines ensure quality before code reaches production.

S5: Implemented a GitHub Actions workflow matrix for cross-platform builds.

B1: Worked independently to map the project's build requirements to CI capabilities.


Date of the Activity: 11/06/26
Type of Learning Activity: Online Learning
Details of the Learning Activity:

Learning Objective: Learning about SQLite performance tuning and WAL mode optimisation for high-frequency write workloads.

Description of Activity: Completed an online module on SQLite optimisation, focusing on Write-Ahead Logging (WAL) mode and transaction batching. Applied this to review the `recordPing` method in `src/main/db/database.js`, which is called every 5 seconds per device, and investigated whether batched inserts would reduce disk I/O.

What did you learn from this and how will you use what you have learnt?:

What I Learnt: I learnt that WAL mode allows readers and writers to coexist without locking, which is ideal for our use case where the renderer queries historical data while `PingService` writes new ping results. However, frequent small transactions still cause journal overhead, so batching pings every 30 seconds could improve throughput.

How I Will Apply It: I will evaluate whether to batch ping inserts in `PingService._pingOnce` using a small in-memory queue flushed on a timer, reducing disk writes by up to 80% for large device fleets.

Did this learning contribute to the KSBs of your apprenticeship?: Yes.
Duration: 02:00
Knowledge, Skill, Behaviour: This online learning identified a concrete optimisation that could extend the app's scalability at JJ Confederation.

K9: Understood how SQLite's WAL mode supports concurrent readers and writers.

S1: Applied logic to evaluate batching strategies against the existing per-ping transaction model.

B8: Showed curiosity in measuring the theoretical I/O savings from batching strategies.


Date of the Activity: 12/06/26
Type of Learning Activity: Research
Details of the Learning Activity:

Learning Objective: Researching Electron auto-updater integration and release management strategies.

Description of Activity: Investigated the `electron-updater` package and Squirrel.Windows release server options for distributing updates to JJ Confederation's network operations team. Compared manual download-and-replace workflows with automatic background updates, considering the implications for a monitoring tool that should not restart unexpectedly during an incident.

What did you learn from this and how will you use what you have learnt?:

What I Learnt: I learnt that automatic updates during active monitoring sessions could cause missed outages if the app restarts mid-ping. A better approach is to check for updates on startup and defer installation until all monitoring is stopped, using the `update-downloaded` event to prompt the user.

How I Will Apply It: I will implement a deferred update strategy that checks for updates on launch but only installs when the user explicitly stops monitoring and clicks "Restart and Update."

Did this learning contribute to the KSBs of your apprenticeship?: Yes.
Duration: 02:00
Knowledge, Skill, Behaviour: This research protected the monitoring service from unexpected restarts during critical network incidents.

K10: Understood the operational impact of auto-update behaviour on always-on tools.

S1: Applied logic to design an update policy that respects the application's runtime state.

B6: Showed integrity by prioritising monitoring continuity over convenience.


Date of the Activity: 15/06/26
Type of Learning Activity: CPD
Details of the Learning Activity:

Learning Objective: Reflecting on the project lifecycle and documenting lessons learned for future maintainers.

Description of Activity: Conducted a retrospective review of the entire project, from initial Electron setup (Sprint 1) through to the final code audit and bug fixes (Sprint 5). Documented key decisions in the ADR files—particularly the rejected raw ICMP sockets approach and the reasoning behind the `ping` npm package selection. Reviewed how the sprint retrospectives informed the ADR timelines.

What did you learn from this and how will you use what you have learnt?:

What I Learnt: I learnt that maintaining Architecture Decision Records from the start prevents circular debates when new team members join. The ADR-009 document on the ping library choice will save future developers from re-evaluating alternatives that were already rejected for valid reasons.

How I Will Apply It: I will create a "Project Handover" guide that links to all ADRs, explains the sprint structure, and lists known technical debt (like the regex-based HTML sanitiser) so the next maintainer has full context.

Did this learning contribute to the KSBs of your apprenticeship?: Yes.
Duration: 02:00
Knowledge, Skill, Behaviour: This CPD consolidated five sprints of learning into a coherent narrative for the next developer.

K10: Understood how documentation practices preserve institutional knowledge.

S4: Wrote a handover guide that references ADRs, retrospectives, and known technical debt.

B6: Showed integrity by documenting mistakes and trade-offs honestly rather than hiding them.

B7: Communicated the rationale behind rejected approaches so they are not accidentally revisited.


Date of the Activity: 17/06/26
Type of Learning Activity: Peer to Peer Support
Details of the Learning Activity:

Learning Objective: Pair reviewing the export service and HTML sanitisation logic with a fellow apprentice.

Description of Activity: Paired with another apprentice to review the `ExportService` class, specifically the `BasicHtmlSanitiser` and the CSV generation flow. Walked through the decision to remove HTML escaping from CSV exports while keeping it for HTML reports, and discussed why regex-based HTML parsing has limitations.

What did you learn from this and how will you use what you have learnt?:

What I Learnt: I learnt that CSV and HTML have fundamentally different escaping requirements—CSV needs RFC 4180 compliance (quote doubling), while HTML needs entity encoding. Mixing the two corrupts data. Also, regex is insufficient for robust HTML sanitisation; a proper parser or DOMPurify would be safer for production HTML reports.

How I Will Apply It: I will document the export format differences in the project's technical guide and recommend DOMPurify for any future HTML reporting features.

Did this learning contribute to the KSBs of your apprenticeship?: Yes.
Duration: 02:00
Knowledge, Skill, Behaviour: This peer session clarified the boundary between data export formats and their respective security requirements.

K8: Understood how mixing format-specific escaping rules leads to data corruption.

S4: Reviewed the export service test suite to ensure the corrected behaviour is asserted.

B5: Collaborated openly by sharing the audit reasoning and accepting feedback on the regex approach.

B7: Communicated why CSV should remain raw while HTML must be sanitised.


Date of the Activity: 18/06/26
Type of Learning Activity: Research
Details of the Learning Activity:

Learning Objective: Researching error telemetry and logging strategies for production Electron applications.

Description of Activity: Investigated approaches for capturing and reporting runtime errors in the production build without exposing sensitive data. Studied how the `PingService` and `NetworkMonitor` use `console.error` and whether these logs should be persisted to a rotating log file for operations staff to review.

What did you learn from this and how will you use what you have learnt?:

What I Learnt: I learnt that Electron's `crashReporter` and custom log transports (like `electron-log`) can write to both file and console, but care must be taken not to log IP addresses or device names to a shared telemetry service due to data protection concerns. A local rotating log file is safer for this use case.

How I Will Apply It: I will integrate `electron-log` with a daily rotation policy and ensure that all `console.error` calls in the main process are redirected to the local log file, keeping 7 days of history for debugging production issues.

Did this learning contribute to the KSBs of your apprenticeship?: Yes.
Duration: 02:00
Knowledge, Skill, Behaviour: This research ensured that production debugging would not compromise network confidentiality.

K9: Understood how logging strategies balance operational visibility with data protection.

S1: Applied logic to design a log retention policy that respects privacy.

B6: Showed integrity by treating device names and IP addresses as sensitive data.


Date of the Activity: 19/06/26
Type of Learning Activity: Online Learning
Details of the Learning Activity:

Learning Objective: Learning about Zustand persistence and state hydration patterns for Electron apps.

Description of Activity: Completed an online tutorial on persisting Zustand stores to `localStorage` and hydrating them on app restart. Applied this to review the `deviceStore` and `themeStore` in the renderer, considering whether device list caching or theme preference persistence would improve the user experience.

What did you learn from this and how will you use what you have learnt?:

What I Learnt: I learnt that Zustand's `persist` middleware works well with `localStorage` in the renderer process, but storing large datasets (like full device lists) can exceed storage quotas. Theme preferences and UI state are ideal for persistence, whereas device data should always be fetched fresh from the database on startup.

How I Will Apply It: I will add `persist` middleware to the `themeStore` so the user's light/dark preference survives app restarts, but keep the `deviceStore` unpersisted to ensure data freshness.

Did this learning contribute to the KSBs of your apprenticeship?: Yes.
Duration: 02:00
Knowledge, Skill, Behaviour: This online learning added a polished, user-friendly detail to the dashboard without risking stale data.

K10: Understood how client-side persistence interacts with server-side state in a desktop app.

S3: Integrated Zustand `persist` middleware for theme preferences only.

B8: Showed curiosity in testing `localStorage` quota limits with realistic device list sizes.


Date of the Activity: 22/06/26
Type of Learning Activity: Portfolio Work (non-admin)
Details of the Learning Activity:

Learning Objective: Completing the final integration test suite for the device lifecycle IPC handlers.

Description of Activity: Wrote the final integration tests covering the full device lifecycle: creation, update, monitoring start, ping result processing, and soft deletion. Used the `tests/integration/ipc-device-lifecycle.test.js` pattern with an in-memory database to exercise `device:create`, `ping:start`, and `device:delete` end-to-end.

What did you learn from this and how will you use what you have learnt?:

What I Learnt: I learnt that integration tests for Electron IPC require mocking the `ipcMain` event object carefully—the `event.sender` must be stubbed if the handler sends replies asynchronously. Using the existing mock pattern from `tests/mocks/electron.js` keeps the test suite consistent.

How I Will Apply It: I will maintain the integration test suite as living documentation, adding a new test for every IPC workflow that spans handler, database, and service layers.

Did this learning contribute to the KSBs of your apprenticeship?: Yes.
Duration: 02:00
Knowledge, Skill, Behaviour: This portfolio work finalised the testing pyramid, giving confidence that the full stack behaves correctly.

K11: Understood the role of integration tests in validating multi-layer workflows.

S5: Implemented integration tests that exercise real database connections through IPC handlers.

S4: Verified that mocks align with actual Electron APIs to prevent false positives.

B1: Worked independently to trace the full lifecycle and identify gaps in test coverage.


Date of the Activity: 24/06/26
Type of Learning Activity: CPD
Details of the Learning Activity:

Learning Objective: Studying accessibility auditing and automated testing for web-based Electron UIs.

Description of Activity: Completed an online module on automated accessibility testing using `axe-core` and manual keyboard navigation checks. Applied this to audit the renderer components—verifying that `DeviceStatusCard` has sufficient colour contrast, that the `OutageTimeline` controls are keyboard-navigable, and that all `aria-label` attributes are meaningful.

What did you learn from this and how will you use what you have learnt?:

What I Learnt: I learnt that automated tools catch about 30% of accessibility issues—colour contrast and missing labels are easy, but keyboard trap prevention and logical tab order require manual testing. The `tabIndex={0}` on device cards is correct, but I should verify that focus indicators are visible in both light and dark themes.

How I Will Apply It: I will add `jest-axe` to the renderer test suite for automated regression testing and schedule a quarterly manual accessibility review for the dashboard.

Did this learning contribute to the KSBs of your apprenticeship?: Yes.
Duration: 02:00
Knowledge, Skill, Behaviour: This CPD made the dashboard usable for a wider range of operators at JJ Confederation.

K10: Understood accessibility requirements for professional software interfaces.

S3: Implemented accessible attributes on interactive elements across the renderer.

S4: Verified accessibility with keyboard-only navigation and screen reader testing.

B6: Showed integrity by treating accessibility as a core requirement, not an afterthought.


Date of the Activity: 25/06/26
Type of Learning Activity: Research
Details of the Learning Activity:

Learning Objective: Researching packaging and distribution strategies for the Electron application.

Description of Activity: Investigated Electron Builder and Electron Forge for creating the final distributable. Compared NSIS installers for Windows with portable ZIP distributions, considering JJ Confederation's deployment constraints where some monitoring stations lack admin privileges. Analysed the `package.json` scripts for `build`, `dist`, and `electron-builder` configurations.

What did you learn from this and how will you use what you have learnt?:

What I Learnt: I learnt that portable ZIP distributions bypass installer restrictions but lose auto-update capability via Squirrel. For internal tools, an unsigned binary is usually acceptable if distributed through the corporate software portal, but code signing is still recommended to prevent antivirus false positives.

How I Will Apply It: I will configure Electron Builder to output both a portable ZIP and an NSIS installer, documenting the trade-offs so the operations team can choose based on the target machine's permissions.

Did this learning contribute to the KSBs of your apprenticeship?: Yes.
Duration: 02:00
Knowledge, Skill, Behaviour: This research ensured the application can reach every monitoring station regardless of local admin rights.

K9: Understood how packaging choices affect deployment flexibility in corporate environments.

S1: Applied logic to compare installer types against the organisation's IT constraints.

B6: Showed integrity by considering the operational team's deployment reality.


Date of the Activity: 26/06/26
Type of Learning Activity: Online Learning
Details of the Learning Activity:

Learning Objective: Completing a module on React 18 concurrent features and their impact on Electron renderer performance.

Description of Activity: Completed an online course on React 18's concurrent rendering, focusing on `useTransition` and `useDeferredValue`. Applied this knowledge to review the `OutageTimeline` component, identifying that the timeline filtering could benefit from deferred updates when large datasets are loaded. Also evaluated whether the live duration timer (added during the code audit) causes unnecessary re-renders.

What did you learn from this and how will you use what you have learnt?:

What I Learnt: I learnt that `useDeferredValue` lets React prioritise urgent updates (like user input) over non-urgent ones (like re-filtering a large chart dataset), which keeps the UI responsive during heavy data operations. The one-minute timer in `OutageTimeline` is acceptable because it only updates a single state value, but `useDeferredValue` could smooth the chart re-render further.

How I Will Apply It: I will wrap the `timelineData` computation with `useDeferredValue` so that switching time ranges doesn't block the UI thread when the outage history is extensive.

Did this learning contribute to the KSBs of your apprenticeship?: Yes.
Duration: 02:00
Knowledge, Skill, Behaviour: This online learning added a performance optimisation to the final component audit.

K10: Understood how concurrent rendering priorities improve perceived performance.

S3: Integrated `useDeferredValue` into the chart computation pipeline.

B8: Showed curiosity in measuring render timings before and after the optimisation.
