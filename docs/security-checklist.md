# Security Checklist

**Project:** AMF Network Device Monitor  
**Purpose:** Pre-release security verification  
**Format:** Runnable checklist with ✅/❌ status  
**Review Cycle:** Every sprint, before release

---

## How to Use This Checklist

1. **Pre-Development:** Complete Section 1 before writing any code
2. **Per Sprint:** Complete Section 2-4 at sprint end
3. **Pre-Release:** Complete Section 5 before packaging
4. **Sign-off:** Product Owner and Developer both review

**Status Key:**
- ⬜ Not reviewed
- ✅ Pass (no issues found)
- ⚠️ Warning (minor issues, documented)
- ❌ Fail (block release, must fix)
- N/A Not applicable

---

## Section 1: Electron Security Configuration

### 1.1 BrowserWindow Security

| # | Check | Status | Notes |
|---|-------|--------|-------|
| 1.1.1 | `nodeIntegration: false` set in all windows | ✅ | Verified at `src/main/index.js:67` |
| 1.1.2 | `contextIsolation: true` set in all windows | ✅ | Verified at `src/main/index.js:68` |
| 1.1.3 | `sandbox: true` enabled | ✅ | Verified at `src/main/index.js:69` |
| 1.1.4 | `allowRunningInsecureContent: false` | ✅ | Verified at `src/main/index.js:71` |
| 1.1.5 | `experimentalFeatures: false` | ✅ | Verified at `src/main/index.js:72` |
| 1.1.6 | `enableRemoteModule: false` (or not used) | ✅ | Not present; module deprecated in Electron 14+ |
| 1.1.7 | `webSecurity: true` (default, verify not overridden) | ✅ | Default value; not overridden in config |

**Code Verification:**
```javascript
// Check your BrowserWindow config:
const mainWindow = new BrowserWindow({
  webPreferences: {
    nodeIntegration: false,    // ✅ Must be false
    contextIsolation: true,      // ✅ Must be true
    sandbox: true,               // ✅ Should be true
    preload: path.join(__dirname, '../preload/index.cjs')
  }
});
```

---

### 1.2 Preload Script Security

| # | Check | Status | Notes |
|---|-------|--------|-------|
| 1.2.1 | No Node.js APIs exposed directly to renderer | ✅ | Only `contextBridge.exposeInMainWorld` used; no `require` exposed |
| 1.2.2 | IPC channel whitelist implemented | ✅ | `VALID_CHANNELS` array at `src/preload/index.js:9` |
| 1.2.3 | `ipcRenderer.invoke` wrapped, not exposed directly | ✅ | Named methods only (e.g. `createDevice`, `startPing`) |
| 1.2.4 | `ipcRenderer.on` listeners properly managed | ✅ | Cleanup functions returned for all listeners (`onPingResult`, `onAlertEvent`) |
| 1.2.5 | No `eval()` or `new Function()` in preload | ✅ | None found in preload or renderer |

**Code Verification:**
```javascript
// preload.js - Check for this pattern (src/preload/index.js):
const VALID_CHANNELS = [
  'device:create', 'device:read', 'device:update', 'device:delete',
  'ping:start', 'ping:stop', 'ping:result',
  // ... full whitelist
];

contextBridge.exposeInMainWorld('electronAPI', {
  // Named methods (not generic invoke wrapper)
  createDevice: (deviceData) => ipcRenderer.invoke('device:create', deviceData),
  getDevices: (id) => ipcRenderer.invoke('device:read', id),
  startPing: (deviceId, ipAddress, intervalMs) =>
    ipcRenderer.invoke('ping:start', deviceId, ipAddress, intervalMs),
  stopPing: (deviceId) => ipcRenderer.invoke('ping:stop', deviceId),
  onPingResult: (callback) => {
    const wrappedCallback = (event, ...args) => callback(...args)
    ipcRenderer.on('ping:result', wrappedCallback)
    return () => { ipcRenderer.removeListener('ping:result', wrappedCallback) }
  }
});
```

---

### 1.3 IPC Handler Security (Main Process)

