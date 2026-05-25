# Sprint 4 Planning: Historical Analysis & Reporting

**Sprint Dates:** Wednesday 13th May - Wednesday 27th May 2026  
**Focus:** Transform real-time monitoring data into actionable historical insights and exportable reports  
**Current Version:** 0.2.0 (Post-Sprint 3 Dashboard & Visualisation)

---

## Current Project State

### Completed Features (Sprints 1-3)
- **Electron + React Foundation** with secure IPC architecture
- **SQLite Database** with devices, ping_logs, outages tables
- **Real-time Dashboard** with live device status cards (`src/renderer/components/Dashboard.jsx`)
- **Latency Visualisation** using Recharts (`src/renderer/components/LatencyChart.jsx`)
- **Zustand State Management** (`src/renderer/stores/deviceStore.js`, `themeStore.js`)
- **Outage Detection** with timeline component (`src/renderer/components/OutageTimeline.jsx`)
- **Toast Notifications** system (`src/renderer/components/ToastNotifications.jsx`)
- **Device Management** with CRUD operations

### Current Technical Stack
```json
{
  "framework": "Electron 28.x + React 18.x",
  "database": "better-sqlite3 12.x",
  "charts": "Recharts 3.8.1",
  "state": "Zustand 5.0.12",
  "build": "Vite 5.x + Electron Forge 7.x",
  "testing": "Jest 29.x with 82% coverage"
}
```

---

## Sprint 4 Goal & Objectives

**Primary Goal:** Enable users to analyse historical network performance data and generate actionable reports for infrastructure planning and troubleshooting.

### Key Deliverables
1. **Historical Query Builder** - Flexible data filtering and analysis
2. **Outage Analysis Dashboard** - Comprehensive downtime reporting  
3. **Data Export System** - CSV and PDF report generation
4. **Performance Optimisation** - Query caching and indexing

---

## User Stories with Fibonacci Points

### US4.1: Historical Query Builder (8 points)
**As a** network administrator  
**I want to** filter and query historical monitoring data by date range, device, and performance metrics  
**So that** I can analyse specific time periods and identify patterns

**Acceptance Criteria:**
- Given I have historical ping data, when I select a date range, then I see filtered results
- Given I have multiple devices, when I select specific devices, then only those devices' data appears
- Given I have performance metrics, when I choose aggregation options, then I see calculated statistics
- Given I have large datasets, when I apply filters, then results load within 2 seconds

**Technical Implementation:**
- Extend `src/main/database.js` with aggregation queries
- Create `src/renderer/components/QueryBuilder.jsx`
- Add query caching to `src/renderer/stores/deviceStore.js`

### US4.2: Outage Analysis Dashboard (8 points)
**As a** network administrator  
**I want to** view comprehensive outage reports with duration, frequency, and availability percentages  
**So that** I can assess network reliability and plan improvements

**Acceptance Criteria:**
- Given I have outage data, when I view the dashboard, then I see total outage time and availability percentage
- Given I have multiple outages, when I view the timeline, then I see visual representation of downtime periods
- Given I have device-specific data, when I filter by device, then I see device-specific availability metrics
- Given I have historical data, when I select a time range, then calculations reflect that period

**Technical Implementation:**
- Enhance `src/renderer/components/OutageTimeline.jsx` with historical filtering
- Create `src/renderer/components/OutageAnalysis.jsx`
- Add statistical calculations to database layer

### US4.3: Data Export System (5 points)
**As a** network administrator  
**I want to** export filtered data to CSV format for external analysis  
**So that** I can share reports with stakeholders and use external tools

**Acceptance Criteria:**
- Given I have filtered results, when I click export, then I receive a CSV file with selected columns
- Given I have large datasets, when I export, then I see progress indication and the operation completes within 30 seconds
- Given I have sensitive data, when I export, then the file is saved to a secure location
- Given I have different analysis needs, when I choose export options, then I can select which columns to include

**Technical Implementation:**
- Create `src/main/export-service.js`
- Add `src/renderer/components/ExportManager.jsx`
- Implement file dialog integration in main process

### US4.4: Performance Optimisation (3 points)
**As a** user with large datasets  
**I want to** experience fast query responses and smooth interface interactions  
**So that** I can efficiently analyse historical data without delays

**Acceptance Criteria:**
- Given I have 10,000+ ping records, when I query historical data, then results load within 2 seconds
- Given I have cached results, when I repeat queries, then results load within 500ms
- Given I have large datasets, when I navigate through pages, then the interface remains responsive
- Given I have memory constraints, when I process data, then memory usage stays below 200MB

**Technical Implementation:**
- Add database indexes for time-series queries
- Implement query result caching
- Add virtual scrolling for large data tables

---

## Sprint Capacity & Velocity

