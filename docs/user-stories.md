# User Stories

**Project:** AMF Network Device Monitor  
**Format:** Gherkin (Given/When/Then)  
**User:** Jeff — Solo IT Administrator at JJ Confederation Ltd  
**Developer:** Greg — Software Development Apprentice  

---

## Context

These user stories are written from the perspective of **Jeff**, the solo IT administrator at JJ Confederation Ltd who will actually use this application. They reflect real requirements discussed between Greg (apprentice developer) and Jeff (employer/mentor/user) during sprint planning sessions.

Unlike fictional personas, these stories are grounded in:
- **JJ Confederation Ltd's actual network infrastructure** (small-medium environment)
- **Jeff's daily workflow** (reactive troubleshooting, proactive monitoring)
- **Apprenticeship timeline** (6 sprints, 12 weeks)
- **Solo-operator constraints** (no complex multi-user features needed)

See `user-personas.md` for detailed context on Jeff's role and technical environment.

---

## Epic 1: Device Management

### Story 1.1: Add Network Device (Sprints 1-2)

**As the network administrator, I want** to add a network device **so that** I can monitor its status without manual ping commands.

**Context:** This addresses Jeff's current pain point of manually typing ping commands in terminal to check device status.

```gherkin
Feature: Add Network Device
  Background:
    Given I am on the device configuration page
    And the device list is empty

  Scenario: Successfully add a valid device
    When I enter "Router East Wing" as the device name
    And I enter "192.168.1.1" as the IP address
    And I select "router" as the device type
    And I enter "East Wing" as the location
    And I click the "Add Device" button
    Then the device "Router East Wing" appears in my device list
    And the device displays with "pending" status
    And monitoring begins automatically within 5 seconds
    And the device is persisted in the database
    And a success message "Device added successfully" is displayed

  Scenario: Reject invalid IP address
    When I enter "Test Device" as the device name
    And I enter "999.999.999.999" as the IP address
    And I click the "Add Device" button
    Then an error message "Invalid IP address format" is displayed
    And the device is not added
    And no database entry is created

  Scenario: Reject duplicate IP address
    Given a device exists with IP "192.168.1.1"
    When I enter "Duplicate Router" as the device name
    And I enter "192.168.1.1" as the IP address
    And I click the "Add Device" button
    Then an error message "IP address already exists" is displayed
    And the device is not added

  Scenario: Reject empty device name
    When I leave the device name empty
    And I enter "192.168.1.1" as the IP address
    And I click the "Add Device" button
    Then an error message "Device name is required" is displayed

  Scenario: Reject device name exceeding maximum length
    When I enter a device name with 101 characters
    And I enter "192.168.1.1" as the IP address
    And I click the "Add Device" button
    Then an error message "Device name must be 100 characters or fewer" is displayed

  Scenario: Support IPv6 addresses
    When I enter "Printer IPv6" as the device name
    And I enter "2001:0db8:85a3:0000:0000:8a2e:0370:7334" as the IP address
    And I select "printer" as the device type
    And I click the "Add Device" button
    Then the device "Printer IPv6" appears in my device list
    And monitoring begins automatically
```

**Acceptance Criteria:**
- ✅ IP address validated (IPv4 regex, IPv6 regex)
- ✅ Name must be 1-100 alphanumeric characters (with spaces, hyphens, underscores)
- ✅ Device type from dropdown: server, router, printer, switch
- ✅ Duplicate IPs rejected with clear error
- ✅ Success/error feedback shown via toast notification
- ✅ British English used in all UI text
- ✅ Device persisted to SQLite within 1 second
- ✅ Monitoring begins within 5 seconds of add

**KSB Mapping:** S1 (validation logic), S2 (form UI), S3 (database persistence), S17 (input validation)

---

### Story 1.2: Edit Device Details (Sprint 2)

**As the network administrator, I want** to edit device details **so that** I can correct mistakes or update information as the network changes.

**Context:** JJ Confederation Ltd's network evolves — devices get renamed, moved between locations, or reconfigured. Jeff needs to keep the monitor in sync without deleting and recreating devices.

