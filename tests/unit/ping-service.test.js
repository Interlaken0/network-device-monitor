import { describe, it, expect } from '@jest/globals'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

describe('PingService', () => {
  const filePath = path.join(__dirname, '../../src/main/ping-service.js')

  it('file exists', () => {
    expect(fs.existsSync(filePath)).toBe(true)
  })

  it('exports PingService class', () => {
    const content = fs.readFileSync(filePath, 'utf-8')
    expect(content).toContain('class PingService')
    expect(content).toContain('export default PingService')
  })

  it('has required methods', () => {
    const content = fs.readFileSync(filePath, 'utf-8')
    expect(content).toContain('async start(')
    expect(content).toContain('stop()')
    expect(content).toContain('getStatus()')
  })

  it('imports ping library', () => {
    const content = fs.readFileSync(filePath, 'utf-8')
    expect(content).toContain("import ping from 'ping'")
  })

  it('imports database module', () => {
    const content = fs.readFileSync(filePath, 'utf-8')
    expect(content).toContain("import { getDatabase }")
  })
})

describe('NetworkMonitor', () => {
  const filePath = path.join(__dirname, '../../src/main/network-monitor.js')

  it('file exists', () => {
    expect(fs.existsSync(filePath)).toBe(true)
  })

  it('exports NetworkMonitor class', () => {
    const content = fs.readFileSync(filePath, 'utf-8')
    expect(content).toContain('class NetworkMonitor')
    expect(content).toContain('export default networkMonitor')
  })

  it('has device monitoring methods', () => {
    const content = fs.readFileSync(filePath, 'utf-8')
    expect(content).toContain('startMonitoring(')
    expect(content).toContain('stopMonitoring(')
    expect(content).toContain('monitorAllDevices(')
  })

  it('imports PingService', () => {
    const content = fs.readFileSync(filePath, 'utf-8')
    expect(content).toContain("import PingService from './ping-service.js'")
  })
})
