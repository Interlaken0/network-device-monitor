import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Theme store managing dark/light mode preference.
 * Persists user choice to localStorage with system preference fallback.
 *
 * @typedef {Object} ThemeState
 * @property {string} theme - Current theme ('light' or 'dark')
 * @property {boolean} isLoading - Theme loading state to prevent flash
 * @property {boolean} useSystemPreference - Whether to follow system theme
 * @property {Function} toggleTheme - Toggle between light and dark
 * @property {Function} setTheme - Set specific theme
 * @property {Function} setUseSystemPreference - Enable/disable system theme following
 * @property {Function} initialiseTheme - Initialise theme with system preference detection
 */

export const useThemeStore = create(
  persist(
    (set, get) => ({
      theme: 'light',
      isLoading: true,
      useSystemPreference: false,

      toggleTheme: () => {
        const newTheme = get().theme === 'light' ? 'dark' : 'light'
        set({ theme: newTheme, useSystemPreference: false })
        get().applyTheme(newTheme)
      },

      setTheme: (theme) => {
        if (theme === 'light' || theme === 'dark') {
          set({ theme, useSystemPreference: false })
          get().applyTheme(theme)
        }
      },

      setUseSystemPreference: (enabled) => {
        set({ useSystemPreference: enabled })
        if (enabled) {
          const systemTheme = get().getSystemTheme()
          set({ theme: systemTheme })
          get().applyTheme(systemTheme)
        }
      },

      getSystemTheme: () => {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
          return 'dark'
        }
        return 'light'
      },

      applyTheme: (theme) => {
        const root = document.documentElement
        root.setAttribute('data-theme', theme)
      },

      initialiseTheme: () => {
        const state = get()
        let theme = state.theme

        // If using system preference, detect it
        if (state.useSystemPreference) {
          theme = state.getSystemTheme()
          set({ theme })
        }

        // Apply theme immediately to prevent flash
        state.applyTheme(theme)

        // Set up system preference listener
        if (window.matchMedia) {
          const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
          const handleChange = (e) => {
            if (get().useSystemPreference) {
              const newTheme = e.matches ? 'dark' : 'light'
              set({ theme: newTheme })
              get().applyTheme(newTheme)
            }
          }
          mediaQuery.addEventListener('change', handleChange)
        }

        // Mark loading complete
        set({ isLoading: false })
      }
    }),
    {
      name: 'network-monitor-theme',
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.initialiseTheme()
        }
      }
    }
  )
)

// Selector for theme
export const selectTheme = (state) => state.theme

// Selector for system preference setting
export const selectUseSystemPreference = (state) => state.useSystemPreference

// Selector for toggle function
export const selectToggleTheme = (state) => state.toggleTheme
