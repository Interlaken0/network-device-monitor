# AMF Network Device Monitor — Deployment Guide

**Version:** 1.0
**Date:** 23 June 2026
**For:** IT administrators and anyone installing the application on end-user machines

---

## Overview

This guide covers how to deploy the AMF Network Device Monitor desktop application to Windows workstations at JJ Confederation Ltd. The application is packaged as a Squirrel.Windows installer (`.exe`) and does not require Node.js, npm, or any developer tools on the target machine.

---

## System requirements

| Requirement | Minimum | Recommended |
|-------------|---------|-------------|
| Operating system | Windows 10 (64-bit) | Windows 10/11 (64-bit) |
| Processor | Intel Core i3 or equivalent | Intel Core i5 or equivalent |
| RAM | 4 GB | 8 GB |
| Free disk space | 250 MB | 500 MB |
| Network | ICMP ping allowed by firewall | Full internal network access |
| Display | 1366 x 768 | 1920 x 1080 |

**Notes:**
- The application is built for 64-bit Windows only.
- Windows Server editions are not officially tested but may work if the desktop experience is installed.
- macOS and Linux builds are not provided in this release.

---

## What you need before starting

1. The installer file: `amf-network-monitor-1.0.0 Setup.exe`
2. Administrative rights on the target PC (for installation)
3. (Optional) A code-signing certificate if you are re-packaging the application

---

## Installation methods

### Method 1: Interactive installation (single PC)

1. Copy the installer to the target machine.
2. Double-click `amf-network-monitor-1.0.0 Setup.exe`.
3. If Windows SmartScreen appears, click **More info** then **Run anyway**.
4. The installer runs silently for a few seconds. No wizard prompts appear — this is normal for Squirrel.Windows installers.
5. Once complete, the application launches automatically and a Desktop shortcut is created.

**What gets installed:**

| Location | Contents |
|----------|----------|
| `%LocalAppData%\AMFNetworkMonitor` | Application files, updater stub, and version metadata |
| `%LocalAppData%\AMFNetworkMonitor\app-1.0.0` | The actual Electron application binaries |
| `%AppData%\amf-network-monitor` | User data: `network-monitor.sqlite` database and configuration |
| Desktop | Shortcut to launch the app |
| Start Menu | Shortcut under `JJ Confederation Ltd\amf-network-monitor` |

### Method 2: Bulk deployment (multiple PCs)

For deployment via Group Policy, SCCM, or Intune, run the installer in the user context:

```powershell
# Run installer (Squirrel.Windows executes in the background)
amf-network-monitor-1.0.0 Setup.exe
```

**Note:** Squirrel.Windows `Setup.exe` does not accept a `--silent` parameter. The installer runs without a wizard by design. The app auto-launches at the end. To suppress the launch, configure a GPO or use a wrapper script.

**SCCM / Intune detection rule:**

Check for the existence of:
```
%LocalAppData%\AMFNetworkMonitor\amf-network-monitor.exe
```

Or query the registry. The exact key name depends on the `name` field in `package.json`:
```powershell
Get-ItemProperty "HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall\amf-network-monitor" -ErrorAction SilentlyContinue
# If the above fails, try:
Get-ChildItem "HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\" | Get-ItemProperty | Where-Object { $_.DisplayName -like "*amf*" }
```

### Method 3: Manual file copy (not recommended)

If you need to place the application on a shared network drive for portable use, extract the contents of the NuGet package (`.nupkg`) and run `amf-network-monitor.exe` directly. Note that the auto-updater and shortcut creation will not function.

---

## First-run setup

After installation, the application creates its local SQLite database automatically on first launch. No manual database setup is required.

**Default data location:**
```
%AppData%\amf-network-monitor\network-monitor.sqlite
```

If you need to pre-seed devices for multiple users, copy a prepared database file to that path before the user launches the app for the first time.

---

## Firewall configuration

The monitoring feature sends ICMP echo requests (pings) to the target devices. Windows Firewall must allow this.

**Option A: Allow all outbound ICMP**

1. Open **Windows Defender Firewall with Advanced Security**.
2. Go to **Outbound Rules**.
3. Click **New Rule**.
4. Choose **Custom** > **All programs** > **Protocol type: ICMPv4** > **Allow the connection**.
5. Apply to **Domain**, **Private**, and **Public** profiles as appropriate.

**Option B: Allow only for the application**

