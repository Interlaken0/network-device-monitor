/**
 * Theme store tests
 *
 * @module tests/unit/renderer/theme-store.test
 */

import { describe, it, expect, jest } from '@jest/globals'

// Mock zustand persist middleware to avoid localStorage dependency
jest.mock('zustand/middleware', () => ({
  persist: (config) => config
}))

// Mock window.matchMedia for theme detection
Object.defineProperty(global, 'window', {
  value: {
    matchMedia: jest.fn().mockImplementation((query) => ({
      matches: query.includes('dark'),
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn()
    }))
  },
  writable: true
})

// Mock document.documentElement
Object.defineProperty(global, 'document', {
  value: {
    documentElement: {
      setAttribute: jest.fn(),
      getAttribute: jest.fn()
    }
  },
  writable: true
})

import { useThemeStore } from '../../../src/renderer/stores/themeStore.js'

describe('themeStore', () => {
  beforeEach(() => {
    useThemeStore.setState({ theme: 'light', isLoading: false, useSystemPreference: false })
  })

  it('has light theme by default', () => {
    const state = useThemeStore.getState()
    expect(state.theme).toBe('light')
  })

  it('toggles theme from light to dark', () => {
    useThemeStore.getState().toggleTheme()
    expect(useThemeStore.getState().theme).toBe('dark')
  })

  it('toggles theme from dark to light', () => {
    useThemeStore.setState({ theme: 'dark' })
    useThemeStore.getState().toggleTheme()
    expect(useThemeStore.getState().theme).toBe('light')
  })

  it('sets theme directly', () => {
    useThemeStore.getState().setTheme('dark')
    expect(useThemeStore.getState().theme).toBe('dark')
  })

  it('ignores invalid theme values', () => {
    useThemeStore.getState().setTheme('purple')
    expect(useThemeStore.getState().theme).toBe('light')
  })

  it('applies theme to document root', () => {
    useThemeStore.getState().setTheme('dark')
    expect(document.documentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'dark')
  })

  it('detects system dark preference', () => {
    useThemeStore.getState().setUseSystemPreference(true)
    expect(useThemeStore.getState().theme).toBe('dark')
  })

  it('initialiseTheme sets loading to false', () => {
    useThemeStore.setState({ isLoading: true })
    useThemeStore.getState().initialiseTheme()
    expect(useThemeStore.getState().isLoading).toBe(false)
  })
})
