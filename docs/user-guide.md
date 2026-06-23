# AMF Network Device Monitor — User Guide

**Version:** 1.0
**Date:** 23 June 2026
**For:** End users of the AMF Network Device Monitor desktop application

---

## What this application does

AMF Network Device Monitor is a desktop tool for JJ Confederation Ltd that keeps an eye on your network infrastructure. It sends regular ping requests to the devices you add — servers, routers, printers, switches — and shows you their status in real time. If a device goes offline or starts responding slowly, the app logs it as an outage and can alert you automatically.

Everything runs locally on your Windows PC. No cloud accounts, no external services, no subscription fees.

---

## System requirements

- **Operating system:** Windows 10 or later (64-bit)
- **RAM:** 4 GB minimum, 8 GB recommended
- **Disk space:** 200 MB for the application, plus space for the SQLite database (typically under 50 MB unless you have hundreds of devices and months of history)
- **Network:** ICMP ping must be allowed by Windows Firewall for the monitoring feature to work
- **Administrator rights:** Required for installation (standard Windows installer behaviour)

---

## Installation

1. Download the installer from your line manager or the project shared drive.
2. Double-click `amf-network-monitor-1.0.0 Setup.exe`.
3. Windows SmartScreen may show a warning because the installer is not code-signed. Click **More info** then **Run anyway**.
4. The installer places a shortcut on your Desktop and in the Start Menu under `JJ Confederation Ltd`.
5. The application installs to `%LocalAppData%\AMFNetworkMonitor`.

**Uninstall:**

- Go to **Settings > Apps > Installed apps**, find `amf-network-monitor`, and select **Uninstall**.
- Your monitoring database is kept at `%AppData%\amf-network-monitor\network-monitor.sqlite` and is **not** removed during uninstall so you do not lose historical data.

---

## First run

When you open the app for the first time, it creates a local SQLite database automatically. You will see a clean interface with a light theme and a device count of zero.

Use the moon / sun button in the top-right corner to switch between dark and light mode. Your preference is remembered across restarts.

---

## Adding a device

1. Scroll down to the **Add Device** card.
2. Enter a friendly **Name** — for example, `Main Router` or `Floor-2 Printer`.
3. Enter the **Network Address**. This can be:
   - An IPv4 address: `192.168.1.1`
   - An IPv6 address: `2001:db8::1`
   - A hostname: `router.local` or `printer.office`
4. Click **Add Device**.

The device appears in the **Monitored Devices** list. You can add as many devices as you need.

**Tips:**
- Names can be up to 100 characters.
- The app checks for duplicate IP addresses on active devices to prevent confusion.
- If you enter a hostname, the app verifies it can be resolved before saving it.

---

## Editing a device

1. Find the device in the **Monitored Devices** list.
2. Click **Edit**.
3. Update the name, address, device type (Server, Router, Printer, Switch), or location.
4. Click **Save**. Click **Cancel** if you change your mind.

---

## Deleting a device

1. Click **Delete** next to the device.
2. Confirm in the popup. **This also removes all ping history and outage records for that device.**

---

## Starting and stopping monitoring

### Start monitoring a single device

1. Click the **Start** button on the device card.
2. The status badge changes to show the current latency in milliseconds (for example, `12ms`).
3. A green dot means the device is responding. A red **OFFLINE** badge means it is not.

### Stop monitoring

Click **Stop** on the device card. Monitoring halts and the badge changes to **Not Monitoring**.

### Start all / stop all

The **Dashboard** section at the top has **Start All Monitoring** and **Stop All Monitoring** buttons if you want to control every device at once.

---

## Understanding the dashboard

The **Dashboard** is the first thing you see when you open the app.

### Summary cards

Four cards show the overall picture:
- **Total Devices** — how many devices are in the database
- **Online** — devices currently responding to pings
- **Offline** — devices not responding
- **Active Outages** — ongoing outages that have not been resolved yet

### Latency chart

A line chart shows the most recent latency readings for each monitored device. This updates in real time as new ping results arrive. You can hover over the lines to see exact values.

### Live ping results

Below the device list, a scrolling log shows the last ping result for each device with a timestamp. Green rows are successful pings. Red rows are timeouts.

---

## Outages

An **outage** is recorded automatically when a device fails to respond to a configurable number of consecutive pings. You do not create outages manually.

### Outage timeline

In the **Outage Analysis** section, the timeline shows a visual bar for each outage. The length of the bar indicates how long the device was offline.

- Hover over a bar to see the start time, end time, and duration.
- Bars are colour-coded: orange for warning-level outages, red for critical.

### Outage history table

