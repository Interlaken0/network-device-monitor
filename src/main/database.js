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

// Lazy-loaded better-sqlite3 (native module, must not be bundled)
let Database = null
async function getDatabaseClass() {
  if (!Database) {
    const module = await import('better-sqlite3')
    Database = module.default
  }
  return Database
}

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
  async initialise() {
    if (this.db) return
    
    // Dynamically import better-sqlite3 (native module)
    const DatabaseClass = await getDatabaseClass()
    
    // Store database in user's app data directory
    const dbPath = path.join(app.getPath('userData'), 'network-monitor.sqlite')
    
    // Ensure directory exists
    const dbDir = path.dirname(dbPath)
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true })
    }
    
    // Create connection
    this.db = new DatabaseClass(dbPath)
    
    // Enable foreign keys (SQLite default is off)
    this.db.pragma('journal_mode = WAL')
    this.db.pragma('foreign_keys = ON')
    
    // Initialise schema
    this.initialiseSchema()
    
    // Run migrations to fix schema issues
    this.runMigrations()
    
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
        ip_address TEXT NOT NULL,
        device_type TEXT CHECK(device_type IN ('server', 'router', 'printer', 'switch')),
        location TEXT,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `)
    
    // Partial unique index: only active devices must have unique IPs
    this.db.exec(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_devices_ip_active 
      ON devices(ip_address) WHERE is_active = 1;
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
      
      CREATE INDEX IF NOT EXISTS idx_ping_logs_device_time_range 
        ON ping_logs(device_id, timestamp DESC);
      
      CREATE INDEX IF NOT EXISTS idx_outages_start_time 
        ON outages(start_time DESC);
      
      CREATE INDEX IF NOT EXISTS idx_ping_logs_timestamp_device 
        ON ping_logs(timestamp, device_id);
    `)
  }
  
  /**
   * Run database migrations to fix schema issues
   * Handles transition from old UNIQUE constraint to partial unique index
   */
  runMigrations() {
    try {
      // Check if old sqlite_autoindex_devices_1 exists (from UNIQUE constraint)
      const autoIndex = this.db.prepare(
        "SELECT name FROM sqlite_master WHERE type='index' AND name='sqlite_autoindex_devices_1'"
      ).get()
      
      if (autoIndex) {
        console.log('Migration: Removing old UNIQUE constraint and creating partial index...')
        
        // SQLite doesn't support DROP CONSTRAINT - need to recreate table
        // 1. Disable foreign key enforcement during migration
        this.db.pragma('foreign_keys = OFF')
        
        // 2. Create new table without UNIQUE constraint on ip_address
        this.db.exec(`
          CREATE TABLE devices_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            ip_address TEXT NOT NULL,
            device_type TEXT CHECK(device_type IN ('server', 'router', 'printer', 'switch')),
            location TEXT,
            is_active BOOLEAN DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );
        `)
        
        // 3. Copy all data
        this.db.exec(`
          INSERT INTO devices_new SELECT * FROM devices;
        `)
        
        // 4. Drop old table
        this.db.exec(`DROP TABLE devices;`)
        
        // 5. Rename new table
        this.db.exec(`ALTER TABLE devices_new RENAME TO devices;`)
        
        // 6. Recreate indexes
        this.db.exec(`
          CREATE UNIQUE INDEX IF NOT EXISTS idx_devices_ip_active 
          ON devices(ip_address) WHERE is_active = 1;
        `)
        
        // 7. Re-enable foreign keys
        this.db.pragma('foreign_keys = ON')
        
        // 8. Clear prepared statement cache since schema changed
        this.statements.clear()
        
        console.log('Migration: Schema updated successfully')
      }
    } catch (error) {
      console.error('Migration error:', error)
      // Don't throw - let app continue even if migration fails
    }
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
      'SELECT * FROM devices WHERE ip_address = ? AND is_active = 1'
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

  /**
   * Get device with latest status information
   * @param {number} deviceId - Device ID
   * @returns {Object|null} Device with latest ping and active outage, or null
   */
  getDeviceWithLatestStatus(deviceId) {
    // Get device details
    const device = this.getDevice(deviceId)
    if (!device) return null

    // Get latest ping
    const latestPing = this.getLatestPing(deviceId)

    // Get active outage
    const activeOutage = this.getActiveOutage(deviceId)

    // Determine current status
    let status = 'unknown'
    if (latestPing) {
      status = latestPing.success ? 'online' : 'offline'
    }
    if (activeOutage) {
      status = 'outage'
    }

    return {
      ...device,
      latestPing,
      activeOutage,
      status
    }
  }

  /**
   * Get all active devices with their latest status
   * @returns {Array} List of devices with latest ping information
   */
  getAllDevicesWithLatestStatus() {
    const stmt = this.getStatement(
      'getAllDevicesWithLatestStatus',
      `SELECT
        d.*,
        pl.latency_ms as latest_latency,
        pl.success as latest_success,
        pl.timestamp as latest_ping_time,
        o.id as outage_id,
        o.severity as outage_severity,
        o.start_time as outage_start
      FROM devices d
      LEFT JOIN (
        SELECT device_id, latency_ms, success, timestamp
        FROM ping_logs
        WHERE (device_id, timestamp) IN (
          SELECT device_id, MAX(timestamp)
          FROM ping_logs
          GROUP BY device_id
        )
      ) pl ON d.id = pl.device_id
      LEFT JOIN outages o ON d.id = o.device_id AND o.end_time IS NULL
      WHERE d.is_active = 1
      ORDER BY d.created_at DESC`
    )

    const rows = stmt.all()

    return rows.map(row => {
      // Determine status
      let status = 'unknown'
      if (row.latest_success !== null) {
        status = row.latest_success ? 'online' : 'offline'
      }
      if (row.outage_id) {
        status = 'outage'
      }

      return {
        id: row.id,
        name: row.name,
        ipAddress: row.ip_address,
        deviceType: row.device_type,
        location: row.location,
        isActive: row.is_active,
        createdAt: row.created_at,
        latestPing: row.latest_ping_time ? {
          latencyMs: row.latest_latency,
          success: row.latest_success,
          timestamp: row.latest_ping_time
        } : null,
        activeOutage: row.outage_id ? {
          id: row.outage_id,
          severity: row.outage_severity,
          startTime: row.outage_start
        } : null,
        status
      }
    })
  }

  /**
   * Get comprehensive status summary for a device
   * @param {number} deviceId - Device ID
   * @param {number} [hours=24] - Time window in hours
   * @returns {Object|null} Status summary or null if device not found
   */
  getDeviceStatusSummary(deviceId, hours = 24) {
    // Check device exists
    const device = this.getDevice(deviceId)
    if (!device) return null

    // Get ping statistics for the time window
    const statsStmt = this.getStatement(
      'getDeviceStatusSummaryStats',
      `SELECT
        COUNT(*) as total_pings,
        SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful_pings,
        SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as failed_pings,
        AVG(CASE WHEN success = 1 THEN latency_ms END) as avg_latency,
        MIN(CASE WHEN success = 1 THEN latency_ms END) as min_latency,
        MAX(CASE WHEN success = 1 THEN latency_ms END) as max_latency
      FROM ping_logs
      WHERE device_id = ?
        AND timestamp > datetime('now', ?)`
    )

    const stats = statsStmt.get(deviceId, `-${hours} hours`)

    // Get recent outages in the time window
    const outagesStmt = this.getStatement(
      'getRecentOutages',
      `SELECT COUNT(*) as outage_count,
        SUM(CASE WHEN end_time IS NULL THEN
          (julianday('now') - julianday(start_time)) * 86400
          ELSE duration_seconds END) as total_downtime_seconds
      FROM outages
      WHERE device_id = ?
        AND start_time > datetime('now', ?)`
    )

    const outages = outagesStmt.get(deviceId, `-${hours} hours`)

    // Calculate uptime percentage
    const totalPings = stats.total_pings || 0
    const successfulPings = stats.successful_pings || 0
    const uptimePercent = totalPings > 0
      ? Math.round((successfulPings / totalPings) * 100)
      : null

    return {
      deviceId,
      hours,
      totalPings,
      successfulPings,
      failedPings: stats.failed_pings || 0,
      uptimePercent,
      averageLatencyMs: stats.avg_latency,
      minLatencyMs: stats.min_latency,
      maxLatencyMs: stats.max_latency,
      outageCount: outages?.outage_count || 0,
      totalDowntimeSeconds: outages?.total_downtime_seconds || 0
    }
  }

  // ========== Historical Aggregation Functions (Sprint 4) ==========

  /**
   * Get average latency for a device within a date range
   * @param {number} deviceId - Device ID
   * @param {string} startDate - ISO 8601 date string (e.g., '2026-05-01')
   * @param {string} endDate - ISO 8601 date string (e.g., '2026-05-13')
   * @returns {number|null} Average latency in milliseconds or null if no data
   */
  getAverageLatencyByDateRange(deviceId, startDate, endDate) {
    const stmt = this.getStatement(
      'getAverageLatencyByDateRange',
      `SELECT AVG(latency_ms) as avg_latency 
       FROM ping_logs 
       WHERE device_id = ? 
         AND success = 1 
         AND strftime('%Y-%m-%d', timestamp) >= ? 
         AND strftime('%Y-%m-%d', timestamp) <= ?`
    )
    const result = stmt.get(deviceId, startDate, endDate)
    return result ? result.avg_latency : null
  }

  /**
   * Get uptime percentage for a device within a date range
   * @param {number} deviceId - Device ID
   * @param {string} startDate - ISO 8601 date string
   * @param {string} endDate - ISO 8601 date string
   * @returns {Object} Uptime statistics
   */
  getUptimePercentageByDateRange(deviceId, startDate, endDate) {
    const stmt = this.getStatement(
      'getUptimeByDateRange',
      `SELECT 
        COUNT(*) as total_pings,
        SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful_pings,
        SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as failed_pings
       FROM ping_logs 
       WHERE device_id = ? 
         AND strftime('%Y-%m-%d', timestamp) >= ? 
         AND strftime('%Y-%m-%d', timestamp) <= ?`
    )
    const result = stmt.get(deviceId, startDate, endDate)
    
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

  /**
   * Get comprehensive outage statistics for a device within a date range
   * @param {number} deviceId - Device ID
   * @param {string} startDate - ISO 8601 date string
   * @param {string} endDate - ISO 8601 date string
   * @returns {Object} Outage statistics
   */
  getOutageStatisticsByDateRange(deviceId, startDate, endDate) {
    // Get outage count and duration
    const statsStmt = this.getStatement(
      'getOutageStatsByDateRange',
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
         AND strftime('%Y-%m-%d', start_time) <= ?`
    )
    
    const stats = statsStmt.get(deviceId, startDate, endDate)
    
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

  /**
   * Get comprehensive historical summary for a device across a date range
   * @param {number} deviceId - Device ID
   * @param {string} startDate - ISO 8601 date string
   * @param {string} endDate - ISO 8601 date string
   * @returns {Object} Complete historical summary
   */
  getHistoricalSummaryByDateRange(deviceId, startDate, endDate) {
    const uptime = this.getUptimePercentageByDateRange(deviceId, startDate, endDate)
    const latency = this.getAverageLatencyByDateRange(deviceId, startDate, endDate)
    const outages = this.getOutageStatisticsByDateRange(deviceId, startDate, endDate)

    return {
      deviceId,
      startDate,
      endDate,
      uptime,
      averageLatencyMs: latency,
      outages
    }
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
      `
    )
    return stmt.get(deviceId)
  }

  /**
   * Get all active outages with device information
   * @returns {Array} List of active outages with device details
   */
  getAllActiveOutages() {
    const stmt = this.getStatement('getAllActiveOutages', 
      `SELECT o.*, d.name, d.ip_address 
       FROM outages o 
       JOIN devices d ON o.device_id = d.id 
       WHERE o.end_time IS NULL 
       ORDER BY o.start_time DESC`
    )
    return stmt.all()
  }

  /**
   * Get outage history for a specific device
   * @param {number} deviceId - Device ID
   * @param {number} hours - Hours of history to retrieve
   * @returns {Array} List of outages with device details
   */
  getOutageHistory(deviceId, hours = 24) {
    const stmt = this.getStatement('getOutageHistory',
      `SELECT o.*, d.name, d.ip_address 
       FROM outages o 
       JOIN devices d ON o.device_id = d.id 
       WHERE o.device_id = ? 
         AND o.start_time > datetime('now', ?)
       ORDER BY o.start_time DESC`
    )
    return stmt.all(deviceId, `-${hours} hours`)
  }

  /**
   * Get outage history for all devices
   * @param {number} hours - Hours of history to retrieve
   * @returns {Array} List of outages with device details
   */
  getAllOutageHistory(hours = 24) {
    const stmt = this.getStatement('getAllOutageHistory',
      `SELECT o.*, d.name, d.ip_address
       FROM outages o
       JOIN devices d ON o.device_id = d.id
       WHERE o.start_time > datetime('now', ?)
       ORDER BY o.start_time DESC`
    )
    return stmt.all(`-${hours} hours`)
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
    const deviceCount = this.db.prepare('SELECT COUNT(*) as count FROM devices').get().count
    const pingCount = this.db.prepare('SELECT COUNT(*) as count FROM ping_logs').get().count
    const outageCount = this.db.prepare('SELECT COUNT(*) as count FROM outages WHERE end_time IS NULL').get().count

    return {
      deviceCount,
      pingCount,
      outageCount
    }
  }

  /**
   * Apply ping history retention policy
   * @param {number} retentionDays - Number of days to retain records (default: 30)
   * @returns {Object} Purge statistics
   */
  applyPingHistoryRetention(retentionDays = 30) {
    try {
      // Delete ping logs older than retention period
      const deleteStmt = this.db.prepare(`
        DELETE FROM ping_logs 
        WHERE timestamp < datetime('now', '-${retentionDays} days')
      `)
      
      const result = deleteStmt.run()
      
      // Vacuum database to reclaim space
      this.db.exec('VACUUM')
      
      console.log(`Purged ${result.changes} ping records older than ${retentionDays} days`)
      
      return {
        deletedRecords: result.changes,
        retentionDays,
        timestamp: new Date().toISOString()
      }
      
    } catch (error) {
      console.error('Error applying ping history retention:', error)
      throw new Error('Failed to apply retention policy')
    }
  }

  /**
   * Get retention policy statistics
   * @param {number} retentionDays - Number of days to retain records
   * @returns {Object} Statistics about records that would be purged
   */
  getRetentionPolicyStats(retentionDays = 30) {
    try {
      // Count records older than retention period
      const countStmt = this.db.prepare(`
        SELECT COUNT(*) as count 
        FROM ping_logs 
        WHERE timestamp < datetime('now', '-${retentionDays} days')
      `)
      
      const result = countStmt.get()
      
      // Get oldest record timestamp (included in size query below)
      
      // Get total database size estimate
      const sizeStmt = this.db.prepare(`
        SELECT 
          COUNT(*) as total_records,
          MIN(timestamp) as oldest_record,
          MAX(timestamp) as newest_record
        FROM ping_logs
      `)
      
      const size = sizeStmt.get()
      
      return {
        recordsToPurge: result.count,
        totalRecords: size.total_records,
        oldestRecord: size.oldest_record,
        newestRecord: size.newest_record,
        retentionDays,
        purgePercentage: size.total_records > 0 
          ? Math.round((result.count / size.total_records) * 100) 
          : 0
      }
      
    } catch (error) {
      console.error('Error getting retention policy stats:', error)
      throw new Error('Failed to get retention statistics')
    }
  }

  /**
   * Get ping logs for export with optional filtering
   * @param {number} deviceId - Optional device ID filter
   * @param {string} startDate - Optional start date filter
   * @param {string} endDate - Optional end date filter
   * @returns {Array} Ping log records
   */
  getPingLogsForExport(deviceId = null, startDate = null, endDate = null) {
    let query = `
      SELECT pl.id, d.name as device_name, d.ip_address, d.device_type,
             pl.latency_ms, pl.success, pl.packet_loss, pl.timestamp
      FROM ping_logs pl
      JOIN devices d ON pl.device_id = d.id
      WHERE 1=1
    `

    const params = []

    if (deviceId) {
      query += ' AND pl.device_id = ?'
      params.push(deviceId)
    }

    if (startDate) {
      query += ' AND pl.timestamp >= ?'
      params.push(startDate)
    }

    if (endDate) {
      query += ' AND pl.timestamp <= ?'
      params.push(endDate)
    }

    query += ' ORDER BY pl.timestamp DESC LIMIT 10000'

    const stmt = this.db.prepare(query)
    return stmt.all(...params)
  }

  /**
   * Get outages for export with optional filtering
   * @param {number} deviceId - Optional device ID filter
   * @param {string} startDate - Optional start date filter
   * @param {string} endDate - Optional end date filter
   * @returns {Array} Outage records
   */
  getOutagesForExport(deviceId = null, startDate = null, endDate = null) {
    let query = `
      SELECT o.id, d.name as device_name, d.ip_address, d.device_type,
             o.start_time, o.end_time, o.duration_seconds, o.severity
      FROM outages o
      JOIN devices d ON o.device_id = d.id
      WHERE 1=1
    `

    const params = []

    if (deviceId) {
      query += ' AND o.device_id = ?'
      params.push(deviceId)
    }

    if (startDate) {
      query += ' AND o.start_time >= ?'
      params.push(startDate)
    }

    if (endDate) {
      query += ' AND o.start_time <= ?'
      params.push(endDate)
    }

    query += ' ORDER BY o.start_time DESC'

    const stmt = this.db.prepare(query)
    return stmt.all(...params)
  }

  /**
   * Export ping logs to CSV
   * @param {Array} pingLogs - Ping log records
   * @param {string} filename - Output filename
   */
  exportPingLogsToCSV(pingLogs, filename) {
    const csvContent = pingLogs.map(log => Object.values(log).join(',')).join('\n')
    const fs = require('fs')
    fs.writeFileSync(filename, csvContent)
  }

  /**
   * Export outages to CSV
   * @param {Array} outages - Outage records
   * @param {string} filename - Output filename
   */
  exportOutagesToCSV(outages, filename) {
    const csvContent = outages.map(outage => Object.values(outage).join(',')).join('\n')
    const fs = require('fs')
    fs.writeFileSync(filename, csvContent)
  }

  /**
   * Export ping logs to HTML
   * @param {Array} pingLogs - Ping log records
   * @param {string} filename - Output filename
   */
  exportPingLogsToHTML(pingLogs, filename) {
    const htmlContent = `
      <html>
        <body>
          <h1>Ping Logs</h1>
          <table>
            <tr>
              <th>ID</th>
              <th>Device Name</th>
              <th>IP Address</th>
              <th>Device Type</th>
              <th>Latency (ms)</th>
              <th>Success</th>
              <th>Packet Loss</th>
              <th>Timestamp</th>
            </tr>
            ${pingLogs.map(log => `
              <tr>
                <td>${log.id}</td>
                <td>${log.device_name}</td>
                <td>${log.ip_address}</td>
                <td>${log.device_type}</td>
                <td>${log.latency_ms}</td>
                <td>${log.success}</td>
                <td>${log.packet_loss}</td>
                <td>${log.timestamp}</td>
              </tr>
            `).join('')}
          </table>
        </body>
      </html>
    `
    const fs = require('fs')
    fs.writeFileSync(filename, htmlContent)
  }

  /**
   * Export outages to HTML
   * @param {Array} outages - Outage records
   * @param {string} filename - Output filename
   */
  exportOutagesToHTML(outages, filename) {
    const htmlContent = `
      <html>
        <body>
          <h1>Outages</h1>
          <table>
            <tr>
              <th>ID</th>
              <th>Device Name</th>
              <th>IP Address</th>
              <th>Device Type</th>
              <th>Start Time</th>
              <th>End Time</th>
              <th>Duration (seconds)</th>
              <th>Severity</th>
            </tr>
            ${outages.map(outage => `
              <tr>
                <td>${outage.id}</td>
                <td>${outage.device_name}</td>
                <td>${outage.ip_address}</td>
                <td>${outage.device_type}</td>
                <td>${outage.start_time}</td>
                <td>${outage.end_time}</td>
                <td>${outage.duration_seconds}</td>
                <td>${outage.severity}</td>
              </tr>
            `).join('')}
          </table>
        </body>
      </html>
    `
    const fs = require('fs')
    fs.writeFileSync(filename, htmlContent)
  }
}

// Export singleton getter
export const getDatabase = async () => {
  const db = DatabaseManager.getInstance()
  await db.initialise()
  return db
}

// For testing with in-memory database
export const createTestDatabase = async () => {
  const DatabaseClass = await getDatabaseClass()
  const db = new DatabaseClass(':memory:')
  db.pragma('foreign_keys = ON')
  
  // Create tables (matching production schema)
  db.exec(`
    CREATE TABLE devices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      ip_address TEXT NOT NULL,
      device_type TEXT CHECK(device_type IN ('server', 'router', 'printer', 'switch')),
      location TEXT,
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE UNIQUE INDEX idx_devices_ip_active ON devices(ip_address) WHERE is_active = 1;
    
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