```gherkin
Feature: Edit Network Device
  Background:
    Given I have devices configured:
      | name           | ip_address    | type   | location    |
      | Router East    | 192.168.1.1 | router | East Wing   |

  Scenario: Successfully edit device name
    When I click the edit button for "Router East"
    And I change the name to "Router East Wing Updated"
    And I click the "Save Changes" button
    Then the device list shows "Router East Wing Updated"
    And the IP address remains "192.168.1.1"
    And monitoring continues uninterrupted
    And a success message "Device updated successfully" is displayed

  Scenario: Successfully edit device location
    When I click the edit button for "Router East"
    And I change the location to "East Wing - 2nd Floor"
    And I click the "Save Changes" button
    Then the device detail view shows "East Wing - 2nd Floor"

  Scenario: Reject edit with invalid IP
    When I click the edit button for "Router East"
    And I change the IP address to "invalid"
    And I click the "Save Changes" button
    Then an error message "Invalid IP address format" is displayed
    And the original IP "192.168.1.1" is retained

  Scenario: Cancel edit operation
    When I click the edit button for "Router East"
    And I change the name to "Changed Name"
    And I click the "Cancel" button
    Then the device list still shows "Router East"
    And no database changes are made
```

**Acceptance Criteria:**
- ✅ All fields editable except device ID
- ✅ Same validation as "Add Device"
- ✅ Monitoring continues with existing settings
- ✅ Historical data preserved and associated
- ✅ Cancel operation reverts all changes
- ✅ Changes persisted within 1 second

**KSB Mapping:** S1 (update logic), S2 (edit form UI), S3 (database updates)

---

### Story 1.3: Remove Device (Sprint 2)

**As the network administrator, I want** to remove a device **so that** I stop monitoring decommissioned equipment and keep the dashboard uncluttered.

**Context:** When Jeff retires old printers or replaces routers, he needs to clean up the monitoring list. Historical data should be retained for reference even after removal.

```gherkin
Feature: Remove Network Device
  Background:
    Given I have devices configured:
      | name        | ip_address    | type   |
      | Old Printer | 192.168.1.50 | printer |
    And "Old Printer" has 500 ping records in history

  Scenario: Remove device with confirmation
    When I click the delete button for "Old Printer"
    Then a confirmation dialog appears:
      """
      Are you sure you want to delete "Old Printer"?
      This will stop monitoring but retain historical data.
      """
    When I click "Confirm Delete"
    Then "Old Printer" is removed from the device list
    And monitoring stops immediately
    And a success message "Device removed" is displayed
    And historical ping data is retained in database

  Scenario: Cancel device removal
    When I click the delete button for "Old Printer"
    And I click "Cancel" in the confirmation dialog
    Then "Old Printer" remains in the device list
    And monitoring continues uninterrupted

  Scenario: Cannot delete while actively alerting
    Given "Old Printer" has an active critical alert
    When I attempt to delete "Old Printer"
    Then a warning message is displayed:
      """
      This device has active alerts. Please acknowledge 
      or resolve alerts before removing.
      """
    And the delete operation is blocked
```

**Acceptance Criteria:**
- ✅ Soft delete (mark inactive) or hard delete with data retention
- ✅ Confirmation dialog required
- ✅ Monitoring stops immediately (< 1 second)
- ✅ Historical data retained (for reporting)
- ✅ Cannot delete with active unacknowledged alerts
- ✅ Cancel operation available

**KSB Mapping:** S1 (delete logic), S2 (confirmation UI), S3 (data retention), S17 (safety checks)

---

## Epic 2: Real-time Monitoring

### Story 2.1: View Device Status Dashboard (Sprints 1, 3)

**As the network administrator, I want** to see all device statuses at a glance **so that** I can identify problems during my morning coffee check without opening a terminal.

**Context:** Jeff's ideal workflow: arrive at 8am, open the dashboard, spot any amber/red indicators immediately, investigate before users arrive. This replaces the current reactive model of discovering issues via user complaints.

