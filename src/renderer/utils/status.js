/**
 * Status utility functions for device monitoring.
 * Provides consistent latency status calculations across components.
 */

/**
 * Calculates status category based on latency thresholds.
 * Excellent < 10ms, Good 10-50ms, Fair 50-150ms, Poor > 150ms.
 *
 * @param {number|null} latencyMs - Latency in milliseconds
 * @param {boolean} isOnline - Whether device is responding (defaults to true)
 * @returns {string} Status category: 'excellent', 'good', 'fair', 'poor', 'offline', 'unknown'
 */
export const calculateStatusFromLatency = (latencyMs, isOnline = true) => {
  if (!isOnline) return 'offline'
  if (!latencyMs) return 'unknown'
  if (latencyMs < 10) return 'excellent'
  if (latencyMs < 50) return 'good'
  if (latencyMs < 150) return 'fair'
  return 'poor'
}

/**
 * Gets CSS colour class for a given status.
 *
 * @param {string} status - Status category
 * @returns {string} CSS class name for colour coding
 */
export const getStatusColourClass = (status) => {
  const colourMap = {
    excellent: 'latency-excellent',
    good: 'latency-good',
    fair: 'latency-fair',
    poor: 'latency-poor',
    offline: 'latency-poor',
    unknown: 'latency-unknown'
  }
  return colourMap[status] || 'latency-unknown'
}
