/**
 * Mock Ping Module
 *
 * Provides mock implementations of the ping library for testing
 */

import { jest } from '@jest/globals'

export const promise = {
  probe: jest.fn()
}

export default {
  promise
}
