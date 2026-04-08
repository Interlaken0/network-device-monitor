/**
 * Database Tests
 * 
 * Unit tests for DatabaseManager operations
 * Uses sqlite3 (prebuilt, no compilation needed)
 * 
 * @module tests/unit/database.test
 */

import sqlite3 from 'sqlite3'
import { open } from 'sqlite'

describe('Database Operations', () => {
  let db

  beforeEach(async () => {
    db = await open({
      filename: ':memory:',
      driver: sqlite3.Database
    })
    
    // Create schema - mirrors @src/main/database.js schema
    await db.exec(`
      CREATE TABLE devices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        ip_address TEXT UNIQUE NOT NULL,
        device_type TEXT CHECK(device_type IN ('server', 'router', 'printer', 'switch')),
        location TEXT,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE ping_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        device_id INTEGER NOT NULL,
        latency_ms REAL,
        success INTEGER NOT NULL,
        packet_loss INTEGER DEFAULT 0,
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
      
      CREATE INDEX idx_ping_logs_device_time ON ping_logs(device_id, timestamp);
      CREATE INDEX idx_ping_logs_timestamp ON ping_logs(timestamp);
      CREATE INDEX idx_outages_device ON outages(device_id);
    `)
  })

  afterEach(async () => {
    if (db) {
      await db.close()
    }
  })

  describe('Device CRUD', () => {
    test('creates a device', async () => {
      const result = await db.run(`
        INSERT INTO devices (name, ip_address, device_type, location)
        VALUES (?, ?, ?, ?)
      `, ['Test Router', '192.168.1.1', 'router', 'Office'])
      
      expect(result.lastID).toBeDefined()
      expect(result.changes).toBe(1)
    })

    test('retrieves a device by ID', async () => {
      const insert = await db.run(`
        INSERT INTO devices (name, ip_address, device_type, location)
        VALUES (?, ?, ?, ?)
      `, ['Test Server', '10.0.0.1', 'server', 'DC'])
      
      const device = await db.get('SELECT * FROM devices WHERE id = ?', insert.lastID)
      
      expect(device).toMatchObject({
        name: 'Test Server',
        ip_address: '10.0.0.1',
        device_type: 'server',
        location: 'DC',
        is_active: 1
      })
    })

    test('retrieves device by IP address', async () => {
      await db.run(`
        INSERT INTO devices (name, ip_address, device_type)
        VALUES (?, ?, ?)
      `, ['Printer 1', '192.168.1.50', 'printer'])
      
      const device = await db.get('SELECT * FROM devices WHERE ip_address = ?', '192.168.1.50')
      
      expect(device.name).toBe('Printer 1')
    })

    test('rejects duplicate IP address', async () => {
      await db.run(`
        INSERT INTO devices (name, ip_address, device_type)
        VALUES (?, ?, ?)
      `, ['Device 1', '192.168.1.1', 'router'])
      
      await expect(db.run(`
        INSERT INTO devices (name, ip_address, device_type)
        VALUES (?, ?, ?)
      `, ['Device 2', '192.168.1.1', 'switch'])).rejects.toThrow()
    })

    test('updates device fields', async () => {
      const insert = await db.run(`
        INSERT INTO devices (name, ip_address, device_type)
        VALUES (?, ?, ?)
      `, ['Old Name', '192.168.1.1', 'router'])
      
      await db.run(`
        UPDATE devices SET name = ?, location = ? WHERE id = ?
      `, ['New Name', 'Updated Location', insert.lastID])
      
      const device = await db.get('SELECT * FROM devices WHERE id = ?', insert.lastID)
      
      expect(device.name).toBe('New Name')
      expect(device.location).toBe('Updated Location')
    })

    test('soft deletes device (marks inactive)', async () => {
      const insert = await db.run(`
        INSERT INTO devices (name, ip_address, device_type)
        VALUES (?, ?, ?)
      `, ['To Delete', '192.168.1.99', 'switch'])
      
      await db.run('UPDATE devices SET is_active = 0 WHERE id = ?', insert.lastID)
      
      const device = await db.get('SELECT * FROM devices WHERE id = ?', insert.lastID)
      
      expect(device.is_active).toBe(0)
    })

    test('lists only active devices by default', async () => {
      await db.run(`
        INSERT INTO devices (name, ip_address, device_type)
        VALUES (?, ?, ?)
      `, ['Active Device', '192.168.1.1', 'router'])
      
      const insert = await db.run(`
        INSERT INTO devices (name, ip_address, device_type)
        VALUES (?, ?, ?)
      `, ['Inactive Device', '192.168.1.2', 'switch'])
      await db.run('UPDATE devices SET is_active = 0 WHERE id = ?', insert.lastID)
      
      const active = await db.all('SELECT * FROM devices WHERE is_active = 1')
      
      expect(active).toHaveLength(1)
      expect(active[0].name).toBe('Active Device')
    })
  })

  describe('Ping Log Operations', () => {
    beforeEach(async () => {
      await db.run(`
        INSERT INTO devices (name, ip_address, device_type)
        VALUES (?, ?, ?)
      `, ['Test Device', '192.168.1.1', 'router'])
    })

    test('records successful ping', async () => {
      await db.run(`
        INSERT INTO ping_logs (device_id, latency_ms, success, packet_loss)
        VALUES (?, ?, ?, ?)
      `, [1, 12.5, 1, 0])
      
      const ping = await db.get('SELECT * FROM ping_logs WHERE device_id = ?', 1)
      
      expect(ping.latency_ms).toBe(12.5)
      expect(ping.success).toBe(1)
      expect(ping.packet_loss).toBe(0)
    })

    test('calculates average latency', async () => {
      await db.run(`INSERT INTO ping_logs (device_id, latency_ms, success) VALUES (?, ?, ?)`, [1, 10, 1])
      await db.run(`INSERT INTO ping_logs (device_id, latency_ms, success) VALUES (?, ?, ?)`, [1, 20, 1])
      await db.run(`INSERT INTO ping_logs (device_id, latency_ms, success) VALUES (?, ?, ?)`, [1, 30, 1])
      
      const result = await db.get(`
        SELECT AVG(latency_ms) as avg_latency 
        FROM ping_logs 
        WHERE device_id = ? AND success = 1
      `, 1)
      
      expect(result.avg_latency).toBe(20)
    })
  })

  describe('Outage Operations', () => {
    beforeEach(async () => {
      await db.run(`
        INSERT INTO devices (name, ip_address, device_type)
        VALUES (?, ?, ?)
      `, ['Test Device', '192.168.1.1', 'router'])
    })

    test('records outage start', async () => {
      await db.run(`
        INSERT INTO outages (device_id, start_time, severity)
        VALUES (?, datetime('now'), ?)
      `, [1, 'critical'])
      
      const outage = await db.get('SELECT * FROM outages WHERE device_id = ?', 1)
      
      expect(outage.severity).toBe('critical')
      expect(outage.end_time).toBeNull()
    })
  })

  describe('Database Schema', () => {
    test('devices table has required columns', async () => {
      const columns = await db.all(`SELECT name FROM pragma_table_info('devices')`)
      const columnNames = columns.map(c => c.name)
      
      expect(columnNames).toContain('id')
      expect(columnNames).toContain('name')
      expect(columnNames).toContain('ip_address')
      expect(columnNames).toContain('device_type')
    })
  })
})
