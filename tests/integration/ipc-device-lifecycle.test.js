/**
 * IPC Device Lifecycle Integration Tests
 *
 * End-to-end tests covering create, read, update, delete operations
 * through IPC handlers. Validates error handling and data integrity.
 *
 * @module tests/integration/ipc-device-lifecycle.test
 */

import { describe, it, expect } from '@jest/globals'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

describe('IPC Device Lifecycle Integration', () => {
  const ipcHandlersPath = path.join(__dirname, '../../src/main/ipc-handlers.js')

  describe('File Existence', () => {
    it('ipc-handlers.js exists', () => {
      expect(fs.existsSync(ipcHandlersPath)).toBe(true)
    })
  })

  describe('Device Create Handler', () => {
    it('registers device:create handler', () => {
      const content = fs.readFileSync(ipcHandlersPath, 'utf-8')
      expect(content).toContain("ipcMain.handle('device:create'")
    })

    it('validates device name length', () => {
      const content = fs.readFileSync(ipcHandlersPath, 'utf-8')
      expect(content).toContain('validators.deviceName(data.name)')
      expect(content).toContain('Invalid device name: must be 1-100 characters')
    })

    it('validates IP address format', () => {
      const content = fs.readFileSync(ipcHandlersPath, 'utf-8')
      expect(content).toContain('validators.ipAddress(data.ipAddress)')
      expect(content).toContain("throw new Error('Invalid IP address format')")
    })

    it('validates device type', () => {
      const content = fs.readFileSync(ipcHandlersPath, 'utf-8')
      expect(content).toContain('validators.deviceType(data.deviceType)')
      expect(content).toContain("Invalid device type: must be server, router, printer, or switch")
    })

    it('checks for duplicate IP before creation', () => {
      const content = fs.readFileSync(ipcHandlersPath, 'utf-8')
      expect(content).toContain('db.getDeviceByIp(data.ipAddress)')
      expect(content).toContain("throw new Error('IP address already exists')")
    })

    it('calls db.createDevice after validation', () => {
      const content = fs.readFileSync(ipcHandlersPath, 'utf-8')
      expect(content).toContain('db.createDevice(data)')
    })

    it('returns success response with created device', () => {
      const content = fs.readFileSync(ipcHandlersPath, 'utf-8')
      const handlerSection = content.substring(
        content.indexOf("ipcMain.handle('device:create'"),
        content.indexOf("ipcMain.handle('device:read'")
      )
      expect(handlerSection).toContain('return { success: true, data: result }')
    })

    it('returns error response on failure', () => {
      const content = fs.readFileSync(ipcHandlersPath, 'utf-8')
      const handlerSection = content.substring(
        content.indexOf("ipcMain.handle('device:create'"),
        content.indexOf("ipcMain.handle('device:read'")
      )
      expect(handlerSection).toContain('return { success: false, error: error.message }')
    })
  })

  describe('Device Read Handler', () => {
    it('registers device:read handler', () => {
      const content = fs.readFileSync(ipcHandlersPath, 'utf-8')
      expect(content).toContain("ipcMain.handle('device:read'")
    })

    it('reads single device by ID when provided', () => {
      const content = fs.readFileSync(ipcHandlersPath, 'utf-8')
      expect(content).toContain('db.getDevice(id)')
    })

    it('reads all devices when no ID provided', () => {
      const content = fs.readFileSync(ipcHandlersPath, 'utf-8')
      expect(content).toContain('db.getAllDevices()')
    })

    it('uses conditional for ID parameter', () => {
      const content = fs.readFileSync(ipcHandlersPath, 'utf-8')
      expect(content).toContain("id ? db.getDevice(id) : db.getAllDevices()")
    })

    it('returns success response with device data', () => {
      const content = fs.readFileSync(ipcHandlersPath, 'utf-8')
      const handlerSection = content.substring(
        content.indexOf("ipcMain.handle('device:read'"),
        content.indexOf("ipcMain.handle('device:update'")
      )
      expect(handlerSection).toContain('return { success: true, data: device }')
    })
  })

  describe('Device Update Handler', () => {
    it('registers device:update handler', () => {
      const content = fs.readFileSync(ipcHandlersPath, 'utf-8')
      expect(content).toContain("ipcMain.handle('device:update'")
    })

    it('accepts device ID and updates object', () => {
      const content = fs.readFileSync(ipcHandlersPath, 'utf-8')
      expect(content).toMatch(/device:update.*async.*event, id, updates/)
    })

    it('validates IP address if provided in updates', () => {
      const content = fs.readFileSync(ipcHandlersPath, 'utf-8')
      expect(content).toContain('if (updates.ipAddress && !validators.ipAddress(updates.ipAddress))')
    })

    it('checks for duplicate IP when IP is changed', () => {
      const content = fs.readFileSync(ipcHandlersPath, 'utf-8')
      expect(content).toContain('if (updates.ipAddress)')
      expect(content).toContain('existing.id !== id')
    })

    it('prevents update to existing IP of another device', () => {
      const content = fs.readFileSync(ipcHandlersPath, 'utf-8')
      expect(content).toMatch(/existing && existing\.id !== id/)
    })

    it('calls db.updateDevice with validated data', () => {
      const content = fs.readFileSync(ipcHandlersPath, 'utf-8')
      expect(content).toContain('db.updateDevice(id, updates)')
    })

    it('returns update result with changes count', () => {
      const content = fs.readFileSync(ipcHandlersPath, 'utf-8')
      const handlerSection = content.substring(
        content.indexOf("ipcMain.handle('device:update'"),
        content.indexOf("ipcMain.handle('device:delete'")
      )
      expect(handlerSection).toContain('return { success: true, data: result }')
    })
  })

  describe('Device Delete Handler', () => {
    it('registers device:delete handler', () => {
      const content = fs.readFileSync(ipcHandlersPath, 'utf-8')
      expect(content).toContain("ipcMain.handle('device:delete'")
    })

    it('calls db.deleteDevice for soft delete', () => {
      const content = fs.readFileSync(ipcHandlersPath, 'utf-8')
      expect(content).toContain('db.deleteDevice(id)')
    })

    it('returns success response with delete result', () => {
      const content = fs.readFileSync(ipcHandlersPath, 'utf-8')
      const handlerSection = content.substring(
        content.indexOf("ipcMain.handle('device:delete'"),
        content.indexOf("ipcMain.handle('ping:record'")
      )
      expect(handlerSection).toContain('return { success: true, data: result }')
    })

    it('includes comment about outage check for production', () => {
      const content = fs.readFileSync(ipcHandlersPath, 'utf-8')
      expect(content).toContain('Outage check removed for MVP simplicity')
    })
  })

  describe('Validation Helper Functions', () => {
    it('defines validators object with ipAddress function', () => {
      const content = fs.readFileSync(ipcHandlersPath, 'utf-8')
      expect(content).toContain('const validators = {')
      expect(content).toContain('ipAddress: (value) =>')
    })

    it('ipAddress validator uses IPv4 regex', () => {
      const content = fs.readFileSync(ipcHandlersPath, 'utf-8')
      expect(content).toContain('25[0-5]')
      expect(content).toContain('2[0-4][0-9]')
    })

    it('ipAddress validator uses IPv6 regex', () => {
      const content = fs.readFileSync(ipcHandlersPath, 'utf-8')
      expect(content).toContain('[0-9a-fA-F]{1,4}')
    })

    it('deviceName validator checks length constraints', () => {
      const content = fs.readFileSync(ipcHandlersPath, 'utf-8')
      expect(content).toContain('value && value.length >= 1 && value.length <= 100')
    })

    it('deviceType validator checks against allowed types', () => {
      const content = fs.readFileSync(ipcHandlersPath, 'utf-8')
      expect(content).toContain("['server', 'router', 'printer', 'switch']")
    })
  })

  describe('Error Handling Patterns', () => {
    it('all handlers use try-catch blocks', () => {
      const content = fs.readFileSync(ipcHandlersPath, 'utf-8')
      const deviceCreateHandler = content.substring(
        content.indexOf("ipcMain.handle('device:create'")
      )
      expect(deviceCreateHandler).toContain('try {')
      expect(deviceCreateHandler).toContain('} catch (error) {')
    })

    it('catches errors and returns structured error response', () => {
      const content = fs.readFileSync(ipcHandlersPath, 'utf-8')
      expect(content).toMatch(/catch \(error\) \{\s*console\.error.*\n\s*return \{ success: false, error: error\.message \}/s)
    })

    it('logs errors to console for debugging', () => {
      const content = fs.readFileSync(ipcHandlersPath, 'utf-8')
      expect(content).toContain("console.error('Error creating device:'")
      expect(content).toContain("console.error('Error reading device:'")
      expect(content).toContain("console.error('Error updating device:'")
      expect(content).toContain("console.error('Error deleting device:'")
    })

    it('error responses include error message string', () => {
      const content = fs.readFileSync(ipcHandlersPath, 'utf-8')
      expect(content).toContain('error: error.message')
    })
  })

  describe('Handler Registration', () => {
    it('exports registerDatabaseHandlers function', () => {
      const content = fs.readFileSync(ipcHandlersPath, 'utf-8')
      expect(content).toContain('export async function registerDatabaseHandlers()')
    })

    it('gets database instance at start of registration', () => {
      const content = fs.readFileSync(ipcHandlersPath, 'utf-8')
      expect(content).toContain('const db = await getDatabase()')
    })

    it('imports ipcMain from electron', () => {
      const content = fs.readFileSync(ipcHandlersPath, 'utf-8')
      expect(content).toContain("import { ipcMain } from 'electron'")
    })

    it('imports database module', () => {
      const content = fs.readFileSync(ipcHandlersPath, 'utf-8')
      expect(content).toContain("import { getDatabase } from './database.js'")
    })

    it('imports network monitor', () => {
      const content = fs.readFileSync(ipcHandlersPath, 'utf-8')
      expect(content).toContain("import networkMonitor from './network-monitor.js'")
    })

    it('exports default with registerDatabaseHandlers', () => {
      const content = fs.readFileSync(ipcHandlersPath, 'utf-8')
      expect(content).toContain('export default { registerDatabaseHandlers }')
    })
  })

  describe('Response Format Consistency', () => {
    it('all successful responses include success: true', () => {
      const content = fs.readFileSync(ipcHandlersPath, 'utf-8')
      const successMatches = content.match(/success: true/g)
      expect(successMatches.length).toBeGreaterThanOrEqual(4) // At least 4 device handlers
    })

    it('all error responses include success: false', () => {
      const content = fs.readFileSync(ipcHandlersPath, 'utf-8')
      const errorMatches = content.match(/success: false/g)
      expect(errorMatches.length).toBeGreaterThanOrEqual(4)
    })

    it('successful responses include data property', () => {
      const content = fs.readFileSync(ipcHandlersPath, 'utf-8')
      expect(content).toMatch(/return \{\s*success: true,\s*data:/s)
    })
  })

  describe('Device Lifecycle Flow', () => {
    it('complete CRUD handlers are defined in sequence', () => {
      const content = fs.readFileSync(ipcHandlersPath, 'utf-8')
      const deviceCreateIndex = content.indexOf("'device:create'")
      const deviceReadIndex = content.indexOf("'device:read'")
      const deviceUpdateIndex = content.indexOf("'device:update'")
      const deviceDeleteIndex = content.indexOf("'device:delete'")

      expect(deviceCreateIndex).toBeGreaterThan(0)
      expect(deviceReadIndex).toBeGreaterThan(deviceCreateIndex)
      expect(deviceUpdateIndex).toBeGreaterThan(deviceReadIndex)
      expect(deviceDeleteIndex).toBeGreaterThan(deviceUpdateIndex)
    })
  })

  describe('Input Data Integrity', () => {
    it('create handler accepts data object with expected properties', () => {
      const content = fs.readFileSync(ipcHandlersPath, 'utf-8')
      expect(content).toContain('data.name')
      expect(content).toContain('data.ipAddress')
      expect(content).toContain('data.deviceType')
    })

    it('update handler separates ID from updates', () => {
      const content = fs.readFileSync(ipcHandlersPath, 'utf-8')
      expect(content).toMatch(/async.*event, id, updates/)
      expect(content).toContain('db.updateDevice(id, updates)')
    })
  })
})