### Team Capacity
- **Developer:** 1 person (Apprentice Software Developer)
- **Available Hours:** ~40 hours per week (8 hours/day × 5 days)
- **Total Sprint Hours:** 80 hours (excluding weekends)

### Historical Velocity Reference
- **Sprint 1:** 4 stories completed (Foundation MVP)
- **Sprint 2:** 5 stories completed (Device Management)
- **Sprint 3:** 6 stories completed (Dashboard & Visualisation)
- **Average Velocity:** 5 stories per sprint

### Sprint 4 Capacity
- **Total Story Points:** 24 points (8 + 8 + 5 + 3)
- **Expected Velocity:** 20-25 points based on historical performance
- **Feasibility:** ✅ **Achievable** - Within capacity with buffer for complexity

---

## Detailed Daily Breakdown

### Week 1: Foundation & Core Features (13-19 May)

#### Wednesday 13th May - Sprint Planning & Database Optimisation
**Focus:** Database layer preparation for historical queries

**Morning (2 hours):**
- Sprint planning meeting with line manager
- Review backlog and refine acceptance criteria
- Create Sprint 4 branch: `feature/sprint4-historical-analysis`

**Afternoon (3 hours):**
- Add database indexes for time-series queries:
  ```sql
  CREATE INDEX idx_ping_logs_device_time_range ON ping_logs(device_id, timestamp DESC);
  CREATE INDEX idx_outages_start_time ON outages(start_time DESC);
  ```
- Implement aggregation functions in `src/main/database.js`:
  - `getAverageLatency(deviceId, startDate, endDate)`
  - `getUptimePercentage(deviceId, startDate, endDate)`
  - `getOutageStatistics(deviceId, startDate, endDate)`

**Evening (1 hour):**
- Unit tests for new database functions
- Performance benchmarking with sample data

#### Thursday 14th May - Query Builder Foundation
**Focus:** Historical filtering interface

**Morning (3 hours):**
- Create `src/renderer/components/QueryBuilder.jsx` component structure
- Implement date range picker with preset options:
  - Last 24 hours
  - Last 7 days  
  - Last 30 days
  - Custom range
- Add device multi-select filter with search functionality

**Afternoon (2 hours):**
- Build SQL query builder for dynamic filtering
- Implement query validation and sanitisation
- Connect to Zustand store for filter state management

**Evening (1 hour):**
- Integration tests for query builder
- Accessibility testing (keyboard navigation, screen readers)

#### Friday 15th May - Historical Analysis Dashboard
**Focus:** Main analytics interface

**Morning (3 hours):**
- Create `src/renderer/components/HistoricalAnalysis.jsx` main component
- Implement summary statistics cards:
  - Overall uptime percentage
  - Average latency across all devices
  - Total outage count and duration
  - Most/least reliable devices
- Build responsive grid layout for analytics

**Afternoon (2 hours):**
- Connect QueryBuilder filters to HistoricalAnalysis dashboard
- Implement real-time data refresh with loading states
- Add error handling for failed queries

**Evening (1 hour):**
- Component testing with Jest and React Testing Library
- UI polish and responsive design fixes

#### Monday 18th May - Outage Analysis Enhancement
**Focus:** Advanced outage reporting

**Morning (3 hours):**
- Enhance `src/renderer/components/OutageTimeline.jsx` with historical filtering
- Implement outage duration calculations and categorisation:
  - Critical: > 1 hour
  - Warning: 5-60 minutes  
  - Info: < 5 minutes
- Add availability percentage calculations per device

**Afternoon (2 hours):**
- Create outage summary table with sorting and filtering
- Implement drill-down functionality to individual outage details
- Add outage correlation analysis (multiple devices affected)

**Evening (1 hour):**
- Performance testing with large outage datasets
- Memory usage optimisation

#### Tuesday 19th May - Week 1 Integration & Review
**Focus:** Testing and refinement

**Morning (2 hours):**
- End-to-end testing of historical analysis features
- Integration testing between QueryBuilder and dashboard components
- Cross-browser compatibility testing

**Afternoon (2 hours):**
- Bug fixes and performance optimisation
- Code review and refactoring
- Update documentation

**Evening (1 hour):**
- Sprint review preparation
- Demo script creation

### Week 2: Export & Polish (20-27 May)

#### Wednesday 20th May - CSV Export Implementation
**Focus:** Data export functionality

**Morning (3 hours):**
- Create `src/main/export-service.js` for server-side export processing
- Implement CSV generation with proper escaping and formatting
- Add progress tracking for large export operations

**Afternoon (2 hours):**
- Create `src/renderer/components/ExportManager.jsx` interface
- Implement column selection and export options
- Add file save dialog integration via IPC

**Evening (1 hour):**
- Export testing with various dataset sizes
- Error handling for invalid file paths

