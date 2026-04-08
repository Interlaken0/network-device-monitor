# Testing Guide

This folder contains all tests for the AMF Network Device Monitor application.

## Test Structure

```
tests/
├── unit/                    # Unit tests for individual functions
│   ├── validators.test.js   # Input validation (IP, name, device type)
│   └── database.test.js     # Database operations
├── integration/             # Integration tests
│   └── ipc-handlers.integration.test.js  # IPC handler logic
└── mocks/                   # Mock implementations
    └── electron.js          # Electron API mocks
```

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Unit Tests Only
```bash
npm run test:unit
```

### Run Integration Tests Only
```bash
npm run test:integration
```

### Run Tests with Coverage Report
```bash
npm run test:coverage
```

## Test Summary

| Test Suite | Tests | Purpose |
|------------|-------|---------|
| Validators | 48 | IP address (IPv4/IPv6), device name, device type validation |
| Database | 11 | Device CRUD, ping logging, outage tracking |
| IPC Handlers | 6 | Handler logic for device creation, updates, validation flows |

**Total: 65 tests**

## What Each Test Covers

### Validators (`unit/validators.test.js`)
- **IP Validation**: IPv4 format, IPv6 format, invalid rejection
- **Device Name**: Length (1-100 chars), empty/null/undefined rejection
- **Device Type**: Valid types (server, router, printer, switch), case sensitivity

### Database (`unit/database.test.js`)
- **Device CRUD**: Create, read, update, soft delete, duplicate IP rejection
- **Ping Logs**: Record success/failure, calculate averages
- **Outages**: Start, resolve, find active outages
- **Schema**: Column validation, constraints, indexes

### IPC Handlers (`integration/ipc-handlers.integration.test.js`)
- Device creation flow validation
- Device update flow validation
- Error message formatting

## Native Module Rebuild

If `better-sqlite3` fails to load, rebuild native modules:

```bash
npx electron-rebuild
```

## Troubleshooting

### "Cannot find module" errors
```bash
npm install
```

### Native compilation errors
Install Visual Studio Build Tools with "Desktop development with C++" workload, then:
```bash
npx electron-rebuild -f -w better-sqlite3
```

## Writing New Tests

Tests use Jest with ES modules. Basic structure:

```javascript
describe('Feature Name', () => {
  test('should do something', () => {
    expect(actual).toBe(expected)
  })
})
```

See existing tests in `unit/` and `integration/` folders for examples.
