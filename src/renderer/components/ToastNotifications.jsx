import React, { useState, useEffect, useCallback } from 'react'
import PropTypes from 'prop-types'
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

/**
 * Toast notification store for managing real-time outage notifications.
 * Provides global state for notification queue and display logic.
 */
const useToastStore = create(
  devtools(
    (set, get) => ({
      // Notification queue
      notifications: [],
      
      /**
       * Add a new notification to the queue
       * @param {Object} notification - Notification object
       * @param {string} notification.id - Unique identifier
       * @param {string} notification.type - 'outage', 'resolved', 'warning', 'info'
       * @param {string} notification.title - Notification title
       * @param {string} notification.message - Notification message
       * @param {number} notification.duration - Auto-dismiss duration in ms (0 for no auto-dismiss)
       * @param {Object} notification.device - Related device information
       */
      addNotification: (notification) => {
        const id = notification.id || Date.now().toString()
        const newNotification = {
          id,
          type: notification.type || 'info',
          title: notification.title || 'Notification',
          message: notification.message || '',
          duration: notification.duration || 5000,
          device: notification.device || null,
          timestamp: new Date().toISOString(),
          isRead: false
        }
        
        set(
          (state) => ({
            notifications: [...state.notifications, newNotification].slice(-10) // Keep last 10
          }),
          false,
          'addNotification'
        )
        
        // Auto-dismiss if duration is set
        if (newNotification.duration > 0) {
          setTimeout(() => {
            get().removeNotification(id)
          }, newNotification.duration)
        }
      },
      
      /**
       * Remove a notification by ID
       * @param {string} id - Notification ID
       */
      removeNotification: (id) =>
        set(
          (state) => ({
            notifications: state.notifications.filter((n) => n.id !== id)
          }),
          false,
          'removeNotification'
        ),
      
      /**
       * Mark notification as read
       * @param {string} id - Notification ID
       */
      markAsRead: (id) =>
        set(
          (state) => ({
            notifications: state.notifications.map((n) =>
              n.id === id ? { ...n, isRead: true } : n
            )
          }),
          false,
          'markAsRead'
        ),
      
      /**
       * Clear all notifications
       */
      clearAll: () => set({ notifications: [] }, false, 'clearAll'),
      
      /**
       * Get unread notification count
       * @returns {number} Number of unread notifications
       */
      getUnreadCount: () => {
        const { notifications } = get()
        return notifications.filter((n) => !n.isRead).length
      }
    }),
    { name: 'ToastStore' }
  )
)

/**
 * Toast notification configuration by type.
 * @constant {Object}
 */
const NOTIFICATION_CONFIGS = {
  outage: {
    className: 'toast-outage',
    icon: '⚠️',
    colour: '#dc3545',
    duration: 0 // No auto-dismiss for outages
  },
  resolved: {
    className: 'toast-resolved',
    icon: '✅',
    colour: '#28a745',
    duration: 4000
  },
  warning: {
    className: 'toast-warning',
    icon: '⚡',
    colour: '#ffc107',
    duration: 6000
  },
  info: {
    className: 'toast-info',
    icon: 'ℹ️',
    colour: '#17a2b8',
    duration: 3000
  }
}

/**
 * Individual toast notification component.
 *
 * @param {Object} props
 * @param {Object} props.notification - Notification object
 * @param {Function} props.onRemove - Remove callback
 * @param {Function} props.onRead - Mark as read callback
 */
function ToastNotification({ notification, onRemove, onRead }) {
  const config = NOTIFICATION_CONFIGS[notification.type] || NOTIFICATION_CONFIGS.info
  
  const handleClick = useCallback(() => {
    if (!notification.isRead) {
      onRead(notification.id)
    }
  }, [notification.id, notification.isRead, onRead])
  
  const handleDismiss = useCallback((e) => {
    e.stopPropagation()
    onRemove(notification.id)
  }, [notification.id, onRemove])
  
  return (
    <article
      className={`toast-notification ${config.className} ${notification.isRead ? 'read' : 'unread'}`}
      role="alert"
      aria-live={notification.type === 'outage' ? 'assertive' : 'polite'}
      aria-label={`${notification.title}: ${notification.message}`}
      onClick={handleClick}
      style={{ borderLeftColor: config.colour }}
    >
      <div className="toast-content">
        <div className="toast-header">
          <span className="toast-icon" aria-hidden="true">
            {config.icon}
          </span>
          <div className="toast-title-area">
            <h4 className="toast-title">{notification.title}</h4>
            {notification.device && (
              <span className="toast-device">
                {notification.device.name}
              </span>
            )}
          </div>
          <button
            type="button"
            className="toast-dismiss"
            onClick={handleDismiss}
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>
        <p className="toast-message">{notification.message}</p>
        <div className="toast-footer">
          <span className="toast-time">
            {new Date(notification.timestamp).toLocaleTimeString('en-GB', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
          {!notification.isRead && (
            <span className="toast-unread-indicator" aria-label="Unread">
              ●
            </span>
          )}
        </div>
      </div>
    </article>
  )
}

ToastNotification.propTypes = {
  notification: PropTypes.shape({
    id: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired,
    duration: PropTypes.number,
    device: PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired
    }),
    timestamp: PropTypes.string.isRequired,
    isRead: PropTypes.bool.isRequired
  }).isRequired,
  onRemove: PropTypes.func.isRequired,
  onRead: PropTypes.func.isRequired
}

