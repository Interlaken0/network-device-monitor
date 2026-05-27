# Sprint 4 Retrospective: Historical Analysis & Reporting

**Sprint Dates:** 13th May – 27th May 2026  
**Sprint Goal:** Transform real-time monitoring data into actionable historical insights and exportable reports

---

## What Went Well

### Feature Delivery
- **Query Builder** (`QueryBuilder.jsx`) gives Jeff a clean interface to filter historical data by date range, device, and aggregation type. The preset date buttons (Last 24 Hours, Last 7 Days, Last 30 Days) make common queries one-click operations.
- **Historical Analysis Dashboard** (`HistoricalAnalysis.jsx`) wires the query builder into summary cards and Recharts visualisations. The latency bar chart uses colour-coded thresholds so Jeff can spot problem devices at a glance.
- **Outage Analysis** (`OutageAnalysis.jsx`) delivers the dedicated outage reporting Jeff needed for management conversations. The device availability table with 30-day uptime percentages turns "the network seems flaky" into "the east wing switch had 3 outages totalling 45 minutes".
- **Export Manager** (`ExportManager.jsx`) supports both CSV exports with column selection and HTML report generation using three templates (Uptime, Latency Analysis, Outage Summary). The progress bar and save dialog make the export flow feel polished.
- **Security hardening** was implemented proactively rather than reactively. Rate limiting, input sanitisation, and path traversal checks on the export pipeline mean the tool is safe for production use.

### Testing & Quality
- **403 tests passing** across 15 test suites. New test coverage for Sprint 4 includes 16 security utility tests and 11 component logic tests.
- **Lint and typecheck clean** — no warnings or errors in the codebase.
- **Branching strategy worked** — separating Week 1 (core components) and Week 2 (advanced features + security) into distinct branches made code review manageable. Week 1 merged cleanly via PR #16.

### Technical Decisions
- Recharts proved a solid choice for the charting library. The theme-aware colour system (`chart-theme.js`) keeps charts readable in both light and dark modes.
- Virtual scrolling on the historical data table was a lightweight win — CSS `max-height` with `overflow-y: auto` instead of pulling in a heavy third-party library.
- The `RateLimiter` class is simple, testable, and reusable for future IPC channels.

---

## What Could Be Improved

### Timing
- Sprint 4 ran slightly behind the original schedule. Week 1's work (QueryBuilder, HistoricalAnalysis, SummaryCards) took the full planned time, which compressed Week 2's original scope. Some planned features (scheduled reports, outage correlation analysis) were dropped to focus on core delivery.
- The OutageTimeline.jsx component was not fully integrated into the shared `historicalFilters` state — it still uses its own local time range controls.

### Testing Coverage
- Component-level React Testing Library tests were not feasible in the current `node` Jest environment. The component tests are logic-only (no JSX rendering), which covers data transformation but not UI interaction.
- No end-to-end integration test exists that exercises the full flow: set filters → load historical data → view outage analysis → export CSV.

### Documentation
- The `sprint-4-planning.md` file was created during the sprint but removed before closure. Sprint planning documents are useful during development but should not persist in the repo unless they serve as living documentation.

---

## Action Items for Sprint 5

1. **Integrate OutageTimeline** with shared `historicalFilters` state so all historical views use consistent filter controls.
2. **Add end-to-end integration test** for the historical data → export pipeline.
3. **Evaluate jsdom** as the Jest test environment for component rendering tests, or document the decision to stay with `node`.
4. **Consider scheduled reports** as a Sprint 6 stretch goal if time allows.

---

## Metrics

| Metric | Value |
|---|---|
| Sprint duration | 2 weeks (13th–27th May) |
| User stories completed | 6/6 |
| Tests passing | 403 |
| Test suites | 15 |
| New components | 5 (QueryBuilder, HistoricalAnalysis, SummaryCards, OutageAnalysis, ExportManager) |
| Lines of code added | ~1,700 |
| Pull requests | 1 merged (Week 1), 1 open (Week 2) |
| Security controls added | 3 (rate limiting, sanitisation, path traversal) |

---

## Sprint Review Demo Script

### 1. Historical Analysis Dashboard (30 seconds)
- "Jeff, here's the new Historical Analysis section. I can pick a date range — let's say the last 7 days — and the dashboard immediately shows overall uptime, average latency, total outages, and which device has been the most reliable."

### 2. Outage Analysis (45 seconds)
- "Clicking into Outage Analysis gives me a full breakdown. This pie chart shows severity — I've got one critical outage and two warnings this week. The bar chart shows which devices are causing problems. And this table gives me 30-day availability percentages. I can click any device to drill down and see exactly when each outage started and ended."

### 3. Export Manager (30 seconds)
- "When Jeff needs to take this data to management, the Export Manager handles it. I can export ping logs or outage data to CSV, picking exactly which columns I want. Or I can generate a styled HTML report — uptime summary, latency analysis, or outage report — and save it wherever I need."

### 4. Security (15 seconds)
- "Behind the scenes, exports are rate-limited, filenames are validated to prevent path traversal, and all query inputs are sanitised. The tool is safe for production use."

---

*Retrospective written: 27th May 2026*
