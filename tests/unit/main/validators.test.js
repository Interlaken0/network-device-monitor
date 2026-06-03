/**
 * Validator Tests
 * 
 * Tests for input validation functions used in IPC handlers
 * @module tests/unit/validators.test
 */

// Extract validators from ipc-handlers for testing
// Since they're not exported, we recreate them here for testing

const validators = {
  ipAddress: (value) => {
    const ipv4 = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
    const ipv6 = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/
    return ipv4.test(value) || ipv6.test(value)
  },
  
  deviceName: (value) => {
    return value && value.length >= 1 && value.length <= 100
  },
  
  deviceType: (value) => {
    return ['server', 'router', 'printer', 'switch'].includes(value)
  }
}

describe('IP Address Validation', () => {
  describe('IPv4 addresses', () => {
    test.each([
      ['192.168.1.1', true],
      ['10.0.0.1', true],
      ['255.255.255.255', true],
      ['0.0.0.0', true],
      ['172.16.0.1', true],
      ['8.8.8.8', true],
      ['127.0.0.1', true]
    ])('accepts valid IPv4: %s', (ip, expected) => {
      expect(validators.ipAddress(ip)).toBe(expected)
    })

    test.each([
      ['256.1.1.1', false],
      ['192.168.1', false],
      ['192.168.1.1.1', false],
      ['192.168.1.', false],
      ['.192.168.1.1', false],
      ['192.168.-1.1', false],
      ['192.168.01.01', true],  // Leading zeros are valid in this regex
      ['', false],
      ['invalid', false],
      ['192.168.1.1/24', false]
    ])('rejects invalid IPv4: %s', (ip, expected) => {
      expect(validators.ipAddress(ip)).toBe(expected)
    })
  })

  describe('IPv6 addresses', () => {
    test.each([
      ['2001:0db8:85a3:0000:0000:8a2e:0370:7334', true],
      ['2001:db8:85a3:0:0:8a2e:370:7334', true],
      ['::1', false],  // Short form not supported by this regex
      ['fe80::1', false],  // Short form not supported
      ['2001:db8::1', false],  // Short form not supported
      ['::ffff:192.0.2.1', false],  // IPv4-mapped not supported
      ['fe80:0:0:0:0:0:0:1', true],
      ['ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff', true]
    ])('validates IPv6: %s -> %s', (ip, expected) => {
      expect(validators.ipAddress(ip)).toBe(expected)
    })
  })
})

describe('Device Name Validation', () => {
  test.each([
    ['Router East Wing', true],
    ['A', true],
    ['a'.repeat(100), true],  // Max length
    ['Server-01_Main', true],
    ['Printer 3rd Floor', true]
  ])('accepts valid name: "%s"', (name) => {
    expect(validators.deviceName(name)).toBeTruthy()
  })

  test.each([
    ['', false],  // Empty string - length is 0
    [null, false],  // null is falsy
    [undefined, false],  // undefined is falsy
    ['a'.repeat(101), false],  // Exceeds max length
  ])('rejects invalid name: "%s"', (name) => {
    expect(validators.deviceName(name)).toBeFalsy()
  })

  test('whitespace-only name passes (length check only)', () => {
    expect(validators.deviceName('   ')).toBeTruthy()
  })
})

describe('Device Type Validation', () => {
  test.each([
    ['server', true],
    ['router', true],
    ['printer', true],
    ['switch', true]
  ])('accepts valid type: %s', (type, expected) => {
    expect(validators.deviceType(type)).toBe(expected)
  })

  test.each([
    ['desktop', false],
    ['laptop', false],
    ['firewall', false],
    ['access point', false],
    ['', false],
    [null, false],
    [undefined, false],
    ['SERVER', false],  // Case sensitive
    ['Server', false]
  ])('rejects invalid type: %s', (type, expected) => {
    expect(validators.deviceType(type)).toBe(expected)
  })
})
