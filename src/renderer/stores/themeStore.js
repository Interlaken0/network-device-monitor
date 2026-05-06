import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Theme store managing dark/light mode preference.
 * Persists user choice to localStorage.
 *
 * @typedef {Object} ThemeState
 * @property {string} theme - Current theme ('light' or 'dark')
 * @property {Function} toggleTheme - Toggle between light and dark
 * @property {Function} setTheme - Set specific theme
 */

export const useThemeStore = create(
  persist(
    (set, get) => ({
      theme: 'light',

      toggleTheme: () => {
        const newTheme = get().theme === 'light' ? 'dark' : 'light'
        set({ theme: newTheme })
        get().applyTheme(newTheme)
      },

      setTheme: (theme) => {
        if (theme === 'light' || theme === 'dark') {
          set({ theme })
          get().applyTheme(theme)
        }
      },

      applyTheme: (theme) => {
        const root = document.documentElement
        root.setAttribute('data-theme', theme)
      },

      initialiseTheme: () => {
        const currentTheme = get().theme
        get().applyTheme(currentTheme)
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

// Selector for toggle function
export const selectToggleTheme = (state) => state.toggleTheme