Create an outbound rule for `%LocalAppData%\AMFNetworkMonitor\app-1.0.0\amf-network-monitor.exe`, protocol ICMPv4, action **Allow**.

---

## Uninstallation

### Per-user uninstall

1. Close the application if it is running.
2. Go to **Settings > Apps > Installed apps**.
3. Find `amf-network-monitor`, click the three dots, and select **Uninstall**.
4. The application files and shortcuts are removed. The database at `%AppData%\amf-network-monitor` is preserved.

### Clean removal (including database)

If you need to remove the database as well:

```powershell
# Remove application
& "$env:LOCALAPPDATA\AMFNetworkMonitor\Update.exe" --uninstall

# Remove user data
Remove-Item -Recurse -Force "$env:APPDATA\amf-network-monitor"

# Remove shortcuts
Remove-Item -Force "$env:USERPROFILE\Desktop\amf-network-monitor.lnk"
Remove-Item -Recurse -Force "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\JJ Confederation Ltd"
```

### Mass uninstall via script

```powershell
# Run on each target machine
$users = Get-ChildItem C:\Users
foreach ($user in $users) {
    $localAppData = Join-Path $user.FullName "AppData\Local\AMFNetworkMonitor"
    $roamingAppData = Join-Path $user.FullName "AppData\Roaming\amf-network-monitor"
    if (Test-Path $localAppData) {
        & "$localAppData\Update.exe" --uninstall 2>$null
        Start-Sleep -Seconds 2
        Remove-Item -Recurse -Force $localAppData -ErrorAction SilentlyContinue
        Remove-Item -Recurse -Force $roamingAppData -ErrorAction SilentlyContinue
    }
}
```

---

## Upgrading

The application includes an auto-updater stub. When a new version is published to the update server, the app checks on startup and installs updates automatically.

**Current release:** No update server is configured. Upgrades must be performed manually by running the new installer.

**Manual upgrade:**

1. Download the new installer.
2. Run it. Squirrel.Windows handles the migration: the old version is replaced, shortcuts are updated, and the database is preserved.

---

## Troubleshooting deployment issues

### SmartScreen blocks the installer

**Cause:** The installer is not signed with a trusted code-signing certificate.

**Workarounds:**
- Instruct users to click **More info > Run anyway**.
- Distribute the installer via an internal file share so Windows marks it as coming from the local network.
- Purchase a code-signing certificate and re-sign the `.exe` using `signtool.exe`.

### "Application cannot start" error

**Cause:** Native module (better-sqlite3) was not unpacked correctly.

**Fix:**
1. Check that `%LocalAppData%\AMFNetworkMonitor\app-1.0.0\resources\app` contains the `better-sqlite3` folder.
2. If missing, the ASAR may not have unpacked correctly. Re-run the installer.

### Database is read-only or missing

**Cause:** The user does not have write permission to `%AppData%`, or the folder was created by a different user.

**Fix:**
1. Ensure the user has write access to their own AppData Roaming folder.
2. Delete `%AppData%\amf-network-monitor` and let the app recreate it.

### High CPU or memory usage

**Cause:** Monitoring too many devices with a very short ping interval.

**Fix:**
- Increase the ping interval (default is 5000 ms, which is usually fine for up to 20 devices).
- Reduce the number of concurrently monitored devices.
- Apply the retention policy to purge old ping logs.

---

## Known limitations

- **No code signing:** The installer and executable are unsigned. SmartScreen warnings are expected.
- **No automatic backups:** The SQLite database is not backed up automatically. Advise users to export data periodically.
- **Single-user data:** The database is stored per Windows user profile. If multiple users log in to the same PC, each gets their own isolated database.
- **No remote management:** This is a standalone desktop application. There is no central server or web dashboard.

---

## Appendix: File checksums

For integrity verification, the following SHA-256 hashes apply to the Sprint 6 release build:

| File | Expected SHA-256 |
|------|----------------|
| `amf-network-monitor-1.0.0 Setup.exe` | *(populate after build)* |
| `AMFNetworkMonitor-1.0.0-full.nupkg` | *(populate after build)* |

Generate hashes on your build machine:

```powershell
Get-FileHash -Algorithm SHA256 "out\make\squirrel.windows\x64\amf-network-monitor-1.0.0 Setup.exe"
Get-FileHash -Algorithm SHA256 "out\make\squirrel.windows\x64\AMFNetworkMonitor-1.0.0-full.nupkg"
```

---

**Document Version:** 1.0
**Last Updated:** 23 June 2026
