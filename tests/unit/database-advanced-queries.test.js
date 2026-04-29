/**
 * Database Advanced Queries Tests
 *
 * Static analysis tests for new database methods added in Sprint 2 Week 2.
 * @module tests/unit/database-advanced-queries.test
 */

import { describe, it, expect } from '@jest/globals'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

describe('Database Advanced Queries', () => {
  const databasePath = path.join(__dirname, '../../src/main/database.js')

  describe('File Existence', () => {
    it('database.js exists', () => {
      expect(fs.existsSync(databasePath)).toBe(true)
    })
  })

  describe('getDeviceWithLatestStatus Method', () => {
    it('method exists in database.js', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      expect(content).toContain('getDeviceWithLatestStatus(deviceId)')
    })

    it('returns device with latest ping and active outage', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      expect(content).toMatch(/@returns.*Device with latest ping and active outage/)
    })

    it('returns null for non-existent device', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      expect(content).toContain("if (!device) return null")
    })

    it('calculates status based on ping and outage', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      expect(content).toMatch(/let status = 'unknown'/)
      expect(content).toMatch(/status = latestPing.success/)
      expect(content).toMatch(/if \(activeOutage\)/)
      expect(content).toMatch(/status = 'outage'/)
    })

    it('spreads device properties with status info', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      expect(content).toMatch(/return \{\s*\.\.\.device,/)
      expect(content).toMatch(/latestPing,/)
      expect(content).toMatch(/activeOutage,/)
      expect(content).toMatch(/status\s*\}/)
    })
  })

  describe('getAllDevicesWithLatestStatus Method', () => {
    it('method exists in database.js', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      expect(content).toContain('getAllDevicesWithLatestStatus()')
    })

    it('returns array of devices with status', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      expect(content).toMatch(/@returns.*Array.*devices with latest ping/)
    })

    it('filters only active devices', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      expect(content).toMatch(/WHERE d.is_active = 1/)
    })

    it('uses LEFT JOIN to get latest ping per device', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      expect(content).toMatch(/LEFT JOIN/)
      expect(content).toMatch(/MAX\(timestamp\)/)
      expect(content).toMatch(/GROUP BY device_id/)
    })

    it('joins active outages', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      expect(content).toMatch(/LEFT JOIN outages o/)
      expect(content).toMatch(/o.end_time IS NULL/)
    })

    it('maps results with camelCase fields', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      expect(content).toMatch(/ipAddress: row.ip_address/)
      expect(content).toMatch(/deviceType: row.device_type/)
      expect(content).toMatch(/isActive: row.is_active/)
      expect(content).toMatch(/createdAt: row.created_at/)
    })

    it('determines status for each device', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      expect(content).toMatch(/status = row.latest_success/)
      expect(content).toMatch(/\? 'online' : 'offline'/)
    })
  })

  describe('IPC Handler Integration', () => {
    const ipcPath = path.join(__dirname, '../../src/main/ipc-handlers.js')

    it('ipc-handlers.js exists', () => {
      expect(fs.existsSync(ipcPath)).toBe(true)
    })

    it('has device:getWithStatus handler', () => {
      const content = fs.readFileSync(ipcPath, 'utf-8')
      expect(content).toContain("ipcMain.handle('device:getWithStatus'")
    })

    it('handler supports single device lookup', () => {
      const content = fs.readFileSync(ipcPath, 'utf-8')
      expect(content).toMatch(/if \(id\)/)
      expect(content).toMatch(/getDeviceWithLatestStatus\(id\)/)
    })

    it('handler supports all devices lookup', () => {
      const content = fs.readFileSync(ipcPath, 'utf-8')
      expect(content).toMatch(/getAllDevicesWithLatestStatus\(\)/)
    })

    it('transforms device fields to camelCase', () => {
      const content = fs.readFileSync(ipcPath, 'utf-8')
      expect(content).toMatch(/\.\.\.transformDevice\(result\)/)
      expect(content).toMatch(/\.\.\.transformDevice\(device\)/)
    })

    it('preserves status objects in response', () => {
      const content = fs.readFileSync(ipcPath, 'utf-8')
      expect(content).toMatch(/latestPing: result\.latestPing/)
      expect(content).toMatch(/activeOutage: result\.activeOutage/)
      expect(content).toMatch(/status: result\.status/)
    })
  })

  describe('Preload Script Exposure', () => {
    const preloadPath = path.join(__dirname, '../../src/preload/index.js')

    it('preload script exists', () => {
      expect(fs.existsSync(preloadPath)).toBe(true)
    })

    it('has device:getWithStatus in valid channels', () => {
      const content = fs.readFileSync(preloadPath, 'utf-8')
      expect(content).toContain("'device:getWithStatus'")
    })

    it('exposes getDeviceWithStatus to renderer', () => {
      const content = fs.readFileSync(preloadPath, 'utf-8')
      expect(content).toContain('getDeviceWithStatus: (id) => ipcRenderer.invoke')
    })
  })

  describe('Query Performance', () => {
    it('uses prepared statement for batch query', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      expect(content).toMatch(/getStatement\(\s*'getAllDevicesWithLatestStatus'/)
    })
  })

  describe('getDeviceStatusSummary Method', () => {
    it('method exists in database.js', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      expect(content).toContain('getDeviceStatusSummary(deviceId, hours = 24)')
    })

    it('returns null for non-existent device', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      expect(content).toMatch(/if \(!device\) return null/)
    })

    it('calculates total pings in time window', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      expect(content).toMatch(/COUNT\(\*\) as total_pings/)
    })

    it('calculates successful and failed ping counts', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      expect(content).toMatch(/SUM\(CASE WHEN success = 1 THEN 1 ELSE 0 END\) as successful_pings/)
      expect(content).toMatch(/SUM\(CASE WHEN success = 0 THEN 1 ELSE 0 END\) as failed_pings/)
    })

    it('calculates average, min, max latency for successful pings', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      expect(content).toMatch(/AVG\(CASE WHEN success = 1 THEN latency_ms END\) as avg_latency/)
      expect(content).toMatch(/MIN\(CASE WHEN success = 1 THEN latency_ms END\) as min_latency/)
      expect(content).toMatch(/MAX\(CASE WHEN success = 1 THEN latency_ms END\) as max_latency/)
    })

    it('filters pings by time window', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      expect(content).toMatch(/timestamp > datetime\('now', \?\)/)
    })

    it('counts outages in time window', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      expect(content).toMatch(/COUNT\(\*\) as outage_count/)
      expect(content).toMatch(/FROM outages/)
      expect(content).toMatch(/start_time > datetime\('now', \?\)/)
    })

    it('calculates total downtime including ongoing outages', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      expect(content).toMatch(/CASE WHEN end_time IS NULL THEN/)
      expect(content).toMatch(/julianday\('now'\) - julianday\(start_time\)/)
      expect(content).toMatch(/ELSE duration_seconds END\) as total_downtime_seconds/)
    })

    it('calculates uptime percentage', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      expect(content).toMatch(/const uptimePercent = totalPings > 0/)
      expect(content).toMatch(/successfulPings \/ totalPings/)
    })

    it('returns comprehensive summary object', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      expect(content).toMatch(/return \{\s*deviceId,/)
      expect(content).toMatch(/totalPings,/)
      expect(content).toMatch(/successfulPings,/)
      expect(content).toMatch(/uptimePercent,/)
      expect(content).toMatch(/averageLatencyMs:/)
      expect(content).toMatch(/outageCount:/)
      expect(content).toMatch(/totalDowntimeSeconds:/)
    })

    it('handles null values when no ping data exists', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      expect(content).toMatch(/uptimePercent = totalPings > 0/)
      expect(content).toMatch(/:\s*null/)
    })
  })

  describe('IPC Handler: device:getStatusSummary', () => {
    const ipcPath = path.join(__dirname, '../../src/main/ipc-handlers.js')

    it('handler exists', () => {
      const content = fs.readFileSync(ipcPath, 'utf-8')
      expect(content).toContain("ipcMain.handle('device:getStatusSummary'")
    })

    it('validates deviceId parameter', () => {
      const content = fs.readFileSync(ipcPath, 'utf-8')
      expect(content).toMatch(/if \(!deviceId\)/)
      expect(content).toMatch(/error: 'Device ID is required'/)
    })

    it('returns error for non-existent device', () => {
      const content = fs.readFileSync(ipcPath, 'utf-8')
      expect(content).toMatch(/if \(!summary\)/)
      expect(content).toMatch(/error: 'Device not found'/)
    })

    it('passes hours parameter to database method', () => {
      const content = fs.readFileSync(ipcPath, 'utf-8')
      expect(content).toMatch(/getDeviceStatusSummary\(deviceId, hours\)/)
    })
  })

  describe('Preload: getDeviceStatusSummary', () => {
    const preloadPath = path.join(__dirname, '../../src/preload/index.js')

    it('exposed to renderer', () => {
      const content = fs.readFileSync(preloadPath, 'utf-8')
      expect(content).toContain('getDeviceStatusSummary: (id, hours) => ipcRenderer.invoke')
    })

    it('channel is whitelisted', () => {
      const content = fs.readFileSync(preloadPath, 'utf-8')
      expect(content).toContain("'device:getStatusSummary'")
    })
  })
})
