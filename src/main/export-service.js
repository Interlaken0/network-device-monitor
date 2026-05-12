/**
 * Export Service - Server-side data export with HTML sanitisation
 * 
 * Provides secure export functionality for network monitoring data.
 * Includes HTML sanitisation to prevent XSS in exported reports.
 * 
 * @see Security audit finding SEC-003: Add server-side HTML sanitisation for exports
 */

import { dialog } from 'electron'
import { getDatabase } from './database.js'

/**
 * Basic HTML sanitiser for defence in depth
 * Strips potentially dangerous HTML tags and attributes
 */
class BasicHtmlSanitiser {
  static dangerousTags = new Set([
    'script', 'iframe', 'object', 'embed', 'form', 'input', 'textarea',
    'button', 'select', 'option', 'link', 'meta', 'style', 'html', 'head', 'body'
  ])
  
  static dangerousAttributes = new Set([
    'onclick', 'onload', 'onerror', 'onmouseover', 'onmouseout', 'onfocus',
    'onblur', 'onchange', 'onsubmit', 'onreset', 'javascript:', 'vbscript:',
    'data:', 'src', 'href', 'action', 'method', 'enctype'
  ])
  
  /**
   * Sanitise HTML string by removing dangerous tags and attributes
   * @param {string} html - HTML string to sanitise
   * @returns {string} Sanitised HTML
   */
  static sanitise(html) {
    if (!html || typeof html !== 'string') {
      return ''
    }
    
    // Remove dangerous tags
    let sanitised = html
    for (const tag of this.dangerousTags) {
      const regex = new RegExp(`<\\s*${tag}\\b[^>]*>.*?<\\s*/\\s*${tag}\\s*>`, 'gis')
      sanitised = sanitised.replace(regex, '')
      
      // Also remove self-closing versions
      const selfClosingRegex = new RegExp(`<\\s*${tag}\\b[^>]*/?\\s*>`, 'gis')
      sanitised = sanitised.replace(selfClosingRegex, '')
    }
    
    // Remove dangerous attributes from remaining tags
    const attributeRegex = /\s+(\w+)=["'][^"']*["']/gi
    sanitised = sanitised.replace(attributeRegex, (match, attrName) => {
      if (this.dangerousAttributes.has(attrName.toLowerCase())) {
        return ''
      }
      return match
    })
    
    // Remove JavaScript: and vbscript: protocols
    const protocolRegex = /(javascript|vbscript):/gi
    sanitised = sanitised.replace(protocolRegex, '')
    
    // Remove data: URLs that could contain executable content
    const dataUrlRegex = /data:[^;]*;base64,[a-zA-Z0-9+/=]+/gi
    sanitised = sanitised.replace(dataUrlRegex, '[data-URL-removed]')
    
    return sanitised.trim()
  }
  
  /**
   * Escape HTML entities for safe display
   * @param {string} text - Text to escape
   * @returns {string} Escaped HTML
   */
  static escapeHtml(text) {
    if (!text || typeof text !== 'string') {
      return ''
    }
    
    const htmlEscapes = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;'
    }
    
    return text.replace(/[&<>"'/]/g, (match) => htmlEscapes[match])
  }
}

/**
 * Export service class
 */
class ExportService {
  constructor() {
    this.exportJobs = new Map()
  }
  
  /**
   * Generate CSV export with sanitised data
   * @param {Object} query - Query parameters for data selection
   * @param {Array} columns - Columns to include in export
   * @returns {Promise<string>} CSV content
   */
  async generateCSV(query = {}, columns = []) {
    try {
      const db = await getDatabase()
      
      // Get data based on query parameters
      let data = []
      if (query.type === 'ping_logs') {
        data = db.getPingLogsForExport(query.deviceId, query.startDate, query.endDate)
      } else if (query.type === 'devices') {
        data = db.getAllDevices()
      } else if (query.type === 'outages') {
        data = db.getOutagesForExport(query.deviceId, query.startDate, query.endDate)
      }
      
      // Sanitise all string fields
      const sanitisedData = data.map(row => {
        const sanitisedRow = {}
        for (const [key, value] of Object.entries(row)) {
          if (typeof value === 'string') {
            sanitisedRow[key] = BasicHtmlSanitiser.escapeHtml(value)
          } else {
            sanitisedRow[key] = value
          }
        }
        return sanitisedRow
      })
      
      // Generate CSV with proper escaping
      return this._generateCSVContent(sanitisedData, columns)
      
    } catch (error) {
      console.error('Error generating CSV export:', error)
      throw new Error('Failed to generate CSV export')
    }
  }
  
