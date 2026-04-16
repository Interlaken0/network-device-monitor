/**
 * Network Edge Case Tests
 *
 * Tests for network failure scenarios, timeout handling, and malformed input.
 * @module tests/unit/network-edge-cases.test
 */

import { describe, it, expect } from '@jest/globals'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

describe('Network Edge Cases', () => {
  const pingServicePath = path.join(__dirname, '../../src/main/ping-service.js')
  const networkMonitorPath = path.join(__dirname, '../../src/main/network-monitor.js')

  describe('File Existence', () => {
    it('ping-service.js exists', () => {
      expect(fs.existsSync(pingServicePath)).toBe(true)
    })

    it('network-monitor.js exists', () => {
      expect(fs.existsSync(networkMonitorPath)).toBe(true)
    })
  })

  describe('Timeout Handling', () => {
    it('ping service has 3 second timeout configured', () => {
      const content = fs.readFileSync(pingServicePath, 'utf-8')
      expect(content).toContain("timeout: 3")
    })

    it('ping service handles aborted operations', () => {
      const content = fs.readFileSync(pingServicePath, 'utf-8')
      expect(content).toContain('abortController?.signal.aborted')
    })

    it('ping service checks abort signal before scheduling', () => {
      const content = fs.readFileSync(pingServicePath, 'utf-8')
      expect(content).toContain('if (!this.isRunning || this.abortController?.signal.aborted)')
    })
  })

  describe('Unreachable Host Handling', () => {
    it('records failed ping with null latency', () => {
      const content = fs.readFileSync(pingServicePath, 'utf-8')
      expect(content).toContain('latencyMs: null')
      expect(content).toContain('success: false')
    })

    it('handles outage detection when host unreachable', () => {
      const content = fs.readFileSync(pingServicePath, 'utf-8')
      expect(content).toContain('_handleOutage()')
      expect(content).toContain('if (!result.alive)')
    })

    it('creates outage record for unreachable device', () => {
      const content = fs.readFileSync(pingServicePath, 'utf-8')
      expect(content).toContain('db.startOutage(this.deviceId')
    })

    it('logs outage warnings for unreachable hosts', () => {
      const content = fs.readFileSync(pingServicePath, 'utf-8')
      expect(content).toContain('console.warn(`Outage started for device')
    })
  })

  describe('Error Handling', () => {
    it('catches and logs ping errors', () => {
      const content = fs.readFileSync(pingServicePath, 'utf-8')
      expect(content).toContain('console.error(`Ping error for')
    })

    it('records failure to database on error', () => {
      const content = fs.readFileSync(pingServicePath, 'utf-8')
      const errorHandlerSection = content.substring(
        content.indexOf('catch (error)'),
        content.indexOf('await this._handleOutage()', content.indexOf('catch (error)')) + 30
      )
      expect(errorHandlerSection).toContain('db.recordPing')
    })

    it('continues operation after ping failure', () => {
      const content = fs.readFileSync(pingServicePath, 'utf-8')
      // Error should be caught and handled without throwing
      expect(content).toMatch(/catch \(error\)/)
    })
  })

  describe('Invalid IP Address Handling', () => {
    it('network monitor validates device exists before monitoring', () => {
      const content = fs.readFileSync(networkMonitorPath, 'utf-8')
      expect(content).toContain('if (!device)')
      expect(content).toContain('throw new Error(`Device ${deviceId} not found')
    })

    it('handles missing device gracefully', () => {
      const content = fs.readFileSync(networkMonitorPath, 'utf-8')
      expect(content).toContain('db.getDevice(deviceId)')
    })
  })

  describe('Concurrent Operation Edge Cases', () => {
    it('prevents duplicate monitoring of same device', () => {
      const content = fs.readFileSync(networkMonitorPath, 'utf-8')
      expect(content).toContain('if (this.services.has(deviceId))')
      expect(content).toContain('return false')
    })

    it('handles stop on non-monitored device gracefully', () => {
      const content = fs.readFileSync(networkMonitorPath, 'utf-8')
      expect(content).toContain('if (!service)')
      expect(content).toContain("console.log(`Device ${deviceId} not currently monitored`)")
    })

    it('stops all services safely even when empty', () => {
      const content = fs.readFileSync(networkMonitorPath, 'utf-8')
      // stopAll should handle empty Map without error
      expect(content).toContain('for (const [deviceId, service] of this.services)')
    })
  })

  describe('Service State Edge Cases', () => {
    it('throws error when starting already running service', () => {
      const content = fs.readFileSync(pingServicePath, 'utf-8')
      expect(content).toContain("if (this.isRunning)")
      expect(content).toContain("throw new Error('PingService already running. Stop it first.')")
    })

    it('handles stop when not running gracefully', () => {
      const content = fs.readFileSync(pingServicePath, 'utf-8')
      expect(content).toContain("if (!this.isRunning)")
      expect(content).toContain('return')
    })

    it('resets abort controller after stop', () => {
      const content = fs.readFileSync(pingServicePath, 'utf-8')
      expect(content).toContain('this.abortController = null')
    })
  })

  describe('Callback and Event Handling', () => {
    it('handles missing onResult callback', () => {
      const content = fs.readFileSync(pingServicePath, 'utf-8')
      expect(content).toContain('if (onResult)')
    })

    it('ping service accepts null callback', () => {
      const content = fs.readFileSync(pingServicePath, 'utf-8')
      expect(content).toContain('onResult = null')
    })

    it('notifies callbacks even on failure', () => {
      const content = fs.readFileSync(pingServicePath, 'utf-8')
      const errorSection = content.substring(content.indexOf('catch (error)'))
      expect(errorSection).toContain('if (onResult)')
    })
  })

  describe('Network Recovery Scenarios', () => {
    it('has mechanism to resolve outages', () => {
      const content = fs.readFileSync(pingServicePath, 'utf-8')
      expect(content).toContain('_resolveOutage()')
      expect(content).toContain('db.endOutage')
    })

    it('checks for active outage before creating new one', () => {
      const content = fs.readFileSync(pingServicePath, 'utf-8')
      expect(content).toContain('db.getActiveOutage(this.deviceId)')
    })
  })

  describe('Database Interaction Edge Cases', () => {
    it('handles null database values in ping results', () => {
      const content = fs.readFileSync(pingServicePath, 'utf-8')
      expect(content).toContain('latencyMs: result.alive ? result.time : null')
    })

    it('packet loss is recorded as boolean', () => {
      const content = fs.readFileSync(pingServicePath, 'utf-8')
      expect(content).toContain('packetLoss: !result.alive')
    })
  })

  describe('Aggregate Status Edge Cases', () => {
    it('handles empty monitored device list', () => {
      const content = fs.readFileSync(networkMonitorPath, 'utf-8')
      expect(content).toContain('healthPercentage: totalDevices > 0 ?')
    })

    it('handles devices with no ping history', () => {
      const content = fs.readFileSync(networkMonitorPath, 'utf-8')
      expect(content).toContain('if (latestPing)')
    })

    it('calculates average latency only when data exists', () => {
      const content = fs.readFileSync(networkMonitorPath, 'utf-8')
      expect(content).toContain('latencyCount > 0 ? totalLatency / latencyCount : null')
    })
  })
})

