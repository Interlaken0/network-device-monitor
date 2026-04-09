// Custom Jest reporter that outputs a text summary (ESM format)
import fs from 'fs';

export default class TestSummaryReporter {
  constructor(globalConfig, options) {
    this._globalConfig = globalConfig;
    this._options = options;
    this.outputFile = options.outputFile || 'test-summary.txt';
  }

  onRunComplete(contexts, results) {
    const { testResults, numTotalTests, numPassedTests, numFailedTests, numPendingTests, startTime, endTime } = results;

    // Calculate duration with multiple fallbacks
    let durationMs = 0;
    
    // Try global timing first
    if (startTime && endTime && !isNaN(startTime) && !isNaN(endTime)) {
      durationMs = endTime - startTime;
    } 
    // Fallback: sum up individual test suite durations
    else if (testResults && testResults.length > 0) {
      durationMs = testResults.reduce((sum, suite) => {
        return sum + (suite.perfStats?.end - suite.perfStats?.start || 0);
      }, 0);
    }
    
    const duration = durationMs > 0 ? (durationMs / 1000).toFixed(2) + 's' : 'N/A';
    const now = new Date();
    const date = now.toLocaleString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short'
    });

    let output = `Test Summary - ${date}\n`;
    output += '='.repeat(50) + '\n\n';
    output += `Total: ${numTotalTests} | Passed: ${numPassedTests} | Failed: ${numFailedTests} | Skipped: ${numPendingTests}\n`;
    output += `Duration: ${duration}\n\n`;

    testResults.forEach(suite => {
      const relPath = suite.testFilePath.replace(process.cwd(), '');
      output += `\n${relPath}\n`;
      output += '-'.repeat(40) + '\n';

      suite.testResults.forEach(test => {
        const status = test.status === 'passed' ? '✓' : test.status === 'failed' ? '✗' : '○';
        output += `  ${status} ${test.title}\n`;
      });

      if (suite.failureMessage) {
        output += `  ERROR: ${suite.failureMessage.split('\n')[0]}\n`;
      }
    });

    output += `\n${'='.repeat(50)}\n`;
    output += numFailedTests > 0 ? 'RESULT: FAILURE\n' : 'RESULT: SUCCESS\n';

    fs.writeFileSync(this.outputFile, output);
    console.log(`\nTest summary written to ${this.outputFile}`);
  }
}
