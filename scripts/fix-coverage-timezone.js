/**
 * Fix Coverage Report Timezone
 *
 * Injects JavaScript to display timestamp in viewer's local timezone
 * Run after generating coverage reports
 */

import fs from 'fs'
import path from 'path'

const coveragePath = path.join(process.cwd(), 'coverage', 'index.html')

if (!fs.existsSync(coveragePath)) {
  console.log('Coverage report not found, skipping timezone fix')
  process.exit(0)
}

let html = fs.readFileSync(coveragePath, 'utf-8')

// Find the timestamp pattern: "2026-04-27T22:14:22.445Z"
const utcPattern = /(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}:\d{2})(\.\d+)?Z/
const match = html.match(utcPattern)

if (match) {
  const utcTimestamp = match[0]

  // Wrap timestamp in a span with UTC data attribute
  // Handle the actual HTML structure with the istanbul link
  const originalPattern = /at (\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z)/
  const newText = `at <span id="coverage-timestamp" data-utc="${utcTimestamp}">${utcTimestamp}</span>`

  html = html.replace(originalPattern, newText)

  // Add script to convert to local time on page load
  const timezoneScript = `
<script>
  document.addEventListener('DOMContentLoaded', function() {
    const timestampEl = document.getElementById('coverage-timestamp');
    if (timestampEl) {
      const utcString = timestampEl.getAttribute('data-utc');
      const date = new Date(utcString);

      // Get timezone abbreviation (e.g., BST, EST, JST)
      const tzName = new Intl.DateTimeFormat('en-GB', {
        timeZoneName: 'short'
      }).formatToParts(date).find(part => part.type === 'timeZoneName')?.value || '';

      // Format to viewer's locale: "27/04/2026, 23:25:00 BST"
      const formatted = date.toLocaleString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }) + ' ' + tzName;

      timestampEl.textContent = formatted;
    }
  });
</script>
</body>`

  html = html.replace('</body>', timezoneScript)

  fs.writeFileSync(coveragePath, html)
  console.log('Coverage report updated with local timezone display')
} else {
  console.log('UTC timestamp pattern not found in coverage report')
}
