/**
 * Chart theme utilities for Recharts components.
 * Provides consistent grid, axis, and tooltip colours across light/dark modes.
 */

/**
 * Gets theme-aware chart colours based on current theme.
 *
 * @param {string} theme - Current theme ('light' or 'dark')
 * @returns {Object} Chart colour configuration with grid, axis, and tooltip colours
 */
export const getChartColours = (theme) => {
  if (theme === 'dark') {
    return {
      grid: '#3a3a5c',
      axis: '#8b8ba7',
      tooltip: {
        background: '#252545',
        border: '#4a4a6a',
        text: '#eaeaea'
      }
    }
  }
  return {
    grid: '#e9ecef',
    axis: '#6c757d',
    tooltip: {
      background: '#ffffff',
      border: '#e0e0e0',
      text: '#2c3e50'
    }
  }
}