```gherkin
Feature: Device Status Dashboard
  Background:
    Given monitoring is active for the following devices:
      | name           | ip_address    | status    | latency | packet_loss |
      | Healthy Router | 192.168.1.1   | online    | 12ms    | 0%          |
      | Slow Server    | 192.168.1.10  | warning   | 85ms    | 2%          |
      | Down Printer   | 192.168.1.50  | offline   | -       | 100%        |

  Scenario: View colour-coded status indicators
    When I view the dashboard
    Then I see 3 device cards
    And "Healthy Router" displays with green indicator
    And "Slow Server" displays with amber indicator
    And "Down Printer" displays with red indicator

  Scenario: View current latency values
    When I view the dashboard
    Then "Healthy Router" shows "12ms" latency
    And "Slow Server" shows "85ms" latency
    And "Down Printer" shows "Unreachable" status

  Scenario: View last successful ping time
    When I view the dashboard
    Then each device shows "Last ping: 2 seconds ago" or similar
    And "Down Printer" shows "Last successful: 15 minutes ago"

  Scenario: Status updates in real-time
    Given "Slow Server" latency improves to 30ms
    When 5 seconds pass
    Then the "Slow Server" card changes from amber to green
    And the latency updates to "30ms"

  Scenario: Status accessibility - colour blind friendly
    When I view the dashboard with colour blind simulation
    Then status is distinguishable by:
      | status  | icon      | text         |
      | online  | checkmark | "Online"     |
      | warning | triangle  | "Warning"    |
      | offline | cross     | "Offline"    |

  Scenario: Dashboard empty state
    Given no devices are configured
    When I view the dashboard
    Then an empty state message appears:
      """
      No devices configured. Add your first device to begin monitoring.
      """
    And a "Add Device" button is prominently displayed
```

**Status Thresholds:**
| Status | Latency | Packet Loss | Colour | Icon |
|--------|---------|-------------|--------|------|
| Excellent | <10ms | 0% | Green | Checkmark |
| Good | 10-50ms | <5% | Yellow/Amber | Checkmark |
| Fair | 50-150ms | <10% | Orange | Triangle |
| Poor | >150ms or unreachable | >10% | Red | Cross |

**Accessibility Requirements:**
- ✅ Colour not sole indicator (icons + text)
- ✅ ARIA labels on status indicators
- ✅ Screen reader announces status changes
- ✅ Sufficient contrast (WCAG AA)

**KSB Mapping:** S2 (dashboard UI), S8 (design patterns), S16 (status algorithms), B7 (accessibility)

---

### Story 2.2: View Latency Trends (Sprint 3)

**As the network administrator, I want** to see historical latency charts **so that** I can identify patterns (like that printer that always slows down at 9am when everyone arrives) and make data-driven decisions.

**Context:** Jeff has noticed intermittent issues but lacks data to prove patterns. Charts will help him distinguish between "one-off blips" and "recurring problems that need hardware replacement".

```gherkin
Feature: Latency Trend Charts
  Background:
    Given "Router East" has 24 hours of ping history
    And ping interval is 5 seconds (17,280 data points)

  Scenario: View default 1-hour chart
    When I navigate to the "Router East" detail page
    Then a line chart is displayed
    And the chart shows latency over the last 1 hour
    And the Y-axis shows "Latency (ms)" from 0 to max+20%
    And the X-axis shows time labels (12:00, 12:15, etc.)

  Scenario: Change time range
    When I select "24 hours" from the time range dropdown
    Then the chart updates to show 24 hours of data
    And data is decimated to maintain performance (<1000 points visible)
    And chart renders within 100ms

  Scenario: Hover for precise values
    When I hover over a data point at 14:30
    Then a tooltip displays:
      """
      Time: 14:30:05
      Latency: 45ms
      Status: Success
      """

  Scenario: Chart updates in real-time
    Given the chart is displaying current data
    When a new ping result arrives (latency: 38ms)
    Then the chart animates to include the new point
    And the oldest point is removed (sliding window)

  Scenario: Identify patterns in data
    When I view the 24-hour chart
    Then I can visually identify:
      | pattern              | visual indicator           |
      | Latency spikes       | Sharp peaks                |
      | Consistent baseline  | Stable line at ~30ms       |
      | Gradual increase     | Rising trend over hours    |
      | Packet loss events   | Gaps in line               |

  Scenario: Chart performance with large datasets
    Given 7 days of data (120,960 points)
    When I view the 7-day chart
    Then the chart renders within 200ms
    And data is intelligently decimated (LTTB algorithm)
    And zooming reveals full detail

  Scenario: No data available
    Given a device with no ping history
    When I view the chart
    Then an empty state displays:
      """
      No data available yet. Monitoring data will appear 
      after the first ping cycle completes (within 5 seconds).
      """
```