  /**
   * Generate HTML report with sanitised content
   * @param {Object} query - Query parameters for data selection
   * @param {Object} template - Report template configuration
   * @returns {Promise<string>} HTML content
   */
  async generateHTMLReport(query = {}, template = {}) {
    try {
      const db = await getDatabase()
      
      // Get data
      let data = {}
      if (query.type === 'summary') {
        data.devices = db.getAllDevices()
        data.stats = db.getStats()
        data.recentPings = db.getRecentPings(query.deviceId, query.limit || 100)
      }
      
      // Generate HTML template
      let html = this._generateHTMLTemplate(data, template)
      
      // Sanitise the HTML to remove any dangerous content
      html = BasicHtmlSanitiser.sanitise(html)
      
      return html
      
    } catch (error) {
      console.error('Error generating HTML report:', error)
      throw new Error('Failed to generate HTML report')
    }
  }
  
  /**
   * Show save dialog and write file
   * @param {string} content - File content
   * @param {string} defaultName - Default file name
   * @param {Array} filters - File type filters
   * @returns {Promise<Object>} Save result
   */
  async saveFile(content, defaultName = 'export', filters = []) {
    try {
      const result = await dialog.showSaveDialog({
        defaultPath: defaultName,
        filters: filters.length > 0 ? filters : [
          { name: 'CSV Files', extensions: ['csv'] },
          { name: 'HTML Files', extensions: ['html'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      })
      
      if (result.canceled) {
        return { success: false, reason: 'cancelled' }
      }
      
      // Write file using Node.js fs
      const fs = await import('fs')
      await fs.promises.writeFile(result.filePath, content, 'utf8')
      
      return { success: true, filePath: result.filePath }
      
    } catch (error) {
      console.error('Error saving file:', error)
      throw new Error('Failed to save file')
    }
  }
  
  /**
   * Generate CSV content from data array
   * @private
   */
  _generateCSVContent(data, columns) {
    if (!data || data.length === 0) {
      return 'No data available'
    }
    
    // Use provided columns or infer from first row
    const headers = columns.length > 0 ? columns : Object.keys(data[0])
    
    // Create CSV rows
    const csvRows = []
    
    // Header row
    csvRows.push(headers.map(header => this._escapeCSVField(header)).join(','))
    
    // Data rows
    for (const row of data) {
      const csvRow = headers.map(header => {
        const value = row[header] || ''
        return this._escapeCSVField(value)
      })
      csvRows.push(csvRow.join(','))
    }
    
    return csvRows.join('\n')
  }
  
  /**
   * Escape CSV field to handle commas and quotes
   * @private
   */
  _escapeCSVField(value) {
    if (value === null || value === undefined) {
      return ''
    }
    
    const stringValue = String(value)
    
    // If field contains comma, quote, or newline, wrap in quotes and escape internal quotes
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return '"' + stringValue.replace(/"/g, '""') + '"'
    }
    
    return stringValue
  }
  
  /**
   * Generate HTML template for reports
   * @private
   */
  _generateHTMLTemplate(data, template) {
    const timestamp = new Date().toLocaleString()
    const title = template.title || 'Network Monitor Report'
    const includeStats = template.includeStats !== false
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Network Monitor Report - ${timestamp}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .stat-card { border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
        .stat-value { font-size: 24px; font-weight: bold; color: #2c3e50; }
        .stat-label { color: #7f8c8d; margin-top: 5px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>${title}</h1>
        <p>Generated on: ${timestamp}</p>
    </div>
    
    ${includeStats ? `
    <div class="stats">
        <div class="stat-card">
            <div class="stat-value">${data.stats?.deviceCount || 0}</div>
            <div class="stat-label">Total Devices</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${data.stats?.pingCount || 0}</div>
            <div class="stat-label">Total Pings</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${data.stats?.outageCount || 0}</div>
            <div class="stat-label">Total Outages</div>
        </div>
    </div>
    ` : ''}
    
    <h2>Device List</h2>
    <table>
        <thead>
            <tr>
                <th>Name</th>
                <th>Network Address</th>
                <th>Type</th>
                <th>Location</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            ${(data.devices || []).map(device => `
                <tr>
                    <td>${BasicHtmlSanitiser.escapeHtml(device.name || '')}</td>
                    <td>${BasicHtmlSanitiser.escapeHtml(device.ip_address || '')}</td>
                    <td>${BasicHtmlSanitiser.escapeHtml(device.device_type || '')}</td>
                    <td>${BasicHtmlSanitiser.escapeHtml(device.location || '')}</td>
                    <td>${device.is_active ? 'Active' : 'Inactive'}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>
    
    <div class="footer">
        <p>Report generated by Network Monitor v0.2.0</p>
        <p>This report contains sanitised data for security purposes</p>
    </div>
</body>
</html>`
  }
}

// Export singleton instance
const exportService = new ExportService()

export { ExportService, BasicHtmlSanitiser }
export default exportService