#### Thursday 21st May - Report Templates
**Focus:** Standardised reporting

**Morning (3 hours):**
- Design report template system:
  - Uptime Report template
  - Latency Analysis template  
  - Outage Summary template
- Implement template-based report generation
- Add custom date range and device selection per template

**Afternoon (2 hours):**
- Build report preview functionality
- Implement scheduled report configuration UI
- Add report sharing options

**Evening (1 hour):**
- Template validation and error handling
- User acceptance testing

#### Friday 22nd May - Performance Optimisation
**Focus:** Query performance and caching

**Morning (3 hours):**
- Implement query result caching with TTL in deviceStore
- Add database query profiling and logging
- Optimise aggregation queries with proper indexing strategy

**Afternoon (2 hours):**
- Implement lazy loading for large datasets in tables
- Add virtual scrolling for historical data tables
- Memory usage optimisation for large data processing

**Evening (1 hour):**
- Performance benchmarking and optimisation
- Load testing with 50k+ records

#### Monday 25th May - Security & Testing
**Focus:** Security hardening and comprehensive testing

**Morning (3 hours):**
- Security review of export functions:
  - Path traversal prevention
  - SQL injection validation
  - File access control
- Add input sanitisation for all user inputs
- Implement rate limiting for export requests

**Afternoon (2 hours):**
- Complete test suite coverage (>80% target)
- Add integration tests for export pipeline
- Performance testing with 10k+ records

**Evening (1 hour):**
- Security audit documentation
- Penetration testing checklist

#### Tuesday 26th May - Final Integration & Polish
**Focus:** Production readiness

**Morning (2 hours):**
- End-to-end testing of all Sprint 4 features
- Cross-platform testing (Windows, macOS)
- User acceptance testing with sample data

**Afternoon (2 hours):**
- UI polish and responsive design fixes
- Error message improvement and user guidance
- Performance optimisation final pass

**Evening (1 hour):**
- Documentation updates
- Release notes preparation

#### Wednesday 27th May - Sprint Review & Retrospective
**Focus:** Demonstration and reflection

**Morning (2 hours):**
- Sprint review demonstration with line manager
- Feature walkthrough and KSB evidence presentation
- Stakeholder feedback collection

**Afternoon (1 hour):**
- Sprint retrospective and lessons learned
- Sprint 5 planning kickoff

---

## Technical Implementation Details

### Database Schema Enhancements
```sql
-- Existing tables (from Sprint 1-2)
-- devices, ping_logs, outages

-- New indexes for Sprint 4 performance
CREATE INDEX idx_ping_logs_device_time_range ON ping_logs(device_id, timestamp DESC);
CREATE INDEX idx_outages_start_time ON outages(start_time DESC);
CREATE INDEX idx_ping_logs_timestamp_device ON ping_logs(timestamp, device_id);

-- Optional: Query cache table for performance
CREATE TABLE query_cache (
    id INTEGER PRIMARY KEY,
    query_hash TEXT UNIQUE NOT NULL,
    result_data TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL
);

CREATE INDEX idx_query_cache_hash_expires ON query_cache(query_hash, expires_at);
```

### New Components Architecture
```
src/renderer/components/
├── QueryBuilder.jsx           # Historical filtering interface
├── HistoricalAnalysis.jsx     # Main analytics dashboard
├── OutageAnalysis.jsx         # Enhanced outage reporting
├── ExportManager.jsx          # Data export interface
├── ReportTemplate.jsx         # Standardised report generation
└── SummaryCards.jsx          # Analytics overview cards
```

### Enhanced Store Structure
```javascript
// src/renderer/stores/deviceStore.js enhancements
export const useDeviceStore = () => ({
  // Existing Sprint 3 state...
  
  // Sprint 4 additions
  historicalFilters: {
    dateRange: { start: null, end: null },
    selectedDevices: [],
    aggregationType: 'avg'
  },
  queryCache: new Map(),
  exportProgress: 0,
  
  // New actions
  setHistoricalFilters: (filters) => { /* ... */ },
  getCachedQuery: (queryHash) => { /* ... */ },
  setCachedQuery: (queryHash, data, ttl) => { /* ... */ },
  exportData: (format, filters) => { /* ... */ }
});
```

### Main Process Extensions
```javascript
// src/main/export-service.js
class ExportService {
  async generateCSV(query, columns) {
    // CSV generation with proper escaping
  }
  
  async generateReport(template, filters) {
    // PDF report generation
  }
  
  async getExportProgress(jobId) {
    // Progress tracking for large exports
  }
}
```

---

## Risk Management & Mitigation

### Technical Risks

