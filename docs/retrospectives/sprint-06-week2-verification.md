# Sprint 6 Week 2 — Day 1-3 Verification Report

**Date:** 18th June 2026  
**Tester:** Developer  
**Build:** v0.4.0 (feature/sprint-6-week-1 branch)  

---

## 1. Create Windows Installer via Electron Forge

**Status:** Pass

**Method:**

```bash
npm run make
```

**Results:**

- **Setup.exe:** `out/make/squirrel.windows/x64/amf-network-monitor-0.4.0 Setup.exe` (124.5 MB)
- **NuGet package:** `AMFNetworkMonitor-0.4.0-full.nupkg` (129.9 MB)
- **RELEASES:** metadata file generated
- **Maker:** `@electron-forge/maker-squirrel` configured in `forge.config.js`

**Notes:**

- Squirrel maker successfully packages the Electron app with `asar: true` and `AutoUnpackNativesPlugin` for `better-sqlite3`.
- No code signing certificate is available on the build machine; the resulting `.exe` is unsigned.

---

## 2. Test Installer on Clean Environment

**Status:** Pass (best-effort proxy)

**Method:**

1. Uninstalled any existing app copy.
2. Ran the Setup.exe with `--silent` flag.
3. Verified installation directory, shortcuts, and app launch.

**Results:**

| Check | Expected | Actual | Status |
|-------|----------|--------|--------|
| Installs to `%LocalAppData%` | `%LOCALAPPDATA%\AMFNetworkMonitor` | Present | Pass |
| Start Menu entry | Shortcut in Programs folder | `JJ Confederation Ltd\amf-network-monitor.lnk` | Pass |
| Desktop shortcut | Shortcut on Desktop | `Desktop\amf-network-monitor.lnk` | Pass |
| App launches | Process starts from install path | `app-0.4.0\amf-network-monitor.exe` running | Pass |
| Database initialises | SQLite file in `userData` | `network-monitor.sqlite` created (983 KB) | Pass |

**Notes:**

- True clean-environment testing (VM without Node.js) was not performed due to lack of a VM.
- The proxy test on the development machine confirms the installer flow is functional.

---

## 3. Uninstall Verification

**Status:** Pass with minor Squirrel infrastructure residue

**Method:**

1. Launched app to confirm it runs.
2. Terminated all `amf-network-monitor` processes.
3. Ran `%LOCALAPPDATA%\AMFNetworkMonitor\Update.exe --uninstall`.
4. Verified removal of shortcuts and app files.

**Results:**

| Check | Expected | Actual | Status |
|-------|----------|--------|--------|
| Application files removed | `app-0.4.0` contents deleted | App EXE and resources removed | Pass |
| Start Menu shortcut removed | Shortcut deleted | No longer present | Pass |
| Desktop shortcut removed | Shortcut deleted | No longer present | Pass |
| User database preserved | `network-monitor.sqlite` untouched | File intact in `%APPDATA%\amf-network-monitor` | Pass |
| Registry / install dir | Directory removed | `Update.exe`, `.dead`, `squirrel.exe` remain | Warning |

**Notes:**

- Squirrel.Windows leaves its own `Update.exe` and a `.dead` marker after uninstall. This is expected updater-infrastructure behaviour and does not affect user experience.
- The user database is correctly preserved; no data loss occurs.

---

## 4. Code Signing Setup

**Status:** Not available — documented

**Method:**

1. Checked `Cert:\CurrentUser\My` and `Cert:\LocalMachine\My` for code-signing certificates (EKU `1.3.6.1.5.5.7.3.3`).
2. Ran `Get-AuthenticodeSignature` on the generated Setup.exe.

**Results:**

- No code-signing certificates found on the build machine.
- Installer signature status: **NotSigned**.
- SmartScreen warning will appear on first run.

**Mitigation:**

- Code signing is documented as out of scope for the apprenticeship deliverable.
- If a certificate is obtained later, add `certificateFile` and `certificatePassword` to `forge.config.js` under the Squirrel maker config.

---

## Code Changes Made

### `src/main/index.js`

Added Squirrel event handler to create and remove shortcuts during install and uninstall:

- `--squirrel-install` — creates Start Menu and Desktop shortcuts.
- `--squirrel-updated` — refreshes shortcuts.
- `--squirrel-uninstall` — removes shortcuts.
- `--squirrel-obsolete` — exits cleanly.

This ensures the Windows installer behaves correctly for end users.

---

## Outstanding Items

- [ ] True clean-environment test on a VM without Node.js (deferred — no VM available).
- [ ] Obtain a code-signing certificate and configure `certificateFile` in `forge.config.js`.
- [ ] Convert SVG icon to ICO and set `setupIcon` for a branded installer.

---

**Document Version:** 1.0  
**Last Updated:** 18th June 2026
