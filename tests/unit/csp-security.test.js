/**
 * CSP Security Tests
 *
 * Tests for Content Security Policy configuration and security headers.
 * @module tests/unit/csp-security.test
 */

import { describe, it, expect } from '@jest/globals'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

describe('CSP Security Configuration', () => {
  const indexPath = path.join(__dirname, '../../src/main/index.js')

  describe('File Existence', () => {
    it('index.js exists', () => {
      expect(fs.existsSync(indexPath)).toBe(true)
    })
  })

  describe('CSP Function Definition', () => {
    it('defines configureCSP function', () => {
      const content = fs.readFileSync(indexPath, 'utf-8')
      expect(content).toContain('function configureCSP()')
    })

    it('uses session.defaultSession.webRequest.onHeadersReceived', () => {
      const content = fs.readFileSync(indexPath, 'utf-8')
      expect(content).toContain('session.defaultSession.webRequest.onHeadersReceived')
    })

    it('callback modifies response headers', () => {
      const content = fs.readFileSync(indexPath, 'utf-8')
      expect(content).toMatch(/callback\(\{\s*responseHeaders:/s)
    })
  })

  describe('CSP Policy Directives', () => {
    it('includes Content-Security-Policy header', () => {
      const content = fs.readFileSync(indexPath, 'utf-8')
      expect(content).toContain("'Content-Security-Policy'")
    })

    it('restricts default-src to self', () => {
      const content = fs.readFileSync(indexPath, 'utf-8')
      expect(content).toContain("default-src 'self'")
    })

    it('restricts script-src appropriately', () => {
      const content = fs.readFileSync(indexPath, 'utf-8')
      expect(content).toMatch(/script-src\s+'self'\s+'unsafe-inline'/)
    })

    it('restricts style-src appropriately', () => {
      const content = fs.readFileSync(indexPath, 'utf-8')
      expect(content).toMatch(/style-src\s+'self'\s+'unsafe-inline'/)
    })

    it('restricts img-src to safe sources', () => {
      const content = fs.readFileSync(indexPath, 'utf-8')
      expect(content).toMatch(/img-src\s+'self'\s+data:\s+https:/)
    })

    it('blocks object-src entirely', () => {
      const content = fs.readFileSync(indexPath, 'utf-8')
      expect(content).toContain("object-src 'none'")
    })

    it('blocks frame-src entirely', () => {
      const content = fs.readFileSync(indexPath, 'utf-8')
      expect(content).toContain("frame-src 'none'")
    })

    it('restricts connect-src to self', () => {
      const content = fs.readFileSync(indexPath, 'utf-8')
      expect(content).toContain("connect-src 'self'")
    })

    it('restricts font-src to self', () => {
      const content = fs.readFileSync(indexPath, 'utf-8')
      expect(content).toContain("font-src 'self'")
    })

    it('restricts base-uri to self', () => {
      const content = fs.readFileSync(indexPath, 'utf-8')
      expect(content).toContain("base-uri 'self'")
    })

    it('restricts form-action to self', () => {
      const content = fs.readFileSync(indexPath, 'utf-8')
      expect(content).toContain("form-action 'self'")
    })
  })

  describe('CSP Activation', () => {
    it('calls configureCSP in app.whenReady', () => {
      const content = fs.readFileSync(indexPath, 'utf-8')
      const whenReadySection = content.substring(
        content.indexOf('app.whenReady()'),
        content.indexOf('createWindow()', content.indexOf('app.whenReady()'))
      )
      expect(whenReadySection).toContain('configureCSP()')
    })

    it('has security comment before CSP call', () => {
      const content = fs.readFileSync(indexPath, 'utf-8')
      const cspCallIndex = content.indexOf('configureCSP()')
      const sectionBefore = content.substring(cspCallIndex - 200, cspCallIndex)
      expect(sectionBefore).toMatch(/Security.*CSP|Content Security Policy/i)
    })
  })

  describe('Security Imports', () => {
    it('imports session from electron', () => {
      const content = fs.readFileSync(indexPath, 'utf-8')
      expect(content).toMatch(/import.*session.*from 'electron'/)
    })

    it('session is used in configureCSP', () => {
      const content = fs.readFileSync(indexPath, 'utf-8')
      const cspFunction = content.substring(
        content.indexOf('function configureCSP()'),
        content.indexOf('}', content.indexOf('function configureCSP()')) + 1
      )
      expect(cspFunction).toContain('session.')
    })
  })

  describe('Response Headers Handling', () => {
    it('spreads existing response headers', () => {
      const content = fs.readFileSync(indexPath, 'utf-8')
      expect(content).toContain('...details.responseHeaders')
    })

    it('preserves existing headers when adding CSP', () => {
      const content = fs.readFileSync(indexPath, 'utf-8')
      const handlerSection = content.substring(
        content.indexOf('onHeadersReceived'),
        content.indexOf('})', content.indexOf('onHeadersReceived')) + 2
      )
      expect(handlerSection).toMatch(/responseHeaders:\s*\{\s*\.\.\.details\.responseHeaders/)
    })
  })
})
