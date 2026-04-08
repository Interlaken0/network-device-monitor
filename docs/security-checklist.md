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
| 1.1.1 | `nodeIntegration: false` set in all windows | ⬜ | Critical - prevents Node.js access in renderer |
| 1.1.2 | `contextIsolation: true` set in all windows | ⬜ | Critical - isolates preload from renderer |
| 1.1.3 | `sandbox: true` enabled | ⬜ | Recommended - restricts renderer capabilities |
| 1.1.4 | `allowRunningInsecureContent: false` | ⬜ | Prevents mixed content |
| 1.1.5 | `experimentalFeatures: false` | ⬜ | Reduces attack surface |
| 1.1.6 | `enableRemoteModule: false` (or not used) | ⬜ | Remote module is deprecated |
| 1.1.7 | `webSecurity: true` (default, verify not overridden) | ⬜ | Enforces same-origin policy |

**Code Verification:**
```javascript
// Check your BrowserWindow config:
const mainWindow = new BrowserWindow({
  webPreferences: {
    nodeIntegration: false,    // ✅ Must be false
    contextIsolation: true,      // ✅ Must be true
    sandbox: true,               // ✅ Should be true
    preload: path.join(__dirname, 'preload.js')
  }
});
```

---

### 1.2 Preload Script Security

| # | Check | Status | Notes |
|---|-------|--------|-------|
| 1.2.1 | No Node.js APIs exposed directly to renderer | ⬜ | Use contextBridge only |
| 1.2.2 | IPC channel whitelist implemented | ⬜ | Validate all channels |
| 1.2.3 | `ipcRenderer.invoke` wrapped, not exposed directly | ⬜ | Prevents arbitrary IPC |
| 1.2.4 | `ipcRenderer.on` listeners properly managed | ⬜ | Cleanup on window close |
| 1.2.5 | No `eval()` or `new Function()` in preload | ⬜ | Code injection risk |

**Code Verification:**
```javascript
// preload.js - Check for this pattern:
const VALID_CHANNELS = ['device:create', 'device:read', 'ping:start'];

contextBridge.exposeInMainWorld('electronAPI', {
  invoke: (channel, ...args) => {
    if (!VALID_CHANNELS.includes(channel)) {
      throw new Error(`Invalid channel: ${channel}`);
    }
    return ipcRenderer.invoke(channel, ...args);
  }
});
```

---

### 1.3 IPC Handler Security (Main Process)

| # | Check | Status | Notes |
|---|-------|--------|-------|
| 1.3.1 | All IPC handlers validate input | ⬜ | Never trust renderer data |
| 1.3.2 | SQL queries use parameterisation | ⬜ | Prevents SQL injection |
| 1.3.3 | No dynamic channel names | ⬜ | Static channels only |
| 1.3.4 | Error handling doesn't leak internals | ⬜ | Sanitise error messages |
| 1.3.5 | File paths validated before use | ⬜ | Path traversal prevention |

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
| 2.1.1 | IPv4 validation regex implemented | ⬜ | `192.168.1.1` |
| 2.1.2 | IPv6 validation regex implemented | ⬜ | `2001:0db8::1` |
| 2.1.3 | Invalid IPs rejected | ⬜ | `256.1.1.1`, `abc`, `192.168.1` |
| 2.1.4 | Private IP ranges accepted | ⬜ | `10.x.x.x`, `172.16-31.x.x`, `192.168.x.x` |
| 2.1.5 | Loopback accepted | ⬜ | `127.0.0.1`, `::1` |
| 2.1.6 | Malicious input handled | ⬜ | `; DROP TABLE`, `<script>` |

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
| 2.2.1 | Length limited (1-100 characters) | ⬜ | Database constraint + UI |
| 2.2.2 | Allowed characters: alphanumeric, spaces, hyphens, underscores | ⬜ | Whitelist approach |
| 2.2.3 | HTML tags rejected | ⬜ | XSS prevention |
| 2.2.4 | SQL keywords rejected | ⬜ | DROP, DELETE, INSERT |
| 2.2.5 | Unicode normalised | ⬜ | NFC form |
| 2.2.6 | Trim whitespace | ⬜ | Leading/trailing removed |

**Validation Regex:**
```javascript
const deviceNameRegex = /^[a-zA-Z0-9\s_-]{1,100}$/;
```

---

### 2.3 Device Type Validation

| # | Check | Status | Notes |
|---|-------|--------|-------|
| 2.3.1 | Enum whitelist enforced | ⬜ | server, router, printer, switch |
| 2.3.2 | Invalid types rejected | ⬜ | Database CHECK constraint |
| 2.3.3 | UI dropdown matches database enum | ⬜ | Synchronised values |

---

### 2.4 Numeric Validation (Latency, Thresholds)

| # | Check | Status | Notes |
|---|-------|--------|-------|
| 2.4.1 | Latency values are numeric | ⬜ | Type checking |
| 2.4.2 | Latency within realistic range (0-30000ms) | ⬜ | Business rule |
| 2.4.3 | Threshold values positive integers | ⬜ | 1-10 for consecutive failures |
| 2.4.4 | NaN/Infinity handled | ⬜ | Edge cases |
| 2.4.5 | Decimal precision controlled | ⬜ | Max 2 decimal places |

---

## Section 3: Database Security

### 3.1 SQL Injection Prevention