A table lists every outage with:
- Device name and IP address
- Start time
- End time (or **Ongoing** if it has not recovered)
- Duration in seconds
- Severity (Warning or Critical)

---

## Historical analysis

The **Historical Analysis** section lets you look back at performance over days or weeks.

### Query builder

1. Pick a **date range** using the start and end date fields.
2. Optionally select a **specific device** from the dropdown, or leave it on **All Devices**.
3. Click **Apply Filters**.

### Summary cards

After applying filters, you see:
- **Average Uptime** — percentage of time devices were online
- **Average Latency** — mean response time across the period
- **Total Outages** — count of outage events
- **Total Downtime** — cumulative offline time in minutes

### Device breakdown table

Each row shows one device and its statistics for the selected period. This is useful for spotting chronic under-performers.

---

## Exporting data

The **Export Manager** lets you save monitoring data to a file.

### Export types

- **Ping Logs** — every ping result recorded
- **Outages** — all outage events
- **Devices** — the device list

### Formats

- **CSV** — opens in Excel or any spreadsheet application
- **HTML Report** — a styled document with charts you can print or email

### How to export

1. Choose the **Data Type** (Ping Logs, Outages, or Devices).
2. (Optional) Pick a **device** and a **date range** to narrow the results.
3. Choose **CSV** or **HTML Report**.
4. For HTML, pick a template: **Uptime**, **Latency**, or **Outage**.
5. Click **Generate**.
6. Click **Save to File** and choose where to save it.

**Note:** To prevent abuse, exports are rate-limited to five per minute.

---

## Alerts

### Alert configuration

Each device has its own alert settings. Scroll to **Alert Configuration**.

1. Select a device from the dropdown.
2. Turn alerts **On** or **Off**.
3. Set the thresholds:
   - **Latency Threshold** — trigger an alert if response time exceeds this value (in milliseconds)
   - **Consecutive Failures** — trigger an alert after this many failed pings in a row
   - **Packet Loss Threshold** — trigger if packet loss exceeds this percentage
4. Pick a **severity** for each threshold type (Warning or Critical).
5. Click **Save Configuration**.

A default alert configuration is created automatically when you add a new device, so you do not have to set it up manually unless you want custom thresholds.

### Active alerts panel

The **Active Alerts** panel sits on the right side of the screen. It shows any alerts that are currently triggered or unacknowledged.

- **Acknowledge** an alert to silence the notification while you investigate.
- **Resolve** an alert to mark it as fixed.
- Alerts are colour-coded: yellow for Warning, red for Critical.

### Alert history

The **Alert History** panel below Active Alerts shows all past alerts with their status:
- **Triggered** — alert fired
- **Unacknowledged** — alert fired but not yet acknowledged
- **Acknowledged** — someone has seen it
- **Resolved** — the issue is fixed

### Toast notifications

When an alert fires, a toast notification slides in from the top-right. Critical alerts stay on screen until you dismiss them. Warning alerts disappear after six seconds.

---

## Data retention

The app stores all ping results and outages in a local SQLite database. Over time this can grow large.

To manage this, a **retention policy** is available. By default, the app keeps 30 days of ping history. Older records are automatically purged. You can adjust this setting through the database management interface if needed (contact your system administrator for changes to the default policy).

---

## Keyboard shortcuts

There are no custom keyboard shortcuts in this version. Standard Windows shortcuts work (for example, `Alt + F4` to close the window, `Ctrl + +` to zoom in).

---

## Troubleshooting

### The app says "Database not available"

This means the SQLite database could not be opened. The app will still run, but no data will be saved.

**Fix:** Close the app and reopen it. If the problem persists, check that your user account has write permission to `%AppData%\amf-network-monitor`.

### A device shows as OFFLINE but I can ping it from Command Prompt

Windows Firewall may be blocking ICMP pings from the Electron process.

**Fix:** Add an outbound rule in Windows Firewall to allow ICMP echo requests from `amf-network-monitor.exe`.

### The latency chart is blank

You need at least one device actively monitoring. Make sure you clicked **Start** on a device and waited for a few ping cycles (about 15 seconds).

### Exports fail with "Rate limit exceeded"

You have generated too many exports in a short time. Wait one minute and try again.

### The installer triggers SmartScreen

The installer is not signed with a commercial code-signing certificate. This is expected for the apprenticeship build. Click **More info** then **Run anyway** to proceed.

---

## Getting help

If you encounter an issue not covered here:

1. Check the **Live Ping Results** section for clues.
2. Look at the **Active Alerts** and **Alert History** panels.
3. Ask your line manager or the IT support team at JJ Confederation Ltd.

---

**Document Version:** 1.0
**Last Updated:** 23 June 2026