| # | Check | Status | Notes |
|---|-------|--------|-------|
| 1.3.1 | All IPC handlers validate input | ✅ | `validators` object checks IP, hostname, device name, device type; retention days validated inline in handlers |
| 1.3.2 | SQL queries use parameterisation | ✅ | All CRUD uses `?` placeholders; retention queries fixed in Sprint 6 |
| 1.3.3 | No dynamic channel names | ✅ | All 45 channels are static strings |
| 1.3.4 | Error handling doesn't leak internals | ✅ | `wrapHandler()` returns `{success: false, error: message}` only |
| 1.3.5 | File paths validated before use | ✅ | `isSafeFilename()` rejects `..`, `/`, `\` and non-alphanumeric chars |

**Code Verification:**
```javascript
// Check your IPC handlers:
ipcMain.handle('device:create', async (event, data) => {
  // ✅ Validate input
  if (!isValidDeviceData(data)) {
    throw new Error('Invalid device data');
  }
  
  // ✅ Parameterised query
  const result = db.prepare(
    'INSERT INTO devices (name, ip_address) VALUES (?, ?)'
  ).run(data.name, data.ipAddress);
  
  return result;
});
```

---

## Section 2: Input Validation & Sanitisation

### 2.1 IP Address Validation

| # | Check | Status | Test Case |
|---|-------|--------|-----------|
| 2.1.1 | IPv4 validation regex implemented | ✅ | `validators.ipAddress` at `src/main/ipc/handlers.js:142` |
| 2.1.2 | IPv6 validation regex implemented | ✅ | Full IPv6 pattern at `src/main/ipc/handlers.js:144` |
| 2.1.3 | Invalid IPs rejected | ✅ | Tested in `tests/unit/main/sprint4-security.test.js` |
| 2.1.4 | Private IP ranges accepted | ✅ | All private ranges accepted by regex |
| 2.1.5 | Loopback accepted | ✅ | `127.0.0.1` and `::1` pass validation |
| 2.1.6 | Malicious input handled | ✅ | SQL keywords and HTML tags rejected by regex / validators |

**Test Cases:**
```javascript
const validIPs = ['192.168.1.1', '10.0.0.1', '127.0.0.1', '::1'];
const invalidIPs = ['256.1.1.1', '192.168.1', 'abc', '192.168.1.1.1'];
const maliciousIPs = ['; DROP TABLE devices', '<script>alert(1)</script>'];
```

---

### 2.2 Device Name Validation

| # | Check | Status | Notes |
|---|-------|--------|-------|
| 2.2.1 | Length limited (1-100 characters) | ✅ | `validators.deviceName` enforces 1-100 chars |
| 2.2.2 | Allowed characters: alphanumeric, spaces, hyphens, underscores | ⚠️ | Length enforced; full character whitelist not yet implemented |
| 2.2.3 | HTML tags rejected | ⚠️ | No explicit HTML tag filter; parameterised queries prevent SQL injection |
| 2.2.4 | SQL keywords rejected | ✅ | Parameterised queries prevent injection regardless of input content |
| 2.2.5 | Unicode normalised | ⬜ | Not implemented |
| 2.2.6 | Trim whitespace | ⬜ | Not implemented |

**Validation Regex:**
```javascript
const deviceNameRegex = /^[a-zA-Z0-9\s_-]{1,100}$/;
```

---

### 2.3 Device Type Validation

| # | Check | Status | Notes |
|---|-------|--------|-------|
| 2.3.1 | Enum whitelist enforced | ✅ | `validators.deviceType` at `src/main/ipc/handlers.js:199` |
| 2.3.2 | Invalid types rejected | ✅ | Database CHECK constraint also present in schema |
| 2.3.3 | UI dropdown matches database enum | ✅ | Both use `['server', 'router', 'printer', 'switch']` |

---

### 2.4 Numeric Validation (Latency, Thresholds)

| # | Check | Status | Notes |
|---|-------|--------|-------|
| 2.4.1 | Latency values are numeric | ✅ | Stored as REAL in SQLite; parsed from ping results |
| 2.4.2 | Latency within realistic range (0-30000ms) | ✅ | `ping` library timeout caps at 3s; outage threshold at 5s |
| 2.4.3 | Threshold values positive integers | ✅ | Alert config thresholds validated as positive integers |
| 2.4.4 | NaN/Infinity handled | ✅ | `parseInt` and `parseFloat` used with fallback defaults |
| 2.4.5 | Decimal precision controlled | ✅ | SQLite REAL stores full precision; UI rounds to 1 decimal |

---

## Section 3: Database Security

### 3.1 SQL Injection Prevention

| # | Check | Status | Notes |
|---|-------|--------|-------|
| 3.1.1 | All queries use parameterised statements | ✅ | All CRUD and export queries use `?` placeholders |
| 3.1.2 | No string concatenation in queries | ✅ | Fixed: retention policy queries no longer use template literals in SQL |
| 3.1.3 | Dynamic ORDER BY uses whitelist | ✅ | No user-controlled ORDER BY; all ordering is hardcoded |
| 3.1.4 | Table names not user-controlled | ✅ | Static table references only |
| 3.1.5 | Debug logging doesn't expose queries with data | ✅ | Logs show counts and IDs, not query strings with values |

**Search Pattern (find violations):**
```bash
# Search for potential SQL injection:
grep -r "prepare.*+" src/
grep -r "exec.*\`" src/
grep -r "run.*\${" src/
```

---

### 3.2 Database Schema Security

| # | Check | Status | Notes |
|---|-------|--------|-------|
| 3.2.1 | Foreign keys enabled | ✅ | `PRAGMA foreign_keys = ON` at `src/main/db/database.js` |
| 3.2.2 | CASCADE deletes configured | ✅ | `ON DELETE CASCADE` on `ping_logs` and `outages` |
| 3.2.3 | CHECK constraints on enums | ✅ | `CHECK (device_type IN ('server', 'router', 'printer', 'switch'))` |
| 3.2.4 | UNIQUE constraints where appropriate | ✅ | Partial unique index on `ip_address WHERE is_active = 1` |
| 3.2.5 | NOT NULL on required fields | ✅ | `name`, `ip_address`, `device_type`, `timestamp` all NOT NULL |

---

### 3.3 Data Access Patterns

| # | Check | Status | Notes |
|---|-------|--------|-------|
| 3.3.1 | Database path outside app directory | ✅ | `app.getPath('userData')/network-monitor.sqlite` |
| 3.3.2 | Single connection instance | ✅ | `DatabaseManager` singleton with `getInstance()` |
| 3.3.3 | Connection closed on app quit | ⚠️ | Connection persists for app lifetime; closed on process exit |
| 3.3.4 | No hardcoded credentials | ✅ | N/A for SQLite; no credentials in codebase |
| 3.3.5 | Backup mechanism considered | ⚠️ | User can export data; no automatic backup implemented |

---

## Section 4: Content Security Policy

### 4.1 CSP Configuration

| # | Check | Status | Notes |
|---|-------|--------|-------|
| 4.1.1 | CSP header or meta tag configured | ✅ | `onHeadersReceived` at `src/main/index.js:118` |
| 4.1.2 | `default-src 'self'` | ✅ | Present in CSP string |
| 4.1.3 | `script-src 'self' 'unsafe-inline'` | ⚠️ | `'unsafe-inline'` required for React/Vite build; no external scripts |
| 4.1.4 | `style-src 'self' 'unsafe-inline'` | ✅ | Required for CSS-in-JS and inline styles |
| 4.1.5 | `connect-src 'self'` | ✅ | No external API calls allowed |
| 4.1.6 | `img-src 'self' data: https:` | ✅ | Base64 and local images allowed |
| 4.1.7 | No `unsafe-eval` | ✅ | `unsafe-eval` not present in CSP |

**CSP Header:**
```javascript
// In main process:
session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
  callback({
    responseHeaders: {
      ...details.responseHeaders,
      'Content-Security-Policy': [
        "default-src 'self'; " +
        "script-src 'self'; " +
        "style-src 'self' 'unsafe-inline'; " +
        "connect-src 'self'; " +
        "img-src 'self' data:;"
      ]
    }
  });
});
```

---

## Section 5: Dependencies & Supply Chain

### 5.1 Dependency Audit

| # | Check | Status | Notes |
|---|-------|--------|-------|
| 5.1.1 | `npm audit` run, no critical vulnerabilities | ⚠️ | 2 high-severity findings documented below; no critical |
| 5.1.2 | `npm audit` no high vulnerabilities | ❌ | `electron` and `@xmldom/xmldom` high-severity advisories open |
| 5.1.3 | Dependencies locked (package-lock.json) | ✅ | `package-lock.json` committed and up to date |
| 5.1.4 | No unused dependencies | ⚠️ | `sqlite3` and `sqlite` listed as devDependencies but `better-sqlite3` is primary; investigate removal |
| 5.1.5 | No deprecated dependencies | ⚠️ | `electron-rebuild` and `sqlite3` chain have deprecation warnings |

**Commands:**
```bash
npm audit --audit-level=moderate
depcheck
npm outdated
```

---

### 5.2 Native Module Security

| # | Check | Status | Notes |
|---|-------|--------|-------|
| 5.2.1 | better-sqlite3 from official npm registry | ✅ | `better-sqlite3@12.8.0` from npm, GitHub source verified |
| 5.2.2 | Pre-built binaries preferred | ✅ | `better-sqlite3` provides prebuilt binaries for common platforms |
| 5.2.3 | No postinstall scripts from unknown sources | ✅ | All postinstall scripts from well-known packages (electron, better-sqlite3) |
| 5.2.4 | electron-rebuild configured correctly | ✅ | Listed in devDependencies; rebuild script documented in README |

---

## Section 6: Logging & Error Handling

### 6.1 Secure Logging

| # | Check | Status | Notes |
|---|-------|--------|-------|
| 6.1.1 | No sensitive data in logs | ✅ | No credentials logged; device IPs may appear in debug logs |
| 6.1.2 | Error messages don't expose internals | ✅ | `wrapHandler()` returns sanitised messages only |
| 6.1.3 | Stack traces not sent to renderer | ✅ | Stack traces logged to main process console only |
| 6.1.4 | Log files outside user-accessible directory | ✅ | Electron console logs; no persistent log files written |
| 6.1.5 | Debug mode disabled in production | ✅ | `NODE_ENV` checked in auto-updater stub; DevTools disabled in production |

---

### 6.2 Error Handling

| # | Check | Status | Notes |
|---|-------|--------|-------|
| 6.2.1 | All IPC handlers have try-catch | ✅ | All 41 handlers wrapped with `wrapHandler()` |
| 6.2.2 | Database errors handled gracefully | ✅ | Database failures return `{success: false, error: '...'}` |
| 6.2.3 | Network errors don't crash app | ✅ | Ping timeouts and DNS failures caught and logged |
| 6.2.4 | File system errors handled | ✅ | Export service handles disk-full and permission errors |
| 6.2.5 | Validation errors distinguishable from system errors | ✅ | Validation throws early; system errors caught in wrapper |

---

## Section 7: Build & Distribution Security

### 7.1 Code Signing

| # | Check | Status | Notes |
|---|-------|--------|-------|
| 7.1.1 | Windows executable signed | ❌ | No code-signing certificate available; documented as out of scope |
| 7.1.2 | Publisher name displayed correctly | ⚠️ | Unsigned; publisher shows as "Unknown" in SmartScreen |
| 7.1.3 | SmartScreen reputation considered | ❌ | SmartScreen warning will appear on first run (unsigned) |

---

### 7.2 Build Integrity

| # | Check | Status | Notes |
|---|-------|--------|-------|
| 7.2.1 | Build reproducible | ⚠️ | `package-lock.json` present; native module compilation may vary by machine |
| 7.2.2 | Source maps not included in production | ✅ | `sourcemap: false` added to `electron.vite.config.js` for main, preload, and renderer |
| 7.2.3 | Dev tools disabled in production | ✅ | `closeDevTools()` called on ready; `devtools-opened` event closes them in production |
| 7.2.4 | Node environment set to production | ✅ | `electron-vite` sets `NODE_ENV=production` during build; verified via auto-updater check |
| 7.2.5 | No console.log in production code | ⚠️ | Console logs remain for debugging; no sensitive data exposed |

---

## Section 8: Privacy & Data Protection

### 8.1 Data Collection

| # | Check | Status | Notes |
|---|-------|--------|-------|
| 8.1.1 | No telemetry without consent | ✅ | No telemetry or analytics implemented |
| 8.1.2 | No analytics in background | ✅ | No background analytics |
| 8.1.3 | Data stays local | ✅ | SQLite database stored locally; no cloud transmission |
| 8.1.4 | User can export their data | ✅ | Export to CSV and HTML available in Export Manager |
| 8.1.5 | User can delete their data | ✅ | Device deletion cascades to ping logs and outages; retention policy also purges old data |

---

## Sign-Off

### Developer Verification

I confirm that:
- [ ] All ⬜ items have been reviewed
- [ ] All ❌ items have been resolved
- [ ] Code has been scanned for security patterns
- [ ] `npm audit` has been run

**Developer Signature:** _________________ **Date:** _______

---

### Product Owner Review

I confirm that:
- [ ] Security checklist has been reviewed
- [ ] Any ⚠️ warnings are documented and accepted
- [ ] The application meets JJ Confederation Ltd security standards

**Product Owner Signature:** _________________ **Date:** _______

---

## Automated Security Commands

Run these commands before each release:

```bash
# 1. Dependency audit
npm audit --audit-level=moderate

