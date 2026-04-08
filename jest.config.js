/**
 * Jest Configuration
 * 
 * @see https://jestjs.io/docs/configuration
 */

export default {
  // Test environment
  testEnvironment: 'node',
  
  // File extensions to look for
  moduleFileExtensions: ['js', 'mjs'],
  
  // Test match patterns
  testMatch: [
    '**/tests/unit/**/*.test.js',
    '**/tests/integration/**/*.test.js'
  ],
  
  // Module name mapping for aliases and mocks
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^electron$': '<rootDir>/tests/mocks/electron.js'
  },
  
  // Native ESM support
  transform: {},
  
  // Setup files
  setupFilesAfterEnv: [],
  
  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/index.js',
    '!**/node_modules/**'
  ],
  
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/out/',
    '/dist/'
  ],
  
  // Allow better-sqlite3 to be transformed
  transformIgnorePatterns: [
    'node_modules/(?!(better-sqlite3)/)'
  ],
  
  // Verbose output
  verbose: true,

  // Custom reporter for test summary.txt
  reporters: [
    'default',
    ['<rootDir>/scripts/test-summary-reporter.js', { outputFile: 'test-summary.txt' }]
  ]
}
