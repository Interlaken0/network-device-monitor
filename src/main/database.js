import Database from 'better-sqlite3'
import { app } from 'electron'
import path from 'path'
import fs from 'fs'

/**
 * Database Manager - Singleton Pattern
 * 
 * Provides a single persistent database connection with:
 * - Prepared statement caching for performance
 * - Automatic schema initialisation
 * - Connection lifecycle management
 * 
 * @see Technical-Deep-Dive.md Section 2.1 for library comparison
 * @see Technical-Deep-Dive.md Section 4.4 for memory management patterns
 */

class DatabaseManager {
  static instance = null
  db = null
  statements = new Map()
  
  /**
   * Get singleton instance
   * @returns {DatabaseManager}
   */
  static getInstance() {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager()
    }
    return DatabaseManager.instance
  }
  
  /**
   * Initialise database connection
   * Called automatically on first use
   */
  initialise() {
    if (this.db) return
    
    // Store database in user's app data directory
    const dbPath = path.join(app.getPath('userData'), 'network-monitor.sqlite')
    
    // Ensure directory exists
    const dbDir = path.dirname(dbPath)
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true })
    }
    
    // Create connection
    this.db = new Database(dbPath)
    
    // Enable foreign keys (SQLite default is off)
    this.db.pragma('journal_mode = WAL')
    this.db.pragma('foreign_keys = ON')
    
    // Initialise schema
    this.initialiseSchema()
    
    console.log('Database initialised at:', dbPath)
  }
  
  /**
   * Create database tables and indexes
   * @see AMF-Network-Monitor-Agile-Strategy.md Section 4.3 for schema design
   */
  initialiseSchema() {
    // devices: Static infrastructure configuration
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS devices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        ip_address TEXT UNIQUE NOT NULL,
        device_type TEXT CHECK(device_type IN ('server', 'router', 'printer', 'switch')),
        location TEXT,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `)
    
    // ping_logs: Time-series latency measurements
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS ping_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        device_id INTEGER NOT NULL,
        latency_ms REAL,
        success BOOLEAN NOT NULL,
        packet_loss BOOLEAN DEFAULT 0,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(device_id) REFERENCES devices(id) ON DELETE CASCADE
      );
    `)
    
    // outages: Aggregated downtime events
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS outages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        device_id INTEGER NOT NULL,
        start_time DATETIME NOT NULL,
        end_time DATETIME,
        duration_seconds INTEGER,
        severity TEXT CHECK(severity IN ('critical', 'warning', 'info')),
        FOREIGN KEY(device_id) REFERENCES devices(id) ON DELETE CASCADE
      );
    `)
    
    // Indexes for query optimisation
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_ping_logs_device_time 
        ON ping_logs(device_id, timestamp);
      
      CREATE INDEX IF NOT EXISTS idx_ping_logs_timestamp 
        ON ping_logs(timestamp);
      
      CREATE INDEX IF NOT EXISTS idx_outages_device 
        ON outages(device_id);
    `)
  }
  
  /**
   * Get or create prepared statement
   * @param {string} name - Statement identifier
   * @param {string} sql - SQL query
   * @returns {Statement} Prepared statement
   */
  getStatement(name, sql) {
    if (!this.statements.has(name)) {
      this.statements.set(name, this.db.prepare(sql))
    }
    return this.statements.get(name)
  }
  
  // ========== Device CRUD Operations ==========
  
  /**
   * Create a new device
   * @param {Object} device - Device data
   * @param {string} device.name - Device name
   * @param {string} device.ipAddress - IP address (IPv4 or IPv6)
   * @param {string} device.deviceType - Type: server, router, printer, switch
   * @param {string} [device.location] - Physical location
   * @returns {Object} Created device with id
   * @throws {Error} If validation fails or IP already exists
   */
  createDevice(device) {
    const stmt = this.getStatement(
      'createDevice',
      `INSERT INTO devices (name, ip_address, device_type, location) 
       VALUES (?, ?, ?, ?)`
    )
    
    const result = stmt.run(
      device.name,
      device.ipAddress,
      device.deviceType,
      device.location || null
    )
    
    return {
      id: result.lastInsertRowid,
      ...device
    }
  }
  
  /**
   * Get device by ID
   * @param {number} id - Device ID
   * @returns {Object|null} Device or null if not found
   */
  getDevice(id) {
    const stmt = this.getStatement(
      'getDevice',
      'SELECT * FROM devices WHERE id = ?'
    )
    return stmt.get(id)
  }
  
  /**
   * Get device by IP address
   * @param {string} ipAddress - IP address
   * @returns {Object|null} Device or null if not found
   */
  getDeviceByIp(ipAddress) {
    const stmt = this.getStatement(
      'getDeviceByIp',
      'SELECT * FROM devices WHERE ip_address = ?'
    )
    return stmt.get(ipAddress)
  }
  
  /**
   * Get all devices
   * @param {boolean} [activeOnly=true] - Only active devices
   * @returns {Array} List of devices
   */
  getAllDevices(activeOnly = true) {
    const sql = activeOnly 
      ? 'SELECT * FROM devices WHERE is_active = 1 ORDER BY created_at DESC'
      : 'SELECT * FROM devices ORDER BY created_at DESC'
    
    const stmt = this.getStatement('getAllDevices', sql)
    return stmt.all()
  }
  
  /**
   * Update device
   * @param {number} id - Device ID
   * @param {Object} updates - Fields to update
   * @returns {Object} Update result
   */
  updateDevice(id, updates) {
    const allowedFields = ['name', 'ip_address', 'device_type', 'location', 'is_active']
    const fields = []
    const values = []
    
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = ?`)
        values.push(value)
      }
    }
    
    if (fields.length === 0) {
      throw new Error('No valid fields to update')
    }
    
    values.push(id)
    const sql = `UPDATE devices SET ${fields.join(', ')} WHERE id = ?`
    const stmt = this.db.prepare(sql)
    const result = stmt.run(...values)
    
    return {
      changes: result.changes,
      id
    }
  }
  
  /**
   * Soft delete device (mark inactive)
   * @param {number} id - Device ID
   * @returns {Object} Delete result
   */
  deleteDevice(id) {
    const stmt = this.getStatement(
      'deleteDevice',
      'UPDATE devices SET is_active = 0 WHERE id = ?'
    )
    const result = stmt.run(id)
    
    return {
      changes: result.changes,
      id
    }
  }
  
  // ========== Ping Log Operations ==========
  
  /**
   * Record a ping result
   * @param {Object} ping - Ping data
   * @param {number} ping.deviceId - Device ID
   * @param {number} ping.latencyMs - Latency in milliseconds
   * @param {boolean} ping.success - Whether ping succeeded
   * @param {boolean} [ping.packetLoss] - Whether packet was lost
   * @returns {Object} Created ping log
   */
  recordPing(ping) {
    const stmt = this.getStatement(
      'recordPing',
      `INSERT INTO ping_logs (device_id, latency_ms, success, packet_loss) 
       VALUES (?, ?, ?, ?)`
    )
    
    const result = stmt.run(
      ping.deviceId,
      ping.latencyMs,
      ping.success ? 1 : 0,
      ping.packetLoss ? 1 : 0
    )
    
    return {
      id: result.lastInsertRowid,
      ...ping
    }
  }
  
  /**
   * Get recent ping results for a device
   * @param {number} deviceId - Device ID
   * @param {number} [limit=100] - Maximum results
   * @returns {Array} Ping results
   */
  getRecentPings(deviceId, limit = 100) {
    const stmt = this.getStatement(
      'getRecentPings',
      `SELECT * FROM ping_logs 
       WHERE device_id = ? 
       ORDER BY timestamp DESC 
       LIMIT ?`
    )
    return stmt.all(deviceId, limit)
  }
  
  /**
   * Get average latency for a device
   * @param {number} deviceId - Device ID
   * @param {number} [hours=24] - Time window in hours
   * @returns {number|null} Average latency or null if no data
   */
  getAverageLatency(deviceId, hours = 24) {
    const stmt = this.getStatement(
      'getAverageLatency',
      `SELECT AVG(latency_ms) as avg_latency 
       FROM ping_logs 
       WHERE device_id = ? 
         AND success = 1 
         AND timestamp > datetime('now', ?)`
    )
    const result = stmt.get(deviceId, `-${hours} hours`)
    return result?.avg_latency
  }
  
  /**
   * Get latest ping for a device
   * @param {number} deviceId - Device ID
   * @returns {Object|null} Latest ping or null
   */
  getLatestPing(deviceId) {
    const stmt = this.getStatement(
      'getLatestPing',
      `SELECT * FROM ping_logs 
       WHERE device_id = ? 
       ORDER BY timestamp DESC 
       LIMIT 1`
    )
    return stmt.get(deviceId)
  }
  
  // ========== Outage Operations ==========
  
  /**
   * Record an outage start
   * @param {number} deviceId - Device ID
   * @param {string} severity - critical, warning, or info
   * @returns {Object} Created outage
   */
  startOutage(deviceId, severity = 'critical') {
    const stmt = this.getStatement(
      'startOutage',
      `INSERT INTO outages (device_id, start_time, severity) 
       VALUES (?, datetime('now'), ?)`
    )
    
    const result = stmt.run(deviceId, severity)
    
    return {
      id: result.lastInsertRowid,
      deviceId,
      severity
    }
  }
  
  /**
   * End an outage
   * @param {number} outageId - Outage ID
   * @returns {Object} Update result with duration
   */
  endOutage(outageId) {
    const stmt = this.getStatement(
      'endOutage',
      `UPDATE outages 
       SET end_time = datetime('now'),
           duration_seconds = (julianday('now') - julianday(start_time)) * 86400
       WHERE id = ? AND end_time IS NULL`
    )
    
    const result = stmt.run(outageId)
    return {
      changes: result.changes,
      id: outageId
    }
  }
  
  /**
   * Get active outage for a device
   * @param {number} deviceId - Device ID
   * @returns {Object|null} Active outage or null
   */
  getActiveOutage(deviceId) {
    const stmt = this.getStatement(
      'getActiveOutage',
      `SELECT * FROM outages 
       WHERE device_id = ? AND end_time IS NULL 
       ORDER BY start_time DESC 
       LIMIT 1`
    )
    return stmt.get(deviceId)
  }
  
  // ========== Utility Methods ==========
  
  /**
   * Close database connection
   * Call on app quit to prevent corruption
   */
  close() {
    if (this.db) {
      this.db.close()
      this.db = null
      this.statements.clear()
      console.log('Database connection closed')
    }
  }
  
  /**
   * Get database statistics
   * @returns {Object} Table row counts
   */
  getStats() {
    const devices = this.db.prepare('SELECT COUNT(*) as count FROM devices').get()
    const pingLogs = this.db.prepare('SELECT COUNT(*) as count FROM ping_logs').get()
    const outages = this.db.prepare('SELECT COUNT(*) as count FROM outages').get()
    
    return {
      devices: devices.count,
      pingLogs: pingLogs.count,
      outages: outages.count
    }
  }
}

// Export singleton getter
export const getDatabase = () => {
  const db = DatabaseManager.getInstance()
  db.initialise()
  return db
}

// For testing with in-memory database
export const createTestDatabase = () => {
  const db = new Database(':memory:')
  db.pragma('foreign_keys = ON')
  
  // Create tables
  db.exec(`
    CREATE TABLE devices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      ip_address TEXT UNIQUE NOT NULL,
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
    
    CREATE INDEX idx_ping_logs_device_time ON ping_logs(device_id, timestamp);
    CREATE INDEX idx_ping_logs_timestamp ON ping_logs(timestamp);
    CREATE INDEX idx_outages_device ON outages(device_id);
  `)
  
  return db
}

export default DatabaseManager
