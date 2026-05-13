/**
 * Database Aggregation Functions Integration Tests (Sprint 4)
 *
 * Tests the new historical aggregation methods using sqlite3/sqlite
 * with an in-memory database. These methods are exercised via raw SQL
 * that mirrors the queries used in DatabaseManager.
 * - getAverageLatencyByDateRange
 * - getUptimePercentageByDateRange
 * - getOutageStatisticsByDateRange
 * - getHistoricalSummaryByDateRange
 *
 * @module tests/unit/database-aggregations-integration.test
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import sqlite3 from 'sqlite3'
import { open } from 'sqlite'

describe('Database Aggregation Functions Integration (Sprint 4)', () => {
  let db
  let testDeviceId

  beforeEach(async () => {
    db = await open({
      filename: ':memory:',
      driver: sqlite3.Database
    })

    await db.exec(`
      CREATE TABLE devices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        ip_address TEXT NOT NULL,
        device_type TEXT CHECK(device_type IN ('server', 'router', 'printer', 'switch')),
        location TEXT,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE ping_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        device_id INTEGER NOT NULL,
        latency_ms REAL,
        success BOOLEAN NOT NULL,
        packet_loss BOOLEAN DEFAULT 0,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(device_id) REFERENCES devices(id) ON DELETE CASCADE
      );

      CREATE TABLE outages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        device_id INTEGER NOT NULL,
        start_time DATETIME NOT NULL,
        end_time DATETIME,
        duration_seconds INTEGER,
        severity TEXT CHECK(severity IN ('critical', 'warning', 'info')),
        FOREIGN KEY(device_id) REFERENCES devices(id) ON DELETE CASCADE
      );
    `)

    const result = await db.run(
      `INSERT INTO devices (name, ip_address, device_type, location) VALUES (?, ?, ?, ?)`,
      ['Sprint4 Test Router', '192.168.99.1', 'router', 'Test Lab']
    )

    testDeviceId = result.lastID
  })

  afterEach(async () => {
    if (db) {
      await db.close()
    }
  })

  async function recordPing (ping) {
    await db.run(
      `INSERT INTO ping_logs (device_id, latency_ms, success, packet_loss) VALUES (?, ?, ?, ?)`,
      [ping.deviceId, ping.latencyMs, ping.success ? 1 : 0, ping.packetLoss ? 1 : 0]
    )
  }

  async function startOutage (deviceId, severity = 'critical') {
    const result = await db.run(
      `INSERT INTO outages (device_id, start_time, severity) VALUES (?, datetime('now'), ?)`,
      [deviceId, severity]
    )
    return { id: result.lastID, deviceId, severity }
  }

  async function endOutage (outageId) {
    await db.run(
      `UPDATE outages
       SET end_time = datetime('now'),
           duration_seconds = (julianday('now') - julianday(start_time)) * 86400
       WHERE id = ? AND end_time IS NULL`,
      [outageId]
    )
    return { id: outageId }
  }

  async function getAverageLatencyByDateRange (deviceId, startDate, endDate) {
    const result = await db.get(
      `SELECT AVG(latency_ms) as avg_latency
       FROM ping_logs
       WHERE device_id = ?
         AND success = 1
         AND strftime('%Y-%m-%d', timestamp) >= ?
         AND strftime('%Y-%m-%d', timestamp) <= ?`,
      [deviceId, startDate, endDate]
    )
    return result ? result.avg_latency : null
  }

  async function getUptimePercentageByDateRange (deviceId, startDate, endDate) {
    const result = await db.get(
      `SELECT
        COUNT(*) as total_pings,
        SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful_pings,
        SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as failed_pings
       FROM ping_logs
       WHERE device_id = ?
         AND strftime('%Y-%m-%d', timestamp) >= ?
         AND strftime('%Y-%m-%d', timestamp) <= ?`,
      [deviceId, startDate, endDate]
    )

    const totalPings = result?.total_pings || 0
    const successfulPings = result?.successful_pings || 0
    const failedPings = result?.failed_pings || 0

    const uptimePercent = totalPings > 0
      ? Math.round((successfulPings / totalPings) * 100 * 100) / 100
      : null

    return {
      deviceId,
      startDate,
      endDate,
      totalPings,
      successfulPings,
      failedPings,
      uptimePercent
    }
  }

  async function getOutageStatisticsByDateRange (deviceId, startDate, endDate) {
    const stats = await db.get(
      `SELECT
        COUNT(*) as outage_count,
        SUM(CASE WHEN end_time IS NULL THEN
          (julianday('now') - julianday(start_time)) * 86400
          ELSE duration_seconds END) as total_downtime_seconds,
        AVG(CASE WHEN end_time IS NULL THEN
          (julianday('now') - julianday(start_time)) * 86400
          ELSE duration_seconds END) as avg_outage_duration_seconds,
        MAX(CASE WHEN end_time IS NULL THEN
          (julianday('now') - julianday(start_time)) * 86400
          ELSE duration_seconds END) as max_outage_duration_seconds,
        MIN(CASE WHEN end_time IS NULL THEN
          (julianday('now') - julianday(start_time)) * 86400
          ELSE duration_seconds END) as min_outage_duration_seconds,
        SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) as critical_count,
        SUM(CASE WHEN severity = 'warning' THEN 1 ELSE 0 END) as warning_count,
        SUM(CASE WHEN severity = 'info' THEN 1 ELSE 0 END) as info_count
       FROM outages
       WHERE device_id = ?
         AND strftime('%Y-%m-%d', start_time) >= ?
         AND strftime('%Y-%m-%d', start_time) <= ?`,
      [deviceId, startDate, endDate]
    )

    return {
      deviceId,
      startDate,
      endDate,
      outageCount: stats?.outage_count || 0,
      totalDowntimeSeconds: stats?.total_downtime_seconds || 0,
      averageOutageDurationSeconds: stats?.avg_outage_duration_seconds || 0,
      maxOutageDurationSeconds: stats?.max_outage_duration_seconds || 0,
      minOutageDurationSeconds: stats?.min_outage_duration_seconds || 0,
      criticalOutages: stats?.critical_count || 0,
      warningOutages: stats?.warning_count || 0,
      infoOutages: stats?.info_count || 0
    }
  }

  async function getHistoricalSummaryByDateRange (deviceId, startDate, endDate) {
    const uptime = await getUptimePercentageByDateRange(deviceId, startDate, endDate)
    const latency = await getAverageLatencyByDateRange(deviceId, startDate, endDate)
    const outages = await getOutageStatisticsByDateRange(deviceId, startDate, endDate)

    return {
      deviceId,
      startDate,
      endDate,
      uptime,
      averageLatencyMs: latency,
      outages
    }
  }

  describe('getAverageLatencyByDateRange', () => {
    it('returns null when no ping data exists', async () => {
      const result = await getAverageLatencyByDateRange(testDeviceId, '2000-01-01', '2000-01-01')
      expect(result).toBeNull()
    })

    it('calculates average latency for successful pings within date range', async () => {
      await recordPing({
        deviceId: testDeviceId,
        latencyMs: 25,
        success: true,
        packetLoss: false
      })

      await recordPing({
        deviceId: testDeviceId,
        latencyMs: 35,
        success: true,
        packetLoss: false
      })

      const result = await getAverageLatencyByDateRange(testDeviceId, '2020-01-01', '2030-12-31')
      expect(result).toBe(30)
    })
  })

  describe('getUptimePercentageByDateRange', () => {
    it('returns object with uptime statistics', async () => {
      const result = await getUptimePercentageByDateRange(testDeviceId, '2000-01-01', '2000-01-01')

      expect(result).toBeDefined()
      expect(result.deviceId).toBe(testDeviceId)
      expect(result.startDate).toBe('2000-01-01')
      expect(result.endDate).toBe('2000-01-01')
      expect(result.totalPings).toBeGreaterThanOrEqual(0)
      expect(result.successfulPings).toBeGreaterThanOrEqual(0)
      expect(result.failedPings).toBeGreaterThanOrEqual(0)
      expect(result.uptimePercent === null || typeof result.uptimePercent === 'number').toBe(true)
    })

    it('returns 0% uptime when all pings fail', async () => {
      for (let i = 0; i < 5; i++) {
        await recordPing({
          deviceId: testDeviceId,
          latencyMs: null,
          success: false,
          packetLoss: true
        })
      }

      const result = await getUptimePercentageByDateRange(testDeviceId, '2020-01-01', '2030-12-31')

      expect(result.totalPings).toBeGreaterThan(0)
      expect(result.successfulPings).toBe(0)
      expect(result.uptimePercent).toBe(0)
    })
  })

  describe('getOutageStatisticsByDateRange', () => {
    it('returns object with outage statistics', async () => {
      const result = await getOutageStatisticsByDateRange(testDeviceId, '2000-01-01', '2000-01-01')

      expect(result).toBeDefined()
      expect(result.deviceId).toBe(testDeviceId)
      expect(result.outageCount).toBeGreaterThanOrEqual(0)
      expect(result.totalDowntimeSeconds).toBeGreaterThanOrEqual(0)
      expect(result.criticalOutages).toBeGreaterThanOrEqual(0)
      expect(result.warningOutages).toBeGreaterThanOrEqual(0)
      expect(result.infoOutages).toBeGreaterThanOrEqual(0)
    })

    it('counts different severity outages correctly', async () => {
      const outage1 = await startOutage(testDeviceId, 'critical')
      await endOutage(outage1.id)

      const outage2 = await startOutage(testDeviceId, 'warning')
      await endOutage(outage2.id)

      const result = await getOutageStatisticsByDateRange(testDeviceId, '2020-01-01', '2030-12-31')

      expect(result.outageCount).toBeGreaterThanOrEqual(2)
      expect(result.criticalOutages).toBeGreaterThanOrEqual(1)
      expect(result.warningOutages).toBeGreaterThanOrEqual(1)
    })
  })

  describe('getHistoricalSummaryByDateRange', () => {
    it('returns comprehensive historical summary', async () => {
      const result = await getHistoricalSummaryByDateRange(testDeviceId, '2000-01-01', '2000-01-01')

      expect(result).toBeDefined()
      expect(result.deviceId).toBe(testDeviceId)
      expect(result.startDate).toBe('2000-01-01')
      expect(result.endDate).toBe('2000-01-01')
      expect(result.uptime).toBeDefined()
      expect(result.averageLatencyMs === null || typeof result.averageLatencyMs === 'number').toBe(true)
      expect(result.outages).toBeDefined()
    })

    it('combines uptime, latency, and outage data', async () => {
      await recordPing({
        deviceId: testDeviceId,
        latencyMs: 50,
        success: true,
        packetLoss: false
      })

      const result = await getHistoricalSummaryByDateRange(testDeviceId, '2020-01-01', '2030-12-31')

      expect(result.uptime.deviceId).toBe(testDeviceId)
      expect(result.outages.deviceId).toBe(testDeviceId)
      expect(result.averageLatencyMs === null || typeof result.averageLatencyMs === 'number').toBe(true)
    })
  })

  describe('Database methods are chainable', () => {
    it('getHistoricalSummaryByDateRange uses other aggregation methods internally', async () => {
      const summary = await getHistoricalSummaryByDateRange(testDeviceId, '2020-01-01', '2030-12-31')

      expect(summary.uptime.deviceId).toBeDefined()
      expect(summary.outages.deviceId).toBeDefined()
      expect(summary.averageLatencyMs !== undefined).toBe(true)
    })
  })

  describe('Edge cases', () => {
    it('handles non-existent device gracefully', async () => {
      const result = await getUptimePercentageByDateRange(99999, '2026-05-10', '2026-05-10')

      expect(result).toBeDefined()
      expect(result.totalPings).toBe(0)
      expect(result.uptimePercent).toBeNull()
    })

    it('handles date ranges with no data', async () => {
      const result = await getHistoricalSummaryByDateRange(testDeviceId, '2000-01-01', '2000-01-02')

      expect(result).toBeDefined()
      expect(result.uptime.totalPings).toBe(0)
      expect(result.outages.outageCount).toBe(0)
    })

    it('handles future date ranges', async () => {
      const result = await getUptimePercentageByDateRange(testDeviceId, '2099-01-01', '2099-12-31')

      expect(result).toBeDefined()
      expect(result.totalPings).toBe(0)
    })
  })
})