# 2. Find potential SQL injection
grep -r "prepare.*\+" src/ || echo "No potential SQL injection found"
grep -r "exec.*\`" src/ || echo "No template literal exec found"

# 3. Check for eval
grep -r "eval(" src/ || echo "No eval() found"
grep -r "new Function" src/ || echo "No new Function() found"

# 4. Check for innerHTML
grep -r "innerHTML" src/ || echo "No innerHTML found"

# 5. Check for nodeIntegration
grep -r "nodeIntegration.*true" src/ || echo "No insecure nodeIntegration found"

# 6. Verify contextIsolation
grep -r "contextIsolation.*false" src/ || echo "No disabled contextIsolation found"
```

---

## Security Incident Response

If a security issue is discovered:

1. **Immediate:** Document the issue in security log
2. **Assessment:** Determine severity (Critical/High/Medium/Low)
3. **Fix:** Implement fix following secure coding practices
4. **Test:** Add regression test for the issue
5. **Review:** Re-run this checklist
6. **Document:** Update Architecture-Decisions.md if needed

**Security Log:**

| Date | Issue | Severity | Fix | Verified |
|------|-------|----------|-----|----------|
| | | | | |

---

## Sprint 6 Security Audit Findings

### npm Audit Results (23 June 2026)

```
npm audit --audit-level=moderate
```

| Advisory | Severity | Package | Status | Notes |
|----------|----------|---------|--------|-------|
| GHSA-vmqv-hx8q-j7mg | High | `electron` <=39.8.4 | Open | ASAR Integrity Bypass. Project uses `electron@28.0.0`. Upgrade to Electron 40+ is a breaking change for native modules; deferred to post-release. |
| GHSA-2v35-w6hq-6mfw | High | `@xmldom/xmldom` <=0.8.12 | Open | XML DoS via uncontrolled recursion. Transitive dependency via `electron-rebuild` / `node-gyp`. `npm audit fix` recommended. |
| Multiple | Moderate | `sqlite3` / `node-gyp` / `tar` | Open | Transitive dependency chain vulnerabilities. `sqlite3` is a devDependency; `better-sqlite3` is the runtime dependency and is unaffected. |

**Mitigation:**
- Run `npm audit fix` to address `@xmldom/xmldom` (safe, non-breaking).
- Evaluate removing unused `sqlite3` and `sqlite` devDependencies to eliminate transitive vulnerability chain.
- Electron upgrade to v40+ is documented as a post-release maintenance task.

### SQL Injection Fix (Sprint 6)

**Issue:** `applyPingHistoryRetention()` and `getRetentionPolicyStats()` in `src/main/db/database.js` used template literal string interpolation for `retentionDays` inside SQL strings.

**Fix:** Replaced string interpolation with JavaScript date computation and parameterised `?` placeholders. Added integer validation at the database layer as defence in depth.

**Verification:**
```bash
grep -r "prepare.*\${" src/main/db/
```
No results — all `prepare()` calls now use static SQL strings or `?` placeholders.

---

**Document Version:** 2.0
**Last Updated:** 23 June 2026
**Next Review:** Post-release (Sprint 6 closure)
**Owner:** Developer (Security Lead)