**Time Range Options:**
- 5 minutes (60 points, raw data)
- 1 hour (720 points, raw data)
- 24 hours (17,280 points, decimated)
- 7 days (120,960 points, heavily decimated)

**Performance Requirements:**
- Chart render: <100ms
- Data decimation: LTTB (Largest Triangle Three Buckets) algorithm
- Real-time update: <50ms

**KSB Mapping:** S2 (chart UI), S3 (data queries), S16 (data decimation algorithms), S8 (performance design)

---

## Epic 3: Outage Detection & Alerting

### Story 3.1: Configure Alert Thresholds (Sprint 5)

**As the network administrator, I want** to set custom alert thresholds per device **so that** I am not overwhelmed with notifications but do get alerted when something genuinely needs attention.

**Context:** Jeff manages different device types with different expectations — a server should respond in <50ms, but a cheap wireless printer might normally take 100ms. Thresholds prevent alert fatigue.

```gherkin
Feature: Configure Alert Thresholds
  Background:
    Given "Router East" is configured
    And I am on the device settings page

  Scenario: Set latency threshold
    When I enable "Latency Alerts"
    And I set the threshold to "100ms"
    And I save the settings
    Then the system will trigger an alert when latency exceeds 100ms
    And the threshold is persisted in database

  Scenario: Set consecutive failure threshold
    When I enable "Connection Failure Alerts"
    And I set "Trigger after" to "3 consecutive failures"
    And I save the settings
    Then the system triggers after 3 failed pings (15 seconds)
    And 1-2 failures are logged but not alerted

  Scenario: Set severity levels
    When I configure alerts:
      | condition           | severity |
      | Latency >100ms      | warning  |
      | Latency >200ms      | critical |
      | 3 consecutive fails | critical |
    And I save the settings
    Then each alert type is tagged with its severity
    And dashboard shows colour-coded severity

  Scenario: Disable alerts for device
    When I uncheck "Enable Alerts"
    And I save the settings
    Then no alerts are generated for this device
    But status changes are still displayed on dashboard
```

**Default Thresholds:**
| Condition | Default | Range | Severity |
|-----------|---------|-------|----------|
| Latency | 150ms | 50-500ms | Warning |
| Consecutive failures | 3 | 1-10 | Critical |
| Packet loss | 10% | 1-50% | Warning |

**KSB Mapping:** S1 (threshold logic), S2 (settings UI), S3 (persistence)

---

### Story 3.2: Receive and Acknowledge Alerts (Sprint 5)

**As the network administrator, I want** visual and audible alerts when thresholds are breached **so that** I notice issues even when the dashboard is not in focus.

**Context:** Jeff often has multiple applications open while troubleshooting. A toast notification that appears over other windows ensures critical issues are not missed. Acknowledgement prevents repeated alerts for the same issue.

