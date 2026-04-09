import { describe, it, expect } from '@jest/globals'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

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

  it('has startMonitoring method', () => {
    const content = fs.readFileSync(filePath, 'utf-8')
    expect(content).toContain('startMonitoring(')
  })

  it('has stopMonitoring method', () => {
    const content = fs.readFileSync(filePath, 'utf-8')
    expect(content).toContain('stopMonitoring(')
  })

  it('has monitorAllDevices method', () => {
    const content = fs.readFileSync(filePath, 'utf-8')
    expect(content).toContain('monitorAllDevices(')
  })

  it('has stopAll method', () => {
    const content = fs.readFileSync(filePath, 'utf-8')
    expect(content).toContain('stopAll()')
  })

  it('has getAllStatuses method', () => {
    const content = fs.readFileSync(filePath, 'utf-8')
    expect(content).toContain('getAllStatuses()')
  })

  it('imports PingService', () => {
    const content = fs.readFileSync(filePath, 'utf-8')
    expect(content).toContain("import PingService from './ping-service.js'")
  })

  it('imports database', () => {
    const content = fs.readFileSync(filePath, 'utf-8')
    expect(content).toContain("import { getDatabase }")
  })

  it('manages multiple services with Map', () => {
    const content = fs.readFileSync(filePath, 'utf-8')
    expect(content).toContain('Map()')
    expect(content).toContain('this.services')
  })
})

describe('NetworkMonitor Singleton', () => {
  const filePath = path.join(__dirname, '../../src/main/network-monitor.js')

  it('exports singleton instance', () => {
    const content = fs.readFileSync(filePath, 'utf-8')
    expect(content).toContain('new NetworkMonitor()')
  })
})
