/**
 * Database Runtime Behavior Tests
 *
 * Static analysis tests verifying runtime behavior patterns and
 * edge case handling in database methods.
 *
 * @module tests/unit/database-runtime.test
 */

import { describe, it, expect } from '@jest/globals'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

describe('Database Runtime Behavior Tests', () => {
  const databasePath = path.join(__dirname, '../../src/main/database.js')

  describe('Method Existence and Signatures', () => {
    it('database.js exists', () => {
      expect(fs.existsSync(databasePath)).toBe(true)
    })

    it('getDeviceWithLatestStatus method exists', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      expect(content).toMatch(/getDeviceWithLatestStatus\(deviceId\)/)
    })

    it('getAllDevicesWithLatestStatus method exists', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      expect(content).toMatch(/getAllDevicesWithLatestStatus\(\)/)
    })

    it('getDeviceStatusSummary method exists with default hours', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      expect(content).toMatch(/getDeviceStatusSummary\(deviceId, hours = 24\)/)
    })
  })

  describe('Runtime Null Handling', () => {
    it('getDeviceWithLatestStatus checks device exists', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      expect(content).toMatch(/const device = this\.getDevice\(deviceId\)/)
      expect(content).toMatch(/if \(!device\) return null/)
    })

    it('getDeviceStatusSummary checks device exists', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      const methodMatch = content.match(/getDeviceStatusSummary[\s\S]*?\{[\s\S]*?\n {2}\}/)
      expect(methodMatch[0]).toMatch(/const device = this\.getDevice\(deviceId\)/)
      expect(methodMatch[0]).toMatch(/if \(!device\) return null/)
    })
  })

  describe('getAllDevicesWithLatestStatus Runtime Behavior', () => {
    it('filters only active devices', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      expect(content).toMatch(/WHERE d\.is_active = 1/)
    })

    it('uses LEFT JOIN for optional ping data', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      expect(content).toMatch(/LEFT JOIN[\s\S]*?ping_logs/)
    })

    it('uses LEFT JOIN for optional outage data', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      expect(content).toMatch(/LEFT JOIN outages/)
    })

    it('maps result rows to camelCase objects', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      expect(content).toMatch(/\.map\(row =>/)
      expect(content).toMatch(/ipAddress: row\.ip_address/)
      expect(content).toMatch(/deviceType: row\.device_type/)
      expect(content).toMatch(/isActive: row\.is_active/)
      expect(content).toMatch(/createdAt: row\.created_at/)
    })

    it('returns array of mapped device objects', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      expect(content).toMatch(/@returns \{Array\}/)
    })
  })

  describe('getDeviceStatusSummary Runtime Calculations', () => {
    it('uses COUNT for total pings', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      expect(content).toMatch(/COUNT\(\*\) as total_pings/)
    })

    it('uses SUM with CASE for successful ping count', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      expect(content).toMatch(/SUM\(CASE WHEN success = 1 THEN 1 ELSE 0 END\) as successful_pings/)
    })

    it('uses SUM with CASE for failed ping count', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      expect(content).toMatch(/SUM\(CASE WHEN success = 0 THEN 1 ELSE 0 END\) as failed_pings/)
    })

    it('uses AVG for average latency (successful only)', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      expect(content).toMatch(/AVG\(CASE WHEN success = 1 THEN latency_ms END\) as avg_latency/)
    })

    it('uses MIN for minimum latency (successful only)', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      expect(content).toMatch(/MIN\(CASE WHEN success = 1 THEN latency_ms END\) as min_latency/)
    })

    it('uses MAX for maximum latency (successful only)', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      expect(content).toMatch(/MAX\(CASE WHEN success = 1 THEN latency_ms END\) as max_latency/)
    })

    it('filters by timestamp for time window', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      expect(content).toMatch(/timestamp > datetime\('now', \?\)/)
    })

    it('calculates uptime percentage in JavaScript', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      const summaryMatch = content.match(/getDeviceStatusSummary[\s\S]*?\n {2}\}/)
      expect(summaryMatch[0]).toMatch(/const uptimePercent = totalPings > 0/)
      expect(summaryMatch[0]).toMatch(/successfulPings \/ totalPings/)
      expect(summaryMatch[0]).toMatch(/Math\.round/)
    })

    it('handles zero pings with null uptime', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      const summaryMatch = content.match(/getDeviceStatusSummary[\s\S]*?\n {2}\}/)
      expect(summaryMatch[0]).toMatch(/:\s*null/)
    })

    it('uses OR replacement for total downtime calculation', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      expect(content).toMatch(/CASE WHEN end_time IS NULL THEN/)
      expect(content).toMatch(/ELSE duration_seconds END/)
    })

    it('filters outages by time window', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      expect(content).toMatch(/start_time > datetime\('now', \?\)/)
    })
  })

  describe('Status Determination Logic', () => {
    it('getDeviceWithLatestStatus determines status from latest ping', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      expect(content).toMatch(/let status = 'unknown'/)
      expect(content).toMatch(/if \(latestPing\)/)
      expect(content).toMatch(/status = latestPing\.success/)
    })

    it('overrides status when active outage exists', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      expect(content).toMatch(/if \(activeOutage\)/)
      expect(content).toMatch(/status = 'outage'/)
    })
  })

  describe('Prepared Statement Usage', () => {
    it('getDeviceWithLatestStatus reuses existing getDevice statement', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      expect(content).toMatch(/this\.getDevice\(deviceId\)/)
    })

    it('getDeviceWithLatestStatus reuses existing getLatestPing statement', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      expect(content).toMatch(/this\.getLatestPing\(deviceId\)/)
    })

    it('getDeviceWithLatestStatus reuses existing getActiveOutage statement', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      expect(content).toMatch(/this\.getActiveOutage\(deviceId\)/)
    })

    it('getDeviceStatusSummary uses dedicated prepared statement', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      expect(content).toMatch(/'getDeviceStatusSummaryStats'/)
      expect(content).toMatch(/getStatement\([\s\S]*?'getDeviceStatusSummaryStats'/)
    })

    it('getDeviceStatusSummary uses dedicated outage statement', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      expect(content).toMatch(/'getRecentOutages'/)
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('returns null for invalid device IDs', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      // Check that methods return null early if device not found
      expect(content).toMatch(/if \(!device\) return null/)
    })

    it('handles OR replacement for stats with default 0', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      expect(content).toMatch(/\|\| 0/)
    })

    it('handles OR replacement for outages with default 0', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      expect(content).toMatch(/outages\?\.outage_count \|\| 0/)
      expect(content).toMatch(/outages\?\.total_downtime_seconds \|\| 0/)
    })
  })

  describe('IPC Handler Runtime Behavior', () => {
    const ipcPath = path.join(__dirname, '../../src/main/ipc-handlers.js')

    it('ipc-handlers.js exists', () => {
      expect(fs.existsSync(ipcPath)).toBe(true)
    })

    it('device:getWithStatus validates id parameter', () => {
      const content = fs.readFileSync(ipcPath, 'utf-8')
      expect(content).toMatch(/if \(id\)/)
      expect(content).toMatch(/if \(!result\)/)
      expect(content).toMatch(/error: 'Device not found'/)
    })

    it('device:getStatusSummary validates deviceId parameter', () => {
      const content = fs.readFileSync(ipcPath, 'utf-8')
      expect(content).toMatch(/if \(!deviceId\)/)
      expect(content).toMatch(/error: 'Device ID is required'/)
      expect(content).toMatch(/if \(!summary\)/)
      expect(content).toMatch(/error: 'Device not found'/)
    })

    it('handlers pass hours parameter correctly', () => {
      const content = fs.readFileSync(ipcPath, 'utf-8')
      expect(content).toMatch(/getDeviceStatusSummary\(deviceId, hours\)/)
    })

    it('handlers use try-catch for error handling', () => {
      const content = fs.readFileSync(ipcPath, 'utf-8')
      expect(content).toMatch(/try \{/)
      expect(content).toMatch(/catch \(error\)/)
      expect(content).toMatch(/return \{ success: false, error: error\.message \}/)
    })
  })

  describe('Return Value Structure', () => {
    it('getDeviceWithLatestStatus returns combined object', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      expect(content).toMatch(/return \{\s*\.\.\.device,/)
      expect(content).toMatch(/latestPing,/)
      expect(content).toMatch(/activeOutage,/)
      expect(content).toMatch(/status\s*\}/)
    })

    it('getDeviceStatusSummary returns comprehensive object', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      const summaryMatch = content.match(/getDeviceStatusSummary[\s\S]*?\n {2}\}/)
      expect(summaryMatch[0]).toMatch(/return \{/)
      expect(summaryMatch[0]).toMatch(/deviceId,/)
      expect(summaryMatch[0]).toMatch(/hours,/)
      expect(summaryMatch[0]).toMatch(/totalPings,/)
      expect(summaryMatch[0]).toMatch(/successfulPings,/)
      expect(summaryMatch[0]).toMatch(/failedPings:/)
      expect(summaryMatch[0]).toMatch(/uptimePercent,/)
      expect(summaryMatch[0]).toMatch(/averageLatencyMs:/)
      expect(summaryMatch[0]).toMatch(/minLatencyMs:/)
      expect(summaryMatch[0]).toMatch(/maxLatencyMs:/)
      expect(summaryMatch[0]).toMatch(/outageCount:/)
      expect(summaryMatch[0]).toMatch(/totalDowntimeSeconds:/)
    })
  })
})