```gherkin
Feature: Alert Notifications
  Background:
    Given "Router East" has a latency threshold of 100ms
    And alerts are enabled

  Scenario: Receive latency alert
    When "Router East" latency exceeds 100ms
    Then a toast notification appears:
      """
      ⚠️ WARNING: Router East
      Latency: 145ms (threshold: 100ms)
      Time: 14:32:05
      """
    And the device card pulses briefly
    And an entry is added to the alert log
    And the alert counter increments on the alert icon

  Scenario: Receive critical alert
    When "Router East" has 3 consecutive ping failures
    Then a toast notification appears:
      """
      🔴 CRITICAL: Router East
      Device unreachable for 15 seconds
      Time: 14:35:00
      """
    And the notification persists until acknowledged
    And a sound plays (if enabled)

  Scenario: Acknowledge alert
    Given I have an unacknowledged critical alert
    When I click the "Acknowledge" button
    Then the alert is marked as acknowledged
    And the toast notification dismisses
    And the alert is moved to "Acknowledged" section in log
    And the alert counter decrements

  Scenario: View alert history
    When I click the "Alert History" link
    Then I see a list of all alerts:
      | time     | device       | severity | message          | status        |
      | 14:32:05 | Router East  | warning  | Latency high     | acknowledged  |
      | 14:15:22 | Server Main  | critical | Unreachable      | unacknowledged|

  Scenario: Alert deduplication
    Given a latency alert is already active for "Router East"
    When latency remains above threshold for 5 minutes
    Then no duplicate alert is generated
    But the alert log shows "Escalated: Latency still high after 5 minutes"
```

**Alert Lifecycle:**
```
Triggered → Unacknowledged → Acknowledged → Resolved
     ↓            ↓              ↓            ↓
  Toast       Counter++      Counter--    Log entry
  Sound       Dashboard      History      (retained)
```

**KSB Mapping:** S2 (notification UI), S5 (alert testing), S6 (state machine testing), S13 (test frameworks)

---

## Epic 4: Historical Analysis & Reporting

### Story 4.1: View Outage History (Sprint 4)

**As the network administrator, I want** to see a history of all outages with calculated availability percentages **so that** I can answer questions like "how reliable is our network?" and justify infrastructure investments.

**Context:** Jeff needs concrete data for discussions with JJ Confederation Ltd management. "The east wing switch had 3 outages totalling 45 minutes last month" carries more weight than "the network seems flaky sometimes".

```gherkin
Feature: Outage History
  Background:
    Given the following outages have occurred:
      | device       | start_time          | end_time            | duration | severity |
      | Router East  | 2026-04-01 08:15:00 | 2026-04-01 08:20:00 | 5 min    | critical |
      | Printer 3rd  | 2026-04-02 14:30:00 | 2026-04-02 14:35:00 | 5 min    | warning  |
      | Router East  | 2026-04-03 09:00:00 | 2026-04-03 09:45:00 | 45 min   | critical |

  Scenario: View all outages
    When I navigate to the "Outage History" page
    Then I see 3 outage entries in a table
    And they are sorted by start time (newest first)
    And each row shows device, start, end, duration, severity

  Scenario: Filter by date range
    When I set the date filter to "Last 7 days"
    Then only outages from the last 7 days are displayed
    And the filter shows "Showing 3 of 3 outages"

  Scenario: Filter by device
    When I select "Router East" from the device filter
    Then only outages for "Router East" are displayed (2 entries)
    And the filter shows "Showing 2 of 3 outages"

  Scenario: Sort by duration
    When I click the "Duration" column header
    Then outages are sorted by duration (longest first)
    And "Router East 45min" is at the top

  Scenario: View outage details
    When I click on an outage row
    Then a detail panel shows:
      - Full timeline (start, end, duration)
      - Affected device details
      - Related ping logs (first failure, recovery)
      - Alert history during outage

  Scenario: Calculate availability
    Given I filter to "Router East" for "Last 30 days"
    When the page loads
    Then an availability summary shows:
      """
      Availability: 99.72%
      Total downtime: 50 minutes
      Outage count: 2
      Mean Time To Recovery (MTTR): 25 minutes
      """
```

**Availability Formula:**
```
Availability % = (Total Time - Downtime) / Total Time × 100
```

**KSB Mapping:** S3 (data aggregation), S6 (calculation testing), S16 (availability algorithms)

---

### Story 4.2: Export Data to CSV (Sprint 4)

**As the network administrator, I want** to export ping data and outage reports to CSV **so that** I can analyse them in Excel or share with external consultants when needed.

**Context:** While most analysis happens within the app, Jeff occasionally needs to share data with vendors or create custom reports for management. CSV is the universal format that works everywhere.