| # | Check | Status | Notes |
|---|-------|--------|-------|
| 3.1.1 | All queries use parameterised statements | ⬜ | `?` placeholders |
| 3.1.2 | No string concatenation in queries | ⬜ | Check all `.prepare()` calls |
| 3.1.3 | Dynamic ORDER BY uses whitelist | ⬜ | No user-controlled column names |
| 3.1.4 | Table names not user-controlled | ⬜ | Static table references |
| 3.1.5 | Debug logging doesn't expose queries with data | ⬜ | Sanitise logs |

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
| 3.2.1 | Foreign keys enabled | ⬜ | `PRAGMA foreign_keys = ON` |
| 3.2.2 | CASCADE deletes configured | ⬜ | Orphan prevention |
| 3.2.3 | CHECK constraints on enums | ⬜ | Device type validation |
| 3.2.4 | UNIQUE constraints where appropriate | ⬜ | IP address uniqueness |
| 3.2.5 | NOT NULL on required fields | ⬜ | Data integrity |

---

### 3.3 Data Access Patterns

| # | Check | Status | Notes |
|---|-------|--------|-------|
| 3.3.1 | Database path outside app directory | ⬜ | Use `app.getPath('userData')` |
| 3.3.2 | Single connection instance | ⬜ | Singleton pattern |
| 3.3.3 | Connection closed on app quit | ⬜ | Proper cleanup |
| 3.3.4 | No hardcoded credentials | ⬜ | N/A for SQLite but verify |
| 3.3.5 | Backup mechanism considered | ⬜ | Database backup strategy |

---

## Section 4: Content Security Policy

### 4.1 CSP Configuration

| # | Check | Status | Notes |
|---|-------|--------|-------|
| 4.1.1 | CSP header or meta tag configured | ⬜ | Define policy |
| 4.1.2 | `default-src 'self'` | ⬜ | Base restriction |
| 4.1.3 | `script-src 'self'` (no 'unsafe-inline') | ⬜ | Inline scripts blocked |
| 4.1.4 | `style-src 'self' 'unsafe-inline'` | ⬜ | If CSS-in-JS used |
| 4.1.5 | `connect-src 'self'` | ⬜ | No external APIs |
| 4.1.6 | `img-src 'self' data:` | ⬜ | Base64 images allowed |
| 4.1.7 | No `unsafe-eval` | ⬜ | Prevents eval() |

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
| 5.1.1 | `npm audit` run, no critical vulnerabilities | ⬜ | Fix or document |
| 5.1.2 | `npm audit` no high vulnerabilities | ⬜ | Address before release |
| 5.1.3 | Dependencies locked (package-lock.json) | ⬜ | Reproducible builds |
| 5.1.4 | No unused dependencies | ⬜ | `depcheck` run |
| 5.1.5 | No deprecated dependencies | ⬜ | Check npm warnings |

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
| 5.2.1 | better-sqlite3 from official npm registry | ⬜ | Verify source |
| 5.2.2 | Pre-built binaries preferred | ⬜ | Faster, consistent |
| 5.2.3 | No postinstall scripts from unknown sources | ⬜ | Check package.json |
| 5.2.4 | electron-rebuild configured correctly | ⬜ | For native modules |

---

## Section 6: Logging & Error Handling

### 6.1 Secure Logging

| # | Check | Status | Notes |
|---|-------|--------|-------|
| 6.1.1 | No sensitive data in logs | ⬜ | No passwords, IPs logged sparingly |
| 6.1.2 | Error messages don't expose internals | ⬜ | Generic user messages |
| 6.1.3 | Stack traces not sent to renderer | ⬜ | Main process only |
| 6.1.4 | Log files outside user-accessible directory | ⬜ | Or rotated/capped |
| 6.1.5 | Debug mode disabled in production | ⬜ | `NODE_ENV` check |

---

### 6.2 Error Handling

| # | Check | Status | Notes |
|---|-------|--------|-------|
| 6.2.1 | All IPC handlers have try-catch | ⬜ | No unhandled rejections |
| 6.2.2 | Database errors handled gracefully | ⬜ | User-friendly messages |
| 6.2.3 | Network errors don't crash app | ⬜ | Ping failures handled |
| 6.2.4 | File system errors handled | ⬜ | Permissions, disk full |
| 6.2.5 | Validation errors distinguishable from system errors | ⬜ | Different error types |

---

## Section 7: Build & Distribution Security

### 7.1 Code Signing

| # | Check | Status | Notes |
|---|-------|--------|-------|
| 7.1.1 | Windows executable signed | ⬜ | Certificate obtained |
| 7.1.2 | Publisher name displayed correctly | ⬜ | "JJ Confederation Ltd" |
| 7.1.3 | SmartScreen reputation considered | ⬜ | EV cert if possible |

---

### 7.2 Build Integrity

| # | Check | Status | Notes |
|---|-------|--------|-------|
| 7.2.1 | Build reproducible | ⬜ | Same output from same input |
| 7.2.2 | Source maps not included in production | ⬜ | Reduce bundle, hide code |
| 7.2.3 | Dev tools disabled in production | ⬜ | `devTools: false` |
| 7.2.4 | Node environment set to production | ⬜ | `NODE_ENV=production` |
| 7.2.5 | No console.log in production code | ⬜ | Use proper logger |

---

## Section 8: Privacy & Data Protection

### 8.1 Data Collection

| # | Check | Status | Notes |
|---|-------|--------|-------|
| 8.1.1 | No telemetry without consent | ⬜ | Opt-in only |
| 8.1.2 | No analytics in background | ⬜ | If used, documented |
| 8.1.3 | Data stays local | ⬜ | No cloud transmission |
| 8.1.4 | User can export their data | ⬜ | Portability |
| 8.1.5 | User can delete their data | ⬜ | "Clear all" feature |

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

**Document Version:** 1.0  
**Last Updated:** April 2026  
**Next Review:** End of Sprint 1  
**Owner:** Developer (Security Lead)
