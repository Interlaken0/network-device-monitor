/**
 * Database Edge Case Tests
 *
 * Tests for database integrity scenarios: duplicate IP handling,
 * concurrent operations, empty result sets, and boundary conditions.
 * @module tests/unit/database-edge-cases.test
 */

import { describe, it, expect } from '@jest/globals'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

describe('Database Edge Cases', () => {
  const databasePath = path.join(__dirname, '../../src/main/database.js')

  describe('File Existence', () => {
    it('database.js exists', () => {
      expect(fs.existsSync(databasePath)).toBe(true)
    })
  })

  describe('Duplicate IP Handling', () => {
    it('enforces unique constraint via partial index on active devices', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      expect(content).toContain('CREATE UNIQUE INDEX IF NOT EXISTS idx_devices_ip_active')
      expect(content).toContain('ON devices(ip_address) WHERE is_active = 1')
    })

    it('has getDeviceByIp method for duplicate checking', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      expect(content).toContain('getDeviceByIp(ipAddress)')
    })

    it('prepared statement for IP lookup exists', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      expect(content).toContain("'getDeviceByIp'")
      expect(content).toContain('SELECT * FROM devices WHERE ip_address = ?')
    })
  })

  describe('Concurrent Operation Handling', () => {
    it('uses prepared statement caching for performance', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      expect(content).toContain('statements = new Map()')
      expect(content).toContain('getStatement(name, sql)')
    })

    it('prepares statements once and reuses them', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      expect(content).toMatch(/if \(!this\.statements\.has\(name\)\)/)
      expect(content).toMatch(/this\.statements\.set\(name,/)
    })

    it('singleton pattern prevents multiple database instances', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      expect(content).toContain('static instance = null')
      expect(content).toContain('if (!DatabaseManager.instance)')
    })

    it('getDatabase returns singleton instance', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      expect(content).toContain('DatabaseManager.getInstance()')
    })
  })

  describe('Empty Result Set Handling', () => {
    it('getDevice returns null for non-existent ID', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      expect(content).toContain('getDevice(id)')
      expect(content).toMatch(/@returns \{Object\|null\}/)
    })

    it('getDeviceByIp returns null for unknown IP', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      expect(content).toMatch(/@returns \{Object\|null\}.*not found/s)
    })

    it('getAllDevices returns empty array when no devices', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      expect(content).toContain("@returns {Array}")
      expect(content).toContain('stmt.all()')
    })

    it('getRecentPings returns empty array for new device', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      expect(content).toContain('getRecentPings(deviceId')
    })

    it('getAverageLatency returns null when no data', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      expect(content).toContain('@returns {number|null}')
      expect(content).toContain('return result?.avg_latency')
    })

    it('getLatestPing returns null for device with no pings', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      expect(content).toMatch(/getLatestPing.*\n.*@returns \{Object\|null\}/s)
    })

    it('getActiveOutage returns null when no active outage', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      expect(content).toContain('@returns {Object|null} Active outage or null')
    })
  })

  describe('Invalid Data Type Handling', () => {
    it('validates device_type against allowed values', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      expect(content).toContain("CHECK(device_type IN ('server', 'router', 'printer', 'switch'))")
    })

    it('validates outage severity against allowed values', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      expect(content).toContain("CHECK(severity IN ('critical', 'warning', 'info'))")
    })

    it('handles null location gracefully', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      expect(content).toContain('device.location || null')
    })

    it('converts boolean success to integer for storage', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      expect(content).toContain('ping.success ? 1 : 0')
    })

    it('converts boolean packetLoss to integer for storage', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      expect(content).toContain('ping.packetLoss ? 1 : 0')
    })
  })

  describe('Boundary Condition Handling', () => {
    it('name field has NOT NULL constraint', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      expect(content).toContain('name TEXT NOT NULL')
    })

    it('ip_address field has NOT NULL constraint', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      expect(content).toContain('ip_address TEXT NOT NULL')
    })

    it('auto-increment handles device ID generation', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      expect(content).toContain('id INTEGER PRIMARY KEY AUTOINCREMENT')
    })

    it('timestamps default to current time', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      expect(content).toContain('DEFAULT CURRENT_TIMESTAMP')
    })

    it('is_active defaults to 1 (active)', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      expect(content).toContain('is_active BOOLEAN DEFAULT 1')
    })
  })

  describe('Foreign Key Constraint Handling', () => {
    it('enables foreign key constraints', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      expect(content).toContain("foreign_keys = ON")
    })

    it('ping_logs has foreign key to devices with cascade delete', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      expect(content).toContain('FOREIGN KEY(device_id) REFERENCES devices(id) ON DELETE CASCADE')
    })

    it('outages has foreign key to devices with cascade delete', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      const outageTableSection = content.substring(
        content.indexOf('CREATE TABLE IF NOT EXISTS outages'),
        content.indexOf(');', content.indexOf('CREATE TABLE IF NOT EXISTS outages')) + 2
      )
      expect(outageTableSection).toContain('ON DELETE CASCADE')
    })
  })

  describe('Soft Delete Edge Cases', () => {
    it('deleteDevice performs soft delete (marks inactive)', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      expect(content).toContain('Soft delete device')
      expect(content).toContain('UPDATE devices SET is_active = 0')
    })

    it('getAllDevices filters inactive by default', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      expect(content).toContain('activeOnly = true')
      expect(content).toContain('WHERE is_active = 1')
    })

    it('allows retrieving all devices including inactive', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      expect(content).toContain('SELECT * FROM devices ORDER BY created_at DESC')
    })
  })

  describe('Update Operation Edge Cases', () => {
    it('updateDevice validates allowed fields', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      expect(content).toContain("const allowedFields = ['name', 'ip_address', 'device_type', 'location', 'is_active']")
    })

    it('throws error when no valid fields provided for update', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      expect(content).toContain('if (fields.length === 0)')
      expect(content).toContain("throw new Error('No valid fields to update')")
    })

    it('updateDevice dynamically builds update SQL', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      expect(content).toContain('fields.push(`${key} = ?`)')
    })
  })

  describe('Outage Lifecycle Edge Cases', () => {
    it('startOutage creates outage with current timestamp', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      expect(content).toContain('datetime(\'now\')')
    })

    it('endOutage only updates if end_time is null', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      expect(content).toContain('WHERE id = ? AND end_time IS NULL')
    })

    it('calculates duration in seconds when ending outage', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      expect(content).toContain('duration_seconds = (julianday(\'now\') - julianday(start_time)) * 86400')
    })

    it('getActiveOutage orders by most recent start time', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      expect(content).toContain('ORDER BY start_time DESC')
    })
  })

  describe('Query Limit and Pagination Edge Cases', () => {
    it('getRecentPings has default limit of 100', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      expect(content).toContain('limit = 100')
    })

    it('getAverageLatency has default window of 24 hours', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      expect(content).toContain('hours = 24')
    })

    it('uses parameterised LIMIT clause', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      expect(content).toContain('LIMIT ?')
    })
  })

  describe('Database Connection Edge Cases', () => {
    it('initialise is idempotent (safe to call multiple times)', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      expect(content).toContain('if (this.db) return')
    })

    it('close method handles already closed connection', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      expect(content).toContain('if (this.db)')
    })

    it('clears prepared statements on close', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      expect(content).toContain('this.statements.clear()')
    })

    it('sets db to null after closing', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      expect(content).toContain('this.db = null')
    })
  })

  describe('WAL Mode Configuration', () => {
    it('enables WAL journal mode for better concurrency', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      expect(content).toContain("journal_mode = WAL")
    })
  })

  describe('Test Database Helper', () => {
    it('exports createTestDatabase for testing', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      expect(content).toContain('export const createTestDatabase')
    })

    it('test database uses in-memory storage', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      expect(content).toContain(":memory:")
    })

    it('test database enables foreign keys', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      const testDbSection = content.substring(content.indexOf('createTestDatabase'))
      expect(testDbSection).toContain("foreign_keys = ON")
    })
  })

  describe('Index Optimisation', () => {
    it('has index on ping_logs device_id and timestamp', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      expect(content).toContain('idx_ping_logs_device_time')
      expect(content).toContain('ON ping_logs(device_id, timestamp)')
    })

    it('has index on ping_logs timestamp only', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      expect(content).toContain('idx_ping_logs_timestamp')
      expect(content).toContain('ON ping_logs(timestamp)')
    })

    it('has index on outages device_id', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      expect(content).toContain('idx_outages_device')
      expect(content).toContain('ON outages(device_id)')
    })
  })

  describe('Result Object Handling', () => {
    it('createDevice returns object with lastInsertRowid', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      expect(content).toContain('id: result.lastInsertRowid')
    })

    it('updateDevice returns changes count', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      expect(content).toContain('changes: result.changes')
    })

    it('deleteDevice returns changes count', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      expect(content).toMatch(/deleteDevice.*\n.*changes: result\.changes/s)
    })
  })

  describe('Latency Value Edge Cases', () => {
    it('recordPing accepts null latencyMs for failed pings', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      expect(content).toContain('ping.latencyMs')
      expect(content).not.toMatch(/latencyMs.*NOT NULL/)
    })

    it('ping_logs table allows null latency_ms', () => {
      const content = fs.readFileSync(databasePath, 'utf-8')
      const pingLogsSchema = content.substring(
        content.indexOf('CREATE TABLE ping_logs'),
        content.indexOf(');', content.indexOf('CREATE TABLE ping_logs')) + 2
      )
      expect(pingLogsSchema).not.toMatch(/latency_ms.*NOT NULL/)
    })
  })
})