```gherkin
Feature: Export Data to CSV
  Background:
    Given "Router East" has 1000 ping records
    And I am on the device detail page

  Scenario: Export ping data
    When I click "Export to CSV"
    Then a dialog appears with options:
      | option          | default      |
      | Date range      | Last 24 hours|
      | Data type       | All pings    |
      | Aggregation     | None (raw)   |
    When I click "Export"
    Then a CSV file downloads with columns:
      | timestamp           | device_name  | ip_address    | latency_ms | success | packet_loss |
      | 2026-04-01 08:00:00| Router East  | 192.168.1.1   | 12         | true    | false       |
      | 2026-04-01 08:00:05| Router East  | 192.168.1.1   | 15         | true    | false       |

  Scenario: Export aggregated data
    When I select "Aggregated hourly" as data type
    And I click "Export"
    Then the CSV contains hourly averages:
      | hour                | avg_latency | min_latency | max_latency | success_rate |
      | 2026-04-01 08:00:00 | 14.5        | 10          | 23          | 100%         |

  Scenario: Export outage report
    When I navigate to "Outage History"
    And I click "Export Report"
    Then a CSV downloads with outage summary:
      | device | outage_count | total_downtime | availability_pct |

  Scenario: Large dataset handling
    Given I have 100,000 ping records
    When I attempt to export all data
    Then a progress indicator shows "Exporting 15%..."
    And the export completes within 10 seconds
    And the file size is approximately 5MB
```

**KSB Mapping:** S3 (data export), S6 (export testing), S16 (aggregation algorithms)

---

## Story Mapping Summary

```
Backbone: Monitor Network Devices
│
├── Walking Skeleton (MVP Core)
│   ├── Add single device (Story 1.1 - basic)
│   ├── View status dashboard (Story 2.1 - basic)
│   └── Basic CSV export (Story 4.2 - basic)
│
├── Release 1 (Device Management)
│   ├── Edit device (Story 1.2)
│   ├── Remove device (Story 1.3)
│   ├── IPv6 support (Story 1.1 - extended)
│   └── Multi-device dashboard (Story 2.1 - extended)
│
├── Release 2 (Visualisation)
│   ├── Latency charts (Story 2.2)
│   ├── Time range selection (Story 2.2)
│   └── Chart performance optimisation (Story 2.2)
│
├── Release 3 (Alerting)
│   ├── Configure thresholds (Story 3.1)
│   ├── Visual alerts (Story 3.2)
│   ├── Alert history (Story 3.2)
│   └── Alert acknowledgement (Story 3.2)
│
└── Release 4 (Reporting)
    ├── Outage history (Story 4.1)
    ├── Availability calculations (Story 4.1)
    ├── Aggregated exports (Story 4.2)
    └── Advanced filtering (Story 4.1)
```

---

## Sprint Allocation

| Sprint | Stories | KSB Focus | Discussion Context |
|--------|---------|-----------|-------------------|
| 1 | 1.1 (basic), 2.1 (basic) | S1, S2, S3, S10 | Greg and Jeff agreed: start with single device, prove the concept works |
| 2 | 1.1 (extended), 1.2, 1.3 | S1, S3, S4, S7 | Jeff needs multi-device support for his 40-50 infrastructure devices |
| 3 | 2.1 (extended), 2.2 | S2, S8, S16, K4 | Visual dashboard priority — Jeff wants to spot issues at a glance |
| 4 | 4.1, 4.2 (basic) | S3, S6, S16, K10 | Historical data for capacity planning discussions with management |
| 5 | 3.1, 3.2 | S5, S6, S13, B6 | Alerting phase — Jeff wants proactive notifications, not just reactive checks |
| 6 | 4.2 (extended), polish | S10, S12, S15 | Production packaging and documentation for handover to Jeff |

**Note:** Sprint allocation reflects discussions between Greg (apprentice) and Jeff (employer/mentor/user) during backlog refinement sessions.

---

**Document Version:** 1.0  
**Last Updated:** April 2026  
**Format:** Gherkin (Cucumber)  
**Next Review:** Sprint Planning