| Risk | Probability | Impact | Mitigation Strategy |
|------|-------------|--------|-------------------|
| Large dataset query timeouts | Medium | High | Implement pagination, query caching, and async processing |
| Export file size limitations | Medium | Medium | Add file compression and chunked export options |
| Memory leaks in data processing | Low | High | Profile memory usage, implement cleanup patterns |
| Cross-platform export issues | Medium | Medium | Test on Windows and macOS, use Electron APIs |

### Project Risks

| Risk | Probability | Impact | Mitigation Strategy |
|------|-------------|--------|-------------------|
| Scope creep with additional report types | Medium | Medium | Strict adherence to defined user stories |
| Performance below acceptance criteria | Low | High | Early performance testing and optimisation |
| Security vulnerabilities in export | Low | High | Security review and penetration testing |
| Insufficient test coverage | Medium | Medium | Daily testing and coverage monitoring |

---

## KSB Evidence Mapping

### Skills Evidence
- **S3:** Link code to datasets - Advanced SQLite queries and aggregation functions
- **S6:** Test scenarios - Performance testing, security testing, integration testing
- **S16:** Algorithms & data structures - Query optimisation, caching algorithms, indexing strategies

### Knowledge Evidence  
- **K10:** Database principles - Advanced indexing, query optimisation, performance tuning
- **K12:** Testing frameworks - Comprehensive test coverage, performance benchmarking

### Behaviours Evidence
- **B6:** Initiative - Proactive performance optimisation and security hardening
- **B7:** Effective communication - Documentation and stakeholder demonstrations

---

## Success Criteria & Acceptance Metrics

### Technical Metrics
- **Query Performance:** < 2 seconds for 10,000+ records
- **Export Speed:** < 30 seconds for full dataset export
- **Memory Usage:** < 200MB during large data processing
- **Test Coverage:** > 80% across all new components
- **Zero Security Vulnerabilities:** Passed security audit

### Business Metrics
- **User Efficiency:** 50% reduction in time to generate reports vs manual methods
- **Data Accuracy:** 100% consistency between UI display and exported data
- **System Reliability:** 99.9% uptime during data processing operations

### Apprenticeship Metrics
- **KSB Coverage:** All Sprint 4 KSBs evidenced with code and documentation
- **Line Manager Approval:** Sign-off on all deliverables
- **Portfolio Quality:** Production-ready code with comprehensive documentation

---

## Dependencies & Blockers

### External Dependencies
- **None** - All Sprint 4 features use existing technology stack
- **No new npm packages** required - builds on current dependencies

### Internal Dependencies
- **Sprint 3 Completion:** ✅ Dashboard and visualisation components are complete
- **Database Schema:** ✅ Existing schema supports all required queries
- **State Management:** ✅ Zustand store ready for extension

### Potential Blockers
- **Performance Issues:** Addressed through early optimisation and testing
- **Security Concerns:** Mitigated through security review and best practices
- **Time Constraints:** Managed through realistic point estimation and daily tracking

---

## Sprint 4 Deliverables Summary

### Code Deliverables
- Enhanced `src/main/database.js` with aggregation queries
- New `src/main/export-service.js` for data export
- `src/renderer/components/QueryBuilder.jsx` filtering interface
- `src/renderer/components/HistoricalAnalysis.jsx` analytics dashboard
- Enhanced `src/renderer/components/OutageTimeline.jsx` with historical analysis
- `src/renderer/components/ExportManager.jsx` export interface
- Extended `src/renderer/stores/deviceStore.js` with caching and export state

### Documentation Deliverables
- Updated `docs/agile-strategy.md` with Sprint 4 progress
- New `docs/user-guide.md` section for historical analysis features
- Updated `README.md` with new features and usage examples
- Security audit report and penetration testing results

### Testing Deliverables
- Unit tests for all new components (>80% coverage)
- Integration tests for export pipeline
- Performance test results and benchmarks
- Security test reports and vulnerability assessments

---

**Document Version:** 1.0  
**Last Updated:** 12th May 2026  
**Review Cycle:** Daily standups, weekly sprint review  
**Next Update:** Sprint 4 retrospective completion

---

## Supporting Documents

This planning document references the following project documentation:

| Document | Purpose | Location |
|----------|---------|----------|
| `docs/agile-strategy.md` | Overall project strategy and sprint planning | Project root |
| `docs/retrospectives/sprint-03.md` | Previous sprint learnings and current state | docs/retrospectives/ |
| `docs/adr/` collection | Architecture decision records | docs/adr/ |
| `package.json` | Current dependencies and version information | Project root |
| `src/renderer/stores/deviceStore.js` | Current state management implementation | src/renderer/stores/ |

---

**Prepared by:** Apprentice Software Developer  
**Reviewed by:** Line Manager (Product Owner)  
**Approved:** Pending Sprint 4 planning review
