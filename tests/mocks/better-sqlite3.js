/**
 * Mock better-sqlite3 Module
 *
 * Provides mock implementations of better-sqlite3 for testing
 */

import { jest } from '@jest/globals'

const mockStatements = new Map()

class MockDatabase {
  constructor(path) {
    this.path = path
    this.statements = new Map()
  }

  pragma() {
    return {}
  }

  // eslint-disable-next-line no-unused-vars
  exec(sql) {
    return { changes: 0 }
  }

  prepare(sql) {
    if (!mockStatements.has(sql)) {
      mockStatements.set(sql, {
        run: jest.fn(() => ({ lastInsertRowid: 1, changes: 1 })),
        get: jest.fn(() => null),
        all: jest.fn(() => [])
      })
    }
    return mockStatements.get(sql)
  }

  close() {
    return true
  }

  transaction(fn) {
    return fn
  }
}

export default MockDatabase
export { MockDatabase }