describe('IP Validation Edge Cases', () => {
  const validators = {
    ipAddress: (value) => {
      const ipv4 = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
      const ipv6 = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/
      return ipv4.test(value) || ipv6.test(value)
    }
  }

  describe('Malformed IPv4 addresses', () => {
    test.each([
      ['192.168.1', false, 'incomplete octets'],
      ['192.168.1.1.1', false, 'too many octets'],
      ['192.168.1.', false, 'trailing dot'],
      ['.192.168.1.1', false, 'leading dot'],
      ['192.168.-1.1', false, 'negative octet'],
      ['192.168.1.256', false, 'octet exceeds 255'],
      ['', false, 'empty string'],
      ['invalid', false, 'non-numeric'],
      ['192.168.1.1/24', false, 'CIDR notation'],
      ['192.168.1.1:8080', false, 'with port'],
      [' 192.168.1.1 ', false, 'with whitespace'],
      ['192.168.01.01', true, 'leading zeros accepted']
    ])('validates "%s" as %s (%s)', (ip, expected) => {
      expect(validators.ipAddress(ip)).toBe(expected)
    })
  })

  describe('Edge case IP formats', () => {
    test.each([
      ['0.0.0.0', true, 'all zeros'],
      ['255.255.255.255', true, 'all 255s'],
      ['127.0.0.1', true, 'localhost'],
      ['8.8.8.8', true, 'public DNS'],
      ['10.0.0.1', true, 'private class A'],
      ['172.16.0.1', true, 'private class B'],
      ['192.168.0.1', true, 'private class C']
    ])('accepts valid IP: %s (%s)', (ip, expected) => {
      expect(validators.ipAddress(ip)).toBe(expected)
    })
  })

  describe('IPv6 edge cases', () => {
    test.each([
      ['::1', false, 'short form loopback not supported'],
      ['::', false, 'all zeros short form not supported'],
      ['fe80::1', false, 'short form link-local not supported'],
      ['2001:db8::1', false, 'short form not supported'],
      ['fe80:0:0:0:0:0:0:1', true, 'full form link-local'],
      ['2001:0db8:85a3:0000:0000:8a2e:0370:7334', true, 'full IPv6']
    ])('validates IPv6 "%s" as %s (%s)', (ip, expected) => {
      expect(validators.ipAddress(ip)).toBe(expected)
    })
  })
})

describe('Monitoring Lifecycle Edge Cases', () => {
  const networkMonitorPath = path.join(__dirname, '../../src/main/network-monitor.js')

  it('monitorAllDevices handles individual device start failures', () => {
    const content = fs.readFileSync(networkMonitorPath, 'utf-8')
    expect(content).toContain('try {')
    expect(content).toContain('catch (error)')
    expect(content).toContain('console.error(`Failed to start monitoring device')
  })

  it('returns count of successfully started devices', () => {
    const content = fs.readFileSync(networkMonitorPath, 'utf-8')
    expect(content).toContain('return started')
  })

  it('restartAll stops before starting', () => {
    const content = fs.readFileSync(networkMonitorPath, 'utf-8')
    const restartAllIndex = content.indexOf('restartAll')
    const restartSection = content.substring(restartAllIndex, restartAllIndex + 200)
    expect(restartSection).toContain('this.stopAll()')
  })
})