/**
 * ToastNotifications container component.
 * Displays real-time outage and system notifications.
 *
 * @component
 */
function ToastNotifications() {
  const [isVisible, setIsVisible] = useState(false)
  const notifications = useToastStore((state) => state.notifications)
  const removeNotification = useToastStore((state) => state.removeNotification)
  const markAsRead = useToastStore((state) => state.markAsRead)
  const getUnreadCount = useToastStore((state) => state.getUnreadCount)
  
  const unreadCount = getUnreadCount()
  
  // Auto-show when new notification arrives
  useEffect(() => {
    if (unreadCount > 0 && !isVisible) {
      setIsVisible(true)
    }
  }, [unreadCount, isVisible])
  
  const handleToggle = useCallback(() => {
    setIsVisible(!isVisible)
  }, [isVisible])
  
  const handleDismissAll = useCallback(() => {
    useToastStore.getState().clearAll()
  }, [])
  
  if (notifications.length === 0) {
    return null
  }
  
  return (
    <div className={`toast-notifications ${isVisible ? 'visible' : 'hidden'}`}>
      {/* Toggle Button */}
      <button
        type="button"
        className="toast-toggle"
        onClick={handleToggle}
        aria-label={`Show ${unreadCount} unread notifications`}
        aria-expanded={isVisible}
      >
        <span className="toast-toggle-icon">🔔</span>
        {unreadCount > 0 && (
          <span className="toast-badge" aria-label={`${unreadCount} unread`}>
            {unreadCount}
          </span>
        )}
      </button>
      
      {/* Notifications Panel */}
      {isVisible && (
        <div className="toast-panel" role="region" aria-label="Notifications">
          <div className="toast-panel-header">
            <h3>Notifications</h3>
            <div className="toast-panel-controls">
              {unreadCount > 0 && (
                <button
                  type="button"
                  className="toast-mark-all-read"
                  onClick={() => {
                    notifications.forEach((n) => !n.isRead && markAsRead(n.id))
                  }}
                >
                  Mark All Read
                </button>
              )}
              <button
                type="button"
                className="toast-clear-all"
                onClick={handleDismissAll}
              >
                Clear All
              </button>
            </div>
          </div>
          
          <div className="toast-list">
            {notifications.map((notification) => (
              <ToastNotification
                key={notification.id}
                notification={notification}
                onRemove={removeNotification}
                onRead={markAsRead}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Hook for adding outage notifications.
 * Convenience hook for common outage notification patterns.
 *
 * @returns {Function} Function to add outage notifications
 */
export const useOutageNotifications = () => {
  const addNotification = useToastStore((state) => state.addNotification)
  
  return useCallback((type, device, details = {}) => {
    const configs = {
      start: {
        title: 'Outage Started',
        message: `Device "${device.name}" is experiencing an outage`,
        type: 'outage'
      },
      end: {
        title: 'Outage Resolved',
        message: `Device "${device.name}" is back online`,
        type: 'resolved'
      },
      warning: {
        title: 'High Latency Warning',
        message: `Device "${device.name}" has high latency: ${details.latency}ms`,
        type: 'warning'
      },
      critical: {
        title: 'Critical Latency',
        message: `Device "${device.name}" has critical latency: ${details.latency}ms`,
        type: 'warning'
      }
    }
    
    const config = configs[type]
    if (config) {
      addNotification({
        ...config,
        device,
        duration: type === 'start' ? 0 : config.duration // No auto-dismiss for outage starts
      })
    }
  }, [addNotification])
}

export default ToastNotifications
